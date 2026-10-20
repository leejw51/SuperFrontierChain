# CPU, GPU and HYBRID node verification

The subsequent [GPU latency enhancement](GPU-ENHANCEMENT.md) improves small-batch
network TPS by 29% in paired trials. The measurements below describe the original
node integration; the new report contains the current GPU comparison.

The development node supports all three transaction authentication modes. **GPU is
the default**, including configurations that omit the `verification` object.
This applies to single and batched transaction submission and follower block replay.
EVM execution, state updates, hashing, storage and EVM precompiles still run on CPU.
The topology remains a sequencer plus verifying followers, without distributed BFT.

## Selecting a backend

```sh
make mlx-setup                         # Apple Silicon; Python 3.13, uv, pinned MLX
make release
./target/release/sfc init --home .sfc
./target/release/sfc run --config .sfc/config.json                       # GPU
./target/release/sfc run --config .sfc/config.json --verification-backend cpu
./target/release/sfc run --config .sfc/config.json --verification-backend hybrid

# Applies to nodes started by the Python service/supervisor too:
SFC_VERIFICATION_BACKEND=cpu make testnet
python3 scripts/supervisor.py --nodes 2 --verification-backend hybrid
```

Precedence is run CLI flag, `SFC_VERIFICATION_BACKEND`, then persisted configuration.
`init --verification-backend cpu` creates an explicitly CPU-configured home.
The JSON object is:

```json
"verification": {
  "backend": "gpu",
  "python": "/absolute/path/to/SuperFrontierChain/target/mlx-venv/bin/python",
  "worker": "/absolute/path/to/SuperFrontierChain/experiments/mlx_ecdsa/worker.py",
  "timeout_seconds": 30
}
```

Generated paths point to the source checkout used to build the binary. Change them
if relocating the binary/checkout. Relative paths are resolved against config.json's
directory. CPU mode does not launch Python or need MLX. GPU and HYBRID require Metal;
startup fails clearly if unavailable. Ubuntu CI explicitly selects CPU.

`CPU` uses libsecp256k1 and ordered Rayon batches. `GPU` sends all parsed recovery
records to a persistent MLX worker. `HYBRID` concurrently sends the first 40% to GPU
and the remaining 60% to CPU, then merges the actual recovered keys in input order.
Singleton HYBRID work goes to GPU; a batch of two or more uses both processors.

```sh
curl -s http://127.0.0.1:8545/ -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"sfc_verificationStatus","params":[]}'
```

Status includes the effective backend, Rust/worker PIDs and CPU/GPU record counters.
Counters count completed recovery attempts, including transactions subsequently
rejected by admission (for example a full mempool). Startup self-tests are excluded.
Counters reset when a node restarts. They are diagnostics and never enter state roots.

## Ordering, correctness and failures

All paths share canonical RLP, chain ID, low-S and parity checks. The GPU kernel uses
exact integer modular arithmetic. Recovery results preserve input order regardless
of GPU/CPU completion timing. Admission and EVM execution remain sequential.
Malformed individual transactions retain their own error slots. Batch resource-limit
failures and worker/protocol failures reject the authentication batch before admission.

The local worker protocol checks request IDs, response counts, bounded message sizes
and public-key encodings. Every worker startup executes valid/invalid GPU vectors
against a CPU reference. Read/write socket operations time out (30 seconds by default;
configurable 1–120 seconds). Any failed exchange discards and reaps the worker, so a
late response cannot authenticate a different batch. A subsequent request starts a
fresh worker. There is **no silent CPU fallback**, including in HYBRID. A failed
follower verification leaves that block uncommitted and the sync loop retries.
Workers exit on parent socket EOF; normal node shutdown kills and reaps its worker.

Tests compare CPU/GPU/HYBRID sender addresses, hashes, acceptance, exact blocks,
receipts and state roots, including repeated mixed-validity batches of up to 4,096
records. Separate kernel differential tests cover 65,829 recovery vectors, 33,568
arithmetic comparisons and 10,008 GLV decomposition cases. This is tested consistency
on the available Apple hardware/software, not a cryptographic audit or a proof across
all devices. The experimental worker and kernels are trusted local code.

## Two-node TPS and CPU measurement

Hardware: Apple M5 Max, 18 logical CPUs, macOS 27.0.1, MLX 0.32.4. Release builds;
two local processes connected through certificate-pinned HTTP/3. A signed fixture
alternates legacy/type-2 native transfers. Contract deployment/call warms up the
chain before timing. The timed phase includes HTTP admission, signatures, ordered
EVM execution, synchronous RocksDB WAL commits, network replay and follower commit.
The ending receipt, balances, nonces and block/state-root agreement are checked.
This measures committed replicated TPS, not signature recoveries per second.

Three trials rotate backend order. Each larger-batch trial submits 65,536 transfers
in RPC batches of 4,096, using the default 100 ms block interval, 4,096 transactions
per block and 16,384-slot mempool. The RPC boundary now accepts at most 4,096 requests
and a 5 MiB JSON body; raw transaction batch bytes remain limited to 2 MiB.
Normal mempool backpressure retries only rejected entries; retry verification and
waiting are included in timing and CPU cost. The raw report records attempts, since
faster admission can cause more retries. This is a short burst benchmark, not a
long-duration stress test or a signature-only comparison at equal recovery counts.

CPU usage is cumulative process user+system CPU time across **both Rust nodes plus
both MLX workers**. 100% means one CPU core, not the entire machine. The Python load
generator is reported separately and excluded. macOS `ps` exposes 10 ms CPU-time
resolution. CPU samples bracket the measured interval, adding small sampling overhead.
GPU utilization, watts and energy are not measured.

**4,096 requests/batch; 65,536 committed transfers** (medians of three trials):

| Mode | Committed TPS | TPS range | Total host CPU | CPU ms/committed tx |
| --- | ---: | ---: | ---: | ---: |
| CPU | 39,227 | 39,158–39,349 | 370.5% | 0.0943 |
| GPU | 38,180 | 37,546–39,809 | 116.3% | 0.0301 |
| HYBRID | 38,758 | 38,474–40,212 | 246.0% | 0.0632 |

**100 requests/batch; 16,384 committed transfers** (medians of three trials):

| Mode | Committed TPS | TPS range | Total host CPU | CPU ms/committed tx |
| --- | ---: | ---: | ---: | ---: |
| CPU | 29,877 | 28,714–29,993 | 247.1% | 0.0830 |
| GPU | 9,594 | 9,582–9,606 | 46.8% | 0.0488 |
| HYBRID | 8,929 | 8,875–8,963 | 84.5% | 0.0952 |


The configured block cadence and size target a 40,960 TPS ceiling. Larger batches
approach that ceiling, so these measurements do not establish maximum verifier
throughput. GPU reduces host CPU substantially while giving similar large-batch TPS;
it is not universally faster. Small batches pay dispatch and IPC overhead and do
not fill the GPU sufficiently. Higher throughput requires changing the block/cadence
limits and then measuring execution, storage and replay again.

The earlier 841,333 GPU recoveries/sec figure is a 65,536-signature microbenchmark;
it does not represent node TPS. Node recovery batches are bounded to 4,096.

## Reproduce and validate

```sh
make test-verification
python3 scripts/test_emergencies.py --report target/gpu-emergencies.json
python3 scripts/benchmark_network.py --backend all --rpc-batch 100 --transactions 16384 --repeat 3
python3 scripts/benchmark_network.py --backend all --rpc-batch 4096 --transactions 65536 --repeat 3
```

The backend network suite uses CPU/CPU, GPU/GPU, HYBRID/HYBRID and GPU/CPU pairings.
It covers mixed legacy/type-2 batches, malformed and oversized entries, RPC limits,
worker SIGKILL and SIGSTOP/timeouts, worker replacement, no CPU fallback, follower
worker failure, sequencer/follower process kills, state/receipt agreement and orphan
worker cleanup. Rust protocol tests inject wrong IDs, missing results and invalid
public keys. The existing 15 network emergency scenarios also run with GPU default.

Reports retain executable/source hashes and per-trial CPU breakdowns:

- [4,096-request batches](network-backends-batched-results-2026-10-20.jsonl)
- [100-request batches](network-backends-results-2026-10-20.jsonl)
- [GPU network emergencies](gpu-emergency-results-2026-10-20.json)
