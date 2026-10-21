import {encode,decode} from './capnp-codec.mjs';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, openSync, closeSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import net from 'node:net';
import dgram from 'node:dgram';
import assert from 'node:assert/strict';
import solc from 'solc';
import { Wallet, Interface, ContractFactory, getCreateAddress, parseEther } from 'ethers';

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function freePort(udp = false) {
  const socket = udp ? dgram.createSocket('udp4') : net.createServer();
  await new Promise(r => udp ? socket.bind(0, '127.0.0.1', r) : socket.listen(0, '127.0.0.1', r));
  const port = socket.address().port;
  await new Promise(r => socket.close(r));
  return port;
}
const binary = resolve('target/debug/sfc');
const home = mkdtempSync(join(tmpdir(), 'sfc-erc20-'));
let process, follower;
const log = openSync(join(home, 'node.log'), 'w+');
let id = 0;
async function stop(child) {
  if (child && child.exitCode === null) {
    child.kill('SIGINT');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { child.kill('SIGKILL'); reject(Error('shutdown timed out')); }, 10000);
      child.once('exit', code => { clearTimeout(timeout); code === 0 ? resolve() : reject(Error(`exit ${code}`)); });
    });
  }
}
try {
  const initialized = spawnSync(binary, ['init', '--home', home], { encoding: 'utf8' });
  assert.equal(initialized.status, 0, initialized.stderr);
  const config = decode(readFileSync(join(home, 'config.capnp')));
  config.rpc_listen = `127.0.0.1:${await freePort()}`;
  config.peer_listen = `127.0.0.1:${await freePort(true)}`;
  config.block_interval_ms = 500;
  writeFileSync(join(home, 'config.capnp'), encode(config));
  const url = `http://${config.rpc_listen}`;
  async function rpc(method, params = [], target = url) {
    const response = await fetch(target, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: ++id, method, params }), signal: AbortSignal.timeout(5000) });
    const body = await response.json();
    if (body.error) throw Error(`${method}: ${body.error.message}`);
    return body.result;
  }
  async function waitFor(fn) {
    for (let i = 0; i < 200; i++) { try { const result = await fn(); if (result) return result; } catch {} await sleep(50); }
    throw Error('timed out waiting for node');
  }
  function launch() { return spawn(binary, ['run', '--config', join(home, 'config.capnp')], { stdio: ['ignore', log, log] }); }
  process = launch();
  await waitFor(() => rpc('eth_chainId'));
  const owner = new Wallet('0x' + '0'.repeat(63) + '1');
  const spender = new Wallet('0x' + '0'.repeat(63) + '2');
  const recipient = new Wallet('0x' + '0'.repeat(63) + '3');
  const input = { language: 'Solidity', sources: { 'Token.sol': { content: readFileSync('examples/Token.sol', 'utf8') } }, settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: 'shanghai', outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } } } };
  const compiled = JSON.parse(solc.compile(JSON.stringify(input)));
  assert.equal(compiled.errors?.filter(e => e.severity === 'error').length ?? 0, 0, JSON.stringify(compiled.errors));
  const token = compiled.contracts['Token.sol'].Token;
  const iface = new Interface(token.abi);
  async function send(wallet, request, type = 2) {
    const nonce = Number(BigInt(await rpc('eth_getTransactionCount', [wallet.address, 'latest'])));
    const fees = type === 2 ? { maxFeePerGas: 1n, maxPriorityFeePerGas: 1n } : { gasPrice: 1n };
    const raw = await wallet.signTransaction({ ...request, chainId: 7777, nonce, gasLimit: 2_000_000, type, ...fees });
    const hash = await rpc('eth_sendRawTransaction', [raw]);
    const receipt = await waitFor(() => rpc('eth_getTransactionReceipt', [hash]));
    return { hash, receipt, raw };
  }
  const factory = new ContractFactory(token.abi, '0x' + token.evm.bytecode.object);
  const deployment = await factory.getDeployTransaction(1_000_000n);
  const estimated = BigInt(await rpc('eth_estimateGas', [{ from: owner.address, data: deployment.data }]));
  assert(estimated > 21000n && estimated < 2_000_000n);
  const deployed = await send(owner, deployment);
  assert.equal(deployed.receipt.status, '0x1');
  const address = getCreateAddress({ from: owner.address, nonce: 0 });
  assert.equal(deployed.receipt.contractAddress.toLowerCase(), address.toLowerCase());
  async function read(method, args = [], target = url) {
    const result = await rpc('eth_call', [{ to: address, data: iface.encodeFunctionData(method, args) }, 'latest'], target);
    return iface.decodeFunctionResult(method, result)[0];
  }
  assert.equal(await read('totalSupply'), 1_000_000n);
  assert.equal(await read('balanceOf', [owner.address]), 1_000_000n);
  const transfer = await send(owner, { to: address, data: iface.encodeFunctionData('transfer', [recipient.address, 100n]) }, 0);
  assert.equal(transfer.receipt.status, '0x1');
  assert.equal(iface.parseLog(transfer.receipt.logs[0]).name, 'Transfer');
  assert.equal(await read('balanceOf', [recipient.address]), 100n);
  const approval = await send(owner, { to: address, data: iface.encodeFunctionData('approve', [spender.address, 50n]) });
  assert.equal(iface.parseLog(approval.receipt.logs[0]).name, 'Approval');
  await send(owner, { to: spender.address, value: parseEther('1') });
  const delegated = await send(spender, { to: address, data: iface.encodeFunctionData('transferFrom', [owner.address, recipient.address, 40n]) });
  assert.equal(delegated.receipt.status, '0x1');
  assert.equal(await read('allowance', [owner.address, spender.address]), 10n);
  assert.equal(await read('balanceOf', [recipient.address]), 140n);
  const reverted = await send(spender, { to: address, data: iface.encodeFunctionData('transferFrom', [owner.address, recipient.address, 11n]) });
  assert.equal(reverted.receipt.status, '0x0');
  assert.equal(reverted.receipt.logs.length, 0);
  assert.equal(await read('balanceOf', [recipient.address]), 140n);
  await assert.rejects(() => rpc('eth_sendRawTransaction', [deployed.raw]), /nonce/i);
  // Shared-executor HTTP batches must isolate decode/nonce errors and notifications.
  const baseNonce = Number(BigInt(await rpc('eth_getTransactionCount', [owner.address, 'latest'])));
  const batchRaw = await Promise.all(Array.from({ length: 32 }, (_, index) => owner.signTransaction({
    to: address, data: iface.encodeFunctionData('approve', [spender.address, index === 31 ? 10n : BigInt(index)]),
    chainId: 7777, nonce: baseNonce + index, gasLimit: 100000, type: 2, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n,
  })));
  const batchRequests = batchRaw.map((raw, index) => ({ jsonrpc: '2.0', ...(index === 5 ? {} : { id: index }), method: 'eth_sendRawTransaction', params: [raw] }));
  batchRequests.splice(17, 0, { jsonrpc: '2.0', id: 'invalid', method: 'eth_sendRawTransaction', params: ['0x00'] });
  const wrongNonce = await owner.signTransaction({ to: address, chainId: 7777, nonce: baseNonce + 999,
    gasLimit: 100000, type: 2, maxFeePerGas: 1n, maxPriorityFeePerGas: 1n });
  batchRequests.splice(20, 0, { jsonrpc: '2.0', id: 'nonce', method: 'eth_sendRawTransaction', params: [wrongNonce] });
  batchRequests.push({ jsonrpc: '2.0', id: 'duplicate', method: 'eth_sendRawTransaction', params: [batchRaw[0]] });
  const batchResponse = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(batchRequests) });
  const batchResults = await batchResponse.json();
  assert.equal(batchResults.length, 34);
  assert.deepEqual(batchResults.filter(item => item.error).map(item => item.id), ['invalid', 'nonce']);
  assert.equal(batchResults.find(item => item.id === 'duplicate').result, batchResults.find(item => item.id === 0).result);
  const lastHash = batchResults.find(item => item.id === 31).result;
  await waitFor(() => rpc('eth_getTransactionReceipt', [lastHash]));
  assert.equal(await read('allowance', [owner.address, spender.address]), 10n);
  assert.equal(Number(BigInt(await rpc('eth_getTransactionCount', [owner.address, 'latest']))), baseNonce + 32);
  // A follower replays the actual deployment and token transactions over HTTP/3.
  const followerHome = join(home, 'follower');
  assert.equal(spawnSync(binary, ['init', '--home', followerHome]).status, 0);
  const followerConfig = decode(readFileSync(join(followerHome, 'config.capnp')));
  followerConfig.rpc_listen = `127.0.0.1:${await freePort()}`;
  followerConfig.peer_listen = `127.0.0.1:${await freePort(true)}`;
  followerConfig.sync_peer = { address: config.peer_listen, server_name: 'localhost', certificate: config.tls_cert };
  writeFileSync(followerConfig.genesis, readFileSync(config.genesis));
  writeFileSync(join(followerHome, 'config.capnp'), encode(followerConfig));
  follower = spawn(binary, ['run', '--config', join(followerHome, 'config.capnp')], { stdio: ['ignore', log, log] });
  const followerUrl = `http://${followerConfig.rpc_listen}`;
  await waitFor(async () => await read('balanceOf', [recipient.address], followerUrl) === 140n);
  assert.equal(await read('allowance', [owner.address, spender.address], followerUrl), 10n);
  await stop(process); process = launch();
  await waitFor(() => rpc('eth_chainId'));
  assert.equal(await read('balanceOf', [recipient.address]), 140n);
  assert.equal(await read('allowance', [owner.address, spender.address]), 10n);
  console.log('PASS: Solidity ERC-20 deployment, estimateGas, transfer, approve, transferFrom, events, revert, replay rejection, restart, Rayon JSON-RPC batches and HTTP/3 follower sync');
} catch (error) {
  console.error(readFileSync(join(home, 'node.log'), 'utf8'));
  throw error;
} finally {
  await stop(follower); await stop(process); closeSync(log); rmSync(home, { recursive: true, force: true });
}
