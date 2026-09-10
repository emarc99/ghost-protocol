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

## Issue 7: [CLI / Monorepo DX] Project Root Discovery Silently Defaults to Git Root in Monorepos

### Context
In multi-workflow repositories or monorepos (e.g., a project containing a main protocol workflow in `cre-workflow/` and a secondary challenge workflow in `challenges/liquidation-protection/workflow/`).

### Problem & DX Friction
1. When a developer navigates into a nested workflow directory and runs:
   ```bash
   cre secrets create secrets.yaml --target staging-settings --secrets-auth=browser
   ```
2. The CRE CLI automatically searches upwards for `.git` and silently designates the repository root as `--project-root`.
3. Consequently, the CLI attempts to read the *root* `secrets.yaml` and root `.env`, failing with obscure errors like:
   ```
   ✗ environment variable "STAGING_ENCLAVE_SIGNER_KEY" for secret "ENCLAVE_SIGNER_KEY" not found; please export it
   ```
   even though the local `secrets.yaml` and `.env` in the current working directory are fully populated!
4. The developer must deduce through trial-and-error that `-R . -e .env` must be explicitly passed.

### Suggested Solution
1. When `workflow.yaml` exists in the current working directory, default `--project-root` to `.` rather than traversing to `.git`.
2. Or detect if multiple `secrets.yaml` exist in the path hierarchy and warn the user:
   ```
   ⚠️ Detected local secrets.yaml in ./secrets.yaml. Using local directory as project root (use -R to override).
   ```

---

## Issue 8: [CLI / DX] Auto-Detect `--secrets-auth=browser` for Private Deployment Registries

### Context
When storing secrets in the Vault DON for a confidential workflow targeting a private registry (`deployment-registry: "private"` in `workflow.yaml`).

### Problem & DX Friction
1. `cre secrets create` defaults to `--secrets-auth=onchain` (which expects an on-chain smart contract transaction using wallet gas).
2. For private workflows, however, `--secrets-auth=browser` is required to authenticate against the Vault DON gateway via OAuth session.
3. If `--secrets-auth` is omitted, the CLI fails attempting on-chain execution, confusing developers who are building purely private TEE workflows.

### Suggested Solution
Since `workflow.yaml` already explicitly declares:
```yaml
user-workflow:
  deployment-registry: "private"
```
The CRE CLI should automatically inspect the selected `--target` in `workflow.yaml`. If `deployment-registry` is `"private"`, it should automatically default `--secrets-auth` to `"browser"`.

---


