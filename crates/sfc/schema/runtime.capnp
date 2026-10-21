@0xe4d2c51be2a78d39;

# Cross-language runtime records. No JSON text is embedded in these messages.
# Objects are sorted by key for deterministic canonical hashing.
struct Value {
  union {
    null @0 :Void;
    boolean @1 :Bool;
    unsigned @2 :UInt64;
    signed @3 :Int64;
    real @4 :Float64;
    text @5 :Text;
    list @6 :List(Value);
    object @7 :List(Field);
  }
}
struct Field {
  key @0 :Text;
  value @1 :Value;
}

struct RecoveryRequest {
  id @0 :UInt64;
  cases @1 :List(RecoveryInput); # Legacy experimental clients only.
  packed @2 :Data; # count rows of 25 little-endian UInt32 limbs: digest, r, s, parity.
  count @3 :UInt32;
  packedResults @4 :Bool; # Opt in to contiguous GPU output; old clients keep List(Data).
}
struct RecoveryInput {
  digest @0 :Data;
  signature @1 :Data;
  parity @2 :UInt8;
}
struct RecoveryResponse {
  protocol @0 :UInt32;
  id @1 :UInt64;
  ready @2 :Bool;
  keys @3 :List(Data); # Empty Data means invalid signature.
  packedResults @4 :Data; # count rows: status, x[8], y[8], all little-endian UInt32 limbs.
  count @5 :UInt32;
}

struct UIntRecord { value @0 :UInt64; }
struct SignerIdentity { chainId @0 :UInt64; validator @1 :Data; }
struct NodeConfig {
  dataDir @0 :Text; genesis @1 :Text;
  rpcListen @2 :Text; peerListen @3 :Text;
  capnpListen @4 :Text;
  tlsCert @5 :Text; tlsKey @6 :Text;
  hasSyncPeer @7 :Bool; syncPeer @8 :SyncPeer;
  blockIntervalMs @9 :UInt64; maxPending @10 :UInt64;
  maxBlockTransactions @11 :UInt64; development @12 :Bool;
  retention @13 :Retention; verification @14 :Verification;
}
struct SyncPeer { transport @0 :Transport; address @1 :Text; serverName @2 :Text; certificate @3 :Text; }
enum Transport { http3 @0; tcp @1; }
struct Retention { union { archive @0 :Void; prunedSeconds @1 :UInt64; } }
enum Backend { cpu @0; gpu @1; hybrid @2; }
enum GpuRuntime { metal @0; mlx @1; mlxNative @2; }
struct Verification { backend @0 :Backend = gpu; python @1 :Text; worker @2 :Text; timeoutSeconds @3 :UInt64 = 30; gpuRuntime @4 :GpuRuntime = metal; }
struct RoundLock {
  chain @0 :UInt64; height @1 :UInt64;
  hasLock @2 :Bool; lockedRound @3 :UInt32; lockedHash @4 :Data;
  hasCertificateRound @5 :Bool; certificateRound @6 :UInt32;
}

# Typed non-consensus records. Magic distinguishes these from the legacy Value
# representation without changing v3 block/state commitments.
struct Record {
  magic @0 :UInt64;
  version @1 :UInt16;
  union {
    config @2 :NodeConfig;
    genesis @3 :GenesisRecord;
    unsigned @4 :UInt64;
    vote @5 :VoteRecord;
    identity @6 :SignerIdentity;
    roundLock @7 :RoundLock;
  }
}

struct GenesisRecord { chainId @0 :UInt64; timestamp @1 :UInt64; gasLimit @2 :UInt64; alloc @3 :List(Allocation); }
struct Allocation { key @0 :Text; value @1 :Text; }
struct VoteRecord {
  chainId @0 :UInt64; height @1 :UInt64; round @2 :UInt32;
  phase @3 :Phase; blockHash @4 :Data; validator @5 :Data; signature @6 :Data;
  enum Phase { prevote @0; precommit @1; }
}
