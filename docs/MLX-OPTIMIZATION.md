# Optimized MLX recovery on Apple M5 Max — 2026-10-20

The optimized GPU path reaches **841,333 recoveries/sec** at 65,536 signatures,
versus **814,664/sec** for eighteen CPU workers in the same run. Concurrent CPU
and GPU work reaches **1,301,907/sec**, approximately **60% above CPU alone**.
These are signature-recovery experiments; the node still uses its CPU verifier.

The GPU-only advantage is small: about 3.3% using the ratio of median throughputs.
It won six of seven paired trials at this batch size; observed ranges overlap.
This is not evidence of a universal GPU advantage. At 4,096 signatures, CPU
remains faster and has lower latency.

## Matched measurements

Apple M5 Max, macOS 27.0.1, MLX 0.32.4, NumPy 2.4.4, Python 3.13.15;
release libsecp256k1 oracle with 18 Rayon workers. Medians of seven trials, three
iterations per trial; backend order is randomized with a fixed seed. Fixtures
are identical across backends and contain distinct signed messages/keys.

| Batch | CPU recoveries/sec | Original GPU | Optimized GPU | CPU + GPU |
| ---: | ---: | ---: | ---: | ---: |
| 4,096 | 803,428 | 73,822 | 452,877 | 393,942 |
| 16,384 | 800,910 | 90,900 | 672,086 | 841,228 |
| 65,536 | 814,664 | 97,690 | 841,333 | 1,301,907 |

The GPU optimization improves throughput **6.1 times** at 4,096 signatures and
**8.6 times** at 65,536 relative to the original GPU implementation measured in
the same run. The original implementation is preserved in the experiment's
`reference/` directory, rather than estimating speedup from an earlier machine state.

| Batch | CPU batch latency | Optimized GPU batch latency | CPU + GPU batch latency |
| ---: | ---: | ---: | ---: |
| 4,096 | 5.10 ms | 9.04 ms | 10.40 ms |
| 16,384 | 20.46 ms | 24.38 ms | 19.48 ms |
| 65,536 | 80.45 ms | 77.90 ms | 50.34 ms |

These latencies exclude waiting to collect a batch. They must not be interpreted
as transaction confirmation latency. The node's existing maximum block batch is
4,096; these results do not justify changing its verifier or increasing block size.

At 65,536 signatures, CPU throughput ranged from 798,667 to 832,387/sec; optimized
GPU ranged from 825,490 to 869,918/sec; hybrid ranged from 1,231,982 to 1,332,541/sec.
Prepacked GPU dispatch, including synchronization but excluding input packing and
public-key formatting, reached 1,169,566/sec. That is a separate compute-path
measurement, not the end-to-end throughput in the table.

## CPU cost

At the largest batch, measured at each backend's achieved throughput:

| Backend | Process CPU usage, 100% = one core | CPU-ms per 1,000 recoveries |
| --- | ---: | ---: |
| CPU, 18 workers | 1,708.4% | 20.97 |
| Original GPU host | 38.3% | 3.91 |
| Optimized GPU host | 26.2% | 0.31 |
| CPU + GPU, both processes combined | 1,664.7% | 12.79 |

GPU host processing uses approximately 98.5% less CPU time per recovery than the
CPU verifier at this batch size. The hybrid uses CPU and GPU concurrently to
increase throughput; it is not a low-total-CPU mode. These process clocks include
all threads and charged user/system time. They do not measure whole-system CPU,
GPU utilization, power, thermal headroom or energy.

## Implementation

- Prime-field reduction uses `2^256 = 2^32 + 977 (mod p)`, with bounded exact
  folds and canonical output. Scalar arithmetic retains Montgomery reduction.
- Fixed public exponent addition chains reduce work for square roots and inverses.
- Four-bit point windows and GLV decomposition reduce additions and doubling rounds.
  A combined 16 KiB fixed-base table joins G and `2^128*G` contributions.
- The two-kernel path handles batches below 8,192. Larger batches use five kernels
  with batched scalar inversions, lookup-table normalization and final normalization.
- Bulk hex decoding and NumPy byte/limb conversion reduce Python per-limb work.
- Hybrid benchmarking assigns the first 40% of a batch to GPU and the remaining
  60% to a persistent Rust CPU worker. Ranges are disjoint and each is checked
  against its expected keys. No floating point or completion timing determines
  cryptographic results or transaction order.

The hybrid path **in this microbenchmark** is a throughput experiment: CPU public-key
vectors remain in the worker, and it does not exercise the node integration or its admission queue. The subsequently
implemented [node backends](VERIFICATION-BACKENDS.md) return and merge actual keys
and measure full-network TPS separately. Its elapsed
time includes command/result IPC; CPU-only execution timing excludes that IPC.

## Correctness and scope

The final code passed:

- **65,829 recovery vectors:** 65,610 accepted and 219 rejected, matched byte-for-byte
  with the existing CPU oracle, including keys derived independently from fixture secrets.
- **33,568 arithmetic comparisons** against Python integers, including limb carries,
  modulus boundaries and inverses.
- **10,008 GLV checks** of exact scalar recomposition and signed 128-bit magnitude bounds.
- Both direct and batched pipelines, odd tails and dispatch thresholds, reordered inputs,
  duplicates, all-invalid batches, repeated dispatches, malformed host/packed inputs,
  invalid parity, high-S, non-curve recovery points and infinity rejection.
- Rust formatting, workspace Clippy, and report/source-hash consistency checks.

The retained implementation uses integer arithmetic. Batch products substitute one
for invalid/zero records while preserving their rejection status; output writes are
disjoint and MLX dependencies order stages. This is correctness evidence on the tested
Apple GPU and software versions, not a cryptographic audit or cross-device proof.
The implementation remains unsuitable for secret-key operations.

All timings exclude fixture signing, startup/JIT, RLP, Keccak/address derivation,
EVM execution, persistence, networking and consensus. They are recoveries/sec,
not blockchain TPS. Warmup and correctness comparisons are outside timed regions;
timed requests verify their final output. Tests and tuning used one machine, without
frequency pinning or thermal control. Full network tests from the earlier node work
were not rerun for this experiment because no node runtime code changed.

Raw samples, validation and source/executable/fixture hashes:
[mlx-optimized-results-2026-10-20.json](mlx-optimized-results-2026-10-20.json).

## Reproduce

```sh
make bench-mlx-optimized
# After setup/build, choose an output file:
RAYON_NUM_THREADS=18 target/mlx-venv/bin/python experiments/mlx_ecdsa/benchmark_optimized.py \
  --output target/mlx-ecdsa/optimized.json
```

The experiment README describes the implementation and other benchmark modes.
The [node backend report](VERIFICATION-BACKENDS.md) documents the subsequent
CPU/GPU/HYBRID integration, deterministic output assembly, failure handling and
full-node TPS/CPU measurements. These microbenchmark rates are not node TPS.
