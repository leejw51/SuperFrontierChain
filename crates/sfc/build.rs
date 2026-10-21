#[path = "build/metal_source.rs"]
mod metal_source;

fn main() {
    println!("cargo:rerun-if-changed=schema/chain.capnp");
    println!("cargo:rerun-if-changed=schema/runtime.capnp");
    println!("cargo:rerun-if-changed=schema/storage.capnp");
    capnpc::CompilerCommand::new()
        .src_prefix("schema")
        .file("schema/chain.capnp")
        .file("schema/runtime.capnp")
        .file("schema/storage.capnp")
        .run()
        .expect("install the Cap'n Proto compiler (capnp) before building SFC");
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("macos") {
        let arithmetic = "../../experiments/mlx_ecdsa/secp256k1.metal";
        let kernels = "src/gpu/kernels.metal";
        println!("cargo:rerun-if-changed={arithmetic}");
        println!("cargo:rerun-if-changed={kernels}");
        let source = metal_source::generate(
            &std::fs::read_to_string(arithmetic).expect("Metal arithmetic source"),
            &std::fs::read_to_string(kernels).expect("Metal entry points"),
        );
        std::fs::write(
            std::path::Path::new(&std::env::var_os("OUT_DIR").unwrap()).join("recovery.metal"),
            source,
        )
        .expect("write generated Metal source");
        let header = metal_source::generate(
            &std::fs::read_to_string(arithmetic).expect("Metal arithmetic source"),
            "",
        );
        let out = std::path::PathBuf::from(std::env::var_os("OUT_DIR").unwrap());
        std::fs::write(out.join("mlx-header.metal"), header).expect("write MLX header");
        let kernels = std::fs::read_to_string(kernels).expect("Metal kernels");
        // Share the exact arithmetic bodies with the direct Metal backend.
        // MLX provides shape metadata and built-in grid coordinates instead of
        // the explicit count/grid parameters of native Metal entry points.
        for (name, input, index) in [
            ("sfc_direct_prepare", "records", "i"),
            ("sfc_direct_recover", "tables", "i"),
            ("sfc_cooperative_prepare", "records", "tid"),
            ("sfc_cooperative_terms", "tables", "tid"),
            ("sfc_cooperative_join", "points", "i"),
        ] {
            let entry = kernels
                .split(&format!("kernel void {name}("))
                .nth(1)
                .expect("unique Metal entry point");
            let body = entry.split_once('{').expect("kernel body").1;
            let mut depth = 1i32;
            let end = body
                .char_indices()
                .find_map(|(i, c)| {
                    match c {
                        '{' => depth += 1,
                        '}' => depth -= 1,
                        _ => (),
                    }
                    (depth == 0).then_some(i)
                })
                .expect("balanced kernel body");
            let source = format!(
                "uint count=uint({input}_shape[0]);\nuint {index}=thread_position_in_grid.x;\n{}",
                &body[..end]
            );
            std::fs::write(out.join(format!("{name}.mlx")), source).expect("write MLX body");
        }
    }
}
