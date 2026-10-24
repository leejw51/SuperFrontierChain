//! Explicit, forward-only storage upgrades. A schema change must ship a migration;
//! unknown newer versions are rejected rather than guessed or silently rebuilt.
use crate::types::{Block, World};
use anyhow::{ensure, Context, Result};
use rocksdb::{WriteBatch, DB};
use rusqlite::{Connection, TransactionBehavior};

// v3 writes compact binary receipt indexes; the reader/filter also accept v2 keys.
// v4 isolates block values in a separate CF. Markers prevent unsafe downgrades.
pub const ROCKSDB_VERSION: u32 = 4;
pub const SIGNER_VERSION: u32 = 2;
pub const SQLITE_VERSION: u32 = 3;
pub(crate) const ROCKSDB_VERSION_KEY: &[u8] = b"meta/schema_version";

pub(crate) fn rocksdb_version(db: &DB) -> Result<u32> {
    db.get(ROCKSDB_VERSION_KEY)?
        .map(|bytes| crate::codec::from_slice(&bytes).context("invalid RocksDB schema version"))
        .transpose()
        .map(|version| version.unwrap_or(0))
}

pub(crate) fn check_rocksdb(db: &DB) -> Result<u32> {
    let version = rocksdb_version(db)?;
    ensure!(
        version <= ROCKSDB_VERSION,
        "RocksDB schema {version} is newer than supported {ROCKSDB_VERSION}; use a newer binary"
    );
    Ok(version)
}

pub(crate) fn migrate_rocksdb(db: &mut DB) -> Result<()> {
    let version = check_rocksdb(db)?;
    if version < ROCKSDB_VERSION {
        // v0 had no version marker. Accept both embedded accounts and the current
        // account/* layout, using exactly the same precedence as Store::world.
        let mut world: World = crate::binary::world_from_bytes(
            &db.get(b"world")?
                .context("missing world during migration")?,
        )?;
        let embedded_accounts = !world.accounts.is_empty();
        for entry in db.iterator_opt(
            rocksdb::IteratorMode::From(b"account/", rocksdb::Direction::Forward),
            crate::journal::full_scan_options(),
        ) {
            let (key, value) = entry?;
            if !key.starts_with(b"account/") {
                break;
            }
            world.accounts.insert(
                std::str::from_utf8(&key[8..])?.to_owned(),
                crate::binary::account_from_bytes(&value)?,
            );
        }
        let height: u64 =
            crate::codec::from_slice(&db.get(b"head")?.context("missing head during migration")?)?;
        let key = format!("block/{height:020}");
        let relocated = match db.cf_handle("blocks") {
            Some(cf) => db.get_cf(cf, &key)?,
            None => None,
        };
        let block = Block::from_bytes(
            relocated
                .or(db.get(&key)?)
                .context("missing head block during migration")?,
        )?;
        ensure!(
            block.state_root() == world.root(),
            "state commitment mismatch during RocksDB migration"
        );
        let mut batch = WriteBatch::default();
        if embedded_accounts {
            for (address, account) in &world.accounts {
                batch.put(
                    format!("account/{address}"),
                    crate::binary::account_bytes(account)?,
                );
            }
            world.accounts.clear();
            batch.put(b"world", crate::binary::world_bytes(&world)?);
        }
        // Normalize metadata first. v3 also understands both receipt index formats.
        // v4 is published only after every block has moved to its own column family.
        batch.put(ROCKSDB_VERSION_KEY, crate::codec::to_vec(&3u32)?);
        let genesis: crate::types::Genesis = crate::codec::from_slice(
            &db.get(b"genesis")?
                .context("missing genesis during migration")?,
        )?;
        batch.put(b"genesis", crate::codec::to_vec(&genesis)?);
        batch.put(b"head", crate::codec::to_vec(&height)?);
        db.write_opt(batch, &crate::journal::durable_write_options())?;
        if db.cf_handle("blocks").is_none() {
            let mut options = rocksdb::Options::default();
            options.set_compression_type(rocksdb::DBCompressionType::Lz4);
            db.create_cf("blocks", &options)?;
        }
        let cf = db
            .cf_handle("blocks")
            .context("missing blocks column family")?;
        let mut batch = WriteBatch::default();
        let mut count = 0;
        for entry in db.iterator_opt(
            rocksdb::IteratorMode::From(b"block/", rocksdb::Direction::Forward),
            crate::journal::full_scan_options(),
        ) {
            let (key, value) = entry?;
            if !key.starts_with(b"block/") {
                break;
            }
            if let Some(existing) = db.get_cf(cf, &key)? {
                ensure!(
                    existing == value.as_ref(),
                    "conflicting block copies during migration"
                );
            }
            // Moving a block and deleting its old copy are one synced WAL batch.
            // A crash leaves the remaining default-CF keys as the resume cursor.
            batch.put_cf(cf, &key, &value);
            batch.delete(&key);
            count += 1;
            if count >= 256 || batch.size_in_bytes() >= 8 * 1024 * 1024 {
                db.write_opt(batch, &crate::journal::durable_write_options())?;
                batch = WriteBatch::default();
                count = 0;
            }
        }
        batch.put(ROCKSDB_VERSION_KEY, crate::codec::to_vec(&ROCKSDB_VERSION)?);
        db.write_opt(batch, &crate::journal::durable_write_options())?;
        crate::logging::event(
            "info",
            "schema_migrated",
            serde_json::json!({"database":"rocksdb","from":version,"to":ROCKSDB_VERSION}),
        );
    }
    ensure!(
        db.cf_handle("blocks").is_some(),
        "schema v4 is missing its blocks column family"
    );
    Ok(())
}

pub(crate) fn sqlite_version(db: &Connection) -> Result<u32> {
    Ok(db.query_row("PRAGMA user_version", [], |row| row.get(0))?)
}

pub(crate) fn check_sqlite(db: &Connection) -> Result<u32> {
    let app: u32 = db.query_row("PRAGMA application_id", [], |r| r.get(0))?;
    let populated: bool = db.query_row(
        "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table')",
        [],
        |r| r.get(0),
    )?;
    ensure!(
        !populated || app == 0x53464333,
        "legacy SQLite index: preserve it and use a new protocol-v3 home"
    );
    let version = sqlite_version(db)?;
    ensure!(
        version <= SQLITE_VERSION,
        "SQLite schema {version} is newer than supported {SQLITE_VERSION}; use a newer binary"
    );
    Ok(version)
}

pub(crate) fn migrate_sqlite(db: &mut Connection) -> Result<()> {
    // Serialize migration decisions with other writers. DDL, backfill and the
    // version marker commit together; failed upgrades roll back on drop.
    let tx = db.transaction_with_behavior(TransactionBehavior::Immediate)?;
    let original = migrate_sqlite_transaction(&tx)?;
    tx.commit()?;
    if original != SQLITE_VERSION {
        crate::logging::event(
            "info",
            "schema_migrated",
            serde_json::json!({"database":"sqlite","from":original,"to":SQLITE_VERSION}),
        );
    }
    Ok(())
}

fn migrate_sqlite_transaction(tx: &rusqlite::Transaction<'_>) -> Result<u32> {
    let mut version = check_sqlite(tx)?;
    let original = version;
    tx.pragma_update(None, "application_id", 0x53464333u32)?;
    if version == 0 {
        tx.execute_batch(
            "CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value INTEGER NOT NULL);
             INSERT OR IGNORE INTO meta VALUES ('height',-1),('log_offset',0),('logs',0),('transactions',0),('skipped_blocks',0);
             CREATE TABLE IF NOT EXISTS blocks(height INTEGER PRIMARY KEY, hash TEXT UNIQUE NOT NULL, record BLOB NOT NULL);
             CREATE TABLE IF NOT EXISTS transactions(
                 hash TEXT PRIMARY KEY, height INTEGER NOT NULL, position INTEGER NOT NULL,
                 sender TEXT NOT NULL, recipient TEXT, raw BLOB NOT NULL, receipt BLOB NOT NULL);
             CREATE INDEX IF NOT EXISTS tx_height ON transactions(height DESC,position);
             CREATE INDEX IF NOT EXISTS tx_sender ON transactions(sender,height DESC);
             CREATE INDEX IF NOT EXISTS tx_recipient ON transactions(recipient,height DESC);
             CREATE VIRTUAL TABLE IF NOT EXISTS logs USING fts5(timestamp_ms UNINDEXED, level, event, message, record UNINDEXED);",
        )?;
        // Fail on incompatible pre-existing tables instead of stamping a version
        // on a schema that the indexer cannot read.
        tx.prepare("SELECT key,value FROM meta LIMIT 0")?;
        tx.prepare("SELECT height,hash,record FROM blocks LIMIT 0")?;
        tx.prepare(
            "SELECT hash,height,position,sender,recipient,raw,receipt FROM transactions LIMIT 0",
        )?;
        tx.prepare(
            "SELECT rowid,timestamp_ms,level,event,record FROM logs WHERE logs MATCH ?1 LIMIT 0",
        )?;
        version = 1;
        tx.pragma_update(None, "user_version", version)?;
    }
    if version == 1 {
        // Avoid scanning millions of transaction rows to populate the block
        // picker. Backfill from retained block metadata, including pruned history.
        tx.execute_batch(
            "ALTER TABLE blocks ADD COLUMN transaction_count INTEGER NOT NULL DEFAULT 0 CHECK(transaction_count>=0);
             CREATE INDEX populated_blocks ON blocks(height DESC) WHERE transaction_count>0;",
        )?;
        let records = {
            let mut statement = tx.prepare("SELECT height,record FROM blocks")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, u64>(0)?, r.get::<_, Vec<u8>>(1)?)))?
                .collect::<std::result::Result<Vec<_>, _>>()?;
            rows
        };
        for (height, bytes) in records {
            let record: serde_json::Value = crate::codec::from_slice(&bytes)?;
            let count = record["transactions"]
                .as_u64()
                .context("invalid block transaction count")?;
            tx.execute(
                "UPDATE blocks SET transaction_count=?1 WHERE height=?2",
                rusqlite::params![count, height],
            )?;
        }
        version = 2;
        tx.pragma_update(None, "user_version", version)?;
    }
    if version == 2 {
        // Bound working memory while upgrading a potentially large explorer index.
        let mut cursor = -1i64;
        loop {
            let rows = {
                let mut statement=tx.prepare("SELECT height,hash,record FROM blocks WHERE height>?1 ORDER BY height LIMIT 512")?;
                let rows = statement
                    .query_map([cursor], |r| {
                        Ok((
                            r.get::<_, i64>(0)?,
                            r.get::<_, String>(1)?,
                            r.get::<_, Vec<u8>>(2)?,
                        ))
                    })?
                    .collect::<std::result::Result<Vec<_>, _>>()?;
                rows
            };
            if rows.is_empty() {
                break;
            }
            for (height, hash, bytes) in rows {
                let value = crate::codec::from_slice::<serde_json::Value>(&bytes)?;
                let bytes = crate::binary::migrate_index_header(height.try_into()?, &hash, &value)?;
                tx.execute(
                    "UPDATE blocks SET record=?1 WHERE height=?2",
                    rusqlite::params![bytes.as_ref(), height],
                )?;
                cursor = height;
            }
        }
        tx.pragma_update(None, "user_version", SQLITE_VERSION)?;
    }
    Ok(original)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::{
        path::PathBuf,
        process::{Command, Stdio},
        time::{Duration, Instant},
    };

    #[test]
    #[ignore = "subprocess helper killed before migration commit"]
    fn sqlite_migration_crash_worker() {
        let path = PathBuf::from(std::env::var_os("SFC_MIGRATION_TEST_HOME").unwrap());
        let mut db = Connection::open(path.join("index.sqlite")).unwrap();
        let tx = db
            .transaction_with_behavior(TransactionBehavior::Immediate)
            .unwrap();
        migrate_sqlite_transaction(&tx).unwrap();
        std::fs::write(path.join("ready"), b"uncommitted").unwrap();
        loop {
            std::thread::park_timeout(Duration::from_secs(1));
        }
    }

    #[test]
    fn interrupted_sqlite_migration_rolls_back_and_restarts() {
        let dir = tempfile::tempdir().unwrap();
        {
            let db = Connection::open(dir.path().join("index.sqlite")).unwrap();
            db.execute_batch("PRAGMA journal_mode=WAL;
                CREATE TABLE blocks(height INTEGER PRIMARY KEY,hash TEXT UNIQUE NOT NULL,record BLOB NOT NULL);
                PRAGMA application_id=1397113651;").unwrap();
            db.execute(
                "INSERT INTO blocks VALUES(7,'block7',?1)",
                [crate::codec::to_vec(&serde_json::json!({"transactions":3})).unwrap()],
            )
            .unwrap();
        }
        struct ChildGuard(std::process::Child);
        impl Drop for ChildGuard {
            fn drop(&mut self) {
                let _ = self.0.kill();
                let _ = self.0.wait();
            }
        }
        let mut child = ChildGuard(
            Command::new(std::env::current_exe().unwrap())
                .args([
                    "--exact",
                    "schema::tests::sqlite_migration_crash_worker",
                    "--ignored",
                    "--nocapture",
                ])
                .env("SFC_MIGRATION_TEST_HOME", dir.path())
                .stdout(Stdio::null())
                .spawn()
                .unwrap(),
        );
        let deadline = Instant::now() + Duration::from_secs(15);
        while !dir.path().join("ready").exists() {
            assert!(
                child.0.try_wait().unwrap().is_none(),
                "migration child exited early"
            );
            assert!(Instant::now() < deadline, "migration child timed out");
            std::thread::sleep(Duration::from_millis(20));
        }
        child.0.kill().unwrap();
        child.0.wait().unwrap();
        let mut db = Connection::open(dir.path().join("index.sqlite")).unwrap();
        assert_eq!(sqlite_version(&db).unwrap(), 0);
        assert!(db.prepare("SELECT transaction_count FROM blocks").is_err());
        migrate_sqlite(&mut db).unwrap();
        assert_eq!(sqlite_version(&db).unwrap(), SQLITE_VERSION);
        assert_eq!(
            db.query_row(
                "SELECT transaction_count FROM blocks WHERE height=7",
                [],
                |r| r.get::<_, i64>(0)
            )
            .unwrap(),
            3
        );
        assert_eq!(
            db.query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "ok"
        );
    }
}
