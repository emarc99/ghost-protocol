/**
 * AquaGhost Protocol - Sentinel Page Interactions (Chainlink CRE in AWS Nitro TEE)
 */

document.addEventListener("DOMContentLoaded", () => {
  const btnTriggerAttack = document.getElementById("btn-trigger-attack");
  const radarThreatDot = document.getElementById("radar-threat-dot");
  const radarStatusLabel = document.getElementById("radar-status-label");
  const radarSubLabel = document.getElementById("radar-sub-label");
  const sentinelStatusPill = document.getElementById("sentinel-status-pill");
  const sentinelStatusText = document.getElementById("sentinel-status-text");

  let attackInProgress = false;

  // On-Demand HTTP Trigger Handler (Chainlink CRE HTTPCapability)
  const btnTriggerHttp = document.getElementById("btn-trigger-http");
  if (btnTriggerHttp) {
    btnTriggerHttp.addEventListener("click", () => {
      if (attackInProgress) return;
      attackInProgress = true;
      soundFX.playBeep(900, 0.2);

      showToast("🌐 Dispatching on-demand HTTP trigger to Chainlink CRE...", "info");
      addLog("[HTTP POST] POST https://workflow.chain.link/api/v1/trigger/0056b79a payload: {\"forceDefensive\":true,\"riskThresholdBps\":150}", "info");

      setTimeout(() => {
        soundFX.playBeep(1100, 0.15);
        addLog("[CRE TEE] onHttpTrigger() invoked inside AWS Nitro TEE (us-west-2). Ingesting pool metrics from The Graph MCP.", "info");
        addLog("[Guardrails] Math invariants validated: shiftMagnitude=240, width=240, feeBps=250 <= 10000 (PASS)", "success");
      }, 900);

      setTimeout(() => {
        soundFX.playSuccess();
        const nonce = Date.now();
        const action = "DEFENSIVE_SHIFT";
        const newTickLower = -201320;
        const newTickUpper = -201080;
        const newFeeBps = 250; // 2.50% dynamic fee

        // Update Attestation Card
        document.getElementById("attestation-badge").textContent = "HTTP ATTESTATION";
        document.getElementById("attestation-badge").className = "status-badge badge-defensive";
        document.getElementById("attest-action").textContent = `${action} [HTTP]`;
        document.getElementById("attest-ticks").textContent = `[${newTickLower}, ${newTickUpper}]`;
        document.getElementById("attest-fee").textContent = `${newFeeBps} BPS (2.50%)`;
        document.getElementById("attest-nonce").textContent = nonce;

        const attestationSig = `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
        document.getElementById("attest-sig").textContent = attestationSig;

        addLog(`[Signer] Attestation signed inside hardware TEE with enclave private key. Nonce: ${nonce}`, "success");
        addLog("[Workflow DON] Consensus reached on HTTP report: DEFENSIVE_SHIFT verified by DON nodes.", "success");

        AppState.update(state => {
          state.sentinel.status = "DEFENSE_ACTIVE";
          state.hookState.defenseActive = true;
          state.hookState.dynamicFeeBps = newFeeBps;
          if (state.strategies.length > 0) {
            state.strategies[0].status = "DEFENSIVE_SHIFTED";
            state.strategies[0].tickLower = newTickLower;
            state.strategies[0].tickUpper = newTickUpper;
            state.strategies[0].feeBps = newFeeBps;
          }
        });

        showToast("🛡️ Enclave verified HTTP on-demand evaluation! Defenses engaged.", "success");
        attackInProgress = false;
      }, 2000);
    });
  }

  btnTriggerAttack.addEventListener("click", () => {
    if (attackInProgress) return;
    attackInProgress = true;
    soundFX.playAlert();

    // Step 1: Detect Mempool Threat
    radarThreatDot.style.display = "block";
    radarStatusLabel.textContent = "CRITICAL ALERT: PREDATORY JIT SNIPER DETECTED!";
    radarStatusLabel.style.color = "var(--color-crimson)";
    radarSubLabel.textContent = "Attacker: 0xBAD0...0B07 | Target: Pool 0x88e6...5640 | Capital: $15,000,000";
    sentinelStatusPill.style.background = "rgba(255, 0, 85, 0.15)";
    sentinelStatusPill.style.borderColor = "var(--color-crimson)";
    sentinelStatusText.textContent = "ENCLAVE: THREAT ENGAGED";
    sentinelStatusText.style.color = "var(--color-crimson)";

    showToast("🚨 Predatory JIT Sniper bot detected wrapping a 2.5M USDC victim swap!", "alert");
    addLog("[Threat] Mempool monitor detected $15,000,000 flash-loan sandwich from 0xBAD0...0B07", "alert");

    // Step 2: Trigger handlerInTee
    setTimeout(() => {
      soundFX.playBeep(800, 0.15);
      addLog("[CRE TEE] Triggering handlerInTee()... Reading tick depth from The Graph MCP client.", "info");
      addLog("[Guardrails] Validating defense bounds: shiftMagnitude=200 <= 500 (PASS), width=240 >= 60 (PASS)", "success");
    }, 1000);

    // Step 3: LLM & Enclave Decision + Attestation Signing
    setTimeout(() => {
      soundFX.playSuccess();
      const nonce = Date.now();
      const action = "DEFENSIVE_SHIFT";
      const newTickLower = -201400;
      const newTickUpper = -201100;
      const newFeeBps = 200; // 2.00% dynamic fee

      // Update Attestation Card
      document.getElementById("attestation-badge").textContent = "SIGNED ATTESTATION";
      document.getElementById("attestation-badge").className = "status-badge badge-defensive";
      document.getElementById("attest-action").textContent = action;
      document.getElementById("attest-ticks").textContent = `[${newTickLower}, ${newTickUpper}]`;
      document.getElementById("attest-fee").textContent = `${newFeeBps} BPS (2.00%)`;
      document.getElementById("attest-nonce").textContent = nonce;
      
      const attestationSig = `0x${Array.from({length: 130}, () => Math.floor(Math.random()*16).toString(16)).join("")}`;
      document.getElementById("attest-sig").textContent = attestationSig;

      addLog(`[Signer] Attestation signed inside AWS Nitro TEE with enclave private key. Nonce: ${nonce}`, "success");
      addLog("[DON] Crossing confidentiality boundary to Workflow DON: consensus achieved.", "info");

      // Update Global State: Reposition Aqua Strategy & Engage Uniswap Hook
      AppState.update(state => {
        state.sentinel.status = "DEFENSE_ACTIVE";
        state.sentinel.isUnderAttack = true;
        state.hookState.defenseActive = true;
        state.hookState.dynamicFeeBps = newFeeBps;
        state.hookState.totalAttacksBlocked += 1;

        // Shift 1inch Aqua Strategy #1 defensively
        if (state.strategies.length > 0) {
          state.strategies[0].status = "DEFENSIVE_SHIFTED";
          state.strategies[0].tickLower = newTickLower;
          state.strategies[0].tickUpper = newTickUpper;
          state.strategies[0].feeBps = newFeeBps;
        }
      });

      showToast("🛡️ Attestation verified! 1inch Aqua docked old range & shipped safe corridor. Uniswap v4 Hook engaged!", "success");
      addLog("[Aqua] AquaGhostApp.executeDefensiveShift() called: aqua.dock() old strategy, aqua.ship() safe tick range.", "success");
      addLog("[Hook] AquaGhostHook.setDefenseMode(active=true): sniper transactions intercepted with SniperAttackBlocked.", "success");

      setTimeout(() => {
        attackInProgress = false;
      }, 2000);

    }, 2400);
  });
});

function addLog(text, type = "info") {
  const logContainer = document.getElementById("sentinel-logs");
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
