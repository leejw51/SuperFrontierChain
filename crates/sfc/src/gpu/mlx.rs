//! Rust -> Apple's MLX C API -> MLX custom Metal kernels. No Python or IPC.
//! All MLX graph construction, evaluation and handle destruction is serialized.
//! The stream is explicitly cross-thread; verifier calls may arrive on Rayon.
use super::{Keys, RecoveryInput};
use anyhow::{bail, ensure, Context, Result};
use mlx_sys::*;
use std::{
    ffi::{c_char, c_void, CStr, CString},
    sync::{Mutex, Once},
    time::{Duration, Instant},
};

static GATE: Mutex<()> = Mutex::new(());
static ERROR: Mutex<String> = Mutex::new(String::new());
static INIT: Once = Once::new();

unsafe extern "C" fn error_handler(message: *const c_char, _: *mut c_void) {
    if !message.is_null() {
        if let Ok(mut error) = ERROR.lock() {
            // SAFETY: MLX supplies a NUL-terminated string valid for this callback.
            *error = unsafe { CStr::from_ptr(message) }
                .to_string_lossy()
                .into_owned();
        }
    }
}

fn check(code: i32) -> Result<()> {
    if code != 0 {
        let message = ERROR.lock().map(|e| e.clone()).unwrap_or_default();
        bail!("MLX C API failure ({code}): {message}");
    }
    Ok(())
}

// Every opaque C handle has one Rust owner and is freed while GATE is held.
macro_rules! owned {
    ($name:ident, $raw:ty, $free:ident) => {
        struct $name($raw);
        impl $name {
            fn new(raw: $raw) -> Result<Self> {
                ensure!(
                    !raw.ctx.is_null(),
                    "MLX returned an empty {}",
                    stringify!($name)
                );
                Ok(Self(raw))
            }
        }
        impl Drop for $name {
            fn drop(&mut self) {
                // SAFETY: this wrapper owns the live handle and never clones ownership.
                unsafe {
                    $free(self.0);
                }
            }
        }
    };
}
owned!(Array, mlx_array, mlx_array_free);
owned!(Arrays, mlx_vector_array, mlx_vector_array_free);
owned!(Strings, mlx_vector_string, mlx_vector_string_free);
owned!(Kernel, mlx_fast_metal_kernel, mlx_fast_metal_kernel_free);
owned!(
    KernelConfig,
    mlx_fast_metal_kernel_config,
    mlx_fast_metal_kernel_config_free
);
owned!(Stream, mlx_stream, mlx_stream_free);
owned!(Device, mlx_device, mlx_device_free);

struct Core {
    stream: Stream,
    direct_prepare: Kernel,
    direct_recover: Kernel,
    cooperative_prepare: Kernel,
    cooperative_terms: Kernel,
    cooperative_join: Kernel,
    words: Vec<u32>,
    timeout: Duration,
}
pub(super) struct Engine {
    core: Option<Core>,
}
// SAFETY: handles move only under exclusive Engine ownership. All access and
// destruction is guarded by GATE. MLX's cross-thread stream is used explicitly.
unsafe impl Send for Engine {}
impl Drop for Engine {
    fn drop(&mut self) {
        let _guard = GATE.lock().unwrap_or_else(|poisoned| poisoned.into_inner());
        self.core.take();
    }
}
impl Engine {
    pub(super) fn new(timeout_seconds: u64) -> Result<Self> {
        let guard = GATE
            .lock()
            .map_err(|_| anyhow::anyhow!("MLX lock poisoned"))?;
        INIT.call_once(|| {
            // SAFETY: process-wide callback has static lifetime and never unwinds.
            unsafe {
                mlx_set_error_handler(Some(error_handler), std::ptr::null_mut(), None);
            }
        });
        let mut core = Core::new(timeout_seconds)?;
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
        let direct = vec![valid.clone(); 2049];
        let invalid = RecoveryInput {
            signature: [0; 64],
            ..valid.clone()
        };
        ensure!(
            core.recover(&[valid, invalid])? == vec![Some(expected), None],
            "native MLX startup self-test disagrees with CPU"
        );
        ensure!(
            core.recover(&direct)?
                .iter()
                .all(|key| key.as_ref() == Some(&expected)),
            "MLX direct pipeline startup self-test disagrees with CPU"
        );
        drop(guard);
        Ok(Self { core: Some(core) })
    }
    pub(super) fn recover(&mut self, inputs: &[RecoveryInput]) -> Result<Keys> {
        let _guard = GATE
            .lock()
            .map_err(|_| anyhow::anyhow!("MLX lock poisoned"))?;
        let result = self
            .core
            .as_mut()
            .context("failed MLX engine")?
            .recover(inputs);
        if result.is_err() {
            // Never reuse arrays/streams after an error or timeout.
            self.core.take();
        }
        result
    }
}
impl Kernel {
    fn compile(name: &str, input: &str, output: &str, body: &str) -> Result<Self> {
        let (name, input, output, body, header) = (
            CString::new(name)?,
            CString::new(input)?,
            CString::new(output)?,
            CString::new(body)?,
            CString::new(include_str!(concat!(env!("OUT_DIR"), "/mlx-header.metal")))?,
        );
        // SAFETY: C strings and vectors outlive the call; MLX copies source/names.
        unsafe {
            let inputs = Strings::new(mlx_vector_string_new_value(input.as_ptr()))?;
            let outputs = Strings::new(mlx_vector_string_new_value(output.as_ptr()))?;
            Self::new(mlx_fast_metal_kernel_new(
                name.as_ptr(),
                inputs.0,
                outputs.0,
                body.as_ptr(),
                header.as_ptr(),
                true,
                false,
            ))
        }
    }
    fn apply(
        &self,
        input: &Array,
        count: usize,
        columns: usize,
        threads: usize,
        stream: &Stream,
    ) -> Result<Array> {
        let shape = [count as i32, columns as i32];
        // SAFETY: live owned handles, bounded shapes/grid; MLX retains input graph
        // dependencies and copies configuration before these temporaries are freed.
        unsafe {
            let config = KernelConfig::new(mlx_fast_metal_kernel_config_new())?;
            check(mlx_fast_metal_kernel_config_set_grid(
                config.0,
                threads as i32,
                1,
                1,
            ))?;
            check(mlx_fast_metal_kernel_config_set_thread_group(
                config.0, 32, 1, 1,
            ))?;
            check(mlx_fast_metal_kernel_config_add_output_arg(
                config.0,
                shape.as_ptr(),
                2,
                mlx_dtype__MLX_UINT32,
            ))?;
            let inputs = Arrays::new(mlx_vector_array_new_value(input.0))?;
            let mut outputs = Arrays::new(mlx_vector_array_new())?;
            check(mlx_fast_metal_kernel_apply(
                &mut outputs.0,
                self.0,
                inputs.0,
                config.0,
                stream.0,
            ))?;
            // mlx_array_new is an empty output slot; vector_get populates it.
            let mut result = Array(mlx_array_new());
            check(mlx_vector_array_get(&mut result.0, outputs.0, 0))?;
            ensure!(!result.0.ctx.is_null(), "MLX kernel produced no array");
            Ok(result)
        }
    }
}
impl Core {
    fn new(timeout_seconds: u64) -> Result<Self> {
        // SAFETY: serialized initialization, no borrowed pointers escape.
        let stream = unsafe {
            let mut available = false;
            check(mlx_metal_is_available(&mut available))?;
            ensure!(available, "MLX Metal GPU unavailable; no CPU fallback");
            let device = Device::new(mlx_device_new_type(mlx_device_type__MLX_GPU, 0))?;
            Stream::new(mlx_stream_new_thread_unsafe(device.0))?
        };
        macro_rules! kernel {
            ($name:literal, $input:literal, $output:literal) => {
                Kernel::compile(
                    $name,
                    $input,
                    $output,
                    include_str!(concat!(env!("OUT_DIR"), "/", $name, ".mlx")),
                )?
            };
        }
        Ok(Self {
            stream,
            direct_prepare: kernel!("sfc_direct_prepare", "records", "tables"),
            direct_recover: kernel!("sfc_direct_recover", "tables", "results"),
            cooperative_prepare: kernel!("sfc_cooperative_prepare", "records", "tables"),
            cooperative_terms: kernel!("sfc_cooperative_terms", "tables", "points"),
            cooperative_join: kernel!("sfc_cooperative_join", "points", "results"),
            words: Vec::with_capacity(4096 * 25),
            timeout: Duration::from_secs(timeout_seconds),
        })
    }
    fn recover(&mut self, inputs: &[RecoveryInput]) -> Result<Keys> {
        ensure!((1..=4096).contains(&inputs.len()), "invalid MLX batch size");
        self.words.clear();
        for input in inputs {
            for bytes in [
                &input.digest[..],
                &input.signature[..32],
                &input.signature[32..],
            ] {
                self.words.extend(
                    bytes
                        .as_chunks::<4>()
                        .0
                        .iter()
                        .rev()
                        .map(|w| u32::from_be_bytes(*w)),
                );
            }
            self.words.push(input.parity.into());
        }
        let count = inputs.len();
        let shape = [count as i32, 25];
        // MLX owns its input allocation. The C API copies this reused Rust staging
        // buffer once; no per-signature objects, serialization or socket copies.
        let input = unsafe {
            Array::new(mlx_array_new_data(
                self.words.as_ptr().cast(),
                shape.as_ptr(),
                2,
                mlx_dtype__MLX_UINT32,
            ))?
        };
        let output = if count <= 2048 {
            let padded = count.div_ceil(32) * 32;
            let tables =
                self.cooperative_prepare
                    .apply(&input, count, 273, padded * 2, &self.stream)?;
            let points =
                self.cooperative_terms
                    .apply(&tables, count, 72, padded * 3, &self.stream)?;
            self.cooperative_join
                .apply(&points, count, 17, count, &self.stream)?
        } else {
            let tables = self
                .direct_prepare
                .apply(&input, count, 273, count, &self.stream)?;
            self.direct_recover
                .apply(&tables, count, 17, count, &self.stream)?
        };
        // SAFETY: live output is retained for the entire asynchronous evaluation.
        // These availability APIs are pinned to mlx-sys 0.6.0 / MLX 0.32.2 and
        // covered by differential/repeated-dispatch tests. No CPU read before wait.
        unsafe {
            let outputs = Arrays::new(mlx_vector_array_new_value(output.0))?;
            check(mlx_async_eval(outputs.0))?;
            let started = Instant::now();
            loop {
                let mut ready = false;
                check(_mlx_array_is_available(&mut ready, output.0))?;
                if ready {
                    break;
                }
                ensure!(
                    started.elapsed() < self.timeout,
                    "MLX GPU timed out; no CPU fallback"
                );
                std::thread::sleep(Duration::from_micros(50));
            }
            check(_mlx_array_wait(output.0))?;
            ensure!(
                mlx_array_size(output.0) == count * 17,
                "invalid MLX result length"
            );
            let pointer = mlx_array_data_uint32(output.0);
            ensure!(!pointer.is_null(), "MLX result unavailable");
            let rows = std::slice::from_raw_parts(pointer, count * 17);
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
                            for (word, dest) in words
                                .iter()
                                .rev()
                                .zip(bytes.as_chunks_mut::<4>().0.iter_mut())
                            {
                                *dest = word.to_be_bytes();
                            }
                        }
                        Ok(Some(secp256k1::PublicKey::from_slice(&key)?))
                    }
                    _ => bail!("invalid MLX result status"),
                })
                .collect()
        }
    }
}

#[cfg(test)]
mod tests {
    #[test]
    #[ignore = "requires Apple MLX Metal device"]
    fn mlx_native_differential_and_cross_thread_stream() {
        let mut engine = super::Engine::new(30).unwrap();
        // Construction and evaluation intentionally happen on different threads.
        std::thread::spawn(move || {
            super::super::differential::check(|inputs| engine.recover(inputs));
            assert!(engine.recover(&[]).is_err());
            let invalid = super::RecoveryInput {
                digest: [0; 32],
                signature: [0; 64],
                parity: 0,
            };
            assert!(engine.recover(std::slice::from_ref(&invalid)).is_err());
            let mut replacement = super::Engine::new(30).unwrap();
            assert_eq!(replacement.recover(&[invalid]).unwrap(), vec![None]);
        })
        .join()
        .unwrap();
    }
}
