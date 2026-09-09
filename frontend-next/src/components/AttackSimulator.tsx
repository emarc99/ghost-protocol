"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, Play, ArrowRight } from "lucide-react";
import { soundFX } from "@/lib/sound";

interface AttackSimulatorProps {
  defenseActive: boolean;
  onAttackTriggered: () => void;
}

export function AttackSimulator({ defenseActive, onAttackTriggered }: AttackSimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [shipMoving, setShipMoving] = useState(false);
  const [showRevertBanner, setShowRevertBanner] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("SYSTEM READY // STANDBY FOR SIMULATION");

  const runAttackSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setShowRevertBanner(false);
    setStatusMessage("INJECTING PREDATORY MEV SANDWICH INTO MEMPOOL...");
    soundFX.playAlert();

    // Trigger ship movement
    setTimeout(() => {
      setShipMoving(true);
      setStatusMessage("BOT TRAVERSING TO UNISWAP v4 HOOK FIREWALL...");
      soundFX.playBeep(850, 0.2, "sawtooth");
    }, 300);

    // Hit firewall
    setTimeout(() => {
      if (defenseActive) {
        soundFX.playAlert();
        setShowRevertBanner(true);
        setStatusMessage("ATTACK INTERCEPTED! REVERT TRIGGERED BY HOOK.");
        onAttackTriggered();
      } else {
        soundFX.playBeep(300, 0.4, "sine");
        setStatusMessage("FIREWALL INACTIVE! SANDWICH EXTRACTED $14,200 PROFIT.");
      }

      // Reset ship
      setTimeout(() => {
        setShipMoving(false);
        setIsSimulating(false);
      }, 2000);
    }, 1800);
  };

  return (
    <div>
      <div style={{ padding: "16px" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "10px", lineHeight: "1.6", marginBottom: "12px" }}>
          Simulates a predatory JIT bot firing a $15M flash-loan sandwich attack targeting victim swaps in the Uniswap v4 pool.
        </p>

        <button
          onClick={runAttackSimulation}
          disabled={isSimulating}
          className={`btn-cyber danger`}
          style={{ width: "100%", padding: "12px", fontSize: "11px" }}
        >
          <Play size={13} />
          <span>{isSimulating ? "SIMULATING ATTACK RUN..." : "TRIGGER MEV SNIPER ATTACK"}</span>
        </button>
      </div>

      {/* Attack Stage Animation */}
      <div className="attack-stage">
        <div className="stage-grid" />
        <div className="stage-line" />

        <div className="stage-label left">
          MEMPOOL<br />
          <b>INCOMING TX</b>
        </div>

        {/* The Aqua/Sniper Ship */}
        <div className={`aqua-ship ${shipMoving ? "moving" : ""}`}>
          <div className="ship-body">
            <AlertTriangle size={11} color="#ef987e" />
            <span>0xBAD0...0B07</span>
          </div>
          {shipMoving && <div className="ship-trail" />}
        </div>

        <div className="stage-label right">
          HOOK GUARD<br />
          <b>BEFORE_ADD</b>
        </div>
      </div>

      {/* Revert Banner */}
      {showRevertBanner && (
        <div className="revert-banner animated">
          <AlertTriangle size={24} color="#ff5d5d" />
          <div style={{ flex: 1 }}>
            <b style={{ color: "#ff9180", fontSize: "10px", letterSpacing: "0.08em" }}>
              REVERT TRIGGERED: AquaGhostHook.SniperAttackBlocked
            </b>
            <div style={{ color: "#c47b70", fontSize: "9px", marginTop: "3px" }}>
              Bot transaction cancelled atomically in beforeAddLiquidity(). Zero fees extracted.
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "9px", color: "#d98579" }}>MEV PROTECTED</span>
            <div style={{ fontSize: "11px", fontWeight: "bold", color: "#00f5a0" }}>$15,000,000</div>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderTop: "1px solid var(--border-subtle)", fontSize: "9px" }}>
        <span style={{ color: isSimulating ? "var(--amber)" : "var(--text-muted)" }}>
          {statusMessage}
        </span>
        <span style={{ color: defenseActive ? "var(--emerald)" : "var(--red)" }}>
          FIREWALL: {defenseActive ? "ARMED (2.50%)" : "DISARMED (0.30%)"}
        </span>
      </div>
    </div>
  );
}
