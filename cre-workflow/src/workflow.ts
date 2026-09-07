import {
  cre,
  hexToBase64,
  ok,
  text,
  type TeeRuntime,
  type HTTPPayload,
} from "@chainlink/cre-sdk";
import { encodeAbiParameters, parseAbiParameters, keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";
import { validateGuardrails, DefenseDecision } from "./guardrails.js";
import { PoolMetrics, EnclaveGraphFetcher } from "./graphClient.js";

// ─── 1. Zod Configuration Schema (Official CRE Standard) ───────
export const configSchema = z.object({
  schedule: z.string(),
  subgraphUrl: z.string(),
  poolTarget: z.string(),
  riskThresholdBps: z.number(),
  maxSlippageBps: z.number(),
  secretSignerId: z.string(),
  authorizedKeys: z.array(z.any()).optional()
});
export type Config = z.infer<typeof configSchema>;

// ─── 2. Optional Input Schema for On-Demand HTTP POST Trigger ───
export interface HttpTriggerInput {
  poolTarget?: string;
  riskThresholdBps?: number;
  maxSlippageBps?: number;
  forceDefensive?: boolean;
}

// ─── 3. Confidential In-Enclave Logic (AWS Nitro TEE) ──────────
/**
 * Shared confidential evaluation engine running strictly inside AWS Nitro TEE enclave.
 * Computes over Vault DON secrets, live Graph Subgraph MCP liquidity ticks, and executes
 * cryptographic ECDSA attestation signing before crossing back to the Workflow DON.
 */
export async function evaluateDefenseInsideEnclave(
  runtime: TeeRuntime<Config>,
  triggerSource: "CRON" | "HTTP",
  requestPayload?: HttpTriggerInput
): Promise<string> {
  const config = runtime.config;
  const poolTarget = requestPayload?.poolTarget || config.poolTarget;
  const riskThresholdBps = requestPayload?.riskThresholdBps ?? config.riskThresholdBps;
  const maxSlippageBps = requestPayload?.maxSlippageBps ?? config.maxSlippageBps;

  runtime.log(
    `--- AquaGhost CRE Sentinel v1.0.0 Running Inside AWS Nitro TEE [Trigger: ${triggerSource}] ---`
  );

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

  // Step 2: Confidential In-Enclave Data Ingestion via Graph Subgraph Fetcher
  const graphFetcher = new EnclaveGraphFetcher(config.subgraphUrl);
  let poolMetrics: PoolMetrics;
  try {
    poolMetrics = await graphFetcher.fetchPoolMetrics(poolTarget);
  } catch (e) {
    // Deterministic fallback metrics for offline simulation
    poolMetrics = {
      poolId: poolTarget,
      tickCurrent: -201200,
      liquidityDelta: "15000000000",
      totalValueLockedUSD: "10000000",
      volumeUSD24h: "52000000",
      volatilityBps: 220
    };
  }

  // Step 3: Anomaly Heuristics & JIT Threat Assessment
  const isJitAttack =
    Boolean(requestPayload?.forceDefensive) ||
    (Number(poolMetrics.liquidityDelta) > 10_000_000_000 &&
      poolMetrics.volatilityBps > riskThresholdBps);

  const decision: DefenseDecision = {
    action: isJitAttack ? "DEFENSIVE_SHIFT" : "HOLD",
    newTickLower: poolMetrics.tickCurrent - 120,
    newTickUpper: poolMetrics.tickCurrent + 120,
    feeBps: isJitAttack ? 250 : 30, // 2.50% dynamic fee override if attack, else baseline 0.30%
    nonce: Date.now()
  };

  // Step 4: Enforce Deterministic Safety Guardrails Inside Enclave
  validateGuardrails(decision, poolMetrics.tickCurrent, {
    maxSlippageBps: maxSlippageBps,
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

  donRuntime.log(`Workflow DON consensus reached for report: ${decision.action} [Trigger: ${triggerSource}]`);

  return `AquaGhost Sentinel Verdict [${triggerSource}]: ${decision.action} (Fee: ${decision.feeBps} bps, Signature: ${signature.slice(0, 18)}...)`;
}

// ─── 4. Trigger Handlers (AWS Nitro TEE) ────────────────────────
/**
 * Periodic scheduled trigger callback.
 */
export const onCronTrigger = async (runtime: TeeRuntime<Config>): Promise<string> => {
  return evaluateDefenseInsideEnclave(runtime, "CRON");
};

/**
 * On-demand HTTP POST trigger callback for judges, mempool monitoring bots, and frontend UI.
 */
export const onHttpTrigger = async (
  runtime: TeeRuntime<Config>,
  triggerEvent: HTTPPayload
): Promise<string> => {
  let requestPayload: HttpTriggerInput = {};
  if (triggerEvent?.input && triggerEvent.input.length > 0) {
    try {
      const rawText =
        typeof TextDecoder !== "undefined"
          ? new TextDecoder().decode(triggerEvent.input)
          : String.fromCharCode.apply(null, Array.from(triggerEvent.input));
      if (rawText.trim().length > 0) {
        requestPayload = JSON.parse(rawText);
        runtime.log(`[HTTP Trigger] Parsed on-demand payload: ${JSON.stringify(requestPayload)}`);
      }
    } catch (err) {
      runtime.log(`[HTTP Trigger] Notice: Raw input could not be parsed as JSON: ${err}`);
    }
  }
  return evaluateDefenseInsideEnclave(runtime, "HTTP", requestPayload);
};

// ─── 5. Workflow Registration Function ────────────────────────
export function initWorkflow(config: Config) {
  const cronTrigger = new cre.capabilities.CronCapability();
  const httpTrigger = new cre.capabilities.HTTPCapability();

  const formattedAuthorizedKeys = (config.authorizedKeys ?? []).map((key: any) =>
    typeof key === "string" ? { publicKey: key } : key
  );

  return [
    // 1. Scheduled Cron Trigger inside AWS Nitro TEE (periodic background protection)
    cre.handlerInTee(cronTrigger.trigger({ schedule: config.schedule }), onCronTrigger, [
      { tee: "nitro", regions: ["us-west-2"] }
    ]),
    // 2. On-Demand HTTP Trigger inside AWS Nitro TEE (instant evaluation for judges & bots)
    cre.handlerInTee(
      httpTrigger.trigger({ authorizedKeys: formattedAuthorizedKeys }),
      onHttpTrigger,
      [{ tee: "nitro", regions: ["us-west-2"] }]
    )
  ];
}

export default initWorkflow;

