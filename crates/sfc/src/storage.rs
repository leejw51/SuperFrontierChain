use crate::{
    config::Retention,
    types::{Block, Genesis, World},
};
use anyhow::{bail, ensure, Context, Result};
use rocksdb::{WriteBatch, DB};
use sha3::{Digest, Keccak256};
use std::{
    fs::{self, File, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicU64, Ordering},
        RwLock,
    },
};

pub struct Store {
    db: DB,
    history: PathBuf,
    retention: Retention,
    projected_height: AtomicU64,
    cleaned_hour: AtomicU64,
    head: RwLock<Option<CachedHead>>,
}
struct CachedHead {
    block: Block,
    encoded: Vec<u8>,
    hash: crate::types::Hash,
}
impl CachedHead {
    fn new(block: Block) -> Result<Self> {
        let encoded = serde_json::to_vec(&block)?;
        let mut digest = Keccak256::new();
        digest.update(b"sfc/block/v1");
        digest.update(&encoded);
        Ok(Self {
            block,
            encoded,
            hash: digest.finalize().into(),
        })
    }
}
fn block_key(height: u64) -> String {
    format!("block/{height:020}")
}

// Bound journal writes when pruning a large backlog after downtime or archive mode.
const PRUNE_BATCH_BLOCKS: usize = 256;
const PRUNE_BATCH_BYTES: usize = 8 * 1024 * 1024;

fn expired(block: &Block, head: &Block, seconds: u64) -> bool {
    block.height != head.height && block.timestamp < head.timestamp.saturating_sub(seconds)
}

impl Store {
    pub fn statistics(&self) -> Result<serde_json::Value> {
        let mut values = serde_json::Map::new();
        values.insert(
            "schema_version".into(),
            crate::schema::rocksdb_version(&self.db)?.into(),
        );
        for property in [
            "rocksdb.estimate-num-keys",
            "rocksdb.total-sst-files-size",
            "rocksdb.live-sst-files-size",
            "rocksdb.cur-size-all-mem-tables",
            "rocksdb.block-cache-usage",
            "rocksdb.num-running-compactions",
            "rocksdb.num-running-flushes",
            "rocksdb.estimate-pending-compaction-bytes",
            "rocksdb.background-errors",
        ] {
            values.insert(
                property.into(),
                serde_json::json!(self.db.property_int_value(property)?),
            );
        }
        Ok(serde_json::Value::Object(values))
    }
    pub fn open(path: &Path, retention: Retention, genesis: &Genesis) -> Result<Self> {
        genesis.validate()?;
        if let Retention::Pruned { seconds } = &retention {
            ensure!(*seconds > 0, "retention must be nonzero");
        }
        fs::create_dir_all(path)?;
        let history = path.join("history");
        fs::create_dir_all(&history)?;
        let mut options = crate::journal::database_options();
        options.set_compression_type(rocksdb::DBCompressionType::Lz4);
        let db = DB::open(&options, path.join("rocksdb"))?;
        crate::schema::check_rocksdb(&db)?;
        let store = Self {
            db,
            history,
            retention,
            projected_height: AtomicU64::new(0),
            cleaned_hour: AtomicU64::new(0),
            head: RwLock::new(None),
        };
        let expected = serde_json::to_vec(genesis)?;
        if let Some(existing) = store.db.get(b"genesis")? {
            ensure!(
                existing == expected,
                "genesis does not match existing database"
            );
            crate::schema::migrate_rocksdb(&store.db)?;
        } else {
            ensure!(
                store
                    .db
                    .iterator(rocksdb::IteratorMode::Start)
                    .next()
                    .is_none(),
                "nonempty chain database has no genesis"
            );
            let world = genesis.world()?;
            let block = Block {
                chain_id: genesis.chain_id,
                height: 0,
                timestamp: genesis.timestamp,
                parent_hash: [0; 32],
                state_root: world.root(),
                transactions: vec![],
                receipts: vec![],
            };
            let mut batch = WriteBatch::default();
            batch.put(b"genesis", expected);
            let mut metadata = world.clone();
            metadata.accounts.clear();
            batch.put(b"world", serde_json::to_vec(&metadata)?);
            for (address, account) in &world.accounts {
                batch.put(format!("account/{address}"), serde_json::to_vec(account)?);
            }
            batch.put(b"head", serde_json::to_vec(&block.height)?);
            batch.put(block_key(0), serde_json::to_vec(&block)?);
            batch.put(
                crate::schema::ROCKSDB_VERSION_KEY,
                serde_json::to_vec(&crate::schema::ROCKSDB_VERSION)?,
            );
            store.write(batch)?;
        }
        let head = store.head()?;
        ensure!(
            head.state_root == store.world()?.root(),
            "database state commitment mismatch"
        );
        *store
            .head
            .write()
            .map_err(|_| anyhow::anyhow!("head lock poisoned"))? = Some(CachedHead::new(head)?);
        store.prune()?;
        store.repair_history()?;
        Ok(store)
    }
    fn write(&self, batch: WriteBatch) -> Result<()> {
        let options = crate::journal::durable_write_options();
        self.db.write_opt(batch, &options)?;
        Ok(())
    }
    pub fn world(&self) -> Result<World> {
        let mut world: World = self.required(b"world")?;
        for entry in self.db.prefix_iterator(b"account/") {
            let (key, value) = entry?;
            if !key.starts_with(b"account/") {
                break;
            }
            world.accounts.insert(
                std::str::from_utf8(&key[8..])?.to_owned(),
                serde_json::from_slice(&value)?,
            );
        }
        Ok(world)
    }
    pub fn head(&self) -> Result<Block> {
        if let Some(head) = self
            .head
            .read()
            .map_err(|_| anyhow::anyhow!("head lock poisoned"))?
            .as_ref()
        {
            return Ok(head.block.clone());
        }
        let height: u64 = self.required(b"head")?;
        self.block(height)?.context("missing head block")
    }
    pub fn head_hash(&self) -> Result<crate::types::Hash> {
        Ok(self
            .head
            .read()
            .map_err(|_| anyhow::anyhow!("head lock poisoned"))?
            .as_ref()
            .context("missing cached head")?
            .hash)
    }
    fn required<T: serde::de::DeserializeOwned>(&self, key: &[u8]) -> Result<T> {
        serde_json::from_slice(&self.db.get(key)?.context("missing database metadata")?)
            .map_err(Into::into)
    }
    pub fn block(&self, height: u64) -> Result<Option<Block>> {
        if let Some(head) = self
            .head
            .read()
            .map_err(|_| anyhow::anyhow!("head lock poisoned"))?
            .as_ref()
        {
            if head.block.height == height {
                return Ok(Some(head.block.clone()));
            }
        }
        self.db
            .get(block_key(height))?
            .map(|bytes| serde_json::from_slice(&bytes).map_err(Into::into))
            .transpose()
    }
    pub fn receipt_block(&self, hash: &[u8]) -> Result<Option<Block>> {
        let Some(bytes) = self.db.get(format!("tx/{}", hex::encode(hash)))? else {
            return Ok(None);
        };
        let height: u64 = serde_json::from_slice(&bytes)?;
        self.block(height)
    }
    pub fn blocks(&self) -> Result<Vec<Block>> {
        let mut blocks = Vec::new();
        for entry in self.db.prefix_iterator(b"block/") {
            let (key, value) = entry?;
            if !key.starts_with(b"block/") {
                break;
            }
            blocks.push(serde_json::from_slice(&value)?);
        }
        Ok(blocks)
    }
    pub fn earliest_height(&self) -> Result<u64> {
        for entry in self.db.prefix_iterator(b"block/") {
            let (key, _value) = entry?;
            if key.starts_with(b"block/") {
                return Ok(std::str::from_utf8(&key[6..])?.parse()?);
            }
        }
        bail!("missing chain history")
    }
    /// Durable state and history are atomic. JSONL is a recoverable projection.
    pub fn commit(&self, block: &Block, world: &World) -> Result<()> {
        self.commit_delta(block, world, &self.world()?)
    }
    /// Only changed JSON account records enter the atomic RocksDB write batch.
    pub(crate) fn commit_delta(
        &self,
        block: &Block,
        world: &World,
        previous: &World,
    ) -> Result<()> {
        // Serialize commits, and publish the cache only after the durable batch succeeds.
        let mut cached = self
            .head
            .write()
            .map_err(|_| anyhow::anyhow!("head lock poisoned"))?;
        let prior = cached.as_ref().context("missing cached head")?;
        let head = &prior.block;
        ensure!(
            block.height == head.height.checked_add(1).context("height overflow")?,
            "non-contiguous height"
        );
        ensure!(block.parent_hash == prior.hash, "parent mismatch");
        ensure!(block.chain_id == head.chain_id, "chain mismatch");
        ensure!(
            block.timestamp >= head.timestamp,
            "timestamp moved backwards"
        );
        ensure!(block.state_root == world.root(), "state root mismatch");
        ensure!(
            block.transactions.len() == block.receipts.len(),
            "receipt count mismatch"
        );
        let next_head = CachedHead::new(block.clone())?;
        let mut batch = WriteBatch::default();
        for (address, account) in &world.accounts {
            if previous.accounts.get(address) != Some(account) {
                batch.put(format!("account/{address}"), serde_json::to_vec(account)?);
            }
        }
        for address in previous.accounts.keys() {
            if !world.accounts.contains_key(address) {
                batch.delete(format!("account/{address}"));
            }
        }
        let metadata = World {
            accounts: Default::default(),
            module_state: world.module_state.clone(),
            block_hashes: world.block_hashes.clone(),
        };
        batch.put(b"world", serde_json::to_vec(&metadata)?);
        batch.put(b"head", serde_json::to_vec(&block.height)?);
        batch.put(block_key(block.height), &next_head.encoded);
        for receipt in &block.receipts {
            batch.put(
                format!("tx/{}", hex::encode(receipt.transaction_hash)),
                serde_json::to_vec(&block.height)?,
            );
        }
        self.write(batch)?;
        *cached = Some(next_head);
        Ok(())
    }
    /// Incremental maintenance touches the new block and expired history only.
    pub fn maintain(&self) -> Result<()> {
        let cached = self
            .head
            .read()
            .map_err(|_| anyhow::anyhow!("head lock poisoned"))?;
        let head = cached.as_ref().context("missing cached head")?;
        let block = &head.block;
        if block.height > self.projected_height.load(Ordering::Acquire) {
            let target = self
                .history
                .join(format!("{:020}.jsonl", block.timestamp / 3600));
            let new_segment = !target.exists();
            let mut file = OpenOptions::new().create(true).append(true).open(target)?;
            file.write_all(&head.encoded)?;
            file.write_all(b"\n")?;
            file.sync_all()?;
            if new_segment {
                File::open(&self.history)?.sync_all()?;
            }
            self.projected_height.store(block.height, Ordering::Release);
        }
        self.prune_at(block)?;
        Ok(())
    }
    fn prune(&self) -> Result<()> {
        let cached = self
            .head
            .read()
            .map_err(|_| anyhow::anyhow!("head lock poisoned"))?;
        self.prune_at(&cached.as_ref().context("missing cached head")?.block)
    }
    fn prune_at(&self, head: &Block) -> Result<()> {
        let Retention::Pruned { seconds } = self.retention else {
            return Ok(());
        };
        let cutoff = head.timestamp.saturating_sub(seconds);
        let mut batch = WriteBatch::default();
        let mut pending = 0;
        for entry in self.db.prefix_iterator(b"block/") {
            let (key, value) = entry?;
            if !key.starts_with(b"block/") {
                break;
            }
            let block: Block = serde_json::from_slice(&value)?;
            if !expired(&block, head, seconds) {
                break;
            }
            for receipt in &block.receipts {
                batch.delete(format!("tx/{}", hex::encode(receipt.transaction_hash)));
            }
            batch.delete(key);
            pending += 1;
            if pending >= PRUNE_BATCH_BLOCKS || batch.size_in_bytes() >= PRUNE_BATCH_BYTES {
                // Each batch atomically removes blocks and their receipt indexes.
                // A restart resumes from the earliest remaining block.
                self.write(batch)?;
                batch = WriteBatch::default();
                pending = 0;
            }
        }
        if pending != 0 {
            self.write(batch)?;
        }
        let cutoff_hour = cutoff / 3600;
        if self.cleaned_hour.load(Ordering::Acquire) != cutoff_hour {
            for entry in fs::read_dir(&self.history)? {
                let path = entry?.path();
                if path.extension().and_then(|s| s.to_str()) != Some("jsonl") {
                    continue;
                }
                if let Some(hour) = path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .and_then(|s| s.parse::<u64>().ok())
                {
                    if hour < cutoff_hour && hour != head.timestamp / 3600 {
                        fs::remove_file(path)?;
                    }
                }
            }
            File::open(&self.history)?.sync_all()?;
            self.cleaned_hour.store(cutoff_hour, Ordering::Release);
        }
        Ok(())
    }
    fn repair_history(&self) -> Result<()> {
        // Rebuild the JSONL projection from authoritative records only on restart.
        // Hourly segments avoid millions of tiny files at a 500ms block cadence.
        let mut segments = std::collections::BTreeMap::<u64, Vec<u8>>::new();
        for block in self.blocks()? {
            let bytes = segments.entry(block.timestamp / 3600).or_default();
            serde_json::to_writer(&mut *bytes, &block)?;
            bytes.push(b'\n');
        }
        for (hour, bytes) in &segments {
            let target = self.history.join(format!("{hour:020}.jsonl"));
            if fs::read(&target).ok().as_deref() == Some(bytes.as_slice()) {
                continue;
            }
            let temp = target.with_extension("tmp");
            let mut file = File::create(&temp)?;
            file.write_all(bytes)?;
            file.sync_all()?;
            fs::rename(temp, target)?;
        }
        for entry in fs::read_dir(&self.history)? {
            let path = entry?.path();
            if path.extension().and_then(|s| s.to_str()) == Some("tmp") {
                fs::remove_file(path)?;
                continue;
            }
            if path.extension().and_then(|s| s.to_str()) != Some("jsonl") {
                continue;
            }
            if let Some(hour) = path
                .file_stem()
                .and_then(|s| s.to_str())
                .and_then(|s| s.parse::<u64>().ok())
            {
                if !segments.contains_key(&hour) {
                    fs::remove_file(path)?;
                }
            }
        }
        File::open(&self.history)?.sync_all()?;
        self.projected_height
            .store(self.head()?.height, Ordering::Release);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cutoff_is_exclusive_and_head_is_never_pruned() {
        let head = Block {
            chain_id: 1,
            height: 10,
            timestamp: 100,
            parent_hash: [0; 32],
            state_root: [0; 32],
            transactions: vec![],
            receipts: vec![],
        };
        let mut old = head.clone();
        old.height = 9;
        old.timestamp = 89;
        assert!(expired(&old, &head, 10));
        old.timestamp = 90;
        assert!(!expired(&old, &head, 10));
        assert!(!expired(&head, &head, 10));
        assert!(!expired(&old, &head, 200));
    }
}
