import {
  cre,
  hexToBase64,
  ok,
  text,
  type TeeRuntime,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters, keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";
import { validateGuardrails, DefenseDecision } from "./guardrails.js";
import { PoolMetrics, GraphMCPClient } from "./graphClient.js";

// ─── 1. Zod Configuration Schema (Official CRE Standard) ───────
export const configSchema = z.object({
  schedule: z.string(),
  subgraphUrl: z.string(),
  poolTarget: z.string(),
  riskThresholdBps: z.number(),
  maxSlippageBps: z.number(),
  secretSignerId: z.string()
});
export type Config = z.infer<typeof configSchema>;

// ─── 2. Confidential In-Enclave Logic (AWS Nitro TEE) ──────────
export const onCronTrigger = async (runtime: TeeRuntime<Config>): Promise<string> => {
  const config = runtime.config;

  runtime.log("--- AquaGhost CRE Sentinel Running Inside AWS Nitro TEE ---");

  // Step 1: Securely access confidential policy & signing secrets from Vault DON
  let enclaveSignerKey = "0x00000000000000000000000000000000000000000000000000000000000a11ce";
  try {
    const secret = runtime.getSecret({ id: config.secretSignerId }).result();
    if (secret?.value) {
      enclaveSignerKey = secret.value;
      runtime.log("Successfully decrypted Vault DON secret inside enclave.");
    }
  } catch (err) {
    runtime.log("Running in development mode with local key fallback.");
  }

  // Step 2: Confidential Data Ingestion via Graph Subgraph MCP Client
  const graphClient = new GraphMCPClient(config.subgraphUrl);
  let poolMetrics: PoolMetrics;
  try {
    poolMetrics = await graphClient.fetchPoolMetrics(config.poolTarget);
  } catch (e) {
    // Deterministic fallback metrics for offline simulation
    poolMetrics = {
      poolId: config.poolTarget,
      tickCurrent: -201200,
      liquidityDelta: "15000000000",
      totalValueLockedUSD: "10000000",
      volumeUSD24h: "52000000",
      volatilityBps: 220
    };
  }

  // Step 3: Anomaly Heuristics & JIT Threat Assessment
  const isJitAttack = Number(poolMetrics.liquidityDelta) > 10_000_000_000 && poolMetrics.volatilityBps > config.riskThresholdBps;

  const decision: DefenseDecision = {
    action: isJitAttack ? "DEFENSIVE_SHIFT" : "HOLD",
    newTickLower: poolMetrics.tickCurrent - 120,
    newTickUpper: poolMetrics.tickCurrent + 120,
    feeBps: 250, // 2.50% dynamic fee override
    nonce: Date.now()
  };

  // Step 4: Enforce Deterministic Safety Guardrails Inside Enclave
  validateGuardrails(decision, poolMetrics.tickCurrent, {
    maxSlippageBps: config.maxSlippageBps,
    minTickWidth: 60,
    maxFeeBps: 10000
  });

  // Step 5: Cryptographic Attestation Signing Inside Hardware TEE
  const account = privateKeyToAccount(enclaveSignerKey as `0x${string}`);
  const messageHash = keccak256(
    encodePacked(
      ["string", "int24", "int24", "uint24", "uint256"],
      [decision.action, decision.newTickLower, decision.newTickUpper, decision.feeBps, BigInt(decision.nonce)]
    )
  );
  const signature = await account.signMessage({ message: { raw: messageHash } });

  runtime.log(`Attestation signed inside TEE for action=${decision.action}, nonce=${decision.nonce}`);

  // Step 6: Cross Confidentiality Boundary to DON for Consensus & On-Chain Report
  const donRuntime = runtime.usingTheDons();

  const encodedPayload = encodeAbiParameters(
    parseAbiParameters("string action, int24 newTickLower, int24 newTickUpper, uint24 feeBps, uint256 nonce, bytes signature"),
    [
      decision.action,
      decision.newTickLower,
      decision.newTickUpper,
      decision.feeBps,
      BigInt(decision.nonce),
      signature as `0x${string}`
    ]
  );

  donRuntime
    .report({
      encodedPayload: hexToBase64(encodedPayload),
      encoderName: "evm",
      signingAlgo: "ecdsa",
      hashingAlgo: "keccak256"
    })
    .result();

  donRuntime.log(`Workflow DON consensus reached for report: ${decision.action}`);

  return `AquaGhost Sentinel Verdict: ${decision.action} (Fee: ${decision.feeBps} bps, Signature: ${signature.slice(0, 18)}...)`;
};

// ─── 3. Workflow Registration Function ────────────────────────
export function initWorkflow(config: Config) {
  const cronTrigger = new cre.capabilities.CronCapability();

  return [
    // Step 1: Register TEE Handler with AWS Nitro constraints
    cre.handlerInTee(cronTrigger.trigger({ schedule: config.schedule }), onCronTrigger, [
      { tee: "nitro", regions: ["us-west-2"] }
    ])
  ];
}

export default initWorkflow;
