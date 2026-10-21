# Binary transport benchmark — 2026-10-20

Direct Cap’n Proto RPC/TCP was faster than the HTTP/3 implementation on this
Apple M5 Max loopback test. TCP remains the default; HTTP/3 remains selectable.
Both carry the identical typed Cap’n Proto bulk API and original signed RLP bytes.
Ethereum JSON-RPC is not used for submission, commitment polling or state checks.

Release build, native in-process Rust/MLX GPU verification (no Python), 12 Rayon
workers, 262,144 signed transfers per trial, 4,096 transactions per request,
10 ms block interval. Each run uses a fresh chain and the same cached fixture.
Signing and raw-byte preparation occur before timing. Timed work includes RPC,
GPU signature verification, ordered admission, execution and synchronous RocksDB
WAL commit; the two-node case also waits for durable follower replay. Final
balances, nonces, receipt success, full persisted block digests and verification
routing/counters are checked. SQLite indexing runs concurrently when enabled;
catch-up is checked separately after timing, not included in TPS.

Median results, transport order alternated between trials:

| Nodes | SQLite | TCP TPS | HTTP/3 TPS | TCP node CPU | HTTP/3 node CPU |
|---|---|---:|---:|---:|---:|
| 1 (5 trials each) | ON | 170,832 | 153,794 | 211.1% | 207.2% |
| 1 (5 trials each) | OFF | 178,202 | 161,963 | 127.8% | 126.0% |
| 2 (3 trials each) | ON | 121,473 | 113,713 | 342.0% | 365.2% |
| 2 (3 trials each) | OFF | 128,594 | 119,808 | 171.3% | 197.4% |

CPU 100% means one logical core. Node CPU sums all node processes, including MLX
host threads, and excludes the load generator. The generator is measured separately:
for one node its median CPU time was 0.060/0.051 seconds (TCP, SQLite ON/OFF),
versus 0.301/0.282 seconds (HTTP/3). TCP gains about 10–11% for one node and 7%
for two nodes. The highest individual one-node result was 183,178 TPS, SQLite OFF;
this does not establish a sustained maximum or exceed 200,000 TPS.

This is a comparison of these implementations, not a general claim that TCP is
faster on real WAN links. TCP is restricted to loopback and unencrypted; HTTP/3
uses pinned TLS/QUIC and currently bridges an ordered RPC tunnel through bounded
buffers. Encryption, QUIC processing and bridge copies are plausible sources of
the additional cost, but these timings do not isolate each cause. Network latency,
packet loss and cross-host performance have not been measured in this comparison.

Raw length-framed Cap’n Proto reports:

- `target/binary-transport-comparison.capnp` — 20 trials (one node).
- `target/binary-transport-two-nodes.capnp` — 12 trials (two nodes).

Each report includes executable hash, transport, GPU runtime, TPS, admission time,
CPU seconds, transaction count and verification counters. The benchmarked node
binary is the release build prior to dashboard asset regeneration; subsequent
changes only affect CLI reporting, documentation and dashboard assets.

Reproduce (reports append; choose a fresh report path for each comparison):

```sh
make bench-transports BENCH_REPEAT=5 BENCH_SQLITE=both BENCH_NODES=1 \
  TRANSPORT_REPORT=target/transport-one-node.capnp
make bench-transports BENCH_REPEAT=3 BENCH_SQLITE=both BENCH_NODES=2 \
  TRANSPORT_REPORT=target/transport-two-node.capnp
make benchmark BENCH_TRANSPORT=http3
make bench-network BENCH_TRANSPORT=http3 SYNC_TRANSPORT=http3
make stresstest BENCH_TRANSPORT=tcp
make stop
```

The dedicated `submitTransactions` API rejects empty/oversized batches and follower
writes, preserves nonce order and per-item errors, and supports idempotent pending
transaction resubmission. Tests cover both transports, malformed transactions,
duplicate handling, missing/committed receipts, persistent restart, duplicate-run
ownership, SQLite ON/OFF/ON and forced node death followed by WAL recovery.

Validation of the final code: 69 standard release tests passed; all three native
benchmark integration tests and the native MLX CPU-parity/cross-thread test also
passed. Release Clippy with `-D warnings`, dashboard build and `git diff --check`
passed. The dependency `block 0.1.6` still emits Cargo's future-compatibility notice.
The preserved `.sfc-stress-v3` chain was not restarted after isolated benchmarks:
the project volume had only 4.3 GiB free at completion, so an unlimited write-heavy
stress run would quickly exhaust the remaining space. No chain data was removed.

## Hyperliquid target and ordered admission — 2026-10-21

The engineering target is to exceed Hyperliquid under comparable workload,
network, consensus/finality and durability conditions. Hyperliquid's official
[HyperCore overview](https://hyperliquid.gitbook.io/hyperliquid-docs/hypercore/overview)
states approximately **200,000 orders per second**. That is not an Ethereum
transfer-TPS number. SFC's development sequencer/follower benchmark does not yet
establish an equivalent order-book workload or multi-validator BFT performance.
Exceeding 200,000 verified transfers/sec is an intermediate milestone, not proof
of outperforming Hyperliquid as an L1.

The binary service now caches the immutable chain ID and shared verifier when a
connection opens. GPU verification can start without first waiting for the node
state mutex, overlapping block production. A bounded per-connection admission
queue consumes completed verification jobs in RPC arrival order. It admits at
most two queued jobs plus one active job and starts no GPU work when queue
capacity is unavailable. The queue survives an individual response cancellation
until its accepted job finishes; no late verification result is assigned to a
different request. Followers reject submissions before verification.

The load generator exposes `--inflight 1|2` (`BENCH_INFLIGHT` in Make). Two requests
can run concurrently while nonce admission remains ordered. Under mempool
pressure, the fixture driver retries a nonce-gap suffix only after observing an
earlier full-mempool rejection; final balances/nonces and verification counters
remain mandatory. **The default stays 1**: window 2 was slower in the measured
single-account transfer workload.

Three alternating old/new comparisons used the same Rust driver, 262,144
transfers, native MLX, TCP, 12 Rayon threads, 4,096-record batches and durable
commits. Median results:

| SQLite | Before TPS | After TPS | Before node CPU | After node CPU |
|---|---:|---:|---:|---:|
| ON | 170,365 | 240,153 | 211.3% | 262.6% |
| OFF | 177,347 | 253,890 | 124.8% | 180.1% |

This is approximately **41% / 43% more TPS**, with higher CPU utilization as the
node does more work per second. The short rounds take approximately 1–1.5 seconds;
they are not a sustained production-capacity claim. The separate window sweep
produced median TPS of 239,871/254,528 (window 1, SQLite ON/OFF), versus
206,252/220,611 (window 2).

Raw reports: `target/pipeline-before-after.capnp` (12 rounds) and
`target/pipeline-comparison.capnp` (12 rounds). The baseline node is saved as
`target/pre-pipeline-sfc`. Reports retain executable hashes and in-flight window.
Longer runs can now select up to 1,048,576 transfers per round, without changing
per-request, mempool or block limits.

### Longer workload check

Three rounds per mode, **1,048,576 transfers** per round, same native MLX and
12-thread configuration, median values:

| Nodes | Transport | SQLite | Committed TPS | Node CPU |
|---|---|---|---:|---:|
| 1 | TCP | ON | 241,525 | 273.4% |
| 1 | TCP | OFF | 249,553 | 187.9% |
| 1 | HTTP/3 | ON | 180,673 | 233.8% |
| 1 | HTTP/3 | OFF | 207,284 | 169.7% |
| 2 | TCP | ON | 118,692 | 355.3% |
| 2 | TCP | OFF | 113,899 | 166.7% |

TCP remains the default. Single-node TCP rounds lasted about 4.2–4.3 seconds;
two-node rounds lasted about 8.8–9.2 seconds (medians). These larger rounds still
do not establish sustained production throughput. Two-node results include a
SQLite-ON outlier of 72,778 TPS, so they do not establish that indexing improves
throughput. Both processes share one physical GPU and machine. Follower replay is
a remaining throughput limit, and multi-validator BFT remains unmeasured.

Raw reports: `target/pipeline-million-transfers.capnp` (12 rounds),
`target/pipeline-million-two-nodes.capnp` (6 rounds). The 200k-transfer/s
single-node milestone is achieved; the Hyperliquid-equivalent L1 target is **not**
achieved or demonstrated by these measurements.

A related long-run bug was corrected: TCP and HTTP/3 previously closed every RPC session
at 60 seconds, even if active. Sessions now last until disconnect; the existing
32-connection limit remains. A 70-second live session regression covers both transports,
along with pipeline nonce-order tests and forced partial admission with a
16-transaction mempool. No chain hashes, signature checks, block limits or durable
write settings were weakened.

Next acceptance gates for the broader goal: multi-host follower performance,
comparable order/cancel/matching workloads, multi-validator BFT finality under
latency/loss/faults, and long-duration throughput/latency/CPU measurements. Any
future claim of beating Hyperliquid must specify these conditions, not substitute
single-node transfer TPS for order-book throughput.
