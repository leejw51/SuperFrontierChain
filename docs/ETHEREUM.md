# Ethereum compatibility

The runtime executes real Shanghai EVM bytecode using REVM. It supports native-value
transfers, contract creation/calls, persistent contract storage, gas accounting,
reverts, receipt logs and contract addresses. Both protected legacy transactions and
EIP-1559 type-2 transactions (including access lists) recover the sender, enforce
chain ID, reject high-s signatures, and validate nonce, gas and balance.

Implemented RPC methods:

- `web3_clientVersion`, `web3_sha3`
- `net_version`, `net_listening`, `net_peerCount`
- `eth_chainId`, `eth_blockNumber`, `eth_syncing`, `eth_accounts`
- `eth_gasPrice`, `eth_maxPriorityFeePerGas`
- `eth_getBalance`, `eth_getTransactionCount`, `eth_getCode`, `eth_getStorageAt`
- `eth_sendRawTransaction`, `eth_getTransactionReceipt`
- `eth_getBlockByNumber` with transaction hashes (`false`)
- `eth_call`, `eth_estimateGas`

State queries accept `latest` only. Unsupported tags fail explicitly. Block queries
accept `latest`, `earliest`, or a hexadecimal height; a missing/pruned block returns
null. Pruned receipts return null. Unknown methods return JSON-RPC method-not-found.
HTTP batches of up to 4,096 requests and notifications are supported. Transaction
signatures use the configured CPU/GPU/HYBRID verifier (GPU by default); requests
are then applied in input order. `sfc_verificationStatus` reports the active backend,
process IDs and CPU/GPU recovery record counts.
Invalid entries do not discard valid neighbors, and notifications still execute
without a response. JSON-RPC is HTTP for wallet/tooling
compatibility; node-to-node transport defaults to Cap'n Proto RPC over TCP,
with HTTP/3 available as an alternative transport for the same RPC protocol.

Fees use a fixed zero base fee and the zero-address fee beneficiary. This is not a
full dynamic EIP-1559 base-fee market. Blob, type-1 and authorization-list transactions
are unsupported. No standard Ethereum state/receipt trie proofs, historical account
state, filters, subscriptions, trace methods, full transaction/block objects or
`eth_getLogs` yet. Block JSON is a limited representation rather than a complete
Ethereum header. Wallets that rely on unsupported methods need further compatibility
work. `eth_accounts` is empty because keys remain with clients.

`eth_call` and `eth_estimateGas` allow a contract address as `from`, preserving
CALLER and discarding simulated changes. EIP-3607 remains enforced for actual
transactions; only RPC simulations disable that check.

Compile Solidity with `evmVersion: "shanghai"`. `make erc20` uses a pinned compiler and
ethers to test a real ERC-20 contract: deployment, balance/supply, transfer, approval,
transferFrom, indexed events, revert, replay rejection, persistence and follower sync.
This evidence establishes the tested subset; it is not an Ethereum conformance suite.

Dependencies and APIs: [REVM](https://github.com/bluealloy/revm),
[Cap'n Proto Rust](https://github.com/capnproto/capnproto-rust),
[HTTP/3 implementation](https://github.com/hyperium/h3).
