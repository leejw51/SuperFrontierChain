#!/usr/bin/env python3
"""Compatibility launcher for the Rust benchmark tests."""
import os
if __name__ == '__main__':
    os.execvp('cargo', ['cargo', 'test', '--locked', '--release', '--bin', 'sfc-bench'])
