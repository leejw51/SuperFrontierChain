//! Transaction authentication backends. Execution and admission remain ordered on the CPU.
use crate::ethereum::{self, Transaction};
use anyhow::{ensure, Context, Result};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::{
    path::PathBuf,
    sync::{
        atomic::{AtomicU64, Ordering},
        Mutex,
    },
};

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize, clap::ValueEnum)]
#[serde(rename_all = "lowercase")]
pub enum Backend {
    Cpu,
    #[default]
    Gpu,
    Hybrid,
}
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize, clap::ValueEnum)]
#[serde(rename_all = "lowercase")]
pub enum GpuRuntime {
    Metal,
    /// Apple MLX C API called in-process from Rust; no Python worker.
    #[default]
    #[serde(rename = "mlx-native", alias = "mlx")]
    #[value(alias = "mlx")]
    MlxNative,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct VerificationConfig {
    pub backend: Backend,
    pub gpu_runtime: GpuRuntime,
    /// Deprecated metadata retained only to read older configuration files. Never executed.
    pub python: PathBuf,
    /// Deprecated metadata retained only to read older configuration files. Never executed.
    pub worker: PathBuf,
    pub timeout_seconds: u64,
}
impl Default for VerificationConfig {
    fn default() -> Self {
        Self {
            backend: Backend::Gpu,
            gpu_runtime: GpuRuntime::MlxNative,
            python: PathBuf::new(),
            worker: PathBuf::new(),
            timeout_seconds: 30,
        }
    }
}
impl VerificationConfig {
    pub fn validate(&self) -> Result<()> {
        ensure!(
            (1..=120).contains(&self.timeout_seconds),
            "verification timeout must be 1..120 seconds"
        );
        Ok(())
    }
}

#[derive(Clone)]
pub(crate) struct RecoveryInput {
    pub digest: [u8; 32],
    pub signature: [u8; 64],
    pub parity: u8,
}
impl RecoveryInput {
    pub fn cpu_recover(&self) -> Result<secp256k1::PublicKey> {
        let recovery = secp256k1::ecdsa::RecoveryId::from_i32(self.parity.into())?;
        let signature =
            secp256k1::ecdsa::RecoverableSignature::from_compact(&self.signature, recovery)?;
        Ok(secp256k1::SECP256K1
            .recover_ecdsa(&secp256k1::Message::from_digest(self.digest), &signature)?)
    }
}
type Keys = Vec<Option<secp256k1::PublicKey>>;

#[cfg(all(test, target_os = "macos"))]
#[path = "gpu/differential.rs"]
mod differential;
#[cfg(target_os = "macos")]
#[path = "gpu/mlx.rs"]
mod mlx;
#[cfg(target_os = "macos")]
#[path = "gpu/metal.rs"]
mod native;

enum GpuEngine {
    #[cfg(target_os = "macos")]
    Metal(native::Engine),
    #[cfg(target_os = "macos")]
    MlxNative(mlx::Engine),
}
impl GpuEngine {
    fn start(config: &VerificationConfig) -> Result<Self> {
        match config.gpu_runtime {
            GpuRuntime::MlxNative => {
                #[cfg(target_os = "macos")]
                {
                    Ok(Self::MlxNative(mlx::Engine::new(config.timeout_seconds)?))
                }
                #[cfg(not(target_os = "macos"))]
                {
                    anyhow::bail!("native MLX requires macOS; select CPU explicitly")
                }
            }
            GpuRuntime::Metal => {
                #[cfg(target_os = "macos")]
                {
                    Ok(Self::Metal(native::Engine::new(config.timeout_seconds)?))
                }
                #[cfg(not(target_os = "macos"))]
                {
                    anyhow::bail!("native Metal requires macOS; select CPU explicitly")
                }
            }
        }
    }
    #[cfg(target_os = "macos")]
    fn recover(&mut self, inputs: &[RecoveryInput]) -> Result<Keys> {
        match self {
            #[cfg(target_os = "macos")]
            Self::Metal(engine) => engine.recover(inputs),
            #[cfg(target_os = "macos")]
            Self::MlxNative(engine) => engine.recover(inputs),
        }
    }
    #[cfg(not(target_os = "macos"))]
    fn recover(&mut self, _: &[RecoveryInput]) -> Result<Keys> {
        anyhow::bail!("GPU requires macOS; select CPU explicitly")
    }
    fn pid(&self) -> Option<u32> {
        None
    }
}

pub struct Verifier {
    config: VerificationConfig,
    gpu: Mutex<Option<GpuEngine>>,
    cpu_records: AtomicU64,
    gpu_records: AtomicU64,
}
impl Verifier {
    pub fn new(config: VerificationConfig) -> Result<Self> {
        config.validate()?;
        let gpu = if config.backend != Backend::Cpu {
            Some(GpuEngine::start(&config)?)
        } else {
            None
        };
        Ok(Self {
            config,
            gpu: Mutex::new(gpu),
            cpu_records: AtomicU64::new(0),
            gpu_records: AtomicU64::new(0),
        })
    }
    pub fn status(&self) -> Result<serde_json::Value> {
        let gpu = self
            .gpu
            .lock()
            .map_err(|_| anyhow::anyhow!("GPU lock poisoned"))?;
        Ok(
            serde_json::json!({"backend":self.config.backend,"node_pid":std::process::id(),
            "gpu_worker_pid":gpu.as_ref().and_then(GpuEngine::pid),
            "gpu_runtime":self.config.gpu_runtime,
            "cpu_records":self.cpu_records.load(Ordering::Relaxed),
            "gpu_records":self.gpu_records.load(Ordering::Relaxed)}),
        )
    }
    fn gpu_recover(&self, inputs: &[RecoveryInput]) -> Result<Keys> {
        if inputs.is_empty() {
            return Ok(Vec::new());
        }
        let mut worker = self
            .gpu
            .lock()
            .map_err(|_| anyhow::anyhow!("GPU lock poisoned"))?;
        if worker.is_none() {
            *worker = Some(GpuEngine::start(&self.config)?);
        }
        let result = worker.as_mut().unwrap().recover(inputs);
        if result.is_err() {
            // Discard the stream after any error: a late reply must never authenticate another batch.
            *worker = None;
        } else {
            self.gpu_records
                .fetch_add(inputs.len() as u64, Ordering::Relaxed);
        }
        result.context("GPU verification failed (no CPU fallback)")
    }
    fn cpu_recover(&self, inputs: &[RecoveryInput]) -> Keys {
        let keys = ethereum::ordered_map(inputs, |input| input.cpu_recover().ok());
        self.cpu_records
            .fetch_add(inputs.len() as u64, Ordering::Relaxed);
        keys
    }
    pub fn decode_batch<T: AsRef<[u8]> + Sync>(
        &self,
        raw: &[T],
        chain_id: u64,
    ) -> Result<Vec<Result<Transaction>>> {
        ethereum::validate_batch_size(raw)?;
        let prepared =
            ethereum::ordered_map(raw, |raw| Transaction::prepare(raw.as_ref(), chain_id));
        self.finish_batch(prepared)
    }
    pub fn decode_shared(
        &self,
        raw: &[bytes::Bytes],
        chain_id: u64,
    ) -> Result<Vec<Result<Transaction>>> {
        ethereum::validate_batch_size(raw)?;
        self.finish_batch(ethereum::ordered_map(raw, |raw| {
            Transaction::prepare_shared(raw.clone(), chain_id)
        }))
    }
    fn finish_batch(
        &self,
        prepared: Vec<Result<ethereum::PreparedTransaction>>,
    ) -> Result<Vec<Result<Transaction>>> {
        let inputs: Vec<_> = prepared
            .iter()
            .filter_map(|tx| tx.as_ref().ok().map(|tx| tx.recovery.clone()))
            .collect();
        let keys = match self.config.backend {
            Backend::Cpu => self.cpu_recover(&inputs),
            Backend::Gpu => self.gpu_recover(&inputs)?,
            Backend::Hybrid => {
                // GPU prefix and CPU suffix run concurrently; merge in original order.
                let split = if inputs.len() < 2 {
                    inputs.len()
                } else {
                    (inputs.len() * 2 / 5).max(1)
                };
                let (gpu, cpu) = rayon::join(
                    || self.gpu_recover(&inputs[..split]),
                    || self.cpu_recover(&inputs[split..]),
                );
                let mut keys = gpu?;
                keys.extend(cpu);
                keys
            }
        };
        ensure!(
            keys.len() == inputs.len(),
            "verification result count mismatch"
        );
        let mut keys = keys.into_iter();
        // Pair only successfully parsed inputs with recovery results before
        // parallel work, so malformed entries cannot shift key assignment.
        let authenticated: Vec<_> = prepared
            .into_iter()
            .map(|tx| {
                tx.and_then(|tx| {
                    let key = keys
                        .next()
                        .flatten()
                        .context("invalid recoverable signature")?;
                    Ok((tx, key))
                })
            })
            .collect();
        let finish = |entry: Result<(ethereum::PreparedTransaction, secp256k1::PublicKey)>| {
            entry.map(|(tx, key)| tx.finish(key))
        };
        Ok(if authenticated.len() < 32 {
            authenticated.into_iter().map(finish).collect()
        } else {
            authenticated
                .into_par_iter()
                .with_min_len(16)
                .map(finish)
                .collect()
        })
    }
}
