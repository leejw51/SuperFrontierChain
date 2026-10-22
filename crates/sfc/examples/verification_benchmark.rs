//! Native MLX verification latency, including parsing, packing, wait and key decoding.
//! RAYON_NUM_THREADS=12 cargo run --locked --release --example verification_benchmark
use anyhow::Result;
use sfc::verification::{Backend, GpuRuntime, VerificationConfig, Verifier};
use std::{hint::black_box, time::Instant};
#[path = "../tests/common/mod.rs"]
mod common;

fn main() -> Result<()> {
    let expected: Vec<_> = (0..4096).map(common::transfer).collect();
    let raw: Vec<_> = expected.iter().map(|tx| tx.raw.clone()).collect();
    let verifier = Verifier::new(VerificationConfig {
        backend: Backend::Gpu,
        gpu_runtime: GpuRuntime::MlxNative,
        ..Default::default()
    })?;
    for count in [
        1, 32, 256, 1024, 2047, 2048, 2049, 2304, 2559, 2560, 2561, 4096,
    ] {
        for _ in 0..2 {
            let actual = verifier.decode_shared(&raw[..count], 7777)?;
            for (actual, expected) in actual.into_iter().zip(&expected) {
                let actual = actual?;
                assert_eq!(actual.hash, expected.hash);
                assert_eq!(actual.env, expected.env);
            }
        }
        let mut samples = Vec::new();
        for _ in 0..9 {
            let started = Instant::now();
            for _ in 0..10 {
                let actual = verifier.decode_shared(black_box(&raw[..count]), 7777)?;
                assert!(actual.iter().all(Result::is_ok));
                black_box(actual);
            }
            samples.push(started.elapsed().as_secs_f64() * 1e6 / 10.0);
        }
        samples.sort_by(f64::total_cmp);
        println!(
            "{}",
            serde_json::json!({
                "backend":"gpu", "runtime":"mlx-native", "batch":count,
                "median_us":samples[4], "min_us":samples[0], "max_us":samples[8],
                "samples":9, "iterations_per_sample":10,
                "rayon_threads":rayon::current_num_threads(),
                "scope":"Native transaction verification; excludes RPC, execution, disk and signing"
            })
        );
    }
    Ok(())
}
