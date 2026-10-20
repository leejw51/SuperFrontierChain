#!/usr/bin/env python3
"""Continuous GPU workload on one persistent release node; controlled by make stop."""
import argparse
import fcntl
import json
import os
import pathlib
import shlex
import signal
import socket
import subprocess
import tempfile
import threading
import time
from benchmark_network import measure
from service import request
from smoke import rpc
from supervisor import ROOT, Supervisor

OWNER = '0x7e5f4552091a69125d5dfcb7b8c2659029395bdf'
RECIPIENT = '0x2b5ad5c4795c026514f8317c7a215e218dccd6cf'


class Stopped(Exception):
    pass


def stop(home):
    if not home.exists():
        print('Stress test is already stopped.')
        return
    with (home / 'stress.lock').open('a') as lock:
        deadline = time.monotonic() + 40
        while True:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                print('Stress test stopped; persistent data and logs retained.')
                return
            except BlockingIOError:
                try:
                    request(home / 'stress.sock', 'stop')
                except OSError:
                    pass
            if time.monotonic() > deadline:
                raise RuntimeError('stress shutdown timed out; inspect stress.log')
            time.sleep(.1)


def run(args):
    home = pathlib.Path(args.home).resolve()
    home.mkdir(parents=True, exist_ok=True)
    stopped = threading.Event()
    signal.signal(signal.SIGINT, lambda *_: stopped.set())
    signal.signal(signal.SIGTERM, lambda *_: stopped.set())
    with (home / 'stress.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise SystemExit(
                f'Already running: stress test at {home}\n'
                f'Stop with: make stop STRESS_DIR={shlex.quote(str(home))}'
            ) from None
        control = home / 'stress.sock'
        control.unlink(missing_ok=True)
        with socket.socket(socket.AF_UNIX) as server, (home / 'stress.log').open('a', buffering=1) as log:
            server.bind(str(control))
            os.chmod(control, 0o600)
            server.listen(4)
            server.settimeout(.2)

            def say(message):
                print(message, flush=True)
                log.write(message + '\n')

            def listen():
                while not stopped.is_set():
                    try:
                        connection, _ = server.accept()
                    except socket.timeout:
                        continue
                    with connection:
                        connection.settimeout(1)
                        try:
                            if connection.recv(32) == b'stop':
                                stopped.set()
                            connection.sendall(b'stopping' if stopped.is_set() else b'running')
                        except OSError:
                            pass

            listener = threading.Thread(target=listen, daemon=True)
            listener.start()

            class StressSupervisor(Supervisor):
                def tick(self):
                    if stopped.is_set():
                        raise Stopped()
                    super().tick()

            network = StressSupervisor(home, args.binary, nodes=1, rpc_port=0, peer_port=0,
                                       verification_backend='gpu', block_interval_ms=args.interval,
                                       max_restarts=0)
            try:
                network.start()
                config = network.nodes[0]['config']
                url = 'http://' + config['rpc_listen']
                data = pathlib.Path(config['data_dir'])
                data.mkdir(parents=True, exist_ok=True)
                output = pathlib.Path(args.output).resolve()
                output.parent.mkdir(parents=True, exist_ok=True)
                say('\nSFC continuous stress test · one release node · GPU verification')
                info = {
                    'Dashboard': url + '/dashboard', 'Ethereum RPC': url + '/',
                    'Dashboard stats': url + '/dashboard/stats',
                    'Index search API': url + '/dashboard/index',
                    'Sync endpoint (HTTP/3, UDP; typed RPC)': 'https://' + config['peer_listen'],
                    'Optional Cap’n Proto TCP': config.get('capnp_listen') or 'disabled',
                    'Sync TLS server name': 'localhost', 'Sync TLS certificate': config['tls_cert'],
                    'Node home': home / 'node-0', 'Config': home / 'node-0/config.json',
                    'Genesis': config['genesis'], 'Data': data, 'Main RocksDB': data / 'rocksdb',
                    'RocksDB WAL folder': data / 'rocksdb',
                    'RocksDB diagnostics': data / 'rocksdb/LOG', 'History': data / 'history',
                    'SQLite index (WAL)': data / 'index.sqlite',
                    'SQLite WAL / shared memory': f'{data}/index.sqlite-wal / {data}/index.sqlite-shm',
                    'Structured node log': data / 'logs/node.jsonl',
                    'Indexer error log (only on failure)': data / 'index-error.log',
                    'Node + GPU stderr/stdout': home / 'node-0/node.jsonl',
                    'Stress log': home / 'stress.log', 'TPS/CPU results (append)': output,
                    'Supervisor status': home / 'status.json', 'Network manifest': home / 'network.json',
                    'Control socket': control, 'Release binary': pathlib.Path(args.binary).resolve(),
                    'Node PID': network.nodes[0]['process'].pid,
                    'Chain ID': json.loads(pathlib.Path(config['genesis']).read_text())['chain_id'],
                    'Max pending / block transactions': f'{config["max_pending"]} / {config["max_block_transactions"]}',
                    'Retention': json.dumps(config['retention']),
                    'GPU Python': config['verification']['python'], 'GPU worker': config['verification']['worker'],
                    'Block interval (ms)': args.interval, 'Transfers / RPC batch': f'{args.transactions} / {args.rpc_batch}',
                    'Stop command': 'make stop' if home == ROOT / '.sfc-stress' else f"make stop STRESS_DIR='{home}'",
                }
                for key, value in info.items():
                    say(f'  {key}: {value}')
                (data / 'stress-info.json').write_text(json.dumps({key: str(value) for key, value in info.items()}, indent=2))
                say('Data survives stop/restart. Signing occurs between measured rounds; CPU 100% = one core.')
                deadline = time.monotonic() + 60
                while True:
                    network.tick()
                    try:
                        if rpc(url, 'eth_chainId') == '0x1e61':
                            break
                    except OSError:
                        pass
                    if time.monotonic() > deadline:
                        raise RuntimeError('stress node startup timed out')
                    stopped.wait(.1)
                # Commit one warm-up transfer so GPU initialization is outside CPU/TPS samples.
                nonce = int(rpc(url, 'eth_getTransactionCount', [OWNER, 'latest']), 16)
                warmup = json.loads(subprocess.check_output(
                    ['node', str(ROOT / 'scripts/network_fixture.mjs'), '1', str(nonce)],
                    cwd=ROOT, text=True, timeout=10))
                rpc(url, 'eth_sendRawTransaction', [warmup['raw'][0]])
                deadline = time.monotonic() + 60
                while not rpc(url, 'eth_getTransactionReceipt', [warmup['hashes'][0]]):
                    network.tick()
                    if time.monotonic() > deadline:
                        raise RuntimeError('GPU warm-up commit timed out')
                    stopped.wait(.01)
                say(f'GPU ready: {json.dumps(rpc(url, "sfc_verificationStatus"))}')
                trial = 0
                while not stopped.is_set():
                    nonce = int(rpc(url, 'eth_getTransactionCount', [OWNER, 'latest']), 16)
                    balance = int(rpc(url, 'eth_getBalance', [RECIPIENT, 'latest']), 16)
                    say(f'Preparing round {trial + 1}: nonce {nonce}, {args.transactions:,} signed transfers')
                    with tempfile.TemporaryFile(mode='w+') as generated:
                        child = subprocess.Popen(['node', str(ROOT / 'scripts/network_fixture.mjs'),
                                                  str(args.transactions), str(nonce)],
                                                 cwd=ROOT, stdout=generated, stderr=log)
                        try:
                            while child.poll() is None:
                                network.tick()
                                stopped.wait(.1)
                            if child.returncode:
                                raise RuntimeError('transaction signing failed; inspect stress.log')
                            generated.seek(0)
                            fixture = json.load(generated)
                        finally:
                            if child.poll() is None:
                                child.terminate()
                                try:
                                    child.wait(timeout=3)
                                except subprocess.TimeoutExpired:
                                    child.kill()
                                    child.wait()
                    result = measure(network, pathlib.Path(args.binary).resolve(), fixture,
                                     args.interval, 'gpu', args.rpc_batch, warmup=0,
                                     balance_before=balance, nonce_before=nonce)
                    trial += 1
                    with output.open('a') as report:
                        report.write(json.dumps(dict(trial=trial, timestamp=time.time(), **result)) + '\n')
                    say(f'Round {trial}: {result["tps"]:,.0f} committed TPS | '
                        f'CPU {result["total_cpu_percent_one_core_100"]:.1f}% | '
                        f'{result["transactions"]:,} transfers | balances, nonce and GPU checks passed')
            except Stopped:
                pass
            except Exception:
                import traceback
                log.write(traceback.format_exc())
                raise
            finally:
                stopped.set()
                network.close()
                listener.join(timeout=2)
                control.unlink(missing_ok=True)
                say('Stress test stopped. Persistent chain, index and logs retained.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['run', 'stop'])
    parser.add_argument('--home', default='.sfc-stress')
    parser.add_argument('--binary', default=str(ROOT / 'target/release/sfc'))
    parser.add_argument('--output', default='.sfc-stress/results.jsonl')
    parser.add_argument('--transactions', type=int, default=65536)
    parser.add_argument('--rpc-batch', type=int, default=4096)
    parser.add_argument('--interval', type=int, default=100)
    args = parser.parse_args()
    if not 1 <= args.transactions <= 65536 or not 1 <= args.rpc_batch <= 4096 or args.interval < 10:
        parser.error('require transactions 1..65536, rpc-batch 1..4096, interval >=10ms')
    if args.command == 'stop':
        stop(pathlib.Path(args.home).resolve())
    else:
        run(args)


if __name__ == '__main__':
    main()
