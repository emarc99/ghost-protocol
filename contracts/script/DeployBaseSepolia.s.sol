// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import { Script, console2 } from "forge-std/Script.sol";
import { AquaGhostApp } from "../src/AquaGhostApp.sol";
import { AquaGhostHook } from "../src/AquaGhostHook.sol";
import { IAqua } from "aqua/interfaces/IAqua.sol";
import { IPoolManager } from "v4-core/src/interfaces/IPoolManager.sol";

contract MockAquaRouter is IAqua {
    event DockCalled(address app, bytes32 strategyHash, address[] tokens);
    event ShipCalled(address app, bytes strategyData, address[] tokens, uint256[] amounts);

    function dock(address app, bytes32 strategyHash, address[] calldata tokens) external override {
        emit DockCalled(app, strategyHash, tokens);
    }

    function ship(
        address app,
        bytes calldata strategyData,
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external override returns (bytes32 newStrategyHash) {
        emit ShipCalled(app, strategyData, tokens, amounts);
        return keccak256(strategyData);
    }
}

contract DeployBaseSepoliaScript is Script {
    // Official Keystone Forwarder on Base Sepolia (EIP-155 Chain ID: 84532)
    address public constant KEYSTONE_FORWARDER_BASE_SEPOLIA = 0xF8344CFd5c43616a4366C34E3EEE75af79a74482;

    function run() external {
        uint256 deployerPrivateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);

        // Enclave public key corresponding to sample private key 0xA11CE
        uint256 enclavePrivateKey = vm.envOr("ENCLAVE_PRIVATE_KEY", uint256(0xA11CE));
        address enclaveSigner = vm.addr(enclavePrivateKey);

        console2.log("==================================================================");
        console2.log("  AQUAGHOST PROTOCOL - BASE SEPOLIA DEPLOYMENT SCRIPT (CHAIN 84532)");
        console2.log("==================================================================");
        console2.log("Deployer Address:       ", deployer);
        console2.log("Trusted Enclave Signer: ", enclaveSigner);
        console2.log("Keystone Forwarder:     ", KEYSTONE_FORWARDER_BASE_SEPOLIA);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy 1inch Aqua Router
        MockAquaRouter aqua = new MockAquaRouter();

        // 2. Deploy AquaGhostApp
        AquaGhostApp app = new AquaGhostApp(aqua, enclaveSigner);

        // 3. Deploy AquaGhostHook with Chainlink Keystone Forwarder
        AquaGhostHook hook = new AquaGhostHook(IPoolManager(deployer), enclaveSigner);

        vm.stopBroadcast();

        console2.log("\n>>> DEPLOYED CONTRACTS ON BASE SEPOLIA <<<");
        console2.log("AquaGhostApp:       ", address(app));
        console2.log("AquaSwapVM:         ", address(app.swapVM()));
        console2.log("AquaGhostHook:      ", address(hook));
        console2.log("KeystoneForwarder:  ", hook.keystoneForwarder());
        console2.log("==================================================================\n");
    }
}
