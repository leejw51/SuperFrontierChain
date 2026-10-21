mod common;
use revm::{
    primitives::{Address, U256},
    Database,
};
use sfc::{ethereum, evm_db::OrderedDb};

#[test]
fn evm_state_and_execution_ignore_insertion_order() {
    let world = common::genesis().world().unwrap();
    let mut first = ethereum::load_db(&world).unwrap();
    let mut second = OrderedDb::default();
    for (address, account) in first.accounts.iter().rev() {
        second.insert_account_info(*address, account.info.clone());
    }
    let address = common::sender();
    for slot in 1..=40 {
        first
            .insert_account_storage(address, U256::from(slot), U256::from(slot * 2))
            .unwrap();
    }
    for slot in (1..=40).rev() {
        second
            .insert_account_storage(address, U256::from(slot), U256::from(slot * 2))
            .unwrap();
    }
    // Reads of missing keys must not mutate state.
    let count = second.accounts.len();
    assert!(second.basic(Address::repeat_byte(0x99)).unwrap().is_none());
    assert_eq!(second.accounts.len(), count);
    let context = ethereum::Context {
        chain_id: 7777,
        height: 1,
        timestamp: 1_000_001,
        gas_limit: 30_000_000,
    };
    for nonce in 0..20 {
        let tx = common::transfer(nonce);
        let a = ethereum::execute(&mut first, tx.env.clone(), context, true).unwrap();
        let b = ethereum::execute(&mut second, tx.env.clone(), context, true).unwrap();
        assert_eq!(a, b);
    }
    let mut a = world.clone();
    let mut b = world.clone();
    ethereum::save_db(&first, &mut a).unwrap();
    ethereum::save_db(&second, &mut b).unwrap();
    assert_eq!(a, b);
    assert_eq!(a.root(), b.root());
    assert_eq!(
        sfc::codec::to_vec(&a).unwrap(),
        sfc::codec::to_vec(&b).unwrap()
    );
}

#[test]
fn core_sources_exclude_unordered_collections_and_ambient_entropy() {
    // Regression guard for owned core code, not a transitive dependency guarantee.
    for source in [
        include_str!("../src/node.rs"),
        include_str!("../src/types.rs"),
        include_str!("../src/ethereum.rs"),
        include_str!("../src/evm_db.rs"),
        include_str!("../src/framework.rs"),
        include_str!("../src/consensus.rs"),
    ] {
        for forbidden in [
            "HashMap",
            "HashSet",
            "SystemTime",
            "Instant::",
            "thread_rng",
            "rand::",
            "RandomState",
        ] {
            assert!(!source.contains(forbidden), "core contains {forbidden}");
        }
    }
}

#[test]
fn ordered_database_handles_creation_deletion_and_zero_slots() {
    use revm::primitives::{Account, AccountInfo, EvmStorageSlot};
    let address = Address::repeat_byte(0x33);
    let mut db = OrderedDb::default();
    db.insert_account_info(address, AccountInfo::default());
    db.insert_account_storage(address, U256::from(1), U256::from(7))
        .unwrap();
    let mut created = Account::default();
    created.mark_touch();
    created.mark_created();
    created.storage.insert(
        U256::from(2),
        EvmStorageSlot::new_changed(U256::ZERO, U256::from(8)),
    );
    db.apply([(address, created)]);
    assert_eq!(db.storage(address, U256::from(1)).unwrap(), U256::ZERO);
    assert_eq!(db.storage(address, U256::from(2)).unwrap(), U256::from(8));
    let mut cleared = Account::default();
    cleared.mark_touch();
    cleared.storage.insert(
        U256::from(2),
        EvmStorageSlot::new_changed(U256::from(8), U256::ZERO),
    );
    db.apply([(address, cleared)]);
    assert!(db.accounts[&address].storage.is_empty());
    let mut destroyed = Account::default();
    destroyed.mark_touch();
    destroyed.mark_selfdestruct();
    db.apply([(address, destroyed)]);
    assert!(db.basic(address).unwrap().is_none());
}

#[test]
fn block_context_has_stable_commitments_after_pruning_and_restart() {
    use sfc::{config::Retention, framework::Application, node::Node, types::hex_hash};
    let dir = tempfile::tempdir().unwrap();
    let mut config = common::config(dir.path());
    config.retention = Retention::Pruned { seconds: 2 };
    let mut node = Node::open(config.clone(), Application::default()).unwrap();
    // Store TIMESTAMP, NUMBER, CHAINID and BLOCKHASH at distances 1, 256 and 257.
    let runtime = hex::decode(
        "426000554360015546600255600143034060035561010043034060045561010143034060055500",
    )
    .unwrap();
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
    node.submit(&common::signed(0, None, 0, &init, 200_000, 7777))
        .unwrap();
    let deployment = node.produce(common::genesis().timestamp + 1).unwrap();
    let address: Address = deployment.receipts().unwrap()[0]
        .contract_address
        .as_ref()
        .unwrap()
        .parse()
        .unwrap();
    let mut boundary_hash = [0; 32];
    for height in 2..=257 {
        let block = node.produce(common::genesis().timestamp + height).unwrap();
        if height == 2 {
            boundary_hash = block.hash();
        }
    }
    let parent_hash = node.head().hash();
    assert!(node.store.block(2).unwrap().is_none());
    drop(node);
    let mut node = Node::open(config, Application::default()).unwrap();
    assert_eq!(node.head().hash(), parent_hash);
    node.submit(&common::signed(1, Some(address), 0, &[], 200_000, 7777))
        .unwrap();
    let block = node.produce(common::genesis().timestamp + 258).unwrap();
    assert!(block.receipts().unwrap()[0].success);
    let slots = &node.world().unwrap().accounts[&format!("{address:#x}")].storage;
    assert_eq!(slots["0"], (common::genesis().timestamp + 258).to_string());
    assert_eq!(slots["1"], "258");
    assert_eq!(slots["2"], "7777");
    assert_eq!(slots["3"], U256::from_be_bytes(parent_hash).to_string());
    assert_eq!(slots["4"], U256::from_be_bytes(boundary_hash).to_string());
    assert!(!slots.contains_key("5")); // Out-of-window hash is zero, canonicalized away.
                                       // Protocol-v3 typed-segment vectors also detect accidental consensus changes across builds/platforms.
    assert_eq!(
        hex_hash(&block.state_root()),
        "0xa18ea46976f3fd13c47b014e1a2b4c1e564e0bac6d6c8564390a3a95576c94f5"
    );
    assert_eq!(
        hex_hash(&block.hash()),
        "0x7fec2ecfb03bf08d5e805b78be62f697019944bba8f5620ea5050855ad654d0e"
    );
}
