fn main() {
    println!("cargo:rerun-if-changed=schema/chain.capnp");
    capnpc::CompilerCommand::new()
        .src_prefix("schema")
        .file("schema/chain.capnp")
        .run()
        .expect("install the Cap'n Proto compiler (capnp) before building SFC");
}
