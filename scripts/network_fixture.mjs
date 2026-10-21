import {encode} from './capnp-codec.mjs';
// Deterministic signed workload for the Python-supervised process test.
// This helper owns no node processes and never sends RPC requests.
import { Wallet, getCreateAddress, keccak256 } from 'ethers';

const owner = new Wallet('0x' + '0'.repeat(63) + '1');
const recipient = new Wallet('0x' + '0'.repeat(63) + '2');
const contract = getCreateAddress({ from: owner.address, nonce: 0 });
const transfers = Number(process.argv[2] ?? 32);
// Optional starting nonce produces transfers only, for a persistent stress chain.
const startNonce = Number(process.argv[3] ?? 0);
const transfersOnly = process.argv[3] !== undefined;
if (!Number.isSafeInteger(startNonce) || startNonce < 0 || !Number.isSafeInteger(startNonce + transfers)) throw Error('invalid starting nonce');
assertTransferCount(transfers);
function assertTransferCount(count) {
  if (!Number.isInteger(count) || count < 1 || count > 262144) throw Error('transfer count must be 1..262144');
}
const requests = [
  // Deploy SSTORE(0, 42); return CALLER.
  ...transfersOnly ? [] : [
    { data: '0x600e600c600039600e6000f3602a6000553360005260206000f3' },
    { to: contract },
  ],
  ...Array.from({ length: transfers }, (_, i) => ({ to: recipient.address, value: BigInt(i + 1) })),
];
// Bound outstanding signing jobs for longer benchmarks. Holding hundreds of
// thousands of wallet promises at once otherwise consumes several GiB.
const raw = [];
for (let offset = 0; offset < requests.length; offset += 4096) {
  const signed = await Promise.all(requests.slice(offset, offset + 4096).map((request, index) => {
    const nonce = startNonce + offset + index;
    const type = nonce % 2 ? 2 : 0;
    const fees = type === 2 ? { maxFeePerGas: 1n, maxPriorityFeePerGas: 1n } : { gasPrice: 1n };
    return owner.signTransaction({ ...request, nonce, chainId: 7777, gasLimit: 150_000, type, ...fees });
  }));
  raw.push(...signed);
}
process.stdout.write(encode({ raw, hashes: raw.map(keccak256), owner: owner.address, recipient: recipient.address, contract }));
