//! Local, rebuildable SQLite search index. RocksDB remains authoritative.
use crate::{
    node::Node,
    types::{hex_hash, Block},
};
use anyhow::{ensure, Result};
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
    stop: Arc<AtomicBool>,
    thread: Option<JoinHandle<()>>,
}
// Bound catch-up memory. A single large block is never split:
// rows, counters, and the height cursor commit in the same SQLite transaction.
const INDEX_BATCH_BLOCKS: usize = 16;
const INDEX_BATCH_BYTES: usize = 8 * 1024 * 1024;

fn open_writer(path: &Path) -> Result<Connection> {
    let mut db = Connection::open(path)?;
    db.busy_timeout(Duration::from_secs(2))?;
    crate::schema::check_sqlite(&db)?;
    db.execute_batch(
        "PRAGMA journal_mode=WAL;
         PRAGMA synchronous=FULL;
         PRAGMA wal_autocheckpoint=4096;",
    )?;
    crate::schema::migrate_sqlite(&mut db)?;
    db.execute_batch("PRAGMA synchronous=NORMAL;")?;
    Ok(db)
}

fn meta(db: &Connection, key: &str) -> Result<i64> {
    Ok(db.query_row("SELECT value FROM meta WHERE key=?1", [key], |r| r.get(0))?)
}

fn index_block(db: &Connection, block: &Block) -> Result<()> {
    let message = block.read()?;
    let root = message.get_root::<crate::storage_capnp::block::Reader>()?;
    db.execute(
        "INSERT INTO blocks(height,hash,record,transaction_count) VALUES (?1,?2,?3,?4)",
        params![
            block.height(),
            hex_hash(&block.hash()),
            crate::binary::indexed_header_bytes(block)?.as_ref(),
            block.transaction_count() as u64
        ],
    )?;
    let mut statement =
        db.prepare_cached("INSERT INTO transactions VALUES (?1,?2,?3,?4,?5,?6,?7)")?;
    for (position, (raw, receipt)) in root
        .get_transactions()?
        .iter()
        .zip(root.get_receipts()?)
        .enumerate()
    {
        statement.execute(params![
            format!("0x{}", hex::encode(receipt.get_transaction_hash()?)),
            block.height(),
            position as u64,
            receipt.get_sender()?.to_str()?,
            if receipt.get_has_recipient() {
                Some(receipt.get_recipient()?.to_str()?)
            } else {
                None
            },
            raw?,
            crate::binary::receipt_bytes(receipt)?.as_ref()
        ])?;
    }
    db.execute(
        "UPDATE meta SET value=?1 WHERE key='height'",
        [block.height()],
    )?;
    db.execute(
        "UPDATE meta SET value=value+?1 WHERE key='transactions'",
        [block.transaction_count() as u64],
    )?;
    Ok(())
}

// Keep each cleanup transaction bounded; readers continue using WAL snapshots.
fn prune_index(
    db: &mut Connection,
    earliest: u64,
    retention: &crate::config::Retention,
) -> Result<bool> {
    let crate::config::Retention::Pruned { seconds } = retention else {
        return Ok(false);
    };
    let tx = db.transaction()?;
    let heights = {
        let mut stmt = tx.prepare(
            "SELECT height,transaction_count FROM blocks WHERE height<?1 ORDER BY height LIMIT 16",
        )?;
        let rows = stmt.query_map([earliest], |r| {
            Ok((r.get::<_, u64>(0)?, r.get::<_, u64>(1)?))
        })?;
        rows.collect::<rusqlite::Result<Vec<_>>>()?
    };
    for (height, count) in &heights {
        tx.execute("DELETE FROM transactions WHERE height=?1", [height])?;
        tx.execute("DELETE FROM blocks WHERE height=?1", [height])?;
        tx.execute(
            "UPDATE meta SET value=MAX(0,value-?1) WHERE key='transactions'",
            [count],
        )?;
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_secs();
    tx.execute("INSERT OR IGNORE INTO meta VALUES ('last_log_prune',0)", [])?;
    let last = meta(&tx, "last_log_prune")? as u64;
    let mut deleted = 0;
    if now > last {
        deleted = tx.execute(
            "DELETE FROM logs WHERE rowid IN (SELECT rowid FROM logs WHERE CAST(timestamp_ms AS INTEGER) < ?1 LIMIT 1000)",
            [now.saturating_sub(*seconds).saturating_mul(1000)])?;
        tx.execute(
            "UPDATE meta SET value=MAX(0,value-?1) WHERE key='logs'",
            [deleted],
        )?;
        // Drain old backlogs in bounded batches before advancing the timer.
        if deleted < 1000 {
            tx.execute("UPDATE meta SET value=?1 WHERE key='last_log_prune'", [now])?;
        }
    }
    tx.commit()?;
    Ok(!heights.is_empty() || deleted > 0)
}

fn step(
    db: &mut Connection,
    store: &crate::storage::Store,
    retention: &crate::config::Retention,
    data: &Path,
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
    let pruned = prune_index(db, earliest, retention)?;
    let changed = !blocks.is_empty() || !logs.is_empty();
    if !changed {
        return Ok(pruned);
    }
    let tx = db.transaction()?;
    if earliest > next && !blocks.is_empty() {
        tx.execute(
            "UPDATE meta SET value=value+?1 WHERE key='skipped_blocks'",
            [earliest - next],
        )?;
    }
    for block in &blocks {
        index_block(&tx, block)?;
    }
    for record in &logs {
        tx.execute(
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
    tx.execute("UPDATE meta SET value=?1 WHERE key='log_offset'", [end])?;
    tx.execute(
        "UPDATE meta SET value=value+?1 WHERE key='logs'",
        [logs.len() as u64],
    )?;
    tx.commit()?;
    Ok(true)
}

impl Indexer {
    pub fn start(node: Arc<Mutex<Node>>, data: PathBuf) -> Result<Self> {
        let (store, retention) = {
            let node = node
                .lock()
                .map_err(|_| anyhow::anyhow!("node unavailable"))?;
            (node.store.clone(), node.config.retention.clone())
        };
        let mut db = open_writer(&data.join("index.sqlite"))?;
        let stop = Arc::new(AtomicBool::new(false));
        let stopping = stop.clone();
        let thread = thread::Builder::new()
            .name("sfc-sqlite-index".into())
            .spawn(move || {
                while !stopping.load(Ordering::Relaxed) {
                    match step(&mut db, &store, &retention, &data) {
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
                    thread::sleep(Duration::from_millis(100));
                }
                // Bounded final pass; any remaining backlog resumes from durable cursors next startup.
                let _ = step(&mut db, &store, &retention, &data);
                let _ = db.execute_batch("PRAGMA wal_checkpoint(PASSIVE)");
            })?;
        Ok(Self {
            stop,
            thread: Some(thread),
        })
    }
}

impl Drop for Indexer {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Relaxed);
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

#[cfg(test)]
mod retention_tests {
    use super::*;
    #[test]
    fn indexed_logs_expire_but_archive_keeps_them() {
        let dir = tempfile::tempdir().unwrap();
        let mut db = open_writer(&dir.path().join("index.sqlite")).unwrap();
        db.execute("INSERT INTO logs(timestamp_ms,level,event,message,record) VALUES (1,'info','old','old',x'00')", []).unwrap();
        db.execute("UPDATE meta SET value=1 WHERE key='logs'", [])
            .unwrap();
        assert!(!prune_index(&mut db, 0, &crate::config::Retention::Archive).unwrap());
        assert_eq!(meta(&db, "logs").unwrap(), 1);
        assert!(prune_index(
            &mut db,
            0,
            &crate::config::Retention::Pruned { seconds: 60 }
        )
        .unwrap());
        assert_eq!(meta(&db, "logs").unwrap(), 0);
        assert_eq!(
            db.query_row("SELECT count(*) FROM logs", [], |r| r.get::<_, u64>(0))
                .unwrap(),
            0
        );
    }
}
