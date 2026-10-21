//! Exact public constants for the native Metal verifier, generated without Python.
use num_bigint::BigUint;
use num_traits::{One, Zero};
use std::collections::BTreeSet;

type Point = (BigUint, BigUint);
fn hex(s: &str) -> BigUint {
    BigUint::parse_bytes(s.as_bytes(), 16).expect("constant hex")
}
fn limbs(value: &BigUint) -> String {
    let mut words = value.to_u32_digits();
    assert!(words.len() <= 8);
    words.resize(8, 0);
    words
        .iter()
        .map(|w| format!("0x{w:x}u"))
        .collect::<Vec<_>>()
        .join(",")
}
fn add(a: &Point, b: &Point, p: &BigUint) -> Point {
    let (numerator, denominator) = if a == b {
        (
            BigUint::from(3u8) * &a.0 * &a.0 % p,
            BigUint::from(2u8) * &a.1 % p,
        )
    } else {
        ((&a.1 + p - &b.1) % p, (&a.0 + p - &b.0) % p)
    };
    assert!(!denominator.is_zero());
    let slope = numerator * denominator.modpow(&(p - 2u8), p) % p;
    let x = (&slope * &slope + p + p - &a.0 - &b.0) % p;
    let y = (&slope * ((&a.0 + p - &x) % p) + p - &a.1) % p;
    (x, y)
}
fn ones(length: usize, scalar: bool, known: &mut BTreeSet<usize>, out: &mut String) {
    if known.contains(&length) {
        return;
    }
    let half = length / 2;
    ones(half, scalar, known, out);
    out.push_str(&format!(
        "U256x x{length}=mul_mod<{scalar}>(square_n<{scalar}>(x{half},{half}),x{half});\n"
    ));
    if length % 2 == 1 {
        out.push_str(&format!(
            "x{length}=mul_mod<{scalar}>(square_n<{scalar}>(x{length},1),x1);\n"
        ));
    }
    known.insert(length);
}
fn fixed_power(name: &str, exponent: &BigUint, scalar: bool) -> String {
    let mut out = format!("U256x {name}(U256x a) {{\nU256x x1=a;\n");
    let mut runs = Vec::<(u8, usize)>::new();
    for bit in exponent.to_str_radix(2).bytes() {
        if let Some((previous, length)) = runs.last_mut() {
            if *previous == bit {
                *length += 1;
                continue;
            }
        }
        runs.push((bit, 1));
    }
    let mut known = BTreeSet::from([1]);
    for &(bit, length) in &runs {
        if bit == b'1' {
            ones(length, scalar, &mut known, &mut out);
        }
    }
    let mut symbolic = (BigUint::one() << runs[0].1) - 1u8;
    out.push_str(&format!("U256x result=x{};\n", runs[0].1));
    for &(bit, length) in &runs[1..] {
        out.push_str(&format!("result=square_n<{scalar}>(result,{length});\n"));
        symbolic <<= length;
        if bit == b'1' {
            out.push_str(&format!("result=mul_mod<{scalar}>(result,x{length});\n"));
            symbolic += (BigUint::one() << length) - 1u8;
        }
    }
    assert_eq!(&symbolic, exponent);
    out.push_str("return result;\n}\n");
    out
}
pub fn generate(arithmetic: &str, kernels: &str) -> String {
    let p: BigUint = (BigUint::one() << 256usize) - (BigUint::one() << 32usize) - 977u32;
    let n = hex("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
    let r: BigUint = BigUint::one() << 256;
    let lambda = hex("5363AD4CC05C30E0A5261C028812645A122E22EA20816678DF02967C1B23BD72");
    let b2 = hex("3086D221A7D46BCDE86C90E49284EB15");
    let minus_b1 = hex("E4437ED6010E88286F547FA90ABFE4C3");
    let values = [
        ("MOD_P", p.clone()),
        ("MOD_N", n.clone()),
        ("ONE_P", BigUint::one()),
        ("ONE_N", &r % &n),
        ("R2_P", BigUint::one()),
        ("R2_N", &r * &r % &n),
        ("SQRT_P", (&p + 1u8) / 4u8),
        ("P_MINUS_TWO", &p - 2u8),
        ("N_MINUS_TWO", &n - 2u8),
        ("HALF_N_PLUS_ONE", &n / 2u8 + 1u8),
        (
            "BETA",
            hex("7AE96A2B657C07106E64479EAC3434E99CF0497512F58995C1396C28719501EE"),
        ),
        ("LAMBDA_MONT", lambda * &r % &n),
        ("MINUS_B1_MONT", &minus_b1 * &r % &n),
        ("MINUS_B2_MONT", (&n - &b2) * &r % &n),
        ("SPLIT_G1", ((BigUint::one() << 384) * &b2 + &n / 2u8) / &n),
        (
            "SPLIT_G2",
            ((BigUint::one() << 384) * &minus_b1 + &n / 2u8) / &n,
        ),
    ];
    let mut source = String::from("#include <metal_stdlib>\nusing namespace metal;\n");
    for (name, value) in values {
        source.push_str(&format!(
            "constant uint {name}[8] = {{{}}};\n",
            limbs(&value)
        ));
    }
    for (name, value) in [("P", &p), ("N", &n)] {
        let low = value.to_u32_digits()[0];
        let mut inverse = 1u32;
        for _ in 0..5 {
            inverse = inverse.wrapping_mul(2u32.wrapping_sub(low.wrapping_mul(inverse)));
        }
        assert_eq!(inverse.wrapping_mul(low), 1);
        source.push_str(&format!(
            "constant uint INV_{name} = {}u;\n",
            inverse.wrapping_neg()
        ));
    }
    let g = (
        hex("79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"),
        hex("483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8"),
    );
    let mut shifted = g.clone();
    for _ in 0..128 {
        shifted = add(&shifted, &shifted, &p);
    }
    let mut tables = Vec::new();
    for base in [g, shifted] {
        let mut table = vec![(BigUint::zero(), BigUint::zero()), base.clone()];
        for _ in 2..16 {
            table.push(add(table.last().unwrap(), &base, &p));
        }
        tables.push(table);
    }
    source.push_str("constant uint TABLE_G_COMB[256][16] = {");
    for high in 0..16 {
        for low in 0..16 {
            let point = if low == 0 {
                tables[1][high].clone()
            } else if high == 0 {
                tables[0][low].clone()
            } else {
                add(&tables[0][low], &tables[1][high], &p)
            };
            source.push_str(&format!("{{{},{}}},", limbs(&point.0), limbs(&point.1)));
        }
    }
    source.push_str("};\n");
    let powers = [
        fixed_power("sqrt_field", &((&p + 1u8) / 4u8), false),
        fixed_power("inverse_field", &(&p - 2u8), false),
        fixed_power("inverse_scalar", &(&n - 2u8), true),
    ]
    .concat();
    source.push_str(&arithmetic.replace("// FIXED_POWER_FUNCTIONS", &powers));
    source.push_str(kernels);
    source
}
