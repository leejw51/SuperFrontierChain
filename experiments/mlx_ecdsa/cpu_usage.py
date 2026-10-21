#!/usr/bin/env python3
"""Matched-work CPU cost and EVM contention; this is not a node TPS benchmark."""
import argparse
from contextlib import ExitStack
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts'))
import sfc_codec as codec
import os
from pathlib import Path
import platform
import random
import select
import statistics
import subprocess
import time

import mlx.core as mx
import numpy as np
from recovery import Recovery, pack, unpack
from test_recovery import run as validate

ROOT = Path(__file__).resolve().parents[2]
BATCH = 4096


class Worker:
    def __init__(self, command, threads=1):
        self.process = subprocess.Popen(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                        env=dict(os.environ, RAYON_NUM_THREADS=str(threads)))
        try:
            self.ready = self.read()
            assert self.ready['ready']
        except BaseException:
            self.close()
            raise

    def send(self, value):
        codec.append(self.process.stdin, value)
        self.process.stdin.flush()

    def read(self):
        if not select.select([self.process.stdout], [], [], 60)[0]:
            raise TimeoutError('benchmark worker did not respond within 60 seconds')
        value = next(codec.records(self.process.stdout), None)
        if value is None: raise RuntimeError(f'benchmark worker exited: {self.process.poll()}')
        return value

    def request(self, value):
        self.send(value)
        return self.read()

    def close(self):
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
        self.process.stdin.close()
        self.process.stdout.close()


def gpu_load(gpu, cases, iterations, period):
    expected = [case['expected'] for case in cases]
    latencies, lateness = [], []
    cpu_start = time.process_time()
    start = time.perf_counter()
    for index in range(iterations):
        if period:
            due = start + index * period
            time.sleep(max(0, due - time.perf_counter()))
            lateness.append(time.perf_counter() - due)
        tick = time.perf_counter()
        result = gpu.recover(cases)
        latencies.append(time.perf_counter() - tick)
    time.sleep(max(0, start + iterations * period - time.perf_counter()))
    wall = time.perf_counter() - start
    cpu = time.process_time() - cpu_start
    assert result == expected
    return dict(wall_seconds=wall, cpu_seconds=cpu, latencies_seconds=latencies,
                lateness_seconds=lateness, recoveries=iterations * len(cases), result_verified=True)


def describe(row):
    row['cpu_percent_one_core_100'] = 100 * row['cpu_seconds'] / row['wall_seconds']
    row['cpu_ms_per_1000_recoveries'] = 1e6 * row['cpu_seconds'] / row['recoveries']
    row['recoveries_per_second'] = row['recoveries'] / row['wall_seconds']
    latencies = sorted(row['latencies_seconds'])
    row['latency_ms_p50'] = 1000 * statistics.median(latencies)
    row['latency_ms_p95'] = 1000 * latencies[min(len(latencies)-1, int(len(latencies)*0.95))]
    print(f"{row['scenario']} trial {row['trial']} {row['backend']}: "
          f"CPU {row['cpu_percent_one_core_100']:.1f}%, "
          f"{row['cpu_ms_per_1000_recoveries']:.2f} CPU-ms/1k, "
          f"{row['latency_ms_p50']:.2f} ms/batch", flush=True)
    return row


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT/'target/mlx-ecdsa/cpu-usage.capnp')
    parser.add_argument('--trials', type=int, default=3)
    parser.add_argument('--batches', type=int, default=32)
    parser.add_argument('--rate', type=float, default=40000)
    args = parser.parse_args()
    if not 1 <= args.trials <= 10 or not 1 <= args.batches <= 128 or not 10000 <= args.rate <= 100000:
        parser.error('require trials 1..10, batches 1..128, rate 10000..100000')
    oracle = ROOT/'target/release/examples/ecdsa_oracle'
    fixture = ROOT/'target/mlx-ecdsa/cpu-usage-fixtures.capnp'
    fixture.parent.mkdir(parents=True, exist_ok=True)
    fixture.write_bytes(subprocess.check_output([oracle, 'generate', str(BATCH)]))
    cases = codec.loads(fixture.read_bytes())
    gpu = Recovery()
    validation = validate(cases, gpu)
    cases = cases[:BATCH]
    assert gpu.recover(cases) == [case['expected'] for case in cases]
    print(f'Validation passed: {validation}', flush=True)
    period = BATCH / args.rate
    rows, overlap = [], []
    report = dict(timestamp_utc=datetime.now(timezone.utc).isoformat(),
                  platform=platform.platform(), device=mx.device_info(), logical_cpus=os.cpu_count(),
                  python=platform.python_version(), mlx=importlib.metadata.version('mlx'),
                  batch=BATCH, offered_recoveries_per_second=args.rate,
                  trials=args.trials, paced_batches=args.batches, validation=validation,
                  method='Process CPU time, all threads, user+system; 100% means one CPU core. '
                         'Startup, fixtures, compilation and validation excluded. '
                         'Both paths include hex decode and public-key hex output. '
                         'GPU CPU time includes Python packing, dispatch, wait and output conversion. '
                         'Matched-load wall window includes scheduled sleep. '
                         'EVM child CPU time reported separately. No power or GPU-utilization measurement.',
                  evm_workload='Repeated independent execution of the same 512 valid transfers from '
                               'the same genesis; output hash checked each iteration. No signing, '
                               'signature verification, persistence, networking or consensus timed.',
                  oracle_sha256=hashlib.sha256(oracle.read_bytes()).hexdigest(),
                  fixtures_sha256=hashlib.sha256(fixture.read_bytes()).hexdigest(),
                  source_sha256={str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest()
                                 for path in [Path(__file__), Path(__file__).with_name('recovery.py'),
                                              Path(__file__).with_name('secp256k1.metal'),
                                              Path(__file__).with_name('test_recovery.py'),
                                              ROOT/'crates/sfc/examples/ecdsa_oracle.rs',
                                              ROOT/'crates/sfc/Cargo.toml', ROOT/'Cargo.lock']},
                  measurements=rows, async_overlap=overlap)
    with ExitStack() as stack:
        workers = {}
        for count in [2, 4, 8, 18]:
            worker = Worker([oracle, 'load-server', fixture], count)
            stack.callback(worker.close)
            assert worker.ready['workers'] == count
            workers[f'cpu_{count}'] = worker
        evm = Worker([oracle, 'evm-server'])
        stack.callback(evm.close)
        rng = random.Random(20261020)
        for scenario in ['saturated', 'matched_load', 'matched_load_with_evm']:
            for trial in range(args.trials):
                order = [*workers, 'gpu']
                if scenario == 'matched_load_with_evm':
                    order.append('evm_only')
                rng.shuffle(order)
                for backend in order:
                    current_period = 0 if scenario == 'saturated' else period
                    iterations = 128 if scenario == 'saturated' else args.batches
                    if backend == 'evm_only':
                        result = evm.request(dict(seconds=iterations * period))
                        rows.append(dict(scenario=scenario, trial=trial, backend=backend, evm=result))
                        print(f'EVM only: {result["transactions"]/result["wall_seconds"]:,.0f} tx/s', flush=True)
                        continue
                    if scenario == 'matched_load_with_evm':
                        evm.send(dict(seconds=iterations * period))
                    if backend == 'gpu':
                        result = gpu_load(gpu, cases, iterations, current_period)
                    else:
                        result = workers[backend].request(dict(iterations=iterations, period_seconds=current_period))
                    result.update(scenario=scenario, trial=trial, backend=backend)
                    if scenario == 'matched_load_with_evm':
                        result['evm'] = evm.read()
                    rows.append(describe(result))
        # Submit GPU work asynchronously and execute a fixed amount of real EVM
        # work while it runs. Compare with the exact same work done sequentially.
        calibration = evm.request(dict(blocks=10))
        blocks = max(1, round(0.020 / (calibration['wall_seconds']/10)))
        expected = [case['expected'] for case in cases]
        for trial in range(7):
            order = ['sequential', 'async']
            rng.shuffle(order)
            for mode in order:
                cpu_start, start = time.process_time(), time.perf_counter()
                output = gpu.dispatch(mx.array(pack(cases)))
                if mode == 'async':
                    mx.async_eval(output)
                    evm_result = evm.request(dict(blocks=blocks))
                    mx.eval(output)
                else:
                    mx.eval(output)
                    evm_result = evm.request(dict(blocks=blocks))
                keys = unpack(np.array(output))
                wall, cpu = time.perf_counter()-start, time.process_time()-cpu_start
                assert keys == expected
                overlap.append(dict(mode=mode, trial=trial, wall_seconds=wall,
                                    gpu_host_cpu_seconds=cpu, evm=evm_result,
                                    recoveries=BATCH, result_verified=True))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        codec.write(args.output, report)
        print(f'Report: {args.output}', flush=True)


if __name__ == '__main__':
    main()
