// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ChallengeLending} from "../src/challenge/ChallengeLending.sol";
import {TokenvETH} from "../src/challenge/TokenvETH.sol";
import {TokenvUSD} from "../src/challenge/TokenvUSD.sol";

contract ChallengeLendingTest is Test {
    ChallengeLending public challenge;
    TokenvETH public vETH;
    TokenvUSD public vUSD;

    address public admin = address(0xAD);
    address public user = address(0x1234);

    function setUp() public {
        vm.startPrank(admin);
        vETH = new TokenvETH();
        vUSD = new TokenvUSD();

        challenge = new ChallengeLending(address(vETH), address(vUSD));

        // Grant minter role to challenge contract on both tokens (required for join() and borrow())
        vETH.grantRole(vETH.ADMIN_ROLE(), address(challenge));
        vUSD.grantRole(vUSD.ADMIN_ROLE(), address(challenge));

        // Open registration
        challenge.open();
        vm.stopPrank();
    }

    function test_Challenge_StartingPosition() public {
        vm.prank(user);
        challenge.join();

        (
            uint256 collateral,
            uint256 debt,
            uint256 hf,
            uint256 numOperations,
            uint256 lastUpdateTime,
            uint256 cumulativeDebtTime
        ) = challenge.positions(user);

        // Verify initial state:
        // 5.00 vETH (500 units) locked as collateral
        assertEq(collateral, 500, "Initial collateral should be 500 units (5.00 vETH)");
        // 7000.00 vUSD (700000 units) debt
        assertEq(debt, 700000, "Initial debt should be 700000 units (7000.00 vUSD)");
        // HF = 500 * 200000 * 78 / (100 * 700000) = 111 (HF 1.11)
        assertEq(hf, 111, "Initial HF should be 111 (~1.11)");

        // Free balances minted to user wallet
        assertEq(vETH.balanceOf(user), 500, "User receives 5.00 free vETH");
        assertEq(vUSD.balanceOf(user), 700000, "User receives 7000.00 free vUSD");
    }

    function test_Challenge_PriceDrop_And_CollateralFirst_Defense() public {
        // User joins
        vm.prank(user);
        challenge.join();

        // Admin starts the scenario clock
        vm.prank(admin);
        challenge.start();

        // Scenario: Price drops from $2000 (200000) to $1750 (175000)
        vm.prank(admin);
        challenge.updatevETHPrice(175000);

        // Recalculate HF at new price:
        // HF = 500 * 175000 * 78 / (100 * 700000) = 68,250,000 / 70,000,000 = 97 (HF 0.97 — DANGER/LIQUIDATION ZONE)
        uint256 droppedHf = challenge.calcHF(user);
        assertEq(droppedHf, 97, "HF drops to 97 (below 100 liquidation threshold)");

        // WINNING MOVE: Collateral-First Defense
        // Instead of repaying debt (which lowers loan continuity score), user deposits 1.00 vETH (100 units)
        vm.startPrank(user);
        vETH.approve(address(challenge), 100);
        challenge.deposit(100);
        vm.stopPrank();

        (uint256 newCollateral, uint256 newDebt, uint256 restoredHf,,,) = challenge.positions(user);

        // Collateral increased to 600 units (6.00 vETH)
        assertEq(newCollateral, 600, "Collateral increased to 600");
        // Debt PRESERVED at 700000 (7000.00 vUSD) — preserves Loan Continuity 100%!
        assertEq(newDebt, 700000, "Debt remains at 700000 (preserving Loan Continuity)");
        // New HF = 600 * 175000 * 78 / (100 * 700000) = 81,900,000 / 70,000,000 = 117 (HF 1.17)
        assertEq(restoredHf, 117, "Restored HF is 117 (HF 1.17, safely above danger zone)");
    }

    function test_Challenge_Stop_LoanContinuityScored() public {
        vm.prank(user);
        challenge.join();

        vm.prank(admin);
        challenge.start();

        // Fast forward 1 hour (3600 seconds)
        vm.warp(block.timestamp + 3600);

        // Admin stops scenario
        vm.prank(admin);
        challenge.stop();

        // Debt stayed at 700000 throughout the entire duration
        // Loan continuity score should be 10000 basis points (100%)
        uint256 score = challenge.loanContinuityScore(user);
        assertEq(score, 10000, "Score should be 10000 bp (100% Loan Continuity)");
    }
}
