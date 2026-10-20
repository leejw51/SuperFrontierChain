# CPU consumption: CPU versus MLX GPU recovery — 2026-10-20

**Historical baseline:** these measurements used the original GPU prototype.
See [MLX-OPTIMIZATION.md](MLX-OPTIMIZATION.md) for the optimized kernel's throughput
and CPU cost. Re-running this benchmark now uses the optimized implementation.

**The GPU prototype substantially reduces verifier process CPU consumption, but
increases recovery latency and lowers maximum throughput.** It remains an isolated
experiment; the production node still uses CPU libsecp256k1.

Measured on Apple M5 Max with 18 logical CPUs, macOS 27.0.1, Python 3.13.15 and
MLX 0.32.4. Values below are medians across three trials, using 4,096 signatures
per batch. Each scenario randomizes backend order with a recorded fixed seed.

## Same verification load

Each backend receives 32 batches at 102.4 ms intervals: an offered load of
40,000 recoveries/sec. Actual completed rates were approximately 39,939–39,972/sec,
including the final pacing sleep. All paths kept up. CPU percentages include
all process threads, with **100% meaning one fully occupied CPU core**, following
the macOS process convention. They are not percentages of the entire machine.

| Backend | Process CPU usage | CPU-ms per 1,000 recoveries | Median batch latency |
| --- | ---: | ---: | ---: |
| CPU, 2 workers | 79.4% | 19.88 | 40.75 ms |
| CPU, 4 workers | 99.9% | 25.02 | 25.79 ms |
| CPU, 8 workers | 127.6% | 31.94 | 17.74 ms |
| CPU, 18 workers | 142.6% | 35.70 | 11.82 ms |
| MLX GPU, including host processing | **25.2%** | **6.31** | **67.69 ms** |

At the same load, GPU host processing consumes about **68% less CPU time than
two workers**, and **82% less than eighteen workers**. However, each GPU batch
takes about 1.66 times as long as two CPU workers, and 5.73 times as long as
eighteen workers. Latency starts at batch dispatch; it excludes the time needed
to collect a batch from individually arriving transactions.

## Maximum throughput

Each trial executes 128 batches continuously without intentional pacing.
Do not compare these raw CPU percentages as if they performed equal work per
second: throughput differs substantially. CPU time per recovery corrects for that.

| Backend | Process CPU usage | CPU-ms per 1,000 recoveries | Recoveries/sec | Median batch latency |
| --- | ---: | ---: | ---: | ---: |
| CPU, 2 workers | 199.5% | 16.12 | 123,757 | 33.09 ms |
| CPU, 4 workers | 397.8% | 16.88 | 235,742 | 17.35 ms |
| CPU, 8 workers | 792.9% | 18.49 | 429,090 | 9.52 ms |
| CPU, 18 workers | 1,703.0% | 21.87 | 778,626 | 5.22 ms |
| MLX GPU, including host processing | 26.7% | 3.76 | 70,896 | 57.50 ms |

The GPU uses less CPU time per recovery but is approximately eleven times slower
than the eighteen-worker CPU path at saturation. The lower saturated CPU cost
per recovery compared with paced operation also shows that cost depends on the
workload. CPU/GPU frequencies and scheduler behavior were not instrumented, so
these measurements do not identify the cause of that difference.

## Concurrent EVM execution

A separate Rust process continuously executes the same valid 512-transfer block
from the same genesis state, checking its block hash on every iteration. This
isolates execution contention. It is not a growing chain, and excludes signing,
signature verification, persistence, networking and consensus.

Verifier load remains 40,000 recoveries/sec. The EVM child uses approximately one
CPU core in every configuration; its CPU time is separate from verifier CPU time.

| Verifier backend | Verifier CPU usage | Concurrent EVM executions, transactions/sec |
| --- | ---: | ---: |
| No verifier, EVM control | — | 510,858 |
| CPU, 2 workers | 66.9% | 499,667 |
| CPU, 4 workers | 68.5% | 501,845 |
| CPU, 8 workers | 76.6% | 504,352 |
| CPU, 18 workers | 88.3% | 502,809 |
| MLX GPU | 15.2% | 508,927 |

The GPU leaves more CPU capacity available, but improves this particular EVM
workload by only about 1–2% over CPU verification. There are many spare cores at
this offered load; a large execution speedup is not demonstrated. These numbers
must not be quoted as blockchain/network TPS. The concurrent experiment also
has different verifier timing from the otherwise idle, paced experiment above.

## Explicit asynchronous overlap

Seven trials compare the same GPU recovery batch plus nineteen independent EVM
block executions (9,728 transfers), sequentially versus with `mx.async_eval`.
All recovered keys and EVM block hashes are checked.

| Scheduling | Median total wall time | GPU host CPU time | EVM child CPU time |
| --- | ---: | ---: | ---: |
| Wait for GPU, then execute EVM | 74.77 ms | 15.89 ms | 18.95 ms |
| Submit GPU, execute EVM, then wait for GPU | 56.63 ms | 15.32 ms | 19.11 ms |

Overlapping independent work reduces combined elapsed time by about **24%**
(1.32 times faster), without making the GPU recovery kernel itself faster.
This demonstrates useful overlap with a separate execution process. It does
not demonstrate a safe production-node schedule for dependent transactions.

## Measurement boundaries and validation

The CPU oracle uses `CLOCK_PROCESS_CPUTIME_ID`; the Python GPU host uses
`time.process_time()`. Both count user and system CPU time charged to every thread
in that process. GPU execution time and sleeping are excluded from CPU seconds;
they remain included in elapsed time. CPU-side GPU packing, dispatch, synchronization
and public-key formatting are included. GPU host CPU is therefore not zero.

Both verification paths start with identical hex-encoded digest/signature inputs
and produce uncompressed public-key hex strings. They enforce the same low-S and
parity policy. They exclude RLP, Keccak/address derivation and node processing.
The same 4,096 distinct signed fixtures are reused between batches. Startup,
fixture signing, compilation, worker creation and correctness warmup are outside
steady-state timing. Workers are persistent and cleaned up on completion/error.

Before timing, all **4,389 recovery vectors** and **2,560 modular arithmetic
comparisons** passed, including malformed inputs and ordering checks. Timed CPU
and GPU requests also check their final output. Rust formatting and workspace
Clippy passed. This change adds benchmark tools and a development-only clock
dependency; it does not modify node execution or consensus.

These are short, single-machine trials without CPU pinning or thermal/frequency
control. Paced scheduling occasionally started up to roughly 5 ms late without
EVM work and 10 ms late with it; raw samples record these delays. Process CPU time
does not measure all OS/driver CPU activity, GPU utilization, total device power,
energy, or whole-node CPU consumption. Lower process CPU use alone does not prove
lower power consumption.

Raw samples, correctness results, source/executable/fixture hashes and environment:
[mlx-cpu-usage-results-2026-10-20.json](mlx-cpu-usage-results-2026-10-20.json).

## Reproduce

```sh
make bench-mlx-cpu
# Or, after setup and building the example:
target/mlx-venv/bin/python experiments/mlx_ecdsa/cpu_usage.py \
  --output target/mlx-ecdsa/cpu-usage.json
```

For the current low-latency node, retain CPU verification. Two or four workers
can reduce CPU usage at moderate load, while additional workers provide higher
peak throughput. GPU offloading becomes a candidate when spare CPU capacity is
more valuable than this prototype's latency and throughput; broader kernel
optimization and validation would be required before production integration.
