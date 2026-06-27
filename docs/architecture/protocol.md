# ERC-8010 Protocol Specification

ERC-8010 (Pre-delegated Signature Verification) is a draft-status Ethereum standard defining a standardized signature wrapper format and an off-chain verification procedure for pre-delegation signatures under EIP-7702.

---

## Core Problem

Under **EIP-7702**, an External Owned Account (EOA) can delegate its code to a smart contract to gain smart account features (like session keys or multisig).

However, users may sign messages using contract-validated credentials (such as an authorized session key) **before** the EIP-7702 delegation transaction has been executed and mined on-chain.
- Standard **ERC-1271** (smart contract signature validation) calls `isValidSignature` on the signer. But if the EOA's code is still empty (pre-delegation), this call fails.
- Standard **ERC-6492** (pre-deploy signature verification) handles `CREATE2` pre-deployments but does not handle EOA code delegation under EIP-7702.

ERC-8010 fills this gap by defining a way to wrap the signature with the delegation data and simulate it on-chain via `eth_call`.

---

## Signature Wrapper Format

To verify pre-delegation signatures, ERC-8010 wraps the inner signature with the EIP-7702 authorization tuple and an initialization context:

```
wrapped_signature = inner_signature || context || context_length || MAGIC
```

### Format Breakdown

1. **`inner_signature`** (Variable length)
   * The actual cryptographic signature to be validated by the delegated contract's `isValidSignature` logic (e.g., a signature produced by a session key).

2. **`context`** (Variable length)
   * ABI-encoded context: `abi.encode(auth_bytes, init_to, init_data)`
     * `auth_bytes`: ABI-encoded EIP-7702 authorization tuple:
       `abi.encode(uint256 chain_id, address delegate, uint256 nonce, uint8 y_parity, bytes32 r, bytes32 s)`
     * `init_to`: Address of an optional initialization contract.
     * `init_data`: Optional initialization calldata (executed atomically upon delegation).

3. **`context_length`** (4 bytes)
   * `uint32` Big-Endian representation of the `context` byte length.

4. **`MAGIC`** (32 bytes)
   * A fixed 32-byte marker used by verifiers to detect that a signature is wrapped in the ERC-8010 format:
     `0x8010801080108010801080108010801080108010801080108010801080108010`

---

## Signature Layout Visualization

```
┌──────────────────────────────────────────────────────────────────┐
│ ERC-8010 Wrapped Signature Byte Layout                          │
├────────────┬──────────────────────┬───────────────┬─────────────┤
│ inner_sig  │ context              │ context_len   │ MAGIC       │
│ (65 bytes) │ (variable)           │ (4 bytes)     │ (32 bytes)  │
│            │ ┌──────────────────┐ │ uint32 BE     │ 0x8010...   │
│            │ │ authorization    │ │               │ 0x8010      │
│            │ │  ├ chain_id      │ │               │             │
│            │ │  ├ delegate_addr │ │               │             │
│            │ │  ├ nonce         │ │               │             │
│            │ │  ├ y_parity      │ │               │             │
│            │ │  ├ r             │ │               │             │
│            │ │  └ s             │ │               │             │
│            │ │ init_to          │ │               │             │
│            │ │ init_data        │ │               │             │
│            │ └──────────────────┘ │               │             │
├────────────┴──────────────────────┴───────────────┴─────────────┤
│ 解析顺序：最后 32 字节 → MAGIC 检查 → 前 4 字节 → context_len  │
│ → 提取 context → 解码 authorization/init                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Off-Chain Verification Workflow

Verifiers (such as viem's `verifyHash` or `verifyTypedData`) perform the following verification:

1. **Inspect for Magic Marker**: Checks if the last 32 bytes match the ERC-8010 `MAGIC` marker.
2. **If MAGIC is NOT present**: Fallback to standard ERC-6492 or ECDSA verification.
3. **If MAGIC IS present**:
   * Parse the wrapper to extract the `inner_signature`, EIP-7702 `authorization`, `init_to`, and `init_data`.
   * Check if the account has already delegated code (`code` starts with `0xef0100` pointing to the correct address):
     * **If already delegated**: Call `isValidSignature(digest, inner_signature)` directly on the account (ERC-1271 path).
     * **If NOT delegated yet**:
       * Perform `eth_call` simulating the delegation by passing the `authorizationList` containing the EIP-7702 authorization.
       * During simulation, if `init_to` is specified, execute `init_to.call(init_data)` first, then call `isValidSignature(digest, inner_signature)` atomically.
       * If return value is `0x1626ba7e` (ERC-1271 magic value), the signature is valid.
