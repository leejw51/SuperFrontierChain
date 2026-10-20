//! A deterministic, small application lifecycle. Module order is registration order.
use crate::{
    ethereum::{self, Context, Transaction},
    types::{Block, World, MAX_BLOCK_BYTES},
};
use anyhow::{ensure, Result};
use std::collections::VecDeque;

pub trait Module: Send + Sync {
    fn name(&self) -> &str;
    fn begin_block(&self, _context: Context, _state: &mut World) -> Result<()> {
        Ok(())
    }
    fn end_block(&self, _context: Context, _state: &mut World) -> Result<()> {
        Ok(())
    }
}
#[derive(Default)]
pub struct Application {
    modules: Vec<Box<dyn Module>>,
}
pub struct PreparedBlock {
    pub block: Block,
    pub world: World,
    pub consumed: usize,
}
impl Application {
    pub fn with_module(mut self, module: impl Module + 'static) -> Result<Self> {
        ensure!(
            !self.modules.iter().any(|m| m.name() == module.name()),
            "duplicate module name"
        );
        self.modules.push(Box::new(module));
        Ok(self)
    }
    /// Import path: invalid transactions reject the entire block atomically.
    pub fn execute_block(
        &self,
        parent: &Block,
        world: &World,
        timestamp: u64,
        gas_limit: u64,
        transactions: &[Transaction],
    ) -> Result<(Block, World)> {
        ensure!(
            transactions.len() <= crate::types::MAX_BLOCK_TRANSACTIONS,
            "too many transactions in block"
        );
        let prepared = self.execute(
            parent,
            world,
            timestamp,
            gas_limit,
            transactions.iter(),
            None,
        )?;
        Ok((prepared.block, prepared.world))
    }
    /// Production path: select and execute in one pass, preserving queue entries until commit.
    pub fn prepare_pending(
        &self,
        parent: &Block,
        world: &World,
        timestamp: u64,
        gas_limit: u64,
        pending: &VecDeque<Transaction>,
        limit: usize,
    ) -> Result<PreparedBlock> {
        self.execute(
            parent,
            world,
            timestamp,
            gas_limit,
            pending.iter(),
            Some(limit),
        )
    }
    fn execute<'a>(
        &self,
        parent: &Block,
        world: &World,
        timestamp: u64,
        gas_limit: u64,
        transactions: impl Iterator<Item = &'a Transaction>,
        selection: Option<usize>,
    ) -> Result<PreparedBlock> {
        ensure!(timestamp >= parent.timestamp, "timestamp moved backwards");
        let context = Context {
            chain_id: parent.chain_id,
            height: parent
                .height
                .checked_add(1)
                .ok_or_else(|| anyhow::anyhow!("height overflow"))?,
            timestamp,
            gas_limit,
        };
        let parent_hash = parent.hash();
        let mut next = world.clone();
        next.block_hashes.insert(parent.height, parent_hash);
        next.block_hashes
            .retain(|height, _| *height >= context.height.saturating_sub(256));
        for module in &self.modules {
            module.begin_block(context, &mut next)?;
        }
        let mut db = ethereum::load_db(&next)?;
        let mut gas_used = 0;
        let mut bytes = 0;
        let mut consumed = 0;
        let mut receipts = Vec::new();
        let mut accepted = Vec::new();
        let mut executor = ethereum::Executor::new(&mut db, context);
        for tx in transactions {
            let fits =
                tx.env.gas_limit <= gas_limit - gas_used && bytes + tx.raw.len() <= MAX_BLOCK_BYTES;
            if let Some(limit) = selection {
                if receipts.len() >= limit
                    || consumed >= crate::types::MAX_BLOCK_TRANSACTIONS
                    || !fits
                {
                    break;
                }
            }
            ensure!(fits, "block resource limit exceeded");
            consumed += 1;
            let result = match executor.execute(tx.env.clone(), true) {
                Ok(result) => result,
                Err(error) if selection.is_some() => {
                    crate::logging::event(
                        "warn",
                        "transaction_dropped",
                        serde_json::json!({"message":error.to_string()}),
                    );
                    continue;
                }
                Err(error) => return Err(error),
            };
            gas_used += result.gas_used();
            bytes += tx.raw.len();
            receipts.push(ethereum::receipt(tx, &result, gas_used));
            accepted.push(format!("0x{}", hex::encode(&tx.raw)));
        }
        drop(executor);
        ethereum::save_db(&db, &mut next)?;
        for module in &self.modules {
            module.end_block(context, &mut next)?;
        }
        let block = Block {
            chain_id: parent.chain_id,
            height: context.height,
            timestamp,
            parent_hash,
            state_root: next.root(),
            transactions: accepted,
            receipts,
        };
        Ok(PreparedBlock {
            block,
            world: next,
            consumed,
        })
    }
}
