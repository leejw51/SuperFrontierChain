mod common;

use ed25519_dalek::SigningKey;
use rocksdb::{WriteBatch, DB};
use rusqlite::Connection;
use serde_json::json;
use sfc::{
    config::Retention,
    consensus::{DurableSigner, Phase},
    framework::Application,
    indexer::Indexer,
    node::Node,
    schema::{ROCKSDB_VERSION, SIGNER_VERSION, SQLITE_VERSION},
    storage::Store,
};
use std::sync::{Arc, Mutex};

const VERSION: &[u8] = b"meta/schema_version";

#[test]
#[ignore = "subprocess helper killed after durable RocksDB migration"]
fn rocksdb_migration_crash_worker() {
    let home = std::path::PathBuf::from(std::env::var_os("SFC_MIGRATION_TEST_HOME").unwrap());
    let _store = Store::open(&home.join("chain"), Retention::Archive, &common::genesis()).unwrap();
    std::fs::write(home.join("ready"), b"migrated").unwrap();
    loop {
        std::thread::park_timeout(std::time::Duration::from_secs(1));
    }
}

#[test]
fn rocksdb_migration_survives_process_kill_without_close() {
    let dir = tempfile::tempdir().unwrap();
    let home = dir.path().join("chain");
    let genesis = common::genesis();
    let store = Store::open(&home, Retention::Archive, &genesis).unwrap();
    let world = store.world().unwrap();
    let hash = store.head_hash().unwrap();
    drop(store);
    {
        let db = DB::open_default(home.join("rocksdb")).unwrap();
        let mut batch = WriteBatch::default();
        batch.delete(VERSION);
        batch.put(b"world", serde_json::to_vec(&world).unwrap());
        for address in world.accounts.keys() {
            batch.delete(format!("account/{address}"));
        }
        db.write(batch).unwrap();
    }
    struct ChildGuard(std::process::Child);
    impl Drop for ChildGuard {
        fn drop(&mut self) {
            let _ = self.0.kill();
            let _ = self.0.wait();
        }
    }
    let mut child = ChildGuard(
        std::process::Command::new(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "rocksdb_migration_crash_worker",
                "--ignored",
                "--nocapture",
            ])
            .env("SFC_MIGRATION_TEST_HOME", dir.path())
            .stdout(std::process::Stdio::null())
            .spawn()
            .unwrap(),
    );
    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(15);
    while !dir.path().join("ready").exists() {
        assert!(
            child.0.try_wait().unwrap().is_none(),
            "migration child exited early"
        );
        assert!(
            std::time::Instant::now() < deadline,
            "migration child timed out"
        );
        std::thread::sleep(std::time::Duration::from_millis(20));
    }
    child.0.kill().unwrap();
    child.0.wait().unwrap();
    let store = Store::open(&home, Retention::Archive, &genesis).unwrap();
    assert_eq!(store.world().unwrap(), world);
    assert_eq!(store.head_hash().unwrap(), hash);
    assert_eq!(
        store.statistics().unwrap()["schema_version"],
        ROCKSDB_VERSION
    );
}

#[test]
fn rocksdb_legacy_accounts_migrate_without_changing_chain_and_reopen() {
    let dir = tempfile::tempdir().unwrap();
    let genesis = common::genesis();
    let store = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
    let (block, world) = Application::default()
        .execute_block(
            &store.head().unwrap(),
            &store.world().unwrap(),
            genesis.timestamp + 1,
            genesis.gas_limit,
            &[common::transfer(0)],
        )
        .unwrap();
    store.commit(&block, &world).unwrap();
    drop(store);
    let path = dir.path().join("rocksdb");
    let encoded_block;
    {
        let db = DB::open_default(&path).unwrap();
        encoded_block = db
            .get(format!("block/{:020}", block.height))
            .unwrap()
            .unwrap();
        let mut batch = WriteBatch::default();
        batch.delete(VERSION);
        batch.put(b"world", serde_json::to_vec(&world).unwrap());
        for address in world.accounts.keys() {
            batch.delete(format!("account/{address}"));
        }
        db.write(batch).unwrap();
    }
    for _ in 0..2 {
        let store = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
        assert_eq!(store.world().unwrap(), world);
        assert_eq!(store.head().unwrap(), block);
        assert_eq!(store.head_hash().unwrap(), block.hash());
        assert_eq!(
            store.statistics().unwrap()["schema_version"],
            ROCKSDB_VERSION
        );
    }
    let db = DB::open_default(&path).unwrap();
    assert_eq!(
        db.get(format!("block/{:020}", block.height))
            .unwrap()
            .unwrap(),
        encoded_block
    );
    let metadata: sfc::types::World =
        serde_json::from_slice(&db.get(b"world").unwrap().unwrap()).unwrap();
    assert!(metadata.accounts.is_empty());
    assert!(db
        .get(format!("account/{:#x}", common::sender()))
        .unwrap()
        .is_some());
}

#[test]
fn rocksdb_rejects_newer_versions_and_failed_migration_is_retryable() {
    let dir = tempfile::tempdir().unwrap();
    let genesis = common::genesis();
    drop(Store::open(dir.path(), Retention::Archive, &genesis).unwrap());
    let path = dir.path().join("rocksdb");
    {
        let db = DB::open_default(&path).unwrap();
        db.put(VERSION, b"999").unwrap();
    }
    assert!(Store::open(dir.path(), Retention::Archive, &genesis)
        .err()
        .unwrap()
        .to_string()
        .contains("newer"));
    let world;
    {
        let db = DB::open_default(&path).unwrap();
        assert_eq!(db.get(VERSION).unwrap().unwrap(), b"999");
        db.delete(VERSION).unwrap();
        world = db.get(b"world").unwrap().unwrap();
        db.put(b"world", b"broken").unwrap();
    }
    assert!(Store::open(dir.path(), Retention::Archive, &genesis).is_err());
    {
        let db = DB::open_default(&path).unwrap();
        assert!(db.get(VERSION).unwrap().is_none());
        db.put(b"world", world).unwrap();
    }
    assert!(Store::open(dir.path(), Retention::Archive, &genesis).is_ok());
}

#[test]
fn signer_migration_preserves_double_sign_protection() {
    let dir = tempfile::tempdir().unwrap();
    let key = SigningKey::from_bytes(&[7; 32]);
    let mut signer = DurableSigner::open(dir.path(), 7777, key.clone()).unwrap();
    let vote = signer.sign(10, 0, Phase::Precommit, Some([1; 32])).unwrap();
    drop(signer);
    {
        let db = DB::open_default(dir.path()).unwrap();
        db.delete(VERSION).unwrap();
    }
    let mut signer = DurableSigner::open(dir.path(), 7777, key.clone()).unwrap();
    assert_eq!(
        signer.sign(10, 0, Phase::Precommit, Some([1; 32])).unwrap(),
        vote
    );
    assert!(signer.sign(10, 0, Phase::Precommit, Some([2; 32])).is_err());
    assert!(signer.sign(9, 0, Phase::Precommit, None).is_err());
    drop(signer);
    {
        let db = DB::open_default(dir.path()).unwrap();
        assert_eq!(
            serde_json::from_slice::<u32>(&db.get(VERSION).unwrap().unwrap()).unwrap(),
            SIGNER_VERSION
        );
        db.put(VERSION, b"999").unwrap();
    }
    assert!(DurableSigner::open(dir.path(), 7777, key)
        .err()
        .unwrap()
        .to_string()
        .contains("newer"));
}

fn legacy_sqlite(db: &Connection, version: u32) {
    db.execute_batch(
        "PRAGMA journal_mode=WAL;
         CREATE TABLE meta(key TEXT PRIMARY KEY, value INTEGER NOT NULL);
         INSERT INTO meta VALUES ('height',99),('log_offset',123),('logs',1),('transactions',1),('skipped_blocks',7);
         CREATE TABLE blocks(height INTEGER PRIMARY KEY,hash TEXT UNIQUE NOT NULL,json TEXT NOT NULL);
         CREATE TABLE transactions(hash TEXT PRIMARY KEY,height INTEGER NOT NULL,position INTEGER NOT NULL,
            sender TEXT NOT NULL,recipient TEXT,raw TEXT NOT NULL,receipt TEXT NOT NULL);
         INSERT INTO transactions VALUES ('tx1',99,0,'sender','recipient','preserve signed bytes','preserve receipt');
         CREATE VIRTUAL TABLE logs USING fts5(timestamp_ms UNINDEXED,level,event,record);
         INSERT INTO logs VALUES(1,'info','old_event','{\"timestamp_ms\":1}');"
    ).unwrap();
    db.execute(
        "INSERT INTO blocks VALUES(99,'b99',?1)",
        [json!({"height":99,"transactions":1}).to_string()],
    )
    .unwrap();
    db.pragma_update(None, "user_version", version).unwrap();
}

#[test]
fn sqlite_upgrades_unversioned_and_v1_preserving_rows_cursors_and_wal() {
    for version in [0, 1] {
        let dir = tempfile::tempdir().unwrap();
        let config = common::config(dir.path());
        let data = config.data_dir.clone();
        let node = Arc::new(Mutex::new(
            Node::open(config, Application::default()).unwrap(),
        ));
        let db = Connection::open(data.join("index.sqlite")).unwrap();
        legacy_sqlite(&db, version);
        for _ in 0..2 {
            let index = Indexer::start(node.clone(), data.clone()).unwrap();
            assert_eq!(
                db.query_row("PRAGMA user_version", [], |r| r.get::<_, u32>(0))
                    .unwrap(),
                SQLITE_VERSION
            );
            assert_eq!(
                db.query_row("PRAGMA journal_mode", [], |r| r.get::<_, String>(0))
                    .unwrap(),
                "wal"
            );
            assert_eq!(
                db.query_row(
                    "SELECT transaction_count FROM blocks WHERE height=99",
                    [],
                    |r| r.get::<_, u64>(0)
                )
                .unwrap(),
                1
            );
            assert_eq!(
                db.query_row("SELECT raw FROM transactions", [], |r| r
                    .get::<_, String>(0))
                    .unwrap(),
                "preserve signed bytes"
            );
            assert_eq!(
                db.query_row("SELECT receipt FROM transactions", [], |r| r
                    .get::<_, String>(0))
                    .unwrap(),
                "preserve receipt"
            );
            assert_eq!(
                db.query_row("SELECT value FROM meta WHERE key='log_offset'", [], |r| r
                    .get::<_, u64>(
                    0
                ))
                .unwrap(),
                123
            );
            assert_eq!(
                db.query_row(
                    "SELECT count(*) FROM logs WHERE logs MATCH 'old_event'",
                    [],
                    |r| r.get::<_, u64>(0)
                )
                .unwrap(),
                1
            );
            drop(index);
        }
    }
}

#[test]
fn sqlite_failed_backfill_rolls_back_ddl_and_version_then_retries() {
    let dir = tempfile::tempdir().unwrap();
    let config = common::config(dir.path());
    let data = config.data_dir.clone();
    let node = Arc::new(Mutex::new(
        Node::open(config, Application::default()).unwrap(),
    ));
    let db = Connection::open(data.join("index.sqlite")).unwrap();
    legacy_sqlite(&db, 0);
    db.execute("UPDATE blocks SET json='malformed'", [])
        .unwrap();
    assert!(Indexer::start(node.clone(), data.clone()).is_err());
    assert_eq!(
        db.query_row("PRAGMA user_version", [], |r| r.get::<_, u32>(0))
            .unwrap(),
        0
    );
    assert!(db.prepare("SELECT transaction_count FROM blocks").is_err());
    db.execute("UPDATE blocks SET json='{\"transactions\":1}'", [])
        .unwrap();
    drop(Indexer::start(node.clone(), data.clone()).unwrap());
    db.pragma_update(None, "user_version", 999).unwrap();
    assert!(Indexer::start(node, data)
        .err()
        .unwrap()
        .to_string()
        .contains("newer"));
    assert_eq!(
        db.query_row("PRAGMA user_version", [], |r| r.get::<_, u32>(0))
            .unwrap(),
        999
    );
    assert_eq!(
        db.query_row("SELECT count(*) FROM transactions", [], |r| r
            .get::<_, u64>(0))
            .unwrap(),
        1
    );
}
