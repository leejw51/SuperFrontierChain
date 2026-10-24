//! Rust-only binary RPC benchmark and persistent stress supervisor. No Python/JS children.
mod bench_support;
use anyhow::{bail, ensure, Context, Result};
use clap::{Args, Parser, Subcommand, ValueEnum};
use rayon::prelude::*;
use reqwest::blocking::Client;
use revm::primitives::U256;
use rlp::RlpStream;
use serde_json::{json, Value};
use sfc::{
    codec,
    config::{Config, SyncPeer, Transport},
    types::hash,
    verification::{Backend, GpuRuntime},
};
use std::{
    fs::{self, File, OpenOptions},
    io::{Read, Seek, SeekFrom, Write},
    net::{IpAddr, Ipv4Addr, SocketAddr, TcpListener, UdpSocket},
    os::{
        fd::AsRawFd,
        unix::net::{UnixListener, UnixStream},
    },
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};
use sysinfo::{Pid, ProcessRefreshKind, ProcessesToUpdate, System};

static STOP: AtomicBool = AtomicBool::new(false);
extern "C" fn interrupt(_: libc::c_int) {
    STOP.store(true, Ordering::Relaxed);
}
#[derive(Parser)]
struct Cli {
    #[command(subcommand)]
    command: Action,
}
#[derive(Subcommand)]
enum Action {
    /// Keep stressing a persistent chain until Ctrl-C or `stop`.
    Run(Options),
    /// Compare fresh isolated networks; signing occurs before measurement.
    Bench(Options),
    /// Stop a managed stress run, optionally also the background service.
    Stop {
        #[arg(long, default_value_os_t = sfc::config::persistence_root().join("stress"))]
        home: PathBuf,
        #[arg(long)]
        service_home: Option<PathBuf>,
    },
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, ValueEnum)]
enum Sqlite {
    On,
    Off,
    Both,
}
#[derive(Clone, Args)]
struct Options {
    /// HTTP dashboard and Ethereum RPC bind address.
    #[arg(long, default_value = "127.0.0.1")]
    rpc_bind: IpAddr,
    #[arg(long)]
    binary: Option<PathBuf>,
    #[arg(long, default_value_os_t = sfc::config::persistence_root().join("stress"))]
    home: PathBuf,
    #[arg(long)]
    output: Option<PathBuf>,
    #[arg(long)]
    fixture: Option<PathBuf>,
    #[arg(long, default_value_t = 65536)]
    transactions: usize,
    #[arg(long, default_value_t = 4096)]
    rpc_batch: usize,
    /// Concurrent ordered batches; 2 overlaps GPU verification with admission.
    #[arg(long, default_value_t = 1)]
    inflight: usize,
    #[arg(long, default_value_t = 10)]
    interval: u64,
    /// Block history window; persistent stress runs default to 5 seconds.
    #[arg(long, value_parser = clap::value_parser!(u64).range(1..))]
    retention_seconds: Option<u64>,
    #[arg(long, default_value_t = 1)]
    nodes: usize,
    #[arg(long, default_value_t = 3)]
    repeat: usize,
    #[arg(long, default_value_t = 0)]
    rounds: usize,
    #[arg(long, value_enum, default_value = "gpu")]
    backend: Backend,
    #[arg(long, value_enum, default_value = "mlx-native")]
    gpu_runtime: GpuRuntime,
    #[arg(long, value_enum, default_value = "tcp")]
    sync_transport: Transport,
    #[arg(long, value_enum, default_value = "tcp")]
    transport: Transport,
    #[arg(long, value_enum, default_value = "on")]
    sqlite: Sqlite,
    /// Run synchronous SQLite indexing in the block path for latency diagnosis.
    #[arg(long)]
    sqlite_direct: bool,
    #[arg(long, default_value_t = 16)]
    sqlite_direct_batch_blocks: usize,
}
struct Lock {
    _file: File,
}
impl Lock {
    fn acquire(path: &Path) -> Result<Option<Self>> {
        let file = OpenOptions::new().create(true).append(true).open(path)?;
        // SAFETY: the file descriptor is live and flock has no memory arguments.
        if unsafe { libc::flock(file.as_raw_fd(), libc::LOCK_EX | libc::LOCK_NB) } != 0 {
            let error = std::io::Error::last_os_error();
            if error.kind() == std::io::ErrorKind::WouldBlock {
                return Ok(None);
            }
            return Err(error.into());
        }
        Ok(Some(Self { _file: file }))
    }
}
fn stop(home: &Path, service: bool) -> Result<()> {
    if !home.exists() {
        println!("Already stopped: {}", home.display());
        return Ok(());
    }
    let lock = home.join(if service {
        "service.lock"
    } else {
        "stress.lock"
    });
    if Lock::acquire(&lock)?.is_some() {
        println!("Already stopped: {}", home.display());
        return Ok(());
    }
    let socket = home.join(if service {
        "control.sock"
    } else {
        "stress.sock"
    });
    let deadline = Instant::now() + Duration::from_secs(30);
    while Instant::now() < deadline {
        if let Ok(mut stream) = UnixStream::connect(&socket) {
            stream.set_write_timeout(Some(Duration::from_secs(1)))?;
            let _ = codec::write_record(&mut stream, &codec::to_vec(&json!("stop"))?);
        }
        if Lock::acquire(&lock)?.is_some() {
            println!("Stopped; persistent data retained: {}", home.display());
            return Ok(());
        }
        thread::sleep(Duration::from_millis(50));
    }
    bail!("shutdown timed out; inspect {}", home.display())
}
struct Control {
    path: PathBuf,
    thread: Option<thread::JoinHandle<()>>,
    closing: Arc<AtomicBool>,
}
impl Control {
    fn start(home: &Path) -> Result<Self> {
        let path = home.join("stress.sock");
        if path.exists() {
            fs::remove_file(&path)?;
        }
        let server = UnixListener::bind(&path)?;
        server.set_nonblocking(true)?;
        let closing = Arc::new(AtomicBool::new(false));
        let closing_thread = closing.clone();
        let thread = thread::spawn(move || {
            while !STOP.load(Ordering::Relaxed) && !closing_thread.load(Ordering::Relaxed) {
                if let Ok((mut stream, _)) = server.accept() {
                    let _ = stream.set_read_timeout(Some(Duration::from_millis(500)));
                    let _ = stream.set_write_timeout(Some(Duration::from_millis(500)));
                    // Only a tiny framed control message is accepted from the local socket.
                    let mut size = [0u8; 8];
                    if stream.read_exact(&mut size).is_ok() {
                        let size = u64::from_le_bytes(size);
                        if size > 0 && size <= 4096 {
                            let mut bytes = vec![0; size as usize];
                            if stream.read_exact(&mut bytes).is_ok()
                                && codec::from_slice::<Value>(&bytes).ok() == Some(json!("stop"))
                            {
                                STOP.store(true, Ordering::Relaxed);
                                let _ = codec::write_record(
                                    &mut stream,
                                    &codec::to_vec(&json!("stopping")).unwrap(),
                                );
                            }
                        }
                    }
                }
                thread::sleep(Duration::from_millis(20));
            }
        });
        Ok(Self {
            path,
            thread: Some(thread),
            closing,
        })
    }
}
impl Drop for Control {
    fn drop(&mut self) {
        self.closing.store(true, Ordering::Relaxed);
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
        let _ = fs::remove_file(&self.path);
    }
}
struct Node {
    child: Child,
    peer: Option<bench_support::Client>,
    config: Config,
    url: String,
    log_path: PathBuf,
    log_start: u64,
}
struct Network {
    transport: Transport,
    nodes: Vec<Node>,
    client: Client,
    _lock: Lock,
}
impl Network {
    fn start(home: &Path, binary: &Path, options: &Options, sqlite: bool) -> Result<Self> {
        fs::create_dir_all(home)?;
        let home = fs::canonicalize(home)?;
        let lock =
            Lock::acquire(&home.join("supervisor.lock"))?.context("network already running")?;
        let mut network = Self {
            transport: options.transport,
            nodes: Vec::new(),
            client: Client::builder()
                .timeout(Duration::from_secs(30))
                .no_proxy()
                .build()?,
            _lock: lock,
        };
        for i in 0..options.nodes {
            let node_home = home.join(format!("node-{i}"));
            let path = node_home.join("config.jsonl");
            if !path.exists() && !path.with_extension("capnp").exists() {
                let output = Command::new(binary)
                    .args(["init", "--home"])
                    .arg(&node_home)
                    .output()?;
                ensure!(
                    output.status.success(),
                    "init failed: {}",
                    String::from_utf8_lossy(&output.stderr)
                );
                let mut config: Config = sfc::config::load(&path)?;
                config.rpc_listen = TcpListener::bind("127.0.0.1:0")?.local_addr()?;
                config.peer_listen = UdpSocket::bind("127.0.0.1:0")?.local_addr()?;
                config.capnp_listen = Some(TcpListener::bind("127.0.0.1:0")?.local_addr()?);
                if i > 0 {
                    fs::copy(&network.nodes[0].config.genesis, &config.genesis)?;
                    config.sync_peer = Some(SyncPeer {
                        transport: options.sync_transport,
                        address: match options.sync_transport {
                            Transport::Http3 => network.nodes[0].config.peer_listen,
                            Transport::Tcp => network.nodes[0]
                                .config
                                .capnp_listen
                                .context("Capnp sync listener")?,
                        },
                        server_name: "localhost".into(),
                        certificate: network.nodes[0].config.tls_cert.clone(),
                    });
                }
                sfc::config::save(&path, &config)?;
            }
            let mut config: Config = sfc::config::load(&path)?;
            for value in [
                &mut config.data_dir,
                &mut config.genesis,
                &mut config.tls_cert,
                &mut config.tls_key,
            ] {
                if value.is_relative() {
                    *value = node_home.join(&*value);
                }
            }
            if let Some(peer) = &mut config.sync_peer {
                if peer.certificate.is_relative() {
                    peer.certificate = node_home.join(&peer.certificate);
                }
            }
            config.rpc_listen.set_ip(options.rpc_bind);
            config.block_interval_ms = options.interval;
            if let Some(seconds) = options.retention_seconds {
                config.retention = sfc::config::Retention::Pruned { seconds };
            }
            config.verification.backend = options.backend;
            config.verification.gpu_runtime = options.gpu_runtime;
            if config.capnp_listen.is_none() {
                config.capnp_listen = Some(TcpListener::bind("127.0.0.1:0")?.local_addr()?);
            }
            sfc::config::save(&path, &config)?;
            let log = OpenOptions::new()
                .create(true)
                .append(true)
                .open(node_home.join("node.log"))?;
            let log_start = log.metadata()?.len();
            let mut command = Command::new(binary);
            command
                .arg("run")
                .arg("--config")
                .arg(&path)
                .arg("--verification-backend")
                .arg(match options.backend {
                    Backend::Cpu => "cpu",
                    Backend::Gpu => "gpu",
                    Backend::Hybrid => "hybrid",
                });
            if !sqlite {
                command.arg("--no-indexer");
            } else if options.sqlite_direct {
                command
                    .arg("--sqlite-direct")
                    .arg("--sqlite-direct-batch-blocks")
                    .arg(options.sqlite_direct_batch_blocks.to_string());
            }
            let child = command
                .stdout(Stdio::from(log.try_clone()?))
                .stderr(Stdio::from(log))
                .spawn()?;
            network.nodes.push(Node {
                child,
                peer: None,
                log_path: node_home.join("node.log"),
                log_start,
                url: format!("http://{}", client_address(config.rpc_listen)),
                config,
            });
        }
        let deadline = Instant::now() + Duration::from_secs(90);
        loop {
            network.alive()?;
            for n in &mut network.nodes {
                if n.peer.is_none() {
                    n.peer = bench_support::Client::connect(SyncPeer {
                        transport: options.transport,
                        address: match options.transport {
                            Transport::Tcp => n.config.capnp_listen.context("TCP listener")?,
                            Transport::Http3 => n.config.peer_listen,
                        },
                        server_name: "localhost".into(),
                        certificate: n.config.tls_cert.clone(),
                    })
                    .ok();
                }
            }
            if network
                .nodes
                .iter()
                .all(|n| query(n, "chain", json!([])).ok() == Some(json!("0x1e61")))
            {
                break;
            }
            ensure!(
                Instant::now() < deadline,
                "node startup timed out; inspect node logs"
            );
            thread::sleep(Duration::from_millis(20));
        }
        for node in &network.nodes {
            let status = query(node, "verification", json!([]))?;
            ensure!(
                status["gpu_runtime"] == serde_json::to_value(options.gpu_runtime)?
                    && status["gpu_worker_pid"].is_null(),
                "Rust benchmark refuses a Python/MLX GPU worker"
            );
            ensure!(
                status["node_pid"].as_u64() == Some(node.child.id().into()),
                "unexpected RPC process"
            );
        }
        Ok(network)
    }
    fn alive(&mut self) -> Result<()> {
        ensure!(!STOP.load(Ordering::Relaxed), "stopped");
        for node in &mut self.nodes {
            if let Some(status) = node.child.try_wait()? {
                let tail = (|| -> std::io::Result<String> {
                    let mut file = File::open(&node.log_path)?;
                    let start = file
                        .metadata()?
                        .len()
                        .saturating_sub(4096)
                        .max(node.log_start);
                    file.seek(SeekFrom::Start(start))?;
                    let mut bytes = Vec::new();
                    file.take(4096).read_to_end(&mut bytes)?;
                    Ok(String::from_utf8_lossy(&bytes).into_owned())
                })()
                .unwrap_or_else(|error| format!("Cannot read log: {error}"));
                bail!(
                    "node exited ({status}); measurement invalid\nLog: {}\n{tail}",
                    node.log_path.display()
                );
            }
        }
        Ok(())
    }
    fn receipt(&mut self, transaction: &str) -> Result<Value> {
        let deadline = Instant::now() + Duration::from_secs(60);
        loop {
            self.alive()?;
            let result = query(
                self.nodes.last().unwrap(),
                "committed",
                json!([transaction]),
            )?;
            if !result.is_null() {
                return Ok(result);
            }
            ensure!(Instant::now() < deadline, "commit timed out");
            thread::sleep(Duration::from_millis(2));
        }
    }
}
impl Drop for Network {
    fn drop(&mut self) {
        for node in &mut self.nodes {
            if node.child.try_wait().ok().flatten().is_none() {
                // SAFETY: this is an owned, unreaped child PID, never a pidfile.
                unsafe {
                    libc::kill(node.child.id() as libc::pid_t, libc::SIGINT);
                }
            }
        }
        let deadline = Instant::now() + Duration::from_secs(10);
        for node in &mut self.nodes {
            while node.child.try_wait().ok().flatten().is_none() && Instant::now() < deadline {
                thread::sleep(Duration::from_millis(10));
            }
            if node.child.try_wait().ok().flatten().is_none() {
                let _ = node.child.kill();
            }
            let _ = node.child.wait();
        }
    }
}
fn query(node: &Node, method: &str, params: Value) -> Result<Value> {
    node.peer
        .as_ref()
        .context("peer unavailable")?
        .query(method, params)
}
fn submit(node: &Node, raw: Vec<bytes::Bytes>) -> Result<Vec<Result<[u8; 32], String>>> {
    node.peer.as_ref().context("peer unavailable")?.submit(raw)
}
fn number(value: &Value) -> Result<u64> {
    Ok(u64::from_str_radix(
        value.as_str().context("quantity")?.trim_start_matches("0x"),
        16,
    )?)
}
fn balance(node: &Node, address: &str) -> Result<U256> {
    let value = query(node, "balance", json!([address, "latest"]))?;
    U256::from_str_radix(
        value.as_str().context("balance")?.trim_start_matches("0x"),
        16,
    )
    .map_err(anyhow::Error::msg)
}
struct Fixture {
    raw: Vec<bytes::Bytes>,
    hashes: Vec<String>,
    owner: String,
    recipient: String,
}
fn address(secret: u8) -> [u8; 20] {
    let mut bytes = [0; 32];
    bytes[31] = secret;
    let key = secp256k1::SecretKey::from_slice(&bytes).unwrap();
    let public =
        secp256k1::PublicKey::from_secret_key(secp256k1::SECP256K1, &key).serialize_uncompressed();
    hash(&public[1..])[12..].try_into().unwrap()
}
fn signed(nonce: u64, to: Option<&[u8]>, value: u64, data: &[u8]) -> Vec<u8> {
    fn fields(
        out: &mut RlpStream,
        nonce: u64,
        to: Option<&[u8]>,
        value: u64,
        data: &[u8],
        typed: bool,
    ) {
        if typed {
            out.append(&7777u64);
        }
        out.append(&nonce).append(&1u64);
        if typed {
            out.append(&1u64);
        }
        out.append(&150_000u64)
            .append(&to.unwrap_or_default())
            .append(&value)
            .append(&data);
        if typed {
            out.begin_list(0);
        }
    }
    let typed = nonce % 2 == 1;
    let mut unsigned = RlpStream::new_list(9);
    fields(&mut unsigned, nonce, to, value, data, typed);
    if !typed {
        unsigned.append(&7777u64).append(&0u8).append(&0u8);
    }
    let mut preimage = if typed { vec![2] } else { Vec::new() };
    preimage.extend_from_slice(&unsigned.out());
    let mut secret = [0; 32];
    secret[31] = 1;
    let (recovery, signature) = secp256k1::SECP256K1
        .sign_ecdsa_recoverable(
            &secp256k1::Message::from_digest(hash(&preimage)),
            &secp256k1::SecretKey::from_slice(&secret).unwrap(),
        )
        .serialize_compact();
    let mut out = RlpStream::new_list(if typed { 12 } else { 9 });
    fields(&mut out, nonce, to, value, data, typed);
    out.append(
        &(if typed {
            recovery.to_i32() as u64
        } else {
            7777 * 2 + 35 + recovery.to_i32() as u64
        }),
    );
    for part in signature.as_chunks::<32>().0 {
        let first = part.iter().position(|b| *b != 0).unwrap_or(32);
        out.append(&&part[first..]);
    }
    let mut raw = if typed { vec![2] } else { Vec::new() };
    raw.extend_from_slice(&out.out());
    raw
}
impl Fixture {
    fn generate(count: usize, start: u64, warmup: bool) -> Result<Self> {
        let owner = address(1);
        let recipient = address(2);
        let mut create = RlpStream::new_list(2);
        create.append(&owner.as_slice()).append(&0u8);
        let contract = &hash(&create.out())[12..];
        let init = hex::decode("600e600c600039600e6000f3602a6000553360005260206000f3")?;
        let warm = if warmup { 2 } else { 0 };
        let records: Result<Vec<_>> = (0..count + warm)
            .into_par_iter()
            .map(|i| {
                ensure!(!STOP.load(Ordering::Relaxed), "stopped while signing");
                let nonce = start.checked_add(i as u64).context("nonce overflow")?;
                let raw = if warmup && i == 0 {
                    signed(nonce, None, 0, &init)
                } else if warmup && i == 1 {
                    signed(nonce, Some(contract), 0, &[])
                } else {
                    signed(nonce, Some(&recipient), (i - warm + 1) as u64, &[])
                };
                let digest = format!("0x{}", hex::encode(hash(&raw)));
                Ok((bytes::Bytes::from(raw), digest))
            })
            .collect();
        let (raw, hashes) = records?.into_iter().unzip();
        Ok(Self {
            raw,
            hashes,
            owner: format!("0x{}", hex::encode(owner)),
            recipient: format!("0x{}", hex::encode(recipient)),
        })
    }
    fn load(path: &Path, count: usize) -> Result<Self> {
        let value: Value = codec::from_slice(&fs::read(path)?)?;
        let strings = |key| -> Result<Vec<String>> {
            value[key]
                .as_array()
                .context("fixture array")?
                .iter()
                .map(|v| Ok(v.as_str().context("fixture string")?.into()))
                .collect()
        };
        let result = Self {
            raw: strings("raw")?
                .into_iter()
                .map(|raw| hex::decode(raw.trim_start_matches("0x")).map(bytes::Bytes::from))
                .collect::<std::result::Result<Vec<_>, _>>()?,
            hashes: strings("hashes")?,
            owner: value["owner"].as_str().context("owner")?.into(),
            recipient: value["recipient"].as_str().context("recipient")?.into(),
        };
        ensure!(
            result.raw.len() == count + 2 && result.hashes.len() == result.raw.len(),
            "fixture length mismatch"
        );
        for (raw, expected) in result.raw.iter().zip(&result.hashes) {
            ensure!(
                format!("0x{}", hex::encode(hash(raw))) == *expected,
                "fixture hash mismatch"
            );
        }
        Ok(result)
    }
}
fn cpu_seconds(system: &mut System, pids: &[Pid]) -> Result<Vec<f64>> {
    system.refresh_processes_specifics(
        ProcessesToUpdate::Some(pids),
        true,
        ProcessRefreshKind::nothing().with_cpu(),
    );
    pids.iter()
        .map(|pid| {
            Ok(system
                .process(*pid)
                .context("measured process exited")?
                .accumulated_cpu_time() as f64
                / 1000.0)
        })
        .collect()
}
/// Prepare immutable transaction bytes in parallel before the measurement.
fn request_body(indices: &[usize], fixture: &Fixture) -> Result<Vec<bytes::Bytes>> {
    Ok(indices.iter().map(|i| fixture.raw[*i].clone()).collect())
}
fn measure(
    network: &mut Network,
    fixture: &Fixture,
    options: &Options,
    warm: usize,
    sqlite: bool,
) -> Result<Value> {
    let nonce = number(&query(
        &network.nodes[0],
        "nonce",
        json!([fixture.owner, "latest"]),
    )?)?;
    let prior_balance = balance(&network.nodes[0], &fixture.recipient)?;
    for i in 0..warm {
        let result = submit(&network.nodes[0], request_body(&[i], fixture)?)?;
        ensure!(
            result[0].as_ref().map(hex::encode).ok()
                == Some(fixture.hashes[i].trim_start_matches("0x").to_owned()),
            "warm-up rejected"
        );
    }
    if warm > 0 {
        network.receipt(&fixture.hashes[warm - 1])?;
    }
    let preparation_started = Instant::now();
    let ranges: Vec<_> = (warm..fixture.raw.len())
        .step_by(options.rpc_batch)
        .map(|offset| {
            (offset..(offset + options.rpc_batch).min(fixture.raw.len())).collect::<Vec<_>>()
        })
        .collect();
    let prepared: Result<Vec<_>> = ranges
        .into_par_iter()
        .map(|indices| {
            let body = request_body(&indices, fixture)?;
            Ok((indices, body))
        })
        .collect();
    let prepared = prepared?;
    let preparation_seconds = preparation_started.elapsed().as_secs_f64();
    let statuses = |network: &Network| -> Result<Vec<Value>> {
        network
            .nodes
            .iter()
            .map(|n| query(n, "verification", json!([])))
            .collect()
    };
    let before_status = statuses(network)?;
    let mut pids: Vec<_> = network
        .nodes
        .iter()
        .map(|n| Pid::from_u32(n.child.id()))
        .collect();
    pids.push(Pid::from_u32(std::process::id()));
    let mut system = System::new();
    let before_cpu = cpu_seconds(&mut system, &pids)?;
    let started = Instant::now();
    let mut attempts = 0usize;
    for group in prepared.chunks(options.inflight) {
        let mut remaining: Vec<_> = group
            .iter()
            .flat_map(|(indices, _)| indices.iter().copied())
            .collect();
        let mut bodies: Vec<_> = group.iter().map(|(_, body)| body.clone()).collect();
        let deadline = Instant::now() + Duration::from_secs(60);
        while !remaining.is_empty() {
            network.alive()?;
            ensure!(
                Instant::now() < deadline,
                "admission backpressure timed out"
            );
            attempts += remaining.len();
            let replies = network.nodes[0]
                .peer
                .as_ref()
                .context("peer unavailable")?
                .submit_batches(bodies.clone())?;
            ensure!(
                replies.len() == remaining.len(),
                "RPC batch length mismatch"
            );
            let mut retry = Vec::new();
            let mut backpressured = false;
            for (i, response) in remaining.into_iter().zip(replies) {
                match response {
                    Err(message) if message == "mempool is full" => {
                        backpressured = true;
                        retry.push(i);
                    }
                    // A later batch can observe a nonce gap after an earlier full
                    // mempool rejected the prefix. Retry only that known suffix.
                    Err(message) if backpressured && message.to_lowercase().contains("nonce") => {
                        retry.push(i)
                    }
                    Ok(hash) => ensure!(
                        format!("0x{}", hex::encode(hash)) == fixture.hashes[i],
                        "transaction hash mismatch"
                    ),
                    Err(message) => bail!("transaction rejected: {message}"),
                }
            }
            remaining = retry;
            if !remaining.is_empty() {
                bodies = remaining
                    .chunks(options.rpc_batch)
                    .map(|indices| request_body(indices, fixture))
                    .collect::<Result<_>>()?;
                thread::sleep(Duration::from_millis(2));
            }
        }
    }
    let admission_seconds = started.elapsed().as_secs_f64();
    let last = network.receipt(fixture.hashes.last().unwrap())?;
    let seconds = started.elapsed().as_secs_f64();
    let after_cpu = cpu_seconds(&mut system, &pids)?;
    let after_status = statuses(network)?;
    let count = fixture.raw.len() - warm;
    let mut usage = Vec::new();
    for (i, (before, after)) in before_status.iter().zip(&after_status).enumerate() {
        ensure!(
            after["gpu_worker_pid"].is_null()
                && after["gpu_runtime"] == serde_json::to_value(options.gpu_runtime)?,
            "unexpected Python GPU host"
        );
        let cpu = after["cpu_records"].as_u64().context("CPU counter")?
            - before["cpu_records"].as_u64().unwrap();
        let gpu = after["gpu_records"].as_u64().context("GPU counter")?
            - before["gpu_records"].as_u64().unwrap();
        ensure!(
            cpu + gpu
                == if i == 0 {
                    attempts as u64
                } else {
                    count as u64
                },
            "verification count mismatch"
        );
        match options.backend {
            Backend::Cpu => ensure!(gpu == 0, "CPU routing mismatch"),
            Backend::Gpu => ensure!(cpu == 0, "GPU routing mismatch"),
            Backend::Hybrid => {
                ensure!(gpu > 0, "HYBRID routing mismatch");
                if i == 0 && options.rpc_batch > 1 && count > 1 {
                    ensure!(cpu > 0, "HYBRID CPU routing mismatch");
                }
            }
        }
        let elapsed = after_cpu[i] - before_cpu[i];
        ensure!(elapsed >= 0.0, "CPU clock moved backwards");
        usage.push(json!({"role":if i==0 {"sequencer"}else{"follower"},
            "rust_cpu_seconds":elapsed,"gpu_host_cpu_seconds":0.0,"total_cpu_seconds":elapsed,
            "cpu_percent_one_core_100":100.0*elapsed/seconds,"cpu_records":cpu,"gpu_records":gpu}));
    }
    let mut blocks = Vec::new();
    for node in &network.nodes {
        ensure!(
            balance(node, &fixture.recipient)?
                == prior_balance + U256::from(count as u64 * (count as u64 + 1) / 2),
            "balance mismatch"
        );
        ensure!(
            number(&query(node, "nonce", json!([fixture.owner, "latest"]))?)?
                == nonce + fixture.raw.len() as u64,
            "nonce mismatch"
        );
        blocks.push(query(node, "block", json!([last["blockNumber"], false]))?);
    }
    ensure!(
        blocks.iter().all(|b| *b == blocks[0]),
        "follower block mismatch"
    );
    let cpu: f64 = usage
        .iter()
        .map(|v| v["total_cpu_seconds"].as_f64().unwrap())
        .sum();
    Ok(
        json!({"benchmark":"binary_admission_durable_commit","transport":options.transport,"benchmark_driver":"rust",
        "transactions":count,"backend":options.backend,"gpu_runtime":options.gpu_runtime,"python_processes":0,
        "request_preparation_seconds":preparation_seconds,
        "request_preparation":"Rayon raw bytes preparation before timing; ordered typed Capnp batch RPC",
        "load_generator_cpu_seconds":after_cpu.last().unwrap()-before_cpu.last().unwrap(),
        "nodes":network.nodes.len(),"sync_transport":options.sync_transport,"cpu_usage":usage,"total_cpu_seconds":cpu,
        "total_cpu_percent_one_core_100":100.0*cpu/seconds,"cpu_ms_per_committed_transaction":1000.0*cpu/count as f64,
        "cpu_method":"sysinfo cumulative process CPU milliseconds, all Rust node threads; excludes Rust load generator",
        "rpc_batch":options.rpc_batch,"inflight":options.inflight,"block_interval_ms":options.interval,
        "retention":network.nodes[0].config.retention,"seconds":seconds,
        "admission_seconds":admission_seconds,"admission_attempts":attempts,"tps":count as f64/seconds,
        "signature_verification_included":true,"network_included":true,"follower_replay_included":network.nodes.len()>1,
        "sqlite_indexer":sqlite,"sqlite_write_mode":if !sqlite { "off" } else if options.sqlite_direct { "direct" } else { "background" },"rayon_threads":rayon::current_num_threads(),
        "timestamp":SystemTime::now().duration_since(UNIX_EPOCH)?.as_secs_f64()}),
    )
}
fn wait_index(network: &mut Network, expected: usize) -> Result<f64> {
    let started = Instant::now();
    loop {
        network.alive()?;
        let bytes = network
            .client
            .get(format!(
                "{}/dashboard/index?kind=blocks&limit=1",
                network.nodes[0].url
            ))
            .send()?
            .error_for_status()?
            .bytes()?;
        let value: Value = codec::from_slice(&bytes)?;
        if value["indexedTransactions"].as_u64() == Some(expected as u64) {
            return Ok(started.elapsed().as_secs_f64());
        }
        ensure!(
            started.elapsed() < Duration::from_secs(30),
            "index catch-up timed out"
        );
        thread::sleep(Duration::from_millis(25));
    }
}
fn report(path: &Path, value: &Value) -> Result<()> {
    if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
        fs::create_dir_all(parent)?;
    }
    let mut file = OpenOptions::new().create(true).append(true).open(path)?;
    codec::write_record(&mut file, &codec::to_vec(value)?)?;
    file.flush()?;
    println!(
        "{} committed TPS | CPU {:.1}% | {} transfers | Rust/{} | {} | SQLite {}",
        value["tps"].as_f64().unwrap().round(),
        value["total_cpu_percent_one_core_100"].as_f64().unwrap(),
        value["transactions"],
        value["gpu_runtime"].as_str().unwrap(),
        value["transport"].as_str().unwrap(),
        if value["sqlite_indexer"] == true {
            "ON"
        } else {
            "OFF"
        }
    );
    Ok(())
}
fn check_stress_space(path: &Path, transactions: usize) -> Result<()> {
    use std::os::unix::ffi::OsStrExt;
    let name = std::ffi::CString::new(path.as_os_str().as_bytes())?;
    let mut stats = std::mem::MaybeUninit::<libc::statvfs>::uninit();
    // SAFETY: name is NUL terminated and stats points to writable statvfs storage.
    if unsafe { libc::statvfs(name.as_ptr(), stats.as_mut_ptr()) } != 0 {
        return Err(std::io::Error::last_os_error()).context("checking stress disk space");
    }
    // SAFETY: successful statvfs initialized the structure.
    let stats = unsafe { stats.assume_init() };
    // statvfs field widths vary across Unix targets.
    #[allow(clippy::unnecessary_cast)]
    let available = (stats.f_bavail as u64).saturating_mul(stats.f_frsize as u64);
    // Reserve space for RocksDB compaction plus conservative per-round history/index growth.
    // This is an early-stop estimate, not a guarantee against other writers filling the disk.
    let required = 2 * 1024_u64.pow(3) + (transactions as u64).saturating_mul(4096);
    ensure!(
        available >= required,
        "insufficient disk space for stress test at {}: {:.2} GiB available, {:.2} GiB required. \
         Free space or select STRESS_DIR on a larger volume. Existing chain data is preserved.",
        path.display(),
        available as f64 / 1024_f64.powi(3),
        required as f64 / 1024_f64.powi(3)
    );
    Ok(())
}

fn client_address(mut address: SocketAddr) -> SocketAddr {
    if address.ip().is_unspecified() {
        address.set_ip(if address.is_ipv4() {
            IpAddr::V4(Ipv4Addr::LOCALHOST)
        } else {
            IpAddr::V6(std::net::Ipv6Addr::LOCALHOST)
        });
    }
    address
}

/// Enumerate active IPv4 interfaces without sending packets or depending on CLI tools.
fn interface_addresses() -> Vec<Ipv4Addr> {
    let mut head = std::ptr::null_mut();
    let mut addresses = Vec::new();
    // SAFETY: getifaddrs initializes head; each address is checked before casting.
    // The list remains live during traversal and is freed exactly once.
    unsafe {
        if libc::getifaddrs(&mut head) != 0 {
            return addresses;
        }
        let mut current = head;
        while !current.is_null() {
            let entry = &*current;
            if !entry.ifa_addr.is_null()
                && entry.ifa_flags & libc::IFF_UP as u32 != 0
                && (*entry.ifa_addr).sa_family as i32 == libc::AF_INET
            {
                let address = &*(entry.ifa_addr as *const libc::sockaddr_in);
                let ip = Ipv4Addr::from(address.sin_addr.s_addr.to_ne_bytes());
                if !ip.is_loopback() && !ip.is_unspecified() {
                    addresses.push(ip);
                }
            }
            current = entry.ifa_next;
        }
        libc::freeifaddrs(head);
    }
    addresses.sort_unstable();
    addresses.dedup();
    addresses
}

fn print_info(
    network: &Network,
    home: &Path,
    output: &Path,
    binary: &Path,
    sqlite: bool,
) -> Result<()> {
    let node = &network.nodes[0];
    let data = &node.config.data_dir;
    let mut info = json!({
        "HTTP bind (dashboard + Ethereum RPC)": node.config.rpc_listen.to_string(),
        "Load transport":format!("{:?} / typed Capnp batch API",network.transport),
        "Dashboard":format!("{}/dashboard",node.url),"Ethereum RPC":node.url,
        "Sync endpoint (HTTP/3, UDP; typed RPC)":format!("https://{}",node.config.peer_listen),
        "Sync endpoint (Capnp RPC, TCP; default)":format!("capnp://{}",node.config.capnp_listen.context("Capnp sync listener")?),
        "Sync TLS certificate":node.config.tls_cert,"Node home":home.join("node-0"),
        "Config":home.join("node-0/config.jsonl"),"Genesis":node.config.genesis,"Data":data,
        "Main RocksDB":data.join("rocksdb"),"RocksDB WAL folder":data.join("rocksdb"),
        "RocksDB diagnostics":data.join("rocksdb/LOG"),"History":data.join("history"),
        "SQLite indexing":if sqlite {"on"}else{"off"},"SQLite index (WAL)":data.join("index.sqlite"),
        "Block retention":node.config.retention,
        "SQLite WAL":data.join("index.sqlite-wal"),"SQLite shared memory":data.join("index.sqlite-shm"),
        "Structured node log":data.join("logs/node.capnp"),"Indexer error log":data.join("index-error.log"),
        "Node log":home.join("node-0/node.log"),"Stress log":home.join("stress.log"),
        "TPS/CPU results":output,"Control socket":home.join("stress.sock"),"Release binary":binary,
        "Node PID":node.child.id(),"GPU runtime":format!("Rust + {:?}; no Python",node.config.verification.gpu_runtime),
        "Stop command":format!("make stop STRESS_DIR={}",home.display())
    });
    if node.config.rpc_listen.ip().is_unspecified() && node.config.rpc_listen.is_ipv4() {
        for ip in interface_addresses() {
            info[format!("Dashboard (network {ip})")] = json!(format!(
                "http://{ip}:{}/dashboard",
                node.config.rpc_listen.port()
            ));
        }
        if let Ok(ip) = std::env::var("SFC_TAILSCALE_IP") {
            if let Ok(ip) = ip.parse::<Ipv4Addr>() {
                info["Dashboard (Tailscale / iPad)"] = json!(format!(
                    "http://{ip}:{}/dashboard",
                    node.config.rpc_listen.port()
                ));
            }
        }
    }
    let mut log = OpenOptions::new()
        .create(true)
        .append(true)
        .open(home.join("stress.log"))?;
    println!("SFC Rust stress test · persistent chain · CPU 100% = one core");
    for (key, value) in info.as_object().unwrap() {
        let value = value
            .as_str()
            .map(str::to_owned)
            .unwrap_or_else(|| value.to_string());
        println!("  {key}: {value}");
        writeln!(log, "{key}: {value}")?;
    }
    fs::write(data.join("stress-info.capnp"), codec::to_vec(&info)?)?;
    Ok(())
}
fn execute(mut options: Options, continuous: bool) -> Result<()> {
    if continuous {
        options.retention_seconds.get_or_insert(5);
    }
    ensure!(
        (1..=1048576).contains(&options.transactions) && (1..=4096).contains(&options.rpc_batch),
        "invalid batch size"
    );
    ensure!(
        options.interval > 0
            && (1..=2).contains(&options.nodes)
            && options.repeat > 0
            && (1..=2).contains(&options.inflight),
        "invalid interval/nodes/repeat"
    );
    let binary = options
        .binary
        .clone()
        .unwrap_or(std::env::current_exe()?.with_file_name("sfc"));
    let binary = fs::canonicalize(binary)?;
    if continuous {
        ensure!(
            options.nodes == 1 && options.sqlite != Sqlite::Both && options.fixture.is_none(),
            "persistent run requires one SQLite mode, one node, and generated nonces"
        );
        fs::create_dir_all(&options.home)?;
        let home = fs::canonicalize(&options.home)?;
        let Some(_lock) = Lock::acquire(&home.join("stress.lock"))? else {
            bail!("already running: {}; use make stop", home.display());
        };
        check_stress_space(&home, options.transactions)?;
        let _control = Control::start(&home)?;
        let sqlite = options.sqlite == Sqlite::On;
        let output = options.output.clone().unwrap_or(home.join("results.capnp"));
        let mut network = Network::start(&home, &binary, &options, sqlite)?;
        print_info(&network, &home, &output, &binary, sqlite)?;
        // One separately committed warm-up keeps initialization outside timing.
        let owner = format!("0x{}", hex::encode(address(1)));
        let nonce = number(&query(
            &network.nodes[0],
            "nonce",
            json!([owner, "latest"]),
        )?)?;
        let warm = Fixture::generate(1, nonce, false)?;
        let accepted = submit(&network.nodes[0], request_body(&[0], &warm)?)?;
        ensure!(accepted[0].is_ok(), "warm-up rejected");
        network.receipt(&warm.hashes[0])?;
        println!(
            "GPU ready; in-process Rust GPU runtime. Signing happens outside measured rounds."
        );
        let mut trial = 0usize;
        while !STOP.load(Ordering::Relaxed) && (options.rounds == 0 || trial < options.rounds) {
            network.alive()?;
            check_stress_space(&network.nodes[0].config.data_dir, options.transactions)?;
            let nonce = number(&query(
                &network.nodes[0],
                "nonce",
                json!([owner, "latest"]),
            )?)?;
            println!(
                "Preparing round {}: nonce {nonce}, {} signed transfers",
                trial + 1,
                options.transactions
            );
            let fixture = Fixture::generate(options.transactions, nonce, false)?;
            let mut result = measure(&mut network, &fixture, &options, 0, sqlite)?;
            trial += 1;
            result["trial"] = trial.into();
            report(&output, &result)?;
            let mut log = OpenOptions::new()
                .create(true)
                .append(true)
                .open(home.join("stress.log"))?;
            writeln!(
                log,
                "Round {trial}: {:.0} committed TPS | CPU {:.1}%",
                result["tps"].as_f64().unwrap(),
                result["total_cpu_percent_one_core_100"].as_f64().unwrap()
            )?;
        }
    } else {
        let fixture = if let Some(path) = &options.fixture {
            Fixture::load(path, options.transactions)?
        } else {
            Fixture::generate(options.transactions, 0, true)?
        };
        let output = options
            .output
            .clone()
            .unwrap_or(PathBuf::from("target/rust-benchmark.capnp"));
        for trial in 1..=options.repeat {
            let mut modes = match options.sqlite {
                Sqlite::Both => vec![true, false],
                Sqlite::On => vec![true],
                Sqlite::Off => vec![false],
            };
            if trial % 2 == 0 {
                modes.reverse();
            }
            for sqlite in modes {
                let home = tempfile::tempdir()?;
                let mut network = Network::start(home.path(), &binary, &options, sqlite)?;
                let mut result = measure(&mut network, &fixture, &options, 2, sqlite)?;
                if !sqlite {
                    ensure!(
                        network.nodes.iter().all(|n| !n
                            .config
                            .data_dir
                            .join("index.sqlite")
                            .exists()),
                        "OFF created SQLite database"
                    );
                }
                result["trial"] = trial.into();
                result["binary_hash"] = hex::encode(hash(&fs::read(&binary)?)).into();
                if sqlite {
                    result["index_catchup_seconds"] =
                        wait_index(&mut network, fixture.raw.len())?.into();
                }
                report(&output, &result)?;
            }
        }
    }
    Ok(())
}
fn main() {
    // SAFETY: handler only stores an atomic flag; no allocation or non-signal-safe work.
    unsafe {
        libc::signal(libc::SIGINT, interrupt as *const () as libc::sighandler_t);
        libc::signal(libc::SIGTERM, interrupt as *const () as libc::sighandler_t);
    }
    let result = match Cli::parse().command {
        Action::Run(options) => execute(options, true),
        Action::Bench(options) => execute(options, false),
        Action::Stop { home, service_home } => stop(&home, false).and_then(|()| {
            if let Some(home) = service_home {
                stop(&home, true)
            } else {
                Ok(())
            }
        }),
    };
    if let Err(error) = result {
        if !STOP.load(Ordering::Relaxed) {
            eprintln!("{error:#}");
            std::process::exit(1);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wildcard_http_binding_uses_loopback_for_benchmark_clients() {
        for (bind, expected) in [
            ("0.0.0.0:8545", "127.0.0.1:8545"),
            ("[::]:8545", "[::1]:8545"),
            ("192.168.1.2:8545", "192.168.1.2:8545"),
        ] {
            assert_eq!(client_address(bind.parse().unwrap()).to_string(), expected);
        }
        let cli = Cli::try_parse_from(["sfc-bench", "run"]).unwrap();
        let Action::Run(options) = cli.command else {
            panic!("wrong command")
        };
        assert!(options.rpc_bind.is_loopback());
    }

    #[test]
    fn rayon_binary_preparation_preserves_order() {
        let fixture = Fixture::generate(4096, 0, false).unwrap();
        for count in [0, 1, 255, 256, 257, 4096] {
            let indices: Vec<_> = (0..count).rev().collect();
            let body = request_body(&indices, &fixture).unwrap();
            for (index, raw) in indices.iter().zip(body) {
                assert_eq!(
                    format!("0x{}", hex::encode(hash(&raw))),
                    fixture.hashes[*index]
                );
            }
        }
    }
    #[test]
    fn rust_fixture_signs_ordered_legacy_and_typed_transactions() {
        let fixture = Fixture::generate(33, 0, true).unwrap();
        assert_eq!(fixture.owner, "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf");
        assert_eq!(
            fixture.recipient,
            "0x2b5ad5c4795c026514f8317c7a215e218dccd6cf"
        );
        for (i, raw) in fixture.raw.iter().enumerate() {
            let transaction = sfc::ethereum::Transaction::decode(raw, 7777).unwrap();
            assert_eq!(transaction.env.nonce, Some(i as u64));
            assert_eq!(raw[0] == 2, i % 2 == 1);
            assert_eq!(
                transaction.env.value,
                U256::from(if i < 2 { 0 } else { i - 1 })
            );
            assert_eq!(
                format!("0x{}", hex::encode(transaction.hash)),
                fixture.hashes[i]
            );
            assert_eq!(format!("{:#x}", transaction.env.caller), fixture.owner);
        }
        let resumed = Fixture::generate(33, 100, false).unwrap();
        for (i, raw) in resumed.raw.iter().enumerate() {
            let transaction = sfc::ethereum::Transaction::decode(raw, 7777).unwrap();
            assert_eq!(transaction.env.nonce, Some(100 + i as u64));
            assert_eq!(transaction.env.value, U256::from(i + 1));
        }
    }
    #[test]
    fn measured_cpu_clock_is_monotonic() {
        let mut system = System::new();
        let pids = [Pid::from_u32(std::process::id())];
        let before = cpu_seconds(&mut system, &pids).unwrap()[0];
        for i in 0u64..100000 {
            std::hint::black_box(hash(&i.to_le_bytes()));
        }
        let after = cpu_seconds(&mut system, &pids).unwrap()[0];
        assert!(after > before, "CPU clock must account for work");
    }
}
