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

## Issue 6: [EVM / Keystone Forwarder DX] Silent `WriteReport` SUCCESS when Receiver Contract Lacks ERC-165 (`supportsInterface`)

### Context
When a CRE Workflow with confidential in-TEE handlers writes on-chain reports via `evmClient.writeReport(donRuntime, { receiver, report, gasConfig })` targeting the official production Keystone Forwarder (`0xF8344CFd5c43616a4366C34E3EEE75af79a74482` on Base Sepolia / Ethereum Sepolia).

### Problem & DX Friction
1. **Simulation vs Production Divergence:**
   - In `cre workflow simulate --broadcast`, the CLI broadcasts through `MockKeystoneForwarder` (`0x15fC6ae9…9F88` on Sepolia or `0x82300bd7...` on Base Sepolia). This simulation forwarder accepts reports directly without strictly asserting ERC-165 compliance.
   - In deployed production on the DON, however, the real Keystone Forwarder performs an internal `staticcall` to `supportsInterface(type(IReceiver).interfaceId)` before delivering the report payload to `onReport(bytes,bytes)`.
2. **Silent Failure & Deceptive Success Status:**
   - If the developer's receiver contract does not inherit `ERC165` or implements only `onReport(...)` without returning `true` for `type(IReceiver).interfaceId` (`0x805f2132`), the Forwarder's `supportsInterface` staticcall reverts.
   - The Forwarder swallows the revert, records `ReportProcessed(receiver, ..., result: false)`, and finishes the transaction.
   - From the CRE workflow's perspective, `WriteReport` reports `SUCCESS` with duration 0ms and an empty txHash, leaving zero error message in `cre workflow execution events`.
   - Developers spend hours believing the DON or write target is broken when the issue is simply a missing ERC-165 interface implementation.

### Code Snippet & Canonical Fix
Receiver contracts must explicitly inherit OpenZeppelin's `ERC165` and register `IReceiver`:

```solidity
import { IReceiver } from "./interfaces/IReceiver.sol";
import { ERC165 } from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract AquaGhostHook is BaseHook, ERC165, IReceiver {
    address public keystoneForwarder;

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IReceiver).interfaceId || super.supportsInterface(interfaceId);
    }

    function onReport(bytes calldata metadata, bytes calldata report) external override {
        if (keystoneForwarder != address(0) && msg.sender != keystoneForwarder) {
            revert UnauthorizedForwarder(msg.sender);
        }
        // Decode verified attestation and execute defense
        (string memory action, , , uint24 feeBps, uint256 nonce, bytes memory signature) = 
            abi.decode(report, (string, int24, int24, uint24, uint256, bytes));
        _applyDefense(active, feeBps, nonce, signature);
    }
}
```

### Suggested Solution for Chainlink Labs
1. **Align Simulation with Production:** Update `MockKeystoneForwarder` used in `cre workflow simulate` to enforce the exact same `supportsInterface` staticcall check as the production Forwarder, catching missing ERC-165 implementations immediately at development time.
2. **Surfaced Diagnostics in CRE CLI:** In `cre workflow execution events --verbose`, if the forwarder emits `result: false` or if `txHash` is empty, surface an explicit warning: `⚠️ Forwarder staticcall supportsInterface failed on receiver <address>. Ensure receiver implements IERC165 and IReceiver.`
3. **Documentation:** Add a prominent callout box in *Writing Data Onchain* and the *Forwarder Directory* highlighting that target contracts MUST inherit `ERC165` and support `IReceiver`.

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


