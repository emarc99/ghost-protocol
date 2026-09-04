/**
 * Deterministic Guardrails executed inside the AWS Nitro TEE Enclave.
 * Prevents autonomous LLM hallucinations or rogue state transitions from producing
 * malicious or out-of-bound attestation parameters.
 */

export interface DefenseDecision {
  action: "HOLD" | "DEFENSIVE_SHIFT" | "EMERGENCY_DOCK";
  newTickLower: number;
  newTickUpper: number;
  feeBps: number;
  nonce: number;
}

export interface GuardrailConfig {
  maxSlippageBps: number;
  minTickWidth: number;
  maxFeeBps: number;
}

/**
 * Validates defense parameters against enclave-enforced limits.
 * Throws if proposed repositioning violates safety bounds.
 */
export function validateGuardrails(
  decision: DefenseDecision,
  currentTick: number,
  config: GuardrailConfig
): void {
  if (decision.action === "DEFENSIVE_SHIFT") {
    // 1. Tick width verification
    const tickWidth = decision.newTickUpper - decision.newTickLower;
    if (tickWidth < config.minTickWidth) {
      throw new Error(`Guardrail breach: Proposed tick width (${tickWidth}) below minimum (${config.minTickWidth})`);
    }

    // 2. Magnitude of shift relative to current market tick
    const shiftMagnitude = Math.abs(decision.newTickLower - currentTick);
    if (shiftMagnitude > config.maxSlippageBps) {
      throw new Error(
        `Guardrail breach: Proposed shift magnitude (${shiftMagnitude}) exceeds max slippage threshold (${config.maxSlippageBps})`
      );
    }

    // 3. Fee tier bounds verification
    if (decision.feeBps > config.maxFeeBps || decision.feeBps < 0) {
      throw new Error(`Guardrail breach: Proposed fee (${decision.feeBps}) out of bounds [0, ${config.maxFeeBps}]`);
    }
  }

  if (decision.nonce <= 0) {
    throw new Error("Guardrail breach: Nonce must be strictly positive");
  }
}
