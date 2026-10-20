#![allow(dead_code)]
use k256::ecdsa::SigningKey;
use revm::primitives::{Address, U256};
use rlp::RlpStream;
use sfc::{
    ethereum::Transaction,
    types::{hash, Genesis},
};
use std::collections::BTreeMap;
pub fn key() -> SigningKey {
    SigningKey::from_slice(&[1u8; 32]).unwrap()
}
pub fn sender() -> Address {
    Address::from_slice(&hash(&key().verifying_key().to_encoded_point(false).as_bytes()[1..])[12..])
}
pub fn genesis() -> Genesis {
    Genesis {
        chain_id: 7777,
        timestamp: 1_000_000,
        gas_limit: 30_000_000,
        alloc: BTreeMap::from([(format!("{:#x}", sender()), "1000000000000000000".into())]),
    }
}
pub fn signed(
    nonce: u64,
    to: Option<Address>,
    value: u64,
    data: &[u8],
    gas: u64,
    chain: u64,
) -> Vec<u8> {
    fn fields(
        stream: &mut RlpStream,
        nonce: u64,
        to: Option<Address>,
        value: u64,
        data: &[u8],
        gas: u64,
    ) {
        stream.append(&nonce).append(&1u64).append(&gas);
        stream.append(&to.map(|a| a.as_slice().to_vec()).unwrap_or_default());
        stream.append(&value).append(&data);
    }
    let mut signing = RlpStream::new_list(9);
    fields(&mut signing, nonce, to, value, data, gas);
    signing.append(&chain).append(&0u8).append(&0u8);
    let (sig, recovery) = key()
        .sign_prehash_recoverable(&hash(&signing.out()))
        .unwrap();
    let mut out = RlpStream::new_list(9);
    fields(&mut out, nonce, to, value, data, gas);
    out.append(&(chain * 2 + 35 + recovery.to_byte() as u64));
    let bytes = sig.to_bytes();
    for part in [&bytes[..32], &bytes[32..]] {
        let start = part.iter().position(|b| *b != 0).unwrap_or(part.len());
        out.append(&&part[start..]);
    }
    out.out().to_vec()
}
pub fn transfer(nonce: u64) -> Transaction {
    Transaction::decode(
        &signed(
            nonce,
            Some(Address::repeat_byte(0x22)),
            10,
            b"",
            21_000,
            7777,
        ),
        7777,
    )
    .unwrap()
}
pub fn balance(world: &sfc::types::World, address: Address) -> U256 {
    world
        .accounts
        .get(&format!("{address:#x}"))
        .unwrap()
        .balance
        .parse()
        .unwrap()
}
pub fn config(path: &std::path::Path) -> sfc::config::Config {
    let genesis_path = path.join("genesis.json");
    std::fs::write(&genesis_path, serde_json::to_vec(&genesis()).unwrap()).unwrap();
    sfc::config::Config {
        verification: sfc::verification::VerificationConfig {
            backend: sfc::verification::Backend::Cpu,
            ..Default::default()
        },
        data_dir: path.join("data"),
        genesis: genesis_path,
        rpc_listen: "127.0.0.1:8545".parse().unwrap(),
        capnp_listen: None,
        peer_listen: "127.0.0.1:26656".parse().unwrap(),
        tls_cert: path.join("cert.der"),
        tls_key: path.join("key.der"),
        sync_peer: None,
        block_interval_ms: 500,
        max_pending: 16384,
        max_block_transactions: 4096,
        retention: sfc::config::Retention::default(),
        development: true,
    }
}
