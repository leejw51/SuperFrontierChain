use anyhow::{ensure, Context, Result};
use clap::{Parser, Subcommand};
use sfc::{
    config::{Config, Retention},
    framework::Application,
    node::Node,
    types::Genesis,
};
use std::{
    collections::BTreeMap,
    fs::{self, OpenOptions},
    io::Write,
    path::PathBuf,
    sync::{Arc, Mutex},
    time::Duration,
};

#[derive(Parser)]
#[command(name = "sfc", version, about = "SuperFroniterChain development node")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}
#[derive(Subcommand)]
enum Command {
    /// Create JSONL configuration and Cap'n Proto genesis without overwriting existing files.
    Init {
        #[arg(long, default_value_os_t = sfc::config::persistence_root().join("node"))]
        home: PathBuf,
        #[arg(long)]
        archive: bool,
        #[arg(long, value_enum, default_value = "gpu")]
        verification_backend: sfc::verification::Backend,
    },
    /// Run the explicitly enabled local development sequencer.
    Run {
        #[arg(long, default_value_os_t = sfc::config::persistence_root().join("node/config.jsonl"))]
        config: PathBuf,
        #[arg(long, value_enum)]
        verification_backend: Option<sfc::verification::Backend>,
        /// In-process MLX (default for new configs) or direct Metal.
        #[arg(long, value_enum)]
        gpu_runtime: Option<sfc::verification::GpuRuntime>,
        /// Disable the rebuildable SQLite explorer/log index; RocksDB commits remain enabled.
        #[arg(long)]
        no_indexer: bool,
    },
    /// Query a peer through Cap'n Proto RPC.
    PeerStatus {
        #[arg(long, value_enum, default_value = "tcp")]
        transport: sfc::config::Transport,
        #[arg(long, default_value = "127.0.0.1:26656")]
        address: std::net::SocketAddr,
        #[arg(long, default_value_os_t = sfc::config::persistence_root().join("node/peer-cert.der"))]
        certificate: PathBuf,
    },
}
fn now() -> Result<u64> {
    Ok(std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)?
        .as_secs())
}
fn write_new(path: PathBuf, value: &impl sfc::codec::Record) -> Result<()> {
    let mut file = OpenOptions::new().write(true).create_new(true).open(path)?;
    file.write_all(&sfc::codec::to_vec(value)?)?;
    file.sync_all()?;
    Ok(())
}
fn init(home: PathBuf, archive: bool, backend: sfc::verification::Backend) -> Result<()> {
    fs::create_dir_all(&home)?;
    let home = fs::canonicalize(home)?;
    ensure!(
        !home.join("config.jsonl").exists()
            && !home.join("config.capnp").exists()
            && !home.join("genesis.capnp").exists()
            && !home.join("config.json").exists()
            && !home.join("genesis.json").exists(),
        "configuration already exists; preserve this home and use a new protocol-v3 directory"
    );
    let genesis = Genesis {
        chain_id: 7777,
        timestamp: now()?,
        gas_limit: 100_000_000,
        alloc: BTreeMap::from([(
            "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf".into(),
            "1000000000000000000000".into(),
        )]),
    };
    let config = Config {
        verification: sfc::verification::VerificationConfig {
            backend,
            ..Default::default()
        },
        data_dir: home.join("data"),
        genesis: home.join("genesis.capnp"),
        rpc_listen: "127.0.0.1:8545".parse()?,
        capnp_listen: None,
        peer_listen: "127.0.0.1:26656".parse()?,
        tls_cert: home.join("peer-cert.der"),
        tls_key: home.join("peer-key.der"),
        sync_peer: None,
        block_interval_ms: 100,
        max_pending: 16384,
        max_block_transactions: 4096,
        retention: if archive {
            Retention::Archive
        } else {
            Retention::default()
        },
        development: true,
    };
    sfc::network::generate_identity(&config.tls_cert, &config.tls_key)?;
    write_new(home.join("genesis.capnp"), &genesis)?;
    sfc::config::save(&home.join("config.jsonl"), &config)?;
    println!("Initialized {}. The funded development account uses private key 0x...01; never fund it with real assets.",home.display());
    Ok(())
}
async fn run(
    path: PathBuf,
    backend: Option<sfc::verification::Backend>,
    gpu_runtime: Option<sfc::verification::GpuRuntime>,
    no_indexer: bool,
) -> Result<()> {
    let path = if path.exists() {
        fs::canonicalize(path)?
    } else {
        path
    };
    let mut config: Config = sfc::config::load(&path)?;
    if let Some(runtime) = gpu_runtime {
        config.verification.gpu_runtime = runtime;
    }
    if let Some(backend) = backend {
        config.verification.backend = backend;
    } else if let Ok(value) = std::env::var("SFC_VERIFICATION_BACKEND") {
        config.verification.backend = <sfc::verification::Backend as clap::ValueEnum>::from_str(
            &value, false,
        )
        .map_err(|_| anyhow::anyhow!("SFC_VERIFICATION_BACKEND must be cpu, gpu or hybrid"))?;
    }
    let parent = path.parent().context("config directory")?;
    if config.data_dir.is_relative() {
        config.data_dir = parent.join(&config.data_dir);
    }
    if config.genesis.is_relative() {
        config.genesis = parent.join(&config.genesis);
    }
    if config.tls_cert.is_relative() {
        config.tls_cert = parent.join(&config.tls_cert);
    }
    if config.tls_key.is_relative() {
        config.tls_key = parent.join(&config.tls_key);
    }
    if let Some(peer) = &mut config.sync_peer {
        if peer.certificate.is_relative() {
            peer.certificate = parent.join(&peer.certificate);
        }
    }
    // Both sync transports listen by default. TCP and UDP may share a port;
    // an explicit Capnp address can select a different TCP port.
    config.capnp_listen.get_or_insert(config.peer_listen);
    config.validate()?;
    let http = tokio::net::TcpListener::bind(config.rpc_listen).await?;
    let peer = sfc::network::endpoint(&config)?;
    let direct = match config.capnp_listen {
        Some(address) => Some(tokio::net::TcpListener::bind(address).await?),
        None => None,
    };
    let node = Arc::new(Mutex::new(Node::open(
        config.clone(),
        Application::default(),
    )?));
    if !path.with_extension("jsonl").exists() {
        sfc::config::save(&path, &config)?;
    }
    // RocksDB ownership must be established before repairing/appending the log.
    sfc::logging::initialize(&config.data_dir)?;
    fs::write(
        config.data_dir.join("runtime-info.capnp"),
        sfc::codec::to_vec(&serde_json::json!({
            "config":fs::canonicalize(&path)?,
            "nodeHome":fs::canonicalize(parent)?,
            "binary":std::env::current_exe()?,
            "gpuRuntime":config.verification.gpu_runtime,
            "gpuPython":null,
            "gpuWorker":null,
            "tlsKeyLocation":config.tls_key,
            "sqliteIndexerEnabled":!no_indexer
        }))?,
    )?;
    let _indexer = if no_indexer {
        None
    } else {
        Some(sfc::indexer::Indexer::start(
            node.clone(),
            config.data_dir.clone(),
        )?)
    };
    sfc::logging::event(
        "info",
        "node_started",
        serde_json::json!({
            "role":config.sync_peer.as_ref().map(|_| "follower").unwrap_or("sequencer"),
            "rpc":config.rpc_listen,"http3":config.peer_listen,"capnp_tcp":config.capnp_listen,
            "block_interval_ms":config.block_interval_ms,"retention":config.retention,
            "verification_backend":config.verification.backend,
            "gpu_runtime":config.verification.gpu_runtime,
            "sqlite_indexer_enabled":!no_indexer
        }),
    );
    let producer_node = node.clone();
    let sync_config = config.sync_peer.clone();
    let producer = async move {
        if let Some(peer) = sync_config {
            return sfc::network::follow(producer_node, peer).await;
        }
        let mut timer = tokio::time::interval(Duration::from_millis(config.block_interval_ms));
        timer.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
        loop {
            timer.tick().await;
            let node = producer_node.clone();
            tokio::task::spawn_blocking(move || {
                let block = node.lock()
                    .map_err(|_| anyhow::anyhow!("node lock poisoned"))?
                    .produce(now()?)?;
                sfc::logging::event("info", "block_produced", serde_json::json!({"height":block.height(),"transactions":block.transaction_count(),"hash":sfc::types::hex_hash(&block.hash())}));
                Ok::<(), anyhow::Error>(())
            })
            .await??;
        }
        #[allow(unreachable_code)]
        Ok::<(), anyhow::Error>(())
    };
    tokio::select! {
        result = axum::serve(http,sfc::rpc::router(node.clone())) => result?,
        result = sfc::network::serve(peer,node.clone()) => result?,
        result = async {
            match direct {
                Some(listener) => sfc::network::serve_tcp(listener, node.clone()).await,
                None => std::future::pending::<Result<()>>().await,
            }
        } => result?,
        result = producer => result?,
        result = tokio::signal::ctrl_c() => {result?; sfc::logging::event("info", "node_stopping", serde_json::json!({"reason":"interrupt"}));},
    }
    Ok(())
}
#[tokio::main(flavor = "current_thread")]
async fn main() {
    sfc::logging::install_panic_hook();
    let result = tokio::task::LocalSet::new()
        .run_until(async {
            match Cli::parse().command {
                Command::Init {
                    home,
                    archive,
                    verification_backend,
                } => init(home, archive, verification_backend),
                Command::Run {
                    config,
                    verification_backend,
                    gpu_runtime,
                    no_indexer,
                } => run(config, verification_backend, gpu_runtime, no_indexer).await,
                Command::PeerStatus {
                    transport,
                    address,
                    certificate,
                } => {
                    let peer = sfc::network::PeerConnection::connect(&sfc::config::SyncPeer {
                        transport,
                        address,
                        certificate,
                        server_name: "localhost".into(),
                    })
                    .await?;
                    std::io::stdout().write_all(&sfc::codec::to_vec(&peer.status().await?)?)?;
                    Ok(())
                }
            }
        })
        .await;
    if let Err(error) = result {
        sfc::logging::event(
            "error",
            "node_failed",
            serde_json::json!({"message":error.to_string()}),
        );
        std::process::exit(1);
    }
}
