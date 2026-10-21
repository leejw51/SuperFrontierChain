@0xe8b9a2a1d217cc61;

struct Vote {
  chainId @0 :UInt64;
  height @1 :UInt64;
  round @2 :UInt32;
  phase @3 :Phase;
  blockHash @4 :Data;
  validator @5 :Data;
  signature @6 :Data;
  enum Phase { prevote @0; precommit @1; }
}

struct Block {
  chainId @0 :UInt64;
  height @1 :UInt64;
  timestamp @2 :UInt64;
  parentHash @3 :Data;
  stateRoot @4 :Data;
  transactions @5 :List(Data);
}

struct Status {
  protocolVersion @0 :UInt32;
  chainId @1 :UInt64;
  height @2 :UInt64;
  blockHash @3 :Data;
  earliestHeight @4 :UInt64;
}

struct Submission {
  union {
    hash @0 :Data;
    error @1 :Text;
  }
}

# Peer transport uses typed Cap'n Proto messages; Ethereum RLP is opaque Data.
interface Peer {
  status @0 () -> (status :Status);
  submitTransaction @1 (raw :Data) -> (hash :Data);
  getBlock @2 (height :UInt64) -> (found :Bool, block :Block);
  getBlocks @3 (start :UInt64, limit :UInt32) -> (blocks :List(Block));
  getEncodedBlocks @4 (start :UInt64, limit :UInt32) -> (blocks :List(Data));
  submitTransactions @5 (transactions :List(Data)) -> (results :List(Submission));
  account @6 (address :Data) -> (nonce :UInt64, balance :Data);
  committedTransaction @7 (hash :Data) -> (found :Bool, height :UInt64, blockHash :Data, success :Bool);
  verification @8 () -> (nodePid :UInt32, runtime :Text, cpuRecords :UInt64, gpuRecords :UInt64, externalWorker :Bool);
}
