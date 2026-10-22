#!/usr/bin/env python3
"""Local SFC process supervisor (Python + Cap’n Proto, macOS/Linux)."""
import argparse
import json
import fcntl
import sfc_codec as codec
import pathlib
import signal
import socket
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]


def free_port(udp=False):
    with socket.socket(type=socket.SOCK_DGRAM if udp else socket.SOCK_STREAM) as sock:
        sock.bind(('127.0.0.1', 0))
        return sock.getsockname()[1]


class Supervisor:
    def __init__(self, home, binary, nodes=4, rpc_port=8545, peer_port=26656, max_restarts=5, verification_backend=None, block_interval_ms=None, sqlite_indexer=True, sync_transport='http3'):
        if nodes < 1 or max_restarts < 0:
            raise ValueError('require at least one node and nonnegative restart limit')
        for base in (rpc_port, peer_port):
            if base < 0 or (base and base + nodes - 1 > 65535):
                raise ValueError('invalid port range')
        self.home = pathlib.Path(home).resolve()
        self.binary = pathlib.Path(binary).resolve()
        self.count, self.rpc_port, self.peer_port = nodes, rpc_port, peer_port
        if verification_backend not in (None, "cpu", "gpu", "hybrid"):
            raise ValueError("verification backend must be cpu, gpu or hybrid")
        self.verification_backend = verification_backend
        self.max_restarts = max_restarts
        self.block_interval_ms = block_interval_ms
        self.sqlite_indexer = sqlite_indexer
        if sync_transport not in ('tcp','http3'):
            raise ValueError('sync transport must be tcp or http3')
        self.sync_transport = sync_transport
        self.nodes = []
        self.lock = None

    def start(self):
        self.home.mkdir(parents=True, exist_ok=True)
        self.lock = (self.home / 'supervisor.lock').open('a')
        try:
            fcntl.flock(self.lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            self.lock.close()
            self.lock = None
            raise RuntimeError('another supervisor owns this test network') from None
        try:
            manifest = self.home / 'network.jsonl'
            if manifest.exists():
                configs = [json.loads(line) for line in manifest.read_text().splitlines() if line.strip()]
                if len(configs) != self.count:
                    raise ValueError('existing network has a different node count; use a new home')
            elif manifest.with_suffix('.capnp').exists():
                configs = codec.loads(manifest.with_suffix('.capnp').read_bytes())
                if len(configs) != self.count:
                    raise ValueError('existing network has a different node count')
                manifest.write_text(''.join(json.dumps(c)+'\n' for c in configs))
            else:
                configs = []
                used_tcp, used_udp = set(), set()
                for i in range(self.count):
                    node_home = self.home / f'node-{i}'
                    subprocess.run([self.binary, 'init', '--home', node_home], check=True, capture_output=True)
                    config = codec.loads((node_home / 'config.jsonl').read_bytes())
                    ports = []
                    for base, used, udp in ((self.rpc_port, used_tcp, False), (self.peer_port, used_udp, True)):
                        port = base + i if base else free_port(udp)
                        while port in used:
                            port = free_port(udp)
                        used.add(port)
                        ports.append(port)
                    config.update(rpc_listen=f'127.0.0.1:{ports[0]}', peer_listen=f'127.0.0.1:{ports[1]}', block_interval_ms=100)
                    config['capnp_listen'] = f'127.0.0.1:{free_port()}'
                    if i:
                        (node_home / 'genesis.capnp').write_bytes((self.home / 'node-0/genesis.capnp').read_bytes())
                        config['sync_peer'] = dict(transport=self.sync_transport, address=configs[0]['capnp_listen' if self.sync_transport=='tcp' else 'peer_listen'], server_name='localhost', certificate=configs[0]['tls_cert'])
                    (node_home / 'config.jsonl').write_bytes(codec.dumps(config, indent=2))
                    configs.append(config)
                manifest.write_text(''.join(json.dumps(c)+'\n' for c in configs))
            for i, config in enumerate(configs):
                path = self.home / f'node-{i}/config.jsonl'
                if not path.exists() and path.with_suffix('.capnp').exists():
                    path.write_bytes(codec.dumps(codec.loads(path.with_suffix('.capnp').read_bytes())))
                config = codec.loads(path.read_bytes())
                if self.block_interval_ms is not None:
                    config['block_interval_ms'] = self.block_interval_ms
                    path.write_bytes(codec.dumps(config, indent=2))
                self.nodes.append(dict(index=i, config=config, process=None, restarts=0, retry_at=0))
                self._spawn(self.nodes[-1])
            self._status()
        except BaseException:
            self.close()
            raise
        return self

    def _spawn(self, node):
        home = self.home / f"node-{node['index']}"
        with (home / 'node.log').open('ab', buffering=0) as log:
            command = [self.binary, 'run', '--config', home / 'config.jsonl']
            if self.verification_backend:
                command += ['--verification-backend', self.verification_backend]
            if not self.sqlite_indexer:
                command += ['--no-indexer']
            node['process'] = subprocess.Popen(command, stdout=log, stderr=log, start_new_session=True)
        node['retry_at'] = 0

    def tick(self):
        """Monitor children; bounded lifetime retries with exponential backoff."""
        for node in self.nodes:
            process = node['process']
            if process.poll() is None:
                continue
            if node['restarts'] >= self.max_restarts:
                raise RuntimeError(f"node-{node['index']} exited {process.returncode}; restart limit reached (see node.log)")
            if not node['retry_at']:
                node['retry_at'] = time.monotonic() + min(0.25 * 2 ** node['restarts'], 8)
            elif time.monotonic() >= node['retry_at']:
                node['restarts'] += 1
                self._spawn(node)
        self._status()

    def _status(self):
        status = [dict(node=n['index'], role='sequencer' if n['index'] == 0 else 'follower', pid=n['process'].pid, running=n['process'].poll() is None, restarts=n['restarts'], rpc='http://' + n['config']['rpc_listen']) for n in self.nodes]
        temporary = self.home / 'status.capnp.tmp'
        temporary.write_bytes(codec.dumps(status, indent=2))
        temporary.replace(self.home / 'status.capnp')

    def close(self):
        # Signal everyone first so shutdown duration does not grow with node count.
        for node in self.nodes:
            process = node['process']
            if process is not None and process.poll() is None:
                process.send_signal(signal.SIGINT)
        deadline = time.monotonic() + 10
        for node in self.nodes:
            process = node['process']
            if process is None:
                continue
            try:
                process.wait(timeout=max(0.01, deadline - time.monotonic()))
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
        if self.lock:
            if self.nodes and all(n['process'] is not None for n in self.nodes):
                self._status()
            self.lock.close()
            self.lock = None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--home', default=str(pathlib.Path.home() / '.superfrontierchain/testnet'))
    parser.add_argument('--binary', default=str(ROOT / 'target/debug/sfc'))
    parser.add_argument('--nodes', type=int, default=4)
    parser.add_argument('--rpc-port', type=int, default=8545)
    parser.add_argument('--peer-port', type=int, default=26656)
    parser.add_argument('--max-restarts', type=int, default=5)
    parser.add_argument('--verification-backend', choices=['cpu', 'gpu', 'hybrid'])
    parser.add_argument('--sync-transport', choices=['tcp','http3'], default='tcp')
    parser.add_argument('--no-indexer', dest='sqlite_indexer', action='store_false')
    args = parser.parse_args()
    supervisor = Supervisor(**vars(args))
    stopping = False

    def shutdown(_signum, _frame):
        nonlocal stopping
        stopping = True

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    try:
        supervisor.start()
        print(f'SFC: {args.nodes} processes; status and logs in {supervisor.home}; Ctrl-C stops all nodes.', flush=True)
        while not stopping:
            supervisor.tick()
            time.sleep(0.1)
    finally:
        supervisor.close()


if __name__ == '__main__':
    main()
