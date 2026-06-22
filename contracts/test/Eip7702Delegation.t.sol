// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {SessionKeyValidator} from "../src/SessionKeyValidator.sol";
import {ERC1271_MAGIC_VALUE} from "../src/interfaces/IERC1271.sol";

/// @title Eip7702DelegationTest
/// @notice Demonstrates Foundry's built-in EIP-7702 cheatcodes for testing
///         delegation flows.
contract Eip7702DelegationTest is Test {
    SessionKeyValidator public validator;

    uint256 public delegatorKey;
    address public delegator;
    uint256 public sessionKeyPriv;
    address public sessionKeyAddr;

    function setUp() public {
        validator = new SessionKeyValidator();

        delegatorKey = 0xABC;
        delegator = vm.addr(delegatorKey);
        sessionKeyPriv = 0xDEF;
        sessionKeyAddr = vm.addr(sessionKeyPriv);

        vm.deal(delegator, 10 ether);
    }

    /// @notice Test that an EIP-7702 delegation can be signed and attached.
    function test_SignAndAttachDelegation() public {
        Vm.SignedDelegation memory delegation =
            vm.signDelegation(address(validator), delegatorKey);

        console.log("Delegation implementation:", delegation.implementation);
        console.log("Delegation nonce:", delegation.nonce);

        assertEq(delegation.implementation, address(validator));

        vm.attachDelegation(delegation);

        // After attachment, the EOA should have delegation code
        bytes memory code = delegator.code;
        assertTrue(code.length > 0, "EOA should have code after delegation");

        // Verify the magic prefix 0xef01 (EIP-7702 delegation designation)
        assertEq(code[0], bytes1(0xef), "First byte should be 0xef");
        assertEq(code[1], bytes1(0x01), "Second byte should be 0x01");
    }

    /// @notice Test full EIP-7702 flow:
    ///         Delegate → authorize key → validate via ERC-1271.
    function test_DelegatedValidationViaErc1271() public {
        // 1. Sign and attach delegation
        Vm.SignedDelegation memory delegation =
            vm.signDelegation(address(validator), delegatorKey);
        vm.attachDelegation(delegation);

        // 2. Authorize session key by calling through the delegated EOA.
        //    EOA.authorizeSessionKey → delegatecall → validator.authorizeSessionKey
        //    In the validator: address(this) = delegator (the EOA).
        //    Storage is the EOA's own storage (delegatecall preserves storage context).
        bytes memory authCd = abi.encodeWithSelector(
            SessionKeyValidator.authorizeSessionKey.selector,
            sessionKeyAddr,
            block.timestamp + 1 days
        );
        (bool authOk, ) = delegator.call(authCd);
        assertTrue(authOk, "authorizeSessionKey should succeed via delegation");

        // 3. Session key signs a message
        bytes32 digest = keccak256("eip-7702 delegation flow");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKeyPriv, digest);
        bytes memory ecdsaSig = abi.encodePacked(r, s, v);
        bytes memory sig = abi.encode(sessionKeyAddr, ecdsaSig);

        // 4. Validate by calling through the delegated EOA
        //    EOA.isValidSignature → delegatecall → validator.isValidSignature
        //    In the validator: address(this) = delegator
        bytes memory validateCd = abi.encodeWithSelector(
            SessionKeyValidator.isValidSignature.selector,
            digest,
            sig
        );
        (bool validateOk, bytes memory ret) = delegator.call(validateCd);
        assertTrue(validateOk, "isValidSignature call should succeed");

        bytes4 result = abi.decode(ret, (bytes4));
        assertEq(result, ERC1271_MAGIC_VALUE, "isValidSignature should return magic value");
    }

    /// @notice Verify that delegation code can be removed.
    function test_DelegationCanBeRemoved() public {
        Vm.SignedDelegation memory delegation =
            vm.signDelegation(address(validator), delegatorKey);
        vm.attachDelegation(delegation);

        bytes memory beforeCode = delegator.code;
        assertTrue(beforeCode.length > 0);

        // Reset EOA code (simulating delegation revocation)
        vm.etch(delegator, "");

        bytes memory afterCode = delegator.code;
        assertEq(afterCode.length, 0, "EOA should have no code after reset");
    }
}
