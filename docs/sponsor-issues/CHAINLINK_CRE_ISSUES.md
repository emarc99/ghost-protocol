# Chainlink Runtime Environment (CRE) — Upstream Issues & Improvement Suggestions

> **Prepared during ETHGlobal Online 2026**  
> **Project:** AquaGhost Protocol  
> **Target Package:** `@chainlink/cre-sdk` & CRE Enclave Infrastructure  
> **Status:** Ready to be submitted to Chainlink Developer Feedback / GitHub Issues

---

## Issue 1: [Feature Request] Local Simulator Harness for `handlerInTee` Workflows

### Context
When developing AquaGhost's sentinel workflow ([`cre-workflow/src/index.ts`](file:///cre-workflow/src/index.ts)), the core reasoning and attestation signing logic executes inside an AWS Nitro Enclave via `cre.handlerInTee(...)`.

### Problem & DX Friction
During local development and automated CI runs:
1. Developers cannot spin up a live AWS Nitro Enclave on local machines (especially on macOS / Windows dev machines).
2. The current `@chainlink/cre-sdk` does not provide an official mock or simulation harness for `TeeRuntime`. Developers must manually mock `runtime.getSecret(...)`, `runtime.http`, and attestation signing.
3. This creates friction when validating the boundary transition between `handlerInTee` and `runtime.usingTheDons(...)`.

### Suggested Improvement / Solution
Introduce an official `@chainlink/cre-simulator` or `cre.testHarness()`:

```typescript
import { createTeeSimulator } from "@chainlink/cre-sdk/testing";

const simulator = createTeeSimulator({
  secrets: {
    LLM_API_KEY: "mock-key",
    ENCLAVE_SIGNER_KEY: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
  },
  mockHttp: {
    "https://api.thegraph.com/*": { status: 200, data: mockPoolData }
  }
});

const result = await simulator.run(myWorkflow);
expect(result.signature).toBeDefined();
```

---

## Issue 2: [Typing] Type Preservation Across `usingTheDons()` Boundary

### Context
In CRE workflows, confidential compute results inside `handlerInTee` must be handed off to the decentralized oracle network for consensus via `runtime.usingTheDons(...)`.

### Problem
Currently, the return type from `handlerInTee` when wrapping `runtime.usingTheDons(...)` loses type inference, defaulting to `Promise<any>` or requiring explicit double-casting.

### Suggested Improvement
Enhance the TypeScript generic signature of `usingTheDons`:

```typescript
interface TeeRuntime {
  usingTheDons<TInput, TOutput>(
    callback: (donRuntime: WorkflowRuntime, data: TInput) => Promise<TOutput> | TOutput
  ): Promise<TOutput>;
}
```

This ensures full compile-time type safety when passing signed attestations from the TEE to the DON for on-chain dispatch.

---

## Issue 3: [Documentation] Canonical Pattern for EVM ECDSA Attestation Verification

### Context
A primary use-case for CRE Enclaves is performing off-chain confidential computation and emitting an ECDSA-signed payload to trigger state changes on an EVM smart contract (e.g. `AquaGhostApp.sol` or `AquaGhostHook.sol`).

### Suggestion
Add a canonical guide in Chainlink CRE documentation showing:
1. Signing a packed payload with `ethers.solidityPackedKeccak256` inside `handlerInTee`.
2. Emitting the signature `(bytes signature)` through the DON to an on-chain contract.
3. Verifying the signature on-chain using OpenZeppelin's `ECDSA.recover` against the enclave's public key registered in a contract whitelist.

---

## Issue 4: [DX/TypeScript] Extensionless relative exports in `dist/index.d.ts` break `NodeNext` module resolution

### Context
When integrating `@chainlink/cre-sdk` (`v1.19.1`) into a modern TypeScript project configured with `"module": "NodeNext"` and `"moduleResolution": "NodeNext"` in `tsconfig.json`.

### Problem & DX Friction
1. In `dist/index.d.ts`, the SDK re-exports `export * from './sdk';` without the `.js` file extension.
2. Under standard TypeScript `NodeNext` ESM rules, extensionless relative imports fail resolution:
   ```
   error TS2305: Module '"@chainlink/cre-sdk"' has no exported member 'cre'.
   ```
3. Furthermore, `package.json` specifies `"main": "dist/index.js"` but does not provide a CommonJS export fallback under the `"exports"` map, resulting in `[ERR_PACKAGE_PATH_NOT_EXPORTED]` when imported in CommonJS or non-ESM Node runtimes.

### Suggested Solution
1. In `dist/index.d.ts`, use explicit file extensions for subpath re-exports:
   ```typescript
   export * from './sdk/index.js';
   ```
2. In `package.json`, export both ESM and CJS definitions or document the requirement for `"moduleResolution": "bundler"` in project `tsconfig.json`.

---

## Issue 5: [DX / CLI] `secretsNames` Schema Schema Guidance & Strict Linting in `secrets.yaml`

### Context
In the official Chainlink CRE Confidential Bootcamp (Case Study 2: *Automated Liquidation Protection* and *Hello Confidential Workflows*), workflows define `secrets.yaml` to map in-enclave `runtime.getSecret({ id })` IDs to local `.env` variables for simulation and Vault DON secrets for deployment.

### Problem & DX Friction
1. Developers encountering CRE documentation frequently attempt to use YAML list formats (`secrets: - id: FOO env: BAR`) rather than the required `secretsNames:` dictionary with string array values:
   ```yaml
   secretsNames:
     SECRET_ID:
       - ENV_VARIABLE_NAME
   ```
2. When formatted incorrectly, `cre workflow simulate` fails with cryptic missing secret warnings or silently injects undefined without identifying the YAML syntax discrepancy.

### Suggested Improvement
1. Provide a built-in `cre secrets lint [path]` or schema check that warns if `secrets.yaml` does not adhere to the exact `secretsNames` schema before executing simulation or deployment.
2. Output a helpful actionable remediation snippet if `secrets:` or flat key-value pairs are detected.

---

## Issue 6: [Feature Request] Offline Mode & Local Secret Injection Flag for CI/CD

### Context
During hackathons and automated CI workflows, developers need to simulate confidential workflows locally (`cre workflow simulate`) without requiring an active interactive browser session (`--secrets-auth=browser`) or prior manual organization provisioning on `cre.chain.link`.

### Problem
When automating tests in GitHub Actions or headless Docker containers, the requirement for browser auth or interactive login creates friction for automated regression suites.

### Suggested Improvement
Add an explicit `--secrets-auth=env` or `--offline` flag to `cre workflow simulate` that strictly parses local `.env` and `secrets.yaml` without attempting any network handshake or token renewal with the CRE registry, enabling seamless CI/CD test automation.


