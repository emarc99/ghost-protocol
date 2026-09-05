# Project Plan - AquaGhost Protocol

> Hardware-isolated sentinel defending decentralized liquidity providers against predatory MEV and JIT fee-sniping attacks.

## 1. Problem - What problem are we solving?

Concentrated liquidity providers on AMMs (Uniswap v3/v4, etc.) lose over $400M annually to MEV extractors through Just-In-Time (JIT) fee sniping and Loss-Versus-Rebalancing (LVR). 
Traditional defense mechanisms suffer from two fatal flaws:
1. **Mempool Transparency Risk:** Publishing automated stop-losses, dynamic tick bounds, or rebalancing algorithms directly to public mempools or smart contracts exposes them to predatory searchers who front-run or sandwich the rebalance transactions.
2. **Custodial Risk:** Yield vaults and automated liquidity managers require LPs to deposit tokens into custodial smart contracts, exposing them to smart contract exploit risk.

AquaGhost solves both:
- **Confidential Reasoning:** Runs an autonomous intelligence sentinel inside an AWS Nitro Trusted Execution Environment (TEE) via Chainlink CRE (`handlerInTee`). Strategy decisions and volatility assessments remain cryptographically private.
- **Self-Custodial Execution:** Repositions inventory via 1inch Aqua (`dock()` & `ship()`), meaning capital never leaves the maker's wallet until fills occur.
- **Synchronous On-Chain Interception:** Uses a Uniswap v4 Hook (`beforeSwap`, `beforeAddLiquidity`) to enforce dynamic fees and block snipers in real time.

## 2. Users - Who is this for?

1. **DeFi Liquidity Providers (LPs):** Institutional and retail makers looking for protected, passive concentrated yield without giving up self-custody.
2. **DeFi Protocols & AMMs:** Automated market makers wanting cleaner orderflow, reduced toxic MEV, and stickier passive liquidity.
3. **Hackathon Judges (ETHGlobal Online 2026):** Evaluators from Chainlink, 1inch, Uniswap Foundation, and The Graph looking for rigorous architectural execution.

## 3. Features - What does the MVP need?

- **Confidential Sentinel:** Chainlink CRE workflow executing in AWS Nitro TEE with Vault DON secrets.
- **Real-Time Data Feeds:** The Graph Subgraph client streaming tick distribution, 24h volume, and volatility metrics.
- **In-Enclave Deterministic Guardrails:** Math-based sanity checks clamping slippage, tick widths, and fee caps before attestation signing.
- **1inch Aqua App:** Smart contract invoking `dock()` and `ship()` upon verified enclave attestation.
- **Uniswap v4 Hook:** Anti-sniper hook intercepting sandwich liquidity additions and setting dynamic fees.
- **Interactive Visual Demo Dashboard:** A high-fidelity Web UI showing the live pool, attack simulation, enclave attestation, and saved maker capital.

## 4. Data - What are we storing?

- **On-chain State:**
  - Nonces and replay protection counters.
  - Authorized Enclave Signer ECDSA public key.
  - Active defense mode flag and dynamic fee override bps.
- **Enclave Secrets (Chainlink Vault DON):**
  - `LLM_API_KEY`: API key for risk model inference.
  - `ENCLAVE_SIGNER_KEY`: ECDSA private key for signing attestations.
  - `MAX_SLIPPAGE_BPS`: Bounded risk tolerance.
- **Off-chain Ingested Data (The Graph):**
  - Subgraph metrics: pool ticks, volumeUSD24h, totalValueLockedUSD, volatility index.

## 5. Tech - What stack are we using?

- **Smart Contracts:** Solidity 0.8.26, Foundry, Uniswap v4 Core (`BaseHook`, `IPoolManager`), 1inch Aqua interfaces.
- **Confidential Compute:** Chainlink Runtime Environment (CRE SDK), AWS Nitro Enclaves (`handlerInTee`), Chainlink Vault DON (`usingTheDons`).
- **Data Indexing:** The Graph (Subgraph Studio / Subgraph MCP client).
- **Web Demo Dashboard:** Next.js / Vite, React, Vanilla CSS with dark cybernetic/terminal aesthetics.
- **Testing & Tooling:** Foundry (`forge test`), TypeScript / ts-node, Ethers.js.

## 6. Monetize - How will this make money?

- **Performance Fee on Protected Alpha:** 5-10% fee on preserved fee revenue that would have otherwise been sniped by MEV bots.
- **Institutional Sentinel Subscriptions:** Monthly fee for automated high-volume market makers on 1inch Aqua and Uniswap v4.

## 7. UI/UX - How should this look and feel?

- Sleek, dark-mode, cyberpunk/institutional security console with green/cyan accents and amber threat alerts.
- Three real-time panels:
  1. Live Pool Liquidity Depth Chart (visual tick bins).
  2. CRE Hardware Enclave Status (radar scan, Vault DON status, cryptographic attestation feed).
  3. Interactive MEV Simulator (button to trigger attack, visual red warning, defensive dock/ship shift animation, sniper blocked counter).

## 8. Deployment - Where and how will this ship?

- **Contracts:** Deployed to Ethereum Sepolia / Unichain testnet.
- **CRE Workflow:** Registered in Chainlink CRE staging environment via `config.staging.json`.
- **Frontend Dashboard:** Deployed to Vercel / GitHub Pages.
