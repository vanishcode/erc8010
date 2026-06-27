# Smart Contracts Design

The smart contracts provide the core delegation target logic for EIP-7702 and session-key-based signature validation.

---

## 1. SessionKeyValidator.sol

`SessionKeyValidator` is a delegate contract designed for EIP-7702 delegation. It implements **ERC-1271** and validates signatures from authorized session keys. 

By delegating to this contract via EIP-7702, an EOA can authorize temporary session keys to sign messages on its behalf without exposing its primary private key.

### Core Features

* **Session Key Management**: Authors/Revokes session keys with custom expiry timestamps.
* **Multi-Delegator Support**: Storage uses `address(this)` as the primary mapping key.
  * When called via EIP-7702 delegation, the execution is a `delegatecall`, meaning `address(this)` evaluates to the EOA's address. This enables isolated storage per EOA delegator.
* **ERC-1271 Compatibility**: Implements `isValidSignature` which expects a wrapped session key signature payload.

### Storage Layout

```solidity
// delegator => sessionKey => expiry timestamp (0 = unauthorized/expired)
mapping(address => mapping(address => uint256)) public sessionKeyExpiry;
```

### Signature Payload Structure

The `signature` parameter of `isValidSignature` must be ABI-encoded as:
```solidity
abi.encode(address sessionKey, bytes ecdsaSignature)
```

### Validation Logic inside `isValidSignature`

1. **Size Verification**: Ensure the signature is at least 97 bytes long (ABI encoding structure: address offset + length header + at least 1 signature byte).
2. **Decode**: Extract `sessionKey` and the raw `ecdsaSig` from the signature payload.
3. **Authorization Check**: Fetch expiry from `sessionKeyExpiry[address(this)][sessionKey]`. Rejects if the current block timestamp exceeds expiry.
4. **Signature Recovery**: Recover the signer's address from the message hash and `ecdsaSig` using `ecrecover`.
5. **Comparison**: Verify if recovered signer matches `sessionKey`.
6. **Return**: Returns `0x1626ba7e` (ERC-1271 magic value) if valid, or `0xffffffff` otherwise.

### Internal Assembly for `ecrecover`

ECDSA signer recovery is implemented cleanly using assembly to extract $r$, $s$, and $v$ parameters:

```solidity
function _recoverSigner(
    bytes32 hash,
    bytes memory sig
) internal pure returns (address) {
    require(sig.length == 65, "Invalid signature length");

    bytes32 r;
    bytes32 s;
    uint8 v;

    assembly {
        r := mload(add(sig, 32))
        s := mload(add(sig, 64))
        v := byte(0, mload(add(sig, 96)))
    }

    if (v < 27) {
        v += 27;
    }

    return ecrecover(hash, v, r, s);
}
```

---

## 2. SessionKeyInitializer.sol

`SessionKeyInitializer` acts as an optional initializer during the delegation execution, demonstrating how the `init_to` and `init_data` fields of ERC-8010 operate atomically.

### Core Interface

```solidity
function initialize(bytes calldata data) external;
// data is ABI-encoded as (address[] sessionKeys, uint256[] expiries)
```

During initialization, it calls `SessionKeyValidator(address(this)).authorizeSessionKey` for each session key and expiry pair to initialize the session key authorizations immediately during the EIP-7702 delegation transaction.

---

## 3. Interfaces

### IERC1271.sol

Defines the standard ERC-1271 interface used for signature validation by smart contracts:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

bytes4 constant ERC1271_MAGIC_VALUE = 0x1626ba7e;

interface IERC1271 {
    /**
     * @dev Should return whether the signature provided is valid for the provided data
     * @param hash      Hash of the data to be signed
     * @param signature Signature byte array associated with _data
     */
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    ) external view returns (bytes4 magicValue);
}
```

---

## 4. Foundry Setup & Testing

### Compilation Configuration

In `foundry.toml`, the compilation is set up for the Prague EVM and Solidity `0.8.28`:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.28"
evm_version = "prague"   # EIP-7702 requires Prague EVM
ffi = false
```

### Contract Tests

* **`SessionKeyValidator.t.sol`**: Tests session key lifecycle management (authorizing, revoking, expiration, unauthorized access).
* **`Eip7702Delegation.t.sol`**: Uses Foundry's built-in EIP-7702 cheatcode (`vm.sign` / `vm.etch` equivalent simulation) to test attaching delegation code to an EOA.
* **`Erc8010Verification.t.sol`**: Simulates the full pre-delegation and post-delegation wrap/unwrap signature verification scenarios in Solidity.
