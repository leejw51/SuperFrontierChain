use crate::{
    config::Retention,
    types::{Block, BlockDraft, Genesis, World},
};
use anyhow::{bail, ensure, Context, Result};
use bytes::Bytes;
use rocksdb::{WriteBatch, DB};
use std::{
    fs::{self, File, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    sync::{
        atomic::{AtomicBool, AtomicU64, Ordering},
        Arc, Condvar, Mutex, RwLock,
    },
};

pub struct Store {
    db: DB,
    // A coalescing wake-up queue, never a queue of full transaction/block payloads.
    index_wake: std::sync::mpsc::SyncSender<()>,
    index_requests: Mutex<std::sync::mpsc::Receiver<()>>,
    history: PathBuf,
    retention: Retention,
    projected_height: AtomicU64,
    cleaned_hour: AtomicU64,
    // A lower bound, advanced only after durable pruning. Starting at block/ on
    // every read repeatedly decompresses deleted SST records until compaction.
    history_floor: Arc<AtomicU64>,
    pruned_cutoff: AtomicU64,
    background_pruning: AtomicBool,
    prune_lock: Mutex<()>,
    head: RwLock<Option<CachedHead>>,
    history_writer: Mutex<Option<HistoryWriter>>,
}
/// Owns the single retention worker. Drop wakes and joins it before DB shutdown.
/// The worker only holds Store, never the node/admission mutex.
pub struct Pruner {
    store: Arc<Store>,
    stop: Arc<(Mutex<bool>, Condvar)>,
    thread: Option<std::thread::JoinHandle<()>>,
    completion: tokio::sync::oneshot::Receiver<Result<()>>,
}
impl Pruner {
    /// A storage error or worker panic must stop the server, not silently disable retention.
    pub async fn failed(&mut self) -> Result<()> {
        (&mut self.completion)
            .await
            .context("retention worker exited without a result")??;
        bail!("retention worker stopped unexpectedly")
    }
}
impl Drop for Pruner {
    fn drop(&mut self) {
        let (lock, wake) = &*self.stop;
        *lock.lock().unwrap_or_else(|e| e.into_inner()) = true;
        wake.notify_all();
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
        self.store
            .background_pruning
            .store(false, Ordering::Release);
    }
}
// RocksDB's synced WAL is authoritative. History is a rebuildable projection:
// append immediately for readers, and sync on segment close/clean shutdown.
// Periodic projection fsyncs contend with the WAL on the same storage device,
// even from another thread. Missing/torn history is repaired from RocksDB on open.
struct HistoryWriter {
    file: File,
    hour: u64,
    length: u64,
    dirty_bytes: usize,
    needs_rollback: bool,
}
impl HistoryWriter {
    fn sync(&mut self) -> Result<()> {
        if self.dirty_bytes > 0 {
            self.file.sync_all()?;
            self.dirty_bytes = 0;
        }
        Ok(())
    }
    fn append(&mut self, bytes: &[u8]) -> Result<()> {
        // Roll back a partial frame before any retry, including after an I/O error.
        if self.needs_rollback {
            self.file.set_len(self.length)?;
        }
        self.needs_rollback = true;
        crate::codec::write_record(&mut self.file, bytes)?;
        self.length += 8 + bytes.len() as u64;
        self.dirty_bytes += 8 + bytes.len();
        self.needs_rollback = false;
        Ok(())
    }
}
impl Drop for HistoryWriter {
    fn drop(&mut self) {
        // Failure is recoverable from the authoritative RocksDB WAL on restart.
        let _ = self.sync();
    }
}
struct CachedHead {
    block: Block,
    encoded: Bytes,
    hash: crate::types::Hash,
}
impl CachedHead {
    fn new(block: Block) -> Result<Self> {
        let encoded = block.shared_bytes();
        let hash = block.hash();
        Ok(Self {
            block,
            encoded,
            hash,
        })
    }
}
fn block_key(height: u64) -> String {
    format!("block/{height:020}")
}

// v3 index keys store the 32-byte hash directly; legacy hexadecimal keys remain readable.
fn receipt_key(hash: &[u8]) -> Result<[u8; 35]> {
    ensure!(hash.len() == 32, "invalid receipt hash length");
    let mut key = [0u8; 35];
    key[..3].copy_from_slice(b"tx/");
    key[3..].copy_from_slice(hash);
    Ok(key)
}
fn receipt_index_height(key: &[u8], value: &[u8]) -> Option<u64> {
    if !key.starts_with(b"tx/") {
        return None;
    }
    match key.len() {
        35 => value.try_into().ok().map(u64::from_le_bytes),
        67 => crate::codec::from_slice(value).ok(),
        _ => None,
    }
}

// Bound journal writes when pruning a large backlog after downtime or archive mode.
const PRUNE_BATCH_BLOCKS: usize = 256;
const PRUNE_BATCH_BYTES: usize = 8 * 1024 * 1024;

fn expired(block: &Block, head: &Block, seconds: u64) -> bool {
    block.height() != head.height() && block.timestamp() < head.timestamp().saturating_sub(seconds)
}

impl Store {
    fn block_cf(&self) -> &rocksdb::ColumnFamily {
        self.db
            .cf_handle("blocks")
            .expect("validated blocks column family")
    }
    pub fn start_pruner(self: &Arc<Self>) -> Result<Pruner> {
        let _serial = self
            .prune_lock
            .lock()
            .map_err(|_| anyhow::anyhow!("prune lock poisoned"))?;
        ensure!(
            !self.background_pruning.swap(true, Ordering::AcqRel),
            "retention worker already running"
        );
        let stop = Arc::new((Mutex::new(false), Condvar::new()));
        let (send, completion) = tokio::sync::oneshot::channel();
        let store = self.clone();
        let signal = stop.clone();
        let thread = std::thread::Builder::new()
            .name("sfc-retention".into())
            .spawn(move || {
                let result = (|| -> Result<()> {
                    loop {
                        if *signal
                            .0
                            .lock()
                            .map_err(|_| anyhow::anyhow!("retention signal poisoned"))?
                        {
                            return Ok(());
                        }
                        let complete = {
                            let _serial = store
                                .prune_lock
                                .lock()
                                .map_err(|_| anyhow::anyhow!("prune lock poisoned"))?;
                            // Release the cached-head read lock before deletion/fsync.
                            let head = store.head()?;
                            store.prune_at(&head, true)?
                        };
                        // Bound both work and duty cycle; never build a per-block work queue.
                        let pause = std::time::Duration::from_millis(if complete { 50 } else { 5 });
                        let stopped = signal
                            .0
                            .lock()
                            .map_err(|_| anyhow::anyhow!("retention signal poisoned"))?;
                        let _ = signal
                            .1
                            .wait_timeout_while(stopped, pause, |stop| !*stop)
                            .map_err(|_| anyhow::anyhow!("retention signal poisoned"))?;
                    }
                })();
                let _ = send.send(result);
            });
        match thread {
            Ok(thread) => Ok(Pruner {
                store: self.clone(),
                stop,
                thread: Some(thread),
                completion,
            }),
            Err(error) => {
                self.background_pruning.store(false, Ordering::Release);
                Err(error.into())
            }
        }
    }
    pub(crate) fn notify_indexer(&self) {
        // Full means a wake-up is already pending. The durable height cursor,
        // not notification count, determines which blocks the worker processes.
        let _ = self.index_wake.try_send(());
    }
    pub(crate) fn wait_for_index(&self) -> Result<()> {
        let requests = self
            .index_requests
            .lock()
            .map_err(|_| anyhow::anyhow!("index notification lock poisoned"))?;
        match requests.recv_timeout(std::time::Duration::from_millis(100)) {
            Ok(()) | Err(std::sync::mpsc::RecvTimeoutError::Timeout) => Ok(()),
            Err(error) => Err(error.into()),
        }
    }
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
            let mut value = self.db.property_int_value(property)?;
            if matches!(
                property,
                "rocksdb.estimate-num-keys"
                    | "rocksdb.total-sst-files-size"
                    | "rocksdb.live-sst-files-size"
                    | "rocksdb.cur-size-all-mem-tables"
                    | "rocksdb.estimate-pending-compaction-bytes"
            ) {
                value = value
                    .zip(self.db.property_int_value_cf(self.block_cf(), property)?)
                    .map(|(a, b)| a.saturating_add(b));
            }
            values.insert(property.into(), serde_json::json!(value));
        }
        values.insert(
            "retention_worker_active".into(),
            self.background_pruning.load(Ordering::Acquire).into(),
        );
        values.insert(
            "retained_history_floor".into(),
            self.history_floor.load(Ordering::Acquire).into(),
        );
        let cutoff = self.pruned_cutoff.load(Ordering::Acquire);
        values.insert(
            "retention_completed_cutoff".into(),
            serde_json::json!((cutoff != u64::MAX).then_some(cutoff)),
        );
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
        let history_floor = Arc::new(AtomicU64::new(0));
        let filter_floor = history_floor.clone();
        let mut options = crate::journal::database_options();
        options.set_compression_type(rocksdb::DBCompressionType::Lz4);
        options.set_write_buffer_size(8 * 1024 * 1024);
        options.set_level_zero_file_num_compaction_trigger(8);
        options.set_max_bytes_for_level_base(64 * 1024 * 1024);
        options.set_max_background_jobs(4);
        options.set_prefix_extractor(rocksdb::SliceTransform::create_noop());
        options.set_memtable_factory(rocksdb::MemtableFactory::HashLinkList {
            bucket_count: 65536,
        });
        options.set_allow_concurrent_memtable_write(false);
        options.set_compaction_filter(
            "expired-receipt-index",
            move |_level, key: &[u8], value: &[u8]| {
                // Only discard indexes whose blocks were durably removed. The hint
                // starts at zero on open and is reconstructed after validation.
                if receipt_index_height(key, value)
                    .is_some_and(|height| height < filter_floor.load(Ordering::Acquire))
                {
                    rocksdb::compaction_filter::Decision::Remove
                } else {
                    rocksdb::compaction_filter::Decision::Keep
                }
            },
        );
        let db_path = path.join("rocksdb");
        let names = if db_path.join("CURRENT").exists() {
            DB::list_cf(&options, &db_path)?
        } else {
            vec!["default".to_owned()]
        };
        ensure!(
            names
                .iter()
                .all(|name| name == "default" || name == "blocks"),
            "unknown chain column family"
        );
        let mut block_options = rocksdb::Options::default();
        block_options.set_compression_type(rocksdb::DBCompressionType::Lz4);
        let mut db = DB::open_cf_descriptors(
            &options,
            &db_path,
            names.iter().map(|name| {
                rocksdb::ColumnFamilyDescriptor::new(
                    name,
                    if name == "blocks" {
                        block_options.clone()
                    } else {
                        options.clone()
                    },
                )
            }),
        )?;
        if db.get(b"genesis")?.is_some() {
            ensure!(db.get(b"meta/protocol_version")?.as_deref()==Some(&crate::codec::PROTOCOL_VERSION.to_le_bytes()),
                "legacy or incompatible chain: preserve this directory and initialize a new protocol-v3 home");
            ensure!(db.get(b"meta/state_commitment")?.as_deref() == Some(crate::merkle::FORMAT),
                "incompatible state commitment: preserve this chain directory and initialize a new Merkle trie home; historical block hashes cannot be migrated");
        }
        crate::schema::check_rocksdb(&db)?;
        if let Some(existing) = db.get(b"genesis")? {
            ensure!(
                crate::codec::from_slice::<Genesis>(&existing)? == *genesis,
                "genesis does not match existing database"
            );
            crate::schema::migrate_rocksdb(&mut db)?;
        } else {
            ensure!(
                db.iterator_opt(
                    rocksdb::IteratorMode::Start,
                    crate::journal::full_scan_options()
                )
                .next()
                .is_none(),
                "nonempty chain database has no genesis"
            );
            if db.cf_handle("blocks").is_none() {
                db.create_cf("blocks", &block_options)?;
            }
            ensure!(
                db.iterator_cf(
                    db.cf_handle("blocks").unwrap(),
                    rocksdb::IteratorMode::Start
                )
                .next()
                .is_none(),
                "orphaned block column family has no genesis"
            );
        }
        let (index_wake, index_requests) = std::sync::mpsc::sync_channel(1);
        let store = Self {
            db,
            index_wake,
            index_requests: Mutex::new(index_requests),
            history,
            retention,
            projected_height: AtomicU64::new(0),
            cleaned_hour: AtomicU64::new(0),
            history_floor,
            pruned_cutoff: AtomicU64::new(u64::MAX),
            background_pruning: AtomicBool::new(false),
            prune_lock: Mutex::new(()),
            head: RwLock::new(None),
            history_writer: Mutex::new(None),
        };
        let expected = crate::codec::to_vec(genesis)?;
        if let Some(existing) = store.db.get(b"genesis")? {
            ensure!(
                crate::codec::from_slice::<crate::types::Genesis>(&existing)? == *genesis,
                "genesis does not match existing database"
            );
        } else {
            ensure!(
                store
                    .db
                    .iterator_opt(
                        rocksdb::IteratorMode::Start,
                        crate::journal::full_scan_options()
                    )
                    .next()
                    .is_none(),
                "nonempty chain database has no genesis"
            );
            let world = genesis.world()?;
            let block = Block::build(BlockDraft {
                chain_id: genesis.chain_id,
                height: 0,
                timestamp: genesis.timestamp,
                parent_hash: [0; 32],
                state_root: world.root(),
                transactions: vec![],
                receipts: vec![],
            })?;
            let mut batch = WriteBatch::default();
            batch.put(b"genesis", expected);
            batch.put(b"meta/state_commitment", crate::merkle::FORMAT);
            batch.put(
                b"meta/protocol_version",
                crate::codec::PROTOCOL_VERSION.to_le_bytes(),
            );
            let mut metadata = world.clone();
            metadata.accounts.clear();
            batch.put(b"world", crate::binary::world_bytes(&metadata)?);
            for (address, account) in &world.accounts {
                batch.put(
                    format!("account/{address}"),
                    crate::binary::account_bytes(account)?,
                );
            }
            batch.put(b"head", crate::codec::to_vec(&block.height())?);
            batch.put_cf(store.block_cf(), block_key(0), block.as_bytes());
            batch.put(
                crate::schema::ROCKSDB_VERSION_KEY,
                crate::codec::to_vec(&crate::schema::ROCKSDB_VERSION)?,
            );
            store.write(batch)?;
        }
        let head = store.head()?;
        ensure!(
            head.state_root() == store.world()?.root(),
            "database state commitment mismatch"
        );
        *store
            .head
            .write()
            .map_err(|_| anyhow::anyhow!("head lock poisoned"))? = Some(CachedHead::new(head)?);
        // Reconstruct the hint once on open, including a pruned home reopened
        // in archive mode. No new on-disk metadata or migration is needed.
        store
            .history_floor
            .store(store.earliest_height()?, Ordering::Release);
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
        let mut world =
            crate::binary::world_from_bytes(&self.db.get(b"world")?.context("missing world")?)?;
        for entry in self.db.iterator_opt(
            rocksdb::IteratorMode::From(b"account/", rocksdb::Direction::Forward),
            crate::journal::full_scan_options(),
        ) {
            let (key, value) = entry?;
            if !key.starts_with(b"account/") {
                break;
            }
            world.accounts.insert(
                std::str::from_utf8(&key[8..])?.to_owned(),
                crate::binary::account_from_bytes(&value)?,
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
    fn required<T: crate::codec::Record>(&self, key: &[u8]) -> Result<T> {
        crate::codec::from_slice(&self.db.get(key)?.context("missing database metadata")?)
    }
    pub fn block(&self, height: u64) -> Result<Option<Block>> {
        if let Some(head) = self
            .head
            .read()
            .map_err(|_| anyhow::anyhow!("head lock poisoned"))?
            .as_ref()
        {
            if head.block.height() == height {
                return Ok(Some(head.block.clone()));
            }
        }
        self.db
            .get_cf(self.block_cf(), block_key(height))?
            .map(Block::from_bytes)
            .transpose()
    }
    pub fn receipt_block(&self, hash: &[u8]) -> Result<Option<Block>> {
        // A background prune must not split the index and block reads.
        let snapshot = self.db.snapshot();
        if hash.len() != 32 {
            return Ok(None);
        }
        let height = if let Some(bytes) = snapshot.get(receipt_key(hash)?)? {
            u64::from_le_bytes(
                bytes
                    .as_slice()
                    .try_into()
                    .context("invalid binary receipt height")?,
            )
        } else if let Some(bytes) = snapshot.get(format!("tx/{}", hex::encode(hash)))? {
            crate::codec::from_slice::<u64>(&bytes)?
        } else {
            return Ok(None);
        };
        snapshot
            .get_cf(self.block_cf(), block_key(height))?
            .map(Block::from_bytes)
            .transpose()
    }
    /// A bounded, consistent read independent of the Node mutex. The snapshot
    /// keeps records readable even if retention deletes them during this batch.
    pub(crate) fn block_batch(&self, start: u64, limit: u32) -> Result<Vec<Block>> {
        let limit = limit.min(64);
        if limit == 0 {
            return Ok(Vec::new());
        }
        let (snapshot, head) = {
            // Commit publishes its head while holding this lock. Capture both
            // views together, then release it before disk I/O and validation.
            let cached = self
                .head
                .read()
                .map_err(|_| anyhow::anyhow!("head lock poisoned"))?;
            (
                self.db.snapshot(),
                cached
                    .as_ref()
                    .context("missing cached head")?
                    .block
                    .clone(),
            )
        };
        let mut blocks = Vec::new();
        let mut bytes = 0;
        for offset in 0..u64::from(limit) {
            let height = start.checked_add(offset).context("height overflow")?;
            let block = if height == head.height() {
                head.clone()
            } else {
                let Some(raw) = snapshot.get_cf(self.block_cf(), block_key(height))? else {
                    break;
                };
                Block::from_bytes(raw)?
            };
            if !blocks.is_empty() && bytes + block.as_bytes().len() > 2 * 1024 * 1024 {
                break;
            }
            bytes += block.as_bytes().len();
            blocks.push(block);
        }
        Ok(blocks)
    }
    pub fn blocks(&self) -> Result<Vec<Block>> {
        let mut blocks = Vec::new();
        let start = block_key(self.history_floor.load(Ordering::Acquire));
        for entry in self.db.iterator_cf(
            self.block_cf(),
            rocksdb::IteratorMode::From(start.as_bytes(), rocksdb::Direction::Forward),
        ) {
            let (key, value) = entry?;
            if !key.starts_with(b"block/") {
                break;
            }
            blocks.push(Block::from_bytes(value.into_vec())?);
        }
        Ok(blocks)
    }
    /// Read one consistent indexer batch while commits and pruning continue.
    /// The earliest height and block bytes come from the same RocksDB snapshot.
    pub(crate) fn index_batch(
        &self,
        start: u64,
        limit: usize,
        byte_limit: usize,
    ) -> Result<(u64, Vec<Block>)> {
        // Load before taking the snapshot: a newer floor could otherwise skip
        // blocks that were still retained in an older snapshot.
        let floor = block_key(self.history_floor.load(Ordering::Acquire));
        let snapshot = self.db.snapshot();
        let (key, _) = snapshot
            .iterator_cf(
                self.block_cf(),
                rocksdb::IteratorMode::From(floor.as_bytes(), rocksdb::Direction::Forward),
            )
            .next()
            .context("missing chain history")??;
        ensure!(key.starts_with(b"block/"), "missing chain history");
        let earliest: u64 = std::str::from_utf8(&key[6..])?.parse()?;
        let start = start.max(earliest);
        let mut blocks = Vec::new();
        let mut bytes = 0;
        for offset in 0..limit {
            let height = start
                .checked_add(offset as u64)
                .context("height overflow")?;
            let Some(raw) = snapshot.get_cf(self.block_cf(), block_key(height))? else {
                break;
            };
            let block = Block::from_bytes(raw)?;
            bytes += block.as_bytes().len();
            blocks.push(block);
            // Preserve the indexer's single-large-block and byte bounds.
            if bytes >= byte_limit {
                break;
            }
        }
        Ok((earliest, blocks))
    }
    pub fn earliest_height(&self) -> Result<u64> {
        let start = block_key(self.history_floor.load(Ordering::Acquire));
        for entry in self.db.iterator_cf(
            self.block_cf(),
            rocksdb::IteratorMode::From(start.as_bytes(), rocksdb::Direction::Forward),
        ) {
            let (key, _value) = entry?;
            if key.starts_with(b"block/") {
                return Ok(std::str::from_utf8(&key[6..])?.parse()?);
            }
        }
        bail!("missing chain history")
    }
    /// Durable state and history are atomic. Cap’n Proto is a recoverable projection.
    pub fn commit(&self, block: &Block, world: &World) -> Result<()> {
        self.commit_delta(block, world, &self.world()?)
    }
    /// Only changed Cap’n Proto account records enter the atomic RocksDB write batch.
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
            block.height() == head.height().checked_add(1).context("height overflow")?,
            "non-contiguous height"
        );
        ensure!(block.parent_hash() == prior.hash, "parent mismatch");
        ensure!(block.chain_id() == head.chain_id(), "chain mismatch");
        ensure!(
            block.timestamp() >= head.timestamp(),
            "timestamp moved backwards"
        );
        ensure!(block.state_root() == world.root(), "state root mismatch");
        ensure!(
            block.transaction_count()
                == block
                    .read()?
                    .get_root::<crate::storage_capnp::block::Reader>()?
                    .get_receipts()?
                    .len() as usize,
            "receipt count mismatch"
        );
        let next_head = CachedHead::new(block.clone())?;
        let mut batch = WriteBatch::default();
        for (address, account) in &world.accounts {
            if previous.accounts.get(address) != Some(account) {
                batch.put(
                    format!("account/{address}"),
                    crate::binary::account_bytes(account)?,
                );
            }
        }
        for address in previous.accounts.keys() {
            if !world.accounts.contains_key(address) {
                batch.delete(format!("account/{address}"));
            }
        }
        let metadata = World {
            merkle_cache: Default::default(),
            accounts: Default::default(),
            module_state: world.module_state.clone(),
            block_hashes: world.block_hashes.clone(),
        };
        batch.put(b"world", crate::binary::world_bytes(&metadata)?);
        let encoded_height = crate::codec::to_vec(&block.height())?;
        batch.put(b"head", &encoded_height);
        batch.put_cf(
            self.block_cf(),
            block_key(block.height()),
            &next_head.encoded,
        );
        let message = block.read()?;
        let receipts = message
            .get_root::<crate::storage_capnp::block::Reader>()?
            .get_receipts()?;
        let index_height = block.height().to_le_bytes();
        for receipt in receipts {
            batch.put(receipt_key(receipt.get_transaction_hash()?)?, index_height);
        }
        self.write(batch)?;
        *cached = Some(next_head);
        drop(cached);
        self.notify_indexer();
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
        let mut writer = self
            .history_writer
            .lock()
            .map_err(|_| anyhow::anyhow!("history lock poisoned"))?;
        if block.height() > self.projected_height.load(Ordering::Acquire) {
            let hour = block.timestamp() / self.history_segment_seconds();
            if writer.as_ref().is_none_or(|w| w.hour != hour) {
                if let Some(previous) = writer.as_mut() {
                    previous.sync()?;
                }
                let target = self.history.join(format!("{hour:020}.capnp"));
                let new_segment = !target.exists();
                let file = OpenOptions::new().create(true).append(true).open(target)?;
                if new_segment {
                    file.sync_all()?;
                    File::open(&self.history)?.sync_all()?;
                }
                *writer = Some(HistoryWriter {
                    length: file.metadata()?.len(),
                    file,
                    hour,
                    dirty_bytes: 0,
                    needs_rollback: false,
                });
            }
            writer
                .as_mut()
                .context("missing history writer")?
                .append(&head.encoded)?;
            self.projected_height
                .store(block.height(), Ordering::Release);
        }
        drop(writer);
        drop(cached);
        self.prune()?;
        Ok(())
    }
    fn prune(&self) -> Result<()> {
        // Foreground callers retain immediate cleanup semantics unless a worker owns it.
        // Check before locking so producer/admission never waits for worker deletion.
        if self.background_pruning.load(Ordering::Acquire) {
            return Ok(());
        }
        let _serial = self
            .prune_lock
            .lock()
            .map_err(|_| anyhow::anyhow!("prune lock poisoned"))?;
        if !self.background_pruning.load(Ordering::Acquire) {
            let head = self.head()?;
            self.prune_at(&head, false)?;
        }
        Ok(())
    }
    // true means this cutoff is fully drained; false means another bounded step is needed.
    fn prune_at(&self, head: &Block, bounded: bool) -> Result<bool> {
        let Retention::Pruned { seconds } = self.retention else {
            return Ok(true);
        };
        let cutoff = head.timestamp().saturating_sub(seconds);
        // Block timestamps are monotone whole seconds. Once this cutoff has
        // completed, another block in the same second cannot expire more data.
        // In particular, do not reread and validate the oldest full block on
        // every 10 ms scheduler tick. Errors leave the cutoff retryable.
        if self.pruned_cutoff.load(Ordering::Acquire) == cutoff {
            return Ok(true);
        }
        let block_limit = if bounded { 4 } else { PRUNE_BATCH_BLOCKS };
        let byte_limit = if bounded {
            1024 * 1024
        } else {
            PRUNE_BATCH_BYTES
        };
        let mut batch = WriteBatch::default();
        let mut pending = 0;
        let start = block_key(self.history_floor.load(Ordering::Acquire));
        let mut next_floor = self.history_floor.load(Ordering::Acquire);
        for entry in self.db.iterator_cf(
            self.block_cf(),
            rocksdb::IteratorMode::From(start.as_bytes(), rocksdb::Direction::Forward),
        ) {
            let (key, value) = entry?;
            if !key.starts_with(b"block/") {
                break;
            }
            let block = Block::from_bytes(value.into_vec())?;
            if !expired(&block, head, seconds) {
                next_floor = block.height();
                break;
            }
            // The block is the authority for receipt availability. Old hash
            // indexes are harmless after this atomic durable deletion and are
            // reclaimed by compaction, avoiding one random tombstone per tx.
            batch.delete_cf(self.block_cf(), key);
            // The head is never expired, so a deleted height cannot be u64::MAX.
            next_floor = block.height() + 1;
            pending += 1;
            if pending >= block_limit || batch.size_in_bytes() >= byte_limit {
                // Each batch durably removes complete blocks; receipt reads check block presence.
                // A restart resumes from the earliest remaining block.
                self.write(batch)?;
                self.history_floor.fetch_max(next_floor, Ordering::Release);
                if bounded {
                    // Do not mark the cutoff complete, even if this was its last batch.
                    return Ok(false);
                }
                batch = WriteBatch::default();
                pending = 0;
            }
        }
        if pending != 0 {
            self.write(batch)?;
        }
        self.history_floor.fetch_max(next_floor, Ordering::Release);
        let cutoff_hour = cutoff / self.history_segment_seconds();
        if self.cleaned_hour.load(Ordering::Acquire) != cutoff_hour {
            // Copy the active segment, then release the writer lock before filesystem I/O.
            // Projection timestamps only advance; a later writer cannot reopen an
            // older expired segment. Never make production wait on cleanup/fsync.
            let active_hour = self
                .history_writer
                .lock()
                .map_err(|_| anyhow::anyhow!("history lock poisoned"))?
                .as_ref()
                .map(|w| w.hour);
            for entry in fs::read_dir(&self.history)? {
                let path = entry?.path();
                if path.extension().and_then(|s| s.to_str()) != Some("capnp") {
                    continue;
                }
                if let Some(hour) = path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .and_then(|s| s.parse::<u64>().ok())
                {
                    if hour < cutoff_hour
                        && active_hour != Some(hour)
                        && hour != head.timestamp() / self.history_segment_seconds()
                    {
                        fs::remove_file(path)?;
                    }
                }
            }
            File::open(&self.history)?.sync_all()?;
            self.cleaned_hour.store(cutoff_hour, Ordering::Release);
        }
        self.pruned_cutoff.store(cutoff, Ordering::Release);
        Ok(true)
    }
    fn history_segment_seconds(&self) -> u64 {
        match self.retention {
            Retention::Archive => 3600,
            Retention::Pruned { seconds } => seconds.min(60),
        }
    }
    fn repair_history(&self) -> Result<()> {
        // Rebuild the Cap’n Proto projection from authoritative records only on restart.
        // Rebuild also migrates legacy hourly projections to retention-sized segments.
        let mut segments = std::collections::BTreeMap::<u64, Vec<u8>>::new();
        for block in self.blocks()? {
            let bytes = segments
                .entry(block.timestamp() / self.history_segment_seconds())
                .or_default();
            crate::codec::write_record(bytes, block.as_bytes())?;
        }
        for (hour, bytes) in &segments {
            let target = self.history.join(format!("{hour:020}.capnp"));
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
            if path.extension().and_then(|s| s.to_str()) != Some("capnp") {
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
            .store(self.head()?.height(), Ordering::Release);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn empty_store(path: &Path) -> Store {
        Store::open(
            path,
            Retention::Pruned { seconds: 2 },
            &Genesis {
                chain_id: 1,
                timestamp: 100,
                gas_limit: 30_000_000,
                alloc: Default::default(),
            },
        )
        .unwrap()
    }
    fn append_empty(store: &Store, timestamp: u64) {
        let (block, world) = crate::framework::Application::default()
            .execute_block(
                &store.head().unwrap(),
                &store.world().unwrap(),
                timestamp,
                30_000_000,
                &[],
            )
            .unwrap();
        store.commit(&block, &world).unwrap();
    }

    #[test]
    fn account_scan_crosses_hash_buckets_before_flush_and_after_reopen() {
        let dir = tempfile::tempdir().unwrap();
        let genesis = Genesis {
            chain_id: 1,
            timestamp: 100,
            gas_limit: 30_000_000,
            alloc: (1..=1024u64)
                .map(|index| (format!("0x{index:040x}"), index.to_string()))
                .collect(),
        };
        let expected = genesis.world().unwrap();
        let store = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
        assert_eq!(store.world().unwrap(), expected);
        store.db.flush().unwrap();
        assert_eq!(store.world().unwrap(), expected);
        drop(store);
        let store = Store::open(dir.path(), Retention::Archive, &genesis).unwrap();
        assert_eq!(store.world().unwrap(), expected);
    }

    #[test]
    fn compaction_reclaims_only_indexes_of_durably_expired_blocks() {
        let dir = tempfile::tempdir().unwrap();
        let store = empty_store(dir.path());
        for _ in 0..20 {
            append_empty(&store, 100);
        }
        append_empty(&store, 110);
        let expired_hash = [1u8; 32];
        let live_hash = [2u8; 32];
        let expired_key = format!("tx/{}", hex::encode(expired_hash));
        let live_key = format!("tx/{}", hex::encode(live_hash));
        let invalid_key = format!("tx/{}", hex::encode([3u8; 32]));
        let mut batch = WriteBatch::default();
        batch.put(&expired_key, crate::codec::to_vec(&1u64).unwrap());
        batch.put(&live_key, crate::codec::to_vec(&21u64).unwrap());
        batch.put(&invalid_key, b"invalid-height");
        let expired_binary = receipt_key(&[4u8; 32]).unwrap();
        let live_binary = receipt_key(&[5u8; 32]).unwrap();
        let invalid_binary = receipt_key(&[6u8; 32]).unwrap();
        batch.put(expired_binary, 1u64.to_le_bytes());
        batch.put(live_binary, 21u64.to_le_bytes());
        batch.put(invalid_binary, b"bad");
        store.write(batch).unwrap();
        store.db.flush().unwrap();
        store.db.compact_range::<&[u8], &[u8]>(None, None);
        assert!(store.db.get(&expired_key).unwrap().is_some());
        assert!(store.db.get(expired_binary).unwrap().is_some());
        let snapshot = store.db.snapshot();
        assert!(store.receipt_block(&expired_hash).unwrap().is_some());
        store.prune().unwrap();
        // Logical expiry is immediate even while physical hash indexes remain.
        assert!(store.db.get(&expired_key).unwrap().is_some());
        assert!(store.receipt_block(&expired_hash).unwrap().is_none());
        assert_eq!(
            store.receipt_block(&live_hash).unwrap().unwrap().height(),
            21
        );
        store.db.flush().unwrap();
        store.db.compact_range::<&[u8], &[u8]>(None, None);
        assert!(store.db.get(&expired_key).unwrap().is_none());
        assert!(store.db.get(&live_key).unwrap().is_some());
        assert!(store.db.get(expired_binary).unwrap().is_none());
        assert!(store.db.get(live_binary).unwrap().is_some());
        assert_eq!(store.db.get(invalid_binary).unwrap().unwrap(), b"bad");
        assert_eq!(
            store.db.get(&invalid_key).unwrap().unwrap(),
            b"invalid-height"
        );
        // Never filter block values: old block/indexer snapshots remain readable.
        assert!(snapshot
            .get_cf(store.block_cf(), block_key(1))
            .unwrap()
            .is_some());
        drop(snapshot);
        drop(store);
        let store = empty_store(dir.path());
        assert_eq!(store.earliest_height().unwrap(), 21);
        assert!(store.receipt_block(&expired_hash).unwrap().is_none());
        assert_eq!(
            store.receipt_block(&live_hash).unwrap().unwrap().height(),
            21
        );
    }

    #[test]
    fn bounded_prune_keeps_old_snapshots_and_resumes_after_restart() {
        let dir = tempfile::tempdir().unwrap();
        let store = empty_store(dir.path());
        for _ in 0..20 {
            append_empty(&store, 100);
        }
        append_empty(&store, 110);
        let snapshot = store.db.snapshot();
        assert!(!store.prune_at(&store.head().unwrap(), true).unwrap());
        assert_eq!(store.earliest_height().unwrap(), 4);
        assert_ne!(store.pruned_cutoff.load(Ordering::Acquire), 108);
        assert!(snapshot
            .get_cf(store.block_cf(), block_key(0))
            .unwrap()
            .is_some());
        assert!(store.block(0).unwrap().is_none());
        drop(snapshot);
        drop(store);
        let store = empty_store(dir.path());
        assert_eq!(store.earliest_height().unwrap(), 21);
        assert_eq!(store.head().unwrap().height(), 21);
    }

    #[test]
    fn blocked_pruner_does_not_block_commit_or_projection_and_joins() {
        let dir = tempfile::tempdir().unwrap();
        let store = Arc::new(empty_store(dir.path()));
        let worker = store.start_pruner().unwrap();
        assert!(store.start_pruner().is_err());
        let serial = store.prune_lock.lock().unwrap();
        let producer = store.clone();
        let (send, recv) = std::sync::mpsc::channel();
        let thread = std::thread::spawn(move || {
            append_empty(&producer, 110);
            producer.maintain().unwrap();
            send.send(()).unwrap();
        });
        let completed = recv.recv_timeout(std::time::Duration::from_secs(2));
        drop(serial);
        thread.join().unwrap();
        completed.expect("producer waited for the blocked retention worker");
        let deadline = std::time::Instant::now() + std::time::Duration::from_secs(2);
        while store.earliest_height().unwrap() != 1 {
            assert!(std::time::Instant::now() < deadline, "worker did not prune");
            std::thread::sleep(std::time::Duration::from_millis(5));
        }
        drop(worker);
        assert!(!store.background_pruning.load(Ordering::Acquire));
        // No surviving worker owns the database after guard shutdown.
        assert_eq!(Arc::strong_count(&store), 1);
        let worker = store.start_pruner().unwrap();
        drop(worker);
        drop(store);
        assert_eq!(empty_store(dir.path()).head().unwrap().height(), 1);
    }

    #[tokio::test]
    async fn worker_io_failure_is_reported_to_server() {
        let dir = tempfile::tempdir().unwrap();
        let store = Arc::new(empty_store(dir.path()));
        append_empty(&store, 110);
        std::fs::remove_dir_all(&store.history).unwrap();
        let mut worker = store.start_pruner().unwrap();
        let error = tokio::time::timeout(std::time::Duration::from_secs(2), worker.failed())
            .await
            .expect("worker hid its I/O failure")
            .unwrap_err();
        assert!(error.downcast_ref::<std::io::Error>().is_some());
        drop(worker);
    }

    #[test]
    fn retained_history_reads_survive_repeated_pruning_and_restart() {
        let dir = tempfile::tempdir().unwrap();
        let genesis = Genesis {
            chain_id: 1,
            timestamp: 100,
            gas_limit: 30_000_000,
            alloc: Default::default(),
        };
        let retention = Retention::Pruned { seconds: 2 };
        let mut store = Store::open(dir.path(), retention.clone(), &genesis).unwrap();
        let mut retained = vec![store.head().unwrap()];
        // Equal timestamps exercise the exclusive cutoff; jumps expire several
        // blocks together. Reopening must recover the seek bound from the DB.
        for timestamp in [100, 100, 102, 104, 104, 108, 108, 110] {
            let previous = store.head().unwrap();
            let snapshot = store.db.snapshot();
            let (block, world) = crate::framework::Application::default()
                .execute_block(
                    &previous,
                    &store.world().unwrap(),
                    timestamp,
                    genesis.gas_limit,
                    &[],
                )
                .unwrap();
            store.commit(&block, &world).unwrap();
            store.maintain().unwrap();
            store.maintain().unwrap();
            retained.push(block.clone());
            retained.retain(|b| !expired(b, &block, 2));
            let first = retained[0].height();
            assert_eq!(store.earliest_height().unwrap(), first);
            assert_eq!(store.blocks().unwrap(), retained);
            assert_eq!(
                store.index_batch(0, 64, usize::MAX).unwrap(),
                (first, retained.clone())
            );
            assert_eq!(
                store
                    .index_batch(block.height() + 1, 64, usize::MAX)
                    .unwrap(),
                (first, vec![])
            );
            // A reader holding an older snapshot still sees its original head.
            assert!(snapshot
                .get_cf(store.block_cf(), block_key(previous.height()))
                .unwrap()
                .is_some());
            drop(snapshot);
            if block.height() % 3 == 0 {
                drop(store);
                store = Store::open(dir.path(), retention.clone(), &genesis).unwrap();
            }
            assert_eq!(store.blocks().unwrap(), retained);
            assert_eq!(
                store.index_batch(0, 64, usize::MAX).unwrap(),
                (first, retained.clone())
            );
        }
    }

    #[test]
    fn history_retry_removes_partial_frame_without_rewriting_valid_bytes() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("history.capnp");
        let mut writer = HistoryWriter {
            file: OpenOptions::new()
                .create(true)
                .append(true)
                .open(&path)
                .unwrap(),
            hour: 0,
            length: 0,
            dirty_bytes: 0,
            needs_rollback: false,
        };
        writer.append(b"first").unwrap();
        // Simulate write_record failing after publishing a length and partial data.
        writer.file.write_all(&99u64.to_le_bytes()).unwrap();
        writer.file.write_all(b"torn").unwrap();
        writer.needs_rollback = true;
        writer.append(b"second").unwrap();
        writer.sync().unwrap();
        assert_eq!(writer.dirty_bytes, 0);
        let mut file = File::open(path).unwrap();
        assert_eq!(
            crate::codec::read_record(&mut file).unwrap().unwrap(),
            b"first"
        );
        assert_eq!(
            crate::codec::read_record(&mut file).unwrap().unwrap(),
            b"second"
        );
        assert!(crate::codec::read_record(&mut file).unwrap().is_none());
    }

    #[test]
    fn cutoff_is_exclusive_and_head_is_never_pruned() {
        let draft = crate::types::BlockDraft {
            chain_id: 1,
            height: 10,
            timestamp: 100,
            parent_hash: [0; 32],
            state_root: [0; 32],
            transactions: vec![],
            receipts: vec![],
        };
        let head = Block::build(draft.clone()).unwrap();
        let mut old = draft;
        old.height = 9;
        old.timestamp = 89;
        assert!(expired(&Block::build(old.clone()).unwrap(), &head, 10));
        old.timestamp = 90;
        assert!(!expired(&Block::build(old.clone()).unwrap(), &head, 10));
        assert!(!expired(&head, &head, 10));
        assert!(!expired(&Block::build(old.clone()).unwrap(), &head, 200));
    }
}
