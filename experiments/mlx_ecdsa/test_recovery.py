"""Differential arithmetic/recovery checks; requires the actual Apple GPU."""
import argparse
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'scripts'))
import sfc_codec as codec
import random
import time
import mlx.core as mx
import numpy as np
from recovery import Recovery, P, N, LAMBDA, GX, GY, header, limbs, pack


def arithmetic_checks():
    rng = random.Random(0x5FC_ECD5A)
    total = 0
    for scalar, modulus in [(False, P), (True, N)]:
        # Cross-products exercise carries and final reductions near the modulus.
        boundaries = [0, 1, 2, 2**32 - 1, 2**32, 2**64-1, 2**128,
                      modulus // 2, modulus - 2, modulus - 1]
        pairs = [(a, b) for a in boundaries for b in boundaries]
        pairs += [(rng.randrange(modulus), rng.randrange(modulus)) for _ in range(4096)]
        records = np.asarray([limbs(a) + limbs(b) for a, b in pairs], dtype=np.uint32)
        body = '''
            uint i=thread_position_in_grid.x;
            if(i>=uint(records_shape[0])) return;
            U256x a,b;
            for(uint j=0;j<8;++j) { a.w[j]=records[i*16+j]; b.w[j]=records[i*16+8+j]; }
            U256x sum=add_mod<SCALAR>(a,b),diff=sub_mod<SCALAR>(a,b);
            U256x ma=to_mont<SCALAR>(a),mb=to_mont<SCALAR>(b);
            U256x product=from_mont<SCALAR>(mul_mod<SCALAR>(ma,mb));
            U256x exponent=load_constant(SCALAR ? N_MINUS_TWO : P_MINUS_TWO);
            U256x inverse=from_mont<SCALAR>(power<SCALAR>(ma,exponent));
            for(uint j=0;j<8;++j) {
                results[i*32+j]=sum.w[j]; results[i*32+8+j]=diff.w[j];
                results[i*32+16+j]=product.w[j]; results[i*32+24+j]=inverse.w[j];
            }
        '''
        kernel = mx.fast.metal_kernel(name=f'sfc_arithmetic_{scalar}', input_names=['records'],
                                     output_names=['results'], source=body, header=header())
        result = kernel(inputs=[mx.array(records)], template=[('SCALAR', scalar)],
                        grid=(len(pairs), 1, 1), threadgroup=(32, 1, 1),
                        output_shapes=[(len(pairs), 32)], output_dtypes=[mx.uint32], stream=mx.gpu)[0]
        mx.eval(result)
        expected = np.asarray([limbs((a+b) % modulus) + limbs((a-b) % modulus) +
                               limbs(a*b % modulus) + limbs(pow(a, -1, modulus) if a else 0)
                               for a, b in pairs], dtype=np.uint32)
        np.testing.assert_array_equal(np.array(result), expected)
        total += len(pairs) * 4
    return total


def jacobian_checks():
    """Independent affine Python oracle for the cooperative kernel's Jacobian join."""
    def add(a, b):
        if a is None: return b
        if b is None: return a
        x,y=a; u,v=b
        if x == u and (y+v)%P == 0: return None
        slope = ((3*x*x)*pow(2*y,-1,P) if a == b else (v-y)*pow(u-x,-1,P))%P
        nx=(slope*slope-x-u)%P
        return nx,(slope*(x-nx)-y)%P

    points=[None,(GX,GY)]
    for _ in range(127): points.append(add(points[-1],(GX,GY)))
    points += [(x,(-y)%P) for x,y in points[1:]]
    pairs=[(p,None) for p in points]+[(None,p) for p in points]
    pairs += [(p,p) for p in points]
    pairs += [(p,(p[0],(-p[1])%P)) for p in points if p]
    rng=random.Random(0xC00F)
    pairs += [(rng.choice(points),rng.choice(points)) for _ in range(1024)]
    records=[]; expected=[]
    for a,b in pairs:
        row=[]
        for point in (a,b):
            if point is None: row += limbs(0)+limbs(1)+limbs(0)
            else:
                z=rng.choice([1,2,P-1,2**32,rng.randrange(1,P)])
                row += limbs(point[0]*z*z%P)+limbs(point[1]*z*z*z%P)+limbs(z)
        records.append(row)
        result=add(a,b)
        expected.append([0]+[0]*16 if result is None else [1]+limbs(result[0])+limbs(result[1]))
    kernel=mx.fast.metal_kernel(name='sfc_test_jacobian_join',input_names=['records'],output_names=['results'],
        header=header(),source='''
        uint i=thread_position_in_grid.x;
        if(i>=uint(records_shape[0])) return;
        JPoint a,b;
        for(uint k=0;k<8;++k) {
            a.x.w[k]=records[i*48+k]; a.y.w[k]=records[i*48+8+k]; a.z.w[k]=records[i*48+16+k];
            b.x.w[k]=records[i*48+24+k]; b.y.w[k]=records[i*48+32+k]; b.z.w[k]=records[i*48+40+k];
        }
        JPoint q=point_add_jacobian(a,b); bool valid=!is_zero(q.z);
        if(valid) { U256x zi=inverse_field(q.z),zi2=fmul(zi,zi); q.x=fmul(q.x,zi2); q.y=fmul(q.y,fmul(zi,zi2)); }
        results[i*17]=valid ? 1u : 0u;
        for(uint k=0;k<8;++k) { results[i*17+1+k]=valid ? q.x.w[k] : 0u; results[i*17+9+k]=valid ? q.y.w[k] : 0u; }
        ''')
    output=kernel(inputs=[mx.array(np.asarray(records,dtype=np.uint32))],grid=(len(records),1,1),
        threadgroup=(32,1,1),output_shapes=[(len(records),17)],output_dtypes=[mx.uint32],stream=mx.gpu)[0]
    mx.eval(output)
    np.testing.assert_array_equal(np.array(output),np.asarray(expected,dtype=np.uint32))
    return len(records)


def split_checks():
    rng = random.Random(0x61F)
    scalars = [0, 1, N-1, N//2, 2**128-1, 2**128, 2**255, LAMBDA]
    scalars += [rng.randrange(N) for _ in range(10000)]
    kernel = mx.fast.metal_kernel(name='sfc_test_glv',input_names=['records'],output_names=['results'],
                                 header=header(),source='''
        uint i=thread_position_in_grid.x;
        if(i>=uint(records_shape[0])) return;
        U256x k,a,b; for(uint j=0;j<8;++j) k.w[j]=records[i*8+j];
        results[i*17]=split_scalar(k,a,b);
        for(uint j=0;j<8;++j) { results[i*17+1+j]=a.w[j]; results[i*17+9+j]=b.w[j]; }
    ''')
    records = mx.array(np.asarray([limbs(k) for k in scalars],dtype=np.uint32))
    output = kernel(inputs=[records],grid=(len(scalars),1,1),threadgroup=(32,1,1),
                    output_shapes=[(len(scalars),17)],output_dtypes=[mx.uint32],stream=mx.gpu)[0]
    mx.eval(output)
    for k, row in zip(scalars,np.array(output),strict=True):
        flags = int(row[0])
        a = sum(int(row[1+j]) << (32*j) for j in range(8))
        b = sum(int(row[9+j]) << (32*j) for j in range(8))
        assert flags < 4 and a < 2**128 and b < 2**128
        if flags & 1: a = -a
        if flags & 2: b = -b
        assert (a + LAMBDA*b) % N == k
    return len(scalars)


def run(cases, gpu=None):
    gpu = gpu or Recovery()
    started = time.perf_counter()
    operations = arithmetic_checks()
    splits = split_checks()
    joins = jacobian_checks()
    expected = [c['expected'] for c in cases]
    # Full mixed batch, uneven tail, reversed order and duplicate records.
    actual = gpu.recover(cases)
    for case, want, got in zip(cases, expected, actual, strict=True):
        assert got == want, f"GPU mismatch for {case['label']}: {got} != {want}"
    selected = list(reversed(cases[-293:])) + cases[:3] + cases[:3]
    assert gpu.recover(selected) == [c['expected'] for c in selected]
    # Small batches, including one thread and non-threadgroup multiples.
    for size in [1, 2, 31, 32, 33, 65]:
        assert gpu.recover(cases[:size]) == expected[:size]
    # Exercise both pipeline implementations, chunk tails, all-invalid batches,
    # and repeated dispatches to catch size-sensitive/compiler regressions.
    invalid = [case for case in cases if case['expected'] is None]
    for mode in ['direct', 'batched', 'cooperative']:
        implementation = Recovery(mode)
        assert implementation.recover(cases) == expected
        assert implementation.recover(invalid) == [None]*len(invalid)
        for size in [1, 31, 32, 33, 127, 128, 129, 2047, 2048, 2049, 4095, 4096, 4097, 8191, 8192, 8193]:
            if size <= len(cases):
                assert implementation.recover(cases[:size]) == expected[:size]
        for _ in range(5):
            assert implementation.recover(cases[:4096]) == expected[:4096]
    for size in [2047, 2048, 2049]:
        assert gpu.recover(cases[:size]) == expected[:size]
    shuffled = list(cases)
    random.Random(0x51A).shuffle(shuffled)
    assert gpu.recover(shuffled) == [case['expected'] for case in shuffled]
    assert gpu.recover([]) == []
    for field, value in [('digest', '00'), ('signature', 'ff'), ('parity', 256),
                         ('parity', -1), ('parity', 0.5), ('parity', True),
                         ('digest', ' '*64), ('signature', '0'*127+'g')]:
        invalid = dict(cases[0], **{field: value})
        try:
            pack([invalid])
        except ValueError:
            pass
        else:
            raise AssertionError(f'host accepted malformed {field}')
    spaced = dict(cases[0], digest=' '.join(cases[0]['digest'][i:i+2] for i in range(0,64,2)))
    np.testing.assert_array_equal(pack([spaced]),pack([cases[0]]))
    for malformed in [mx.zeros((2,24),dtype=mx.uint32), mx.zeros((2,25)), mx.zeros((25,),dtype=mx.uint32)]:
        try:
            gpu.dispatch(malformed)
        except ValueError:
            pass
        else:
            raise AssertionError('accepted malformed packed array')
    report = dict(arithmetic_operations=operations, recovery_vectors=len(cases),
                  glv_decompositions=splits, jacobian_additions=joins, pipelines=["direct", "batched", "cooperative"],
                  all_pipelines_and_repeated_dispatches=True,
                  accepted=sum(x is not None for x in expected),
                  rejected=sum(x is None for x in expected),
                  additional_order_duplicate_and_small_batch_checks=True,
                  seconds=time.perf_counter()-started, passed=True)
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fixtures', default='target/mlx-ecdsa/fixtures.capnp')
    args = parser.parse_args()
    print(run(codec.read(args.fixtures)))
