use crate::types::WEEK;
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
        Self::Pruned { seconds: WEEK }
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
            self.rpc_listen.ip().is_loopback() && self.peer_listen.ip().is_loopback(),
            "development listeners must use loopback addresses"
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
