# Data Flow and Interactive Demo

This document explains the interactive 5-step demo flow and how data flows off-chain and on-chain to verify pre-delegated signatures.

---

## The 5-Step Demo Flow

In the `/demo` page of the Next.js frontend, users walk through five steps to witness ERC-8010 in action:

```
Step 1: Message Signing (Pre-delegation)
  │   - User inputs a message (e.g., "Hello ERC-8010!").
  │   - Uses the preset session key to sign.
  └───→ Output: `inner_signature` (65-byte ECDSA signature)

Step 2: Wrap ERC-8010 Signature
  │   - User signs an EIP-7702 authorization tuple targeting SessionKeyValidator.
  │   - Front-end wraps the inner signature: `wrapErc8010Signature()`.
  └───→ Output: Color-coded representation of the wrapped signature:
        `inner_signature || context || context_len || MAGIC`

Step 3: Off-Chain Verification (Pre-delegation validation)
  │   - The frontend executes `verifyHash` via publicClient.
  │   - viem detects the MAGIC marker, simulates delegation, and validates.
  └───→ Output: Verification Result: True (without modifying actual chain state!)

Step 4: Execute On-chain Delegation
  │   - Sends an EIP-7702 delegation transaction (Type-4 transaction).
  └───→ Output: Transaction Hash. EOA code is now set to `0xef0100` pointing to SessionKeyValidator.

Step 5: Post-Delegation Verification
  │   - Performs `verifyHash` again with the same signature.
  │   - Since the EOA is now delegated on-chain, viem routes directly to ERC-1271.
  └───→ Output: Verification Result: True. Includes comparative analysis tables.
```

---

## System Data Flow Diagram

The following ASCII diagram illustrates how actors, the frontend, the RPC node, and smart contracts interact during the pre-delegation and post-delegation stages:

```
EOA (Preset Private Key)
 │
 ├─[Step 1] signMessage("Hello ERC-8010!")
 │  └─→ innerSignature (65-byte ECDSA)
 │
 ├─[Step 2] signAuthorization({ contractAddress: SessionKeyValidator })
 │  └─→ Authorization { chainId, address, nonce, yParity, r, s }
 │
 ├─[Step 2] wrapErc8010Signature({ innerSig, auth, initTo, initData })
 │  └─→ wrapped = innerSig || context || contextLen || MAGIC
 │
 ├─[Step 3] verifyHash({ address: EOA, hash, signature: wrapped })
 │  │  viem internal logic:
 │  ├── Detects MAGIC → Recognized as ERC-8010
 │  ├── Extracts authorization
 │  ├── Checks EOA.code != 0xef0100... (Not yet delegated)
 │  ├── eth_call(authorizationList: [auth]):
 │  │   ├── initTo.call(initData)   [Optional]
 │  │   └── EOA.isValidSignature(hash, innerSig)
 │  └─→ Returns true ✓
 │
 ├─[Step 4] sendTransaction({ to: EOA, authorizationList: [auth] })
 │  └─→ EOA.code is now set to 0xef0100 || SessionKeyValidator on-chain
 │
 └─[Step 5] verifyHash({ address: EOA, hash, signature: wrapped })
    │  viem internal logic:
    ├── Detects MAGIC
    ├── Checks EOA.code == 0xef0100... (Already delegated!)
    ├── Calls EOA.isValidSignature(hash, innerSig) directly via standard ERC-1271
    └─→ Returns true ✓
```

---

## Key SDK/Library Functions Used

To facilitate clean Web3 integration, the frontend relies on specialized functions from `viem`:

### viem Functions

* **`publicClient.verifyHash`**: The primary verification endpoint. It automatically detects the ERC-8010 `MAGIC` suffix and manages the appropriate verification path (pre-delegation simulation vs. post-delegation ERC-1271).
* **`walletClient.signMessage`**: Signs the plain message using the private key.
* **`walletClient.signAuthorization`**: Signs the EIP-7702 authorization tuple.
* **`walletClient.sendTransaction`**: Dispatches the Type-4 transaction with the `authorizationList`.
* **`publicClient.getCode`**: Inspects if an EOA has been delegated by fetching its deployed bytecode.
* **`encodeAbiParameters`**: ABI-encodes context elements.
* **`concat` / `size` / `slice` / `toHex`**: Manipulates raw hex arrays and handles string-based bytes formatting safely.
