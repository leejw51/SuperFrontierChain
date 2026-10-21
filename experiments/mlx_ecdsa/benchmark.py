#!/usr/bin/env python3
"""Isolated, mandatory-differential-test MLX recovery experiment."""
import argparse
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
import statistics
import subprocess
import time
import mlx.core as mx
import numpy as np
from recovery import Recovery, pack, unpack
from test_recovery import run as validate

ROOT = Path(__file__).resolve().parents[2]


def measure(function, count, backend, samples, iterations, expected=None):
    warm = function()
    if expected is not None:
        assert warm == expected
    durations = []
    for _ in range(samples):
        start = time.perf_counter()
        for _ in range(iterations):
            result = function()
        durations.append((time.perf_counter()-start)/iterations)
        if expected is not None:
            assert result == expected
    median = statistics.median(durations)
    return dict(backend=backend, batch=count, median_seconds=median,
                recoveries_per_second=count/median, samples_seconds=durations,
                ethereum_rlp_and_keccak_included=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--oracle', type=Path, default=ROOT/'target/release/examples/ecdsa_oracle')
    parser.add_argument('--output', type=Path, default=ROOT/'target/mlx-ecdsa/results.capnp')
    parser.add_argument('--samples', type=int, default=7)
    parser.add_argument('--iterations', type=int, default=3)
    parser.add_argument('--tests-only', action='store_true')
    args = parser.parse_args()
    if args.samples < 1 or args.iterations < 1:
        parser.error('samples and iterations must be positive')
    args.oracle = args.oracle.resolve()
    fixture_path = ROOT/'target/mlx-ecdsa/fixtures.capnp'
    fixture_path.parent.mkdir(parents=True, exist_ok=True)
    fixture_path.write_bytes(subprocess.check_output([args.oracle, 'generate', '4096']))
    cases = codec.loads(fixture_path.read_bytes())
    start = time.perf_counter()
    gpu = Recovery()
    # Compilation and initial execution are measured separately, outside steady state.
    assert gpu.recover(cases[:1]) == [cases[0]['expected']]
    cold_seconds = time.perf_counter()-start
    validation = validate(cases, gpu)
    print(f'PASS: {validation["arithmetic_operations"]} arithmetic checks, '
          f'{validation["recovery_vectors"]} recovery vectors, ordering and malformed inputs', flush=True)
    report = dict(timestamp_utc=datetime.now(timezone.utc).isoformat(),
                  platform=platform.platform(), python=platform.python_version(),
                  mlx=importlib.metadata.version('mlx'), numpy=np.__version__,
                  device=mx.device_info(), rayon_threads=os.environ.get('RAYON_NUM_THREADS', 'automatic'),
                  fixtures_sha256=hashlib.sha256(fixture_path.read_bytes()).hexdigest(),
                  metal_sha256=hashlib.sha256(Path(__file__).with_name('secp256k1.metal').read_bytes()).hexdigest(),
                  source_sha256={str(path.relative_to(ROOT)): hashlib.sha256(path.read_bytes()).hexdigest()
                                 for path in [Path(__file__), Path(__file__).with_name('recovery.py'),
                                              Path(__file__).with_name('test_recovery.py'),
                                              Path(__file__).with_name('secp256k1.metal'),
                                              Path(__file__).with_name('requirements.txt'),
                                              ROOT/'crates/sfc/examples/ecdsa_oracle.rs']},
                  oracle_sha256=hashlib.sha256(args.oracle.read_bytes()).hexdigest(),
                  initial_kernel_setup_seconds=cold_seconds, validation=validation,
                  gpu_samples=args.samples, gpu_iterations_per_sample=args.iterations,
                  cpu_samples=7, cpu_iterations_per_sample=5,
                  production_backend='unchanged_cpu_libsecp256k1', benchmarks=[])
    if not args.tests_only:
        # CPU baseline includes hex input decoding, low-S/parity validation,
        # recovery and serialized public-key hex output, matching the GPU API.
        report['benchmarks'].extend(codec.loads(subprocess.check_output(
            [args.oracle, 'bench', fixture_path])))
        for count in [64, 256, 1024, 4096]:
            batch = cases[:count]
            expected = [c['expected'] for c in batch]
            prepacked = mx.array(pack(batch))
            mx.eval(prepacked)

            def kernel_only():
                output = gpu.dispatch(prepacked)
                mx.eval(output)
                return output

            assert unpack(np.array(kernel_only())) == expected
            report['benchmarks'].append(measure(kernel_only, count, 'mlx_prepacked_kernel_and_sync',
                                                 args.samples, args.iterations))
            row = measure(lambda: gpu.recover(batch), count, 'mlx_end_to_end',
                          args.samples, args.iterations, expected)
            row.update(host_packing_included=True, synchronization_included=True,
                       output_materialization_and_hex_included=True)
            report['benchmarks'].append(row)
            print(f'GPU {count}: {row["recoveries_per_second"]:,.0f} recoveries/s, '
                  f'{row["median_seconds"]*1000:.3f} ms end-to-end', flush=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    codec.write(args.output, report)
    print(f'Report: {args.output}', flush=True)


if __name__ == '__main__':
    main()
