pub const DEFAULT_RETENTION_SECONDS: u64 = 60;
use anyhow::{ensure, Result};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, path::PathBuf};

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Config {
    #[serde(default)]
    pub verification: crate::verification::VerificationConfig,
    pub data_dir: PathBuf,
    pub genesis: PathBuf,
    pub rpc_listen: SocketAddr,
    pub peer_listen: SocketAddr,
    #[serde(default)]
    pub capnp_listen: Option<SocketAddr>,
    pub tls_cert: PathBuf,
    pub tls_key: PathBuf,
    #[serde(default)]
    pub sync_peer: Option<SyncPeer>,
    pub block_interval_ms: u64,
    pub max_pending: usize,
    pub max_block_transactions: usize,
    pub retention: Retention,
    // Refuse accidental use as a distributed consensus validator.
    pub development: bool,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "mode", rename_all = "snake_case", deny_unknown_fields)]
pub enum Retention {
    Pruned { seconds: u64 },
    Archive,
}
impl Default for Retention {
    fn default() -> Self {
        Self::Pruned {
            seconds: DEFAULT_RETENTION_SECONDS,
        }
    }
}
impl Config {
    pub fn validate(&self) -> Result<()> {
        self.verification.validate()?;
        ensure!(
            self.development,
            "only explicit development mode is implemented"
        );
        ensure!(self.block_interval_ms >= 1, "block interval must be >=1ms");
        ensure!(
            self.max_pending > 0
                && self.max_block_transactions > 0
                && self.max_block_transactions <= crate::types::MAX_BLOCK_TRANSACTIONS,
            "queue limits must be nonzero and block transaction limit must be <=4096"
        );
        ensure!(
            self.peer_listen.ip().is_loopback(),
            "development sync listener must use loopback"
        );
        if let Some(address) = self.capnp_listen {
            ensure!(
                address.ip().is_loopback(),
                "direct Capnp listener must use loopback"
            );
        }
        if let Some(peer) = &self.sync_peer {
            peer.validate()?;
        }
        if let Retention::Pruned { seconds } = self.retention {
            ensure!(seconds > 0, "retention must be nonzero");
        }
        Ok(())
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SyncPeer {
    #[serde(default)]
    pub transport: Transport,
    pub address: SocketAddr,
    pub server_name: String,
    pub certificate: PathBuf,
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize, clap::ValueEnum)]
#[serde(rename_all = "snake_case")]
pub enum Transport {
    Http3,
    #[default]
    Tcp,
}
impl SyncPeer {
    pub fn validate(&self) -> Result<()> {
        ensure!(
            self.transport != Transport::Tcp || self.address.ip().is_loopback(),
            "unencrypted direct Capnp connections must use loopback"
        );
        Ok(())
    }
}
/// Human-editable settings: one top-level field per JSON line. Duplicates are errors.
pub fn decode_jsonl(bytes: &[u8]) -> Result<Config> {
    let mut fields = serde_json::Map::new();
    for (index, line) in std::str::from_utf8(bytes)?.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        let object: serde_json::Map<String, serde_json::Value> = serde_json::from_str(line)
            .map_err(|e| anyhow::anyhow!("config line {}: {e}", index + 1))?;
        for (key, value) in object {
            ensure!(!fields.contains_key(&key), "duplicate config field {key}");
            fields.insert(key, value);
        }
    }
    let config: Config = serde_json::from_value(fields.into())?;
    config.validate()?;
    Ok(config)
}
pub fn encode_jsonl(config: &Config) -> Result<Vec<u8>> {
    let value = serde_json::to_value(config)?;
    let mut out = Vec::new();
    for (key, value) in value.as_object().expect("config object") {
        serde_json::to_writer(&mut out, &serde_json::json!({key: value}))?;
        out.push(b'\n');
    }
    Ok(out)
}
pub fn load(path: &std::path::Path) -> Result<Config> {
    if path.extension().is_some_and(|v| v == "jsonl") {
        if !path.exists() && path.with_extension("capnp").exists() {
            return crate::codec::from_slice(&std::fs::read(path.with_extension("capnp"))?);
        }
        decode_jsonl(&std::fs::read(path)?)
    } else {
        crate::codec::from_slice(&std::fs::read(path)?)
    }
}
pub fn save(path: &std::path::Path, config: &Config) -> Result<()> {
    use std::io::Write;
    config.validate()?;
    let target = path.with_extension("jsonl");
    let temp = target.with_extension("jsonl.tmp");
    let mut file = std::fs::File::create(&temp)?;
    file.write_all(&encode_jsonl(config)?)?;
    file.sync_all()?;
    std::fs::rename(temp, &target)?;
    std::fs::File::open(target.parent().unwrap())?.sync_all()?;
    Ok(())
}
pub fn persistence_root() -> PathBuf {
    PathBuf::from(std::env::var_os("HOME").expect("HOME must be set")).join(".superfrontierchain")
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn transport_defaults_and_validation() {
        let value = serde_json::json!({"address":"127.0.0.1:26656","server_name":"localhost","certificate":"cert.der"});
        let mut peer: SyncPeer = serde_json::from_value(value.clone()).unwrap();
        assert_eq!(peer.transport, Transport::Tcp);
        peer.transport = Transport::Tcp;
        assert!(peer.validate().is_ok());
        peer.address = "192.0.2.1:26656".parse().unwrap();
        assert!(peer.validate().is_err());
        let mut invalid = value;
        invalid["transport"] = serde_json::json!("unknown");
        assert!(serde_json::from_value::<SyncPeer>(invalid).is_err());
    }
}
