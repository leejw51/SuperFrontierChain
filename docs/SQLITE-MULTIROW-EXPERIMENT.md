# SQLite multirow INSERT experiment (2026-10-24)

This is an intermediate diagnostic, not validation of sustained 200,000 TPS.
Both fresh-chain runs used GPU MLX, 12 Rayon threads, SQLite ON/direct,
synced RocksDB WAL, 5-second block retention, 10 ms block interval,
1,048,576 transactions per round, TCP batches of 4,096, and inflight 1.
SQLite uses WAL/NORMAL and is never pruned. These five-round runs do not
establish the goal's 60-second retention or long-run performance.

Both candidates use the pending schema-4 compact binary keys, clustered
transaction table, prefix hash index with full-hash uniqueness triggers,
and direct batches bounded by 128 blocks, 64 MiB or 500 ms at block boundaries.
The second candidate inserts up to 128 rows per SQL statement instead of one.

| Measurement | Single-row INSERT | 128-row INSERT |
| --- | ---: | ---: |
| First round TPS | 40,014 | 107,390 |
| Last round TPS | 30,544 | 62,308 |
| Total INSERT time | 115.071 s | 37.040 s |
| Total COMMIT time | 14.071 s | 10.383 s |
| Peak observed WAL | 1,794,651,432 bytes | 2,565,631,152 bytes |

Raw per-round results are in `sqlite-multirow-2026-10-24.csv`.
Multirow execution substantially reduces INSERT time, but throughput still
declines as the index grows. Statement/trigger overhead is a plausible
contributor; these timings alone do not isolate all sources of INSERT cost.
Checkpoint time overlaps writer time and must not be added to elapsed time.

After clean shutdown, the multirow run contains 5,242,881 transaction rows
(five measured rounds plus the initial transaction), with matching metadata,
zero skipped blocks, zero write errors and zero checkpoint fallbacks.
SQLite `integrity_check` returns `ok`. The pruning and indexer integration
suites pass all 15 tests, including rollback across multiple INSERT chunks,
exact hash collision handling and SQLite preservation after block pruning.

Next investigation: profile the remaining INSERT cost and cache behavior as
the random hash index outgrows the 64 MiB writer cache. Do not interpret this
short-run improvement as completion of the sustained-throughput objective.

## 256 MiB cache comparison

A fresh run with only the writer cache target changed from 64 to 256 MiB
recorded 102,595 / 97,060 / 89,443 / 83,424 / 75,522 TPS across five rounds.
Aggregate throughput (total transactions / total measured seconds) increased
from 77,632.58 to 88,560.64 TPS; final-round throughput improved by about 21%.
The current candidate retains the 256 MiB cache target, adding up to 192 MiB
of configured cache capacity per writer connection. This is not a process
memory limit. A single run per candidate cannot quantify measurement variance.

INSERT time fell from 37.040 to 29.104 seconds and COMMIT time from 10.383 to
7.997 seconds. Peak observed WAL was 1,523,093,992 bytes. All 5,242,881 rows
were present after shutdown, matching the metadata, with zero skipped blocks,
zero writer errors, zero checkpoint fallbacks and `integrity_check = ok`.
The result supports cache sensitivity but does not isolate the remaining
INSERT cost. Profile that cost before choosing the next structural change.
The 60-second retention and sustained 200,000 TPS acceptance gates remain unmet.

## Statement-journal profile

A separate 60-second-retention diagnostic run was sampled for five seconds
with macOS `sample`; its TPS is excluded from the comparisons above. Writer
stacks repeatedly show `sqlite3_step → sqlite3VdbeExec → sqlite3BtreeInsert →
subjournalPageIfRequired → unixWrite → pwrite`. This identifies temporary
statement rollback journal I/O inside the INSERT phase, independently of the
concurrent WAL checkpoint writes.

In the bundled SQLite 3.51.3 source, `sqlite3BtreeBeginTrans` passes
`sqlite3TempInMemory(db)` to `sqlite3PagerBegin`, and `openSubJournal` disables
disk spilling when `subjInMemory` is set. The next candidate therefore sets
`temp_store=MEMORY` on the index writer. WAL and synchronous settings are
unchanged; statement rollback is retained. Temporary journal pages consume
additional memory, so the page-cache target is not a total memory bound.

The unprofiled five-round comparison with 5-second retention recorded
142,584 / 131,624 / 118,817 / 108,251 / 98,277 TPS. Aggregate throughput rose
from 88,560.64 to 117,812.60 TPS (about 33%). INSERT time decreased from
29.104 to 16.709 seconds; COMMIT time was 6.626 seconds. Peak sampled WAL was
1,567,388,112 bytes. After shutdown, all 5,242,881 transaction rows matched
metadata, skipped blocks/errors/checkpoint fallbacks were zero, and SQLite
`integrity_check` returned `ok`. The indexer, migration and pruning integration
suites passed 29 tests with one ignored test, including chunk rollback/replay.

Throughput still falls with database growth and remains below the goal.
`main.rs` currently holds the node mutex across `Node::produce`, including
direct SQLite indexing. This serializes admission with SQLite I/O. A follow-up
must preserve synchronous writer ordering and rollback/replay semantics while
allowing admission during the SQL phase; queueing or silently skipping rows
would not establish the requested result.

## Rejected admission-unlock experiment

A producer-owned synchronous writer released the node mutex after chain commit,
performed SQL on the same producer task, and completed indexing before producing
the next block. A concurrency test held a competing SQLite write transaction and
verified that admission succeeded while the producer waited, then verified both
transactions were indexed in order. That test and 15 existing indexer/pruning
tests passed.

However, the fresh five-round 5-second-retention run measured
111,863 / 102,848 / 94,038 / 84,208 / 80,363 TPS, aggregate 93,256.61 TPS,
about 21% below the retained temporary-memory-journal candidate. Node CPU rose
to 187–210% of one core. INSERT took 17.627 seconds and COMMIT 7.751 seconds.
These observations do not isolate the cause of the additional overhead.
All 5,242,881 rows were present with matching metadata, zero skipped blocks,
zero write errors and `integrity_check = ok`.

The producer ownership and mutex changes were reverted; current source retains
the original synchronous Node path. Experimental patches and the concurrency
test are preserved under `/tmp/sfc-throughput-investigation/producer-unlock-*`.
The raw result rows remain in the CSV so this regression is not mistaken for an
accepted optimization. Next investigate statement rollback work inside SQLite;
removing the node lock alone did not improve this workload.

## Rejected explicit ROLLBACK conflict policy

Another fresh five-round run changed transaction INSERTs to `INSERT OR ROLLBACK`
and full-hash uniqueness triggers to `RAISE(ROLLBACK, ...)`. This aligns conflict
handling with the writer's existing whole-batch rollback on error. Bundled
SQLite's compiler marks `RAISE(ABORT)` as potentially needing statement rollback;
the experiment tested whether specifying whole-transaction rollback reduced cost.
The 29 indexer/migration/pruning tests passed, as did an additional assertion that
a duplicate rolled back metadata written earlier in the outer transaction.

TPS was 143,466 / 131,697 / 121,920 / 113,188 / 95,330, aggregate 118,791.88.
This is only 0.83% above the retained 117,812.60 baseline, with a worse final
round. INSERT time was 16.513 seconds versus 16.709; COMMIT was 6.757 versus
6.626. A single comparison does not establish an improvement this small.
All 5,242,881 rows were preserved, skipped blocks/errors/fallbacks were zero,
and `integrity_check` returned `ok`.

The explicit conflict-policy change was reverted. Keep the memory-backed
temporary journal and the original ABORT triggers. Next compare larger bounded
direct batches: the retained run performed 83 commits for 5.24 million rows,
and checkpoint work still overlapped substantial writer time. Retention,
durable chain WAL, full SQLite records and failure recovery remain required.

## Retained two-second direct batch window

Only the direct batch age threshold changed from 500 ms to 2 seconds; the
128-block and approximately 64 MiB input limits remain. Thresholds are checked
at block boundaries, not by an independent timer, and shutdown flushes pending
rows. Background catch-up limits are unchanged. This increases the time before
pending SQL rows become visible to other connections; synced RocksDB remains
authoritative for replay.

The fresh five-round 5-second-retention run measured 147,650 / 135,945 /
128,243 / 130,997 / 127,003 TPS, aggregate 133,568.64 TPS. Relative to the
retained 500 ms candidate, aggregate throughput improved about 13.4% and the
last round about 29.2%. COMMIT count fell from 83 to 28, cumulative COMMIT time
from 6.626 to 4.336 seconds; INSERT time was 16.256 seconds. The change is
retained, but these short trials do not quantify run-to-run variance.

Peak sampled WAL increased from 1,567,388,112 to 2,454,906,152 bytes. Of 52
RESTART checkpoint attempts, 51 reported busy; larger write transactions reduce
opportunities to reset WAL, so long-run WAL growth remains an explicit check.
No checkpoint fallback or writer errors occurred. All 5,242,881 transaction
rows matched metadata after shutdown, skipped blocks were zero, and SQLite
`integrity_check` returned `ok`. Indexer and pruning suites passed all 15 tests.

Separately, `dbstat` on the previous retained 5.24-million-row database reports
330,633,216 bytes for each address index and 110,059,520 for the hash-prefix
index. `index_xinfo` confirms address indexes contain address, descending
height and descending position, without duplicate primary-key columns.
Investigate address-index insertion order and page occupancy next, preserving
descending search results and pagination. Sustained 200,000 TPS with 60-second
retention is still unproven.

## Retained ascending address indexes (SQLite schema 5)

Changing the sender/recipient index keys to ascending height and position,
while preserving descending search order, measured 156,472 / 147,605 /
136,587 / 140,670 / 128,641 TPS. Aggregate throughput was 141,364.82 TPS,
about 5.8% above the two-second-batch baseline. INSERT time fell from 16.256
to 13.849 seconds; COMMIT time was 4.104 seconds. Each address index shrank
from 330,633,216 bytes in the earlier descending-index database to
186,626,048 bytes (about 43.6% smaller). Both databases contain 5,242,881 rows.

After shutdown, all rows matched metadata, no blocks were skipped, no writer
errors or checkpoint fallbacks occurred, and `integrity_check` returned `ok`.
Peak sampled WAL was 2,138,856,832 bytes. Long-run WAL behavior is still unproven.

The measured experimental build used ascending indexes in schema 4 on a fresh
home. The retained implementation adds a separate schema-4-to-5 migration so
existing development databases also receive the new index layout. It rebuilds
both indexes atomically without changing rows or cursors. Fresh homes reach the
same ascending layout through the migrations before workload measurement.
Tests verify sender and recipient pagination across blocks, migration from
populated schema 4, byte-for-byte record preservation and integrity. The indexer,
migration and pruning suites passed 30 tests with one ignored subprocess helper.

This short-run result remains below sustained 200,000 TPS. Preserve the 60-second
retention acceptance requirement and verify the final implementation over a
long run before claiming completion.
