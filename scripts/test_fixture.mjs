import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {Transaction, keccak256} from 'ethers';
import {decode} from './capnp-codec.mjs';

// Cross the signing chunk boundary in both a fresh chain and a resumed chain.
for (const start of [null, 123]) {
  const args = ['scripts/network_fixture.mjs', '4097'];
  if (start !== null) args.push(String(start));
  const fixture = decode(execFileSync(process.execPath, args, {maxBuffer: 16 * 1024 * 1024}));
  const warmup = start === null ? 2 : 0;
  assert.equal(fixture.raw.length, 4097 + warmup);
  assert.equal(fixture.hashes.length, fixture.raw.length);
  for (const index of [0, 1, 4095, 4096, fixture.raw.length - 1]) {
    const tx = Transaction.from(fixture.raw[index]);
    assert.equal(tx.nonce, (start ?? 0) + index);
    assert.equal(tx.chainId, 7777n);
    assert.equal(tx.type, tx.nonce % 2 ? 2 : 0);
    assert.equal(tx.from, fixture.owner);
    assert.equal(keccak256(fixture.raw[index]), fixture.hashes[index]);
    if (index >= warmup) {
      assert.equal(tx.to, fixture.recipient);
      assert.equal(tx.value, BigInt(index - warmup + 1));
    }
  }
}
console.log('PASS: signing chunk boundaries preserve nonce, sender, hash, type and value for new/resumed chains');
