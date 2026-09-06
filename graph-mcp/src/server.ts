import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { TheGraphClient } from "./graphClient.ts";

// Initialize The Graph client using environment settings or default gateway
const GRAPH_GATEWAY_URL = process.env.GRAPH_GATEWAY_URL || "https://gateway.thegraph.com/api/public/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
const GRAPH_API_KEY = process.env.GRAPH_API_KEY || "";
const graphClient = new TheGraphClient(GRAPH_GATEWAY_URL, GRAPH_API_KEY);

const server = new Server(
  {
    name: "aquaghost-graph-mcp",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {},
      prompts: {}
    }
  }
);

/**
 * 1. List Available Tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "graph_get_pool_snapshot",
        description: "Fetch real-time pool metrics (current tick, active liquidity, TVL in USD, and 24h volume) from The Graph Network Uniswap Subgraph.",
        inputSchema: {
          type: "object",
          properties: {
            poolId: {
              type: "string",
              description: "Target Uniswap v3/v4 pool contract address (e.g. 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640 for USDC/WETH)"
            }
          },
          required: ["poolId"]
        }
      },
      {
        name: "graph_get_tick_liquidity",
        description: "Fetch concentrated liquidity tick distribution across active price bands from The Graph to evaluate depth concentration.",
        inputSchema: {
          type: "object",
          properties: {
            poolId: {
              type: "string",
              description: "Target pool contract address"
            },
            limit: {
              type: "number",
              description: "Number of active tick bins to return (default: 10)"
            }
          },
          required: ["poolId"]
        }
      },
      {
        name: "graph_detect_jit_threat",
        description: "Analyze incoming mempool liquidity surges against Subgraph pool depth to detect predatory JIT (Just-In-Time) sandwich attacks before block inclusion.",
        inputSchema: {
          type: "object",
          properties: {
            poolId: {
              type: "string",
              description: "Target pool contract address"
            },
            mempoolSurgeDelta: {
              type: "string",
              description: "Incoming liquidity delta from mempool flash-loan transactions (e.g. '15000000000')"
            }
          },
          required: ["poolId"]
        }
      }
    ]
  };
});

/**
 * 2. Handle Tool Invocations
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "graph_get_pool_snapshot": {
        const poolId = String(args?.poolId || "");
        const snapshot = await graphClient.getPoolSnapshot(poolId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(snapshot, null, 2)
            }
          ]
        };
      }

      case "graph_get_tick_liquidity": {
        const poolId = String(args?.poolId || "");
        const limit = Number(args?.limit || 10);
        const ticks = await graphClient.getTickLiquidity(poolId, limit);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(ticks, null, 2)
            }
          ]
        };
      }

      case "graph_detect_jit_threat": {
        const poolId = String(args?.poolId || "");
        const delta = String(args?.mempoolSurgeDelta || "15000000000");
        const analysis = await graphClient.analyzeJitThreat(poolId, delta);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(analysis, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool requested: ${name}`);
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Error executing tool ${name}: ${error.message}`
        }
      ]
    };
  }
});

/**
 * 3. List Available Prompts for AI Reasoning
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "jit-defense-analysis",
        description: "Template prompt for evaluating predatory MEV and recommending autonomous 1inch Aqua docking and Uniswap v4 fee defense.",
        arguments: [
          {
            name: "poolId",
            description: "Target Uniswap pool address",
            required: true
          },
          {
            name: "liquidityDelta",
            description: "Mempool incoming liquidity delta",
            required: true
          }
        ]
      }
    ]
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  if (name !== "jit-defense-analysis") {
    throw new Error(`Unknown prompt: ${name}`);
  }

  const poolId = args?.poolId || "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640";
  const delta = args?.liquidityDelta || "15000000000";

  return {
    description: "Evaluate MEV threat and formulate Chainlink CRE confidential attestation",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `You are the AquaGhost Autonomous DeFi Risk Sentinel operating with The Graph Subgraph MCP and Chainlink CRE AWS Nitro Enclaves.

Target Pool: ${poolId}
Incoming Mempool Surge Delta: ${delta}

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
});

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
