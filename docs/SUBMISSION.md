# ETHGlobal Online 2026 Submission Document

> **Project Name:** AquaGhost Protocol  
> **Tagline:** Hardware-isolated autonomous liquidity defense protocol combining Chainlink CRE (AWS Nitro Enclave), 1inch Aqua shared liquidity, and Uniswap v4 Hook firewall against predatory JIT sandwich attacks.  
> **Repository:** [github.com/emarc99/ghost-protocol](https://github.com/emarc99/ghost-protocol)  
> **License:** MIT  

---

## 1. Short Description (Elevator Pitch)

Concentrated liquidity providers (LPs) on modern AMMs lose over $400M annually to predatory Just-In-Time (JIT) MEV sandwich attacks. Existing automated liquidity managers either force LPs to sacrifice wallet custody to pooled smart contracts or leak defense thresholds into public mempools where MEV bots front-run them.

**AquaGhost** eliminates this dilemma by combining **Chainlink CRE (Confidential Runtime Environment)** inside **AWS Nitro Enclaves**, **1inch Aqua's** shared-liquidity architecture, **Uniswap v4's** lifecycle hooks, and **The Graph Network's** live decentralized intelligence into a self-custodial, real-time defense firewall with zero parameters leaked on-chain.

---

## 2. Targeted Sponsor Tracks & Specific Prize Justifications

### 🥇 1. Chainlink — Best Confidential Workflow ($2,000)
- **Deployed CRE Workflow ID:** `0056b79abdf926dbb2a01ba70b8c95eb35696ce16c8346234adaef4834e92621` (Private Registry, AWS Nitro TEE, zone-a).
- **Official Confidential Bootcamp Architecture:** Directly follows the official Chainlink CRE Confidential Bootcamp specifications (`handlerInTee` with `[{ tee: "nitro", regions: ["us-west-2"] }]`).
- **Vault DON Secret Protection:** Anomaly detection thresholds (`RISK_THRESHOLD_BPS`, `MAX_SLIPPAGE_BPS`), Subgraph API keys, and ECDSA enclave signing keys are encrypted in the Chainlink Vault DON and injected strictly into in-enclave memory via `runtime.getSecret()`. Searchers and node operators cannot observe or front-run the defense parameters.
- **Confidential HTTP:** Employs `@chainlink/cre-sdk`'s `cre.capabilities.HTTPClient` accepting `TeeRuntime` to dispatch confidential outbound queries to The Graph Network Gateway directly from inside the enclave.
- **Dual Trigger Execution:** Supports both autonomous 1-minute scheduled background surveillance (`CronCapability`) and instantaneous on-demand evaluations (`HTTPCapability`) for mempool monitors.
- **Consensus Hand-off:** Crosses the confidentiality boundary via `runtime.usingTheDons()` to achieve consensus and emit verified ECDSA reports (`donRuntime.report({ encoderName: "evm", signingAlgo: "ecdsa", hashingAlgo: "keccak256" })`) to consumer smart contracts.
- **Upstream Feedback:** Documented 6 detailed, high-impact issues for the Chainlink CRE team in [`docs/sponsor-issues/CHAINLINK_CRE_ISSUES.md`](../docs/sponsor-issues/CHAINLINK_CRE_ISSUES.md).

### 🥈 2. 1inch — 1inch Aqua ($2,000+)
- **Self-Custodial Maker Inventory Protection:** Capital remains in the LP's sovereign control across multiple strategies (AMM, limit orders, flash-loan vaults) leveraging Aqua’s canonical shared-balance architecture.
- **EIP-712 Delegated Sentinel Permits:** Implemented `permitDelegatedSentinel` in `AquaGhostApp.sol`, allowing LPs to sign offline EIP-712 permits granting bounded, defensive repositioning without giving up private keys or token custody.
- **Atomic `dock()` & `ship()`:** Upon receiving verified hardware enclave attestations, the contract atomically withdraws maker capital from the targeted price bin and re-ships it into a safe corridor.
- **In-Pipeline SwapVM Bytecode Execution (`swapExactInputWithVM`):** Integrated `AquaSwapVM.sol` directly into the swap execution pipeline. Swaps execute raw bytecode scripts on a stack, evaluating custom security opcodes:
  - `OP_TEE_GUARD` (`0x7E`): Validates cryptographic enclave attestation signatures on the stack before allowing swap execution.
  - `OP_DYNAMIC_FEE` (`0xDF`): Deducts defensive fee overrides before settling tokens.
- **EIP-170 Headroom Proof:** `AquaGhostApp` is 6,938 bytes (28% of 24KB limit) and `AquaSwapVM` is 2,249 bytes (9% of limit), proving over 17.6 KB of available contract space.
- **Upstream Feedback:** Documented 4 actionable improvements in [`docs/sponsor-issues/ONEINCH_AQUA_FEEDBACK.md`](../docs/sponsor-issues/ONEINCH_AQUA_FEEDBACK.md).

### 🥉 3. The Graph — Best use of The Graph ($1,000+)
- **Zero-Mock Decentralized Gateway Ingestion:** In strict adherence to The Graph's hackathon guidelines (*"Consume live data from a Graph provider... Mocked, local-only, or static datasets do not qualify"*), AquaGhost ingests real-time pool metrics (TVL, volume, ticks) for Ethereum Mainnet USDC/WETH directly from The Graph Network Decentralized Gateway (`gateway.thegraph.com/api/{API_KEY}/subgraphs/id/...`).
- **Dedicated Subgraph MCP Server (`@aquaghost/graph-mcp`):** Built a standalone Model Context Protocol server exposing 3 tools over `stdio` transport for autonomous AI agents:
  - `graph_get_pool_snapshot`: Real-time pool metrics and fee growth.
  - `graph_get_tick_liquidity`: Concentrated liquidity distribution across price bins.
  - `graph_detect_jit_threat`: Real-time heuristic evaluation comparing incoming trade volumes to tick depth.
- **Decision Matrix & Production Patterns:** Authored [`graph-mcp/references/subgraph-mev-patterns.md`](../graph-mcp/references/subgraph-mev-patterns.md) covering virtual liquidity arithmetic, sparse tick interpolation, and indexing latency disambiguation.
- **Upstream Feedback:** Submitted 3 structured MCP improvements in [`docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md`](../docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md).

### 🏅 4. Uniswap Foundation — Uniswap v4 Hooks
- **Anti-Sniper Firewall Hook (`AquaGhostHook.sol`):**
  - `beforeAddLiquidity`: Inspects incoming liquidity additions. If an addition is targeted at 0-block JIT extraction while defense mode is active, the hook intercepts and reverts it with `SniperLiquidityBlocked()`.
  - `beforeSwap`: Implements dynamic fee overrides (`LPFeeLibrary.DYNAMIC_FEE_FLAG`) to absorb sudden volatility spikes and render sandwich attacks economically unviable.
- **FairFlow Explainable Fee Telemetry:** Implements `previewFee(PoolKey)` returning structured `FeeBreakdown` (`baseFee`, `defenseFee`, `effectiveFee`, `isDefenseActive`, `mode`) so routers and aggregators can predict pool fee states (`"DEFENSE_ACTIVE"` vs `"CALM"`) prior to submission.
- **Structured Audit Event (`DefenseAssessment`):** Emits complete telemetry upon every defense state transition (`nonce`, `blockNumber`, `timestamp`, `defenseEngagementCount`, caller) for subgraphs and indexers.
- **Upstream Feedback:** Authored deep-dive [`FEEDBACK.md`](../FEEDBACK.md) reviewing v4 hook developer experience, transient storage patterns, and HookMiner ergonomics.

---

## 3. Technical Architecture & End-to-End Workflow

```
1. PRE-TRADE INTELLIGENCE
   The Graph Network Gateway ──> @aquaghost/graph-mcp ──> Live Pool Depth & Mempool Signals

2. CONFIDENTIAL IN-ENCLAVE REASONING
   Chainlink CRE Workflow (AWS Nitro TEE) ──> Fetch Vault DON Secrets
                                          ──> Evaluate JIT Threat Matrix
                                          ──> Apply Mathematical Guardrails
                                          ──> Sign In-Enclave Attestation (ECDSA)
                                          ──> runtime.usingTheDons() consensus

3. ON-CHAIN DEFENSIVE EXECUTION
   Enclave Attestation ──> 1inch Aqua (AquaGhostApp.sol):
                           • EIP-712 Delegated Permit Verification
                           • Atomic dock() & ship() inventory repositioning
                           • AquaSwapVM bytecode execution with OP_TEE_GUARD & OP_DYNAMIC_FEE
                       ──> Uniswap v4 Hook (AquaGhostHook.sol):
                           • beforeAddLiquidity blocks 0-block predatory JIT snipers
                           • beforeSwap activates dynamic fee surge
                           • previewFee broadcasts FairFlow explainable telemetry
```

---

## 4. How It Was Built (AI Blueprint Methodology)

AquaGhost was engineered using the **AI Blueprint** development framework—a disciplined, spec-driven, anti-"vibe-coding" engineering methodology:
- **Strict Human-as-Architect Governance:** The human developer dictated architectural constraints, approved specifications, halted premature UI scaffolding, challenged false client-side mocks, and directed the pivot to live Anvil testnet deployment.
- **100% Atomic Git Commit Trail:** Every feature, fix, and test was committed atomically (`feat`, `fix`, `test`, `docs`, `chore`). 
- **Verifiable Testing & Verification Suite:**
  - **Foundry Unit & Fuzz Tests:** `cd contracts && forge test` (36/36 passing tests, 4 property-based fuzz test suites with 256 runs each).
  - **Live Anvil Integration Test:** `npm run test:live` (5/5 passing real on-chain transaction flows including SwapVM execution and sniper reverts).
  - **Live Graph MCP Tests:** `npm run test:mcp` (Verifies live Ethereum Mainnet queries from Decentralized Gateway).
  - **CRE Nitro Simulation:** `cre workflow simulate --trigger-index 0` (Verifies WASM enclave execution and attestation generation).
  - **MEV Attack Simulation:** `npm run simulate` (Models multi-strategy shared balance depletion scenario).
  - **Next.js Production Build:** `npm run build:next` (0 errors, 100% static generation across all terminal pages).
- **Comprehensive Disclosures:** Complete transparency documented in [`AI_ASSISTANCE.md`](../AI_ASSISTANCE.md).

---

## 5. User Interface & Operator Console

The frontend is an observatory-grade Web3 terminal built with **Next.js 16 App Router**, **React 19**, **Wagmi v2**, **Viem**, and **RainbowKit**:
- **Mission Control (`/`):** Unified situational awareness terminal with CRT scanlines, live pool status, quick attack triggers, and synthesized audio telemetry.
- **1inch Aqua Vault (`/vault`):** Concentrated liquidity depth chart, dynamic tick corridor visualizer, EIP-712 permit delegation toggle, and SwapVM script executor.
- **Chainlink CRE Sentinel (`/sentinel`):** In-enclave attestation monitor, consensus verification stream, and on-demand HTTP POST trigger simulator.
- **Uniswap v4 Hook Firewall (`/firewall`):** FairFlow explainable fee inspector, dynamic fee dials, anti-sniper toggle, and live revert audit log.
- **Web Audio Synthesizer:** Real-time client-side acoustic feedback (sonar blips, confirmation chimes, red-alert klaxons) generated via Web Audio API without audio asset dependencies.

---

## 6. Upstream Sponsor Feedback Summary

- **Chainlink CRE:** 6 structured issues (`docs/sponsor-issues/CHAINLINK_CRE_ISSUES.md`)
- **1inch Aqua:** 4 structured issues (`docs/sponsor-issues/ONEINCH_AQUA_FEEDBACK.md`)
- **The Graph:** 3 structured issues (`docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md`)
- **Uniswap Foundation:** Comprehensive developer experience review (`FEEDBACK.md`)

---

## 7. Verification Proofs & Quick Links

- **Repository:** [https://github.com/emarc99/ghost-protocol](https://github.com/emarc99/ghost-protocol)
- **Deployed CRE Workflow ID:** `0056b79abdf926dbb2a01ba70b8c95eb35696ce16c8346234adaef4834e92621`
- **AI Assistance & Methodology:** [`AI_ASSISTANCE.md`](../AI_ASSISTANCE.md)
- **Judge's Demo Script:** [`docs/DEMO_SCRIPT.md`](DEMO_SCRIPT.md)
