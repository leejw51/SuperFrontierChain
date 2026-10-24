mod common;
use common::*;
use revm::primitives::{Address, U256};
use sfc::{
    config::Retention,
    ethereum::{self, Transaction},
    framework::{Application, Module},
    storage::Store,
    types::{World, WEEK},
};
use tempfile::tempdir;

#[test]
fn rpc_contract_callers_are_simulated_without_committing_or_relaxing_transactions() {
    use sfc::{node::Node, rpc};
    let dir = tempdir().unwrap();
    let mut node = Node::open(config(dir.path()), Application::default()).unwrap();
    // Runtime: SSTORE(0, 42); return CALLER, proving that simulation preserves caller identity.
    let init = hex::decode("600e600c600039600e6000f3602a6000553360005260206000f3").unwrap();
    node.submit(&signed(0, None, 0, &init, 100_000, 7777))
        .unwrap();
    let block = node.produce(genesis().timestamp + 1).unwrap();
    let address: Address = block.receipts().unwrap()[0]
        .contract_address
        .as_ref()
        .unwrap()
        .parse()
        .unwrap();
    let before = node.world().unwrap().clone();
    let request = serde_json::json!([{"from":format!("{address:#x}"), "to":format!("{address:#x}")}, "latest"]);
    let output = rpc::call(&mut node, "eth_call", &request).unwrap();
    assert_eq!(
        output,
        serde_json::json!(format!("0x{:0>64}", hex::encode(address)))
    );
    let gas = rpc::call(&mut node, "eth_estimateGas", &request).unwrap();
    assert!(
        u64::from_str_radix(gas.as_str().unwrap().trim_start_matches("0x"), 16).unwrap() > 21_000
    );
    assert_eq!(node.world().unwrap(), &before);
    assert_eq!(node.head(), &block);
    let mut db = ethereum::load_db(&before).unwrap();
    let env = revm::primitives::TxEnv {
        caller: address,
        transact_to: revm::primitives::TxKind::Call(address),
        gas_limit: 100_000,
        ..Default::default()
    };
    for commit in [false, true] {
        let error = ethereum::execute(
            &mut db,
            env.clone(),
            node.context(block.height(), block.timestamp()),
            commit,
        )
        .unwrap_err();
        assert!(
            error.to_string().contains("senders with deployed code"),
            "{error}"
        );
    }
}

#[test]
fn transfer_is_durable_and_replay_is_rejected() {
    let dir = tempdir().unwrap();
    let genesis = genesis();
    let store = Store::open(dir.path(), Retention::default(), &genesis).unwrap();
    let app = Application::default();
    let tx = transfer(0);
    assert_eq!(tx.env.caller, sender());
    let (block, world) = app
        .execute_block(
            &store.head().unwrap(),
            &store.world().unwrap(),
            genesis.timestamp + 1,
            genesis.gas_limit,
            std::slice::from_ref(&tx),
        )
        .unwrap();
    assert_eq!(balance(&world, Address::repeat_byte(0x22)), U256::from(10));
    assert_eq!(block.receipts().unwrap()[0].gas_used, 21_000);
    assert!(app
        .execute_block(
            &block,
            &world,
            block.timestamp() + 1,
            genesis.gas_limit,
            &[tx]
        )
        .is_err());
    store.commit(&block, &world).unwrap();
    drop(store); // Simulated crash before Cap’n Proto projection.
    let store = Store::open(dir.path(), Retention::default(), &genesis).unwrap();
    assert_eq!(store.head().unwrap(), block);
    assert_eq!(store.world().unwrap(), world);
    let path = dir
        .path()
        .join(format!("history/{:020}.capnp", block.timestamp() / 60));
    assert!(path.exists());
    drop(store);
    std::fs::write(&path, b"torn").unwrap();
    let _store = Store::open(dir.path(), Retention::default(), &genesis).unwrap();
    assert_eq!(
        sfc::codec::read_all::<sfc::types::Block>(&mut std::fs::File::open(path).unwrap())
            .unwrap()
            .pop()
            .unwrap(),
        block
    );
}
#[test]
fn prune_by_time_preserves_state_boundary_and_archive() {
    for retention in [Retention::default(), Retention::Archive] {
        let dir = tempdir().unwrap();
        let genesis = genesis();
        let store = Store::open(dir.path(), retention.clone(), &genesis).unwrap();
        let app = Application::default();
        let (first, world) = app
            .execute_block(
                &store.head().unwrap(),
                &store.world().unwrap(),
                genesis.timestamp + 1,
                genesis.gas_limit,
                &[transfer(0)],
            )
            .unwrap();
        store.commit(&first, &world).unwrap();
        store.maintain().unwrap();
        let (second, world) = app
            .execute_block(
                &first,
                &world,
                first.timestamp() + 60,
                genesis.gas_limit,
                &[],
            )
            .unwrap();
        store.commit(&second, &world).unwrap();
        store.maintain().unwrap();
        assert!(store.block(1).unwrap().is_some()); // Exactly 60 seconds remains.
        let (third, world) = app
            .execute_block(
                &second,
                &world,
                second.timestamp() + 1,
                genesis.gas_limit,
                &[],
            )
            .unwrap();
        store.commit(&third, &world).unwrap();
        store.maintain().unwrap();
        assert_eq!(
            store.block(1).unwrap().is_none(),
            matches!(retention, Retention::Pruned { .. })
        );
        assert_eq!(
            balance(&store.world().unwrap(), Address::repeat_byte(0x22)),
            U256::from(10)
        );
        drop(store);
        let store = Store::open(dir.path(), retention, &genesis).unwrap();
        assert_eq!(store.head().unwrap(), third);
    }
}
#[test]
fn invalid_block_cannot_change_state_and_genesis_is_bound() {
    let dir = tempdir().unwrap();
    let mut genesis = genesis();
    let store = Store::open(dir.path(), Retention::default(), &genesis).unwrap();
    let world = store.world().unwrap();
    let head = store.head().unwrap();
    let (mut block, next) = Application::default()
        .execute_block(
            &head,
            &world,
            head.timestamp() + 1,
            genesis.gas_limit,
            &[transfer(0)],
        )
        .unwrap();
    block = sfc::types::Block::build(sfc::types::BlockDraft {
        parent_hash: [7; 32],
        ..block_draft(&block)
    })
    .unwrap();
    assert!(store.commit(&block, &next).is_err());
    assert_eq!(store.world().unwrap(), world);
    assert_eq!(store.head().unwrap(), head);
    assert_eq!(store.head_hash().unwrap(), head.hash());
    drop(store);
    genesis.chain_id += 1;
    assert!(Store::open(dir.path(), Retention::default(), &genesis).is_err());
}
#[test]
fn malformed_and_wrong_chain_transactions_rejected() {
    let raw = transfer(0).raw;
    assert!(Transaction::decode(&raw, 1).is_err());
    let mut trailing = raw.to_vec();
    trailing.push(0);
    assert!(Transaction::decode(&trailing, 7777).is_err());
    for bytes in [vec![], vec![0], vec![2], vec![0xff; 50], vec![0xf8, 0]] {
        assert!(Transaction::decode(&bytes, 7777).is_err());
    }
}
#[test]
fn evm_deploy_call_revert_and_storage() {
    let dir = tempdir().unwrap();
    let genesis = genesis();
    let store = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
    // Runtime stores calldata word in slot zero, then returns it.
    let runtime = hex::decode("60003560005560005460005260206000f3").unwrap();
    let mut init = vec![
        0x60,
        runtime.len() as u8,
        0x60,
        12,
        0x60,
        0,
        0x39,
        0x60,
        runtime.len() as u8,
        0x60,
        0,
        0xf3,
    ];
    init.extend(runtime);
    let tx = Transaction::decode(&signed(0, None, 0, &init, 200_000, 7777), 7777).unwrap();
    let app = Application::default();
    let (block, world) = app
        .execute_block(
            &store.head().unwrap(),
            &store.world().unwrap(),
            genesis.timestamp + 1,
            genesis.gas_limit,
            &[tx],
        )
        .unwrap();
    let address: Address = block.receipts().unwrap()[0]
        .contract_address
        .as_ref()
        .unwrap()
        .parse()
        .unwrap();
    let tx = Transaction::decode(
        &signed(
            1,
            Some(address),
            0,
            &U256::from(42).to_be_bytes::<32>(),
            100_000,
            7777,
        ),
        7777,
    )
    .unwrap();
    let (block, world) = app
        .execute_block(
            &block,
            &world,
            block.timestamp() + 1,
            genesis.gas_limit,
            &[tx],
        )
        .unwrap();
    assert!(block.receipts().unwrap()[0].success);
    assert_eq!(world.accounts[&format!("{address:#x}")].storage["0"], "42");
    let mut db = ethereum::load_db(&world).unwrap();
    let result = ethereum::execute(
        &mut db,
        revm::primitives::TxEnv {
            caller: sender(),
            transact_to: revm::primitives::TxKind::Call(address),
            gas_limit: 100_000,
            data: U256::from(99).to_be_bytes::<32>().to_vec().into(),
            ..Default::default()
        },
        ethereum::Context {
            chain_id: 7777,
            height: 3,
            timestamp: genesis.timestamp + 3,
            gas_limit: genesis.gas_limit,
        },
        false,
    )
    .unwrap();
    assert_eq!(
        ethereum::output(result).unwrap(),
        U256::from(99).to_be_bytes::<32>()
    );
    let mut after = world.clone();
    ethereum::save_db(&db, &mut after).unwrap();
    assert_eq!(after, world);
}
#[test]
fn failing_module_rolls_back_entire_block() {
    struct Fails;
    impl Module for Fails {
        fn name(&self) -> &str {
            "fails"
        }
        fn end_block(&self, _: ethereum::Context, state: &mut World) -> anyhow::Result<()> {
            state.module_state.insert("test".into(), "bad".into());
            anyhow::bail!("failure")
        }
    }
    let dir = tempdir().unwrap();
    let genesis = genesis();
    let store = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
    let world = store.world().unwrap();
    let app = Application::default().with_module(Fails).unwrap();
    assert!(app
        .execute_block(
            &store.head().unwrap(),
            &world,
            genesis.timestamp + 1,
            genesis.gas_limit,
            &[transfer(0)]
        )
        .is_err());
    assert_eq!(store.world().unwrap(), world);
}

#[test]
fn queued_execution_matches_strict_import_and_rejects_tampering() {
    let leader_dir = tempdir().unwrap();
    let follower_dir = tempdir().unwrap();
    let mut leader =
        sfc::node::Node::open(config(leader_dir.path()), Application::default()).unwrap();
    let mut follower_config = config(follower_dir.path());
    follower_config.sync_peer = Some(sfc::config::SyncPeer {
        transport: sfc::config::Transport::Http3,
        address: "127.0.0.1:26656".parse().unwrap(),
        server_name: "localhost".into(),
        certificate: leader_dir.path().join("cert.der"),
    });
    let mut follower = sfc::node::Node::open(follower_config, Application::default()).unwrap();
    for nonce in 0..25 {
        leader.submit(&transfer(nonce).raw).unwrap();
    }
    leader.submit(&transfer(0).raw).unwrap();
    assert_eq!(leader.pending_len(), 25);
    let block = leader.produce(genesis().timestamp + 1).unwrap();
    assert_eq!(block.transaction_count(), 25);
    assert_eq!(leader.pending_len(), 0);
    let mut corrupt = block_draft(&block);
    corrupt.state_root = [0; 32];
    assert!(follower
        .import_encoded(sfc::types::Block::build(corrupt).unwrap())
        .is_err());
    assert_eq!(follower.head().height(), 0);
    follower.import_encoded(block).unwrap();
    assert_eq!(follower.head(), leader.head());
    assert_eq!(follower.world().unwrap(), leader.world().unwrap());
    assert!(follower.produce(genesis().timestamp + 2).is_err());
}
#[test]
fn hourly_capnp_rotation_prunes_even_when_hour_was_sparse() {
    let dir = tempdir().unwrap();
    let genesis = genesis();
    let store = Store::open(dir.path(), Retention::default(), &genesis).unwrap();
    let old_hour = genesis.timestamp / 3600;
    let mut head = store.head().unwrap();
    let mut world = store.world().unwrap();
    for timestamp in [
        genesis.timestamp + WEEK + 1,
        (old_hour + 1) * 3600 + WEEK + 1,
    ] {
        let (next, state) = Application::default()
            .execute_block(&head, &world, timestamp, genesis.gas_limit, &[])
            .unwrap();
        store.commit(&next, &state).unwrap();
        store.maintain().unwrap();
        head = next;
        world = state;
    }
    assert!(!dir
        .path()
        .join(format!("history/{old_hour:020}.capnp"))
        .exists());
}
#[test]
fn pruning_removes_receipt_index() {
    let dir = tempdir().unwrap();
    let genesis = genesis();
    let store = Store::open(dir.path(), Retention::default(), &genesis).unwrap();
    let tx = transfer(0);
    let app = Application::default();
    let (first, world) = app
        .execute_block(
            &store.head().unwrap(),
            &store.world().unwrap(),
            genesis.timestamp + 1,
            genesis.gas_limit,
            std::slice::from_ref(&tx),
        )
        .unwrap();
    store.commit(&first, &world).unwrap();
    store.maintain().unwrap();
    assert!(store.receipt_block(&tx.hash).unwrap().is_some());
    let (second, world) = app
        .execute_block(
            &first,
            &world,
            first.timestamp() + WEEK + 1,
            genesis.gas_limit,
            &[],
        )
        .unwrap();
    store.commit(&second, &world).unwrap();
    store.maintain().unwrap();
    assert!(store.receipt_block(&tx.hash).unwrap().is_none());
}

#[test]
fn receipt_indexes_preserve_every_transaction_and_block_order_after_restart() {
    let dir = tempfile::tempdir().unwrap();
    let genesis = genesis();
    let store = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
    let transactions: Vec<_> = (0..256).map(transfer).collect();
    let (block, world) = Application::default()
        .execute_block(
            &store.head().unwrap(),
            &store.world().unwrap(),
            genesis.timestamp + 1,
            genesis.gas_limit,
            &transactions,
        )
        .unwrap();
    let bytes = block.as_bytes().to_vec();
    store.commit(&block, &world).unwrap();
    for tx in &transactions {
        assert_eq!(
            store.receipt_block(&tx.hash).unwrap().unwrap().as_bytes(),
            bytes
        );
    }
    drop(store);
    let store = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
    assert_eq!(store.head().unwrap().as_bytes(), bytes);
    for tx in &transactions {
        assert_eq!(
            store.receipt_block(&tx.hash).unwrap().unwrap().as_bytes(),
            bytes
        );
    }
}
