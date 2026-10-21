use serde_json::{json, Value};
use sfc::codec;
use std::collections::HashMap;

#[test]
fn exact_integer_boundaries_and_nested_records_roundtrip() {
    let value = json!({
        "maximum": u64::MAX, "minimum": i64::MIN,
        "nested": [null, true, false, "한글\nquoted\"text", [], {}],
        "real": 0.125, "negativeZero": -0.0,
    });
    let bytes = codec::to_vec(&value).unwrap();
    assert_eq!(codec::from_slice::<Value>(&bytes).unwrap(), value);
    let mut stream = Vec::new();
    for _ in 0..3 {
        codec::write_record(&mut stream, &bytes).unwrap();
    }
    assert_eq!(
        codec::read_all::<Value>(&mut stream.as_slice()).unwrap(),
        vec![value; 3]
    );
}

#[test]
fn canonical_commitment_ignores_map_insertion_order() {
    let mut a = HashMap::new();
    a.insert("z", 9u64);
    a.insert("a", 1);
    let mut b = HashMap::new();
    b.insert("a", 1u64);
    b.insert("z", 9);
    assert_eq!(
        codec::canonical(&serde_json::to_value(&a).unwrap()).unwrap(),
        codec::canonical(&serde_json::to_value(&b).unwrap()).unwrap()
    );
    assert_eq!(
        codec::to_vec(&serde_json::to_value(&a).unwrap()).unwrap(),
        codec::to_vec(&serde_json::to_value(&b).unwrap()).unwrap()
    );
    b.insert("z", 10);
    assert_ne!(
        codec::canonical(&serde_json::to_value(&a).unwrap()).unwrap(),
        codec::canonical(&serde_json::to_value(&b).unwrap()).unwrap()
    );
}

#[test]
fn malformed_truncated_oversized_and_duplicate_records_are_rejected() {
    let bytes = codec::to_vec(&json!({"height": 1})).unwrap();
    for end in 0..bytes.len() {
        assert!(codec::from_slice::<Value>(&bytes[..end]).is_err());
    }
    let mut trailing = bytes.clone();
    trailing.extend_from_slice(&[0; 8]);
    assert!(codec::from_slice::<Value>(&trailing).is_err());
    for size in [0u64, u64::MAX, codec::MAX_RECORD_BYTES as u64 + 1] {
        assert!(codec::read_record(&mut size.to_le_bytes().as_slice()).is_err());
    }
    let mut framed = Vec::new();
    codec::write_record(&mut framed, &bytes).unwrap();
    for end in 1..framed.len() {
        assert!(codec::read_record(&mut &framed[..end]).is_err());
    }
    let mut message = capnp::message::Builder::new_default();
    let mut fields = message
        .init_root::<sfc::runtime_capnp::value::Builder>()
        .init_object(2);
    for i in 0..2 {
        let mut field = fields.reborrow().get(i);
        field.set_key("duplicate");
        field.init_value().set_null(());
    }
    assert!(
        codec::from_slice::<Value>(&capnp::serialize::write_message_to_words(&message)).is_err()
    );
}
