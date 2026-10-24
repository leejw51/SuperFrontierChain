# Protocol v3 binary formats

Default homes are `~/.superfrontierchain/node`, `~/.superfrontierchain/testnet`
and `~/.superfrontierchain/stress`. Older repository-local homes are preserved.
Protocol v1/v2 and earlier flat-state-hash chains require a fresh home: they are
separate histories even though the development Ethereum chain ID is still 7777.
See [Merkle commitment compatibility](MERKLE-TRIE.md) before reusing existing data.

## Encoding boundaries

| Data | Encoding |
| --- | --- |
| Ethereum HTTP RPC request/response | JSON-RPC |
| Peer HTTP/3 and TCP RPC | Typed `chain.capnp`; `getEncodedBlocks` carries canonical block bytes |
| GPU recovery IPC | Typed `runtime.capnp` request/response; packed UInt32 limbs and binary public keys |
| Node configuration | JSONL, one top-level field per line |
| Genesis, metadata, signing guard | Typed `runtime.capnp.Record` |
| Supervisor network manifest | JSONL, one node configuration per line |
| Runtime info, supervisor status, dynamic presentation/log fields | Cap’n Proto `Value` |
| RocksDB blocks, accounts, world and SQLite headers/receipts | Typed canonical `storage.capnp` segments |
| SQLite block, receipt and log payloads | Cap’n Proto BLOB |
| SQLite search columns | Native SQL integers/text; signed Ethereum transactions are BLOBs |
| Dashboard stats/index API | `application/x-capnp`, decoded in the browser |
| History, structured logs, stress reports | Length-framed Cap’n Proto records |
| Supervisor control socket | Length-framed Cap’n Proto |

Immutable blocks own shared `Bytes` backed by a canonical Cap’n Proto arena.
Readers borrow transaction and receipt fields directly. Peer synchronization copies
one block payload at the RPC/thread boundary and shares its transaction slices;
it does not rebuild a `WireBlock` or per-transaction byte vectors. Followers verify
signatures, execute the block, and compare the entire canonical result before commit.
Transaction ownership is shared through admission/execution/block construction.

Domain records implement explicit typed codecs. Generic `Serialize → Value → Capnp`
encoding is gone. Dynamic dashboard/log fields still use the schema-defined `Value`
union directly; `serde_json::Value` is an in-memory presentation type, not JSON text.
Historical index headers without gas metadata retain an unknown gas value (shown as a dash). New headers store the actual committed gas total.

Serde deserialization also reads editable JSONL configuration, legacy binary Value
records during compatible metadata migration, and external test fixtures.

The default native Rust/MLX GPU path uses reusable shared buffers directly,
without a Python worker, socket transport or Capnp wrapping. Rust writes 25
little-endian UInt32 limbs per signature and reads 17-word results after GPU completion.
It validates output statuses and SEC1 curve points before deriving addresses.
This runtime change does not alter chain encoding or commitments.

The optional legacy MLX worker's GPU inputs contain 25 little-endian UInt32 limbs per signature (digest, r, s, parity).
Rust writes directly into pre-sized Capnp Data and streams the message segments
without flattening them into a second payload buffer. NumPy views the Python Data
buffer before MLX transfer. GPU responses use contiguous rows of 17 little-endian
UInt32 words (status, x, y), avoiding per-key Python byte objects and Capnp lists.
Rust borrows the response from a reusable receive buffer, checks row counts and
statuses, and validates SEC1 curve points before deriving addresses. The new
response is explicitly requested with `packedResults`; older clients and workers
can use the existing key list. It does not change stored block/state formats.

There is no production hex round trip. CPU and GPU arithmetic is unchanged. EVM
execution still needs mutable state and decoded transaction fields: this is not an
allocation-free VM. Native GPU input preparation and result decoding still touch
memory; EVM and persistence also allocate and copy. This is not end-to-end zero copy.

Ethereum RLP, ABI, EVM code, cryptographic signatures/preimages, TLS certificates,
and RocksDB/SQLite native files keep their required encodings. Human terminal
diagnostics remain readable text. Package manifests, Solidity compiler input,
and historical benchmark reports are external tooling or archived artifacts.

## Hashes and bounds

Object keys are sorted before encoding. Block hashes use canonical Cap’n Proto
segment bytes prefixed by `sfc/block/v3/capnp`. State roots use the incremental
[Merkle Patricia commitment](MERKLE-TRIE.md) with canonical account segments.
Blocks/accounts/world/receipts store raw canonical single segments. Other runtime
records include the standard unpacked segment table. Block history frames hold raw
segments; use `scripts/sfc_codec.py FILE --blocks` to inspect them.
Map ordering, state/block hash vectors, restart/replay, and CPU/GPU agreement are
covered by tests. Future schema additions that affect commitments require a
deliberate protocol upgrade; automatic storage migration does not authorize them.

Streams add an eight-byte little-endian byte length before each message. Runtime
records are bounded to 256 MiB and nesting to 64. GPU requests are bounded to
2 MiB/4,096 inputs; responses to 1 MiB, with request ID/count/protocol validation.
Control messages are limited to 64 KiB. Truncated frames fail; the node's log
writer repairs only an incomplete final frame before appending.

## Tools

```sh
make codec-setup          # Python Cap’n Proto tooling, including CPU-only hosts
make mlx-setup            # optional legacy Python MLX worker only
make stresstest          # persistent default stress home; continuous GPU release test
make stop
python3 scripts/sfc_codec.py ~/.superfrontierchain/stress/node-0/config.jsonl
python3 scripts/sfc_codec.py ~/.superfrontierchain/stress/results.capnp --stream
python3 scripts/sfc_codec.py ~/.superfrontierchain/stress/node-0/data/logs/node.capnp --stream
```

Edit a stopped node's `config.jsonl` directly, or use the shared adapter:

```sh
target/mlx-venv/bin/python - <<'PY'
import sys
from pathlib import Path
sys.path.insert(0, 'scripts')
import sfc_codec as codec
path = Path.home() / '.superfrontierchain/node/config.jsonl'
config = codec.read(path)
config['verification']['backend'] = 'cpu'
codec.write(path, config)
PY
```

`sfc peer-status` writes one binary message to stdout; redirect it to a `.capnp`
file and inspect it using the same tool. Dashboard APIs can be fetched to a file
in the same way. Rust build generates all three schema bindings; `npm run build:dashboard`
regenerates the JavaScript schema and embeds the browser decoder.

`make test-codec` verifies Rust → Python → JavaScript → Rust compatibility,
including maximum-width integers, Unicode, multiple segments, and malformed frames.
`cargo test --test codec --test determinism --test migrations` covers canonical
encoding, hash vectors, legacy rejection, and transactional schema upgrades.

## Compatible schema upgrades within v3

RocksDB schema 4 upgrades genesis/head/version metadata after checking
the existing state commitment. New receipt indexes use raw 32-byte hash keys and
eight-byte little-endian heights; legacy hexadecimal keys and Cap’n Proto heights
remain readable. Expired indexes are reclaimed during compaction after durable
block deletion. Blocks move to a separate column family in bounded atomic batches;
interrupted moves resume before startup exposes the chain. Block encodings and
protocol-v3 hashes are unchanged. Signer schema 2 validates and
rewrites identity/vote records in one synchronous batch, retaining the double-sign
guard. Legacy `config.capnp` files remain readable; the node writes a JSONL companion
when one is absent. Configuration writes and compatible genesis upgrades use a
synced temporary file and atomic rename. These upgrades do not change v3 block or state hashes. Unknown newer
versions fail without rewriting data. Protocol-v1/v2 chain histories remain separate.

## Validation and performance

`cargo test --test binary_blocks --test migrations` checks borrowed payloads,
canonical bytes, corrupt inputs, restart and compatible metadata upgrades.
`cargo run --release --example codec_benchmark` compares selective JSON queries,
full decode, borrowed reads, complete Capnp validation, encoding and allocations.
Do not interpret field-access speedups as TPS multipliers: with 4,096 transactions
per block and a 100 ms interval, scheduling alone limits sustained throughput to
roughly 40,960 TPS. `STRESS_INTERVAL=10 make stresstest` tests a shorter interval;
compare CPU cost, durability and indexer lag as well as throughput.
