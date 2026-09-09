"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PanelHeader } from "@/components/PanelHeader";
import { RadarView } from "@/components/RadarView";
import { DepthChart } from "@/components/DepthChart";
import { AttackSimulator } from "@/components/AttackSimulator";
import { TerminalLog } from "@/components/TerminalLog";
import { useAquaGhostStore } from "@/lib/store";
import { soundFX } from "@/lib/sound";
import { Shield, Radio, Layers, ArrowUpRight, CheckCircle2, Zap, Play } from "lucide-react";

export default function MissionControlPage() {
  const {
    state,
    logs,
    addLog,
    updateState,
    dockStrategy,
    simulateSwapperFill,
    toggleDefenseOverride
  } = useAquaGhostStore();

  const [sniperSimActive, setSniperSimActive] = useState(false);

  // Total physical and effective liquidity
  const physicalCapital =
    state.walletBalances.WETH * 3000 +
    state.walletBalances.USDC +
    state.walletBalances.AAVE * 100 +
    state.walletBalances.USDT;

  const effectiveLiquidity = state.strategies.reduce(
    (acc, s) => acc + s.effectiveLiquidityUSD,
    0
  );

  const handleAttackTriggered = () => {
    setSniperSimActive(true);
    addLog(
      "[Firewall] REVERT TRIGGERED: AquaGhostHook.SniperAttackBlocked(0xBAD0...0B07, poolId)",
      "alert"
    );
    addLog(
      "[Result] 15,000,000 flash loan rejected. Zero fees drained. Honest LP positions safe!",
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
      setSniperSimActive(false);
    }, 4000);
  };

  return (
    <div>
      {/* 3-Panel Main Dashboard Grid */}
      <div className="dashboard-grid">
        {/* PANEL A: 1inch Aqua JIT Liquidity */}
        <section className="panel">
          <PanelHeader
            index="PANEL A"
            title="1INCH AQUA // JIT LIQUIDITY"
            tag="NON-CUSTODIAL"
            tagType="success"
          />

          <div className="metric-row">
            <div className="metric-item">
              <span className="metric-label">EFFECTIVE LIQUIDITY</span>
              <span className="metric-value">
                ${effectiveLiquidity.toLocaleString()}
              </span>
              <span className="metric-sub">
                +{state.strategies.length} Active Strats
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">PHYSICAL CAPITAL</span>
              <span className="metric-value">
                ${physicalCapital.toLocaleString()}
              </span>
              <span className="metric-sub" style={{ color: "var(--amber)" }}>
                In Maker Wallet
              </span>
            </div>
          </div>

          <div style={{ padding: "0 14px 10px" }}>
            <DepthChart sniperActive={sniperSimActive} />
          </div>

          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              SwapVM: <b>ACTIVE</b> // ZERO-LOCK TRADING
            </span>
            <Link
              href="/vault"
              className="btn-cyber"
              onClick={() => soundFX.playClick()}
            >
              <span>EXPLORE VAULT</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </section>

        {/* PANEL B: Chainlink CRE Nitro Sentinel */}
        <section className="panel">
          <PanelHeader
            index="PANEL B"
            title="CHAINLINK CRE // NITRO ENCLAVE"
            tag={state.sentinel.status}
            tagType={
              state.sentinel.status === "DEFENSE_ACTIVE"
                ? "alert"
                : "default"
            }
          />

          <RadarView
            isUnderAttack={state.sentinel.isUnderAttack || sniperSimActive}
            statusLabel={
              state.sentinel.isUnderAttack || sniperSimActive
                ? "CRITICAL ALERT: MEMPOOL SNIPER BOT DETECTED!"
                : "DON NODES 4/4 // AWS NITRO TEE MONITORING"
            }
            subLabel={
              state.sentinel.isUnderAttack || sniperSimActive
                ? "Target: Uniswap v4 Pool 0x88e6...5640 | Capital: $15,000,000"
                : "Hardware-enforced confidentiality. Attestations signed inside hardware enclave."
            }
          />

          {/* Attestation Readout */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid var(--border-subtle)",
              fontSize: "9px"
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px"
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>PCR0 HASH:</span>
              <span style={{ color: "var(--cyan)", fontFamily: "monospace" }}>
                {state.sentinel.pcr0.slice(0, 18)}...{state.sentinel.pcr0.slice(-8)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px"
              }}
            >
              <span style={{ color: "var(--text-muted)" }}>ENCLAVE SIGNER:</span>
              <span style={{ color: "#fff", fontFamily: "monospace" }}>
                {state.sentinel.lastAttestation?.signerAddress.slice(0, 10)}...
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>WORKFLOW ID:</span>
              <span style={{ color: "var(--amber)", fontFamily: "monospace" }}>
                0056b79a7857...
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              HTTP TRIGGER // CRON TRIGGER READY
            </span>
            <Link
              href="/sentinel"
              className="btn-cyber"
              onClick={() => soundFX.playClick()}
            >
              <span>OPEN SENTINEL</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </section>

        {/* PANEL C: Uniswap v4 Anti-Sniper Firewall */}
        <section className="panel">
          <PanelHeader
            index="PANEL C"
            title="UNISWAP v4 // HOOK FIREWALL"
            tag={
              state.hookState.defenseActive
                ? "ARMED (2.50%)"
                : "STANDBY (0.30%)"
            }
            tagType={state.hookState.defenseActive ? "success" : "default"}
          />

          <div className="metric-row">
            <div className="metric-item">
              <span className="metric-label">DYNAMIC SWAP FEE</span>
              <span
                className="metric-value"
                style={{
                  color: state.hookState.defenseActive
                    ? "var(--emerald)"
                    : "var(--cyan)"
                }}
              >
                {(state.hookState.dynamicFeeBps / 100).toFixed(2)}%
              </span>
              <span className="metric-sub">
                {state.hookState.dynamicFeeBps} BPS
              </span>
            </div>
            <div className="metric-item">
              <span className="metric-label">ATTACKS INTERCEPTED</span>
              <span
                className="metric-value"
                style={{ color: "var(--emerald)" }}
              >
                {state.hookState.totalAttacksBlocked}
              </span>
              <span className="metric-sub" style={{ color: "var(--emerald)" }}>
                $0 Lost to MEV
              </span>
            </div>
          </div>

          {/* Interactive Attack Simulator */}
          <AttackSimulator
            defenseActive={state.hookState.defenseActive}
            onAttackTriggered={handleAttackTriggered}
          />

          <div
            style={{
              padding: "10px 14px",
              borderTop: "1px solid var(--border-subtle)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <button
              onClick={toggleDefenseOverride}
              className="btn-cyber secondary"
              style={{ fontSize: "9px" }}
            >
              {state.hookState.defenseActive
                ? "DISARM FIREWALL"
                : "ARM FIREWALL OVERRIDE"}
            </button>
            <Link
              href="/firewall"
              className="btn-cyber"
              onClick={() => soundFX.playClick()}
            >
              <span>FIREWALL DETAILS</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
        </section>
      </div>

      {/* Bottom Row: System Event Stream & Architecture Highlights */}
      <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "14px" }}>
        <section className="panel">
          <PanelHeader
            index="PANEL D"
            title="REAL-TIME ATTESTATION & EXECUTION LOGS"
            tag="STREAMING"
            tagType="default"
          />
          <TerminalLog logs={logs} title="GLOBAL AUDIT TRAIL" maxHeight="200px" />
        </section>

        <section className="panel" style={{ padding: "16px" }}>
          <div className="eyebrow" style={{ marginBottom: "8px" }}>
            ARCHITECTURE HIGHLIGHTS
          </div>
          <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#efffff", marginBottom: "12px", letterSpacing: "0.08em" }}>
            Zero-Collateral JIT Liquidity Firewall
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "10px", color: "var(--text-secondary)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <CheckCircle2 size={13} color="var(--cyan)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                <b>1inch Aqua Router</b> allows makers to commit capital across multiple strategies without locking tokens in smart contracts.
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <CheckCircle2 size={13} color="var(--cyan)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                <b>Chainlink CRE in AWS Nitro TEE</b> performs confidential off-chain risk evaluation and signs hardware-attested reposition directives.
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
              <CheckCircle2 size={13} color="var(--cyan)" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>
                <b>Uniswap v4 Hook</b> dynamically calculates surge fees and reverts predatory MEV snipers inside <code>beforeAddLiquidity()</code>.
              </span>
            </div>
          </div>

          <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: "10px" }}>
            <button
              onClick={simulateSwapperFill}
              className="btn-cyber"
              style={{ flex: 1, fontSize: "9px" }}
            >
              <Zap size={11} />
              <span>SIMULATE SWAP FILL</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
