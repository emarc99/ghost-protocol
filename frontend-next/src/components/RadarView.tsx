"use client";

import React from "react";
import { soundFX } from "@/lib/sound";

interface RadarViewProps {
  isUnderAttack?: boolean;
  statusLabel?: string;
  subLabel?: string;
}

export function RadarView({
  isUnderAttack = false,
  statusLabel = "DON NODES 4/4 // TEE RUNTIME ACTIVE",
  subLabel = "Mempool stream clear. No predatory flash-loans detected."
}: RadarViewProps) {
  return (
    <div className="radar-wrap">
      <div className="radar" onClick={() => soundFX.playRadarSweep()} style={{ cursor: "crosshair" }}>
        <div className="radar-ring" />
        <div className="radar-ring ring-two" />
        <div className="radar-ring ring-three" />
        <div className="radar-sweep" />

        <div className="radar-core">⬡</div>

        {/* DON Nodes */}
        <div className="radar-node" style={{ top: "28px", left: "54px" }} title="DON Node 1: Online" />
        <div className="radar-node" style={{ top: "82px", right: "24px" }} title="DON Node 2: Online" />
        <div className="radar-node" style={{ bottom: "28px", left: "34px" }} title="DON Node 3: Online" />
        <div className="radar-node" style={{ top: "52px", left: "24px" }} title="DON Node 4: Online" />

        {/* Threat Node (when under attack) */}
        {isUnderAttack && (
          <div
            className="radar-threat"
            style={{ top: "68px", left: "96px" }}
            title="THREAT: Predatory JIT Sniper (0xBAD0...0B07)"
          />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
        <div style={{ fontSize: "11px", letterSpacing: "0.1em" }}>
          <strong style={{ color: isUnderAttack ? "var(--red)" : "#ebf9f5", fontWeight: 500 }}>
            {statusLabel}
          </strong>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "10px", lineHeight: "1.5" }}>
          {subLabel}
        </p>

        <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "6px", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "9px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
            <span>DON-01 [AWS-US-EAST]</span>
            <b style={{ color: "var(--cyan)", fontWeight: 400 }}>99.98% / TEE VALIDATED</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
            <span>DON-02 [AWS-EU-CENTRAL]</span>
            <b style={{ color: "var(--cyan)", fontWeight: 400 }}>99.99% / TEE VALIDATED</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
            <span>DON-03 [GCP-US-WEST]</span>
            <b style={{ color: "var(--cyan)", fontWeight: 400 }}>100.0% / TEE VALIDATED</b>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
            <span>DON-04 [EQUINIX-METAL]</span>
            <b style={{ color: "var(--cyan)", fontWeight: 400 }}>99.97% / TEE VALIDATED</b>
          </div>
        </div>
      </div>
    </div>
  );
}
