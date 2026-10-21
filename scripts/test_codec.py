#!/usr/bin/env python3
"""Compatibility process launcher; binary interoperability tests run in Rust/JS."""
import os
if __name__ == '__main__':
    os.execvp('make', ['make', 'test-codec'])
