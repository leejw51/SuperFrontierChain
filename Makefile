.DEFAULT_GOAL := help
CARGO ?= cargo
DATA_DIR ?= .sfc-v3
CONFIG ?= $(DATA_DIR)/config.capnp

.PHONY: help doctor fetch build release schema fmt lint test test-journal check init run dev archive peer-status smoke erc20 integration bench clean
help:
	@echo 'SFC commands:'
	@echo '  make              Show this help'
	@echo '  make start        Build release and start a background node (auto-init new home)'
	@echo '  make stop         Stop all blockchain processes belonging to this repository'
	@echo '  make clearall     Stop nodes and delete repository .sfc* chain homes (including archives)'
	@echo '  make stressstart  Python-supervised background release/GPU stress test'
	@echo '  make run          Run release node in foreground'
	@echo '  make testnet      Run a Python-supervised multi-node network in foreground'
	@echo '  make check        Run lint and Rust tests'
	@echo '  make integration  Run network, ERC-20, supervisor and pruning tests'
	@echo '  make test-two-nodes  Test two Python-supervised nodes with signed transactions and crashes'
	@echo '  make test-emergencies  Inject crashes, freezes, partitions and recovery failures into two nodes'
	@echo '  make benchmark    Rust-only release TPS/CPU benchmark; SQLite ON/OFF'
	@echo '  make bench-network  Measure binary admission through two-node durable replay'
	@echo '  make bench-transports  Compare TCP and HTTP/3 with alternating trial order'
	@echo '  make stresstest   Continuous release/GPU test; Ctrl-C / Ctrl-Z / make stop'
	@echo '  make bench-backends  Compare CPU, native MLX GPU, HYBRID using Rust'
	@echo '  make test-mlx     Run GPU arithmetic/recovery differential checks only'
	@echo '  Other: doctor fetch build release schema fmt lint test init archive dev run-log'
	@echo '         peer-status smoke erc20 test-journal test-rpc test-http3 test-sync'
	@echo '         test-pruning test-supervisor smoke-tcp all clean'
	@echo '  Options: DATA_DIR=.sfc-v3 CONFIG=.sfc-v3/config.capnp NODES=4 CARGO=cargo'
	@echo '  Dashboard: http://127.0.0.1:8545/dashboard (default RPC port)'
doctor:
	@command -v cargo
	@command -v rustc
	@command -v capnp
	@command -v clang
	@cargo --version
	@capnp --version
fetch:
	$(CARGO) fetch --locked
build:
	$(CARGO) build --locked --workspace
release:
	$(CARGO) build --locked --workspace --release
schema:
	$(CARGO) check --locked -p sfc
fmt:
	$(CARGO) fmt --all
lint:
	$(CARGO) fmt --all -- --check
	$(CARGO) clippy --locked --workspace --all-targets -- -D warnings
test:
	$(CARGO) test --locked --workspace
check: lint test
init: build
	$(CARGO) run --locked -p sfc -- init --home '$(DATA_DIR)'
run: release
	$(CARGO) run --locked --release -p sfc -- run --config '$(CONFIG)'
archive: build
	$(CARGO) run --locked -p sfc -- init --home '$(DATA_DIR)' --archive
smoke: build codec-setup
	python3 scripts/smoke.py
bench:
	$(CARGO) bench --locked -p sfc --bench execution
clean:
	$(CARGO) clean

# Preserve supervisor locks: deleting them could let concurrent starts bypass locking.
# Only repository-local chain homes are removed; symlinks are never followed.
.PHONY: clearall
clearall: stop
	@set -eu; \
	for dir in "$(CURDIR)"/.sfc*; do \
		[ -d "$$dir" ] || continue; \
		[ ! -L "$$dir" ] || continue; \
		[ "$$dir" != "$(CURDIR)/.sfc-processes" ] || continue; \
		printf 'Removing chain data: %s\n' "$$dir"; \
		rm -rf -- "$$dir"; \
	done; \
	printf 'Repository chain data cleared. Custom homes outside .sfc* are unchanged.\n'

.PHONY: erc20 integration
# JavaScript is test tooling only; node and execution runtime are Rust.
erc20: build test-deps
	npm test
integration: smoke erc20

.PHONY: dev peer-status
dev: build
	$(CARGO) run --locked -p sfc -- run --config '$(CONFIG)'
PEER ?= 127.0.0.1:26656
CERT ?= $(DATA_DIR)/peer-cert.der
peer-status: build
	$(CARGO) run --locked -p sfc -- peer-status --address '$(PEER)' --certificate '$(CERT)' --transport '$(TRANSPORT)'

.PHONY: all
all: check integration release

.PHONY: test-journal
test-journal:
	$(CARGO) test --locked -p sfc --test journal

PYTHON ?= python3
NODES ?= 4
TESTNET_DIR ?= .sfc-testnet-v3
RPC_PORT ?= 8545
PEER_PORT ?= 26656
.PHONY: testnet test-supervisor
testnet: build codec-setup
	$(PYTHON) scripts/supervisor.py --home '$(TESTNET_DIR)' --nodes '$(NODES)' --rpc-port '$(RPC_PORT)' --peer-port '$(PEER_PORT)'
test-supervisor: build test-deps codec-setup
	$(PYTHON) scripts/test_supervisor.py
test-two-nodes: build test-deps codec-setup
	$(PYTHON) scripts/test_supervisor.py --nodes 2
test-emergencies: build test-deps codec-setup
	$(PYTHON) scripts/test_emergencies.py
integration: test-emergencies

.PHONY: test-deps test-two-nodes test-emergencies
test-deps:
	npm ci --ignore-scripts
integration: test-supervisor

.PHONY: test-rpc smoke-tcp
test-rpc: build
	$(CARGO) test --locked -p sfc --test network
	$(PYTHON) scripts/smoke.py
	$(PYTHON) scripts/smoke.py --transport tcp
smoke-tcp: build
	$(PYTHON) scripts/smoke.py --transport tcp
integration: smoke-tcp

TRANSPORT ?= tcp

.PHONY: test-pruning
test-pruning: build codec-setup
	$(CARGO) test --locked -p sfc --test pruning
	$(PYTHON) scripts/test_pruning.py
integration: test-pruning

.PHONY: test-http3
test-http3: build
	$(CARGO) test --locked -p sfc --test http3 --test network
	$(PYTHON) scripts/smoke.py

.PHONY: test-sync
test-sync: test-http3 test-supervisor test-pruning

.PHONY: run-log
run-log: release
	@mkdir -p '$(DATA_DIR)'
	./target/release/sfc run --config '$(CONFIG)' 2>> '$(DATA_DIR)/node.log'

.PHONY: start stop
start: release codec-setup
	$(PYTHON) scripts/service.py start --home '$(DATA_DIR)' --config '$(CONFIG)'
stop:
	python3 scripts/stress_supervisor.py stop
target/release/sfc-bench:
	$(CARGO) build --locked --release -p sfc --bin sfc-bench

.PHONY: test-service
test-service: release codec-setup
	$(PYTHON) scripts/test_service.py

.PHONY: benchmark
BENCH_TRANSACTIONS ?= 262144
BENCH_REPEAT ?= 3
BENCH_SQLITE ?= both
BENCH_BACKEND ?= gpu
BENCH_TRANSPORT ?= tcp
BENCH_INFLIGHT ?= 1
SYNC_TRANSPORT ?= $(BENCH_TRANSPORT)
GPU_RUNTIME ?= mlx-native
benchmark: release
	RAYON_NUM_THREADS='$(STRESS_THREADS)' ./target/release/sfc-bench bench --transactions '$(BENCH_TRANSACTIONS)' \
		--repeat '$(BENCH_REPEAT)' --sqlite '$(BENCH_SQLITE)' --backend '$(BENCH_BACKEND)' --gpu-runtime '$(GPU_RUNTIME)' --transport '$(BENCH_TRANSPORT)' --inflight '$(BENCH_INFLIGHT)'

.PHONY: dashboard
dashboard: test-deps
	npm run build:dashboard

.PHONY: bench-network
bench-network: release
	RAYON_NUM_THREADS='$(STRESS_THREADS)' ./target/release/sfc-bench bench --nodes 2 --transactions '$(BENCH_TRANSACTIONS)' \
		--repeat '$(BENCH_REPEAT)' --sqlite '$(BENCH_SQLITE)' --backend '$(BENCH_BACKEND)' --gpu-runtime '$(GPU_RUNTIME)' --transport '$(BENCH_TRANSPORT)' --inflight '$(BENCH_INFLIGHT)' --sync-transport '$(SYNC_TRANSPORT)'

STRESS_TRANSACTIONS ?= 1048576
STRESS_BATCH ?= 4096
STRESS_INTERVAL ?= 10
STRESS_THREADS ?= 12
STRESS_SQLITE ?= on
STRESS_BIND ?= 0.0.0.0
STRESS_DIR ?= .sfc-stress-merkle-v1
STRESS_REPORT ?= $(STRESS_DIR)/results.capnp
.PHONY: stresstest stressstart
STRESS_COMMAND = '$(CURDIR)/target/release/sfc-bench' run --binary '$(CURDIR)/target/release/sfc' \
		--rpc-bind '$(STRESS_BIND)' --nodes 1 --backend gpu --home '$(STRESS_DIR)' --transactions '$(STRESS_TRANSACTIONS)' \
		--rpc-batch '$(STRESS_BATCH)' --interval '$(STRESS_INTERVAL)' \
		--output '$(STRESS_REPORT)' --sqlite '$(STRESS_SQLITE)' --gpu-runtime '$(GPU_RUNTIME)' --transport '$(BENCH_TRANSPORT)' --inflight '$(BENCH_INFLIGHT)'
stresstest:
	RAYON_NUM_THREADS='$(STRESS_THREADS)' python3 scripts/stress_supervisor.py run -- $(STRESS_COMMAND)
stressstart:
	RAYON_NUM_THREADS='$(STRESS_THREADS)' python3 scripts/stress_supervisor.py start -- $(STRESS_COMMAND)

.PHONY: test-stress-supervisor
test-stress-supervisor:
	python3 scripts/test_stress_supervisor.py

.PHONY: test-stresstest
test-stresstest: release
	$(CARGO) test --locked --release --test native_benchmark -- --ignored --test-threads=1

.PHONY: test-benchmark-metrics test-migrations
test-benchmark-metrics:
	$(CARGO) test --locked --release --bin sfc-bench
test-migrations:
	$(CARGO) test --locked -p sfc --lib schema::tests
	$(CARGO) test --locked -p sfc --test migrations
integration: test-benchmark-metrics

.PHONY: test-fixture
test-fixture: test-deps
	node scripts/test_fixture.mjs
integration: test-fixture

# MLX is built and tested through Rust. No Python MLX environment is installed.
.PHONY: mlx-setup mlx-oracle test-mlx bench-mlx bench-mlx-cpu bench-mlx-optimized
mlx-setup: release
mlx-oracle:
	$(CARGO) build --locked --release --example ecdsa_oracle
test-mlx: release
	$(CARGO) test --locked --release --lib mlx_native_differential -- --ignored
bench-mlx bench-mlx-optimized bench-mlx-latency: benchmark
bench-mlx-cpu: bench-backends

.PHONY: test-verification bench-backends
test-verification: release
	$(CARGO) test --locked --release --test verification -- --include-ignored
	$(CARGO) test --locked --release --lib native_recovery -- --ignored
	$(CARGO) test --locked --release --lib mlx_native_differential -- --ignored
bench-backends: release
	@for backend in cpu gpu hybrid; do \
		RAYON_NUM_THREADS='$(STRESS_THREADS)' ./target/release/sfc-bench bench \
			--backend "$$backend" --transactions '$(BENCH_TRANSACTIONS)' \
			--repeat '$(BENCH_REPEAT)' --sqlite '$(BENCH_SQLITE)' --gpu-runtime '$(GPU_RUNTIME)' --transport '$(BENCH_TRANSPORT)' --inflight '$(BENCH_INFLIGHT)' || exit $$?; \
	done

# Python is confined to supervisor configuration/control and process lifecycle.
SUPERVISOR_PYTHON ?= python3.13
.PHONY: codec-setup
codec-setup:
	UV_CACHE_DIR='$(CURDIR)/target/uv-cache' uv venv --allow-existing --python '$(SUPERVISOR_PYTHON)' target/supervisor-venv
	UV_CACHE_DIR='$(CURDIR)/target/uv-cache' uv pip install --offline --python target/supervisor-venv/bin/python pycapnp==2.2.4 || \
	UV_CACHE_DIR='$(CURDIR)/target/uv-cache' uv pip install --python target/supervisor-venv/bin/python pycapnp==2.2.4

.PHONY: test-codec
test-codec: test-deps
	$(CARGO) test --locked --release --test codec
	$(CARGO) build --locked --release --example codec_roundtrip --bin sfc
	node scripts/test_codec.mjs
integration: test-codec

.PHONY: test-indexer-toggle
test-indexer-toggle: release
	$(CARGO) test --locked --release --test native_benchmark rust_stress_stop_restart_lock_and_sqlite_toggle -- --ignored --test-threads=1

# Alternate transport order to reduce systematic thermal/order bias. Reports append.
BENCH_NODES ?= 1
TRANSPORT_REPORT ?= target/transport-benchmark.capnp
.PHONY: bench-transports
bench-transports: release
	@i=1; while [ $$i -le '$(BENCH_REPEAT)' ]; do \
		if [ $$((i % 2)) -eq 1 ]; then order='tcp http3'; else order='http3 tcp'; fi; \
		for transport in $$order; do \
			RAYON_NUM_THREADS='$(STRESS_THREADS)' ./target/release/sfc-bench bench \
				--nodes '$(BENCH_NODES)' --transactions '$(BENCH_TRANSACTIONS)' --repeat 1 \
				--sqlite '$(BENCH_SQLITE)' --backend '$(BENCH_BACKEND)' --gpu-runtime '$(GPU_RUNTIME)' \
				--transport $transport --sync-transport $transport --inflight '$(BENCH_INFLIGHT)' --output '$(TRANSPORT_REPORT)' || exit $$?; \
		done; i=$$((i + 1)); \
	done

.PHONY: test-stress-signals
test-stress-signals:
	python3 scripts/test_stress_signals.py
