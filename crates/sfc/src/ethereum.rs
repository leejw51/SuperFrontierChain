//! Ethereum transaction decoding and Shanghai EVM execution.
use crate::types::{hash, Account, Hash, Log, Receipt, World, MAX_TX_BYTES};
use anyhow::{bail, ensure, Context as _, Result};
use k256::ecdsa::Signature;
use rayon::prelude::*;
use revm::{
    primitives::{
        AccessListItem, AccountInfo, Address, Bytecode, Bytes, ExecutionResult, Output, SpecId,
        TxEnv, TxKind, B256, U256,
    },
    Evm,
};
use rlp::{Rlp, RlpStream};

#[derive(Clone, Debug)]
pub struct Transaction {
    pub hash: Hash,
    pub raw: Vec<u8>,
    pub env: TxEnv,
    pub tx_type: u8,
}
fn uint(rlp: &Rlp<'_>, index: usize) -> Result<U256> {
    let field = rlp.at(index)?;
    let bytes = field.data()?;
    ensure!(
        bytes.len() <= 32 && bytes.first() != Some(&0),
        "noncanonical integer"
    );
    Ok(U256::from_be_slice(bytes))
}
fn number(rlp: &Rlp<'_>, index: usize) -> Result<u64> {
    u64::try_from(uint(rlp, index)?).context("integer exceeds u64")
}
fn destination(rlp: &Rlp<'_>, index: usize) -> Result<TxKind> {
    let field = rlp.at(index)?;
    let bytes = field.data()?;
    if bytes.is_empty() {
        return Ok(TxKind::Create);
    }
    ensure!(bytes.len() == 20, "destination must be 20 bytes");
    Ok(TxKind::Call(Address::from_slice(bytes)))
}
fn access_list(rlp: &Rlp<'_>, index: usize) -> Result<Vec<AccessListItem>> {
    let list = rlp.at(index)?;
    ensure!(list.is_list(), "access list must be a list");
    let mut items = Vec::new();
    for item in list.iter() {
        ensure!(item.item_count()? == 2, "invalid access-list item");
        let address = item.at(0)?.data()?.to_vec();
        ensure!(address.len() == 20, "invalid access-list address");
        let slots = item.at(1)?;
        ensure!(slots.is_list(), "storage keys must be a list");
        let mut storage_keys = Vec::new();
        for slot in slots.iter() {
            let bytes = slot.data()?;
            ensure!(bytes.len() == 32, "storage key must be 32 bytes");
            storage_keys.push(B256::from_slice(bytes));
        }
        items.push(AccessListItem {
            address: Address::from_slice(&address),
            storage_keys,
        });
    }
    Ok(items)
}
fn validate_rlp(rlp: &Rlp<'_>) -> Result<()> {
    // Re-encode the tree to reject alternative encodings and trailing data.
    fn append(rlp: &Rlp<'_>, stream: &mut RlpStream, depth: usize) -> Result<()> {
        ensure!(depth <= 16, "RLP nesting exceeds limit");
        if rlp.is_list() {
            stream.begin_list(rlp.item_count()?);
            for child in rlp.iter() {
                append(&child, stream, depth + 1)?;
            }
        } else {
            stream.append(&rlp.data()?);
        }
        Ok(())
    }
    let mut encoded = RlpStream::new();
    append(rlp, &mut encoded, 0)?;
    ensure!(
        encoded.out().as_ref() == rlp.as_raw(),
        "noncanonical RLP or trailing bytes"
    );
    Ok(())
}
/// Parsed and policy-checked, but not yet authenticated.
pub(crate) struct PreparedTransaction {
    pub transaction: Transaction,
    pub recovery: crate::verification::RecoveryInput,
}
impl PreparedTransaction {
    pub fn finish(mut self, key: secp256k1::PublicKey) -> Transaction {
        self.transaction.env.caller =
            Address::from_slice(&hash(&key.serialize_uncompressed()[1..])[12..]);
        self.transaction
    }
}
impl Transaction {
    pub fn decode(raw: &[u8], expected_chain: u64) -> Result<Self> {
        let prepared = Self::prepare(raw, expected_chain)?;
        let key = prepared.recovery.cpu_recover()?;
        Ok(prepared.finish(key))
    }
    pub(crate) fn prepare(raw: &[u8], expected_chain: u64) -> Result<PreparedTransaction> {
        ensure!(
            !raw.is_empty() && raw.len() <= MAX_TX_BYTES,
            "invalid transaction size"
        );
        let typed = raw[0] == 2;
        ensure!(
            typed || raw[0] >= 0xc0,
            "only EIP-155 legacy and type-2 transactions supported"
        );
        let payload = if typed { &raw[1..] } else { raw };
        let rlp = Rlp::new(payload);
        validate_rlp(&rlp)?;
        ensure!(
            rlp.item_count()? == if typed { 12 } else { 9 },
            "invalid transaction field count"
        );
        let (chain_id, parity, r_index, env, signing_bytes) = if typed {
            let chain_id = number(&rlp, 0)?;
            let mut stream = RlpStream::new_list(9);
            for i in 0..9 {
                stream.append_raw(rlp.at(i)?.as_raw(), 1);
            }
            let mut signing = vec![2];
            signing.extend(stream.out());
            (
                chain_id,
                number(&rlp, 9)?,
                10,
                TxEnv {
                    chain_id: Some(chain_id),
                    nonce: Some(number(&rlp, 1)?),
                    gas_priority_fee: Some(uint(&rlp, 2)?),
                    gas_price: uint(&rlp, 3)?,
                    gas_limit: number(&rlp, 4)?,
                    transact_to: destination(&rlp, 5)?,
                    value: uint(&rlp, 6)?,
                    data: Bytes::copy_from_slice(rlp.at(7)?.data()?),
                    access_list: access_list(&rlp, 8)?,
                    ..Default::default()
                },
                signing,
            )
        } else {
            let v = number(&rlp, 6)?;
            ensure!(v >= 35, "unprotected transactions are rejected");
            let chain_id = (v - 35) / 2;
            let mut stream = RlpStream::new_list(9);
            for i in 0..6 {
                stream.append_raw(rlp.at(i)?.as_raw(), 1);
            }
            stream.append(&chain_id).append(&0u8).append(&0u8);
            (
                chain_id,
                (v - 35) % 2,
                7,
                TxEnv {
                    chain_id: Some(chain_id),
                    nonce: Some(number(&rlp, 0)?),
                    gas_price: uint(&rlp, 1)?,
                    gas_limit: number(&rlp, 2)?,
                    transact_to: destination(&rlp, 3)?,
                    value: uint(&rlp, 4)?,
                    data: Bytes::copy_from_slice(rlp.at(5)?.data()?),
                    ..Default::default()
                },
                stream.out().to_vec(),
            )
        };
        ensure!(chain_id == expected_chain, "wrong chain id");
        ensure!(parity <= 1, "invalid recovery parity");
        let r = uint(&rlp, r_index)?.to_be_bytes::<32>();
        let s = uint(&rlp, r_index + 1)?.to_be_bytes::<32>();
        let signature = Signature::from_scalars(r, s)?;
        ensure!(
            signature.normalize_s().is_none(),
            "high-s signature rejected"
        );
        Ok(PreparedTransaction {
            recovery: crate::verification::RecoveryInput {
                digest: hex::encode(hash(&signing_bytes)),
                signature: hex::encode(signature.to_bytes()),
                parity: parity as u8,
            },
            transaction: Self {
                hash: hash(raw),
                raw: raw.to_vec(),
                env,
                tx_type: if typed { 2 } else { 0 },
            },
        })
    }
}

pub fn load_db(world: &World) -> Result<crate::evm_db::OrderedDb> {
    let mut db = crate::evm_db::OrderedDb::default();
    for (address, account) in &world.accounts {
        let address: Address = address.parse()?;
        let code = Bytecode::new_raw(Bytes::from(hex::decode(&account.code)?));
        db.insert_account_info(
            address,
            AccountInfo {
                balance: account.balance.parse()?,
                nonce: account.nonce,
                code_hash: code.hash_slow(),
                code: Some(code),
            },
        );
        for (slot, value) in &account.storage {
            db.insert_account_storage(address, slot.parse()?, value.parse()?)?;
        }
    }
    for (height, value) in &world.block_hashes {
        db.block_hashes
            .insert(U256::from(*height), B256::from(*value));
    }
    Ok(db)
}
pub fn save_db(db: &crate::evm_db::OrderedDb, world: &mut World) -> Result<()> {
    world.accounts.clear();
    for (address, account) in &db.accounts {
        let code = db
            .contracts
            .get(&account.info.code_hash)
            .map(|c| hex::encode(c.original_bytes()))
            .unwrap_or_default();
        // Canonicalize absent/zero slots and empty accounts; reads must not change the commitment.
        if account.info.balance.is_zero()
            && account.info.nonce == 0
            && code.is_empty()
            && account.storage.values().all(|v| v.is_zero())
        {
            continue;
        }
        world.accounts.insert(
            format!("{address:#x}"),
            Account {
                balance: account.info.balance.to_string(),
                nonce: account.info.nonce,
                code,
                storage: account
                    .storage
                    .iter()
                    .filter(|(_, v)| !v.is_zero())
                    .map(|(k, v)| (k.to_string(), v.to_string()))
                    .collect(),
            },
        );
    }
    Ok(())
}
#[derive(Clone, Copy)]
pub struct Context {
    pub chain_id: u64,
    pub height: u64,
    pub timestamp: u64,
    pub gas_limit: u64,
}

pub fn execute(
    db: &mut crate::evm_db::OrderedDb,
    env: TxEnv,
    context: Context,
    commit: bool,
) -> Result<ExecutionResult> {
    execute_inner(db, env, context, commit, false)
}

/// RPC simulation permits contract callers without relaxing transaction admission.
pub fn simulate(
    db: &mut crate::evm_db::OrderedDb,
    env: TxEnv,
    context: Context,
) -> Result<ExecutionResult> {
    execute_inner(db, env, context, false, true)
}

fn execute_inner(
    db: &mut crate::evm_db::OrderedDb,
    env: TxEnv,
    context: Context,
    commit: bool,
    simulation: bool,
) -> Result<ExecutionResult> {
    Executor::configured(db, context, simulation).execute(env, commit)
}

/// One handler/environment per ordered execution batch. REVM clears transaction-local
/// journal state on both success and error; only the backing database persists.
pub(crate) struct Executor<'a> {
    evm: Evm<'a, (), &'a mut crate::evm_db::OrderedDb>,
}
impl<'a> Executor<'a> {
    pub(crate) fn new(db: &'a mut crate::evm_db::OrderedDb, context: Context) -> Self {
        Self::configured(db, context, false)
    }
    fn configured(
        db: &'a mut crate::evm_db::OrderedDb,
        context: Context,
        simulation: bool,
    ) -> Self {
        let evm = Evm::builder()
            .with_db(db)
            .with_spec_id(SpecId::SHANGHAI)
            .modify_cfg_env(|cfg| {
                cfg.chain_id = context.chain_id;
                cfg.disable_eip3607 = simulation;
            })
            .modify_block_env(|block| {
                block.number = U256::from(context.height);
                block.timestamp = U256::from(context.timestamp);
                block.gas_limit = U256::from(context.gas_limit);
                block.basefee = U256::ZERO;
                // Development randomness is deterministic; unsuitable for lotteries.
                block.prevrandao = Some(B256::ZERO);
            })
            .build();
        Self { evm }
    }
    pub(crate) fn execute(&mut self, env: TxEnv, commit: bool) -> Result<ExecutionResult> {
        self.evm.context.evm.env.tx = env;
        let outcome = self.evm.transact().map_err(|e| anyhow::anyhow!("{e}"))?;
        if commit {
            self.evm.context.evm.db.apply(outcome.state);
        }
        Ok(outcome.result)
    }
}

pub fn receipt(tx: &Transaction, result: &ExecutionResult, cumulative: u64) -> Receipt {
    let contract_address = match result {
        ExecutionResult::Success {
            output: Output::Create(_, Some(address)),
            ..
        } => Some(format!("{address:#x}")),
        _ => None,
    };
    Receipt {
        transaction_hash: tx.hash,
        from: format!("{:#x}", tx.env.caller),
        to: match tx.env.transact_to {
            TxKind::Call(address) => Some(format!("{address:#x}")),
            TxKind::Create => None,
        },
        success: result.is_success(),
        gas_used: result.gas_used(),
        cumulative_gas_used: cumulative,
        contract_address,
        logs: result
            .logs()
            .iter()
            .map(|log| Log {
                address: format!("{:#x}", log.address),
                topics: log
                    .data
                    .topics()
                    .iter()
                    .map(|t| format!("{t:#x}"))
                    .collect(),
                data: format!("0x{}", hex::encode(&log.data.data)),
            })
            .collect(),
    }
}
pub fn output(result: ExecutionResult) -> Result<Vec<u8>> {
    match result {
        ExecutionResult::Success { output, .. } => Ok(output.into_data().to_vec()),
        ExecutionResult::Revert { output, .. } => {
            bail!("execution reverted: 0x{}", hex::encode(output))
        }
        ExecutionResult::Halt { reason, .. } => bail!("execution halted: {reason:?}"),
    }
}

/// Indexed collection preserves transaction order and makes error selection deterministic.
/// Small batches stay serial to avoid scheduling overhead.
pub(crate) fn ordered_map<T: Sync, R: Send>(
    items: &[T],
    f: impl Fn(&T) -> R + Sync + Send,
) -> Vec<R> {
    if items.len() < 32 {
        items.iter().map(f).collect()
    } else {
        items.par_iter().with_min_len(16).map(f).collect()
    }
}

pub fn decode_batch<T: AsRef<[u8]> + Sync>(raw: &[T], chain_id: u64) -> Result<Vec<Transaction>> {
    validate_batch_size(raw)?;
    let decoded = ordered_map(raw, |bytes| Transaction::decode(bytes.as_ref(), chain_id));
    decoded
        .into_iter()
        .enumerate()
        .map(|(index, tx)| tx.with_context(|| format!("transaction {index}")))
        .collect()
}

pub(crate) fn validate_batch_size<T: AsRef<[u8]>>(raw: &[T]) -> Result<()> {
    ensure!(
        raw.len() <= crate::types::MAX_BLOCK_TRANSACTIONS,
        "too many transactions in batch"
    );
    let mut total = 0usize;
    for bytes in raw {
        ensure!(
            bytes.as_ref().len() <= MAX_TX_BYTES,
            "invalid transaction size"
        );
        total = total
            .checked_add(bytes.as_ref().len())
            .context("batch size overflow")?;
        ensure!(
            total <= crate::types::MAX_BLOCK_BYTES,
            "batch byte limit exceeded"
        );
    }
    Ok(())
}
