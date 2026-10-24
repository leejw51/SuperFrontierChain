mod common;
use sfc::{config::Retention, framework::Application, storage::Store};

#[test]
fn archive_to_pruned_cleans_multiple_batches_and_repairs_projection() {
    let dir = tempfile::tempdir().unwrap();
    let genesis = common::genesis();
    let store = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
    let mut head = store.head().unwrap();
    let mut world = store.world().unwrap();
    for offset in 1..=520 {
        let (next, state) = Application::default()
            .execute_block(
                &head,
                &world,
                genesis.timestamp + offset,
                genesis.gas_limit,
                &[],
            )
            .unwrap();
        store.commit(&next, &state).unwrap();
        store.maintain().unwrap();
        head = next;
        world = state;
    }
    assert_eq!(store.blocks().unwrap().len(), 521);
    drop(store);
    let store = Store::open(dir.path(), Retention::Pruned { seconds: 2 }, &genesis).unwrap();
    assert_eq!(store.earliest_height().unwrap(), 518);
    assert_eq!(store.blocks().unwrap().len(), 3);
    assert_eq!(store.head().unwrap(), head);
    assert_eq!(store.world().unwrap().root(), world.root());
    let mut lines = 0;
    for entry in std::fs::read_dir(dir.path().join("history")).unwrap() {
        for block in sfc::codec::read_all::<sfc::types::Block>(
            &mut std::fs::File::open(entry.unwrap().path()).unwrap(),
        )
        .unwrap()
        {
            assert!(block.height() >= 518);
            lines += 1;
        }
    }
    assert_eq!(lines, 3);
    drop(store);
    let archive = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
    assert!(archive.block(1).unwrap().is_none()); // Switching back cannot resurrect history.
    assert_eq!(archive.head().unwrap(), head);
}

#[test]
fn zero_retention_is_rejected_by_storage() {
    let dir = tempfile::tempdir().unwrap();
    assert!(Store::open(
        dir.path(),
        Retention::Pruned { seconds: 0 },
        &common::genesis()
    )
    .is_err());
}

#[test]
fn short_history_segments_prune_and_restart_removes_boundary_excess() {
    let dir = tempfile::tempdir().unwrap();
    let genesis = common::genesis();
    let store = Store::open(dir.path(), Retention::Pruned { seconds: 2 }, &genesis).unwrap();
    let mut head = store.head().unwrap();
    let mut world = store.world().unwrap();
    let next_hour = (genesis.timestamp / 3600 + 1) * 3600;
    for timestamp in [genesis.timestamp + 1, next_hour, next_hour + 3] {
        let (next, state) = Application::default()
            .execute_block(&head, &world, timestamp, genesis.gas_limit, &[])
            .unwrap();
        store.commit(&next, &state).unwrap();
        store.maintain().unwrap();
        store.maintain().unwrap(); // Idempotent: no duplicate frame.
        head = next;
        world = state;
    }
    drop(store);
    let paths: Vec<_> = std::fs::read_dir(dir.path().join("history"))
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .collect();
    // At most one partial boundary segment survives until the next rotation.
    assert_eq!(paths.len(), 2);
    let mut blocks: Vec<sfc::types::Block> = paths
        .iter()
        .flat_map(|path| {
            sfc::codec::read_all::<sfc::types::Block>(&mut std::fs::File::open(path).unwrap())
                .unwrap()
        })
        .collect();
    blocks.sort_by_key(|block| block.height());
    assert_eq!(
        blocks.iter().map(|b| b.height()).collect::<Vec<_>>(),
        vec![2, 3]
    );
    let store = Store::open(dir.path(), Retention::Pruned { seconds: 2 }, &genesis).unwrap();
    assert_eq!(store.head().unwrap(), head);
    assert_eq!(store.world().unwrap(), world);
    let paths: Vec<_> = std::fs::read_dir(dir.path().join("history"))
        .unwrap()
        .map(|e| e.unwrap().path())
        .collect();
    assert_eq!(paths.len(), 1);
    let blocks: Vec<sfc::types::Block> =
        sfc::codec::read_all(&mut std::fs::File::open(&paths[0]).unwrap()).unwrap();
    assert_eq!(blocks, vec![head]);
}

#[test]
fn background_expiry_preserves_live_receipts_state_and_restart() {
    use std::sync::Arc;
    use std::time::{Duration, Instant};
    let dir = tempfile::tempdir().unwrap();
    let genesis = common::genesis();
    let retention = Retention::Pruned { seconds: 2 };
    let store = Arc::new(Store::open(dir.path(), retention.clone(), &genesis).unwrap());
    let worker = store.start_pruner().unwrap();
    let mut head = store.head().unwrap();
    let mut world = store.world().unwrap();
    let mut hashes = Vec::new();
    for nonce in 0..40 {
        let tx = common::transfer(nonce);
        hashes.push(tx.hash);
        let timestamp = genesis.timestamp + if nonce < 32 { 0 } else { 10 };
        let (next, state) = Application::default()
            .execute_block(&head, &world, timestamp, genesis.gas_limit, &[tx])
            .unwrap();
        store.commit(&next, &state).unwrap();
        store.maintain().unwrap();
        assert_eq!(
            store.receipt_block(hashes.last().unwrap()).unwrap(),
            Some(next.clone())
        );
        head = next;
        world = state;
    }
    let deadline = Instant::now() + Duration::from_secs(5);
    while store.earliest_height().unwrap() != 33 {
        assert!(
            Instant::now() < deadline,
            "background expiry did not catch up"
        );
        for hash in &hashes[32..] {
            assert!(store.receipt_block(hash).unwrap().is_some());
        }
        std::thread::sleep(Duration::from_millis(5));
    }
    for hash in &hashes[..32] {
        assert!(store.receipt_block(hash).unwrap().is_none());
    }
    drop(worker);
    drop(store);
    let store = Store::open(dir.path(), retention, &genesis).unwrap();
    assert_eq!(store.head().unwrap(), head);
    assert_eq!(store.world().unwrap(), world);
    assert_eq!(store.earliest_height().unwrap(), 33);
    for hash in &hashes[32..] {
        assert!(store.receipt_block(hash).unwrap().is_some());
    }
}
