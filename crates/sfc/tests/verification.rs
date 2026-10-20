mod common;
use common::*;
use sfc::{
    ethereum::Transaction,
    framework::Application,
    node::Node,
    verification::{Backend, VerificationConfig, Verifier},
};

#[test]
fn defaults_gpu_and_explicit_cpu_needs_no_python() {
    assert_eq!(VerificationConfig::default().backend, Backend::Gpu);
    assert_eq!(
        serde_json::from_str::<VerificationConfig>("{}")
            .unwrap()
            .backend,
        Backend::Gpu
    );
    let cpu = Verifier::new(VerificationConfig {
        backend: Backend::Cpu,
        python: "/missing/python".into(),
        ..Default::default()
    })
    .unwrap();
    assert!(cpu.decode_batch::<Vec<u8>>(&[], 7777).unwrap().is_empty());
    let raw = vec![transfer(0).raw, vec![0], transfer(1).raw];
    let decoded = cpu.decode_batch(&raw, 7777).unwrap();
    assert!(decoded[0].is_ok() && decoded[1].is_err() && decoded[2].is_ok());
    assert_eq!(cpu.status().unwrap()["cpu_records"], 2);
    assert!(cpu.status().unwrap()["gpu_worker_pid"].is_null());
    assert!(Verifier::new(VerificationConfig {
        python: "/missing/python".into(),
        ..Default::default()
    })
    .is_err());
}

#[test]
#[ignore = "requires Apple Metal and make mlx-setup"]
fn gpu_hybrid_match_cpu_order_errors_state_and_replay() {
    let mut raw: Vec<_> = (0..4096).map(|i| transfer(i).raw).collect();
    raw[17] = vec![0];
    raw[4095] = raw[0].clone();
    let expected: Vec<_> = raw
        .iter()
        .map(|raw| Transaction::decode(raw, 7777))
        .collect();
    for backend in [Backend::Gpu, Backend::Hybrid] {
        let verifier = Verifier::new(VerificationConfig {
            backend,
            ..Default::default()
        })
        .unwrap();
        for count in [0, 1, 2, 31, 32, 33, 100, 4096] {
            for _ in 0..2 {
                let actual = verifier.decode_batch(&raw[..count], 7777).unwrap();
                for (actual, expected) in actual.into_iter().zip(&expected) {
                    match (actual, expected) {
                        (Ok(a), Ok(b)) => {
                            assert_eq!(a.env, b.env);
                            assert_eq!(a.hash, b.hash);
                        }
                        (Err(_), Err(_)) => (),
                        _ => panic!("CPU/GPU acceptance mismatch"),
                    }
                }
            }
        }
        assert!(verifier
            .decode_batch(&[vec![0], vec![2]], 7777)
            .unwrap()
            .iter()
            .all(Result::is_err));
        assert!(verifier
            .decode_batch(&raw[..2], 1)
            .unwrap()
            .iter()
            .all(Result::is_err));
        let status = verifier.status().unwrap();
        assert!(status["gpu_records"].as_u64().unwrap() > 0);
        assert_eq!(
            status["cpu_records"].as_u64().unwrap() > 0,
            backend == Backend::Hybrid
        );
    }
    let raw: Vec<_> = (0..96).map(|i| transfer(i).raw).collect();
    let dir = tempfile::tempdir().unwrap();
    let mut cpu = Node::open(config(dir.path()), Application::default()).unwrap();
    assert!(cpu.submit_batch(&raw).unwrap().iter().all(Result::is_ok));
    let expected = cpu.produce(genesis().timestamp + 1).unwrap();
    for backend in [Backend::Gpu, Backend::Hybrid] {
        let dir = tempfile::tempdir().unwrap();
        let mut configuration = config(dir.path());
        configuration.verification.backend = backend;
        let mut node = Node::open(configuration.clone(), Application::default()).unwrap();
        assert!(node.submit_batch(&raw).unwrap().iter().all(Result::is_ok));
        assert_eq!(node.produce(genesis().timestamp + 1).unwrap(), expected);
        assert_eq!(node.world().unwrap(), cpu.world().unwrap());
        drop(node);
        let follower_dir = tempfile::tempdir().unwrap();
        configuration.data_dir = follower_dir.path().join("data");
        configuration.sync_peer = Some(sfc::config::SyncPeer {
            transport: sfc::config::Transport::Http3,
            address: "127.0.0.1:26656".parse().unwrap(),
            server_name: "localhost".into(),
            certificate: dir.path().join("unused.der"),
        });
        let mut follower = Node::open(configuration, Application::default()).unwrap();
        follower
            .import(sfc::network::WireBlock {
                chain_id: expected.chain_id,
                height: expected.height,
                timestamp: expected.timestamp,
                parent_hash: expected.parent_hash,
                state_root: expected.state_root,
                transactions: raw.clone(),
            })
            .unwrap();
        assert_eq!(follower.head(), &expected);
        assert_eq!(follower.world().unwrap(), cpu.world().unwrap());
    }
}

#[cfg(unix)]
#[test]
fn gpu_protocol_errors_fail_closed_and_worker_is_replaced() {
    let key = secp256k1::PublicKey::from_secret_key(
        secp256k1::SECP256K1,
        &secp256k1::SecretKey::from_slice(&[1; 32]).unwrap(),
    );
    for response in [
        "{'id': request['id']+1, 'keys': [key]}",
        "{'id': request['id'], 'keys': []}",
        "{'id': request['id'], 'keys': ['04'+'00'*64]}",
    ] {
        let dir = tempfile::tempdir().unwrap();
        let script = dir.path().join("worker.py");
        std::fs::write(&script, format!(
            "import json,sys\nkey='{}'\nprint(json.dumps({{'ready':True,'protocol':1}}),flush=True)\nrequest=json.loads(sys.stdin.readline())\nprint(json.dumps({{'id':request['id'],'keys':[key,None]}}),flush=True)\nfor line in sys.stdin:\n request=json.loads(line)\n print(json.dumps({}),flush=True)\n",
            hex::encode(key.serialize_uncompressed()), response,
        )).unwrap();
        let verifier = Verifier::new(VerificationConfig {
            python: "/usr/bin/python3".into(),
            worker: script,
            timeout_seconds: 2,
            ..Default::default()
        })
        .unwrap();
        for _ in 0..2 {
            assert!(verifier.decode_batch(&[transfer(0).raw], 7777).is_err());
            let status = verifier.status().unwrap();
            assert!(status["gpu_worker_pid"].is_null());
            assert_eq!(status["cpu_records"], 0);
            assert_eq!(status["gpu_records"], 0);
        }
    }
}
