//! Consensus building blocks. A distributed reactor is deliberately a separate integration.
use crate::types::Hash;
use anyhow::{bail, ensure, Context, Result};
use ed25519_dalek::{Signature, Signer, SigningKey, VerifyingKey};
use rocksdb::{WriteBatch, DB};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeMap, path::Path};

#[derive(Clone, Copy, Debug, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum Phase {
    Prevote,
    Precommit,
}
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
pub struct Vote {
    pub chain_id: u64,
    pub height: u64,
    pub round: u32,
    pub phase: Phase,
    pub block: Option<Hash>,
    pub validator: [u8; 32],
    pub signature: Vec<u8>,
}
impl Vote {
    pub fn sign_bytes(&self) -> Vec<u8> {
        let mut bytes = b"sfc/vote/v1".to_vec();
        bytes.extend(self.chain_id.to_be_bytes());
        bytes.extend(self.height.to_be_bytes());
        bytes.extend(self.round.to_be_bytes());
        bytes.push(self.phase as u8);
        bytes.push(u8::from(self.block.is_some()));
        bytes.extend(self.block.unwrap_or_default());
        bytes.extend(self.validator);
        bytes
    }
    pub fn verify(&self) -> Result<()> {
        let key = VerifyingKey::from_bytes(&self.validator)?;
        key.verify_strict(&self.sign_bytes(), &Signature::from_slice(&self.signature)?)?;
        Ok(())
    }
}

/// RocksDB supplies the process lock and synchronous durable anti-double-sign record.
/// Keep this directory on durable local disk. Never restore an old signing database.
pub struct DurableSigner {
    key: SigningKey,
    chain_id: u64,
    db: DB,
}
impl DurableSigner {
    pub fn open(path: &Path, chain_id: u64, key: SigningKey) -> Result<Self> {
        let options = crate::journal::database_options();
        let db = DB::open(&options, path)?;
        let version = crate::schema::rocksdb_version(&db)?;
        ensure!(
            version <= crate::schema::SIGNER_VERSION,
            "signer schema {version} is newer than supported {}; use a newer binary",
            crate::schema::SIGNER_VERSION
        );
        let identity = crate::codec::to_vec(&(chain_id, key.verifying_key().to_bytes()))?;
        if let Some(old) = db.get(b"identity")? {
            ensure!(
                crate::codec::from_slice::<(u64, [u8; 32])>(&old)?
                    == (chain_id, key.verifying_key().to_bytes()),
                "signer identity mismatch"
            );
        } else {
            ensure!(
                db.iterator(rocksdb::IteratorMode::Start).next().is_none(),
                "nonempty signer database has no identity"
            );
        }
        if version < crate::schema::SIGNER_VERSION {
            let mut batch = WriteBatch::default();
            if let Some(bytes) = db.get(b"last_vote")? {
                let vote: Vote = crate::codec::from_slice(&bytes)?;
                ensure!(
                    vote.chain_id == chain_id && vote.validator == key.verifying_key().to_bytes(),
                    "stored vote identity mismatch during migration"
                );
                vote.verify()?;
                batch.put(b"last_vote", crate::codec::to_vec(&vote)?);
            }
            batch.put(b"identity", identity);
            batch.put(
                crate::schema::ROCKSDB_VERSION_KEY,
                crate::codec::to_vec(&crate::schema::SIGNER_VERSION)?,
            );
            db.write_opt(batch, &crate::journal::durable_write_options())?;
            crate::logging::event(
                "info",
                "schema_migrated",
                serde_json::json!({"database":"signer","from":version,"to":crate::schema::SIGNER_VERSION}),
            );
        }
        Ok(Self { key, chain_id, db })
    }
    pub fn sign(
        &mut self,
        height: u64,
        round: u32,
        phase: Phase,
        block: Option<Hash>,
    ) -> Result<Vote> {
        let mut vote = Vote {
            chain_id: self.chain_id,
            height,
            round,
            phase,
            block,
            validator: self.key.verifying_key().to_bytes(),
            signature: vec![],
        };
        if let Some(bytes) = self.db.get(b"last_vote")? {
            let old: Vote = crate::codec::from_slice(&bytes)?;
            let prior = (old.height, old.round, old.phase);
            let next = (height, round, phase);
            ensure!(next >= prior, "refusing to sign an older consensus step");
            if next == prior {
                ensure!(old.block == block, "refusing conflicting vote");
                return Ok(old);
            }
        }
        vote.signature = self.key.sign(&vote.sign_bytes()).to_bytes().to_vec();
        let options = crate::journal::durable_write_options();
        self.db
            .put_opt(b"last_vote", crate::codec::to_vec(&vote)?, &options)?;
        Ok(vote)
    }
}
#[derive(Clone, Debug)]
pub struct ValidatorSet {
    powers: BTreeMap<[u8; 32], u64>,
    total: u128,
}
impl ValidatorSet {
    pub fn new(validators: Vec<([u8; 32], u64)>) -> Result<Self> {
        ensure!(!validators.is_empty(), "empty validator set");
        let mut powers = BTreeMap::new();
        let mut total = 0u128;
        for (key, power) in validators {
            VerifyingKey::from_bytes(&key)?;
            ensure!(power > 0, "zero voting power");
            ensure!(powers.insert(key, power).is_none(), "duplicate validator");
            total = total
                .checked_add(power as u128)
                .context("voting power overflow")?;
        }
        Ok(Self { powers, total })
    }
    pub fn verify_certificate(
        &self,
        votes: &[Vote],
        chain: u64,
        height: u64,
        round: u32,
        phase: Phase,
        block: Option<Hash>,
    ) -> Result<()> {
        let mut seen = BTreeMap::new();
        let mut power = 0u128;
        for vote in votes {
            ensure!(
                (
                    vote.chain_id,
                    vote.height,
                    vote.round,
                    vote.phase,
                    vote.block
                ) == (chain, height, round, phase, block),
                "certificate context mismatch"
            );
            vote.verify()?;
            ensure!(
                seen.insert(vote.validator, ()).is_none(),
                "duplicate certificate signer"
            );
            power += *self
                .powers
                .get(&vote.validator)
                .context("unknown validator")? as u128;
        }
        // Equivalent to power * 3 > total * 2, without multiplication overflow.
        ensure!(
            power > self.total - (self.total - 1) / 3 - 1,
            "certificate lacks strict two-thirds quorum"
        );
        Ok(())
    }
}

pub struct VoteSet {
    chain: u64,
    height: u64,
    round: u32,
    phase: Phase,
    validators: ValidatorSet,
    votes: BTreeMap<[u8; 32], Vote>,
}
impl VoteSet {
    pub fn new(
        chain: u64,
        height: u64,
        round: u32,
        phase: Phase,
        validators: ValidatorSet,
    ) -> Self {
        Self {
            chain,
            height,
            round,
            phase,
            validators,
            votes: BTreeMap::new(),
        }
    }
    pub fn insert(&mut self, vote: Vote) -> Result<()> {
        ensure!(
            (vote.chain_id, vote.height, vote.round, vote.phase)
                == (self.chain, self.height, self.round, self.phase),
            "vote context mismatch"
        );
        ensure!(
            self.validators.powers.contains_key(&vote.validator),
            "unknown validator"
        );
        vote.verify()?;
        if let Some(old) = self.votes.get(&vote.validator) {
            ensure!(old == &vote, "validator equivocation");
            return Ok(());
        }
        self.votes.insert(vote.validator, vote);
        Ok(())
    }
    pub fn certificate(&self, block: Option<Hash>) -> Result<Vec<Vote>> {
        let votes: Vec<_> = self
            .votes
            .values()
            .filter(|v| v.block == block)
            .cloned()
            .collect();
        self.validators.verify_certificate(
            &votes,
            self.chain,
            self.height,
            self.round,
            self.phase,
            block,
        )?;
        Ok(votes)
    }
}

/// Lock transitions require authenticated prevote certificates. Persist this state in
/// a reactor WAL before signing; the development node does not run this reactor.
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RoundLock {
    pub chain: u64,
    pub height: u64,
    pub(crate) locked: Option<(u32, Hash)>,
    // Required in serialized state: legacy snapshots cannot recover a forgotten nil round.
    #[serde(deserialize_with = "Option::deserialize")]
    pub(crate) certificate_round: Option<u32>,
}
impl RoundLock {
    pub fn new(chain: u64, height: u64) -> Self {
        Self {
            chain,
            height,
            locked: None,
            certificate_round: None,
        }
    }
    pub fn prevote(&self, proposal: Hash) -> Hash {
        self.locked.map(|(_, hash)| hash).unwrap_or(proposal)
    }
    pub fn apply_prevote_certificate(
        &mut self,
        validators: &ValidatorSet,
        round: u32,
        block: Option<Hash>,
        votes: &[Vote],
    ) -> Result<()> {
        validators.verify_certificate(
            votes,
            self.chain,
            self.height,
            round,
            Phase::Prevote,
            block,
        )?;
        if let Some(previous_round) = self.certificate_round {
            ensure!(round >= previous_round, "stale lock certificate");
            if round == previous_round && block != self.locked.map(|(_, hash)| hash) {
                bail!("conflicting certificate in the same round");
            }
        }
        self.certificate_round = Some(round);
        self.locked = block.map(|hash| (round, hash));
        Ok(())
    }
    pub fn verify_commit(
        &self,
        validators: &ValidatorSet,
        round: u32,
        block: Hash,
        votes: &[Vote],
    ) -> Result<()> {
        validators.verify_certificate(
            votes,
            self.chain,
            self.height,
            round,
            Phase::Precommit,
            Some(block),
        )
    }
}
