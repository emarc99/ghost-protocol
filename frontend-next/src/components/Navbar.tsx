"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBlockNumber } from "wagmi";
import { Shield, Zap, Radio, Layers, Terminal } from "lucide-react";
import { soundFX } from "@/lib/sound";

export function Navbar() {
  const pathname = usePathname();
  const { isConnected, address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const [timeStr, setTimeStr] = useState("00:00:00 UTC");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(" ")[0] + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { href: "/", label: "CONTROL", index: "00", icon: Terminal },
    { href: "/vault", label: "AQUA VAULT", index: "01", icon: Layers },
    { href: "/sentinel", label: "NITRO SENTINEL", index: "02", icon: Radio },
    { href: "/firewall", label: "HOOK FIREWALL", index: "03", icon: Shield }
  ];

  return (
    <header>
      <div className="topbar">
        <Link href="/" className="brand-lockup" onClick={() => soundFX.playClick()}>
          <div className="brand-mark">⬡</div>
          <div>
            <div className="eyebrow">ETHGlobal Online 2026 // Production Suite</div>
            <div className="brand-title">
              AQUA<span>GHOST</span>
            </div>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => soundFX.playClick()}
                className={`nav-link ${isActive ? "active" : ""}`}
              >
                <span className="panel-index">[{item.index}]</span>
                <Icon size={13} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status Meta & Wallet */}
        <div className="topbar-meta">
          <div className="block-meta">
            <span className="live-dot" />
            <span>LOCAL ANVIL : 31337</span>
          </div>

          <div className="block-meta">
            BLK <span>#{blockNumber ? blockNumber.toString() : "194028"}</span>
          </div>

          <div className="clock">{timeStr}</div>

          <div>
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="address"
            />
          </div>
        </div>
      </div>

      {/* Terminal Command Strip */}
      <div className="command-strip">
        <span className="command-index">[SYS.00]</span>
        <span>AQUA JIT ROUTER // CRE NITRO TEE // UNISWAP v4 HOOK FIREWALL</span>
        <div className="command-divider" />
        <span className="muted">STATUS: OPERATIONAL</span>
        <div className="strip-right">
          <span>DON CONSENSUS 4/4</span>
          <span>
            SIGNAL <span className="signal-bars">▂▅▇█</span>
          </span>
        </div>
      </div>
    </header>
  );
}
