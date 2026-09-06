// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import { Script, console2 } from "forge-std/Script.sol";
import { AquaGhostApp } from "../src/AquaGhostApp.sol";
import { AquaGhostHook } from "../src/AquaGhostHook.sol";
import { IAqua } from "aqua/interfaces/IAqua.sol";
import { IPoolManager } from "v4-core/src/interfaces/IPoolManager.sol";
import { IHooks } from "v4-core/src/interfaces/IHooks.sol";
import { PoolKey } from "v4-core/src/types/PoolKey.sol";
import { ModifyLiquidityParams, SwapParams } from "v4-core/src/types/PoolOperation.sol";
import { BeforeSwapDelta } from "v4-core/src/types/BeforeSwapDelta.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MockAqua is IAqua {
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

contract MockPoolCaller {
    function testBeforeAddLiquidity(
        address hook,
        address sender,
        PoolKey memory key,
        ModifyLiquidityParams memory params,
        bytes memory hookData
    ) external returns (bytes4) {
        return IHooks(hook).beforeAddLiquidity(sender, key, params, hookData);
    }

    function testBeforeSwap(
        address hook,
        address sender,
        PoolKey memory key,
        SwapParams memory params,
        bytes memory hookData
    ) external returns (bytes4, BeforeSwapDelta, uint24) {
        return IHooks(hook).beforeSwap(sender, key, params, hookData);
    }
}

contract DeployAnvilScript is Script {
    function run() external {
        // Default Anvil Account #0
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerPrivateKey);

        // Enclave Signer Address: corresponds to sample enclave private key 0xA11CE
        uint256 enclavePrivateKey = 0xA11CE;
        address enclaveSigner = vm.addr(enclavePrivateKey);

        console2.log("--- Deploying AquaGhost Protocol to Anvil (Chain ID: 31337) ---");
        console2.log("Deployer Address:", deployer);
        console2.log("Enclave Signer:", enclaveSigner);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Test Tokens (WETH & USDC)
        MockERC20 weth = new MockERC20("Wrapped Ether", "WETH");
        MockERC20 usdc = new MockERC20("USD Coin", "USDC");

        // 2. Deploy 1inch Aqua Mock
        MockAqua aqua = new MockAqua();

        // 3. Deploy Uniswap v4 Mock PoolCaller
        MockPoolCaller poolCaller = new MockPoolCaller();

        // 4. Deploy AquaGhostApp
        AquaGhostApp app = new AquaGhostApp(aqua, enclaveSigner);

        // 5. Deploy AquaGhostHook
        AquaGhostHook hook = new AquaGhostHook(IPoolManager(address(poolCaller)), enclaveSigner);

        // 6. Seed Test Accounts with WETH and USDC
        address userAccount1 = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8; // Anvil Account #1
        weth.mint(deployer, 500 ether);
        usdc.mint(deployer, 1_000_000 ether);
        weth.mint(userAccount1, 500 ether);
        usdc.mint(userAccount1, 1_000_000 ether);

        // Pre-approve Aqua and App for seamless interaction
        weth.approve(address(app), type(uint256).max);
        usdc.approve(address(app), type(uint256).max);

        vm.stopBroadcast();

        console2.log("\n================ DEPLOYMENT ADDRESSES ================");
        console2.log("WETH Token:         ", address(weth));
        console2.log("USDC Token:         ", address(usdc));
        console2.log("1inch Aqua Router:  ", address(aqua));
        console2.log("Uniswap PoolCaller: ", address(poolCaller));
        console2.log("AquaGhostApp:       ", address(app));
        console2.log("AquaGhostHook:      ", address(hook));
        console2.log("======================================================\n");
    }
}
