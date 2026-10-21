//! Cross-language compatibility fixture. Stdout contains one Cap'n Proto message.
use anyhow::Result;
use serde_json::{json, Value};
use std::io::Write;

fn main() -> Result<()> {
    let args: Vec<_> = std::env::args().collect();
    if args
        .get(1)
        .is_some_and(|v| v == "--config" || v == "--genesis")
    {
        let bytes = std::fs::read(
            args.get(2)
                .ok_or_else(|| anyhow::anyhow!("missing typed path"))?,
        )?;
        let encoded = if args[1] == "--config" {
            sfc::codec::to_vec(&sfc::codec::from_slice::<sfc::config::Config>(&bytes)?)?
        } else {
            sfc::codec::to_vec(&sfc::codec::from_slice::<sfc::types::Genesis>(&bytes)?)?
        };
        std::io::stdout().write_all(&encoded)?;
        return Ok(());
    }
    let value: Value = if let Some(path) = std::env::args().nth(1) {
        sfc::codec::from_slice(&std::fs::read(path)?)?
    } else {
        json!({"max":u64::MAX, "min":i64::MIN, "real":0.125,
            "nested":[null,true,false,"SF CHAIN 한글\n",[],{}],
            "records":(0..2048u32).collect::<Vec<_>>()})
    };
    std::io::stdout().write_all(&sfc::codec::to_vec(&value)?)?;
    Ok(())
}
