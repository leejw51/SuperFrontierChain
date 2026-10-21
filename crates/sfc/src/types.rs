use anyhow::{ensure, Result};
use serde::{Deserialize, Serialize};
use sha3::{Digest, Keccak256};
use std::collections::BTreeMap;

pub const WEEK: u64 = 7 * 24 * 60 * 60;
pub const MAX_BLOCK_TRANSACTIONS: usize = 4096;
pub const MAX_BLOCK_BYTES: usize = 2 * 1024 * 1024;
pub const MAX_PENDING_BYTES: usize = 64 * 1024 * 1024;
pub const MAX_TX_BYTES: usize = 128 * 1024;
pub type Hash = [u8; 32];

pub fn hash(bytes: &[u8]) -> Hash {
    Keccak256::digest(bytes).into()
}
pub fn hex_hash(value: &Hash) -> String {
    format!("0x{}", hex::encode(value))
}

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct Account {
    pub balance: String,
    pub nonce: u64,
    pub code: String,
    pub storage: BTreeMap<String, String>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct World {
    #[serde(skip)]
    pub merkle_cache: crate::merkle::StateCache,
    pub accounts: BTreeMap<String, Account>,
    pub module_state: BTreeMap<String, String>,
    // The EVM BLOCKHASH window survives pruning and restart.
    pub block_hashes: BTreeMap<u64, Hash>,
}
impl World {
    pub fn root(&self) -> Hash {
        crate::binary::world_hash(self)
    }
    pub fn account_proof(&self, address: &str) -> crate::merkle::Proof {
        self.merkle_cache
            .prove(self, &crate::merkle::key(0, address.as_bytes()))
    }
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Log {
    pub address: String,
    pub topics: Vec<String>,
    pub data: String,
}
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Receipt {
    pub transaction_hash: Hash,
    pub from: String,
    pub to: Option<String>,
    pub success: bool,
    pub gas_used: u64,
    pub cumulative_gas_used: u64,
    pub contract_address: Option<String>,
    pub logs: Vec<Log>,
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct BlockDraft {
    pub chain_id: u64,
    pub height: u64,
    pub timestamp: u64,
    pub parent_hash: Hash,
    pub state_root: Hash,
    pub transactions: Vec<bytes::Bytes>,
    pub receipts: Vec<Receipt>,
}
pub use crate::binary::Block;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct Genesis {
    pub chain_id: u64,
    pub timestamp: u64,
    pub gas_limit: u64,
    pub alloc: BTreeMap<String, String>,
}
impl Genesis {
    pub fn validate(&self) -> Result<()> {
        ensure!(self.chain_id > 0, "chain_id must be nonzero");
        ensure!(self.gas_limit >= 21_000, "gas_limit too small");
        for (address, balance) in &self.alloc {
            address.parse::<revm::primitives::Address>()?;
            balance.parse::<revm::primitives::U256>()?;
        }
        Ok(())
    }
    pub fn world(&self) -> Result<World> {
        self.validate()?;
        let mut world = World::default();
        for (address, balance) in &self.alloc {
            let address = address.parse::<revm::primitives::Address>()?;
            world.accounts.insert(
                format!("{address:#x}"),
                Account {
                    balance: balance.clone(),
                    code: String::new(),
                    ..Default::default()
                },
            );
        }
        Ok(world)
    }
}
