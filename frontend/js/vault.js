/**
 * AquaGhost Protocol - Vault Page Interactions (1inch Aqua)
 */

document.addEventListener("DOMContentLoaded", () => {
  renderVault();

  // Ship Modal Triggers
  const shipModal = document.getElementById("ship-modal");
  const btnOpenModal = document.getElementById("btn-ship-modal");
  const btnCloseModal = document.getElementById("modal-close");
  const btnCancelModal = document.getElementById("btn-cancel-modal");
  const btnConfirmShip = document.getElementById("btn-confirm-ship");
  const btnSimSwap = document.getElementById("btn-sim-swap");

  btnOpenModal.addEventListener("click", () => {
    shipModal.style.display = "flex";
  });

  const closeModal = () => { shipModal.style.display = "none"; };
  btnCloseModal.addEventListener("click", closeModal);
  btnCancelModal.addEventListener("click", closeModal);

  // Ship Action
  btnConfirmShip.addEventListener("click", () => {
    const name = document.getElementById("input-strat-name").value || "Custom Aqua Strategy";
    const pair = document.getElementById("input-strat-pair").value;
    const appType = document.getElementById("input-strat-app").value;
    const feeBps = Number(document.getElementById("input-strat-fee").value) || 30;
    const effectiveUSD = Number(document.getElementById("input-strat-amount").value) || 20000;

    AppState.update(state => {
      const newId = `strat-${Date.now().toString().slice(-4)}`;
      state.strategies.push({
        id: newId,
        name,
        pair,
        appType,
        committedAmounts: { WETH: 3.0, USDC: 10000.0 },
        tickLower: -1200,
        tickUpper: 1200,
        feeBps,
        status: "ACTIVE_NORMAL",
        effectiveLiquidityUSD: effectiveUSD
      });
    });

    closeModal();
    soundFX.playSuccess();
    showToast(`🚢 Successfully shipped strategy "${name}" to 1inch Aqua!`, "success");
    addLog(`[Ship] Registered new strategy to 1inch Aqua Router (Hash: 0x${Math.random().toString(16).slice(2, 10)}...)`, "success");
    renderVault();
  });

  // Simulate Swapper Fill
  btnSimSwap.addEventListener("click", () => {
    soundFX.playBeep(700, 0.12);
    AppState.update(state => {
      // Swapper Alice trades 2,500 USDC for 0.833 WETH directly against Bob's wallet
      state.walletBalances.USDC += 2500;
      state.walletBalances.WETH -= 0.833;
    });

    showToast("⚡ Swapper filled against your 1inch Aqua commitment! +2,500 USDC settled in your wallet.", "success");
    addLog("[Swap] Alice executed swap: +2,500 USDC received in Maker wallet, -0.833 WETH delivered atomically.", "info");
    renderVault();
  });

  // Listen for state changes
  window.addEventListener("aquaghost_state_change", renderVault);
});

function renderVault() {
  const state = AppState.get();

  // Displays
  document.getElementById("maker-wallet-display").textContent = shortAddress(state.makerAddress);
  document.getElementById("bal-weth").textContent = `${state.walletBalances.WETH.toFixed(2)} WETH`;
  document.getElementById("bal-usdc").textContent = `${state.walletBalances.USDC.toLocaleString()} USDC`;
  document.getElementById("bal-aave").textContent = `${state.walletBalances.AAVE.toFixed(2)} AAVE`;
  document.getElementById("bal-usdt").textContent = `${state.walletBalances.USDT.toLocaleString()} USDT`;

  // Total physical capital
  const physicalCapital = (state.walletBalances.WETH * 3000) + state.walletBalances.USDC + (state.walletBalances.AAVE * 100) + state.walletBalances.USDT;
  document.getElementById("val-physical-capital").textContent = formatUSD(physicalCapital);

  // Total effective liquidity
  const effectiveTotal = state.strategies.reduce((acc, s) => acc + s.effectiveLiquidityUSD, 0);
  document.getElementById("val-effective-liquidity").textContent = formatUSD(effectiveTotal);
  document.getElementById("val-active-strategies").textContent = `${state.strategies.length} Active`;

  // Render Table
  const tbody = document.getElementById("strategy-table-body");
  tbody.innerHTML = "";

  state.strategies.forEach(strat => {
    const tr = document.createElement("tr");

    const badgeClass = strat.status === "ACTIVE_NORMAL" ? "badge-normal" : "badge-defensive";
    const badgeText = strat.status === "ACTIVE_NORMAL" ? "● Normal Yield" : "🛡️ Shifted (Defensive)";

    tr.innerHTML = `
      <td>
        <div style="font-weight: 600;">${strat.name}</div>
        <div style="font-size: 0.75rem; color: var(--color-text-dim); font-family: var(--font-mono);">${strat.id}</div>
      </td>
      <td>
        <div>${strat.pair}</div>
        <div style="font-size: 0.75rem; color: var(--color-text-dim);">${strat.appType}</div>
      </td>
      <td>
        <div style="font-family: var(--font-mono); font-size: 0.82rem;">[${strat.tickLower}, ${strat.tickUpper}]</div>
        <div style="font-size: 0.75rem; color: var(--color-cyan);">${(strat.feeBps / 100).toFixed(2)}% Fee</div>
      </td>
      <td>
        <div style="font-weight: 700; color: var(--color-cyan); font-family: var(--font-mono);">
          ${formatUSD(strat.effectiveLiquidityUSD)}
        </div>
      </td>
      <td>
        <span class="status-badge ${badgeClass}">${badgeText}</span>
      </td>
      <td>
        <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.78rem;" onclick="dockStrategy('${strat.id}')">
          ⚓ Dock
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function dockStrategy(stratId) {
  soundFX.playBeep(450, 0.1);
  AppState.update(state => {
    const idx = state.strategies.findIndex(s => s.id === stratId);
    if (idx !== -1) {
      const removed = state.strategies.splice(idx, 1)[0];
      showToast(`⚓ Docked strategy "${removed.name}". Allocation virtualized.`, "info");
      addLog(`[Dock] Strategy ${stratId} docked from 1inch Aqua Router. Tokens remain 100% in wallet.`, "warn");
    }
  });
  renderVault();
}

function addLog(text, type = "info") {
  const logContainer = document.getElementById("vault-events-log");
  if (!logContainer) return;
  const entry = document.createElement("div");
  entry.className = "log-entry";
  const now = new Date().toTimeString().split(" ")[0];
  const typeClass = type === "success" ? "log-success" : type === "warn" ? "log-warn" : "log-info";
  entry.innerHTML = `
    <span class="log-time">[${now}]</span>
    <span class="${typeClass}">${text}</span>
  `;
  logContainer.prepend(entry);
}
