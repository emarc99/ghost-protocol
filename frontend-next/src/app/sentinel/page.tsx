"use client";

import React, { useState } from "react";
import { PanelHeader } from "@/components/PanelHeader";
import { RadarView } from "@/components/RadarView";
import { TerminalLog } from "@/components/TerminalLog";
import { useAquaGhostStore } from "@/lib/store";
import { soundFX } from "@/lib/sound";
import {
  Radio,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Play,
  Globe,
  Key,
  CheckCircle2,
  Lock
} from "lucide-react";

export default function SentinelPage() {
  const { state, logs, addLog, updateState } = useAquaGhostStore();
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeAttestation, setActiveAttestation] = useState(state.sentinel.lastAttestation);

  // 1. Mempool Attack Simulation -> CRE TEE Defense
  const triggerMempoolDefense = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    soundFX.playAlert();

    addLog("[Threat Monitor] Predatory JIT sniper detected in public mempool: 0xBAD0...0B07", "alert");
    addLog("[Threat Monitor] Target: Uniswap v4 Pool (0x88e6...5640) | Flash loan: $15,000,000", "alert");

    // Phase 2: Enter TEE Enclave
    setTimeout(() => {
      soundFX.playBeep(850, 0.15);
      addLog("[CRE TEE] Invoking handlerInTee()... Reading pool depth from The Graph MCP client.", "info");
      addLog("[Guardrails] Math validation: shiftMagnitude=200 <= 500 (PASS), width=240 >= 60 (PASS)", "success");
    }, 1000);

    // Phase 3: Hardware Attestation & Signature
    setTimeout(() => {
      soundFX.playAttestation();
      const nonce = Date.now();
      const sig = `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

      const newAttestation = {
        action: "DEFENSIVE_SHIFT",
        tickLower: -201400,
        tickUpper: -201100,
        dynamicFeeBps: 200, // 2.00%
        nonce,
        signature: sig,
        signerAddress: state.enclaveAddress,
        timestamp: new Date().toTimeString().split(" ")[0] + " UTC"
      };

      setActiveAttestation(newAttestation);

      addLog(`[Enclave Signer] Direct attestation signed with enclave private key. Nonce: ${nonce}`, "success");
      addLog("[Workflow DON] Consensus reached across 4 DON nodes. Crossing confidentiality boundary.", "info");
      addLog("[AquaGhostApp] executeDefensiveShift() called: 1inch Aqua docked old range & shipped safe corridor.", "success");
      addLog("[Uniswap v4 Hook] setDefenseMode(active=true): sniper transactions intercepted with SniperAttackBlocked.", "success");

      updateState((prev) => ({
        ...prev,
        sentinel: {
          ...prev.sentinel,
          status: "DEFENSE_ACTIVE",
          isUnderAttack: true,
          lastAttestation: newAttestation
        },
        hookState: {
          ...prev.hookState,
          defenseActive: true,
          dynamicFeeBps: 200,
          totalAttacksBlocked: prev.hookState.totalAttacksBlocked + 1
        },
        strategies: prev.strategies.map((s, idx) =>
          idx === 0
            ? {
                ...s,
                status: "DEFENSIVE_SHIFTED",
                tickLower: -201400,
                tickUpper: -201100,
                feeBps: 200
              }
            : s
        )
      }));

      setIsEvaluating(false);
    }, 2400);
  };

  // 2. On-Demand HTTP Trigger
  const triggerHttpTrigger = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    soundFX.playBeep(900, 0.2);

    addLog("[HTTP Trigger] POST https://workflow.chain.link/api/v1/trigger/0056b79a payload: {\"forceDefensive\":true}", "info");

    setTimeout(() => {
      soundFX.playBeep(1100, 0.15);
      addLog("[CRE TEE] onHttpTrigger() executed in AWS Nitro Enclave. Ingested The Graph metrics.", "info");
      addLog("[Guardrails] Math verified: shiftMagnitude=240, feeBps=250 <= 10000 (PASS)", "success");
    }, 900);

    setTimeout(() => {
      soundFX.playSuccess();
      const nonce = Date.now();
      const sig = `0x${Array.from({ length: 130 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

      const newAttestation = {
        action: "HTTP_DEFENSIVE_SHIFT",
        tickLower: -201320,
        tickUpper: -201080,
        dynamicFeeBps: 250,
        nonce,
        signature: sig,
        signerAddress: state.enclaveAddress,
        timestamp: new Date().toTimeString().split(" ")[0] + " UTC"
      };

      setActiveAttestation(newAttestation);
      addLog(`[Enclave Signer] HTTP evaluation signed inside hardware TEE. Nonce: ${nonce}`, "success");

      updateState((prev) => ({
        ...prev,
        sentinel: {
          ...prev.sentinel,
          status: "DEFENSE_ACTIVE",
          lastAttestation: newAttestation
        },
        hookState: {
          ...prev.hookState,
          defenseActive: true,
          dynamicFeeBps: 250
        }
      }));

      setIsEvaluating(false);
    }, 1800);
  };

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">CHAINLINK RUNTIME ENVIRONMENT</div>
          <div style={{ fontSize: "16px", fontWeight: "500", color: "#edf9f7", margin: "6px 0 2px" }}>
            Confidential Workflow (TEE Enclave)
          </div>
          <div style={{ fontSize: "9px", color: "var(--cyan)" }}>
            Workflow ID: 0056b79a7857... (Registered on Private Registry)
          </div>
        </div>

        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">HARDWARE ISOLATION</div>
          <div style={{ fontSize: "16px", fontWeight: "500", color: "#edf9f7", margin: "6px 0 2px" }}>
            AWS Nitro Enclaves
          </div>
          <div style={{ fontSize: "9px", color: "var(--emerald)" }}>
            TPM PCR0 Hardware Sealed // EIF #29401
          </div>
        </div>

        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">DON CONSENSUS & SIGNER</div>
          <div style={{ fontSize: "16px", fontWeight: "500", color: "#edf9f7", margin: "6px 0 2px" }}>
            4 / 4 Nodes Active
          </div>
          <div style={{ fontSize: "9px", color: "var(--cyan)" }}>
            Secp256k1 Attestation Verifier
          </div>
        </div>
      </div>

      {/* Main Grid: Radar & Controls + Cryptographic Attestation Card */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "14px" }}>
        {/* Left: Radar + Trigger Actions */}
        <section className="panel">
          <PanelHeader
            index="02.A"
            title="CONFIDENTIAL TEE RADAR SCOPE"
            tag={state.sentinel.status}
            tagType={state.sentinel.status === "DEFENSE_ACTIVE" ? "alert" : "success"}
          />

          <RadarView
            isUnderAttack={state.sentinel.isUnderAttack || isEvaluating}
            statusLabel={
              isEvaluating
                ? "EVALUATING RISK MATRIX INSIDE HARDWARE TEE..."
                : state.sentinel.status === "DEFENSE_ACTIVE"
                ? "DEFENSE ACTIVE // 1INCH AQUA REPOSITIONED"
                : "DON STANDBY // ZERO LEAKAGE MEMPOOL MONITORING"
            }
            subLabel="All private inputs and trade execution calculations execute inside AWS Nitro Enclaves. Only attested signatures cross the consensus boundary."
          />

          {/* Trigger Control Strip */}
          <div style={{ padding: "16px", borderTop: "1px solid var(--border-subtle)", background: "rgba(0,0,0,0.2)" }}>
            <div className="eyebrow" style={{ marginBottom: "10px" }}>
              INTERACTIVE SENTINEL EVALUATION TRIGGERS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                onClick={triggerMempoolDefense}
                disabled={isEvaluating}
                className="btn-cyber danger"
                style={{ padding: "12px 10px", fontSize: "10px" }}
              >
                <Play size={12} />
                <span>TRIGGER MEMPOOL THREAT SIM</span>
              </button>

              <button
                onClick={triggerHttpTrigger}
                disabled={isEvaluating}
                className="btn-cyber"
                style={{ padding: "12px 10px", fontSize: "10px" }}
              >
                <Globe size={12} />
                <span>DISPATCH HTTP TRIGGER</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right: Cryptographic Attestation Card */}
        <section className="panel">
          <PanelHeader
            index="02.B"
            title="HARDWARE TEE ATTESTATION CARD"
            tag="SECP256K1 SIGNED"
            tagType="success"
          />

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span className="eyebrow">ATTESTATION STATUS</span>
              <span className="panel-tag success">
                <CheckCircle2 size={10} style={{ display: "inline", marginRight: "4px" }} />
                PCR0 HARDWARE VALIDATED
              </span>
            </div>

            <div>
              <span className="metric-label">DIRECTIVE ACTION</span>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--cyan)", marginTop: "2px" }}>
                {activeAttestation?.action || "BASE_MONITORING"}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <span className="metric-label">SAFE TICKS</span>
                <div style={{ fontSize: "12px", fontFamily: "monospace", color: "#fff", marginTop: "2px" }}>
                  [{activeAttestation?.tickLower}, {activeAttestation?.tickUpper}]
                </div>
              </div>
              <div>
                <span className="metric-label">DYNAMIC SURGE FEE</span>
                <div style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--emerald)", marginTop: "2px" }}>
                  {activeAttestation?.dynamicFeeBps} BPS ({((activeAttestation?.dynamicFeeBps || 0) / 100).toFixed(2)}%)
                </div>
              </div>
            </div>

            <div>
              <span className="metric-label">NONCE & TIMESTAMP</span>
              <div style={{ fontSize: "11px", fontFamily: "monospace", color: "var(--text-secondary)", marginTop: "2px" }}>
                {activeAttestation?.nonce} // {activeAttestation?.timestamp}
              </div>
            </div>

            <div>
              <span className="metric-label">ENCLAVE SIGNER ADDRESS</span>
              <div style={{ fontSize: "10px", fontFamily: "monospace", color: "var(--cyan)", wordBreak: "break-all", marginTop: "2px" }}>
                {activeAttestation?.signerAddress}
              </div>
            </div>

            <div>
              <span className="metric-label">HARDWARE SIGNATURE (ECDSA)</span>
              <div style={{ fontSize: "9px", fontFamily: "monospace", color: "var(--amber)", wordBreak: "break-all", background: "#05080c", padding: "8px", border: "1px solid #1f3336", marginTop: "4px" }}>
                {activeAttestation?.signature}
              </div>
            </div>

            <div style={{ marginTop: "4px", padding: "10px", background: "rgba(0, 245, 160, 0.05)", border: "1px solid rgba(0, 245, 160, 0.2)", fontSize: "9px", color: "var(--emerald)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Lock size={14} color="var(--emerald)" />
              <span>
                Zero Data Leakage: Swapper parameters, maker balance inventory, and pricing calculations remain strictly inside the AWS Nitro enclave.
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Attestation & Execution Stream */}
      <div style={{ marginTop: "14px" }}>
        <section className="panel">
          <PanelHeader
            index="02.C"
            title="CHAINLINK CRE // NITRO ENCLAVE LOG STREAM"
            tag="MONITORING"
            tagType="default"
          />
          <TerminalLog logs={logs} title="CONFIDENTIAL RUNTIME TRACES" maxHeight="200px" />
        </section>
      </div>
    </div>
  );
}
