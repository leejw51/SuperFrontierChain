//! One structured JSON object per stderr line. No transaction bodies or keys.
use serde_json::{json, Value};
use std::{
    fs::{File, OpenOptions},
    io::{Read, Seek, SeekFrom, Write},
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
        .open(data.join("logs/node.jsonl"))?;
    repair_tail(&mut file)?;
    FILE.set(Mutex::new(file))
        .map_err(|_| anyhow::anyhow!("logging already initialized"))?;
    Ok(())
}

// A killed writer may leave a partial JSON record. Preserve every complete line
// before appending; otherwise the first new record would join the torn tail.
fn repair_tail(file: &mut File) -> std::io::Result<()> {
    let length = file.metadata()?.len();
    let mut cursor = length;
    let mut buffer = [0u8; 4096];
    while cursor > 0 {
        let start = cursor.saturating_sub(buffer.len() as u64);
        let size = (cursor - start) as usize;
        file.seek(SeekFrom::Start(start))?;
        file.read_exact(&mut buffer[..size])?;
        if let Some(index) = buffer[..size].iter().rposition(|&byte| byte == b'\n') {
            let end = start + index as u64 + 1;
            if end != length {
                file.set_len(end)?;
            }
            return Ok(());
        }
        cursor = start;
    }
    file.set_len(0)
}

fn record(level: &str, event: &str, fields: Value) -> Value {
    json!({"timestamp_ms":SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis(),
        "level":level,"event":event,"pid":std::process::id(),"fields":fields})
}

pub fn event(level: &str, name: &str, fields: Value) {
    if let Ok(mut bytes) = serde_json::to_vec(&record(level, name, fields)) {
        bytes.push(b'\n');
        // Hold stderr's lock across the entire record to avoid interleaving threads.
        let _ = std::io::stderr().lock().write_all(&bytes);
        if let Some(file) = FILE.get() {
            if let Ok(mut file) = file.lock() {
                if let Err(error) = file.write_all(&bytes) {
                    eprintln!("structured log write failed: {error}");
                }
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
        file.write_all(b"{\"ok\":1}\n{\"torn\":").unwrap();
        repair_tail(&mut file).unwrap();
        file.rewind().unwrap();
        let mut text = String::new();
        file.read_to_string(&mut text).unwrap();
        assert_eq!(text, "{\"ok\":1}\n");
    }
    #[test]
    fn multiline_fields_remain_one_json_line() {
        let value = record(
            "warn",
            "sync_retry",
            json!({"message":"first\nsecond\"quoted"}),
        );
        let encoded = serde_json::to_string(&value).unwrap();
        assert!(!encoded.contains('\n'));
        let parsed: Value = serde_json::from_str(&encoded).unwrap();
        assert_eq!(parsed["fields"]["message"], "first\nsecond\"quoted");
        assert_eq!(parsed["event"], "sync_retry");
        assert!(parsed["timestamp_ms"].as_u64().unwrap() > 0);
    }
}
