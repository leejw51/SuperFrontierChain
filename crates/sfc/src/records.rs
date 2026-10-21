//! Typed configuration and metadata codecs. Legacy Value reads are restricted to
//! migration; new writes never pass domain structures through serde/Value.
use crate::{
    codec::{self, Record},
    config::{Config, Retention, SyncPeer, Transport},
    consensus::{Phase, RoundLock, Vote},
    runtime_capnp as wire,
    types::{Account, Block, Genesis, World},
    verification::{Backend, GpuRuntime, VerificationConfig},
};
use anyhow::{ensure, Result};
use capnp::message::Builder;
const MAGIC: u64 = 0x5346435245433031;
fn encode(fill: impl FnOnce(wire::record::Builder<'_>) -> Result<()>) -> Result<Vec<u8>> {
    let mut message = Builder::new_default();
    let mut root = message.init_root::<wire::record::Builder>();
    root.set_magic(MAGIC);
    root.set_version(1);
    fill(root)?;
    let bytes = capnp::serialize::write_message_to_words(&message);
    ensure!(bytes.len() <= codec::MAX_RECORD_BYTES, "record too large");
    Ok(bytes)
}
fn typed<'a>(
    reader: &'a capnp::message::Reader<capnp::serialize::BufferSegments<&'a [u8]>>,
) -> Result<Option<wire::record::Reader<'a>>> {
    let root = reader.get_root::<wire::record::Reader>()?;
    if root.get_magic() != MAGIC {
        return Ok(None);
    }
    ensure!(root.get_version() == 1, "unsupported typed record version");
    Ok(Some(root))
}
// Only the pre-typed format migration uses serde deserialization. No JSON text
// or serde serialization is involved. Unknown fields retain their strict checks.
fn legacy<T: serde::de::DeserializeOwned>(bytes: &[u8]) -> Result<T> {
    Ok(serde_json::from_value(codec::from_slice::<
        serde_json::Value,
    >(bytes)?)?)
}
impl Record for u64 {
    fn encode(&self) -> Result<Vec<u8>> {
        encode(|mut r| {
            r.set_unsigned(*self);
            Ok(())
        })
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        let m = codec::message_reader(bytes)?;
        if let Some(r) = typed(&m)? {
            match r.which()? {
                wire::record::Unsigned(v) => Ok(v),
                _ => anyhow::bail!("expected unsigned record"),
            }
        } else {
            legacy(bytes)
        }
    }
}
impl Record for u32 {
    fn encode(&self) -> Result<Vec<u8>> {
        u64::from(*self).encode()
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        Ok(u64::decode(bytes)?.try_into()?)
    }
}
impl Record for Config {
    fn encode(&self) -> Result<Vec<u8>> {
        encode(|r| {
            let mut c = r.init_config();
            c.set_data_dir(
                self.data_dir
                    .to_str()
                    .ok_or_else(|| anyhow::anyhow!("non-UTF8 data path"))?,
            );
            c.set_genesis(
                self.genesis
                    .to_str()
                    .ok_or_else(|| anyhow::anyhow!("non-UTF8 genesis path"))?,
            );
            c.set_rpc_listen(self.rpc_listen.to_string().as_str());
            c.set_peer_listen(self.peer_listen.to_string().as_str());
            if let Some(v) = self.capnp_listen {
                c.set_capnp_listen(v.to_string().as_str());
            }
            c.set_tls_cert(
                self.tls_cert
                    .to_str()
                    .ok_or_else(|| anyhow::anyhow!("non-UTF8 certificate path"))?,
            );
            c.set_tls_key(
                self.tls_key
                    .to_str()
                    .ok_or_else(|| anyhow::anyhow!("non-UTF8 key path"))?,
            );
            c.set_has_sync_peer(self.sync_peer.is_some());
            if let Some(v) = &self.sync_peer {
                let mut p = c.reborrow().init_sync_peer();
                p.set_transport(match v.transport {
                    Transport::Http3 => wire::Transport::Http3,
                    Transport::Tcp => wire::Transport::Tcp,
                });
                p.set_address(v.address.to_string().as_str());
                p.set_server_name(v.server_name.as_str());
                p.set_certificate(
                    v.certificate
                        .to_str()
                        .ok_or_else(|| anyhow::anyhow!("non-UTF8 certificate path"))?,
                );
            }
            c.set_block_interval_ms(self.block_interval_ms);
            c.set_max_pending(self.max_pending.try_into()?);
            c.set_max_block_transactions(self.max_block_transactions.try_into()?);
            c.set_development(self.development);
            let mut retention = c.reborrow().init_retention();
            match self.retention {
                Retention::Archive => retention.set_archive(()),
                Retention::Pruned { seconds } => retention.set_pruned_seconds(seconds),
            }
            let mut v = c.init_verification();
            v.set_backend(match self.verification.backend {
                Backend::Cpu => wire::Backend::Cpu,
                Backend::Gpu => wire::Backend::Gpu,
                Backend::Hybrid => wire::Backend::Hybrid,
            });
            v.set_python(
                self.verification
                    .python
                    .to_str()
                    .ok_or_else(|| anyhow::anyhow!("non-UTF8 Python path"))?,
            );
            v.set_worker(
                self.verification
                    .worker
                    .to_str()
                    .ok_or_else(|| anyhow::anyhow!("non-UTF8 worker path"))?,
            );
            v.set_timeout_seconds(self.verification.timeout_seconds);
            v.set_gpu_runtime(match self.verification.gpu_runtime {
                GpuRuntime::Metal => wire::GpuRuntime::Metal,
                GpuRuntime::MlxNative => wire::GpuRuntime::MlxNative,
            });
            Ok(())
        })
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        let m = codec::message_reader(bytes)?;
        let Some(r) = typed(&m)? else {
            return legacy(bytes);
        };
        let wire::record::Config(c) = r.which()? else {
            anyhow::bail!("expected config record")
        };
        let c = c?;
        let capnp = c.get_capnp_listen()?.to_str()?;
        let sync_peer = if c.get_has_sync_peer() {
            let p = c.get_sync_peer()?;
            Some(SyncPeer {
                transport: match p.get_transport()? {
                    wire::Transport::Http3 => Transport::Http3,
                    wire::Transport::Tcp => Transport::Tcp,
                },
                address: p.get_address()?.to_str()?.parse()?,
                server_name: p.get_server_name()?.to_str()?.into(),
                certificate: p.get_certificate()?.to_str()?.into(),
            })
        } else {
            None
        };
        let v = c.get_verification()?;
        let result = Self {
            data_dir: c.get_data_dir()?.to_str()?.into(),
            genesis: c.get_genesis()?.to_str()?.into(),
            rpc_listen: c.get_rpc_listen()?.to_str()?.parse()?,
            peer_listen: c.get_peer_listen()?.to_str()?.parse()?,
            capnp_listen: if capnp.is_empty() {
                None
            } else {
                Some(capnp.parse()?)
            },
            tls_cert: c.get_tls_cert()?.to_str()?.into(),
            tls_key: c.get_tls_key()?.to_str()?.into(),
            sync_peer,
            block_interval_ms: c.get_block_interval_ms(),
            max_pending: c.get_max_pending().try_into()?,
            max_block_transactions: c.get_max_block_transactions().try_into()?,
            development: c.get_development(),
            retention: match c.get_retention()?.which()? {
                wire::retention::Archive(()) => Retention::Archive,
                wire::retention::PrunedSeconds(seconds) => Retention::Pruned { seconds },
            },
            verification: VerificationConfig {
                backend: match v.get_backend()? {
                    wire::Backend::Cpu => Backend::Cpu,
                    wire::Backend::Gpu => Backend::Gpu,
                    wire::Backend::Hybrid => Backend::Hybrid,
                },
                python: v.get_python()?.to_str()?.into(),
                worker: v.get_worker()?.to_str()?.into(),
                timeout_seconds: v.get_timeout_seconds(),
                gpu_runtime: match v.get_gpu_runtime()? {
                    wire::GpuRuntime::Metal => GpuRuntime::Metal,
                    wire::GpuRuntime::Mlx => GpuRuntime::MlxNative,
                    wire::GpuRuntime::MlxNative => GpuRuntime::MlxNative,
                },
            },
        };
        result.validate()?;
        Ok(result)
    }
}
impl Record for Genesis {
    fn encode(&self) -> Result<Vec<u8>> {
        encode(|r| {
            let mut g = r.init_genesis();
            g.set_chain_id(self.chain_id);
            g.set_timestamp(self.timestamp);
            g.set_gas_limit(self.gas_limit);
            let mut alloc = g.init_alloc(self.alloc.len().try_into()?);
            for (i, (key, value)) in self.alloc.iter().enumerate() {
                let mut entry = alloc.reborrow().get(i as u32);
                entry.set_key(key.as_str());
                entry.set_value(value.as_str());
            }
            Ok(())
        })
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        let m = codec::message_reader(bytes)?;
        let Some(r) = typed(&m)? else {
            return legacy(bytes);
        };
        let wire::record::Genesis(g) = r.which()? else {
            anyhow::bail!("expected genesis record")
        };
        let g = g?;
        let mut alloc = std::collections::BTreeMap::new();
        for entry in g.get_alloc()? {
            ensure!(
                alloc
                    .insert(
                        entry.get_key()?.to_str()?.into(),
                        entry.get_value()?.to_str()?.into()
                    )
                    .is_none(),
                "duplicate genesis address"
            );
        }
        let value = Self {
            chain_id: g.get_chain_id(),
            timestamp: g.get_timestamp(),
            gas_limit: g.get_gas_limit(),
            alloc,
        };
        value.validate()?;
        Ok(value)
    }
}
impl Record for (u64, [u8; 32]) {
    fn encode(&self) -> Result<Vec<u8>> {
        encode(|r| {
            let mut v = r.init_identity();
            v.set_chain_id(self.0);
            v.set_validator(&self.1);
            Ok(())
        })
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        let m = codec::message_reader(bytes)?;
        let Some(r) = typed(&m)? else {
            return legacy(bytes);
        };
        let wire::record::Identity(v) = r.which()? else {
            anyhow::bail!("expected signer identity")
        };
        let v = v?;
        Ok((v.get_chain_id(), v.get_validator()?.try_into()?))
    }
}
impl Record for Vote {
    fn encode(&self) -> Result<Vec<u8>> {
        encode(|r| {
            let mut v = r.init_vote();
            v.set_chain_id(self.chain_id);
            v.set_height(self.height);
            v.set_round(self.round);
            v.set_phase(match self.phase {
                Phase::Prevote => wire::vote_record::Phase::Prevote,
                Phase::Precommit => wire::vote_record::Phase::Precommit,
            });
            if let Some(hash) = self.block {
                v.set_block_hash(&hash);
            }
            v.set_validator(&self.validator);
            v.set_signature(&self.signature);
            Ok(())
        })
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        let m = codec::message_reader(bytes)?;
        let Some(r) = typed(&m)? else {
            return legacy(bytes);
        };
        let wire::record::Vote(v) = r.which()? else {
            anyhow::bail!("expected vote")
        };
        let v = v?;
        let hash = v.get_block_hash()?;
        Ok(Self {
            chain_id: v.get_chain_id(),
            height: v.get_height(),
            round: v.get_round(),
            phase: match v.get_phase()? {
                wire::vote_record::Phase::Prevote => Phase::Prevote,
                wire::vote_record::Phase::Precommit => Phase::Precommit,
            },
            block: if hash.is_empty() {
                None
            } else {
                Some(hash.try_into()?)
            },
            validator: v.get_validator()?.try_into()?,
            signature: v.get_signature()?.to_vec(),
        })
    }
}
impl Record for RoundLock {
    fn encode(&self) -> Result<Vec<u8>> {
        encode(|r| {
            let mut v = r.init_round_lock();
            v.set_chain(self.chain);
            v.set_height(self.height);
            v.set_has_lock(self.locked.is_some());
            if let Some((round, hash)) = self.locked {
                v.set_locked_round(round);
                v.set_locked_hash(&hash);
            }
            v.set_has_certificate_round(self.certificate_round.is_some());
            if let Some(round) = self.certificate_round {
                v.set_certificate_round(round);
            }
            Ok(())
        })
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        let m = codec::message_reader(bytes)?;
        let Some(r) = typed(&m)? else {
            return legacy(bytes);
        };
        let wire::record::RoundLock(v) = r.which()? else {
            anyhow::bail!("expected round lock")
        };
        let v = v?;
        Ok(Self {
            chain: v.get_chain(),
            height: v.get_height(),
            locked: if v.get_has_lock() {
                Some((v.get_locked_round(), v.get_locked_hash()?.try_into()?))
            } else {
                None
            },
            certificate_round: if v.get_has_certificate_round() {
                Some(v.get_certificate_round())
            } else {
                None
            },
        })
    }
}
impl Record for World {
    fn encode(&self) -> Result<Vec<u8>> {
        Ok(crate::binary::world_bytes(self)?.to_vec())
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        crate::binary::world_from_bytes(bytes)
    }
}
impl Record for Account {
    fn encode(&self) -> Result<Vec<u8>> {
        Ok(crate::binary::account_bytes(self)?.to_vec())
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        crate::binary::account_from_bytes(bytes)
    }
}
impl Record for Block {
    fn encode(&self) -> Result<Vec<u8>> {
        Ok(self.as_bytes().to_vec())
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        Block::from_bytes(bytes.to_vec())
    }
}
