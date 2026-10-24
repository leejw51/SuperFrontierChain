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

#[test]
fn stress_tps_uses_exact_round_result_and_rejects_another_process() {
    let dir = tempfile::tempdir().unwrap();
    let node = Node::open(common::config(dir.path()), Application::default()).unwrap();
    let path = node.config.data_dir.join("stress-tps.capnp");
    let mut result = serde_json::json!({"nodePid":std::process::id(), "trial":2,
        "transactions":1048576, "seconds":3.87, "tps":1048576.0/3.87, "timestamp":1234});
    std::fs::write(&path, sfc::codec::to_vec(&result).unwrap()).unwrap();
    assert_eq!(stats(&node).unwrap()["benchmarkTps"], result);
    result["nodePid"] = 0.into();
    std::fs::write(&path, sfc::codec::to_vec(&result).unwrap()).unwrap();
    assert!(stats(&node).unwrap()["benchmarkTps"].is_null());
    std::fs::write(path, b"incomplete").unwrap();
    assert!(stats(&node).unwrap()["benchmarkTps"].is_null());
}
