# GPU latency enhancement — 2026-10-20

The default GPU verifier now spreads a signature across multiple GPU tasks for
batches of up to 2,048 records. This reduces small-batch recovery latency and improves
committed two-node TPS. CPU, GPU and HYBRID remain supported; GPU remains the default.

## Measured changes

Apple M5 Max, 18 logical CPUs, macOS 27.0.1, MLX 0.32.4. The previous optimized
worker is preserved under `experiments/mlx_ecdsa/reference_node/`. These comparisons
use the same Rust executable and change only the GPU worker/kernel implementation.

Full GPU recovery includes input packing, dispatch, synchronization and output
unpacking. Seven trials of three iterations rotate before/after order using a fixed
random seed. All returned keys are compared with CPU fixtures.

| Signatures per batch | Previous latency | Enhanced latency | Reduction |
| --- | ---: | ---: | ---: |
| 1 | 7.577 ms | 4.928 ms | 35.0% |
| 100 | 7.844 ms | 5.042 ms | 35.7% |
| 1,024 | 8.101 ms | 5.581 ms | 31.1% |
| 2,048 | 8.323 ms | 6.888 ms | 17.2% |
| 4,096 | 8.863 ms | 8.915 ms | unchanged within run variation |
| 65,536 | 75.787 ms | 76.028 ms | unchanged within run variation |

The network benchmark runs a sequencer and follower with HTTP JSON-RPC submission,
HTTP/3 replay, signature checks, EVM execution and synchronous RocksDB WAL commits.
It checks the follower's ending receipt, balances, nonces and matching block/state
roots. Normal mempool backpressure and retries are included. These are short bursts,
not a sustained long-duration capacity test.

| Workload | Previous committed TPS | Enhanced committed TPS | Change |
| --- | ---: | ---: | ---: |
| 16,384 transfers, 100/request batch; five paired trials | 9,623 | 12,456 | **+29.4%** |
| 65,536 transfers, 4,096/request batch; three paired trials | 38,126 | 38,410 | approximately unchanged |

Small-batch TPS ranged from 9,552–9,642 before and 12,300–13,711 after. All five
paired trials improved. Large-batch ranges overlap substantially (37,958–40,660
before; 37,499–40,580 after). The default 100 ms cadence and 4,096-transaction block
limit target a 40,960 TPS ceiling, so the larger workload is already near that bound.

CPU accounting includes **both Rust nodes and both MLX workers**, excluding the
load generator. 100% means one CPU core. It uses cumulative process user+system CPU
time with macOS `ps`'s 10 ms resolution, sampled around each timed interval.

| Workload | Previous host CPU | Enhanced host CPU | Previous CPU ms/tx | Enhanced CPU ms/tx |
| --- | ---: | ---: | ---: | ---: |
| 100/request batch | 45.2% | 60.1% | 0.0470 | 0.0446 |
| 4,096/request batch | 113.5% | 113.7% | 0.0298 | 0.0301 |

Each column is a separately calculated median. CPU utilization increases on the
small-batch workload because the nodes process more transactions per second;
median CPU time per committed transaction falls about 5.2%. Large-batch CPU cost
is essentially unchanged. This does not measure GPU utilization, power or energy.
The enhancement does not establish that GPU beats CPU for small batches.

## Implementation

Profiling found that GPU execution took roughly 7.5–7.9 ms for 1–4,096 signatures,
while packing/unpacking 100 records took about 0.1 ms combined. The long per-thread
elliptic-curve calculation left much of the GPU idle on small batches.

The cooperative path executes three dependent stages:

1. Prepare scalar metadata and the curve-point lookup table independently, with
   disjoint writes. Separate SIMD groups handle the two tasks even for a singleton.
2. Compute the generator term and the two signed GLV curve-point terms independently.
3. Combine the three Jacobian points, then normalize the result to the same public
   key format as the previous implementation.

The existing field/scalar arithmetic is unchanged. A Jacobian addition helper
handles infinity, equal points, inverse points and general additions. There are no
floating-point cryptographic operations or atomic updates. MLX dependencies order
the stages; transaction results are still returned and applied in input order.

Automatic selection depends only on batch size:

- 1–2,048: cooperative path, optimized for latency.
- 2,049–8,191: previous two-kernel direct path.
- 8,192 and above: previous five-kernel batched path, used by large microbenchmarks.

The node still bounds recovery batches at 4,096. HYBRID automatically benefits when
its GPU portion falls in the cooperative range. The 2,048 crossover was measured on
this M5 Max; other Apple GPUs may have different performance crossovers. GPU mode
continues to recover transaction signatures entirely on GPU, with no CPU fallback.

## Validation and reproduction

Differential checks passed for 65,829 recovery vectors (65,610 accepted, 219 rejected)
through all three kernel paths; 33,568 arithmetic comparisons; 10,008 GLV decompositions;
and 2,051 Jacobian additions against an independent Python affine-point oracle.
Repeated dispatches, invalid signatures, shuffled/duplicate records and boundaries
at 2,047/2,048/2,049 are checked. This is consistency evidence on the tested device,
not a cryptographic audit or proof across all GPU/compiler versions.

The node checks cover CPU/GPU/HYBRID state and receipt equivalence, mixed-backend
replay, worker kill/freeze/restart, sequencer/follower restart and cleanup. The 15
network emergency scenarios also run against the enhanced GPU implementation.

```sh
make bench-mlx-latency
make test-verification
python3 scripts/test_emergencies.py

# Paired full-network benchmark, same executable and frozen previous worker:
python3 scripts/benchmark_network.py --backend gpu --rpc-batch 100 \
  --transactions 16384 --repeat 5 --compare target/release/sfc \
  --baseline-gpu-worker experiments/mlx_ecdsa/reference_node/worker.py
```

Use `--rpc-batch 4096 --transactions 65536 --repeat 3` for the large-batch comparison.
Raw reports include timings, validation and source/executable hashes:

- [Recovery latency and correctness](gpu-enhancement-latency-2026-10-20.json)
- [Small-batch network TPS and CPU](gpu-enhancement-small-network-2026-10-20.jsonl)
- [Large-batch network TPS and CPU](gpu-enhancement-large-network-2026-10-20.jsonl)
- [Emergency tests](gpu-enhancement-emergencies-2026-10-20.json)
