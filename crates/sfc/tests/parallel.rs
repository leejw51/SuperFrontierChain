mod common;
use common::*;
use sfc::{
    ethereum::{decode_batch, Transaction},
    framework::Application,
    node::Node,
};

#[test]
fn millisecond_block_intervals_require_a_nonzero_timer() {
    let dir = tempfile::tempdir().unwrap();
    let mut configuration = common::config(dir.path());
    for interval in [1, 2, 5, 10, 100] {
        configuration.block_interval_ms = interval;
        configuration.validate().unwrap();
    }
    configuration.block_interval_ms = 0;
    assert!(configuration.validate().is_err());
}

#[test]
fn parallel_decode_preserves_order_and_chooses_first_error() {
    let mut raw: Vec<_> = (0..96).map(|nonce| transfer(nonce).raw).collect();
    for threads in [1, 2, 4] {
        let pool = rayon::ThreadPoolBuilder::new()
            .num_threads(threads)
            .build()
            .unwrap();
        let decoded = pool.install(|| decode_batch(&raw, 7777)).unwrap();
        for (index, tx) in decoded.iter().enumerate() {
            let expected = Transaction::decode(&raw[index], 7777).unwrap();
            assert_eq!(tx.hash, expected.hash);
            assert_eq!(tx.env, expected.env);
            assert_eq!(tx.env.nonce, Some(index as u64));
        }
    }
    raw[7] = vec![0].into();
    raw[60] = vec![2].into();
    for threads in [1, 2, 4] {
        let pool = rayon::ThreadPoolBuilder::new()
            .num_threads(threads)
            .build()
            .unwrap();
        assert_eq!(
            pool.install(|| decode_batch(&raw, 7777))
                .unwrap_err()
                .to_string(),
            "transaction 7"
        );
    }
}
#[test]
fn parallel_admission_matches_serial_state_and_receipts() {
    let raw: Vec<_> = (0..96).map(|nonce| transfer(nonce).raw).collect();
    let dir = tempfile::tempdir().unwrap();
    let mut serial = Node::open(config(dir.path()), Application::default()).unwrap();
    for tx in &raw {
        serial.submit(tx).unwrap();
    }
    let expected = serial.produce(genesis().timestamp + 1).unwrap();
    for threads in [1, 2, 4] {
        let dir = tempfile::tempdir().unwrap();
        let mut parallel = Node::open(config(dir.path()), Application::default()).unwrap();
        let pool = rayon::ThreadPoolBuilder::new()
            .num_threads(threads)
            .build()
            .unwrap();
        let results = pool.install(|| parallel.submit_batch(&raw)).unwrap();
        assert!(results.iter().all(Result::is_ok));
        assert_eq!(parallel.produce(genesis().timestamp + 1).unwrap(), expected);
        assert_eq!(parallel.world().unwrap(), serial.world().unwrap());
        let follower_dir = tempfile::tempdir().unwrap();
        let mut follower_config = config(follower_dir.path());
        follower_config.sync_peer = Some(sfc::config::SyncPeer {
            transport: sfc::config::Transport::Http3,
            address: "127.0.0.1:26656".parse().unwrap(),
            server_name: "localhost".into(),
            certificate: follower_dir.path().join("peer.der"),
        });
        let mut follower = Node::open(follower_config, Application::default()).unwrap();
        pool.install(|| follower.import_encoded(expected.clone()))
            .unwrap();
        assert_eq!(follower.head(), &expected);
        assert_eq!(follower.world().unwrap(), serial.world().unwrap());
    }
}
#[test]
fn batch_failures_are_isolated_and_resource_limits_are_checked() {
    let dir = tempfile::tempdir().unwrap();
    let mut node = Node::open(config(dir.path()), Application::default()).unwrap();
    let raw = vec![
        transfer(0).raw,
        vec![0].into(),
        transfer(1).raw,
        transfer(0).raw,
    ];
    let results = node.submit_batch(&raw).unwrap();
    assert!(results[0].is_ok());
    assert!(results[1].is_err());
    assert!(results[2].is_ok());
    assert_eq!(results[0].as_ref().unwrap(), results[3].as_ref().unwrap());
    assert_eq!(node.pending_len(), 2);
    assert!(node.submit_batch(&vec![Vec::<u8>::new(); 4097]).is_err());
    assert!(decode_batch(&[vec![0; 128 * 1024 + 1]], 7777).is_err());
    assert!(decode_batch(&vec![vec![0; 128 * 1024]; 17], 7777).is_err());
    assert_eq!(node.pending_len(), 2);
}

#[test]
fn reused_executor_isolates_reverts_and_invalid_nonces() {
    use revm::primitives::Address;
    let contract = sender().create(0);
    // Store 42 then revert: storage must roll back, while gas and nonce are consumed.
    let init = hex::decode("600a600c600039600a6000f3602a60005560006000fd").unwrap();
    let raw = vec![
        signed(0, None, 0, &init, 200_000, 7777),
        signed(1, Some(contract), 0, &[], 100_000, 7777),
        signed(99, Some(Address::repeat_byte(0x22)), 10, &[], 21_000, 7777),
        transfer(2).raw.to_vec(),
        transfer(3).raw.to_vec(),
    ];
    let serial_dir = tempfile::tempdir().unwrap();
    let batch_dir = tempfile::tempdir().unwrap();
    let mut serial = Node::open(config(serial_dir.path()), Application::default()).unwrap();
    let mut batch = Node::open(config(batch_dir.path()), Application::default()).unwrap();
    let results = batch.submit_batch(&raw).unwrap();
    for (index, bytes) in raw.iter().enumerate() {
        assert_eq!(results[index].is_ok(), index != 2);
        assert_eq!(serial.submit(bytes).is_ok(), index != 2);
    }
    let expected = serial.produce(genesis().timestamp + 1).unwrap();
    let block = batch.produce(genesis().timestamp + 1).unwrap();
    assert_eq!(block, expected);
    assert_eq!(batch.world().unwrap(), serial.world().unwrap());
    assert_eq!(block.receipts().unwrap().len(), 4);
    assert!(!block.receipts().unwrap()[1].success);
    assert!(batch.world().unwrap().accounts[&format!("{contract:#x}")]
        .storage
        .is_empty());
    assert_eq!(batch.store.head_hash().unwrap(), block.hash());
}
