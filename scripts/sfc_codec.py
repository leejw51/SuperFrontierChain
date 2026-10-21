"""Supervisor configuration/control-message adapter; never used by the Rust data path."""
import os
import pathlib
import struct
import sys
import math
try:
    import capnp
except ImportError:
    runtime = pathlib.Path(__file__).resolve().parents[1] / 'target/supervisor-venv/bin/python'
    if runtime.exists() and pathlib.Path(sys.executable).absolute() != runtime.absolute():
        os.execv(str(runtime), [str(runtime), *sys.argv])
    raise RuntimeError('Run make codec-setup to install the Cap\'n Proto Python runtime') from None

schema = capnp.load(str(pathlib.Path(__file__).resolve().parents[1] / 'crates/sfc/schema/runtime.capnp'))
MAX_SIZE = 256 * 1024 * 1024

def _fill(out, value):
    if value is None: out.null = None
    elif isinstance(value, bool): out.boolean = value
    elif isinstance(value, int):
        if value >= 0: out.unsigned = value
        else: out.signed = value
    elif isinstance(value, float):
        if not math.isfinite(value): raise ValueError('non-finite number')
        out.real = value
    elif isinstance(value, str): out.text = value
    elif isinstance(value, (list, tuple)):
        values = out.init('list', len(value))
        for target, item in zip(values, value): _fill(target, item)
    elif isinstance(value, dict):
        fields = out.init('object', len(value))
        for target, (key, item) in zip(fields, sorted(value.items())):
            target.key = str(key)
            _fill(target.init('value'), item)
    else: raise TypeError(type(value))

def _read(value, depth=0):
    if depth >= 64: raise ValueError('nesting exceeded')
    kind=value.which()
    if kind=='null': return None
    if kind=='list': return [_read(v, depth+1) for v in value.list]
    if kind=='object':
        out={}
        for f in value.object:
            if f.key in out: raise ValueError('duplicate key')
            out[f.key]=_read(f.value, depth+1)
        return out
    result = getattr(value,kind)
    if kind == 'real' and not math.isfinite(result): raise ValueError('non-finite number')
    return result

MAGIC = 0x5346435245433031
_CONFIG_FIELDS = {
    'data_dir':'dataDir', 'genesis':'genesis', 'rpc_listen':'rpcListen',
    'peer_listen':'peerListen', 'capnp_listen':'capnpListen', 'tls_cert':'tlsCert',
    'tls_key':'tlsKey', 'block_interval_ms':'blockIntervalMs',
    'max_pending':'maxPending', 'max_block_transactions':'maxBlockTransactions',
    'development':'development',
}
def _typed_config(out, value):
    unknown = set(value) - set(_CONFIG_FIELDS) - {'sync_peer','retention','verification'}
    if unknown: raise ValueError(f'unknown config fields: {unknown}')
    for source,target in _CONFIG_FIELDS.items():
        if value.get(source) is not None: setattr(out,target,value[source])
    peer=value.get('sync_peer')
    out.hasSyncPeer=peer is not None
    if peer:
        if set(peer)-{'transport','address','server_name','certificate'}: raise ValueError('unknown peer fields')
        p=out.init('syncPeer');p.transport=peer.get('transport','http3');p.address=peer['address'];p.serverName=peer['server_name'];p.certificate=peer['certificate']
    retention=value['retention'];r=out.init('retention')
    if retention['mode']=='archive':r.archive=None
    elif retention['mode']=='pruned':r.prunedSeconds=retention['seconds']
    else:raise ValueError('invalid retention mode')
    root=pathlib.Path(__file__).resolve().parents[1]
    v=value.get('verification',{});t=out.init('verification')
    if set(v)-{'backend','python','worker','timeout_seconds','gpu_runtime'}:raise ValueError('unknown verification fields')
    t.backend=v.get('backend','gpu');t.python=v.get('python',str(root/'target/mlx-venv/bin/python'));t.worker=v.get('worker','');t.timeoutSeconds=v.get('timeout_seconds',30)
    t.gpuRuntime={'mlx-native':'mlxNative','mlx':'mlxNative'}.get(v.get('gpu_runtime','mlx-native'),v.get('gpu_runtime','mlx-native'))

def _read_typed(r):
    if r.version != 1: raise ValueError('unsupported typed record version')
    kind=r.which()
    if kind=='config':
        c=r.config;out={source:getattr(c,target) for source,target in _CONFIG_FIELDS.items()}
        out['capnp_listen']=out['capnp_listen'] or None
        out['sync_peer']=dict(transport=str(c.syncPeer.transport),address=c.syncPeer.address,server_name=c.syncPeer.serverName,certificate=c.syncPeer.certificate) if c.hasSyncPeer else None
        out['retention']=dict(mode='archive') if c.retention.which()=='archive' else dict(mode='pruned',seconds=c.retention.prunedSeconds)
        v=c.verification;out['verification']=dict(backend=str(v.backend),python=v.python,worker=v.worker,timeout_seconds=v.timeoutSeconds,gpu_runtime={'mlxNative':'mlx-native','mlx':'mlx-native'}.get(str(v.gpuRuntime),str(v.gpuRuntime)))
        return out
    if kind=='genesis':
        g=r.genesis;alloc={}
        for item in g.alloc:
            if item.key in alloc:raise ValueError('duplicate genesis key')
            alloc[item.key]=item.value
        return dict(chain_id=g.chainId,timestamp=g.timestamp,gas_limit=g.gasLimit,alloc=alloc)
    if kind=='unsigned':return r.unsigned
    raise ValueError(f'unsupported inspection type: {kind}')

def dumps(value, **kwargs):
    if isinstance(value,dict) and ('data_dir' in value or {'chain_id','timestamp','gas_limit','alloc'}<=set(value)):
        message=schema.Record.new_message(magic=MAGIC,version=1)
        if 'data_dir' in value:_typed_config(message.init('config'),value)
        else:
            if set(value)!={'chain_id','timestamp','gas_limit','alloc'}:raise ValueError('unknown genesis fields')
            g=message.init('genesis');g.chainId=value['chain_id'];g.timestamp=value['timestamp'];g.gasLimit=value['gas_limit']
            for entry,(key,item) in zip(g.init('alloc',len(value['alloc'])),sorted(value['alloc'].items())):entry.key=key;entry.value=item
    else:
        message=schema.Value.new_message()
        _fill(message,value)
    data=message.to_bytes()
    if len(data)>MAX_SIZE:raise ValueError('record too large')
    return data

def loads(data):
    if not isinstance(data, bytes): data=bytes(data)
    if not 8 <= len(data) <= MAX_SIZE: raise ValueError('invalid record size')
    count = struct.unpack_from('<I', data)[0] + 1
    header = ((count + 2) // 2) * 8
    if count > 512 or header > len(data): raise ValueError('invalid segment table')
    size = header + sum(struct.unpack_from('<I', data, 4 + i*4)[0]*8 for i in range(count))
    if size != len(data): raise ValueError('truncated or trailing Cap’n Proto data')
    with schema.Record.from_bytes(data,traversal_limit_in_words=MAX_SIZE//8,nesting_limit=64) as message:
        if message.magic==MAGIC:return _read_typed(message)
    with schema.Value.from_bytes(data,traversal_limit_in_words=MAX_SIZE//8,nesting_limit=64) as message:
        return _read(message)

def load(file): return loads(file.read())
def dump(value,file): file.write(dumps(value))
def read(path): return loads(pathlib.Path(path).read_bytes())
def write(path,value): pathlib.Path(path).write_bytes(dumps(value))

def records(file):
    while True:
        length=file.read(8)
        if not length:return
        if len(length)!=8:raise EOFError('torn record length')
        size=struct.unpack('<Q',length)[0]
        if not 0<size<=MAX_SIZE:raise ValueError('record too large')
        data=file.read(size)
        if len(data)!=size:raise EOFError('torn record')
        yield loads(data)

def blocks(file):
    storage=capnp.load(str(pathlib.Path(__file__).resolve().parents[1]/'crates/sfc/schema/storage.capnp'))
    while True:
        header=file.read(8)
        if not header:return
        if len(header)!=8:raise EOFError('torn block frame')
        size=struct.unpack('<Q',header)[0]
        if not 0<size<=MAX_SIZE or size%8:raise ValueError('invalid block segment size')
        data=file.read(size)
        if len(data)!=size:raise EOFError('torn block segment')
        block=storage.Block.from_segments([data],traversal_limit_in_words=MAX_SIZE//8,nesting_limit=64)
        yield dict(chain_id=block.chainId,height=block.height,timestamp=block.timestamp,parent_hash=bytes(block.parentHash),state_root=bytes(block.stateRoot),transactions=[bytes(tx) for tx in block.transactions],receipts=[r.to_dict() for r in block.receipts])

def append(file,value):
    data=dumps(value)
    file.write(struct.pack('<Q',len(data))+data)


def send_socket(sock, value):
    data = dumps(value)
    if len(data) > 65536: raise ValueError('control message too large')
    sock.sendall(struct.pack('<Q', len(data)) + data)


def receive_socket(sock):
    def exact(size):
        data = bytearray()
        while len(data) < size:
            part = sock.recv(size - len(data))
            if not part: raise ConnectionError('control connection closed before a complete response')
            data.extend(part)
        return bytes(data)
    size = struct.unpack('<Q', exact(8))[0]
    if not 0 < size <= 65536: raise ValueError('control message too large')
    try:
        return loads(exact(size))
    except capnp.KjException as error:
        raise ValueError('invalid control record') from error


if __name__ == '__main__':
    import argparse
    import pprint
    parser = argparse.ArgumentParser(description='Inspect an SFC Cap’n Proto file as readable text')
    parser.add_argument('path', type=pathlib.Path)
    parser.add_argument('--stream', action='store_true', help='Read length-framed history/log/results')
    parser.add_argument('--blocks',action='store_true',help='Inspect canonical block history frames')
    args = parser.parse_args()
    with args.path.open('rb') as file:
        if args.blocks:
            for value in blocks(file):pprint.pp(value)
        elif args.stream:
            for value in records(file): pprint.pp(value)
        else: pprint.pp(load(file))
