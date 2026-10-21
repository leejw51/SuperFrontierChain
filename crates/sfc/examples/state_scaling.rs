//! Isolate the cost of growing state without network, signatures or disk writes.
//! cargo run --release --example state_scaling
use anyhow::Result;
use sfc::{
    ethereum,
    framework::Application,
    types::{Account, Block, BlockDraft, World},
};
use std::{hint::black_box, time::Instant};

fn median_ms(mut operation: impl FnMut()) -> f64 {
    operation();
    let mut samples = Vec::new();
    for _ in 0..5 {
        let start = Instant::now();
        operation();
        samples.push(start.elapsed().as_secs_f64() * 1000.0);
    }
    samples.sort_by(f64::total_cmp);
    samples[2]
}

fn main() -> Result<()> {
    let mut report = Vec::new();
    for count in [2, 1_000, 10_000, 100_000] {
        let mut world = World::default();
        for id in 1..=count {
            world.accounts.insert(
                format!("0x{id:040x}"),
                Account {
                    balance: "1000000000000".into(),
                    ..Default::default()
                },
            );
        }
        let expected = world.root();
        let db = ethereum::load_db(&world)?;
        let mut restored = World::default();
        ethereum::save_db(&db, &mut restored)?;
        assert_eq!(restored, world);
        assert_eq!(restored.root(), expected);
        let parent = Block::build(BlockDraft {
            chain_id: 7777,
            height: 0,
            timestamp: 1_000_000,
            parent_hash: [0; 32],
            state_root: expected,
            transactions: Vec::new(),
            receipts: Vec::new(),
        })?;
        let clone = median_ms(|| {
            black_box(world.clone());
        });
        let root = median_ms(|| {
            black_box(world.root());
        });
        let load = median_ms(|| {
            black_box(ethereum::load_db(&world).unwrap());
        });
        let save = median_ms(|| {
            let mut out = World::default();
            ethereum::save_db(&db, &mut out).unwrap();
            black_box(out);
        });
        let execute = median_ms(|| {
            black_box(
                Application::default()
                    .execute_block(&parent, &world, 1_000_001, 100_000_000, &[])
                    .unwrap(),
            );
        });
        println!(
            "{count:>6} accounts: clone={clone:.3}ms root={root:.3}ms load={load:.3}ms save={save:.3}ms empty-block={execute:.3}ms"
        );
        report.push(serde_json::json!({
            "accounts":count, "clone_ms":clone, "root_ms":root,
            "load_ms":load, "save_ms":save, "empty_block_execution_ms":execute
        }));
    }
    std::fs::write(
        "target/state-scaling.capnp",
        sfc::codec::to_vec(&serde_json::json!({
            "scope":"in-memory, five-sample medians; includes output drop; no signatures, RPC, disk or modules",
            "results":report
        }))?,
    )?;
    Ok(())
}
