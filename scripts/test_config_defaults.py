#!/usr/bin/env python3
"""Isolated CLI/configuration lifecycle checks; execution remains in Rust."""
import json
import os
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
BIN = ROOT / 'target/release/sfc'
BENCH = ROOT / 'target/release/sfc-bench'


def read(path):
    result = {}
    for line in path.read_text().splitlines():
        entry = json.loads(line)
        assert not result.keys() & entry.keys()
        result.update(entry)
    return result


with tempfile.TemporaryDirectory(prefix='sfc-defaults-', dir='/tmp') as tmp:
    env = dict(os.environ, HOME=tmp, RAYON_NUM_THREADS='2')
    def run(command, ok=True):
        result = subprocess.run(list(map(str, command)), cwd=ROOT, env=env,
                                capture_output=True, text=True, timeout=120)
        assert (result.returncode == 0) == ok, result.stdout + result.stderr
        return result
    run([BIN, 'init'])
    root = Path(tmp) / '.superfrontierchain'
    config = read(root / 'node/config.jsonl')
    assert config['retention'] == {'mode': 'pruned', 'seconds': 60}
    assert Path(config['data_dir']).resolve() == (root / 'node/data').resolve()
    command = [BENCH, 'run', '--transactions', '128', '--rpc-batch', '64',
               '--rounds', '1', '--backend', 'gpu']
    first = run(command)
    assert 'committed TPS' in first.stdout
    path = root / 'stress/node-0/config.jsonl'
    config = read(path)
    assert config['retention']['seconds'] == 60
    config['retention']['seconds'] = 2
    path.write_text(''.join(json.dumps({k:v})+'\n' for k,v in config.items()))
    run(command)
    assert read(path)['retention']['seconds'] == 2, 'restart overwrote user retention'
    config['retention']['seconds'] = 0
    path.write_text(''.join(json.dumps({k:v})+'\n' for k,v in config.items()))
    assert 'retention must be nonzero' in run(command, ok=False).stderr
    print('PASS: HOME defaults, JSONL settings, 60-second default, native GPU execution, edited retention survives restart, zero rejected')
