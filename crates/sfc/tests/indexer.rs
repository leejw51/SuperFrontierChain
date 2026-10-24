mod common;
use serde_json::{json, Value};
use sfc::{
    framework::Application,
    indexer::{self, Indexer, Query},
    node::Node,
    types::hex_hash,
};
use std::{
    fs::OpenOptions,
    io::Write,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

fn query(data: &std::path::Path, kind: &str, q: &str) -> Value {
    indexer::search(
        data,
        &Query {
            kind: kind.into(),
            q: q.into(),
            ..Default::default()
        },
    )
    .unwrap()
}

fn wait(mut condition: impl FnMut() -> bool) {
    let deadline = Instant::now() + Duration::from_secs(10);
    while !condition() {
        assert!(Instant::now() < deadline, "indexer timed out");
        std::thread::sleep(Duration::from_millis(20));
    }
}

#[test]
fn indexer_catches_up_while_execution_mutex_is_held() {
    let dir = tempfile::tempdir().unwrap();
    let config = common::config(dir.path());
    let data = config.data_dir.clone();
    let node = Arc::new(Mutex::new(
        Node::open(config, Application::default()).unwrap(),
    ));
    let _index = Indexer::start(node.clone(), data.clone()).unwrap();
    let mut execution = node.lock().unwrap();
    execution.submit(&common::transfer(0).raw).unwrap();
    execution.produce(1_000_002).unwrap();
    // Keep the guard until after catch-up: reads and validation must use Store's
    // snapshot, without waiting for this execution lock to become available.
    wait(|| query(&data, "blocks", "")["indexedHeight"] == 1);
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 1);
    drop(execution);
}

#[test]
fn sqlite_write_lock_does_not_block_commit_and_notifications_coalesce() {
    let dir = tempfile::tempdir().unwrap();
    let config = common::config(dir.path());
    let data = config.data_dir.clone();
    let node = Arc::new(Mutex::new(
        Node::open(config, Application::default()).unwrap(),
    ));
    let index = Indexer::start(node.clone(), data.clone()).unwrap();
    wait(|| query(&data, "blocks", "")["indexedHeight"] == 0);
    let db = rusqlite::Connection::open(data.join("index.sqlite")).unwrap();
    db.execute_batch("BEGIN IMMEDIATE").unwrap();
    let producer = node.clone();
    let (sent, received) = std::sync::mpsc::channel();
    let thread = std::thread::spawn(move || {
        let mut node = producer.lock().unwrap();
        for nonce in 0..40 {
            node.submit(&common::transfer(nonce).raw).unwrap();
            node.produce(1_000_002 + nonce).unwrap();
        }
        sent.send(()).unwrap();
    });
    let result = received.recv_timeout(Duration::from_secs(2));
    db.execute_batch("ROLLBACK").unwrap();
    thread.join().unwrap();
    result.expect("block commits waited for SQLite to release its write lock");
    wait(|| query(&data, "blocks", "")["indexedHeight"] == 40);
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 40);
    drop(index);
    let _restarted = Indexer::start(node, data.clone()).unwrap();
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 40);
}

#[test]
fn catchup_batches_roll_back_rows_and_cursors_together_and_resume() {
    let dir = tempfile::tempdir().unwrap();
    let config = common::config(dir.path());
    let data = config.data_dir.clone();
    let node = Arc::new(Mutex::new(
        Node::open(config, Application::default()).unwrap(),
    ));
    let index = Indexer::start(node.clone(), data.clone()).unwrap();
    wait(|| query(&data, "blocks", "")["indexedHeight"] == 0);
    drop(index);
    {
        let mut node = node.lock().unwrap();
        for nonce in 0..40 {
            node.submit(&common::transfer(nonce).raw).unwrap();
            node.produce(1_000_002 + nonce).unwrap();
        }
    }
    let db = rusqlite::Connection::open(data.join("index.sqlite")).unwrap();
    db.execute_batch(
        "CREATE TRIGGER fail_index BEFORE INSERT ON blocks WHEN NEW.height=20
         BEGIN SELECT RAISE(ABORT, 'injected index failure'); END;",
    )
    .unwrap();
    let index = Indexer::start(node.clone(), data.clone()).unwrap();
    wait(|| data.join("index-error.log").exists());
    let state = query(&data, "blocks", "");
    assert_eq!(state["indexedHeight"], 16);
    assert_eq!(state["indexedTransactions"], 16);
    assert_eq!(
        db.query_row("SELECT count(*) FROM blocks", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        17
    );
    assert_eq!(
        db.query_row("SELECT count(*) FROM transactions", [], |r| r
            .get::<_, i64>(0))
            .unwrap(),
        16
    );
    drop(index);
    db.execute_batch("DROP TRIGGER fail_index").unwrap();
    let _index = Indexer::start(node, data.clone()).unwrap();
    wait(|| query(&data, "blocks", "")["indexedHeight"] == 40);
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 40);
    assert_eq!(
        db.query_row("SELECT count(DISTINCT hash) FROM transactions", [], |r| r
            .get::<_, i64>(
            0
        ))
        .unwrap(),
        40
    );
    assert_eq!(
        db.query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
            .unwrap(),
        "ok"
    );
}

#[test]
fn wal_search_restart_and_concurrent_reader_preserve_exact_records() {
    let dir = tempfile::tempdir().unwrap();
    let config = common::config(dir.path());
    let data = config.data_dir.clone();
    let node = Arc::new(Mutex::new(
        Node::open(config, Application::default()).unwrap(),
    ));
    std::fs::create_dir_all(data.join("logs")).unwrap();
    let mut log = OpenOptions::new()
        .create(true)
        .append(true)
        .open(data.join("logs/node.capnp"))
        .unwrap();
    // Ancient indexed logs remain available independently of chain retention.
    let log_time = 1u64;
    sfc::codec::write_record(&mut log, &sfc::codec::to_vec(&json!({"timestamp_ms":log_time,"level":"info","event":"recovery_complete","fields":{"message":"worker healthy <script>"}})).unwrap()).unwrap();
    let tx = common::transfer(0);
    let hash = hex_hash(&tx.hash);
    {
        let mut node = node.lock().unwrap();
        node.submit(&tx.raw).unwrap();
        node.produce(1_000_002).unwrap();
    }
    let index = Indexer::start(node.clone(), data.clone()).unwrap();
    wait(|| query(&data, "logs", "")["indexedHeight"] == 1);
    let logs = query(&data, "logs", "recov");
    assert_eq!(logs["journalMode"], "wal");
    assert_eq!(logs["indexedLogs"], 1);
    assert_eq!(logs["rows"].as_array().unwrap().len(), 1);
    assert_eq!(query(&data, "logs", "\" OR 1=1 --")["rows"], json!([]));
    let transaction = query(&data, "transactions", &hash);
    assert_eq!(transaction["rows"][0]["hash"], hash);
    assert_eq!(transaction["rows"][0]["receipt"]["success"], true);
    assert!(query(&data, "receipts", &hash)["rows"][0]["raw"].is_null());
    assert_eq!(
        query(&data, "transactions", &format!("{:#x}", common::sender()))["rows"]
            .as_array()
            .unwrap()
            .len(),
        1
    );
    let block = query(&data, "blocks", "1");
    assert_eq!(block["rows"][0]["gasUsed"], 21000);
    assert_eq!(
        query(&data, "blocks", block["rows"][0]["hash"].as_str().unwrap())["rows"],
        block["rows"]
    );
    let reader = rusqlite::Connection::open(data.join("index.sqlite")).unwrap();
    reader
        .execute_batch("BEGIN; SELECT * FROM blocks;")
        .unwrap();
    node.lock().unwrap().produce(1_000_003).unwrap();
    wait(|| query(&data, "blocks", "")["indexedHeight"] == 2);
    // A WAL reader retains its snapshot while the writer advances.
    assert_eq!(
        reader
            .query_row("SELECT max(height) FROM blocks", [], |r| r.get::<_, i64>(0))
            .unwrap(),
        1
    );
    reader.execute_batch("COMMIT").unwrap();
    drop(index);
    let mut frame = Vec::new();
    sfc::codec::write_record(
        &mut frame,
        &sfc::codec::to_vec(
            &json!({"timestamp_ms":log_time + 1,"level":"warn","event":"restart_check"}),
        )
        .unwrap(),
    )
    .unwrap();
    log.write_all(&frame[..4]).unwrap();
    node.lock().unwrap().produce(1_000_004).unwrap();
    let _index = Indexer::start(node, data.clone()).unwrap();
    wait(|| query(&data, "logs", "")["indexedHeight"] == 3);
    let partial = query(&data, "logs", "");
    assert_eq!(partial["indexedLogs"], 1);
    assert!(partial["error"].is_null());
    log.write_all(&frame[4..]).unwrap();
    wait(|| query(&data, "logs", "")["indexedLogs"] == 2);
    let all = query(&data, "logs", "");
    assert_eq!(all["indexedTransactions"], 1);
    assert_eq!(all["rows"].as_array().unwrap().len(), 2);
    let page = indexer::search(
        &data,
        &Query {
            before: Some(all["rows"][0]["id"].as_u64().unwrap()),
            ..Default::default()
        },
    )
    .unwrap();
    assert_eq!(page["rows"].as_array().unwrap().len(), 1);
}

#[test]
fn explorer_preserves_empty_blocks_and_pages_transactions_without_gaps() {
    let dir = tempfile::tempdir().unwrap();
    let config = common::config(dir.path());
    let data = config.data_dir.clone();
    let node = Arc::new(Mutex::new(
        Node::open(config, Application::default()).unwrap(),
    ));
    {
        let mut n = node.lock().unwrap();
        n.submit(&common::transfer(0).raw).unwrap();
        n.submit(&common::transfer(1).raw).unwrap();
        n.produce(1_000_002).unwrap();
        n.submit(&common::transfer(2).raw).unwrap();
        n.produce(1_000_003).unwrap();
        n.produce(1_000_004).unwrap();
    }
    let _index = Indexer::start(node.clone(), data.clone()).unwrap();
    wait(|| query(&data, "blocks", "3")["indexedHeight"] == 3);
    assert_eq!(
        query(&data, "blocks", "3")["rows"][0]["transactionCount"],
        0
    );
    assert_eq!(query(&data, "transactions", "3")["rows"], json!([]));
    let populated = query(&data, "blocks_with_transactions", "");
    assert_eq!(
        populated["rows"]
            .as_array()
            .unwrap()
            .iter()
            .map(|block| block["height"].as_u64().unwrap())
            .collect::<Vec<_>>(),
        vec![2, 1]
    );
    assert_eq!(populated["rows"][0]["transactionCount"], 1);
    assert_eq!(
        query(&data, "blocks", "1")["rows"][0]["transactionCount"],
        2
    );
    let first = indexer::search(
        &data,
        &Query {
            kind: "transactions".into(),
            limit: Some(1),
            ..Default::default()
        },
    )
    .unwrap();
    assert_eq!(first["rows"][0]["transaction"]["nonce"], "2");
    assert_eq!(first["rows"][0]["transaction"]["valueWei"], "10");
    assert_eq!(first["rows"][0]["transaction"]["chainId"], "7777");
    assert_eq!(first["rows"][0]["transaction"]["input"], "0x");
    // A newer commit must not shift the cursor or duplicate a row on later pages.
    node.lock()
        .unwrap()
        .submit(&common::transfer(3).raw)
        .unwrap();
    node.lock().unwrap().produce(1_000_005).unwrap();
    wait(|| query(&data, "blocks", "4")["indexedHeight"] == 4);
    let mut next = first["next"].clone();
    let mut positions = vec![(2, 0)];
    while !next.is_null() {
        let page = indexer::search(
            &data,
            &Query {
                kind: "transactions".into(),
                limit: Some(1),
                before_height: next["before_height"].as_u64(),
                before_position: next["before_position"].as_u64().map(|n| n as u32),
                ..Default::default()
            },
        )
        .unwrap();
        for row in page["rows"].as_array().unwrap() {
            positions.push((
                row["height"].as_u64().unwrap(),
                row["position"].as_u64().unwrap(),
            ));
        }
        next = page["next"].clone();
    }
    assert_eq!(positions, vec![(2, 0), (1, 1), (1, 0)]);
}

#[test]
fn chain_pruning_preserves_sqlite_transactions_receipts_and_logs_after_restart() {
    let dir = tempfile::tempdir().unwrap();
    let mut config = common::config(dir.path());
    config.retention = sfc::config::Retention::Pruned { seconds: 2 };
    let data = config.data_dir.clone();
    let node = Arc::new(Mutex::new(
        Node::open(config, Application::default()).unwrap(),
    ));
    std::fs::create_dir_all(data.join("logs")).unwrap();
    let mut log = std::fs::File::create(data.join("logs/node.capnp")).unwrap();
    sfc::codec::write_record(
        &mut log,
        &sfc::codec::to_vec(&json!({
            "timestamp_ms": 1, "level": "info", "event": "ancient", "fields": {}
        }))
        .unwrap(),
    )
    .unwrap();
    let index = Indexer::start(node.clone(), data.clone()).unwrap();
    {
        let mut n = node.lock().unwrap();
        n.submit(&common::transfer(0).raw).unwrap();
        n.produce(1_000_001).unwrap();
    }
    wait(|| query(&data, "transactions", "")["indexedTransactions"] == 1);
    {
        let mut n = node.lock().unwrap();
        n.produce(1_000_004).unwrap();
        n.store.maintain().unwrap();
    }
    wait(|| query(&data, "blocks", "")["indexedHeight"] == 2);
    assert!(node.lock().unwrap().store.block(1).unwrap().is_none());
    let hash = hex_hash(&common::transfer(0).hash);
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 1);
    assert_eq!(query(&data, "receipts", &hash)["rows"][0]["hash"], hash);
    assert_eq!(query(&data, "logs", "ancient")["indexedLogs"], 1);
    drop(index);
    drop(node);
    let mut config = common::config(dir.path());
    config.retention = sfc::config::Retention::Pruned { seconds: 2 };
    let node = Arc::new(Mutex::new(
        Node::open(config, Application::default()).unwrap(),
    ));
    let _index = Indexer::start(node.clone(), data.clone()).unwrap();
    node.lock().unwrap().produce(1_000_010).unwrap();
    wait(|| query(&data, "blocks", "")["indexedHeight"] == 3);
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 1);
    assert_eq!(query(&data, "receipts", &hash)["rows"][0]["hash"], hash);
    assert_eq!(query(&data, "logs", "ancient")["indexedLogs"], 1);
    let db = rusqlite::Connection::open(data.join("index.sqlite")).unwrap();
    assert_eq!(
        db.query_row("SELECT count(*) FROM transactions", [], |r| r
            .get::<_, u64>(0))
            .unwrap(),
        1
    );
    assert_eq!(
        db.query_row("SELECT min(height) FROM blocks", [], |r| r.get::<_, u64>(0))
            .unwrap(),
        0
    );
    assert_eq!(
        db.query_row("PRAGMA journal_mode", [], |r| r.get::<_, String>(0))
            .unwrap(),
        "wal"
    );
    assert_eq!(
        db.query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
            .unwrap(),
        "ok"
    );
}

#[test]
fn direct_sqlite_writes_before_return_and_retries_without_undoing_chain() {
    let dir = tempfile::tempdir().unwrap();
    let mut config = common::config(dir.path());
    config.retention = sfc::config::Retention::Pruned { seconds: 2 };
    let data = config.data_dir.clone();
    let mut node = Node::open(config.clone(), Application::default()).unwrap();
    node.enable_direct_indexer(1).unwrap();
    node.submit(&common::transfer(0).raw).unwrap();
    node.produce(1_000_001).unwrap();
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 1);
    assert_eq!(query(&data, "blocks", "")["indexedHeight"], 1);
    let db = rusqlite::Connection::open(data.join("index.sqlite")).unwrap();
    db.execute_batch("CREATE TRIGGER fail_direct BEFORE INSERT ON blocks WHEN NEW.height=2 BEGIN SELECT RAISE(ABORT, 'injected direct failure'); END;").unwrap();
    node.submit(&common::transfer(1).raw).unwrap();
    let committed = node.produce(1_000_002).unwrap();
    assert_eq!(committed.height(), 2);
    assert_eq!(node.store.head().unwrap(), committed);
    assert!(data.join("index-error.log").exists());
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 1);
    db.execute_batch("DROP TRIGGER fail_direct").unwrap();
    node.produce(1_000_003).unwrap();
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 2);
    assert!(!data.join("index-error.log").exists());
    node.produce(1_000_010).unwrap();
    assert!(node.store.block(1).unwrap().is_none());
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 2);
    drop(node);
    let metrics: Value =
        serde_json::from_slice(&std::fs::read(data.join("sqlite-write-profile.json")).unwrap())
            .unwrap();
    assert_eq!(metrics["transactions"], 2);
    assert_eq!(metrics["errors"], 1);
    let mut reopened = Node::open(config, Application::default()).unwrap();
    reopened.enable_direct_indexer(1).unwrap();
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 2);
}

#[test]
fn direct_sqlite_batches_are_atomic_and_flush_on_shutdown() {
    let dir = tempfile::tempdir().unwrap();
    let config = common::config(dir.path());
    let data = config.data_dir.clone();
    let mut node = Node::open(config, Application::default()).unwrap();
    node.enable_direct_indexer(16).unwrap();
    node.submit(&common::transfer(0).raw).unwrap();
    node.produce(1_000_001).unwrap();
    // INSERT has executed on the node thread, but the batch is not yet published.
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 0);
    node.flush_direct_indexer().unwrap();
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 1);
    node.submit(&common::transfer(1).raw).unwrap();
    node.produce(1_000_002).unwrap();
    drop(node);
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 2);
}

#[test]
fn direct_sqlite_batch_failure_replays_all_uncommitted_blocks() {
    let dir = tempfile::tempdir().unwrap();
    let config = common::config(dir.path());
    let data = config.data_dir.clone();
    let mut node = Node::open(config, Application::default()).unwrap();
    node.enable_direct_indexer(16).unwrap();
    let db = rusqlite::Connection::open(data.join("index.sqlite")).unwrap();
    db.execute_batch("CREATE TRIGGER fail_batch BEFORE INSERT ON blocks WHEN NEW.height=2 BEGIN SELECT RAISE(ABORT, 'injected batch failure'); END;").unwrap();
    for nonce in 0..2 {
        node.submit(&common::transfer(nonce).raw).unwrap();
        node.produce(1_000_001 + nonce).unwrap();
    }
    assert!(data.join("index-error.log").exists());
    db.execute_batch("DROP TRIGGER fail_batch").unwrap();
    node.produce(1_000_003).unwrap();
    node.flush_direct_indexer().unwrap();
    assert_eq!(query(&data, "transactions", "")["indexedTransactions"], 2);
    assert_eq!(
        db.query_row("SELECT count(DISTINCT hash) FROM transactions", [], |r| r
            .get::<_, u64>(
            0
        ))
        .unwrap(),
        2
    );
    assert_eq!(query(&data, "blocks", "")["indexedHeight"], 3);
}
