use crate::{
    chain_capnp::{block, peer},
    node::Node,
};
use anyhow::Result;
use capnp::capability::Promise;
use capnp_rpc::{rpc_twoparty_capnp, twoparty, RpcSystem};
use std::sync::{Arc, Mutex};
use tokio::sync::Semaphore;
use tokio_util::compat::TokioAsyncReadCompatExt;

type DecodedBatch = Vec<Result<crate::ethereum::Transaction>>;
type BatchAdmission = Vec<Result<crate::types::Hash>>;
struct AdmissionJob {
    decoded: tokio::task::JoinHandle<Result<DecodedBatch>>,
    reply: tokio::sync::oneshot::Sender<Result<BatchAdmission>>,
}
struct PeerServer {
    node: Arc<Mutex<Node>>,
    chain: u64,
    store: Arc<crate::storage::Store>,
    block_reads: Arc<Semaphore>,
    accepts_transactions: bool,
    verifier: Arc<crate::verification::Verifier>,
    admission: tokio::sync::mpsc::Sender<AdmissionJob>,
}
impl PeerServer {
    fn new(node: Arc<Mutex<Node>>) -> Result<Self> {
        let (chain, verifier, accepts_transactions, store) = {
            let node = node.lock().map_err(cap_error)?;
            (
                node.genesis.chain_id,
                node.verifier.clone(),
                node.config.sync_peer.is_none(),
                node.store.clone(),
            )
        };
        let (admission, mut queue) = tokio::sync::mpsc::channel::<AdmissionJob>(2);
        let state = node.clone();
        tokio::spawn(async move {
            // Dequeue in RPC arrival order, regardless of GPU completion order.
            // Jobs retain their verification task even if a caller drops its reply.
            while let Some(job) = queue.recv().await {
                let decoded = job
                    .decoded
                    .await
                    .map_err(anyhow::Error::from)
                    .and_then(|r| r);
                let result = match decoded {
                    Ok(decoded) => {
                        let node = state.clone();
                        tokio::task::spawn_blocking(move || {
                            node.lock()
                                .map_err(cap_error)?
                                .submit_decoded_batch(decoded)
                        })
                        .await
                        .map_err(anyhow::Error::from)
                        .and_then(|r| r)
                    }
                    Err(error) => Err(error),
                };
                let _ = job.reply.send(result);
            }
        });
        Ok(Self {
            node,
            store,
            block_reads: Arc::new(Semaphore::new(2)),
            chain,
            accepts_transactions,
            verifier,
            admission,
        })
    }
}
// Bound active disk jobs and retained responses per connection. Cancellation
// cannot release capacity while a blocking read is still running: the job owns
// the permit and returns it alongside the bytes until response construction ends.
async fn read_blocks(
    store: Arc<crate::storage::Store>,
    permits: Arc<Semaphore>,
    start: u64,
    limit: u32,
) -> Result<(tokio::sync::OwnedSemaphorePermit, Vec<crate::types::Block>), capnp::Error> {
    let permit = permits.acquire_owned().await.map_err(cap_error)?;
    tokio::task::spawn_blocking(move || {
        store
            .block_batch(start, limit)
            .map(|blocks| (permit, blocks))
    })
    .await
    .map_err(cap_error)?
    .map_err(cap_error)
}
fn cap_error(error: impl std::fmt::Display) -> capnp::Error {
    capnp::Error::failed(error.to_string())
}
fn fill_block(mut builder: block::Builder<'_>, value: &crate::types::Block) -> Result<()> {
    let message = value.read()?;
    let source = message.get_root::<crate::storage_capnp::block::Reader>()?;
    builder.set_chain_id(source.get_chain_id());
    builder.set_height(source.get_height());
    builder.set_timestamp(source.get_timestamp());
    builder.set_parent_hash(source.get_parent_hash()?);
    builder.set_state_root(source.get_state_root()?);
    let source = source.get_transactions()?;
    let mut transactions = builder.init_transactions(source.len());
    for (index, raw) in source.iter().enumerate() {
        transactions.set(index as u32, raw?);
    }

    Ok(())
}
impl peer::Server for PeerServer {
    fn submit_transactions(
        &mut self,
        params: peer::SubmitTransactionsParams,
        mut results: peer::SubmitTransactionsResults,
    ) -> Promise<(), capnp::Error> {
        if !self.accepts_transactions {
            return Promise::err(cap_error("follower is read-only; submit to the sequencer"));
        }
        // Reserve queue capacity synchronously in call-arrival order. A rejected
        // request starts no GPU task; at most two queued jobs plus one active job.
        let prepared = (|| -> Result<_> {
            let permit = self
                .admission
                .clone()
                .try_reserve_owned()
                .map_err(|_| anyhow::anyhow!("submission queue is full"))?;
            let input = params.get()?.get_transactions()?;
            anyhow::ensure!(
                !input.is_empty() && input.len() as usize <= crate::types::MAX_BLOCK_TRANSACTIONS,
                "batch must contain 1..4096 transactions"
            );
            let mut size = 0usize;
            let mut borrowed = Vec::with_capacity(input.len() as usize);
            for tx in input.iter() {
                let tx = tx?;
                size = size
                    .checked_add(tx.len())
                    .ok_or_else(|| cap_error("size overflow"))?;
                anyhow::ensure!(
                    tx.len() <= crate::types::MAX_TX_BYTES && size <= crate::types::MAX_BLOCK_BYTES,
                    "transaction batch exceeds size limit"
                );
                borrowed.push(tx);
            }
            // Capnp RPC params are local-task owned and cannot cross into the
            // blocking verifier. Copy payloads once into one slab, then share
            // slices through verification, the pending queue and execution.
            let mut slab = bytes::BytesMut::with_capacity(size);
            for tx in &borrowed {
                slab.extend_from_slice(tx);
            }
            let slab = slab.freeze();
            let mut offset = 0;
            let raw: Vec<_> = borrowed
                .iter()
                .map(|tx| {
                    let start = offset;
                    offset += tx.len();
                    slab.slice(start..offset)
                })
                .collect();
            let verifier = self.verifier.clone();
            let chain = self.chain;
            let decoded = tokio::task::spawn_blocking(move || verifier.decode_shared(&raw, chain));
            let (reply, receiver) = tokio::sync::oneshot::channel();
            permit.send(AdmissionJob { decoded, reply });
            Ok(receiver)
        })();
        let receiver = match prepared {
            Ok(receiver) => receiver,
            Err(error) => return Promise::err(cap_error(error)),
        };
        Promise::from_future(async move {
            let admitted = receiver.await.map_err(cap_error)?.map_err(cap_error)?;
            let mut output = results.get().init_results(admitted.len() as u32);
            for (i, result) in admitted.into_iter().enumerate() {
                let mut item = output.reborrow().get(i as u32);
                match result {
                    Ok(hash) => item.set_hash(&hash),
                    Err(error) => item.set_error(error.to_string().as_str()),
                }
            }
            Ok(())
        })
    }
    fn account(
        &mut self,
        params: peer::AccountParams,
        mut results: peer::AccountResults,
    ) -> Promise<(), capnp::Error> {
        let result = (|| -> Result<()> {
            let params = params.get()?;
            let address = params.get_address()?;
            anyhow::ensure!(address.len() == 20, "address must be 20 bytes");
            let node = self.node.lock().map_err(cap_error)?;
            let world = node.world()?;
            let account = world.accounts.get(&format!("0x{}", hex::encode(address)));
            let balance = account
                .map(|a| a.balance.parse::<revm::primitives::U256>())
                .transpose()?
                .unwrap_or_default();
            results
                .get()
                .set_nonce(account.map(|a| a.nonce).unwrap_or_default());
            results.get().set_balance(&balance.to_be_bytes::<32>());
            Ok(())
        })()
        .map_err(cap_error);
        Promise::from_future(async move { result })
    }
    fn committed_transaction(
        &mut self,
        params: peer::CommittedTransactionParams,
        mut results: peer::CommittedTransactionResults,
    ) -> Promise<(), capnp::Error> {
        let result = (|| -> Result<()> {
            let params = params.get()?;
            let hash = params.get_hash()?;
            anyhow::ensure!(hash.len() == 32, "hash must be 32 bytes");
            let node = self.node.lock().map_err(cap_error)?;
            if let Some(block) = node.store.receipt_block(hash)? {
                let message = block.read()?;
                let root = message.get_root::<crate::storage_capnp::block::Reader>()?;
                for receipt in root.get_receipts()?.iter() {
                    if receipt.get_transaction_hash()? == hash {
                        let mut out = results.get();
                        out.set_found(true);
                        out.set_height(block.height());
                        out.set_block_hash(&block.hash());
                        out.set_success(receipt.get_success());
                        break;
                    }
                }
            }
            Ok(())
        })()
        .map_err(cap_error);
        Promise::from_future(async move { result })
    }
    fn verification(
        &mut self,
        _params: peer::VerificationParams,
        mut results: peer::VerificationResults,
    ) -> Promise<(), capnp::Error> {
        let verifier = match self.node.lock() {
            Ok(node) => node.verifier.clone(),
            Err(e) => return Promise::err(cap_error(e)),
        };
        Promise::from_future(async move {
            let status = tokio::task::spawn_blocking(move || verifier.status())
                .await
                .map_err(cap_error)?
                .map_err(cap_error)?;
            let mut out = results.get();
            out.set_node_pid(std::process::id());
            out.set_runtime(status["gpu_runtime"].as_str().unwrap_or_default());
            out.set_cpu_records(status["cpu_records"].as_u64().unwrap_or_default());
            out.set_gpu_records(status["gpu_records"].as_u64().unwrap_or_default());
            out.set_external_worker(!status["gpu_worker_pid"].is_null());
            Ok(())
        })
    }
    fn status(
        &mut self,
        _params: peer::StatusParams,
        mut results: peer::StatusResults,
    ) -> Promise<(), capnp::Error> {
        let node = self.node.clone();
        Promise::from_future(async move {
            let node = node.lock().map_err(cap_error)?;
            let head = node.head();
            let mut out = results.get().init_status();
            out.set_protocol_version(crate::codec::PROTOCOL_VERSION);
            out.set_chain_id(head.chain_id());
            out.set_height(head.height());
            out.set_block_hash(&node.store.head_hash().map_err(cap_error)?);
            out.set_earliest_height(node.store.earliest_height().map_err(cap_error)?);
            Ok(())
        })
    }
    fn submit_transaction(
        &mut self,
        params: peer::SubmitTransactionParams,
        mut results: peer::SubmitTransactionResults,
    ) -> Promise<(), capnp::Error> {
        let prepared = (|| -> Result<_> {
            anyhow::ensure!(
                self.accepts_transactions,
                "follower is read-only; submit to the sequencer"
            );
            let permit = self
                .admission
                .clone()
                .try_reserve_owned()
                .map_err(|_| anyhow::anyhow!("submission queue is full"))?;
            let raw = params.get()?.get_raw()?;
            anyhow::ensure!(
                raw.len() <= crate::types::MAX_TX_BYTES,
                "transaction too large"
            );
            let raw = vec![Bytes::copy_from_slice(raw)];
            let verifier = self.verifier.clone();
            let chain = self.chain;
            let decoded = tokio::task::spawn_blocking(move || verifier.decode_shared(&raw, chain));
            let (reply, receiver) = tokio::sync::oneshot::channel();
            permit.send(AdmissionJob { decoded, reply });
            Ok(receiver)
        })();
        let receiver = match prepared {
            Ok(receiver) => receiver,
            Err(error) => return Promise::err(cap_error(error)),
        };
        Promise::from_future(async move {
            let mut batch = receiver.await.map_err(cap_error)?.map_err(cap_error)?;
            let hash = batch
                .pop()
                .ok_or_else(|| cap_error("missing submission result"))?
                .map_err(cap_error)?;
            results.get().set_hash(&hash);
            Ok(())
        })
    }
    fn get_block(
        &mut self,
        params: peer::GetBlockParams,
        mut results: peer::GetBlockResults,
    ) -> Promise<(), capnp::Error> {
        let height = match params.get() {
            Ok(params) => params.get_height(),
            Err(error) => return Promise::err(error),
        };
        let store = self.store.clone();
        let permits = self.block_reads.clone();
        Promise::from_future(async move {
            let (_permit, blocks) = read_blocks(store, permits, height, 1).await?;
            results.get().set_found(!blocks.is_empty());
            if let Some(block) = blocks.first() {
                fill_block(results.get().init_block(), block).map_err(cap_error)?;
            }
            Ok(())
        })
    }
    fn get_blocks(
        &mut self,
        params: peer::GetBlocksParams,
        mut results: peer::GetBlocksResults,
    ) -> Promise<(), capnp::Error> {
        let (start, limit) = match params.get() {
            Ok(params) => (params.get_start(), params.get_limit()),
            Err(error) => return Promise::err(error),
        };
        let store = self.store.clone();
        let permits = self.block_reads.clone();
        Promise::from_future(async move {
            let (_permit, blocks) = read_blocks(store, permits, start, limit).await?;
            let mut output = results.get().init_blocks(blocks.len() as u32);
            for (index, block) in blocks.iter().enumerate() {
                fill_block(output.reborrow().get(index as u32), block).map_err(cap_error)?;
            }
            Ok(())
        })
    }
    fn get_encoded_blocks(
        &mut self,
        params: peer::GetEncodedBlocksParams,
        mut results: peer::GetEncodedBlocksResults,
    ) -> Promise<(), capnp::Error> {
        let (start, limit) = match params.get() {
            Ok(params) => (params.get_start(), params.get_limit()),
            Err(error) => return Promise::err(error),
        };
        let store = self.store.clone();
        let permits = self.block_reads.clone();
        Promise::from_future(async move {
            // Only owned, Send values cross onto the blocking worker. The
            // Capnp response stays on its local executor and holds no Node lock.
            let (_permit, blocks) = read_blocks(store, permits, start, limit).await?;
            let mut output = results.get().init_blocks(blocks.len() as u32);
            for (i, block) in blocks.iter().enumerate() {
                output.set(i as u32, block.as_bytes());
            }
            Ok(())
        })
    }
}

use crate::config::{Config, SyncPeer};
use bytes::Bytes;
use std::{path::Path, time::Duration};
use tokio::io::{AsyncReadExt as TokioReadExt, AsyncWriteExt};

/// A full-duplex HTTP/3 POST body carries an ordinary Cap'n Proto RPC byte stream.
/// Bounded duplex buffers propagate QUIC flow control to the RPC runtime.
macro_rules! tunnel {
    ($stream:expr) => {{
        let (mut sender, mut receiver) = $stream.split();
        let (rpc_io, bridge_io) = tokio::io::duplex(256 * 1024);
        let (mut read, mut write) = tokio::io::split(bridge_io);
        let receive = tokio::task::spawn_local(async move {
            while let Some(mut bytes) = receiver.recv_data().await? {
                write.write_all_buf(&mut bytes).await?;
            }
            write.shutdown().await?;
            Ok::<(), anyhow::Error>(())
        });
        let send = tokio::task::spawn_local(async move {
            let mut buffer = vec![0u8; 64 * 1024];
            loop {
                let count = TokioReadExt::read(&mut read, &mut buffer).await?;
                if count == 0 {
                    break;
                }
                sender
                    .send_data(Bytes::copy_from_slice(&buffer[..count]))
                    .await?;
            }
            sender.finish().await?;
            Ok::<(), anyhow::Error>(())
        });
        (rpc_io, vec![receive, send])
    }};
}
fn reader_options() -> capnp::message::ReaderOptions {
    capnp::message::ReaderOptions {
        // A single full canonical block includes receipts/logs as well as raw
        // transactions. Permit the bounded storage record plus RPC framing.
        traversal_limit_in_words: Some((crate::codec::MAX_RECORD_BYTES + 2 * 1024 * 1024) / 8),
        nesting_limit: 32,
    }
}
pub fn generate_identity(cert: &Path, key: &Path) -> Result<()> {
    use std::io::Write;
    let identity = rcgen::generate_simple_self_signed(vec!["localhost".into()])?;
    let mut options = std::fs::OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut private = options.open(key)?;
    private.write_all(&identity.key_pair.serialize_der())?;
    private.sync_all()?;
    let mut public = std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(cert)?;
    public.write_all(identity.cert.der())?;
    public.sync_all()?;
    Ok(())
}
pub fn endpoint(config: &Config) -> Result<quinn::Endpoint> {
    let cert = rustls::pki_types::CertificateDer::from(std::fs::read(&config.tls_cert)?);
    let key = rustls::pki_types::PrivatePkcs8KeyDer::from(std::fs::read(&config.tls_key)?);
    let mut tls = rustls::ServerConfig::builder()
        .with_no_client_auth()
        .with_single_cert(vec![cert], key.into())?;
    tls.alpn_protocols = vec![b"h3".to_vec()];
    let mut server = quinn::ServerConfig::with_crypto(Arc::new(
        quinn::crypto::rustls::QuicServerConfig::try_from(tls)?,
    ));
    let transport = Arc::get_mut(&mut server.transport).expect("unshared transport");
    transport.max_concurrent_bidi_streams(8u32.into());
    transport.max_idle_timeout(Some(Duration::from_secs(30).try_into()?));
    Ok(quinn::Endpoint::server(server, config.peer_listen)?)
}
pub async fn serve(endpoint: quinn::Endpoint, node: Arc<Mutex<Node>>) -> Result<()> {
    let permits = Arc::new(Semaphore::new(32));
    while let Some(incoming) = endpoint.accept().await {
        let Ok(permit) = permits.clone().try_acquire_owned() else {
            incoming.refuse();
            continue;
        };
        let node = node.clone();
        tokio::task::spawn_local(async move {
            let _permit = permit;
            let result = async {
                let connection = tokio::time::timeout(Duration::from_secs(10), incoming).await??;
                let mut h3 =
                    h3::server::Connection::new(h3_quinn::Connection::new(connection.clone()))
                        .await?;
                while let Some(resolver) = h3.accept().await? {
                    let (request, mut stream) = resolver.resolve_request().await?;
                    if request.method() != http::Method::POST
                        || request.uri().path() != "/sfc/rpc"
                        || request
                            .headers()
                            .get(http::header::CONTENT_TYPE)
                            .and_then(|h| h.to_str().ok())
                            != Some("application/x-capnp")
                    {
                        stream
                            .send_response(http::Response::builder().status(404).body(())?)
                            .await?;
                        stream.finish().await?;
                        continue;
                    }
                    stream
                        .send_response(
                            http::Response::builder()
                                .status(200)
                                .header("content-type", "application/x-capnp")
                                .body(())?,
                        )
                        .await?;
                    let (io, tasks) = tunnel!(stream);
                    let (reader, writer) = futures::AsyncReadExt::split(io.compat());
                    let network = twoparty::VatNetwork::new(
                        reader,
                        writer,
                        rpc_twoparty_capnp::Side::Server,
                        reader_options(),
                    );
                    let service: peer::Client =
                        capnp_rpc::new_client(PeerServer::new(node.clone())?);
                    let rpc = RpcSystem::new(Box::new(network), Some(service.client));
                    tokio::task::spawn_local(async move {
                        // Active stress/sync sessions are long-lived. A wall-clock deadline
                        // would disconnect a healthy peer every minute; EOF tears down the
                        // RPC task and the connection semaphore still bounds idle peers.
                        let _ = rpc.await;
                        for task in tasks {
                            task.abort();
                        }
                    });
                }
                Ok::<(), anyhow::Error>(())
            }
            .await;
            if let Err(error) = result {
                crate::logging::event(
                    "warn",
                    "peer_connection_ended",
                    serde_json::json!({"transport":"http3","message":error.to_string()}),
                );
            }
        });
    }
    Ok(())
}

pub struct PeerConnection {
    pub client: peer::Client,
    _sender: Option<h3::client::SendRequest<h3_quinn::OpenStreams, Bytes>>,
    connection: Option<quinn::Connection>,
    _endpoint: Option<quinn::Endpoint>,
    transport: crate::config::Transport,
    tasks: Vec<tokio::task::JoinHandle<()>>,
}
impl Drop for PeerConnection {
    fn drop(&mut self) {
        if let Some(connection) = &self.connection {
            connection.close(0u32.into(), b"done");
        }
        for task in &self.tasks {
            task.abort();
        }
    }
}
impl PeerConnection {
    pub async fn connect(peer: &SyncPeer) -> Result<Self> {
        peer.validate()?;
        if peer.transport == crate::config::Transport::Tcp {
            let stream = tokio::time::timeout(
                Duration::from_secs(5),
                tokio::net::TcpStream::connect(peer.address),
            )
            .await??;
            stream.set_nodelay(true)?;
            let (reader, writer) = futures::AsyncReadExt::split(stream.compat());
            let network = twoparty::VatNetwork::new(
                reader,
                writer,
                rpc_twoparty_capnp::Side::Client,
                reader_options(),
            );
            let mut rpc = RpcSystem::new(Box::new(network), None);
            let client = rpc.bootstrap(rpc_twoparty_capnp::Side::Server);
            let task = tokio::task::spawn_local(async move {
                let _ = rpc.await;
            });
            return Ok(Self {
                client,
                _sender: None,
                connection: None,
                _endpoint: None,
                transport: peer.transport,
                tasks: vec![task],
            });
        }
        let mut roots = rustls::RootCertStore::empty();
        roots.add(rustls::pki_types::CertificateDer::from(std::fs::read(
            &peer.certificate,
        )?))?;
        let mut tls = rustls::ClientConfig::builder()
            .with_root_certificates(roots)
            .with_no_client_auth();
        tls.alpn_protocols = vec![b"h3".to_vec()];
        let client = quinn::ClientConfig::new(Arc::new(
            quinn::crypto::rustls::QuicClientConfig::try_from(tls)?,
        ));
        let bind = if peer.address.is_ipv4() {
            "0.0.0.0:0"
        } else {
            "[::]:0"
        };
        let mut endpoint = quinn::Endpoint::client(bind.parse()?)?;
        endpoint.set_default_client_config(client);
        let connection = tokio::time::timeout(
            Duration::from_secs(5),
            endpoint.connect(peer.address, &peer.server_name)?,
        )
        .await??;
        let (mut driver, mut sender) =
            h3::client::new(h3_quinn::Connection::new(connection.clone())).await?;
        let driver_task = tokio::task::spawn_local(async move {
            let _ = futures::future::poll_fn(|cx| driver.poll_close(cx)).await;
        });
        let request = http::Request::builder()
            .method(http::Method::POST)
            .uri(format!("https://{}/sfc/rpc", peer.server_name))
            .header("content-type", "application/x-capnp")
            .body(())?;
        let mut stream = sender.send_request(request).await?;
        let response = stream.recv_response().await?;
        anyhow::ensure!(response.status() == 200, "peer rejected RPC tunnel");
        let (io, bridge_tasks) = tunnel!(stream);
        let (reader, writer) = futures::AsyncReadExt::split(io.compat());
        let network = twoparty::VatNetwork::new(
            reader,
            writer,
            rpc_twoparty_capnp::Side::Client,
            reader_options(),
        );
        let mut rpc = RpcSystem::new(Box::new(network), None);
        let client = rpc.bootstrap(rpc_twoparty_capnp::Side::Server);
        let mut tasks = vec![
            driver_task,
            tokio::task::spawn_local(async move {
                let _ = rpc.await;
            }),
        ];
        for task in bridge_tasks {
            tasks.push(tokio::task::spawn_local(async move {
                let _ = task.await;
            }));
        }
        Ok(Self {
            client,
            _sender: Some(sender),
            connection: Some(connection),
            _endpoint: Some(endpoint),
            transport: peer.transport,
            tasks,
        })
    }
    async fn chain_status(&self) -> Result<PeerStatus> {
        let response = tokio::time::timeout(
            Duration::from_secs(5),
            self.client.status_request().send().promise,
        )
        .await??;
        let r = response.get()?.get_status()?;
        Ok(PeerStatus {
            protocol: r.get_protocol_version(),
            chain: r.get_chain_id(),
            height: r.get_height(),
            hash: r.get_block_hash()?.try_into()?,
            earliest: r.get_earliest_height(),
        })
    }
    pub async fn status(&self) -> Result<serde_json::Value> {
        let r = self.chain_status().await?;
        Ok(
            serde_json::json!({"transport":self.transport,"protocolVersion":r.protocol,"chainId":r.chain,"height":r.height,"blockHash":crate::types::hex_hash(&r.hash),"earliestHeight":r.earliest}),
        )
    }
    pub async fn blocks(&self, start: u64) -> Result<Vec<crate::types::Block>> {
        let mut request = self.client.get_encoded_blocks_request();
        request.get().set_start(start);
        request.get().set_limit(64);
        let response =
            tokio::time::timeout(Duration::from_secs(5), request.send().promise).await??;
        // One owned payload at the RPC/thread boundary, no per-transaction hydration.
        let blocks = response.get()?.get_blocks()?;
        anyhow::ensure!(blocks.len() <= 64, "peer exceeded requested block count");
        blocks
            .iter()
            .map(|b| crate::types::Block::from_bytes(Bytes::copy_from_slice(b?)))
            .collect()
    }
}
struct PeerStatus {
    protocol: u32,
    chain: u64,
    height: u64,
    hash: [u8; 32],
    earliest: u64,
}
pub async fn sync_once(node: Arc<Mutex<Node>>, peer: &PeerConnection) -> Result<usize> {
    let status = peer.chain_status().await?;
    let start = {
        let local = node.lock().map_err(cap_error)?;
        anyhow::ensure!(
            status.protocol == crate::codec::PROTOCOL_VERSION,
            "unsupported peer protocol"
        );
        anyhow::ensure!(
            status.chain == local.genesis.chain_id,
            "peer chain mismatch"
        );
        let height = local.head().height();
        anyhow::ensure!(
            status.earliest <= height + 1,
            "peer pruned required history; use an archive peer"
        );
        if status.height == height {
            anyhow::ensure!(status.hash == local.head().hash(), "peer head diverges");
            return Ok(0);
        }
        height + 1
    };
    let blocks = peer.blocks(start).await?;
    let count = blocks.len();
    tokio::task::spawn_blocking(move || {
        let mut local = node.lock().map_err(cap_error)?;
        for block in blocks {
            local.import_encoded(block)?;
        }
        Ok::<_, anyhow::Error>(())
    })
    .await??;
    if count > 0 {
        crate::logging::event(
            "info",
            "sync_batch_imported",
            serde_json::json!({"start_height":start,"blocks":count,"transport":peer.transport}),
        );
    }
    Ok(count)
}
pub async fn follow(node: Arc<Mutex<Node>>, config: SyncPeer) -> Result<()> {
    loop {
        let session = async {
            let peer = PeerConnection::connect(&config).await?;
            loop {
                if sync_once(node.clone(), &peer).await? == 0 {
                    tokio::time::sleep(Duration::from_millis(100)).await;
                }
            }
            #[allow(unreachable_code)]
            Ok::<(), anyhow::Error>(())
        }
        .await;
        if let Err(error) = session {
            crate::logging::event(
                "warn",
                "sync_retry",
                serde_json::json!({"transport":config.transport,"peer":config.address,"message":error.to_string()}),
            );
        }
        tokio::time::sleep(Duration::from_secs(1)).await;
    }
}

/// Direct Capnp RPC is the default loopback-only transport for local peers.
pub async fn serve_tcp(listener: tokio::net::TcpListener, node: Arc<Mutex<Node>>) -> Result<()> {
    anyhow::ensure!(
        listener.local_addr()?.ip().is_loopback(),
        "direct Capnp listener must use loopback"
    );
    let permits = Arc::new(Semaphore::new(32));
    loop {
        let (stream, _) = listener.accept().await?;
        let Ok(permit) = permits.clone().try_acquire_owned() else {
            continue;
        };
        stream.set_nodelay(true)?;
        let service: peer::Client = capnp_rpc::new_client(PeerServer::new(node.clone())?);
        tokio::task::spawn_local(async move {
            let _permit = permit;
            let (reader, writer) = futures::AsyncReadExt::split(stream.compat());
            let network = twoparty::VatNetwork::new(
                reader,
                writer,
                rpc_twoparty_capnp::Side::Server,
                reader_options(),
            );
            let rpc = RpcSystem::new(Box::new(network), Some(service.client));
            // Keep healthy sessions alive until the peer disconnects.
            let _ = rpc.await;
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    struct Oversized;
    impl peer::Server for Oversized {
        fn get_encoded_blocks(
            &mut self,
            _: peer::GetEncodedBlocksParams,
            mut results: peer::GetEncodedBlocksResults,
        ) -> Promise<(), capnp::Error> {
            results.get().init_blocks(65);
            Promise::ok(())
        }
    }
    #[tokio::test(flavor = "current_thread")]
    async fn peer_cannot_exceed_requested_block_count() {
        tokio::task::LocalSet::new()
            .run_until(async {
                let peer = PeerConnection {
                    client: capnp_rpc::new_client(Oversized),
                    _sender: None,
                    connection: None,
                    _endpoint: None,
                    transport: crate::config::Transport::Tcp,
                    tasks: vec![],
                };
                assert!(peer
                    .blocks(1)
                    .await
                    .unwrap_err()
                    .to_string()
                    .contains("block count"));
            })
            .await;
    }
}
