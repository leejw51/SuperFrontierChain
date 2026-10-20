//! Transaction authentication backends. Execution and admission remain ordered on the CPU.
use crate::ethereum::{self, Transaction};
use anyhow::{ensure, Context, Result};
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

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default, deny_unknown_fields)]
pub struct VerificationConfig {
    pub backend: Backend,
    pub python: PathBuf,
    pub worker: PathBuf,
    pub timeout_seconds: u64,
}
impl Default for VerificationConfig {
    fn default() -> Self {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..");
        Self {
            backend: Backend::Gpu,
            python: root.join("target/mlx-venv/bin/python"),
            worker: root.join("experiments/mlx_ecdsa/worker.py"),
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

#[derive(Clone, Serialize)]
pub(crate) struct RecoveryInput {
    pub digest: String,
    pub signature: String,
    pub parity: u8,
}
impl RecoveryInput {
    pub fn cpu_recover(&self) -> Result<secp256k1::PublicKey> {
        let digest: [u8; 32] = hex::decode(&self.digest)?
            .try_into()
            .map_err(|_| anyhow::anyhow!("digest width"))?;
        let recovery = secp256k1::ecdsa::RecoveryId::from_i32(self.parity.into())?;
        let signature = secp256k1::ecdsa::RecoverableSignature::from_compact(
            &hex::decode(&self.signature)?,
            recovery,
        )?;
        Ok(secp256k1::SECP256K1
            .recover_ecdsa(&secp256k1::Message::from_digest(digest), &signature)?)
    }
}
type Keys = Vec<Option<secp256k1::PublicKey>>;

pub struct Verifier {
    config: VerificationConfig,
    gpu: Mutex<Option<GpuWorker>>,
    cpu_records: AtomicU64,
    gpu_records: AtomicU64,
}
impl Verifier {
    pub fn new(config: VerificationConfig) -> Result<Self> {
        config.validate()?;
        let gpu = if config.backend != Backend::Cpu {
            Some(GpuWorker::start(&config)?)
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
            "gpu_worker_pid":gpu.as_ref().map(GpuWorker::pid),
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
            *worker = Some(GpuWorker::start(&self.config)?);
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
        Ok(prepared
            .into_iter()
            .map(|tx| {
                tx.and_then(|tx| {
                    let key = keys
                        .next()
                        .flatten()
                        .context("invalid recoverable signature")?;
                    Ok(tx.finish(key))
                })
            })
            .collect())
    }
}

#[cfg(unix)]
use process::GpuWorker;
#[cfg(unix)]
mod process {
    use super::*;
    use std::{
        io::{BufRead, BufReader, Read, Write},
        os::{fd::OwnedFd, unix::net::UnixStream},
        process::{Child, Command, Stdio},
        time::Duration,
    };
    pub(super) struct GpuWorker {
        child: Child,
        reader: BufReader<UnixStream>,
        writer: UnixStream,
        sequence: u64,
    }
    impl GpuWorker {
        pub fn start(config: &VerificationConfig) -> Result<Self> {
            let (parent, child) = UnixStream::pair()?;
            let timeout = Some(Duration::from_secs(config.timeout_seconds));
            parent.set_read_timeout(timeout)?;
            parent.set_write_timeout(timeout)?;
            let input: OwnedFd = child.try_clone()?.into();
            let output: OwnedFd = child.into();
            let child = Command::new(&config.python).arg("-u").arg(&config.worker)
                .stdin(Stdio::from(input)).stdout(Stdio::from(output)).stderr(Stdio::inherit())
                .spawn().with_context(|| format!("start MLX worker using {}; run make mlx-setup or select --verification-backend cpu", config.python.display()))?;
            let mut worker = Self {
                child,
                reader: BufReader::new(parent.try_clone()?),
                writer: parent,
                sequence: 0,
            };
            let ready = worker
                .read()
                .context("MLX worker startup (Metal required; no CPU fallback)")?;
            ensure!(
                ready["ready"] == true && ready["protocol"] == 1,
                "invalid MLX handshake"
            );
            // Test actual GPU execution against libsecp256k1 on every worker startup.
            let message = secp256k1::Message::from_digest([42; 32]);
            let secret = secp256k1::SecretKey::from_slice(&[1; 32])?;
            let (parity, signature) = secp256k1::SECP256K1
                .sign_ecdsa_recoverable(&message, &secret)
                .serialize_compact();
            let valid = RecoveryInput {
                digest: hex::encode([42; 32]),
                signature: hex::encode(signature),
                parity: parity.to_i32() as u8,
            };
            let invalid = RecoveryInput {
                signature: "00".repeat(64),
                ..valid.clone()
            };
            let expected = valid.cpu_recover()?;
            let keys = worker.recover(&[valid, invalid])?;
            ensure!(
                keys == vec![Some(expected), None],
                "GPU startup self-test disagrees with CPU"
            );
            Ok(worker)
        }
        pub fn pid(&self) -> u32 {
            self.child.id()
        }
        fn read(&mut self) -> Result<serde_json::Value> {
            // 4096 uncompressed keys fit comfortably under this bound.
            let mut line = Vec::new();
            self.reader
                .by_ref()
                .take(1024 * 1024)
                .read_until(b'\n', &mut line)?;
            ensure!(
                line.last() == Some(&b'\n'),
                "MLX worker disconnected or response exceeded limit"
            );
            Ok(serde_json::from_slice(&line)?)
        }
        pub fn recover(&mut self, inputs: &[RecoveryInput]) -> Result<Keys> {
            self.sequence = self
                .sequence
                .checked_add(1)
                .context("worker sequence exhausted")?;
            let request = serde_json::json!({"id":self.sequence,"cases":inputs});
            let mut encoded = serde_json::to_vec(&request)?;
            encoded.push(b'\n');
            self.writer.write_all(&encoded)?;
            let response = self.read()?;
            ensure!(
                response["id"].as_u64() == Some(self.sequence),
                "GPU response id mismatch"
            );
            let keys = response["keys"]
                .as_array()
                .context("GPU response missing keys")?;
            ensure!(keys.len() == inputs.len(), "GPU response count mismatch");
            keys.iter()
                .map(|key| {
                    if key.is_null() {
                        return Ok(None);
                    }
                    let bytes = hex::decode(key.as_str().context("invalid GPU key type")?)?;
                    ensure!(
                        bytes.len() == 65 && bytes[0] == 4,
                        "invalid GPU public key encoding"
                    );
                    Ok(Some(secp256k1::PublicKey::from_slice(&bytes)?))
                })
                .collect()
        }
    }
    impl Drop for GpuWorker {
        fn drop(&mut self) {
            let _ = self.child.kill();
            let _ = self.child.wait();
        }
    }
}
#[cfg(not(unix))]
struct GpuWorker;
#[cfg(not(unix))]
impl GpuWorker {
    fn start(_: &VerificationConfig) -> Result<Self> {
        anyhow::bail!("MLX worker requires Apple Silicon/macOS; select CPU")
    }
    fn recover(&mut self, _: &[RecoveryInput]) -> Result<Keys> {
        anyhow::bail!("GPU unavailable")
    }
    fn pid(&self) -> u32 {
        0
    }
}
