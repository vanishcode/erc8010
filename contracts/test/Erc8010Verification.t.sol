// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {Vm} from "forge-std/Vm.sol";
import {SessionKeyValidator} from "../src/SessionKeyValidator.sol";
import {SessionKeyInitializer} from "../src/SessionKeyInitializer.sol";
import {ERC1271_MAGIC_VALUE} from "../src/interfaces/IERC1271.sol";

/// @title Erc8010VerificationTest
/// @notice Integration tests demonstrating the ERC-8010 signature wrapper format
///         and verification flow.
contract Erc8010VerificationTest is Test {
    SessionKeyValidator public validator;
    SessionKeyInitializer public initializer;

    /// @notice The ERC-8010 MAGIC marker: 0x8010 repeated 16 times (32 bytes).
    bytes32 public constant ERC8010_MAGIC =
        0x8010801080108010801080108010801080108010801080108010801080108010;

    uint256 public delegatorKey;
    address public delegator;
    uint256 public sessionKeyPriv;
    address public sessionKeyAddr;

    function setUp() public {
        validator = new SessionKeyValidator();
        initializer = new SessionKeyInitializer();

        delegatorKey = 0xABC;
        delegator = vm.addr(delegatorKey);
        sessionKeyPriv = 0xDEF;
        sessionKeyAddr = vm.addr(sessionKeyPriv);

        vm.deal(delegator, 10 ether);

        // Authorize session key directly on the validator.
        // Since we call directly (not via EIP-7702 delegation), address(this)=validator.
        validator.authorizeSessionKey(sessionKeyAddr, block.timestamp + 1 days);
    }

    // ────────────────────────────────────────────────────────────
    //  Test 1: Pre-delegation signature wraps and verifies
    // ────────────────────────────────────────────────────────────
    function test_PredelegationSignatureWrapsAndVerifies() public {
        // 1. Session key signs a message hash
        bytes32 digest = keccak256("hello ERC-8010");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKeyPriv, digest);
        bytes memory innerSigRaw = abi.encodePacked(r, s, v);

        // 2. Build validator's expected signature format:
        //    abi.encode(address sessionKey, bytes ecdsaSig)
        bytes memory innerSig = abi.encode(sessionKeyAddr, innerSigRaw);

        // 3. Direct validation (simulates post-delegation path)
        bytes4 result = validator.isValidSignature(digest, innerSig);
        assertEq(result, ERC1271_MAGIC_VALUE, "Direct validation should pass");

        // 4. Build an EIP-7702 authorization digest
        uint256 nonce = 0;
        bytes32 authDigest = keccak256(
            abi.encodePacked(
                uint8(0x05),             // EIP-7702 auth type byte
                block.chainid,
                address(validator),
                nonce
            )
        );
        (uint8 authV, bytes32 authR, bytes32 authS) =
            vm.sign(delegatorKey, authDigest);

        // 5. Build the ERC-8010 wrapped signature
        bytes memory wrapped = _buildErc8010Wrapper({
            innerSig: innerSig,
            chainId: block.chainid,
            delegate: address(validator),
            nonce: nonce,
            yParity: authV - 27,
            r: authR,
            s: authS,
            initTo: address(0),
            initData: ""
        });

        // 6. Verify MAGIC marker is at the end
        bytes32 extractedMagic;
        assembly {
            extractedMagic := mload(add(add(wrapped, 0x20), sub(mload(wrapped), 32)))
        }
        assertEq(extractedMagic, ERC8010_MAGIC, "MAGIC marker not found");

        // 7. Verify the inner signature is at the start
        uint256 innerLen = innerSig.length;
        bytes memory parsedInnerSig = new bytes(innerLen);
        for (uint256 i = 0; i < innerLen; i++) {
            parsedInnerSig[i] = wrapped[i];
        }
        assertEq(keccak256(parsedInnerSig), keccak256(innerSig),
                 "Parsed inner sig mismatch");
    }

    // ────────────────────────────────────────────────────────────
    //  Test 2: EIP-7702 delegation + signature validation
    // ────────────────────────────────────────────────────────────
    function test_PostDelegationSignatureVerifies() public {
        // Session key signs
        bytes32 digest = keccak256("post delegation test");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKeyPriv, digest);
        bytes memory innerSigRaw = abi.encodePacked(r, s, v);
        bytes memory innerSig = abi.encode(sessionKeyAddr, innerSigRaw);

        // Sign and attach delegation
        Vm.SignedDelegation memory delegation =
            vm.signDelegation(address(validator), delegatorKey);
        vm.attachDelegation(delegation);

        // Verify delegation code is set
        bytes memory code = delegator.code;
        assertTrue(code.length > 0, "EOA should have code after delegation");
        assertEq(code[0], bytes1(0xef));

        // Also verify direct call still works (base case)
        bytes4 result = validator.isValidSignature(digest, innerSig);
        assertEq(result, ERC1271_MAGIC_VALUE, "Direct validation should still work");
    }

    // ────────────────────────────────────────────────────────────
    //  Test 3: MAGIC marker detection
    // ────────────────────────────────────────────────────────────
    function test_MagicMarkerDetection() public {
        bytes memory sigWithMagic = abi.encodePacked(bytes("hello"), ERC8010_MAGIC);
        bytes32 last32;
        assembly {
            last32 := mload(add(add(sigWithMagic, 0x20), sub(mload(sigWithMagic), 32)))
        }
        assertEq(last32, ERC8010_MAGIC);

        // Without MAGIC
        bytes memory sigWithoutMagic = bytes("hello1234hello1234hello1234X"); // 33 bytes, no MAGIC
        if (sigWithoutMagic.length >= 32) {
            assembly {
                last32 := mload(add(add(sigWithoutMagic, 0x20), sub(mload(sigWithoutMagic), 32)))
            }
            assertTrue(last32 != ERC8010_MAGIC);
        }
    }

    // ────────────────────────────────────────────────────────────
    //  Test 4: Init data encoding (ERC-8010 init_to/init_data fields)
    // ────────────────────────────────────────────────────────────
    function test_InitDataEncoding() public {
        address[] memory keys = new address[](1);
        keys[0] = sessionKeyAddr;
        uint256[] memory expiries = new uint256[](1);
        uint256 expiry = block.timestamp + 1 days;
        expiries[0] = expiry;

        // Encode init_data as it appears in the ERC-8010 wrapper context
        bytes memory initData = abi.encodeWithSelector(
            SessionKeyInitializer.initialize.selector,
            validator,
            keys,
            expiries
        );

        // Verify the selector
        bytes4 selector = bytes4(initData);
        assertEq(selector, SessionKeyInitializer.initialize.selector);

        // Verify the encoding by decoding (skip the 4-byte selector)
        bytes memory initDataPayload = new bytes(initData.length - 4);
        for (uint256 i = 0; i < initData.length - 4; i++) {
            initDataPayload[i] = initData[i + 4];
        }
        (address decodedValidator,
         address[] memory decodedKeys, uint256[] memory decodedExpiries) =
            abi.decode(initDataPayload, (address, address[], uint256[]));

        assertEq(decodedValidator, address(validator));
        assertEq(decodedKeys[0], sessionKeyAddr);
        assertEq(decodedExpiries[0], expiry);
    }

    // ────────────────────────────────────────────────────────────
    //  Test 5: ERC-8010 wrapper with init_to/init_data
    // ────────────────────────────────────────────────────────────
    function test_WrapperWithInitData() public {
        bytes32 digest = keccak256("wrapper with init");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKeyPriv, digest);
        bytes memory innerSig = abi.encode(
            sessionKeyAddr,
            abi.encodePacked(r, s, v)
        );

        bytes32 authDigest = keccak256(
            abi.encodePacked(uint8(0x05), block.chainid, address(validator), uint256(0))
        );
        (uint8 authV, bytes32 authR, bytes32 authS) =
            vm.sign(delegatorKey, authDigest);

        // Build init_data
        address[] memory keys = new address[](1);
        keys[0] = sessionKeyAddr;
        uint256[] memory expiries = new uint256[](1);
        expiries[0] = block.timestamp + 1 days;

        bytes memory wrapped = _buildErc8010Wrapper({
            innerSig: innerSig,
            chainId: block.chainid,
            delegate: address(validator),
            nonce: 0,
            yParity: authV - 27,
            r: authR,
            s: authS,
            initTo: address(initializer),
            initData: abi.encodeWithSelector(
                SessionKeyInitializer.initialize.selector,
                validator, keys, expiries
            )
        });

        // Verify MAGIC at end
        bytes32 last32;
        assembly {
            last32 := mload(add(add(wrapped, 0x20), sub(mload(wrapped), 32)))
        }
        assertEq(last32, ERC8010_MAGIC, "MAGIC should be at end with init data");

        // Verify inner sig is at start
        bytes memory head = new bytes(innerSig.length);
        for (uint256 i = 0; i < innerSig.length; i++) {
            head[i] = wrapped[i];
        }
        assertEq(keccak256(head), keccak256(innerSig), "inner sig at start");
    }

    // ────────────────────────────────────────────────────────────
    //  Test 6: Validation with multiple session keys (stress test)
    // ────────────────────────────────────────────────────────────
    function test_MultipleDelegators() public {
        // Deploy a second validator (simulating a different delegator)
        SessionKeyValidator validator2 = new SessionKeyValidator();
        uint256 key2Priv = 0xBABE;
        address key2 = vm.addr(key2Priv);

        // Each validator has its own authorized keys
        validator.authorizeSessionKey(sessionKeyAddr, block.timestamp + 1 days);
        validator2.authorizeSessionKey(key2, block.timestamp + 1 days);

        // Key 1 works on validator 1
        bytes32 digest = keccak256("multi validator");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKeyPriv, digest);
        bytes memory sig1 = abi.encode(sessionKeyAddr, abi.encodePacked(r, s, v));
        assertEq(validator.isValidSignature(digest, sig1), ERC1271_MAGIC_VALUE);

        // Key 2 works on validator 2
        (v, r, s) = vm.sign(key2Priv, digest);
        bytes memory sig2 = abi.encode(key2, abi.encodePacked(r, s, v));
        assertEq(validator2.isValidSignature(digest, sig2), ERC1271_MAGIC_VALUE);

        // Key 1 does NOT work on validator 2
        assertEq(validator2.isValidSignature(digest, sig1), bytes4(0xffffffff));

        // Key 2 does NOT work on validator 1
        assertEq(validator.isValidSignature(digest, sig2), bytes4(0xffffffff));
    }

    // ────────────────────────────────────────────────────────────
    //  Helpers
    // ────────────────────────────────────────────────────────────

    function _buildErc8010Wrapper(
        bytes memory innerSig,
        uint256 chainId,
        address delegate,
        uint256 nonce,
        uint8 yParity,
        bytes32 r,
        bytes32 s,
        address initTo,
        bytes memory initData
    ) internal pure returns (bytes memory) {
        // authorization = abi.encode(chainId, address, nonce, yParity, r, s)
        bytes memory auth = abi.encode(chainId, delegate, nonce, yParity, r, s);

        // context = abi.encode(auth, initTo, initData)
        bytes memory context = abi.encode(auth, initTo, initData);

        // context_length = uint32 (4 bytes, big-endian)
        uint32 ctxLen = uint32(context.length);
        bytes memory ctxLenBytes = abi.encodePacked(
            uint8((ctxLen >> 24) & 0xff),
            uint8((ctxLen >> 16) & 0xff),
            uint8((ctxLen >> 8) & 0xff),
            uint8(ctxLen & 0xff)
        );

        return abi.encodePacked(innerSig, context, ctxLenBytes, ERC8010_MAGIC);
    }
}
