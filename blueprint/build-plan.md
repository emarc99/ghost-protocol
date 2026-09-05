# Build Plan - AquaGhost Protocol

> Living roadmap tracking progress across the gated AI Blueprint development loop.

## Phase 1: Core Architecture & Scaffolding (Completed)

- [x] 1. **Repository Setup** - Initialize project with README, license, and gitignore
- [x] 2. **Foundry Configuration** - Configure `foundry.toml` with Cancun EVM, transient storage support, and remappings
- [x] 3. **1inch Aqua App Contract** - Implement `AquaGhostApp.sol` with `dock()` and `ship()` defensive repositioning
- [x] 4. **Uniswap v4 Anti-Sniper Hook** - Implement `AquaGhostHook.sol` with `beforeSwap` and `beforeAddLiquidity` callbacks
- [x] 5. **Contract Test Scaffold** - Create `AquaGhost.t.sol` test suite for signature verification and guardrails
- [x] 6. **Dependency Interface Stubs** - Provide `IAqua.sol` and Uniswap v4 interfaces
- [x] 7. **Chainlink CRE Workflow** - Implement `handlerInTee` enclave sentinel, `graphClient.ts`, and `guardrails.ts`
- [x] 8. **CRE Config & Secrets** - Configure `config.staging.json` and `secrets.yaml` schema
- [x] 9. **Attack Simulation Script** - Implement `simulate_jit_attack.ts` showing end-to-end attack neutralization
- [x] 10. **Uniswap Foundation Feedback** - Author comprehensive `FEEDBACK.md` detailing developer experience with v4 hooks

## Phase 2: Workflow Rigor & Sponsor Ledgers (Current Milestone)

- [x] 11. **AI Blueprint Framework Installation** - Scaffold `.blueprint/`, adapters, skills, and gated loop configs
- [x] 12. **Project & Build Plans Configuration** - Define problem, tech stack, data flows, and roadmap
- [ ] 13. **AI Assistance Proof Log (`AI_ASSISTANCE.md`)** - Document the anti-vibe-coding workflow, human-as-gatekeeper decisions, and ETHGlobal AI disclosures
- [ ] 14. **Sponsor GitHub Issues & Feedback Ledgers** - Create actionable upstream issue reports for Chainlink CRE, 1inch Aqua, The Graph, and Uniswap

## Phase 3: Visual Demo & Live Integrations (Upcoming)

- [ ] 15. **Interactive Web Demo Dashboard** - Build rich dark-mode UI with live liquidity depth chart, CRE radar, and attack simulator
- [ ] 16. **Live Subgraph MCP Integration** - Connect live Subgraph Studio endpoint into CRE workflow and frontend
- [ ] 17. **Contract Build & Test Verification** - Compile contracts and run Foundry test suite
- [ ] 18. **Final Submission Package** - Prepare 2-minute demo video script, architecture slides, and ETHGlobal submission entry
