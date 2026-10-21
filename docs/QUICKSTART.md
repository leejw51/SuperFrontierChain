# SFC quickstart

SuperFroniterChain (SFC) is an MIT-licensed Rust blockchain framework with Ethereum
contract execution, 100 ms blocks, and Cap’n Proto RPC over HTTP/3 synchronization.
The runnable topology is one development sequencer and verifying followers.
Distributed validator consensus is not integrated.

Protocol v3 starts in fresh `-v2` homes and preserves old JSON chain directories.
See [binary formats and configuration editing](CAPNP-V3.md).

## Requirements

- Rust and Cargo, a C/C++ toolchain, and libclang for RocksDB.
- The `capnp` compiler for generated protocol bindings.
- Make, uv, Python 3.13 and pycapnp for lifecycle commands and local test networks (`make codec-setup`).
- Apple Silicon + Metal for GPU/HYBRID verification; the default Rust/MLX runtime needs no Python.
  GPU is the default; use `SFC_VERIFICATION_BACKEND=cpu` on other platforms.
- Node.js and npm for integration tooling and dashboard builds.
- macOS or Linux for the Python service's file locks and Unix control socket.

Run commands from the repository root. `make doctor` checks the main native tools;
it does not install dependencies. Builds use `Cargo.lock`.

## Start a node

```sh
make help
make doctor
make codec-setup  # Python tooling for the optional service/testnet commands
make start
```

`make` alone shows help. `make start` builds the optimized release binary,
initializes `.sfc-v3/` if configuration is absent, and starts a background node.
Existing configuration and state are reused. For CPU mode use
`SFC_VERIFICATION_BACKEND=cpu make start`; for HYBRID use
`SFC_VERIFICATION_BACKEND=hybrid make start`. An already-running service must be
stopped before changing its mode. See [backend settings and measurements](VERIFICATION-BACKENDS.md).

Open [the dashboard](http://127.0.0.1:8545/dashboard). It refreshes every two seconds
and shows height, committed TPS, block timing, pending transactions, recent blocks,
accounts, retention, and configured sync transport. TPS is a recent block-window
average; an empty chain has no meaningful rate yet. Connection status refers to
the dashboard API, not peer connectivity.

```sh
curl -s http://127.0.0.1:8545/ \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'

curl -s http://127.0.0.1:8545/dashboard/stats -o /tmp/sfc-stats.capnp
python3 scripts/sfc_codec.py /tmp/sfc-stats.capnp
make peer-status
```

Expected chain ID: `0x1e61` (7777). Peer status uses HTTP/3 by default.

## Stop and restart

```sh
make stop
make start
```

Stop requests graceful shutdown and allows ten seconds before forced termination.
Repeated commands are safe. Stop controls only the background service for that
home; it does not stop foreground nodes or a separately running testnet.

For a custom home, use the same value on both commands:

```sh
make start DATA_DIR=.sfc-local
make stop DATA_DIR=.sfc-local
```

Custom homes still default to the same ports. Change their `config.capnp` listener
addresses before running multiple independent services. If `CONFIG` overrides the
default path, that file must already exist.

For foreground operation on a new home:

```sh
make init DATA_DIR=.sfc-foreground
make run DATA_DIR=.sfc-foreground
# Ctrl-C stops the foreground node.
```

`make dev` uses a debug build; `make run-log` runs in the foreground and appends
node diagnostics to `DATA_DIR/node.log`.

## Defaults and files

| Setting | Default |
| --- | --- |
| Ethereum HTTP JSON-RPC | `127.0.0.1:8545` |
| Peer HTTP/3 over UDP | `127.0.0.1:26656` |
| Direct Cap’n Proto TCP | Disabled |
| Block interval | 100 ms |
| History retention | 604800 seconds, approximately one week |
| EVM fork | Shanghai |
| Chain ID | 7777 |

Listeners must use loopback addresses in the current development implementation.

| Path under `.sfc-v3/` | Purpose |
| --- | --- |
| `config.capnp`, `genesis.capnp` | Node configuration and chain initialization |
| `peer-cert.der`, `peer-key.der` | Local TLS identity; keep the private key private |
| `data/rocksdb/` | Authoritative state, history, indexes, and native WAL |
| `data/history/*.capnp` | Recoverable hourly block-history projection |
| `node.log` | Readable node/GPU diagnostics |
| `data/logs/node.capnp` | Structured binary events, indexed in SQLite |
| `service.log` | Python service diagnostics |
| `service.lock`, `control.sock` | Background process ownership and control |

Runtime logs append across restarts without automatic rotation. They are separate
from RocksDB's durable journal and the block-history projection.

## Pruning and archive mode

The generated configuration enables pruning:

```json
{"retention":{"mode":"pruned","seconds":604800}}
```

The cutoff follows committed block time. Old blocks and receipt indexes expire;
current balances, code, and contract storage remain. Hourly Cap’n Proto rotation may
retain less than one extra hour in the boundary segment. Disk space is reclaimed
through RocksDB compaction rather than immediately upon logical deletion.

To create an archive home:

```sh
make archive DATA_DIR=.sfc-archive
make start DATA_DIR=.sfc-archive
make stop DATA_DIR=.sfc-archive
```

Archive mode keeps all future history. It cannot restore already pruned blocks.

## Multiple nodes

Stop a default single node first to free its ports, then run:

```sh
make stop
make testnet
```

The Python supervisor starts one sequencer and three followers. Default RPC ports
are 8545–8548; HTTP/3 UDP ports are 26656–26659. Each node has its own data and
`node.log` under `.sfc-testnet-v3/node-N/`. Submit transactions to node 0. Followers
replay its blocks over certificate-pinned HTTP/3. Ctrl-C shuts down the whole group.
The supervisor restarts crashed processes with a bounded retry budget.

```sh
make testnet NODES=6 TESTNET_DIR=.sfc-six RPC_PORT=8645 PEER_PORT=27656
```

Use a new home when changing node count. Existing network configuration is reused,
so port options only apply when creating the network.

## Ethereum contracts

Connect tools to `http://127.0.0.1:8545/`, chain ID 7777. Compile Solidity for
`evmVersion: "shanghai"`. The local funded account is
`0x7e5f4552091a69125d5dfcb7b8c2659029395bdf`, with development private key
`0x` followed by 63 zeroes and `1`. This publicly known key is for local tests only.

```sh
make erc20
```

The test deploys an ERC-20 and verifies transfers, allowances, events, reverts,
persistence, and follower replay. See [Ethereum compatibility](ETHEREUM.md) for
supported methods and limitations.

## Test and benchmark

| Command | Coverage |
| --- | --- |
| `make test` | Rust unit and integration tests |
| `make check` | Formatting, Clippy, and Rust tests |
| `make integration` | Process smoke, ERC-20, supervisor, TCP, and pruning tests |
| `make test-sync` | HTTP/3 catch-up, crash recovery, and pruning scenarios |
| `make test-service` | Background start/stop and failure cleanup |
| `make benchmark` | Rust-only release committed TPS/CPU; SQLite ON/OFF |
| `make bench-network` | Two-node binary RPC admission through durable follower replay |
| `make test-emergencies` | 15 crash, freeze, partition and recovery scenarios |

```sh
make benchmark BENCH_TRANSACTIONS=262144 BENCH_REPEAT=3 BENCH_SQLITE=both
make stresstest STRESS_SQLITE=on
make stop
```

`benchmark` defaults to 262,144 transfers per trial, three trials per SQLite mode,
4,096 requests per batch and a 10 ms block interval. Rust generates signatures
before timing; measured TPS includes RPC, verification, execution and durable commit.
`bench-network` also waits for follower replay. `bench` remains the separate Rust
execution microbenchmark. See [verification and measurements](VERIFICATION-BACKENDS.md).

## Troubleshooting

- **Startup failed:** inspect `node.log` and `service.log`; check port conflicts.
- **Genesis mismatch:** use the original genesis for existing data or a fresh home.
- **Follower missing history:** configure an archive peer with the same chain and
  genesis. Automatic snapshot sync and peer failover are not implemented.
- **TLS error:** pin the upstream's certificate and use its matching server name;
  generated identities use `localhost`.
- **Dashboard stale:** check whether the node is running and inspect its logs.
- **Corrupt journal:** startup deliberately refuses corrupted WAL records; there
  is no automatic destructive repair or silent rollback.

Next: [protocol](PROTOCOL.md) · [architecture](ARCHITECTURE.md).

Binary bulk RPC benchmarking defaults to TCP. Use `BENCH_TRANSPORT=http3` to select
HTTP/3, or `make bench-transports` to alternate both transports under the same
conditions. See [measured transport results](BINARY-TRANSPORT-BENCHMARK.md).
