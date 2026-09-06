/**
 * Types and interfaces for The Graph Subgraph MCP Server.
 */

export interface PoolSnapshot {
  id: string;
  token0: {
    id: string;
    symbol: string;
    decimals: string;
  };
  token1: {
    id: string;
    symbol: string;
    decimals: string;
  };
  feeTier: string;
  tick: number;
  liquidity: string;
  totalValueLockedUSD: string;
  volumeUSD24h: string;
  txCount: string;
}

export interface TickLiquidity {
  tickIdx: number;
  liquidityGross: string;
  liquidityNet: string;
  price0: string;
  price1: string;
}

export interface JitThreatAnalysis {
  poolId: string;
  currentTick: number;
  threatDetected: boolean;
  threatLevel: "LOW" | "ELEVATED" | "CRITICAL";
  liquidityDelta: string;
  volatilityBps: number;
  riskScore: number; // 0 - 100
  recommendation: "HOLD" | "DEFENSIVE_SHIFT" | "MAX_FEE_DEFENSE";
  suggestedFeeBps: number;
  suggestedTickRange: [number, number];
  analysisSummary: string;
}
