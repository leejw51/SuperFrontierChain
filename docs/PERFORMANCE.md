# Performance measurements

Latest native MLX/Cap’n Proto investigation:
[projection sync stalls, indexer isolation and dispatch tuning](SPECIFICATION.md#11-throughput-stall-investigation-and-follow-up-2026-10-22).
The dated comparisons below retain their original workloads and persistence policies.

Latest GPU enhancement: [cooperative recovery, paired TPS and CPU measurements](GPU-ENHANCEMENT.md).

Original node backend comparison: [CPU/GPU/HYBRID TPS and CPU usage](VERIFICATION-BACKENDS.md).
The signature-recovery microbenchmarks are separate from committed network TPS.


## Direct SQLite writes and batch diagnosis (2026-10-24)

At the user's request, `make stresstest2` now selects direct SQLite writes from
block production/import. Bare `sfc run` retains its background writer; the direct
flag is `--sqlite-direct`. SQLite OFF still disables indexing entirely. Direct
mode has no block-job queue or separate SQL writer. The producer waits for SQL,
and records cumulative microsecond timings in `sqlite-write-profile.json`.
A failed index operation reports an error and retries its cursor; it cannot
roll back an already authoritative RocksDB commit.

A 10-round, 1,048,576-transfer-per-round diagnostic with one SQLite COMMIT per
block measured **27,497 committed TPS**, falling to **20,585 TPS over the last
five rounds** (minimum 16,895). SQLite contained all 10,485,761 transactions,
including the initial funding transaction; skipped pruned blocks and index
errors were both zero. This contrasts with the much higher asynchronous chain
TPS measurements below, whose SQLite ingestion was incomplete.

| Cumulative direct-write phase | Time |
| --- | ---: |
| Row preparation | 6.639 s |
| INSERT and metadata updates | 37.484 s |
| SQLite COMMIT, including automatic checkpoints | 305.432 s |
| RocksDB commit | 6.959 s |

The longest SQLite COMMIT was 1.999 seconds. A 3-second stack sample confirmed
`sqlite3WalDefaultHook → sqlite3WalCheckpoint → fsync` on the producer path.
The run included sampling and lightweight phase profiling; it is diagnostic,
not an isolated steady-state benchmark. WAL was enabled, SQLite rows were not
pruned, and RocksDB retained its synced WAL and 60-second pruning.

The next candidate executes INSERTs directly but groups COMMIT across up to
16 blocks, approximately 8 MiB or 100 ms. Thresholds are checked after each block,
including empty blocks; there is no independent 100 ms timer or hard latency bound.
Clean shutdown also commits the remainder. One large block remains atomic.
Rows and durable cursors publish together. Uncommitted rows are invisible to
other SQLite connections. Tests cover direct error recovery, complete batch
rollback/replay, explicit flush, shutdown flush, and restart. The comparison
uses the same 256 MiB checkpoint trigger and 64 MiB cache.

This corrected batching candidate has **not yet been performance-validated**.
An earlier batch trial was stopped after discovering redundant per-block
SAVEPOINTs and premature empty-block commits; those have been removed. Its
partial results are excluded from the completed-run comparisons. The sustained
200,000 TPS target with complete SQLite indexing remains open.

Completed SQLite diagnostic runs are included in
[sustained-tps-2026-10-24.csv](sustained-tps-2026-10-24.csv), with distinct
`sqlite-append`, `sqlite-checkpoint`, `sqlite-rayon-queue` and `sqlite-direct`
candidate names. `sqlite-direct` is the 10-round per-block COMMIT run, not the
unmeasured batching candidate.

## SQLite append-only and asynchronous writer investigation (2026-10-24)

`make stresstest` now defaults to SQLite OFF; `make stresstest2` runs the same
workload with SQLite ON. `STRESS_ROUNDS=50` makes either run finite; zero remains
continuous. Both retain the existing GPU, 60-second RocksDB pruning and durable
WAL settings.

SQLite block/transaction/receipt/log rows no longer expire. The writer uses WAL
with NORMAL synchronization, prepared statements and atomic batch cursor/count
updates. A block commit sends only a nonblocking coalesced notification. The
SQLite worker reads from its durable cursor without acquiring the execution
mutex. Notification count is not a job count; a full one-slot queue already
represents pending work. A 100 ms fallback also discovers log-only updates.
A regression test holds a SQLite write transaction open while 40 blocks commit,
then verifies complete catch-up and restart without duplicate rows.

| Candidate, SQLite ON | All 50 rounds | Last 20 rounds | SQLite transactions at stop | Skipped pruned blocks |
| --- | ---: | ---: | ---: | ---: |
| Append-only, 16 MiB checkpoint trigger | 216,856 TPS | 194,076 TPS | 7,094,273 | 16,511 |
| Append-only, 256 MiB trigger, 64 MiB cache | 218,794 TPS | 199,743 TPS | 8,777,729 | 15,280 |
| Same settings + Rayon preparation + coalesced notification | 219,976 TPS | 203,099 TPS | 8,736,769 | 15,956 |

Each run committed 52,428,800 transfers. These are committed-chain rates, **not
SQLite ingestion rates**. The indexer lagged behind the 60-second block window;
append-only means already indexed rows are retained, not that all committed
transactions were indexed. The skipped-block counter makes that gap visible.
The first candidate included a 5-second stack sample and is diagnostic. It
observed 2,263 of 3,320 SQLite-thread samples in checkpoint `fsync` (about 68%);
this does not mean 68% of whole-process time. Increasing the trigger amortizes
checkpoint work, but these measurements still miss the sustained target.

A dedicated two-thread Rayon pool for block/receipt row preparation and the
nonblocking notification queue did not materially increase indexed transaction
count in this sequential comparison. The last-20-round chain rate passed 200,000
TPS, but individual rounds still dipped below it and indexing remained incomplete. SQL INSERT/COMMIT remain
on one writer: WAL permits concurrent readers but only one writer at a time
([SQLite WAL concurrency](https://sqlite.org/wal.html#concurrency)). The queue does
not store an unbounded copy of blocks, and it does not promise replay of blocks
that expired before indexing. NORMAL retains the existing power-loss tradeoff:
recent index commits may be lost, and only retained source records can be rebuilt.

## Sustained 200,000 TPS investigation (2026-10-24)

The target is sustained committed throughput after retention starts, with GPU
verification, SQLite ON, 60-second retention and synced RocksDB WAL. An early
peak or a whole-run average above 200,000 TPS is not sufficient evidence.

The current storage layout isolates block values in a `blocks` column family
and uses 35-byte binary receipt keys with 8-byte height values. Schema version 4
migrates existing blocks in restartable, synced batches; old hexadecimal receipt
indexes remain readable. A single atomic WAL batch still commits the block,
state, head and receipt indexes across column families.

The retention worker now durably deletes expired blocks and advances its floor.
Receipt lookups require the referenced block to exist. Compaction reclaims stale
receipt indexes below the durable floor, avoiding one random tombstone per
expired transaction. Physical index reclamation follows compaction rather than
a strict 60-second disk-space deadline. Block snapshots remain available through
the separate block column family.

A late-run stack sample identified foreground RocksDB skip-list insertion as a
major commit cost. Most sampled `fsync` calls belonged to the asynchronous SQLite
thread, so their total cannot be attributed to foreground WAL latency. Smaller
index memtables and alternative insertion strategies are being measured.

| Candidate | Rounds | All rounds | Rounds 11 onward | Last 20 rounds |
| --- | ---: | ---: | ---: | ---: |
| Separate block CF + compact indexes + compaction expiry | 50 | 212,159 | 203,391 | 193,223 |
| 8 MiB index memtable + sorted index writes | 50 | 211,412 | 202,061 | 187,894 |
| Hash memtable, SQLite ON | 50 | 214,005 | 204,122 | 192,431 |
| Hash memtable, SQLite ON, 256 MiB SQLite cache | 50 | 197,712 | 186,224 | 170,973 |
| Same executable, SQLite OFF | 50 | **270,793** | **270,768** | **270,506** |

Rates are total transfers divided by measured seconds, in TPS. The first run
included a 5-second stack sample and is diagnostic. These sequential runs do
not establish sustained 200,000 TPS with SQLite ON. Sorting and the 256 MiB SQLite
cache experiment were rejected. The cache change was reverted; the normal
SQLite connection settings were unchanged at that stage. The later command split
uses `make stresstest` for SQLite OFF and `make stresstest2` for SQLite ON.

**SQLite OFF maintained more than 200,000 TPS in every one of 50 rounds.** Its
minimum round was 262,410 TPS, with 52,428,800 total transfers. The interval from
the first to last result timestamp was 263.4 seconds (including inter-round
preparation). A mid-run dashboard probe observed zero retention-cutoff lag and
zero RocksDB background errors. This is a sparse observation, not a lag bound.
The same release executable was used for the preceding ON/cache and OFF runs.
SQLite indexing was the only changed benchmark option. The comparison strongly
implicates SQLite indexing's resource contention in the late slowdown, but does
not quantify CPU versus disk contributions or prove indefinite stability.

The current default-CF hash memtable uses full keys as hash prefixes, 65,536
buckets, an 8 MiB write buffer and serialized insertion. Account, migration and
emptiness scans explicitly request total-order iteration so short metadata keys
and accounts in different buckets remain visible. The block CF keeps its
ordinary skip-list memtable. Hash memtables alone did not resolve SQLite-ON
slowdown. Tests cover account scans before/after flush and reopen, receipt lookup,
pruning, atomic migration and recovery.

Raw per-round results: [sustained-tps-2026-10-24.csv](sustained-tps-2026-10-24.csv).
Reproduce the OFF comparison with a fresh disposable home:

```sh
RAYON_NUM_THREADS=12 ./target/release/sfc-bench run \
  --binary ./target/release/sfc --home /tmp/sfc-sqlite-off-comparison \
  --transactions 1048576 --rounds 50 --rpc-batch 4096 --interval 10 \
  --backend gpu --gpu-runtime mlx-native --transport tcp --inflight 1 \
  --sqlite off --output /tmp/sfc-sqlite-off-results.capnp
```

Each round submits 1,048,576 signed transfers in RPC batches of 4,096 using TCP,
12 Rayon workers, native MLX, a 10 ms production interval and one in-flight batch.
Signing/preparation is outside the timer. The timer ends at the last durable
receipt; asynchronous SQLite catch-up is not fully included. Temporary database
homes were fresh for each run. These results concern this native-transfer
workload and do not establish general contract or production capacity.

The older sections below describe the implementations measured at their dates;
in particular, their per-receipt tombstone deletion has been superseded.

## Dedicated bounded retention worker (2026-10-24)

The server now starts one `sfc-retention` thread. It owns an `Arc<Store>` and
never acquires the node/admission mutex. Each pass deletes up to four blocks or
reaches approximately 1 MiB of deletion records (a single block remains atomic,
so the byte threshold can be exceeded by that block), then waits 5 ms before
more backlog work. When caught up it waits 50 ms. There is no per-block job queue.

The worker copies the head and releases its read lock before pruning. An internal
prune mutex serializes cleanup only; production skips it while the worker is
active. Segment cleanup releases the projection-writer lock before filesystem
I/O. Foreground block commit and history projection remain ordered and synchronous;
WAL sync, signature verification, execution and SQLite indexing are unchanged.
This removes expiration work from the node lock but does not eliminate shared
RocksDB writer serialization or shared-disk contention.

Deletion batches still atomically remove blocks and receipt indexes with a synced
WAL. The earliest-history hint advances only after success. An unfinished bounded
pass does not mark its cutoff complete. Receipt lookups now read their hash index
and block from the same RocksDB snapshot. Startup drains outstanding expiry and
repairs history; direct library users retain synchronous `maintain()` unless they
explicitly start a worker. Server shutdown signals and joins the worker. A worker
I/O error or panic reaches the server's main select loop and stops the server.

Physical expiry is asynchronous and can lag under load. Dashboard storage stats
expose `retention_worker_active`, `retained_history_floor`, and
`retention_completed_cutoff`. These are individual observations, not an atomic
snapshot of all dashboard fields. They allow operators to detect cleanup backlog.

### Same 25-round workload

| Measurement | Previous reset run | Dedicated worker |
| --- | ---: | ---: |
| All rounds, total transfers / measured seconds | 198,260 TPS | 192,577 TPS |
| Rounds 1–10 | 256,585 TPS | 259,585 TPS |
| Rounds 11–25 | 172,169 TPS | 164,302 TPS |
| Minimum round | 104,562 TPS | 105,503 TPS |

**This implementation isolates deletion from admission, but does not demonstrate
a throughput improvement or sustained 200,000 TPS.** The runs were sequential,
not interleaved. Two dashboard probes during the worker run observed completed
cutoffs 1 second and 0 seconds behind `headTimestamp - 60`; these sparse probes
are not a worst-case lag bound. Late-round slowdown persisted even when cleanup
was caught up. Do not attribute the result to signature verification or claim
that thread separation removes disk contention.

Raw metrics: [background-pruning-2026-10-24.csv](background-pruning-2026-10-24.csv).
Measured release executable SHA-256:
`b7aa4385054fb47a0a4b35cfbfdea253cb37a758e191c16f17811b570b435e9f`.
The workload and reproduction command below are unchanged.

Regression coverage includes bounded deletion/restart, an intentionally blocked
pruner while commit/projection continue, old snapshots, live and expired receipt
lookups, worker I/O failure, worker shutdown/restart, and SIGKILL during background
expiry followed by WAL recovery. The full suite passed 89 tests before adding the
additional passing background-SIGKILL test (90 distinct passing Rust tests total).

## Fresh-DB slowdown diagnosis (2026-10-24)

Resetting the actual default stress DB did not remove the sustained slowdown.
With the retained-history scan fix, 25 rounds averaged **198,260 TPS**: rounds
1–10 averaged **256,585 TPS**, while rounds 11–25 averaged **172,169 TPS**.
These averages are total transfers divided by total measured time.

A separate 25-round diagnostic run instrumented `Node::produce` and sampled its
stacks. The first and last 1,000 produced blocks had these cumulative costs:

| Work | First 1,000 blocks | Last 1,000 blocks |
| --- | ---: | ---: |
| Transactions in those blocks | 1,888,257 | 2,138,112 |
| Execution/building the block | 2.067 s | 2.364 s |
| Durable commit | 2.140 s | 7.919 s |
| Pending revalidation/bookkeeping | 0.042 s | 0.048 s |
| History projection and pruning | 0.063 s | 3.369 s |

Execution cost per transaction stayed close to constant. Commit and maintenance
costs grew sharply; the longest maintenance call took **1.403 s**. Stack samples
identified `prune_at → WriteBatch → MemTableInserter::DeleteCF` and skip-list
insertion: expiry deletes one randomly keyed receipt index per transaction.
`Node::produce` holds the shared node mutex through maintenance, so these pauses
also block transaction admission. The earlier scan fix avoids revisiting deleted
blocks, but does not remove this per-receipt deletion work.

The reset run's RocksDB log recorded **159 compactions**, **29.224 GB** of
compaction output, and **92.290 s** of summed compaction job time. This is
background job time, not a measurement of foreground stall time. Block values
and random receipt indexes share one column family; compaction, synced WAL
writes, history projection and asynchronous SQLite indexing share the disk.
Stack samples confirm deletion/compaction/sync activity but do not establish an
exact percentage of lost throughput attributable to each subsystem.

### Larger-buffer comparison (rejected)

A fresh 25-round run increased the RocksDB write buffer from 64 to 256 MiB and
the base level size from 256 MiB to 1 GiB. It reduced compaction output to
17.289 GB across 28 jobs, but did **not** improve sustained throughput:

| Run | All 25 rounds | Rounds 1–10 | Rounds 11–25 |
| --- | ---: | ---: | ---: |
| Actual stress home after reset | 198,260 TPS | 256,585 TPS | 172,169 TPS |
| Separate diagnostic run (timing + stack sample) | 187,734 TPS | 255,648 TPS | 159,488 TPS |
| Larger buffer/base level | 181,497 TPS | 253,287 TPS | 152,653 TPS |

These are sequential diagnostic runs, not an interleaved statistical comparison.
The larger-buffer settings were reverted; no unproven tuning remains in storage.
Raw round metrics: [storage-slowdown-2026-10-24.csv](storage-slowdown-2026-10-24.csv).

The remaining design issue is the cost of random per-transaction expiry while
holding the node lock, combined with durable commit I/O. Reducing compaction
bytes alone did not fix it. A structural follow-up should evaluate partitioning
receipt indexes by retention window so expiry can remove bounded ranges/segments,
while preserving receipt lookups, atomic commit, snapshots and crash recovery.
Moving maintenance out of the lock by itself is insufficient: prior trials
increased admission retries and pending revalidation. Sustained 200,000 TPS
remains unachieved; the timing instrumentation was removed after diagnosis.

## Retained-history scan fix (2026-10-24)

A persistent stress run exposed a pruning regression hidden by fresh, short runs.
After the 60-second retention boundary, each maintenance pass sought from the
beginning of `block/`. RocksDB had to traverse and decompress deleted SST records
until background compaction removed them. Stack sampling identified this seek
path; individual maintenance pauses reached roughly 350–456 ms while block
execution was normally around 4–5 ms.

Storage now remembers a lower bound for retained history, advances it only after
successful durable deletion, and reconstructs it on open. Pruning, history lists,
earliest-height reads and indexer snapshots start at that bound. The indexer loads
the bound before taking its snapshot so it cannot skip records retained by an older
snapshot. A completed retention cutoff is checked once per block timestamp second;
failed cleanup remains retryable. Receipt deletion uses fixed-width keys.
The synced WAL, 60-second retention, block limits and SQLite indexing remain enabled.
No storage schema or serialized block format changes are required.

### Sustained measurement and remaining limit

One local release node, native MLX GPU, Cap’n Proto TCP, SQLite ON, 12 Rayon
threads, 4,096-entry batches, one in-flight batch, 10 ms block interval and
1,048,576 transfers per round. Both runs started with separate fresh homes.
Signing and startup are outside the timer; signature verification, execution and
durable receipt availability are inside. SQLite indexing runs asynchronously.

| Measurement | Before | After |
| --- | ---: | ---: |
| Completed rounds | 12 | 25 |
| Minimum round TPS | 20,443 | 98,784 |
| Median round TPS | 242,724 | 217,882 |
| Total transfers / total measured seconds | 126,030 | 194,332 |
| Rounds 11 onward: total transfers / measured seconds | 36,460 (2 rounds) | 165,825 (15 rounds) |

**Sustained 200,000 TPS is not achieved.** The severe repeated-scan collapse is
removed in this comparison, but the final run still ranges from 98,784 to 271,367
TPS. Remaining deletion, compaction and disk synchronization costs affect later
rounds. The higher initial medians are not sustained throughput guarantees.
The runs are not interleaved or equal-duration; the baseline used temporary
per-block timing instrumentation and stack samples. Treat these as diagnostic
observations, not a controlled speedup ratio.

All completed round measurements are in
[retention-throughput-2026-10-24.csv](retention-throughput-2026-10-24.csv).
The baseline is commit `b4a8011` plus diagnostic timing; its executable SHA-256 is
`76d1eeeadefb1ff5d76d2935479bce773de0e7a36efad0b0943876e128faf5d1`.
The final measured executable SHA-256 is
`86e556c6b1b8a64b39f5f58aa6c64007db157d5312e0f728303c760d8ca18f7b`.

Reproduce without touching the default stress home (choose a new directory for
an independent run):

```sh
make release
RAYON_NUM_THREADS=12 ./target/release/sfc-bench run \
  --binary ./target/release/sfc --home /tmp/sfc-retention-check \
  --transactions 1048576 --rounds 25 --rpc-batch 4096 --interval 10 \
  --backend gpu --gpu-runtime mlx-native --transport tcp --inflight 1 --sqlite on
```

Validation: 85 standard Rust tests passed, 10 optional tests ignored; strict
Clippy and formatting checks passed. Coverage includes repeated pruning, equal
timestamps, old snapshots, restart recovery, receipt expiry and killed-process
journal recovery. The user's existing stress data was preserved.

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
