#!/usr/bin/env python3
"""Fault injection against two real nodes owned by the Python supervisor."""
import argparse
import contextlib
import json
import sfc_codec as codec
import pathlib
import select
import signal
import socket
import subprocess
import tempfile
import threading
import time
import urllib.request
from supervisor import ROOT, Supervisor


class RpcError(RuntimeError):
    pass


def rpc(url, method, params=None):
    request = urllib.request.Request(url, json.dumps({
        'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or []
    }).encode(), {'Content-Type': 'application/json'})
    with urllib.request.urlopen(request, timeout=2) as response:
        result = json.load(response)
    if 'error' in result:
        raise RpcError(result['error']['message'])
    return result['result']


class UdpRelay:
    """One follower's QUIC relay; dropping packets simulates a bidirectional partition."""
    def __init__(self, upstream):
        host, port = upstream.rsplit(':', 1)
        self.upstream = (host, int(port))
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.socket.bind(('127.0.0.1', 0))
        self.socket.settimeout(0.1)
        self.address = '127.0.0.1:' + str(self.socket.getsockname()[1])
        self.drop = threading.Event()
        self.stopped = threading.Event()
        self.dropped = 0
        self.error = None
        self.thread = threading.Thread(target=self.run, daemon=True)
        self.thread.start()

    def run(self):
        upstreams = {}
        clients = {}
        try:
            while not self.stopped.is_set():
                readable, _, _ = select.select([self.socket, *clients], [], [], 0.1)
                for sock in readable:
                    data, source = sock.recvfrom(65535)
                    if self.drop.is_set():
                        self.dropped += 1
                        continue
                    if sock is self.socket:
                        if source not in upstreams:
                            upstream = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                            upstream.connect(self.upstream)
                            upstreams[source] = upstream
                            clients[upstream] = source
                        upstreams[source].send(data)
                    else:
                        self.socket.sendto(data, clients[sock])
        except OSError as error:
            self.error = error
        finally:
            for sock in clients:
                sock.close()

    def close(self):
        self.stopped.set()
        self.thread.join(timeout=3)
        self.socket.close()
        assert not self.thread.is_alive(), 'relay thread leaked'
        assert self.error is None, self.error


class Network:
    def __init__(self, home, fixture):
        self.home, self.fixture = pathlib.Path(home), fixture
        self.children = {}
        self.receipts = {}
        self.blocks = {}
        self.end = 0
        self.network = Supervisor(home, ROOT / 'target/debug/sfc', nodes=2,
                                  rpc_port=0, peer_port=0, max_restarts=64)

    def start(self, retention=None):
        self.network.start()
        self.remember()
        self.network.close()
        for i in range(2):
            self.configure(i, block_interval_ms=100, max_block_transactions=8,
                           **({'retention': retention} if retention else {}))
        self.network = Supervisor(self.home, ROOT / 'target/debug/sfc', nodes=2,
                                  rpc_port=0, peer_port=0, max_restarts=64)
        self.network.start()
        self.remember()
        self.urls = ['http://' + n['config']['rpc_listen'] for n in self.network.nodes]
        self.until(lambda: self.height(0) >= 2 and self.height(1) >= 2)

    def configure(self, index, **fields):
        path = self.home / f'node-{index}/config.capnp'
        config = codec.loads(path.read_bytes())
        config.update(fields)
        path.write_bytes(codec.dumps(config))
        return config

    def remember(self):
        for node in self.network.nodes:
            process = node['process']
            if process:
                self.children[process.pid] = process

    def tick(self):
        self.network.tick()
        self.remember()

    def until(self, predicate, timeout=25):
        deadline = time.monotonic() + timeout
        last_error = None
        while time.monotonic() < deadline:
            self.tick()
            try:
                if predicate():
                    return
            except OSError as error:
                last_error = error
            time.sleep(0.03)
        raise AssertionError(f'timed out: {last_error}')

    def height(self, index):
        return int(rpc(self.urls[index], 'eth_blockNumber'), 16)

    def process(self, index):
        return self.network.nodes[index]['process']

    def kill(self, index, hold=False):
        process = self.process(index)
        process.kill()
        process.wait(timeout=5)
        assert process.returncode == -signal.SIGKILL
        if hold:
            self.network.nodes[index]['retry_at'] = float('inf')

    def launch(self, index):
        self.network.nodes[index]['retry_at'] = time.monotonic()
        self.tick()
        assert self.process(index).poll() is None

    def revive(self, index):
        self.launch(index)
        self.until(lambda: self.height(index) >= 0)

    def commit(self, count, both=True):
        stop = self.end + count
        assert stop <= len(self.fixture['raw'])
        for index in range(self.end, stop):
            assert rpc(self.urls[0], 'eth_sendRawTransaction', [self.fixture['raw'][index]]) == self.fixture['hashes'][index]
        self.until(lambda: all(rpc(self.urls[0], 'eth_getTransactionReceipt', [h])
                               for h in self.fixture['hashes'][self.end:stop]))
        self.end = stop
        if both:
            self.check()

    def check(self):
        target = self.height(0)
        self.until(lambda: self.height(1) >= target)
        blocks = [rpc(url, 'eth_getBlockByNumber', [hex(target), False]) for url in self.urls]
        assert blocks[0] and blocks[0] == blocks[1], 'block/root divergence'
        self.blocks.setdefault(target, blocks[0])
        for height, expected in self.blocks.items():
            for url in self.urls:
                assert rpc(url, 'eth_getBlockByNumber', [hex(height), False]) == expected, 'acknowledged block changed after recovery'
        for tx_hash in self.fixture['hashes'][:self.end]:
            receipts = [rpc(url, 'eth_getTransactionReceipt', [tx_hash]) for url in self.urls]
            assert receipts[0] and receipts[0] == receipts[1], 'receipt missing or divergent'
            assert receipts[0]['status'] == '0x1'
            old = self.receipts.setdefault(tx_hash, receipts[0])
            assert old == receipts[0], 'acknowledged receipt changed after recovery'
        transfers = max(0, self.end - 2)
        for url in self.urls:
            assert int(rpc(url, 'eth_getTransactionCount', [self.fixture['owner'], 'latest']), 16) == self.end
            assert int(rpc(url, 'eth_getBalance', [self.fixture['recipient'], 'latest']), 16) == transfers * (transfers + 1) // 2
            if self.end >= 2:
                assert int(rpc(url, 'eth_getStorageAt', [self.fixture['contract'], '0x0', 'latest']), 16) == 42

    def log(self, index):
        return (self.home / f'node-{index}/node.log').read_text()

    def close(self):
        # SIGCONT makes cleanup safe even if an assertion interrupted a freeze test.
        self.remember()
        for process in self.children.values():
            if process.poll() is None:
                process.send_signal(signal.SIGCONT)
        self.network.close()
        assert all(p.poll() is not None for p in self.children.values()), 'node process leaked'


@contextlib.contextmanager
def running(fixture, retention=None):
    with tempfile.TemporaryDirectory(prefix='sfc-emergency-') as tmp:
        network = None
        try:
            network = Network(tmp, fixture)
            network.start(retention)
            yield network
        except BaseException:
            for path in pathlib.Path(tmp).glob('node-*/node.log'):
                print(path.name, path.parent.name, path.read_text()[-6000:], flush=True)
            raise
        finally:
            if network:
                network.close()


def exercise(fixture, record):
    with running(fixture) as n:
        def baseline():
            n.commit(6)
        record('baseline_committed_contract_and_transfers', baseline)

        def repeated_follower_crashes():
            for _ in range(3):
                old = n.process(1).pid
                n.kill(1)
                n.commit(2, both=False)
                n.until(lambda: n.process(1).pid != old and n.height(1) >= n.height(0) - 1)
                n.check()
            assert n.network.nodes[1]['restarts'] == 3
        record('follower_SIGKILL_three_times_automatic_revival', repeated_follower_crashes)

        def offline_catchup():
            n.kill(1, hold=True)
            start = n.height(0)
            n.commit(16, both=False)
            n.until(lambda: n.height(0) >= start + 70)
            n.revive(1)
            n.check()
        record('follower_offline_70_blocks_multibatch_catchup', offline_catchup)

        def frozen_follower():
            n.process(1).send_signal(signal.SIGSTOP)
            n.commit(6, both=False)
            n.process(1).send_signal(signal.SIGCONT)
            n.check()
        record('follower_SIGSTOP_SIGCONT_during_writes', frozen_follower)

        def frozen_sequencer():
            n.process(0).send_signal(signal.SIGSTOP)
            # Drain any already committed blocks, then check that the follower cannot take over.
            time.sleep(0.7)
            height = n.height(1)
            time.sleep(0.5)
            assert n.height(1) == height, 'follower unexpectedly produced blocks'
            try:
                rpc(n.urls[1], 'eth_sendRawTransaction', [fixture['raw'][n.end]])
                raise AssertionError('follower accepted write during sequencer outage')
            except RpcError as error:
                assert 'read-only' in str(error)
            n.process(0).send_signal(signal.SIGCONT)
            n.commit(2)
        record('sequencer_freeze_stalls_chain_then_resumes', frozen_sequencer)

        def sequencer_crash():
            n.kill(0, hold=True)
            before = n.height(1)
            time.sleep(0.3)
            n.revive(0)
            n.until(lambda: n.height(1) > before)
            n.check()
            n.commit(2)
        record('sequencer_SIGKILL_committed_receipts_survive', sequencer_crash)

        def simultaneous_crash():
            # Stop first so neither node can advance between the two kills.
            for i in range(2):
                n.process(i).send_signal(signal.SIGSTOP)
            for i in range(2):
                n.kill(i, hold=True)
            n.revive(1)  # Follower can reopen and serve reads before the upstream returns.
            assert int(rpc(n.urls[1], 'eth_getTransactionCount', [fixture['owner'], 'latest']), 16) == n.end
            n.revive(0)
            n.check()
            n.commit(2)
        record('both_nodes_killed_follower_first_revival', simultaneous_crash)

        def traffic_partition():
            relay = UdpRelay(n.network.nodes[0]['config']['peer_listen'])
            original = n.network.nodes[1]['config']['sync_peer']
            try:
                n.kill(1, hold=True)
                n.configure(1, sync_peer={**original, 'address': relay.address})
                n.revive(1)
                n.check()
                offset = len(n.log(1))
                relay.drop.set()
                # Allow any already received response to finish before recording the frozen height.
                time.sleep(0.3)
                stuck = n.height(1)
                n.commit(8, both=False)
                # Cross the five-second RPC deadline and require an actual reconnect cycle.
                n.until(lambda: 'sync_retry' in n.log(1)[offset:], timeout=15)
                assert n.height(1) == stuck
                assert relay.dropped > 0, 'no traffic was actually dropped'
                relay.drop.clear()
                n.check()
            finally:
                n.kill(1, hold=True)
                n.configure(1, sync_peer=original)
                relay.close()
                n.revive(1)
            n.check()
        record('bidirectional_HTTP3_packet_blackout_and_reconnect', traffic_partition)

        def wrong_tls_identity():
            original = n.network.nodes[1]['config']['sync_peer']
            n.kill(1, hold=True)
            own_cert = n.network.nodes[1]['config']['tls_cert']
            n.configure(1, sync_peer={**original, 'certificate': own_cert})
            offset = len(n.log(1))
            n.revive(1)
            stuck = n.height(1)
            n.commit(2, both=False)
            n.until(lambda: 'sync_retry' in n.log(1)[offset:])
            assert n.height(1) == stuck
            n.kill(1, hold=True)
            n.configure(1, sync_peer=original)
            n.revive(1)
            n.check()
        record('wrong_TLS_trust_rejected_then_repaired', wrong_tls_identity)

        def wrong_genesis():
            n.kill(1, hold=True)
            path = pathlib.Path(n.network.nodes[1]['config']['genesis'])
            original = path.read_bytes()
            changed = codec.loads(original)
            changed['chain_id'] += 1
            path.write_bytes(codec.dumps(changed))
            offset = len(n.log(1))
            n.launch(1)
            assert n.process(1).wait(timeout=5) != 0
            n.network.nodes[1]['retry_at'] = float('inf')
            assert 'genesis does not match existing database' in n.log(1)[offset:]
            path.write_bytes(original)
            n.revive(1)
            n.check()
        record('wrong_genesis_fails_closed_then_restores', wrong_genesis)

        def volatile_pending():
            before = n.height(0)
            n.kill(0, hold=True)
            n.configure(0, block_interval_ms=60_000)
            n.revive(0)
            n.until(lambda: n.height(0) > before)  # First interval tick executes immediately.
            tx_hash = fixture['hashes'][n.end]
            raw = fixture['raw'][n.end]
            assert rpc(n.urls[0], 'eth_sendRawTransaction', [raw]) == tx_hash
            assert rpc(n.urls[0], 'eth_getTransactionReceipt', [tx_hash]) is None
            n.kill(0, hold=True)
            n.revive(0)
            assert rpc(n.urls[0], 'eth_getTransactionReceipt', [tx_hash]) is None
            assert int(rpc(n.urls[0], 'eth_getTransactionCount', [fixture['owner'], 'latest']), 16) == n.end
            n.kill(0, hold=True)
            n.configure(0, block_interval_ms=100)
            n.revive(0)
            n.commit(1)  # Resubmit exactly the same bytes; balance detects duplicate execution.
        record('accepted_unmined_transaction_lost_then_resubmitted_once', volatile_pending)

        def crash_during_submission():
            start, stop = n.end, n.end + 16
            admitted = threading.Event()
            outcomes = []
            def send():
                for index in range(start, stop):
                    try:
                        outcomes.append(rpc(n.urls[0], 'eth_sendRawTransaction', [fixture['raw'][index]]))
                        admitted.set()
                    except (OSError, RpcError):
                        break
            worker = threading.Thread(target=send)
            worker.start()
            assert admitted.wait(timeout=5)
            n.kill(0, hold=True)
            worker.join(timeout=5)
            assert not worker.is_alive()
            assert outcomes
            n.revive(0)
            nonce = int(rpc(n.urls[0], 'eth_getTransactionCount', [fixture['owner'], 'latest']), 16)
            assert start <= nonce <= stop
            # An interrupted HTTP result is ambiguous: reconcile committed nonce before retrying.
            for index in range(nonce, stop):
                assert rpc(n.urls[0], 'eth_sendRawTransaction', [fixture['raw'][index]]) == fixture['hashes'][index]
            n.until(lambda: rpc(n.urls[0], 'eth_getTransactionReceipt', [fixture['hashes'][stop - 1]]) is not None)
            n.end = stop
            n.check()
        record('sequencer_crash_during_submission_reconcile_and_retry', crash_during_submission)

        def torn_projection():
            n.kill(1, hold=True)
            history = pathlib.Path(n.network.nodes[1]['config']['data_dir']) / 'history'
            segment = sorted(history.glob('*.capnp'))[-1]
            segment.write_bytes(b'\x20\x00\x00')
            n.revive(1)
            n.check()
            lines = list(codec.blocks(segment.open('rb')))
            assert lines and all('state_root' in block for block in lines)
        record('torn_Capnp_projection_rebuilt_from_durable_database', torn_projection)

        def restart_exhaustion():
            # Put the follower at its configured budget and make the final death permanent.
            n.network.max_restarts = n.network.nodes[1]['restarts']
            n.kill(1, hold=True)
            try:
                n.tick()
                raise AssertionError('restart budget ignored')
            except RuntimeError as error:
                assert 'restart limit reached' in str(error)
        record('restart_budget_exhaustion_reports_failure', restart_exhaustion)

    def pruned_gap():
        with running(fixture, {'mode': 'pruned', 'seconds': 1}) as n:
            n.commit(2)
            n.process(0).send_signal(signal.SIGSTOP)
            time.sleep(0.3)
            old = n.height(1)
            n.kill(1, hold=True)
            n.process(0).send_signal(signal.SIGCONT)
            n.until(lambda: int(rpc(n.urls[0], 'eth_getBlockByNumber', ['earliest', False])['number'], 16) > old + 1)
            offset = len(n.log(1))
            n.revive(1)
            n.until(lambda: 'peer pruned required history' in n.log(1)[offset:])
            assert n.height(1) == old, 'follower advanced across a missing history gap'
            assert int(rpc(n.urls[1], 'eth_getStorageAt', [fixture['contract'], '0x0', 'latest']), 16) == 42
    record('downtime_beyond_retention_refuses_unsafe_catchup', pruned_gap)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--report', type=pathlib.Path)
    args = parser.parse_args()
    fixture = codec.loads(subprocess.check_output(['node', 'scripts/network_fixture.mjs', '128'], cwd=ROOT, timeout=15))
    results = []
    def record(name, test):
        start = time.monotonic()
        item = {'scenario': name}
        try:
            test()
            item['status'] = 'passed'
            print('PASS:', name, flush=True)
        except BaseException as error:
            item.update(status='failed', error=str(error))
            raise
        finally:
            item['seconds'] = round(time.monotonic() - start, 3)
            results.append(item)
    try:
        exercise(fixture, record)
    finally:
        if args.report:
            args.report.write_bytes(codec.dumps({'nodes': 2, 'transport': 'http3', 'scenarios': results}, indent=2))
    print(f'PASS: {len(results)} emergency scenarios; all owned node processes cleaned up', flush=True)


if __name__ == '__main__':
    main()
