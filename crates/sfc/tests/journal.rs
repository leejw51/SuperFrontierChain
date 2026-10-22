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
    let count: u64 = std::env::var("SFC_JOURNAL_BLOCK_COUNT")
        .unwrap_or_else(|_| "1".into())
        .parse()
        .unwrap();
    let batch: u64 = std::env::var("SFC_JOURNAL_BATCH_SIZE")
        .unwrap_or_else(|_| "1".into())
        .parse()
        .unwrap();
    let mut block = store.head().unwrap();
    let mut world = store.world().unwrap();
    for height in 1..=count {
        let transactions: Vec<_> = ((height - 1) * batch..height * batch)
            .map(transfer)
            .collect();
        (block, world) = Application::default()
            .execute_block(
                &block,
                &world,
                genesis.timestamp + height,
                genesis.gas_limit,
                &transactions,
            )
            .unwrap();
        store.commit(&block, &world).unwrap();
        if std::env::var_os("SFC_JOURNAL_MAINTAIN").is_some() {
            store.maintain().unwrap();
        }
    }
    // Deliberately leave both databases open for the parent's SIGKILL.
    let mut signer =
        DurableSigner::open(&home.join("signer"), 7777, SigningKey::from_bytes(&[7; 32])).unwrap();
    let vote = signer
        .sign(block.height(), 0, Phase::Precommit, Some(block.hash()))
        .unwrap();
    let mut expected = Vec::new();
    for bytes in [
        block.as_bytes().to_vec(),
        sfc::codec::to_vec(&world).unwrap(),
        sfc::codec::to_vec(&vote).unwrap(),
    ] {
        sfc::codec::write_record(&mut expected, &bytes).unwrap();
    }
    fs::write(home.join("ready.tmp"), expected).unwrap();
    fs::rename(home.join("ready.tmp"), home.join("ready.capnp")).unwrap();
    loop {
        std::thread::park_timeout(Duration::from_secs(60));
    }
}

fn crash_after_acknowledged_writes(home: &Path) -> (Block, World, Vote) {
    crash_after_writes(home, false)
}

fn crash_after_writes(home: &Path, maintain: bool) -> (Block, World, Vote) {
    crash_after_batches(home, maintain, 1, 1)
}

fn crash_after_batches(
    home: &Path,
    maintain: bool,
    count: u64,
    batch: u64,
) -> (Block, World, Vote) {
    let mut command = Command::new(std::env::current_exe().unwrap());
    if maintain {
        command.env("SFC_JOURNAL_MAINTAIN", "1");
    } else {
        command.env_remove("SFC_JOURNAL_MAINTAIN");
    }
    let child = command
        .args([
            "--exact",
            "journal_crash_worker",
            "--ignored",
            "--nocapture",
        ])
        .env("SFC_JOURNAL_TEST_HOME", home)
        .env("SFC_JOURNAL_BLOCK_COUNT", count.to_string())
        .env("SFC_JOURNAL_BATCH_SIZE", batch.to_string())
        .stdout(Stdio::null())
        .spawn()
        .unwrap();
    let mut child = KillOnDrop(child);
    let deadline = Instant::now() + Duration::from_secs(30);
    while !home.join("ready.capnp").exists() {
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
    let bytes = fs::read(home.join("ready.capnp")).unwrap();
    let mut input = bytes.as_slice();
    (
        sfc::codec::from_slice(&sfc::codec::read_record(&mut input).unwrap().unwrap()).unwrap(),
        sfc::codec::from_slice(&sfc::codec::read_record(&mut input).unwrap().unwrap()).unwrap(),
        sfc::codec::from_slice(&sfc::codec::read_record(&mut input).unwrap().unwrap()).unwrap(),
    )
}

#[test]
fn entire_unsynced_history_recovers_after_many_acknowledged_blocks() {
    let home = tempfile::tempdir().unwrap();
    let (head, world, _) = crash_after_batches(home.path(), true, 32, 1024);
    let history = home.path().join("chain/history");
    let paths: Vec<_> = fs::read_dir(&history)
        .unwrap()
        .map(|entry| entry.unwrap().path())
        .collect();
    let bytes: u64 = paths.iter().map(|p| fs::metadata(p).unwrap().len()).sum();
    assert!(bytes > 8 * 1024 * 1024);
    // Lose every rebuildable segment after SIGKILL, including several batches
    // beyond the former 8 MiB checkpoint. Authoritative WAL files stay intact.
    for path in paths {
        fs::remove_file(path).unwrap();
    }
    let store = Store::open(&home.path().join("chain"), Retention::default(), &genesis()).unwrap();
    assert_eq!(store.head().unwrap(), head);
    assert_eq!(store.world().unwrap(), world);
    let mut blocks: Vec<Block> = fs::read_dir(history)
        .unwrap()
        .flat_map(|entry| {
            sfc::codec::read_all::<Block>(&mut fs::File::open(entry.unwrap().path()).unwrap())
                .unwrap()
        })
        .collect();
    blocks.sort_by_key(Block::height);
    assert_eq!(blocks.len(), 33);
    for (height, block) in blocks.iter().enumerate() {
        assert_eq!(block.height(), height as u64);
        assert_eq!(store.block(height as u64).unwrap().as_ref(), Some(block));
    }
    assert_eq!(
        store.receipt_block(&transfer(32 * 1024 - 1).hash).unwrap(),
        Some(head)
    );
}

#[test]
fn batched_history_recovers_missing_or_torn_tail_after_kill() {
    for torn in [false, true] {
        let home = tempfile::tempdir().unwrap();
        let (block, world, _) = crash_after_writes(home.path(), true);
        let segment = home.path().join(format!(
            "chain/history/{:020}.capnp",
            block.timestamp() / 60
        ));
        let file = fs::OpenOptions::new().write(true).open(&segment).unwrap();
        let retained = if torn {
            file.metadata().unwrap().len() - 5
        } else {
            0
        };
        // Model a power failure losing some or all of the unsynced projection.
        file.set_len(retained).unwrap();
        drop(file);
        let store =
            Store::open(&home.path().join("chain"), Retention::default(), &genesis()).unwrap();
        assert_eq!(store.head().unwrap(), block);
        assert_eq!(store.world().unwrap(), world);
        let recovered: Vec<Block> =
            sfc::codec::read_all(&mut fs::File::open(&segment).unwrap()).unwrap();
        assert_eq!(recovered.len(), 2);
        assert_eq!(recovered[1], block);
        assert_eq!(store.receipt_block(&transfer(0).hash).unwrap(), Some(block));
    }
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
        "chain/history/{:020}.capnp",
        block.timestamp() / 60
    ));
    assert_eq!(
        sfc::codec::read_all::<Block>(&mut fs::File::open(&segment).unwrap())
            .unwrap()
            .len(),
        1
    );
    let store = Store::open(&home.path().join("chain"), Retention::default(), &genesis()).unwrap();
    assert_eq!(store.head().unwrap(), block);
    assert_eq!(store.world().unwrap(), world);
    assert_eq!(
        store.receipt_block(&transfer(0).hash).unwrap(),
        Some(block.clone())
    );
    let recovered: Vec<Block> =
        sfc::codec::read_all(&mut fs::File::open(&segment).unwrap()).unwrap();
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
