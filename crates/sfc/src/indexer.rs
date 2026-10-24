//! Append-only SQLite search index. RocksDB remains authoritative for chain state.
use crate::{
    node::Node,
    types::{hex_hash, Block},
};
use anyhow::{ensure, Result};
use rayon::prelude::*;
use rusqlite::{params, Connection, OpenFlags};
use serde::Deserialize;
use serde_json::{json, Value};
use std::{
    fs::File,
    io::{BufReader, Seek, SeekFrom},
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread::{self, JoinHandle},
    time::Duration,
};

pub struct Indexer {
    store: Arc<crate::storage::Store>,
    stop: Arc<AtomicBool>,
    thread: Option<JoinHandle<()>>,
}
// Bound catch-up memory. A single large block is never split:
// rows, counters, and the height cursor commit in the same SQLite transaction.
const INDEX_BATCH_BLOCKS: usize = 16;
const INDEX_BATCH_BYTES: usize = 8 * 1024 * 1024;

// Keep observational wall-clock profiling outside deterministic execution code.
// The duration only enters indexer diagnostics, never block/state commitments.
pub(crate) fn measure_commit(
    enabled: bool,
    commit: impl FnOnce() -> Result<()>,
) -> Result<Duration> {
    let start = enabled.then(std::time::Instant::now);
    commit()?;
    Ok(start.map_or(Duration::ZERO, |start| start.elapsed()))
}

fn open_writer(path: &Path) -> Result<Connection> {
    let mut db = Connection::open(path)?;
    db.busy_timeout(Duration::from_secs(2))?;
    crate::schema::check_sqlite(&db)?;
    // Keep dirty index pages resident across a bounded catch-up batch, and
    // amortize checkpoint fsyncs. NORMAL durability below remains unchanged.
    // At 4 KiB/page the checkpoint trigger is 256 MiB, not a hard WAL size cap.
    db.execute_batch(
        "PRAGMA journal_mode=WAL;
         PRAGMA synchronous=FULL;
         PRAGMA wal_autocheckpoint=65536;
         PRAGMA cache_size=-65536;",
    )?;
    crate::schema::migrate_sqlite(&mut db)?;
    db.execute_batch("PRAGMA synchronous=NORMAL;")?;
    Ok(db)
}

fn meta(db: &Connection, key: &str) -> Result<i64> {
    Ok(db.query_row("SELECT value FROM meta WHERE key=?1", [key], |r| r.get(0))?)
}

struct PreparedTransaction {
    hash: String,
    sender: String,
    recipient: Option<String>,
    raw: Vec<u8>,
    receipt: bytes::Bytes,
}
struct PreparedBlock {
    height: u64,
    hash: String,
    header: bytes::Bytes,
    transactions: Vec<PreparedTransaction>,
}
fn prepare_block(block: &Block) -> Result<PreparedBlock> {
    let message = block.read()?;
    let root = message.get_root::<crate::storage_capnp::block::Reader>()?;
    let mut transactions = Vec::with_capacity(block.transaction_count());
    for (raw, receipt) in root.get_transactions()?.iter().zip(root.get_receipts()?) {
        transactions.push(PreparedTransaction {
            hash: format!("0x{}", hex::encode(receipt.get_transaction_hash()?)),
            sender: receipt.get_sender()?.to_str()?.to_owned(),
            recipient: if receipt.get_has_recipient() {
                Some(receipt.get_recipient()?.to_str()?.to_owned())
            } else {
                None
            },
            raw: raw?.to_vec(),
            receipt: crate::binary::receipt_bytes(receipt)?,
        });
    }
    Ok(PreparedBlock {
        height: block.height(),
        hash: hex_hash(&block.hash()),
        header: crate::binary::indexed_header_bytes(block)?,
        transactions,
    })
}
fn index_block(db: &Connection, block: &PreparedBlock) -> Result<()> {
    db.prepare_cached(
        "INSERT INTO blocks(height,hash,record,transaction_count) VALUES (?1,?2,?3,?4)",
    )?
    .execute(params![
        block.height,
        block.hash,
        block.header.as_ref(),
        block.transactions.len() as u64
    ])?;
    let mut statement =
        db.prepare_cached("INSERT INTO transactions VALUES (?1,?2,?3,?4,?5,?6,?7)")?;
    for (position, row) in block.transactions.iter().enumerate() {
        statement.execute(params![
            row.hash,
            block.height,
            position as u64,
            row.sender,
            row.recipient,
            row.raw,
            row.receipt.as_ref()
        ])?;
    }
    Ok(())
}

fn step(
    db: &mut Connection,
    store: &crate::storage::Store,
    data: &Path,
    preparation: &rayon::ThreadPool,
    mut metrics: Option<&mut WriteMetrics>,
) -> Result<bool> {
    let next = (meta(db, "height")? + 1) as u64;
    // Snapshot reads and validation never hold the execution mutex. A concurrent
    // prune cannot remove records from this batch or change its earliest height.
    let (earliest, blocks) = store.index_batch(next, INDEX_BATCH_BLOCKS, INDEX_BATCH_BYTES)?;
    let offset = meta(db, "log_offset")? as u64;
    let mut logs = Vec::new();
    let mut end = offset;
    if let Ok(file) = File::open(data.join("logs/node.capnp")) {
        let mut reader = BufReader::new(file);
        reader.seek(SeekFrom::Start(offset))?;
        for _ in 0..1000 {
            let bytes = match crate::codec::read_record(&mut reader) {
                Ok(Some(bytes)) => bytes,
                Ok(None) => break,
                // The writer may have published only part of its next frame.
                // Keep the cursor at the last complete record and retry later.
                Err(error)
                    if error
                        .downcast_ref::<std::io::Error>()
                        .is_some_and(|e| e.kind() == std::io::ErrorKind::UnexpectedEof) =>
                {
                    break
                }
                Err(error) => return Err(error),
            };
            let record: Value = crate::codec::from_slice(&bytes)?;
            logs.push(record);
            end = reader.stream_position()?;
        }
    }
    let changed = !blocks.is_empty() || !logs.is_empty();
    if !changed {
        return Ok(false);
    }
    // Bounded by the snapshot batch; prepare before opening the SQLite write
    // transaction. The dedicated pool never runs SQL or shares a Connection.
    let prepare_start = std::time::Instant::now();
    let prepared: Vec<PreparedBlock> =
        preparation.install(|| blocks.par_iter().map(prepare_block).collect::<Result<_>>())?;
    if let Some(m) = metrics.as_deref_mut() {
        m.prepare_us += prepare_start.elapsed().as_micros();
    }
    let insert_start = std::time::Instant::now();
    let write_rows = |connection: &Connection| -> Result<()> {
        if earliest > next && !blocks.is_empty() {
            connection.execute(
                "UPDATE meta SET value=value+?1 WHERE key='skipped_blocks'",
                [earliest - next],
            )?;
        }
        for block in &prepared {
            index_block(connection, block)?;
        }
        // Publish one cursor/count update per batch, atomically with all inserted rows.
        if let Some(last) = blocks.last() {
            connection.execute(
                "UPDATE meta SET value=?1 WHERE key='height'",
                [last.height()],
            )?;
            let count: usize = blocks.iter().map(Block::transaction_count).sum();
            connection.execute(
                "UPDATE meta SET value=value+?1 WHERE key='transactions'",
                [count as u64],
            )?;
        }
        for record in &logs {
            connection.execute(
                "INSERT INTO logs(timestamp_ms,level,event,message,record) VALUES (?1,?2,?3,?4,?5)",
                params![
                    record["timestamp_ms"].as_u64(),
                    record["level"].as_str(),
                    record["event"].as_str(),
                    format!("{:?}", record["fields"]),
                    crate::codec::to_vec(record)?
                ],
            )?;
        }
        connection.execute("UPDATE meta SET value=?1 WHERE key='log_offset'", [end])?;
        connection.execute(
            "UPDATE meta SET value=value+?1 WHERE key='logs'",
            [logs.len() as u64],
        )?;
        Ok(())
    };
    let (insert_us, commit_us) = if db.is_autocommit() {
        let tx = db.transaction()?;
        write_rows(&tx)?;
        let insert_us = insert_start.elapsed().as_micros();
        let commit_start = std::time::Instant::now();
        tx.commit()?;
        (insert_us, commit_start.elapsed().as_micros())
    } else {
        // Direct mode owns a bounded outer transaction. Its error path rolls
        // back that complete batch, so per-block savepoints only add I/O.
        write_rows(db)?;
        (insert_start.elapsed().as_micros(), 0)
    };
    if let Some(m) = metrics {
        m.insert_us += insert_us;
        m.commit_us += commit_us;
        m.max_commit_us = m.max_commit_us.max(commit_us);
        m.batches += 1;
        m.blocks += blocks.len() as u64;
        m.input_bytes += blocks
            .iter()
            .map(|b| b.as_bytes().len() as u64)
            .sum::<u64>();
        m.transactions += blocks
            .iter()
            .map(|b| b.transaction_count() as u64)
            .sum::<u64>();
    }
    Ok(true)
}

#[derive(Default, serde::Serialize)]
struct WriteMetrics {
    batches: u64,
    blocks: u64,
    transactions: u64,
    input_bytes: u64,
    commits: u64,
    prepare_us: u128,
    insert_us: u128,
    commit_us: u128,
    max_commit_us: u128,
    rocksdb_commit_us: u128,
    errors: u64,
}

/// Diagnostic/direct mode: owned by Node, with no block-job queue or SQLite thread.
/// A failed SQLite write does not undo an already durable chain commit; its cursor
/// retries on the next call and index-error.log exposes the failure.
pub struct DirectWriter {
    db: Connection,
    data: PathBuf,
    preparation: rayon::ThreadPool,
    metrics: WriteMetrics,
    batch_blocks: usize,
    pending_blocks: u64,
    pending_bytes: u64,
    pending_since: std::time::Instant,
}
impl DirectWriter {
    pub fn open(data: PathBuf, store: &crate::storage::Store, batch_blocks: usize) -> Result<Self> {
        ensure!(
            (1..=256).contains(&batch_blocks),
            "SQLite batch blocks must be 1..=256"
        );
        let mut writer = Self {
            db: open_writer(&data.join("index.sqlite"))?,
            data,
            preparation: rayon::ThreadPoolBuilder::new()
                .num_threads(2)
                .thread_name(|i| format!("sfc-sqlite-prep-{i}"))
                .build()?,
            metrics: WriteMetrics::default(),
            batch_blocks,
            pending_blocks: 0,
            pending_bytes: 0,
            pending_since: std::time::Instant::now(),
        };
        while step(
            &mut writer.db,
            store,
            &writer.data,
            &writer.preparation,
            None,
        )? {}
        Ok(writer)
    }
    pub(crate) fn record(&mut self, store: &crate::storage::Store, rocksdb: std::time::Duration) {
        self.metrics.rocksdb_commit_us += rocksdb.as_micros();
        let result = (|| -> Result<()> {
            if self.db.is_autocommit() {
                self.db.execute_batch("BEGIN IMMEDIATE")?;
                self.pending_since = std::time::Instant::now();
            }
            let before_blocks = self.metrics.blocks;
            let before_bytes = self.metrics.input_bytes;
            step(
                &mut self.db,
                store,
                &self.data,
                &self.preparation,
                Some(&mut self.metrics),
            )?;
            self.pending_blocks += self.metrics.blocks - before_blocks;
            self.pending_bytes += self.metrics.input_bytes - before_bytes;
            if self.pending_blocks >= self.batch_blocks as u64
                || self.pending_bytes >= INDEX_BATCH_BYTES as u64
                || self.pending_since.elapsed() >= Duration::from_millis(100)
            {
                self.flush()?;
            }
            Ok(())
        })();
        match result {
            Ok(()) => {
                let _ = std::fs::remove_file(self.data.join("index-error.log"));
            }
            Err(error) => {
                // Roll back the complete open batch; the durable cursor resumes it.
                let _ = self.db.execute_batch("ROLLBACK");
                self.pending_blocks = 0;
                self.pending_bytes = 0;
                self.metrics.errors += 1;
                let _ = std::fs::write(self.data.join("index-error.log"), format!("{error:#}\n"));
            }
        }
        if self.metrics.batches.is_multiple_of(100) {
            self.save_metrics();
        }
    }
    pub(crate) fn flush(&mut self) -> Result<()> {
        if !self.db.is_autocommit() {
            let started = std::time::Instant::now();
            self.db.execute_batch("COMMIT")?;
            let elapsed = started.elapsed().as_micros();
            self.metrics.commit_us += elapsed;
            self.metrics.max_commit_us = self.metrics.max_commit_us.max(elapsed);
            self.metrics.commits += 1;
            self.pending_blocks = 0;
            self.pending_bytes = 0;
        }
        Ok(())
    }
    fn save_metrics(&self) {
        if let Ok(bytes) = serde_json::to_vec(&self.metrics) {
            let temporary = self.data.join("sqlite-write-profile.json.tmp");
            if std::fs::write(&temporary, bytes).is_ok() {
                let _ = std::fs::rename(temporary, self.data.join("sqlite-write-profile.json"));
            }
        }
    }
}
impl Drop for DirectWriter {
    fn drop(&mut self) {
        if let Err(error) = self.flush() {
            self.metrics.errors += 1;
            let _ = std::fs::write(self.data.join("index-error.log"), format!("{error:#}\n"));
        }
        self.save_metrics();
        let _ = self.db.execute_batch("PRAGMA wal_checkpoint(PASSIVE)");
    }
}

impl Indexer {
    pub fn start(node: Arc<Mutex<Node>>, data: PathBuf) -> Result<Self> {
        let store = {
            let node = node
                .lock()
                .map_err(|_| anyhow::anyhow!("node unavailable"))?;
            node.store.clone()
        };
        let mut db = open_writer(&data.join("index.sqlite"))?;
        // Keep catch-up work off the shared execution/verification Rayon pool.
        let preparation = rayon::ThreadPoolBuilder::new()
            .num_threads(2)
            .thread_name(|i| format!("sfc-sqlite-prep-{i}"))
            .build()?;
        let worker_store = store.clone();
        let stop = Arc::new(AtomicBool::new(false));
        let stopping = stop.clone();
        let thread = thread::Builder::new()
            .name("sfc-sqlite-index".into())
            .spawn(move || {
                let store = worker_store;
                while !stopping.load(Ordering::Relaxed) {
                    match step(&mut db, &store, &data, &preparation, None) {
                        Ok(true) => continue,
                        Ok(false) => (),
                        Err(error) => {
                            // Separate health file avoids feeding an index failure back into its own log queue.
                            let _ = std::fs::write(
                                data.join("index-error.log"),
                                format!("{error:#}\n"),
                            );
                            thread::sleep(Duration::from_secs(1));
                            continue;
                        }
                    }
                    let _ = std::fs::remove_file(data.join("index-error.log"));
                    if store.wait_for_index().is_err() {
                        break;
                    }
                }
                // Bounded final pass; any remaining backlog resumes from durable cursors next startup.
                let _ = step(&mut db, &store, &data, &preparation, None);
                let _ = db.execute_batch("PRAGMA wal_checkpoint(PASSIVE)");
            })?;
        Ok(Self {
            store,
            stop,
            thread: Some(thread),
        })
    }
}

impl Drop for Indexer {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Relaxed);
        self.store.notify_indexer();
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
    }
}

#[derive(Default, Deserialize)]
pub struct Query {
    #[serde(default)]
    pub kind: String,
    #[serde(default)]
    pub q: String,
    pub limit: Option<u32>,
    pub before: Option<u64>,
    pub before_height: Option<u64>,
    pub before_position: Option<u32>,
}

fn transaction_fields(raw: &str) -> Result<Value> {
    let bytes = hex::decode(raw.strip_prefix("0x").unwrap_or(raw))?;
    ensure!(!bytes.is_empty(), "empty indexed transaction");
    let typed = bytes[0] == 2;
    let rlp = rlp::Rlp::new(if typed { &bytes[1..] } else { &bytes });
    let chain = if typed {
        rlp.val_at::<u64>(0)?
    } else {
        rlp.val_at::<u64>(6)?
            .checked_sub(35)
            .ok_or_else(|| anyhow::anyhow!("invalid indexed chain"))?
            / 2
    };
    // Indexed transactions already passed admission; parse fields without recovering signatures again.
    let tx = crate::ethereum::Transaction::prepare(&bytes, chain)?.transaction;
    Ok(
        json!({"type":tx.tx_type,"chainId":chain.to_string(),"nonce":tx.env.nonce.map(|n|n.to_string()),
        "valueWei":tx.env.value.to_string(),"gasLimit":tx.env.gas_limit.to_string(),
        "gasPriceWei":tx.env.gas_price.to_string(),"input":format!("0x{}",hex::encode(&tx.env.data))}),
    )
}

/// All searches are bounded, parameterized and run against a read-only WAL connection.
pub fn search(data: &Path, query: &Query) -> Result<Value> {
    if let Ok(bytes) = std::fs::read(data.join("runtime-info.capnp")) {
        let runtime: Value = crate::codec::from_slice(&bytes)?;
        ensure!(
            runtime["sqliteIndexerEnabled"] != false,
            "SQLite indexer is disabled (--no-indexer)"
        );
    }
    ensure!(query.q.len() <= 256, "query too long (maximum 256 bytes)");
    ensure!(
        [
            "",
            "logs",
            "blocks",
            "blocks_with_transactions",
            "transactions",
            "receipts"
        ]
        .contains(&query.kind.as_str()),
        "unknown index kind"
    );
    let limit = query.limit.unwrap_or(50).clamp(1, 100);
    let db =
        Connection::open_with_flags(data.join("index.sqlite"), OpenFlags::SQLITE_OPEN_READ_ONLY)?;
    db.busy_timeout(Duration::from_millis(250))?;
    // Consistent cursor/counts and results even when the writer commits during a query.
    db.execute_batch("BEGIN")?;
    let mut rows = Vec::new();
    let mut next = Value::Null;
    match query.kind.as_str() {
        "" | "logs" => {
            let before = query.before.unwrap_or(i64::MAX as u64).min(i64::MAX as u64);
            let terms = query
                .q
                .split_whitespace()
                .map(|term| format!("\"{}\"*", term.replace('"', "\"\"")))
                .collect::<Vec<_>>()
                .join(" AND ");
            let sql = if terms.is_empty() {
                "SELECT rowid,record FROM logs WHERE rowid<?1 ORDER BY rowid DESC LIMIT ?2"
            } else {
                "SELECT rowid,record FROM logs WHERE rowid<?1 AND logs MATCH ?3 ORDER BY rowid DESC LIMIT ?2"
            };
            let mut statement = db.prepare(sql)?;
            let mut found = if terms.is_empty() {
                statement.query(params![before, limit])?
            } else {
                statement.query(params![before, limit, terms])?
            };
            while let Some(row) = found.next()? {
                rows.push(json!({"id":row.get::<_,u64>(0)?, "record":crate::codec::from_slice::<Value>(&row.get::<_,Vec<u8>>(1)?)?}));
            }
        }
        "blocks" | "blocks_with_transactions" => {
            let populated = query.kind == "blocks_with_transactions";
            let sql = if populated {
                "SELECT record FROM blocks WHERE transaction_count>0 ORDER BY height DESC LIMIT ?1"
            } else if query.q.is_empty() {
                "SELECT record FROM blocks ORDER BY height DESC LIMIT ?1"
            } else {
                "SELECT record FROM blocks WHERE hash=?2 OR height=?3 ORDER BY height DESC LIMIT ?1"
            };
            let mut statement = db.prepare(sql)?;
            let mut found = if populated || query.q.is_empty() {
                statement.query(params![limit])?
            } else {
                statement.query(params![
                    limit,
                    query.q.to_lowercase(),
                    query.q.parse::<i64>().unwrap_or(-1)
                ])?
            };
            while let Some(row) = found.next()? {
                let mut block = crate::binary::indexed_header_value(&row.get::<_, Vec<u8>>(0)?)?;
                block["transactionCount"] = block["transactions"].clone();
                rows.push(block);
            }
        }
        _ => {
            let sql = if query.q.is_empty() {
                "SELECT hash,height,raw,receipt,position FROM transactions WHERE (height<?4 OR (height=?4 AND position<?5)) ORDER BY height DESC,position DESC LIMIT ?1"
            } else {
                "SELECT hash,height,raw,receipt,position FROM transactions WHERE (hash=?2 OR sender=?2 OR recipient=?2 OR height=?3) AND (height<?4 OR (height=?4 AND position<?5)) ORDER BY height DESC,position DESC LIMIT ?1"
            };
            let mut statement = db.prepare(sql)?;
            let mut found = statement.query(params![
                limit + 1,
                query.q.to_lowercase(),
                query.q.parse::<i64>().unwrap_or(-1),
                query
                    .before_height
                    .unwrap_or(i64::MAX as u64)
                    .min(i64::MAX as u64),
                query.before_position.unwrap_or(u32::MAX)
            ])?;
            while let Some(row) = found.next()? {
                let raw = format!("0x{}", hex::encode(row.get::<_, Vec<u8>>(2)?));
                rows.push(
                    json!({"hash":row.get::<_,String>(0)?, "height":row.get::<_,u64>(1)?,
                    "position":row.get::<_,u32>(4)?, "transaction":transaction_fields(&raw)?,
                    "raw":if query.kind == "receipts" {None} else {Some(raw)},
                    "receipt":crate::binary::receipt_value(crate::binary::reader(&row.get::<_,Vec<u8>>(3)?)?.get_root::<crate::storage_capnp::receipt::Reader>()?)?}),
                );
            }
            if rows.len() > limit as usize {
                rows.pop();
                if let Some(last) = rows.last() {
                    next =
                        json!({"before_height":last["height"],"before_position":last["position"]});
                }
            }
        }
    }
    let result = json!({"rows":rows,"next":next,"schemaVersion":crate::schema::sqlite_version(&db)?,"indexedHeight":meta(&db,"height")?,
        "indexedTransactions":meta(&db,"transactions")?,"indexedLogs":meta(&db,"logs")?,
        "skippedPrunedBlocks":meta(&db,"skipped_blocks")?,
        "journalMode":db.query_row("PRAGMA journal_mode",[],|r|r.get::<_,String>(0))?,
        "error":std::fs::read_to_string(data.join("index-error.log")).ok(),
        "database":data.join("index.sqlite")});
    db.execute_batch("COMMIT")?;
    Ok(result)
}
