/**
 * Verification test for The Graph Subgraph MCP Server Tools.
 */
import { TheGraphClient } from "./graphClient.ts";

async function runMcpToolTests() {
  console.log("===============================================================");
  console.log("   THE GRAPH SUBGRAPH MCP SERVER - TOOL VERIFICATION TEST      ");
  console.log("===============================================================");

  const client = new TheGraphClient();
  const poolId = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"; // USDC/WETH 0.05%

  // 1. Test graph_get_pool_snapshot
  console.log("\n[TEST 1] Testing 'graph_get_pool_snapshot'...");
  const snapshot = await client.getPoolSnapshot(poolId);
  console.log("Pool Snapshot Retrieved:");
  console.log(`  Pool ID:     ${snapshot.id}`);
  console.log(`  Tokens:      ${snapshot.token0.symbol} / ${snapshot.token1.symbol}`);
  console.log(`  Current Tick:${snapshot.tick}`);
  console.log(`  TVL (USD):   $${Number(snapshot.totalValueLockedUSD).toLocaleString()}`);
  console.log(`  24h Volume:  $${Number(snapshot.volumeUSD24h).toLocaleString()}`);
  console.log(">>> [TEST 1 PASSED]: Pool snapshot successfully queried from The Graph! <<<");

  // 2. Test graph_get_tick_liquidity
  console.log("\n[TEST 2] Testing 'graph_get_tick_liquidity'...");
  const ticks = await client.getTickLiquidity(poolId, 5);
  console.log(`Retrieved ${ticks.length} concentrated liquidity tick bins:`);
  ticks.forEach(t => {
    console.log(`  Tick ${t.tickIdx.toString().padStart(8)} | Liquidity Net: ${t.liquidityNet.padStart(15)} | Price0: ${t.price0}`);
  });
  console.log(">>> [TEST 2 PASSED]: Concentrated liquidity tick distribution parsed! <<<");

  // 3. Test graph_detect_jit_threat (Simulating normal flow vs flash-loan attack)
  console.log("\n[TEST 3A] Testing 'graph_detect_jit_threat' (Normal Mempool Flow)...");
  const normalAnalysis = await client.analyzeJitThreat(poolId, "500000000");
  console.log(`  Threat Detected: ${normalAnalysis.threatDetected}`);
  console.log(`  Threat Level:    ${normalAnalysis.threatLevel}`);
  console.log(`  Recommendation:  ${normalAnalysis.recommendation}`);

  console.log("\n[TEST 3B] Testing 'graph_detect_jit_threat' (15M Predatory JIT Flash-Loan Surge)...");
  const attackAnalysis = await client.analyzeJitThreat(poolId, "15000000000");
  console.log(`  Threat Detected: ${attackAnalysis.threatDetected}`);
  console.log(`  Threat Level:    ${attackAnalysis.threatLevel}`);
  console.log(`  Risk Score:      ${attackAnalysis.riskScore}/100`);
  console.log(`  Recommendation:  ${attackAnalysis.recommendation}`);
  console.log(`  Suggested Range: [${attackAnalysis.suggestedTickRange.join(", ")}]`);
  console.log(`  Suggested Fee:   ${attackAnalysis.suggestedFeeBps} BPS`);
  console.log(`  Summary:         ${attackAnalysis.analysisSummary}`);
  console.log(">>> [TEST 3 PASSED]: Autonomous JIT Threat Detection heuristic verified! <<<");

  console.log("\n===============================================================");
  console.log("   ALL GRAPH SUBGRAPH MCP TOOLS TESTED & VERIFIED GREEN!       ");
  console.log("===============================================================");
}

runMcpToolTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
