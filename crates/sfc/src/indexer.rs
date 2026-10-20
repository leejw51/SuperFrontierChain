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
    io::{BufRead, BufReader, Seek, SeekFrom},
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

fn open_writer(path: &Path) -> Result<Connection> {
    let mut db = Connection::open(path)?;
    db.busy_timeout(Duration::from_secs(2))?;
    crate::schema::check_sqlite(&db)?;
    db.execute_batch(
        "PRAGMA journal_mode=WAL;
         PRAGMA synchronous=FULL;
         PRAGMA wal_autocheckpoint=1000;",
    )?;
    crate::schema::migrate_sqlite(&mut db)?;
    db.execute_batch("PRAGMA synchronous=NORMAL;")?;
    Ok(db)
}

fn meta(db: &Connection, key: &str) -> Result<i64> {
    Ok(db.query_row("SELECT value FROM meta WHERE key=?1", [key], |r| r.get(0))?)
}

fn index_block(db: &Connection, block: &Block) -> Result<()> {
    ensure!(
        block.transactions.len() == block.receipts.len(),
        "block receipt count mismatch"
    );
    let header = json!({"height":block.height,"hash":hex_hash(&block.hash()),
        "timestamp":block.timestamp,"stateRoot":hex_hash(&block.state_root),
        "parentHash":hex_hash(&block.parent_hash),"transactions":block.transactions.len()});
    db.execute(
        "INSERT INTO blocks(height,hash,json,transaction_count) VALUES (?1,?2,?3,?4)",
        params![
            block.height,
            hex_hash(&block.hash()),
            header.to_string(),
            block.transactions.len() as u64
        ],
    )?;
    let mut statement =
        db.prepare_cached("INSERT INTO transactions VALUES (?1,?2,?3,?4,?5,?6,?7)")?;
    for (position, (raw, receipt)) in block.transactions.iter().zip(&block.receipts).enumerate() {
        statement.execute(params![
            hex_hash(&receipt.transaction_hash),
            block.height,
            position as u64,
            receipt.from.to_lowercase(),
            receipt.to.as_ref().map(|s| s.to_lowercase()),
            raw,
            serde_json::to_string(receipt)?
        ])?;
    }
    db.execute(
        "UPDATE meta SET value=?1 WHERE key='height'",
        [block.height],
    )?;
    db.execute(
        "UPDATE meta SET value=value+?1 WHERE key='transactions'",
        [block.transactions.len() as u64],
    )?;
    Ok(())
}

fn step(db: &mut Connection, node: &Arc<Mutex<Node>>, data: &Path) -> Result<bool> {
    let next = (meta(db, "height")? + 1) as u64;
    // Copy at most one block under the node lock, then release it before SQLite work.
    let (block, earliest) = {
        let node = node
            .lock()
            .map_err(|_| anyhow::anyhow!("node unavailable"))?;
        let earliest = node.store.earliest_height()?;
        (node.store.block(next.max(earliest))?, earliest)
    };
    let offset = meta(db, "log_offset")? as u64;
    let mut logs = Vec::new();
    let mut end = offset;
    if let Ok(file) = File::open(data.join("logs/node.jsonl")) {
        let mut reader = BufReader::new(file);
        reader.seek(SeekFrom::Start(offset))?;
        for _ in 0..1000 {
            let mut line = String::new();
            let bytes = reader.read_line(&mut line)?;
            if bytes == 0 || !line.ends_with('\n') {
                break;
            }
            // Only complete records advance the durable cursor; crash tails can be retried.
            let record: Value = serde_json::from_str(&line)?;
            logs.push(record);
            end += bytes as u64;
        }
    }
    let changed = block.is_some() || !logs.is_empty();
    if !changed {
        return Ok(false);
    }
    let tx = db.transaction()?;
    if earliest > next && block.is_some() {
        tx.execute(
            "UPDATE meta SET value=value+?1 WHERE key='skipped_blocks'",
            [earliest - next],
        )?;
    }
    if let Some(block) = block {
        index_block(&tx, &block)?;
    }
    for record in &logs {
        tx.execute(
            "INSERT INTO logs(timestamp_ms,level,event,record) VALUES (?1,?2,?3,?4)",
            params![
                record["timestamp_ms"].as_u64(),
                record["level"].as_str(),
                record["event"].as_str(),
                record.to_string()
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
        let mut db = open_writer(&data.join("index.sqlite"))?;
        let stop = Arc::new(AtomicBool::new(false));
        let stopping = stop.clone();
        let thread = thread::Builder::new()
            .name("sfc-sqlite-index".into())
            .spawn(move || {
                while !stopping.load(Ordering::Relaxed) {
                    match step(&mut db, &node, &data) {
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
                let _ = step(&mut db, &node, &data);
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
                rows.push(json!({"id":row.get::<_,u64>(0)?, "record":serde_json::from_str::<Value>(&row.get::<_,String>(1)?)?}));
            }
        }
        "blocks" | "blocks_with_transactions" => {
            let populated = query.kind == "blocks_with_transactions";
            let sql = if populated {
                "SELECT json FROM blocks WHERE transaction_count>0 ORDER BY height DESC LIMIT ?1"
            } else if query.q.is_empty() {
                "SELECT json FROM blocks ORDER BY height DESC LIMIT ?1"
            } else {
                "SELECT json FROM blocks WHERE hash=?2 OR height=?3 ORDER BY height DESC LIMIT ?1"
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
                let mut block: Value = serde_json::from_str(&row.get::<_, String>(0)?)?;
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
                let raw = row.get::<_, String>(2)?;
                rows.push(
                    json!({"hash":row.get::<_,String>(0)?, "height":row.get::<_,u64>(1)?,
                    "position":row.get::<_,u32>(4)?, "transaction":transaction_fields(&raw)?,
                    "raw":if query.kind == "receipts" {None} else {Some(raw)},
                    "receipt":serde_json::from_str::<Value>(&row.get::<_,String>(3)?)?}),
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
