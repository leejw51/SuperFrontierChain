# Performance measurements

Latest native MLX/Cap’n Proto investigation:
[projection sync stalls, indexer isolation and dispatch tuning](SPECIFICATION.md#11-throughput-stall-investigation-and-follow-up-2026-10-22).
The dated comparisons below retain their original workloads and persistence policies.

Latest GPU enhancement: [cooperative recovery, paired TPS and CPU measurements](GPU-ENHANCEMENT.md).

Original node backend comparison: [CPU/GPU/HYBRID TPS and CPU usage](VERIFICATION-BACKENDS.md).
The signature-recovery microbenchmarks are separate from committed network TPS.


## Current optimization comparison (2026-10-20)

The current ordered-state implementation was compared with the runtime before this
optimization, on the same macOS arm64 host using Rust 1.99.0, release/thin LTO and
18 Rayon workers. Three trials alternate before/after order. Values below are
medians of the three runs; signatures are generated before timing. Each run uses
81,920 native transfers, 20 blocks of 4,096 transactions, and three accounts.
The baseline includes the preceding correctness fixes and ordered EVM database.
There was no existing Git commit to identify it: this repository was an initial
staged snapshot, and the pre-optimization executable was retained for comparison.
Raw data: [speed-comparison-2026-10-20.jsonl](speed-comparison-2026-10-20.jsonl).

| Processing path | Before tx/s | After tx/s | Change |
| --- | ---: | ---: | ---: |
| Execution and state commitment | 293,861 | 516,488 | 1.76× |
| Execution and durable persistence | 132,982 | 233,384 | 1.76× |
| Serial admission, execution and persistence | 37,711 | 41,699 | 1.11× |
| Rayon admission, execution and persistence | 81,665 | 144,979 | 1.78× |

The full Rayon path's median block p50 fell from 50.84 ms to 28.08 ms. It includes
signature checks, admission execution, block execution, RocksDB WAL/fsync, JSONL
fsync and maintenance. It excludes networking and scheduling waits. Signature
verification code is unchanged; its parallel medians were 767,302 before and
731,583 after, illustrating host/trial variability. Combined Rayon throughput
ranged from 79,989–81,840 before and 138,349–151,981 after.
Twenty blocks per trial do not establish a reliable tail-latency distribution.

The changes reuse a REVM handler within an ordered batch, cache committed head
bytes/hash after a successful durable write, reuse those bytes for JSONL, avoid
rebuilding unused follower mempool state, and eliminate repeated head hashing in
status/receipt reads. Pure HTTP submission batches also share the executor while
mixed RPC batches keep their ordered dispatch behavior. Execution, signatures,
state commitments, fsync and transaction limits remain enabled.

Reproduce the current paths:

```sh
RAYON_NUM_THREADS=18 SFC_BENCH_BATCH=4096 SFC_BENCH_BLOCKS=20 make benchmark
RAYON_NUM_THREADS=18 make bench-network
# Compare against a retained pre-change release executable:
python3 scripts/benchmark_network.py --compare /path/to/baseline-sfc --repeat 3
```

At an equal 100 ms interval, the three-trial two-node median improved from
**34,351 to 36,595 tx/s (1.065×)**. Median HTTP admission time fell from
377.37 ms to 239.81 ms (36.4% lower); the remaining scheduler/replay wait limits
the end-to-end gain. Raw data, including binary hashes and every trial:
[network-speed-comparison-2026-10-20.jsonl](network-speed-comparison-2026-10-20.jsonl).

A separate comparison of the **old 500 ms default versus the new 100 ms default**
measured **7,686 versus 34,620 tx/s (4.50×)**. This combines the code changes with
faster scheduling; it must not be attributed to execution optimization alone.
Raw trials: [default-cadence-comparison-2026-10-20.jsonl](default-cadence-comparison-2026-10-20.jsonl).
Reproduce with `python3 scripts/benchmark_network.py --compare /path/to/baseline-sfc --baseline-interval 500 --repeat 3`.

The live benchmark uses two Python-supervised release nodes, 100-item HTTP batches over a persistent connection,
16,384 signed native transfers, and a 100 ms block interval. Timing ends when the
follower exposes the final durable receipt, and includes admission, scheduling and
HTTP/3 replay. It validates matching blocks, exact nonce/balance and no restarts.
Contract deployment is warm-up; signing and process startup are outside timing.
This is a short local burst, not sustained multi-machine capacity or BFT consensus.
Newly initialized nodes and supervised networks now use 100 ms by default, a
40,960 tx/s transaction-count ceiling at 4,096 tx/block. Existing configurations
are preserved; a retained 500 ms interval still caps them at 8,192 tx/s. To adopt
the tested setting, set `block_interval_ms` to `100` in the existing config and
restart the node. Faster cadence increases empty-block writes and history growth;
this setting is a scheduling target, not a distributed-finality guarantee.

## Correctness checks after optimization

`make check integration test-two-nodes test-service` passed: formatting/Clippy,
37 Rust tests, ERC-20 operations, HTTP/3 and TCP, two- and four-node supervised
recovery, pruning, service lifecycle, and all 15 emergency scenarios. The one
ignored Rust journal worker is invoked by its parent crash-recovery test.
Release-mode core, determinism and parallel-execution suites also passed (18 tests).
Golden state/block commitments are unchanged. Regression coverage checks failed
commit cache publication, reverted storage isolation, invalid nonce isolation,
duplicates, malformed HTTP batch entries, notifications and serial/batch equivalence.

## Historical measurements

The measurements below predate the ordered EVM database and BTreeSet changes and
are retained for historical context. Use the current comparison above instead.

Measured locally on 2026-10-19, macOS arm64, Rust 1.99.0, Cargo release profile with
thin LTO. CPU model and storage model were not available to the benchmark. These are
single-machine native-transfer microbenchmarks with three live accounts. They are
not ERC-20, large-state, HTTP/3 end-to-end or multi-validator throughput measurements.
Raw results are checked in as [benchmark-results.jsonl](benchmark-results.jsonl).

## Historical rerun (2026-10-19)

After the sync/pruning checks, `SFC_BENCH_BATCH=4096 SFC_BENCH_BLOCKS=100 make bench`
completed successfully. Raw results: [tps-latest.jsonl](tps-latest.jsonl).
The workload is 409,600 native transfers, 100 blocks, three live accounts, and
18 Rayon workers. Signing is outside the timer. This is one local release-mode run.

| Admission + execution + durable persistence | Serial | Rayon |
| --- | ---: | ---: |
| Processing throughput | 37,851 tx/s | 83,253 tx/s |
| Block p50 | 108.03 ms | 49.07 ms |
| Block p99 | 115.23 ms | 51.13 ms |

Both include signature checks, EVM execution, RocksDB WAL/fsync, JSONL persistence,
and pruning maintenance. Neither includes networking or block scheduling waits.
The then-configured 500 ms cadence capped full-block throughput at 8,192 tx/s before
other resource limits; that is not a measured sustained network result.

## Rayon comparison

After adding Rayon, the same-process release comparison used 100 blocks per case
and the default 18-worker pool. The pool was warmed before timing. Both admission
paths include signature verification, ordered EVM execution and RocksDB/JSONL fsync;
networking and scheduler waits remain excluded. Transaction signing is outside the timer.
Raw results: [rayon-benchmark-results.jsonl](rayon-benchmark-results.jsonl).

| Metric | Serial | Rayon | Workload |
| --- | ---: | ---: | --- |
| Signature verification | 64,415 tx/s | 763,712 tx/s | 4,096 tx/block |
| Admission + execution + persistence | 38,022 tx/s | 83,766 tx/s | 4,096 tx/block |
| Combined p50 | 107.98 ms | 49.01 ms | 4,096 tx/block |
| Combined p95 | 109.22 ms | 50.15 ms | 4,096 tx/block |
| Combined p99 | 109.93 ms | 52.80 ms | 4,096 tx/block |
| Admission + execution + persistence | 15,311 tx/s | 17,510 tx/s | 100 tx/block |
| Combined p99 | 7.13 ms | 9.09 ms | 100 tx/block |

Full-block local throughput improved **2.20x**; independent signature verification
improved **11.86x**. Small batches improved average throughput but had a worse p99
in this run, so parallelism is not a universal latency improvement. These are single
runs rather than repeated controlled trials. The 500 ms cadence and 8,192 tx/s ceiling were unchanged in that comparison;
processing capacity is not live-chain throughput.

Rayon is used for synced-block verification, HTTP JSON-RPC transaction batches,
and the library's `Node::submit_batch`. Single submissions remain serial. Batches
below 32 items skip parallel scheduling. Larger indexed batches preserve order;
strict import reports the first invalid transaction in input order. EVM execution
and durable state mutation stay sequential. Tests compare receipts/state roots on
1, 2 and 4 workers, plus malformed batches, notifications and HTTP/3 replay.

The default pool uses available CPU parallelism. Tune it for the host:

```sh
RAYON_NUM_THREADS=4 make run
RAYON_NUM_THREADS=4 SFC_BENCH_BATCH=4096 SFC_BENCH_BLOCKS=100 make bench
```

There is no guarantee that more workers always give better latency or throughput.
The implementation uses [Rayon's indexed iterators](https://docs.rs/rayon/1.12.0/rayon/iter/trait.IndexedParallelIterator.html).

## Serial baseline before Rayon

| Path | 100 tx/block, 100 blocks | 4,096 tx/block, 100 blocks |
| --- | ---: | ---: |
| EVM execution + SFC commitment | 289,593 tx/s | 311,275 tx/s |
| Execution + RocksDB/JSONL fsync | 20,565 tx/s | 130,539 tx/s |
| Signature recovery/validation only | 55,053 tx/s | 64,176 tx/s |
| Admission + execution + durable persistence | 15,219 tx/s | 37,720 tx/s |
| Combined block p50 | 6.94 ms | 108.25 ms |
| Combined block p95 | 7.09 ms | 112.06 ms |
| Combined block p99 | 7.15 ms | 116.94 ms |

The full 4,096-transfer local processing batch completed within **117 ms** in this
run, below the **500 ms** scheduling budget. The full-block run processed 409,600
transactions across 100 blocks. The reported p99 is the maximum of those 100 samples;
longer repeated runs are needed for a stable tail estimate.
Signatures are generated outside the timer. The combined path times signature
recovery, mempool admission/pre-execution, block execution, commitment, synchronous
RocksDB writes, JSONL fsync and pruning maintenance. It bypasses HTTP and scheduler
waiting. It uses the same application/node persistence path as the running node.
The 100-tx execution-only and durable tests exclude signature checks.

At that historical cadence, the transaction-count ceiling was **8,192 tx/s**
(4,096 / 0.5 seconds), before gas, data, network or CPU constraints. This is a
configuration ceiling, not measured sustained live-chain throughput. Contract-heavy
blocks hit the gas ceiling sooner. Raising limits requires realistic workload tests.

## Optimizations made

- Optimized libsecp256k1 recovery: roughly 13,628 to 64,176 checks/s in separate local runs.
- Cached pending EVM state avoids replaying the entire queue for each admission.
- Hash-set duplicate detection and byte/count-bounded admission.
- One-pass candidate selection and block execution, instead of executing candidates twice.
- In-memory current state; differential JSON account writes in atomic RocksDB batches.
- Indexed receipt lookup; pruning removes the associated indexes.
- Incremental pruning instead of scanning all historical blocks every tick.
- Hourly append-only JSONL segments instead of per-block files and directory fsyncs.
- HTTP/3 persistent RPC connections, bounded streaming buffers and batched block fetches.
- Release-mode run target, thin LTO and one code-generation unit.

The earlier 100-transfer durable-path run measured 11,613 tx/s; this rerun measured
20,565 tx/s. These are before/after observations, not controlled repeated experiments.
Fsync is enabled in both; durability was not disabled to improve the number.

## Reproduce

```sh
make bench
SFC_BENCH_BATCH=4096 SFC_BENCH_BLOCKS=100 make bench
```

The current harness uses native transfers and a small fixed state. Next performance
gates are ERC-20-heavy mixes, growing account/storage sets, sustained network load,
slow disks, loss/latency, recovery and validator failures. Whole-state commitment,
state copying/loading, single-writer admission, and startup projection reconstruction
remain scaling limits. Do not infer production capacity or external-L1 parity from
these results.

## Optional MLX recovery experiment

An isolated integer-only Metal kernel now implements the node's low-S/parity
public-key recovery policy. It is not enabled in the node. On the tested Apple
M5 Max, it passes differential checks but is slower than parallel libsecp256k1.
See [MLX recovery results](MLX-ECDSA.md) for the complete measurement boundaries
and raw samples; those recovery rates are not blockchain transaction throughput.
Run `RAYON_NUM_THREADS=18 make bench-mlx` to reproduce.
