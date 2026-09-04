// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { IAqua } from "aqua/interfaces/IAqua.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { MessageHashUtils } from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AquaGhostApp
 * @notice 1inch Aqua App integrating Chainlink CRE AWS Nitro Enclave defense attestations.
 *         Automates self-custodial repositioning using dock() and ship() primitives when
 *         an anomalous or predatory JIT liquidity event is detected.
 */
contract AquaGhostApp {
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

    event DefensiveRepositionExecuted(address indexed maker, bytes32 oldHash, bytes32 newHash);

    constructor(IAqua _aqua, address _enclaveSigner) {
        aqua = _aqua;
        trustedEnclaveSigner = _enclaveSigner;
    }

    /**
     * @notice Repositions maker inventory upon verifying a signed attestation from the CRE Enclave.
     * @param currentStrategy The existing deployed strategy parameters
     * @param newTickLower Relocated lower tick bound
     * @param newTickUpper Relocated upper tick bound
     * @param newFeeBps Updated defensive dynamic fee tier
     * @param nonce Replay prevention nonce
     * @param signature Cryptographic attestation signed by AWS Nitro TEE
     * @param tokens Array of token addresses
     * @param amounts Token amounts for reallocation
     */
    function executeDefensiveShift(
        GhostStrategy calldata currentStrategy,
        int24 newTickLower,
        int24 newTickUpper,
        uint24 newFeeBps,
        uint256 nonce,
        bytes calldata signature,
        address[] calldata tokens,
        uint256[] calldata amounts
    ) external {
        require(!executedNonces[nonce], "Nonce already used");
        executedNonces[nonce] = true;

        // 1. Verify CRE Enclave Attestation
        bytes32 messageHash = keccak256(
            abi.encodePacked("DEFENSIVE_SHIFT", newTickLower, newTickUpper, newFeeBps, nonce)
        ).toEthSignedMessageHash();
        
        address signer = messageHash.recover(signature);
        require(signer == trustedEnclaveSigner, "Invalid enclave attestation");

        // 2. Compute Existing Strategy Hash
        bytes32 oldStrategyHash = keccak256(abi.encode(currentStrategy));

        // 3. Self-Custodial Dock (Unregister Old Strategy)
        aqua.dock(address(this), oldStrategyHash, tokens);

        // 4. Ship New Defensive Strategy with Shifted Range
        GhostStrategy memory updated = GhostStrategy({
            maker: currentStrategy.maker,
            token0: currentStrategy.token0,
            token1: currentStrategy.token1,
            tickLower: newTickLower,
            tickUpper: newTickUpper,
            feeBps: newFeeBps
        });

        bytes32 newStrategyHash = aqua.ship(
            address(this),
            abi.encode(updated),
            tokens,
            amounts
        );

        emit DefensiveRepositionExecuted(currentStrategy.maker, oldStrategyHash, newStrategyHash);
    }
}
