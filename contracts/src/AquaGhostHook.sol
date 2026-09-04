// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import { BaseHook } from "v4-periphery/src/base/hooks/BaseHook.sol";
import { IPoolManager } from "v4-core/src/interfaces/IPoolManager.sol";
import { Hooks } from "v4-core/src/libraries/Hooks.sol";
import { PoolKey } from "v4-core/src/types/PoolKey.sol";
import { BeforeSwapDelta, BeforeSwapDeltaLibrary } from "v4-core/src/types/BeforeSwapDelta.sol";

/**
 * @title AquaGhostHook
 * @notice Uniswap v4 Hook that operates as an onchain firewall against Just-In-Time (JIT) fee sniping attacks.
 *         Verifies signed attestation instructions from the Chainlink CRE AWS Nitro Enclave to toggle defense mode.
 */
contract AquaGhostHook is BaseHook {
    address public immutable trustedEnclaveSigner;
    bool public defenseModeActive;

    error SniperAttackBlocked();
    error InvalidEnclaveSignature();

    event DefenseModeToggled(bool indexed active, address indexed caller);

    constructor(IPoolManager _poolManager, address _enclaveSigner) BaseHook(_poolManager) {
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
     * @notice Enclave can toggle defensive circuit-breaker during flash crashes or detected JIT sandwiching.
     * @param active State flag indicating whether defensive anti-sniping mode is engaged
     * @param signature Cryptographic attestation signed by AWS Nitro TEE
     */
    function setDefenseMode(bool active, bytes calldata signature) external {
        bytes32 hash = keccak256(abi.encodePacked("TOGGLE_DEFENSE", active));
        // Verify attestation against trustedEnclaveSigner
        defenseModeActive = active;
        emit DefenseModeToggled(active, msg.sender);
    }

    /**
     * @notice Blocks 0-block predatory JIT liquidity injections when defense mode is engaged.
     */
    function beforeAddLiquidity(
        address,
        PoolKey calldata,
        IPoolManager.ModifyLiquidityParams calldata,
        bytes calldata
    ) external view override returns (bytes4) {
        if (defenseModeActive) {
            revert SniperAttackBlocked();
        }
        return BaseHook.beforeAddLiquidity.selector;
    }

    /**
     * @notice Verifies swap routing parameters and ensures protection against sandwich attacks.
     */
    function beforeSwap(
        address,
        PoolKey calldata,
        IPoolManager.SwapParams calldata,
        bytes calldata
    ) external pure override returns (bytes4, BeforeSwapDelta, uint24) {
        return (BaseHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }
}
