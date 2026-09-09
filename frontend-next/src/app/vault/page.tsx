"use client";

import React, { useState } from "react";
import { PanelHeader } from "@/components/PanelHeader";
import { TerminalLog } from "@/components/TerminalLog";
import { useAquaGhostStore } from "@/lib/store";
import { soundFX } from "@/lib/sound";
import {
  Layers,
  PlusCircle,
  Zap,
  Anchor,
  ShieldAlert,
  Code2,
  CheckCircle2,
  X
} from "lucide-react";

export default function VaultPage() {
  const {
    state,
    logs,
    addLog,
    dockStrategy,
    shipStrategy,
    simulateSwapperFill
  } = useAquaGhostStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStratName, setNewStratName] = useState("");
  const [newStratPair, setNewStratPair] = useState("WETH / USDC");
  const [newStratApp, setNewStratApp] = useState("1inch Aqua Constant Product");
  const [newStratFee, setNewStratFee] = useState(30);
  const [newStratAmount, setNewStratAmount] = useState(25000);

  const physicalCapital =
    state.walletBalances.WETH * 3000 +
    state.walletBalances.USDC +
    state.walletBalances.AAVE * 100 +
    state.walletBalances.USDT;

  const effectiveLiquidity = state.strategies.reduce(
    (acc, s) => acc + s.effectiveLiquidityUSD,
    0
  );

  const handleShipConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    shipStrategy({
      name: newStratName || "Custom Aqua Strategy",
      pair: newStratPair,
      appType: newStratApp,
      committedAmounts: { WETH: 3.0, USDC: 10000.0 },
      tickLower: -1200,
      tickUpper: 1200,
      feeBps: Number(newStratFee),
      effectiveLiquidityUSD: Number(newStratAmount)
    });
    setIsModalOpen(false);
    setNewStratName("");
  };

  return (
    <div>
      {/* Top Banner Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "14px",
          marginBottom: "14px"
        }}
      >
        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">PHYSICAL WALLET INVENTORY</div>
          <div style={{ fontSize: "20px", fontWeight: "500", color: "#edf9f7", margin: "6px 0 2px" }}>
            ${physicalCapital.toLocaleString()}
          </div>
          <div style={{ fontSize: "9px", color: "var(--amber)" }}>
            Non-custodial // Held in Maker Wallet
          </div>
        </div>

        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">VIRTUALIZED EFFECTIVE LIQUIDITY</div>
          <div style={{ fontSize: "20px", fontWeight: "500", color: "var(--cyan)", margin: "6px 0 2px" }}>
            ${effectiveLiquidity.toLocaleString()}
          </div>
          <div style={{ fontSize: "9px", color: "var(--cyan)" }}>
            {(effectiveLiquidity / (physicalCapital || 1)).toFixed(1)}x Capital Amplification
          </div>
        </div>

        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">ACTIVE 1INCH AQUA STRATEGIES</div>
          <div style={{ fontSize: "20px", fontWeight: "500", color: "#edf9f7", margin: "6px 0 2px" }}>
            {state.strategies.length} Active
          </div>
          <div style={{ fontSize: "9px", color: "var(--emerald)" }}>
            SwapVM Zero-Lock Virtual Routing
          </div>
        </div>

        <div className="panel" style={{ padding: "14px" }}>
          <div className="eyebrow">MAKER WALLET ADDRESS</div>
          <div style={{ fontSize: "14px", fontWeight: "500", color: "var(--cyan)", margin: "8px 0 4px", fontFamily: "monospace" }}>
            {state.makerAddress.slice(0, 8)}...{state.makerAddress.slice(-6)}
          </div>
          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>
            Anvil Node Account #0 (EOA)
          </div>
        </div>
      </div>

      {/* Main Grid: Strategies + SwapVM Inspector */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "14px" }}>
        {/* Left: Strategies Table */}
        <section className="panel">
          <div className="panel-header">
            <span className="panel-index">[01.A]</span>
            <h2>1INCH AQUA // ACTIVE STRATEGIES</h2>
            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              <button
                onClick={simulateSwapperFill}
                className="btn-cyber"
                style={{ fontSize: "9px", padding: "4px 8px" }}
              >
                <Zap size={11} />
                <span>SIMULATE FILL (+2.5K USDC)</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-cyber"
                style={{ fontSize: "9px", padding: "4px 8px", background: "rgba(113, 228, 208, 0.18)" }}
              >
                <PlusCircle size={11} />
                <span>SHIP NEW STRATEGY</span>
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="terminal-table">
              <thead>
                <tr>
                  <th>STRATEGY NAME</th>
                  <th>PAIR & APP</th>
                  <th>RANGE / FEE</th>
                  <th>VIRTUAL TVL</th>
                  <th>DEFENSE STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {state.strategies.map((strat) => {
                  const isShifted = strat.status === "DEFENSIVE_SHIFTED";
                  return (
                    <tr key={strat.id}>
                      <td>
                        <div style={{ fontWeight: 500, color: "#fff" }}>{strat.name}</div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {strat.id}
                        </div>
                      </td>
                      <td>
                        <div>{strat.pair}</div>
                        <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>{strat.appType}</div>
                      </td>
                      <td>
                        <div style={{ fontFamily: "monospace", fontSize: "10px" }}>
                          [{strat.tickLower}, {strat.tickUpper}]
                        </div>
                        <div style={{ fontSize: "9px", color: "var(--cyan)" }}>
                          {(strat.feeBps / 100).toFixed(2)}% Fee
                        </div>
                      </td>
                      <td>
                        <div style={{ color: "var(--cyan)", fontWeight: 500 }}>
                          ${strat.effectiveLiquidityUSD.toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <span className={`panel-tag ${isShifted ? "alert" : "success"}`}>
                          {isShifted ? "DEFENSIVE SHIFT" : "NORMAL YIELD"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => dockStrategy(strat.id)}
                          className="btn-cyber secondary"
                          style={{ fontSize: "8px", padding: "3px 6px" }}
                        >
                          <Anchor size={9} />
                          <span>DOCK</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--text-muted)" }}>
            <span>All commitments are verified off-chain. Zero gas cost to dock or adjust virtual ranges.</span>
            <span>Non-Custodial Architecture 🛡️</span>
          </div>
        </section>

        {/* Right: SwapVM Bytecode & Maker Inventory Breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Maker Balances */}
          <section className="panel">
            <PanelHeader
              index="01.B"
              title="PHYSICAL WALLET INVENTORY"
              tag="ZERO LOCK-IN"
              tagType="default"
            />
            <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #18282b" }}>
                <span>WETH</span>
                <b style={{ color: "var(--cyan)" }}>{state.walletBalances.WETH.toFixed(3)} WETH</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #18282b" }}>
                <span>USDC</span>
                <b style={{ color: "var(--cyan)" }}>{state.walletBalances.USDC.toLocaleString()} USDC</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #18282b" }}>
                <span>AAVE</span>
                <b style={{ color: "var(--cyan)" }}>{state.walletBalances.AAVE.toFixed(2)} AAVE</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                <span>USDT</span>
                <b style={{ color: "var(--cyan)" }}>{state.walletBalances.USDT.toLocaleString()} USDT</b>
              </div>
            </div>
          </section>

          {/* SwapVM Bytecode Inspector */}
          <section className="panel">
            <PanelHeader
              index="01.C"
              title="1INCH SWAPVM EXECUTION TRACE"
              tag="VERIFIED"
              tagType="success"
            />
            <div style={{ padding: "12px 14px", fontSize: "9px", fontFamily: "monospace", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div>OPCODE: <b>SWAPVM_EXECUTE_INPUT (0x4a)</b></div>
              <div>ROUTER: <b>0xc351628EB244ec633d5f21fBD6621e1a683B1181</b></div>
              <div>INPUT_TOKEN: <b>USDC (0x7bc06c...)</b></div>
              <div>OUTPUT_TOKEN: <b>WETH (0x7969c5...)</b></div>
              <div style={{ color: "var(--emerald)", marginTop: "4px" }}>
                ✓ Signature: EIP-712 Maker Order Valid
              </div>
              <div style={{ color: "var(--cyan)" }}>
                ✓ Enclave Shield: Attestation Hash Verified
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Events Log Stream */}
      <div style={{ marginTop: "14px" }}>
        <section className="panel">
          <PanelHeader
            index="01.D"
            title="1INCH AQUA ROUTER EVENT STREAM"
            tag="MONITORING"
            tagType="default"
          />
          <TerminalLog logs={logs} title="VAULT & SETTLEMENT EVENTS" maxHeight="180px" />
        </section>
      </div>

      {/* Modal: Ship New Strategy */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3, 7, 10, 0.8)",
            backdropFilter: "blur(6px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <div
            className="panel"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "20px",
              border: "1px solid var(--border-accent)",
              boxShadow: "0 0 40px rgba(113, 228, 208, 0.2)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: "var(--cyan)", fontWeight: 500 }}>
                [SHIP] NEW 1INCH AQUA STRATEGY
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleShipConfirm} style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "10px" }}>
              <div>
                <label style={{ display: "block", color: "var(--text-muted)", marginBottom: "4px" }}>
                  STRATEGY NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. WETH/USDC Dynamic Band"
                  value={newStratName}
                  onChange={(e) => setNewStratName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "#0a1317",
                    border: "1px solid var(--border-default)",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontSize: "11px"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", marginBottom: "4px" }}>
                  PAIR
                </label>
                <select
                  value={newStratPair}
                  onChange={(e) => setNewStratPair(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "#0a1317",
                    border: "1px solid var(--border-default)",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontSize: "11px"
                  }}
                >
                  <option value="WETH / USDC">WETH / USDC</option>
                  <option value="USDC / USDT">USDC / USDT</option>
                  <option value="WETH / AAVE">WETH / AAVE</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", color: "var(--text-muted)", marginBottom: "4px" }}>
                  APP TYPE
                </label>
                <select
                  value={newStratApp}
                  onChange={(e) => setNewStratApp(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "#0a1317",
                    border: "1px solid var(--border-default)",
                    color: "#fff",
                    fontFamily: "inherit",
                    fontSize: "11px"
                  }}
                >
                  <option value="1inch Aqua Constant Product">1inch Aqua Constant Product</option>
                  <option value="1inch Aqua Concentrated LP">1inch Aqua Concentrated LP</option>
                  <option value="1inch Aqua Flash Loan App">1inch Aqua Flash Loan App</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--text-muted)", marginBottom: "4px" }}>
                    FEE (BPS)
                  </label>
                  <input
                    type="number"
                    value={newStratFee}
                    onChange={(e) => setNewStratFee(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "#0a1317",
                      border: "1px solid var(--border-default)",
                      color: "#fff",
                      fontFamily: "inherit",
                      fontSize: "11px"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--text-muted)", marginBottom: "4px" }}>
                    EFFECTIVE USD
                  </label>
                  <input
                    type="number"
                    value={newStratAmount}
                    onChange={(e) => setNewStratAmount(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: "#0a1317",
                      border: "1px solid var(--border-default)",
                      color: "#fff",
                      fontFamily: "inherit",
                      fontSize: "11px"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-cyber secondary"
                  style={{ flex: 1, padding: "10px" }}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="btn-cyber"
                  style={{ flex: 1, padding: "10px", background: "var(--cyan)", color: "#070b10", fontWeight: "bold" }}
                >
                  CONFIRM & SHIP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
