#!/usr/bin/env python3
"""Owned local background node; control socket avoids signaling stale PID files."""
import argparse
import fcntl
import json
import os
import pathlib
import signal
import socket
import subprocess
import sys
import time
import urllib.request


def request(path, command):
    with socket.socket(socket.AF_UNIX) as client:
        client.settimeout(15)
        client.connect(str(path))
        client.sendall(command.encode())
        return client.recv(4096).decode()


def daemon(args):
    home = pathlib.Path(args.home)
    control = home / 'control.sock'
    stopping = False

    def stop(_signal, _frame):
        nonlocal stopping
        stopping = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    child = None
    try:
        control.unlink(missing_ok=True)
        with socket.socket(socket.AF_UNIX) as server, (home / 'node.jsonl').open('ab', buffering=0) as log:
            server.bind(str(control))
            os.chmod(control, 0o600)
            server.listen(4)
            server.settimeout(0.2)
            child = subprocess.Popen([args.binary, 'run', '--config', args.config], stdout=log, stderr=log)
            config = json.loads(pathlib.Path(args.config).read_text())
            url = 'http://' + config['rpc_listen'] + '/dashboard/stats'
            while not stopping and child.poll() is None:
                try:
                    conn, _ = server.accept()
                except socket.timeout:
                    continue
                with conn:
                    conn.settimeout(1)
                    try:
                        command = conn.recv(32).decode()
                        if command == 'stop':
                            stopping = True
                            conn.sendall(b'stopping')
                        else:
                            # Ensure startup has opened and validated this node's database.
                            try:
                                with urllib.request.urlopen(url, timeout=1) as response:
                                    ready = response.status == 200 and child.poll() is None
                            except OSError:
                                ready = False
                            conn.sendall(b'running' if ready else b'starting')
                    except (OSError, UnicodeError):
                        pass
    finally:
        if child is not None and child.poll() is None:
            child.send_signal(signal.SIGINT)
            try:
                child.wait(timeout=10)
            except subprocess.TimeoutExpired:
                child.kill()
                child.wait()
        control.unlink(missing_ok=True)
        os.close(args.lock_fd)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['start', 'stop', '_daemon'])
    parser.add_argument('--home', default='.sfc')
    parser.add_argument('--config', default='.sfc/config.json')
    parser.add_argument('--binary', default='target/release/sfc')
    parser.add_argument('--lock-fd', type=int)
    args = parser.parse_args()
    args.home = str(pathlib.Path(args.home).resolve())
    args.config = str(pathlib.Path(args.config).resolve())
    args.binary = str(pathlib.Path(args.binary).resolve())
    if args.command == '_daemon':
        daemon(args)
        return
    home = pathlib.Path(args.home)
    home.mkdir(parents=True, exist_ok=True)
    control = home / 'control.sock'
    with (home / 'service.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            active = False
        except BlockingIOError:
            active = True
        if args.command == 'stop':
            if not active:
                print('SFC is already stopped.')
                return
            deadline = time.monotonic() + 15
            while time.monotonic() < deadline:
                try:
                    request(control, 'stop')
                except OSError:
                    pass
                try:
                    fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    print('SFC stopped.')
                    return
                except BlockingIOError:
                    time.sleep(0.1)
            raise RuntimeError('shutdown timed out; inspect node.jsonl')
        if active:
            print('SFC service already active.')
            return
        config = pathlib.Path(args.config)
        if not config.exists():
            if config != home / 'config.json':
                raise RuntimeError('custom CONFIG does not exist')
            subprocess.run([args.binary, 'init', '--home', args.home], check=True, stdout=subprocess.DEVNULL)
        with (home / 'service.log').open('ab') as log:
            manager = subprocess.Popen([sys.executable, __file__, '_daemon', '--home', args.home, '--config', args.config, '--binary', args.binary, '--lock-fd', str(lock.fileno())], pass_fds=(lock.fileno(),), stdin=subprocess.DEVNULL, stdout=log, stderr=log, start_new_session=True)
        # The manager retains the same lock until its child has stopped.
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline and manager.poll() is None:
            try:
                if request(control, 'status') == 'running':
                    print(f'SFC started. Logs: {home / "node.jsonl"}')
                    return
            except OSError:
                pass
            time.sleep(0.1)
        manager.terminate()
        manager.wait(timeout=12)
        raise RuntimeError(f'node startup failed; inspect {home / "node.jsonl"}')


if __name__ == '__main__':
    main()
