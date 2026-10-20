# Original GPU baseline

These two files preserve the original, correctness-tested MLX implementation
before optimization. `benchmark_optimized.py` imports them only to measure the
old and new implementations on the same fixtures in randomized order. They are
not imported by the optimized recovery API or the blockchain node.
