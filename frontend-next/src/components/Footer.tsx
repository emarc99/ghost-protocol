"use client";

import React from "react";
import { ShieldCheck, Cpu, HardDrive, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer-bar">
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Cpu size={12} color="#71e4d0" />
          <span>ENCLAVE:</span>
          <b>AWS Nitro TEE (EIF #29401)</b>
        </span>

        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <HardDrive size={12} color="#e0b978" />
          <span>ROUTER:</span>
          <b>1inch Aqua v1 (SwapVM Active)</b>
        </span>

        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={12} color="#00f5a0" />
          <span>FIREWALL:</span>
          <b>Uniswap v4 beforeAddLiquidity (Active)</b>
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Globe size={12} color="#71e4d0" />
          <span>SPONSORS:</span>
          <b>Chainlink ⬡ // 1inch 🦄 // Uniswap Foundation 🦄 // The Graph 🌐</b>
        </span>
        <span style={{ color: "#71e4d0" }}>ETHGlobal Online 2026</span>
      </div>
    </footer>
  );
}
