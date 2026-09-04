// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAqua
 * @notice Core interface for the 1inch Aqua protocol shared liquidity layer.
 *         Enables self-custodial strategy lifecycle management via dock() and ship().
 */
interface IAqua {
    /**
     * @notice Deactivates an active liquidity strategy and clears allocation parameters.
     * @param app Address of the AquaApp governing the strategy
     * @param strategyHash Unique deterministic hash of the strategy
     * @param tokens Array of token addresses associated with the strategy
     */
    function dock(address app, bytes32 strategyHash, address[] calldata tokens) external;

    /**
     * @notice Registers and activates a new liquidity strategy on-chain.
     * @param app Address of the AquaApp governing the strategy
     * @param strategyData Encoded strategy configuration parameters
     * @param tokens Array of token addresses associated with the strategy
     * @param amounts Token amounts designated for liquidity provisioning
     * @return newStrategyHash Unique deterministic hash of the newly registered strategy
     */
    function ship(
        address app,
        bytes calldata strategyData,
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external returns (bytes32 newStrategyHash);
}
