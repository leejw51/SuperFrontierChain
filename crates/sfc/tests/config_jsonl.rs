mod common;
use sfc::config::{self, Retention};

#[test]
fn jsonl_roundtrip_edit_seconds_and_reject_bad_settings() {
    let dir = tempfile::tempdir().unwrap();
    let mut config = common::config(dir.path());
    assert!(matches!(
        Retention::default(),
        Retention::Pruned { seconds: 60 }
    ));
    config.retention = Retention::Pruned { seconds: 7 };
    let path = dir.path().join("config.jsonl");
    config::save(&path, &config).unwrap();
    let bytes = std::fs::read(&path).unwrap();
    assert!(std::str::from_utf8(&bytes)
        .unwrap()
        .lines()
        .all(|s| serde_json::from_str::<serde_json::Value>(s).is_ok()));
    assert!(matches!(
        config::load(&path).unwrap().retention,
        Retention::Pruned { seconds: 7 }
    ));
    let mut duplicate = bytes.clone();
    duplicate.extend_from_slice(b"{\"retention\":{\"mode\":\"pruned\",\"seconds\":2}}\n");
    assert!(config::decode_jsonl(&duplicate).is_err());
    config.retention = Retention::Pruned { seconds: 0 };
    assert!(config::save(&path, &config).is_err());
    assert_eq!(std::fs::read(&path).unwrap(), bytes);
    assert!(config::decode_jsonl(b"{not json}\n").is_err());
}
#[test]
fn legacy_config_is_preserved_during_jsonl_migration() {
    let dir = tempfile::tempdir().unwrap();
    let config = common::config(dir.path());
    let old = dir.path().join("config.capnp");
    let bytes = sfc::codec::to_vec(&config).unwrap();
    std::fs::write(&old, &bytes).unwrap();
    let new = old.with_extension("jsonl");
    let loaded = config::load(&new).unwrap();
    config::save(&new, &loaded).unwrap();
    assert_eq!(std::fs::read(old).unwrap(), bytes);
    assert_eq!(config::load(&new).unwrap().data_dir, config.data_dir);
}
