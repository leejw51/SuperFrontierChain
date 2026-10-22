mod common;
use sfc::{
    config::Transport,
    framework::Application,
    network::{self, PeerConnection},
    node::Node,
};
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

#[tokio::test(flavor = "current_thread")]
async fn block_reads_complete_while_execution_holds_node_lock() {
    tokio::task::LocalSet::new()
        .run_until(async {
            for transport in [Transport::Tcp, Transport::Http3] {
                let home = tempfile::tempdir().unwrap();
                let mut config = common::config(home.path());
                config.peer_listen = "127.0.0.1:0".parse().unwrap();
                network::generate_identity(&config.tls_cert, &config.tls_key).unwrap();
                let node = Arc::new(Mutex::new(
                    Node::open(config.clone(), Application::default()).unwrap(),
                ));
                let expected = {
                    let mut node = node.lock().unwrap();
                    let block = node.produce(1_000_001).unwrap();
                    node.produce(1_000_002).unwrap();
                    block
                };
                let endpoint = network::endpoint(&config).unwrap();
                let (address, server) = if transport == Transport::Tcp {
                    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
                    (
                        listener.local_addr().unwrap(),
                        tokio::task::spawn_local(network::serve_tcp(listener, node.clone())),
                    )
                } else {
                    (
                        endpoint.local_addr().unwrap(),
                        tokio::task::spawn_local(network::serve(endpoint.clone(), node.clone())),
                    )
                };
                let peer = sfc::config::SyncPeer {
                    transport,
                    address,
                    server_name: "localhost".into(),
                    certificate: config.tls_cert.clone(),
                };
                let client = PeerConnection::connect(&peer).await.unwrap();
                // Ensure the capability was created before deliberately locking Node.
                assert_eq!(client.blocks(1).await.unwrap()[0], expected);
                let (unlock, wait) = std::sync::mpsc::channel();
                let (locked, ready) = tokio::sync::oneshot::channel();
                let held_node = node.clone();
                let holder = tokio::task::spawn_blocking(move || {
                    let _guard = held_node.lock().unwrap();
                    locked.send(()).unwrap();
                    wait.recv_timeout(Duration::from_secs(5)).is_ok()
                });
                ready.await.unwrap();
                let result = tokio::time::timeout(Duration::from_secs(2), async {
                    let mut single = client.client.get_block_request();
                    single.get().set_height(1);
                    let mut typed = client.client.get_blocks_request();
                    typed.get().set_start(1);
                    typed.get().set_limit(2);
                    let (single, typed, encoded) = tokio::join!(
                        single.send().promise,
                        typed.send().promise,
                        client.blocks(1)
                    );
                    assert!(single.unwrap().get().unwrap().get_found());
                    assert_eq!(typed.unwrap().get().unwrap().get_blocks().unwrap().len(), 2);
                    assert_eq!(encoded.unwrap()[0], expected);
                })
                .await;
                let _ = unlock.send(());
                assert!(holder.await.unwrap(), "RPC waited for the execution mutex");
                result.expect("block reads blocked the local RPC executor");
                drop(client);
                server.abort();
                let _ = server.await;
                endpoint.close(0u32.into(), b"done");
            }
        })
        .await;
}
