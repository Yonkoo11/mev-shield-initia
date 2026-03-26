// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/BatchAuction.sol";
import "../src/ShieldSOL.sol";
import "../src/ShieldUSDC.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // Deploy tokens
        ShieldSOL shSOL = new ShieldSOL();
        ShieldUSDC shUSDC = new ShieldUSDC();

        // Deploy BatchAuction
        BatchAuction auction = new BatchAuction();
        auction.initialize(address(shSOL), address(shUSDC), 30);

        // Mint demo tokens to deployer (18 decimals)
        shSOL.mint(deployer, 5000 ether);
        shUSDC.mint(deployer, 500_000 ether);

        vm.stopBroadcast();

        console.log("ShieldSOL:", address(shSOL));
        console.log("ShieldUSDC:", address(shUSDC));
        console.log("BatchAuction:", address(auction));
    }
}
