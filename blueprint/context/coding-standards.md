# Coding Standards - AquaGhost Protocol

> Project conventions for AquaGhost. Read before changing or reviewing code.

## 1. Solidity & Smart Contracts

- **Compiler Version:** Solidity `0.8.26` pinned across all contracts.
- **EVM Target:** `cancun` (required for EIP-1153 transient storage `TSTORE`/`TLOAD` used by Uniswap v4).
- **Uniswap v4 Hooks:**
  - Inherit from `BaseHook`.
  - Permissions bitmask strictly declared in `getHookPermissions()` (e.g. `beforeSwap: true`, `beforeAddLiquidity: true`).
  - `beforeSwap` returns `(bytes4, BeforeSwapDelta, uint24)`:
    - Use `toBeforeSwapDelta(0, 0)` when no hook tokens are transferred.
    - Set `uint24` to override dynamic swap fee when applicable.
  - `beforeAddLiquidity` returns `(bytes4)`:
    - Revert with custom error `SniperAttackBlocked(sender, poolId)` when unauthorized JIT liquidity injection is detected under `defenseMode`.
  - Validate signatures using `ECDSA.recover(ethSignedMessageHash, signature)` against authorized `enclaveSigner`.
- **1inch Aqua Apps:**
  - Never take custody of maker capital.
  - Interact with Aqua core exclusively via `dock(strategyId)` and `ship(newStrategy)`.
  - Ensure all state transitions require valid TEE attestations and replay-protected nonces.
- **Gas & Security:**
  - Use custom errors instead of `require(..., "string")`.
  - Protect against signature replay via `mapping(uint256 => bool) public executedNonces`.
  - Follow Checks-Effects-Interactions.

## 2. Chainlink CRE Workflow & TypeScript

- **SDK:** `@chainlink/cre-sdk`
- **Confidential Compute:**
  - Logic requiring secrets or private threat analysis MUST reside inside `cre.handlerInTee(...)`.
  - Never log or leak secrets retrieved via `runtime.getSecret(...)` to public console outputs or unencrypted network endpoints.
  - Crossing back from enclave to consensus must use `runtime.usingTheDons(...)`.
- **In-Enclave Guardrails:**
  - Never allow raw LLM output to directly produce an unvalidated transaction.
  - All LLM parameter proposals must pass through deterministic math clamps (`validateGuardrails` in `cre-workflow/src/guardrails.ts`):
    - `maxSlippageBps` ceiling
    - `minTickWidth` floor
    - `maxFeeBps` ceiling
- **TypeScript Rules:**
  - Strict mode enabled (`strict: true` in `tsconfig.json`).
  - No implicit `any`. Explicitly define interfaces for all data structures (`PoolMetrics`, `DefenseDecision`, `PendingSwap`).
  - Use ES modules (`import`/`export`) and NodeNext module resolution.

## 3. The Graph Subgraph Integration

- Prefer Subgraph Studio endpoints and Subgraph MCP client tooling.
- Handle potential RPC/network hiccups with graceful retry fallbacks.
- Never hardcode mock data in production builds—use live queries against indexed Uniswap pool IDs.

## 4. Git Atomic Commit Standards

- Conventional commit format required: `<type>(<scope>): <short imperative description>`.
- Allowed types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`.
- Atomic discipline: One logical change per commit. Never bundle unrelated features, fixes, and docs into a single commit.
- In-flight bugs: Document root cause, apply fix, commit with `fix(...)`, and draft upstream issue in `docs/sponsor-issues/` if related to sponsor SDK limitations.
