"""Experimental exact-integer MLX/Metal secp256k1 recovery; no node integration."""
from pathlib import Path
import mlx.core as mx
import numpy as np

P = 2**256 - 2**32 - 977
N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
R = 2**256


def limbs(value):
    return [(value >> (32 * i)) & 0xffffffff for i in range(8)]


def header():
    values = dict(MOD_P=P, MOD_N=N, ONE_P=R % P, ONE_N=R % N,
                  R2_P=R * R % P, R2_N=R * R % N, SQRT_P=(P + 1) // 4,
                  P_MINUS_TWO=P - 2, N_MINUS_TWO=N - 2, HALF_N_PLUS_ONE=N // 2 + 1,
                  GX_MONT=GX * R % P, GY_MONT=GY * R % P)
    source = '\n'.join(f'constant uint {name}[8] = {{{", ".join(hex(x)+"u" for x in limbs(value))}}};'
                       for name, value in values.items())
    source += f'\nconstant uint INV_P = {(-pow(P, -1, 2**32)) % 2**32}u;'
    source += f'\nconstant uint INV_N = {(-pow(N, -1, 2**32)) % 2**32}u;\n'
    return source + Path(__file__).with_name('secp256k1.metal').read_text()


def pack(cases):
    """Host bytes -> uint32 limbs; included in end-to-end GPU timings."""
    rows = []
    for case in cases:
        sig = bytes.fromhex(case['signature'])
        digest = bytes.fromhex(case['digest'])
        parity = case['parity']
        if (len(sig) != 64 or len(digest) != 32 or type(parity) is not int
                or not 0 <= parity <= 255):
            raise ValueError('require a 32-byte digest, 64-byte signature and byte parity')
        rows.append(limbs(int.from_bytes(digest, 'big')) +
                    limbs(int.from_bytes(sig[:32], 'big')) +
                    limbs(int.from_bytes(sig[32:], 'big')) + [parity])
    return np.asarray(rows, dtype=np.uint32).reshape((-1, 25))


class Recovery:
    def __init__(self):
        if not mx.metal.is_available():
            raise RuntimeError('Apple Metal GPU is required; refusing a silent CPU fallback')
        self.kernel = mx.fast.metal_kernel(
            name='sfc_experimental_recover', input_names=['records'], output_names=['results'],
            header=header(), source='''
            uint i=thread_position_in_grid.x;
            if(i>=uint(records_shape[0])) return;
            U256x z,r,s,qx=zero256(),qy=zero256();
            for(uint j=0;j<8;++j) {
                z.w[j]=records[i*25+j]; r.w[j]=records[i*25+8+j]; s.w[j]=records[i*25+16+j];
            }
            bool valid=recover_key(z,r,s,records[i*25+24],qx,qy);
            results[i*17]=valid ? 1u : 0u;
            for(uint j=0;j<8;++j) {
                results[i*17+1+j]=valid ? qx.w[j] : 0u;
                results[i*17+9+j]=valid ? qy.w[j] : 0u;
            }
            ''')

    def dispatch(self, packed):
        count = packed.shape[0]
        if count < 1:
            raise ValueError('empty GPU batch')
        return self.kernel(inputs=[packed], grid=(count, 1, 1),
                           threadgroup=(min(count, 32), 1, 1),
                           output_shapes=[(count, 17)], output_dtypes=[mx.uint32], stream=mx.gpu)[0]

    def recover(self, cases):
        if not cases:
            return []
        result = self.dispatch(mx.array(pack(cases)))
        mx.eval(result)
        return unpack(np.array(result))


def unpack(rows):
    values = []
    for row in rows:
        if row[0] == 0:
            values.append(None)
        elif row[0] == 1:
            x = sum(int(row[1+i]) << (32*i) for i in range(8))
            y = sum(int(row[9+i]) << (32*i) for i in range(8))
            values.append('04' + x.to_bytes(32, 'big').hex() + y.to_bytes(32, 'big').hex())
        else:
            raise AssertionError('invalid GPU status')
    return values
