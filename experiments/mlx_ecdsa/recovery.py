"""Experimental exact-integer MLX/Metal secp256k1 recovery; public-data transaction authentication."""
from pathlib import Path
from itertools import groupby
from functools import lru_cache
import mlx.core as mx
import numpy as np

P = 2**256 - 2**32 - 977
N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
GX = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
GY = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
LAMBDA = 0x5363AD4CC05C30E0A5261C028812645A122E22EA20816678DF02967C1B23BD72
BETA = 0x7AE96A2B657C07106E64479EAC3434E99CF0497512F58995C1396C28719501EE
R = 2**256


def limbs(value):
    return [(value >> (32 * i)) & 0xffffffff for i in range(8)]


def fixed_power_source(name, exponent, scalar):
    """Generate an exact addition chain for runs of ones in a public exponent."""
    domain = 'true' if scalar else 'false'
    lines = [f'U256x {name}(U256x a) {{', 'U256x x1=a;']
    known = {1}

    def ones(length):
        if length in known:
            return
        half = length // 2
        ones(half)
        lines.append(f'U256x x{length}=mul_mod<{domain}>(square_n<{domain}>(x{half},{half}),x{half});')
        if length % 2:
            lines.append(f'x{length}=mul_mod<{domain}>(square_n<{domain}>(x{length},1),x1);')
        known.add(length)

    runs = [(bit, len(list(group))) for bit, group in groupby(bin(exponent)[2:])]
    for bit, length in runs:
        if bit == '1':
            ones(length)
    lines.append(f'U256x result=x{runs[0][1]};')
    symbolic = (1 << runs[0][1]) - 1
    for bit, length in runs[1:]:
        lines.append(f'result=square_n<{domain}>(result,{length});')
        symbolic <<= length
        if bit == '1':
            lines.append(f'result=mul_mod<{domain}>(result,x{length});')
            symbolic += (1 << length) - 1
    assert symbolic == exponent
    return '\n'.join(lines + ['return result;', '}'])


@lru_cache(maxsize=1)
def header():
    # Field arithmetic uses p's special form in the normal domain; scalar
    # arithmetic remains Montgomery. Keep the common arithmetic API for tests.
    b2 = 0x3086D221A7D46BCDE86C90E49284EB15
    minus_b1 = 0xE4437ED6010E88286F547FA90ABFE4C3
    values = dict(MOD_P=P, MOD_N=N, ONE_P=1, ONE_N=R % N,
                  R2_P=1, R2_N=R * R % N, SQRT_P=(P + 1) // 4,
                  P_MINUS_TWO=P - 2, N_MINUS_TWO=N - 2, HALF_N_PLUS_ONE=N // 2 + 1,
                  BETA=BETA,
                  LAMBDA_MONT=LAMBDA*R % N,
                  MINUS_B1_MONT=minus_b1*R % N, MINUS_B2_MONT=(N-b2)*R % N,
                  SPLIT_G1=((1 << 384)*b2+N//2)//N,
                  SPLIT_G2=((1 << 384)*minus_b1+N//2)//N)
    source = '\n'.join(f'constant uint {name}[8] = {{{", ".join(hex(x)+"u" for x in limbs(value))}}};'
                       for name, value in values.items())
    source += f'\nconstant uint INV_P = {(-pow(P, -1, 2**32)) % 2**32}u;'
    source += f'\nconstant uint INV_N = {(-pow(N, -1, 2**32)) % 2**32}u;\n'
    # Public fixed-base multiples, derived exactly over the prime field.
    def add(left, right):
        x, y = left
        u, v = right
        slope = (3*x*x * pow(2*y, -1, P) if left == right else
                 (y-v) * pow(x-u, -1, P)) % P
        nx = (slope*slope-x-u) % P
        return nx, (slope*(x-nx)-y) % P

    shifted = (GX, GY)
    for _ in range(128):
        shifted = add(shifted, shifted)
    tables = []
    for base in [(GX, GY), shifted]:
        points = [(0, 0), base]
        for _ in range(2, 16):
            points.append(add(points[-1], base))
        tables.append(points)
    combined = []
    for high in range(16):
        for low in range(16):
            combined.append(tables[1][high] if low == 0 else tables[0][low] if high == 0 else
                            add(tables[0][low], tables[1][high]))
    source += 'constant uint TABLE_G_COMB[256][16] = {' + ','.join(
        '{' + ','.join(hex(v)+'u' for v in limbs(x)+limbs(y)) + '}' for x, y in combined) + '};\n'
    powers = '\n'.join(fixed_power_source(name, exponent, scalar) for name, exponent, scalar in [
        ('sqrt_field', (P+1)//4, False), ('inverse_field', P-2, False),
        ('inverse_scalar', N-2, True)])
    return source + Path(__file__).with_name('secp256k1.metal').read_text().replace('// FIXED_POWER_FUNCTIONS', powers)


def pack(cases):
    """Host bytes -> uint32 limbs; included in end-to-end GPU timings."""
    encoded, parities = [], []
    canonical = True
    for case in cases:
        sig = case['signature']
        digest = case['digest']
        parity = case['parity']
        if type(parity) is not int or not 0 <= parity <= 255:
            raise ValueError('require a 32-byte digest, 64-byte signature and byte parity')
        canonical &= len(sig) == 128 and len(digest) == 64
        encoded.extend((digest, sig))
        parities.append(parity)
    rows = np.empty((len(cases), 25), dtype=np.uint32)
    if cases:
        # One bulk C-level hex decode avoids two small bytes allocations per
        # signature. Noncanonical whitespace inputs retain the old strict
        # per-record decoded-width checks; boundaries may never shift.
        raw = bytes.fromhex(''.join(encoded)) if canonical else b''
        if len(raw) != len(cases)*96:
            decoded = []
            for case in cases:
                digest, sig = bytes.fromhex(case['digest']), bytes.fromhex(case['signature'])
                if len(digest) != 32 or len(sig) != 64:
                    raise ValueError('require a 32-byte digest and 64-byte signature')
                decoded.append(digest+sig)
            raw = b''.join(decoded)
        words = np.frombuffer(raw, dtype='>u4').reshape(-1, 3, 8)
        rows[:, :24] = words[:, :, ::-1].reshape(-1, 24)
        rows[:, 24] = parities
    return rows


class Recovery:
    def __init__(self, mode='auto'):
        if mode not in ('auto', 'direct', 'batched', 'cooperative'):
            raise ValueError('mode must be auto, direct, batched or cooperative')
        self.mode = mode
        if not mx.metal.is_available():
            raise RuntimeError('Apple Metal GPU is required; refusing a silent CPU fallback')
        self.invert = mx.fast.metal_kernel(
            name='sfc_batch_inverse_n', input_names=['records'], output_names=['inverses'],
            header=header(), source='''
            uint start=thread_position_in_grid.x*32;
            if(start>=uint(records_shape[0])) return;
            batch_inverse_r(records,inverses,start,min(32u,uint(records_shape[0])-start));
            ''')
        self.prepare = mx.fast.metal_kernel(
            name='sfc_prepare_windowed', input_names=['records', 'inverses'], output_names=['tables'],
            header=header(), source='''
            uint i=thread_position_in_grid.x;
            if(i>=uint(records_shape[0])) return;
            U256x z,r,s,ri;
            for(uint j=0;j<8;++j) {
                z.w[j]=records[i*25+j]; r.w[j]=records[i*25+8+j]; s.w[j]=records[i*25+16+j];
                ri.w[j]=inverses[i*8+j];
            }
            prepare_windowed<false>(z,r,s,records[i*25+24],ri,tables+i*401);
            ''')
        self.normalize_tables = mx.fast.metal_kernel(
            name='sfc_normalize_tables', input_names=['jacobian'], output_names=['tables'],
            header=header(), source='''
            uint start=thread_position_in_grid.x*128;
            uint total=uint(jacobian_shape[0])*16;
            if(start>=total) return;
            batch_normalize_tables(jacobian,tables,start,min(128u,total-start));
            ''')
        self.kernel = mx.fast.metal_kernel(
            name='sfc_recover_windowed', input_names=['tables'], output_names=['results'],
            header=header(), source='''
            uint i=thread_position_in_grid.x;
            if(i>=uint(tables_shape[0])) return;
            U256x qx=zero256(),qy=zero256(),qz=zero256();
            bool valid=recover_windowed(tables+i*273,qx,qy,qz);
            results[i*25]=valid ? 1u : 0u;
            for(uint j=0;j<8;++j) {
                results[i*25+1+j]=valid ? qx.w[j] : 0u;
                results[i*25+9+j]=valid ? qy.w[j] : 0u;
                results[i*25+17+j]=valid ? qz.w[j] : 0u;
            }
            ''')
        self.normalize = mx.fast.metal_kernel(
            name='sfc_batch_normalize', input_names=['points'], output_names=['results'],
            header=header(), source='''
            uint start=thread_position_in_grid.x*32;
            if(start>=uint(points_shape[0])) return;
            batch_normalize(points,results,start,min(32u,uint(points_shape[0])-start));
            ''')
        self.direct_prepare = mx.fast.metal_kernel(
            name='sfc_prepare_direct',input_names=['records'],output_names=['tables'],
            header=header(),source='''
            uint i=thread_position_in_grid.x;
            if(i>=uint(records_shape[0])) return;
            U256x z,r,s;
            for(uint k=0;k<8;++k) { z.w[k]=records[i*25+k]; r.w[k]=records[i*25+8+k]; s.w[k]=records[i*25+16+k]; }
            U256x ri=inverse_scalar(scalar_record(records,i));
            prepare_windowed<true>(z,r,s,records[i*25+24],ri,tables+i*273);
            ''')
        self.direct_kernel = mx.fast.metal_kernel(
            name='sfc_recover_direct',input_names=['tables'],output_names=['results'],
            header=header(),source='''
            uint i=thread_position_in_grid.x;
            if(i>=uint(tables_shape[0])) return;
            U256x x=zero256(),y=zero256(),z=zero256();
            bool valid=recover_windowed(tables+i*273,x,y,z);
            if(valid) { U256x zi=inverse_field(z),zi2=fmul(zi,zi); x=fmul(x,zi2); y=fmul(y,fmul(zi,zi2)); }
            results[i*17]=valid ? 1u : 0u;
            for(uint k=0;k<8;++k) { results[i*17+1+k]=valid ? x.w[k] : 0u; results[i*17+9+k]=valid ? y.w[k] : 0u; }
            ''')

        self.cooperative_prepare = mx.fast.metal_kernel(
            name='sfc_cooperative_prepare',input_names=['records'],output_names=['tables'],
            header=header(),source='''
            uint count=uint(records_shape[0]), padded=((count+31)/32)*32;
            uint task=thread_position_in_grid.x/padded,i=thread_position_in_grid.x%padded;
            if(i>=count) return;
            if(task==0) prepare_cooperative_metadata(records,i,tables+i*273);
            else prepare_cooperative_points(records,i,tables+i*273);
            ''')
        self.cooperative_terms = mx.fast.metal_kernel(
            name='sfc_cooperative_terms',input_names=['tables'],output_names=['points'],
            header=header(),source='''
            uint count=uint(tables_shape[0]),padded=((count+31)/32)*32;
            uint term=thread_position_in_grid.x/padded,i=thread_position_in_grid.x%padded;
            if(i>=count) return;
            JPoint q=recover_cooperative_term(tables+i*273,term);
            for(uint k=0;k<8;++k) {
                points[i*72+term*24+k]=q.x.w[k]; points[i*72+term*24+8+k]=q.y.w[k]; points[i*72+term*24+16+k]=q.z.w[k];
            }
            ''')
        self.cooperative_join = mx.fast.metal_kernel(
            name='sfc_cooperative_join',input_names=['points'],output_names=['results'],
            header=header(),source='''
            uint i=thread_position_in_grid.x;
            if(i>=uint(points_shape[0])) return;
            JPoint q=infinity();
            for(uint term=0;term<3;++term) {
                JPoint p;
                for(uint k=0;k<8;++k) { p.x.w[k]=points[i*72+term*24+k]; p.y.w[k]=points[i*72+term*24+8+k]; p.z.w[k]=points[i*72+term*24+16+k]; }
                q=point_add_jacobian(q,p);
            }
            bool valid=!is_zero(q.z);
            if(valid) { U256x zi=inverse_field(q.z),zi2=fmul(zi,zi); q.x=fmul(q.x,zi2); q.y=fmul(q.y,fmul(zi,zi2)); }
            results[i*17]=valid ? 1u : 0u;
            for(uint k=0;k<8;++k) { results[i*17+1+k]=valid ? q.x.w[k] : 0u; results[i*17+9+k]=valid ? q.y.w[k] : 0u; }
            ''')

    def dispatch(self, packed):
        if packed.ndim != 2 or packed.shape[1] != 25 or packed.dtype != mx.uint32:
            raise ValueError('packed records must have shape (N,25) and dtype uint32')
        count = packed.shape[0]
        if not 1 <= count <= (2**32-1)//401:
            raise ValueError('empty or oversized GPU batch')
        if self.mode == 'cooperative' or (self.mode == 'auto' and count <= 2048):
            padded = ((count+31)//32)*32
            tables = self.cooperative_prepare(inputs=[packed],grid=(padded*2,1,1),threadgroup=(32,1,1),
                output_shapes=[(count,273)],output_dtypes=[mx.uint32],stream=mx.gpu)[0]
            points = self.cooperative_terms(inputs=[tables],grid=(padded*3,1,1),threadgroup=(32,1,1),
                output_shapes=[(count,72)],output_dtypes=[mx.uint32],stream=mx.gpu)[0]
            return self.cooperative_join(inputs=[points],grid=(count,1,1),threadgroup=(min(count,32),1,1),
                output_shapes=[(count,17)],output_dtypes=[mx.uint32],stream=mx.gpu)[0]
        if self.mode == 'direct' or (self.mode == 'auto' and count < 8192):
            tables = self.direct_prepare(inputs=[packed],grid=(count,1,1),threadgroup=(min(count,32),1,1),
                                         output_shapes=[(count,273)],output_dtypes=[mx.uint32],stream=mx.gpu)[0]
            return self.direct_kernel(inputs=[tables],grid=(count,1,1),threadgroup=(min(count,32),1,1),
                                      output_shapes=[(count,17)],output_dtypes=[mx.uint32],stream=mx.gpu)[0]
        chunks = (count+31)//32
        inverses = self.invert(inputs=[packed], grid=(chunks, 1, 1), threadgroup=(min(chunks,32),1,1),
                               output_shapes=[(count,8)], output_dtypes=[mx.uint32], stream=mx.gpu)[0]
        jacobian = self.prepare(inputs=[packed,inverses], grid=(count, 1, 1),
                              threadgroup=(min(count, 32), 1, 1),
                              output_shapes=[(count, 401)], output_dtypes=[mx.uint32], stream=mx.gpu)[0]
        table_chunks = (count*16+127)//128
        tables = self.normalize_tables(inputs=[jacobian],grid=(table_chunks,1,1),
                                       threadgroup=(min(table_chunks,32),1,1),
                                       output_shapes=[(count,273)],output_dtypes=[mx.uint32],stream=mx.gpu)[0]
        points = self.kernel(inputs=[tables], grid=(count, 1, 1),
                           threadgroup=(min(count, 32), 1, 1),
                           output_shapes=[(count, 25)], output_dtypes=[mx.uint32], stream=mx.gpu)[0]
        return self.normalize(inputs=[points], grid=(chunks,1,1), threadgroup=(min(chunks,32),1,1),
                              output_shapes=[(count,17)], output_dtypes=[mx.uint32], stream=mx.gpu)[0]

    def recover(self, cases):
        if not cases:
            return []
        result = self.dispatch(mx.array(pack(cases)))
        mx.eval(result)
        return unpack(np.array(result))


def unpack(rows):
    if np.any(rows[:, 0] > 1):
        raise AssertionError('invalid GPU status')
    encoded = rows[:, 1:].reshape(-1, 2, 8)[:, :, ::-1].astype('>u4').tobytes().hex()
    return ['04' + encoded[i*128:(i+1)*128] if status else None
            for i, status in enumerate(rows[:, 0].tolist())]
