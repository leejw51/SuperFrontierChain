#!/usr/bin/env python3
"""Interleaved CPU, original GPU, optimized GPU and CPU+GPU recovery experiment."""
import argparse
from datetime import datetime, timezone
import hashlib
import importlib.metadata
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts'))
import sfc_codec as codec
from pathlib import Path
import platform
import random
import statistics
import subprocess
import time

import mlx.core as mx
import numpy as np
from cpu_usage import Worker
from recovery import Recovery, pack, unpack
from reference.recovery import Recovery as ReferenceRecovery
from test_recovery import run as validate

ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,default=ROOT/'target/mlx-ecdsa/optimized.capnp')
    parser.add_argument('--trials',type=int,default=7)
    parser.add_argument('--iterations',type=int,default=3)
    parser.add_argument('--gpu-fraction',type=float,default=0.4)
    args = parser.parse_args()
    if not 1 <= args.trials <= 20 or not 1 <= args.iterations <= 10 or not 0.1 <= args.gpu_fraction <= 0.9:
        parser.error('invalid trials, iterations or GPU fraction')
    oracle = ROOT/'target/release/examples/ecdsa_oracle'
    fixture = ROOT/'target/mlx-ecdsa/optimized-fixtures.capnp'
    fixture.parent.mkdir(parents=True,exist_ok=True)
    fixture.write_bytes(subprocess.check_output([oracle,'generate','65536']))
    cases = codec.loads(fixture.read_bytes())
    gpu, reference = Recovery(), ReferenceRecovery()
    validation = validate(cases,gpu)
    print(f'PASS: {validation}',flush=True)
    rows = []
    report = dict(timestamp_utc=datetime.now(timezone.utc).isoformat(),platform=platform.platform(),
                  device=mx.device_info(),python=platform.python_version(),
                  mlx=importlib.metadata.version('mlx'),numpy=np.__version__,
                  trials=args.trials,iterations=args.iterations,workers=18,
                  hybrid_gpu_fraction=args.gpu_fraction,validation=validation,measurements=rows,
                  method='Three end-to-end paths include hex input and hex public-key output. '
                         'CPU time counts all process threads. CPU worker excludes IPC from its '
                         'reported execution time; hybrid includes command/result IPC. Hybrid '
                         'partitions fixture ranges and checks each range in its owning process; '
                         'public-key vectors are not transferred to the parent or merged there. '
                         'Prepacked GPU excludes packing/output conversion and is not end-to-end. '
                         'No node integration, RLP, Keccak, EVM, disk, networking or consensus. '
                         'Startup, signing, compilation, correctness checks and warmup excluded. '
                         'Each trial randomizes backends with seed 20261020.',
                  source_sha256={},fixtures_sha256=hashlib.sha256(fixture.read_bytes()).hexdigest(),
                  oracle_sha256=hashlib.sha256(oracle.read_bytes()).hexdigest())
    paths = sorted(Path(__file__).parent.rglob('*.py')) + sorted(Path(__file__).parent.rglob('*.metal'))
    paths += [ROOT/'crates/sfc/examples/ecdsa_oracle.rs',ROOT/'Cargo.lock',ROOT/'crates/sfc/Cargo.toml']
    report['source_sha256'] = {str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
    worker = Worker([oracle,'load-server',fixture],18)
    assert worker.ready['workers'] == 18
    rng = random.Random(20261020)
    try:
        for count in [4096,16384,65536]:
            batch = cases[:count]
            expected = [c['expected'] for c in batch]
            gpu_count = int(count*args.gpu_fraction)
            gpu_batch = batch[:gpu_count]
            packed = mx.array(pack(batch)); mx.eval(packed)
            cpu_request = dict(iterations=args.iterations,period_seconds=0,count=count)
            worker.request(dict(cpu_request,iterations=1))
            assert reference.recover(batch) == expected
            assert gpu.recover(batch) == expected
            assert gpu.recover(gpu_batch) == expected[:gpu_count]
            for trial in range(args.trials):
                order = ['cpu_18','original_gpu','optimized_gpu','prepacked_gpu','hybrid']
                rng.shuffle(order)
                for backend in order:
                    child_cpu = 0.0
                    if backend == 'cpu_18':
                        cpu_result = worker.request(cpu_request)
                        wall,cpu = cpu_result['wall_seconds'],cpu_result['cpu_seconds']
                    else:
                        cpu_start,start = time.process_time(),time.perf_counter()
                        for _ in range(args.iterations):
                            if backend == 'original_gpu':
                                result = reference.recover(batch)
                            elif backend == 'optimized_gpu':
                                result = gpu.recover(batch)
                            elif backend == 'prepacked_gpu':
                                result = gpu.dispatch(packed); mx.eval(result)
                            else:
                                # Exact disjoint ranges; completion order does not choose input order.
                                worker.send(dict(iterations=1,period_seconds=0,offset=gpu_count,count=count-gpu_count))
                                result = gpu.recover(gpu_batch)
                                cpu_result = worker.read()
                                assert cpu_result['result_verified']
                                child_cpu += cpu_result['cpu_seconds']
                        wall,cpu = time.perf_counter()-start,time.process_time()-cpu_start
                        if backend == 'prepacked_gpu': result = unpack(np.array(result))
                        assert result == (expected[:gpu_count] if backend == 'hybrid' else expected)
                    total = count*args.iterations
                    row = dict(backend=backend,batch=count,trial=trial,recoveries=total,
                               wall_seconds=wall,cpu_seconds=cpu,child_cpu_seconds=child_cpu,
                               total_cpu_seconds=cpu+child_cpu,
                               cpu_percent_one_core_100=100*(cpu+child_cpu)/wall,
                               cpu_ms_per_1000_recoveries=1e6*(cpu+child_cpu)/total,
                               batch_seconds=wall/args.iterations,recoveries_per_second=total/wall,
                               result_verified=True)
                    rows.append(row)
                print(f'Batch {count}, trial {trial+1}/{args.trials} complete',flush=True)
        for count in [4096,16384,65536]:
            for backend in ['cpu_18','original_gpu','optimized_gpu','prepacked_gpu','hybrid']:
                samples = [r for r in rows if r['batch']==count and r['backend']==backend]
                print(count,backend,round(statistics.median(r['recoveries_per_second'] for r in samples)),
                      'recoveries/sec',flush=True)
        args.output.parent.mkdir(parents=True,exist_ok=True)
        codec.write(args.output, report)
        print(f'Report: {args.output}',flush=True)
    finally:
        worker.close()


if __name__ == '__main__':
    main()
