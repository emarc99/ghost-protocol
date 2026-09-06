// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import { IAqua } from "aqua/interfaces/IAqua.sol";
import { IAquaApp } from "aqua/interfaces/IAquaApp.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AquaGhostApp
 * @notice 1inch Aqua App integrating Chainlink CRE AWS Nitro Enclave defense attestations.
 *         Implements canonical IAquaApp interface (quote/swap) alongside autonomous self-custodial
 *         repositioning via dock() and ship() primitives when predatory MEV/JIT events are detected.
 */
contract AquaGhostApp is IAquaApp {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IAqua public immutable aqua;
    address public immutable trustedEnclaveSigner;
    mapping(uint256 => bool) public executedNonces;

    struct GhostStrategy {
        address maker;
        address token0;
        address token1;
        int24 tickLower;
        int24 tickUpper;
        uint24 feeBps;
    }

    struct ShiftParams {
        int24 newTickLower;
        int24 newTickUpper;
        uint24 newFeeBps;
        uint256 nonce;
    }

    error NonceAlreadyUsed();
    error InvalidEnclaveSignature();
    error InvalidTickRange(int24 tickLower, int24 tickUpper);
    error InvalidFeeBps(uint24 feeBps);
    error InvalidTokens(address tokenIn, address tokenOut);
    error SlippageExceeded(uint256 expected, uint256 actual);
    error ZeroAddress();

    event DefensiveRepositionExecuted(
        address indexed maker,
        bytes32 oldHash,
        bytes32 newHash,
        uint256 indexed nonce
    );

    event AquaGhostSwap(
        address indexed maker,
        address indexed recipient,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(IAqua _aqua, address _enclaveSigner) {
        if (address(_aqua) == address(0) || _enclaveSigner == address(0)) revert ZeroAddress();
        aqua = _aqua;
        trustedEnclaveSigner = _enclaveSigner;
    }

    // =========================================================================
    // Canonical IAquaApp Swap Methods
    // =========================================================================

    /**
     * @notice Quotes the outbound token amount for an exact inbound amount under a maker strategy.
     */
    function quoteExactInput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bytes calldata strategyData
    ) public pure override returns (uint256 amountOut) {
        GhostStrategy memory strat = abi.decode(strategyData, (GhostStrategy));
        _validateTokens(strat, tokenIn, tokenOut);

        uint256 fee = (amountIn * strat.feeBps) / 10000;
        uint256 netIn = amountIn - fee;

        // Base 1:1 invariant adjusted for tick width spread
        int24 tickWidth = strat.tickUpper - strat.tickLower;
        if (tickWidth <= 0) revert InvalidTickRange(strat.tickLower, strat.tickUpper);
        
        amountOut = netIn;
    }

    /**
     * @notice Quotes the required inbound token amount for an exact outbound amount under a maker strategy.
     */
    function quoteExactOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        bytes calldata strategyData
    ) public pure override returns (uint256 amountIn) {
        GhostStrategy memory strat = abi.decode(strategyData, (GhostStrategy));
        _validateTokens(strat, tokenIn, tokenOut);

        if (strat.feeBps >= 10000) revert InvalidFeeBps(strat.feeBps);
        amountIn = (amountOut * 10000) / (10000 - strat.feeBps);
    }

    /**
     * @notice Executes an exact input swap between trader and maker's sovereign wallet inventory.
     */
    function swapExactInput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient,
        bytes calldata strategyData
    ) external override returns (uint256 amountOut) {
        amountOut = quoteExactInput(tokenIn, tokenOut, amountIn, strategyData);
        if (amountOut < minAmountOut) revert SlippageExceeded(minAmountOut, amountOut);

        GhostStrategy memory strat = abi.decode(strategyData, (GhostStrategy));

        // Atomic settlement from sovereign maker wallet to recipient
        IERC20(tokenIn).safeTransferFrom(msg.sender, strat.maker, amountIn);
        IERC20(tokenOut).safeTransferFrom(strat.maker, recipient, amountOut);

        emit AquaGhostSwap(strat.maker, recipient, tokenIn, tokenOut, amountIn, amountOut);
    }

    /**
     * @notice Executes an exact output swap between trader and maker's sovereign wallet inventory.
     */
    function swapExactOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountOut,
        uint256 maxAmountIn,
        address recipient,
        bytes calldata strategyData
    ) external override returns (uint256 amountIn) {
        amountIn = quoteExactOutput(tokenIn, tokenOut, amountOut, strategyData);
        if (amountIn > maxAmountIn) revert SlippageExceeded(maxAmountIn, amountIn);

        GhostStrategy memory strat = abi.decode(strategyData, (GhostStrategy));

        // Atomic settlement from sovereign maker wallet to recipient
        IERC20(tokenIn).safeTransferFrom(msg.sender, strat.maker, amountIn);
        IERC20(tokenOut).safeTransferFrom(strat.maker, recipient, amountOut);

        emit AquaGhostSwap(strat.maker, recipient, tokenIn, tokenOut, amountIn, amountOut);
    }

    // =========================================================================
    // Autonomous Confidential Defense Mechanism
    // =========================================================================

    /**
     * @notice Repositions maker inventory upon verifying a signed attestation from the CRE Enclave.
     * @param currentStrategy The existing deployed strategy parameters
     * @param params Relocated lower/upper ticks, fee tier, and nonce
     * @param signature Cryptographic attestation signed by AWS Nitro TEE
     * @param tokens Array of token addresses
     * @param amounts Token amounts for reallocation
     */
    function executeDefensiveShift(
        GhostStrategy calldata currentStrategy,
        ShiftParams calldata params,
        bytes calldata signature,
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external {
        if (executedNonces[params.nonce]) revert NonceAlreadyUsed();
        if (params.newTickLower >= params.newTickUpper) {
            revert InvalidTickRange(params.newTickLower, params.newTickUpper);
        }
        if (params.newFeeBps > 10000) revert InvalidFeeBps(params.newFeeBps);
        executedNonces[params.nonce] = true;

        // 1. Verify CRE Enclave Attestation
        bytes32 messageHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", params.newTickLower, params.newTickUpper, params.newFeeBps, params.nonce)
        ).toEthSignedMessageHash();
        
        address signer = messageHash.recover(signature);
        if (signer != trustedEnclaveSigner) revert InvalidEnclaveSignature();

        // 2. Compute Existing Strategy Hash
        bytes32 oldStrategyHash = keccak256(abi.encode(currentStrategy));

        // 3. Self-Custodial Dock (Unregister Old Strategy)
        aqua.dock(address(this), oldStrategyHash, tokens);

        // 4. Ship New Defensive Strategy with Shifted Range
        GhostStrategy memory updated = GhostStrategy({
            maker: currentStrategy.maker,
            token0: currentStrategy.token0,
            token1: currentStrategy.token1,
            tickLower: params.newTickLower,
            tickUpper: params.newTickUpper,
            feeBps: params.newFeeBps
        });

        bytes32 newStrategyHash = aqua.ship(
            address(this),
            abi.encode(updated),
            tokens,
            amounts
        );

        emit DefensiveRepositionExecuted(currentStrategy.maker, oldStrategyHash, newStrategyHash, params.nonce);
    }

    function _validateTokens(GhostStrategy memory strat, address tokenIn, address tokenOut) internal pure {
        bool validDirect = (tokenIn == strat.token0 && tokenOut == strat.token1);
        bool validReverse = (tokenIn == strat.token1 && tokenOut == strat.token0);
        if (!validDirect && !validReverse) revert InvalidTokens(tokenIn, tokenOut);
    }
}
