// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {SessionKeyValidator} from "../src/SessionKeyValidator.sol";
import {SessionKeyInitializer} from "../src/SessionKeyInitializer.sol";

/// @title Deploy
/// @notice Deploy script for the ERC-8010 demo contracts.
contract Deploy is Script {
    function run() public {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        SessionKeyValidator validator = new SessionKeyValidator();
        console.log("SessionKeyValidator deployed at:", address(validator));

        SessionKeyInitializer initializer = new SessionKeyInitializer();
        console.log("SessionKeyInitializer deployed at:", address(initializer));

        vm.stopBroadcast();

        console.log("\n--- Deployment Summary ---");
        console.log("Chain ID:", block.chainid);
        console.log("Deployer:", vm.addr(deployerKey));
        console.log("Validator:", address(validator));
        console.log("Initializer:", address(initializer));
    }
}
