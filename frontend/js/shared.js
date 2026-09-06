/**
 * AquaGhost Protocol - Shared State & Utilities
 */

// Simulated Maker Wallet State (Non-Custodial)
const defaultState = {
  makerAddress: "0xA11CE88B0964177d56e9A381f8f3c7D1f4c58190",
  enclaveAddress: "0xb1E7433cf5A68Be0241C58a864dbaA5457706792",
  aquaRouterAddress: "0x111111125421cA6dc452d289314280a0f8842A65",
  poolManagerAddress: "0x000000000004444c5dc75cB358380D2e3dE08A90",
  hookAddress: "0x00c07B88A01b7c8449c2A1974fE3dD7e9b048899", // Valid v4 bitmask
  
  // Physical balances sitting strictly inside the Maker's wallet
  walletBalances: {
    WETH: 10.0,
    USDC: 25000.0,
    AAVE: 150.0,
    USDT: 10000.0
  },
  
  // Active 1inch Aqua Strategies sharing the same wallet inventory
  strategies: [
    {
      id: "strat-1",
      name: "ETH / USDC Primary Yield",
      pair: "WETH / USDC",
      appType: "Aqua Constant Product",
      committedAmounts: { WETH: 5.0, USDC: 15000.0 },
      tickLower: -201240,
      tickUpper: -201160,
      feeBps: 30, // 0.30%
      status: "ACTIVE_NORMAL",
      effectiveLiquidityUSD: 30000
    },
    {
      id: "strat-2",
      name: "Aqua Flash Liquidity Provider",
      pair: "USDC / USDT",
      appType: "Aqua Flash Loan App",
      committedAmounts: { USDC: 20000.0, USDT: 10000.0 },
      tickLower: 0,
      tickUpper: 0,
      feeBps: 9, // 0.09%
      status: "ACTIVE_NORMAL",
      effectiveLiquidityUSD: 30000
    },
    {
      id: "strat-3",
      name: "ETH / AAVE Concentrated",
      pair: "WETH / AAVE",
      appType: "Aqua Concentrated LP",
      committedAmounts: { WETH: 5.0, AAVE: 120.0 },
      tickLower: -1500,
      tickUpper: 1500,
      feeBps: 50, // 0.50%
      status: "ACTIVE_NORMAL",
      effectiveLiquidityUSD: 27000
    }
  ],

  // Defense Sentinel State
  sentinel: {
    status: "STANDBY_MONITORING",
    isUnderAttack: false,
    lastAttestation: null,
    enclaveModel: "AWS Nitro Enclave (EIF #29401)",
    verificationProof: "Secp256k1 + TPM PCR0 Validated"
  },

  // Uniswap v4 Hook State
  hookState: {
    defenseActive: false,
    dynamicFeeBps: 30, // Default 0.3%
    totalAttacksBlocked: 14,
    lastBlockedAttacker: "0xBAD000000000000000000000000000000000B07"
  }
};

// Persistence in localStorage
class StateManager {
  constructor() {
    const saved = localStorage.getItem("aquaghost_state");
    if (saved) {
      try {
        this.state = JSON.parse(saved);
      } catch {
        this.state = defaultState;
      }
    } else {
      this.state = defaultState;
    }
  }

  get() {
    return this.state;
  }

  update(fn) {
    fn(this.state);
    localStorage.setItem("aquaghost_state", JSON.stringify(this.state));
    window.dispatchEvent(new CustomEvent("aquaghost_state_change", { detail: this.state }));
  }

  reset() {
    this.state = JSON.parse(JSON.stringify(defaultState));
    localStorage.setItem("aquaghost_state", JSON.stringify(this.state));
    window.dispatchEvent(new CustomEvent("aquaghost_state_change", { detail: this.state }));
  }
}

const AppState = new StateManager();

// Sound Synthesizer via Web Audio API (Zero external assets needed)
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
  }

  playBeep(freq = 600, duration = 0.1, type = "sine") {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {}
  }

  playAlert() {
    this.playBeep(880, 0.15, "sawtooth");
    setTimeout(() => this.playBeep(440, 0.25, "sawtooth"), 120);
  }

  playSuccess() {
    this.playBeep(523.25, 0.1, "triangle"); // C5
    setTimeout(() => this.playBeep(659.25, 0.1, "triangle"), 80); // E5
    setTimeout(() => this.playBeep(783.99, 0.18, "triangle"), 160); // G5
  }
}

const soundFX = new SoundFX();

// UI Helper Utilities
function shortAddress(addr) {
  if (!addr) return "0x00...0000";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function shortHash(hash) {
  if (!hash) return "0x00...0000";
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function formatUSD(num) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}

function showToast(message, type = "info") {
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement("div");
  const borderColor = type === "alert" ? "var(--color-crimson)" : type === "success" ? "var(--color-emerald)" : "var(--color-cyan)";
  toast.style.cssText = `
    background: #0f121a;
    color: #fff;
    padding: 12px 18px;
    border-radius: 8px;
    border-left: 4px solid ${borderColor};
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    font-family: var(--font-main);
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: toast-in 0.25s ease-out;
  `;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
