# 1inch Aqua Protocol — Upstream Developer Experience Feedback & Suggestions

> **Prepared during ETHGlobal Online 2026**  
> **Project:** AquaGhost Protocol  
> **Target Package:** 1inch Aqua Core & App Architecture  
> **Status:** Ready to be submitted to 1inch Developer Portal / GitHub Issues

---

## 1. Overview & Appreciation

Aqua's self-custodial liquidity paradigm is a game-changer for automated market making. Keeping capital in the maker's wallet until fills occur completely eliminates the systemic risk of LP smart contract hacks.

In AquaGhost, we leverage `aqua.dock()` and `aqua.ship()` to pull and reposition liquidity out of predatory JIT sniper ranges.

---

## 2. Issue 1: [SDK Request] Official TypeScript SDK for Aqua Strategy & App Interactions

### Problem & DX Friction
When building off-chain sentinels or automation bots that interact with Aqua:
1. Developers currently have to write raw ABI encodings or custom type interfaces for calling `dock()` and `ship()` parameters.
2. Order structures, salt generations, and strategy hashing formats lack an official, lightweight NPM package (`@1inch/aqua-sdk`).

### Suggested Improvement
Release a dedicated TypeScript SDK:
```typescript
import { AquaClient, StrategyBuilder } from "@1inch/aqua-sdk";

const aqua = new AquaClient({ provider, signer });
const strategy = new StrategyBuilder()
  .setTokenPair(USDC, WETH)
  .setTickRange(tickLower, tickUpper)
  .setFeeBps(30)
  .build();

await aqua.ship(strategy);
```

---

## 3. Issue 2: [Architecture] Standardized Delegated Sentinel Role for Aqua Apps

### Problem
When an Aqua App wants to automate defensive repositioning on behalf of multiple maker wallets upon verified TEE triggers:
- If each maker has to sign a transaction every time market volatility spikes, the automation fails to beat fast-moving MEV.
- If makers give broad approvals to an App contract, security-conscious institutional makers hesitate.

### Suggested Improvement
Document and standardize an **EIP-712 Delegated Sentinel Authorization** standard for Aqua:
- The maker signs a one-time bounded permit allowing a verified Sentinel Contract (`AquaGhostApp`) to call `dock()` and `ship()` only within pre-approved tick bands and minimum price slippage constraints.
- This creates institutional-grade automation while preserving 100% self-custody.
