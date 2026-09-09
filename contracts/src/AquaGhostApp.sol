// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import { IAqua } from "aqua/interfaces/IAqua.sol";
import { IAquaApp } from "aqua/interfaces/IAquaApp.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import { EIP712 } from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import { AquaSwapVM } from "./swapvm/AquaSwapVM.sol";

/**
 * @title AquaGhostApp
 * @notice 1inch Aqua App integrating Chainlink CRE AWS Nitro Enclave defense attestations
 *         and EIP-712 delegated sentinel authorizations.
 *         Implements canonical IAquaApp interface (quote/swap) alongside autonomous self-custodial
 *         repositioning via dock() and ship() primitives when predatory MEV/JIT events are detected.
 */
contract AquaGhostApp is IAquaApp, EIP712 {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    IAqua public immutable aqua;
    address public immutable trustedEnclaveSigner;
    AquaSwapVM public immutable swapVM;
    mapping(uint256 => bool) public executedNonces;

    bytes32 public constant DELEGATED_SENTINEL_PERMIT_TYPEHASH = keccak256(
        "DelegatedSentinelPermit(address maker,address sentinel,uint256 maxShiftMagnitude,uint256 deadline,uint256 nonce)"
    );

    struct SentinelDelegation {
        address sentinel;
        uint256 maxShiftMagnitude;
        uint256 deadline;
    }

    mapping(address => SentinelDelegation) public delegations;
    mapping(address => uint256) public makerNonces;

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
    error UnauthorizedSentinel();
    error DelegationExpired();
    error ShiftMagnitudeExceeded(uint256 requested, uint256 maxAllowed);
    error InvalidMakerSignature();

    event DefensiveRepositionExecuted(
        address indexed maker,
        bytes32 oldHash,
        bytes32 newHash,
        uint256 indexed nonce
    );

    event SentinelDelegated(
        address indexed maker,
        address indexed sentinel,
        uint256 maxShiftMagnitude,
        uint256 deadline,
        uint256 nonce
    );

    event AquaGhostSwap(
        address indexed maker,
        address indexed recipient,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor(IAqua _aqua, address _enclaveSigner)
        EIP712("AquaGhostApp", "1.0.0")
    {
        if (address(_aqua) == address(0) || _enclaveSigner == address(0)) revert ZeroAddress();
        aqua = _aqua;
        trustedEnclaveSigner = _enclaveSigner;
        swapVM = new AquaSwapVM();
    }

    // =========================================================================
    // EIP-712 Delegated Sentinel Authorization
    // =========================================================================

    /**
     * @notice Authorizes a sentinel to trigger bounded defensive shifts on behalf of maker via EIP-712.
     * @param maker The sovereign maker / LP wallet
     * @param sentinel The authorized automated bot or sentinel address
     * @param maxShiftMagnitude Maximum allowed lower-tick relocation distance
     * @param deadline Expiration timestamp for the delegation
     * @param signature EIP-712 signature from maker
     */
    function permitDelegatedSentinel(
        address maker,
        address sentinel,
        uint256 maxShiftMagnitude,
        uint256 deadline,
        bytes calldata signature
    ) external {
        if (block.timestamp > deadline) revert DelegationExpired();
        if (sentinel == address(0) || maker == address(0)) revert ZeroAddress();

        uint256 currentNonce = makerNonces[maker]++;
        bytes32 structHash = keccak256(
            abi.encode(
                DELEGATED_SENTINEL_PERMIT_TYPEHASH,
                maker,
                sentinel,
                maxShiftMagnitude,
                deadline,
                currentNonce
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address recoveredSigner = hash.recover(signature);
        if (recoveredSigner != maker) revert InvalidMakerSignature();

        delegations[maker] = SentinelDelegation({
            sentinel: sentinel,
            maxShiftMagnitude: maxShiftMagnitude,
            deadline: deadline
        });

        emit SentinelDelegated(maker, sentinel, maxShiftMagnitude, deadline, currentNonce);
    }

    /**
     * @notice Direct on-chain authorization of a delegated sentinel by the maker.
     */
    function setDelegatedSentinel(
        address sentinel,
        uint256 maxShiftMagnitude,
        uint256 deadline
    ) external {
        if (block.timestamp > deadline) revert DelegationExpired();
        if (sentinel == address(0)) revert ZeroAddress();

        uint256 currentNonce = makerNonces[msg.sender]++;
        delegations[msg.sender] = SentinelDelegation({
            sentinel: sentinel,
            maxShiftMagnitude: maxShiftMagnitude,
            deadline: deadline
        });

        emit SentinelDelegated(msg.sender, sentinel, maxShiftMagnitude, deadline, currentNonce);
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
    // 1inch SwapVM Bytecode Execution Pipeline
    // =========================================================================

    /**
     * @notice Quotes the outbound token amount by executing SwapVM bytecode.
     * @param tokenIn Inbound token address
     * @param tokenOut Outbound token address
     * @param amountIn Inbound token amount
     * @param strategyData Encoded GhostStrategy
     * @param swapVMScript Bytecode instructions to execute via AquaSwapVM
     */
    function quoteExactInputWithVM(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bytes calldata strategyData,
        bytes calldata swapVMScript
    ) external returns (uint256 amountOut) {
        GhostStrategy memory strat = abi.decode(strategyData, (GhostStrategy));
        _validateTokens(strat, tokenIn, tokenOut);

        amountOut = swapVM.execute(swapVMScript, amountIn, trustedEnclaveSigner);
    }

    /**
     * @notice Executes an exact input swap using 1inch Aqua SwapVM bytecode execution.
     *         Evaluates custom opcodes such as OP_TEE_GUARD (0x7E) for hardware TEE verification
     *         and OP_DYNAMIC_FEE (0xDF) on the stack prior to on-chain token settlement.
     * @param tokenIn Inbound token address
     * @param tokenOut Outbound token address
     * @param amountIn Inbound token amount
     * @param minAmountOut Minimum acceptable outbound token amount
     * @param recipient Token receiver address
     * @param strategyData Encoded GhostStrategy
     * @param swapVMScript Bytecode instructions to execute via AquaSwapVM
     */
    function swapExactInputWithVM(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        address recipient,
        bytes calldata strategyData,
        bytes calldata swapVMScript
    ) external returns (uint256 amountOut) {
        GhostStrategy memory strat = abi.decode(strategyData, (GhostStrategy));
        _validateTokens(strat, tokenIn, tokenOut);

        // Execute SwapVM bytecode to evaluate opcodes (OP_TEE_GUARD, OP_DYNAMIC_FEE) on the stack
        amountOut = swapVM.execute(swapVMScript, amountIn, trustedEnclaveSigner);
        if (amountOut < minAmountOut) revert SlippageExceeded(minAmountOut, amountOut);

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

        // 1. Verify Delegated Sentinel Authorization if caller is not the maker
        if (msg.sender != currentStrategy.maker) {
            SentinelDelegation memory del = delegations[currentStrategy.maker];
            if (del.sentinel != msg.sender) revert UnauthorizedSentinel();
            if (block.timestamp > del.deadline) revert DelegationExpired();

            int24 lowerDiff = params.newTickLower > currentStrategy.tickLower
                ? params.newTickLower - currentStrategy.tickLower
                : currentStrategy.tickLower - params.newTickLower;
            if (uint256(int256(lowerDiff)) > del.maxShiftMagnitude) {
                revert ShiftMagnitudeExceeded(uint256(int256(lowerDiff)), del.maxShiftMagnitude);
            }
        }

        // 2. Verify CRE Enclave Attestation
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
