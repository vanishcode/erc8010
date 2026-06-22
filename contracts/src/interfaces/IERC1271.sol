// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Standard ERC-1271 interface for contract signature validation.
/// @dev ERC-1271: https://eips.ethereum.org/EIPS/eip-1271
interface IERC1271 {
    /// @notice Validate a signature for a given hash.
    /// @param hash The hash of the data that was signed.
    /// @param signature The signature bytes to validate.
    /// @return magicValue 0x1626ba7e if the signature is valid,
    ///         0xffffffff otherwise.
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    ) external view returns (bytes4 magicValue);
}

/// @dev Magic value returned by isValidSignature on success.
/// equals bytes4(keccak256("isValidSignature(bytes32,bytes)"))
bytes4 constant ERC1271_MAGIC_VALUE = 0x1626ba7e;
