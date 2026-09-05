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

---

## 4. Human vs. AI Responsibility Matrix

| Responsibility | Human Developer | AI Assistant |
| :--- | :---: | :---: |
| High-Level Product Architecture | **Lead** | Advised / Refined |
| Sponsor Prize Track Alignment | **Lead** | Validated against SDKs |
| Code Implementation & Scaffolding | Gatekeeper / Reviewer | **Drafted & Scaffolded** |
| Interface Compatibility Checks | Reviewer | **Automated** |
| Deterministic Guardrails Design | **Co-Designer** | **Implemented** |
| Git Commit Staging & Review | **Final Authority** | Proposed & Executed |
| Upstream Issue Formulation | Reviewer | **Synthesized & Formatted** |

---

## 5. Conclusion

By treating AI as an intelligent, disciplined pair-programmer under human architectural direction, AquaGhost demonstrates how modern engineering teams can build complex, multi-protocol DeFi security systems with speed, accountability, and zero hallucinated drift.
