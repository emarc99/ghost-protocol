"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function PitchDeckPage() {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = 9;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 1));
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrentSlide(1);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrentSlide(totalSlides);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalSlides]);

  const progressPct = (currentSlide / totalSlides) * 100;

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* Top progress bar */}
      <div style={{ position: "absolute", top: -16, left: -24, right: -24, height: "3px", background: "var(--border-subtle)", zIndex: 50 }}>
        <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, var(--cyan), var(--emerald))", boxShadow: "0 0 10px var(--cyan-glow)", transition: "width 0.3s ease" }} />
      </div>

      {/* Main Slide Canvas */}
      <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0 40px" }}>
        
        {/* SLIDE 1: Cover & Vision */}
        {currentSlide === 1 && (
          <div className="slide-content" style={{ maxWidth: 1100, width: "100%", display: "flex", flexDirection: "column", gap: 24, animation: "fadeIn 0.3s ease" }}>
            <div className="eyebrow" style={{ color: "var(--cyan)" }}>EXECUTIVE SUMMARY // PROBLEM & THESIS</div>
            <h1 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "40px", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              Hardware-Isolated Liquidity Defense<br />
              <span style={{ color: "var(--cyan)" }}>Against 0-Block MEV Exploits</span>
            </h1>
            <p style={{ fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: 850 }}>
              Concentrated liquidity providers on AMMs bleed over <strong style={{ color: "var(--red)" }}>$400M annually</strong> to predatory Just-In-Time (JIT) fee sniping and Loss-Versus-Rebalancing (LVR).
              AquaGhost eliminates this through confidential TEE intelligence and sovereign self-custodial on-chain execution.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 10 }}>
              <div className="telemetry-card" style={{ padding: 20 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 32, fontWeight: 700, color: "var(--red)" }}>$400M+</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>Annual LP MEV Bleed</div>
              </div>
              <div className="telemetry-card" style={{ padding: 20 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 32, fontWeight: 700, color: "var(--emerald)" }}>+1,150 BPS</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>Empirical Yield Boost</div>
              </div>
              <div className="telemetry-card" style={{ padding: 20 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 32, fontWeight: 700, color: "var(--cyan)" }}>100%</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>Wallet Self-Custody</div>
              </div>
              <div className="telemetry-card" style={{ padding: 20 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 32, fontWeight: 700, color: "var(--text-primary)" }}>142 ms</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>Enclave Decision Latency</div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 2: The Core Problem */}
        {currentSlide === 2 && (
          <div className="slide-content" style={{ maxWidth: 1100, width: "100%", display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.3s ease" }}>
            <div className="eyebrow" style={{ color: "var(--red)" }}>THE ATTACK VECTOR // MARKET FAILURE</div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "36px", fontWeight: 700, lineHeight: 1.15 }}>
              The Silent Drain on Concentrated LPs
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              In Uniswap v3/v4 pools, liquidity providers bear 100% of the market volatility risk, while sophisticated MEV extractors capture the fees and arbitrage the stale bounds.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 8 }}>
              <div className="telemetry-card" style={{ borderLeft: "3px solid var(--red)", padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, color: "var(--red)", marginBottom: 12 }}>
                  ⚡ Predatory Just-In-Time (JIT) Sniping
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <li>▹ Searcher observes large retail swap order in public mempool.</li>
                  <li>▹ Borrows tens of millions via flash loan; deposits ultra-concentrated liquidity in target tick <strong>immediately before the swap</strong>.</li>
                  <li>▹ Extracts 90%+ of the swap fees in block <em>N</em>.</li>
                  <li>▹ Withdraws liquidity and repays flash loan in <strong>the exact same block</strong>.</li>
                  <li>▹ <strong>Outcome:</strong> Passive LPs absorb 100% of price impact with virtually zero fee compensation.</li>
                </ul>
              </div>

              <div className="telemetry-card" style={{ borderLeft: "3px solid var(--red)", padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, color: "var(--red)", marginBottom: 12 }}>
                  📉 Loss-Versus-Rebalancing (LVR)
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <li>▹ Off-chain centralized exchange prices move faster than on-chain pool blocks.</li>
                  <li>▹ Informed toxic arbitrageurs continuously pick off stale tick quotes.</li>
                  <li>▹ Passive LPs are perpetually sold the depreciating asset and bought out of the appreciating one.</li>
                  <li>▹ Static fee models (fixed 5 BPS / 30 BPS) fail to compensate for adverse selection during high-volatility regimes.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 3: The Impossible LP Dilemma */}
        {currentSlide === 3 && (
          <div className="slide-content" style={{ maxWidth: 1100, width: "100%", display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.3s ease" }}>
            <div className="eyebrow" style={{ color: "var(--amber)" }}>STRUCTURAL INDUSTRY VULNERABILITY</div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "36px", fontWeight: 700, lineHeight: 1.15 }}>
              The Impossible LP Trade-Off Today
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Current defense mechanisms force makers into two fatal traps: smart contract custodial risk or mempool front-running risk.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 8 }}>
              <div className="telemetry-card" style={{ borderLeft: "3px solid var(--amber)", padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, color: "var(--amber)", marginBottom: 12 }}>
                  ❌ Trap A: Custodial Automated Vaults
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <li>▹ LPs must deposit tokens into third-party pooled smart contracts.</li>
                  <li>▹ <strong>Exploit Risk:</strong> Over $1.2B has been drained historically from rebalancing vault contracts.</li>
                  <li>▹ <strong>Capital Fragmentation:</strong> Tokens locked in a vault cannot participate in secondary strategies (limit orders, lending).</li>
                  <li>▹ Yield is severely diluted by manager performance fees and gas overhead.</li>
                </ul>
              </div>

              <div className="telemetry-card" style={{ borderLeft: "3px solid var(--amber)", padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, color: "var(--amber)", marginBottom: 12 }}>
                  ❌ Trap B: Public Mempool Automation
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <li>▹ Automated stop-losses and rebalancing bots submit on-chain adjustment transactions.</li>
                  <li>▹ <strong>Front-Running:</strong> Mempool searchers inspect the pending transaction and sandwich the rebalance.</li>
                  <li>▹ Slippage parameters and defense triggers are 100% transparent to adversaries.</li>
                  <li>▹ <strong>The Dead End:</strong> Moving on-chain without confidentiality guarantees you get exploited.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 4: Mathematical Mechanics */}
        {currentSlide === 4 && (
          <div className="slide-content" style={{ maxWidth: 1100, width: "100%", display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.3s ease" }}>
            <div className="eyebrow" style={{ color: "var(--cyan)" }}>MATHEMATICAL FOUNDATIONS // LIQUIDITY DILUTION</div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "36px", fontWeight: 700, lineHeight: 1.15 }}>
              Mathematical Anatomy of JIT Exploits
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Why concentrated liquidity math intrinsically favors 0-block capital surges over sovereign makers.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 8 }}>
              <div className="telemetry-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                  📐 Fee Dilution Equation
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>For price tick range [P<sub>l</sub>, P<sub>u</sub>], liquidity density is:</p>
                <div style={{ background: "#06090d", borderLeft: "3px solid var(--cyan)", padding: "10px 14px", borderRadius: 4, fontFamily: "JetBrains Mono", fontSize: 13, marginBottom: 12 }}>
                  L = Δy / (√P<sub>u</sub> - √P<sub>l</sub>)
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>Passive fee capture share is strictly proportional to active <em>L</em>:</p>
                <div style={{ background: "#06090d", borderLeft: "3px solid var(--red)", padding: "10px 14px", borderRadius: 4, fontFamily: "JetBrains Mono", fontSize: 13, color: "var(--text-primary)" }}>
                  FeeShare<sub>passive</sub> = L<sub>passive</sub> / (L<sub>passive</sub> + <span style={{ color: "var(--red)" }}>L<sub>sniper</sub></span>) → <span style={{ color: "var(--red)", fontWeight: 700 }}>0</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                  When L<sub>sniper</sub> ≈ 20x L<sub>passive</sub>, passive makers capture &lt; 4.7% of fees.
                </div>
              </div>

              <div className="telemetry-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                  📊 Loss-Versus-Rebalancing (LVR) Integral
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>Cumulative expected value drained by toxic arbitrageurs over time <em>t</em>:</p>
                <div style={{ background: "#06090d", borderLeft: "3px solid var(--emerald)", padding: "10px 14px", borderRadius: 4, fontFamily: "JetBrains Mono", fontSize: 13, marginBottom: 12 }}>
                  LVR<sub>t</sub> = ∫<sub>0</sub><sup>t</sup> (<span style={{ color: "var(--emerald)" }}>σ<sup>2</sup> S<sub>u</sub><sup>2</sup></span> / 8) · (L(S<sub>u</sub>) / S<sub>u</sub><sup>3/2</sup>) du
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Where <em>σ</em> is instantaneous price volatility and <em>S</em> is spot price. Because AMMs cannot compute off-chain volatility privately, LPs bleed continuously during variance surges without compensatory fees.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 5: The AquaGhost Architecture */}
        {currentSlide === 5 && (
          <div className="slide-content" style={{ maxWidth: 1100, width: "100%", display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.3s ease" }}>
            <div className="eyebrow" style={{ color: "var(--cyan)" }}>TECHNICAL ARCHITECTURE // TWO-TIER DEFENSE</div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "36px", fontWeight: 700, lineHeight: 1.15 }}>
              The AquaGhost Two-Tier Security Model
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Decoupling off-chain confidential computation from on-chain self-custodial execution.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 8 }}>
              <div className="telemetry-card" style={{ borderLeft: "3px solid var(--cyan)", padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, color: "var(--cyan)", marginBottom: 12 }}>
                  🛡️ Tier 1: Confidential Off-Chain Sentinel
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <li>▹ <strong>AWS Nitro Enclave TEE:</strong> Threat evaluations execute inside hardware-sealed enclaves; memory is cryptographically isolated from node operators.</li>
                  <li>▹ <strong>Vault DON Secrets:</strong> Risk thresholds, model weights, and signing keys are injected solely into enclave RAM—never stored or logged on-chain.</li>
                  <li>▹ <strong>Hardware Attestation:</strong> Evaluates mempool liquidity surges and signs EIP-712 ECDSA defense directives in sub-second time (&lt;150ms).</li>
                </ul>
              </div>

              <div className="telemetry-card" style={{ borderLeft: "3px solid var(--emerald)", padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, color: "var(--emerald)", marginBottom: 12 }}>
                  ⚡ Tier 2: Sovereign Self-Custodial Execution
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <li>▹ <strong>1inch Aqua Non-Custodial Layer:</strong> Capital remains 100% in the maker's wallet until fills occur. Rebalancing executes via <code>dock()</code> and <code>ship()</code> using signed permits.</li>
                  <li>▹ <strong>Uniswap v4 Hook Firewall:</strong> Intercepts predatory liquidity additions in <code>beforeAddLiquidity()</code>, reverting sandwich attacks with <code>SniperLiquidityBlocked()</code>.</li>
                  <li>▹ <strong>100% Publicly Routable:</strong> Decoupled architecture requires zero custom calldata for standard retail swappers.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 6: Mathematical Defense Model */}
        {currentSlide === 6 && (
          <div className="slide-content" style={{ maxWidth: 1100, width: "100%", display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.3s ease" }}>
            <div className="eyebrow" style={{ color: "var(--emerald)" }}>MATHEMATICAL DEFENSE MODEL // ECONOMIC FIREWALL</div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "36px", fontWeight: 700, lineHeight: 1.15 }}>
              Algorithmic Defense & Invariant Envelopes
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Shifting pool fees dynamically to render sandwich attacks mathematically unprofitable.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 8 }}>
              <div className="telemetry-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                  📈 Dynamic Fee Surge Model
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>Effective fee dynamically scales with pending transaction volume:</p>
                <div style={{ background: "#06090d", borderLeft: "3px solid var(--emerald)", padding: "10px 14px", borderRadius: 4, fontFamily: "JetBrains Mono", fontSize: 13, marginBottom: 8 }}>
                  f<sub>effective</sub> = f<sub>base</sub> + <span style={{ color: "var(--emerald)", fontWeight: 700 }}>Δf</span>
                </div>
                <div style={{ background: "#06090d", borderLeft: "3px solid var(--cyan)", padding: "10px 14px", borderRadius: 4, fontFamily: "JetBrains Mono", fontSize: 13, marginBottom: 10 }}>
                  Δf = min( f<sub>max</sub>, α · (V<sub>surge</sub> / L<sub>tick</sub>) + β · σ )
                </div>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Destroys the MEV sniper's profit equation:</p>
                <div style={{ background: "#06090d", borderLeft: "3px solid var(--red)", padding: "8px 12px", borderRadius: 4, fontFamily: "JetBrains Mono", fontSize: 13, color: "var(--red)", marginTop: 6 }}>
                  Π<sub>sniper</sub> = FeeCaptured - GasCost - SurgeFee &lt; 0
                </div>
              </div>

              <div className="telemetry-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                  🔒 TEE Invariant Corridor Guardrail
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>Hardware enclaves verify mathematical invariants before signing any repositioning directive:</p>
                <div style={{ background: "#06090d", borderLeft: "3px solid var(--cyan)", padding: "10px 14px", borderRadius: 4, fontFamily: "JetBrains Mono", fontSize: 13, marginBottom: 12 }}>
                  P<sub>target</sub> ∈ [ P<sub>spot</sub> · (1 - δ<sub>max</sub>), P<sub>spot</sub> · (1 + δ<sub>max</sub>) ]
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <strong>AquaSwapVM Opcode Invariant:</strong> Stack-machine execution enforces <code>OP_TEE_GUARD</code> (0x7E) and <code>OP_DYNAMIC_FEE</code> (0xDF) before ERC-20 token transfer execution.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 7: TRANSITION CUE FOR 1-MINUTE LIVE DEMO */}
        {currentSlide === 7 && (
          <div className="slide-content" style={{ maxWidth: 900, width: "100%", animation: "fadeIn 0.3s ease" }}>
            <div style={{
              background: "radial-gradient(circle at 50% 50%, rgba(0, 245, 160, 0.09) 0%, rgba(14, 24, 28, 0.95) 75%)",
              border: "2px solid var(--emerald)",
              borderRadius: 12,
              padding: "48px 36px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 24,
              boxShadow: "0 0 40px var(--emerald-glow)"
            }}>
              <div className="eyebrow" style={{ color: "var(--emerald)" }}>SYSTEM VERIFICATION // LIVE PROOF OF CONCEPT</div>
              <h2 style={{ fontFamily: "Space Grotesk", fontSize: 32, fontWeight: 700, color: "var(--text-primary)" }}>
                INTERACTIVE SYSTEM VERIFICATION
              </h2>
              <p style={{ maxWidth: 680, fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Now transitioning to the live <strong>Next.js Cyberpunk Observatory</strong> running on Base Sepolia.
                We will demonstrate a live on-chain swap fill, simulate an incoming JIT sniper attack, and witness the synchronous Hook reversion in real time.
              </p>

              <Link href="/" className="demo-btn" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                background: "var(--emerald)",
                color: "#04100c",
                fontFamily: "Space Grotesk, sans-serif",
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: "0.05em",
                padding: "14px 28px",
                borderRadius: 6,
                textDecoration: "none",
                cursor: "pointer",
                boxShadow: "0 0 20px var(--emerald-glow)"
              }}>
                <span>LAUNCH DEFENSE TERMINAL [ / ]</span>
                <span>↗</span>
              </Link>

              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Target Network: Base Sepolia (Chain ID 84532) // Verified Contracts Active
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 8: Empirical Results */}
        {currentSlide === 8 && (
          <div className="slide-content" style={{ maxWidth: 1100, width: "100%", display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.3s ease" }}>
            <div className="eyebrow" style={{ color: "var(--emerald)" }}>EMPIRICAL RIGOR // BENCHMARK EVALUATION</div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "36px", fontWeight: 700, lineHeight: 1.15 }}>
              1,000-Block Empirical Proof
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Verifiable results from our empirical backtest simulating 1,000 blocks modeled on real Ethereum Mainnet USDC/WETH dynamics ($421M+ TVL).
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 8 }}>
              <div className="telemetry-card" style={{ borderLeft: "3px solid var(--emerald)", padding: 20 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 28, fontWeight: 700, color: "var(--emerald)" }}>+1,150 BPS</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>Net LP Yield Boost (+11.5% APY)</div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.5 }}>
                  Protected LPs capture surge fees during attacks rather than forfeiting yield to MEV sandwichers.
                </p>
              </div>

              <div className="telemetry-card" style={{ borderLeft: "3px solid var(--emerald)", padding: 20 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 28, fontWeight: 700, color: "var(--emerald)" }}>100.0%</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>JIT Attacks Reverted</div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.5 }}>
                  Zero-block liquidity additions are intercepted synchronously in <code>beforeAddLiquidity()</code>.
                </p>
              </div>

              <div className="telemetry-card" style={{ borderLeft: "3px solid var(--cyan)", padding: 20 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 28, fontWeight: 700, color: "var(--cyan)" }}>$2,299,249</div>
                <div className="eyebrow" style={{ marginTop: 4 }}>Adverse Selection (LVR) Saved</div>
                <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 10, lineHeight: 1.5 }}>
                  Dynamic surge fee model eliminates toxic arbitrage extraction during volatility spikes.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 10 }}>
              <div className="telemetry-card" style={{ padding: 18 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>142 ms</div>
                <div className="eyebrow" style={{ marginTop: 2 }}>In-Enclave Threat Latency</div>
              </div>
              <div className="telemetry-card" style={{ padding: 18 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>0 Bytes</div>
                <div className="eyebrow" style={{ marginTop: 2 }}>Mempool Parameters Leaked</div>
              </div>
              <div className="telemetry-card" style={{ padding: 18 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>17.6 KB</div>
                <div className="eyebrow" style={{ marginTop: 2 }}>Contract Space Headroom</div>
              </div>
            </div>
          </div>
        )}

        {/* SLIDE 9: Conclusion & Verification */}
        {currentSlide === 9 && (
          <div className="slide-content" style={{ maxWidth: 1100, width: "100%", display: "flex", flexDirection: "column", gap: 20, animation: "fadeIn 0.3s ease" }}>
            <div className="eyebrow" style={{ color: "var(--cyan)" }}>CONCLUSION // PRODUCTION VERIFICATION</div>
            <h2 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "36px", fontWeight: 700, lineHeight: 1.15 }}>
              Autonomous Defense for the Future of DeFi
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              AquaGhost proves that LPs no longer have to choose between asset custody and MEV protection.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 8 }}>
              <div className="telemetry-card" style={{ padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                  🏆 Core Breakthroughs
                </div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <li>▹ <strong>Sovereignty Preserved:</strong> 100% self-custodial capital via 1inch Aqua; zero smart contract vault risk.</li>
                  <li>▹ <strong>Confidential Compute:</strong> Hardware-isolated Nitro TEEs calculate risk without mempool leakage.</li>
                  <li>▹ <strong>Synchronous Enforcement:</strong> Uniswap v4 Hook blocks sandwich snipers right at the pool boundary.</li>
                  <li>▹ <strong>100% Publicly Routable:</strong> Fully compatible with Universal Router, CowSwap, and 1inch aggregators.</li>
                </ul>
              </div>

              <div className="telemetry-card" style={{ borderLeft: "3px solid var(--cyan)", padding: 24 }}>
                <div style={{ fontFamily: "Space Grotesk", fontSize: 18, fontWeight: 700, color: "var(--cyan)", marginBottom: 12 }}>
                  🔍 Judge Reproduction Commands
                </div>
                <div style={{ background: "#06090d", padding: "12px 14px", borderRadius: 4, fontFamily: "JetBrains Mono", fontSize: 12, lineHeight: 1.8 }}>
                  <span style={{ color: "var(--text-muted)" }}># 1. Run Smart Contract Test Suite (42/42 Passing)</span><br />
                  cd contracts && forge test<br /><br />
                  <span style={{ color: "var(--text-muted)" }}># 2. Run Empirical 1,000-Block Backtest</span><br />
                  npm run backtest<br /><br />
                  <span style={{ color: "var(--text-muted)" }}># 3. Test Decentralized Gateway MCP</span><br />
                  npm run test:mcp
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
                  GitHub: <a href="https://github.com/emarc99/ghost-protocol" target="_blank" rel="noreferrer" style={{ color: "var(--cyan)", textDecoration: "none" }}>github.com/emarc99/ghost-protocol</a>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer HUD */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", paddingTop: 16 }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, letterSpacing: "0.1em" }}>
          SLIDE 0{currentSlide} / 0{totalSlides}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx + 1)}
              style={{
                width: currentSlide === idx + 1 ? 40 : 24,
                height: 6,
                background: currentSlide === idx + 1 ? (idx === 6 ? "var(--emerald)" : "var(--cyan)") : "var(--border-default)",
                borderRadius: 3,
                border: "none",
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow: currentSlide === idx + 1 ? "0 0 8px var(--cyan-glow)" : "none"
              }}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 1))}
            disabled={currentSlide === 1}
            style={{
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-default)",
              color: currentSlide === 1 ? "var(--text-muted)" : "var(--text-primary)",
              padding: "6px 12px",
              borderRadius: 4,
              fontFamily: "JetBrains Mono",
              fontSize: 12,
              cursor: currentSlide === 1 ? "not-allowed" : "pointer"
            }}
          >
            ◄ PREV
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides))}
            disabled={currentSlide === totalSlides}
            style={{
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--border-default)",
              color: currentSlide === totalSlides ? "var(--text-muted)" : "var(--text-primary)",
              padding: "6px 12px",
              borderRadius: 4,
              fontFamily: "JetBrains Mono",
              fontSize: 12,
              cursor: currentSlide === totalSlides ? "not-allowed" : "pointer"
            }}
          >
            NEXT ►
          </button>
        </div>
      </div>
    </div>
  );
}
