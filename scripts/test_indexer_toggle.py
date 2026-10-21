#!/usr/bin/env python3
"""Compatibility launcher for Rust-supervised SQLite restart tests."""
import os
if __name__ == '__main__':
    os.execvp('cargo', ['cargo', 'test', '--locked', '--release', '--test', 'native_benchmark',
        'rust_stress_stop_restart_lock_and_sqlite_toggle', '--', '--ignored', '--test-threads=1'])
