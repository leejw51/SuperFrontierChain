#!/usr/bin/env python3
"""Integration checks for continuous GPU stress control and the live index/dashboard."""
import json
import os
import pathlib
import signal
import sqlite3
import subprocess
import tempfile
import time
import urllib.request
from supervisor import ROOT


def wait(predicate, process=None, timeout=90):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process and process.poll() is not None:
            raise AssertionError(f'stress runner exited early: {process.returncode}')
        try:
            result = predicate()
            if result:
                return result
        except (OSError, ValueError, KeyError):
            pass
        time.sleep(.1)
    raise AssertionError('test timed out')


def main():
    with tempfile.TemporaryDirectory(prefix='sfc-stress-check-') as tmp:
        home = pathlib.Path(tmp).resolve()
        report = home / 'results.jsonl'
        capture = home / 'test-output.log'
        def launch(count):
            with capture.open('a') as log:
                return subprocess.Popen(['make', '-o', 'release', '-o', 'test-deps', '-o', 'mlx-setup',
                    'stresstest', f'STRESS_DIR={home}',
                    f'STRESS_TRANSACTIONS={count}', 'STRESS_BATCH=256'],
                    cwd=ROOT, stdout=log, stderr=log)
        def stop():
            subprocess.run(['make', 'stop', f'STRESS_DIR={home}', f'DATA_DIR={home}/unused-service'],
                           cwd=ROOT, check=True, capture_output=True, timeout=45)
        def get(path):
            with urllib.request.urlopen(url + path, timeout=8) as response:
                return json.load(response)
        process = launch(512)
        try:
            wait(lambda: report.exists() and len(report.read_text().splitlines()) >= 2, process)
            config = json.loads((home / 'node-0/config.json').read_text())
            url = 'http://' + config['rpc_listen']
            data = pathlib.Path(config['data_dir'])
            stats = get('/dashboard/stats')
            assert stats['verification']['backend'] == 'gpu'
            assert stats['verification']['cpu_records'] == 0
            assert stats['verification']['gpu_records'] > 0
            assert stats['paths']['rocksdb'] == str(data / 'rocksdb')
            assert stats['rocksdb']['rocksdb.estimate-num-keys'] > 0
            assert stats['rocksdb']['schema_version'] == 1
            assert stats['stress']['Stress log'] == str(home / 'stress.log')
            time.sleep(1.1)
            stats = get('/dashboard/stats')
            assert stats['host']['cpuPercent'] is not None
            assert len(stats['host']['processes']) == 2
            index = wait(lambda: (r if (r := get('/dashboard/index?kind=transactions'))['indexedTransactions'] > 0 else None), process)
            assert index['journalMode'] == 'wal' and index['error'] is None
            assert index['schemaVersion'] == 2
            populated = get('/dashboard/index?kind=blocks_with_transactions&limit=30')['rows']
            assert populated and all(block['transactionCount'] > 0 for block in populated)
            assert get('/dashboard/index?kind=logs&q=block_produc')['rows']
            tx_hash = index['rows'][0]['hash']
            assert get('/dashboard/index?kind=receipts&q=' + tx_hash)['rows'][0]['receipt']['success']
            duplicate = subprocess.run(['python3', 'scripts/stresstest.py', 'run', '--home', str(home)],
                                       cwd=ROOT, capture_output=True, timeout=10)
            assert duplicate.returncode == 1 and b'Already running:' in duplicate.stderr
            assert b'make stop STRESS_DIR=' in duplicate.stderr
            assert b'Traceback' not in duplicate.stderr
            pids = [p['pid'] for p in stats['host']['processes']]
            stop()
            assert process.wait(timeout=10) == 0, capture.read_text()
            assert not (home / 'stress.sock').exists()
            for pid in pids:
                try:
                    os.kill(pid, 0)
                except ProcessLookupError:
                    continue
                raise AssertionError(f'owned process {pid} leaked')
            with sqlite3.connect(data / 'index.sqlite') as db:
                assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
                old_height = db.execute('SELECT max(height) FROM blocks').fetchone()[0]
                old_logs = db.execute('SELECT count(*) FROM logs').fetchone()[0]
            # Resume persistent state, then stop during the expensive signing phase.
            process = launch(65536)
            wait(lambda: '65,536 signed transfers' in (home / 'stress.log').read_text(), process)
            resumed = get('/dashboard/stats')
            assert resumed['height'] >= old_height
            stop()
            assert process.wait(timeout=10) == 0, capture.read_text()
            stop()  # idempotent and never signals an unrelated PID.
            # A node kill must terminate the stress runner, without silently restarting.
            prior_rounds = len(report.read_text().splitlines())
            process = launch(512)
            wait(lambda: len(report.read_text().splitlines()) > prior_rounds, process)
            killed_pid = get('/dashboard/stats')['verification']['node_pid']
            os.kill(killed_pid, signal.SIGKILL)
            assert process.wait(timeout=20) != 0
            assert not (home / 'stress.sock').exists()
            # Simulate a torn final log write; complete records and index cursors survive.
            with (data / 'logs/node.jsonl').open('ab') as source:
                source.write(b'{"torn":')
            prior_rounds = len(report.read_text().splitlines())
            process = launch(512)
            wait(lambda: len(report.read_text().splitlines()) > prior_rounds, process)
            assert get('/dashboard/index?kind=logs')['error'] is None
            assert get('/dashboard/index?kind=receipts&q=' + tx_hash)['rows']
            stop()
            assert process.wait(timeout=10) == 0
            with sqlite3.connect(data / 'index.sqlite') as db:
                assert db.execute('PRAGMA journal_mode').fetchone()[0] == 'wal'
                assert db.execute('SELECT count(*) FROM logs').fetchone()[0] >= old_logs
                assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
            print('PASS: continuous rounds, GPU, dashboard/CPU/threads/RocksDB, WAL search, duplicate guard, stop, persistent restart, stop while signing, SIGKILL/WAL recovery, torn-log recovery')
        except BaseException:
            print(capture.read_text())
            raise
        finally:
            stop()
            if process.poll() is None:
                process.wait(timeout=10)


if __name__ == '__main__':
    main()
