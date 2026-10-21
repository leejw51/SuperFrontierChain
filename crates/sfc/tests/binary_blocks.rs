use sfc::{
    storage_capnp,
    types::{Block, BlockDraft, Receipt},
};

fn draft() -> BlockDraft {
    BlockDraft {
        chain_id: 7777,
        height: 12,
        timestamp: 123,
        parent_hash: [1; 32],
        state_root: [2; 32],
        transactions: vec![vec![3; 100].into(), vec![4; 101].into()],
        receipts: (0..2)
            .map(|i| Receipt {
                transaction_hash: [i; 32],
                from: "sender".into(),
                to: Some("recipient".into()),
                success: true,
                gas_used: 21000,
                cumulative_gas_used: (u64::from(i) + 1) * 21000,
                contract_address: None,
                logs: vec![],
            })
            .collect(),
    }
}

#[test]
fn canonical_arena_matches_reference_and_borrows_payload() {
    let input = draft();
    let block = Block::build_from(&input).unwrap();
    let copy = block.clone();
    assert_eq!(block.as_bytes().as_ptr(), copy.as_bytes().as_ptr());
    let reader = block.read().unwrap();
    let reference = reader.canonicalize().unwrap();
    assert_eq!(block.as_bytes(), capnp::Word::words_to_bytes(&reference));
    assert_eq!(block.transactions().unwrap(), input.transactions);
    assert_eq!(block.receipts().unwrap(), input.receipts);
    let root = reader.get_root::<storage_capnp::block::Reader>().unwrap();
    let tx = root.get_transactions().unwrap().get(0).unwrap();
    let start = block.as_bytes().as_ptr() as usize;
    let end = start + block.as_bytes().len();
    assert!((start..end).contains(&(tx.as_ptr() as usize)));
    assert!(tx.as_ptr() as usize + tx.len() <= end);
    assert_eq!(block.hash(), copy.hash());
}

#[test]
fn malformed_and_noncanonical_blocks_are_rejected() {
    let block = Block::build(draft()).unwrap();
    assert!(Block::from_bytes(Vec::new()).is_err());
    assert!(Block::from_bytes(block.as_bytes()[..block.as_bytes().len() - 1].to_vec()).is_err());
    let mut trailing = block.as_bytes().to_vec();
    trailing.extend_from_slice(&[0; 8]);
    assert!(Block::from_bytes(trailing).is_err());
    let mut bad = draft();
    bad.receipts.pop();
    assert!(Block::build(bad).is_err());
}

#[test]
fn canonical_bytes_and_hash_are_repeatable() {
    let first = Block::build(draft()).unwrap();
    let second = Block::build(draft()).unwrap();
    assert_eq!(first.as_bytes(), second.as_bytes());
    assert_eq!(first.hash(), second.hash());
    let mut changed = draft();
    let mut tx = changed.transactions[0].to_vec();
    tx[0] ^= 1;
    changed.transactions[0] = tx.into();
    assert_ne!(first.hash(), Block::build(changed).unwrap().hash());
    let restored = Block::from_bytes(first.as_bytes().to_vec()).unwrap();
    assert_eq!(first.hash(), restored.hash());
    assert_eq!(first.state_root(), restored.state_root());
}
