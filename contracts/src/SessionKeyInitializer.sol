// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SessionKeyValidator} from "./SessionKeyValidator.sol";

/// @title SessionKeyInitializer
/// @notice An external initializer contract used alongside EIP-7702 delegation.
///         Called atomically during ERC-8010 verification to set up session keys
///         before the first `isValidSignature` check.
///
/// @dev This contract demonstrates the `init_to` and `init_data` fields of the
///      ERC-8010 wrapper context. When a pre-delegation signature wraps an
///      authorization with init_to = this contract and init_data = the encoded
///      session keys, the verifier atomically initializes the keys before
///      calling isValidSignature.
contract SessionKeyInitializer {
    /// @notice Initialize session keys for the delegating EOA.
    /// @dev    In a real ERC-8010 flow, this would be called via
    ///         init_to.call(init_data) during the atomic eth_call simulation
    ///         with the EIP-7702 authorization list active. The authorization
    ///         list makes the EOA delegate to the validator, so calling
    ///         the EOA (which delegates to the validator) is the correct
    ///         way to set up the EOA's storage.
    ///
    ///         For this demo, this contract demonstrates the encoding format
    ///         of the init_to/init_data fields in the ERC-8010 wrapper.
    /// @param validator The SessionKeyValidator instance to configure.
    /// @param keys      Array of session key addresses to authorize.
    /// @param expiries  Array of expiry timestamps (parallel to `keys`).
    function initialize(
        SessionKeyValidator validator,
        address[] calldata keys,
        uint256[] calldata expiries
    ) external {
        require(keys.length == expiries.length, "Length mismatch");
        for (uint256 i = 0; i < keys.length; i++) {
            validator.authorizeSessionKey(keys[i], expiries[i]);
        }
    }
}
