# Super Frontier Chain (SFC)

![Super Frontier Chain logo](docs/assets/sfc-logo.png)

## Documentation

- [v0.1.0 release notes](docs/RELEASE-NOTES-v0.1.0.md) · [offline HTML](docs/RELEASE-NOTES-v0.1.0.html).

- [Implementation specification](docs/SPECIFICATION.md): architecture, flow, binary transports and Ethereum RPC support.
- [HTML specification](docs/SPECIFICATION.html): styled offline edition; rebuild with `npm run build:docs`.
- [Execution allocation benchmarks](docs/EXECUTION-ALLOCATION-BENCHMARK.md): alternating release throughput/CPU comparison.
- [Quickstart](docs/QUICKSTART.md): install prerequisites, start/stop, dashboard, testnet, tests.
- [Protocol](docs/PROTOCOL.md): HTTP/3, Cap’n Proto RPC, sync rules, Ethereum RPC, limits.
- [Architecture](docs/ARCHITECTURE.md): execution, storage, journaling, pruning, and operations.
- [Merkle state trie](docs/MERKLE-TRIE.md): incremental commitments, proofs and chain compatibility.
- [CPU/GPU/HYBRID verification and measured TPS](docs/VERIFICATION-BACKENDS.md).
- [GPU latency enhancement](docs/GPU-ENHANCEMENT.md): cooperative recovery and paired network results.
- [Ethereum compatibility](docs/ETHEREUM.md) and [performance](docs/PERFORMANCE.md).

A small MIT-licensed Rust blockchain framework with **100 ms blocks**, Ethereum
smart-contract execution, RocksDB, and **Cap'n Proto RPC** for peer sync over
default TCP or optional HTTP/3.
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
are read-only. Each node has its own RocksDB directory and append-only `node.log`
under `~/.superfrontierchain/testnet/node-N/`. `status.capnp` records child PIDs, process liveness,
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
required for the Solidity/ERC-20 integration test. GPU mode (the default) requires
Apple Silicon and Metal. Rust dispatches the integer GPU kernels through Apple MLX; no Python
worker installation is needed. On Linux or for CPU-only operation, use
`SFC_VERIFICATION_BACKEND=cpu make run` (also supported by testnet/service commands).

```sh
make doctor
make build
make init
make run
```

`make run` builds and runs the optimized release binary. Use `make dev` for a debug
build. Generated files live in `~/.superfrontierchain/node/`; initialization refuses to overwrite them.

| Setting | Default |
| --- | --- |
| Signature verification | GPU (native Rust/MLX); CPU and HYBRID selectable |
| Block interval | 100 ms |
| Ethereum JSON-RPC | `http://127.0.0.1:8545` |
| Default peer sync | Cap’n Proto RPC / TCP `127.0.0.1:26656` |
| Alternative peer sync | HTTP/3 / QUIC / UDP `127.0.0.1:26656` |
| Peer payload | Typed Cap'n Proto RPC at `/sfc/rpc` |
| Ethereum chain ID | 7777 (`0x1e61`) |
| EVM fork | Shanghai |
| Block gas limit | 100,000,000 |
| Maximum transactions/block | 4,096 |
| Maximum raw transaction bytes/block | 2 MiB |
| Pending queue | 16,384 transactions, at most 64 MiB raw bytes |
| Retention | 60 seconds |

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

## Protocol v3: binary internal records

JSONL is used for editable configuration; JSON is also used at the Ethereum HTTP RPC boundary. Genesis,
RocksDB values, SQLite records, history, structured logs, dashboard responses,
legacy GPU worker IPC and supervisor control messages use Cap’n Proto. The default
native GPU path uses shared Metal buffers without IPC. See
[protocol v3 formats and tooling](docs/CAPNP-V3.md).

This changes block/state commitments. Default homes are `~/.superfrontierchain/node`,
`~/.superfrontierchain/testnet` and `~/.superfrontierchain/stress`. The Merkle update requires a fresh
home if a previous flat-hash chain already exists. Existing homes are preserved;
never point the new binary at them to continue the old chain. Historical benchmark
reports in `docs/` retain their original formats and describe protocol v1.

## HTTP/3 sync

Create a follower home with `make init DATA_DIR=.sfc-follower`, copy the leader's
`genesis.capnp` over the follower's generated genesis, and edit the follower's
`config.jsonl` with the supervisor configuration adapter:

```sh
target/mlx-venv/bin/python - <<'PYCODE'
import sys
sys.path.insert(0, 'scripts')
import sfc_codec as codec
path = '.sfc-follower/config.jsonl'
config = codec.read(path)
config.update(rpc_listen='127.0.0.1:8546', peer_listen='127.0.0.1:26657')
config['sync_peer'] = dict(transport='http3', address='127.0.0.1:26656', server_name='localhost',
                         certificate='/absolute/path/to/leader/peer-cert.der')
codec.write(path, config)
PYCODE
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
Cap’n Proto encoded. Only changed account records are written in each atomic block batch.
The native RocksDB WAL/SST format remains binary. RocksDB write-ahead journaling is
explicitly enabled (`disable_wal(false)`), and every block batch waits for WAL sync
before success. The signing guard uses the same policy. Automatic WAL flushing and
strict corruption checks are enabled; a corrupt WAL stops startup instead of silently
recovering an older state. The journal protects commits; retention-sized Cap’n Proto segments are an inspectable, recoverable history projection.
Restart repairs missing, torn or corrupt Cap’n Proto segments from RocksDB.
History appends are immediately visible to readers; explicit projection sync runs
when closing a segment or shutting down cleanly. Recent projection bytes may be
lost on a crash and are rebuilt from the retained, durably committed RocksDB blocks.

Database history and receipt indexes prune by finalized block timestamp. Current
balances, contracts, storage, chain head and the EVM's 256-block hash window survive.
Cap’n Proto retention rounds up by at most one retention segment (60 seconds by default), with the latest head retained even
when old. RocksDB disk space is reclaimed by compaction, not necessarily immediately.

Transaction authentication supports **CPU**, **GPU** (default), and **HYBRID**.
GPU uses integer Metal kernels dispatched through the MLX C API from Rust, with a cooperative
path for batches up to 2,560 signatures;
HYBRID assigns 40% to GPU and the remainder to Rayon concurrently. All modes
preserve input order and use sequential EVM state updates. CPU batches below
32 entries stay serial. `RAYON_NUM_THREADS` controls the CPU worker pool.
Select a mode with `sfc run --verification-backend cpu|gpu|hybrid`, the
`SFC_VERIFICATION_BACKEND` environment variable, or `verification.backend` in
config.jsonl (precedence in that order). GPU failure returns an error; a later
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
| `make benchmark` / `make bench-network` | Rust-supervised one/two-node binary RPC admission and durable replay |
| `make stresstest` | One release node with GPU verification, SQLite OFF: committed TPS and CPU usage |
| `make stresstest2` | Same workload with SQLite ON, direct writes and latency profiling |
| `make stressstart` | Start the same stress workload in the background under Python supervision |
| `make stop` | Stop all blockchain processes belonging to this repository, preserving data |
| `make test-stresstest` | GPU routing, TPS/CPU accounting, durable transaction counts and crash/restart checks |
| `make test-benchmark-metrics` | Process CPU time parsing and missing-worker regression checks |
| `make test-migrations` | Automatic upgrades, data preservation, rollback/retry and signer protection |
| `make test-mlx` | Native Rust MLX arithmetic correctness tests |
| `make test-verification` / `make bench-backends` | Native backend equivalence tests and Rust TPS/CPU comparison |
| `make clean` | Remove build output; preserves chain data |

`make stresstest` builds release and continuously
runs one node with native MLX GPU verification and SQLite indexing disabled.
Stress runs (`stresstest`, `stresstest2`, `stressstart`, and `sfc-bench run`) keep
only a **5-second block history window**, including when reusing an existing stress
home. Override with `STRESS_RETENTION_SECONDS` or `--retention-seconds`.
Expired blocks are removed by the background retention worker; the boundary block,
current head and chain state remain. SQLite rows are never pruned. Ordinary node
and comparison-benchmark retention defaults remain unchanged. Physical disk
reclamation can lag while RocksDB compaction runs.
`make stresstest2` runs the same workload with SQLite indexing enabled and writes
its SQLite rows directly from block production. Direct INSERTs share a transaction
until 16 blocks, approximately 8 MiB, or 100 ms has elapsed. These thresholds are
checked after each block, including empty blocks; clean shutdown also flushes.
The 100 ms threshold is not an independent timer or a hard latency bound.
`STRESS_SQLITE_BATCH_BLOCKS=1` reproduces per-block COMMIT.
`STRESS_SQLITE_DIRECT=0` selects
the asynchronous background writer for comparison. Direct mode waits for SQLite
and records preparation, INSERT, COMMIT/checkpoint and RocksDB commit times in
`node-0/data/sqlite-write-profile.json`; index errors remain visible separately.
Each
round contains 1,048,576 signed transfers with 4,096 transactions per binary RPC batch and a
10 ms block interval with 12 Rayon workers (tuned on the development Apple Silicon
host). Override with `STRESS_INTERVAL=100` for the earlier cadence or
`STRESS_THREADS=8` to tune a different machine. Intervals must be at least 1 ms;
shorter intervals can reduce throughput by creating smaller blocks and more writes.
Requires Rust, Python 3 (standard library only), the Cap'n Proto compiler and Apple Silicon with Metal. Python supervises process lifecycle only; transaction generation, metrics and MLX run in Rust. One node keeps the same chain across rounds and
restarts in `~/.superfrontierchain/stress/node-0`. Startup prints its actual dashboard, Ethereum RPC,
HTTP/3 sync endpoint, TLS certificate, config, database, index, and log locations.
Run `make stop` in another terminal (or Ctrl-C) to stop the load generator and node.
`make stressstart` starts this workload in the background and returns immediately.
Build progress, startup URLs and TPS output append to `~/.superfrontierchain/supervisor/stress.log`.
Use `tail -f ~/.superfrontierchain/supervisor/stress.log` to follow it. Duplicate background starts
return `Already running` successfully. The supervisor lock covers the build as well
as the running workload, so `make stop` can cancel startup too.
Stop preserves chain data and logs. A second concurrent stress runner is rejected.
GPU verification is explicit; failures do not fall back to CPU. Execution and
storage still run on CPU. Reported CPU includes all Rust node threads
(100% means one CPU core), excluding the load generator.
Results append to `~/.superfrontierchain/stress/results.capnp`; summaries also go to `stress.log`.
Each round checks committed balances/nonces and GPU counters. Signing runs between
measured rounds, so the displayed round TPS excludes signing time. This measures
local commits over binary Capnp RPC (TCP by default); follower replay and emergency scenarios remain separate tests.
These load settings match the earlier flat-hash benchmark configuration. With the
new Merkle commitment, three runs measured a median 201,617 TPS (195,265–243,072);
see [Merkle validation](docs/MERKLE-TRIE.md). Throughput varies with chain size,
indexing backlog, storage and thermal conditions. The previous `.sfc-stress-v3`
chain is preserved and cannot be continued with the changed state-root rules.

SQLite indexing is off by default for `make stresstest` and `make stressstart`;
use `make stresstest2` to include the explorer/log index. `STRESS_SQLITE=on|off`
can explicitly override either target. Nodes started directly retain SQLite ON
unless passed `sfc run --config ... --no-indexer`.
Disabling indexing skips the SQLite writer entirely and preserves any existing
index files. RocksDB synchronous commits, structured logs, Ethereum RPC and GPU
verification continue normally. Explorer/log searches are unavailable while off;
the dashboard runtime metadata reports `sqliteIndexerEnabled: false`. Starting
again without the flag resumes indexing from saved cursors for retained blocks
and logs. Blocks already pruned while indexing was off are reported as skipped.
The option applies to that run; it does not rewrite the saved chain configuration.

`make benchmark BENCH_SQLITE=both` alternates ON/OFF runs and records
the mode with each TPS/CPU sample. `make test-indexer-toggle` checks disabling,
catch-up after re-enabling, preservation of existing files and refusal of stale
index searches.

```sh
make stresstest
make stop
make stresstest2
make stop
make stresstest STRESS_TRANSACTIONS=16384 STRESS_BATCH=1024
# STRESS_ROUNDS=50 stops after 50 rounds; the default 0 runs continuously.
# Also configurable: STRESS_INTERVAL=100 (ms), STRESS_DIR=~/.superfrontierchain/stress,
# STRESS_REPORT=~/.superfrontierchain/stress/results.capnp
# make stop discovers repository processes even when STRESS_DIR was overridden.
```

The dashboard includes committed TPS, sampled process CPU/memory/thread counts,
CPU/GPU recovery counters, Rayon workers, live RocksDB properties, and persistence
paths. Hardware GPU utilization is explicitly unavailable; recovery counts are
not GPU utilization percentages.

By default, a running node includes a background SQLite indexer at `data/index.sqlite`,
using **WAL mode**, `synchronous=NORMAL`, and independent read connections. It indexes
structured Cap’n Proto events with FTS5 prefix search, block metadata, signed transactions,
and receipts. The dashboard queries `/dashboard/index?kind=logs&q=block_produced`;
`kind=blocks`, `transactions`, and `receipts` support exact hash/height searches,
and transactions/receipts also support sender/recipient addresses. Results are
limited to 100; log pagination accepts `before=<id>`. Empty queries show recent entries.
Index height, errors, and gaps caused by already-pruned blocks are visible.
Indexing never decides transaction validity or chain state.

Structured logs remain at `data/logs/node.capnp`; supervisor-captured node/GPU output
is at `node-0/node.log`. SQLite checkpoints automatically and resumes from
transactional block/log cursors after restart. With NORMAL synchronization, an
OS/power failure may lose recent index commits; retained RocksDB blocks and Cap’n Proto
records are replayed. SQLite block, transaction, receipt and log rows are append-only: chain pruning
does not delete them. Indexed history and raw logs consume disk as the stress
test continues. To rebuild the index,
stop the node and remove only `index.sqlite` and its `-wal`/`-shm` sidecars;
already-pruned blocks cannot be rebuilt from the live block store.

In background mode, block commit sends a nonblocking, coalesced notification to the SQLite worker;
it never waits for SQLite completion. The queue holds one wake-up, not block
payloads. The durable height cursor drives catch-up, with a 100 ms fallback for
log-only updates. There is no unbounded in-memory backlog. If the writer falls
behind RocksDB retention, unindexed expired blocks can still be skipped; the
`skippedPrunedBlocks` counter exposes this limitation.

Catch-up commits up to 16 blocks or approximately 8 MiB per transaction (a single
block is never split). A dedicated two-thread Rayon pool prepares owned rows
before the single SQLite writer opens its transaction. Prepared rows temporarily
add memory proportional to this bounded batch; SQL connections are never shared
with Rayon workers. Blocks and the pruning boundary are read from one RocksDB
snapshot without holding the execution mutex. Rows and cursors roll back together on failure. The height and transaction count
are updated once per batch; the writer does not scan or delete expired SQLite rows.
The writer page cache targets 64 MiB. In background mode, automatic WAL checkpoints
run at 65,536 pages, approximately 256 MiB with default SQLite pages. Direct mode
keeps INSERT/COMMIT on the producer and uses a separate connection/thread for
PASSIVE checkpoints, checking the WAL file every 250 ms once it reaches 256 MiB.
At roughly 512 MiB of active WAL frames it also attempts RESTART to permit WAL
reuse during continuous writes. Lock waiting is limited to 250 ms per attempt;
checkpoint I/O itself can take longer and RESTART can briefly block the writer.
`sqlite-checkpoint-profile.json` records checkpoint timing and sampled peak WAL
size. An exited worker restores automatic checkpoints at the next flush;
`checkpoint-error.log` records checkpoint errors. Shutdown joins the worker before
the final checkpoint. Bundled SQLite 3.51.3 fixes the concurrent WAL-reset race.
Neither trigger is a hard WAL size limit: long-lived readers or sustained writes
can delay reclamation. History projection sync runs on segment close and
clean shutdown; the authoritative RocksDB WAL still syncs every block.

Performance measurements and limits are in [PERFORMANCE.md](docs/PERFORMANCE.md).
No Hyperliquid-equivalent performance claim is made. A 100 ms scheduling interval is
a target, not a guaranteed distributed finality latency.

## Peer transports and Ethereum HTTP RPC

HTTP/3 remains the default peer transport. Both transports expose the same typed
Cap’n Proto RPC methods: `status`, `submitTransaction`, `getBlock`, `getBlocks`, and `getEncodedBlocks`.
To additionally enable direct Cap’n Proto RPC over TCP, set this in the serving
node's `config.jsonl`:

```python
config = codec.read(path)
config['capnp_listen'] = '127.0.0.1:26657'
codec.write(path, config)
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
The default configuration keeps 60 seconds of history:

```json
"retention": { "mode": "pruned", "seconds": 60 }
```

The cutoff uses the latest committed block timestamp, not wall-clock time. Blocks
strictly older than that cutoff and their receipt/transaction indexes are removed;
the boundary block and current head remain. Current balances, nonces, contract code,
contract storage, and recent EVM block hashes are preserved. Pruned history returns
`null` through block/receipt lookup. A lagging follower must use an archive peer if
its required history has expired.

The retention worker uses synchronous RocksDB WAL batches capped at 4 blocks or
roughly 1 MiB of delete operations (checked after each block). Each batch atomically removes
expired blocks and advances the retention floor; restart resumes unfinished work.
Receipt lookup requires a retained block, while compaction asynchronously reclaims
receipt indexes below the durable floor. Cap’n Proto files rotate every min(retention seconds, 60) seconds in pruned mode: complete
expired segments are deleted, so the boundary segment can retain less than one extra
segment until rotation; restart rebuilds it from retained database records.

Use `"retention": { "mode": "archive" }` to retain all future history, or initialize
with `make archive`. Switching to archive cannot recover previously deleted data.
The head and current state remain even if block production stops.

```sh
make test-pruning
```

Tests cover cutoff boundaries, receipt-index removal, current-state preservation,
Cap’n Proto cleanup, large archive-to-pruned backlogs, restart, and live pruned/archive
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

All application databases migrate known older schemas automatically when opened:
chain RocksDB, signer RocksDB, and the SQLite index. This is the default; no
opt-in flag, manual migration command, or data reset is required. Upgrades preserve
chain data and the signer's anti-double-sign protection. Unknown newer schemas
and incompatible chain protocols are rejected without resetting data.
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

Read-only Cap’n Proto statistics are available at `/dashboard/stats`. The endpoint reads
at most 61 retained blocks per request. It includes local persistence paths and
process statistics for the dashboard, but does not expose private keys.

## Cap’n Proto runtime logs

Structured events are length-framed binary records in `data/logs/node.capnp`. Each record includes
`timestamp_ms` (Unix milliseconds), `level`, `event`, `pid`, and a `fields` object.
Events include node startup/shutdown, produced blocks, imported sync batches,
connection failures, sync retries, dropped transactions, and fatal errors.
Transaction bodies and private keys are not included in event fields; panic
reports include location only. Logging is serialized across threads.

```sh
make run-log                         # append to ~/.superfrontierchain/node/node.log
make testnet                         # each node has node-N/node.log
```

`make run` emits readable diagnostics to the terminal. `make run-log` redirects only
the node's stderr, keeping build output out of the log file. CLI command results
such as `peer-status` remain on stdout. Logs append across restarts and are not
rotated automatically. Runtime logs are best-effort diagnostics, not fsynced
consensus records; RocksDB journaling and block-history Cap’n Proto remain separate.

## Background start and stop

```sh
make help
make start
make stop
```

`make` alone also shows help. `make start` builds the release binary, initializes
`~/.superfrontierchain/node` if needed, and starts one background node. Open
<http://127.0.0.1:8545/dashboard> to view statistics. Node logs append to
`~/.superfrontierchain/node/node.log`; Python service diagnostics go to `~/.superfrontierchain/node/service.log`.
`make stop` stops repository-owned background/foreground nodes, stress runners and
supervisors (including their descendants). It checks current user, executable/script
identity and process start time before signaling, waits for exit, then forcibly kills
remaining processes after the grace period. It does not delete data or stop unrelated
repositories. Repeated stop commands succeed. These commands support macOS/Linux.

Custom homes do not need to be repeated for `make stop`. Existing config and state
are preserved; a custom `CONFIG` must already exist. Foreground `make run` and
`make testnet` processes belonging to this repository are also stopped.
Run `make test-service` to verify lifecycle and startup-failure cleanup.

Binary bulk RPC benchmarking defaults to TCP. Use `BENCH_TRANSPORT=http3` to select
HTTP/3, or `make bench-transports` to alternate both transports under the same
conditions. See [measured transport results](docs/BINARY-TRANSPORT-BENCHMARK.md).

Python is restricted to supervisor lifecycle/control tooling. All GPU verification,
transaction generation and benchmark measurements execute in Rust. Legacy `mlx`
configurations migrate to native MLX; Python GPU-worker execution is removed.

Before the Merkle-trie change, 1,048,576-transfer tests measured median **241,525 TPS with SQLite ON**
and **249,553 TPS with SQLite OFF** on one node. Two-node durable replay measured
about 114k–119k TPS on the same machine/GPU. These are transfer benchmarks, not
evidence of exceeding Hyperliquid’s order-book/BFT performance. See the
[conditions and remaining performance gates](docs/BINARY-TRANSPORT-BENCHMARK.md).

Stress dashboard remote access: `make stresstest` and `make stressstart` bind
the shared dashboard/Ethereum HTTP RPC listener to `0.0.0.0` by default.
Startup prints localhost, active IPv4 interface URLs, and a Tailscale URL when
the local Tailscale CLI reports an address. Open that URL on an iPad connected
to the same LAN or Tailscale network (subject to its access rules). The background
command briefly relays startup URLs; during a longer build, follow the printed
supervisor log path. Use `STRESS_BIND=127.0.0.1` for local-only HTTP access.
Cap’n Proto sync remains on loopback. No router or firewall settings are changed.

In foreground `make stresstest`, both **Ctrl-C** and **Ctrl-Z** request graceful
shutdown instead of leaving a suspended node. The Python supervisor interrupts
its owned Rust process group and waits for shutdown before releasing its lock;
chain data remains available for the next run. Unresponsive children are killed
after the shutdown timeout. `make test-stress-signals` verifies both keys through
a real pseudo-terminal, including reopening the same chain after shutdown.


## Editable settings and persistence

The default root is `~/.superfrontierchain`: `node/` for the standalone node,
`stress/node-0/` for stress tests, `testnet/` for supervised networks, and
`supervisor/` for process locks and supervisor logs. Existing repository chain
folders are preserved; they are not moved automatically.

Node settings use **config.jsonl**, one top-level field per line. For example,
edit this existing line (do not append a duplicate):

```jsonl
{"retention":{"mode":"pruned","seconds":60}}
```

Restart the node to apply edits. Any positive integer number of seconds is
supported; zero and duplicate fields are rejected. Archive mode remains
`{"retention":{"mode":"archive"}}`. Old `config.capnp` files can still be loaded;
a JSONL companion is written without deleting the original. Genesis, database
records, internal RPC and network payloads remain Cap’n Proto.

SQLite retains all indexed block/transaction/receipt/log rows without pruning.
Its database can grow beyond the RocksDB history window; an asynchronous writer
can still miss source blocks that expire before indexing. Current chain state
is never pruned. Raw diagnostic logs and benchmark reports are separate
from chain-history retention. A 60-second window is not a disk-space quota, and
followers offline longer than the available history cannot replay from this node.

### Reset local chain data

`make clear` (also available as `make clearall`) stops repository nodes and deletes
all default chain homes: `~/.superfrontierchain/{node,stress,testnet}` and
repository-local `.sfc*` archives. This removes RocksDB, SQLite, WALs, history,
and the homes' configuration/certificates; the next start initializes a new chain.
`PERSIST_DIR=...` selects a different persistence root. Unrelated custom homes,
symlink homes, supervisor locks, and build artifacts are preserved.
`make clean` only removes build artifacts.

### Background retention

Server processes perform expiry on a dedicated thread in small batches, outside
transaction admission's node lock. Physical deletion can lag during load; check
`retention_completed_cutoff` and `retention_worker_active` in dashboard storage
statistics. Block commits and deletion batches still use the synced RocksDB WAL.
Shutdown joins the worker, and a cleanup failure stops the server. Startup resumes
outstanding cleanup. See [measured results](docs/PERFORMANCE.md#dedicated-bounded-retention-worker-2026-10-24)
for the remaining sustained-throughput limitation.
