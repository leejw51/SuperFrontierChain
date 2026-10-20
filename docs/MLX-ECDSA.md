# MLX / Metal ECDSA recovery results — 2026-10-20

**Historical baseline:** the results below describe the original prototype,
preserved under `experiments/mlx_ecdsa/reference/`. The current optimized kernel
and a matched CPU/GPU comparison are documented in [MLX-OPTIMIZATION.md](MLX-OPTIMIZATION.md).
Running the commands below now measures the optimized source, not this older snapshot.

Implemented an isolated, exact-integer secp256k1 public-key recovery prototype
using MLX custom Metal kernels. **Keep the existing CPU verifier:** the prototype
is 10.8× slower than 18-worker libsecp256k1 at 4,096 signatures.
No MLX code runs in transaction admission, execution or consensus.

Follow-up [CPU consumption and asynchronous-overlap measurements](MLX-CPU-USAGE.md)
show that GPU offloading does reduce verifier CPU time: approximately 68–82%
at the same 40,000 recoveries/sec load, depending on CPU worker count. This
does not reverse the latency/maximum-throughput result or establish lower power use.

Measured on Apple M5 Max, macOS-27.0.1-arm64-arm-64bit-Mach-O, Python 3.13.15,
MLX 0.32.4 and NumPy 2.4.4. The Rust oracle uses the repository's locked
libsecp256k1/k256 dependencies in release mode, with 18 Rayon workers.

| Batch | CPU Rayon recoveries/s | GPU end-to-end recoveries/s | CPU ms | GPU end-to-end ms | GPU prepacked + sync ms |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 64 | 401,212 | 1,544 | 0.160 | 41.458 | 41.284 |
| 256 | 587,504 | 6,217 | 0.436 | 41.175 | 40.295 |
| 1,024 | 698,035 | 23,174 | 1.467 | 44.187 | 40.151 |
| 4,096 | 805,000 | 74,441 | 5.088 | 55.024 | 39.974 |

These are medians of seven samples from the recorded run. A preceding run gave
similar results. This is not a randomized, interleaved or multi-machine trial.
Raw samples, source hashes, fixture hash, executable hash and validation results:
[mlx-ecdsa-results-2026-10-20.json](mlx-ecdsa-results-2026-10-20.json).

## What was validated

All **4,389 recovery vectors** matched the CPU oracle byte-for-byte:
4,170 accepted public keys and 219 rejections. The suite also passed
**2,560 arithmetic comparisons** against Python big integers, plus
uneven/small batches, order reversal, duplicate entries and malformed host inputs.

Coverage includes 4,096 distinct signed messages/keys, scalar bounds and low-S,
message reduction, invalid recovery parity, an explicitly decoded non-curve point,
a recovered point at infinity, and arbitrary signatures. Valid fixtures compare
recovered keys with public keys derived directly from their deterministic test
secrets. This is correctness evidence on the tested platform, not a cryptographic
audit, formal proof or cross-device determinism certification.

## Interpretation and limits

The kernel performs full public-key recovery with unsigned integer limbs,
Montgomery modular arithmetic, square-root/inversion exponentiation, and Jacobian
point operations. It uses one lane per signature with binary double-and-add; it
has no optimized window tables or secp256k1 endomorphism acceleration. Its variable
execution paths process public data only. It is unsuitable for signing/secret keys.

At 4,096 signatures, prepacked GPU execution plus synchronization takes
39.97 ms. The end-to-end path takes 55.02 ms, including hex decoding,
limb packing, MLX array creation, dispatch, host materialization and hex output.
Even removing all measured host packing/formatting overhead would not beat the
parallel CPU baseline in this experiment. MLX itself does not provide a ready-made
optimized secp256k1 implementation; a wider memory bus alone is not evidence of a
speedup for this kernel.

Both CPU and GPU comparisons recover the exact uncompressed public key and enforce
the node's low-S/parity policy. They exclude Ethereum RLP, Keccak/address derivation,
EVM execution, persistence, networking and consensus. These are **recoveries/sec**,
not blockchain TPS. Fixtures/signing, startup and initial kernel setup are outside
steady-state timing. The GPU-only line is separately labeled because it excludes
host packing and output formatting. Full boundaries and the algorithm are in the
[experiment README](../experiments/mlx_ecdsa/README.md).

A further GPU optimization effort would need profiling and a more efficient
field/scalar and point-multiplication implementation, followed by broader
adversarial and cross-device differential testing. No production GPU activation
or claim that all Metal implementations are slower follows from this prototype.

## Reproduce

```sh
RAYON_NUM_THREADS=18 make test-mlx
RAYON_NUM_THREADS=18 make bench-mlx
```

These commands install pinned optional packages into `target/mlx-venv`, build the
Rust reference example, regenerate fixtures and run real GPU checks. The benchmark
writes `target/mlx-ecdsa/results.json`. It aborts on a mismatch or unavailable Metal
GPU; it never silently falls back to CPU while claiming GPU measurements.

Formatting and workspace Clippy checks also passed. The node runtime and its
cryptographic dependencies were not changed by this experiment.
