# AquaGhost Protocol

**Hardware-Isolated MEV Defense for DeFi Liquidity Providers**

AquaGhost is a confidential sentinel that detects and defends against JIT (Just-In-Time) sniping attacks on concentrated liquidity positions. It executes defensive strategies inside a **Chainlink CRE AWS Nitro Enclave**, signing cryptographic attestations that instruct **1inch Aqua** and **Uniswap v4** to shift liquidity defensively — all without custodial risk.

> Built for [ETHGlobal Online 2026](https://ethglobal.com/events/ethonline2026)

---

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │       Decentralized Data Feeds          │
                    │   (Uniswap v4 Pools / 1inch Aqua App)   │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼ (Live Indexing)
                    ┌─────────────────────────────────────────┐
                    │        The Graph Subgraph MCP           │
                    │   (Tick Liquidity, Volatility, Volume)  │
                    └────────────────────┬────────────────────┘
                                         │
                                         ▼ (Confidential HTTP Stream)
 ┌───────────────────────────────────────────────────────────────────────────┐
 │ Chainlink Runtime Environment (CRE) Workflow                              │
 │                                                                           │
 │ ┌─── AWS Nitro Enclave: cre.handlerInTee() ─────────────────────────────┐ │
 │ │ 1. In-Enclave Secrets: LLM_API_KEY, MAX_SLIPPAGE_BPS, DELTA_TICK     │ │
 │ │ 2. Autonomous Reasoning: In-enclave LLM agent analyzes anomalous flow │ │
 │ │ 3. Deterministic Guardrails: Clamps max shift to prevent rogue state   │ │
 │ │ 4. Output: Signed ECDSA Attestation (v, r, s, action, newStrategy)    │ │
 │ └─────────────────────────────────────┬─────────────────────────────────┘ │
 │                                       │                                   │
 │                                       ▼ runtime.usingTheDons()            │
 └───────────────────────────────────────┬───────────────────────────────────┘
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
     ┌───────────────────────────────┐       ┌───────────────────────────────┐
     │ 1inch Aqua App (AquaGhostApp) │       │ Uniswap v4 Hook               │
     │ Calls dock() & ship() to      │       │ beforeSwap() verifies ECDSA   │
     │ reposition maker inventory    │       │ attestation; locks fee sniping│
     └───────────────────────────────┘       └───────────────────────────────┘
```

---

## How It Works

1. **Market Monitoring:** The CRE workflow polls live pool parameters from **The Graph Subgraph MCP** every 15 seconds.
2. **Confidential Evaluation:** Inside AWS Nitro Enclave (`handlerInTee`), the LLM agent detects anomalous liquidity accumulation targeting pending mempool swaps (a JIT signature).
3. **Guardrail Validation:** The proposed tick relocation is bounded by `MAX_SLIPPAGE_BPS` inside the enclave.
4. **Attestation Delivery:** The enclave signs `(action, newTickLower, newTickUpper, feeBps, nonce)` using its private key and passes it through `runtime.usingTheDons()`.
5. **On-Chain Settlement:**
   - **1inch Aqua:** Calls `executeDefensiveShift()`, invoking `aqua.dock()` to withdraw capital and `aqua.ship()` to position it out of harm's way — maintaining strict self-custody throughout.
   - **Uniswap v4:** Calls `setDefenseMode(true)`, preventing sniper bots from injecting concentrated liquidity right before the swap block settles.

---

## Repository Layout

```
ghost-protocol/
├── contracts/
│   ├── src/
│   │   ├── AquaGhostApp.sol        # 1inch Aqua App (dock & ship defense)
│   │   └── AquaGhostHook.sol       # Uniswap v4 Hook (JIT fee-sniping firewall)
│   ├── lib/
│   │   ├── aqua/                   # 1inch Aqua core interfaces
│   │   └── v4-core/                # Uniswap v4 core & BaseHook
│   └── test/
│       └── AquaGhost.t.sol         # Foundry tests for attestation & execution
├── cre-workflow/
│   ├── config.staging.json         # CRE configuration
│   ├── secrets.yaml                # Vault DON secret aliases
│   └── src/
│       ├── index.ts                # Main CRE workflow (handlerInTee + DON consensus)
│       ├── graphClient.ts          # The Graph Subgraph MCP client
│       └── guardrails.ts           # Deterministic bounding checks
├── scripts/
│   └── simulate_jit_attack.ts      # Simulates predatory sniper to trigger defense
├── FEEDBACK.md                     # Required for Uniswap Foundation Bounty
└── README.md                       # Full documentation and video demo link
```

---

## Sponsor Targets

| Sponsor | Prize | Integration |
|---------|-------|-------------|
| **Chainlink** | $2,500 – Best Confidential Workflow | `handlerInTee` + AWS Nitro + Vault DON secrets |
| **1inch** | $5,000 – Build an Aqua App | `dock()` / `ship()` self-custodial repositioning |
| **The Graph** | $5,000 – Best AI Tooling | Live Subgraph MCP queries for multi-pool liquidity |
| **Uniswap Foundation** | $3,000 – Best Uniswap Stack | Custom v4 hook + FEEDBACK.md |

---

## Getting Started

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/) >= 18
- [Chainlink CRE CLI](https://docs.chain.link/cre)

### Install & Build

```bash
# Contracts
cd contracts
forge install
forge build

# CRE Workflow
cd cre-workflow
npm install
npm run build
```

### Test

```bash
# Run Foundry tests
cd contracts
forge test -vvv

# Simulate JIT attack
npx ts-node scripts/simulate_jit_attack.ts
```

---

## License

MIT
