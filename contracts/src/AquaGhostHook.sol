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
    mapping(uint256 => bool) public executedNonces;

    error SniperAttackBlocked(address sender, PoolId poolId);
    error InvalidEnclaveSignature();
    error NonceAlreadyUsed();
    error InvalidFeeBps();

    event DefenseModeToggled(bool indexed active, uint24 dynamicFeeBps, uint256 indexed nonce, address caller);

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

        emit DefenseModeToggled(active, newFeeBps, nonce, msg.sender);
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
}
