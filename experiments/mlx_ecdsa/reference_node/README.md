# Frozen node GPU baseline

These are byte-for-byte copies of `recovery.py`, `secp256k1.metal` and `worker.py`
before cooperative per-signature parallelism was added on 2026-10-20. They preserve
the previous optimized node verifier for paired latency and full-network benchmarks.
They are not used by the node's default configuration. See the GPU enhancement report
for measured results and source hashes; do not modify this baseline during tuning.
