# SFC Merkle Patricia state commitment

New chains use a persistent binary Merkle Patricia trie, not the previous hash of
one serialized World. This is an SFC format, **not Ethereum's hexary RLP MPT** and
not compatible with `eth_getProof`.

Keys are Keccak-256(`sfc/merkle-patricia/v1` || 0x03 || namespace || name).
Namespaces are account (0, UTF-8 canonical address), module (1, UTF-8 key), and
BLOCKHASH window (2, big-endian uint64 height). Account values are canonical typed
Cap'n Proto account segments, including code and storage. Module values are UTF-8
bytes; block-window values are 32-byte hashes. No JSON participates in commitments.

With D = ASCII `sfc/merkle-patricia/v1`, all concatenations are byte concatenations:

- Empty root: Keccak-256(D || 0x00).
- Leaf: Keccak-256(D || 0x01 || key[32] || Keccak-256(value)[32]).
- Branch: Keccak-256(D || 0x02 || splitBit[u16 big endian] || left[32] || right[32]).

Bits are numbered 0..255, most significant first. Unary paths are compressed;
branches split at the first differing bit, and split bits increase down a path.
Insertion order does not affect the root. Deletion collapses unary branches.
Immutable Arc nodes share unchanged subtrees across World snapshots. Changed
accounts only serialize their own Cap'n Proto value and rehash their affected
paths. Module and block-window changes also update their own paths.

World's public mutable maps require a change-detection scan. Snapshot map cloning,
EVM database conversion and account comparisons are still proportional to state
size. An account's contract storage is inside its value: changing one slot currently
re-encodes that account; there is no separate storage-slot trie/proof yet. This is
not a claim of fully logarithmic end-to-end state execution.

`World::account_proof(address)` and `merkle::Trie::prove(key)` provide inclusion and
absence proofs in Rust. Verify against a trusted root with `Proof::verify`, supplying
canonical account bytes for inclusion or None for absence. Proofs commit ordered
sibling hashes and the terminal leaf. The verifier bounds depth, requires increasing
split bits, and checks terminal-leaf routing. No public proof RPC is added yet.

RocksDB durably stores account state and the block root together using the existing
atomic WAL batch. The derived in-memory trie is rebuilt from persisted state on
restart; the rebuilt root must match the committed head. Trie nodes themselves and
historical proofs are not separately persisted. SQLite remains an asynchronous
explorer projection, not an input to state commitments.

## Compatibility

This changes consensus hashes. New RocksDB databases record
`meta/state_commitment = sfc/merkle-patricia/v1`. Existing flat-hash databases are
rejected before schema migration; their historical blocks and hashes are preserved.
Normal schema migrations remain enabled for compatible Merkle chains. An automatic
schema migration cannot transparently change a chain's historical consensus hashes.

`make stresstest` now uses `.sfc-stress-merkle-v1`; `.sfc-stress-v3` is preserved.
The old 237k/241k TPS numbers measured the flat-hash state commitment and must not
be presented as Merkle-trie benchmark results. Re-measure with the new binary.

## Validation and release measurement (2026-10-21)

73 standard release tests and three explicitly enabled native benchmark tests
passed. Coverage includes an independent sorted-rebuild trie oracle across 600
insert/update/delete operations, insertion-order independence, membership and
absence proofs, tampering, a split at bit 255, snapshots, typed state round trips,
legacy-chain rejection, durable restart, two-node TCP/HTTP3 replay, SQLite toggling
and forced process death. Release Clippy (`-D warnings`) passed.

Fresh one-node homes, native MLX GPU, SQLite ON, Capnp RPC TCP, 12 Rayon threads,
4,096 transactions/batch, one in-flight batch, 10 ms scheduler interval and
1,048,576 signed transfers per run:

| Run | Committed TPS | Node CPU (100% = one core) |
| --- | ---: | ---: |
| 1 | 243,072 | 273.2% |
| 2 | 195,265 | 227.4% |
| 3 | 201,617 | 230.5% |

Median: **201,617 TPS**, CPU **230.5%**. This includes Merkle-root updates and
synchronous RocksDB commits. Signing is outside timing; SQLite catch-up is checked
after timing. These are short transfer workloads with a small account set, not a
large-state scalability test, sustained throughput guarantee or BFT/order-book
benchmark. One run fell below 200k TPS. The prior flat-hash runs were not interleaved
with these runs, so their difference cannot isolate the Merkle trie overhead.

The explicitly enabled native GPU verification test also passed: CPU, GPU and
HYBRID produce identical transaction ordering, errors, Merkle state and replay.
