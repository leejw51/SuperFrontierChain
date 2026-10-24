# Automatic storage migrations

Within protocol v3, nodes upgrade known older storage schemas automatically at startup. No delete,
reset, or manual SQL command is needed. An unversioned **protocol-v3** database is schema v0. Protocol-v1 JSON and protocol-v2 chains and indexes are rejected, not migrated in place.
Run the rebuilt binary normally (`make start`, `make run`, or `make stresstest`).
Only one process may own the node's RocksDB directory.

| Database | Version marker | Current version | Upgrade |
| --- | --- | --- | --- |
| Chain RocksDB | `meta/schema_version` (Cap’n Proto integer) | 4 | Validate state; normalize metadata; enable compact receipt indexes; move blocks to a separate column family in resumable batches. |
| Signer RocksDB | `meta/schema_version` (Cap’n Proto integer) | 2 | Validate identity and stored vote; atomically upgrade typed records while preserving the anti-double-sign guard. |
| SQLite index | `PRAGMA user_version` | 5 | v0→v1 adopts/creates the original schema; v1→v2 adds and backfills `blocks.transaction_count` and its populated-block index; v2→v3 converts block headers to typed segments in bounded batches within one transaction; v3→v4 converts transaction keys to binary and clusters rows by height/position; v4→v5 rebuilds address indexes in ascending height/position order. |

Implementation is in `crates/sfc/src/schema.rs`; signer-specific validation is in
`consensus.rs`. RocksDB migrations run before normal state loading and pruning.
SQLite migrations finish before the indexing thread or HTTP server starts serving.
The chain and index migrate independently; if SQLite fails after RocksDB succeeds,
correct the reported problem and restart. The completed RocksDB upgrade is skipped.

RocksDB metadata normalization uses a synchronous WAL-backed WriteBatch.
The schema-4 block move uses batches of at most 256 blocks or approximately 8 MiB
(a block is not split). Each batch atomically puts block bytes in the `blocks`
column family and deletes their default-CF copies. The version stays at 3 until
the last batch commits version 4. On restart, remaining default-CF keys provide
the resume position; previously moved blocks stay readable. State, head and
receipt indexes remain in the default CF, and new block commits update both CFs
in one synced WAL batch. Serialized blocks, transaction bytes, hashes and state commitments
are preserved. SQLite uses an immediate transaction with WAL and synchronous FULL
for the upgrade: DDL, backfill, indexes and version commit together. Normal indexing
then returns to synchronous NORMAL. A failed or interrupted SQLite upgrade rolls
back and is retried at the next startup. Neither migration resets index cursors,
logs, receipts, transactions, or pruned-history metadata.

SQLite schema 4 stores transaction hashes and addresses as binary keys in a
`WITHOUT ROWID` table keyed by `(height, position)`. An eight-byte hash-prefix
index narrows exact lookups; full hash comparisons and uniqueness triggers
preserve correctness when prefixes collide. Raw transactions and receipts are
copied unchanged. The v3→v4 migration validates hexadecimal keys and copies the
whole transaction table within one atomic transaction. It needs temporary space
for the replacement table, indexes and WAL; it is not a resumable chunked upgrade.
Malformed keys or duplicate decoded hashes roll the migration back without
changing the original table or version. SQLite rows are never pruned.

SQLite schema 5 rebuilds the sender and recipient indexes with ascending height
and position keys to improve append insertion. Search still returns descending
height/position order. The two indexes and version change in one transaction;
transaction bytes, receipts, counters and cursors are unchanged. Existing schema-4
homes upgrade automatically, including indexes created by development builds.
Index rebuilding requires temporary disk space and delays startup.

Chain schema 3 writes receipt lookup keys as the three bytes `tx/` followed by
32 raw hash bytes, with an eight-byte little-endian block height. The reader and
expiry compaction filter also accept schema-2 keys (`tx/` plus 64 hexadecimal
characters) and their Cap’n Proto height values. Existing keys are not rewritten;
new commits use the compact form. The version marker prevents old binaries from
silently missing new receipt entries. Block and state encodings are unchanged.

Logical receipt expiry follows durable block deletion. Obsolete receipt indexes
are reclaimed during RocksDB compaction rather than by individual deletion writes.
The compaction filter never removes block/state records and keeps malformed index
values instead of guessing their heights. Old hash indexes may remain physically
present until compaction; receipt queries still return missing for deleted blocks.

An unknown newer schema fails startup with the stored and supported versions.
The program does not downgrade, silently rebuild, or guess how to convert it.
Malformed data also fails with an error; it is not discarded. Schema versions
are exposed in RocksDB dashboard statistics (`schema_version`) and SQLite index
responses (`schemaVersion`). Completed upgrades emit `schema_migrated` events.
Chain migration logs occur before the file logger is initialized and therefore
appear on startup stderr; the stress supervisor captures them in its node log.

Chain RocksDB requires `meta/protocol_version = 3` (four-byte little-endian marker).
SQLite requires `PRAGMA application_id = 0x53464333` on populated databases.
New homes are separate from old data. Consensus hashes changed for protocol v3;
see [binary formats](CAPNP-V3.md). The schema version numbers are scoped to that
protocol, so an old JSON database with the same schema number is incompatible.

## Adding a schema change

Automatic migration means running **explicit conversions shipped with the new
binary**, not inferring arbitrary schema changes. For each future change:

1. Increment that database's version constant and add the next conversion.
2. Keep old migrations so existing installations can upgrade across versions.
3. Write the new version atomically with the converted data. Do not issue
   nontransactional SQL or split a RocksDB migration across untracked batches.
4. For a large RocksDB rewrite, add a resumable, versioned migration design before
   using multiple batches; the current small metadata/account migration is atomic.
5. Test preservation, repeat startup, invalid data, newer versions, and interruption.
6. Any new application database must migrate inside its normal open/start path,
   before serving readers or starting background writers. Automatic migration is
   the default for every database; do not require an opt-in flag or manual command.

Storage migrations do not authorize changes to consensus serialization, block
hashing, state-root rules, or chain identity. Those require a separate protocol
upgrade design. Do not restore an older signer database: that can undo its
anti-double-sign protection.

## Verification

`cargo test --lib schema::tests` tests process termination before SQLite migration
commit, rollback, retry, and integrity. `cargo test --test migrations` covers
legacy account conversion, block-hash preservation, RocksDB process-kill recovery,
SQLite v0/v1/v2/v3/v4 upgrades, failure rollback, newer-version rejection, repeated
startup, and signer protection. Existing journal, indexer and GPU stress lifecycle
tests also exercise the migrated stores.
