#[allow(unused_parens, clippy::all)]
pub mod chain_capnp {
    include!(concat!(env!("OUT_DIR"), "/chain_capnp.rs"));
}
#[allow(unused_parens, clippy::all)]
pub mod runtime_capnp {
    include!(concat!(env!("OUT_DIR"), "/runtime_capnp.rs"));
}
pub mod codec;
pub mod config;
pub mod consensus;
pub mod ethereum;
pub mod framework;
pub mod merkle;
pub mod network;
pub mod node;
pub mod rpc;
pub mod schema;
pub mod storage;
pub mod types;
pub mod verification;

mod journal;

pub mod dashboard;

pub mod indexer;
pub mod logging;
pub mod telemetry;

pub mod evm_db;

pub mod storage_capnp {
    include!(concat!(env!("OUT_DIR"), "/storage_capnp.rs"));
}
pub mod binary;

mod records;
