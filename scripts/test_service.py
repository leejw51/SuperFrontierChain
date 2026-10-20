#!/usr/bin/env python3
import json
import pathlib
import subprocess
import tempfile
import urllib.request
from smoke import port, ROOT


def main():
    with tempfile.TemporaryDirectory(prefix='sfc-service-') as tmp:
        home = pathlib.Path(tmp)
        subprocess.run([ROOT / 'target/release/sfc', 'init', '--home', home], check=True, capture_output=True)
        path = home / 'config.json'
        config = json.loads(path.read_text())
        config.update(rpc_listen=f'127.0.0.1:{port()}', peer_listen=f'127.0.0.1:{port(True)}')
        path.write_text(json.dumps(config))

        def command(action, success=True):
            result = subprocess.run(['make', action, f'DATA_DIR={home}'], cwd=ROOT, capture_output=True, text=True, timeout=40)
            assert (result.returncode == 0) == success, result.stdout + result.stderr
            return result.stdout

        try:
            command('start')
            assert 'already active' in command('start')
            with urllib.request.urlopen('http://' + config['rpc_listen'] + '/dashboard/stats', timeout=3) as response:
                assert json.load(response)['chainId'] == 7777
            command('stop')
            assert not (home / 'control.sock').exists()
            assert 'already stopped' in command('stop')
            command('start')
            command('stop')
            records = [json.loads(line) for line in (home / 'node.jsonl').read_text().splitlines()]
            assert sum(r['event'] == 'node_started' for r in records) == 2
            assert sum(r['event'] == 'node_stopping' for r in records) == 2
            config['development'] = False
            path.write_text(json.dumps(config))
            command('start', success=False)
            assert not (home / 'control.sock').exists()
            print('PASS: make start/stop, duplicate commands, restart, JSONL, failed-start cleanup')
        finally:
            command('stop')


if __name__ == '__main__':
    main()
