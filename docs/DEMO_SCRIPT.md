# AquaGhost Protocol — 2-Minute Video Demo & Technical Presentation Script

> **Target Duration:** 2 minutes 00 seconds  
> **Format:** Technical Walkthrough (Slides 1–6 $\rightarrow$ 60s Live Terminal Demo $\rightarrow$ Slides 7–8)  
> **Deck URL:** `http://localhost:3001/deck` (or open [`docs/deck.html`](deck.html) in browser)  
> **Live Terminal:** `http://localhost:3001` (Next.js Cyberpunk Observatory)  
> **Target Network:** Base Sepolia Testnet (Chain ID `84532`)

---

## ⏱️ Video Timeline Breakdown

```
0:00 - 0:45 | Part I: Technical Context & Math (Slides 1 – 6)
0:45 - 1:45 | Part II: 60-Second Live Terminal Demo (Mission Control on Base Sepolia)
1:45 - 2:00 | Part III: Empirical Rigor & Conclusion (Slides 7 – 8)
```

---

## 🎬 Part I: Technical Context & Mathematics (0:00 – 0:45)

### Slide 1: Cover & Vision (0:00 – 0:08)
* **Visual:** Slide 1 on screen (`http://localhost:3001/deck`).
* **Speaker Script:**
  > *"Concentrated liquidity providers on AMMs bleed over four hundred million dollars each year to predatory Just-In-Time fee sniping and Loss-Versus-Rebalancing. Meet **AquaGhost Protocol**: a hardware-isolated autonomous liquidity defense system that protects sovereign makers without requiring asset custody or leaking mempool triggers."*

### Slide 2: The Core Problem: The $400M+ Silent Drain (0:08 – 0:16)
* **Visual:** Slide 2 highlighting JIT Sniping and LVR cards.
* **Speaker Script:**
  > *"Today, passive LPs bear all the volatility risk while MEV bots capture the yield. In JIT sniping, searchers borrow tens of millions via flash loans, deposit liquidity immediately before large swaps, siphon ninety percent of the fees, and withdraw in the exact same block—leaving passive makers with zero fee compensation and pure inventory risk."*

### Slide 3: The Impossible LP Dilemma (0:16 – 0:24)
* **Visual:** Slide 3 showing Trap A (Vaults) vs. Trap B (Public Mempools).
* **Speaker Script:**
  > *"Existing solutions force an impossible choice: either surrender custody to third-party pooled vaults—which have suffered over one point two billion in historical smart contract exploits—or automate rebalances publicly on-chain, where searchers front-run and sandwich the stop-loss transactions."*

### Slide 4: Mathematical Anatomy of JIT Exploits (0:24 – 0:31)
* **Visual:** Slide 4 displaying the concentrated liquidity dilution formula and LVR integral.
* **Speaker Script:**
  > *"Mathematically, fee share is strictly proportional to active liquidity density. When a flash-loan sniper injects twenty times the passive liquidity for zero blocks, the maker's fee share approaches zero. Meanwhile, cumulative LVR drains value continuously because AMMs cannot compute off-chain volatility privately."*

### Slide 5: The AquaGhost Two-Tier Security Model (0:31 – 0:38)
* **Visual:** Slide 5 showing Tier 1 (AWS Nitro Enclave TEE) & Tier 2 (Sovereign Non-Custodial Execution).
* **Speaker Script:**
  > *"AquaGhost breaks this dilemma by decoupling intelligence from execution: threat inference executes inside hardware-isolated AWS Nitro Enclaves with encrypted secrets that node operators cannot see. On-chain, capital remains one hundred percent sovereign in the maker's wallet, repositioned via 1inch Aqua and guarded by our Uniswap v4 Hook."*

### Slide 6: Algorithmic Defense & Invariant Envelopes (0:38 – 0:45)
* **Visual:** Slide 6 showing the dynamic fee surge model and invariant corridor guardrail.
* **Speaker Script:**
  > *"Our defense shifts pool fees dynamically based on pending volume surges, making the sniper's profit equation negative. Enclaves verify bounded slippage invariants before signing, and custom SwapVM opcodes enforce hardware attestations directly on the execution stack."*

---

## ⚡ Part II: 60-Second Live Terminal Demo (0:45 – 1:45)

* **Visual Transition:** Switch tab to `http://localhost:3001` (Next.js Cyberpunk Observatory).

### Step 1: Baseline Pool Status (0:45 – 0:55)
* **Visual:** Point to topbar `BASE SEPOLIA : 84532`, live block counter (`BLK #4677...`), and the calm green USDC/WETH concentrated depth ladder.
* **Speaker Script:**
  > *"Here is AquaGhost running live on Base Sepolia. Our USDC/WETH pool is currently calm with a baseline 5 bps fee. The depth ladder is streamed live from decentralized indexing, and all four TEE enclave sentinels are active."*

### Step 2: On-Chain 1inch Aqua Swap Fill (0:55 – 1:10)
* **Visual:** Click **`[ SIMULATE SWAP FILL (ON-CHAIN) ]`**.
  - Button switches to `"BROADCASTING ON-CHAIN..."`.
  - In ~3 seconds, transaction confirms.
  - Live `<TxBanner />` flashes in emerald:
    `CONFIRMED ON BASE SEPOLIA (BLK #46770426) — 1INCH AQUA SWAP FILL SIMULATION [ VIEW ON BASESCAN ↗ ]`.
* **Speaker Script:**
  > *"First, we simulate a standard 1inch Aqua trade. Clicking 'Simulate Swap Fill' broadcasts an authentic on-chain transaction to MockAquaRouter on Base Sepolia. In three seconds, it confirms on-chain, logging the block number with a direct BaseScan explorer link."*

### Step 3: Triggering Predatory MEV Attack & Synchronous Revert (1:10 – 1:35)
* **Visual:** Click **`[ SIMULATE MEV THREAT ]`** or **`[ TRIGGER MEV ATTACK ]`**.
  - Synthesizer triggers klaxon alarm; UI turns crimson (`DEFENSE_ACTIVE`).
  - Terminal log displays enclave ECDSA attestation generation.
  - On-chain transaction broadcasts `AquaGhostHook.setDefenseMode(true, 250 bps)` on Base Sepolia.
  - Banner confirms: `CONFIRMED ON BASE SEPOLIA (BLK #46770435) [ VIEW ON BASESCAN ↗ ]`.
  - Point to audit log showing `UNISWAP_V4_HOOK: SniperLiquidityBlocked() — 0-block JIT injection reverted`.
* **Speaker Script:**
  > *"Now, an MEV bot attempts a predatory zero-block JIT sandwich. We trigger the attack. Instantly, our Nitro TEE sentinel identifies the surge, signs an attestation with its hardware enclave key, and broadcasts the defense shift on-chain. On Base Sepolia, the hook activates defense mode, 1inch Aqua repositions maker inventory out of the vulnerable tick, and the sniper's liquidity injection is reverted with SniperLiquidityBlocked(). The LP lost zero capital."*

### Step 4: Disarm Defense & Explainable Telemetry (1:35 – 1:45)
* **Visual:** Click **`[ DISARM DEFENSE (ON-CHAIN) ]`** to reset. Briefly navigate to `/firewall` to show `previewFee` FairFlow telemetry.
* **Speaker Script:**
  > *"We disarm defense on-chain. Notice on our Firewall page that aggregators can inspect fee states via previewFee before routing trades, maintaining one hundred percent public routing compatibility."*

---

## 📊 Part III: Empirical Rigor & Conclusion (1:45 – 2:00)

* **Visual Transition:** Switch back to Slide 8 (`http://localhost:3001/deck`).

### Slide 7: 1,000-Block Empirical Proof (1:45 – 1:53)
* **Visual:** Slide 7 displaying the 4-Pillar Empirical Scorecard.
* **Speaker Script:**
  > *"In our empirical backtest simulating one thousand blocks on real Ethereum Mainnet dynamics, AquaGhost achieved a net LP yield boost of plus one thousand one hundred and fifty basis points—saving over two point two million dollars in adverse selection with one hundred percent of JIT snipers reverted."*

### Slide 8: Conclusion & Summary (1:53 – 2:00)
* **Visual:** Slide 8 showing reproduction commands and contract links.
* **Speaker Script:**
  > *"AquaGhost proves LPs no longer have to sacrifice self-custody for MEV protection. With forty-two passing Foundry tests and live Base Sepolia contracts, the system is ready to inspect and reproduce today. Thank you!"*

---

## 🛠️ Quick Verification Reference for Presenter

```bash
# 1. Slide Deck URL:
http://localhost:3001/deck   # Or open docs/deck.html

# 2. Live Operator Console:
http://localhost:3001        # Base Sepolia Network (Chain ID 84532)

# 3. Contract Tests:
cd contracts && forge test   # 42/42 Tests Passing

# 4. Empirical Backtest:
npm run backtest             # 1,000-block math simulation
```
