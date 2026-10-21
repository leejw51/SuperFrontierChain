#!/usr/bin/env python3
"""Process lifecycle tests; all transaction generation/execution is Rust."""
import importlib.util
from pathlib import Path
import subprocess
import tempfile
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('stress_supervisor', ROOT / 'scripts/stress_supervisor.py')
supervisor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(supervisor)


def run(*args):
    result = subprocess.run(args, cwd=ROOT, text=True, capture_output=True, timeout=40)
    assert result.returncode == 0, result.stdout + result.stderr
    return result.stdout


def wait_round(home):
    deadline = time.monotonic() + 120
    while time.monotonic() < deadline:
        if (home / 'stress.log').exists() and 'Round 1:' in (home / 'stress.log').read_text():
            return
        time.sleep(.1)
    raise AssertionError((ROOT / '.sfc-processes/stress.log').read_text()[-6000:])


# Do not interfere with a user's active blockchain session when this test is invoked.
assert not supervisor.targets(supervisor.processes()), 'Stop active repository nodes before running this test.'
with tempfile.TemporaryDirectory(prefix='sfc-supervisor-') as directory:
    home = Path(directory) / 'chain'
    args = ['make', 'stressstart', f'STRESS_DIR={home}', 'STRESS_TRANSACTIONS=128', 'STRESS_BATCH=64']
    unrelated = subprocess.Popen(['/bin/sleep', '60'])
    try:
        print(run(*args), end='')
        wait_round(home)
        startup = (home / 'stress.log').read_text()
        assert 'HTTP bind (dashboard + Ethereum RPC): 0.0.0.0:' in startup
        urls = [line.split(': ', 1)[1] for line in startup.splitlines()
                if line.startswith('Dashboard')]
        assert urls
        client = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        for url in urls:
            with client.open(url, timeout=5) as response:
                assert response.status == 200, url
            with client.open(url + '/stats', timeout=5) as response:
                assert response.status == 200 and response.read(), url
        print(f'HTTP dashboard verified on {len(urls)} local/network URLs.')

        assert 'Already running' in run(*args)
        print(run('make', 'stop'), end='')
        assert not supervisor.targets(supervisor.processes())
        assert unrelated.poll() is None, 'stop killed an unrelated process'
        assert (home / 'node-0/data/rocksdb').is_dir()
        assert 'Already stopped' in run('make', 'stop')
        size = (home / 'results.capnp').stat().st_size
        print(run(*args), end='')
        deadline = time.monotonic() + 90
        while time.monotonic() < deadline and (home / 'results.capnp').stat().st_size <= size:
            time.sleep(.1)
        assert (home / 'results.capnp').stat().st_size > size, 'restart did not commit new transactions'
        print(run('make', 'stop'), end='')
        assert not supervisor.targets(supervisor.processes())
        # Stop while the supervised process is stalled; shutdown must remain bounded.
        command = ['python3', str(ROOT / 'scripts/stress_supervisor.py'), 'start', '--skip-build', '--', '/bin/sleep', '60']
        print(run(*command), end='')
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            active = supervisor.targets(supervisor.processes())
            if any(record[2] == '/bin/sleep 60' for record in active.values()):
                break
            time.sleep(.1)
        else:
            raise AssertionError('stalled owned child did not start')
        start = time.monotonic()
        print(run('make', 'stop'), end='')
        assert time.monotonic() - start < 20
        assert not supervisor.targets(supervisor.processes())
        print('PASS: background start, duplicate start, stop-all, repeated stop, durable restart, stalled process cancellation')
    finally:
        run('make', 'stop')
        unrelated.terminate()
        unrelated.wait()
