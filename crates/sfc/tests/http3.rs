mod common;
use sfc::{
    config::{Config, SyncPeer, Transport},
    framework::Application,
    network::{self, PeerConnection},
    node::Node,
};
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

fn client_endpoint(cert: &std::path::Path, alpn: &[u8]) -> quinn::Endpoint {
    let mut roots = rustls::RootCertStore::empty();
    roots
        .add(rustls::pki_types::CertificateDer::from(
            std::fs::read(cert).unwrap(),
        ))
        .unwrap();
    let mut tls = rustls::ClientConfig::builder()
        .with_root_certificates(roots)
        .with_no_client_auth();
    tls.alpn_protocols = vec![alpn.to_vec()];
    let config = quinn::ClientConfig::new(Arc::new(
        quinn::crypto::rustls::QuicClientConfig::try_from(tls).unwrap(),
    ));
    let mut endpoint = quinn::Endpoint::client("127.0.0.1:0".parse().unwrap()).unwrap();
    endpoint.set_default_client_config(config);
    endpoint
}

struct Server {
    _home: tempfile::TempDir,
    config: Config,
    endpoint: quinn::Endpoint,
    task: tokio::task::JoinHandle<anyhow::Result<()>>,
    node: Arc<Mutex<Node>>,
}
impl Server {
    fn start() -> Self {
        let home = tempfile::tempdir().unwrap();
        let mut config = common::config(home.path());
        // Transport batching fixture spans 70 seconds; keep it independent of the 60s default.
        config.retention = sfc::config::Retention::Pruned { seconds: 120 };
        config.peer_listen = "127.0.0.1:0".parse().unwrap();
        network::generate_identity(&config.tls_cert, &config.tls_key).unwrap();
        let endpoint = network::endpoint(&config).unwrap();
        config.peer_listen = endpoint.local_addr().unwrap();
        let node = Arc::new(Mutex::new(
            Node::open(config.clone(), Application::default()).unwrap(),
        ));
        let task = tokio::task::spawn_local(network::serve(endpoint.clone(), node.clone()));
        Self {
            _home: home,
            config,
            endpoint,
            task,
            node,
        }
    }
    fn peer(&self) -> SyncPeer {
        SyncPeer {
            transport: Transport::Http3,
            address: self.config.peer_listen,
            server_name: "localhost".into(),
            certificate: self.config.tls_cert.clone(),
        }
    }
}
impl Drop for Server {
    fn drop(&mut self) {
        self.endpoint.close(0u32.into(), b"test finished");
        self.task.abort();
    }
}

#[tokio::test(flavor = "current_thread")]
async fn http3_framing_routes_and_tls_identity() {
    tokio::task::LocalSet::new()
        .run_until(async {
            tokio::time::timeout(Duration::from_secs(20), async {
                let server = Server::start();
                let other = Server::start();
                let mut wrong = server.peer();
                wrong.certificate = other.config.tls_cert.clone();
                assert!(PeerConnection::connect(&wrong).await.is_err());
                wrong = server.peer();
                wrong.server_name = "wrong.example".into();
                assert!(PeerConnection::connect(&wrong).await.is_err());
                let incompatible = client_endpoint(&server.config.tls_cert, b"not-h3");
                assert!(incompatible
                    .connect(server.config.peer_listen, "localhost")
                    .unwrap()
                    .await
                    .is_err());
                incompatible.close(0u32.into(), b"done");

                let endpoint = client_endpoint(&server.config.tls_cert, b"h3");
                let connection = endpoint
                    .connect(server.config.peer_listen, "localhost")
                    .unwrap()
                    .await
                    .unwrap();
                let handshake = connection
                    .handshake_data()
                    .unwrap()
                    .downcast::<quinn::crypto::rustls::HandshakeData>()
                    .unwrap();
                assert_eq!(handshake.protocol.as_deref(), Some(b"h3".as_slice()));
                let (mut driver, mut sender) =
                    h3::client::new(h3_quinn::Connection::new(connection.clone()))
                        .await
                        .unwrap();
                let task = tokio::task::spawn_local(async move {
                    let _ = futures::future::poll_fn(|cx| driver.poll_close(cx)).await;
                });
                for (method, path, content_type, expected) in [
                    ("GET", "/sfc/rpc", "application/x-capnp", 404),
                    ("POST", "/wrong", "application/x-capnp", 404),
                    ("POST", "/sfc/rpc", "application/json", 404),
                    ("POST", "/sfc/rpc", "application/x-capnp", 200),
                ] {
                    let request = http::Request::builder()
                        .method(method)
                        .uri(format!("https://localhost{path}"))
                        .header("content-type", content_type)
                        .body(())
                        .unwrap();
                    let mut stream = sender.send_request(request).await.unwrap();
                    // The response must arrive before the request body finishes: full duplex.
                    let response = stream.recv_response().await.unwrap();
                    assert_eq!(response.status().as_u16(), expected);
                    if expected == 200 {
                        assert_eq!(response.headers()["content-type"], "application/x-capnp");
                        // Invalid segment table exceeds traversal limits; cannot crash the server.
                        stream
                            .send_data(bytes::Bytes::from_static(&[255; 8]))
                            .await
                            .unwrap();
                    }
                    let _ = stream.finish().await;
                }
                connection.close(0u32.into(), b"done");
                task.abort();
                let healthy = PeerConnection::connect(&server.peer()).await.unwrap();
                assert_eq!(healthy.status().await.unwrap()["chainId"], 7777);
            })
            .await
            .expect("HTTP/3 framing test timed out");
        })
        .await;
}

#[tokio::test(flavor = "current_thread")]
async fn capnp_http3_batches_concurrent_calls_and_reconnect() {
    tokio::task::LocalSet::new()
        .run_until(async {
            tokio::time::timeout(Duration::from_secs(20), async {
                let server = Server::start();
                for height in 1..=70 {
                    server
                        .node
                        .lock()
                        .unwrap()
                        .produce(1_000_000 + height)
                        .unwrap();
                }
                let peer = server.peer();
                for _ in 0..3 {
                    let client = PeerConnection::connect(&peer).await.unwrap();
                    let (status, blocks) = tokio::join!(client.status(), client.blocks(1));
                    assert_eq!(status.unwrap()["height"], 70);
                    let blocks = blocks.unwrap();
                    assert_eq!(blocks.len(), 64);
                    assert_eq!(blocks.first().unwrap().height(), 1);
                    assert_eq!(blocks.last().unwrap().height(), 64);
                    let mut request = client.client.get_blocks_request();
                    request.get().set_start(1);
                    request.get().set_limit(u32::MAX);
                    assert_eq!(
                        request
                            .send()
                            .promise
                            .await
                            .unwrap()
                            .get()
                            .unwrap()
                            .get_blocks()
                            .unwrap()
                            .len(),
                        64
                    );
                    let mut zero = client.client.get_blocks_request();
                    zero.get().set_limit(0);
                    assert_eq!(
                        zero.send()
                            .promise
                            .await
                            .unwrap()
                            .get()
                            .unwrap()
                            .get_blocks()
                            .unwrap()
                            .len(),
                        0
                    );
                    assert!(client.blocks(71).await.unwrap().is_empty());
                    let home = tempfile::tempdir().unwrap();
                    let mut config = common::config(home.path());
                    config.sync_peer = Some(peer.clone());
                    let follower = Arc::new(Mutex::new(
                        Node::open(config, Application::default()).unwrap(),
                    ));
                    assert_eq!(
                        network::sync_once(follower.clone(), &client).await.unwrap(),
                        64
                    );
                    assert_eq!(
                        network::sync_once(follower.clone(), &client).await.unwrap(),
                        6
                    );
                    assert_eq!(
                        network::sync_once(follower.clone(), &client).await.unwrap(),
                        0
                    );
                    assert_eq!(
                        follower.lock().unwrap().head().hash(),
                        server.node.lock().unwrap().head().hash()
                    );
                }
            })
            .await
            .expect("Capnp sync test timed out");
        })
        .await;
}

#[tokio::test(flavor = "current_thread")]
async fn sync_rejects_divergence_and_pruned_gaps_without_changing_state() {
    tokio::task::LocalSet::new()
        .run_until(async {
            tokio::time::timeout(Duration::from_secs(20), async {
                let server = Server::start();
                server.node.lock().unwrap().produce(1_000_001).unwrap();
                let client = PeerConnection::connect(&server.peer()).await.unwrap();
                let home = tempfile::tempdir().unwrap();
                let mut config = common::config(home.path());
                config.sync_peer = Some(server.peer());
                let follower = Arc::new(Mutex::new(
                    Node::open(config, Application::default()).unwrap(),
                ));
                let genesis_hash = follower.lock().unwrap().head().hash();
                let valid = client.blocks(1).await.unwrap().remove(0);
                for kind in 0..4 {
                    let mut invalid = common::block_draft(&valid);
                    match kind {
                        0 => invalid.chain_id += 1,
                        1 => invalid.parent_hash[0] ^= 1,
                        2 => invalid.state_root[0] ^= 1,
                        _ => invalid.transactions = vec![vec![0xff].into()],
                    }
                    assert!(sfc::types::Block::build(invalid)
                        .and_then(|b| follower.lock().unwrap().import_encoded(b))
                        .is_err());
                    assert_eq!(follower.lock().unwrap().head().hash(), genesis_hash);
                    assert_eq!(
                        follower.lock().unwrap().store.head().unwrap().hash(),
                        genesis_hash
                    );
                }
                assert_eq!(
                    network::sync_once(follower.clone(), &client).await.unwrap(),
                    1
                );
                let divergent = Server::start();
                divergent.node.lock().unwrap().produce(1_000_002).unwrap();
                let different = PeerConnection::connect(&divergent.peer()).await.unwrap();
                let before = follower.lock().unwrap().head().hash();
                let error = network::sync_once(follower.clone(), &different)
                    .await
                    .unwrap_err();
                assert!(error.to_string().contains("diverges"));
                assert_eq!(follower.lock().unwrap().head().hash(), before);

                // A follower ahead of its upstream must never roll back.
                let behind = Server::start();
                let older = PeerConnection::connect(&behind.peer()).await.unwrap();
                assert_eq!(
                    network::sync_once(follower.clone(), &older).await.unwrap(),
                    0
                );
                assert_eq!(follower.lock().unwrap().head().hash(), before);

                // Expire the intermediary blocks so the follower cannot bridge ancestry.
                server.node.lock().unwrap().produce(1_000_002).unwrap();
                server
                    .node
                    .lock()
                    .unwrap()
                    .produce(1_000_003 + sfc::types::WEEK)
                    .unwrap();
                let error = network::sync_once(follower.clone(), &client)
                    .await
                    .unwrap_err();
                assert!(error.to_string().contains("pruned required history"));
                assert_eq!(follower.lock().unwrap().head().hash(), before);
                assert_eq!(
                    follower.lock().unwrap().store.head().unwrap().hash(),
                    before
                );
            })
            .await
            .expect("sync rejection test timed out");
        })
        .await;
}
