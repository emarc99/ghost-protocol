"use client";

import React, { useState } from "react";
import { PanelHeader } from "@/components/PanelHeader";
import { DepthChart } from "@/components/DepthChart";
import { AttackSimulator } from "@/components/AttackSimulator";
import { TerminalLog } from "@/components/TerminalLog";
import { useAquaGhostStore } from "@/lib/store";
import { soundFX } from "@/lib/sound";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  Gauge,
  Lock,
  Zap,
  CheckCircle2
} from "lucide-react";

export default function FirewallPage() {
  const { state, logs, addLog, updateState, toggleDefenseOverride } = useAquaGhostStore();
  const [isSimulatingSniper, setIsSimulatingSniper] = useState(false);
  const [showRevertBanner, setShowRevertBanner] = useState(false);

  const isDefenseActive = state.hookState.defenseActive;
  const currentFee = state.hookState.dynamicFeeBps;

  const handleSimulateSniper = () => {
    if (isSimulatingSniper) return;
    setIsSimulatingSniper(true);
    soundFX.playAlert();

    addLog(
      "[Mempool] Incoming sniper tx: 0xBAD0...0B07 calling PoolManager.modifyLiquidity() with $15M flash loan...",
      "alert"
    );

    setTimeout(() => {
      if (isDefenseActive) {
        soundFX.playAlert();
        setShowRevertBanner(true);

        addLog(
          "[Hook] beforeAddLiquidity() called by 0xBAD0...0B07. Defense Mode is ACTIVE.",
          "warn"
        );
        addLog(
          "[Firewall] REVERT TRIGGERED: AquaGhostHook.SniperAttackBlocked(0xBAD0...0B07, poolId)",
          "alert"
        );
        addLog(
          "[Result] Attack neutralized in mempool. 0 fees extracted by sniper bot. Honest LPs safe!",
          "success"
        );

        updateState((prev) => ({
          ...prev,
          hookState: {
            ...prev.hookState,
            totalAttacksBlocked: prev.hookState.totalAttacksBlocked + 1
          }
        }));

        setTimeout(() => {
          setIsSimulatingSniper(false);
          setTimeout(() => setShowRevertBanner(false), 5000);
        }, 1500);
      } else {
        soundFX.playBeep(350, 0.4, "sine");
        addLog(
          "[Warning] Sniper liquidity was accepted because defenseMode is inactive! Toggle defense override to block snipers.",
          "warn"
        );
        setTimeout(() => {
          setIsSimulatingSniper(false);
        }, 1200);
      }
    }, 800);
  };

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "14px" }}>
        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">UNISWAP v4 HOOK FIREWALL</div>
          <div style={{ fontSize: "16px", fontWeight: "500", color: isDefenseActive ? "var(--emerald)" : "var(--cyan)", margin: "6px 0 2px" }}>
            {isDefenseActive ? "ARMED (SURGE DEFENSE)" : "STANDBY MONITORING"}
          </div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
            Hook: 0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f
          </div>
        </div>

        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">DYNAMIC SWAP FEE TIER</div>
          <div style={{ fontSize: "20px", fontWeight: "500", color: isDefenseActive ? "var(--emerald)" : "var(--cyan)", margin: "4px 0 2px" }}>
            {(currentFee / 100).toFixed(2)}% ({currentFee} BPS)
          </div>
          <div style={{ fontSize: "9px", color: isDefenseActive ? "var(--emerald)" : "var(--amber)" }}>
            {isDefenseActive ? "Defensive Surge Fee Active" : "Standard Base Trading Tier"}
          </div>
        </div>

        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">ATTACKS INTERCEPTED</div>
          <div style={{ fontSize: "20px", fontWeight: "500", color: "var(--emerald)", margin: "4px 0 2px" }}>
            {state.hookState.totalAttacksBlocked} Attacks Blocked
          </div>
          <div style={{ fontSize: "9px", color: "var(--emerald)" }}>
            $0 Capital Siphoned
          </div>
        </div>

        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">LAST BLOCKED ATTACKER</div>
          <div style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--red)", margin: "8px 0 4px" }}>
            {state.hookState.lastBlockedAttacker.slice(0, 10)}...{state.hookState.lastBlockedAttacker.slice(-6)}
          </div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
            Mempool Blacklisted
          </div>
        </div>
      </div>

      {/* Main Grid: Pool Depth & Dynamic Fee Gauge + Attack Simulator */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "14px" }}>
        {/* Left: Pool Depth & Fee Gauge */}
        <section className="panel">
          <PanelHeader
            index="03.A"
            title="UNISWAP v4 // POOL LIQUIDITY DEPTH"
            tag={isDefenseActive ? "DEFENSE ACTIVE" : "NORMAL TIER"}
            tagType={isDefenseActive ? "success" : "default"}
          />

          <div style={{ padding: "14px" }}>
            <DepthChart sniperActive={isSimulatingSniper} />
          </div>

          <div style={{ padding: "14px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>MANUAL FIREWALL OVERRIDE</div>
              <div style={{ fontSize: "9px", color: isDefenseActive ? "var(--emerald)" : "var(--amber)", marginTop: "2px" }}>
                {isDefenseActive ? "Surge fee forced to 250 BPS" : "Baseline fee 30 BPS"}
              </div>
            </div>
            <button
              onClick={toggleDefenseOverride}
              className={`btn-cyber ${isDefenseActive ? "danger" : ""}`}
              style={{ fontSize: "10px", padding: "8px 14px" }}
            >
              {isDefenseActive ? "DISARM DEFENSE OVERRIDE" : "ENGAGE DEFENSE OVERRIDE"}
            </button>
          </div>
        </section>

        {/* Right: Interactive Sniper Interception Lab */}
        <section className="panel">
          <PanelHeader
            index="03.B"
            title="SNIPER ATTACK INTERCEPTION LAB"
            tag="INTERACTIVE"
            tagType="alert"
          />

          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "10px", lineHeight: "1.6" }}>
              In Uniswap v4, predatory bots attempt to add concentrated liquidity directly in front of large victim swaps and remove it immediately after (JIT liquidity sandwich).
            </p>

            <div style={{ padding: "12px", background: "#0a1317", border: "1px solid var(--border-default)", display: "flex", flexDirection: "column", gap: "8px", fontSize: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>HOOK BITMASK:</span>
                <span style={{ color: "var(--cyan)", fontFamily: "monospace" }}>beforeAddLiquidityFlag = true</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>SANDWICH CAPITAL:</span>
                <span style={{ color: "var(--red)", fontFamily: "monospace" }}>$15,000,000 FLASH LOAN</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>DEFENSE HOOK:</span>
                <span style={{ color: isDefenseActive ? "var(--emerald)" : "var(--amber)", fontFamily: "monospace" }}>
                  {isDefenseActive ? "REVERT_ON_SNIPER" : "ALLOW_ALL"}
                </span>
              </div>
            </div>

            <button
              onClick={handleSimulateSniper}
              disabled={isSimulatingSniper}
              className="btn-cyber danger"
              style={{ width: "100%", padding: "12px", fontSize: "11px" }}
            >
              <Play size={13} />
              <span>{isSimulatingSniper ? "SIMULATING SNIPER INJECTION..." : "SIMULATE JIT SNIPER INJECTION"}</span>
            </button>

            {/* Revert Banner */}
            {showRevertBanner && (
              <div className="revert-banner animated" style={{ margin: "4px 0 0" }}>
                <AlertTriangle size={22} color="#ff5d5d" />
                <div style={{ flex: 1 }}>
                  <b style={{ color: "#ff9180", fontSize: "10px" }}>
                    REVERT: SniperAttackBlocked(0xBAD0...0B07)
                  </b>
                  <div style={{ color: "#c47b70", fontSize: "9px", marginTop: "2px" }}>
                    Uniswap v4 Hook denied predatory liquidity injection.
                  </div>
                </div>
              </div>
            )}

            <div style={{ padding: "10px", background: "rgba(113, 228, 208, 0.05)", border: "1px solid rgba(113, 228, 208, 0.15)", fontSize: "9px", color: "var(--cyan)", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckCircle2 size={13} color="var(--cyan)" />
              <span>
                Honest makers on 1inch Aqua avoid MEV siphoning while keeping 100% custody of their funds.
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Events Log Stream */}
      <div style={{ marginTop: "14px" }}>
        <section className="panel">
          <PanelHeader
            index="03.C"
            title="UNISWAP v4 HOOK DEFENSE LOGS"
            tag="MONITORING"
            tagType="default"
          />
          <TerminalLog logs={logs} title="FIREWALL AUDIT TRAIL" maxHeight="200px" />
        </section>
      </div>
    </div>
  );
}
