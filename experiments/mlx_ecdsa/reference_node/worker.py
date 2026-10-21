#!/usr/bin/env python3
"""Persistent GPU worker. Stdout is length-framed Cap'n Proto only."""
import pathlib
import struct
import sys
import capnp
from recovery import Recovery
import numpy as np
import mlx.core as mx

schema = capnp.load(str(pathlib.Path(__file__).resolve().parents[3] / 'crates/sfc/schema/runtime.capnp'))
PROTOCOL = 3

def unpack_bytes(rows):
    if np.any(rows[:,0]>1):raise AssertionError('invalid GPU status')
    encoded=rows[:,1:].reshape(-1,2,8)[:,:,::-1].astype('>u4').tobytes()
    return [b'\x04'+encoded[i*64:(i+1)*64] if status else b'' for i,status in enumerate(rows[:,0].tolist())]

def read_exact(stream, size):
    parts = bytearray()
    while len(parts) < size:
        piece = stream.read(size - len(parts))
        if not piece:
            raise EOFError('truncated worker request')
        parts.extend(piece)
    return bytes(parts)

def send(message):
    data = message.to_bytes()
    sys.stdout.buffer.write(struct.pack('<Q', len(data)) + data)
    sys.stdout.buffer.flush()

def main():
    gpu = Recovery()
    send(schema.RecoveryResponse.new_message(ready=True, protocol=PROTOCOL))
    while True:
        first = sys.stdin.buffer.read(1)
        if not first:
            return
        size = struct.unpack('<Q', first + read_exact(sys.stdin.buffer, 7))[0]
        if not 0 < size <= 2 * 1024 * 1024:
            raise ValueError('worker request exceeded limit')
        with schema.RecoveryRequest.from_bytes(read_exact(sys.stdin.buffer, size), traversal_limit_in_words=262144, nesting_limit=16) as request:
            if request._has('packed'):
                count=request.count
                packed=request.packed
                if not 1 <= count <= 4096 or len(packed)!=count*100 or len(request.cases):
                    raise ValueError('invalid packed recovery batch')
                # NumPy views the Capnp Data payload; MLX owns the device input.
                rows=np.frombuffer(packed,dtype='<u4').reshape(count,25)
                if np.any(rows[:,24]>1):raise ValueError('invalid recovery parity')
                output=gpu.dispatch(mx.array(rows));mx.eval(output)
                keys=unpack_bytes(np.array(output))
            else:
                if len(request.cases)>4096:raise ValueError('expected at most 4096 recovery records')
                cases=[]
                for case in request.cases:
                    if len(case.digest)!=32 or len(case.signature)!=64 or case.parity>1:raise ValueError('invalid recovery record')
                    cases.append(dict(digest=case.digest.hex(),signature=case.signature.hex(),parity=case.parity))
                keys=[bytes.fromhex(key) if key else b'' for key in gpu.recover(cases)]
            send(schema.RecoveryResponse.new_message(protocol=PROTOCOL,id=request.id,keys=keys))

if __name__ == '__main__':
    main()
