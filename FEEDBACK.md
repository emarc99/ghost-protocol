# Uniswap v4 Developer Experience (DX) Feedback

> **Submission for ETHGlobal Online 2026 — Uniswap Foundation Bounty**  
> **Project:** AquaGhost Protocol  
> **Hook Implementation:** [`contracts/src/AquaGhostHook.sol`](file:///contracts/src/AquaGhostHook.sol)  
> **Repository:** [github.com/emarc99/ghost-protocol](https://github.com/emarc99/ghost-protocol)

---

## Executive Summary

AquaGhost integrates Uniswap v4 as an on-chain enforcement gatekeeper against predatory MEV and Just-In-Time (JIT) liquidity attacks. Our hook implements:
- `beforeSwap`: Dynamic fee adjustments based on enclave volatility assessments.
- `beforeAddLiquidity`: Interception and blocking of flagged predatory sandwich / JIT liquidity transactions.
- TEE attestation verification via compact cryptographic signatures passed in `hookData`.

During the design, development, and architectural scaffolding of this hook, our team thoroughly evaluated the Uniswap v4 developer journey, core smart contracts (`BaseHook`, `IPoolManager`, `Hooks.sol`), tooling (`HookMiner`), and testing workflows. This document details our observations, pain points, positive breakthroughs, and concrete recommendations for the Uniswap Foundation.

---

## 1. Hook Architecture & Permissions Model

### What Worked Exceptionally Well
- **Deterministic Permissions via Address Bitmasks:** Encoding required hook callbacks (`BEFORE_SWAP_FLAG`, `BEFORE_ADD_LIQUIDITY_FLAG`, etc.) into the leading address bits of the hook is an elegant architectural choice. It completely eliminates runtime registry lookups and enforces permission immutability at the EVM bytecode/address level.
- **`BaseHook` Abstraction:** The default reverts (`HookNotImplemented`) for unimplemented callbacks provide solid defense against accidental invocations or misconfigured permissions.

### Pain Points & Areas for Improvement
- **Address Mining Overhead with `HookMiner`:**
  - Finding a salt that produces an address satisfying `0x00c0...` (e.g. `BEFORE_SWAP_FLAG | BEFORE_ADD_LIQUIDITY_FLAG`) requires mining millions of salt combinations using `HookMiner.sol` or Rust/vanity address miners.
  - In local Foundry development and rapid iteration cycles, recompiling the hook or changing constructor arguments changes the init code hash, invalidating the mined salt and forcing a re-mine.
  - **Recommendation:** Provide a standardized Foundry cheatcode or a canonical `v4-dev` mock PoolManager that allows skipping bitmask checks in purely local unit test environments (`vm.prank` or mock flags).

---

## 2. Callback Interfaces & Delta Accounting

### What Worked Exceptionally Well
- **Return Type Expressiveness:**
  - `beforeSwap` returning `(bytes4, BeforeSwapDelta, uint24)` provides granular control. The `BeforeSwapDelta` type allows hooks to take tokens or implement custom curves, while `uint24` allows clean dynamic fee overrides when `OVERRIDE_FEE_FLAG` is active.
  - Returning `(this.beforeSwap.selector, toBeforeSwapDelta(0, 0), uint24(dynamicFee))` cleanly communicates hook intent.

### Pain Points & Areas for Improvement
- **Delta Conversion Ergonomics:**
  - Converting between raw integers and `BeforeSwapDelta` / `BalanceDelta` via helper libraries (`toBeforeSwapDelta`, `toInt128`) can be non-intuitive for newcomers. 
  - Packing two `int128` values into a single `bytes32` (or custom value type) introduces edge cases around negative deltas and sign extension.
  - **Recommendation:** Add explicit helper functions in `v4-core` documentation showing common patterns: fee-only override, exact-input delta modification, and pure telemetry/gatekeeping hooks that return zero deltas.

---

## 3. `hookData` Passing & Off-Chain Sentinel Integration

### What Worked Exceptionally Well
- **Arbitrary Payload Forwarding:**
  - The `bytes calldata hookData` parameter forwarded from `swap(...)` and `modifyLiquidity(...)` through `PoolManager` to hook callbacks is arguably v4's most versatile feature.
  - In AquaGhost, this enables passing AWS Nitro TEE ECDSA signatures and state nonces without requiring an intermediate storage write.

### Pain Points & Areas for Improvement
- **Standardizing Revert Bubbling:**
  - When `AquaGhostHook.beforeAddLiquidity` detects an unauthorized sniper and reverts with `SniperAttackBlocked(sender, poolId)`, the revert bubbles up through `PoolManager.modifyLiquidity`.
  - Depending on router encapsulation, custom hook error selectors are sometimes obscured or wrapped into generic `HookCustomError()`.
  - **Recommendation:** Standardize how peripheral routers decode and emit hook-specific revert reasons so frontends and RPC nodes can display intelligible error messages to users.

---

## 4. Transient Storage & Gas Efficiency (EIP-1153)

### What Worked Exceptionally Well
- **The Singleton Pool Architecture + `TSTORE` / `TLOAD`:**
  - The architectural migration from v3's factory-deployed individual pools to v4's singleton `PoolManager` radically slashes gas costs for multi-hop swaps.
  - Using transient storage for the "unlock" lock pattern enables flash accounting where all balances must net out to zero at the end of the transaction. This is a massive leap forward for decentralized finance UX and protocol composability.

### Pain Points & Areas for Improvement
- **Solidity Version Constraints:**
  - Native `transient` keyword requires `solc >= 0.8.24` and EVM version `cancun`. Ensuring all downstream dependencies, Foundry toolchains, and secondary libraries support Cancun compilation without assembly workarounds requires careful dependency pinning.
  - **Recommendation:** Ensure all official starter templates (like `v4-template`) pin tested combinations of `foundry`, `solc`, and `evm_version = "cancun"` by default.

---

## 5. Developer Platform, API, & Hook Discovery (ETHOnline 2026 Insights)

During the ETHOnline 2026 workshop *“How to Navigate the Uniswap Stack”* by Angela Ocando (Uniswap Labs DevRel), several key pillars of the expanding Uniswap stack were highlighted: `HookList` (the open visualizer and allowlist for vetted hooks), the Uniswap API (`getPoolState`, token KYC, unified routing), deployment scripts, and Uniswap AI skills.

Synthesizing these insights with our engineering experience building AquaGhost's hook sentinel, we highlight three concrete DX friction points and high-value architectural proposals:

### 5.1 Standardized On-Chain Hook Introspection (ERC-165 & `hookData` Schemas)
- **The DX Friction:** While `Hooks.sol` allows deterministic bitmask verification of callback permissions, there is no standardized protocol-level interface for hooks to declare their expected `hookData` ABI schema. In AquaGhost, the hook expects `abi.encode(bytes signature, uint256 nonce, uint256 blockExpiry)` in `hookData`. Other community hooks require Permit2 witnesses, Merkle proofs, or KYC credentials.
- **Impact on Frontends & Routers:** Without a standard introspection pattern, client SDKs, routing aggregators, and visualizers like `HookList` cannot programmatically determine what calldata a hook expects. Frontends must manually maintain bespoke encoding logic for every unique hook address.
- **Recommendation:** Introduce a lightweight introspection interface (e.g., `IHookMetadata` or an ERC-165 extension) where hooks can optionally expose `getHookDataDescriptor()` returning an ABI signature string or schema ID. This would allow the Uniswap Routing API and client libraries to automatically validate and serialize user parameters.

### 5.2 Uniswap API Hook Telemetry & Event Streaming
- **The DX Friction:** Angela highlighted `getPoolState` and community Substreams for indexing pool state. However, proactive security hooks (like AquaGhost) frequently emit custom events on critical actions (e.g., `AttestationVerified`, `DefensiveShiftTriggered`, or revert telemetry when `SniperAttackBlocked` is thrown).
- **Impact on Tooling:** Integrators monitoring pool safety or building real-time dashboard visualizers must currently maintain custom indexing infrastructure or Subgraphs rather than consuming streamable state from the official Uniswap REST API.
- **Recommendation:** Expand the Uniswap API endpoints to include hook event filtering and webhook streams, enabling frontend dashboards and autonomous sentinels to subscribe to hook-specific alerts alongside classic pool liquidity ticks.

### 5.3 Deepening Permit2 Composability in Hook Lifecycles
- **The DX Friction:** Angela emphasized that Uniswap strongly recommends Permit2 for all token approvals. For hooks that enforce custom access control or defensive capital movements, passing Permit2 signatures through `hookData` requires custom packing and manual verification inside each hook.
- **Recommendation:** Provide canonical helper libraries within `@uniswap/v4-periphery` for standard Permit2 witness verification inside `beforeSwap` and `beforeAddLiquidity`. This gives developers an out-of-the-box standard for gasless approvals and atomic user authorization without reinventing custom signature packing.

---

## 6. Summary Matrix & Overall Rating

| Component | Rating (1-5) | Key Strength | Primary Wishlist Item |
| :--- | :---: | :--- | :--- |
| **`BaseHook`** | 5/5 | Clean override pattern, safe default reverts | Built-in helper for zero delta returns |
| **`Hooks.sol` Permissions** | 4.5/5 | Zero-gas runtime check via bitmask | Testnet bypass mode for faster prototyping |
| **`HookMiner` Tooling** | 3.5/5 | Works out of the box in Solidity | Native Foundry/Rust SIMD binary for ultra-fast mining |
| **`IPoolManager`** | 5/5 | Singleton architecture, unlock pattern, gas efficiency | Standardized revert reason bubbling |
| **Uniswap API & Tooling** | 4.5/5 | `getPoolState`, `HookList`, unified deployment scripts | Standardized `hookData` schema introspection & hook event streaming |
| **Documentation & Samples** | 4.5/5 | v4-by-example and docs are great | More production examples combining TEEs/ZKs via `hookData` |

---

## 7. Conclusion

Uniswap v4 represents the most modular and extensible AMM architecture built to date. By decoupling liquidity management, fee structures, and execution policies into customizable Hooks, it allows protocols like **AquaGhost** to combine state-of-the-art off-chain confidential computing (Chainlink CRE Enclaves) with trust-minimized on-chain execution.

We hope this feedback helps the Uniswap Foundation continue refining the developer experience as v4 nears mainnet maturity!

