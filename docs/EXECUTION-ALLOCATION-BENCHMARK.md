# Execution allocation optimization — 2026-10-21

Changes: sorted contiguous EVM change sets instead of temporary B-tree allocation;
fixed-width stack buffers for RocksDB transaction index keys; nonblocking ordered
single-transaction Capnp RPC; byte-native Rust load-generator fixtures.

Consensus byte format, state root rules, GPU signature validation and synchronous
RocksDB WAL commits are unchanged. Stable duplicate-account semantics are covered
by a new regression test. Bulk/single nonce ordering is tested on both transports.

## Alternating comparison

Old and new node binaries were run alternately using the same new Rust driver and
identical saved fixture: before/after/before/after/before/after. Each run used a fresh
home, release, one node, native MLX GPU, SQLite ON, Capnp TCP, 12 Rayon threads,
4,096-entry batches, one in-flight batch, 10 ms interval and 262,144 transfers.
The old binary includes the earlier byte-sharing changes but excludes this round's
execution allocation changes. This is not a comparison against the flat-hash chain.

| Pair | Before TPS | After TPS | Before node CPU | After node CPU |
| --- | ---: | ---: | ---: | ---: |
| 1 | 234,933 | 255,109 | 258.1% | 264.0% |
| 2 | 238,714 | 256,272 | 257.7% | 266.0% |
| 3 | 232,264 | 248,386 | 259.5% | 267.2% |
| Median | 234,933 | 255,109 | 258.1% | 266.0% |

Median TPS increased **8.59%**; all three candidate runs exceeded their baseline
partner. Absolute CPU increased about 3.1%; CPU per committed transfer fell about
5.1% using medians. This is a short-run, small-account transfer workload, not a
maximum hardware throughput or large-contract-state scalability claim.

Signing is excluded from the timer; signature verification, execution, Merkle
updates and synchronous commits are included. SQLite indexes asynchronously and
catch-up is verified after timing. CPU counts node cores (100% = one core) and
excludes the driver. Reports: /tmp/sfc-apply-before.capnp and
/tmp/sfc-apply-after.capnp (temporary local session artifacts).

Validation: 74 standard release tests, three native recovery/replication tests,
release Clippy with -D warnings, and formatting/whitespace checks. CPU/GPU/HYBRID
parity also passed on the final code. The GPU kernel and signature rules were not
changed in this round.

## Default-size check

The final binary was also run for 1,048,576 transfers three times with the same
GPU/SQLite/network settings: 252,503 / 207,127 / 205,943 TPS, with node CPU
273.0% / 235.2% / 230.8%. Median: **207,127 TPS**, CPU **235.2%**. These runs
were not interleaved with million-transfer baseline runs, so they do not establish
a long-run speedup. The 255k result above must not be presented as sustained default
stress throughput. Report: /tmp/sfc-speed-million.capnp.
