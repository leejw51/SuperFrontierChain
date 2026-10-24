use sfc::{
    merkle::{key, Proof, Trie},
    types::{hash, Account, Hash, World},
};
use std::collections::BTreeMap;

// Independent sorted rebuild oracle: split the sorted key range at its first
// differing bit. It does not use the incremental insert/remove implementation.
fn reference(items: &[(Hash, Vec<u8>)]) -> Hash {
    use sha3::{Digest, Keccak256};
    fn digest(tag: u8, fields: &[&[u8]]) -> Hash {
        let mut h = Keccak256::new();
        h.update(b"sfc/merkle-patricia/v1");
        h.update([tag]);
        for field in fields {
            h.update(field);
        }
        h.finalize().into()
    }
    match items.len() {
        0 => digest(0, &[]),
        1 => digest(1, &[&items[0].0, &hash(&items[0].1)]),
        n => {
            let a = items[0].0;
            let b = items[n - 1].0;
            let d = (0..256usize)
                .find(|d| (a[d / 8] ^ b[d / 8]) & (0x80 >> (d % 8)) != 0)
                .unwrap();
            let middle = items.partition_point(|(k, _)| k[d / 8] & (0x80 >> (d % 8)) == 0);
            digest(
                2,
                &[
                    &(d as u16).to_be_bytes(),
                    &reference(&items[..middle]),
                    &reference(&items[middle..]),
                ],
            )
        }
    }
}

#[test]
fn incremental_matches_independent_rebuild_and_proofs() {
    let mut trie = Trie::default();
    let mut values = BTreeMap::new();
    for round in 0..600u64 {
        let k = key(0, &(round.wrapping_mul(73) % 151).to_be_bytes());
        if round % 5 == 0 {
            trie.remove(&k);
            values.remove(&k);
        } else {
            let v = round.to_le_bytes().to_vec();
            trie.insert(k, &v);
            values.insert(k, v);
        }
        let items = values
            .iter()
            .map(|(k, v)| (*k, v.clone()))
            .collect::<Vec<_>>();
        assert_eq!(trie.root(), reference(&items));
        assert!(trie
            .prove(&k)
            .verify(trie.root(), k, values.get(&k).map(Vec::as_slice)));
        let absent = key(1, &round.to_le_bytes());
        assert!(trie.prove(&absent).verify(trie.root(), absent, None));
    }
    let mut reversed = Trie::default();
    for (k, v) in values.iter().rev() {
        reversed.insert(*k, v);
    }
    assert_eq!(trie.root(), reversed.root());
    let snapshot = trie.clone();
    for k in values.keys() {
        trie.remove(k);
    }
    assert_eq!(trie.root(), reference(&[]));
    assert_ne!(snapshot.root(), trie.root());
}

#[test]
fn proof_rejects_tampering_and_handles_deep_paths() {
    let mut trie = Trie::default();
    let a = [0; 32];
    let mut b = a;
    b[31] = 1;
    trie.insert(a, b"first");
    trie.insert(b, b"last");
    let proof = trie.prove(&a);
    assert_eq!(proof.path[0].0, 255);
    assert!(proof.verify(trie.root(), a, Some(b"first")));
    assert!(!proof.verify(trie.root(), a, None));
    assert!(!proof.verify(trie.root(), a, Some(b"wrong")));
    assert!(!proof.verify([0; 32], a, Some(b"first")));
    let mut bad = proof.clone();
    bad.path[0].1[0] ^= 1;
    assert!(!bad.verify(trie.root(), a, Some(b"first")));
    let mut bad = proof.clone();
    bad.path.push(bad.path[0]);
    assert!(!bad.verify(trie.root(), a, Some(b"first")));
    let bad = Proof {
        path: vec![(256, [0; 32])],
        leaf: proof.leaf,
    };
    assert!(!bad.verify(trie.root(), a, Some(b"first")));
    let empty = Trie::default();
    assert!(empty.prove(&a).verify(empty.root(), a, None));
    assert!(!empty.prove(&a).verify(empty.root(), a, Some(b"")));
}

#[test]
fn cached_world_root_rebuilds_after_mutation_clone_and_restart_encoding() {
    let mut world = World::default();
    let initial = world.root();
    world.accounts.insert(
        "alice".into(),
        Account {
            balance: "100".into(),
            ..Default::default()
        },
    );
    let funded = world.root();
    assert_ne!(initial, funded);
    let snapshot = world.clone();
    let bytes = sfc::binary::account_bytes(&world.accounts["alice"]).unwrap();
    assert!(world
        .account_proof("alice")
        .verify(funded, key(0, b"alice"), Some(&bytes)));
    assert!(world
        .account_proof("bob")
        .verify(funded, key(0, b"bob"), None));
    world
        .accounts
        .get_mut("alice")
        .unwrap()
        .storage
        .insert("1".into(), "9".into());
    world.module_state.insert("module".into(), "value".into());
    world.block_hashes.insert(0, [7; 32]);
    let updated = world.root();
    assert_ne!(updated, funded);
    assert_eq!(snapshot.root(), funded);
    let decoded =
        sfc::binary::world_from_bytes(&sfc::binary::world_bytes(&world).unwrap()).unwrap();
    assert_eq!(decoded.root(), updated);
    world.accounts.clear();
    world.module_state.clear();
    world.block_hashes.clear();
    assert_eq!(world.root(), initial);
}

#[test]
fn flat_hash_chain_is_rejected_without_rewriting_history() {
    use sfc::{config::Retention, storage::Store, types::Genesis};
    let dir = tempfile::tempdir().unwrap();
    let genesis = Genesis {
        chain_id: 999,
        timestamp: 1,
        gas_limit: 30_000_000,
        alloc: BTreeMap::new(),
    };
    {
        let _store = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
    }
    let block;
    {
        let db = rocksdb::DB::open_cf(
            &rocksdb::Options::default(),
            dir.path().join("rocksdb"),
            ["default", "blocks"],
        )
        .unwrap();
        block = db
            .get_cf(
                db.cf_handle("blocks").unwrap(),
                b"block/00000000000000000000",
            )
            .unwrap()
            .unwrap();
        db.delete(b"meta/state_commitment").unwrap();
    }
    let error = Store::open(dir.path(), Retention::Archive, &genesis)
        .err()
        .unwrap();
    assert!(error.to_string().contains("incompatible state commitment"));
    let db = rocksdb::DB::open_cf(
        &rocksdb::Options::default(),
        dir.path().join("rocksdb"),
        ["default", "blocks"],
    )
    .unwrap();
    assert_eq!(
        db.get_cf(
            db.cf_handle("blocks").unwrap(),
            b"block/00000000000000000000"
        )
        .unwrap()
        .unwrap(),
        block
    );
    assert!(db.get(b"meta/state_commitment").unwrap().is_none());
}
