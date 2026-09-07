# AquaGhost Protocol

**Hardware-Isolated Autonomous Liquidity Defense & JIT Protection Protocol**

AquaGhost protects concentrated liquidity providers (LPs) and market makers from predatory Just-In-Time (JIT) MEV sandwich attacks. It combines **The Graph Network Gateway**, **Chainlink CRE (Confidential Runtime Environment)**, **1inch Aqua's** shared-liquidity architecture, and **Uniswap v4** lifecycle hooks into a self-custodial, real-time defense firewall.

> Built for [ETHGlobal Online 2026](https://ethglobal.com)

---

## 1. System Architecture

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │               Live Blockchain Intelligence                  │
                    │      (The Graph Network Decentralized Gateway)              │
                    └──────────────────────────────┬──────────────────────────────┘
                                                   │
                                                   ▼ Live Subgraph Entity Stream
                    ┌─────────────────────────────────────────────────────────────┐
                    │        @aquaghost/graph-mcp (Model Context Protocol)        │
                    │   • graph_get_pool_snapshot     • graph_get_tick_liquidity  │
                    │   • graph_detect_jit_threat     • stdio JSON-RPC 2.0        │
                    └──────────────────────────────┬──────────────────────────────┘
                                                   │
                                                   ▼ Confidential In-Enclave Query
 ┌───────────────────────────────────────────────────────────────────────────────────────────────┐
 │ Chainlink Runtime Environment (CRE) Workflow                                                  │ 
 │                                                                                               │
 │ ┌─── AWS Nitro Enclave: cre.handlerInTee() ─────────────────────────────────────────────────┐ │
 │ │ 1. In-Enclave Secrets (Vault DON)                                     │                   │
 │ │ 2. Dual Triggers (Cron + HTTP trigger)                                  │                   │
 │ │ 3. Anomaly Detection Engine                                               │                   │
 │ │ 4. Deterministic Guardrails                                            │                   │
 │ │ 5. Attestation Signature                                                 │                   │
 │ └───────────────────────────────────────────┬───────────────────────────────────────────────┘ │
 │                                             │                                                 │
 │                                             ▼ runtime.usingTheDons()                          │
 └─────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                               │
                                               ▼ Verified Cryptographic Attestation
               ┌───────────────────────────────┴───────────────────────────────┐
               ▼                                                               ▼
┌──────────────────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│ 1inch Aqua App (AquaGhostApp.sol)            │ │ Uniswap v4 Hook (AquaGhostHook.sol)          │
│ • EIP-712 permitDelegatedSentinel delegation │ │ • beforeAddLiquidity: Blocks sniper JIT      │
│ • Atomic aqua.dock() & aqua.ship() execution │ │ • beforeSwap: Applies dynamic fee override   │
│ • Self-custodial maker inventory protection  │ │ • previewFee: FairFlow explainable telemetry │
│ • AquaSwapVM: OP_TEE_GUARD & OP_DYNAMIC_FEE  │ │ • DefenseAssessment: Telemetry event logging │
└──────────────────────────────────────────────┘ └──────────────────────────────────────────────┘
```

---

## 2. Core Protocol Innovations

### 🛡️ 1inch Aqua Autonomous Repositioning (`AquaGhostApp.sol`)
* **Shared Liquidity Defense:** Leverages Aqua’s canonical shared-balance architecture. A maker's capital can sit safely across multiple strategies (AMM, limit orders, flash-loan vaults).
* **EIP-712 Non-Custodial Permits:** LPs delegate bounded repositioning rights (`permitDelegatedSentinel`) without ever surrendering private keys or custody to an automated bot.
* **Atomic `dock()` & `ship()`:** Upon receiving an enclave attestation, the contract atomically withdraws maker capital from the vulnerable price bin and re-ships it into a safe corridor.
* **Custom SwapVM Security Opcodes (`AquaSwapVM.sol`):** Introduces `OP_TEE_GUARD` (`0x7E`) to enforce in-bytecode TEE signature verification and `OP_DYNAMIC_FEE` (`0x7D`) for programmable fee adjustments.

### ⚡ Uniswap v4 Anti-Sniper Firewall Hook (`AquaGhostHook.sol`)
* **Predatory JIT Interception:** In `beforeAddLiquidity`, the hook intercepts 0-block sniper liquidity injections targeted at pending trades while keeping normal LP provisioning unaffected.
* **Dynamic Fee Defense:** In `beforeSwap`, dynamically shifts pool fees to absorb volatility and render sandwich attacks economically unprofitable for searchers.
* **FairFlow Explainable Telemetry:** Implements `previewFee(PoolKey)` returning structured `FeeBreakdown` (`baseFee`, `defenseFee`, `effectiveFee`, `isDefenseActive`, `mode`) so routers and aggregators know whether defense mode is active (`"DEFENSE_ACTIVE"` vs `"CALM"`) before dispatching transactions.
* **Audit & Indexer Telemetry:** Emits structured `DefenseAssessment` events containing the nonce, block number, timestamp, and defense engagement count for Subgraphs and AI monitors.

### 🔒 Chainlink CRE Confidential Sentinel (`cre-workflow/`)
* **Hardware Isolation (AWS Nitro TEE):** Evaluates anomaly detection logic inside an isolated enclave, ensuring searchers cannot front-run or reverse-engineer defense thresholds.
* **Vault DON Secrets:** Securely injects keys, and defense parameters directly into memory within the enclave.
* **Dual Trigger Architecture:** Runs autonomous 1-minute background surveillance and provides on-demand defense for mempool monitors.
* **Consensus Hand-off:** Crosses the confidentiality boundary to deliver verified ECDSA attestations to consumer smart contracts.

### 🌐 The Graph Subgraph MCP Server (`@aquaghost/graph-mcp`)
* **Model Context Protocol (MCP) Standard:** Exposes standardized AI tools over `stdio` transport for Claude Desktop, Cursor, and autonomous agent frameworks.
* **Live Decentralized Data (No Mocks):** Directly queries The Graph Network Gateway for live Ethereum Mainnet Uniswap v3/v4 pool depth, TVL, and active tick ladders.
* **Automated Reasoning Tools:**
  * `graph_get_pool_snapshot`: Real-time pool metrics.
  * `graph_get_tick_liquidity`: Concentrated liquidity distribution across price bins.
  * `graph_detect_jit_threat`: Evaluates incoming mempool surges against pool depth to classify threat level and output defensive corridor recommendations.

---

## 3. Verified Verification & Testing Suite

AquaGhost features an end-to-end verification suite spanning smart contracts, confidential workflows, live on-chain environments, and decentralized data feeds:

| Test Suite | Command | Coverage & Scope | Status |
| :--- | :--- | :--- | :---: |
| **Foundry Unit & Fuzz** | `cd contracts && forge test` | 34 passing tests across `AquaGhostHook`, `AquaGhostApp`, and `AquaSwapVM`, including 4 property-based fuzz test suites (256 runs each). | ✅ **34/34 PASS** |
| **Live On-Chain Anvil** | `npm run test:live` | Real atomic swaps, real ECDSA enclave attestations, live sniper revert verification, and real `dock()` / `ship()` calls on running Anvil EVM node. | ✅ **4/4 PASS** |
| **The Graph Subgraph MCP** | `npm run test:mcp` | Queries live Ethereum Mainnet USDC/WETH pool state ($414M+ TVL) from The Graph Network Gateway across all 3 MCP tools. | ✅ **PASS (Live Gateway)** |
| **CRE Nitro Simulation** | `cd cre-workflow && cre workflow simulate --trigger-index 0` | Simulates in-enclave Cron execution and on-demand HTTP POST payload inside AWS Nitro TEE constraints. | ✅ **PASS (WASM Verified)** |
| **MEV Attack Simulation** | `npm run simulate` | Models 1inch Aqua multi-strategy shared balance depletion scenario and verifies automated defense repositioning. | ✅ **PASS** |

---

## 4. Repository Layout

```
ghost-protocol/
├── contracts/                        # Foundry Solidity Smart Contracts
│   ├── src/
│   │   ├── AquaGhostApp.sol          # 1inch Aqua App (dock/ship & EIP-712 delegated permit)
│   │   ├── AquaGhostHook.sol         # Uniswap v4 Hook (JIT firewall, dynamic fee, previewFee)
│   │   └── swapvm/
│   │       └── AquaSwapVM.sol        # Custom SwapVM (OP_TEE_GUARD 0x7E & OP_DYNAMIC_FEE 0x7D)
│   └── test/
│       ├── AquaGhost.t.sol           # 29 Hook & App unit/fuzz tests
│       └── AquaSwapVM.t.sol          # 5 SwapVM opcode execution tests
├── cre-workflow/                     # Chainlink CRE Confidential Workflow
│   ├── workflow.yaml                 # Workflow manifest (private deployment registry)
│   ├── config.staging.json           # Staging runtime parameters
│   ├── secrets.yaml                  # Vault DON secret mappings
│   └── src/
│       ├── workflow.ts               # handlerInTee dual Cron & HTTP execution logic
│       ├── guardrails.ts             # Deterministic slippage and tick corridor bounds
│       └── types.ts                  # Attestation and payload interfaces
├── graph-mcp/                        # The Graph Subgraph Model Context Protocol (MCP) Server
│   ├── src/
│   │   ├── server.ts                 # Stdio MCP server (Claude/Cursor integration)
│   │   ├── graphClient.ts            # Live Graph Network Gateway client
│   │   └── test_client.ts            # Standalone verification runner
│   └── README.md                     # MCP installation and AI client setup guide
├── frontend/                         # Dashboard
├── scripts/
│   ├── simulate_jit_attack.ts        # Multi-strategy shared balance attack simulation
│   └── test_live_anvil_integration.ts # Automated on-chain end-to-end test runner
```

---

## 5. Getting Started

### Prerequisites
* [Foundry](https://book.getfoundry.sh/getting-started/installation) (`forge`, `anvil`)
* [Node.js](https://nodejs.org/) (>= 18)
* [Chainlink CRE CLI](https://docs.chain.link/cre) (`cre`)

### 1. Build Contracts & Run Foundry Tests
```bash
cd contracts
forge install
forge test -vvv
```

### 2. Verify Live Decentralized Data from The Graph
```bash
# In the project root:
npm install
npm run test:mcp
```

### 3. Run Live On-Chain Anvil Integration Test
```bash
# In terminal 1 (start local Anvil testnet node):
anvil --port 8545 --chain-id 31337

# In terminal 2 (deploy contracts and execute real on-chain defense):
npm run test:live
```

### 4. Launch Operator Frontend Dashboard
```bash
npm run dev
# Open http://localhost:3000 in your browser
```


---

## 6. License

Distributed under the MIT License.
