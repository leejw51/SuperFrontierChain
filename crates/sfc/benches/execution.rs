#[path = "../tests/common/mod.rs"]
mod common;
use common::*;
use sfc::{config::Retention, framework::Application, storage::Store};
use std::time::Instant;
fn main() {
    let blocks = std::env::var("SFC_BENCH_BLOCKS")
        .ok()
        .map(|s| s.parse::<u64>().unwrap())
        .unwrap_or(100);
    let batch = std::env::var("SFC_BENCH_BATCH")
        .ok()
        .map(|s| s.parse::<u64>().unwrap())
        .unwrap_or(100);
    assert!(blocks > 0 && batch > 0 && batch <= 4096);
    let mut benchmark_genesis = genesis();
    benchmark_genesis.gas_limit = 100_000_000;
    let transactions: Vec<_> = (0..blocks * batch).map(transfer).collect();
    for durable in [false, true] {
        let dir = tempfile::tempdir().unwrap();
        let genesis = benchmark_genesis.clone();
        let store = Store::open(dir.path(), Retention::default(), &genesis).unwrap();
        let app = Application::default();
        let mut head = store.head().unwrap();
        let mut world = store.world().unwrap();
        let mut latencies = Vec::new();
        let start = Instant::now();
        for (i, txs) in transactions.chunks(batch as usize).enumerate() {
            let tick = Instant::now();
            let (block, next) = app
                .execute_block(
                    &head,
                    &world,
                    genesis.timestamp + i as u64 + 1,
                    genesis.gas_limit,
                    txs,
                )
                .unwrap();
            if durable {
                store.commit(&block, &next).unwrap();
                store.maintain().unwrap();
            }
            head = block;
            world = next;
            latencies.push(tick.elapsed().as_secs_f64() * 1000.0);
        }
        let elapsed = start.elapsed().as_secs_f64();
        latencies.sort_by(f64::total_cmp);
        println!(
            "{}",
            serde_json::json!({"benchmark":if durable {"execution_and_fsync"} else {"execution_only"},"transactions":blocks*batch,"blocks":blocks,"transactions_per_block":batch,"seconds":elapsed,"tps":(blocks*batch) as f64/elapsed,"block_ms_p50":latencies[(blocks as usize*50/100).min(blocks as usize-1)],"block_ms_p95":latencies[(blocks as usize*95/100).min(blocks as usize-1)],"block_ms_p99":latencies[(blocks as usize*99/100).min(blocks as usize-1)],"signature_verification_included":false,"network_included":false,"state_accounts":world.accounts.len()})
        );
    }
    let start = Instant::now();
    for tx in &transactions {
        std::hint::black_box(sfc::ethereum::Transaction::decode(&tx.raw, 7777).unwrap());
    }
    println!(
        "{}",
        serde_json::json!({"benchmark":"signature_verification","transactions":blocks*batch,"tps":(blocks*batch) as f64/start.elapsed().as_secs_f64()})
    );
    let workers = rayon::current_num_threads();
    let raw: Vec<&[u8]> = transactions.iter().map(|tx| tx.raw.as_slice()).collect();
    // Warm up the worker pool separately from steady-state measurements.
    std::hint::black_box(sfc::ethereum::decode_batch(&raw[..batch as usize], 7777).unwrap());
    let start = Instant::now();
    for chunk in raw.chunks(batch as usize) {
        std::hint::black_box(sfc::ethereum::decode_batch(chunk, 7777).unwrap());
    }
    println!(
        "{}",
        serde_json::json!({"benchmark":"rayon_signature_verification","workers":workers,"blocks":blocks,"transactions_per_block":batch,"transactions":blocks*batch,"tps":(blocks*batch) as f64/start.elapsed().as_secs_f64()})
    );
    for parallel in [false, true] {
        let dir = tempfile::tempdir().unwrap();
        let node_config = config(dir.path());
        std::fs::write(
            &node_config.genesis,
            serde_json::to_vec(&benchmark_genesis).unwrap(),
        )
        .unwrap();
        let mut node = sfc::node::Node::open(node_config, Application::default()).unwrap();
        let start = Instant::now();
        let mut latencies = Vec::new();
        for (i, txs) in transactions.chunks(batch as usize).enumerate() {
            let tick = Instant::now();
            if parallel {
                let raw: Vec<&[u8]> = txs.iter().map(|tx| tx.raw.as_slice()).collect();
                for result in node.submit_batch(&raw).unwrap() {
                    result.unwrap();
                }
            } else {
                for tx in txs {
                    node.submit(&tx.raw).unwrap();
                }
            }
            node.produce(genesis().timestamp + i as u64 + 1).unwrap();
            latencies.push(tick.elapsed().as_secs_f64() * 1000.0);
        }
        latencies.sort_by(f64::total_cmp);
        println!(
            "{}",
            serde_json::json!({"benchmark":if parallel {"rayon_admission_execution_fsync"} else {"admission_execution_fsync"},"workers":if parallel {workers} else {1},"blocks":blocks,"transactions_per_block":batch,"transactions":blocks*batch,"tps":(blocks*batch) as f64/start.elapsed().as_secs_f64(),"block_ms_p50":latencies[(blocks as usize*50/100).min(blocks as usize-1)],"block_ms_p95":latencies[(blocks as usize*95/100).min(blocks as usize-1)],"block_ms_p99":latencies[(blocks as usize*99/100).min(blocks as usize-1)],"signature_verification_included":true,"network_included":false,"scheduler_wait_included":false})
        );
    }
}
