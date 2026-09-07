// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AquaSwapVM
 * @notice Custom Stack-Based Execution Virtual Machine for 1inch Aqua strategies.
 *         Inspired by Tanner Moore's SwapVM architecture, introducing custom security opcodes:
 *         - OP_TEE_GUARD (0x7E): Halts execution if a transaction violates an active CRE TEE attestation.
 *         - OP_DYNAMIC_FEE (0xDF): Computes and deducts dynamic fee basis points on the operand stack.
 */
contract AquaSwapVM {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // Core Stack Opcodes
    uint8 public constant OP_STOP = 0x00;
    uint8 public constant OP_PUSH = 0x01;
    uint8 public constant OP_DUP = 0x02;
    uint8 public constant OP_SWAP = 0x03;
    uint8 public constant OP_ADD = 0x10;
    uint8 public constant OP_SUB = 0x11;
    uint8 public constant OP_MUL = 0x12;
    uint8 public constant OP_DIV = 0x13;

    // Custom 1inch Aqua Security Extensions
    uint8 public constant OP_DYNAMIC_FEE = 0xDF;
    uint8 public constant OP_TEE_GUARD = 0x7E;

    error StackUnderflow();
    error StackOverflow();
    error DivisionByZero();
    error UnknownOpcode(uint8 opcode);
    error TEEGuardVerificationFailed(address recovered, address expected);
    error InvalidBytecodeLength();

    event TEEGuardVerified(address indexed trustedSigner, bytes32 indexed messageHash);

    uint256 private constant MAX_STACK_DEPTH = 32;

    /**
     * @notice Evaluates a SwapVM bytecode script over an input amount.
     * @param script Bytecode containing SwapVM opcodes and operands
     * @param inputAmount Initial input token amount pushed onto stack
     * @param trustedEnclaveSigner Expected signer for OP_TEE_GUARD checks
     * @return finalAmount Top of stack upon OP_STOP
     */
    function execute(
        bytes calldata script,
        uint256 inputAmount,
        address trustedEnclaveSigner
    ) external returns (uint256 finalAmount) {
        uint256[] memory stack = new uint256[](MAX_STACK_DEPTH);
        uint256 sp = 0; // Stack pointer

        // Push initial input token amount
        stack[sp++] = inputAmount;

        uint256 pc = 0; // Program counter
        uint256 len = script.length;

        while (pc < len) {
            uint8 op = uint8(script[pc++]);

            if (op == OP_STOP) {
                break;
            } else if (op == OP_PUSH) {
                if (pc + 32 > len) revert InvalidBytecodeLength();
                if (sp >= MAX_STACK_DEPTH) revert StackOverflow();
                uint256 val = uint256(bytes32(script[pc:pc + 32]));
                pc += 32;
                stack[sp++] = val;
            } else if (op == OP_DUP) {
                if (sp == 0) revert StackUnderflow();
                if (sp >= MAX_STACK_DEPTH) revert StackOverflow();
                stack[sp] = stack[sp - 1];
                sp++;
            } else if (op == OP_SWAP) {
                if (sp < 2) revert StackUnderflow();
                uint256 tmp = stack[sp - 1];
                stack[sp - 1] = stack[sp - 2];
                stack[sp - 2] = tmp;
            } else if (op == OP_ADD) {
                if (sp < 2) revert StackUnderflow();
                uint256 b = stack[--sp];
                uint256 a = stack[--sp];
                stack[sp++] = a + b;
            } else if (op == OP_SUB) {
                if (sp < 2) revert StackUnderflow();
                uint256 b = stack[--sp];
                uint256 a = stack[--sp];
                stack[sp++] = a >= b ? a - b : 0;
            } else if (op == OP_MUL) {
                if (sp < 2) revert StackUnderflow();
                uint256 b = stack[--sp];
                uint256 a = stack[--sp];
                stack[sp++] = a * b;
            } else if (op == OP_DIV) {
                if (sp < 2) revert StackUnderflow();
                uint256 b = stack[--sp];
                uint256 a = stack[--sp];
                if (b == 0) revert DivisionByZero();
                stack[sp++] = a / b;
            } else if (op == OP_DYNAMIC_FEE) {
                // Stack: [amount, feeBps] -> [netAmount]
                if (sp < 2) revert StackUnderflow();
                uint256 feeBps = stack[--sp];
                uint256 amount = stack[--sp];
                uint256 fee = (amount * feeBps) / 10000;
                stack[sp++] = amount >= fee ? amount - fee : 0;
            } else if (op == OP_TEE_GUARD) {
                // Read 65-byte signature + 32-byte messageHash from bytecode payload
                if (pc + 97 > len) revert InvalidBytecodeLength();
                bytes32 rawHash = bytes32(script[pc:pc + 32]);
                pc += 32;

                bytes memory signature = bytes(script[pc:pc + 65]);
                pc += 65;

                bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
                address recovered = ethSignedHash.recover(signature);

                if (recovered != trustedEnclaveSigner) {
                    revert TEEGuardVerificationFailed(recovered, trustedEnclaveSigner);
                }

                emit TEEGuardVerified(trustedEnclaveSigner, rawHash);
            } else {
                revert UnknownOpcode(op);
            }
        }

        if (sp == 0) revert StackUnderflow();
        finalAmount = stack[sp - 1];
    }
}
