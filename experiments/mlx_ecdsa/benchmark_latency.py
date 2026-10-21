#!/usr/bin/env python3
"""Paired, correctness-checked GPU latency against the frozen previous node kernels."""
import argparse
import hashlib
import importlib.util
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts'))
import sfc_codec as codec
from pathlib import Path
import random
import statistics
import subprocess
import time

from recovery import Recovery
from test_recovery import run as validate

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fixtures', type=Path, default=ROOT/'target/gpu-enhancement/latency-fixtures.capnp')
    parser.add_argument('--output', type=Path, default=ROOT/'target/gpu-enhancement/latency.capnp')
    parser.add_argument('--trials', type=int, default=7)
    parser.add_argument('--iterations', type=int, default=3)
    args = parser.parse_args()
    if not 1 <= args.trials <= 20 or not 1 <= args.iterations <= 100:
        parser.error('require trials 1..20 and iterations 1..100')
    if not args.fixtures.exists():
        args.fixtures.parent.mkdir(parents=True, exist_ok=True)
        fixture = subprocess.check_output([ROOT/'target/release/examples/ecdsa_oracle', 'generate', '65536'])
        args.fixtures.write_bytes(fixture)
    cases = codec.loads(args.fixtures.read_bytes())
    if len(cases) < 65536:
        parser.error('fixtures must include at least 65536 cases')
    validation = validate(cases)
    spec = importlib.util.spec_from_file_location('node_baseline', HERE/'reference_node/recovery.py')
    baseline = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(baseline)
    backends = {'before': baseline.Recovery(), 'after': Recovery()}
    rows = []
    rng = random.Random(0xC00F)
    for count in [1, 32, 100, 256, 1024, 2048, 2049, 4096, 16384, 65536]:
        batch = cases[:count]
        expected = [case['expected'] for case in batch]
        for backend in backends.values():
            assert backend.recover(batch) == expected
        for trial in range(args.trials):
            order = list(backends)
            rng.shuffle(order)
            for version in order:
                cpu_start, start = time.process_time(), time.perf_counter()
                for _ in range(args.iterations):
                    result = backends[version].recover(batch)
                wall, cpu = time.perf_counter()-start, time.process_time()-cpu_start
                assert result == expected
                rows.append(dict(version=version, batch=count, trial=trial+1,
                                 iterations=args.iterations, wall_seconds=wall, cpu_seconds=cpu,
                                 batch_ms=wall*1000/args.iterations,
                                 recoveries_per_second=count*args.iterations/wall,
                                 cpu_percent_one_core_100=100*cpu/wall, result_verified=True))
        print(count, {version: round(statistics.median(row['batch_ms'] for row in rows
                      if row['batch'] == count and row['version'] == version), 3)
                      for version in backends}, flush=True)
    sources = [HERE/name for name in ['recovery.py', 'secp256k1.metal', 'worker.py', 'test_recovery.py', 'benchmark_latency.py']]
    sources += [HERE/'reference_node'/name for name in ['recovery.py', 'secp256k1.metal', 'worker.py']]
    report = dict(validation=validation, trials=args.trials, iterations=args.iterations,
                  fixture_sha256=hashlib.sha256(args.fixtures.read_bytes()).hexdigest(),
                  source_sha256={str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest()
                                 for path in sources}, samples=rows)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    codec.write(args.output, report)
    print('Report:', args.output)


if __name__ == '__main__':
    main()
