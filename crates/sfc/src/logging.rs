//! Cap’n Proto structured events; human-readable stderr diagnostics.
use serde_json::{json, Value};
use std::{
    fs::{File, OpenOptions},
    io::{Seek, SeekFrom, Write},
    path::Path,
    sync::{Mutex, OnceLock},
    time::{SystemTime, UNIX_EPOCH},
};

static FILE: OnceLock<Mutex<File>> = OnceLock::new();

pub fn initialize(data: &Path) -> anyhow::Result<()> {
    std::fs::create_dir_all(data.join("logs"))?;
    let mut file = OpenOptions::new()
        .create(true)
        .read(true)
        .append(true)
        .open(data.join("logs/node.capnp"))?;
    repair_tail(&mut file)?;
    FILE.set(Mutex::new(file))
        .map_err(|_| anyhow::anyhow!("logging already initialized"))?;
    Ok(())
}

// A killed writer may leave a partial frame. Preserve complete records.
fn repair_tail(file: &mut File) -> anyhow::Result<()> {
    file.seek(SeekFrom::Start(0))?;
    let mut end = 0;
    loop {
        match crate::codec::read_record(file) {
            Ok(Some(bytes)) => {
                let _: Value = crate::codec::from_slice(&bytes)?;
                end = file.stream_position()?;
            }
            Ok(None) => break,
            Err(error)
                if error
                    .downcast_ref::<std::io::Error>()
                    .is_some_and(|e| e.kind() == std::io::ErrorKind::UnexpectedEof) =>
            {
                file.set_len(end)?;
                break;
            }
            Err(error) => return Err(error),
        }
    }
    Ok(())
}

fn record(level: &str, event: &str, fields: Value) -> Value {
    json!({"timestamp_ms":SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis(),
        "level":level,"event":event,"pid":std::process::id(),"fields":fields})
}

pub fn event(level: &str, name: &str, fields: Value) {
    let record = record(level, name, fields);
    let _ = writeln!(
        std::io::stderr().lock(),
        "[{level}] {name} {:?}",
        record["fields"]
    );
    if let Some(file) = FILE.get() {
        if let Ok(mut file) = file.lock() {
            if let Err(error) = crate::codec::to_vec(&record)
                .and_then(|bytes| crate::codec::write_record(&mut *file, &bytes))
            {
                eprintln!("structured log write failed: {error}");
            }
        }
    }
}

pub fn install_panic_hook() {
    std::panic::set_hook(Box::new(|info| {
        // Do not log panic payloads, which can contain arbitrary input or secrets.
        event(
            "error",
            "panic",
            json!({"location":info.location().map(|l|format!("{}:{}",l.file(),l.line()))}),
        );
    }));
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn crash_tail_preserves_complete_records() {
        let mut file = tempfile::tempfile().unwrap();
        crate::codec::write_record(&mut file, &crate::codec::to_vec(&json!({"ok":1})).unwrap())
            .unwrap();
        file.write_all(&[32, 0, 0]).unwrap();
        repair_tail(&mut file).unwrap();
        file.rewind().unwrap();
        let records: Vec<Value> = crate::codec::read_all(&mut file).unwrap();
        assert_eq!(records, vec![json!({"ok":1})]);
    }
    #[test]
    fn multiline_fields_roundtrip_in_binary_record() {
        let value = record(
            "warn",
            "sync_retry",
            json!({"message":"first\nsecond\"quoted"}),
        );
        let encoded = crate::codec::to_vec(&value).unwrap();
        let parsed: Value = crate::codec::from_slice(&encoded).unwrap();
        assert_eq!(parsed["fields"]["message"], "first\nsecond\"quoted");
        assert_eq!(parsed["event"], "sync_retry");
        assert!(parsed["timestamp_ms"].as_u64().unwrap() > 0);
    }
}
