//! Bounded local statistics; rates use committed block timestamps.
use crate::{node::Node, types::hex_hash};
use anyhow::Result;
use serde_json::{json, Value};

pub fn stats(node: &Node) -> Result<Value> {
    let head = node.head();
    let earliest = node.store.earliest_height()?;
    let start = head.height.saturating_sub(60).max(earliest);
    let mut blocks = Vec::new();
    for height in start..=head.height {
        if let Some(block) = node.store.block(height)? {
            blocks.push(block);
        }
    }
    let elapsed = blocks
        .first()
        .map(|b| head.timestamp.saturating_sub(b.timestamp))
        .unwrap_or(0);
    let transactions: usize = blocks.iter().skip(1).map(|b| b.transactions.len()).sum();
    let intervals = blocks.len().saturating_sub(1);
    let recent: Vec<_> = blocks.iter().rev().take(12).map(|b| json!({
        "height":b.height,"hash":hex_hash(&b.hash()),"timestamp":b.timestamp,
        "transactions":b.transactions.len(),"gasUsed":b.receipts.last().map(|r|r.cumulative_gas_used).unwrap_or(0)
    })).collect();
    Ok(json!({
        "chainId":node.genesis.chain_id,"height":head.height,"headHash":hex_hash(&head.hash()),
        "headTimestamp":head.timestamp,"earliestHeight":earliest,"retainedBlocks":head.height-earliest+1,
        "role":if node.config.sync_peer.is_some(){"Follower"}else{"Development sequencer"},
        "syncTransport":node.config.sync_peer.as_ref().map(|p|p.transport).unwrap_or_default(),
        "upstream":node.config.sync_peer.as_ref().map(|p|p.address.to_string()),
        "retention":node.config.retention,"targetBlockMs":node.config.block_interval_ms,
        "accounts":node.world()?.accounts.len(),"pendingTransactions":node.pending_count(),
        "windowTransactions":transactions,"windowSeconds":elapsed,
        "tps":if elapsed>0 {Some(transactions as f64/elapsed as f64)}else{None},
        "averageBlockMs":if elapsed>0 && intervals>0 {Some(elapsed as f64*1000.0/intervals as f64)}else{None},
        "recentBlocks":recent
        ,"verification":node.verifier.status()?,
        "rocksdb":node.store.statistics()?,
        "paths":{
            "data":node.config.data_dir,
            "rocksdb":node.config.data_dir.join("rocksdb"),
            "rocksdbLog":node.config.data_dir.join("rocksdb/LOG"),
            "history":node.config.data_dir.join("history"),
            "sqliteIndex":node.config.data_dir.join("index.sqlite"),
            "sqliteWal":node.config.data_dir.join("index.sqlite-wal"),
            "sqliteSharedMemory":node.config.data_dir.join("index.sqlite-shm"),
            "structuredLog":node.config.data_dir.join("logs/node.jsonl"),
            "indexerErrorLog":node.config.data_dir.join("index-error.log"),
            "genesis":node.config.genesis,"tlsCertificate":node.config.tls_cert
        },
        "endpoints":{"ethereumRpc":format!("http://{}/",node.config.rpc_listen),
            "dashboard":format!("http://{}/dashboard",node.config.rpc_listen),
            "index":format!("http://{}/dashboard/index",node.config.rpc_listen),
            "syncHttp3":format!("https://{}",node.config.peer_listen),
            "capnpTcp":node.config.capnp_listen},
        "runtime":read_info(&node.config.data_dir.join("runtime-info.json")),
        "stress":read_info(&node.config.data_dir.join("stress-info.json"))
    }))
}

fn read_info(path: &std::path::Path) -> Value {
    std::fs::read(path)
        .ok()
        .and_then(|bytes| serde_json::from_slice(&bytes).ok())
        .unwrap_or(Value::Null)
}
