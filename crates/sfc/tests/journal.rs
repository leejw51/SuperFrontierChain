mod common;
use common::*;
use ed25519_dalek::SigningKey;
use sfc::{
    config::Retention,
    consensus::{DurableSigner, Phase, Vote},
    framework::Application,
    storage::Store,
    types::{Block, World},
};
use std::{
    fs,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    time::{Duration, Instant},
};

struct KillOnDrop(Child);
impl Drop for KillOnDrop {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

// Invoked only in a separate process. The parent kills it while both DBs are open.
#[test]
#[ignore = "subprocess helper for crash-recovery tests"]
fn journal_crash_worker() {
    let home = PathBuf::from(std::env::var_os("SFC_JOURNAL_TEST_HOME").expect("test home"));
    let genesis = genesis();
    let store = Store::open(&home.join("chain"), Retention::default(), &genesis).unwrap();
    let (block, world) = Application::default()
        .execute_block(
            &store.head().unwrap(),
            &store.world().unwrap(),
            genesis.timestamp + 1,
            genesis.gas_limit,
            &[transfer(0)],
        )
        .unwrap();
    store.commit(&block, &world).unwrap();
    // Deliberately do not maintain JSONL or close either database.
    let mut signer =
        DurableSigner::open(&home.join("signer"), 7777, SigningKey::from_bytes(&[7; 32])).unwrap();
    let vote = signer
        .sign(1, 0, Phase::Precommit, Some(block.hash()))
        .unwrap();
    let expected = serde_json::to_vec(&(block, world, vote)).unwrap();
    fs::write(home.join("ready.tmp"), expected).unwrap();
    fs::rename(home.join("ready.tmp"), home.join("ready.json")).unwrap();
    loop {
        std::thread::park_timeout(Duration::from_secs(60));
    }
}

fn crash_after_acknowledged_writes(home: &Path) -> (Block, World, Vote) {
    let child = Command::new(std::env::current_exe().unwrap())
        .args([
            "--exact",
            "journal_crash_worker",
            "--ignored",
            "--nocapture",
        ])
        .env("SFC_JOURNAL_TEST_HOME", home)
        .stdout(Stdio::null())
        .spawn()
        .unwrap();
    let mut child = KillOnDrop(child);
    let deadline = Instant::now() + Duration::from_secs(15);
    while !home.join("ready.json").exists() {
        assert!(
            child.0.try_wait().unwrap().is_none(),
            "writer exited before acknowledging writes"
        );
        assert!(Instant::now() < deadline, "writer did not become ready");
        std::thread::sleep(Duration::from_millis(10));
    }
    child.0.kill().unwrap();
    assert!(!child.0.wait().unwrap().success());
    // Ensure recovery has to use the journal, not an SST produced by a clean shutdown.
    for db in [home.join("chain/rocksdb"), home.join("signer")] {
        assert!(!fs::read_dir(&db).unwrap().any(|entry| entry
            .unwrap()
            .path()
            .extension()
            .is_some_and(|e| e == "sst")));
        assert!(!wal_files(&db).is_empty());
    }
    serde_json::from_slice(&fs::read(home.join("ready.json")).unwrap()).unwrap()
}

fn wal_files(path: &Path) -> Vec<PathBuf> {
    fs::read_dir(path)
        .unwrap()
        .map(|e| e.unwrap().path())
        .filter(|p| p.extension().is_some_and(|e| e == "log") && fs::metadata(p).unwrap().len() > 0)
        .collect()
}

#[test]
fn acknowledged_state_and_signing_guard_recover_after_process_kill() {
    let home = tempfile::tempdir().unwrap();
    let (block, world, vote) = crash_after_acknowledged_writes(home.path());
    let segment = home.path().join(format!(
        "chain/history/{:020}.jsonl",
        block.timestamp / 3600
    ));
    assert_eq!(fs::read_to_string(&segment).unwrap().lines().count(), 1);
    let store = Store::open(&home.path().join("chain"), Retention::default(), &genesis()).unwrap();
    assert_eq!(store.head().unwrap(), block);
    assert_eq!(store.world().unwrap(), world);
    assert_eq!(
        store.receipt_block(&transfer(0).hash).unwrap(),
        Some(block.clone())
    );
    let recovered: Vec<Block> = fs::read_to_string(&segment)
        .unwrap()
        .lines()
        .map(|line| serde_json::from_str(line).unwrap())
        .collect();
    assert_eq!(recovered.len(), 2);
    assert_eq!(recovered[1], block);
    let mut signer = DurableSigner::open(
        &home.path().join("signer"),
        7777,
        SigningKey::from_bytes(&[7; 32]),
    )
    .unwrap();
    assert_eq!(
        signer
            .sign(1, 0, Phase::Precommit, Some(block.hash()))
            .unwrap(),
        vote
    );
    assert!(signer.sign(1, 0, Phase::Precommit, Some([9; 32])).is_err());
}

#[test]
fn corrupted_journals_fail_closed_for_state_and_signer() {
    let home = tempfile::tempdir().unwrap();
    crash_after_acknowledged_writes(home.path());
    for db in [
        home.path().join("chain/rocksdb"),
        home.path().join("signer"),
    ] {
        for path in wal_files(&db) {
            let mut bytes = fs::read(&path).unwrap();
            bytes[0] ^= 0xff; // Corrupt the first record checksum without truncating the file.
            fs::write(path, bytes).unwrap();
        }
    }
    assert!(Store::open(&home.path().join("chain"), Retention::default(), &genesis()).is_err());
    assert!(DurableSigner::open(
        &home.path().join("signer"),
        7777,
        SigningKey::from_bytes(&[7; 32])
    )
    .is_err());
}
