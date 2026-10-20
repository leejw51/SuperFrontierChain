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

struct PeerServer {
    node: Arc<Mutex<Node>>,
}
fn cap_error(error: impl std::fmt::Display) -> capnp::Error {
    capnp::Error::failed(error.to_string())
}
fn fill_block(mut builder: block::Builder<'_>, value: &crate::types::Block) -> Result<()> {
    builder.set_chain_id(value.chain_id);
    builder.set_height(value.height);
    builder.set_timestamp(value.timestamp);
    builder.set_parent_hash(&value.parent_hash);
    builder.set_state_root(&value.state_root);
    let mut transactions = builder.init_transactions(value.transactions.len() as u32);
    for (index, raw) in value.transactions.iter().enumerate() {
        transactions.set(index as u32, &hex::decode(raw.trim_start_matches("0x"))?);
    }
    Ok(())
}
impl peer::Server for PeerServer {
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
            out.set_protocol_version(1);
            out.set_chain_id(head.chain_id);
            out.set_height(head.height);
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
        let result = (|| {
            let raw = params.get()?.get_raw()?;
            let hash = self
                .node
                .lock()
                .map_err(cap_error)?
                .submit(raw)
                .map_err(cap_error)?;
            results.get().set_hash(&hash);
            Ok(())
        })();
        Promise::from_future(async move { result })
    }
    fn get_block(
        &mut self,
        params: peer::GetBlockParams,
        mut results: peer::GetBlockResults,
    ) -> Promise<(), capnp::Error> {
        let result = (|| {
            let height = params.get()?.get_height();
            let node = self.node.lock().map_err(cap_error)?;
            let block = node.store.block(height).map_err(cap_error)?;
            results.get().set_found(block.is_some());
            if let Some(block) = block {
                fill_block(results.get().init_block(), &block).map_err(cap_error)?;
            }
            Ok(())
        })();
        Promise::from_future(async move { result })
    }
    fn get_blocks(
        &mut self,
        params: peer::GetBlocksParams,
        mut results: peer::GetBlocksResults,
    ) -> Promise<(), capnp::Error> {
        let result = (|| {
            let params = params.get()?;
            let limit = params.get_limit().min(64) as u64;
            let start = params.get_start();
            let node = self.node.lock().map_err(cap_error)?;
            let mut blocks = Vec::new();
            let mut bytes = 0;
            for offset in 0..limit {
                let height = start
                    .checked_add(offset)
                    .ok_or_else(|| cap_error("height overflow"))?;
                let Some(block) = node.store.block(height).map_err(cap_error)? else {
                    break;
                };
                let size: usize = block.transactions.iter().map(|tx| tx.len() / 2).sum();
                if !blocks.is_empty() && bytes + size > 2 * 1024 * 1024 {
                    break;
                }
                bytes += size;
                blocks.push(block);
            }
            let mut output = results.get().init_blocks(blocks.len() as u32);
            for (index, block) in blocks.iter().enumerate() {
                fill_block(output.reborrow().get(index as u32), block).map_err(cap_error)?;
            }
            Ok(())
        })();
        Promise::from_future(async move { result })
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
        traversal_limit_in_words: Some(2 * 1024 * 1024),
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
                        capnp_rpc::new_client(PeerServer { node: node.clone() });
                    let rpc = RpcSystem::new(Box::new(network), Some(service.client));
                    tokio::task::spawn_local(async move {
                        let _ = tokio::time::timeout(Duration::from_secs(60), rpc).await;
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
    pub async fn status(&self) -> Result<serde_json::Value> {
        let response = tokio::time::timeout(
            Duration::from_secs(5),
            self.client.status_request().send().promise,
        )
        .await??;
        let status = response.get()?.get_status()?;
        Ok(
            serde_json::json!({"transport":self.transport, "protocolVersion":status.get_protocol_version(), "chainId":status.get_chain_id(),
            "height":status.get_height(),"blockHash":format!("0x{}",hex::encode(status.get_block_hash()?)),"earliestHeight":status.get_earliest_height()}),
        )
    }
    pub async fn blocks(&self, start: u64) -> Result<Vec<WireBlock>> {
        let mut request = self.client.get_blocks_request();
        request.get().set_start(start);
        request.get().set_limit(64);
        let response =
            tokio::time::timeout(Duration::from_secs(5), request.send().promise).await??;
        response
            .get()?
            .get_blocks()?
            .iter()
            .map(WireBlock::read)
            .collect()
    }
}
#[derive(Clone, Debug)]
pub struct WireBlock {
    pub chain_id: u64,
    pub height: u64,
    pub timestamp: u64,
    pub parent_hash: [u8; 32],
    pub state_root: [u8; 32],
    pub transactions: Vec<Vec<u8>>,
}
impl WireBlock {
    fn read(block: block::Reader<'_>) -> Result<Self> {
        Ok(Self {
            chain_id: block.get_chain_id(),
            height: block.get_height(),
            timestamp: block.get_timestamp(),
            parent_hash: block.get_parent_hash()?.try_into()?,
            state_root: block.get_state_root()?.try_into()?,
            transactions: block
                .get_transactions()?
                .iter()
                .map(|tx| tx.map(|t| t.to_vec()).map_err(Into::into))
                .collect::<Result<_>>()?,
        })
    }
}
pub async fn sync_once(node: Arc<Mutex<Node>>, peer: &PeerConnection) -> Result<usize> {
    let status = peer.status().await?;
    let start = {
        let local = node.lock().map_err(cap_error)?;
        anyhow::ensure!(status["protocolVersion"] == 1, "unsupported peer protocol");
        anyhow::ensure!(
            status["chainId"] == local.genesis.chain_id,
            "peer chain mismatch"
        );
        let height = local.head().height;
        anyhow::ensure!(
            status["earliestHeight"].as_u64().unwrap_or(u64::MAX) <= height + 1,
            "peer pruned required history; use an archive peer"
        );
        if status["height"].as_u64() == Some(height) {
            anyhow::ensure!(
                status["blockHash"] == crate::types::hex_hash(&local.head().hash()),
                "peer head diverges"
            );
            return Ok(0);
        }
        height + 1
    };
    let blocks = peer.blocks(start).await?;
    let count = blocks.len();
    tokio::task::spawn_blocking(move || {
        let mut local = node.lock().map_err(cap_error)?;
        for block in blocks {
            local.import(block)?;
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

/// Direct Capnp RPC is an opt-in, loopback-only transport for local peers.
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
        let service: peer::Client = capnp_rpc::new_client(PeerServer { node: node.clone() });
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
            let _ = tokio::time::timeout(Duration::from_secs(60), rpc).await;
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn wire_rejects_invalid_hash_lengths() {
        let mut message = capnp::message::Builder::new_default();
        let mut block = message.init_root::<block::Builder<'_>>();
        block.set_parent_hash(&[0; 31]);
        block.set_state_root(&[0; 32]);
        assert!(WireBlock::read(block.reborrow_as_reader()).is_err());
        block.set_parent_hash(&[0; 32]);
        assert!(WireBlock::read(block.reborrow_as_reader()).is_ok());
        block.set_state_root(&[0; 33]);
        assert!(WireBlock::read(block.reborrow_as_reader()).is_err());
    }
}
