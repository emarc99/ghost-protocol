// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAquaApp
 * @notice Canonical interface for 1inch Aqua swap logic applications.
 *         Called by the Aqua router or traders to quote and settle trades against maker strategies.
 */
interface IAquaApp {
    /**
     * @notice Computes output amount for a given exact input and strategy configuration.
     * @param tokenIn Inbound token address
     * @param tokenOut Outbound token address
     * @param amountIn Amount of inbound tokens provided
     * @param strategyData Encoded strategy configuration
     * @return amountOut Resulting amount of outbound tokens
     */
    function quoteExactInput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bytes calldata strategyData
    ) external view returns (uint256 amountOut);

    /**
     * @notice Computes required input amount for a given exact desired output.
     * @param tokenIn Inbound token address
     * @param tokenOut Outbound token address
     * @param amountOut Desired amount of outbound tokens
     * @param strategyData Encoded strategy configuration
     * @return amountIn Required inbound token amount
     */
    function quoteExactOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        bytes calldata strategyData
    ) external view returns (uint256 amountIn);

    /**
     * @notice Executes a swap with exact input amount.
     * @param tokenIn Inbound token address
     * @param tokenOut Outbound token address
     * @param amountIn Exact inbound token amount
     * @param minAmountOut Minimum acceptable outbound tokens (slippage protection)
     * @param recipient Destination address for outbound tokens
     * @param strategyData Encoded strategy configuration
     * @return amountOut Final amount of outbound tokens delivered
     */
    function swapExactInput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient,
        bytes calldata strategyData
    ) external returns (uint256 amountOut);

    /**
     * @notice Executes a swap with exact output amount.
     * @param tokenIn Inbound token address
     * @param tokenOut Outbound token address
     * @param amountOut Exact outbound token amount desired
     * @param maxAmountIn Maximum acceptable inbound tokens to spend
     * @param recipient Destination address for outbound tokens
     * @param strategyData Encoded strategy configuration
     * @return amountIn Final amount of inbound tokens spent
     */
    function swapExactOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        uint256 maxAmountIn,
        address recipient,
        bytes calldata strategyData
    ) external returns (uint256 amountIn);
}
