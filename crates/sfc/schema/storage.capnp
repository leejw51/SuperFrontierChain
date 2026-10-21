@0xccb3b073f80f9c21;

# Consensus/storage records. Hashes and transactions are binary Data, never text.
struct Block {
  chainId @0 :UInt64;
  height @1 :UInt64;
  timestamp @2 :UInt64;
  parentHash @3 :Data;
  stateRoot @4 :Data;
  transactions @5 :List(Data);
  receipts @6 :List(Receipt);
}
struct Receipt {
  transactionHash @0 :Data;
  sender @1 :Text;
  recipient @2 :Text;
  hasRecipient @3 :Bool;
  success @4 :Bool;
  gasUsed @5 :UInt64;
  cumulativeGasUsed @6 :UInt64;
  contractAddress @7 :Text;
  hasContractAddress @8 :Bool;
  logs @9 :List(Log);
}
struct Log { address @0 :Text; topics @1 :List(Text); data @2 :Data; }
struct TextEntry { key @0 :Text; value @1 :Text; }
struct Account {
  balance @0 :Text;
  nonce @1 :UInt64;
  code @2 :Data;
  storage @3 :List(TextEntry);
}
struct AccountEntry { address @0 :Text; account @1 :Account; }
struct BlockHash { height @0 :UInt64; hash @1 :Data; }
struct World {
  accounts @0 :List(AccountEntry);
  moduleState @1 :List(TextEntry);
  blockHashes @2 :List(BlockHash);
}
struct Genesis { chainId @0 :UInt64; timestamp @1 :UInt64; gasLimit @2 :UInt64; alloc @3 :List(TextEntry); }

# Rebuildable explorer metadata; separate from consensus Block commitments.
struct IndexedBlock {
  height @0 :UInt64; hash @1 :Text; timestamp @2 :UInt64;
  parentHash @3 :Text; stateRoot @4 :Text;
  transactions @5 :UInt64; gasUsed @6 :UInt64; hasGasUsed @7 :Bool;
}
