use ed25519_dalek::SigningKey;
use sfc::consensus::{DurableSigner, Phase, RoundLock, ValidatorSet, VoteSet};
use tempfile::tempdir;
#[test]
fn strict_quorum_duplicates_forgery_and_locking() {
    let dirs: Vec<_> = (0..4).map(|_| tempdir().unwrap()).collect();
    let keys: Vec<_> = (1..=4).map(|i| SigningKey::from_bytes(&[i; 32])).collect();
    let validators = ValidatorSet::new(
        keys.iter()
            .map(|k| (k.verifying_key().to_bytes(), 1))
            .collect(),
    )
    .unwrap();
    let mut signers: Vec<_> = keys
        .into_iter()
        .zip(&dirs)
        .map(|(k, d)| DurableSigner::open(d.path(), 7777, k).unwrap())
        .collect();
    let mut votes = VoteSet::new(7777, 1, 0, Phase::Prevote, validators.clone());
    let first = signers[0]
        .sign(1, 0, Phase::Prevote, Some([1; 32]))
        .unwrap();
    votes.insert(first.clone()).unwrap();
    votes.insert(first.clone()).unwrap();
    let mut forged = first.clone();
    forged.block = Some([2; 32]);
    assert!(votes.insert(forged).is_err());
    votes
        .insert(
            signers[1]
                .sign(1, 0, Phase::Prevote, Some([1; 32]))
                .unwrap(),
        )
        .unwrap();
    assert!(votes.certificate(Some([1; 32])).is_err());
    votes
        .insert(
            signers[2]
                .sign(1, 0, Phase::Prevote, Some([1; 32]))
                .unwrap(),
        )
        .unwrap();
    let certificate = votes.certificate(Some([1; 32])).unwrap();
    let mut lock = RoundLock::new(7777, 1);
    lock.apply_prevote_certificate(&validators, 0, Some([1; 32]), &certificate)
        .unwrap();
    assert_eq!(lock.prevote([2; 32]), [1; 32]);
    assert!(lock
        .verify_commit(&validators, 0, [1; 32], &certificate)
        .is_err());
    assert!(validators
        .verify_certificate(
            &[first.clone(), first],
            7777,
            1,
            0,
            Phase::Prevote,
            Some([1; 32])
        )
        .is_err());
    let commits = signers
        .iter_mut()
        .take(3)
        .map(|s| s.sign(1, 0, Phase::Precommit, Some([1; 32])).unwrap())
        .collect::<Vec<_>>();
    lock.verify_commit(&validators, 0, [1; 32], &commits)
        .unwrap();
}
#[test]
fn signing_guard_survives_restart() {
    let dir = tempdir().unwrap();
    let key = SigningKey::from_bytes(&[1; 32]);
    let mut signer = DurableSigner::open(dir.path(), 7777, key.clone()).unwrap();
    let vote = signer.sign(2, 1, Phase::Precommit, Some([1; 32])).unwrap();
    drop(signer);
    let mut signer = DurableSigner::open(dir.path(), 7777, key).unwrap();
    assert_eq!(
        signer.sign(2, 1, Phase::Precommit, Some([1; 32])).unwrap(),
        vote
    );
    assert!(signer.sign(2, 1, Phase::Precommit, Some([2; 32])).is_err());
    assert!(signer.sign(1, 2, Phase::Prevote, None).is_err());
}
#[test]
fn weighted_quorum_is_not_validator_count() {
    let dirs: Vec<_> = (0..3).map(|_| tempdir().unwrap()).collect();
    let keys: Vec<_> = (1..=3).map(|i| SigningKey::from_bytes(&[i; 32])).collect();
    let validators = ValidatorSet::new(
        keys.iter()
            .zip([4, 1, 1])
            .map(|(k, w)| (k.verifying_key().to_bytes(), w))
            .collect(),
    )
    .unwrap();
    let votes: Vec<_> = keys
        .into_iter()
        .zip(&dirs)
        .map(|(k, d)| {
            DurableSigner::open(d.path(), 7, k)
                .unwrap()
                .sign(1, 0, Phase::Precommit, Some([0; 32]))
                .unwrap()
        })
        .collect();
    assert!(validators
        .verify_certificate(&votes[..1], 7, 1, 0, Phase::Precommit, Some([0; 32]))
        .is_err()); // exactly 2/3
    validators
        .verify_certificate(&votes[..2], 7, 1, 0, Phase::Precommit, Some([0; 32]))
        .unwrap();
}

#[test]
fn nil_certificate_keeps_round_guard_across_serialization() {
    use ed25519_dalek::Signer;
    use sfc::consensus::Vote;
    let key = SigningKey::from_bytes(&[1; 32]);
    let validators = ValidatorSet::new(vec![(key.verifying_key().to_bytes(), 1)]).unwrap();
    let certificate = |round, block| {
        let mut vote = Vote {
            chain_id: 7,
            height: 1,
            round,
            phase: Phase::Prevote,
            block,
            validator: key.verifying_key().to_bytes(),
            signature: vec![],
        };
        vote.signature = key.sign(&vote.sign_bytes()).to_bytes().to_vec();
        vec![vote]
    };
    let mut lock = RoundLock::new(7, 1);
    lock.apply_prevote_certificate(
        &validators,
        5,
        Some([1; 32]),
        &certificate(5, Some([1; 32])),
    )
    .unwrap();
    lock.apply_prevote_certificate(&validators, 6, None, &certificate(6, None))
        .unwrap();
    let encoded = sfc::codec::to_vec(&lock).unwrap();
    let mut lock: RoundLock = sfc::codec::from_slice(&encoded).unwrap();
    assert!(lock
        .apply_prevote_certificate(
            &validators,
            0,
            Some([2; 32]),
            &certificate(0, Some([2; 32]))
        )
        .is_err());
    assert!(lock
        .apply_prevote_certificate(
            &validators,
            6,
            Some([2; 32]),
            &certificate(6, Some([2; 32]))
        )
        .is_err());
    lock.apply_prevote_certificate(&validators, 6, None, &certificate(6, None))
        .unwrap();
    lock.apply_prevote_certificate(
        &validators,
        7,
        Some([3; 32]),
        &certificate(7, Some([3; 32])),
    )
    .unwrap();
    assert_eq!(lock.prevote([4; 32]), [3; 32]);
    let mut legacy = serde_json::to_value(&lock).unwrap();
    legacy.as_object_mut().unwrap().remove("certificate_round");
    assert!(serde_json::from_value::<RoundLock>(legacy).is_err());
}
