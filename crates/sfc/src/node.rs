use crate::{
    config::Config,
    ethereum::{self, Context, Transaction},
    framework::Application,
    storage::Store,
    types::{Block, Genesis, Hash, World},
};
use anyhow::{ensure, Result};
use std::collections::{BTreeSet, VecDeque};

pub struct Node {
    pub config: Config,
    pub genesis: Genesis,
    pub store: std::sync::Arc<Store>,
    pub app: Application,
    pub verifier: std::sync::Arc<crate::verification::Verifier>,
    pending: VecDeque<Transaction>,
    pending_hashes: BTreeSet<Hash>,
    pending_bytes: usize,
    pending_db: crate::evm_db::OrderedDb,
    world: World,
    head: Block,
    direct_indexer: Option<crate::indexer::DirectWriter>,
}
impl Node {
    pub fn enable_direct_indexer(&mut self, batch_blocks: usize) -> Result<()> {
        ensure!(
            self.direct_indexer.is_none(),
            "direct SQLite indexer already enabled"
        );
        self.direct_indexer = Some(crate::indexer::DirectWriter::open(
            self.config.data_dir.clone(),
            &self.store,
            batch_blocks,
        )?);
        Ok(())
    }
    pub fn flush_direct_indexer(&mut self) -> Result<()> {
        if let Some(indexer) = self.direct_indexer.as_mut() {
            indexer.flush()?;
        }
        Ok(())
    }
    pub fn pending_count(&self) -> usize {
        self.pending.len()
    }
    pub fn open(config: Config, app: Application) -> Result<Self> {
        config.validate()?;
        let genesis: Genesis = crate::codec::from_slice(&std::fs::read(&config.genesis)?)?;
        let verifier = std::sync::Arc::new(crate::verification::Verifier::new(
            config.verification.clone(),
        )?);
        let store = Store::open(&config.data_dir, config.retention.clone(), &genesis)?;
        // Only rewrite compatible metadata after the database protocol check.
        // A rejected v1/v2 home must retain its original configuration files.
        let _: Genesis = crate::codec::upgrade_file(&config.genesis)?;
        let world = store.world()?;
        let head = store.head()?;
        let pending_db = if config.sync_peer.is_none() {
            pending_db(&world, &head, store.head_hash()?)?
        } else {
            Default::default()
        };
        Ok(Self {
            config,
            verifier,
            genesis,
            store: std::sync::Arc::new(store),
            app,
            pending: VecDeque::new(),
            pending_hashes: BTreeSet::new(),
            pending_bytes: 0,
            pending_db,
            world,
            head,
            direct_indexer: None,
        })
    }
    pub fn submit(&mut self, raw: &[u8]) -> Result<Hash> {
        ensure!(
            self.config.sync_peer.is_none(),
            "follower is read-only; submit to the sequencer"
        );
        let tx = self
            .verifier
            .decode_batch(&[raw], self.genesis.chain_id)?
            .remove(0)?;
        self.submit_verified(tx)
    }
    pub(crate) fn submit_verified(&mut self, tx: Transaction) -> Result<Hash> {
        ensure!(
            self.config.sync_peer.is_none(),
            "follower is read-only; submit to the sequencer"
        );
        let context = self.context(self.head.height() + 1, self.head.timestamp());
        admit(
            &mut self.pending,
            &mut self.pending_hashes,
            &mut self.pending_bytes,
            self.config.max_pending,
            tx,
            |tx| ethereum::execute(&mut self.pending_db, tx.env.clone(), context, true).map(|_| ()),
        )
    }

    /// Parallel authentication followed by ordered, per-transaction admission.
    /// Individual failures do not roll back other accepted entries, matching JSON-RPC batches.
    pub fn submit_batch<T: AsRef<[u8]> + Sync>(&mut self, raw: &[T]) -> Result<Vec<Result<Hash>>> {
        ensure!(
            self.config.sync_peer.is_none(),
            "follower is read-only; submit to the sequencer"
        );
        let decoded = self.verifier.decode_batch(raw, self.genesis.chain_id)?;
        self.submit_decoded_batch(decoded)
    }

    /// Ordered admission after independent authentication, including the HTTP batch path.
    pub(crate) fn submit_decoded_batch(
        &mut self,
        decoded: Vec<Result<Transaction>>,
    ) -> Result<Vec<Result<Hash>>> {
        ensure!(
            self.config.sync_peer.is_none(),
            "follower is read-only; submit to the sequencer"
        );
        let context = self.context(self.head.height() + 1, self.head.timestamp());
        let mut executor = ethereum::Executor::new(&mut self.pending_db, context);
        let batch_len = decoded.len();
        let pending_start = self.pending.len();
        let results = decoded
            .into_iter()
            .map(|tx| {
                tx.and_then(|tx| {
                    admit(
                        &mut self.pending,
                        &mut self.pending_hashes,
                        &mut self.pending_bytes,
                        self.config.max_pending,
                        tx,
                        |tx| executor.execute(tx.env.clone(), true).map(|_| ()),
                    )
                })
            })
            .collect();
        // Partial batches must not pin a whole RPC slab for a tiny surviving
        // transaction. Full batches retain their shared, contiguous ownership.
        if self.pending.len() - pending_start != batch_len {
            for tx in self.pending.iter_mut().skip(pending_start) {
                tx.raw = bytes::Bytes::copy_from_slice(&tx.raw);
            }
        }
        Ok(results)
    }

    pub fn pending_len(&self) -> usize {
        self.pending.len()
    }
    pub fn context(&self, height: u64, timestamp: u64) -> Context {
        Context {
            chain_id: self.genesis.chain_id,
            height,
            timestamp,
            gas_limit: self.genesis.gas_limit,
        }
    }
    pub fn produce(&mut self, timestamp: u64) -> Result<Block> {
        ensure!(
            self.config.sync_peer.is_none(),
            "followers cannot produce blocks"
        );
        let timestamp = timestamp.max(self.head.timestamp());
        let prepared = self.app.prepare_pending(
            &self.head,
            &self.world,
            timestamp,
            self.genesis.gas_limit,
            &self.pending,
            self.config.max_block_transactions,
        )?;
        let block = prepared.block;
        let next = prepared.world;
        let rocksdb_commit = crate::indexer::measure_commit(self.direct_indexer.is_some(), || {
            self.store.commit_delta(&block, &next, &self.world)
        })?;
        for _ in 0..prepared.consumed {
            self.pending.pop_front();
        }
        self.head = block.clone();
        self.world = next;
        self.pending_db = pending_db(&self.world, &self.head, self.store.head_hash()?)?;
        let context = self.context(block.height() + 1, block.timestamp());
        let mut executor = ethereum::Executor::new(&mut self.pending_db, context);
        let before_revalidation = self.pending.len();
        self.pending
            .retain(|tx| executor.execute(tx.env.clone(), true).is_ok());
        if self.pending.len() != before_revalidation {
            for tx in &mut self.pending {
                tx.raw = bytes::Bytes::copy_from_slice(&tx.raw);
            }
        }
        self.pending_hashes = self.pending.iter().map(|tx| tx.hash).collect();
        self.pending_bytes = self.pending.iter().map(|tx| tx.raw.len()).sum();
        if let Some(indexer) = self.direct_indexer.as_mut() {
            indexer.record(&self.store, rocksdb_commit);
        }
        self.store.maintain()?;
        Ok(block)
    }
    pub fn world(&self) -> Result<&World> {
        Ok(&self.world)
    }
    pub fn head(&self) -> &Block {
        &self.head
    }
    pub fn import_encoded(&mut self, remote: Block) -> Result<()> {
        ensure!(
            self.config.sync_peer.is_some(),
            "only followers import blocks"
        );
        ensure!(
            remote.chain_id() == self.genesis.chain_id,
            "remote chain mismatch"
        );
        ensure!(
            remote.height() == self.head.height() + 1 && remote.parent_hash() == self.head.hash(),
            "remote ancestry mismatch"
        );
        let reader = remote.read()?;
        let root = reader.get_root::<crate::storage_capnp::block::Reader>()?;
        let bytes = remote.shared_bytes();
        let raw = root
            .get_transactions()?
            .iter()
            .map(|tx| Ok(bytes.slice_ref(tx?)))
            .collect::<Result<Vec<_>>>()?;
        let transactions = self
            .verifier
            .decode_shared(&raw, self.genesis.chain_id)?
            .into_iter()
            .collect::<Result<Vec<_>>>()?;
        let (block, world) = self.app.execute_block(
            &self.head,
            &self.world,
            remote.timestamp(),
            self.genesis.gas_limit,
            &transactions,
        )?;
        ensure!(
            block.as_bytes() == remote.as_bytes(),
            "remote execution record mismatch"
        );
        let rocksdb_commit = crate::indexer::measure_commit(self.direct_indexer.is_some(), || {
            self.store.commit_delta(&block, &world, &self.world)
        })?;
        self.head = block;
        self.world = world;
        if let Some(indexer) = self.direct_indexer.as_mut() {
            indexer.record(&self.store, rocksdb_commit);
        }
        self.store.maintain()?;
        Ok(())
    }
}
fn pending_db(world: &World, head: &Block, hash: Hash) -> Result<crate::evm_db::OrderedDb> {
    let mut db = ethereum::load_db(world)?;
    db.block_hashes.insert(
        revm::primitives::U256::from(head.height()),
        revm::primitives::B256::from(hash),
    );
    Ok(db)
}

fn admit(
    pending: &mut VecDeque<Transaction>,
    hashes: &mut BTreeSet<Hash>,
    bytes: &mut usize,
    limit: usize,
    tx: Transaction,
    execute: impl FnOnce(&Transaction) -> Result<()>,
) -> Result<Hash> {
    if hashes.contains(&tx.hash) {
        return Ok(tx.hash);
    }
    ensure!(
        pending.len() < limit && *bytes + tx.raw.len() <= crate::types::MAX_PENDING_BYTES,
        "mempool is full"
    );
    execute(&tx)?;
    let hash = tx.hash;
    *bytes += tx.raw.len();
    hashes.insert(hash);
    pending.push_back(tx);
    Ok(hash)
}
