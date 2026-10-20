#!/usr/bin/env python3
"""Measure signed HTTP admission through local commit or durable HTTP/3 follower replay."""
import argparse
import hashlib
import http.client
import json
import os
import pathlib
import platform
import subprocess
import tempfile
import time
from supervisor import ROOT, Supervisor
from smoke import rpc


def process_cpu_seconds(pids):
    """Cumulative process user+system CPU, including every thread (macOS 10ms resolution)."""
    output = subprocess.check_output(['ps', '-p', ','.join(map(str, pids)), '-o', 'pid=', '-o', 'time='], text=True)
    values = {}
    for line in output.splitlines():
        pid, stamp = line.split()
        days, stamp = stamp.split('-', 1) if '-' in stamp else ('0', stamp)
        value = 0.0
        for part in stamp.split(':'):
            value = value * 60 + float(part)
        values[int(pid)] = int(days) * 86400 + value
    if set(values) != set(pids):
        raise RuntimeError('a measured node or GPU worker exited')
    return values


def run(binary, fixture, interval, backend=None, rpc_batch=100, gpu_worker=None, nodes=2):
    with tempfile.TemporaryDirectory(prefix='sfc-network-bench-') as tmp:
        network = Supervisor(tmp, binary, nodes=nodes, rpc_port=0, peer_port=0, verification_backend=backend)
        try:
            network.start()
            network.close()
            for index in range(nodes):
                path = pathlib.Path(tmp) / f'node-{index}/config.json'
                config = json.loads(path.read_text())
                config['block_interval_ms'] = interval
                if gpu_worker:
                    config['verification']['worker'] = str(pathlib.Path(gpu_worker).resolve())
                path.write_text(json.dumps(config))
            network = Supervisor(tmp, binary, nodes=nodes, verification_backend=backend)
            network.start()
            return measure(network, binary, fixture, interval, backend, rpc_batch, gpu_worker)
        finally:
            network.close()


def measure(network, binary, fixture, interval, backend=None, rpc_batch=100, gpu_worker=None,
            warmup=2, balance_before=0, nonce_before=0):
    """Measure one workload on an already running supervisor; caller owns its lifecycle."""
    urls = ['http://' + node['config']['rpc_listen'] for node in network.nodes]

    def wait(predicate):
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            network.tick()
            try:
                value = predicate()
                if value:
                    return value
            except OSError:
                pass
            time.sleep(0.01)
        raise AssertionError('network benchmark timed out')

    wait(lambda: all(rpc(url, 'eth_chainId') == '0x1e61' for url in urls))
    for raw in fixture['raw'][:warmup]:
        rpc(urls[0], 'eth_sendRawTransaction', [raw])
    if warmup:
        wait(lambda: rpc(urls[-1], 'eth_getTransactionReceipt', [fixture['hashes'][warmup - 1]]))
    count = len(fixture['raw']) - warmup
    verifier_before = [rpc(url, 'sfc_verificationStatus') for url in urls]
    if backend:
        assert all(status['backend'] == backend for status in verifier_before), verifier_before
    pids = [pid for status in verifier_before for pid in (status['node_pid'], status['gpu_worker_pid']) if pid]
    cpu_before = process_cpu_seconds(pids)
    client_cpu_start = time.process_time()
    start = time.perf_counter()
    connection = http.client.HTTPConnection(network.nodes[0]['config']['rpc_listen'], timeout=20)
    admission_attempts = 0
    try:
        for offset in range(warmup, len(fixture['raw']), rpc_batch):
            remaining = list(range(offset, min(offset + rpc_batch, len(fixture['raw']))))
            deadline = time.monotonic() + 60
            while remaining:
                assert time.monotonic() < deadline, 'admission backpressure timed out'
                body = [{'jsonrpc': '2.0', 'id': i,
                         'method': 'eth_sendRawTransaction', 'params': [fixture['raw'][i]]}
                        for i in remaining]
                admission_attempts += len(body)
                connection.request('POST', '/', json.dumps(body).encode(),
                                   {'Content-Type': 'application/json'})
                response = connection.getresponse()
                assert response.status == 200, response.status
                replies = json.loads(response.read())
                assert len(replies) == len(remaining)
                retry = []
                for i, reply in zip(remaining, replies):
                    assert reply['id'] == i
                    if reply.get('error', {}).get('message') == 'mempool is full':
                        retry.append(i)
                    else:
                        assert reply.get('result') == fixture['hashes'][i], reply
                remaining = retry
                network.tick()
                if remaining:
                    time.sleep(.01)
    finally:
        connection.close()
    admission_seconds = time.perf_counter() - start
    last = wait(lambda: rpc(urls[-1], 'eth_getTransactionReceipt', [fixture['hashes'][-1]]))
    seconds = time.perf_counter() - start
    client_cpu_seconds = time.process_time() - client_cpu_start
    cpu_after = process_cpu_seconds(pids)
    verifier_after = [rpc(url, 'sfc_verificationStatus') for url in urls]
    cpu_usage = []
    for index, (before, after) in enumerate(zip(verifier_before, verifier_after)):
        assert before['node_pid'] == after['node_pid'] and before['gpu_worker_pid'] == after['gpu_worker_pid']
        cpu = cpu_after[before['node_pid']] - cpu_before[before['node_pid']]
        gpu_host = (cpu_after[before['gpu_worker_pid']] - cpu_before[before['gpu_worker_pid']]) if before['gpu_worker_pid'] else 0
        records = {key: after[key] - before[key] for key in ('cpu_records', 'gpu_records')}
        assert sum(records.values()) == (count if index else admission_attempts), records
        if before['backend'] == 'gpu':
            assert records['cpu_records'] == 0 and records['gpu_records'] == (count if index else admission_attempts)
        elif before['backend'] == 'cpu':
            assert records['gpu_records'] == 0 and records['cpu_records'] == (count if index else admission_attempts)
        else:
            assert all(records.values()), records
        cpu_usage.append(dict(role='sequencer' if index == 0 else 'follower', rust_cpu_seconds=cpu,
                              gpu_host_cpu_seconds=gpu_host, total_cpu_seconds=cpu+gpu_host,
                              cpu_percent_one_core_100=100*(cpu+gpu_host)/seconds, **records))
    total_cpu = sum(row['total_cpu_seconds'] for row in cpu_usage)
    blocks = [rpc(url, 'eth_getBlockByNumber', [last['blockNumber'], False]) for url in urls]
    assert blocks[0] and all(block == blocks[0] for block in blocks)
    for url in urls:
        assert int(rpc(url, 'eth_getBalance', [fixture['recipient'], 'latest']), 16) == balance_before + count * (count + 1) // 2
        assert int(rpc(url, 'eth_getTransactionCount', [fixture['owner'], 'latest']), 16) == nonce_before + count + warmup
    assert all(node['restarts'] == 0 for node in network.nodes)
    worker_path = pathlib.Path(gpu_worker).resolve() if gpu_worker else ROOT/'experiments/mlx_ecdsa/worker.py'
    sources = ['crates/sfc/src/verification.rs', str(worker_path),
               str(worker_path.with_name('recovery.py')), str(worker_path.with_name('secp256k1.metal'))]
    return dict(benchmark='http_admission_local_commit' if len(urls) == 1 else 'http_admission_http3_durable_replay', transactions=count,
                backend=verifier_before[0]['backend'], gpu_worker=str(worker_path), admission_attempts=admission_attempts, platform=platform.platform(), logical_cpus=os.cpu_count(),
                cpu_usage=cpu_usage, total_cpu_seconds=total_cpu,
                total_cpu_percent_one_core_100=100*total_cpu/seconds,
                cpu_ms_per_committed_transaction=1000*total_cpu/count,
                load_generator_cpu_seconds=client_cpu_seconds,
                cpu_method='ps cumulative user+system process time; all supervised Rust nodes and their MLX workers; excludes load generator',
                source_sha256={name: hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in sources},
                rpc_batch=rpc_batch, http_keepalive=True, nodes=len(urls), block_interval_ms=interval,
                binary_sha256=hashlib.sha256(pathlib.Path(binary).read_bytes()).hexdigest(),
                rayon_threads=os.environ.get('RAYON_NUM_THREADS', 'automatic'),
                admission_seconds=admission_seconds, seconds=seconds, tps=count / seconds,
                network_included=True, follower_replay_included=len(urls) > 1, signature_verification_included=True,
                scheduler_wait_included=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--binary', default=str(ROOT / 'target/release/sfc'))
    parser.add_argument('--nodes', type=int, choices=[1, 2], default=2)
    parser.add_argument('--output', type=pathlib.Path,
                        help='Write JSONL results to this file (overwrite) and print concise TPS/CPU summaries')
    parser.add_argument('--transactions', type=int, default=16384)
    parser.add_argument('--interval', type=int, default=100)
    parser.add_argument('--repeat', type=int, default=3)
    parser.add_argument('--rpc-batch', type=int, default=100)
    parser.add_argument('--backend', choices=['cpu', 'gpu', 'hybrid', 'all'], default='gpu')
    parser.add_argument('--compare', help='Optional baseline binary supporting sfc_verificationStatus; alternate runs')
    parser.add_argument('--gpu-worker', help='Override the current GPU worker script')
    parser.add_argument('--baseline-gpu-worker', help='Override only the baseline GPU worker (requires --compare)')
    parser.add_argument('--baseline-interval', type=int,
                        help='Override only the baseline interval when comparing configuration changes')
    args = parser.parse_args()
    if not 1 <= args.transactions <= 65536:
        parser.error('transactions must be 1..65536')
    if not 1 <= args.rpc_batch <= 4096:
        parser.error("rpc-batch must be 1..4096")
    if args.repeat < 1 or args.interval < 10:
        parser.error('repeat must be positive and interval must be >=10ms')
    if args.baseline_interval is not None and (not args.compare or args.baseline_interval < 10):
        parser.error('baseline-interval requires --compare and must be >=10ms')
    if args.baseline_gpu_worker and not args.compare:
        parser.error("baseline-gpu-worker requires --compare")
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text('')
        print(f'Preparing {args.transactions:,} signed transfers; {args.nodes} node(s), '
              f'{args.backend}, {args.repeat} trial(s). Report: {args.output.resolve()}', flush=True)
    fixture = json.loads(subprocess.check_output(
        ['node', 'scripts/network_fixture.mjs', str(args.transactions)], cwd=ROOT, text=True, timeout=120))
    for trial in range(1, args.repeat + 1):
        binaries = [('before', args.compare), ('after', args.binary)] if args.compare else [('current', args.binary)]
        if trial % 2 == 0:
            binaries.reverse()
        for version, binary in binaries:
            interval = args.baseline_interval if version == 'before' and args.baseline_interval else args.interval
            backends = ['cpu', 'gpu', 'hybrid'] if args.backend == 'all' else [args.backend]
            if args.backend == 'all':
                shift = (trial - 1) % len(backends)
                backends = backends[shift:] + backends[:shift]
            for backend in backends:
                worker = args.baseline_gpu_worker if version == "before" else args.gpu_worker
                result = run(pathlib.Path(binary).resolve(), fixture, interval, backend, args.rpc_batch, worker, args.nodes)
                record = json.dumps(dict(version=version, trial=trial, **result))
                if args.output:
                    with args.output.open('a') as report:
                        report.write(record + '\n')
                    print(f'Trial {trial}/{args.repeat} ({version}, {backend}): '
                          f'{result["tps"]:,.0f} committed TPS | '
                          f'CPU {result["total_cpu_percent_one_core_100"]:.1f}% (100% = one core; includes MLX host) | '
                          f'{result["seconds"]:.3f}s | balances, nonces and backend checked', flush=True)
                else:
                    print(record, flush=True)


if __name__ == '__main__':
    main()
