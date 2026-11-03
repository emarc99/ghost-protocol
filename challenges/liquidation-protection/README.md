# Chainlink Automated Liquidation Protection Challenge

> **Track:** Automated Liquidation Protection Challenge ($500 Bounty)  
> **Event:** ETHGlobal Online 2026  
> **Host / Mentor:** Solange Gueiros & Chainlink Labs  
> **Challenge Official Repository:** [solangegueiros/cf-liquidation-protection-challenge](https://github.com/solangegueiros/cf-liquidation-protection-challenge)

---

## 1. Overview & Official Sepolia Contracts

Participants build a **Chainlink Confidential Workflow** executing inside an **AWS Nitro Enclave TEE** that monitors and protects a virtual lending position during volatile price swings simulated by the Chainlink team over a 24–48 hour evaluation window following the hackathon submission deadline.

### Smart Contracts (Ethereum Sepolia):
| Contract | Address | Decimals | Explorer |
| :--- | :--- | :---: | :--- |
| **Challenge Lending Contract** | `0x88574e7Cc0027afd04951daa09B64d4441931ba1` | — | [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x88574e7Cc0027afd04951daa09B64d4441931ba1) |
| **Virtual ETH (`vETH`)** | `0x5dED1a40c3D56dA42E7f932f781c0432556c9814` | 2 | [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x5dED1a40c3D56dA42E7f932f781c0432556c9814) |
| **Virtual USD (`vUSD`)** | `0x6Fe92Ead5299040f50F095860b5A0A7A2D4041A2` | 2 | [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x6Fe92Ead5299040f50F095860b5A0A7A2D4041A2) |

### Starting Position (upon calling `join()`):
- **Locked Collateral:** `5.00 vETH` (500 units)
- **Active Debt:** `7000.00 vUSD` (700,000 units)
- **Free Emergency Balance:** `5.00 vETH` + `7000.00 vUSD` minted to participant's wallet
- **Initial Health Factor:** `~1.11` (`(5.00 × 2000.00 × 78%) / 7000.00`)
- **Liquidation Boundary:** `HF <= 1.00` (78% threshold). When price drops below $1,795, the position enters liquidation danger!

---

## 2. Directory Layout (Completely Isolated from Main Protocol)

```
challenges/liquidation-protection/
├── workflow/                       # Isolated Chainlink CRE Confidential Workflow
│   ├── main.ts                     # Winning in-TEE strategy (collateral-first, zero-leak logs)
│   ├── workflow.yaml               # CRE workflow manifest pointing to local secrets.yaml
│   ├── secrets.yaml                # Isolated secret mappings (never touches root secrets)
│   ├── config.staging.json         # Staging runtime config (Sepolia RPC & addresses)
│   ├── config.production.json      # Production runtime config (Nitro TEE)
│   ├── .env.example                # Local environment template for simulated execution
│   └── package.json
├── frontend/                       # Solange's official challenge UI (Vite + React)
│   ├── addresses.ts                # Sepolia addresses
│   └── src/                        # MetaMask wallet connect, position monitor, join() button
└── README.md                       # This guide
```

---

## 3. How We Win: The 100-Point Rubric Strategy

| Rubric Component | Points | Standard / Amateur Approach | **AquaGhost Winning Strategy** |
| :--- | :---: | :--- | :--- |
| **Liquidation Protection** | **40 pts** | 5-minute cron triggers (too slow, gets liquidated when price drops multiple blocks in a row). | **1-Minute Cron Trigger (`0 */1 * * * *`):** Evaluates every minute, intervening before the admin's liquidation sweep. |
| **Loan Continuity** | **20 pts** | **Immediately burns vUSD debt**, cutting active debt in half and slashing `cumulativeDebtTime`! | **Collateral-First Defense:** We deposit free emergency `vETH` first. This raises the HF numerator *without* shrinking active debt, preserving 100% of the loan continuity score! |
| **Capital Efficiency** | **15 pts** | Dumps round amounts (e.g. 50% repay). | **Exact Unit Calculus:** In-enclave math calculates the *exact minimal units* required to reach `targetHf` (e.g. 1.12), preserving capital reserves. |
| **Confidentiality** | **15 pts** | **Leaking secrets in logs.** Solange's sample code printed `min_hf` and `target_hf` in `runtime.log`! | **Zero-Leak Logging + Execution Receipt:** 100% sanitized logs (`POLICY_ACTIVE`, `TELEMETRY_INGESTED`, `DEFENSE_DISPATCHED`). Plus returns an in-enclave cryptographic receipt. |
| **Intervention Discipline** | **10 pts** | Spams transactions on every minor price fluctuation. | **Hysteresis Threshold:** Only triggers when HF enters danger zone (`< 1.06`), avoiding repeated gas and operation penalties. |

---

## 4. Step-by-Step Operator Guide

### Step 1: Join the Challenge on Sepolia
1. Ensure your browser wallet (MetaMask) has a small amount of Sepolia ETH for gas.
2. Launch the challenge frontend:
   ```bash
   cd challenges/liquidation-protection/frontend
   npm install
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173), connect MetaMask to **Ethereum Sepolia**, and click **`Join Challenge`**.
4. *(Alternatively, call `join()` directly on [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x88574e7Cc0027afd04951daa09B64d4441931ba1#writeContract)).*

### Step 2: Configure Private Secrets
1. In `challenges/liquidation-protection/workflow/`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` with your joined wallet's private key:
   ```ini
   CRE_ETH_PRIVATE_KEY=0xYOUR_SEPOLIA_PRIVATE_KEY
   CRE_LIQUIDATION_MIN_HF_TRIGGER_VAR=106
   CRE_LIQUIDATION_TARGET_HF_VAR=112
   CRE_LIQUIDATION_MAX_REPAY_PCT_VAR=15
   CRE_LIQUIDATION_MAX_DEPOSIT_UNITS_VAR=200
   ```

### Step 3: Run Local Simulation
Test that the workflow compiles to WebAssembly and connects to Sepolia without errors:
```bash
cd challenges/liquidation-protection/workflow
cre workflow simulate
```

### Step 4: Upload Secrets to Vault DON & Deploy
Upload the encrypted secrets to your private Chainlink Vault DON and deploy:
```bash
cd challenges/liquidation-protection/workflow

# 1. Authorize and store secrets in the Vault DON
cre secrets create secrets.yaml --target staging-settings --secrets-auth=browser

# 2. Verify secrets landed
cre secrets list --target staging-settings --secrets-auth=browser

# 3. Deploy workflow to Chainlink Private Registry
cre workflow deploy . --target staging-settings
```

---

## 5. Verified Foundry Test Suite

The protocol includes a dedicated Foundry test suite proving the starting position and collateral-first defense:
```bash
cd contracts
forge test --match-contract ChallengeLendingTest -vvv
```
**Test Results:**
- `test_Challenge_StartingPosition()`: Verifies 5.00 vETH locked, 5.00 vETH free, 7000.00 vUSD debt, and HF 1.11.
- `test_Challenge_PriceDrop_And_CollateralFirst_Defense()`: Verifies price drop to $1750 (HF 0.97), followed by a 1.00 vETH collateral deposit restoring HF to 1.17 while preserving 100% of active debt!
- `test_Challenge_Stop_LoanContinuityScored()`: Verifies 10000 basis points (100%) loan continuity score.
