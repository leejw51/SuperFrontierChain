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
                assert_eq!(blocks.last().unwrap().transactions().unwrap(), vec![tx.raw]);
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

#[tokio::test(flavor = "current_thread")]
async fn binary_batch_preserves_order_errors_and_limits_on_both_transports() {
    tokio::task::LocalSet::new().run_until(async {
        for transport in [Transport::Tcp, Transport::Http3] {
            let home = tempfile::tempdir().unwrap();
            let mut config = common::config(home.path());
            config.peer_listen = "127.0.0.1:0".parse().unwrap();
            network::generate_identity(&config.tls_cert, &config.tls_key).unwrap();
            let endpoint = network::endpoint(&config).unwrap();
            let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
            let address = if transport == Transport::Tcp { listener.local_addr().unwrap() } else { endpoint.local_addr().unwrap() };
            let node = Arc::new(Mutex::new(Node::open(config.clone(), Application::default()).unwrap()));
            let h3 = tokio::task::spawn_local(network::serve(endpoint.clone(), node.clone()));
            let tcp = tokio::task::spawn_local(network::serve_tcp(listener, node.clone()));
            let client = PeerConnection::connect(&SyncPeer { transport, address, certificate:config.tls_cert.clone(),server_name:"localhost".into() }).await.unwrap();
            for count in [0,4097] {
                let mut request = client.client.submit_transactions_request();
                request.get().init_transactions(count);
                assert!(request.send().promise.await.is_err());
            }
            let mut oversized = client.client.submit_transactions_request();
            oversized.get().init_transactions(1).set(0,&vec![0; sfc::types::MAX_TX_BYTES+1]);
            assert!(oversized.send().promise.await.is_err());
            assert_eq!(node.lock().unwrap().pending_count(),0);
            let first = common::transfer(0);
            let second = common::transfer(1);
            let mut request = client.client.submit_transactions_request();
            let mut batch = request.get().init_transactions(4);
            batch.set(0,&first.raw);
            batch.set(1,&[0xff]);
            batch.set(2,&first.raw); // duplicate is idempotent and must not stop the subsequent nonce
            batch.set(3,&second.raw);
            let response = request.send().promise.await.unwrap();
            let results = response.get().unwrap().get_results().unwrap();
            use sfc::chain_capnp::submission::Which;
            assert!(matches!(results.get(0).which().unwrap(),Which::Hash(h) if *h.as_ref().unwrap()==first.hash));
            assert!(matches!(results.get(1).which().unwrap(),Which::Error(_)));
            assert!(matches!(results.get(2).which().unwrap(),Which::Hash(h) if *h.as_ref().unwrap()==first.hash));
            assert!(matches!(results.get(3).which().unwrap(),Which::Hash(h) if *h.as_ref().unwrap()==second.hash));
            assert_eq!(node.lock().unwrap().pending_count(),2);
            let mut missing = client.client.committed_transaction_request();
            missing.get().set_hash(&second.hash);
            assert!(!missing.send().promise.await.unwrap().get().unwrap().get_found());
            node.lock().unwrap().produce(1_000_001).unwrap();
            let mut committed = client.client.committed_transaction_request();
            committed.get().set_hash(&second.hash);
            let response = committed.send().promise.await.unwrap();
            let receipt = response.get().unwrap();
            assert!(receipt.get_found() && receipt.get_success());
            assert_eq!(receipt.get_height(),1);
            assert_eq!(receipt.get_block_hash().unwrap(),node.lock().unwrap().head().hash());
            let mut invalid = client.client.account_request();
            invalid.get().set_address(&[0;19]);
            assert!(invalid.send().promise.await.is_err());
            // Send a costly prefix and a tiny successor without awaiting the
            // first response. Completion may differ; nonce admission must not.
            let prefix: Vec<_> = (2..66).map(common::transfer).collect();
            let mut first_request = client.client.submit_transactions_request();
            let mut list = first_request.get().init_transactions(prefix.len() as u32);
            for (i, tx) in prefix.iter().enumerate() { list.set(i as u32, &tx.raw); }
            let first_promise = first_request.send().promise;
            let last = common::transfer(66);
            let mut next_request = client.client.submit_transactions_request();
            next_request.get().init_transactions(1).set(0, &last.raw);
            let next_promise = next_request.send().promise;
            let (first_result, next_result) = futures::join!(first_promise, next_promise);
            let first_result = first_result.unwrap();
            for (result, tx) in first_result.get().unwrap().get_results().unwrap().iter().zip(&prefix) {
                assert!(matches!(result.which().unwrap(), Which::Hash(h) if *h.as_ref().unwrap()==tx.hash));
            }
            assert!(matches!(next_result.unwrap().get().unwrap().get_results().unwrap().get(0).which().unwrap(), Which::Hash(h) if *h.as_ref().unwrap()==last.hash));
            assert_eq!(node.lock().unwrap().pending_count(), 65);
            node.lock().unwrap().produce(1_000_002).unwrap();
            node.lock().unwrap().config.sync_peer = Some(SyncPeer {transport,address,certificate:config.tls_cert,server_name:"localhost".into()});
            let mut readonly = client.client.submit_transactions_request();
            readonly.get().init_transactions(1).set(0,&common::transfer(2).raw);
            assert!(readonly.send().promise.await.is_err());
            assert_eq!(node.lock().unwrap().pending_count(),0);
            h3.abort(); tcp.abort(); endpoint.close(0u32.into(),b"done");
        }
    }).await;
}

#[tokio::test(flavor = "current_thread")]
#[ignore = "real-time regression for the previous 60-second RPC session deadlines"]
async fn active_rpc_sessions_survive_one_minute() {
    tokio::task::LocalSet::new()
        .run_until(async {
            let home = tempfile::tempdir().unwrap();
            let mut config = common::config(home.path());
            config.peer_listen = "127.0.0.1:0".parse().unwrap();
            network::generate_identity(&config.tls_cert, &config.tls_key).unwrap();
            let endpoint = network::endpoint(&config).unwrap();
            let h3_address = endpoint.local_addr().unwrap();
            let node = Arc::new(Mutex::new(
                Node::open(config.clone(), Application::default()).unwrap(),
            ));
            let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
            let address = listener.local_addr().unwrap();
            let server = tokio::task::spawn_local(network::serve_tcp(listener, node.clone()));
            let h3 = tokio::task::spawn_local(network::serve(endpoint.clone(), node));
            let tcp = PeerConnection::connect(&SyncPeer {
                transport: Transport::Tcp,
                address,
                certificate: "unused".into(),
                server_name: "localhost".into(),
            })
            .await
            .unwrap();
            let http3 = PeerConnection::connect(&SyncPeer {
                transport: Transport::Http3,
                address: h3_address,
                certificate: config.tls_cert,
                server_name: "localhost".into(),
            })
            .await
            .unwrap();
            for _ in 0..7 {
                for peer in [&tcp, &http3] {
                    assert_eq!(peer.status().await.unwrap()["chainId"], 7777);
                }
                tokio::time::sleep(std::time::Duration::from_secs(10)).await;
            }
            for peer in [&tcp, &http3] {
                assert_eq!(peer.status().await.unwrap()["chainId"], 7777);
            }
            server.abort();
            h3.abort();
            endpoint.close(0u32.into(), b"done");
        })
        .await;
}
