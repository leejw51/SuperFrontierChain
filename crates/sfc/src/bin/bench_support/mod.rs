//! Blocking facade over a dedicated local Cap'n Proto RPC executor.
//! Both transports use the same typed capabilities; no Ethereum/JSON wire calls.
use anyhow::{bail, ensure, Context, Result};
use bytes::Bytes;
use serde_json::{json, Value};
use sfc::{chain_capnp::submission, config::SyncPeer, network::PeerConnection};
use std::{sync::mpsc, thread, time::Duration};

type Admissions = Vec<Result<[u8; 32], String>>;

enum Command {
    Submit(Vec<Vec<Bytes>>, mpsc::SyncSender<Result<Admissions>>),
    Query(String, Value, mpsc::SyncSender<Result<Value>>),
}
pub struct Client {
    sender: Option<tokio::sync::mpsc::UnboundedSender<Command>>,
    thread: Option<thread::JoinHandle<()>>,
}
impl Client {
    pub fn connect(config: SyncPeer) -> Result<Self> {
        let (sender, mut receiver) = tokio::sync::mpsc::unbounded_channel();
        let (ready, wait) = mpsc::sync_channel(1);
        let thread = thread::spawn(move || {
            let runtime = match tokio::runtime::Builder::new_current_thread()
                .enable_all()
                .build()
            {
                Ok(runtime) => runtime,
                Err(e) => {
                    let _ = ready.send(Err(anyhow::Error::from(e)));
                    return;
                }
            };
            tokio::task::LocalSet::new().block_on(&runtime, async move {
                let peer = match PeerConnection::connect(&config).await {
                    Ok(peer) => peer,
                    Err(e) => {
                        let _ = ready.send(Err(e));
                        return;
                    }
                };
                if ready.send(Ok(())).is_err() {
                    return;
                }
                while let Some(command) = receiver.recv().await {
                    match command {
                        Command::Submit(raw, reply) => {
                            let result = tokio::time::timeout(Duration::from_secs(30), async {
                                let batches = futures::future::try_join_all(
                                    raw.into_iter().map(|batch| submit(&peer, batch)),
                                )
                                .await?;
                                Ok::<Admissions, anyhow::Error>(
                                    batches.into_iter().flatten().collect(),
                                )
                            })
                            .await;
                            let _ = reply.send(result.map_err(anyhow::Error::from).and_then(|r| r));
                        }
                        Command::Query(method, params, reply) => {
                            let result = tokio::time::timeout(
                                Duration::from_secs(30),
                                query(&peer, &method, params),
                            )
                            .await;
                            let _ = reply.send(result.map_err(anyhow::Error::from).and_then(|r| r));
                        }
                    }
                }
            });
        });
        let client = Self {
            sender: Some(sender),
            thread: Some(thread),
        };
        wait.recv_timeout(Duration::from_secs(10))??;
        Ok(client)
    }
    pub fn submit(&self, raw: Vec<Bytes>) -> Result<Admissions> {
        self.submit_batches(vec![raw])
    }
    pub fn submit_batches(&self, raw: Vec<Vec<Bytes>>) -> Result<Admissions> {
        ensure!((1..=2).contains(&raw.len()), "pipeline window must be 1..2");
        let (reply, wait) = mpsc::sync_channel(1);
        self.sender
            .as_ref()
            .context("closed peer")?
            .send(Command::Submit(raw, reply))?;
        wait.recv_timeout(Duration::from_secs(35))?
    }
    pub fn query(&self, method: &str, params: Value) -> Result<Value> {
        let (reply, wait) = mpsc::sync_channel(1);
        self.sender
            .as_ref()
            .context("closed peer")?
            .send(Command::Query(method.into(), params, reply))?;
        wait.recv_timeout(Duration::from_secs(35))?
    }
}
impl Drop for Client {
    fn drop(&mut self) {
        self.sender.take();
        if let Some(thread) = self.thread.take() {
            let _ = thread.join();
        }
    }
}
async fn submit(peer: &PeerConnection, raw: Vec<Bytes>) -> Result<Admissions> {
    let mut request = peer.client.submit_transactions_request();
    let mut list = request.get().init_transactions(raw.len().try_into()?);
    for (i, tx) in raw.iter().enumerate() {
        list.set(i as u32, tx);
    }
    let response = request.send().promise.await?;
    let list = response.get()?.get_results()?;
    ensure!(list.len() as usize == raw.len(), "batch length mismatch");
    list.iter()
        .map(|item| {
            Ok(match item.which()? {
                submission::Which::Hash(hash) => Ok(hash?.try_into()?),
                submission::Which::Error(message) => Err(message?.to_str()?.to_owned()),
            })
        })
        .collect()
}
fn data(params: &Value) -> Result<Vec<u8>> {
    Ok(hex::decode(
        params[0].as_str().context("data")?.trim_start_matches("0x"),
    )?)
}
async fn query(peer: &PeerConnection, method: &str, params: Value) -> Result<Value> {
    match method {
        "chain" => Ok(json!(format!(
            "0x{:x}",
            peer.status().await?["chainId"]
                .as_u64()
                .context("chain id")?
        ))),
        "verification" => {
            let response = peer.client.verification_request().send().promise.await?;
            let r = response.get()?;
            Ok(
                json!({"gpu_runtime":r.get_runtime()?.to_str()?,"node_pid":r.get_node_pid(),
                "gpu_worker_pid":if r.get_external_worker(){json!(true)}else{Value::Null},
                "cpu_records":r.get_cpu_records(),"gpu_records":r.get_gpu_records()}),
            )
        }
        "balance" | "nonce" => {
            let mut request = peer.client.account_request();
            request.get().set_address(&data(&params)?);
            let response = request.send().promise.await?;
            let r = response.get()?;
            if method == "nonce" {
                Ok(json!(format!("0x{:x}", r.get_nonce())))
            } else {
                Ok(json!(format!("0x{}", hex::encode(r.get_balance()?))))
            }
        }
        "committed" => {
            let mut request = peer.client.committed_transaction_request();
            request.get().set_hash(&data(&params)?);
            let response = request.send().promise.await?;
            let r = response.get()?;
            if !r.get_found() {
                return Ok(Value::Null);
            }
            ensure!(r.get_success(), "committed transaction reverted");
            Ok(
                json!({"blockNumber":format!("0x{:x}",r.get_height()),"blockHash":hex::encode(r.get_block_hash()?)}),
            )
        }
        "block" => {
            let height = u64::from_str_radix(
                params[0]
                    .as_str()
                    .context("height")?
                    .trim_start_matches("0x"),
                16,
            )?;
            let mut request = peer.client.get_encoded_blocks_request();
            request.get().set_start(height);
            request.get().set_limit(1);
            let response = request.send().promise.await?;
            let blocks = response.get()?.get_blocks()?;
            ensure!(blocks.len() == 1, "missing committed block");
            // Hash the complete persisted bytes, receipts included, to compare follower replay.
            Ok(json!(hex::encode(sfc::types::hash(blocks.get(0)?))))
        }
        _ => bail!("unknown binary query {method}"),
    }
}
