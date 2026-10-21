//! Typed Cap'n Proto storage. Immutable blocks own shared canonical segment bytes;
//! readers borrow those bytes without rebuilding transaction/receipt objects.
use crate::{
    storage_capnp as wire,
    types::{Account, BlockDraft, Hash, Log, Receipt, World},
};
use anyhow::{ensure, Result};
use bytes::Bytes;
use capnp::message::{Builder, Reader, ReaderOptions, ReaderSegments};
use sha3::{Digest, Keccak256};
use std::{collections::BTreeMap, sync::OnceLock};

pub struct Segment<'a>(pub &'a [u8]);
impl ReaderSegments for Segment<'_> {
    fn get_segment(&self, id: u32) -> Option<&[u8]> {
        (id == 0).then_some(self.0)
    }
    fn len(&self) -> usize {
        1
    }
}
pub fn reader(bytes: &[u8]) -> Result<Reader<Segment<'_>>> {
    ensure!(
        !bytes.is_empty()
            && bytes.len().is_multiple_of(8)
            && bytes.len() <= crate::codec::MAX_RECORD_BYTES,
        "invalid canonical segment size"
    );
    Ok(Reader::new(
        Segment(bytes),
        ReaderOptions {
            traversal_limit_in_words: Some(crate::codec::MAX_RECORD_BYTES / 8),
            nesting_limit: 64,
        },
    ))
}
struct CanonicalMessage(Builder<capnp::message::HeapAllocator>);
impl AsRef<[u8]> for CanonicalMessage {
    fn as_ref(&self) -> &[u8] {
        match self.0.get_segments_for_output() {
            capnp::OutputSegments::SingleSegment([bytes]) => bytes,
            _ => unreachable!("canonical messages have one segment"),
        }
    }
}
fn canonical(message: Builder<capnp::message::HeapAllocator>) -> Result<Bytes> {
    // Read the builder arena directly. Wrapping a multi-segment Builder in a
    // Reader repeatedly allocates its segment list during pointer traversal.
    let root = message.get_root_as_reader::<capnp::any_pointer::Reader>()?;
    let words = root
        .target_size()?
        .word_count
        .checked_add(1)
        .ok_or_else(|| anyhow::anyhow!("canonical message size overflow"))?;
    ensure!(
        words <= crate::codec::MAX_RECORD_BYTES as u64 / 8,
        "canonical message too large"
    );
    let mut output =
        Builder::new(capnp::message::HeapAllocator::new().first_segment_words(words.try_into()?));
    output.set_root_canonical(root)?;
    // Retain the output arena; no second canonicalization/payload copy.
    Ok(Bytes::from_owner(CanonicalMessage(output)))
}
fn digest(domain: &[u8], bytes: &[u8]) -> Hash {
    let mut hash = Keccak256::new();
    hash.update(domain);
    hash.update(bytes);
    hash.finalize().into()
}

#[derive(Clone)]
pub struct Block {
    bytes: Bytes,
    hash: OnceLock<Hash>,
}
impl PartialEq for Block {
    fn eq(&self, other: &Self) -> bool {
        self.bytes == other.bytes
    }
}
impl Eq for Block {}
impl std::fmt::Debug for Block {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("BlockBytes")
            .field("height", &self.height())
            .field("bytes", &self.bytes.len())
            .finish()
    }
}
impl Block {
    pub fn from_bytes(bytes: impl Into<Bytes>) -> Result<Self> {
        let block = Self {
            bytes: bytes.into(),
            hash: OnceLock::new(),
        };
        let message = block.read()?;
        let root = message.get_root::<wire::block::Reader>()?;
        ensure!(message.is_canonical()?, "noncanonical stored block");
        ensure!(
            root.get_parent_hash()?.len() == 32 && root.get_state_root()?.len() == 32,
            "invalid block hash width"
        );
        let txs = root.get_transactions()?;
        let receipts = root.get_receipts()?;
        ensure!(
            txs.len() == receipts.len()
                && txs.len() as usize <= crate::types::MAX_BLOCK_TRANSACTIONS,
            "invalid block record count"
        );
        let mut size = 0;
        for tx in txs {
            let tx = tx?;
            ensure!(
                tx.len() <= crate::types::MAX_TX_BYTES,
                "transaction too large"
            );
            size += tx.len();
        }
        ensure!(size <= crate::types::MAX_BLOCK_BYTES, "block too large");
        for receipt in receipts {
            validate_receipt(receipt)?;
        }
        Ok(block)
    }
    pub fn build(draft: BlockDraft) -> Result<Self> {
        Self::build_from(&draft)
    }
    /// Encode newly produced execution results without cloning their payloads.
    pub fn build_from(draft: &BlockDraft) -> Result<Self> {
        let mut message = Builder::new_default();
        let mut root = message.init_root::<wire::block::Builder>();
        root.set_chain_id(draft.chain_id);
        root.set_height(draft.height);
        root.set_timestamp(draft.timestamp);
        root.set_parent_hash(&draft.parent_hash);
        root.set_state_root(&draft.state_root);
        let mut txs = root
            .reborrow()
            .init_transactions(draft.transactions.len().try_into()?);
        for (i, tx) in draft.transactions.iter().enumerate() {
            txs.set(i as u32, tx);
        }
        let mut receipts = root.init_receipts(draft.receipts.len().try_into()?);
        for (i, receipt) in draft.receipts.iter().enumerate() {
            write_receipt(receipts.reborrow().get(i as u32), receipt)?;
        }
        Self::from_bytes(canonical(message)?)
    }
    pub fn read(&self) -> Result<Reader<Segment<'_>>> {
        reader(&self.bytes)
    }
    pub fn as_bytes(&self) -> &[u8] {
        &self.bytes
    }
    pub fn shared_bytes(&self) -> Bytes {
        self.bytes.clone()
    }
    pub fn hash(&self) -> Hash {
        *self
            .hash
            .get_or_init(|| digest(b"sfc/block/v3/capnp", &self.bytes))
    }
    pub fn chain_id(&self) -> u64 {
        self.read()
            .unwrap()
            .get_root::<wire::block::Reader>()
            .unwrap()
            .get_chain_id()
    }
    pub fn height(&self) -> u64 {
        self.read()
            .unwrap()
            .get_root::<wire::block::Reader>()
            .unwrap()
            .get_height()
    }
    pub fn timestamp(&self) -> u64 {
        self.read()
            .unwrap()
            .get_root::<wire::block::Reader>()
            .unwrap()
            .get_timestamp()
    }
    pub fn parent_hash(&self) -> Hash {
        self.read()
            .unwrap()
            .get_root::<wire::block::Reader>()
            .unwrap()
            .get_parent_hash()
            .unwrap()
            .try_into()
            .unwrap()
    }
    pub fn state_root(&self) -> Hash {
        self.read()
            .unwrap()
            .get_root::<wire::block::Reader>()
            .unwrap()
            .get_state_root()
            .unwrap()
            .try_into()
            .unwrap()
    }
    pub fn transaction_count(&self) -> usize {
        self.read()
            .unwrap()
            .get_root::<wire::block::Reader>()
            .unwrap()
            .get_transactions()
            .unwrap()
            .len() as usize
    }
    pub fn gas_used(&self) -> u64 {
        let message = self.read().unwrap();
        let receipts = message
            .get_root::<wire::block::Reader>()
            .unwrap()
            .get_receipts()
            .unwrap();
        if receipts.is_empty() {
            0
        } else {
            receipts.get(receipts.len() - 1).get_cumulative_gas_used()
        }
    }
    /// Explicit materialization for test fixtures/JSON output only, never used by storage, sync or indexing.
    pub fn receipts(&self) -> Result<Vec<Receipt>> {
        self.read()?
            .get_root::<wire::block::Reader>()?
            .get_receipts()?
            .iter()
            .map(read_receipt)
            .collect()
    }
    pub fn transactions(&self) -> Result<Vec<Vec<u8>>> {
        self.read()?
            .get_root::<wire::block::Reader>()?
            .get_transactions()?
            .iter()
            .map(|v| Ok(v?.to_vec()))
            .collect()
    }
}
fn validate_receipt(r: wire::receipt::Reader<'_>) -> Result<()> {
    ensure!(r.get_transaction_hash()?.len() == 32, "receipt hash width");
    r.get_sender()?.to_str()?;
    r.get_recipient()?.to_str()?;
    r.get_contract_address()?.to_str()?;
    for log in r.get_logs()? {
        log.get_address()?.to_str()?;
        log.get_data()?;
        for topic in log.get_topics()? {
            topic?.to_str()?;
        }
    }
    Ok(())
}
pub fn write_receipt(mut out: wire::receipt::Builder<'_>, r: &Receipt) -> Result<()> {
    out.set_transaction_hash(&r.transaction_hash);
    out.set_sender(r.from.as_str());
    out.set_has_recipient(r.to.is_some());
    if let Some(v) = &r.to {
        out.set_recipient(v.as_str());
    }
    out.set_success(r.success);
    out.set_gas_used(r.gas_used);
    out.set_cumulative_gas_used(r.cumulative_gas_used);
    out.set_has_contract_address(r.contract_address.is_some());
    if let Some(v) = &r.contract_address {
        out.set_contract_address(v.as_str());
    }
    let mut logs = out.init_logs(r.logs.len().try_into()?);
    for (i, log) in r.logs.iter().enumerate() {
        let mut l = logs.reborrow().get(i as u32);
        l.set_address(log.address.as_str());
        l.set_data(&hex::decode(log.data.trim_start_matches("0x"))?);
        let mut topics = l.init_topics(log.topics.len().try_into()?);
        for (j, t) in log.topics.iter().enumerate() {
            topics.set(j as u32, t.as_str());
        }
    }
    Ok(())
}
pub fn read_receipt(r: wire::receipt::Reader<'_>) -> Result<Receipt> {
    Ok(Receipt {
        transaction_hash: r.get_transaction_hash()?.try_into()?,
        from: r.get_sender()?.to_str()?.into(),
        to: if r.get_has_recipient() {
            Some(r.get_recipient()?.to_str()?.into())
        } else {
            None
        },
        success: r.get_success(),
        gas_used: r.get_gas_used(),
        cumulative_gas_used: r.get_cumulative_gas_used(),
        contract_address: if r.get_has_contract_address() {
            Some(r.get_contract_address()?.to_str()?.into())
        } else {
            None
        },
        logs: r
            .get_logs()?
            .iter()
            .map(|l| {
                Ok(Log {
                    address: l.get_address()?.to_str()?.into(),
                    topics: l
                        .get_topics()?
                        .iter()
                        .map(|t| Ok(t?.to_str()?.into()))
                        .collect::<Result<_>>()?,
                    data: format!("0x{}", hex::encode(l.get_data()?)),
                })
            })
            .collect::<Result<_>>()?,
    })
}
pub fn receipt_bytes(r: wire::receipt::Reader<'_>) -> Result<Bytes> {
    let mut message = Builder::new_default();
    message.set_root(r)?;
    canonical(message)
}
fn write_map(
    mut out: capnp::struct_list::Builder<'_, wire::text_entry::Owned>,
    map: &BTreeMap<String, String>,
) {
    for (i, (key, value)) in map.iter().enumerate() {
        let mut item = out.reborrow().get(i as u32);
        item.set_key(key.as_str());
        item.set_value(value.as_str());
    }
}
fn read_map(
    list: capnp::struct_list::Reader<'_, wire::text_entry::Owned>,
) -> Result<BTreeMap<String, String>> {
    let mut map = BTreeMap::new();
    let mut previous = None;
    for item in list {
        let key = item.get_key()?.to_str()?;
        ensure!(
            previous.is_none_or(|old| old < key),
            "unsorted or duplicate map key"
        );
        previous = Some(key);
        map.insert(key.into(), item.get_value()?.to_str()?.into());
    }
    Ok(map)
}
fn write_account(mut out: wire::account::Builder<'_>, account: &Account) -> Result<()> {
    out.set_balance(account.balance.as_str());
    out.set_nonce(account.nonce);
    out.set_code(&hex::decode(&account.code)?);
    write_map(
        out.init_storage(account.storage.len().try_into()?),
        &account.storage,
    );
    Ok(())
}
fn read_account(r: wire::account::Reader<'_>) -> Result<Account> {
    Ok(Account {
        balance: r.get_balance()?.to_str()?.into(),
        nonce: r.get_nonce(),
        code: hex::encode(r.get_code()?),
        storage: read_map(r.get_storage()?)?,
    })
}
pub fn account_bytes(account: &Account) -> Result<Bytes> {
    let mut message = Builder::new_default();
    write_account(message.init_root::<wire::account::Builder>(), account)?;
    canonical(message)
}
pub fn account_from_bytes(bytes: &[u8]) -> Result<Account> {
    read_account(reader(bytes)?.get_root::<wire::account::Reader>()?)
}
pub fn world_bytes(world: &World) -> Result<Bytes> {
    let mut message = Builder::new_default();
    let mut root = message.init_root::<wire::world::Builder>();
    let mut accounts = root
        .reborrow()
        .init_accounts(world.accounts.len().try_into()?);
    for (i, (address, account)) in world.accounts.iter().enumerate() {
        let mut entry = accounts.reborrow().get(i as u32);
        entry.set_address(address.as_str());
        write_account(entry.init_account(), account)?;
    }
    write_map(
        root.reborrow()
            .init_module_state(world.module_state.len().try_into()?),
        &world.module_state,
    );
    let mut hashes = root.init_block_hashes(world.block_hashes.len().try_into()?);
    for (i, (height, hash)) in world.block_hashes.iter().enumerate() {
        let mut entry = hashes.reborrow().get(i as u32);
        entry.set_height(*height);
        entry.set_hash(hash);
    }
    canonical(message)
}
pub fn world_from_bytes(bytes: &[u8]) -> Result<World> {
    let message = reader(bytes)?;
    let root = message.get_root::<wire::world::Reader>()?;
    let mut world = World {
        module_state: read_map(root.get_module_state()?)?,
        ..Default::default()
    };
    let mut previous = None;
    for entry in root.get_accounts()? {
        let address = entry.get_address()?.to_str()?;
        ensure!(
            previous.is_none_or(|old| old < address),
            "unsorted accounts"
        );
        previous = Some(address);
        world
            .accounts
            .insert(address.into(), read_account(entry.get_account()?)?);
    }
    let mut previous = None;
    for entry in root.get_block_hashes()? {
        let height = entry.get_height();
        ensure!(
            previous.is_none_or(|old| old < height),
            "unsorted block hashes"
        );
        previous = Some(height);
        world
            .block_hashes
            .insert(height, entry.get_hash()?.try_into()?);
    }
    Ok(world)
}
pub fn world_hash(world: &World) -> Hash {
    world.merkle_cache.root(world)
}

/// Presentation boundary only. Storage/index writes keep the typed binary record.
pub fn receipt_value(r: wire::receipt::Reader<'_>) -> Result<serde_json::Value> {
    use serde_json::json;
    let logs=r.get_logs()?.iter().map(|l|Ok(json!({"address":l.get_address()?.to_str()?,"topics":l.get_topics()?.iter().map(|t|Ok(t?.to_str()?)).collect::<Result<Vec<_>>>()?,"data":format!("0x{}",hex::encode(l.get_data()?))}))).collect::<Result<Vec<_>>>()?;
    Ok(
        json!({"transaction_hash":r.get_transaction_hash()?,"from":r.get_sender()?.to_str()?,"to":if r.get_has_recipient(){Some(r.get_recipient()?.to_str()?)}else{None},"success":r.get_success(),"gas_used":r.get_gas_used(),"cumulative_gas_used":r.get_cumulative_gas_used(),"contract_address":if r.get_has_contract_address(){Some(r.get_contract_address()?.to_str()?)}else{None},"logs":logs}),
    )
}

fn indexed_header(
    height: u64,
    hash: &str,
    parent: &str,
    state: &str,
    time: u64,
    count: u64,
    gas: Option<u64>,
) -> Result<Bytes> {
    let mut message = Builder::new_default();
    let mut h = message.init_root::<wire::indexed_block::Builder>();
    h.set_height(height);
    h.set_hash(hash);
    h.set_parent_hash(parent);
    h.set_state_root(state);
    h.set_timestamp(time);
    h.set_transactions(count);
    h.set_has_gas_used(gas.is_some());
    if let Some(gas) = gas {
        h.set_gas_used(gas);
    }
    canonical(message)
}
pub fn indexed_header_bytes(block: &Block) -> Result<Bytes> {
    indexed_header(
        block.height(),
        &crate::types::hex_hash(&block.hash()),
        &crate::types::hex_hash(&block.parent_hash()),
        &crate::types::hex_hash(&block.state_root()),
        block.timestamp(),
        block.transaction_count() as u64,
        Some(block.gas_used()),
    )
}
pub(crate) fn migrate_index_header(
    height: u64,
    hash: &str,
    value: &serde_json::Value,
) -> Result<Bytes> {
    let count = value["transactions"]
        .as_u64()
        .ok_or_else(|| anyhow::anyhow!("invalid block transaction count"))?;
    indexed_header(
        height,
        hash,
        value["parentHash"].as_str().unwrap_or(""),
        value["stateRoot"].as_str().unwrap_or(""),
        value["timestamp"].as_u64().unwrap_or(0),
        count,
        value["gasUsed"].as_u64(),
    )
}
pub fn indexed_header_value(bytes: &[u8]) -> Result<serde_json::Value> {
    let m = reader(bytes)?;
    let h = m.get_root::<wire::indexed_block::Reader>()?;
    Ok(
        serde_json::json!({"height":h.get_height(),"hash":h.get_hash()?.to_str()?,"timestamp":h.get_timestamp(),"parentHash":h.get_parent_hash()?.to_str()?,"stateRoot":h.get_state_root()?.to_str()?,"transactions":h.get_transactions(),"gasUsed":if h.get_has_gas_used(){Some(h.get_gas_used())}else{None}}),
    )
}
