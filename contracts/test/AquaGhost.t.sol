// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import { Test, console2 } from "forge-std/Test.sol";
import { AquaGhostApp } from "../src/AquaGhostApp.sol";
import { AquaGhostHook } from "../src/AquaGhostHook.sol";
import { AquaSwapVM } from "../src/swapvm/AquaSwapVM.sol";
import { IAqua } from "aqua/interfaces/IAqua.sol";
import { IPoolManager } from "v4-core/src/interfaces/IPoolManager.sol";
import { Hooks } from "v4-core/src/libraries/Hooks.sol";
import { PoolKey } from "v4-core/src/types/PoolKey.sol";
import { PoolId, PoolIdLibrary } from "v4-core/src/types/PoolId.sol";
import { Currency } from "v4-core/src/types/Currency.sol";
import { ModifyLiquidityParams, SwapParams } from "v4-core/src/types/PoolOperation.sol";
import { BeforeSwapDelta, BeforeSwapDeltaLibrary } from "v4-core/src/types/BeforeSwapDelta.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
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

contract AquaGhostTest is Test {
    using MessageHashUtils for bytes32;
    using PoolIdLibrary for PoolKey;

    AquaGhostApp public aquaGhostApp;
    AquaGhostHook public aquaGhostHook;
    MockAqua public mockAqua;
    IPoolManager public poolManager;
    MockERC20 public tokenA;
    MockERC20 public tokenB;

    uint256 internal enclavePrivateKey = 0xA11CE;
    address internal enclaveSigner;
    PoolKey internal testPoolKey;

    function setUp() public {
        enclaveSigner = vm.addr(enclavePrivateKey);
        mockAqua = new MockAqua();
        poolManager = IPoolManager(address(0x9999));
        tokenA = new MockERC20("Token A", "TKNA");
        tokenB = new MockERC20("Token B", "TKNB");

        aquaGhostApp = new AquaGhostApp(mockAqua, enclaveSigner);
        aquaGhostHook = new AquaGhostHook(poolManager, enclaveSigner);

        testPoolKey = PoolKey({
            currency0: Currency.wrap(address(0x1111)),
            currency1: Currency.wrap(address(0x2222)),
            fee: 3000,
            tickSpacing: 60,
            hooks: aquaGhostHook
        });
    }

    // =========================================================================
    // AquaGhostApp Unit Tests
    // =========================================================================

    function test_App_DefensiveShift_ValidSignature() public {
        AquaGhostApp.GhostStrategy memory initialStrategy = AquaGhostApp.GhostStrategy({
            maker: address(this),
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -201200,
            tickUpper: -201000,
            feeBps: 30
        });

        AquaGhostApp.ShiftParams memory params = AquaGhostApp.ShiftParams({
            newTickLower: -201400,
            newTickUpper: -201100,
            newFeeBps: 100,
            nonce: 1
        });

        bytes32 rawHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", params.newTickLower, params.newTickUpper, params.newFeeBps, params.nonce)
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

        aquaGhostApp.executeDefensiveShift(initialStrategy, params, signature, tokens, amounts);

        assertTrue(aquaGhostApp.executedNonces(params.nonce));
    }

    function test_App_DefensiveShift_RevertOnReplayedNonce() public {
        AquaGhostApp.GhostStrategy memory initialStrategy = AquaGhostApp.GhostStrategy({
            maker: address(this),
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -201200,
            tickUpper: -201000,
            feeBps: 30
        });

        AquaGhostApp.ShiftParams memory params = AquaGhostApp.ShiftParams({
            newTickLower: -201400,
            newTickUpper: -201100,
            newFeeBps: 100,
            nonce: 42
        });

        bytes32 rawHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", params.newTickLower, params.newTickUpper, params.newFeeBps, params.nonce)
        );
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        address[] memory tokens = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        aquaGhostApp.executeDefensiveShift(initialStrategy, params, signature, tokens, amounts);

        vm.expectRevert(AquaGhostApp.NonceAlreadyUsed.selector);
        aquaGhostApp.executeDefensiveShift(initialStrategy, params, signature, tokens, amounts);
    }

    function test_App_DefensiveShift_RevertOnInvalidSignature() public {
        AquaGhostApp.GhostStrategy memory initialStrategy = AquaGhostApp.GhostStrategy({
            maker: address(this),
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -201200,
            tickUpper: -201000,
            feeBps: 30
        });

        AquaGhostApp.ShiftParams memory params = AquaGhostApp.ShiftParams({
            newTickLower: -201400,
            newTickUpper: -201100,
            newFeeBps: 100,
            nonce: 99
        });

        // Sign with an unauthorized attacker key
        uint256 attackerKey = 0xBAD;
        bytes32 rawHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", params.newTickLower, params.newTickUpper, params.newFeeBps, params.nonce)
        );
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(attackerKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        address[] memory tokens = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        vm.expectRevert(AquaGhostApp.InvalidEnclaveSignature.selector);
        aquaGhostApp.executeDefensiveShift(initialStrategy, params, signature, tokens, amounts);
    }

    function test_App_DefensiveShift_RevertOnInvalidTickRange() public {
        AquaGhostApp.GhostStrategy memory initialStrategy = AquaGhostApp.GhostStrategy({
            maker: address(this),
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -201200,
            tickUpper: -201000,
            feeBps: 30
        });

        // tickLower >= tickUpper
        AquaGhostApp.ShiftParams memory params = AquaGhostApp.ShiftParams({
            newTickLower: -201000,
            newTickUpper: -201200,
            newFeeBps: 100,
            nonce: 101
        });

        address[] memory tokens = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        vm.expectRevert(abi.encodeWithSelector(AquaGhostApp.InvalidTickRange.selector, params.newTickLower, params.newTickUpper));
        aquaGhostApp.executeDefensiveShift(initialStrategy, params, "", tokens, amounts);
    }

    function test_App_Constructor_RevertOnZeroAddress() public {
        vm.expectRevert(AquaGhostApp.ZeroAddress.selector);
        new AquaGhostApp(IAqua(address(0)), enclaveSigner);

        vm.expectRevert(AquaGhostApp.ZeroAddress.selector);
        new AquaGhostApp(mockAqua, address(0));
    }

    // =========================================================================
    // EIP-712 Delegated Sentinel Unit Tests
    // =========================================================================

    function test_App_DelegatedSentinel_Permit_Success() public {
        uint256 makerPk = 0xAA11;
        address maker = vm.addr(makerPk);
        address sentinel = address(0x5E4714E1);
        uint256 maxShiftMagnitude = 300;
        uint256 deadline = block.timestamp + 1 hours;
        uint256 nonce = aquaGhostApp.makerNonces(maker);

        bytes32 structHash = keccak256(
            abi.encode(
                aquaGhostApp.DELEGATED_SENTINEL_PERMIT_TYPEHASH(),
                maker,
                sentinel,
                maxShiftMagnitude,
                deadline,
                nonce
            )
        );

        bytes32 domainSeparator = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("AquaGhostApp")),
                keccak256(bytes("1.0.0")),
                block.chainid,
                address(aquaGhostApp)
            )
        );

        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(makerPk, digest);
        bytes memory makerSignature = abi.encodePacked(r, s, v);

        aquaGhostApp.permitDelegatedSentinel(maker, sentinel, maxShiftMagnitude, deadline, makerSignature);

        (address assignedSentinel, uint256 allowedMagnitude, uint256 expDeadline) = aquaGhostApp.delegations(maker);
        assertEq(assignedSentinel, sentinel);
        assertEq(allowedMagnitude, maxShiftMagnitude);
        assertEq(expDeadline, deadline);

        AquaGhostApp.GhostStrategy memory initialStrategy = AquaGhostApp.GhostStrategy({
            maker: maker,
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -201200,
            tickUpper: -201000,
            feeBps: 30
        });

        AquaGhostApp.ShiftParams memory params = AquaGhostApp.ShiftParams({
            newTickLower: -201400,
            newTickUpper: -201100,
            newFeeBps: 100,
            nonce: 888
        });

        bytes32 rawHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", params.newTickLower, params.newTickUpper, params.newFeeBps, params.nonce)
        );
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 ev, bytes32 er, bytes32 es) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory enclaveSignature = abi.encodePacked(er, es, ev);

        address[] memory tokens = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        vm.prank(sentinel);
        aquaGhostApp.executeDefensiveShift(initialStrategy, params, enclaveSignature, tokens, amounts);
        assertTrue(aquaGhostApp.executedNonces(888));
    }

    function test_App_DelegatedSentinel_RevertOnShiftMagnitudeExceeded() public {
        uint256 makerPk = 0xAA22;
        address maker = vm.addr(makerPk);
        address sentinel = address(0x5E4714E2);
        uint256 maxShiftMagnitude = 100;
        uint256 deadline = block.timestamp + 1 hours;

        vm.prank(maker);
        aquaGhostApp.setDelegatedSentinel(sentinel, maxShiftMagnitude, deadline);

        AquaGhostApp.GhostStrategy memory initialStrategy = AquaGhostApp.GhostStrategy({
            maker: maker,
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -201200,
            tickUpper: -201000,
            feeBps: 30
        });

        AquaGhostApp.ShiftParams memory params = AquaGhostApp.ShiftParams({
            newTickLower: -201400, // 200 tick shift > 100 max
            newTickUpper: -201100,
            newFeeBps: 100,
            nonce: 889
        });

        bytes32 rawHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", params.newTickLower, params.newTickUpper, params.newFeeBps, params.nonce)
        );
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 ev, bytes32 er, bytes32 es) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory enclaveSignature = abi.encodePacked(er, es, ev);

        address[] memory tokens = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        vm.prank(sentinel);
        vm.expectRevert(abi.encodeWithSelector(AquaGhostApp.ShiftMagnitudeExceeded.selector, 200, 100));
        aquaGhostApp.executeDefensiveShift(initialStrategy, params, enclaveSignature, tokens, amounts);
    }

    function test_App_DelegatedSentinel_RevertOnUnauthorizedCaller() public {
        address maker = address(0xAAAA);
        address attacker = address(0xDEAD);

        AquaGhostApp.GhostStrategy memory initialStrategy = AquaGhostApp.GhostStrategy({
            maker: maker,
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -201200,
            tickUpper: -201000,
            feeBps: 30
        });

        AquaGhostApp.ShiftParams memory params = AquaGhostApp.ShiftParams({
            newTickLower: -201400,
            newTickUpper: -201100,
            newFeeBps: 100,
            nonce: 890
        });

        bytes32 rawHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", params.newTickLower, params.newTickUpper, params.newFeeBps, params.nonce)
        );
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 ev, bytes32 er, bytes32 es) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory enclaveSignature = abi.encodePacked(er, es, ev);

        address[] memory tokens = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        vm.prank(attacker);
        vm.expectRevert(AquaGhostApp.UnauthorizedSentinel.selector);
        aquaGhostApp.executeDefensiveShift(initialStrategy, params, enclaveSignature, tokens, amounts);
    }

    // =========================================================================
    // AquaGhostHook Unit Tests
    // =========================================================================

    function test_Hook_Permissions() public view {
        Hooks.Permissions memory perms = aquaGhostHook.getHookPermissions();
        assertTrue(perms.beforeAddLiquidity);
        assertTrue(perms.beforeSwap);
        assertFalse(perms.afterAddLiquidity);
        assertFalse(perms.afterSwap);
        assertFalse(perms.beforeInitialize);
        assertFalse(perms.afterInitialize);
    }

    function test_Hook_ExpectedHookDataSchema() public view {
        string memory schema = aquaGhostHook.expectedHookDataSchema();
        assertEq(schema, "tuple(bytes32 attestationHash, bytes signature, uint256 nonce)");
    }

    function test_Hook_GetHookMetadata() public view {
        (
            string memory name,
            string memory version,
            address signer,
            bool isDefenseActive,
            uint24 currentFeeBps,
            string memory hookType
        ) = aquaGhostHook.getHookMetadata();

        assertEq(name, "AquaGhost Anti-Sniper Firewall Hook");
        assertEq(version, "1.0.0");
        assertEq(signer, enclaveSigner);
        assertFalse(isDefenseActive);
        assertEq(currentFeeBps, 0);
        assertEq(hookType, "CRE_NITRO_TEE_FIREWALL");
    }

    function test_Hook_SetDefenseMode_ValidSignature() public {
        bool active = true;
        uint24 newFeeBps = 150; // 1.5%
        uint256 nonce = 500;

        bytes32 rawHash = keccak256(abi.encodePacked("TOGGLE_DEFENSE", active, newFeeBps, nonce));
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        aquaGhostHook.setDefenseMode(active, newFeeBps, nonce, signature);

        assertTrue(aquaGhostHook.defenseModeActive());
        assertEq(aquaGhostHook.dynamicFeeBps(), newFeeBps);
        assertTrue(aquaGhostHook.executedNonces(nonce));
    }

    function test_Hook_SetDefenseMode_RevertOnReplayedNonce() public {
        bool active = true;
        uint24 newFeeBps = 100;
        uint256 nonce = 501;

        bytes32 rawHash = keccak256(abi.encodePacked("TOGGLE_DEFENSE", active, newFeeBps, nonce));
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        aquaGhostHook.setDefenseMode(active, newFeeBps, nonce, signature);

        vm.expectRevert(AquaGhostHook.NonceAlreadyUsed.selector);
        aquaGhostHook.setDefenseMode(active, newFeeBps, nonce, signature);
    }

    function test_Hook_SetDefenseMode_RevertOnInvalidSignature() public {
        bool active = true;
        uint24 newFeeBps = 100;
        uint256 nonce = 502;

        uint256 attackerKey = 0xBEEF;
        bytes32 rawHash = keccak256(abi.encodePacked("TOGGLE_DEFENSE", active, newFeeBps, nonce));
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(attackerKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        vm.expectRevert(AquaGhostHook.InvalidEnclaveSignature.selector);
        aquaGhostHook.setDefenseMode(active, newFeeBps, nonce, signature);
    }

    function test_Hook_BeforeAddLiquidity_PassWhenDefenseInactive() public {
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -100,
            tickUpper: 100,
            liquidityDelta: 1000,
            salt: bytes32(0)
        });

        bytes4 selector = aquaGhostHook.beforeAddLiquidity(address(this), testPoolKey, params, "");
        assertEq(selector, AquaGhostHook.beforeAddLiquidity.selector);
    }

    function test_Hook_BeforeAddLiquidity_RevertWhenDefenseActive() public {
        // 1. Arm defense mode via enclave signature
        uint256 nonce = 777;
        bytes32 rawHash = keccak256(abi.encodePacked("TOGGLE_DEFENSE", true, uint24(100), nonce));
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        aquaGhostHook.setDefenseMode(true, 100, nonce, abi.encodePacked(r, s, v));

        // 2. Sniper bot attempts predatory liquidity injection
        address sniperBot = address(0xBAD0B07);
        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -201210,
            tickUpper: -201190,
            liquidityDelta: 15_000_000,
            salt: bytes32(0)
        });

        vm.expectRevert(
            abi.encodeWithSelector(AquaGhostHook.SniperAttackBlocked.selector, sniperBot, testPoolKey.toId())
        );
        aquaGhostHook.beforeAddLiquidity(sniperBot, testPoolKey, params, "");
    }

    function test_Hook_BeforeSwap_DynamicFeeApplied() public {
        // Activate dynamic fee
        uint24 targetFee = 250; // 2.5%
        uint256 nonce = 888;
        bytes32 rawHash = keccak256(abi.encodePacked("TOGGLE_DEFENSE", true, targetFee, nonce));
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        aquaGhostHook.setDefenseMode(true, targetFee, nonce, abi.encodePacked(r, s, v));

        SwapParams memory swapParams = SwapParams({
            zeroForOne: true,
            amountSpecified: 1000,
            sqrtPriceLimitX96: 0
        });

        (bytes4 selector, BeforeSwapDelta delta, uint24 fee) = aquaGhostHook.beforeSwap(
            address(this),
            testPoolKey,
            swapParams,
            ""
        );

        assertEq(selector, AquaGhostHook.beforeSwap.selector);
        assertEq(fee, targetFee);
        assertEq(BeforeSwapDelta.unwrap(delta), BeforeSwapDelta.unwrap(BeforeSwapDeltaLibrary.ZERO_DELTA));
    }

    function test_Hook_PreviewFee_Calm() public view {
        AquaGhostHook.FeeBreakdown memory preview = aquaGhostHook.previewFee(testPoolKey);
        assertEq(preview.baseFee, 3000);
        assertEq(preview.defenseFee, 0);
        assertEq(preview.effectiveFee, 3000);
        assertFalse(preview.isDefenseActive);
        assertEq(preview.mode, "CALM");
    }

    function test_Hook_PreviewFee_DefenseActive() public {
        uint256 nonce = 777;
        uint24 targetFee = 250;
        bytes32 rawHash = keccak256(abi.encodePacked("TOGGLE_DEFENSE", true, targetFee, nonce));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, rawHash.toEthSignedMessageHash());
        aquaGhostHook.setDefenseMode(true, targetFee, nonce, abi.encodePacked(r, s, v));

        AquaGhostHook.FeeBreakdown memory preview = aquaGhostHook.previewFee(testPoolKey);
        assertEq(preview.baseFee, 3000);
        assertEq(preview.defenseFee, targetFee);
        assertEq(preview.effectiveFee, targetFee);
        assertTrue(preview.isDefenseActive);
        assertEq(preview.mode, "DEFENSE_ACTIVE");

        AquaGhostHook.DefenseTelemetry memory telemetry = aquaGhostHook.getDefenseTelemetry();
        assertTrue(telemetry.active);
        assertEq(telemetry.dynamicFeeBps, targetFee);
        assertEq(telemetry.lastNonce, nonce);
        assertEq(telemetry.defenseEngagementCount, 1);
        assertEq(telemetry.enclaveSigner, enclaveSigner);

        // Disengage defense and verify return to CALM with defenseFee 0
        uint256 nonce2 = 778;
        bytes32 rawHash2 = keccak256(abi.encodePacked("TOGGLE_DEFENSE", false, targetFee, nonce2));
        (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(enclavePrivateKey, rawHash2.toEthSignedMessageHash());
        aquaGhostHook.setDefenseMode(false, targetFee, nonce2, abi.encodePacked(r2, s2, v2));

        AquaGhostHook.FeeBreakdown memory calmPreview = aquaGhostHook.previewFee(testPoolKey);
        assertEq(calmPreview.baseFee, 3000);
        assertEq(calmPreview.defenseFee, 0);
        assertEq(calmPreview.effectiveFee, 3000);
        assertFalse(calmPreview.isDefenseActive);
        assertEq(calmPreview.mode, "CALM");
    }

    // =========================================================================
    // FUZZ TESTS
    // =========================================================================

    function testFuzz_App_DefensiveShift(
        int24 tickLower,
        int24 tickUpper,
        uint24 feeBps,
        uint256 nonce
    ) public {
        vm.assume(tickLower < tickUpper);
        vm.assume(feeBps <= 10000);
        vm.assume(nonce > 0);

        AquaGhostApp.GhostStrategy memory current = AquaGhostApp.GhostStrategy({
            maker: address(this),
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -100,
            tickUpper: 100,
            feeBps: 30
        });

        AquaGhostApp.ShiftParams memory params = AquaGhostApp.ShiftParams({
            newTickLower: tickLower,
            newTickUpper: tickUpper,
            newFeeBps: feeBps,
            nonce: nonce
        });

        bytes32 rawHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", params.newTickLower, params.newTickUpper, params.newFeeBps, params.nonce)
        );
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        address[] memory tokens = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        aquaGhostApp.executeDefensiveShift(current, params, signature, tokens, amounts);
        assertTrue(aquaGhostApp.executedNonces(nonce));
    }

    function testFuzz_App_RejectUnauthorizedSigner(
        uint256 attackerKey,
        uint256 nonce
    ) public {
        uint256 secp256k1Order = 115792089237316195423570985008687907852837564279074904382605163141518161494336;
        attackerKey = bound(attackerKey, 1, secp256k1Order);
        vm.assume(attackerKey != enclavePrivateKey);

        AquaGhostApp.GhostStrategy memory current = AquaGhostApp.GhostStrategy({
            maker: address(this),
            token0: address(0x1111),
            token1: address(0x2222),
            tickLower: -100,
            tickUpper: 100,
            feeBps: 30
        });

        AquaGhostApp.ShiftParams memory params = AquaGhostApp.ShiftParams({
            newTickLower: -500,
            newTickUpper: 500,
            newFeeBps: 50,
            nonce: nonce
        });

        bytes32 rawHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", params.newTickLower, params.newTickUpper, params.newFeeBps, params.nonce)
        );
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(attackerKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        address[] memory tokens = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        vm.expectRevert(AquaGhostApp.InvalidEnclaveSignature.selector);
        aquaGhostApp.executeDefensiveShift(current, params, signature, tokens, amounts);
    }

    function testFuzz_Hook_SniperBlocking(address attacker, uint256 nonce) public {
        vm.assume(attacker != address(0));

        bytes32 rawHash = keccak256(abi.encodePacked("TOGGLE_DEFENSE", true, uint24(100), nonce));
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        aquaGhostHook.setDefenseMode(true, 100, nonce, abi.encodePacked(r, s, v));

        ModifyLiquidityParams memory params = ModifyLiquidityParams({
            tickLower: -10,
            tickUpper: 10,
            liquidityDelta: 1000,
            salt: bytes32(0)
        });

        vm.expectRevert(
            abi.encodeWithSelector(AquaGhostHook.SniperAttackBlocked.selector, attacker, testPoolKey.toId())
        );
        aquaGhostHook.beforeAddLiquidity(attacker, testPoolKey, params, "");
    }

    function testFuzz_Hook_DynamicFee(uint24 feeBps, uint256 nonce) public {
        feeBps = uint24(bound(feeBps, 0, 10000));
        vm.assume(nonce > 0);

        bytes32 rawHash = keccak256(abi.encodePacked("TOGGLE_DEFENSE", true, feeBps, nonce));
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        aquaGhostHook.setDefenseMode(true, feeBps, nonce, abi.encodePacked(r, s, v));

        SwapParams memory swapParams = SwapParams({
            zeroForOne: true,
            amountSpecified: 5000,
            sqrtPriceLimitX96: 0
        });

        (bytes4 selector, BeforeSwapDelta delta, uint24 dynamicFee) = aquaGhostHook.beforeSwap(
            address(this),
            testPoolKey,
            swapParams,
            ""
        );

        assertEq(selector, AquaGhostHook.beforeSwap.selector);
        assertEq(BeforeSwapDelta.unwrap(delta), 0);
        assertEq(dynamicFee, feeBps);
    }

    // =========================================================================
    // Canonical IAquaApp Swap Tests
    // =========================================================================

    function test_App_QuoteExactInput() public view {
        AquaGhostApp.GhostStrategy memory strategy = AquaGhostApp.GhostStrategy({
            maker: address(0xAAAA),
            token0: address(tokenA),
            token1: address(tokenB),
            tickLower: -1000,
            tickUpper: 1000,
            feeBps: 30 // 0.3%
        });
        bytes memory data = abi.encode(strategy);

        uint256 amountIn = 10_000;
        uint256 expectedOut = 10_000 - (10_000 * 30 / 10000); // 9970
        uint256 quoted = aquaGhostApp.quoteExactInput(address(tokenA), address(tokenB), amountIn, data);
        assertEq(quoted, expectedOut);
    }

    function test_App_QuoteExactOutput() public view {
        AquaGhostApp.GhostStrategy memory strategy = AquaGhostApp.GhostStrategy({
            maker: address(0xAAAA),
            token0: address(tokenA),
            token1: address(tokenB),
            tickLower: -1000,
            tickUpper: 1000,
            feeBps: 30 // 0.3%
        });
        bytes memory data = abi.encode(strategy);

        uint256 amountOut = 9970;
        uint256 requiredIn = aquaGhostApp.quoteExactOutput(address(tokenA), address(tokenB), amountOut, data);
        assertEq(requiredIn, 10_000);
    }

    function test_App_SwapExactInput_Success() public {
        address maker = address(0xAAAA);
        address trader = address(0xBBBB);

        tokenB.mint(maker, 50_000);
        tokenA.mint(trader, 50_000);

        AquaGhostApp.GhostStrategy memory strategy = AquaGhostApp.GhostStrategy({
            maker: maker,
            token0: address(tokenA),
            token1: address(tokenB),
            tickLower: -1000,
            tickUpper: 1000,
            feeBps: 30
        });
        bytes memory data = abi.encode(strategy);

        // Approvals
        vm.prank(maker);
        tokenB.approve(address(aquaGhostApp), type(uint256).max);

        vm.prank(trader);
        tokenA.approve(address(aquaGhostApp), type(uint256).max);

        // Execute swap from trader
        vm.prank(trader);
        uint256 amountOut = aquaGhostApp.swapExactInput(
            address(tokenA),
            address(tokenB),
            10_000,
            9900,
            trader,
            data
        );

        assertEq(amountOut, 9970);
        assertEq(tokenA.balanceOf(maker), 10_000);
        assertEq(tokenB.balanceOf(trader), 9970);
    }

    function test_App_SwapExactOutput_Success() public {
        address maker = address(0xAAAA);
        address trader = address(0xBBBB);

        tokenB.mint(maker, 50_000);
        tokenA.mint(trader, 50_000);

        AquaGhostApp.GhostStrategy memory strategy = AquaGhostApp.GhostStrategy({
            maker: maker,
            token0: address(tokenA),
            token1: address(tokenB),
            tickLower: -1000,
            tickUpper: 1000,
            feeBps: 30
        });
        bytes memory data = abi.encode(strategy);

        // Approvals
        vm.prank(maker);
        tokenB.approve(address(aquaGhostApp), type(uint256).max);

        vm.prank(trader);
        tokenA.approve(address(aquaGhostApp), type(uint256).max);

        // Execute swap for exact 9970 output
        vm.prank(trader);
        uint256 amountIn = aquaGhostApp.swapExactOutput(
            address(tokenA),
            address(tokenB),
            9970,
            10_050,
            trader,
            data
        );

        assertEq(amountIn, 10_000);
        assertEq(tokenA.balanceOf(maker), 10_000);
        assertEq(tokenB.balanceOf(trader), 9970);
    }

    function test_App_SwapExactInput_RevertOnSlippage() public {
        address maker = address(0xAAAA);
        address trader = address(0xBBBB);

        AquaGhostApp.GhostStrategy memory strategy = AquaGhostApp.GhostStrategy({
            maker: maker,
            token0: address(tokenA),
            token1: address(tokenB),
            tickLower: -1000,
            tickUpper: 1000,
            feeBps: 100 // 1%
        });
        bytes memory data = abi.encode(strategy);

        vm.expectRevert(
            abi.encodeWithSelector(AquaGhostApp.SlippageExceeded.selector, 10_000, 9900)
        );
        aquaGhostApp.swapExactInput(address(tokenA), address(tokenB), 10_000, 10_000, trader, data);
    }

    function test_App_QuoteExactInput_RevertOnInvalidTokens() public {
        AquaGhostApp.GhostStrategy memory strategy = AquaGhostApp.GhostStrategy({
            maker: address(0xAAAA),
            token0: address(tokenA),
            token1: address(tokenB),
            tickLower: -1000,
            tickUpper: 1000,
            feeBps: 30
        });
        bytes memory data = abi.encode(strategy);

        address fakeToken = address(0xDEAD);
        vm.expectRevert(
            abi.encodeWithSelector(AquaGhostApp.InvalidTokens.selector, fakeToken, address(tokenB))
        );
        aquaGhostApp.quoteExactInput(fakeToken, address(tokenB), 1000, data);
    }

    function test_App_SwapExactInputWithVM_Success() public {
        address maker = address(0xAAAA);
        address trader = address(0xBBBB);

        tokenB.mint(maker, 50_000);
        tokenA.mint(trader, 50_000);

        AquaGhostApp.GhostStrategy memory strategy = AquaGhostApp.GhostStrategy({
            maker: maker,
            token0: address(tokenA),
            token1: address(tokenB),
            tickLower: -1000,
            tickUpper: 1000,
            feeBps: 250 // 2.5%
        });
        bytes memory data = abi.encode(strategy);

        // Approvals
        vm.prank(maker);
        tokenB.approve(address(aquaGhostApp), type(uint256).max);

        vm.prank(trader);
        tokenA.approve(address(aquaGhostApp), type(uint256).max);

        // Generate enclave attestation signature for OP_TEE_GUARD
        bytes32 rawHash = keccak256("AQUA_SWAPVM_GUARD:PASS");
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // Build SwapVM script: OP_TEE_GUARD -> OP_PUSH(250 BPS = 2.5%) -> OP_DYNAMIC_FEE -> OP_STOP
        // Input: 10_000. Fee: 2.5% (250). Expected Output: 9,750
        bytes memory swapScript = abi.encodePacked(
            aquaGhostApp.swapVM().OP_TEE_GUARD(),
            rawHash,
            signature,
            aquaGhostApp.swapVM().OP_PUSH(),
            bytes32(uint256(250)),
            aquaGhostApp.swapVM().OP_DYNAMIC_FEE(),
            aquaGhostApp.swapVM().OP_STOP()
        );

        // Execute Swap via SwapVM
        vm.prank(trader);
        uint256 amountOut = aquaGhostApp.swapExactInputWithVM(
            address(tokenA),
            address(tokenB),
            10_000,
            9700,
            trader,
            data,
            swapScript
        );

        assertEq(amountOut, 9750);
        assertEq(tokenA.balanceOf(maker), 10_000);
        assertEq(tokenB.balanceOf(trader), 9750);
    }

    function test_App_SwapExactInputWithVM_RevertOnInvalidTEEGuard() public {
        address maker = address(0xAAAA);
        address trader = address(0xBBBB);

        tokenB.mint(maker, 50_000);
        tokenA.mint(trader, 50_000);

        AquaGhostApp.GhostStrategy memory strategy = AquaGhostApp.GhostStrategy({
            maker: maker,
            token0: address(tokenA),
            token1: address(tokenB),
            tickLower: -1000,
            tickUpper: 1000,
            feeBps: 250
        });
        bytes memory data = abi.encode(strategy);

        // Approvals
        vm.prank(maker);
        tokenB.approve(address(aquaGhostApp), type(uint256).max);

        vm.prank(trader);
        tokenA.approve(address(aquaGhostApp), type(uint256).max);

        // Sign with rogue unauthorized key
        uint256 rogueKey = 0xBAD;
        bytes32 rawHash = keccak256("AQUA_SWAPVM_GUARD:FAIL");
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(rogueKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        bytes memory swapScript = abi.encodePacked(
            aquaGhostApp.swapVM().OP_TEE_GUARD(),
            rawHash,
            signature,
            aquaGhostApp.swapVM().OP_STOP()
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                AquaSwapVM.TEEGuardVerificationFailed.selector,
                vm.addr(rogueKey),
                enclaveSigner
            )
        );
        vm.prank(trader);
        aquaGhostApp.swapExactInputWithVM(
            address(tokenA),
            address(tokenB),
            10_000,
            9000,
            trader,
            data,
            swapScript
        );
    }
}

