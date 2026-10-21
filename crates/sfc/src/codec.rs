//! Bounded Cap'n Proto records. Domain types implement explicit typed codecs;
//! dynamic presentation values are encoded directly without a serde round trip.
use crate::runtime_capnp::value;
use anyhow::{ensure, Result};
use serde_json::Value;
use std::io::{Read, Write};

pub const PROTOCOL_VERSION: u32 = 3;
pub const MAX_RECORD_BYTES: usize = 256 * 1024 * 1024;

fn fill(mut out: value::Builder<'_>, input: &Value) -> Result<()> {
    match input {
        Value::Null => out.set_null(()),
        Value::Bool(v) => out.set_boolean(*v),
        Value::Number(v) => {
            if let Some(n) = v.as_u64() {
                out.set_unsigned(n);
            } else if let Some(n) = v.as_i64() {
                out.set_signed(n);
            } else {
                out.set_real(
                    v.as_f64()
                        .ok_or_else(|| anyhow::anyhow!("invalid number"))?,
                );
            }
        }
        Value::String(v) => out.set_text(v.as_str()),
        Value::Array(values) => {
            let mut list = out.init_list(values.len().try_into()?);
            for (i, v) in values.iter().enumerate() {
                fill(list.reborrow().get(i as u32), v)?;
            }
        }
        Value::Object(values) => {
            let sorted: std::collections::BTreeMap<_, _> = values.iter().collect();
            let mut list = out.init_object(sorted.len().try_into()?);
            for (i, (key, v)) in sorted.into_iter().enumerate() {
                let mut field = list.reborrow().get(i as u32);
                field.set_key(key.as_str());
                fill(field.init_value(), v)?;
            }
        }
    }
    Ok(())
}

fn read(input: value::Reader<'_>, depth: usize) -> Result<Value> {
    ensure!(depth < 64, "Cap'n Proto nesting limit exceeded");
    Ok(match input.which()? {
        value::Null(()) => Value::Null,
        value::Boolean(v) => v.into(),
        value::Unsigned(v) => v.into(),
        value::Signed(v) => v.into(),
        value::Real(v) => {
            ensure!(v.is_finite(), "non-finite number");
            Value::from(v)
        }
        value::Text(v) => v?.to_str()?.into(),
        value::List(values) => Value::Array(
            values?
                .iter()
                .map(|v| read(v, depth + 1))
                .collect::<Result<_>>()?,
        ),
        value::Object(values) => {
            let mut map = serde_json::Map::new();
            for field in values? {
                let key = field.get_key()?.to_str()?.to_owned();
                ensure!(!map.contains_key(&key), "duplicate object key");
                map.insert(key, read(field.get_value()?, depth + 1)?);
            }
            Value::Object(map)
        }
    })
}
pub trait Record: Sized {
    fn encode(&self) -> Result<Vec<u8>>;
    fn decode(bytes: &[u8]) -> Result<Self>;
}
pub fn to_vec(input: &impl Record) -> Result<Vec<u8>> {
    input.encode()
}
pub fn from_slice<T: Record>(bytes: &[u8]) -> Result<T> {
    T::decode(bytes)
}
pub(crate) fn message_reader(
    bytes: &[u8],
) -> Result<capnp::message::Reader<capnp::serialize::BufferSegments<&[u8]>>> {
    ensure!(bytes.len() <= MAX_RECORD_BYTES, "record too large");
    let mut remaining = bytes;
    let message = capnp::serialize::read_message_from_flat_slice(
        &mut remaining,
        capnp::message::ReaderOptions {
            traversal_limit_in_words: Some(MAX_RECORD_BYTES / 8),
            nesting_limit: 64,
        },
    )?;
    ensure!(remaining.is_empty(), "trailing Cap'n Proto data");
    Ok(message)
}
impl Record for Value {
    fn encode(&self) -> Result<Vec<u8>> {
        let mut message = capnp::message::Builder::new_default();
        fill(message.init_root::<value::Builder>(), self)?;
        let bytes = capnp::serialize::write_message_to_words(&message);
        ensure!(bytes.len() <= MAX_RECORD_BYTES, "record too large");
        Ok(bytes)
    }
    fn decode(bytes: &[u8]) -> Result<Self> {
        read(message_reader(bytes)?.get_root::<value::Reader>()?, 0)
    }
}
pub fn canonical(input: &Value) -> Result<Vec<u8>> {
    let mut message = capnp::message::Builder::new_default();
    fill(message.init_root::<value::Builder>(), input)?;
    let reader = message.get_root_as_reader::<capnp::any_pointer::Reader>()?;
    let mut output = capnp::message::Builder::new(
        capnp::message::HeapAllocator::new()
            .first_segment_words((reader.target_size()?.word_count + 1).try_into()?),
    );
    output.set_root_canonical(reader)?;
    Ok(output.get_segments_for_output()[0].to_vec())
}
/// A bounded 64-bit little-endian length precedes each standard Cap'n Proto message.
pub fn write_record(writer: &mut impl Write, bytes: &[u8]) -> Result<()> {
    ensure!(bytes.len() <= MAX_RECORD_BYTES, "record too large");
    writer.write_all(&(bytes.len() as u64).to_le_bytes())?;
    writer.write_all(bytes)?;
    Ok(())
}
pub fn read_record(reader: &mut impl Read) -> Result<Option<Vec<u8>>> {
    let mut length = [0u8; 8];
    if reader.read(&mut length[..1])? == 0 {
        return Ok(None);
    }
    reader.read_exact(&mut length[1..])?;
    let size = usize::try_from(u64::from_le_bytes(length))?;
    ensure!(
        size > 0 && size <= MAX_RECORD_BYTES,
        "invalid record length"
    );
    let mut bytes = vec![0; size];
    reader.read_exact(&mut bytes)?;
    Ok(Some(bytes))
}

pub fn read_all<T: Record>(reader: &mut impl Read) -> Result<Vec<T>> {
    let mut records = Vec::new();
    while let Some(bytes) = read_record(reader)? {
        records.push(from_slice(&bytes)?);
    }
    Ok(records)
}

/// Atomically upgrade a compatible configuration record before starting a node.
/// Encoding-only upgrades preserve all semantic values and consensus commitments.
pub fn upgrade_file<T: Record>(path: &std::path::Path) -> Result<T> {
    let old = std::fs::read(path)?;
    let value = T::decode(&old)?;
    let encoded = value.encode()?;
    if encoded != old {
        static TEMP_ID: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
        let (temporary, mut file) = loop {
            let id = TEMP_ID.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
            let temporary =
                path.with_extension(format!("capnp-upgrade-{}-{id}.tmp", std::process::id()));
            match std::fs::OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&temporary)
            {
                Ok(file) => break (temporary, file),
                Err(error) if error.kind() == std::io::ErrorKind::AlreadyExists => continue,
                Err(error) => return Err(error.into()),
            }
        };
        let result = (|| -> Result<()> {
            file.set_permissions(std::fs::metadata(path)?.permissions())?;
            file.write_all(&encoded)?;
            file.sync_all()?;
            std::fs::rename(&temporary, path)?;
            let parent = path
                .parent()
                .filter(|p| !p.as_os_str().is_empty())
                .unwrap_or(std::path::Path::new("."));
            std::fs::File::open(parent)?.sync_all()?;
            Ok(())
        })();
        if result.is_err() {
            let _ = std::fs::remove_file(&temporary);
        }
        result?;
    }
    Ok(value)
}
