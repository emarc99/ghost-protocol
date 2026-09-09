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

---

## 4. Issue 3: [Tooling Request] Shared Balance Depletion Simulator for Multi-Strategy LPs

### Context
In Tanner Moore's ETHOnline 2026 workshop (*"Reimagining the AMM with 1inch Aqua"*), a key highlight of Aqua is **reusing the same wallet tokens across multiple simultaneous strategies** (e.g., committing $1,000 ETH to ETH/USDC, ETH/AAVE, and an Aqua Flash Loan app simultaneously).

### Problem & DX Friction
When an LP commits the same sovereign balance to multiple strategies:
1. If two concurrent transactions attempt to fill against the same wallet inventory in the same block, the second transaction reverts due to depleted balance.
2. Indexers attempt to mitigate this via balance caching, but during high-volatility spikes or MEV arbitrage bursts, builders lack a local simulation harness to test how their Aqua Apps handle partial fills, race conditions, and re-quote latencies.

### Suggested Improvement
Introduce an official `@1inch/aqua-sim` testing utility that models:
* Concurrent multi-pair routing against a shared LP wallet balance.
* Revert vs. re-quote fallback behaviors when virtual liquidity exceeds physical liquidity.

---

## 5. Issue 4: [SwapVM Architecture] Modular Custom Opcode Registry to Avoid EIP-170 Contract Size Limits

### Context
SwapVM is a major advancement, allowing makers to compile bytecode strategies using opcodes for price curves, taker restrictions, fee structures, and external data extructions. In his workshop, Tanner noted:
> *"You can create your own opcodes for this hackathon, but you would need to edit our SwapVM contract and then redeploy it... and the SwapVM contract itself is approaching the max size of a contract allowed on Ethereum [24KB EIP-170]. So you would need to remove some of the opcodes you aren't using to make room."*

### Problem & DX Friction
For developers wanting to build specialized security opcodes (such as AquaGhost's `OP_TEE_ATTEST_VERIFY` or `OP_TAKER_FIREWALL`):
1. Stripping existing opcodes out of monolithic `SwapVM.sol` to squeeze under 24KB is error-prone and risks breaking standard AMM building blocks.
2. Monolithic opcode execution prevents dynamic community extensions.

### Suggested Solution
Refactor SwapVM's execution engine using a **Modular Opcode Registry** (e.g., via `delegatecall` dispatcher or ERC-2535 Diamond pattern):
* Core SwapVM handles stack management, execution loops, and basic arithmetic.
* Custom/advanced opcodes (oracles, external TEE verifications, taker restrictions) can be deployed as standalone external modules and registered via an opcode map, completely eliminating the 24KB contract size bottleneck.

### AquaGhost Implementation Proof
In AquaGhost Protocol, we validated this modular approach by building `AquaSwapVM.sol` as a lean, dedicated 139-line execution engine (2,249 bytes runtime size, only 9% of EIP-170 limit) and connecting it directly to `AquaGhostApp.sol` (6,938 bytes runtime size, 28% of limit). By introducing `OP_TEE_GUARD` (`0x7E`) and `OP_DYNAMIC_FEE` (`0xDF`) and linking it into `swapExactInputWithVM()`, we achieved in-bytecode hardware security with over 17.6 KB of contract size headroom remaining.


