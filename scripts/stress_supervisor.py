#!/usr/bin/env python3
"""Repository-scoped process management only. All stress computation stays in Rust."""
import argparse
import fcntl
import os
import ipaddress
import shutil
from pathlib import Path
import shlex
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / '.sfc-processes'
SCRIPT = Path(__file__).resolve()
STOPPING = False
STOP_SIGNAL = None


def interrupted(_signal, _frame):
    global STOPPING, STOP_SIGNAL
    STOPPING = True
    if STOP_SIGNAL is None:
        STOP_SIGNAL = _signal


def processes():
    output = subprocess.check_output(
        ['ps', '-ax', '-o', 'pid=,ppid=,uid=,lstart=,command='], text=True)
    result = {}
    for line in output.splitlines():
        fields = line.split(None, 8)
        if len(fields) != 9 or int(fields[2]) != os.getuid():
            continue
        result[int(fields[0])] = (int(fields[1]), ' '.join(fields[3:8]), fields[8])
    return result


def in_repository(pid):
    # Needed only for legacy launches using relative executable/script paths.
    try:
        output = subprocess.check_output(
            ['lsof', '-a', '-p', str(pid), '-d', 'cwd', '-Fn'],
            text=True, stderr=subprocess.DEVNULL, timeout=2)
        return f'n{ROOT}' in output.splitlines()
    except (OSError, subprocess.SubprocessError):
        return False


def owned(pid, record):
    if pid == os.getpid():
        return False
    try:
        args = shlex.split(record[2])
    except ValueError:
        return False
    if not args:
        return False
    executable = Path(args[0])
    if executable.name in ('sfc', 'sfc-bench'):
        return str(executable) in (str(ROOT / 'target/release' / executable.name),
                                   str(ROOT / 'target/debug' / executable.name)) or (
            str(executable).startswith('target/') and in_repository(pid))
    if executable.name.lower().startswith('python') and len(args) > 1:
        candidate = Path(args[1])
        scripts = ('stress_supervisor.py', 'service.py', 'supervisor.py', 'stresstest.py')
        if candidate.name not in scripts:
            return False
        return candidate == ROOT / 'scripts' / candidate.name or (
            str(candidate) == 'scripts/' + candidate.name and in_repository(pid))
    return False


def targets(snapshot):
    chosen = {pid for pid, record in snapshot.items() if owned(pid, record)}
    # Include build workers and Rust node descendants of repository supervisors.
    while True:
        expanded = chosen | {pid for pid, record in snapshot.items() if record[0] in chosen}
        if expanded == chosen:
            return {pid: snapshot[pid] for pid in chosen}
        chosen = expanded


def signal_same(pid, record, sig):
    # Never trust saved PID files. Re-check owner/start time/command before signaling.
    if processes().get(pid) == record:
        try:
            os.kill(pid, sig)
        except ProcessLookupError:
            pass


def stop_all():
    STATE.mkdir(exist_ok=True)
    # Serialize explicit starts/stops; new starts cannot race the stop scan.
    with (STATE / 'operation.lock').open('a') as operation:
        fcntl.flock(operation, fcntl.LOCK_EX)
        known = targets(processes())
        if not known:
            print('Already stopped: no blockchain processes for this repository.')
            return
        print(f'Stopping {len(known)} repository blockchain/supervisor processes...', flush=True)
        deadline = time.monotonic() + 15
        sent = set()
        while time.monotonic() < deadline:
            current = processes()
            known.update(targets(current))
            alive = {pid: record for pid, record in known.items() if current.get(pid) == record}
            if not alive:
                print('Stopped all repository blockchain processes; chain data preserved.')
                return
            for pid, record in alive.items():
                if (pid, record[1]) not in sent:
                    signal_same(pid, record, signal.SIGINT)
                    sent.add((pid, record[1]))
            time.sleep(.1)
        for pid, record in alive.items():
            signal_same(pid, record, signal.SIGKILL)
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            current = processes()
            if not any(current.get(pid) == record for pid, record in known.items()):
                print('Stopped all repository blockchain processes (forced remaining processes); data preserved.')
                return
            time.sleep(.1)
        raise RuntimeError('Some processes did not exit; inspect repository processes before restarting.')


def child_run(command):
    if STOPPING:
        return 0
    child = subprocess.Popen(command, cwd=ROOT, start_new_session=True)
    try:
        while child.poll() is None and not STOPPING:
            time.sleep(.1)
    finally:
        # Even an exited driver can leave node descendants in its owned group.
        try:
            os.killpg(child.pid, signal.SIGINT)
        except ProcessLookupError:
            pass
        if child.poll() is None:
            try:
                child.wait(timeout=10)
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(child.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                child.wait()
        # Keep the supervisor lock until orphan descendants of a crashed driver
        # have exited as well, so an immediate restart cannot race a live DB owner.
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            try:
                os.killpg(child.pid, 0)
            except ProcessLookupError:
                break
            time.sleep(.1)
        else:
            try:
                os.killpg(child.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
    return 0 if STOPPING else child.returncode


def tailscale_ip():
    candidates = [shutil.which('tailscale'), '/Applications/Tailscale.app/Contents/MacOS/Tailscale']
    for executable in candidates:
        if not executable or not Path(executable).exists():
            continue
        try:
            result = subprocess.run([executable, 'ip', '-4'], capture_output=True,
                                    text=True, timeout=3)
            if result.returncode == 0:
                return str(ipaddress.IPv4Address(result.stdout.strip()))
        except (OSError, ValueError, subprocess.SubprocessError):
            pass
    return None


def serve(args):
    signal.signal(signal.SIGINT, interrupted)
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGTSTP, interrupted)
    try:
        print('SFC Python supervisor: release build → Rust MLX stress runner', flush=True)
        if not args.skip_build:
            code = child_run(['make', 'release'])
            if code:
                return code
        if STOPPING:
            return 0
        os.environ.pop('SFC_TAILSCALE_IP', None)
        address = tailscale_ip()
        if address:
            os.environ['SFC_TAILSCALE_IP'] = address
        else:
            print('Tailscale IPv4 unavailable; use a LAN dashboard URL on the same network.', flush=True)
        return child_run(args.runner)
    finally:
        os.close(args.lock_fd)
        print('SFC supervisor stopped; persistent data retained.', flush=True)


def start(args):
    # Install before spawning so Ctrl-C/Ctrl-Z cannot orphan the new supervisor.
    if args.command == 'run':
        signal.signal(signal.SIGINT, interrupted)
        signal.signal(signal.SIGTERM, interrupted)
        signal.signal(signal.SIGTSTP, interrupted)
    STATE.mkdir(exist_ok=True)
    with (STATE / 'operation.lock').open('a') as operation, (STATE / 'stress.lock').open('a') as lock:
        fcntl.flock(operation, fcntl.LOCK_EX)
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print(f'Already running. Log: {STATE / "stress.log"}\nStop: make stop')
            return 0
        command = [sys.executable, str(SCRIPT), '_serve', '--lock-fd', str(lock.fileno())]
        if args.skip_build:
            command.append('--skip-build')
        command.extend(['--', *args.runner])
        if args.command == 'start':
            log_path = STATE / 'stress.log'
            with log_path.open('ab', buffering=0) as log:
                offset = log.tell()
                child = subprocess.Popen(command, cwd=ROOT, stdout=log, stderr=log,
                                         stdin=subprocess.DEVNULL, start_new_session=True,
                                         pass_fds=(lock.fileno(),))
            # Parent closes its duplicate; child owns the lock through build and run.
            print(f'Starting SFC stress supervisor (PID {child.pid}).\nLog and startup URLs: {log_path}\nFollow: tail -f {log_path}\nStop: make stop', flush=True)
            # Briefly relay this launch's URLs; never replay stale URLs from old runs.
            deadline = time.monotonic() + 8
            with log_path.open() as stream:
                stream.seek(offset)
                while time.monotonic() < deadline:
                    lines = stream.readlines()
                    for line in lines:
                        if any(label in line for label in ('Dashboard', 'Ethereum RPC', 'HTTP bind', 'Sync endpoint')):
                            print(line.rstrip(), flush=True)
                    if any('TPS/CPU results:' in line for line in lines):
                        break
                    if child.poll() is not None:
                        return child.returncode
                    time.sleep(.1)
            return 0
        child = subprocess.Popen(command, cwd=ROOT, start_new_session=True,
                                 pass_fds=(lock.fileno(),))
    signal.signal(signal.SIGINT, interrupted)
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGTSTP, interrupted)
    forwarded = False
    while child.poll() is None:
        if STOPPING and not forwarded:
            print('Stopping stress test gracefully; waiting for node and database shutdown...', flush=True)
            child.send_signal(signal.SIGINT)
            forwarded = True
        if STOP_SIGNAL == signal.SIGTSTP:
            # The terminal also sends SIGTSTP to make. Resume our parent so it
            # can reap this recipe and return the prompt after graceful shutdown.
            try:
                os.kill(os.getppid(), signal.SIGCONT)
            except ProcessLookupError:
                pass
        time.sleep(.1)
    return 0 if STOPPING else child.returncode


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['start', 'run', 'stop', '_serve'])
    parser.add_argument('--lock-fd', type=int)
    parser.add_argument('--skip-build', action='store_true', help=argparse.SUPPRESS)
    # Split the Rust command explicitly so supervisor options remain parseable.
    argv = sys.argv[1:]
    split = argv.index('--') if '--' in argv else len(argv)
    args = parser.parse_args(argv[:split])
    args.runner = argv[split + 1:] if split < len(argv) else []
    if args.command == 'stop':
        stop_all()
        return 0
    if not args.runner:
        parser.error('missing Rust runner command after --')
    return serve(args) if args.command == '_serve' else start(args)


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(f'SFC supervisor: {error}', file=sys.stderr)
        sys.exit(1)
