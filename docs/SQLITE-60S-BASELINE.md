# SQLite schema-5 sustained-load baseline (2026-10-24)

This run fails the sustained 200,000 TPS goal. It tests the retained compact
schema, ascending address indexes, 256 MiB page cache, memory-backed temporary
journals, and direct batches bounded by 128 blocks / approximately 64 MiB / two
seconds. No admission-unlock or explicit ROLLBACK-policy experiment is included.

The fresh `/tmp` home ran 20 rounds of 1,048,576 signed transfers with native
MLX GPU verification, 12 Rayon threads, TCP batches of 4,096, inflight 1,
10 ms blocks, SQLite ON/direct, and **60-second block retention**. RocksDB
commits use synced WAL; SQLite remains WAL/NORMAL and retains all records.
No CPU sampler, build or test suite ran during measured rounds. Four lightweight
dashboard probes sampled pruning and index state. Signing occurs outside the
measured rounds; final SQLite flush and integrity checking are also outside TPS.

| Measurement | Result |
| --- | ---: |
| Measured transactions | 20,971,520 |
| Sum of measured round durations | 261.249 seconds |
| Aggregate TPS | 80,274 |
| First round TPS | 158,008 |
| Final round TPS | 37,271 |
| Last five rounds, aggregate TPS | 44,157 |
| Minimum round TPS | 32,393 |
| Peak observed WAL size | 14,229,849,672 bytes |
| RESTART checkpoint attempts / busy results | 116 / 104 |
| Longest checkpoint operation | 12.150 seconds |

The four probes reported zero pruning cutoff lag and zero RocksDB background
errors. The earliest retained block advanced from 0 to 1,675, then 4,481 and
6,527, proving block expiry occurred during this run. SQLite skipped-block
counters stayed zero. These are sparse observations, not proof that no transient
pruning lag ever occurred.

After clean shutdown, SQLite contained **20,971,521 transactions**, including
the initial transaction. Metadata matched the actual row count, skipped blocks
were zero, and full `PRAGMA integrity_check` returned `ok`. Writer metrics record
**three recovered errors**, not zero; their messages were not retained after
successful retries, so their exact causes are unknown. No checkpoint fallback
occurred. Preserve error causes in future diagnostics.

Total phase times were preparation 14.330 s, INSERT 115.452 s, COMMIT 49.903 s,
and RocksDB commit 18.293 s. Concurrent checkpoint time was 227.139 s and must
not be added to the writer/elapsed totals. Repeated busy RESTARTs and WAL growth
coincided with the severe late-run decline. This supports investigating WAL
recycling coordination; it does not prove that WAL recycling is the only cause.

Next, coordinate the checkpoint connection with direct batch COMMIT boundaries
so a pending RESTART can obtain a writer-idle window before the next BEGIN.
Preserve synchronous INSERT ordering, error recovery, all SQLite records and
synced chain WAL. Record retained error causes and measure the coordinated
candidate against this 60-second baseline. The earlier five-round improvements
are insufficient evidence of sustained performance.

Evidence: `sqlite-v5-60s-2026-10-24.csv` and
`sqlite-v5-60s-summary-2026-10-24.json`.

## Coordinated checkpoint candidate

The next candidate reserves a writer-idle window before RESTART. A shared gate
records an active direct transaction and a pending restart request. The writer
announces COMMIT/rollback, and its next BEGIN waits until RESTART finishes.
PASSIVE remains concurrent. Reader lock waiting still has a 250 ms timeout;
transaction completion and checkpoint I/O are not bounded by that timeout.
Worker shutdown wakes the gate, and a terminated worker cannot indefinitely
block the next BEGIN. INSERTs remain synchronous, with no block-job queue.

The exact same 20-round, 60-second-retention workload on another fresh home gave:

| Measurement | Uncoordinated | Coordinated |
| --- | ---: | ---: |
| Aggregate TPS | 80,274 | 84,696 |
| Last five rounds TPS | 44,157 | 62,036 |
| Minimum round TPS | 32,393 | 55,459 |
| Peak observed WAL bytes | 14,229,849,672 | 1,849,064,272 |
| RESTART attempts / busy | 116 / 104 | 42 / 0 |
| Writer errors | 3 | 0 |

The coordinated run took 247.609 measured seconds. It retained all 20,971,521
rows including initialization, with matching metadata, zero skipped blocks,
zero checkpoint fallbacks and full `integrity_check = ok`. Two live probes
showed advancing pruning floors, zero cutoff lag and zero RocksDB background
errors. These sparse samples do not rule out every transient delay.

Preparation took 14.516 s, INSERT 84.657 s, COMMIT 33.720 s and RocksDB commit
13.197 s. The newly separated `checkpoint_wait_us` recorded **65.467 seconds**
waiting before BEGIN. Checkpoint elapsed time includes its wait for the active
transaction and overlaps writer work; it is not pure I/O time and must not be
added to the phase totals. WAL recycling is more predictable, but this candidate
still fails sustained 200,000 TPS, and database-growth slowdown remains.

The gate, held-reader snapshot and worker-fallback unit tests passed. The
indexer/migration/pruning integration suites passed 30 tests, with one ignored
subprocess helper. A failure-injection assertion verifies `last_error` persists
after successful replay even though the active error file is removed. Clippy,
formatting and release build passed. The change is retained for reduced WAL
growth and improved late-run behavior, not as proof of the throughput goal.

Evidence: `checkpoint-gate-60s-2026-10-24.csv` and
`checkpoint-gate-60s-summary-2026-10-24.json`.

## Pruning-boundary recovery guard (after these measurements)

Direct mode now tracks its last committed SQLite height separately from the
connection's in-transaction cursor. Before production or import advances the
retention cutoff past an uncommitted source block, it catches up and commits the
SQL batch. Failed catch-up refuses the chain advance and preserves the source
for retry. The earliest pending source timestamp is cached within a batch to
avoid rereading its block on every production step. SQLite itself is not pruned.

Tests cover a two-second retention window with a nine-second timestamp jump,
an independent SQLite reader seeing the row before source expiry, failure and
retry without advancing the chain, and the follower import path. A subprocess
exits without running destructors after expiry; reopening still finds the
transaction even though its RocksDB source block is gone. This tests process
exit, not sudden power loss; SQLite remains WAL/NORMAL.

The complete workspace suite passed 108 tests with 11 ignored helpers/opt-in
tests. Clippy, formatting, release build and generated HTML documentation passed.
The measurements above predate this guard. No new throughput claim is made for
the final source state, and the sustained 200,000 TPS objective remains open.
