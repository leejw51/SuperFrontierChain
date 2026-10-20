//! Ordered EVM backing state. Dependency-owned execution changes are sorted on import.
use revm::{
    primitives::{Account, AccountInfo, Address, Bytecode, B256, U256},
    Database,
};
use std::{collections::BTreeMap, convert::Infallible};

#[derive(Clone, Default)]
pub struct StoredAccount {
    pub info: AccountInfo,
    pub storage: BTreeMap<U256, U256>,
}
#[derive(Clone, Default)]
pub struct OrderedDb {
    pub accounts: BTreeMap<Address, StoredAccount>,
    pub contracts: BTreeMap<B256, Bytecode>,
    pub block_hashes: BTreeMap<U256, B256>,
}
impl OrderedDb {
    pub fn insert_account_info(&mut self, address: Address, info: AccountInfo) {
        if let Some(code) = &info.code {
            self.contracts.insert(info.code_hash, code.clone());
        }
        self.accounts.entry(address).or_default().info = info;
    }
    pub fn insert_account_storage(
        &mut self,
        address: Address,
        slot: U256,
        value: U256,
    ) -> Result<(), Infallible> {
        self.accounts
            .entry(address)
            .or_default()
            .storage
            .insert(slot, value);
        Ok(())
    }
    pub fn apply(&mut self, changes: impl IntoIterator<Item = (Address, Account)>) {
        let ordered: BTreeMap<_, _> = changes.into_iter().collect();
        for (address, account) in ordered {
            if !account.is_touched() {
                continue;
            }
            if account.is_selfdestructed() {
                self.accounts.remove(&address);
                continue;
            }
            if account.is_created() {
                self.accounts.entry(address).or_default().storage.clear();
            }
            self.insert_account_info(address, account.info);
            let storage = &mut self
                .accounts
                .get_mut(&address)
                .expect("inserted account")
                .storage;
            let slots: BTreeMap<_, _> = account.storage.into_iter().collect();
            for (key, slot) in slots {
                let value = slot.present_value();
                if value.is_zero() {
                    storage.remove(&key);
                } else {
                    storage.insert(key, value);
                }
            }
        }
    }
}
impl Database for OrderedDb {
    type Error = Infallible;
    fn basic(&mut self, address: Address) -> Result<Option<AccountInfo>, Self::Error> {
        Ok(self.accounts.get(&address).map(|a| a.info.clone()))
    }
    fn code_by_hash(&mut self, hash: B256) -> Result<Bytecode, Self::Error> {
        Ok(self.contracts.get(&hash).cloned().unwrap_or_default())
    }
    fn storage(&mut self, address: Address, index: U256) -> Result<U256, Self::Error> {
        Ok(self
            .accounts
            .get(&address)
            .and_then(|a| a.storage.get(&index))
            .copied()
            .unwrap_or_default())
    }
    fn block_hash(&mut self, number: u64) -> Result<B256, Self::Error> {
        Ok(self
            .block_hashes
            .get(&U256::from(number))
            .copied()
            .unwrap_or_default())
    }
}
