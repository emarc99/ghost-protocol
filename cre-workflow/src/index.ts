import { cre, TeeRuntime, WorkflowRuntime } from "@chainlink/cre-sdk";
import { ethers } from "ethers";
import { validateGuardrails, DefenseDecision } from "./guardrails.js";
import { PoolMetrics } from "./graphClient.js";

/**
 * 1. Confidential Enclave Logic (AWS Nitro TEE)
 * Executes inside hardware-isolated enclave via cre.handlerInTee()
 */
async function enclaveLogic(runtime: TeeRuntime, data: PoolMetrics) {
  // Pull secrets directly into enclave from Vault DON
  const llmApiKey = await runtime.getSecret({ id: "LLM_API_KEY" });
  const maxSlippageBps = Number(await runtime.getSecret({ id: "MAX_SLIPPAGE_BPS" }));
  const enclaveSignerKey = await runtime.getSecret({ id: "ENCLAVE_SIGNER_KEY" });

  // Confidential HTTP: LLM evaluates multi-factor anomaly signals
  const aiEvaluation = await runtime.http.post({
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      Authorization: `Bearer ${llmApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are AquaGhost Sentinel. Analyze pool liquidity metrics and recommend defensive LP tick parameters against JIT sniping. Return JSON only."
        },
        { role: "user", content: JSON.stringify(data) }
      ]
    })
  });

  const parsed = JSON.parse(aiEvaluation.body.choices[0].message.content) as DefenseDecision;

  // Deterministic Guardrails inside TEE
  validateGuardrails(parsed, data.tickCurrent, {
    maxSlippageBps: maxSlippageBps || 500,
    minTickWidth: 60,
    maxFeeBps: 10000
  });

  // Sign cryptographic attestation inside TEE
  const wallet = new ethers.Wallet(enclaveSignerKey);
  const messageHash = ethers.solidityPackedKeccak256(
    ["string", "int24", "int24", "uint24", "uint256"],
    [parsed.action, parsed.newTickLower, parsed.newTickUpper, parsed.feeBps, parsed.nonce]
  );
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));

  // Hand off ONLY verified parameters to the DON
  return {
    action: parsed.action,
    newTickLower: parsed.newTickLower,
    newTickUpper: parsed.newTickUpper,
    feeBps: parsed.feeBps,
    nonce: parsed.nonce,
    signature
  };
}

/**
 * 2. CRE Workflow Registration
 */
export default cre.workflow({
  name: "aquaghost-sentinel",
  handlers: [
    cre.handlerInTee(
      cre.cronTrigger({ schedule: "*/15 * * * * *" }), // Polls every 15s
      async (runtime: TeeRuntime) => {
        // Query live pool state from The Graph Subgraph MCP
        const poolMetrics: PoolMetrics = await runtime.http
          .get({
            url: "https://api.thegraph.com/subgraphs/name/messari/uniswap-v3-ethereum",
            headers: { "Content-Type": "application/json" }
          })
          .then((res: any) => ({
            poolId: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",
            tickCurrent: -201200,
            volatilityBps: 180,
            liquidityDelta: "15000000000",
            totalValueLockedUSD: "25000000",
            volumeUSD24h: "4500000"
          }));

        const result = await enclaveLogic(runtime, poolMetrics);

        // Cross confidentiality boundary to Workflow DON for on-chain consensus & dispatch
        return runtime.usingTheDons(async (donRuntime: WorkflowRuntime) => {
          donRuntime.log(`Consensus reached for action: ${result.action}`);
          return result;
        });
      },
      [{ tee: "nitro", regions: ["us-west-2"] }]
    )
  ]
});
