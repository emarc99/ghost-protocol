import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TheGraphClient } from "./graphClient.ts";

// Initialize The Graph client using environment settings or default gateway
const GRAPH_GATEWAY_URL = process.env.GRAPH_GATEWAY_URL || "https://gateway.thegraph.com/api/public/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
const GRAPH_API_KEY = process.env.GRAPH_API_KEY || "";
const graphClient = new TheGraphClient(GRAPH_GATEWAY_URL, GRAPH_API_KEY);

const server = new McpServer({
  name: "aquaghost-graph-mcp",
  version: "1.0.0"
});

/**
 * Tool 1: graph_get_pool_snapshot
 */
server.registerTool(
  "graph_get_pool_snapshot",
  {
    description: "Fetch real-time pool metrics (current tick, active liquidity, TVL in USD, and 24h volume) from The Graph Network Uniswap Subgraph.",
    inputSchema: {
      poolId: z.string().describe("Target Uniswap v3/v4 pool contract address (e.g. 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640 for USDC/WETH)")
    }
  },
  async ({ poolId }) => {
    try {
      const snapshot = await graphClient.getPoolSnapshot(poolId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(snapshot, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Error executing tool graph_get_pool_snapshot: ${error.message}`
          }
        ]
      };
    }
  }
);

/**
 * Tool 2: graph_get_tick_liquidity
 */
server.registerTool(
  "graph_get_tick_liquidity",
  {
    description: "Fetch concentrated liquidity tick distribution across active price bands from The Graph to evaluate depth concentration.",
    inputSchema: {
      poolId: z.string().describe("Target pool contract address"),
      limit: z.number().optional().default(10).describe("Number of active tick bins to return (default: 10)")
    }
  },
  async ({ poolId, limit }) => {
    try {
      const ticks = await graphClient.getTickLiquidity(poolId, limit);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(ticks, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Error executing tool graph_get_tick_liquidity: ${error.message}`
          }
        ]
      };
    }
  }
);

/**
 * Tool 3: graph_detect_jit_threat
 */
server.registerTool(
  "graph_detect_jit_threat",
  {
    description: "Analyze incoming mempool liquidity surges against Subgraph pool depth to detect predatory JIT (Just-In-Time) sandwich attacks before block inclusion.",
    inputSchema: {
      poolId: z.string().describe("Target pool contract address"),
      mempoolSurgeDelta: z.string().optional().default("15000000000").describe("Incoming liquidity delta from mempool flash-loan transactions (e.g. '15000000000')")
    }
  },
  async ({ poolId, mempoolSurgeDelta }) => {
    try {
      const analysis = await graphClient.analyzeJitThreat(poolId, mempoolSurgeDelta);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(analysis, null, 2)
          }
        ]
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Error executing tool graph_detect_jit_threat: ${error.message}`
          }
        ]
      };
    }
  }
);

/**
 * Prompt: jit-defense-analysis
 */
server.registerPrompt(
  "jit-defense-analysis",
  {
    description: "Template prompt for evaluating predatory MEV and recommending autonomous 1inch Aqua docking and Uniswap v4 fee defense.",
    argsSchema: {
      poolId: z.string().describe("Target Uniswap pool address"),
      liquidityDelta: z.string().describe("Mempool incoming liquidity delta")
    }
  },
  async ({ poolId, liquidityDelta }) => {
    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are the AquaGhost Autonomous DeFi Risk Sentinel operating with The Graph Subgraph MCP and Chainlink CRE AWS Nitro Enclaves.

Target Pool: ${poolId || "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"}
Incoming Mempool Surge Delta: ${liquidityDelta || "15000000000"}

Instructions:
1. Call 'graph_get_pool_snapshot' to get current tick and pool depth.
2. Call 'graph_detect_jit_threat' to calculate sandwich risk.
3. If threat detected, formulate:
   - Action: 'DEFENSIVE_SHIFT'
   - New tick corridor within guardrail bounds (width >= 60 ticks)
   - Dynamic fee override (up to 250 BPS)
4. Deliver signed verdict to Chainlink CRE enclave.`
          }
        }
      ]
    };
  }
);

// Start the stdio MCP server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("The Graph Subgraph MCP Server for AquaGhost running on stdio transport.");
}

main().catch((err) => {
  console.error("Fatal error starting Graph MCP server:", err);
  process.exit(1);
});
