//! Persistent binary Merkle Patricia trie. Keys are 256-bit Keccak paths;
//! branches commit their split bit and ordered children, leaves commit key/value.
//! This is SFC's commitment format, not Ethereum's hexary RLP MPT.
use crate::types::{hash, Account, Hash, World};
use std::{
    collections::BTreeMap,
    sync::{Arc, Mutex},
};

pub const FORMAT: &[u8] = b"sfc/merkle-patricia/v1";

fn digest(tag: u8, pieces: &[&[u8]]) -> Hash {
    use sha3::{Digest, Keccak256};
    let mut h = Keccak256::new();
    h.update(FORMAT);
    h.update([tag]);
    for p in pieces {
        h.update(p);
    }
    h.finalize().into()
}
pub fn key(namespace: u8, name: &[u8]) -> Hash {
    digest(3, &[&[namespace], name])
}
fn bit(key: &Hash, depth: u16) -> bool {
    key[depth as usize / 8] & (0x80 >> (depth % 8)) != 0
}
fn leaf_hash(key: &Hash, value: &Hash) -> Hash {
    digest(1, &[key, value])
}
fn branch_hash(depth: u16, left: &Hash, right: &Hash) -> Hash {
    digest(2, &[&depth.to_be_bytes(), left, right])
}
fn empty_hash() -> Hash {
    digest(0, &[])
}

#[derive(Clone, Debug)]
enum Node {
    Leaf {
        key: Hash,
        value: Hash,
        hash: Hash,
    },
    Branch {
        depth: u16,
        left: Arc<Node>,
        right: Arc<Node>,
        hash: Hash,
    },
}
impl Node {
    fn hash(&self) -> Hash {
        match self {
            Self::Leaf { hash, .. } | Self::Branch { hash, .. } => *hash,
        }
    }
    fn sample(&self) -> Hash {
        match self {
            Self::Leaf { key, .. } => *key,
            Self::Branch { left, .. } => left.sample(),
        }
    }
}
fn leaf(key: Hash, value: Hash) -> Arc<Node> {
    Arc::new(Node::Leaf {
        key,
        value,
        hash: leaf_hash(&key, &value),
    })
}
fn branch(depth: u16, left: Arc<Node>, right: Arc<Node>) -> Arc<Node> {
    Arc::new(Node::Branch {
        depth,
        hash: branch_hash(depth, &left.hash(), &right.hash()),
        left,
        right,
    })
}
fn insert(node: &Arc<Node>, key: Hash, value: Hash) -> Arc<Node> {
    let sample = node.sample();
    let split = (0..256).find(|&d| bit(&sample, d) != bit(&key, d));
    let depth = match node.as_ref() {
        Node::Branch { depth, .. } => *depth,
        Node::Leaf { .. } => 256,
    };
    if let Some(split) = split.filter(|s| *s < depth) {
        let new = leaf(key, value);
        return if bit(&key, split) {
            branch(split, node.clone(), new)
        } else {
            branch(split, new, node.clone())
        };
    }
    match node.as_ref() {
        Node::Leaf { value: old, .. } => {
            if *old == value {
                node.clone()
            } else {
                leaf(key, value)
            }
        }
        Node::Branch {
            depth, left, right, ..
        } => {
            if bit(&key, *depth) {
                branch(*depth, left.clone(), insert(right, key, value))
            } else {
                branch(*depth, insert(left, key, value), right.clone())
            }
        }
    }
}
fn remove(node: &Arc<Node>, key: &Hash) -> Option<Arc<Node>> {
    match node.as_ref() {
        Node::Leaf { key: old, .. } => {
            if old == key {
                None
            } else {
                Some(node.clone())
            }
        }
        Node::Branch {
            depth, left, right, ..
        } => {
            if bit(key, *depth) {
                Some(match remove(right, key) {
                    Some(r) => branch(*depth, left.clone(), r),
                    None => left.clone(),
                })
            } else {
                Some(match remove(left, key) {
                    Some(l) => branch(*depth, l, right.clone()),
                    None => right.clone(),
                })
            }
        }
    }
}

#[derive(Clone, Debug, Default)]
pub struct Trie {
    root: Option<Arc<Node>>,
}
impl Trie {
    pub fn root(&self) -> Hash {
        self.root.as_ref().map_or_else(empty_hash, |r| r.hash())
    }
    pub fn insert(&mut self, key: Hash, value: &[u8]) {
        let value = hash(value);
        self.root = Some(match &self.root {
            Some(r) => insert(r, key, value),
            None => leaf(key, value),
        });
    }
    pub fn remove(&mut self, key: &Hash) {
        self.root = self.root.as_ref().and_then(|r| remove(r, key));
    }
    pub fn prove(&self, key: &Hash) -> Proof {
        let mut path = Vec::new();
        let mut node = self.root.as_deref();
        while let Some(n) = node {
            match n {
                Node::Leaf { key, value, .. } => {
                    return Proof {
                        path,
                        leaf: Some((*key, *value)),
                    }
                }
                Node::Branch {
                    depth, left, right, ..
                } => {
                    let (next, sibling) = if bit(key, *depth) {
                        (right, left)
                    } else {
                        (left, right)
                    };
                    path.push((*depth, sibling.hash()));
                    node = Some(next);
                }
            }
        }
        Proof { path, leaf: None }
    }
}

/// Root-to-leaf split bits/sibling hashes, and the reached leaf (or empty trie).
#[derive(Clone, Debug)]
pub struct Proof {
    pub path: Vec<(u16, Hash)>,
    pub leaf: Option<(Hash, Hash)>,
}
impl Proof {
    pub fn verify(&self, root: Hash, key: Hash, value: Option<&[u8]>) -> bool {
        if self.path.len() > 256
            || self.path.iter().any(|(d, _)| *d >= 256)
            || self.path.windows(2).any(|w| w[0].0 >= w[1].0)
        {
            return false;
        }
        let mut current = match self.leaf {
            None => return value.is_none() && self.path.is_empty() && root == empty_hash(),
            Some((found, v)) => {
                if self
                    .path
                    .iter()
                    .any(|(d, _)| bit(&found, *d) != bit(&key, *d))
                {
                    return false;
                }
                match value {
                    Some(bytes) if found == key && v == hash(bytes) => (),
                    None if found != key => (),
                    _ => return false,
                }
                leaf_hash(&found, &v)
            }
        };
        for (depth, sibling) in self.path.iter().rev() {
            current = if bit(&key, *depth) {
                branch_hash(*depth, sibling, &current)
            } else {
                branch_hash(*depth, &current, sibling)
            };
        }
        current == root
    }
}

#[derive(Clone, Debug, Default)]
struct State {
    trie: Trie,
    accounts: BTreeMap<String, Arc<Account>>,
    modules: BTreeMap<String, String>,
    blocks: BTreeMap<u64, Hash>,
}
impl State {
    fn sync(&mut self, world: &World) {
        for name in self
            .accounts
            .keys()
            .filter(|k| !world.accounts.contains_key(*k))
        {
            self.trie.remove(&key(0, name.as_bytes()));
        }
        self.accounts.retain(|k, _| world.accounts.contains_key(k));
        for (name, account) in &world.accounts {
            if self
                .accounts
                .get(name)
                .is_none_or(|old| old.as_ref() != account)
            {
                self.trie.insert(
                    key(0, name.as_bytes()),
                    &crate::binary::account_bytes(account).expect("valid account"),
                );
                self.accounts
                    .insert(name.clone(), Arc::new(account.clone()));
            }
        }
        for name in self
            .modules
            .keys()
            .filter(|k| !world.module_state.contains_key(*k))
        {
            self.trie.remove(&key(1, name.as_bytes()));
        }
        for (name, value) in &world.module_state {
            if self.modules.get(name) != Some(value) {
                self.trie.insert(key(1, name.as_bytes()), value.as_bytes());
            }
        }
        self.modules.clone_from(&world.module_state);
        for height in self
            .blocks
            .keys()
            .filter(|k| !world.block_hashes.contains_key(*k))
        {
            self.trie.remove(&key(2, &height.to_be_bytes()));
        }
        for (height, value) in &world.block_hashes {
            if self.blocks.get(height) != Some(value) {
                self.trie.insert(key(2, &height.to_be_bytes()), value);
            }
        }
        self.blocks.clone_from(&world.block_hashes);
    }
}
/// Derived cache only; never serialized or used for semantic World equality.
/// Public maps require a change-detection scan; only changed paths are rehashed.
#[derive(Debug, Default)]
pub struct StateCache(Mutex<State>);
impl Clone for StateCache {
    fn clone(&self) -> Self {
        Self(Mutex::new(self.0.lock().expect("state cache").clone()))
    }
}
impl PartialEq for StateCache {
    fn eq(&self, _: &Self) -> bool {
        true
    }
}
impl Eq for StateCache {}
impl StateCache {
    pub fn root(&self, world: &World) -> Hash {
        let mut state = self.0.lock().expect("state cache");
        state.sync(world);
        state.trie.root()
    }
    pub fn prove(&self, world: &World, key: &Hash) -> Proof {
        let mut state = self.0.lock().expect("state cache");
        state.sync(world);
        state.trie.prove(key)
    }
}
