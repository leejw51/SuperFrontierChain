# SFC v0.1.0 — development release

Super Frontier Chain is a Rust development sequencer with verifying followers,
Shanghai EVM execution, Cap’n Proto peer RPC over TCP or HTTP/3, a synchronous
RocksDB journal, and an asynchronous SQLite explorer. GPU verification continues
to use native Apple MLX. CPU and HYBRID verification remain selectable.

This first release is intended for local development and performance evaluation.
Distributed validator consensus is not integrated; this is not a production L1 or
a complete Ethereum client. This source release does not include prebuilt binaries.

## Changes included

- Share the lazy block-hash cache across clones, reduce canonical Cap’n Proto
  receipt allocations, and avoid redundant full validation of locally constructed
  blocks after checking their bounds. Imported and persisted blocks still receive
  full validation.
- Move peer block reads to bounded blocking workers using shared storage snapshots.
  SQLite catch-up also reads bounded snapshots without holding the execution mutex.
- Remove periodic history-projection fsyncs that competed with the RocksDB WAL.
  Every acknowledged block still uses the synchronous authoritative WAL. History
  appends immediately, syncs on segment close/clean shutdown, and is reconstructed
  from retained RocksDB blocks after a crash.
- Tune native MLX cooperative recovery through 2,560 records; larger batches use
  the existing direct path. Kernel arithmetic and CPU/GPU result ordering are unchanged.
- Use editable `config.jsonl`, default homes under `~/.superfrontierchain/`, and a
  60-second default history window. Pruned history segments span at most 60 seconds;
  archive segments span one hour. Existing configured retention values are preserved.
- Refresh operating instructions, protocol documentation, and generated offline HTML.

## Measured performance

On an Apple M5 Max (32 GPU cores, 18 CPU cores, 36 GB RAM), four alternating
before/after pairs improved in every pair. The **median paired improvement was
5.1%**. Each trial committed 1,048,576 transfers with native MLX, TCP, SQLite ON,
4,096 transactions per RPC, inflight 1, a 10 ms block interval, and 12 Rayon workers.
Signing was outside timing; verification, execution, and durable commit were inside.
The baseline already included the Cap’n Proto changes above; this comparison
measures the subsequent persistence/indexer/MLX follow-up, not all release changes.

| Pair | Before TPS | After TPS | Improvement |
| --- | ---: | ---: | ---: |
| 1 | 258,254 | 270,617 | 4.8% |
| 2 | 209,945 | 214,793 | 2.3% |
| 3 | 255,328 | 269,234 | 5.4% |
| 4 | 213,226 | 267,705 | 25.5% |

Native verification microbenchmarks at 2,049–2,560 records improved latency by
11.5–14.9%. A separate persistent-node check committed 3,145,728 transfers across
three rounds at approximately 270,000–271,000 TPS.

The slower 214,793 TPS candidate run remains: throughput variation is not fully
resolved. The default node interval is 100 ms; the 10 ms benchmark is a distinct
configuration. These tests do not establish long-term saturated, large-state,
multi-host, or distributed-consensus throughput. See the
[full investigation](SPECIFICATION.md#11-throughput-stall-investigation-and-follow-up-2026-10-22)
and [raw measurements](tps-investigation-2026-10-22.json), including the earlier
regression, rejected experiments, and exclusions.

## Build and start

Install Rust, a C/C++ compiler with libclang, and the Cap’n Proto compiler.
Apple Silicon and Metal are required for the default native MLX GPU backend.
Use CPU mode on other hosts. See [quickstart](QUICKSTART.md) for prerequisites
and the optional Python process supervisor.

```sh
cargo build --locked --release --workspace
./target/release/sfc init --home /path/to/new-sfc-home
./target/release/sfc run --config /path/to/new-sfc-home/config.jsonl
# CPU-only hosts: add --verification-backend cpu to both init and run.
```

Use a new path for the example above. The default generated configuration prunes
history after 60 seconds; pass `--archive` to `init` when all future block history
must be retained. Archive mode does not preserve historical account-state snapshots.

## Compatibility and upgrade notes

- Protocol v3 plus the Merkle Patricia commitment requires a fresh home for older
  protocol or flat-state-hash chains. Keep the old home intact; see
  [commitment compatibility](MERKLE-TRIE.md#compatibility).
- These performance changes do not change the current block/state commitments or
  peer method ordinals. Compatible existing v3 Merkle homes can retain their data.
- Legacy `config.capnp` remains readable. When no JSONL companion exists, node
  startup writes one. Stop the node before editing configuration and use the
  JSONL path for subsequent starts. `init` refuses an already initialized home.
- Default homes are `~/.superfrontierchain/node`, `testnet`, and `stress`. Existing
  repository-local homes are not moved automatically; select a custom home explicitly.
- `make stop` stops blockchain processes belonging to this repository.
  `make clearall` deletes repository-local `.sfc*` chain homes and the default
  node/testnet/stress homes; it is not an upgrade command.
- A follower behind the retained history needs an archive peer; snapshot bootstrap
  is not implemented. Public-network deployment and production consensus are
  outside this release's tested scope.

## Validation

The optimization validation recorded 84 standard release tests, native MLX
differential checks including 2,559/2,560/2,561 records, CPU/GPU/HYBRID state and
replay parity, and three native benchmark/recovery/replication tests. Release
Clippy passed with warnings denied, as did formatting and whitespace checks.
Release preparation reran these checks successfully, verified the configuration
default/restart lifecycle, and checked local links and anchors in all 12 generated
HTML documents.
Crash recovery includes SIGKILL after 32 blocks/32,768 transactions followed by
removal and reconstruction of the history projection. Concurrency regressions
exercise RPC and indexer progress while the execution mutex is held.

Measurements and GPU validation were performed on Apple Silicon. Linux and other
hardware do not inherit those performance results. Refer to the repository CI
status separately for platform build coverage.
