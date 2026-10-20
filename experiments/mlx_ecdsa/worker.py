#!/usr/bin/env python3
"""Persistent local node worker. JSONL stdout is reserved for the IPC protocol."""
import json
import sys
from recovery import Recovery


def main():
    gpu = Recovery()
    print(json.dumps({'ready': True, 'protocol': 1}), flush=True)
    while True:
        line = sys.stdin.buffer.readline(2 * 1024 * 1024)
        if not line:
            return  # Parent died or closed the socket; do not leave orphan workers.
        if not line.endswith(b'\n'):
            raise ValueError('worker request exceeded limit')
        request = json.loads(line)
        cases = request['cases']
        if not isinstance(cases, list) or len(cases) > 4096:
            raise ValueError('expected at most 4096 recovery records')
        keys = gpu.recover(cases)
        print(json.dumps({'id': request['id'], 'keys': keys}, separators=(',', ':')), flush=True)


if __name__ == '__main__':
    main()
