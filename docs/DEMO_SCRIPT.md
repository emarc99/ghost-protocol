# AquaGhost Protocol — 2-Minute Video Demo & Judging Evaluation Script

> **Target Duration:** 2 minutes 00 seconds  
> **Format:** Screen recording with voiceover / picture-in-picture presenter  
> **Target Audience:** ETHGlobal Online 2026 Judges (Chainlink, 1inch, Uniswap Foundation, The Graph)

---

## 🎬 Video Timeline & Narration Breakdown

```
0:00 - 0:20 | The Problem (MEV & JIT Sandwich Attacks)
0:20 - 0:45 | Architecture (Chainlink CRE + 1inch Aqua + Uniswap v4 + The Graph)
0:45 - 1:25 | Live Demo Walkthrough (Attack Simulation, Revert, Enclave Attestation)
1:25 - 1:45 | Deep Dives (AquaSwapVM, FairFlow Telemetry, Graph MCP)
1:45 - 2:00 | AI Blueprint Rigor & Sponsor Ledgers Conclusion
```

---

### Segment 1: The Problem (0:00 – 0:20)
* **Visual:** Display the AquaGhost Banner / Mission Control Terminal. Show concentrated liquidity depth chart with active tick.
* **Speaker Script:**
  > *"Concentrated liquidity providers on AMMs lose hundreds of millions of dollars each year to predatory Just-In-Time (JIT) MEV sandwich attacks. Today's automated liquidity managers force LPs to make an impossible choice: either surrender custody of their tokens to a shared smart contract, or leak private rebalance parameters to the public mempool where MEV bots front-run them.*
  > *Meet **AquaGhost Protocol**: the world's first hardware-isolated autonomous liquidity defense system."*

---

### Segment 2: System Architecture (0:20 – 0:45)
* **Visual:** Transition to Architecture Diagram (or split screen showing CRE workflow and contract diagram).
* **Speaker Script:**
  > *"AquaGhost bridges four core pillars:*
  > 1. *Live pool depth is queried directly from **The Graph Network Gateway** with zero mocks.*
  > 2. *Threat anomaly detection executes confidentially inside **Chainlink CRE** using **AWS Nitro Enclaves** and **Vault DON** encrypted secrets.*
  > 3. *When an attack is detected, the enclave generates a verified cryptographic attestation.*
  > 4. *On-chain, **1inch Aqua** repositions maker capital atomically via non-custodial EIP-712 permits, while our **Uniswap v4 Hook** intercepts the sniper and shifts pool fees dynamically."*

---

### Segment 3: Live Demo Walkthrough (0:45 – 1:25)
* **Visual:** Mission Control Dashboard (`http://localhost:3000`).
  1. Show normal pool status (Green, Calm, 5 bps fee).
  2. Click **`[ Launch Predatory JIT Attack ]`**.
  3. Audio synthesizer triggers red-alert klaxon; screen turns crimson (`DEFENSE_ACTIVE`).
  4. Radar blip flags incoming MEV sandwich sniper.
  5. Terminal log streams:
     - `ENCLAVE_ATTESTATION_GENERATED (Workflow 0056b79a...)`
     - `1INCH_AQUA_DOCK_SHIP: Repositioned maker capital into safe corridor`
     - `UNISWAP_V4_HOOK: SniperLiquidityBlocked() — 0-block JIT injection reverted`
     - `DYNAMIC_FEE_SURGE: Shifted pool fee to 100 bps`
  6. Click **`[ Normalize Pool ]`** to restore calm state.
* **Speaker Script:**
  > *"Let's see it live on our Next.js operator terminal.*
  > *Here in Mission Control, our USDC/WETH pool is currently calm with a baseline 5 bps fee. Now, an MEV bot attempts a predatory 0-block JIT sandwich.*
  > *We trigger the attack. Instantly, our Chainlink CRE Nitro Sentinel identifies the surge, Vault DON guardrails engage, and an attestation is signed inside the enclave.*
  > *On-chain, 1inch Aqua atomically docks maker inventory out of the vulnerable tick, while our Uniswap v4 Hook rejects the sniper's liquidity injection with a custom revert. The attack is completely neutralized with zero LP capital lost."*

---

### Segment 4: Technical Deep-Dives (1:25 – 1:45)
* **Visual:** Quick cuts across the specialized views:
  - `/vault`: Show 1inch Aqua Vault with `permitDelegatedSentinel` toggle and `AquaSwapVM` opcode execution.
  - `/sentinel`: Show Chainlink Nitro Sentinel with deployed Workflow ID `0056b79a...` and on-demand HTTP POST cURL.
  - `/firewall`: Show Uniswap v4 Hook Firewall with FairFlow explainable fee preview (`previewFee`).
* **Speaker Script:**
  > *"Under the hood, we pushed each sponsor SDK to its limits:*
  > *In 1inch Aqua, we implemented **AquaSwapVM** with custom `OP_TEE_GUARD` and `OP_DYNAMIC_FEE` opcodes, using only 2.2 KB of bytecode.*
  > *In Uniswap v4, we integrated **FairFlow explainable telemetry**, enabling aggregators to inspect fee states before submitting trades.*
  > *And for The Graph, we deployed `@aquaghost/graph-mcp`, providing standardized AI agent tooling over live decentralized gateway data."*

---

### Segment 5: Engineering Rigor & Upstream Impact (1:45 – 2:00)
* **Visual:** Show `AI_ASSISTANCE.md` atomic commit table and `docs/sponsor-issues/` directory.
* **Speaker Script:**
  > *"AquaGhost was engineered with zero vibe-coding under the rigorous AI Blueprint framework, featuring 36 passing Foundry tests, 5 live on-chain Anvil test suites, and 13 ready-to-file upstream GitHub issues across Chainlink, 1inch, Uniswap, and The Graph.*
  > *AquaGhost: Hardware-isolated, self-custodial liquidity defense. Thank you!"*

---

## 📋 Judge's Quick Verification Checklist

Judges can verify every claim independently in under 2 minutes:

1. **Foundry Test Suite (36/36 Passing):**
   ```bash
   cd contracts && forge test -vvv
   ```
2. **Live On-Chain Anvil Integration (Real transactions, SwapVM, and Reverts):**
   ```bash
   # Terminal 1:
   anvil --port 8545 --chain-id 31337
   # Terminal 2:
   npm run test:live
   ```
3. **Live The Graph Network Gateway MCP Query (Zero Mocks):**
   ```bash
   npm run test:mcp
   ```
4. **CRE Nitro Enclave Simulation (WASM verified):**
   ```bash
   cd cre-workflow && cre workflow simulate --trigger-index 0
   ```
5. **Next.js 16 Web3 Cyberpunk Observatory Terminal:**
   ```bash
   npm run dev:next
   # Open http://localhost:3000
   ```
6. **Deployed CRE Workflow Confirmation:**
   - Deployed Workflow ID: `0056b79abdf926dbb2a01ba70b8c95eb35696ce16c8346234adaef4834e92621`
   - Org: `emarc_org` | DON Family: `zone-a` | Region: `us-west-2`
