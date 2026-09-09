"use client";

import React from "react";

interface DepthChartProps {
  sniperActive?: boolean;
}

export function DepthChart({ sniperActive = false }: DepthChartProps) {
  // Mock orderbook depth data
  const bids = [
    { height: 35, vol: "$120K" },
    { height: 50, vol: "$210K" },
    { height: 68, vol: "$340K" },
    { height: 85, vol: "$510K" },
    { height: 95, vol: "$780K" },
    { height: 75, vol: "$420K" },
    { height: 60, vol: "$290K" }
  ];

  const asks = [
    { height: 55, vol: "$280K" },
    { height: 72, vol: "$410K" },
    { height: 88, vol: "$620K" },
    { height: 98, vol: "$850K" },
    { height: 80, vol: "$490K" },
    { height: 62, vol: "$310K" },
    { height: 40, vol: "$150K" }
  ];

  return (
    <div>
      <div className="chart-frame">
        <div className="y-axis">
          <span>1.0M</span>
          <span>750K</span>
          <span>500K</span>
          <span>250K</span>
          <span>0</span>
        </div>

        <div className="depth-chart">
          <div className="grid-lines" />

          <div className="bars-container">
            {/* Bids */}
            {bids.map((b, i) => (
              <div
                key={`bid-${i}`}
                className="depth-bar bid"
                style={{ height: `${b.height}%` }}
                title={`Bid Tick ${-201200 + i * 20}: ${b.vol}`}
              />
            ))}

            {/* Injected Sniper Bar when active */}
            {sniperActive && (
              <div
                className="depth-bar sniper"
                style={{ height: "100%", width: "16px", zIndex: 5 }}
                title="PREDATORY JIT SNIPER: $15,000,000 FLASH LIQUIDITY"
              />
            )}

            {/* Asks */}
            {asks.map((a, i) => (
              <div
                key={`ask-${i}`}
                className="depth-bar ask"
                style={{ height: `${a.height}%` }}
                title={`Ask Tick ${-201060 + i * 20}: ${a.vol}`}
              />
            ))}
          </div>

          <div className="price-line">
            <span>SPOT: $3,000.42 USDC</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px 14px", borderTop: "1px solid var(--border-subtle)", fontSize: "9px", color: "var(--text-muted)" }}>
        <div style={{ display: "flex", gap: "16px" }}>
          <span>
            <span style={{ display: "inline-block", width: "7px", height: "7px", background: "var(--cyan)", marginRight: "5px" }} />
            BIDS (AQUA LP JIT)
          </span>
          <span>
            <span style={{ display: "inline-block", width: "7px", height: "7px", background: "var(--amber)", marginRight: "5px" }} />
            ASKS (CONCENTRATED)
          </span>
          {sniperActive && (
            <span style={{ color: "var(--red)" }}>
              <span style={{ display: "inline-block", width: "7px", height: "7px", background: "var(--red)", marginRight: "5px" }} />
              SNIPER INJECTION (REVERTED)
            </span>
          )}
        </div>
        <div>
          SPREAD: <b style={{ color: "var(--cyan)", fontWeight: 400 }}>0.012%</b>
        </div>
      </div>
    </div>
  );
}
