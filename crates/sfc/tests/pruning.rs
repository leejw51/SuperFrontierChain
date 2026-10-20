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
        let text = std::fs::read_to_string(entry.unwrap().path()).unwrap();
        for line in text.lines() {
            let block: sfc::types::Block = serde_json::from_str(line).unwrap();
            assert!(block.height >= 518);
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
