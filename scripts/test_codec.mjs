// Rust/browser Cap'n Proto interoperability; no Python data processing.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {encode, decode} from './capnp-codec.mjs';
const oracle = resolve('target/release/examples/codec_roundtrip');
const home = mkdtempSync(join(tmpdir(), 'sfc-codec-js-'));
try {
  const bytes = execFileSync(oracle);
  const value = decode(bytes);
  assert.equal(BigInt(value.max), (1n << 64n) - 1n);
  assert.equal(BigInt(value.min), -(1n << 63n));
  const path = join(home, 'js.capnp');
  writeFileSync(path, encode(value));
  assert.deepEqual(decode(execFileSync(oracle, [path])), value);
  const nodeHome = join(home, 'node');
  execFileSync(resolve('target/release/sfc'), ['init', '--home', nodeHome]);
  for (const kind of ['config', 'genesis']) {
    const original = join(nodeHome, kind + '.capnp');
    const typed = decode(readFileSync(original));
    const roundtrip = join(home, kind + '.capnp');
    writeFileSync(roundtrip, encode(typed));
    assert.deepEqual(decode(execFileSync(oracle, ['--' + kind, roundtrip])), typed);
  }
  console.log('PASS: Rust/browser Capnp values, 64-bit boundaries, Unicode, config and genesis round trips');
} finally { rmSync(home, {recursive: true, force: true}); }
