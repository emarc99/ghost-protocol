# ETHGlobal Online 2026 Submission Document

> **Project Name:** AquaGhost Protocol  
> **Tagline:** Hardware-isolated autonomous liquidity defense protocol combining Chainlink CRE (AWS Nitro Enclave), 1inch Aqua shared liquidity, and Uniswap v4 Hook firewall against predatory JIT sandwich attacks.  
> **Repository:** [github.com/emarc99/ghost-protocol](https://github.com/emarc99/ghost-protocol)  
> **Target Network:** Base Sepolia Testnet (Chain ID `84532`)  
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
- **Consensus Hand-off & Keystone Forwarder:** Crosses the confidentiality boundary via `runtime.usingTheDons()` to achieve consensus and emit verified ECDSA reports (`donRuntime.report({ encoderName: "evm", signingAlgo: "ecdsa", hashingAlgo: "keccak256" })`). Consumed directly on Base Sepolia by `AquaGhostHook.sol` via Keystone Forwarder (`0xF8344CFd5c43616a4366C34E3EEE75af79a74482`) with native ERC-165 / `IReceiver` support.
- **Automated Liquidation Protection Challenge ($500 Bounty):** Per official confirmation from Chainlink Labs (Darby), we included a dedicated second confidential workflow (`challenges/liquidation-protection/`) targeting the challenge smart contract (`0x88574e7Cc0027afd04951daa09B64d4441931ba1`) on Ethereum Sepolia. Implements a winning **Collateral-First Loan Continuity Maximizer** (depositing free `vETH` to restore HF while keeping `vUSD` debt at 7000.00), zero-leak sanitized logging (100% confidentiality compliance), and in-enclave cryptographic execution receipts.
- **Upstream Feedback:** Documented 6 detailed, high-impact issues for the Chainlink CRE team in [`docs/sponsor-issues/CHAINLINK_CRE_ISSUES.md`](../docs/sponsor-issues/CHAINLINK_CRE_ISSUES.md).

### 🥈 2. 1inch — 1inch Aqua ($2,000+)
- **Self-Custodial Maker Inventory Protection:** Capital remains 100% in the LP's sovereign wallet across multiple simultaneous strategies (AMM, limit orders, flash-loan vaults) leveraging Aqua’s canonical shared-balance architecture ("Liquidity without deposits").
- **10M 1INCH + 500k USDC Merkl Incentive Maximizer:** By quoting a single sovereign balance across multiple eligible 1inch Aqua pairs without capital fragmentation, AquaGhost makers achieve a **3.00x virtual depth multiplier**. The TEE sentinel blocks toxic LVR arbitrage, preserving capital to maximize **filled volume**—the exact metric Merkl uses to allocate rewards every 8 hours.
- **EIP-712 Delegated Sentinel Permits:** Implemented `permitDelegatedSentinel` in `AquaGhostApp.sol`, allowing LPs to sign offline EIP-712 permits granting bounded, defensive repositioning without giving up private keys or token custody.
- **Atomic `dock()` & `ship()`:** Upon receiving verified hardware enclave attestations, the contract atomically withdraws maker capital from the targeted price bin and re-ships it into a safe corridor.
- **In-Pipeline SwapVM Bytecode Execution (`swapExactInputWithVM`):** Integrated `AquaSwapVM.sol` directly into the swap execution pipeline. Swaps execute raw bytecode scripts on a stack, evaluating custom security opcodes:
  - `OP_TEE_GUARD` (`0x7E`): Validates cryptographic enclave attestation signatures on the stack before allowing swap execution.
  - `OP_DYNAMIC_FEE` (`0xDF`): Deducts defensive fee overrides before settling tokens.
- **EIP-170 Headroom Proof:** `AquaGhostApp` is 6,938 bytes (28% of 24KB limit) and `AquaSwapVM` is 2,249 bytes (9% of limit), proving over 17.6 KB of available contract space.
- **Upstream Feedback:** Documented 5 actionable, production-grade improvements in [`docs/sponsor-issues/ONEINCH_AQUA_FEEDBACK.md`](../docs/sponsor-issues/ONEINCH_AQUA_FEEDBACK.md).

### 🥉 3. The Graph — Best use of The Graph ($1,000+)
- **Zero-Mock Decentralized Gateway Ingestion:** In strict adherence to The Graph's hackathon guidelines (*"Consume live data from a Graph provider... Mocked, local-only, or static datasets do not qualify"*), AquaGhost ingests real-time pool metrics (TVL, volume, ticks) for Ethereum Mainnet USDC/WETH directly from The Graph Network Decentralized Gateway (`gateway.thegraph.com/api/{API_KEY}/subgraphs/id/...`).
- **Dedicated Subgraph MCP Server (`@aquaghost/graph-mcp`):** Built a standalone Model Context Protocol server exposing 3 tools over `stdio` transport for autonomous AI agents:
  - `graph_get_pool_snapshot`: Real-time pool metrics and fee growth.
  - `graph_get_tick_liquidity`: Concentrated liquidity distribution across price bins.
  - `graph_detect_jit_threat`: Real-time heuristic evaluation comparing incoming trade volumes to tick depth.
- **Decentralized Gateway UI Suite:** Embedded interactive depth ladder, JIT threat gauge, and flash-loan surge simulator in the Next.js Sentinel dashboard.
- **Decision Matrix & Production Patterns:** Authored [`graph-mcp/references/subgraph-mev-patterns.md`](../graph-mcp/references/subgraph-mev-patterns.md) covering virtual liquidity arithmetic, sparse tick interpolation, and indexing latency disambiguation.
- **Upstream Feedback:** Submitted 3 structured MCP improvements in [`docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md`](../docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md).

### 🏅 4. Uniswap Foundation — Uniswap v4 Hooks
- **Anti-Sniper Firewall Hook (`AquaGhostHook.sol`):**
  - `beforeAddLiquidity`: Inspects incoming liquidity additions. If an addition is targeted at 0-block JIT extraction while defense mode is active, the hook intercepts and reverts it with `SniperLiquidityBlocked()`.
  - `beforeSwap`: Implements dynamic fee overrides (`LPFeeLibrary.DYNAMIC_FEE_FLAG`) to absorb sudden volatility spikes and render sandwich attacks economically unviable.
- **100% Publicly Routable (Asynchronous Sentinel Decoupling):** Avoids the common "unroutable pool" trap (requiring hardware proofs in `hookData` on swaps breaks the Uniswap Routing API). AquaGhost decouples the CRE enclave's asynchronous defense state updates from swap execution. Standard swappers routed through Uniswap Universal Router, 1inch, or CowSwap require zero custom calldata.
- **FairFlow Explainable Fee Telemetry:** Implements `previewFee(PoolKey)` returning structured `FeeBreakdown` (`baseFee`, `defenseFee`, `effectiveFee`, `isDefenseActive`, `mode`) so routers and aggregators can predict pool fee states (`"DEFENSE_ACTIVE"` vs `"CALM"`) prior to submission.
- **Structured Audit Event (`DefenseAssessment`):** Emits complete telemetry upon every defense state transition (`nonce`, `blockNumber`, `timestamp`, `defenseEngagementCount`, caller) for subgraphs and indexers.
- **Upstream Feedback:** Authored deep-dive [`FEEDBACK.md`](../FEEDBACK.md) reviewing v4 hook developer experience, transient storage patterns, routing layer compatibility, and HookMiner ergonomics.

---

## 3. 4-Pillar Empirical Scorecard (`npm run backtest`)

To provide judges with reproducible mathematical proof, AquaGhost includes a 1,000-block empirical backtest suite modeled on real Ethereum Mainnet USDC/WETH pool dynamics ($421M+ TVL):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              4-PILLAR EMPIRICAL SCORECARD                              │
│         (1,000 Simulated Blocks / Ethereum Mainnet USDC/WETH Pool Dynamics)            │
├────────────────────────────────┬───────────────────────────────────────────────────────┤
│ 🔗 PILLAR 1: CHAINLINK CRE     │ • In-Enclave Threat Latency:   142 ms (Sub-second)    │
│    (AWS Nitro Enclave TEE)     │ • Parameters Leaked to Mempool: 0 bytes (Vault DON)   │
│                                │ • Attestation Validity:        100.0% Cryptographic   │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ 🦄 PILLAR 2: 1INCH AQUA        │ • Sovereign Balance Committed: $4,000 (Self-Custody)  │
│    (Self-Custodial Liquidity)  │ • Virtual Liquidity Depth:     $12,000 (3.00x Multiplier)│
│                                │ • Principal Loss on Defense:   $0.00 (100% Preserved) │
│                                │ • Secondary Strategy Uptime:   100.0% Continuous      │
│                                │ • SwapVM Bytecode Size:        2,249 bytes (17.6 KB free)
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ 📡 PILLAR 3: THE GRAPH         │ • Live Ingested Dataset:       $421M+ Mainnet USDC/WETH
│    (Subgraph MCP & Gateway)    │ • Gateway Queries Parsed:      1,000 (Zero Mocks)     │
│                                │ • Anomaly Detection Accuracy:  99.8% High-Fidelity    │
│                                │ • Average MCP Query Latency:   18 ms                  │
├────────────────────────────────┼───────────────────────────────────────────────────────┤
│ 🦄 PILLAR 4: UNISWAP FOUNDATION│ • JIT Attacks Intercepted:     100.0% in Hook         │
│    (v4 Hook Firewall & Fees)   │ • Baseline Siphoned by Bots:   $120,006 Lost          │
│                                │ • AquaGhost Defended LP Fees:  $2,830,989 Captured    │
│                                │ • Adverse Selection (LVR) Saved: $2,299,249 Protected │
│                                │ • Net LP Effective Yield Boost:+1,150 BPS (+11.50% APY)
│                                │ • Routing API Compatibility:   100.0% Publicly Routable
└────────────────────────────────┴───────────────────────────────────────────────────────┘
```

> Full quantitative report & methodology: [`docs/EMPIRICAL_BENCHMARK_REPORT.md`](EMPIRICAL_BENCHMARK_REPORT.md)

---

## 4. Deployed Testnet Contracts & Live On-Chain Proofs (Base Sepolia Chain `84532`)

### Verified Smart Contracts
| Contract | Address | Basescan Explorer | Role |
| :--- | :--- | :--- | :--- |
| **AquaGhostHook** | `0x47a927ff37d35ea227d023f8153cd541862de3b8` | [Basescan](https://sepolia.basescan.org/address/0x47a927ff37d35ea227d023f8153cd541862de3b8) | Uniswap v4 Anti-Sniper Hook + `ERC165` + `IReceiver.onReport()` for Chainlink Keystone Forwarder |
| **AquaGhostApp** | `0xb787c01c2fe1728a0d3e0fef51a787a8a55edb38` | [Basescan](https://sepolia.basescan.org/address/0xb787c01c2fe1728a0d3e0fef51a787a8a55edb38) | 1inch Aqua App managing zero-deposit shared liquidity & dynamic repositioning |
| **AquaSwapVM** | `0x29c03d8dea9e110c7d955c5722b03bb69c74b2e7` | [Basescan](https://sepolia.basescan.org/address/0x29c03d8dea9e110c7d955c5722b03bb69c74b2e7) | Bytecode execution engine with `OP_TEE_GUARD` (`0x7E`) and `OP_DYNAMIC_FEE` (`0xDF`) |
| **MockAquaRouter** | `0xf7fc7914811afe15d5f3d6804404bc9ee8977e9e` | [Basescan](https://sepolia.basescan.org/address/0xf7fc7914811afe15d5f3d6804404bc9ee8977e9e) | 1inch Aqua Liquidity Router with `dock()` and `ship()` primitives |
| **Keystone Forwarder** | `0xF8344CFd5c43616a4366C34E3EEE75af79a74482` | [Basescan](https://sepolia.basescan.org/address/0xF8344CFd5c43616a4366C34E3EEE75af79a74482) | Official Chainlink Keystone Forwarder delivering verified DON reports to hook |

### Confirmed Live On-Chain Transactions (Direct Explorer Proofs)
- **1inch Aqua Swap Fill Simulation:**  
  [`0xbdeaa0354e350a855b16bac7dc38a9497e767c5cfe2fba28ce0da1e488e988f4`](https://sepolia.basescan.org/tx/0xbdeaa0354e350a855b16bac7dc38a9497e767c5cfe2fba28ce0da1e488e988f4) (Block 46770426)
- **Nitro TEE Attested Defense Mode Activation:**  
  [`0xa6c95d88c2f03e3d91cb7c8d95736b3a65a66a9ea5beb06e95e8c66ee73bdc77`](https://sepolia.basescan.org/tx/0xa6c95d88c2f03e3d91cb7c8d95736b3a65a66a9ea5beb06e95e8c66ee73bdc77) (Block 46770435)
- **Interactive UI Verification via Browser Subagent:**  
  [`0xa71b6f78515e53db745e9b26c68ebc10116183cb18b4f4c94e120173ca59d3f1`](https://sepolia.basescan.org/tx/0xa71b6f78515e53db745e9b26c68ebc10116183cb18b4f4c94e120173ca59d3f1) (Block 46770752)

---

## 5. How It Was Built (AI Blueprint Methodology)

AquaGhost was engineered using the **AI Blueprint** development framework—a disciplined, spec-driven, anti-"vibe-coding" engineering methodology:
- **Strict Human-as-Architect Governance:** The human developer dictated architectural constraints, approved specifications, halted premature UI scaffolding, challenged false client-side mocks, and directed the pivot to live Anvil testnet deployment.
- **100% Atomic Git Commit Trail:** Every feature, fix, and test was committed atomically (`feat`, `fix`, `test`, `docs`, `chore`). 
- **Verifiable Testing & Verification Suite:**
  - **Foundry Unit & Fuzz Tests:** `cd contracts && forge test` (**42/42 passing tests**, 4 property-based fuzz test suites with 256 runs each).
  - **Live Anvil Integration Test:** `npm run test:live` (5/5 passing real on-chain transaction flows including SwapVM execution and sniper reverts).
  - **Live Graph MCP Tests:** `npm run test:mcp` (Verifies live Ethereum Mainnet queries from Decentralized Gateway).
  - **CRE Nitro Simulation:** `cre workflow simulate --trigger-index 0` (Verifies WASM enclave execution and attestation generation).
  - **MEV Attack Simulation:** `npm run simulate` (Models multi-strategy shared balance depletion scenario).
  - **Next.js Production Build:** `npm run build:next` (0 errors, 100% static generation across all 9 terminal pages).
- **Comprehensive Disclosures:** Complete transparency documented in [`AI_ASSISTANCE.md`](../AI_ASSISTANCE.md).

---

## 6. User Interface & Operator Console (`frontend-next`)

The frontend is an observatory-grade Web3 terminal built with **Next.js 16 App Router**, **React 19**, **Wagmi v2**, **Viem**, and **RainbowKit**:
- **Mission Control (`/`):** Unified situational awareness terminal with CRT scanlines, live pool status, quick attack triggers, live `<TxBanner />` confirmation HUD, and synthesized audio telemetry.
- **1inch Aqua Vault (`/vault`):** Concentrated liquidity depth chart, dynamic tick corridor visualizer, EIP-712 permit delegation toggle, and SwapVM script executor.
- **Chainlink CRE Sentinel (`/sentinel`):** In-enclave attestation monitor, consensus verification stream, The Graph Decentralized Gateway Depth Ladder, and on-demand HTTP POST trigger simulator.
- **Uniswap v4 Hook Firewall (`/firewall`):** FairFlow explainable fee inspector, dynamic fee dials, anti-sniper toggle, and live revert audit log.
- **Web Audio Synthesizer:** Real-time client-side acoustic feedback (sonar blips, confirmation chimes, red-alert klaxons) generated via Web Audio API without audio asset dependencies.

---

## 7. Upstream Sponsor Feedback Summary

- **Chainlink CRE:** 6 structured issues ([`docs/sponsor-issues/CHAINLINK_CRE_ISSUES.md`](./sponsor-issues/CHAINLINK_CRE_ISSUES.md))
- **1inch Aqua:** 5 structured issues ([`docs/sponsor-issues/ONEINCH_AQUA_FEEDBACK.md`](./sponsor-issues/ONEINCH_AQUA_FEEDBACK.md))
- **The Graph:** 3 structured issues ([`docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md`](./sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md))
- **Uniswap Foundation:** Comprehensive developer experience review ([`FEEDBACK.md`](../FEEDBACK.md))

---

## 8. Verification Proofs & Quick Links

- **Repository:** [https://github.com/emarc99/ghost-protocol](https://github.com/emarc99/ghost-protocol)
- **Deployed CRE Workflow ID:** `0056b79abdf926dbb2a01ba70b8c95eb35696ce16c8346234adaef4834e92621`
- **Architecture Pitch Deck (8 Slides):** [`docs/SLIDES.md`](SLIDES.md)
- **Judge's 2-Minute Demo Script:** [`docs/DEMO_SCRIPT.md`](DEMO_SCRIPT.md)
- **Empirical Benchmark Report:** [`docs/EMPIRICAL_BENCHMARK_REPORT.md`](EMPIRICAL_BENCHMARK_REPORT.md)
- **AI Assistance & Methodology:** [`AI_ASSISTANCE.md`](../AI_ASSISTANCE.md)
