//! Explicit, forward-only storage upgrades. A schema change must ship a migration;
//! unknown newer versions are rejected rather than guessed or silently rebuilt.
use crate::types::{Block, World};
use anyhow::{ensure, Context, Result};
use rocksdb::{WriteBatch, DB};
use rusqlite::{Connection, TransactionBehavior};

pub const ROCKSDB_VERSION: u32 = 1;
pub const SIGNER_VERSION: u32 = 1;
pub const SQLITE_VERSION: u32 = 2;
pub(crate) const ROCKSDB_VERSION_KEY: &[u8] = b"meta/schema_version";

pub(crate) fn rocksdb_version(db: &DB) -> Result<u32> {
    db.get(ROCKSDB_VERSION_KEY)?
        .map(|bytes| serde_json::from_slice(&bytes).context("invalid RocksDB schema version"))
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

pub(crate) fn migrate_rocksdb(db: &DB) -> Result<()> {
    let version = check_rocksdb(db)?;
    if version == 0 {
        // v0 had no version marker. Accept both embedded accounts and the current
        // account/* layout, using exactly the same precedence as Store::world.
        let mut world: World = serde_json::from_slice(
            &db.get(b"world")?
                .context("missing world during migration")?,
        )?;
        let embedded_accounts = !world.accounts.is_empty();
        for entry in db.prefix_iterator(b"account/") {
            let (key, value) = entry?;
            if !key.starts_with(b"account/") {
                break;
            }
            world.accounts.insert(
                std::str::from_utf8(&key[8..])?.to_owned(),
                serde_json::from_slice(&value)?,
            );
        }
        let height: u64 =
            serde_json::from_slice(&db.get(b"head")?.context("missing head during migration")?)?;
        let block: Block = serde_json::from_slice(
            &db.get(format!("block/{height:020}"))?
                .context("missing head block during migration")?,
        )?;
        ensure!(
            block.state_root == world.root(),
            "state commitment mismatch during RocksDB migration"
        );
        let mut batch = WriteBatch::default();
        if embedded_accounts {
            for (address, account) in &world.accounts {
                batch.put(format!("account/{address}"), serde_json::to_vec(account)?);
            }
            world.accounts.clear();
            batch.put(b"world", serde_json::to_vec(&world)?);
        }
        // Data and version become durable together, so a crash retries v0 or
        // sees complete v1. Never rewrite serialized blocks or their hashes.
        batch.put(ROCKSDB_VERSION_KEY, serde_json::to_vec(&ROCKSDB_VERSION)?);
        db.write_opt(batch, &crate::journal::durable_write_options())?;
        crate::logging::event(
            "info",
            "schema_migrated",
            serde_json::json!({"database":"rocksdb","from":version,"to":ROCKSDB_VERSION}),
        );
    }
    Ok(())
}

pub(crate) fn sqlite_version(db: &Connection) -> Result<u32> {
    Ok(db.query_row("PRAGMA user_version", [], |row| row.get(0))?)
}

pub(crate) fn check_sqlite(db: &Connection) -> Result<u32> {
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
    if version == 0 {
        tx.execute_batch(
            "CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value INTEGER NOT NULL);
             INSERT OR IGNORE INTO meta VALUES ('height',-1),('log_offset',0),('logs',0),('transactions',0),('skipped_blocks',0);
             CREATE TABLE IF NOT EXISTS blocks(height INTEGER PRIMARY KEY, hash TEXT UNIQUE NOT NULL, json TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS transactions(
                 hash TEXT PRIMARY KEY, height INTEGER NOT NULL, position INTEGER NOT NULL,
                 sender TEXT NOT NULL, recipient TEXT, raw TEXT NOT NULL, receipt TEXT NOT NULL);
             CREATE INDEX IF NOT EXISTS tx_height ON transactions(height DESC,position);
             CREATE INDEX IF NOT EXISTS tx_sender ON transactions(sender,height DESC);
             CREATE INDEX IF NOT EXISTS tx_recipient ON transactions(recipient,height DESC);
             CREATE VIRTUAL TABLE IF NOT EXISTS logs USING fts5(timestamp_ms UNINDEXED, level, event, record);",
        )?;
        // Fail on incompatible pre-existing tables instead of stamping a version
        // on a schema that the indexer cannot read.
        tx.prepare("SELECT key,value FROM meta LIMIT 0")?;
        tx.prepare("SELECT height,hash,json FROM blocks LIMIT 0")?;
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
             UPDATE blocks SET transaction_count=json_extract(json,'$.transactions');
             CREATE INDEX populated_blocks ON blocks(height DESC) WHERE transaction_count>0;",
        )?;
        let invalid: bool = tx.query_row(
            "SELECT EXISTS(SELECT 1 FROM blocks WHERE typeof(transaction_count)!='integer')",
            [],
            |row| row.get(0),
        )?;
        ensure!(
            !invalid,
            "invalid block transaction count during SQLite migration"
        );
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
                CREATE TABLE blocks(height INTEGER PRIMARY KEY,hash TEXT UNIQUE NOT NULL,json TEXT NOT NULL);
                INSERT INTO blocks VALUES(7,'block7','{\"transactions\":3}');").unwrap();
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
