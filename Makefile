.DEFAULT_GOAL := help
CARGO ?= cargo
DATA_DIR ?= .sfc
CONFIG ?= $(DATA_DIR)/config.json

.PHONY: help doctor fetch build release schema fmt lint test test-journal check init run dev archive peer-status smoke erc20 integration bench clean
help:
	@echo 'SFC commands:'
	@echo '  make              Show this help'
	@echo '  make start        Build release and start a background node (auto-init new home)'
	@echo '  make stop         Stop the continuous stress test and managed background node'
	@echo '  make run          Run release node in foreground'
	@echo '  make testnet      Run a Python-supervised multi-node network in foreground'
	@echo '  make check        Run lint and Rust tests'
	@echo '  make integration  Run network, ERC-20, supervisor and pruning tests'
	@echo '  make test-two-nodes  Test two Python-supervised nodes with signed transactions and crashes'
	@echo '  make test-emergencies  Inject crashes, freezes, partitions and recovery failures into two nodes'
	@echo '  make benchmark    Measure local transaction processing throughput (alias: bench)'
	@echo '  make bench-network  Measure HTTP admission through two-node durable HTTP/3 replay'
	@echo '  make stresstest   Continuous persistent release/GPU test; stop with make stop'
	@echo '  make bench-mlx    Validate and benchmark experimental Apple GPU ECDSA recovery'
	@echo '  make test-mlx     Run GPU arithmetic/recovery differential checks only'
	@echo '  Other: doctor fetch build release schema fmt lint test init archive dev run-log'
	@echo '         peer-status smoke erc20 test-journal test-rpc test-http3 test-sync'
	@echo '         test-pruning test-supervisor smoke-tcp all clean'
	@echo '  Options: DATA_DIR=.sfc CONFIG=.sfc/config.json NODES=4 CARGO=cargo'
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
smoke: build
	python3 scripts/smoke.py
bench:
	$(CARGO) bench --locked -p sfc --bench execution
clean:
	$(CARGO) clean

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
TESTNET_DIR ?= .sfc-testnet
RPC_PORT ?= 8545
PEER_PORT ?= 26656
.PHONY: testnet test-supervisor
testnet: build
	$(PYTHON) scripts/supervisor.py --home '$(TESTNET_DIR)' --nodes '$(NODES)' --rpc-port '$(RPC_PORT)' --peer-port '$(PEER_PORT)'
test-supervisor: build test-deps
	$(PYTHON) scripts/test_supervisor.py
test-two-nodes: build test-deps
	$(PYTHON) scripts/test_supervisor.py --nodes 2
test-emergencies: build test-deps
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

TRANSPORT ?= http3

.PHONY: test-pruning
test-pruning: build
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
	./target/release/sfc run --config '$(CONFIG)' 2>> '$(DATA_DIR)/node.jsonl'

.PHONY: start stop
start: release
	$(PYTHON) scripts/service.py start --home '$(DATA_DIR)' --config '$(CONFIG)'
stop:
	$(PYTHON) scripts/stresstest.py stop --home '$(STRESS_DIR)'
	$(PYTHON) scripts/service.py stop --home '$(DATA_DIR)' --config '$(CONFIG)'

.PHONY: test-service
test-service: release
	$(PYTHON) scripts/test_service.py

.PHONY: benchmark
benchmark: bench

.PHONY: dashboard
dashboard: test-deps
	npm run build:dashboard

.PHONY: bench-network
bench-network: release test-deps
	$(PYTHON) scripts/benchmark_network.py

STRESS_TRANSACTIONS ?= 65536
STRESS_BATCH ?= 4096
STRESS_INTERVAL ?= 100
STRESS_DIR ?= .sfc-stress
STRESS_REPORT ?= $(STRESS_DIR)/results.jsonl
.PHONY: stresstest
stresstest: release test-deps mlx-setup
	$(PYTHON) scripts/stresstest.py run --binary '$(CURDIR)/target/release/sfc' \
		--home '$(STRESS_DIR)' --transactions '$(STRESS_TRANSACTIONS)' \
		--rpc-batch '$(STRESS_BATCH)' --interval '$(STRESS_INTERVAL)' \
		--output '$(STRESS_REPORT)'

.PHONY: test-stresstest
test-stresstest: release test-deps mlx-setup
	$(PYTHON) scripts/test_stresstest.py

# Apple MLX setup is required for the default GPU transaction verifier.
MLX_PYTHON ?= python3.13
.PHONY: mlx-setup mlx-oracle test-mlx bench-mlx bench-mlx-cpu bench-mlx-optimized
mlx-setup:
	UV_CACHE_DIR='$(CURDIR)/target/uv-cache' uv venv --allow-existing --python '$(MLX_PYTHON)' target/mlx-venv
	UV_CACHE_DIR='$(CURDIR)/target/uv-cache' uv pip install --python target/mlx-venv/bin/python -r experiments/mlx_ecdsa/requirements.txt
mlx-oracle:
	$(CARGO) build --locked --release --example ecdsa_oracle
test-mlx: mlx-setup mlx-oracle
	target/mlx-venv/bin/python experiments/mlx_ecdsa/benchmark.py --tests-only --output target/mlx-ecdsa/validation.json
bench-mlx: mlx-setup mlx-oracle
	target/mlx-venv/bin/python experiments/mlx_ecdsa/benchmark.py
bench-mlx-cpu: mlx-setup mlx-oracle
	target/mlx-venv/bin/python experiments/mlx_ecdsa/cpu_usage.py
bench-mlx-optimized: mlx-setup mlx-oracle
	target/mlx-venv/bin/python experiments/mlx_ecdsa/benchmark_optimized.py

.PHONY: test-verification bench-backends
test-verification: release test-deps mlx-setup
	$(CARGO) test --locked --test verification -- --include-ignored
	$(PYTHON) scripts/test_verification_network.py
bench-backends: release test-deps mlx-setup
	$(PYTHON) scripts/benchmark_network.py --backend all --rpc-batch 4096 --transactions 65536

.PHONY: bench-mlx-latency
bench-mlx-latency: mlx-setup mlx-oracle
	target/mlx-venv/bin/python experiments/mlx_ecdsa/benchmark_latency.py
