//! Standalone CPU oracle and benchmark for the optional MLX experiment.
//! No node/runtime path imports this example.
use anyhow::{bail, ensure, Context, Result};
use rayon::prelude::*;
use secp256k1::{ecdsa::RecoverableSignature, ecdsa::RecoveryId, Message, SecretKey, SECP256K1};
use serde::{Deserialize, Serialize};
use sfc::types::hash;
use std::io::Write;
use std::time::{Duration, Instant};

#[path = "../tests/common/mod.rs"]
mod common;

// Includes CPU time across all process threads, excluding time asleep or on GPU.
fn cpu_seconds() -> Result<f64> {
    let mut value = libc::timespec {
        tv_sec: 0,
        tv_nsec: 0,
    };
    // SAFETY: value points to a valid writable timespec for the duration of the call.
    ensure!(
        unsafe { libc::clock_gettime(libc::CLOCK_PROCESS_CPUTIME_ID, &mut value) } == 0,
        "process CPU clock unavailable"
    );
    Ok(value.tv_sec as f64 + value.tv_nsec as f64 * 1e-9)
}

fn emit(value: serde_json::Value) -> Result<()> {
    sfc::codec::write_record(&mut std::io::stdout().lock(), &sfc::codec::to_vec(&value)?)?;
    std::io::stdout().flush()?;
    Ok(())
}

fn load_server(cases: &[Case]) -> Result<()> {
    let batch = &cases[..4096];
    let expected_all: Vec<_> = cases.iter().map(|c| c.expected.clone()).collect();
    let run = || batch.par_iter().map(recover).collect::<Vec<_>>();
    ensure!(run() == expected_all[..4096], "CPU warmup mismatch");
    emit(serde_json::json!({"ready":true,"workers":rayon::current_num_threads()}))?;
    let mut input = std::io::stdin().lock();
    while let Some(bytes) = sfc::codec::read_record(&mut input)? {
        let request: serde_json::Value = sfc::codec::from_slice(&bytes)?;
        let iterations = request["iterations"]
            .as_u64()
            .context("missing iterations")?;
        let period = request["period_seconds"]
            .as_f64()
            .context("missing period")?;
        let offset = request["offset"].as_u64().unwrap_or(0) as usize;
        let count = request["count"].as_u64().unwrap_or(4096) as usize;
        ensure!(
            offset <= cases.len() && (1..=65536).contains(&count) && count <= cases.len() - offset,
            "invalid fixture range"
        );
        let batch = &cases[offset..offset + count];
        let expected = &expected_all[offset..offset + count];
        let run = || batch.par_iter().map(recover).collect::<Vec<_>>();
        ensure!(
            (1..=10000).contains(&iterations)
                && period.is_finite()
                && (0.0..=1.0).contains(&period),
            "invalid load"
        );
        let mut latencies = Vec::new();
        let mut lateness = Vec::new();
        let mut last = Vec::new();
        let cpu_start = cpu_seconds()?;
        let start = Instant::now();
        for index in 0..iterations {
            if period > 0.0 {
                let due = Duration::from_secs_f64(index as f64 * period);
                std::thread::sleep(due.saturating_sub(start.elapsed()));
                lateness.push(start.elapsed().as_secs_f64() - due.as_secs_f64());
            }
            let tick = Instant::now();
            last = run();
            latencies.push(tick.elapsed().as_secs_f64());
        }
        std::thread::sleep(
            Duration::from_secs_f64(iterations as f64 * period).saturating_sub(start.elapsed()),
        );
        let wall = start.elapsed().as_secs_f64();
        let cpu = cpu_seconds()? - cpu_start;
        ensure!(last == expected, "CPU result mismatch");
        emit(serde_json::json!({"wall_seconds":wall,"cpu_seconds":cpu,
            "latencies_seconds":latencies,"lateness_seconds":lateness,
            "recoveries":iterations * count as u64,"result_verified":true}))?;
    }
    Ok(())
}

fn evm_server() -> Result<()> {
    use sfc::{config::Retention, framework::Application, storage::Store};
    let genesis = common::genesis();
    let dir = tempfile::tempdir()?;
    let store = Store::open(dir.path(), Retention::default(), &genesis)?;
    let head = store.head()?;
    let world = store.world()?;
    let transactions: Vec<_> = (0..512).map(common::transfer).collect();
    let app = Application::default();
    let run = || {
        app.execute_block(
            &head,
            &world,
            genesis.timestamp + 1,
            genesis.gas_limit,
            &transactions,
        )
    };
    let expected = run()?.0.hash();
    emit(serde_json::json!({"ready":true,"transactions_per_execution":512}))?;
    let mut input = std::io::stdin().lock();
    while let Some(bytes) = sfc::codec::read_record(&mut input)? {
        let request: serde_json::Value = sfc::codec::from_slice(&bytes)?;
        let seconds = request["seconds"].as_f64().unwrap_or(0.0);
        let blocks = request["blocks"].as_u64().unwrap_or(0);
        ensure!(
            seconds.is_finite()
                && (0.0..=60.0).contains(&seconds)
                && blocks <= 10000
                && (seconds > 0.0 || blocks > 0),
            "invalid EVM request"
        );
        let cpu_start = cpu_seconds()?;
        let start = Instant::now();
        let mut completed = 0;
        loop {
            let output = run()?;
            ensure!(output.0.hash() == expected, "EVM output changed");
            std::hint::black_box(output);
            completed += 1;
            if (blocks > 0 && completed >= blocks)
                || (blocks == 0 && start.elapsed().as_secs_f64() >= seconds)
            {
                break;
            }
        }
        emit(
            serde_json::json!({"wall_seconds":start.elapsed().as_secs_f64(),
            "cpu_seconds":cpu_seconds()? - cpu_start,"blocks":completed,
            "transactions":completed * 512,"result_verified":true}),
        )?;
    }
    Ok(())
}

#[derive(Clone, Serialize, Deserialize)]
struct Case {
    label: String,
    digest: String,
    signature: String,
    parity: u8,
    expected: Option<String>,
}
fn recover(case: &Case) -> Option<String> {
    if case.parity > 1 {
        return None;
    }
    let digest: [u8; 32] = hex::decode(&case.digest).ok()?.try_into().ok()?;
    let compact = hex::decode(&case.signature).ok()?;
    let checked = k256::ecdsa::Signature::from_slice(&compact).ok()?;
    if checked.normalize_s().is_some() {
        return None;
    }
    let signature = RecoverableSignature::from_compact(
        &compact,
        RecoveryId::from_i32(case.parity.into()).ok()?,
    )
    .ok()?;
    let key = SECP256K1
        .recover_ecdsa(&Message::from_digest(digest), &signature)
        .ok()?;
    Some(hex::encode(key.serialize_uncompressed()))
}
fn generate(count: usize) -> Result<Vec<Case>> {
    ensure!((1..=65536).contains(&count), "count must be 1..65536");
    let mut cases = Vec::new();
    for index in 0..count {
        let secret = SecretKey::from_slice(&hash(format!("sfc/mlx/test-key/{index}").as_bytes()))?;
        let digest = hash(format!("sfc/mlx/test-message/{index}").as_bytes());
        let (id, compact) = SECP256K1
            .sign_ecdsa_recoverable(&Message::from_digest(digest), &secret)
            .serialize_compact();
        let case = Case {
            label: format!("valid-{index}"),
            digest: hex::encode(digest),
            signature: hex::encode(compact),
            parity: id.to_i32() as u8,
            expected: Some(hex::encode(
                secp256k1::PublicKey::from_secret_key(SECP256K1, &secret).serialize_uncompressed(),
            )),
        };
        ensure!(recover(&case) == case.expected, "fixture recovery mismatch");
        cases.push(case);
    }
    // Canonical range boundaries plus on-curve/non-residue recovery coordinates.
    let boundaries = [
        (
            "zero",
            "0000000000000000000000000000000000000000000000000000000000000000",
        ),
        (
            "one",
            "0000000000000000000000000000000000000000000000000000000000000001",
        ),
        (
            "two",
            "0000000000000000000000000000000000000000000000000000000000000002",
        ),
        (
            "half_n",
            "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0",
        ),
        (
            "half_n_plus_one",
            "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a1",
        ),
        (
            "n_minus_one",
            "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364140",
        ),
        (
            "n",
            "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
        ),
        (
            "n_plus_one",
            "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364142",
        ),
        (
            "p",
            "fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f",
        ),
        (
            "max",
            "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        ),
    ];
    let base = cases[0].clone();
    for (name, value) in boundaries {
        for field in ["r", "s", "digest"] {
            let mut case = base.clone();
            case.label = format!("{field}-{name}");
            match field {
                "r" => case.signature.replace_range(..64, value),
                "s" => case.signature.replace_range(64.., value),
                _ => case.digest = value.into(),
            }
            case.expected = recover(&case);
            cases.push(case);
        }
    }
    for parity in [0, 1, 2, 3, 255] {
        let mut case = base.clone();
        case.label = format!("parity-{parity}");
        case.parity = parity;
        case.expected = recover(&case);
        cases.push(case);
    }
    let mut infinity = base.clone();
    infinity.label = "recovered-point-at-infinity".into();
    infinity.digest = format!("{:064x}", 1);
    infinity.signature = format!(
        "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798{:064x}",
        1
    );
    infinity.parity = 0;
    infinity.expected = recover(&infinity);
    ensure!(infinity.expected.is_none(), "infinity fixture accepted");
    cases.push(infinity);
    // Independently identify a non-residue using SEC1 point decoding, rather
    // than relying only on an opaque recovery failure from arbitrary inputs.
    let non_curve_x = (1u8..=255)
        .find(|x| {
            let mut compressed = [0u8; 33];
            compressed[0] = 2;
            compressed[32] = *x;
            secp256k1::PublicKey::from_slice(&compressed).is_err()
        })
        .context("missing non-curve fixture")?;
    let mut non_curve = base.clone();
    non_curve.label = "r-not-on-curve".into();
    non_curve
        .signature
        .replace_range(..64, &format!("{non_curve_x:064x}"));
    non_curve.expected = recover(&non_curve);
    ensure!(non_curve.expected.is_none(), "non-curve fixture accepted");
    cases.push(non_curve);
    // Arbitrary signatures include invalid ranges, non-residues and valid keys
    // unrelated to the original fixture signer. Recovery does not authenticate
    // an externally claimed sender; compare the actual recovered key.
    for index in 0..256 {
        let mut case = base.clone();
        case.label = format!("arbitrary-{index}");
        case.signature = format!(
            "{}{}",
            hex::encode(hash(format!("sfc/mlx/arbitrary/r/{index}").as_bytes())),
            hex::encode(hash(format!("sfc/mlx/arbitrary/s/{index}").as_bytes()))
        );
        case.parity = (index % 2) as u8;
        case.expected = recover(&case);
        cases.push(case);
    }
    Ok(cases)
}
fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().collect();
    match args.get(1).map(String::as_str) {
        Some("load-server") => {
            let cases: Vec<Case> = serde_json::from_value(sfc::codec::from_slice::<serde_json::Value>(&std::fs::read(args.get(2).context("missing fixture path")?)?)?)?;
            ensure!(cases.len() >= 4096, "insufficient fixtures");
            load_server(&cases)?;
        }
        Some("evm-server") => evm_server()?,
        Some("generate") => {
            let count = args.get(2).context("missing count")?.parse()?;
            std::io::stdout().write_all(&sfc::codec::to_vec(&serde_json::to_value(generate(count)?)?)?)?;
        }
        Some("bench") => {
            let cases: Vec<Case> = serde_json::from_value(sfc::codec::from_slice::<serde_json::Value>(&std::fs::read(
                args.get(2).context("missing fixture path")?,
            )?)?)?;
            let mut report = Vec::new();
            for count in [64, 256, 1024, 4096] {
                ensure!(cases.len() >= count, "insufficient fixtures");
                let batch = &cases[..count];
                for parallel in [false, true] {
                    let run = || -> Vec<_> {
                        if parallel {
                            batch.par_iter().map(recover).collect()
                        } else {
                            batch.iter().map(recover).collect()
                        }
                    };
                    let expected: Vec<_> = batch.iter().map(|c| c.expected.clone()).collect();
                    ensure!(run() == expected, "CPU oracle mismatch");
                    let mut samples = Vec::new();
                    for _ in 0..7 {
                        let start = Instant::now();
                        for _ in 0..5 {
                            std::hint::black_box(run());
                        }
                        samples.push(start.elapsed().as_secs_f64() / 5.0);
                    }
                    let mut sorted = samples.clone();
                    sorted.sort_by(f64::total_cmp);
                    report.push(serde_json::json!({
                        "backend":if parallel {"libsecp256k1_rayon"} else {"libsecp256k1_serial"},
                        "batch":count,"samples_seconds":samples,"median_seconds":sorted[3],
                        "recoveries_per_second":count as f64/sorted[3],
                        "workers":if parallel {rayon::current_num_threads()} else {1},
                        "input_hex_decode_and_output_hex_included":true,
                        "ethereum_rlp_and_keccak_included":false
                    }));
                }
            }
            std::io::stdout().write_all(&sfc::codec::to_vec(&serde_json::to_value(&report)?)?)?;
        }
        _ => bail!("usage: ecdsa_oracle generate COUNT | bench FIXTURE.capnp | load-server FIXTURE.capnp | evm-server"),
    }
    Ok(())
}
