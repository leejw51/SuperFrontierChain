# SuperFroniterChain (SFC) implementation plan

## Design decisions

Implement an original Rust framework using the supplied local reference for
architectural study. Do not copy upstream source or translate restricted modules.
MIT applies to original SFC code; dependencies retain their own licenses.

Use a library plus a small node binary. Separate deterministic application
execution, consensus primitives, peer transport, persistence, and Ethereum RPC.
Cap'n Proto replaces the binary message model; Cap'n Proto RPC is the peer
transport. Ethereum clients retain standard HTTP JSON-RPC and signed RLP envelopes.
No protocol compatibility with the reference network is promised.

RocksDB is the authoritative internal database, with JSON encoded logical records.
JSON genesis/config and JSONL block segments provide inspectable persistence.
Database state and block history commit atomically; JSONL is a recoverable projection.
Default retention is 604800 seconds of finalized block history, not a guessed
number of blocks. Retain current account/code/storage state and the latest block.
Archive mode disables history deletion. Historical state snapshots are a separate
future capability; archive block retention is not an Ethereum archive-state node.

## Sequence and acceptance

1. Foundation: Cargo workspace, Makefile, MIT, configuration, schemas.
2. Storage: atomic commits, restart, JSONL repair, time-based pruning and archive tests.
3. Framework: deterministic block lifecycle, bounded admission, state commitment.
4. Consensus: domain-separated signed votes, weighted strict >2/3 certificates,
   equivocation detection, round locks, persistent signing guard; adversarial tests.
5. Execution: real EVM, signed replay-protected transactions, nonce/fee checks,
   receipts, revert behavior, durable account/code/storage.
6. Node: explicitly selected single-validator development sequencer, peer RPC,
   Ethereum JSON-RPC subset, CLI, graceful shutdown, restart smoke test.
7. Release gates: formatting, Clippy, unit/integration/smoke tests, reproducible
   execution benchmark and documented compatibility/limitations.

## Subsequent production milestones

The initial node is a development chain. Production multi-validator operation needs
an integrated proposer/prevote/precommit reactor, authenticated encrypted sessions,
peer discovery, consensus WAL replay and durable lock recovery, evidence handling,
validator-set updates, state sync, snapshot proofs, and fault-injection network tests.
The reusable vote/certificate/locking primitives do not alone constitute this reactor.
Do not enable a public validator network until these gates pass independent review.

Ethereum expansion: full log filtering,
subscriptions, tracing, standard Merkle-Patricia state/receipt proofs, historical
eth_call, official execution fixtures, and wallet/tool compatibility suites.

Performance: measure release-mode execution and end-to-end consensus separately.
Record hardware, validator geography, transaction mix, fsync policy, p50/p95/p99,
state size, sustained TPS, failure rate, and catch-up costs. Target subsecond finality
and high throughput through batching, bounded queues, parallel signature checking,
and eventually conflict-aware execution; never claim external-system parity from
an isolated microbenchmark. JSON snapshots and fsync must be included in realistic
node benchmarks. Establish correctness first, optimize from measured profiles.

## Initial implementation completed

- [x] MIT Rust library/node workspace and Makefile lifecycle.
- [x] 100 ms default blocks, bounded admission, single-pass block execution.
- [x] JSON records in RocksDB, account delta writes, synchronous atomic commits.
- [x] Explicit RocksDB WAL journaling shared with the signing guard; forced-crash recovery and corruption-rejection tests.
- [x] Hourly JSONL history, recovery, seven-day pruning, archive retention.
- [x] Cap'n Proto schema/RPC over TLS-authenticated HTTP/3, default peer transport.
- [x] Batched follower sync with deterministic re-execution and root checking.
- [x] Weighted signed consensus primitives and durable signing guard tests.
- [x] Shanghai EVM, legacy/type-2 transactions, documented Ethereum RPC subset.
- [x] ERC-20 operations, events, revert, restart and follower replication tests.
- [x] Release benchmarks and correctness/formatting/Clippy checks.
- [x] Rayon signature verification for sync, HTTP batches, and library batch admission; deterministic order tests across worker counts.
- [ ] Integrated multi-validator consensus reactor and crash/fault network tests.
- [ ] Complete Ethereum protocol/RPC conformance and large-state performance gates.

Scope excludes cross-chain protocols, governance, staking modules and bridges.
HTTP JSON-RPC remains the Ethereum client interface; HTTP/3 is used for peer sync.
JSONL pruning rounds to hourly segments, adding at most one hour to the DB window.
