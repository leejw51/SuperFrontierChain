#!/usr/bin/env python3
"""Exercise real terminal Ctrl-C/Ctrl-Z against make and the release GPU node."""
import os
from pathlib import Path
import pty
import select
import signal
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]


def terminal_run(home, key):
    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(ROOT)
        os.execvp('make', ['make', 'stresstest', f'STRESS_DIR={home}',
                          'STRESS_TRANSACTIONS=128', 'STRESS_BATCH=64'])
    output = bytearray()
    sent = False
    deadline = time.monotonic() + 180
    try:
        while time.monotonic() < deadline:
            if select.select([fd], [], [], .1)[0]:
                try:
                    output.extend(os.read(fd, 65536))
                except OSError:
                    pass
            if not sent and b'committed TPS' in output:
                os.write(fd, key)
                sent = True
                deadline = time.monotonic() + 35
            ended, status = os.waitpid(pid, os.WNOHANG)
            if ended:
                pid = None
                assert sent, output.decode(errors='replace')
                exit_code = os.waitstatus_to_exitcode(status)
                # make itself receives terminal SIGINT and may retain its interrupted status.
                allowed = (0, -signal.SIGINT, 128 + signal.SIGINT, 2) if key == b'\x03' else (0,)
                assert exit_code in allowed, output.decode(errors='replace')
                assert b'SFC supervisor stopped; persistent data retained.' in output
                assert (home / 'node-0/data/rocksdb').is_dir()
                print(f'PASS: terminal {key!r}, clean make exit, DB retained')
                return
        raise AssertionError(output.decode(errors='replace')[-5000:])
    finally:
        if pid is not None:
            os.kill(pid, signal.SIGCONT)
            subprocess.run(['make', 'stop'], cwd=ROOT, check=True)
            os.kill(pid, signal.SIGTERM)
            os.waitpid(pid, 0)
        os.close(fd)


if __name__ == '__main__':
    import stress_supervisor as supervisor
    assert not supervisor.targets(supervisor.processes()), 'Stop existing nodes before this test.'
    with tempfile.TemporaryDirectory(prefix='sfc-signals-') as directory:
        home = Path(directory) / 'chain'
        for key in (b'\x03', b'\x1a'):
            terminal_run(home, key)
            assert not supervisor.targets(supervisor.processes()), 'Leaked blockchain process'
    print('PASS: Ctrl-C then same-chain restart and Ctrl-Z; no leftover processes')
