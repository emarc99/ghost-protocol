// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import { BaseHook } from "./base/BaseHook.sol";
import { IPoolManager } from "v4-core/src/interfaces/IPoolManager.sol";
import { Hooks } from "v4-core/src/libraries/Hooks.sol";
import { PoolKey } from "v4-core/src/types/PoolKey.sol";
import { PoolId, PoolIdLibrary } from "v4-core/src/types/PoolId.sol";
import { ModifyLiquidityParams, SwapParams } from "v4-core/src/types/PoolOperation.sol";
import { BeforeSwapDelta, BeforeSwapDeltaLibrary } from "v4-core/src/types/BeforeSwapDelta.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AquaGhostHook
 * @notice Uniswap v4 Hook that operates as an on-chain firewall against Just-In-Time (JIT) fee sniping attacks.
 *         Verifies cryptographically signed attestation instructions from the Chainlink CRE AWS Nitro Enclave
 *         to toggle defense mode and apply dynamic fee overrides.
 */
contract AquaGhostHook is BaseHook {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using PoolIdLibrary for PoolKey;

    address public immutable trustedEnclaveSigner;
    bool public defenseModeActive;
    uint24 public dynamicFeeBps;
    uint256 public lastDefenseBlock;
    uint256 public lastDefenseTimestamp;
    uint256 public lastNonce;
    uint256 public defenseEngagementCount;
    mapping(uint256 => bool) public executedNonces;

    error SniperAttackBlocked(address sender, PoolId poolId);
    error InvalidEnclaveSignature();
    error NonceAlreadyUsed();
    error InvalidFeeBps();

    /// @notice Backward-compatible toggle event
    event DefenseModeToggled(bool indexed active, uint24 dynamicFeeBps, uint256 indexed nonce, address caller);

    /// @notice Structured explainable defense telemetry event (FairFlow pattern for indexers & UI)
    event DefenseAssessment(
        bool indexed active,
        uint24 dynamicFeeBps,
        uint256 indexed nonce,
        uint256 blockNumber,
        uint256 timestamp,
        uint256 indexed engagementCount,
        address caller
    );

    /// @notice Explainable fee breakdown struct for routers, aggregators, and UI dashboards
    struct FeeBreakdown {
        uint24 baseFee;
        uint24 defenseFee;
        uint24 effectiveFee;
        bool isDefenseActive;
        string mode;
    }

    /// @notice Full state telemetry snapshot for autonomous monitoring sentinels and indexers
    struct DefenseTelemetry {
        bool active;
        uint24 dynamicFeeBps;
        uint256 lastDefenseBlock;
        uint256 lastDefenseTimestamp;
        uint256 lastNonce;
        uint256 defenseEngagementCount;
        address enclaveSigner;
    }

    constructor(IPoolManager _poolManager, address _enclaveSigner) BaseHook(_poolManager) {
        require(_enclaveSigner != address(0), "Zero address signer");
        trustedEnclaveSigner = _enclaveSigner;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: false,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    /**
     * @notice Enclave toggles defensive circuit-breaker during flash crashes or detected JIT sandwiching.
     * @param active State flag indicating whether defensive anti-sniping mode is engaged
     * @param newFeeBps Dynamic swap fee override in basis points (e.g. 100 = 1%)
     * @param nonce Replay prevention counter
     * @param signature Cryptographic attestation signed by AWS Nitro TEE
     */
    function setDefenseMode(
        bool active,
        uint24 newFeeBps,
        uint256 nonce,
        bytes calldata signature
    ) external {
        if (executedNonces[nonce]) revert NonceAlreadyUsed();
        if (newFeeBps > 10000) revert InvalidFeeBps(); // Max 100%
        executedNonces[nonce] = true;

        bytes32 messageHash = keccak256(
            abi.encodePacked("TOGGLE_DEFENSE", active, newFeeBps, nonce)
        ).toEthSignedMessageHash();

        address signer = messageHash.recover(signature);
        if (signer != trustedEnclaveSigner) revert InvalidEnclaveSignature();

        defenseModeActive = active;
        dynamicFeeBps = newFeeBps;
        lastDefenseBlock = block.number;
        lastDefenseTimestamp = block.timestamp;
        lastNonce = nonce;
        if (active) {
            defenseEngagementCount++;
        }

        emit DefenseModeToggled(active, newFeeBps, nonce, msg.sender);
        emit DefenseAssessment(
            active,
            newFeeBps,
            nonce,
            block.number,
            block.timestamp,
            defenseEngagementCount,
            msg.sender
        );
    }

    /**
     * @notice Router- and UI-friendly directional fee preview (FairFlow explainability pattern).
     * @param key The Uniswap v4 PoolKey
     * @return breakdown Structured breakdown of base fee, defense override, and current mode
     */
    function previewFee(PoolKey calldata key) external view returns (FeeBreakdown memory breakdown) {
        uint24 base = uint24(key.fee);
        uint24 effective = defenseModeActive ? dynamicFeeBps : base;
        return FeeBreakdown({
            baseFee: base,
            defenseFee: defenseModeActive ? dynamicFeeBps : 0,
            effectiveFee: effective,
            isDefenseActive: defenseModeActive,
            mode: defenseModeActive ? "DEFENSE_ACTIVE" : "CALM"
        });
    }

    /**
     * @notice Returns comprehensive defense telemetry snapshot for indexers and AI sentinels.
     */
    function getDefenseTelemetry() external view returns (DefenseTelemetry memory) {
        return DefenseTelemetry({
            active: defenseModeActive,
            dynamicFeeBps: dynamicFeeBps,
            lastDefenseBlock: lastDefenseBlock,
            lastDefenseTimestamp: lastDefenseTimestamp,
            lastNonce: lastNonce,
            defenseEngagementCount: defenseEngagementCount,
            enclaveSigner: trustedEnclaveSigner
        });
    }

    /**
     * @notice Blocks 0-block predatory JIT liquidity injections when defense mode is engaged.
     */
    function beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) external view override returns (bytes4) {
        if (defenseModeActive) {
            revert SniperAttackBlocked(sender, key.toId());
        }
        return BaseHook.beforeAddLiquidity.selector;
    }

    /**
     * @notice Applies dynamic fee overrides when anomalous volatility or toxic flow is detected.
     */
    function beforeSwap(
        address,
        PoolKey calldata,
        SwapParams calldata,
        bytes calldata
    ) external view override returns (bytes4, BeforeSwapDelta, uint24) {
        uint24 fee = dynamicFeeBps;
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, fee);
    }

    // =========================================================================
    // On-Chain Hook Metadata Introspection
    // =========================================================================

    /**
     * @notice Exposes canonical schema for expected hookData to Uniswap v4 routers and HookList visualizers.
     */
    function expectedHookDataSchema() external pure returns (string memory) {
        return "tuple(bytes32 attestationHash, bytes signature, uint256 nonce)";
    }

    /**
     * @notice Dynamic metadata introspection for aggregators, indexers, and autonomous sentinels.
     */
    function getHookMetadata() external view returns (
        string memory name,
        string memory version,
        address enclaveSigner,
        bool isDefenseActive,
        uint24 currentFeeBps,
        string memory hookType
    ) {
        return (
            "AquaGhost Anti-Sniper Firewall Hook",
            "1.0.0",
            trustedEnclaveSigner,
            defenseModeActive,
            dynamicFeeBps,
            "CRE_NITRO_TEE_FIREWALL"
        );
    }
}
