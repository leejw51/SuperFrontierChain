# MLX / Metal secp256k1 recovery experiment

This experimental recovery implementation now also powers the node's default GPU
transaction verifier through `worker.py`. CPU and HYBRID modes remain selectable;
see [node integration, tests and TPS](../../docs/VERIFICATION-BACKENDS.md).
It is not an audited cryptographic library and must not be used for signing or secret data.
The optimized implementation approaches/exceeds the CPU baseline for large batches
on the tested M5 Max, while CPU verification retains lower small-batch latency.
See [current optimization results](../../docs/MLX-OPTIMIZATION.md) for the measured
limits and the separate CPU+GPU throughput experiment.

## Cooperative small-batch recovery

The default `auto` mode uses a cooperative path through 2,048 signatures, the previous
direct path for 2,049–8,191, and the batched path for larger inputs. The cooperative
path parallelizes work within each signature, using exact integer arithmetic and
ordered result assembly. See [measured latency/TPS improvements](../../docs/GPU-ENHANCEMENT.md).
`make bench-mlx-latency` compares the current implementation with the frozen previous
node worker under `reference_node/`, checking all returned keys and writing raw samples.

## Run

Requires Apple silicon with Metal, an installed Python 3.13 (override
`MLX_PYTHON` if needed), `uv`, the repository's Rust toolchain and dependencies.
MLX/NumPy are pinned in `requirements.txt`; installation is isolated under the
ignored `target/mlx-venv` directory. Metal access must be available to the process.

```sh
RAYON_NUM_THREADS=18 make test-mlx
RAYON_NUM_THREADS=18 make bench-mlx
make bench-mlx-optimized
```

The benchmark always runs differential correctness checks first and exits on any
mismatch. `target/mlx-ecdsa/results.json` contains raw timing samples, validation,
software/device details, source hashes and the oracle executable hash. Fixtures
are regenerated deterministically into `target/mlx-ecdsa/fixtures.json`.

To select an output report after setup/build:

```sh
RAYON_NUM_THREADS=18 target/mlx-venv/bin/python experiments/mlx_ecdsa/benchmark.py \
  --output target/mlx-ecdsa/my-results.json
```

`bench-mlx-optimized` runs expanded tests against 65,536 distinct signed fixtures,
then compares the CPU, preserved original GPU implementation, optimized GPU and
concurrent CPU+GPU processing at 4,096, 16,384 and 65,536 records. Seven trials of
three iterations use randomized backend order. Results go to
`target/mlx-ecdsa/optimized.json`. The hybrid benchmark partitions each batch into
40% GPU and 60% CPU work, checking both ranges in their owning processes; it does
not transfer/merge the CPU public-key vector into a production node API.

Original measurements are retained in [MLX-ECDSA.md](../../docs/MLX-ECDSA.md).

### CPU usage and asynchronous overlap

```sh
make bench-mlx-cpu
# Or, after setup and building the oracle:
target/mlx-venv/bin/python experiments/mlx_ecdsa/cpu_usage.py \
  --output target/mlx-ecdsa/cpu-usage.json
```

This separate benchmark measures process CPU time across all threads for 2, 4,
8 and 18 CPU workers and the end-to-end GPU path. It tests saturated throughput,
then the same offered load (40,000 recoveries/sec in 4,096-item batches), then
that load with concurrent EVM execution. Each scenario has three trials in a
seeded randomized order. The CPU workers and EVM process remain alive between
requests; fixture creation, warmup and startup are excluded. CPU usage uses the
macOS process convention: 100% means one CPU core, so it can exceed 100%.
CPU-ms per 1,000 recoveries makes comparisons independent of throughput.

The EVM control repeatedly executes the same 512-transfer block from the same
genesis, checking the resulting block hash. It measures execution contention;
it is neither a growing chain nor a durable/network throughput benchmark.
An additional seven-trial comparison submits GPU work with `mx.async_eval`
and overlaps it with a fixed amount of EVM execution, versus running those exact
tasks sequentially. Both results are checked. GPU host CPU time and EVM child
CPU time are reported separately. The Rust process clock uses the `libc`
development dependency only; this adds no runtime GPU integration.

These measurements do not measure GPU utilization, watts, energy, or whole-node
CPU consumption. Avoid other heavy work while running them. Raw per-batch timing,
process CPU seconds, scheduling lateness, hashes and correctness results are
included in the output report.

Recorded measurements and interpretation:
[CPU consumption results](../../docs/MLX-CPU-USAGE.md).

## Scope and algorithm

Input is a 32-byte signing digest, compact 64-byte `(r,s)` signature and recovery
parity. Output is either rejection or the exact uncompressed 65-byte public key.
This matches the node's recovery policy: `0 < r,s < n`, low-S, parity 0 or 1.
Recovery IDs 2 and 3 are deliberately rejected, as they are by the node's decoder.
This is public-key recovery, not verification against an externally supplied key:
changing a message or parity can produce a different valid recovered key.

Recovery uses eight 32-bit limbs and exact 64-bit multiply-add intermediates.
Field arithmetic exploits `p = 2^256 - 2^32 - 977` with bounded folds in the normal
domain; scalar arithmetic modulo `n` retains Montgomery representation. Generated
addition chains compute the exact public exponents for square root and inversions.
Recovery constructs the curve point R from r/parity, checks its square root,
computes `Q = r^-1 * (s*R - z*G)`, and rejects infinity.

The GLV decomposition splits R's scalar into two signed magnitudes below 2^128.
Four-bit windows interleave R and its endomorphism with a combined fixed-base
lookup for G and `2^128*G`. This halves the doubling rounds and reduces additions.
Lookup constants are generated using Python integer arithmetic; the generated
exponent chains are checked symbolically. No floating-point calculations or
neural models participate in recovery.

`Recovery(mode='auto')` selects a two-kernel direct path below 8,192 records and
a five-kernel pipeline for larger batches. The latter batches scalar inversions,
normalization of R's lookup points, and final public-key normalization. Invalid
records contribute multiplicative identity to batch products and retain rejection
status, so they cannot contaminate valid neighbors. Each output location has one
writer; MLX dependencies order the kernels. CPU bulk hex conversion and NumPy
byte/limb conversion preserve input/output order. Explicit `direct` and `batched`
modes are available for differential tests.

The wrapper checks input widths, parity type/range and packed array shape/dtype.
It requires an actual Metal GPU and never silently substitutes CPU execution.
The original implementation is frozen under `reference/` for reproducible comparisons.

## Correctness evidence

- 65,536 signatures over distinct deterministic messages and test keys in the
  expanded benchmark (4,096 in the shorter benchmark).
- Range boundaries for r, s and the message digest; high-S; invalid parity.
- Explicit non-curve recovery point, and a recovered point at infinity.
- 256 arbitrary signatures with reference acceptance/recovered-key expectations.
- Small/uneven batches, reversed/shuffled order, duplicates, all-invalid batches,
  chunk tails, both pipeline variants, repeated dispatches and malformed inputs.
- 33,568 modular addition/subtraction/multiplication/inversion comparisons against
  Python big integers, including carries, zero and values close to p/n.
- 10,008 GLV checks of signed bounds and exact recomposition modulo n.

The CPU oracle in `crates/sfc/examples/ecdsa_oracle.rs` uses the same existing
libsecp256k1 dependency and k256 low-S rule as the node. Generated valid signatures
are also checked against the public keys derived directly from their test secrets.
An independent SEC1 point decoder identifies the explicit non-curve test point.
Every returned public-key byte is compared; checking only a validity flag would
miss sender-recovery errors. These are regression tests, not a security audit or
formal proof, and cover only the tested hardware/compiler versions.

## Measurement boundaries

Both end-to-end paths start with hex digest/signature records and end with
hex-encoded uncompressed public keys. They include input decoding, validation and
output serialization. GPU end-to-end additionally includes limb packing, MLX array
creation, dispatch, explicit completion synchronization and host materialization.
A separate prepacked GPU measurement excludes host packing/output formatting but
still waits for completion. Its result is checked against the oracle before timing.

The benchmarks exclude fixture signing, process startup, first kernel setup, RLP
parsing, Keccak/address derivation, EVM execution, storage, networking and consensus.
It therefore must not be quoted as blockchain TPS or compared directly with the
older full transaction-authentication benchmark. The shorter `benchmark.py` uses
seven CPU samples of five iterations and seven GPU samples of three iterations,
with CPU cases first. `benchmark_optimized.py` uses seven interleaved randomized
trials of three iterations for every backend. Both warm up outside timing.
Samples within one run are not independent multi-host trials. CPU and hybrid
paths use a persistent Rust worker, with all recovered keys checked there; hybrid
elapsed time includes worker IPC while the CPU-only execution clock excludes it.

## References

- [MLX custom Metal kernels](https://ml-explore.github.io/mlx/build/html/dev/custom_metal_kernels.html)
- [libsecp256k1 recovery implementation](https://github.com/bitcoin-core/secp256k1/blob/master/src/modules/recovery/main_impl.h)
- [secp256k1 GLV lattice, constants and bound proof](https://github.com/bitcoin-core/secp256k1/blob/master/src/scalar_impl.h)
