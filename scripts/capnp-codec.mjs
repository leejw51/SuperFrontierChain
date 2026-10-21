import { Message } from 'capnp-es';
import { Value, Record } from '../crates/sfc/schema/runtime.js';
function fill(out, v) {
  if(v==null)out.null=undefined;
  else if(typeof v==='boolean')out.boolean=v;
  else if(typeof v==='string')out.text=v;
  else if(typeof v==='bigint'){if(v>=0n)out.unsigned=v;else out.signed=v;}
  else if(typeof v==='number'){
    if(!Number.isFinite(v))throw Error('Non-finite number');
    if(Object.is(v,-0))out.real=v;
    else if(Number.isSafeInteger(v)){if(v>=0)out.unsigned=BigInt(v);else out.signed=BigInt(v);}else out.real=v;
  } else if(Array.isArray(v)){const list=out._initList(v.length);v.forEach((x,i)=>fill(list.get(i),x));}
  else {const entries=Object.entries(v).sort(([a],[b])=>a<b?-1:a>b?1:0);const list=out._initObject(entries.length);entries.forEach(([key,x],i)=>{const f=list.get(i);f.key=key;fill(f._initValue(),x);});}
}
function read(v,depth=0){
  if(depth>=64)throw Error('Record nesting exceeded');
  if(v._isNull)return null;
  if(v._isBoolean)return v.boolean;
  if(v._isUnsigned||v._isSigned){const n=v._isUnsigned?v.unsigned:v.signed;return n<=BigInt(Number.MAX_SAFE_INTEGER)&&n>=BigInt(Number.MIN_SAFE_INTEGER)?Number(n):n;}
  if(v._isReal){if(!Number.isFinite(v.real))throw Error('Non-finite number');return v.real;}
  if(v._isText)return v.text;
  if(v._isList)return Array.from(v.list,x=>read(x,depth+1));
  if(v._isObject){const out=Object.create(null);for(const f of v.object){if(Object.hasOwn(out,f.key))throw Error('Duplicate key');out[f.key]=read(f.value,depth+1);}return out;}
  throw Error('Unknown record type');
}
const MAGIC=0x5346435245433031n;
const configFields={data_dir:'dataDir',genesis:'genesis',rpc_listen:'rpcListen',peer_listen:'peerListen',capnp_listen:'capnpListen',tls_cert:'tlsCert',tls_key:'tlsKey',block_interval_ms:'blockIntervalMs',max_pending:'maxPending',max_block_transactions:'maxBlockTransactions',development:'development'};
const configNumbers=new Set(['block_interval_ms','max_pending','max_block_transactions']);
const integer=n=>n<=BigInt(Number.MAX_SAFE_INTEGER)?Number(n):n;
function readRecord(r){
  if(r.version!==1)throw Error('Unsupported typed record version');
  if(r._isConfig){
    const c=r.config,out=Object.fromEntries(Object.entries(configFields).map(([k,v])=>[k,configNumbers.has(k)?integer(c[v]):c[v]]));
    out.capnp_listen ||= null;
    out.sync_peer=c.hasSyncPeer?{transport:['http3','tcp'][c.syncPeer.transport],address:c.syncPeer.address,server_name:c.syncPeer.serverName,certificate:c.syncPeer.certificate}:null;
    out.retention=c.retention._isArchive?{mode:'archive'}:{mode:'pruned',seconds:integer(c.retention.prunedSeconds)};
    const v=c.verification;out.verification={backend:['cpu','gpu','hybrid'][v.backend],gpu_runtime:['metal','mlx','mlx-native'][v.gpuRuntime],python:v.python,worker:v.worker,timeout_seconds:integer(v.timeoutSeconds)};
    return out;
  }
  if(r._isGenesis){const g=r.genesis,alloc=Object.create(null);for(const item of g.alloc){if(Object.hasOwn(alloc,item.key))throw Error('Duplicate genesis key');alloc[item.key]=item.value;}return {chain_id:integer(g.chainId),timestamp:integer(g.timestamp),gas_limit:integer(g.gasLimit),alloc};}
  if(r._isUnsigned)return integer(r.unsigned);
  throw Error('Unsupported typed record');
}
export function encode(value){
  const m=new Message();
  if(value && typeof value==='object' && Object.hasOwn(value,'data_dir')){
    const r=m.initRoot(Record);r.magic=MAGIC;r.version=1;const c=r._initConfig();
    for(const [key,target] of Object.entries(configFields))if(value[key]!=null)c[target]=configNumbers.has(key)?BigInt(value[key]):value[key];
    c.hasSyncPeer=!!value.sync_peer;
    if(value.sync_peer){const source=value.sync_peer,p=c._initSyncPeer();p.transport=source.transport==='tcp'?1:0;p.address=source.address;p.serverName=source.server_name;p.certificate=source.certificate;}
    const retention=c._initRetention();if(value.retention.mode==='archive')retention.archive=undefined;else retention.prunedSeconds=BigInt(value.retention.seconds);
    const source=value.verification,v=c._initVerification();v.backend=['cpu','gpu','hybrid'].indexOf(source.backend);v.gpuRuntime=['metal','mlx','mlx-native'].indexOf(source.gpu_runtime??'mlx-native');v.python=source.python;v.worker=source.worker;v.timeoutSeconds=BigInt(source.timeout_seconds);
  }else if(value && typeof value==='object' && ['chain_id','timestamp','gas_limit','alloc'].every(k=>Object.hasOwn(value,k))){
    const r=m.initRoot(Record);r.magic=MAGIC;r.version=1;const g=r._initGenesis();g.chainId=BigInt(value.chain_id);g.timestamp=BigInt(value.timestamp);g.gasLimit=BigInt(value.gas_limit);
    const items=Object.entries(value.alloc).sort(([a],[b])=>a<b?-1:a>b?1:0),list=g._initAlloc(items.length);items.forEach(([k,v],i)=>{const entry=list.get(i);entry.key=k;entry.value=v;});
  }else fill(m.initRoot(Value),value);
  return new Uint8Array(m.toArrayBuffer());
}
export function decode(bytes){
  if(bytes.byteLength>256*1024*1024||bytes.byteLength<8)throw Error('Invalid record size');
  const view=ArrayBuffer.isView(bytes)?new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength):new DataView(bytes);
  const count=view.getUint32(0,true)+1, header=Math.ceil((count+1)/2)*8;
  if(count>512||header>view.byteLength)throw Error('Invalid segment table');
  let size=header;
  for(let i=0;i<count;i++)size+=view.getUint32(4+i*4,true)*8;
  if(size!==view.byteLength)throw Error('Truncated or trailing Cap’n Proto data');
  const message=new Message(bytes,false),record=message.getRoot(Record);
  return record.magic===MAGIC?readRecord(record):read(message.getRoot(Value));
}
