mod common;
use sfc::{
    config::{SyncPeer, Transport},
    framework::Application,
    network::{self, PeerConnection},
    node::Node,
};
use std::sync::{Arc, Mutex};

#[tokio::test(flavor = "current_thread")]
async fn both_transports_submit_fetch_and_replay_transactions() {
    tokio::task::LocalSet::new()
        .run_until(async {
            let leader_home = tempfile::tempdir().unwrap();
            let mut config = common::config(leader_home.path());
            config.peer_listen = "127.0.0.1:0".parse().unwrap();
            network::generate_identity(&config.tls_cert, &config.tls_key).unwrap();
            let endpoint = network::endpoint(&config).unwrap();
            let http3_address = endpoint.local_addr().unwrap();
            let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
            let tcp_address = listener.local_addr().unwrap();
            let leader = Arc::new(Mutex::new(
                Node::open(config.clone(), Application::default()).unwrap(),
            ));
            let http3_task =
                tokio::task::spawn_local(network::serve(endpoint.clone(), leader.clone()));
            let tcp_task = tokio::task::spawn_local(network::serve_tcp(listener, leader.clone()));
            for (nonce, transport, address) in [
                (0, Transport::Http3, http3_address),
                (1, Transport::Tcp, tcp_address),
            ] {
                let peer = SyncPeer {
                    transport,
                    address,
                    certificate: config.tls_cert.clone(),
                    server_name: "localhost".into(),
                };
                let client = PeerConnection::connect(&peer).await.unwrap();
                assert_eq!(
                    client.status().await.unwrap()["transport"],
                    serde_json::to_value(transport).unwrap()
                );
                let tx = common::transfer(nonce);
                let mut request = client.client.submit_transaction_request();
                request.get().set_raw(&tx.raw);
                let response = request.send().promise.await.unwrap();
                assert_eq!(response.get().unwrap().get_hash().unwrap(), tx.hash);
                let mut invalid = client.client.submit_transaction_request();
                invalid.get().set_raw(&[0xff]);
                assert!(invalid.send().promise.await.is_err());
                leader.lock().unwrap().produce(1_000_001 + nonce).unwrap();
                let blocks = client.blocks(1).await.unwrap();
                assert_eq!(blocks.len(), nonce as usize + 1);
                assert_eq!(blocks.last().unwrap().transactions, vec![tx.raw]);
                let mut missing = client.client.get_block_request();
                missing.get().set_height(999);
                assert!(!missing
                    .send()
                    .promise
                    .await
                    .unwrap()
                    .get()
                    .unwrap()
                    .get_found());
                let follower_home = tempfile::tempdir().unwrap();
                let mut follower_config = common::config(follower_home.path());
                follower_config.sync_peer = Some(peer);
                let follower = Arc::new(Mutex::new(
                    Node::open(follower_config, Application::default()).unwrap(),
                ));
                assert_eq!(
                    network::sync_once(follower.clone(), &client).await.unwrap(),
                    nonce as usize + 1
                );
                assert_eq!(
                    follower.lock().unwrap().head().hash(),
                    leader.lock().unwrap().head().hash()
                );
                assert_eq!(network::sync_once(follower, &client).await.unwrap(), 0);
            }
            http3_task.abort();
            tcp_task.abort();
            endpoint.close(0u32.into(), b"test done");
        })
        .await;
}
