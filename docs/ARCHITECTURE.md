# SFC architecture

SuperFroniterChain is an MIT-licensed Rust blockchain framework. Its current runtime
is a development sequencer with independently replaying followers. It executes
Ethereum contracts using REVM and synchronizes through Cap’n Proto RPC, with HTTP/3
as the default transport. See [quickstart](QUICKSTART.md) for operating commands and
[protocol](PROTOCOL.md) for the wire interface.

See the [2026-10-20 review](REVIEW-2026-10-20.md) for verified fixes, determinism
evidence, production design gaps, the CometBFT/SDK direction and MLX assessment.

```text
Ethereum clients -- HTTP JSON-RPC --> bounded admission --> pending EVM cache
                                                           |
                                                100 ms block scheduler
                                                           |
                                               single-pass execution
                                                           |
                                               atomic RocksDB commit
                                                           |
                                            durable hourly JSONL projection

Follower -- TLS + QUIC + HTTP/3 -- Cap'n Proto RPC -- block batches
     |                                                   |
     +-- verify ancestry / signatures / replay / root <---+
```

`types`: deterministic ordered state, blocks, receipts and genesis.
`ethereum`: canonical bounded RLP parsing, low-s replay-protected signatures,
secp256k1 recovery, ordered CPU/GPU/HYBRID verification, Shanghai REVM,
account/code/storage conversion.
`framework`: module lifecycle and one-pass block selection/execution. Invalid imported
transactions reject a block; invalid pending entries are dropped during selection.
`journal`: shared explicit RocksDB WAL and synchronous-write policy, automatic WAL
flush, paranoid checks, and absolute-consistency recovery for state and signing records.
`storage`: JSON records, atomic synchronous batches, indexed receipts, seven-day
history pruning, hourly JSONL projection/recovery. Account writes are differential.
Committed head bytes/hash are cached only after a successful durable batch write;
the cached bytes also supply the JSONL projection.
`consensus`: Ed25519 votes, weighted strict >2/3 certificates, equivocation checks,
round locks and process-locked persistent anti-double-sign records.
`network`: typed capability RPC inside an HTTP/3 full-duplex POST body. Quinn handles
QUIC; rustls verifies TLS certificates; h3 provides actual HTTP/3 framing. This is
not raw QUIC mislabeled as HTTP/3. A bounded duplex buffer propagates backpressure. Optional direct TCP uses the same
service and is loopback-only, unencrypted, and disabled by default.
`node`: explicit development sequencer or replaying follower.
`rpc`: bounded HTTP JSON-RPC requests/batches and read-only EVM simulation.

## Runtime boundaries

The Rust node owns execution, admission, persistence, HTTP JSON-RPC, peer RPC, and
the bundled dashboard. Python is process tooling only. A current-thread Tokio
runtime with a LocalSet runs Cap’n Proto's local futures and asynchronous network
I/O. Blocking execution/storage work is dispatched to blocking tasks where used;
shared mutable node state is guarded by a mutex. Some peer service handlers read
storage or admit transactions synchronously under that lock, so contention remains
a performance consideration.

The selected CPU/GPU/HYBRID backend handles independent transaction signature
recovery (GPU by default). CPU parsing uses ordered Rayon work; all modes preserve
input order; EVM execution and durable state mutation remain sequential. A block
contains a deterministic ordered transaction list, not parallel state writes.
Block execution and admission batches reuse one REVM handler while resetting
transaction-local state. Pure HTTP submission batches share this path; mixed RPC
batches retain ordered per-request dispatch. Followers omit the unused pending EVM
cache, but still independently execute and verify every imported block.

### Transaction lifecycle

1. A client submits signed Ethereum bytes over HTTP JSON-RPC or peer RPC.
2. Admission validates encoding, chain ID, signature, nonce, balance, and resource
   limits, using a cached pending EVM state.
3. The sequencer's 100 ms timer selects pending transactions in order and executes
   a candidate block. Reverted contract calls can be included with failed receipts;
   invalid transactions are dropped during local selection.
4. The application computes its state commitment and builds receipts and the block.
5. One durable RocksDB batch commits account deltas, metadata, block, head, and
   receipt indexes. The node updates its in-memory head and pending cache.
6. Maintenance appends the JSONL projection and prunes expired history.
7. Followers request blocks, independently replay them, compare roots, and commit.

The timer skips missed ticks; 100 ms is a configured target, not a guaranteed
latency or finality SLA. Block timestamps are integer seconds.

### Framework extension points

`Application::with_module` registers uniquely named `Module` implementations.
`begin_block` and `end_block` run in registration order around EVM execution and
can update application state. Hooks must be deterministic across nodes. Candidate
execution works on a cloned state so an error before persistence does not commit a
partial application transition. Cross-chain, staking, governance, and bridge
modules are outside the implemented scope.

## Operations and observability

`make start` uses `scripts/service.py` to manage one release node in the background.
A process-held file lock and private Unix socket provide ownership and stop control.
It initializes a new default config when needed, waits for HTTP readiness, and
cleans up failed starts. `make stop` requests graceful shutdown and escalates after
ten seconds. The service does not automatically restart a crashed node.

`make testnet` instead uses `scripts/supervisor.py`: one sequencer and N−1 followers,
shared genesis, individual state directories and TLS identities, separate JSONL
logs, and bounded crash restarts with backoff. Its manifest and status file are
local process-management records, not consensus state. Both managers use Python's
standard library on macOS/Linux.

The dashboard is static HTML/JavaScript embedded in the Rust binary and served at
`/dashboard` on the Ethereum HTTP listener. `/dashboard/stats` reads at most 61
blocks to calculate a recent committed-TPS window and mean block interval. It also
reports head, retention, pending count, state account count, and configured upstream.
Polling is every two seconds with an explicit stale-data state. It does not measure
peer count or follower lag. No additional frontend server or build is needed.

Structured runtime logs serialize one JSON object per stderr line with timestamp,
level, event, process ID, and event fields. Process managers append node output to
`node.jsonl`; logs are not automatically rotated. Runtime logging is best-effort
and separate from durable blockchain records.

## Trust and failure model

The node does not use consensus votes to choose blocks. Followers trust a configured
sequencer's TLS identity and re-execute its blocks; this is not Byzantine consensus.
A malicious trusted sequencer could choose a different valid history. Multi-validator
finality needs a reactor, durable lock/WAL recovery and adversarial network validation.
Do not equate the tested consensus library with a deployed consensus network.

State execution occurs before persistence. A commit writes changed accounts, state
metadata, block, head height and transaction indexes atomically with WAL sync enabled.
If JSONL maintenance fails after a commit, the sequencer stops; restart reconstructs
the projection from committed records. No automatic acceptance of unverified snapshots.
Mempool contents are volatile; a submitted transaction is not durable until mined.
Admission validates exact sequential nonces; replacement and nonce-gap queues are
not implemented. Contract reverts are included with failed receipts and charged gas.

The application and DB use deterministic SFC commitments, not Ethereum's trie roots.
Timestamp fields exposed to the EVM are integer seconds. At 100 ms cadence adjacent
blocks can share a timestamp. Development PREVRANDAO is zero; it is not randomness.

## Resource bounds

Raw transaction: 128 KiB. Raw block transactions: 2 MiB. Raw pending pool: 64 MiB.
HTTP request: 5 MiB; JSON-RPC batch: 4,096 items. Peer connections: 32. QUIC concurrent
bidirectional streams: 8. RPC reader nesting and traversal are bounded. Sync requests
return at most 64 blocks and stop near 2 MiB raw transaction payload. These are
resource bounds, not a complete public-network DoS defense. Listeners are local only.

## Remaining scaling work

State commitments still serialize the complete ordered state. EVM preparation loads
current accounts into an in-memory cache and block isolation clones state. Startup
projection repair is linear in retained history and currently builds it in memory.
Large states and long archives therefore need incremental authenticated state and
streaming repair before production. JSONL is not an independent import format yet.
The selected verifier recovers independent transaction signatures. JSON-RPC batch
authentication runs without holding the state mutex; ordered admission, EVM execution
and state queries still use it. Imported blocks verify signatures in parallel before
sequential replay. Parallel EVM execution is deferred until deterministic conflict
handling is proven. Indexed collection preserves result order, and a strict block
batch reports the first invalid transaction in input order regardless of worker count.

## RocksDB journaling

Every state/pruning batch and every signing-guard update uses WAL-enabled,
synchronous writes. A block's account deltas, metadata, head, history and receipt
indexes share one atomic WriteBatch and one WAL synchronization; there is no
per-transaction journal sync. JSONL remains a recoverable history projection, not
the transaction journal.

WAL files are native binary `*.log` files in the RocksDB directory (`data/rocksdb`
for the chain; the caller-selected directory for `DurableSigner`). RocksDB manages
their rotation and removal after records reach SST files. The seven-day pruning
policy applies to logical chain history, not directly to WAL file ages. Archive
mode preserves logical history without forcing RocksDB to retain obsolete WALs.

Recovery uses `AbsoluteConsistency`: detected corruption or a torn record prevents
startup. No automatic record skipping or database repair is attempted. This favors
refusing to start over silently rolling back a chain head or forgetting a signed vote;
a damaged journal requires operator recovery. Normal intact WALs replay automatically.

`make test-journal` starts a writer subprocess, acknowledges a block and signed vote,
then kills it without closing either database or exporting the block to JSONL.
The test verifies that no SST files exist, reopens through WAL recovery, checks the
state/head/receipt index, repairs JSONL, and confirms double-sign protection survives.
A separate checksum-corruption test verifies that both database types refuse startup.
These tests simulate a process crash, not physical power loss or faulty storage.

Reference: [RocksDB WAL recovery modes](https://github.com/facebook/rocksdb/wiki/WAL-Recovery-Modes).

## Retention lifecycle

Pruning is enabled by default with a 604800-second window. Expiry uses the committed
head timestamp and is exclusive: a block exactly at the cutoff remains. The head
is always retained. Pruning deletes historical block records and associated receipt
indexes while keeping current account/code/storage state. EVM's recent block-hash
context remains part of current state.

Pruning runs on open and after production/import. Large backlogs are deleted in
WAL-synchronized batches bounded by 256 blocks or roughly 8 MiB of delete operations,
checked after each block. A restart resumes from remaining records. Expired whole
JSONL hours are removed; a boundary segment may contain less than one extra hour
until rotation, and restart reconstructs the exact retained projection. RocksDB
compaction asynchronously reclaims physical space.

Archive mode disables history pruning. Switching back to archive preserves only
remaining and future history, not deleted records. Archive history is not a set of
historical EVM state snapshots. A follower whose next required block is pruned must
use an archive peer; automatic snapshot synchronization is not implemented.

## Verification map

| Area | Tests / commands |
| --- | --- |
| EVM, state atomicity, pruning boundaries | `make test`, `tests/core.rs` |
| HTTP/3 and Cap’n Proto | `make test-http3`, `make test-rpc` |
| Catch-up and rejection paths | `make test-sync` |
| Journal crash recovery | `make test-journal` |
| JSONL logs and dashboard endpoints | `make smoke` |
| ERC-20 behavior and replay | `make erc20` |
| Background lifecycle | `make test-service` |
| Supervised multi-node recovery | `make test-supervisor` |
| Two-node emergency fault injection | `make test-emergencies`, [scenario details](EMERGENCY-TESTS.md) |
| Archive/pruning transitions | `make test-pruning` |
| Local processing performance | `make benchmark` |
| Two-node HTTP admission and durable replay | `make bench-network` |

The execution benchmark excludes network transit and scheduling waits; the
two-node benchmark includes both. See
[performance measurements](PERFORMANCE.md) for workloads and limits; execution
capacity must not be presented as sustained end-to-end or validator consensus TPS.

## Determinism contract

SFC-owned core collections use `BTreeMap`, `BTreeSet`, `Vec`, and `VecDeque`.
Mempool duplicate lookup uses `BTreeSet`; the queue defines transaction ordering.
`OrderedDb` backs EVM accounts, code, storage, and block hashes with ordered maps.
REVM's returned account and storage changes are sorted before application. World
serialization and state commitments use ordered maps, while receipts and logs
preserve execution order. CPU/GPU/HYBRID results are collected in input order;
state mutation never follows completion order. The MLX kernel uses exact integer
modular arithmetic. See [backend validation and limits](VERIFICATION-BACKENDS.md).

Admission uses the last committed block timestamp. Production/replay receive an
explicit timestamp; the CLI samples wall time for new local blocks and genesis.
Logs also use wall time, and dashboard rates use floating point; neither affects
state commitments. Execution arithmetic uses integer EVM values. PREVRANDAO is
fixed to zero. Custom module hooks must not read clocks, random sources, network,
filesystem contents, environment variables, or unordered iteration to choose state.
The hook interface itself cannot enforce purity.

This is an SFC-core guarantee, not a claim that dependencies contain no hash maps.
REVM internally uses hash-based execution state. The adapter canonicalizes that
state at the boundary and never uses its iteration order to choose transactions or
construct commitments. Replacing REVM internals would require a separate dependency
fork and verification effort. The current adapter is tested for insertion-order
invariance, absent reads, zero-slot removal, creation, and self-destruction; existing
worker-count tests compare serial and parallel execution results. A source regression
guard rejects unordered collection and ambient clock/random identifiers in owned
core modules. These tests are evidence, not a formal proof of all EVM behavior.

The current [performance comparison](PERFORMANCE.md) measures the ordered database
and includes repeated processing and two-node network trials. Historical results
are labeled separately.
