#!/usr/bin/env python3
"""Real-process HTTP/3 catch-up, pin verification, restart, and JSON-RPC smoke test."""
import argparse
import json
import sfc_codec as codec
import pathlib
import signal
import socket
import subprocess
import tempfile
import time
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
BIN = ROOT / "target/debug/sfc"


def port(udp=False):
    with socket.socket(type=socket.SOCK_DGRAM if udp else socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def rpc(url, method, params=None):
    req = urllib.request.Request(url, json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params or []}).encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=3) as response:
        result = json.load(response)
    assert "error" not in result, result
    return result["result"]


def wait(predicate, label):
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        try:
            if predicate():
                return
        except (OSError, AssertionError):
            pass
        time.sleep(0.05)
    raise AssertionError(f"timeout: {label}")


def stop(process):
    if process.poll() is None:
        process.send_signal(signal.SIGINT)
        process.wait(timeout=10)
    assert process.returncode == 0, process.returncode


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--transport", choices=["http3", "tcp"], default="http3")
    transport = parser.parse_args().transport
    with tempfile.TemporaryDirectory(prefix="sfc-smoke-") as tmp:
        homes = [pathlib.Path(tmp) / name for name in ["leader", "follower"]]
        configs = []
        for home in homes:
            subprocess.run([BIN, "init", "--home", home], check=True, capture_output=True)
            config = codec.loads((home / "config.jsonl").read_bytes())
            config.update(rpc_listen=f"127.0.0.1:{port()}", peer_listen=f"127.0.0.1:{port(True)}", block_interval_ms=500)
            if transport == "tcp":
                config["capnp_listen"] = f"127.0.0.1:{port()}"
            configs.append(config)
        (homes[1] / "genesis.capnp").write_bytes((homes[0] / "genesis.capnp").read_bytes())
        address = configs[0]["capnp_listen" if transport == "tcp" else "peer_listen"]
        configs[1]["sync_peer"] = {"transport": transport, "address": address, "server_name": "localhost", "certificate": configs[0]["tls_cert"]}
        for home, config in zip(homes, configs):
            (home / "config.jsonl").write_bytes(codec.dumps(config))
        urls = ["http://" + c["rpc_listen"] for c in configs]
        processes = []
        logs = []
        try:
            for home in homes:
                log = (home / "node.log").open("w+")
                logs.append(log)
                processes.append(subprocess.Popen([BIN, "run", "--config", home / "config.jsonl"], stdout=log, stderr=log))
                wait(lambda: rpc(urls[len(processes)-1], "eth_chainId") == "0x1e61", "RPC startup")
            with urllib.request.urlopen(urls[0] + "/dashboard", timeout=3) as response:
                assert response.status == 200
                assert b"SF CHAIN" in response.read()
            with urllib.request.urlopen(urls[0] + "/dashboard/stats", timeout=3) as response:
                assert response.headers["Cache-Control"] == "no-store"
                assert response.headers["Content-Type"] == "application/x-capnp"
                stats = codec.load(response)
                assert stats["chainId"] == 7777
                assert stats["retention"]["mode"] == "pruned"
                assert stats["role"] == "Development sequencer"
                assert stats["recentBlocks"][0]["height"] == stats["height"]
            with urllib.request.urlopen(urls[1] + "/dashboard/stats", timeout=3) as response:
                assert codec.load(response)["role"] == "Follower"
            peer = subprocess.run([BIN, "peer-status", "--address", address, "--transport", transport, "--certificate", configs[0]["tls_cert"]], capture_output=True, timeout=10)
            assert peer.returncode == 0, peer.stderr
            assert codec.loads(peer.stdout)["transport"] == transport
            wrong = subprocess.run([BIN, "peer-status", "--address", address, "--transport", transport, "--certificate", configs[1]["tls_cert"]], capture_output=True, timeout=10)
            if transport == "http3":
                assert wrong.returncode != 0, "untrusted peer certificate accepted"
            # Exercise Ethereum JSON-RPC framing over a real HTTP socket.
            def http_request(body):
                request = urllib.request.Request(urls[0], body, {"Content-Type": "application/json"})
                with urllib.request.urlopen(request, timeout=3) as response:
                    return response.status, response.read()
            assert json.loads(http_request(b'{')[1])["error"]["code"] == -32700
            assert json.loads(http_request(b'[]')[1])["error"]["code"] == -32600
            assert json.loads(http_request(b'{"jsonrpc":"2.0","id":7,"method":"missing"}')[1])["error"]["code"] == -32601
            batch = [{"jsonrpc":"2.0","id":1,"method":"eth_chainId"}, {"jsonrpc":"2.0","method":"eth_blockNumber"}, {"jsonrpc":"2.0","id":2,"method":"eth_blockNumber"}]
            replies = json.loads(http_request(json.dumps(batch).encode())[1])
            assert [reply["id"] for reply in replies] == [1, 2]
            assert replies[0]["result"] == "0x1e61"
            assert http_request(b'{"jsonrpc":"2.0","method":"eth_blockNumber"}')[0] == 204
            wait(lambda: int(rpc(urls[1], "eth_blockNumber"), 16) >= 3, "follower catch-up")
            stop(processes[0])
            height = int(rpc(urls[1], "eth_blockNumber"), 16)
            stop(processes[1])
            # Restart the leader and confirm history survived; follower will resume too.
            for i, home in enumerate(homes):
                processes[i] = subprocess.Popen([BIN, "run", "--config", home / "config.jsonl"], stdout=logs[i], stderr=logs[i])
                wait(lambda i=i: int(rpc(urls[i], "eth_blockNumber"), 16) > height, "restart/catch-up")
            compare = hex(height)
            assert rpc(urls[0], "eth_getBlockByNumber", [compare, False]) == rpc(urls[1], "eth_getBlockByNumber", [compare, False])
            print(f"PASS: {transport} Capnp RPC, Ethereum HTTP JSON-RPC, block replay, matching roots, restart")
        except BaseException:
            for home, log in zip(homes, logs):
                log.flush(); log.seek(0); print(log.read())
            raise
        finally:
            for process in processes:
                if process.poll() is None:
                    stop(process)
            for home, log in zip(homes, logs):
                log.flush()
                log.seek(0)
                records = list(codec.records((home / 'data/logs/node.capnp').open('rb')))
                assert records, "missing runtime logs"
                assert all(set(["timestamp_ms", "level", "event", "pid", "fields"]) <= r.keys() for r in records)
                assert any(r["event"] == "node_started" for r in records)
                assert any(r["event"] == "node_stopping" for r in records)
                log.close()


if __name__ == "__main__":
    main()
