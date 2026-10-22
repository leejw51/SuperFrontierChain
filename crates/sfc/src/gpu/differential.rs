use super::{Keys, RecoveryInput};
pub(super) fn check(mut recover: impl FnMut(&[RecoveryInput]) -> anyhow::Result<Keys>) {
    let secret = secp256k1::SecretKey::from_slice(&[7; 32]).unwrap();
    let mut inputs: Vec<_> = (0u64..4096)
        .map(|i| {
            let digest = crate::types::hash(&i.to_le_bytes());
            let (parity, signature) = secp256k1::SECP256K1
                .sign_ecdsa_recoverable(&secp256k1::Message::from_digest(digest), &secret)
                .serialize_compact();
            RecoveryInput {
                digest,
                signature,
                parity: parity.to_i32() as u8,
            }
        })
        .collect();
    let n: [u8; 32] =
        hex::decode("fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141")
            .unwrap()
            .try_into()
            .unwrap();
    for (i, value) in [[0; 32], n, [255; 32], [1; 32]].into_iter().enumerate() {
        inputs[i].signature[..32].copy_from_slice(&value);
        inputs[i + 4].signature[32..].copy_from_slice(&value);
    }
    inputs[31] = inputs[0].clone();
    inputs[2047] = inputs[3].clone();
    inputs[4095] = inputs[4].clone();
    for _ in 0..2 {
        let expected: Keys = inputs
            .iter()
            .map(|input| input.cpu_recover().ok())
            .collect();
        for count in [
            1, 2, 31, 32, 33, 100, 1024, 2047, 2048, 2049, 2559, 2560, 2561, 4095, 4096,
        ] {
            assert_eq!(
                recover(&inputs[..count]).unwrap(),
                expected[..count],
                "count {count}"
            );
        }
        inputs.reverse();
    }
    let invalid = RecoveryInput {
        digest: [0; 32],
        signature: [0; 64],
        parity: 0,
    };
    assert_eq!(recover(&vec![invalid; 4096]).unwrap(), vec![None; 4096]);
}
