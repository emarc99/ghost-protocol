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

---

## 4. Key Case Study: Human-as-Architect Intervention

Two quintessential demonstrations of the AI Blueprint philosophy occurred during development:
1. **Halting Premature Visual Scaffolding:** The human architect halted early UI vibe-coding to demand 100% contract completeness, formal interface adherence, and property-based fuzzing. The agent pivoted to Foundry fuzz testing (22/22 tests passing across 256 runs).
2. **Rejecting False Client-Side Simulations:** When the UI demonstrated mock reverts, the human architect challenged the agent: *"on-chain? dont you need my wallet to run on-chain txns, or everything are false simulations"*. Rather than maintaining illusions, the agent acknowledged the distinction immediately and executed a complete local testnet deployment:
   - Spun up a live Foundry `anvil` node on port `8545` (Chain ID `31337`).
   - Deployed `AquaGhostApp`, `AquaGhostHook`, `MockAqua`, `MockPoolCaller`, and test ERC20s (`WETH` and `USDC`) with real contract addresses.
   - Seeded test accounts with 500 WETH and 1,000,000 USDC.
   - Integrated `ethers.js` and `Web3WalletManager` into the frontend dashboard for live `window.ethereum` MetaMask signing and real on-chain transaction broadcast.

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

---

## 5. Conclusion

By treating AI as an intelligent, disciplined pair-programmer under human architectural direction, AquaGhost demonstrates how modern engineering teams can build complex, multi-protocol DeFi security systems with speed, accountability, and zero hallucinated drift.
