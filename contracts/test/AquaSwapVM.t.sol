// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import { Test } from "forge-std/Test.sol";
import { AquaSwapVM } from "../src/swapvm/AquaSwapVM.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract AquaSwapVMTest is Test {
    using MessageHashUtils for bytes32;

    AquaSwapVM public vmEngine;
    uint256 internal enclavePrivateKey = 0xA11CE;
    address internal enclaveSigner;

    function setUp() public {
        vmEngine = new AquaSwapVM();
        enclaveSigner = vm.addr(enclavePrivateKey);
    }

    function test_SwapVM_ArithmeticExecution() public {
        // Script: inputAmount (1000) -> PUSH(500) -> ADD -> OP_STOP
        // Result: 1000 + 500 = 1500
        bytes memory script = abi.encodePacked(
            vmEngine.OP_PUSH(),
            bytes32(uint256(500)),
            vmEngine.OP_ADD(),
            vmEngine.OP_STOP()
        );

        uint256 result = vmEngine.execute(script, 1000, enclaveSigner);
        assertEq(result, 1500);
    }

    function test_SwapVM_DynamicFeeOpcode() public {
        // Script: inputAmount (10000) -> PUSH(250 BPS = 2.5%) -> OP_DYNAMIC_FEE -> OP_STOP
        // Expected: 10000 - 250 = 9750
        bytes memory script = abi.encodePacked(
            vmEngine.OP_PUSH(),
            bytes32(uint256(250)),
            vmEngine.OP_DYNAMIC_FEE(),
            vmEngine.OP_STOP()
        );

        uint256 result = vmEngine.execute(script, 10000, enclaveSigner);
        assertEq(result, 9750);
    }

    function test_SwapVM_TEEGuard_ValidSignature() public {
        // 1. Generate valid enclave attestation hash and signature
        bytes32 rawHash = keccak256("AQUA_SWAPVM_GUARD:PASS");
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(enclavePrivateKey, ethSignedHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        // 2. Build bytecode with OP_TEE_GUARD:
        // [input 1000] -> OP_TEE_GUARD [32-byte rawHash][65-byte sig] -> OP_STOP
        bytes memory script = abi.encodePacked(
            vmEngine.OP_TEE_GUARD(),
            rawHash,
            signature,
            vmEngine.OP_STOP()
        );

        uint256 result = vmEngine.execute(script, 1000, enclaveSigner);
        assertEq(result, 1000);
    }

    function test_SwapVM_TEEGuard_RevertOnInvalidSignature() public {
        bytes32 rawHash = keccak256("AQUA_SWAPVM_GUARD:ATTACK");
        bytes32 ethSignedHash = rawHash.toEthSignedMessageHash();
        
        // Signed by rogue key
        uint256 rogueKey = 0xBAD0B07;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(rogueKey, ethSignedHash);
        bytes memory rogueSignature = abi.encodePacked(r, s, v);

        bytes memory script = abi.encodePacked(
            vmEngine.OP_TEE_GUARD(),
            rawHash,
            rogueSignature,
            vmEngine.OP_STOP()
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                AquaSwapVM.TEEGuardVerificationFailed.selector,
                vm.addr(rogueKey),
                enclaveSigner
            )
        );
        vmEngine.execute(script, 1000, enclaveSigner);
    }

    function test_SwapVM_RevertOnStackUnderflow() public {
        // Pop without pushing second operand
        bytes memory script = abi.encodePacked(
            vmEngine.OP_ADD(),
            vmEngine.OP_STOP()
        );

        vm.expectRevert(AquaSwapVM.StackUnderflow.selector);
        vmEngine.execute(script, 1000, enclaveSigner);
    }
}
