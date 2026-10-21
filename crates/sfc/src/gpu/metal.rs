//! In-process, exact-integer Metal recovery. Shared buffers are owned by the
//! verifier mutex; CPU access never overlaps an in-flight GPU dispatch.
use super::{Keys, RecoveryInput};
use anyhow::{bail, ensure, Context, Result};
use metal::{
    Buffer, CommandBufferRef, CommandQueue, CompileOptions, ComputePipelineState, Device,
    MTLCommandBufferStatus, MTLResourceOptions, MTLSize,
};
use std::time::{Duration, Instant};

const MAX_BATCH: usize = 4096;
pub(super) struct Engine {
    queue: CommandQueue,
    input: Buffer,
    tables: Buffer,
    points: Buffer,
    output: Buffer,
    direct_prepare: ComputePipelineState,
    direct_recover: ComputePipelineState,
    cooperative_prepare: ComputePipelineState,
    cooperative_terms: ComputePipelineState,
    cooperative_join: ComputePipelineState,
    timeout: Duration,
    failed: bool,
}

impl Engine {
    pub(super) fn new(timeout_seconds: u64) -> Result<Self> {
        metal::objc::rc::autoreleasepool(|| {
            let device =
                Device::system_default().context("Metal GPU unavailable; no CPU fallback")?;
            ensure!(
                device.has_unified_memory(),
                "native GPU verifier requires Apple unified memory"
            );
            let options = CompileOptions::new();
            options.set_fast_math_enabled(false);
            let library = device
                .new_library_with_source(
                    include_str!(concat!(env!("OUT_DIR"), "/recovery.metal")),
                    &options,
                )
                .map_err(anyhow::Error::msg)?;
            let pipeline = |name| -> Result<ComputePipelineState> {
                let function = library
                    .get_function(name, None)
                    .map_err(anyhow::Error::msg)?;
                device
                    .new_compute_pipeline_state_with_function(&function)
                    .map_err(anyhow::Error::msg)
            };
            let buffer = |words| {
                device.new_buffer((words * 4) as u64, MTLResourceOptions::StorageModeShared)
            };
            let mut engine = Self {
                queue: device.new_command_queue(),
                input: buffer(MAX_BATCH * 25),
                tables: buffer(MAX_BATCH * 273),
                points: buffer(MAX_BATCH * 72),
                output: buffer(MAX_BATCH * 17),
                direct_prepare: pipeline("sfc_direct_prepare")?,
                direct_recover: pipeline("sfc_direct_recover")?,
                cooperative_prepare: pipeline("sfc_cooperative_prepare")?,
                cooperative_terms: pipeline("sfc_cooperative_terms")?,
                cooperative_join: pipeline("sfc_cooperative_join")?,
                timeout: Duration::from_secs(timeout_seconds),
                failed: false,
            };
            let secret = secp256k1::SecretKey::from_slice(&[1; 32])?;
            let (parity, signature) = secp256k1::SECP256K1
                .sign_ecdsa_recoverable(&secp256k1::Message::from_digest([42; 32]), &secret)
                .serialize_compact();
            let valid = RecoveryInput {
                digest: [42; 32],
                signature,
                parity: parity.to_i32() as u8,
            };
            let expected = valid.cpu_recover()?;
            let invalid = RecoveryInput {
                signature: [0; 64],
                ..valid.clone()
            };
            ensure!(
                engine.recover(&[valid, invalid])? == vec![Some(expected), None],
                "native Metal startup self-test disagrees with CPU"
            );
            Ok(engine)
        })
    }
    fn dispatch(
        command: &CommandBufferRef,
        pipeline: &ComputePipelineState,
        input: &Buffer,
        output: &Buffer,
        count: u32,
        threads: usize,
    ) {
        let encoder = command.new_compute_command_encoder();
        encoder.set_compute_pipeline_state(pipeline);
        encoder.set_buffer(0, Some(input), 0);
        encoder.set_buffer(1, Some(output), 0);
        encoder.set_bytes(2, 4, (&count as *const u32).cast());
        encoder.dispatch_threads(MTLSize::new(threads as u64, 1, 1), MTLSize::new(32, 1, 1));
        encoder.end_encoding();
    }
    pub(super) fn recover(&mut self, inputs: &[RecoveryInput]) -> Result<Keys> {
        ensure!(
            !self.failed,
            "Metal engine must be replaced after a dispatch failure"
        );
        ensure!(
            (1..=MAX_BATCH).contains(&inputs.len()),
            "invalid Metal batch size"
        );
        metal::objc::rc::autoreleasepool(|| {
            // SAFETY: Metal's shared allocation is aligned, contains MAX_BATCH*25
            // words, and this exclusive verifier has no in-flight command.
            let rows = unsafe {
                std::slice::from_raw_parts_mut(
                    self.input.contents().cast::<u32>(),
                    inputs.len() * 25,
                )
            };
            for (input, row) in inputs.iter().zip(rows.as_chunks_mut::<25>().0.iter_mut()) {
                for (source, target) in [
                    &input.digest[..],
                    &input.signature[..32],
                    &input.signature[32..],
                ]
                .into_iter()
                .zip(row[..24].as_chunks_mut::<8>().0.iter_mut())
                {
                    for (word, out) in source
                        .as_chunks::<4>()
                        .0
                        .iter()
                        .rev()
                        .zip(target.iter_mut())
                    {
                        *out = u32::from_be_bytes(*word);
                    }
                }
                row[24] = u32::from(input.parity);
            }
            let count = inputs.len() as u32;
            let command = self.queue.new_command_buffer();
            if inputs.len() <= 2048 {
                let padded = inputs.len().div_ceil(32) * 32;
                Self::dispatch(
                    command,
                    &self.cooperative_prepare,
                    &self.input,
                    &self.tables,
                    count,
                    padded * 2,
                );
                Self::dispatch(
                    command,
                    &self.cooperative_terms,
                    &self.tables,
                    &self.points,
                    count,
                    padded * 3,
                );
                Self::dispatch(
                    command,
                    &self.cooperative_join,
                    &self.points,
                    &self.output,
                    count,
                    inputs.len(),
                );
            } else {
                Self::dispatch(
                    command,
                    &self.direct_prepare,
                    &self.input,
                    &self.tables,
                    count,
                    inputs.len(),
                );
                Self::dispatch(
                    command,
                    &self.direct_recover,
                    &self.tables,
                    &self.output,
                    count,
                    inputs.len(),
                );
            }
            command.commit();
            let started = Instant::now();
            loop {
                match command.status() {
                    MTLCommandBufferStatus::Completed => break,
                    MTLCommandBufferStatus::Error => {
                        self.failed = true;
                        bail!("Metal command failed; no CPU fallback");
                    }
                    _ if started.elapsed() >= self.timeout => {
                        // The command retains its buffers until it finishes. Never
                        // access them again after timeout, even if recovery is retried.
                        self.failed = true;
                        bail!("Metal command timed out; no CPU fallback");
                    }
                    _ => std::thread::sleep(Duration::from_micros(50)),
                }
            }
            // SAFETY: the command completed; GPU writes are visible in shared
            // memory, and exclusive access prevents another dispatch until return.
            let rows = unsafe {
                std::slice::from_raw_parts(self.output.contents().cast::<u32>(), inputs.len() * 17)
            };
            rows.as_chunks::<17>()
                .0
                .iter()
                .map(|row| match row[0] {
                    0 => Ok(None),
                    1 => {
                        let mut key = [0u8; 65];
                        key[0] = 4;
                        for (words, bytes) in row[1..]
                            .as_chunks::<8>()
                            .0
                            .iter()
                            .zip(key[1..].as_chunks_mut::<32>().0.iter_mut())
                        {
                            for (word, target) in words
                                .iter()
                                .rev()
                                .zip(bytes.as_chunks_mut::<4>().0.iter_mut())
                            {
                                *target = word.to_be_bytes();
                            }
                        }
                        Ok(Some(secp256k1::PublicKey::from_slice(&key)?))
                    }
                    _ => bail!("invalid native GPU result status"),
                })
                .collect()
        })
    }
}

#[cfg(test)]
mod tests {
    #[test]
    #[ignore = "requires Apple Metal"]
    fn native_recovery_matches_cpu_at_pipeline_boundaries_and_invalid_scalars() {
        let mut engine = super::Engine::new(30).unwrap();
        super::super::differential::check(|inputs| engine.recover(inputs));
    }
}
