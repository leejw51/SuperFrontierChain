mod common;
use sfc::{dashboard::stats, framework::Application, node::Node};
#[test]
fn statistics_use_committed_transactions_and_timestamp_intervals() {
    let dir = tempfile::tempdir().unwrap();
    let mut node = Node::open(common::config(dir.path()), Application::default()).unwrap();
    let initial = stats(&node).unwrap();
    assert!(initial["tps"].is_null());
    assert_eq!(initial["retention"]["mode"], "pruned");
    node.submit(&common::transfer(0).raw).unwrap();
    assert_eq!(stats(&node).unwrap()["pendingTransactions"], 1);
    node.produce(1_000_002).unwrap();
    let value = stats(&node).unwrap();
    assert_eq!(value["tps"], 0.5);
    assert_eq!(value["averageBlockMs"], 2000.0);
    assert_eq!(value["pendingTransactions"], 0);
    assert_eq!(value["windowTransactions"], 1);
    assert_eq!(value["recentBlocks"][0]["transactions"], 1);
    assert_eq!(value["syncTransport"], "tcp");
}
