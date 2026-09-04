// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { Test, console2 } from "forge-std/Test.sol";
import { AquaGhostApp } from "../src/AquaGhostApp.sol";
import { AquaGhostHook } from "../src/AquaGhostHook.sol";
import { IAqua } from "aqua/interfaces/IAqua.sol";
import { IPoolManager } from "v4-core/src/interfaces/IPoolManager.sol";
import { PoolKey } from "v4-core/src/types/PoolKey.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

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

contract AquaGhostTest is Test {
    using MessageHashUtils for bytes32;

    AquaGhostApp public aquaGhostApp;
    MockAqua public mockAqua;

    uint256 internal enclavePrivateKey = 0xA11CE;
    address internal enclaveSigner;

    function setUp() public {
        enclaveSigner = vm.addr(enclavePrivateKey);
        mockAqua = new MockAqua();
        aquaGhostApp = new AquaGhostApp(mockAqua, enclaveSigner);
    }

    function test_DefensiveShift_ValidSignature() public {
        AquaGhostApp.GhostStrategy memory initialStrategy = AquaGhostApp.GhostStrategy({
            maker: address(this),
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -201200,
            tickUpper: -201000,
            feeBps: 30
        });

        int24 newTickLower = -201400;
        int24 newTickUpper = -201100;
        uint24 newFeeBps = 100;
        uint256 nonce = 1;

        bytes32 rawHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", newTickLower, newTickUpper, newFeeBps, nonce)
        );
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        address[] memory tokens = new address[](2);
        tokens[0] = address(0x1111);
        tokens[1] = address(0x2222);

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 10 ether;
        amounts[1] = 20 ether;

        aquaGhostApp.executeDefensiveShift(
            initialStrategy,
            newTickLower,
            newTickUpper,
            newFeeBps,
            nonce,
            signature,
            tokens,
            amounts
        );

        assertTrue(aquaGhostApp.executedNonces(nonce));
    }

    function test_DefensiveShift_RevertOnReplayedNonce() public {
        AquaGhostApp.GhostStrategy memory initialStrategy = AquaGhostApp.GhostStrategy({
            maker: address(this),
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -201200,
            tickUpper: -201000,
            feeBps: 30
        });

        int24 newTickLower = -201400;
        int24 newTickUpper = -201100;
        uint24 newFeeBps = 100;
        uint256 nonce = 42;

        bytes32 rawHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", newTickLower, newTickUpper, newFeeBps, nonce)
        );
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        address[] memory tokens = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        aquaGhostApp.executeDefensiveShift(
            initialStrategy,
            newTickLower,
            newTickUpper,
            newFeeBps,
            nonce,
            signature,
            tokens,
            amounts
        );

        vm.expectRevert("Nonce already used");
        aquaGhostApp.executeDefensiveShift(
            initialStrategy,
            newTickLower,
            newTickUpper,
            newFeeBps,
            nonce,
            signature,
            tokens,
            amounts
        );
    }
}
