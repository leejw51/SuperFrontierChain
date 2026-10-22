#!/usr/bin/env python3
"""Live pruned sequencer and archive follower, managed by Python supervisor."""
import sfc_codec as codec
import pathlib
import tempfile
import time
from supervisor import Supervisor, ROOT
from smoke import rpc


def main():
    with tempfile.TemporaryDirectory(prefix='sfc-pruning-') as tmp:
        home = pathlib.Path(tmp)
        network = Supervisor(home, ROOT / 'target/debug/sfc', nodes=2, rpc_port=0, peer_port=0)
        try:
            network.start()
            network.close()
            for i, retention in enumerate([{'mode': 'pruned', 'seconds': 3}, {'mode': 'archive'}]):
                path = home / f'node-{i}/config.jsonl'
                config = codec.loads(path.read_bytes())
                config['retention'] = retention
                path.write_bytes(codec.dumps(config))
            network = Supervisor(home, ROOT / 'target/debug/sfc', nodes=2)
            network.start()
            urls = ['http://' + n['config']['rpc_listen'] for n in network.nodes]

            def wait(predicate):
                deadline = time.monotonic() + 25
                while time.monotonic() < deadline:
                    network.tick()
                    try:
                        if predicate():
                            return
                    except (OSError, AssertionError):
                        pass
                    time.sleep(0.05)
                raise AssertionError('pruning test timed out')

            wait(lambda: int(rpc(urls[1], 'eth_blockNumber'), 16) >= 2)
            height = rpc(urls[1], 'eth_blockNumber')
            original = rpc(urls[1], 'eth_getBlockByNumber', [height, False])
            wait(lambda: rpc(urls[0], 'eth_getBlockByNumber', [height, False]) is None)
            assert rpc(urls[1], 'eth_getBlockByNumber', [height, False]) == original
            address = '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf'
            balance = rpc(urls[0], 'eth_getBalance', [address, 'latest'])
            assert balance == rpc(urls[1], 'eth_getBalance', [address, 'latest'])
            network.close()
            network = Supervisor(home, ROOT / 'target/debug/sfc', nodes=2)
            network.start()
            wait(lambda: rpc(urls[0], 'eth_chainId') == rpc(urls[1], 'eth_chainId'))
            assert rpc(urls[0], 'eth_getBlockByNumber', [height, False]) is None
            assert rpc(urls[1], 'eth_getBlockByNumber', [height, False]) == original
            assert rpc(urls[0], 'eth_getBalance', [address, 'latest']) == balance
            print('PASS: live pruning, archive retention, state preservation, restart')
        finally:
            network.close()


if __name__ == '__main__':
    main()
