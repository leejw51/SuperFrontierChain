# Byte pipeline changes — 2026-10-21

Release, one node, native MLX GPU, SQLite ON, Capnp TCP, 12 Rayon workers,
1,048,576 transfers/run, 4,096-entry batches, one in-flight batch, 10 ms scheduler.
Baseline binary: commit 38f3204. Candidate includes shared RPC payload slabs,
borrowed signature-recovery inputs and detachment on partial admission/revalidation.

| Run | Baseline committed TPS | Candidate committed TPS | Baseline CPU | Candidate CPU |
| --- | ---: | ---: | ---: | ---: |
| 1 | 234,700 | 240,849 | 266.2% | 269.4% |
| 2 | 235,043 | 237,939 | 268.3% | 266.0% |
| 3 | 180,020 | 151,197 | 217.4% | 213.5% |
| Median | 234,700 | 237,939 | 266.2% | 266.0% |

The median is 1.38% higher, but **this does not establish a reproducible TPS gain**.
The candidate's third run is worse, and run-to-run variation greatly exceeds the
median difference. Baseline and candidate groups ran sequentially, not randomized
or interleaved. Do not attribute the variation to thermal throttling without telemetry.

What is established by code: bulk payload allocation is per batch rather than per
transaction on the fully accepted path, and a 97-byte signature recovery record is
borrowed via a reference instead of cloned into another input vector. Raw payload
bytes still cross the local-task/blocking-task boundary once; MLX still copies its
input staging buffer. Live memory is not measured. Partial batches detach surviving
bytes to avoid pinning a large rejected payload through a small accepted transaction.

73 standard release tests, the CPU/GPU/HYBRID parity test, and three native
benchmark/recovery/replication tests passed. The final admission-lifetime change was
followed by the full standard suite and all three native tests. Release Clippy with
-D warnings, formatting and diff whitespace checks passed. Consensus root format
and block hashing did not change.

Timing excludes transaction signing, includes verification/execution/Merkle updates/
synchronous RocksDB commits, and checks SQLite catch-up after timing. CPU excludes
the Rust load generator and uses 100% per core. Reports for this session were written
to /tmp/sfc-bytes-before.capnp and /tmp/sfc-bytes-final.capnp (temporary artifacts).
