#!/usr/bin/env python3
"""Two-node backend routing, ordered HTTP batches, GPU worker faults and recovery."""
import argparse
import json
import sfc_codec as codec
import os
import pathlib
import signal
import subprocess
import tempfile
import time
import urllib.request
from supervisor import ROOT, Supervisor
from smoke import rpc


def request(url, value):
    req = urllib.request.Request(url, json.dumps(value).encode(), {'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as response:
        return json.load(response)


def alive(pid):
    if not pid:
        return False
    result = subprocess.run(['ps', '-p', str(pid), '-o', 'stat='], capture_output=True, text=True)
    return bool(result.stdout.strip()) and not result.stdout.strip().startswith('Z')


def run(binary, fixture, modes):
    workers = set()
    with tempfile.TemporaryDirectory(prefix='sfc-backend-test-') as tmp:
        network = Supervisor(tmp, binary, nodes=2, rpc_port=0, peer_port=0, verification_backend='cpu')
        try:
            network.start()
            network.close()
            for i, mode in enumerate(modes):
                path = pathlib.Path(tmp)/f'node-{i}/config.capnp'
                config = codec.loads(path.read_bytes())
                assert config['verification']['backend'] == 'gpu', 'init must default to GPU'
                # Legacy worker fault tests are opt-in. Native Rust/Metal has no
                # worker PID; its production path is covered by Rust tests.
                config['verification'].update(backend=mode, timeout_seconds=2, gpu_runtime='mlx')
                path.write_bytes(codec.dumps(config))
            # No CLI override: exercise persisted configuration and GPU default.
            network = Supervisor(tmp, binary, nodes=2)
            network.start()
            urls = ['http://'+n['config']['rpc_listen'] for n in network.nodes]

            def wait(predicate):
                deadline = time.monotonic() + 40
                while time.monotonic() < deadline:
                    network.tick()
                    try:
                        value = predicate()
                        if value:
                            return value
                    except (OSError, AssertionError):
                        pass
                    time.sleep(.03)
                raise AssertionError('backend test timed out')

            wait(lambda: all(rpc(url, 'eth_chainId') == '0x1e61' for url in urls))
            def statuses():
                rows = [rpc(url, 'sfc_verificationStatus') for url in urls]
                assert [row['backend'] for row in rows] == modes
                workers.update(row['gpu_worker_pid'] for row in rows if row['gpu_worker_pid'])
                return rows
            statuses()
            # Invalid entries and a read in the middle must not shift recovered keys.
            batch = [{'jsonrpc': '2.0', 'id': i, 'method': 'eth_sendRawTransaction', 'params': [raw]}
                     for i, raw in enumerate(fixture['raw'][:1024])]
            batch.insert(8, {'jsonrpc': '2.0', 'id': 'oversized', 'method': 'eth_sendRawTransaction', 'params': ['0x'+'00'*(128*1024+1)]})
            batch.insert(7, {'jsonrpc': '2.0', 'id': 'bad', 'method': 'eth_sendRawTransaction', 'params': ['0x00']})
            batch.insert(19, {'jsonrpc': '2.0', 'id': 'read', 'method': 'eth_chainId', 'params': []})
            result = request(urls[0], batch)
            assert len(result) == len(batch)
            for item in result:
                if item['id'] in ('bad','oversized'): assert 'error' in item
                elif item['id'] == 'read': assert item['result'] == '0x1e61'
                else: assert item['result'] == fixture['hashes'][item['id']]
            wait(lambda: rpc(urls[1], 'eth_getTransactionReceipt', [fixture['hashes'][1023]]))
            for row in statuses():
                if row['backend'] == 'gpu': assert row['gpu_records'] == 1024 and row['cpu_records'] == 0
                elif row['backend'] == 'cpu': assert row['cpu_records'] == 1024 and row['gpu_records'] == 0
                else: assert row['gpu_records'] > 0 and row['cpu_records'] > 0
            assert 'error' in request(urls[0], [{'jsonrpc':'2.0','id':1,'method':'eth_chainId'}] * 4097)
            nonce = 1024
            if modes[0] != 'cpu':
                # Kill and freeze workers. The failed request must never be admitted on CPU.
                for fault in (signal.SIGKILL, signal.SIGSTOP):
                    before = statuses()[0]
                    os.kill(before['gpu_worker_pid'], fault)
                    started = time.monotonic()
                    value = request(urls[0], {'jsonrpc':'2.0','id':1,'method':'eth_sendRawTransaction','params':[fixture['raw'][nonce]]})
                    assert 'error' in value and 'GPU verification failed' in value['error']['message'], value
                    assert time.monotonic() - started < 8
                    assert int(rpc(urls[0], 'eth_getTransactionCount', [fixture['owner'],'latest']),16) == nonce
                    assert rpc(urls[0], 'eth_sendRawTransaction', [fixture['raw'][nonce]]) == fixture['hashes'][nonce]
                    wait(lambda: rpc(urls[1], 'eth_getTransactionReceipt', [fixture['hashes'][nonce]]))
                    after = statuses()[0]
                    assert after['gpu_worker_pid'] != before['gpu_worker_pid']
                    assert not alive(before['gpu_worker_pid'])
                    nonce += 1
            if modes[1] != 'cpu':
                before = statuses()[1]
                os.kill(before['gpu_worker_pid'], signal.SIGKILL)
                rpc(urls[0], 'eth_sendRawTransaction', [fixture['raw'][nonce]])
                wait(lambda: rpc(urls[1], 'eth_getTransactionReceipt', [fixture['hashes'][nonce]]))
                assert statuses()[1]['gpu_worker_pid'] != before['gpu_worker_pid']
                nonce += 1
            # Both node roles recover through the Python supervisor; old workers must exit.
            for i in (1, 0):
                before = statuses()[i]
                height = int(rpc(urls[0], 'eth_blockNumber'),16)
                network.nodes[i]['process'].kill()
                wait(lambda: all(int(rpc(url,'eth_blockNumber'),16) > height + 2 for url in urls))
                statuses()
                wait(lambda: not alive(before['gpu_worker_pid']))
            receipt = rpc(urls[1], 'eth_getTransactionReceipt', [fixture['hashes'][nonce-1]])
            blocks = [rpc(url, 'eth_getBlockByNumber', [receipt['blockNumber'],False]) for url in urls]
            assert blocks[0] == blocks[1]
            for url in urls:
                assert int(rpc(url,'eth_getTransactionCount',[fixture['owner'],'latest']),16) == nonce
            print('PASS:', '/'.join(modes), 'ordered legacy/type-2 HTTP batch, routing counters, applicable worker faults, node recovery, matching state', flush=True)
        except BaseException:
            for path in pathlib.Path(tmp).glob('node-*/node.log'):
                print(path, path.read_text()[-5000:])
            raise
        finally:
            network.close()
            deadline = time.monotonic()+5
            while any(alive(pid) for pid in workers) and time.monotonic()<deadline:
                time.sleep(.05)
            assert not any(alive(pid) for pid in workers), 'orphan GPU worker'


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--binary', default=str(ROOT/'target/release/sfc'))
    args=parser.parse_args()
    fixture=codec.loads(subprocess.check_output(['node','scripts/network_fixture.mjs','1030'], cwd=ROOT))
    for modes in (['cpu','cpu'],['gpu','gpu'],['hybrid','hybrid'],['gpu','cpu']):
        run(args.binary,fixture,modes)


if __name__ == '__main__':
    main()
