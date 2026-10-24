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

fn open_db(path: impl AsRef<std::path::Path>) -> Result<DB, rocksdb::Error> {
    let path = path.as_ref();
    let mut options = rocksdb::Options::default();
    options.create_if_missing(true);
    if path.join("CURRENT").exists() {
        let names = DB::list_cf(&options, path)?;
        DB::open_cf(&options, path, names)
    } else {
        DB::open(&options, path)
    }
}

#[test]
fn protocol_one_databases_are_rejected_without_rewriting_records() {
    let dir = tempfile::tempdir().unwrap();
    let path = dir.path().join("rocksdb");
    {
        let db = open_db(&path).unwrap();
        db.put(b"genesis", b"{\"chain_id\":7777}").unwrap();
        db.put(b"world", b"old protocol state").unwrap();
        db.put(VERSION, b"1").unwrap();
    }
    let error = Store::open(dir.path(), Retention::Archive, &common::genesis())
        .err()
        .unwrap();
    assert!(error.to_string().contains("protocol-v3"));
    let db = open_db(&path).unwrap();
    assert_eq!(db.get(b"world").unwrap().unwrap(), b"old protocol state");
    assert_eq!(db.get(VERSION).unwrap().unwrap(), b"1");
    assert!(db.get(b"meta/protocol_version").unwrap().is_none());

    let node_home = tempfile::tempdir().unwrap();
    let config = common::config(node_home.path());
    let data = config.data_dir.clone();
    let node = Arc::new(Mutex::new(
        Node::open(config, Application::default()).unwrap(),
    ));
    let db = Connection::open(data.join("index.sqlite")).unwrap();
    db.execute_batch(
        "CREATE TABLE blocks(height INTEGER PRIMARY KEY,json TEXT);
        INSERT INTO blocks VALUES(1,'old protocol block');
        PRAGMA user_version=2;",
    )
    .unwrap();
    assert!(Indexer::start(node, data)
        .err()
        .unwrap()
        .to_string()
        .contains("legacy SQLite"));
    assert_eq!(
        db.query_row("SELECT json FROM blocks", [], |r| r.get::<_, String>(0))
            .unwrap(),
        "old protocol block"
    );
}

#[test]
fn init_refuses_legacy_home_before_writing_new_files() {
    let dir = tempfile::tempdir().unwrap();
    let old = dir.path().join("config.json");
    std::fs::write(&old, b"preserve old config").unwrap();
    let result = std::process::Command::new(env!("CARGO_BIN_EXE_sfc"))
        .args(["init", "--home"])
        .arg(dir.path())
        .output()
        .unwrap();
    assert!(!result.status.success());
    assert!(String::from_utf8_lossy(&result.stderr).contains("preserve this home"));
    assert_eq!(std::fs::read(&old).unwrap(), b"preserve old config");
    assert_eq!(std::fs::read_dir(dir.path()).unwrap().count(), 1);
}

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
        let db = open_db(home.join("rocksdb")).unwrap();
        let mut batch = WriteBatch::default();
        batch.delete(VERSION);
        batch.put(b"world", sfc::codec::to_vec(&world).unwrap());
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
        let db = open_db(&path).unwrap();
        encoded_block = db
            .get_cf(
                db.cf_handle("blocks").unwrap(),
                format!("block/{:020}", block.height()),
            )
            .unwrap()
            .unwrap();
        let mut batch = WriteBatch::default();
        batch.delete(VERSION);
        batch.put(b"world", sfc::codec::to_vec(&world).unwrap());
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
    let db = open_db(&path).unwrap();
    assert_eq!(
        db.get_cf(
            db.cf_handle("blocks").unwrap(),
            format!("block/{:020}", block.height())
        )
        .unwrap()
        .unwrap(),
        encoded_block
    );
    let metadata: sfc::types::World =
        sfc::codec::from_slice(&db.get(b"world").unwrap().unwrap()).unwrap();
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
        let db = open_db(&path).unwrap();
        db.put(VERSION, sfc::codec::to_vec(&999u32).unwrap())
            .unwrap();
    }
    assert!(Store::open(dir.path(), Retention::Archive, &genesis)
        .err()
        .unwrap()
        .to_string()
        .contains("newer"));
    let world;
    {
        let db = open_db(&path).unwrap();
        assert_eq!(
            sfc::codec::from_slice::<u32>(&db.get(VERSION).unwrap().unwrap()).unwrap(),
            999
        );
        db.delete(VERSION).unwrap();
        world = db.get(b"world").unwrap().unwrap();
        db.put(b"world", b"broken").unwrap();
    }
    assert!(Store::open(dir.path(), Retention::Archive, &genesis).is_err());
    {
        let db = open_db(&path).unwrap();
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
        let db = open_db(dir.path()).unwrap();
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
        let db = open_db(dir.path()).unwrap();
        assert_eq!(
            sfc::codec::from_slice::<u32>(&db.get(VERSION).unwrap().unwrap()).unwrap(),
            SIGNER_VERSION
        );
        db.put(VERSION, sfc::codec::to_vec(&999u32).unwrap())
            .unwrap();
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
         CREATE TABLE blocks(height INTEGER PRIMARY KEY,hash TEXT UNIQUE NOT NULL,record BLOB NOT NULL);
         CREATE TABLE transactions(hash TEXT PRIMARY KEY,height INTEGER NOT NULL,position INTEGER NOT NULL,
            sender TEXT NOT NULL,recipient TEXT,raw BLOB NOT NULL,receipt BLOB NOT NULL);
         INSERT INTO transactions VALUES ('tx1',99,0,'sender','recipient',CAST('preserve signed bytes' AS BLOB),CAST('preserve receipt' AS BLOB));
         CREATE VIRTUAL TABLE logs USING fts5(timestamp_ms UNINDEXED,level,event,message,record UNINDEXED);
         INSERT INTO logs VALUES(1,'info','old_event','old event',NULL);"
    ).unwrap();
    db.execute(
        "INSERT INTO blocks VALUES(99,'b99',?1)",
        [sfc::codec::to_vec(&json!({"height":99,"transactions":1})).unwrap()],
    )
    .unwrap();
    if version == 2 {
        db.execute_batch("ALTER TABLE blocks ADD COLUMN transaction_count INTEGER NOT NULL DEFAULT 0; UPDATE blocks SET transaction_count=1; CREATE INDEX populated_blocks ON blocks(height DESC) WHERE transaction_count>0;").unwrap();
    }
    db.pragma_update(None, "application_id", 0x53464333)
        .unwrap();
    db.pragma_update(None, "user_version", version).unwrap();
}

#[test]
fn sqlite_upgrades_all_older_versions_preserving_rows_cursors_and_wal() {
    for version in [0, 1, 2] {
        let dir = tempfile::tempdir().unwrap();
        let mut config = common::config(dir.path());
        // Migration preservation is independent of the live retention worker.
        config.retention = sfc::config::Retention::Archive;
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
                    .get::<_, Vec<u8>>(0))
                    .unwrap(),
                b"preserve signed bytes"
            );
            assert_eq!(
                db.query_row("SELECT receipt FROM transactions", [], |r| r
                    .get::<_, Vec<u8>>(0))
                    .unwrap(),
                b"preserve receipt"
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
    db.execute("UPDATE blocks SET record=X'00'", []).unwrap();
    assert!(Indexer::start(node.clone(), data.clone()).is_err());
    assert_eq!(
        db.query_row("PRAGMA user_version", [], |r| r.get::<_, u32>(0))
            .unwrap(),
        0
    );
    assert!(db.prepare("SELECT transaction_count FROM blocks").is_err());
    db.execute(
        "UPDATE blocks SET record=?1",
        [sfc::codec::to_vec(&json!({"transactions":1})).unwrap()],
    )
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

#[test]
fn typed_metadata_upgrade_preserves_v3_commitments_and_signer_guard() {
    let home = tempfile::tempdir().unwrap();
    let genesis = common::genesis();
    let store = Store::open(home.path(), Retention::Archive, &genesis).unwrap();
    let original = store.head().unwrap();
    let root = store.world().unwrap().root();
    drop(store);
    {
        let db = open_db(home.path().join("rocksdb")).unwrap();
        db.put(
            b"genesis",
            sfc::codec::to_vec(&serde_json::to_value(&genesis).unwrap()).unwrap(),
        )
        .unwrap();
        db.put(b"head", sfc::codec::to_vec(&json!(0)).unwrap())
            .unwrap();
        db.put(VERSION, sfc::codec::to_vec(&json!(1)).unwrap())
            .unwrap();
    }
    for _ in 0..2 {
        let store = Store::open(home.path(), Retention::Archive, &genesis).unwrap();
        assert_eq!(store.head().unwrap().as_bytes(), original.as_bytes());
        assert_eq!(store.world().unwrap().root(), root);
    }
    let signer_home = home.path().join("signer");
    let key = SigningKey::from_bytes(&[7; 32]);
    let validator = key.verifying_key().to_bytes();
    let mut signer = DurableSigner::open(&signer_home, 7777, key.clone()).unwrap();
    let vote = signer
        .sign(1, 0, Phase::Precommit, Some(original.hash()))
        .unwrap();
    drop(signer);
    {
        let db = open_db(&signer_home).unwrap();
        db.put(
            b"identity",
            sfc::codec::to_vec(&json!([7777, validator])).unwrap(),
        )
        .unwrap();
        db.put(
            b"last_vote",
            sfc::codec::to_vec(&serde_json::to_value(&vote).unwrap()).unwrap(),
        )
        .unwrap();
        db.put(VERSION, sfc::codec::to_vec(&json!(1)).unwrap())
            .unwrap();
    }
    let mut signer = DurableSigner::open(&signer_home, 7777, key).unwrap();
    assert_eq!(
        signer
            .sign(1, 0, Phase::Precommit, Some(original.hash()))
            .unwrap(),
        vote
    );
    assert!(signer.sign(1, 0, Phase::Precommit, Some([0; 32])).is_err());
}

#[test]
fn configuration_upgrade_is_atomic_idempotent_and_rejects_future_version() {
    let home = tempfile::tempdir().unwrap();
    let config = common::config(home.path());
    let path = home.path().join("config.capnp");
    let before = serde_json::to_value(&config).unwrap();
    std::fs::write(&path, sfc::codec::to_vec(&before).unwrap()).unwrap();
    for _ in 0..2 {
        let restored: sfc::config::Config = sfc::codec::upgrade_file(&path).unwrap();
        assert_eq!(serde_json::to_value(restored).unwrap(), before);
    }
    let mut message = capnp::message::Builder::new_default();
    let mut root = message.init_root::<sfc::runtime_capnp::record::Builder>();
    root.set_magic(0x5346435245433031);
    root.set_version(999);
    root.init_config();
    let future = capnp::serialize::write_message_to_words(&message);
    std::fs::write(&path, &future).unwrap();
    assert!(sfc::codec::upgrade_file::<sfc::config::Config>(&path).is_err());
    assert_eq!(std::fs::read(path).unwrap(), future);
}

#[test]
fn rejected_older_protocol_does_not_upgrade_genesis_file() {
    let home = tempfile::tempdir().unwrap();
    let config = common::config(home.path());
    let original = sfc::codec::to_vec(&serde_json::to_value(common::genesis()).unwrap()).unwrap();
    std::fs::write(&config.genesis, &original).unwrap();
    let store = Store::open(&config.data_dir, Retention::Archive, &common::genesis()).unwrap();
    drop(store);
    {
        let db = open_db(config.data_dir.join("rocksdb")).unwrap();
        db.put(b"meta/protocol_version", 2u32.to_le_bytes())
            .unwrap();
    }
    let genesis_path = config.genesis.clone();
    assert!(Node::open(config, Application::default())
        .err()
        .unwrap()
        .to_string()
        .contains("protocol-v3"));
    assert_eq!(std::fs::read(genesis_path).unwrap(), original);
}

#[test]
fn compact_receipt_index_upgrade_reads_legacy_and_new_receipts() {
    let home = tempfile::tempdir().unwrap();
    let genesis = common::genesis();
    let store = Store::open(home.path(), Retention::Archive, &genesis).unwrap();
    let first_tx = common::transfer(0);
    let (first, world) = Application::default()
        .execute_block(
            &store.head().unwrap(),
            &store.world().unwrap(),
            genesis.timestamp + 1,
            genesis.gas_limit,
            std::slice::from_ref(&first_tx),
        )
        .unwrap();
    store.commit(&first, &world).unwrap();
    drop(store);
    let binary_key = |hash: &[u8]| [b"tx/".as_slice(), hash].concat();
    let legacy_key = format!("tx/{}", hex::encode(first_tx.hash));
    {
        let db = open_db(home.path().join("rocksdb")).unwrap();
        let mut batch = WriteBatch::default();
        batch.delete(binary_key(&first_tx.hash));
        batch.put(&legacy_key, sfc::codec::to_vec(&first.height()).unwrap());
        batch.put(VERSION, sfc::codec::to_vec(&2u32).unwrap());
        db.write(batch).unwrap();
    }
    let store = Store::open(home.path(), Retention::Archive, &genesis).unwrap();
    assert_eq!(
        store.receipt_block(&first_tx.hash).unwrap(),
        Some(first.clone())
    );
    let second_tx = common::transfer(1);
    let (second, next_world) = Application::default()
        .execute_block(
            &first,
            &world,
            genesis.timestamp + 2,
            genesis.gas_limit,
            std::slice::from_ref(&second_tx),
        )
        .unwrap();
    store.commit(&second, &next_world).unwrap();
    assert_eq!(
        store.receipt_block(&second_tx.hash).unwrap(),
        Some(second.clone())
    );
    drop(store);
    {
        let db = open_db(home.path().join("rocksdb")).unwrap();
        assert!(db.get(&legacy_key).unwrap().is_some());
        assert_eq!(
            db.get(binary_key(&second_tx.hash)).unwrap().unwrap(),
            2u64.to_le_bytes()
        );
        assert!(db
            .get(format!("tx/{}", hex::encode(second_tx.hash)))
            .unwrap()
            .is_none());
        assert_eq!(
            sfc::codec::from_slice::<u32>(&db.get(VERSION).unwrap().unwrap()).unwrap(),
            ROCKSDB_VERSION
        );
    }
    let store = Store::open(home.path(), Retention::Archive, &genesis).unwrap();
    assert_eq!(store.receipt_block(&first_tx.hash).unwrap(), Some(first));
    assert_eq!(store.receipt_block(&second_tx.hash).unwrap(), Some(second));
    assert_eq!(store.world().unwrap(), next_world);
}

#[test]
fn block_column_family_migration_resumes_after_partial_move() {
    for moved_count in [0, 4] {
        let home = tempfile::tempdir().unwrap();
        let genesis = common::genesis();
        let store = Store::open(home.path(), Retention::Archive, &genesis).unwrap();
        let mut blocks = vec![store.head().unwrap()];
        let mut world = store.world().unwrap();
        for nonce in 0..20 {
            let (block, next) = Application::default()
                .execute_block(
                    blocks.last().unwrap(),
                    &world,
                    genesis.timestamp + nonce + 1,
                    genesis.gas_limit,
                    &[common::transfer(nonce)],
                )
                .unwrap();
            store.commit(&block, &next).unwrap();
            world = next;
            blocks.push(block);
        }
        drop(store);
        // Simulate a v3 database interrupted after moving only its first four blocks.
        // Each remaining block exists in exactly one CF, and v4 is not yet published.
        {
            let mut db = open_db(home.path().join("rocksdb")).unwrap();
            let cf = db.cf_handle("blocks").unwrap();
            let mut batch = WriteBatch::default();
            for block in blocks.iter().skip(moved_count) {
                let key = format!("block/{:020}", block.height());
                batch.put(&key, block.as_bytes());
                batch.delete_cf(cf, &key);
            }
            batch.put(VERSION, sfc::codec::to_vec(&3u32).unwrap());
            let mut options = rocksdb::WriteOptions::default();
            options.set_sync(true);
            db.write_opt(batch, &options).unwrap();
            if moved_count == 0 {
                db.drop_cf("blocks").unwrap();
            }
        }
        for _ in 0..2 {
            let store = Store::open(home.path(), Retention::Archive, &genesis).unwrap();
            assert_eq!(store.blocks().unwrap(), blocks);
            assert_eq!(store.world().unwrap(), world);
            assert_eq!(
                store.statistics().unwrap()["schema_version"],
                ROCKSDB_VERSION
            );
            for nonce in 0..20 {
                assert_eq!(
                    store.receipt_block(&common::transfer(nonce).hash).unwrap(),
                    Some(blocks[nonce as usize + 1].clone())
                );
            }
        }
        let db = open_db(home.path().join("rocksdb")).unwrap();
        assert!(!db
            .prefix_iterator(b"block/")
            .next()
            .is_some_and(|r| r.unwrap().0.starts_with(b"block/")));
    }
}
