# SuperFroniterChain (SFC)

## Documentation

- [Quickstart](docs/QUICKSTART.md): install prerequisites, start/stop, dashboard, testnet, tests.
- [Protocol](docs/PROTOCOL.md): HTTP/3, Cap’n Proto RPC, sync rules, Ethereum RPC, limits.
- [Architecture](docs/ARCHITECTURE.md): execution, storage, journaling, pruning, and operations.
- [CPU/GPU/HYBRID verification and measured TPS](docs/VERIFICATION-BACKENDS.md).
- [GPU latency enhancement](docs/GPU-ENHANCEMENT.md): cooperative recovery and paired network results.
- [Ethereum compatibility](docs/ETHEREUM.md) and [performance](docs/PERFORMANCE.md).

A small MIT-licensed Rust blockchain framework with **100 ms blocks**, Ethereum
smart-contract execution, RocksDB, and **Cap'n Proto RPC over HTTP/3** for peer sync.
The scope is core blockchain behavior and Ethereum contracts; no cross-chain,
governance, staking, bridge, or application-specific modules.

**Status:** runnable development sequencer and verifying followers. ERC-20 deployment,
transfer, approval, delegated transfer, logs, reverts, restart, and HTTP/3 replication
are integration-tested. This is not a production multi-validator L1 or a complete
Ethereum client. Consensus vote/certificate/locking primitives are implemented and
tested; a distributed consensus reactor is not integrated into the running node.

## Multi-node testing with Python

The standard-library Python supervisor runs one development sequencer and three
verifying followers on macOS/Linux. All nodes use the same genesis, 100 ms blocks,
and certificate-pinned Cap’n Proto RPC over HTTP/3 for synchronization.

```sh
make testnet                         # four nodes; Ctrl-C stops every child
make testnet NODES=6 TESTNET_DIR=.sfc-six RPC_PORT=8645 PEER_PORT=27656
make test-supervisor                 # automated four-node crash/recovery test
```

Python 3 is required. Default RPC ports are 8545–8548 and UDP peer ports are
26656–26659. Submit transactions to node 0 at `http://127.0.0.1:8545`; followers
are read-only. Each node has its own RocksDB directory and append-only `node.jsonl`
under `.sfc-testnet/node-N/`. `status.json` records child PIDs, process liveness,
RPC URLs, and restart counts; it is not an RPC health check.

The supervisor restarts exited children with exponential backoff, up to five
restarts per node per invocation. Exhausting that budget stops the whole network.
SIGINT/SIGTERM triggers graceful shutdown, with forced termination after ten
seconds. An exclusive file lock prevents two supervisors owning the same home.
Running the same command again reuses configuration and journaled data; port
options apply only when creating a network. Use a new home to change node count.
Logs are retained without rotation, so these homes are intended for local tests.

`make integration` includes the supervisor test: matching blocks across four nodes,
forced follower and sequencer crashes, automatic recovery, persistent restart,
exclusive ownership, and child cleanup. This topology exercises replication and
recovery; it does not implement distributed validator consensus.

## Run

Install Rust, a C/C++ compiler with libclang, and the `capnp` compiler. On macOS,
`brew install capnp llvm` supplies the native tools if they are missing. On Debian,
install `capnproto clang libclang-dev build-essential`. Node.js and npm are only
required for the Solidity/ERC-20 integration test. GPU mode (the default) also requires
Apple Silicon, Metal and the persistent Python MLX worker. Run `make mlx-setup`
before starting it. On Linux or for CPU-only operation, use
`SFC_VERIFICATION_BACKEND=cpu make run` (also supported by testnet/service commands).

```sh
make doctor
make build
make mlx-setup   # Apple Silicon; CPU mode does not need this
make init
make run
```

`make run` builds and runs the optimized release binary. Use `make dev` for a debug
build. Generated files live in `.sfc/`; initialization refuses to overwrite them.

| Setting | Default |
| --- | --- |
| Signature verification | GPU (MLX); CPU and HYBRID selectable |
| Block interval | 100 ms |
| Ethereum JSON-RPC | `http://127.0.0.1:8545` |
| Peer sync | HTTP/3 / QUIC / UDP `127.0.0.1:26656` |
| Peer payload | Typed Cap'n Proto RPC at `/sfc/rpc` |
| Ethereum chain ID | 7777 (`0x1e61`) |
| EVM fork | Shanghai |
| Block gas limit | 100,000,000 |
| Maximum transactions/block | 4,096 |
| Maximum raw transaction bytes/block | 2 MiB |
| Pending queue | 16,384 transactions, at most 64 MiB raw bytes |
| Retention | 604,800 seconds, approximately one week |

The funded local account is `0x7e5f4552091a69125d5dfcb7b8c2659029395bdf`,
with the publicly known private key `0x` followed by 63 zeroes and `1`.
It is exclusively for development. The genesis balance is 1,000 native tokens
with 18 decimals.

```sh
curl http://127.0.0.1:8545 -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
make peer-status
```

For a separate archive home:

```sh
make archive DATA_DIR=.sfc-archive
make run DATA_DIR=.sfc-archive
```

Archive mode preserves all blocks, transactions, and receipts. It does **not** retain
historical account-state snapshots for historical `eth_call`. Switching to archive
mode cannot recover previously pruned data.

## ERC-20 and Ethereum

```sh
make erc20
```

This compiles [Token.sol](examples/Token.sol) for Shanghai, deploys it with ethers,
checks supply/balances/transfers/allowances/events/reverts, restarts the chain, and
verifies the same token state on a follower synced over HTTP/3. It uses both EIP-155
legacy and EIP-1559 type-2 signed transactions. Compile other Solidity contracts with
`evmVersion: "shanghai"`; newer-fork opcodes are not supported.

See [Ethereum compatibility](docs/ETHEREUM.md) for the exact RPC subset and differences.

## HTTP/3 sync

Create a follower home with `make init DATA_DIR=.sfc-follower`, copy the leader's
`genesis.json` over the follower's generated genesis, and edit the follower's
`config.json`:

```json
{
  "rpc_listen": "127.0.0.1:8546",
  "peer_listen": "127.0.0.1:26657",
  "sync_peer": {
    "address": "127.0.0.1:26656",
    "server_name": "localhost",
    "certificate": "/absolute/path/to/leader/.sfc/peer-cert.der"
  }
}
```

These fields replace their counterparts in the generated configuration; retain its
other fields. Start with `make run DATA_DIR=.sfc-follower`. A follower is read-only;
submit transactions to the leader. It reconnects automatically and fetches up to 64
blocks / approximately 2 MiB raw transactions per request. It verifies ancestry,
signatures, transaction execution and state commitments before persisting each block.
A follower behind the pruning boundary needs an archive peer; snapshot bootstrap is
not implemented. Never copy the peer's private key; only its public certificate is
needed. TLS verifies the configured certificate and hostname; there is no insecure
certificate bypass or TCP fallback. Development listeners are restricted to loopback.

## Persistence and framework

RocksDB is authoritative. Logical metadata, accounts, blocks, and receipt indexes are
JSON-encoded. Only changed account records are written in each atomic block batch.
The native RocksDB WAL/SST format remains binary. RocksDB write-ahead journaling is
explicitly enabled (`disable_wal(false)`), and every block batch waits for WAL sync
before success. The signing guard uses the same policy. Automatic WAL flushing and
strict corruption checks are enabled; a corrupt WAL stops startup instead of silently
recovering an older state. The journal protects commits; hourly JSONL segments are an inspectable, recoverable history projection.
Restart repairs missing, torn or corrupt JSONL segments from RocksDB.

Database history and receipt indexes prune by finalized block timestamp. Current
balances, contracts, storage, chain head and the EVM's 256-block hash window survive.
JSONL retention rounds up by at most one hour, with the latest head retained even
when old. RocksDB disk space is reclaimed by compaction, not necessarily immediately.

Transaction authentication supports **CPU**, **GPU** (default), and **HYBRID**.
GPU uses integer MLX/Metal recovery through a persistent worker, with a cooperative
path for batches up to 2,048 signatures;
HYBRID assigns 40% to GPU and the remainder to Rayon concurrently. All modes
preserve input order and use sequential EVM state updates. CPU batches below
32 entries stay serial. `RAYON_NUM_THREADS` controls the CPU worker pool.
Select a mode with `sfc run --verification-backend cpu|gpu|hybrid`, the
`SFC_VERIFICATION_BACKEND` environment variable, or `verification.backend` in
config.json (precedence in that order). GPU failure returns an error; a later
request restarts the worker. There is no silent CPU fallback. See
[backend setup, correctness tests and TPS measurements](docs/VERIFICATION-BACKENDS.md).

The `sfc` library exposes `Application` and a two-hook `Module` trait. Hook order is
registration order. Execute on an isolated state copy; commit only a successful
block. Consensus primitives, transport and persistence are separate modules.
See [architecture](docs/ARCHITECTURE.md) and [implementation plan](docs/PLAN.md).

## Manage and verify

| Command | Purpose |
| --- | --- |
| `make build` / `make release` | Debug / optimized Rust build |
| `make init` / `make archive` | Initialize pruned / archive home |
| `make run` / `make dev` | Run release / debug node |
| `make peer-status` | Query typed RPC through HTTP/3 |
| `make schema` | Generate/check Cap'n Proto Rust bindings |
| `make fmt` / `make lint` | Formatting / strict Clippy |
| `make test` | Rust correctness and failure tests |
| `make test-journal` | Forced-process-kill WAL recovery and corruption rejection |
| `make smoke` | Two-process HTTP/3, TLS rejection and restart tests |
| `make erc20` | Solidity + Ethereum + follower integration |
| `make integration` | Contract, transport, supervisor, pruning and emergency tests |
| `make test-two-nodes` / `make test-emergencies` | Signed-transaction recovery and 15 fault scenarios |
| `make bench` | Release-mode execution, durable-write and admission measurements |
| `make bench-network` | Python-supervised two-node HTTP admission and durable replay |
| `make stresstest` | One release node with GPU verification: committed TPS and CPU usage |
| `make bench-mlx` / `make test-mlx` | Apple GPU recovery correctness and microbenchmark |
| `make test-verification` / `make bench-backends` | Backend equivalence/fault tests and two-node TPS/CPU comparison |
| `make clean` | Remove build output; preserves chain data |

`make stresstest` builds release, installs test/MLX dependencies, and continuously
runs rounds of 65,536 signed transfers with 4,096 transactions per HTTP batch and a
100 ms block interval. Requires Apple Silicon with Metal, Node/npm, `uv`, and
Python 3.13. One Python-supervised node keeps the same chain across rounds and
restarts in `.sfc-stress/node-0`. Startup prints its actual dashboard, Ethereum RPC,
HTTP/3 sync endpoint, TLS certificate, config, database, index, and log locations.
Run `make stop` in another terminal (or Ctrl-C) to stop the load generator and node.
Stop preserves chain data and logs. A second concurrent stress runner is rejected.
GPU verification is explicit; failures do not fall back to CPU. Execution and
storage still run on CPU. Reported CPU includes the Rust node and MLX worker
(100% means one CPU core), excluding the load generator.
Results append to `.sfc-stress/results.jsonl`; summaries also go to `stress.log`.
Each round checks committed balances/nonces and GPU counters. Signing runs between
measured rounds, so the displayed round TPS excludes signing time. This measures
local commits over HTTP; follower replay and emergency scenarios remain separate tests.

```sh
make stresstest
make stop
make stresstest STRESS_TRANSACTIONS=16384 STRESS_BATCH=1024
# Also configurable: STRESS_INTERVAL=100 (ms), STRESS_DIR=.sfc-stress,
# STRESS_REPORT=.sfc-stress/results.jsonl
# Use the same STRESS_DIR with make stop if you override it.
```

The dashboard includes committed TPS, sampled process CPU/memory/thread counts,
CPU/GPU recovery counters, Rayon workers, live RocksDB properties, and persistence
paths. Hardware GPU utilization is explicitly unavailable; recovery counts are
not GPU utilization percentages.

Each running node includes a background SQLite indexer at `data/index.sqlite`,
using **WAL mode**, `synchronous=NORMAL`, and independent read connections. It indexes
structured JSONL logs with FTS5 prefix search, block metadata, signed transactions,
and receipts. The dashboard queries `/dashboard/index?kind=logs&q=block_produced`;
`kind=blocks`, `transactions`, and `receipts` support exact hash/height searches,
and transactions/receipts also support sender/recipient addresses. Results are
limited to 100; log pagination accepts `before=<id>`. Empty queries show recent entries.
Index height, errors, and gaps caused by already-pruned blocks are visible.
Indexing never decides transaction validity or chain state.

JSONL logs remain at `data/logs/node.jsonl`; supervisor-captured node/GPU output
is at `node-0/node.jsonl`. SQLite checkpoints automatically and resumes from
transactional block/log cursors after restart. With NORMAL synchronization, an
OS/power failure may lose recent index commits; retained RocksDB blocks and JSONL
records are replayed. The index and logs retain history independently of chain
pruning and consume disk as the stress test continues. To rebuild the index,
stop the node and remove only `index.sqlite` and its `-wal`/`-shm` sidecars;
already-pruned blocks cannot be rebuilt from the live block store.

Performance measurements and limits are in [PERFORMANCE.md](docs/PERFORMANCE.md).
No Hyperliquid-equivalent performance claim is made. A 100 ms scheduling interval is
a target, not a guaranteed distributed finality latency.

## Peer transports and Ethereum HTTP RPC

HTTP/3 remains the default peer transport. Both transports expose the same typed
Cap’n Proto RPC methods: `status`, `submitTransaction`, `getBlock`, and `getBlocks`.
To additionally enable direct Cap’n Proto RPC over TCP, set this in the serving
node's `config.json`:

```json
"capnp_listen": "127.0.0.1:26657"
```

For a follower using that endpoint, set `sync_peer.transport` to `"tcp"` and
`sync_peer.address` to `"127.0.0.1:26657"`. Keep the existing `server_name` and
`certificate` fields; TCP does not use them. Missing `transport` means `"http3"`.
Direct TCP is unencrypted and restricted to loopback; HTTP/3 uses pinned TLS.
The optional TCP listener is disabled by default. Each connection is bounded to
60 seconds; followers reconnect automatically. Both transports verify imported
blocks through the same execution and state-root checks.

```sh
make peer-status TRANSPORT=tcp PEER=127.0.0.1:26657
make test-rpc
```

Ethereum applications use HTTP JSON-RPC at `rpc_listen` (default
`http://127.0.0.1:8545/`), including transaction submission, contract calls, receipts,
and logs. Cap’n Proto is the peer interface, not the Ethereum wallet interface.
`make test-rpc` checks both sync transports, transaction submission/rejection,
block replay, restart, and real HTTP JSON-RPC batches, notifications, and errors.
`make check` includes parser/configuration unit tests; `make integration` also
runs ERC-20 and Python-supervised multi-node tests.

## Pruning

Pruning runs automatically after block production/import and on database open.
The default configuration keeps approximately one week of history:

```json
"retention": { "mode": "pruned", "seconds": 604800 }
```

The cutoff uses the latest committed block timestamp, not wall-clock time. Blocks
strictly older than that cutoff and their receipt/transaction indexes are removed;
the boundary block and current head remain. Current balances, nonces, contract code,
contract storage, and recent EVM block hashes are preserved. Pruned history returns
`null` through block/receipt lookup. A lagging follower must use an archive peer if
its required history has expired.

Deletion uses synchronous RocksDB WAL batches capped at 256 blocks or roughly 8 MiB
of delete operations (checked after each block). Each batch atomically removes
blocks and their indexes, and restart resumes any unfinished backlog. RocksDB
compaction reclaims disk space asynchronously. JSONL files rotate hourly: complete
expired hours are deleted, so the boundary segment can retain less than an extra
hour until rotation; restart rebuilds it from retained database records.

Use `"retention": { "mode": "archive" }` to retain all future history, or initialize
with `make archive`. Switching to archive cannot recover previously deleted data.
The head and current state remain even if block production stops.

```sh
make test-pruning
```

Tests cover cutoff boundaries, receipt-index removal, current-state preservation,
JSONL cleanup, large archive-to-pruned backlogs, restart, and live pruned/archive
nodes managed by the Python supervisor.

### Focused HTTP/3 verification

Run `make test-http3` for actual loopback QUIC connections with generated TLS
identities. Tests check negotiated `h3` ALPN, rejection of incompatible ALPN,
untrusted certificates and wrong hostnames, HTTP method/path/content-type handling,
and full-duplex response headers before the request body finishes. They also check
server availability after malformed input, concurrent Cap’n Proto status/block
calls, the 64-block response limit, empty ranges, repeated connections, and a
70-block follower catch-up with matching head hashes. The process smoke test
verifies HTTP/3 replication and restart. These tests run locally; they do not
simulate Internet packet loss or establish production-scale throughput.

`make test-sync` combines HTTP/3 catch-up tests, Python-supervised node crash
recovery, and live pruning/archive tests. Additional checks reject wrong-chain
blocks, invalid ancestry, incorrect execution roots, malformed transactions,
divergent equal-height peers, and missing pruned history without advancing the
follower's in-memory or durable head. An upstream behind the follower never causes
a rollback. Missing history requires an archive peer; automatic peer selection
and snapshot/state sync are not implemented.

## Blockchain dashboard

Known older RocksDB and SQLite schemas upgrade automatically during startup.
See [storage migrations](docs/STORAGE-MIGRATIONS.md) for versions, recovery
behavior, and how to add future migrations.

Start a node with `make run` (after `make init` for a new home), then open
<http://127.0.0.1:8545/dashboard>. The dashboard is bundled with the Rust binary;
no frontend build, external assets, or additional server is required.

The **SF CHAIN — Super Fast Chain** interface includes a blockchain explorer
with clickable block and transaction details, receipts, paginated transaction
lists, compute/storage views, and searchable logs. Three.js, Tailwind, Motion,
and a generated visual asset are bundled locally. See the
[dashboard guide](docs/DASHBOARD-EXPLORER.md) for frontend build instructions.

It shows height, head age, committed TPS over up to 60 block intervals, average
block timing, pending transactions, state account count, retained history, pruning
configuration, configured sync transport/upstream, and recent blocks. Rates use
block timestamps with one-second precision, and remain unavailable until a nonzero
window exists. They are historical window averages, not benchmark capacity or an
instantaneous liveness measurement. Polling runs every two seconds, with explicit
stale-data status on failure. It does not report unmeasured follower lag or peer
counts. Each testnet node serves its own dashboard on its Ethereum RPC port.

Read-only JSON statistics are available at `/dashboard/stats`. The endpoint reads
at most 61 retained blocks per request. It includes local persistence paths and
process statistics for the dashboard, but does not expose private keys.

## JSONL runtime logs

Runtime diagnostics are structured JSONL on stderr. Each line includes
`timestamp_ms` (Unix milliseconds), `level`, `event`, `pid`, and a `fields` object.
Events include node startup/shutdown, produced blocks, imported sync batches,
connection failures, sync retries, dropped transactions, and fatal errors.
Transaction bodies and private keys are not included in event fields; panic
reports include location only. Logging is serialized across threads.

```sh
make run-log                         # append to .sfc/node.jsonl
make testnet                         # each node has node-N/node.jsonl
```

`make run` emits JSONL diagnostics to the terminal. `make run-log` redirects only
the node's stderr, keeping build output out of the log file. CLI command results
such as `peer-status` remain on stdout. Logs append across restarts and are not
rotated automatically. Runtime logs are best-effort diagnostics, not fsynced
consensus records; RocksDB journaling and block-history JSONL remain separate.

## Background start and stop

```sh
make help
make start
make stop
```

`make` alone also shows help. `make start` builds the release binary, initializes
`.sfc` if needed, and starts one background node. Open
<http://127.0.0.1:8545/dashboard> to view statistics. Node logs append to
`.sfc/node.jsonl`; Python service diagnostics go to `.sfc/service.log`.
`make stop` gracefully stops that managed node, allowing ten seconds before forced
termination. Repeated start/stop commands are safe. A process-held lock and private
Unix control socket avoid signaling a reused PID. These commands support macOS/Linux.

Use the same `DATA_DIR` when starting and stopping a custom home. Existing config
and state are preserved; a custom `CONFIG` must already exist. `make stop` controls
only this background service, not foreground `make run` or `make testnet` processes.
Run `make test-service` to verify lifecycle and startup-failure cleanup.
