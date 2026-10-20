use crate::{
    ethereum::{self, Transaction},
    node::Node,
    types::{hex_hash, Block},
};
use anyhow::{bail, ensure, Context, Result};
use axum::{
    body::Bytes,
    extract::{DefaultBodyLimit, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use revm::primitives::{Address, TxEnv, TxKind, U256};
use serde_json::{json, Value};
use std::sync::{Arc, Mutex};

pub fn router(node: Arc<Mutex<Node>>) -> Router {
    Router::new()
        .route("/", post(handle))
        .route(
            "/dashboard",
            get(|| async { axum::response::Html(include_str!("../static/dashboard.html")) }),
        )
        .route("/dashboard/stats", get(dashboard_stats))
        .route("/dashboard/index", get(dashboard_index))
        .route("/dashboard/assets/{name}", get(dashboard_asset))
        .layer(DefaultBodyLimit::max(5 * 1024 * 1024))
        .with_state(node)
}

async fn dashboard_asset(axum::extract::Path(name): axum::extract::Path<String>) -> Response {
    let (content_type, bytes): (&str, &'static [u8]) = match name.as_str() {
        "dashboard.js" => (
            "text/javascript; charset=utf-8",
            include_bytes!("../static/dashboard.js"),
        ),
        "dashboard.css" => (
            "text/css; charset=utf-8",
            include_bytes!("../static/dashboard.css"),
        ),
        "frontier-orbit.png" => ("image/png", include_bytes!("../static/frontier-orbit.png")),
        "dashboard.js.LEGAL.txt" => (
            "text/plain; charset=utf-8",
            include_bytes!("../static/dashboard.js.LEGAL.txt"),
        ),
        _ => return StatusCode::NOT_FOUND.into_response(),
    };
    (
        [
            (axum::http::header::CONTENT_TYPE, content_type),
            (axum::http::header::CACHE_CONTROL, "no-cache"),
        ],
        bytes,
    )
        .into_response()
}
fn error(id: Value, code: i64, message: impl ToString) -> Value {
    json!({"jsonrpc":"2.0", "id":id, "error":{"code":code, "message":message.to_string()}})
}
async fn handle(State(node): State<Arc<Mutex<Node>>>, body: Bytes) -> Response {
    let request: Value = match serde_json::from_slice(&body) {
        Ok(value) => value,
        Err(_) => return Json(error(Value::Null, -32700, "parse error")).into_response(),
    };
    match tokio::task::spawn_blocking(move || {
        if let Some(batch) = request.as_array() {
            if batch.is_empty() || batch.len() > crate::types::MAX_BLOCK_TRANSACTIONS {
                return Some(error(
                    Value::Null,
                    -32600,
                    "batch must contain 1..4096 requests",
                ));
            }
            let (chain_id, accepts_transactions, verifier) = match node.lock() {
                Ok(node) => (
                    node.genesis.chain_id,
                    node.config.sync_peer.is_none(),
                    node.verifier.clone(),
                ),
                Err(_) => return Some(error(Value::Null, -32603, "node unavailable")),
            };
            // Authenticate outside the node mutex, then admit in original request order.
            let raw: Vec<_> = batch
                .iter()
                .map(|item| {
                    (valid_request(item)
                        && item["method"] == "eth_sendRawTransaction"
                        && item.get("params").is_none_or(Value::is_array))
                    .then(|| {
                        let raw = data(text(&item["params"], 0).unwrap_or(""))?;
                        ensure!(
                            raw.len() <= crate::types::MAX_TX_BYTES,
                            "invalid transaction size"
                        );
                        Ok(raw)
                    })
                })
                .collect();
            let bytes: Vec<_> = raw
                .iter()
                .filter_map(|item| item.as_ref()?.as_ref().ok())
                .collect();
            let decoded = if accepts_transactions {
                verifier.decode_batch(&bytes, chain_id)
            } else {
                Err(anyhow::anyhow!(
                    "follower is read-only; submit to the sequencer"
                ))
            };
            let mut decoded = match decoded {
                Ok(decoded) => decoded.into_iter(),
                Err(err) => (0..bytes.len())
                    .map(|_| Err(anyhow::anyhow!(err.to_string())))
                    .collect::<Vec<_>>()
                    .into_iter(),
            };
            let prepared: Vec<_> = raw
                .into_iter()
                .map(|item| {
                    item.map(|raw| {
                        raw.and_then(|_| decoded.next().expect("one result per valid input"))
                    })
                })
                .collect();
            // Pure submission batches share one EVM handler. Mixed/malformed requests
            // retain dispatch order and the normal JSON-RPC validation path.
            if accepts_transactions
                && batch.iter().all(|item| {
                    valid_request(item)
                        && item["method"] == "eth_sendRawTransaction"
                        && item.get("params").is_none_or(Value::is_array)
                })
            {
                let admitted = match node.lock() {
                    Ok(mut node) => node
                        .submit_decoded_batch(prepared.into_iter().map(Option::unwrap).collect())
                        .map_err(|err| (-32000, err.to_string())),
                    Err(_) => Err((-32603, "node unavailable".into())),
                };
                let results: Vec<_> = match admitted {
                    Ok(results) => results
                        .into_iter()
                        .map(|result| result.map_err(|err| (-32000, err.to_string())))
                        .collect(),
                    Err(err) => vec![Err(err); batch.len()],
                };
                let replies: Vec<_> = batch
                    .iter()
                    .zip(results)
                    .filter_map(|(item, result)| {
                        let id = item.get("id")?.clone();
                        Some(match result {
                            Ok(hash) => json!({"jsonrpc":"2.0", "id":id, "result":hex_hash(&hash)}),
                            Err((code, message)) => error(id, code, message),
                        })
                    })
                    .collect();
                return (!replies.is_empty()).then_some(Value::Array(replies));
            }
            let replies: Vec<Value> = batch
                .iter()
                .zip(prepared)
                .filter_map(|(item, tx)| dispatch_prepared(&node, item, tx))
                .collect();
            if replies.is_empty() {
                None
            } else {
                Some(Value::Array(replies))
            }
        } else {
            dispatch(&node, &request)
        }
    })
    .await
    {
        Ok(Some(reply)) => Json(reply).into_response(),
        Ok(None) => StatusCode::NO_CONTENT.into_response(),
        Err(_) => Json(error(Value::Null, -32603, "internal error")).into_response(),
    }
}
fn dispatch(node: &Arc<Mutex<Node>>, request: &Value) -> Option<Value> {
    dispatch_prepared(node, request, None)
}
fn valid_request(request: &Value) -> bool {
    request.is_object()
        && request.get("jsonrpc") == Some(&json!("2.0"))
        && request.get("method").and_then(Value::as_str).is_some()
        && request
            .get("id")
            .is_none_or(|id| id.is_null() || id.is_string() || id.is_number())
}
fn dispatch_prepared(
    node: &Arc<Mutex<Node>>,
    request: &Value,
    prepared: Option<Result<Transaction>>,
) -> Option<Value> {
    let id = request.get("id").cloned().unwrap_or(Value::Null);
    if !valid_request(request) {
        return Some(error(Value::Null, -32600, "invalid request"));
    }
    let notification = request.get("id").is_none();
    let response = if request.get("params").is_some_and(|p| !p.is_array()) {
        error(id.clone(), -32602, "params must be an array")
    } else {
        let params = request.get("params").cloned().unwrap_or(json!([]));
        match node.lock() {
            Ok(mut node) => match match prepared {
                Some(tx) => tx
                    .and_then(|tx| node.submit_verified(tx))
                    .map(|hash| json!(hex_hash(&hash))),
                None => call(&mut node, request["method"].as_str().unwrap(), &params),
            } {
                Ok(result) => json!({"jsonrpc":"2.0", "id":id, "result":result}),
                Err(err) => {
                    let code = if err.to_string() == "method not found" {
                        -32601
                    } else {
                        -32000
                    };
                    error(id, code, err)
                }
            },
            Err(_) => error(id, -32603, "node unavailable"),
        }
    };
    if notification {
        None
    } else {
        Some(response)
    }
}
fn text(params: &Value, index: usize) -> Result<&str> {
    params[index].as_str().context("missing string parameter")
}
fn quantity(value: &str) -> Result<U256> {
    ensure!(
        value.starts_with("0x") && value.len() > 2,
        "quantity requires 0x prefix"
    );
    ensure!(
        value == "0x0" || !value.starts_with("0x0"),
        "quantity has leading zero"
    );
    Ok(U256::from_str_radix(&value[2..], 16)?)
}
fn data(value: &str) -> Result<Vec<u8>> {
    Ok(hex::decode(
        value
            .strip_prefix("0x")
            .context("data requires 0x prefix")?,
    )?)
}
fn latest_tag(params: &Value, index: usize) -> Result<()> {
    ensure!(
        params[index].as_str() == Some("latest"),
        "only latest state is available; historical and pending state are unsupported"
    );
    Ok(())
}
fn block_number(node: &Node, value: &str) -> Result<u64> {
    match value {
        "latest" => Ok(node.head().height),
        "earliest" => Ok(node.store.earliest_height()?),
        "pending" | "safe" | "finalized" => bail!("block tag unsupported by development sequencer"),
        _ => Ok(u64::try_from(quantity(value)?)?),
    }
}
fn block_json(node: &Node, block: &Block) -> Value {
    json!({"number":format!("0x{:x}",block.height), "hash":hex_hash(&block.hash()),
        "parentHash":hex_hash(&block.parent_hash), "timestamp":format!("0x{:x}",block.timestamp),
        "stateRoot":hex_hash(&block.state_root), "gasLimit":format!("0x{:x}",node.genesis.gas_limit),
        "gasUsed":format!("0x{:x}",block.receipts.last().map(|r|r.cumulative_gas_used).unwrap_or(0)),
        "baseFeePerGas":"0x0", "transactions":block.receipts.iter().map(|r|hex_hash(&r.transaction_hash)).collect::<Vec<_>>(),
        "uncles":[], "miner":format!("{:#x}",Address::ZERO), "extraData":"0x", "difficulty":"0x0"})
}
pub fn call(node: &mut Node, method: &str, params: &Value) -> Result<Value> {
    match method {
        "sfc_verificationStatus" => node.verifier.status(),
        "web3_clientVersion" => Ok(json!("SuperFroniterChain/0.1.0")),
        "web3_sha3" => Ok(json!(hex_hash(&crate::types::hash(&data(text(
            params, 0
        )?)?)))),
        "net_version" => Ok(json!(node.genesis.chain_id.to_string())),
        "net_listening" => Ok(json!(true)),
        "net_peerCount" => Ok(json!("0x0")),
        "eth_chainId" => Ok(json!(format!("0x{:x}", node.genesis.chain_id))),
        "eth_blockNumber" => Ok(json!(format!("0x{:x}", node.head().height))),
        "eth_syncing" => Ok(json!(false)),
        "eth_accounts" => Ok(json!([])),
        "eth_gasPrice" | "eth_maxPriorityFeePerGas" => Ok(json!("0x1")),
        "eth_getBalance" | "eth_getTransactionCount" | "eth_getCode" => {
            latest_tag(params, 1)?;
            let address: Address = text(params, 0)?.parse()?;
            let world = node.world()?;
            let account = world.accounts.get(&format!("{address:#x}"));
            Ok(match method {
                "eth_getBalance" => json!(format!(
                    "0x{:x}",
                    account
                        .map(|a| a.balance.parse::<U256>())
                        .transpose()?
                        .unwrap_or_default()
                )),
                "eth_getTransactionCount" => {
                    json!(format!("0x{:x}", account.map(|a| a.nonce).unwrap_or(0)))
                }
                _ => json!(format!(
                    "0x{}",
                    account.map(|a| a.code.as_str()).unwrap_or("")
                )),
            })
        }
        "eth_getStorageAt" => {
            latest_tag(params, 2)?;
            let address: Address = text(params, 0)?.parse()?;
            let slot = quantity(text(params, 1)?)?;
            let world = node.world()?;
            let value = world
                .accounts
                .get(&format!("{address:#x}"))
                .and_then(|a| a.storage.get(&slot.to_string()))
                .map(|s| s.parse::<U256>())
                .transpose()?
                .unwrap_or_default();
            Ok(json!(format!("0x{value:064x}")))
        }
        "eth_sendRawTransaction" => Ok(json!(hex_hash(&node.submit(&data(text(params, 0)?)?)?))),
        "eth_getBlockByNumber" => {
            ensure!(
                params[1] == false,
                "full transaction objects are not implemented; pass false"
            );
            let height = block_number(node, text(params, 0)?)?;
            Ok(node
                .store
                .block(height)?
                .map(|block| block_json(node, &block))
                .unwrap_or(Value::Null))
        }
        "eth_getTransactionReceipt" => {
            let target = data(text(params, 0)?)?;
            ensure!(target.len() == 32, "hash must be 32 bytes");
            if let Some(block) = node.store.receipt_block(&target)? {
                let block_hash = hex_hash(&block.hash());
                let mut log_index = 0usize;
                for (index, receipt) in block.receipts.iter().enumerate() {
                    if receipt.transaction_hash.as_slice() != target {
                        log_index += receipt.logs.len();
                        continue;
                    }
                    let tx = Transaction::prepare(
                        &data(&block.transactions[index])?,
                        node.genesis.chain_id,
                    )?
                    .transaction;
                    let mut bloom = [0u8; 256];
                    let logs: Vec<_> = receipt.logs.iter().enumerate().map(|(i,log)| {
                        for bytes in std::iter::once(data(&log.address).unwrap()).chain(log.topics.iter().map(|t|data(t).unwrap())) {
                            let digest = crate::types::hash(&bytes);
                            for j in [0,2,4] { let bit = ((digest[j] as usize)<<8 | digest[j+1] as usize) & 2047; bloom[255-bit/8] |= 1 << (bit%8); }
                        }
                        json!({"address":log.address,"topics":log.topics,"data":log.data,"blockNumber":format!("0x{:x}",block.height),
                            "blockHash":block_hash,"transactionHash":hex_hash(&receipt.transaction_hash),"transactionIndex":format!("0x{index:x}"),"logIndex":format!("0x{:x}",log_index+i),"removed":false})
                    }).collect();
                    let effective_price = tx
                        .env
                        .gas_priority_fee
                        .map(|p| p.min(tx.env.gas_price))
                        .unwrap_or(tx.env.gas_price);
                    return Ok(
                        json!({"transactionHash":hex_hash(&receipt.transaction_hash),"transactionIndex":format!("0x{index:x}"),
                        "blockHash":block_hash,"blockNumber":format!("0x{:x}",block.height),
                        "from":receipt.from,"to":receipt.to,"status":if receipt.success {"0x1"} else {"0x0"},
                        "gasUsed":format!("0x{:x}",receipt.gas_used),"cumulativeGasUsed":format!("0x{:x}",receipt.cumulative_gas_used),
                        "contractAddress":receipt.contract_address,"logs":logs,"logsBloom":format!("0x{}",hex::encode(bloom)),
                        "effectiveGasPrice":format!("0x{effective_price:x}"),"type":format!("0x{:x}",tx.tx_type)}),
                    );
                }
            }
            Ok(Value::Null)
        }
        "eth_call" | "eth_estimateGas" => {
            if method == "eth_call" || !params[1].is_null() {
                latest_tag(params, 1)?;
            }
            let input = params[0].as_object().context("call must be an object")?;
            for key in input.keys() {
                ensure!(
                    ["from", "to", "gas", "gasPrice", "value", "data", "input"]
                        .contains(&key.as_str()),
                    "unsupported call field: {key}"
                );
            }
            let to: Option<Address> = input
                .get("to")
                .and_then(Value::as_str)
                .map(str::parse)
                .transpose()?;
            let from: Address = input
                .get("from")
                .and_then(Value::as_str)
                .unwrap_or("0x0000000000000000000000000000000000000000")
                .parse()?;
            ensure!(
                !(input.contains_key("data") && input.contains_key("input")),
                "provide data or input, not both"
            );
            let gas = input
                .get("gas")
                .and_then(Value::as_str)
                .map(quantity)
                .transpose()?
                .map(u64::try_from)
                .transpose()?
                .unwrap_or(node.genesis.gas_limit);
            ensure!(gas <= node.genesis.gas_limit, "call gas exceeds limit");
            let env = TxEnv {
                caller: from,
                transact_to: to.map(TxKind::Call).unwrap_or(TxKind::Create),
                gas_limit: gas,
                gas_price: input
                    .get("gasPrice")
                    .and_then(Value::as_str)
                    .map(quantity)
                    .transpose()?
                    .unwrap_or_default(),
                value: input
                    .get("value")
                    .and_then(Value::as_str)
                    .map(quantity)
                    .transpose()?
                    .unwrap_or_default(),
                data: data(
                    input
                        .get("data")
                        .or(input.get("input"))
                        .and_then(Value::as_str)
                        .unwrap_or("0x"),
                )?
                .into(),
                chain_id: Some(node.genesis.chain_id),
                ..Default::default()
            };
            let head = node.head();
            let mut db = ethereum::load_db(node.world()?)?;
            let context = node.context(head.height, head.timestamp);
            let result = ethereum::simulate(&mut db, env.clone(), context)?;
            if method == "eth_call" {
                return Ok(json!(format!(
                    "0x{}",
                    hex::encode(ethereum::output(result)?)
                )));
            }
            ethereum::output(result)?;
            let mut low = 20_999;
            let mut high = gas;
            while high > low + 1 {
                let middle = low + (high - low) / 2;
                let mut trial = env.clone();
                trial.gas_limit = middle;
                if ethereum::simulate(&mut db, trial, context).is_ok_and(|r| r.is_success()) {
                    high = middle;
                } else {
                    low = middle;
                }
            }
            Ok(json!(format!("0x{high:x}")))
        }
        _ => bail!("method not found"),
    }
}

async fn dashboard_stats(State(node): State<Arc<Mutex<Node>>>) -> Response {
    let result = tokio::task::spawn_blocking(move || {
        let mut value = {
            let node = node
                .lock()
                .map_err(|_| anyhow::anyhow!("node unavailable"))?;
            crate::dashboard::stats(&node)?
        };
        let worker = value["verification"]["gpu_worker_pid"]
            .as_u64()
            .map(|pid| pid as u32);
        value["host"] = crate::telemetry::sample(worker);
        Ok::<_, anyhow::Error>(value)
    })
    .await;
    let mut response = match result {
        Ok(Ok(stats)) => Json(stats).into_response(),
        _ => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error":"statistics unavailable"})),
        )
            .into_response(),
    };
    response.headers_mut().insert(
        axum::http::header::CACHE_CONTROL,
        axum::http::HeaderValue::from_static("no-store"),
    );
    response
}

async fn dashboard_index(
    State(node): State<Arc<Mutex<Node>>>,
    axum::extract::Query(query): axum::extract::Query<crate::indexer::Query>,
) -> Response {
    if query.q.len() > 256
        || ![
            "",
            "logs",
            "blocks",
            "blocks_with_transactions",
            "transactions",
            "receipts",
        ]
        .contains(&query.kind.as_str())
    {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error":"invalid index kind or query exceeds 256 bytes"})),
        )
            .into_response();
    }
    let result = tokio::task::spawn_blocking(move || {
        let data = node
            .lock()
            .map_err(|_| anyhow::anyhow!("node unavailable"))?
            .config
            .data_dir
            .clone();
        crate::indexer::search(&data, &query)
    })
    .await;
    let mut response = match result {
        Ok(Ok(value)) => Json(value).into_response(),
        _ => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({"error":"index unavailable"})),
        )
            .into_response(),
    };
    response.headers_mut().insert(
        axum::http::header::CACHE_CONTROL,
        axum::http::HeaderValue::from_static("no-store"),
    );
    response
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ethereum_quantities_and_data_are_distinct() {
        assert_eq!(quantity("0x0").unwrap(), U256::ZERO);
        assert_eq!(quantity("0xff").unwrap(), U256::from(255));
        for value in ["0x", "0x00", "0x01", "12", "0xzz"] {
            assert!(quantity(value).is_err(), "{value}");
        }
        assert_eq!(data("0x").unwrap(), Vec::<u8>::new());
        assert_eq!(data("0x0001").unwrap(), vec![0, 1]);
        for value in ["00", "0x1", "0xgg"] {
            assert!(data(value).is_err(), "{value}");
        }
    }
    #[test]
    fn error_preserves_request_id() {
        let reply = error(json!("request-7"), -32601, "method not found");
        assert_eq!(reply["id"], "request-7");
        assert_eq!(reply["jsonrpc"], "2.0");
        assert_eq!(reply["error"]["code"], -32601);
        assert!(reply.get("result").is_none());
    }
}
