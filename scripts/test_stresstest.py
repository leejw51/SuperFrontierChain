#!/usr/bin/env python3
"""Compatibility launcher for Rust-owned stress/crash/restart integration tests."""
import os
if __name__ == '__main__':
    os.execvp('cargo', ['cargo', 'test', '--locked', '--release', '--test', 'native_benchmark',
        '--', '--ignored', '--test-threads=1'])
