#!/usr/bin/env python3
"""Compatibility process launcher. Benchmarking itself is entirely Rust."""
import os
import pathlib
import sys

if __name__ == '__main__':
    binary = pathlib.Path(__file__).resolve().parents[1] / 'target/release/sfc-bench'
    if not binary.is_file():
        raise SystemExit('Build the Rust benchmark first: make release')
    os.execv(str(binary), [str(binary), 'bench', *sys.argv[1:]])
