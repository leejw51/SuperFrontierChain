#!/usr/bin/env python3
"""Compatibility process launcher; signing, submission and metrics run in Rust."""
import os
import pathlib
import sys

if __name__ == '__main__':
    binary = pathlib.Path(__file__).resolve().parents[1] / 'target/release/sfc-bench'
    if not binary.is_file():
        raise SystemExit('Build the Rust stress runner first: make release')
    os.execv(str(binary), [str(binary), *sys.argv[1:]])
