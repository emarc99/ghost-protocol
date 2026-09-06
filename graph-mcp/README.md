# The Graph Subgraph Model Context Protocol (MCP) Server

> **AquaGhost Protocol • ETHGlobal Online 2026 Submission**  
> **Track:** Best AI Tooling or AI Use Case with The Graph (Subgraph MCP)  
> **Package:** `@aquaghost/graph-mcp`

---

## 1. Overview

**AquaGhost Subgraph MCP** is a standardized **Model Context Protocol (MCP)** server that equips autonomous AI risk sentinels with real-time, on-chain market intelligence from **The Graph Network**.

Instead of writing bespoke, hard-coded GraphQL queries, AI agents (Claude, Cursor, Antigravity, AutoGPT) connect to this server over standard JSON-RPC 2.0 `stdio` transport. The agent autonomously queries pool depth, inspects concentrated liquidity tick ladders, and calculates Just-In-Time (JIT) sandwich attack threats.

```
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Autonomous AI Agent (Claude / Cursor / Antigravity)      │
│    Reasoning engine evaluating mempool risk                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ Model Context Protocol (stdio)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 🌐 AquaGhost Subgraph MCP Server (graph-mcp/src/server.ts)  │
│    Tools:                                                   │
│    • graph_get_pool_snapshot                                │
│    • graph_get_tick_liquidity                               │
│    • graph_detect_jit_threat                                │
│    Prompt Template: jit-defense-analysis                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ GraphQL Queries over HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 📡 The Graph Network Gateway (Decentralized Subgraphs)      │
│    Uniswap v3 / v4 Subgraph Entities (TVL, ticks, volume)   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Tools Exposed by the MCP Server

### 1. `graph_get_pool_snapshot`
Fetches real-time market metrics for a target liquidity pool.
- **Input:** `{ "poolId": "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640" }`
- **Output:** Current tick, active liquidity, TVL (USD), 24h volume, fee tier, and token metadata.

### 2. `graph_get_tick_liquidity`
Fetches concentrated liquidity distribution across active price bins from The Graph.
- **Input:** `{ "poolId": "0x...", "limit": 10 }`
- **Output:** Array of tick bins with `tickIdx`, `liquidityGross`, `liquidityNet`, and price conversions.

### 3. `graph_detect_jit_threat`
Compares incoming mempool flash-loan liquidity surges against active Subgraph depth to detect predatory sandwich attacks.
- **Input:** `{ "poolId": "0x...", "mempoolSurgeDelta": "15000000000" }`
- **Output:**
  - `threatDetected`: Boolean
  - `threatLevel`: `LOW` | `ELEVATED` | `CRITICAL`
  - `riskScore`: 0 to 100
  - `recommendation`: `HOLD` | `DEFENSIVE_SHIFT` | `MAX_FEE_DEFENSE`
  - `suggestedFeeBps`: Calculated dynamic fee (e.g. 250 BPS)
  - `suggestedTickRange`: `[lower, upper]` safe corridor bounds

---

## 3. Running & Testing

### Run Standalone Tool Verification
```bash
npm run test:mcp
# or from this folder:
npm test
```

### Start the MCP Server (stdio transport for AI Clients)
```bash
npm run mcp:graph
# or from this folder:
npm start
```

---

## 4. Connecting to AI Assistants

### Claude Desktop / Cursor (`mcpServers` configuration)
Add the following to your `claude_desktop_config.json` or Cursor MCP settings:

```json
{
  "mcpServers": {
    "aquaghost-graph": {
      "command": "node",
      "args": [
        "--experimental-strip-types",
        "c:/Users/LENOVO/Documents/devposts/ghost/graph-mcp/src/server.ts"
      ],
      "env": {
        "GRAPH_GATEWAY_URL": "https://gateway.thegraph.com/api/public/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
      }
    }
  }
}
```

---

## 5. Upstream Feedback

During development of this MCP server, we submitted two comprehensive upstream developer experience improvements in:
[`docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md`](../docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md)
1. **Streaming MCP Transport (WebSockets / SSE) for high-frequency tick polling.**
2. **Automated Schema-to-TypeScript Generator for Subgraph MCP entities.**
