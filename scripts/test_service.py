#!/usr/bin/env python3
import sfc_codec as codec
import pathlib
import subprocess
import tempfile
import urllib.request
from smoke import port, ROOT


def main():
    with tempfile.TemporaryDirectory(prefix='sfc-service-') as tmp:
        home = pathlib.Path(tmp)
        subprocess.run([ROOT / 'target/release/sfc', 'init', '--home', home], check=True, capture_output=True)
        path = home / 'config.jsonl'
        config = codec.loads(path.read_bytes())
        config.update(rpc_listen=f'127.0.0.1:{port()}', peer_listen=f'127.0.0.1:{port(True)}')
        path.write_bytes(codec.dumps(config))

        def command(action, success=True):
            result = subprocess.run(['make', action, f'DATA_DIR={home}', f'STRESS_DIR={home / "stress"}'], cwd=ROOT, capture_output=True, text=True, timeout=40)
            assert (result.returncode == 0) == success, result.stdout + result.stderr
            return result.stdout

        try:
            command('start')
            assert 'already active' in command('start')
            with urllib.request.urlopen('http://' + config['rpc_listen'] + '/dashboard/stats', timeout=3) as response:
                assert codec.load(response)['chainId'] == 7777
            command('stop')
            assert not (home / 'control.sock').exists()
            assert 'already stopped' in command('stop').lower()
            command('start')
            command('stop')
            records = list(codec.records((home / 'data/logs/node.capnp').open('rb')))
            assert sum(r['event'] == 'node_started' for r in records) == 2
            assert sum(r['event'] == 'node_stopping' for r in records) == 2
            config['development'] = False
            path.write_bytes(codec.dumps(config))
            command('start', success=False)
            assert not (home / 'control.sock').exists()
            print('PASS: make start/stop, duplicate commands, restart, Capnp, failed-start cleanup')
        finally:
            command('stop')


if __name__ == '__main__':
    main()
