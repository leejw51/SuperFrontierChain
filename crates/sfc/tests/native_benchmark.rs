//! End-to-end tests of the Rust-only benchmark and its persistent supervisor.
#![cfg(target_os = "macos")]
use serde_json::Value;
use sfc::codec;
use std::{
    fs::{self, File},
    path::Path,
    process::{Child, Command},
    thread,
    time::{Duration, Instant},
};

struct Runner(Child);
impl Drop for Runner {
    fn drop(&mut self) {
        if self.0.try_wait().unwrap().is_none() {
            // SAFETY: owned and unreaped child, never a PID read from disk.
            unsafe { libc::kill(self.0.id() as i32, libc::SIGINT) };
            let deadline = Instant::now() + Duration::from_secs(15);
            while self.0.try_wait().unwrap().is_none() && Instant::now() < deadline {
                thread::sleep(Duration::from_millis(20));
            }
            let _ = self.0.kill();
        }
        let _ = self.0.wait();
    }
}
fn command() -> Command {
    let mut command = Command::new(env!("CARGO_BIN_EXE_sfc-bench"));
    command.env("RAYON_NUM_THREADS", "4");
    command
}
fn run(home: &Path, mode: &str) -> Runner {
    let log = File::create(home.join("capture.log")).unwrap();
    Runner(
        command()
            .args(["run", "--binary", env!("CARGO_BIN_EXE_sfc"), "--home"])
            .arg(home)
            .args([
                "--transactions",
                "128",
                "--rpc-batch",
                "64",
                "--inflight",
                "2",
                "--sqlite",
                mode,
            ])
            .stdout(log.try_clone().unwrap())
            .stderr(log)
            .spawn()
            .unwrap(),
    )
}
fn wait_for(home: &Path, child: &mut Runner, predicate: impl Fn() -> bool) {
    let deadline = Instant::now() + Duration::from_secs(90);
    loop {
        if predicate() {
            return;
        }
        assert!(
            child.0.try_wait().unwrap().is_none() && Instant::now() < deadline,
            "{}",
            fs::read_to_string(home.join("capture.log")).unwrap()
        );
        thread::sleep(Duration::from_millis(20));
    }
}
fn stop(home: &Path, child: &mut Runner) {
    let output = command()
        .arg("stop")
        .arg("--home")
        .arg(home)
        .output()
        .unwrap();
    assert!(output.status.success(), "{output:?}");
    assert!(child.0.wait().unwrap().success());
}
fn records(path: &Path) -> Vec<Value> {
    let mut input = File::open(path).unwrap();
    let mut result = Vec::new();
    while let Some(bytes) = codec::read_record(&mut input).unwrap() {
        result.push(codec::from_slice(&bytes).unwrap());
    }
    result
}

#[test]
#[ignore = "requires local networking and Apple Metal"]
fn rust_stress_stop_restart_lock_and_sqlite_toggle() {
    let dir = tempfile::tempdir().unwrap();
    let home = dir.path();
    let mut child = run(home, "on");
    wait_for(home, &mut child, || {
        fs::read_to_string(home.join("stress.log"))
            .unwrap_or_default()
            .contains("Round 1:")
    });
    let duplicate = command()
        .arg("run")
        .arg("--home")
        .arg(home)
        .output()
        .unwrap();
    assert!(!duplicate.status.success());
    assert!(String::from_utf8_lossy(&duplicate.stderr).contains("already running:"));
    stop(home, &mut child);
    // Force partial admission within a batch and nonce gaps in the pipelined
    // successor. The Rust driver must retry the suffix, never count it as committed.
    let config_path = home.join("node-0/config.jsonl");
    let mut config: sfc::config::Config = sfc::config::load(&config_path).unwrap();
    config.max_pending = 16;
    sfc::config::save(&config_path, &config).unwrap();
    let old_count = records(&home.join("results.capnp")).len();
    let db = home.join("node-0/data/index.sqlite");
    assert!(db.exists());
    let db_before = fs::read(&db).unwrap();
    let mut restarted = run(home, "off");
    wait_for(home, &mut restarted, || {
        fs::read_to_string(home.join("capture.log"))
            .unwrap_or_default()
            .contains("committed TPS")
    });
    stop(home, &mut restarted);
    assert_eq!(
        fs::read(&db).unwrap(),
        db_before,
        "OFF mutated the existing index"
    );
    let reports = records(&home.join("results.capnp"));
    assert!(reports.len() > old_count);
    for record in &reports {
        assert_eq!(record["benchmark_driver"], "rust");
        assert_eq!(record["gpu_runtime"], "mlx-native");
        assert_eq!(record["python_processes"], 0);
        assert_eq!(record["cpu_usage"][0]["cpu_records"], 0);
        assert!(record["tps"].as_f64().unwrap() > 0.0);
    }
    assert_eq!(reports.last().unwrap()["sqlite_indexer"], false);
    assert!(reports
        .iter()
        .filter(|r| r["sqlite_indexer"] == false)
        .any(|r| r["admission_attempts"].as_u64().unwrap() > r["transactions"].as_u64().unwrap()));
    let mut resumed = run(home, "on");
    wait_for(home, &mut resumed, || {
        fs::read_to_string(home.join("capture.log"))
            .unwrap_or_default()
            .contains("committed TPS")
    });
    stop(home, &mut resumed);
    assert_eq!(
        records(&home.join("results.capnp")).last().unwrap()["sqlite_indexer"],
        true
    );
}

#[test]
#[ignore = "requires local networking and Apple Metal"]
fn rust_two_node_benchmark_checks_replay_and_index() {
    let dir = tempfile::tempdir().unwrap();
    for transport in ["tcp", "http3"] {
        let report = dir.path().join(format!("{transport}.capnp"));
        let output = command()
            .args([
                "bench",
                "--binary",
                env!("CARGO_BIN_EXE_sfc"),
                "--nodes",
                "2",
                "--transactions",
                "8192",
                "--inflight",
                "2",
                "--repeat",
                "1",
                "--sqlite",
                "both",
                "--sync-transport",
                transport,
                "--transport",
                transport,
                "--output",
            ])
            .arg(&report)
            .output()
            .unwrap();
        assert!(output.status.success(), "{output:?}");
        let reports = records(&report);
        assert_eq!(reports.len(), 2);
        for report in reports {
            assert_eq!(report["nodes"], 2);
            assert_eq!(report["sync_transport"], transport);
            assert_eq!(report["transport"], transport);
            assert_eq!(report["follower_replay_included"], true);
            assert_eq!(report["cpu_usage"][1]["gpu_records"], 8192);
            assert_eq!(report["inflight"], 2);
        }
    }
}

#[test]
#[ignore = "requires local networking and Apple Metal"]
fn killed_node_invalidates_measurement_and_restarts_from_wal() {
    let dir = tempfile::tempdir().unwrap();
    let home = dir.path();
    let mut child = run(home, "on");
    wait_for(home, &mut child, || {
        fs::read_to_string(home.join("capture.log"))
            .unwrap_or_default()
            .contains("committed TPS")
    });
    let info: Value =
        codec::from_slice(&fs::read(home.join("node-0/data/stress-info.capnp")).unwrap()).unwrap();
    let pid = info["Node PID"].as_u64().unwrap() as i32;
    // SAFETY: live child of the owned test runner, obtained from this fresh home.
    assert_eq!(unsafe { libc::kill(pid, libc::SIGKILL) }, 0);
    let deadline = Instant::now() + Duration::from_secs(15);
    let status = loop {
        if let Some(status) = child.0.try_wait().unwrap() {
            break status;
        }
        assert!(
            Instant::now() < deadline,
            "supervisor did not detect node death"
        );
        thread::sleep(Duration::from_millis(20));
    };
    assert!(
        !status.success(),
        "a dead node must not produce successful measurements"
    );
    let old_count = records(&home.join("results.capnp")).len();
    let mut restarted = run(home, "on");
    wait_for(home, &mut restarted, || {
        fs::read_to_string(home.join("capture.log"))
            .unwrap_or_default()
            .contains("committed TPS")
    });
    stop(home, &mut restarted);
    assert!(records(&home.join("results.capnp")).len() > old_count);
}
