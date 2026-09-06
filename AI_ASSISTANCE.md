# AI-Assisted Engineering Methodology & Disclosure

> **ETHGlobal Online 2026 Submission Document**  
> **Project:** AquaGhost Protocol  
> **Repository:** [github.com/emarc99/ghost-protocol](https://github.com/emarc99/ghost-protocol)  
> **Engineering Framework:** [AI Blueprint](https://ai-blueprint.dev) (Spec-Driven, Anti-"Vibe-Coding" Workflow)

---

## 1. Executive Summary

ETHGlobal requires transparency on how AI was utilized during project development. Rather than engaging in unguided, sporadic "vibe-coding"—where AI spontaneously generates untracked and unverified code—**AquaGhost** was engineered using a rigorous, gated **AI Blueprint** development lifecycle.

In this methodology:
* **The Human acts as Architect & Gatekeeper:** Directing system architecture, approving specifications, reviewing diffs, and controlling git commits.
* **The AI Agent acts as Pair-Programmer & Sentinel:** Accelerating implementation, researching sponsor SDK documentation, writing unit test scaffolds, catching edge cases, and formulating structured upstream bug reports.

---

## 2. The AI Blueprint Lifecycle

Every feature, fix, and iteration in this repository follows a 5-step gated loop:

```
┌──────────────┐      ┌───────────────┐      ┌─────────────┐
│ 1. Spec      │ ───> │ 2. Implement  │ ───> │ 3. Check    │
│ (Define Goal)│      │ (Atomic Code) │      │ (Test/Sim)  │
└──────────────┘      └───────────────┘      └─────────────┘
                                                    │
                      ┌───────────────┐             ▼
                      │ 5. Upstream   │ <─── ┌─────────────┐
                      │    Issues     │      │ 4. Audit    │
                      │ (Sponsor Repo)│      │ (Log Bugs)  │
                      └───────────────┘      └─────────────┘
```

### Stage 1: Specification & Planning
- Before code is written, high-level intentions are documented in [`blueprint/project-plan.md`](file:///blueprint/project-plan.md) and [`blueprint/build-plan.md`](file:///blueprint/build-plan.md).
- Ambiguities, permission bitmasks, and interface constraints are resolved *before* writing Solidity or TypeScript.

### Stage 2: Small, Reviewed Implementation Steps
- Code is delivered in modular, focused units rather than monolithic dumps.
- Each unit represents a verifiable building block (e.g., contracts, CRE enclave, interface stubs, simulation scripts).

### Stage 3: Automated & Simulated Verification
- Implementations are tested via Foundry scaffolds ([`contracts/test/AquaGhost.t.sol`](file:///contracts/test/AquaGhost.t.sol)) and end-to-end simulations ([`scripts/simulate_jit_attack.ts`](file:///scripts/simulate_jit_attack.ts)).
- Enclave guardrails are mathematically bounded via [`cre-workflow/src/guardrails.ts`](file:///cre-workflow/src/guardrails.ts) to prevent LLM hallucinations from impacting capital.

### Stage 4: Issue & Bug Auditing (The "Stop Vibe Coding" Philosophy)
- When roadblocks, typing mismatches, or missing simulator features are discovered in sponsor libraries, they are not quietly hacked around.
- The bug/limitation is documented in findings ledgers, resolved with an atomic `fix(...)` commit, and escalated into high-value upstream feedback.

### Stage 5: Upstream Sponsor Feedback & GitHub Issues
- Valuable suggestions for improvement are converted into ready-to-file GitHub Issues for:
  - **Chainlink CRE SDK:** [`docs/sponsor-issues/CHAINLINK_CRE_ISSUES.md`](file:///docs/sponsor-issues/CHAINLINK_CRE_ISSUES.md)
  - **Uniswap Foundation:** [`FEEDBACK.md`](file:///FEEDBACK.md)
  - **1inch Aqua:** [`docs/sponsor-issues/ONEINCH_AQUA_FEEDBACK.md`](file:///docs/sponsor-issues/ONEINCH_AQUA_FEEDBACK.md)
  - **The Graph:** [`docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md`](file:///docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md)

---

## 3. Git Atomic Commit History

A key metric of non-vibe-coding is commit hygiene. Every step in this project is captured as an atomic, conventional commit:

| Commit Hash | Type | Description |
| :--- | :--- | :--- |
| `d3fdb6b` | `chore` | Initialize repo with README and gitignore |
| `5d79922` | `feat(contracts)` | Add Foundry project config with Cancun EVM |
| `48fa265` | `feat(contracts)` | Add 1inch Aqua App contract (`AquaGhostApp.sol`) |
| `012530f` | `feat(contracts)` | Add Uniswap v4 anti-sniper hook (`AquaGhostHook.sol`) |
| `ecd2601` | `feat(contracts)` | Add Foundry test scaffold (`AquaGhost.t.sol`) |
| `6b316e6` | `feat(contracts)` | Add interface stubs for dependencies (`IAqua.sol`) |
| `655f8b6` | `feat(cre)` | Add CRE workflow with `handlerInTee` sentinel |
| `bb34cca` | `feat(cre)` | Add CRE config and secrets schema |
| `91203d2` | `feat(scripts)` | Add JIT attack simulation script |
| `e6ae1c2` | `docs` | Add `FEEDBACK.md` for Uniswap Foundation bounty |
| `19df67c` | `chore(blueprint)` | Install AI Blueprint workflow framework |
| `ef32567` | `docs(blueprint)` | Configure project-plan and build-plan for AquaGhost |
| `a19bef5` | `docs` | Create AI assistance proof log (AI_ASSISTANCE.md) |
| `f48ed53` | `docs(sponsors)` | Scaffold sponsor feedback and GitHub issue ledgers |
| `c4ca880` | `docs(blueprint)` | Harmonize project-overview, coding-standards, and AGENTS commands |
| `5b6dc5f` | `docs(blueprint)` | Enforce mandatory sponsor feedback & GitHub issue discipline |
| `988ee5a` | `feat(contracts)` | Complete AquaGhostHook, AquaGhostApp, and BaseHook with full unit and fuzz test suite |
| `c11078b` | `fix(cre)` | Align workflow with @chainlink/cre-sdk v1.19.1 types and capabilities |
| `11b7f64` | `chore` | Configure root package.json and simulation script command |
| `e02ef0d` | `docs` | Document contract completeness, fuzz verification, and CRE issue 4 in ledgers |
| `22225b8` | `feat(aqua)` | Implement canonical IAquaApp interface with quote and swap execution |
| `87dc2a5` | `docs(1inch)` | Add issue 3 (shared balance simulator) and issue 4 (modular SwapVM opcodes) |
| `e4f97f0` | `docs(uniswap)` | Incorporate ETHOnline 2026 insights on HookList, API telemetry, and Permit2 |
| `a1b87d4` | `chore` | Add dev script to package.json for local dashboard serving |
| `b17f113` | `feat(frontend)` | Implement multi-page dashboard for Aqua Vault, CRE Sentinel, and Uniswap Firewall |
| `ec1f814` | `docs` | Update AI assistance ledger with canonical Aqua methods, Uniswap feedback, and frontend delivery |
| `1d91bf1` | `chore` | Ignore contracts/broadcast in .gitignore |
| `1a958bc` | `feat(deploy)` | Add Anvil deployment script and verification runner with seeded tokens |
| `4661ed2` | `feat(frontend)` | Integrate Web3WalletManager and ethers.js for live Anvil on-chain interaction |
| `da640e3` | `chore` | Add test:live script to package.json for on-chain Anvil integration test |
| `0676b25` | `test(anvil)` | Add end-to-end live on-chain integration test against running Anvil node |
| `937ae87` | `docs` | Add test:live and live on-chain integration test records to AI_ASSISTANCE.md |
| `1e241b0` | `chore` | Ignore scratch directory and build temporary files |
| `b5e48f3` | `feat(skill)` | Integrate official SmartContractKit chainlink-cre-skill for agents |
| `2aec4ed` | `feat(cre)` | Align workflow with official CRE Confidential spec |
| `b9d15b3` | `docs(cre)` | Document Bootcamp issues 5 and 6 and update AI assistance ledger |
| `c8a0978` | `feat(cre)` | Set deployment-registry to private in workflow.yaml |
| `d616e63` | `feat(frontend)` | Display real CRE deployment ID and Vault DON key in sentinel dashboard |
| `e86665c` | `chore(cre)` | Clean unused dependencies and ignore wasm build artifacts |
| `e1d4e79` | `fix(cre)` | Update cron schedule to 1m to comply with CRE 30s rate limit quota |
| `d3ddb4b` | `feat(frontend)` | Connect sentinel dashboard to live CRE deployment 0056b79a |
| `cfe5377` | `docs(ai)` | Update AI_ASSISTANCE.md with live CRE deployment verification receipts |
| `34e64fc` | `feat(graph-mcp)` | Scaffold dedicated The Graph Subgraph MCP server package |

---

## 4. Key Case Study: Human-as-Architect Intervention

Three quintessential demonstrations of the AI Blueprint philosophy occurred during development:
1. **Halting Premature Visual Scaffolding:** The human architect halted early UI vibe-coding to demand 100% contract completeness, formal interface adherence, and property-based fuzzing. The agent pivoted to Foundry fuzz testing (22/22 tests passing across 256 runs).
2. **Rejecting False Client-Side Simulations:** When the UI demonstrated mock reverts, the human architect challenged the agent: *"on-chain? dont you need my wallet to run on-chain txns, or everything are false simulations"*. Rather than maintaining illusions, the agent acknowledged the distinction immediately and executed a complete local testnet deployment:
   - Spun up a live Foundry `anvil` node on port `8545` (Chain ID `31337`).
   - Deployed `AquaGhostApp`, `AquaGhostHook`, `MockAqua`, `MockPoolCaller`, and test ERC20s (`WETH` and `USDC`) with real contract addresses.
   - Seeded test accounts with 500 WETH and 1,000,000 USDC.
   - Integrated `ethers.js` and `Web3WalletManager` into the frontend dashboard for live `window.ethereum` MetaMask signing and real on-chain transaction broadcast.
3. **Aligning with Official Chainlink CRE Confidential Bootcamp:** The human architect instructed: *"use [Environment Setup - CRE Confidential Bootcamp: Build Confidential Workflows](https://smartcontractkit.github.io/CRE-Confidential-bootcamp/) as source for cre"* and shared the live workshop recordings (`https://www.youtube.com/watch?v=ArHoB1JDSlE` and `https://www.youtube.com/watch?v=ntwF13Z4_L8`). The agent deeply analyzed the bootcamp textbook and video transcripts, refactoring AquaGhost's workflow to incorporate all 5 official confidential computing patterns:
   - **`handlerInTee` Execution:** Enforcing AWS Nitro Enclave execution (`[{ tee: "nitro", regions: ["us-west-2"] }]`) using `@chainlink/cre-sdk`.
   - **Vault DON Secret Injection:** Using in-enclave `runtime.getSecret({ id })` and `runtime.getSecrets([...])` mapped via `secrets.yaml` with the canonical `secretsNames` schema.
   - **Confidential HTTP:** Routing external API queries (The Graph Subgraph telemetry) via `HTTPClient` so URL endpoints, headers, and mempool signatures remain confidential from node operators.
   - **Policy-as-Secrets:** Storing JIT anomaly detection thresholds and slippage parameters in the Vault DON so predatory MEV snipers cannot inspect or front-run the defense boundaries.
   - **Consensus Hand-off via `runtime.usingTheDons()`:** Crossing the confidentiality boundary back to the Decentralized Oracle Network for consensus report generation (`donRuntime.report({ encoderName: "evm", signingAlgo: "ecdsa", hashingAlgo: "keccak256" })`), delivering verified cryptographic attestations to Uniswap v4 and 1inch Aqua contracts.
   - **Standard Project Configuration:** Configuring root `project.yaml` and `cre-workflow/workflow.yaml` for both `staging-settings` and `production-settings`.
4. **Live Deployment to Chainlink Private Registry & AWS Nitro Enclave Consensus:** Moving beyond local mock simulations, the human architect authenticated with Chainlink (`emarc_org`, `org_S12N0M30f9cNax7i`), created encrypted production secrets in the Chainlink Vault DON (`ENCLAVE_SIGNER_KEY`, `GRAPH_API_KEY`, `MAX_SLIPPAGE_BPS`, `RISK_THRESHOLD_BPS`), and deployed `aquaghost-sentinel-staging` to the Chainlink Private Registry:
   - **Active Workflow ID:** `0056b79abdf926dbb2a01ba70b8c95eb35696ce16c8346234adaef4834e92621`.
   - **Live Execution Proofs:** Executions (`fc77657e1834...`, `ff1feec3e460...`, `a09eff99fe14...`) run live across 9 decentralized oracle nodes in DON family `zone-a` inside AWS Nitro TEE enclaves (`us-west-2`), achieving consensus on defensive shift attestations within 9-14 seconds.
   - **Frontend Integration:** Live workflow telemetry and execution telemetry are surfaced dynamically in the Sentinel UI dashboard (`frontend/sentinel.html`).
5. **Scaffolding The Graph Subgraph MCP Server (Targeting Partner Prize):** Following human directive to scaffold a dedicated architecture for The Graph, created `@aquaghost/graph-mcp` (`graph-mcp/`):
   - Implemented Model Context Protocol (MCP) server over standard JSON-RPC 2.0 `stdio` transport.
   - Exposed 3 dedicated agent tools: `graph_get_pool_snapshot`, `graph_get_tick_liquidity`, and `graph_detect_jit_threat`.
   - Verified end-to-end functionality against The Graph Network decentralized gateway (`npm run test:mcp`), and submitted upstream DX feedback regarding streaming MCP transport and error normalization in `docs/sponsor-issues/THE_GRAPH_MCP_FEEDBACK.md`.

---

## 5. Human vs. AI Responsibility Matrix

| Responsibility | Human Developer | AI Assistant |
| :--- | :---: | :---: |
| High-Level Product Architecture | **Lead** | Advised / Refined |
| Architectural Intervention & Prioritization | **Lead (Strict Gatekeeper)** | Subordinate to Human Directives |
| Sponsor Prize Track Alignment | **Lead** | Validated against SDKs |
| Code Implementation & Scaffolding | Gatekeeper / Reviewer | **Drafted & Scaffolded** |
| Interface Compatibility Checks | Reviewer | **Automated** |
| Deterministic Guardrails Design | **Co-Designer** | **Implemented** |
| Property-Based Fuzzing & Testing | Requirement Lead | **Implemented (22/22 Passed)** |
| Git Commit Staging & Review | **Final Authority** | Proposed & Executed |
| Upstream Issue Formulation | Reviewer | **Synthesized & Formatted** |
| Multi-Page UI/UX Engineering | Design Visionary | **Engineered & Tested** |
| CRE Confidential Bootcamp Alignment | **Provided Source & Recorded Sessions** | **Analyzed Transcripts & Refactored Workflow** |

---

## 6. Conclusion

By treating AI as an intelligent, disciplined pair-programmer under human architectural direction, AquaGhost demonstrates how modern engineering teams can build complex, multi-protocol DeFi security systems with speed, accountability, and zero hallucinated drift.

