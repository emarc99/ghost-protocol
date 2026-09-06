/**
 * AquaGhost Protocol - Firewall Page Interactions (Uniswap v4 Hook & PoolManager)
 */

document.addEventListener("DOMContentLoaded", () => {
  renderFirewall();

  const btnToggleDefense = document.getElementById("btn-toggle-defense");
  const btnSimSniperAdd = document.getElementById("btn-sim-sniper-add");
  const revertBanner = document.getElementById("revert-banner");
  const sniperBar = document.getElementById("svg-sniper-bar");

  // Toggle Defense Override
  btnToggleDefense.addEventListener("click", () => {
    soundFX.playBeep(650, 0.12);
    AppState.update(state => {
      state.hookState.defenseActive = !state.hookState.defenseActive;
      if (state.hookState.defenseActive) {
        state.hookState.dynamicFeeBps = 250; // 2.50%
      } else {
        state.hookState.dynamicFeeBps = 30; // 0.30%
      }
    });

    const isDef = AppState.get().hookState.defenseActive;
    if (isDef) {
      showToast("🛡️ Defense Override ENGAGED: Dynamic fee scaled to 2.50%. Sniper firewall active.", "success");
      addLog("[Hook] setDefenseMode(true): dynamicFee=250 bps. beforeAddLiquidity firewall engaged.", "success");
    } else {
      showToast("Defense Override disengaged. Returned to standard 0.30% fee tier.", "info");
      addLog("[Hook] setDefenseMode(false): returned to baseline 30 bps swap fee.", "info");
    }
    renderFirewall();
  });

  // Test Sniper beforeAddLiquidity Interception
  btnSimSniperAdd.addEventListener("click", () => {
    soundFX.playAlert();
    sniperBar.style.display = "block";
    addLog("[Mempool] Incoming tx: 0xBAD0...0B07 calling PoolManager.modifyLiquidity() with 15M capital...", "alert");

    setTimeout(() => {
      const isDef = AppState.get().hookState.defenseActive;
      
      if (isDef) {
        soundFX.playAlert();
        revertBanner.style.display = "block";
        addLog("[Hook] beforeAddLiquidity() called by 0xBAD0...0B07. Defense Mode is ACTIVE.", "warn");
        addLog("[Firewall] REVERT TRIGGERED: AquaGhostHook.SniperAttackBlocked(0xBAD0...0B07, poolId)", "alert");
        addLog("[Result] Attack neutralized in mempool. 0 fees extracted by sniper bot. Honest LPs safe!", "success");
        showToast("🛑 ATTACK BLOCKED! Uniswap v4 Hook reverted sniper's liquidity injection.", "alert");

        AppState.update(state => {
          state.hookState.totalAttacksBlocked += 1;
        });

        setTimeout(() => {
          sniperBar.style.display = "none";
          setTimeout(() => { revertBanner.style.display = "none"; }, 5000);
        }, 1500);

      } else {
        showToast("⚠️ Defense Mode was inactive! Enable defense override to intercept snipers.", "info");
        addLog("[Warning] Sniper liquidity was added because defenseMode was inactive. Toggle defense to activate firewall!", "warn");
        setTimeout(() => { sniperBar.style.display = "none"; }, 1200);
      }

      renderFirewall();
    }, 600);
  });

  window.addEventListener("aquaghost_state_change", renderFirewall);
});

function renderFirewall() {
  const state = AppState.get();
  const isDef = state.hookState.defenseActive;

  // Status Pill
  const pill = document.getElementById("firewall-status-pill");
  const pillText = document.getElementById("firewall-status-text");
  if (isDef) {
    pill.style.background = "rgba(0, 245, 160, 0.15)";
    pill.style.borderColor = "var(--color-emerald)";
    pillText.textContent = "FIREWALL: DEFENSE ENGAGED";
    pillText.style.color = "var(--color-emerald)";
  } else {
    pill.style.background = "rgba(255, 255, 255, 0.05)";
    pill.style.borderColor = "var(--border-color)";
    pillText.textContent = "HOOK: STANDBY MONITORING";
    pillText.style.color = "var(--color-text-muted)";
  }

  // Blocked Attacks
  document.getElementById("val-blocked-attacks").textContent = `${state.hookState.totalAttacksBlocked} Blocked`;

  // Fee Gauge
  const gaugeCircle = document.getElementById("gauge-circle");
  const gaugeFeeVal = document.getElementById("gauge-fee-val");
  const gaugeBpsVal = document.getElementById("gauge-bps-val");
  const gaugeModeLabel = document.getElementById("gauge-mode-label");

  const feePercent = (state.hookState.dynamicFeeBps / 100).toFixed(2);
  gaugeFeeVal.textContent = `${feePercent}%`;
  gaugeBpsVal.textContent = `${state.hookState.dynamicFeeBps} BPS`;

  if (isDef) {
    gaugeCircle.style.borderTopColor = "var(--color-emerald)";
    gaugeCircle.style.borderRightColor = "var(--color-cyan)";
    gaugeCircle.style.boxShadow = "0 0 25px rgba(0, 245, 160, 0.25)";
    gaugeModeLabel.textContent = "🛡️ Dynamic Defense Tier (MEV Capture)";
    gaugeModeLabel.style.color = "var(--color-emerald)";
  } else {
    gaugeCircle.style.borderTopColor = "var(--color-cyan)";
    gaugeCircle.style.borderRightColor = "var(--color-purple)";
    gaugeCircle.style.boxShadow = "none";
    gaugeModeLabel.textContent = "Normal Trading Tier";
    gaugeModeLabel.style.color = "var(--color-text-main)";
  }
}

function addLog(text, type = "info") {
  const logContainer = document.getElementById("firewall-logs");
  if (!logContainer) return;
  const entry = document.createElement("div");
  entry.className = "log-entry";
  const now = new Date().toTimeString().split(" ")[0];
  const typeClass = type === "success" ? "log-success" : type === "alert" ? "log-alert" : type === "warn" ? "log-warn" : "log-info";
  entry.innerHTML = `
    <span class="log-time">[${now}]</span>
    <span class="${typeClass}">${text}</span>
  `;
  logContainer.prepend(entry);
}
