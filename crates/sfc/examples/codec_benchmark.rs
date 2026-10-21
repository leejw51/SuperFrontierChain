//! JSON vs typed Cap'n Proto, including selective JSON reads and boundary validation.
//! Run: cargo run --offline --locked --release --example codec_benchmark
use anyhow::Result;
use serde::{
    de::{IgnoredAny, SeqAccess, Visitor},
    Deserialize, Deserializer, Serialize,
};
use sfc::{
    binary,
    types::{Block, BlockDraft, Receipt},
};
use std::{
    alloc::{GlobalAlloc, Layout, System},
    hint::black_box,
    sync::atomic::{AtomicBool, AtomicU64, Ordering},
    time::Instant,
};
struct CountAlloc;
static COUNT: AtomicBool = AtomicBool::new(false);
static ALLOCS: AtomicU64 = AtomicU64::new(0);
static BYTES: AtomicU64 = AtomicU64::new(0);
unsafe impl GlobalAlloc for CountAlloc {
    unsafe fn alloc(&self, l: Layout) -> *mut u8 {
        if COUNT.load(Ordering::Relaxed) {
            ALLOCS.fetch_add(1, Ordering::Relaxed);
            BYTES.fetch_add(l.size() as u64, Ordering::Relaxed);
        }
        unsafe { System.alloc(l) }
    }
    unsafe fn dealloc(&self, p: *mut u8, l: Layout) {
        unsafe { System.dealloc(p, l) }
    }
    unsafe fn realloc(&self, p: *mut u8, l: Layout, n: usize) -> *mut u8 {
        if COUNT.load(Ordering::Relaxed) {
            ALLOCS.fetch_add(1, Ordering::Relaxed);
            BYTES.fetch_add(n as u64, Ordering::Relaxed);
        }
        unsafe { System.realloc(p, l, n) }
    }
}
#[global_allocator]
static ALLOCATOR: CountAlloc = CountAlloc;

#[derive(Serialize, Deserialize)]
struct LegacyBlock {
    chain_id: u64,
    height: u64,
    timestamp: u64,
    parent_hash: [u8; 32],
    state_root: [u8; 32],
    transactions: Vec<String>,
    receipts: Vec<Receipt>,
}
struct TransactionCount(usize);
impl<'de> Deserialize<'de> for TransactionCount {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        struct Counter;
        impl<'de> Visitor<'de> for Counter {
            type Value = TransactionCount;
            fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                f.write_str("a transaction array")
            }
            fn visit_seq<A: SeqAccess<'de>>(self, mut a: A) -> Result<Self::Value, A::Error> {
                let mut count = 0;
                while a.next_element::<IgnoredAny>()?.is_some() {
                    count += 1;
                }
                Ok(TransactionCount(count))
            }
        }
        d.deserialize_seq(Counter)
    }
}
#[derive(Deserialize)]
struct HeaderQuery {
    height: u64,
    transactions: TransactionCount,
}
struct GasSum(u64);
impl<'de> Deserialize<'de> for GasSum {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        struct Sum;
        #[derive(Deserialize)]
        struct Gas {
            gas_used: u64,
        }
        impl<'de> Visitor<'de> for Sum {
            type Value = GasSum;
            fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
                f.write_str("a receipt array")
            }
            fn visit_seq<A: SeqAccess<'de>>(self, mut a: A) -> Result<Self::Value, A::Error> {
                let mut sum = 0;
                while let Some(gas) = a.next_element::<Gas>()? {
                    sum += gas.gas_used;
                }
                Ok(GasSum(sum))
            }
        }
        d.deserialize_seq(Sum)
    }
}
#[derive(Deserialize)]
struct GasQuery {
    receipts: GasSum,
}
#[path = "../tests/common/mod.rs"]
mod common;

fn measure(mut f: impl FnMut(), iterations: u64) -> serde_json::Value {
    for _ in 0..10 {
        f();
    }
    let mut times = Vec::with_capacity(7);
    for _ in 0..7 {
        let now = Instant::now();
        for _ in 0..iterations {
            f();
        }
        times.push(now.elapsed().as_secs_f64() / iterations as f64);
    }
    // Allocation accounting is a separate pass outside timed samples.
    ALLOCS.store(0, Ordering::Relaxed);
    BYTES.store(0, Ordering::Relaxed);
    COUNT.store(true, Ordering::Relaxed);
    for _ in 0..10 {
        f();
    }
    COUNT.store(false, Ordering::Relaxed);
    let allocations = ALLOCS.load(Ordering::Relaxed) / 10;
    let allocated_bytes = BYTES.load(Ordering::Relaxed) / 10;
    times.sort_by(f64::total_cmp);
    serde_json::json!({
        "median_us": times[3] * 1e6, "min_us": times[0] * 1e6, "max_us": times[6] * 1e6,
        "allocations_per_operation": allocations, "allocated_bytes_per_operation": allocated_bytes,
        "iterations_per_sample": iterations, "samples": 7
    })
}
fn main() -> Result<()> {
    let count = 4096;
    let raw = (0..count)
        .map(|i| common::transfer(i).raw)
        .collect::<Vec<_>>();
    let receipts = raw
        .iter()
        .enumerate()
        .map(|(i, tx)| Receipt {
            transaction_hash: sfc::types::hash(tx),
            from: format!("{:#x}", common::sender()),
            to: Some("0x2b5ad5c4795c026514f8317c7a215e218dccd6cf".into()),
            success: true,
            gas_used: 21000,
            cumulative_gas_used: 21000 * (i as u64 + 1),
            contract_address: None,
            logs: vec![],
        })
        .collect::<Vec<_>>();
    let legacy = LegacyBlock {
        chain_id: 7777,
        height: 123,
        timestamp: 1_000_001,
        parent_hash: [1; 32],
        state_root: [2; 32],
        transactions: raw
            .iter()
            .map(|v| format!("0x{}", hex::encode(v)))
            .collect(),
        receipts: receipts.clone(),
    };
    let draft = BlockDraft {
        chain_id: legacy.chain_id,
        height: legacy.height,
        timestamp: legacy.timestamp,
        parent_hash: legacy.parent_hash,
        state_root: legacy.state_root,
        transactions: raw,
        receipts,
    };
    let encoded = serde_json::to_vec(&legacy)?;
    let block = Block::build_from(&draft)?;
    let bytes = block.shared_bytes();
    // Assert equivalent contents before timing; materialization only occurs here.
    assert_eq!(block.receipts()?, legacy.receipts);
    assert_eq!(block.transactions()?, draft.transactions);
    assert_eq!(block.height(), legacy.height);
    let header: HeaderQuery = serde_json::from_slice(&encoded)?;
    assert_eq!(
        (header.height, header.transactions.0),
        (block.height(), block.transaction_count())
    );
    let gas: GasQuery = serde_json::from_slice(&encoded)?;
    assert_eq!(gas.receipts.0, count * 21000);

    let json_decode = measure(
        || {
            let b: LegacyBlock = serde_json::from_slice(black_box(&encoded)).unwrap();
            black_box((b.height, b.transactions.len()));
        },
        200,
    );
    let json_select_header = measure(
        || {
            let b: HeaderQuery = serde_json::from_slice(black_box(&encoded)).unwrap();
            black_box((b.height, b.transactions.0));
        },
        200,
    );
    let capnp_header = measure(
        || {
            let m = binary::reader(black_box(&bytes)).unwrap();
            let b = m.get_root::<sfc::storage_capnp::block::Reader>().unwrap();
            black_box((b.get_height(), b.get_transactions().unwrap().len()));
        },
        20000,
    );
    let capnp_validate = measure(
        || {
            black_box(Block::from_bytes(black_box(bytes.clone())).unwrap());
        },
        200,
    );
    let json_select_scan = measure(
        || {
            let b: GasQuery = serde_json::from_slice(black_box(&encoded)).unwrap();
            black_box(b.receipts.0);
        },
        200,
    );
    let capnp_scan = measure(
        || {
            let m = binary::reader(black_box(&bytes)).unwrap();
            let b = m.get_root::<sfc::storage_capnp::block::Reader>().unwrap();
            black_box(
                b.get_receipts()
                    .unwrap()
                    .iter()
                    .map(|r| r.get_gas_used())
                    .sum::<u64>(),
            );
        },
        2000,
    );
    let json_write = measure(
        || {
            black_box(serde_json::to_vec(black_box(&legacy)).unwrap());
        },
        200,
    );
    let capnp_write = measure(
        || {
            black_box(Block::build_from(black_box(&draft)).unwrap());
        },
        200,
    );
    let report = serde_json::json!({
        "transactions": count, "json_bytes": encoded.len(), "capnp_bytes": bytes.len(),
        "json_full_decode": json_decode, "json_select_header": json_select_header,
        "capnp_borrow_header": capnp_header, "capnp_validate_entire_block": capnp_validate,
        "json_select_and_scan": json_select_scan, "capnp_borrow_and_scan": capnp_scan,
        "json_encode_preformatted": json_write, "capnp_build_canonical_and_validate": capnp_write,
        "scope": "Hot-memory codec microbenchmark, not TPS. No disk, network, hashing, EVM or signatures in timed operations.",
        "method": "Release; seven samples, median. Allocations counted separately. Allocator has a disabled atomic flag check during timing.",
        "caveats": [
            "Borrowed Capnp field reads assume previously validated bytes; full validation is measured separately.",
            "JSON selective reads skip unrelated field types; full decoding and Capnp validation do more checks.",
            "JSON encoding starts with preformatted hex strings; Capnp uses raw transactions and includes canonicalization and validation.",
            "Raw canonical Capnp segment excludes its eight-byte stream frame."
        ]
    });
    println!("{report:#}");
    std::fs::write(
        "target/direct-capnp-codec-benchmark.capnp",
        sfc::codec::to_vec(&report)?,
    )?;
    Ok(())
}
