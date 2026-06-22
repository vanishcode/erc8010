// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC1271, ERC1271_MAGIC_VALUE} from "./interfaces/IERC1271.sol";

/// @title SessionKeyValidator
/// @notice A delegate contract for EIP-7702 delegation that validates signatures
///         from authorized session keys. EOAs can delegate to this contract to
///         enable session-key-based signing without exposing their main private key.
///
/// @dev This contract implements ERC-1271. Once an EOA delegates to this contract
///      via EIP-7702, `isValidSignature` is called on the EOA's address.
///
///      Signature format expected by isValidSignature:
///        abi.encode(address sessionKey, bytes ecdsaSignature)
///
///      ERC-8010 enables verifying session-key signatures signed BEFORE the
///      EIP-7702 delegation transaction is mined — by wrapping the inner signature
///      with the authorization tuple and simulating delegation atomically.
contract SessionKeyValidator is IERC1271 {
    /// @notice Thrown when isValidSignature receives an invalidly formatted signature.
    error InvalidSignatureFormat();

    /// @notice Thrown when a session key is expired or unauthorized.
    error SessionKeyUnauthorized(address delegator, address sessionKey);

    /// @notice Emitted when a session key is authorized.
    event SessionKeyAuthorized(
        address indexed delegator,
        address indexed sessionKey,
        uint256 expiry
    );

    /// @notice Emitted when a session key is revoked.
    event SessionKeyRevoked(
        address indexed delegator,
        address indexed sessionKey
    );

    /// @notice delegator => sessionKey => expiry timestamp (0 = unauthorized)
    mapping(address => mapping(address => uint256)) public sessionKeyExpiry;

    // ────────────────────────────────────────────────────────────
    //  Session Key Management
    // ────────────────────────────────────────────────────────────

    /// @notice Authorize a session key to sign on behalf of `address(this)`.
    /// @dev    When called via EIP-7702 delegation, `address(this)` is the EOA.
    ///         When called directly, `address(this)` is this validator contract.
    /// @param sessionKey The address of the session key.
    /// @param expiry     Unix timestamp after which the key expires.
    function authorizeSessionKey(address sessionKey, uint256 expiry) external {
        sessionKeyExpiry[address(this)][sessionKey] = expiry;
        emit SessionKeyAuthorized(address(this), sessionKey, expiry);
    }

    /// @notice Revoke a previously authorized session key.
    function revokeSessionKey(address sessionKey) external {
        delete sessionKeyExpiry[address(this)][sessionKey];
        emit SessionKeyRevoked(address(this), sessionKey);
    }

    /// @notice Check whether a session key is currently authorized and not expired.
    function isSessionKeyAuthorized(
        address delegator,
        address sessionKey
    ) external view returns (bool authorized, uint256 expiry) {
        expiry = sessionKeyExpiry[delegator][sessionKey];
        authorized = expiry >= block.timestamp;
    }

    // ────────────────────────────────────────────────────────────
    //  ERC-1271: Signature Validation
    // ────────────────────────────────────────────────────────────

    /// @notice Validate a signature produced by an authorized session key.
    /// @dev    `msg.sender` is the delegator (the EOA that delegated via EIP-7702).
    ///         Signature format: abi.encode(address sessionKey, bytes ecdsaSig)
    /// @param hash      The 32-byte message hash that was signed.
    /// @param signature The encoded (sessionKey, ecdsaSig) payload.
    /// @return magicValue ERC1271_MAGIC_VALUE if valid, 0xffffffff otherwise.
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    ) external view returns (bytes4 magicValue) {
        // Decode: abi.encode(address sessionKey, bytes ecdsaSig)
        // ABI encoding: [32-byte address][32-byte offset][32-byte length][bytes data]
        if (signature.length < 97) {
            // Minimum: 32 (address) + 32 (offset) + 32 (length) + 1 (at least 1 byte)
            return bytes4(0xffffffff);
        }

        (address sessionKey, bytes memory ecdsaSig) =
            abi.decode(signature, (address, bytes));

        // Check authorization & expiry.
        // `address(this)` is used as the delegator identifier because:
        // - When called directly: the validator IS the contract, address(this) = validator
        // - When called via EIP-7702 delegation: delegation is a delegatecall,
        //   so address(this) = the EOA that delegated (the delegator).
        uint256 expiry = sessionKeyExpiry[address(this)][sessionKey];
        if (expiry < block.timestamp) {
            return bytes4(0xffffffff);
        }

        // Recover signer from ecdsaSig
        address recovered = _recoverSigner(hash, ecdsaSig);
        if (recovered != sessionKey) {
            return bytes4(0xffffffff);
        }

        return ERC1271_MAGIC_VALUE;
    }

    // ────────────────────────────────────────────────────────────
    //  Internal: ECDSA Recovery
    // ────────────────────────────────────────────────────────────

    /// @notice Recover the signer address from a hash and ECDSA signature.
    /// @dev Uses the built-in `ecrecover` precompile.
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

        // Adjust v for EIP-155 / non-EIP-155 chains
        if (v < 27) {
            v += 27;
        }

        return ecrecover(hash, v, r, s);
    }
}
