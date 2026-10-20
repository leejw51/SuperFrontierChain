#!/usr/bin/env python3
"""Real supervised nodes: signed transactions, HTTP/3 replay, crash recovery and cleanup."""
import argparse
import json
import pathlib
import subprocess
import tempfile
import time
from supervisor import Supervisor, ROOT
from smoke import rpc


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--nodes', type=int, default=4)
    count = parser.parse_args().nodes
    with tempfile.TemporaryDirectory(prefix='sfc-supervisor-') as tmp:
        network = Supervisor(tmp, ROOT / 'target/debug/sfc', nodes=count, rpc_port=0, peer_port=0)
        children = []
        try:
            network.start()
            children.extend(n['process'] for n in network.nodes)
            urls = ['http://' + n['config']['rpc_listen'] for n in network.nodes]

            def until(predicate):
                deadline = time.monotonic() + 25
                while time.monotonic() < deadline:
                    network.tick()
                    try:
                        if predicate():
                            return
                    except (OSError, AssertionError):
                        pass
                    time.sleep(0.05)
                raise AssertionError('network failed to converge')

            until(lambda: all(int(rpc(url, 'eth_blockNumber'), 16) >= 3 for url in urls))
            fixture = json.loads(subprocess.check_output(
                ['node', 'scripts/network_fixture.mjs'], cwd=ROOT, text=True, timeout=15))
            for raw, expected in zip(fixture['raw'], fixture['hashes']):
                assert rpc(urls[0], 'eth_sendRawTransaction', [raw]) == expected

            def replicated_workload():
                for tx_hash in fixture['hashes']:
                    receipts = [rpc(url, 'eth_getTransactionReceipt', [tx_hash]) for url in urls]
                    if not all(receipts):
                        return False
                    assert receipts[0]['status'] == '0x1'
                    assert all(receipt == receipts[0] for receipt in receipts)
                    height = receipts[0]['blockNumber']
                    blocks = [rpc(url, 'eth_getBlockByNumber', [height, False]) for url in urls]
                    assert blocks[0] and all(block == blocks[0] for block in blocks)
                for url in urls:
                    assert int(rpc(url, 'eth_getBalance', [fixture['recipient'], 'latest']), 16) == 528
                    assert int(rpc(url, 'eth_getStorageAt', [fixture['contract'], '0x0', 'latest']), 16) == 42
                    assert int(rpc(url, 'eth_getTransactionCount', [fixture['owner'], 'latest']), 16) == len(fixture['raw'])
                    call = {'from': fixture['contract'], 'to': fixture['contract']}
                    assert int(rpc(url, 'eth_call', [call, 'latest']), 16) == int(fixture['contract'], 16)
                    assert int(rpc(url, 'eth_estimateGas', [call]), 16) > 21000
                return True

            until(replicated_workload)
            try:
                rpc(urls[1], 'eth_sendRawTransaction', [fixture['raw'][0]])
                raise RuntimeError('follower accepted a write')
            except AssertionError as error:
                assert 'read-only' in str(error)
            try:
                rpc(urls[0], 'eth_sendRawTransaction', [fixture['raw'][0]])
                raise RuntimeError('sequencer accepted a replay')
            except AssertionError as error:
                assert 'nonce' in str(error).lower()
            duplicate = Supervisor(tmp, ROOT / 'target/debug/sfc', nodes=count)
            try:
                duplicate.start()
                raise AssertionError('duplicate supervisor accepted')
            except RuntimeError as error:
                assert 'another supervisor' in str(error)
            for index in (count - 1, 0):
                before = int(rpc(urls[0], 'eth_blockNumber'), 16)
                network.nodes[index]['process'].kill()
                until(lambda: all(int(rpc(url, 'eth_blockNumber'), 16) > before + 2 for url in urls))
                assert network.nodes[index]['restarts'] == 1
                children.append(network.nodes[index]['process'])
                height = hex(before + 1)
                blocks = [rpc(url, 'eth_getBlockByNumber', [height, False]) for url in urls]
                assert blocks[0] and all(block == blocks[0] for block in blocks)
                until(replicated_workload)
            network.close()
            assert all(child.poll() is not None for child in children)
            network = Supervisor(tmp, ROOT / 'target/debug/sfc', nodes=count, rpc_port=0, peer_port=0)
            network.start()
            children.extend(n['process'] for n in network.nodes)
            until(lambda: all(int(rpc(url, 'eth_blockNumber'), 16) > before + 3 for url in urls))
            until(replicated_workload)
            network.max_restarts = 0
            network.nodes[1]['process'].kill()
            network.nodes[1]['process'].wait(timeout=5)
            try:
                network.tick()
                raise AssertionError('restart limit not enforced')
            except RuntimeError as error:
                assert 'restart limit reached' in str(error)
            print(f'PASS: {count} Python-supervised nodes, {len(fixture["raw"])} signed legacy/type-2 transactions, matching blocks/roots/receipts, contract storage/call/estimate, replay/read-only rejection, follower/leader crash recovery, lock, persistent restart, cleanup')
        except BaseException:
            for log in pathlib.Path(tmp).glob('node-*/node.jsonl'):
                print(log, log.read_text()[-8000:])
            raise
        finally:
            network.close()
        assert all(child.poll() is not None for child in children)


if __name__ == '__main__':
    main()
