// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {SessionKeyValidator} from "../src/SessionKeyValidator.sol";
import {ERC1271_MAGIC_VALUE} from "../src/interfaces/IERC1271.sol";

/// @title SessionKeyValidatorTest
/// @notice Unit tests for the SessionKeyValidator contract.
///
///         IMPORTANT: SessionKeyValidator uses `address(this)` as the delegator
///         identity (correct for EIP-7702 delegatecall semantics). When called
///         directly (not via delegation), `address(this)` is the validator itself.
contract SessionKeyValidatorTest is Test {
    SessionKeyValidator public validator;

    uint256 public sessionKeyPriv;
    address public sessionKey;
    uint256 public unauthorizedPriv;

    function setUp() public {
        validator = new SessionKeyValidator();

        sessionKeyPriv = 0xDEF;
        sessionKey = vm.addr(sessionKeyPriv);
        unauthorizedPriv = 0xBEEF;
    }

    // Helper: authorize key directly on the validator (address(this) = validator)
    function _authorizeKey(address key, uint256 expiry) internal {
        validator.authorizeSessionKey(key, expiry);
    }

    // ────────────────────────────────────────────────────────────
    //  Session Key Management
    // ────────────────────────────────────────────────────────────

    function test_AuthorizeSessionKey() public {
        uint256 expiry = block.timestamp + 1 days;
        _authorizeKey(sessionKey, expiry);

        (bool authorized, uint256 storedExpiry) =
            validator.isSessionKeyAuthorized(address(validator), sessionKey);
        assertTrue(authorized, "Key should be authorized");
        assertEq(storedExpiry, expiry, "Expiry mismatch");
    }

    function test_RevokeSessionKey() public {
        _authorizeKey(sessionKey, block.timestamp + 1 days);
        validator.revokeSessionKey(sessionKey);

        (bool authorized, ) =
            validator.isSessionKeyAuthorized(address(validator), sessionKey);
        assertFalse(authorized, "Key should be revoked");
    }

    function test_AuthorizationIsPerAddressThis() public {
        // Deploy a second validator — keys should be isolated
        SessionKeyValidator otherValidator = new SessionKeyValidator();
        _authorizeKey(sessionKey, block.timestamp + 1 days);

        // Key should NOT be authorized on otherValidator
        (bool authorized, ) =
            otherValidator.isSessionKeyAuthorized(address(otherValidator), sessionKey);
        assertFalse(authorized, "Should not leak across contracts");

        // Key should be on this validator
        (bool authHere, ) =
            validator.isSessionKeyAuthorized(address(validator), sessionKey);
        assertTrue(authHere, "Should be authorized on this validator");
    }

    // ────────────────────────────────────────────────────────────
    //  isValidSignature — Happy Path
    // ────────────────────────────────────────────────────────────

    function test_AuthorizeAndValidateSignature() public {
        _authorizeKey(sessionKey, block.timestamp + 1 days);

        bytes32 digest = keccak256("session key signed this");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKeyPriv, digest);
        bytes memory ecdsaSig = abi.encodePacked(r, s, v);
        bytes memory sig = abi.encode(sessionKey, ecdsaSig);

        bytes4 result = validator.isValidSignature(digest, sig);
        assertEq(result, ERC1271_MAGIC_VALUE);
    }

    // ────────────────────────────────────────────────────────────
    //  isValidSignature — Failure Cases
    // ────────────────────────────────────────────────────────────

    function test_ExpiredSessionKeyFails() public {
        _authorizeKey(sessionKey, block.timestamp - 1); // already expired

        bytes32 digest = keccak256("expired key test");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKeyPriv, digest);
        bytes memory sig = abi.encode(sessionKey, abi.encodePacked(r, s, v));

        bytes4 result = validator.isValidSignature(digest, sig);
        assertEq(result, bytes4(0xffffffff), "Expired key should fail");
    }

    function test_RevokedSessionKeyFails() public {
        _authorizeKey(sessionKey, block.timestamp + 1 days);
        validator.revokeSessionKey(sessionKey);

        bytes32 digest = keccak256("revoked key test");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKeyPriv, digest);
        bytes memory sig = abi.encode(sessionKey, abi.encodePacked(r, s, v));

        bytes4 result = validator.isValidSignature(digest, sig);
        assertEq(result, bytes4(0xffffffff), "Revoked key should fail");
    }

    function test_UnauthorizedKeyFails() public {
        address neverAuthorized = vm.addr(0xBEEF);
        bytes32 digest = keccak256("unauthorized test");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(0xBEEF, digest);
        bytes memory sig = abi.encode(neverAuthorized, abi.encodePacked(r, s, v));

        bytes4 result = validator.isValidSignature(digest, sig);
        assertEq(result, bytes4(0xffffffff), "Unauthorized key should fail");
    }

    function test_WrongSignerFails() public {
        _authorizeKey(sessionKey, block.timestamp + 1 days);

        bytes32 digest = keccak256("wrong signer test");
        // Sign with a different, unauthorized key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(unauthorizedPriv, digest);
        bytes memory sig = abi.encode(sessionKey, abi.encodePacked(r, s, v));

        bytes4 result = validator.isValidSignature(digest, sig);
        assertEq(result, bytes4(0xffffffff), "Wrong signer should fail");
    }

    function test_SignatureTooShortFails() public {
        bytes32 digest = keccak256("too short test");
        bytes memory sig = new bytes(10);

        bytes4 result = validator.isValidSignature(digest, sig);
        assertEq(result, bytes4(0xffffffff), "Short sig should fail");
    }

    // ────────────────────────────────────────────────────────────
    //  Edge Cases
    // ────────────────────────────────────────────────────────────

    function test_ExpiryExactlyAtBlockTimestamp() public {
        _authorizeKey(sessionKey, block.timestamp);

        bytes32 digest = keccak256("edge case");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKeyPriv, digest);
        bytes memory sig = abi.encode(sessionKey, abi.encodePacked(r, s, v));

        bytes4 result = validator.isValidSignature(digest, sig);
        // The check is `expiry < block.timestamp`, so at exact equality
        // the key is still valid. It expires in the NEXT block.
        assertEq(result, ERC1271_MAGIC_VALUE, "Should still be valid at exact timestamp");
    }

    function test_ReauthorizeAfterExpiry() public {
        _authorizeKey(sessionKey, block.timestamp + 1);
        vm.warp(block.timestamp + 2); // move past expiry

        uint256 newExpiry = block.timestamp + 7 days;
        _authorizeKey(sessionKey, newExpiry);

        (bool auth, uint256 exp) =
            validator.isSessionKeyAuthorized(address(validator), sessionKey);
        assertTrue(auth);
        assertEq(exp, newExpiry);
    }

    function test_MultipleSessionKeys() public {
        uint256 key2Priv = 0xBABE;
        address key2 = vm.addr(key2Priv);

        _authorizeKey(sessionKey, block.timestamp + 1 days);
        _authorizeKey(key2, block.timestamp + 2 days);

        bytes32 digest = keccak256("multi key");

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKeyPriv, digest);
        bytes memory sig1 = abi.encode(sessionKey, abi.encodePacked(r, s, v));
        assertEq(validator.isValidSignature(digest, sig1), ERC1271_MAGIC_VALUE);

        (v, r, s) = vm.sign(key2Priv, digest);
        bytes memory sig2 = abi.encode(key2, abi.encodePacked(r, s, v));
        assertEq(validator.isValidSignature(digest, sig2), ERC1271_MAGIC_VALUE);
    }
}
