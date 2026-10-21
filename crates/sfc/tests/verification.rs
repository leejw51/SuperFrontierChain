mod common;
use common::*;
use sfc::{
    ethereum::Transaction,
    framework::Application,
    node::Node,
    verification::{Backend, GpuRuntime, VerificationConfig, Verifier},
};

#[test]
fn defaults_gpu_and_explicit_cpu_needs_no_python() {
    assert_eq!(VerificationConfig::default().backend, Backend::Gpu);
    assert_eq!(
        VerificationConfig::default().gpu_runtime,
        GpuRuntime::MlxNative
    );
    for runtime in [GpuRuntime::Metal, GpuRuntime::MlxNative] {
        let dir = tempfile::tempdir().unwrap();
        let mut configuration = config(dir.path());
        configuration.verification.gpu_runtime = runtime;
        let bytes = sfc::codec::to_vec(&configuration).unwrap();
        let decoded: sfc::config::Config = sfc::codec::from_slice(&bytes).unwrap();
        assert_eq!(decoded.verification.gpu_runtime, runtime);
    }
    assert_eq!(
        serde_json::from_value::<VerificationConfig>(serde_json::json!({}))
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
    let raw = vec![transfer(0).raw, vec![0].into(), transfer(1).raw];
    let decoded = cpu.decode_batch(&raw, 7777).unwrap();
    assert!(decoded[0].is_ok() && decoded[1].is_err() && decoded[2].is_ok());
    assert_eq!(cpu.status().unwrap()["cpu_records"], 2);
    assert!(cpu.status().unwrap()["gpu_worker_pid"].is_null());
}

#[test]
#[ignore = "requires Apple Metal; native Rust runtime, no Python"]
fn gpu_hybrid_match_cpu_order_errors_state_and_replay() {
    let mut raw: Vec<_> = (0..4096).map(|i| transfer(i).raw).collect();
    raw[17] = vec![0].into();
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
        follower.import_encoded(expected.clone()).unwrap();
        assert_eq!(follower.head(), &expected);
        assert_eq!(follower.world().unwrap(), cpu.world().unwrap());
    }
}

#[test]
fn legacy_python_runtime_migrates_to_native_without_executing_paths() {
    use sfc::{codec, config::Config, runtime_capnp as wire};
    let dir = tempfile::tempdir().unwrap();
    let mut config = config(dir.path());
    config.verification.python = "/must/not/execute/python".into();
    config.verification.worker = "/must/not/execute/worker.py".into();
    let bytes = codec::to_vec(&config).unwrap();
    let mut slice = bytes.as_slice();
    let reader =
        capnp::serialize::read_message_from_flat_slice(&mut slice, Default::default()).unwrap();
    let mut message = capnp::message::Builder::new_default();
    message
        .set_root(reader.get_root::<wire::record::Reader>().unwrap())
        .unwrap();
    let wire::record::Which::Config(config_builder) = message
        .get_root::<wire::record::Builder>()
        .unwrap()
        .which()
        .unwrap()
    else {
        panic!("expected config");
    };
    config_builder
        .unwrap()
        .get_verification()
        .unwrap()
        .set_gpu_runtime(wire::GpuRuntime::Mlx);
    let path = dir.path().join("legacy.capnp");
    let old = capnp::serialize::write_message_to_words(&message);
    std::fs::write(&path, &old).unwrap();
    let upgraded: Config = codec::upgrade_file(&path).unwrap();
    assert_eq!(upgraded.verification.gpu_runtime, GpuRuntime::MlxNative);
    assert_eq!(upgraded.verification.python, config.verification.python);
    assert_ne!(std::fs::read(&path).unwrap(), old);
    let status = Verifier::new(upgraded.verification)
        .unwrap()
        .status()
        .unwrap();
    assert!(status["gpu_worker_pid"].is_null());
    assert_eq!(status["gpu_runtime"], "mlx-native");
    let legacy: VerificationConfig =
        serde_json::from_value(serde_json::json!({"gpu_runtime":"mlx"})).unwrap();
    assert_eq!(legacy.gpu_runtime, GpuRuntime::MlxNative);
    use clap::ValueEnum;
    assert_eq!(
        GpuRuntime::from_str("mlx", false).unwrap(),
        GpuRuntime::MlxNative
    );
}
