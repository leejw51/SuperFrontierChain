This is mlx-sys 0.6.0 from crates.io, including its upstream licenses and MLX C API.

Local build-only patch: `src/mlx-c/CMakeLists.txt` uses `GIT_SHALLOW TRUE`
when fetching the same upstream MLX v0.32.2 tag. This avoids downloading the
repository's full history. The C API and MLX arithmetic are unmodified.
`build.rs` disables unused C examples and enables upstream `MLX_METAL_JIT`.
MLX embeds built-in kernel sources instead of requiring an external precompiled
metallib. SFC warms both custom recovery pipelines before timing.

The workspace pins this source with `[patch.crates-io]`. Python bindings are
disabled by upstream CMake. `.cargo/config.toml` places the compiled Metal
library under the workspace's build artifacts.
