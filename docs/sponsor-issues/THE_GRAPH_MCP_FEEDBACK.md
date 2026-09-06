# The Graph — Upstream Developer Experience Feedback & Subgraph MCP Suggestions

> **Prepared during ETHGlobal Online 2026**  
> **Project:** AquaGhost Protocol  
> **Target Track:** The Graph AI & Subgraph MCP Integration  
> **Status:** Ready to be submitted to The Graph Developer Relations / GitHub Issues

---

## 1. Overview & Appreciation

The Graph's decentralized indexing and Subgraph MCP (Model Context Protocol) enable autonomous AI agents to ingest high-fidelity on-chain metrics without relying on centralized or rate-limited RPC node providers.

In AquaGhost, our AWS Nitro Enclave sentinel polls Uniswap pool states and liquidity distributions directly via The Graph to classify predatory MEV vs. organic swap flow.

---

## 2. Issue 1: [Feature Request] High-Frequency Polling & Streaming Transport for Subgraph MCP

### Context
In automated risk sentinels and MEV monitoring systems, agent workflows poll pool metrics every 10–15 seconds to monitor sudden shifts in tick liquidity.

### Problem & DX Friction
1. Standard GraphQL over HTTP polling incurs TCP handshake latency on repeated short-interval queries.
2. In network spikes or node re-indexing windows, sporadic 502/504 errors can cause an agent cycle to fail unless custom exponential backoff wrappers are written around the MCP client.

### Suggested Improvement
1. **Streaming MCP Transport (WebSockets / SSE):** Allow Subgraph MCP servers to establish persistent subscription streams (e.g. `subscription { pool(id: $id) { tick liquidity } }`) pushing real-time blocks to connected AI agents.
2. **Built-in Resilience Wrapper:** Provide an official resilient MCP query client with configurable retry policies, circuit breakers, and fallback endpoint rotation.

---

## 3. Issue 2: [Tooling] Automated Schema-to-TypeScript Generator for Subgraph MCP Entities

### Problem
When consuming Subgraph data inside TypeScript AI agent workflows, developers currently manually duplicate GraphQL schema types into TypeScript interfaces (e.g. `PoolMetrics`, `TickData`).

### Suggested Improvement
Provide an official CLI command or integration with `@graphprotocol/mcp-client`:
```bash
npx graph-mcp typegen --subgraph <subgraph-id-or-url> --output ./src/types/subgraph.d.ts
```
This guarantees end-to-end type safety between the Subgraph schema and the AI agent's prompt reasoning engine.

---

## 4. Issue 3: [Error Handling] Standardized MCP Error Normalization for Gateway vs. Indexing Errors

### Context
When integrating Subgraph MCP with autonomous DeFi defense systems (such as AquaGhost's JIT sentinel), AI agents must distinguish between:
1. **Network transport failures** (e.g. HTTP 504 / DNS).
2. **Gateway authentication/quota limits** (e.g. missing API key or GRT query balance depletion).
3. **Subgraph indexing lag / entity not found** (e.g. query returned `data: { pool: null }`).

### Problem & DX Friction
In current client implementations, GraphQL errors (`errors: [{ message }]`) are returned inside HTTP 200 responses, while gateway issues return HTTP 4xx/5xx. AI agents parsing MCP tool responses without standardized error codes may interpret a missing pool as "zero liquidity", triggering false-positive defensive emergency modes.

### Suggested Solution
Introduce standardized MCP error structures for The Graph:
```typescript
interface GraphMcpError {
  code: "INDEXING_LAG" | "QUOTA_EXCEEDED" | "INVALID_SUBGRAPH_ID" | "TRANSPORT_ERROR";
  subgraphId: string;
  isRetryable: boolean;
  message: string;
}
```
Exposing this via `@modelcontextprotocol/sdk` ensures agents execute safe fallback routines instead of catastrophic emergency halts.

