# Emergency and recovery tests

Run `make test-emergencies` for two real nodes controlled by the Python supervisor.
The suite is also part of `make integration`. It uses temporary data directories,
loopback ports, signed legacy/type-2 transactions and a deployed EVM contract.
Only processes created by the test are signaled. All owned processes are checked
for cleanup; frozen nodes are resumed before cleanup if an assertion fails.

To save a machine-readable report after building/installing test dependencies:

```sh
python3 scripts/test_emergencies.py --report /tmp/sfc-emergencies.json
```

The recorded local run is in [emergency-results-2026-10-20.json](emergency-results-2026-10-20.json).

| Scenario | Required result |
| --- | --- |
| Baseline contract and transfers | Nodes agree on blocks, receipts, nonce, balance and contract storage. |
| Follower killed three times | Supervisor automatically restarts it each time; committed state survives. |
| Follower offline for 70+ blocks | Revived follower catches up over multiple bounded sync batches. |
| Follower frozen during writes | Sequencer progresses; SIGCONT lets the follower catch up. |
| Sequencer frozen | Follower serves reads, rejects writes and does not produce blocks; progress resumes after SIGCONT. |
| Sequencer killed | Restart preserves acknowledged blocks/receipts and accepts subsequent transactions. |
| Both nodes killed | Follower can reopen first; both converge after sequencer revival. |
| Bidirectional HTTP/3 blackout | UDP relay drops actual QUIC packets until an RPC retry occurs; restoring traffic recovers synchronization. |
| Incorrect TLS trust | Follower refuses synchronization; correcting trust and restarting restores progress. |
| Incorrect genesis | Existing database refuses startup; restoring the original genesis allows recovery. |
| Accepted but unmined transaction lost | Crash clears volatile pending state; resubmitting the same bytes executes exactly once. |
| Sequencer killed during submission | Client reconciles the committed nonce, retries remaining signed transactions, and nodes converge without duplicate balance effects. |
| Torn JSONL history segment | Restart reconstructs the projection from authoritative RocksDB records. |
| Restart budget exhausted | Supervisor reports failure instead of silently exceeding the configured budget. |
| Follower offline beyond pruning retention | Follower refuses to advance across missing history and preserves its existing state. |

After recoverable faults, the suite compares block hashes/state roots at a shared
height, checks previously acknowledged block contents and receipts for changes,
and checks exact balances, nonces and contract storage. A fault test passes when
its expected behavior occurs; this includes deliberate refusal to start or sync.

The existing `cargo test --locked --test journal` additionally verifies process-kill
recovery from the RocksDB WAL before SST files exist, preservation of the durable
signing guard, and refusal to open corrupted chain/signing journals. The ignored
worker is launched by its parent test, not an omitted recovery test.

## Operational implications

- There is no sequencer failover. A killed sequencer must be restarted before new
  blocks can be produced. Followers are read-only replicas.
- Successful transaction submission is not durable confirmation. Clients should
  check receipts/committed nonce and retain signed bytes for safe resubmission.
- A history gap caused by pruning requires an archive peer or a future verified
  snapshot mechanism. Retrying the same pruned peer cannot repair the gap.
- A torn JSONL projection is recoverable; corrupt authoritative journals cause
  startup to fail closed and require operator recovery.

These tests exercise local process failures and a bidirectional packet blackout.
They do not simulate physical power loss, ENOSPC, filesystem hardware faults,
supervisor SIGKILL, arbitrary WAN packet schedules, Byzantine consensus, or
multi-machine/architecture failures. The suite uses short test block intervals;
the recorded durations are not production recovery-time guarantees.
