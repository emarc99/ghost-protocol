# AquaGhost Protocol - Project Overview

> Hardware-isolated sentinel defending decentralized liquidity providers against predatory MEV and JIT fee-sniping attacks.

## Problem

Concentrated liquidity providers on AMMs (Uniswap v3/v4) lose over $400M annually to MEV extractors via Just-In-Time (JIT) fee sniping and Loss-Versus-Rebalancing (LVR). Existing automated liquidity managers either force LPs to sacrifice custody into pooled smart contracts or leak stop-loss and rebalancing triggers into public mempools where MEV bots front-run them. AquaGhost resolves this by combining confidential off-chain reasoning inside AWS Nitro Enclaves with self-custodial on-chain execution.

## Users

1. **DeFi Liquidity Providers (LPs):** Institutional and retail makers who want protected, automated yield without giving up wallet self-custody.
2. **DeFi Protocols & AMMs:** Decentralized exchanges seeking sticky passive liquidity and lower toxic orderflow.
3. **ETHGlobal Online 2026 Judges:** Evaluators from Chainlink, 1inch, Uniswap Foundation, and The Graph assessing technical rigor, official SDK alignment, and real-time execution.

## Features

The MVP features in build order across our gated development lifecycle:

1. **Repository & Architecture Scaffolding** - Core repo setup, README architecture, and gitignore.
2. **Foundry Smart Contract Pipeline** - Foundry configuration with Cancun EVM, transient storage (`TSTORE`/`TLOAD`), and remappings.
3. **1inch Aqua Self-Custodial App** - `AquaGhostApp.sol` contract invoking `dock()` and `ship()` for defensive inventory repositioning.
4. **Uniswap v4 Anti-Sniper Hook (Headline Feature)** - `AquaGhostHook.sol` implementing `beforeSwap` (dynamic fees) and `beforeAddLiquidity` (reverting JIT snipers).
5. **Contract Test Scaffold** - `AquaGhost.t.sol` testing signature verification and parameter guardrails.
6. **Dependency Interface Stubs** - Clean stubs for `IAqua.sol`, `IPoolManager`, and `BaseHook`.
7. **Chainlink CRE Enclave Sentinel** - `cre.handlerInTee()` workflow pulling Vault DON secrets and evaluating live threats inside AWS Nitro TEE.
8. **CRE Config & Enclave Secrets** - `config.staging.json` and `secrets.yaml` defining confidential parameters.
9. **JIT Attack Simulation Pipeline** - `simulate_jit_attack.ts` proving end-to-end attack neutralization and capital preservation.
10. **Uniswap Foundation DX Feedback** - Mandatory `FEEDBACK.md` report on v4 hooks, `HookMiner`, and `IPoolManager`.
11. **AI Blueprint Framework Installation** - Integration of `.blueprint/`, skills, and anti-vibe-coding lifecycle.
12. **Gated Plans & Roadmap** - Formalized `project-plan.md` and `build-plan.md`.
13. **AI Assistance Proof Log** - `AI_ASSISTANCE.md` detailing human-as-architect gates and commit history for ETHGlobal.
14. **Sponsor Feedback & GitHub Issue Ledgers** - Upstream issue reports for Chainlink, 1inch, The Graph, and Uniswap in `docs/sponsor-issues/`.
15. **Interactive Web Demo Dashboard** - High-fidelity visual UI featuring live liquidity depth chart, CRE radar, and interactive attack simulator.
16. **Live Subgraph MCP Integration** - Real-time connection to Subgraph Studio indexing pool metrics.
17. **Contract Build & Test Verification** - Foundry test suite execution and bytecode validation.
18. **Final Submission Package** - 2-minute demo video walkthrough, architecture slides, and devpost release.

## Data model

### On-Chain State (`AquaGhostApp` & `AquaGhostHook`)
- `enclaveSigner` (`address`): Authorized ECDSA public key of the hardware enclave.
- `defenseMode` (`bool`): Active flag intercepting incoming sniper liquidity transactions.
- `dynamicFeeBps` (`uint24`): Dynamic swap fee percentage override for volatile regimes.
- `nonces` (`mapping(uint256 => bool)`): Replay protection for executed attestation payloads.

### Enclave Secrets (Chainlink Vault DON)
- `LLM_API_KEY` (`string`): Private key for in-enclave threat classification inference.
- `ENCLAVE_SIGNER_KEY` (`bytes32`): Private key for signing cryptographic attestations.
- `MAX_SLIPPAGE_BPS` (`uint24`): Deterministic math ceiling bounding tick relocation.

### Off-Chain Ingested Data (The Graph Subgraph MCP)
- `poolId` (`string`): Target Uniswap pool contract address.
- `tickCurrent` (`int24`): Current active price tick.
- `volatilityBps` (`uint24`): 24h rolling volatility measure.
- `liquidityDelta` (`string`): Rate of liquidity injection in the current block.

## Tech stack

- **Smart Contracts:** Solidity 0.8.26, Foundry, Uniswap v4 (`BaseHook`, `IPoolManager`), 1inch Aqua, OpenZeppelin.
- **Confidential Computing:** Chainlink CRE SDK (`@chainlink/cre-sdk`), AWS Nitro Enclaves (`handlerInTee`), Chainlink Vault DON (`usingTheDons`).
- **Data Indexing:** The Graph (Subgraph Studio & Subgraph MCP).
- **Frontend / Demo:** React / Next.js, Vanilla CSS cybernetic theme, Ethers.js.
- **Workflow & AI Rigor:** AI Blueprint framework, Antigravity IDE, strict atomic git commits.

## Monetization

- **Protected Yield Fee:** 5–10% performance fee on preserved LP fees that otherwise would have been extracted by JIT snipers.
- **Institutional Sentinel Tier:** Enterprise retainer for high-volume market makers on 1inch Aqua and Uniswap v4.

## UI/UX

- Cybernetic/institutional dark-mode terminal layout.
- Three real-time panels:
  - `Panel A`: Live Concentrated Liquidity Depth Chart with active price tick.
  - `Panel B`: Chainlink CRE Nitro Sentinel Radar (Vault DON status, attestation feed).
  - `Panel C`: Attack Simulator (`[ Launch Predatory JIT Attack ]`, red alarm flash, 1inch Aqua dock/ship animation, Uniswap v4 Hook revert banner).

## Deployment

- **Contracts:** Ethereum Sepolia / Unichain testnet.
- **CRE Workflow:** Chainlink CRE staging environment via `config.staging.json`.
- **Frontend:** Vercel / GitHub Pages.
