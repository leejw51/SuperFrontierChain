//! Shared RocksDB write-ahead journal policy for chain state and signing records.
use rocksdb::{DBRecoveryMode, Options, WriteOptions};

pub(crate) fn database_options() -> Options {
    let mut options = Options::default();
    options.create_if_missing(true);
    options.set_manual_wal_flush(false);
    options.set_paranoid_checks(true);
    // Never silently fall back to an older chain head or forget an acknowledged vote.
    // A torn/corrupt WAL requires operator recovery rather than automatic record skipping.
    options.set_wal_recovery_mode(DBRecoveryMode::AbsoluteConsistency);
    options
}

pub(crate) fn durable_write_options() -> WriteOptions {
    let mut options = WriteOptions::default();
    options.disable_wal(false);
    options.set_sync(true);
    options
}
