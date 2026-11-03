"use client";

import React from "react";
import { ExternalLink, CheckCircle2, ShieldAlert, X } from "lucide-react";
import { OnChainTx } from "@/lib/types";

interface TxBannerProps {
  tx: OnChainTx | null | undefined;
  onDismiss?: () => void;
}

export function TxBanner({ tx, onDismiss }: TxBannerProps) {
  if (!tx) return null;

  return (
    <div
      className="panel animated"
      style={{
        marginBottom: "14px",
        background: "linear-gradient(90deg, rgba(0, 245, 160, 0.08) 0%, rgba(113, 228, 208, 0.04) 100%)",
        border: "1px solid rgba(0, 245, 160, 0.4)",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "14px",
        boxShadow: "0 0 20px rgba(0, 245, 160, 0.15)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(0, 245, 160, 0.15)",
            border: "1px solid var(--emerald)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <CheckCircle2 size={18} color="var(--emerald)" />
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="eyebrow" style={{ color: "var(--emerald)", fontSize: "9px" }}>
              CONFIRMED ON BASE SEPOLIA TESTNET
            </span>
            <span className="panel-tag success" style={{ fontSize: "8px", padding: "1px 5px" }}>
              BLOCK #{tx.blockNumber}
            </span>
          </div>

          <div style={{ fontSize: "13px", fontWeight: "600", color: "#fff", marginTop: "2px" }}>
            {tx.summary}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "3px", fontSize: "10px", fontFamily: "monospace" }}>
            <span style={{ color: "var(--text-muted)" }}>TX:</span>
            <span style={{ color: "var(--cyan)" }}>
              {tx.txHash.slice(0, 14)}...{tx.txHash.slice(-10)}
            </span>
            <span style={{ color: "var(--text-muted)" }}>•</span>
            <span style={{ color: "var(--text-muted)" }}>{tx.timestamp}</span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <a
          href={tx.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-cyber success"
          style={{
            padding: "8px 14px",
            fontSize: "10px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            textDecoration: "none",
            background: "rgba(0, 245, 160, 0.15)",
            borderColor: "var(--emerald)"
          }}
          title="Open transaction on BaseScan Sepolia Explorer"
        >
          <span>VIEW ON BASESCAN</span>
          <ExternalLink size={12} />
        </a>

        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px"
            }}
            title="Dismiss notification"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
