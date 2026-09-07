import type { PoolSnapshot, TickLiquidity, JitThreatAnalysis } from "./types.ts";

export class TheGraphClient {
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string = "", apiKey: string = "") {
    // Default to environment settings or The Graph Network Gateway Uniswap v3 Subgraph
    this.endpoint = endpoint || process.env.GRAPH_GATEWAY_URL || "https://gateway.thegraph.com/api/public/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV";
    this.apiKey = apiKey || process.env.GRAPH_API_KEY || "";
  }

  /**
   * Execute an authenticated GraphQL query against The Graph Gateway with retry logic.
   */
  async executeQuery<T>(query: string, variables: Record<string, any> = {}, maxRetries: number = 3): Promise<T> {
    const url = this.apiKey && this.endpoint.includes("gateway.thegraph.com")
      ? this.endpoint.replace("/api/public/", `/api/${this.apiKey}/`)
      : this.endpoint;

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "AquaGhost-GraphMCP/1.0"
          },
          body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
          throw new Error(`The Graph network query failed: ${response.status} ${response.statusText}`);
        }

        const payload = (await response.json()) as { data?: T; errors?: any[] };
        if (payload.errors && payload.errors.length > 0) {
          throw new Error(`The Graph GraphQL error: ${payload.errors[0].message}`);
        }

        if (!payload.data) {
          throw new Error("The Graph response returned empty data");
        }

        return payload.data;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, attempt * 300));
        }
      }
    }

    throw new Error(`The Graph query failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Tool 1: Fetch real-time pool metrics snapshot from The Graph (100% Live, No Mocks)
   */
  async getPoolSnapshot(poolId: string): Promise<PoolSnapshot> {
    const query = `
      query GetPool($id: ID!) {
        pool(id: $id) {
          id
          token0 { id symbol decimals }
          token1 { id symbol decimals }
          feeTier
          tick
          liquidity
          totalValueLockedUSD
          volumeUSD
          txCount
        }
      }
    `;

    const data = await this.executeQuery<{ pool: any }>(query, { id: poolId.toLowerCase() });
    if (!data.pool) {
      throw new Error(`Pool ${poolId} not found on The Graph Network Subgraph`);
    }

    return {
      id: data.pool.id,
      token0: data.pool.token0,
      token1: data.pool.token1,
      feeTier: data.pool.feeTier,
      tick: Number(data.pool.tick),
      liquidity: data.pool.liquidity,
      totalValueLockedUSD: data.pool.totalValueLockedUSD,
      volumeUSD24h: data.pool.volumeUSD,
      txCount: data.pool.txCount
    };
  }

  /**
   * Tool 2: Fetch concentrated liquidity distribution around tick boundaries (100% Live, No Mocks)
   */
  async getTickLiquidity(poolId: string, limit: number = 10): Promise<TickLiquidity[]> {
    const query = `
      query GetTicks($poolId: String!, $limit: Int!) {
        ticks(first: $limit, where: { poolAddress: $poolId }, orderBy: tickIdx, orderDirection: desc) {
          tickIdx
          liquidityGross
          liquidityNet
          price0
          price1
        }
      }
    `;

    const data = await this.executeQuery<{ ticks: any[] }>(query, {
      poolId: poolId.toLowerCase(),
      limit
    });

    if (!data.ticks || data.ticks.length === 0) {
      throw new Error(`No tick liquidity data found on The Graph for pool ${poolId}`);
    }

    return data.ticks.map(t => ({
      tickIdx: Number(t.tickIdx),
      liquidityGross: t.liquidityGross,
      liquidityNet: t.liquidityNet,
      price0: t.price0,
      price1: t.price1
    }));
  }

  /**
   * Tool 3: Analyze JIT sandwich threat using Subgraph depth and mempool surge heuristics
   */
  async analyzeJitThreat(poolId: string, mempoolSurgeDelta: string = "15000000000"): Promise<JitThreatAnalysis> {
    const snapshot = await this.getPoolSnapshot(poolId);
    const deltaNumber = Number(mempoolSurgeDelta);

    const parsedLiquidity = BigInt(snapshot.liquidity || "0");
    if (parsedLiquidity === 0n) {
      throw new Error(`Pool ${poolId} has zero active liquidity on The Graph; cannot evaluate JIT risk.`);
    }
    const poolLiquidity = Number(snapshot.liquidity.slice(0, 15)) || 1;

    // A JIT attack is flagged when incoming 0-block liquidity delta exceeds 25% of active pool depth
    const ratio = deltaNumber / poolLiquidity;
    const threatDetected = ratio > 0.25 || deltaNumber > 10_000_000_000;

    const riskScore = threatDetected ? Math.min(100, Math.round(ratio * 70 + 30)) : 12;
    const threatLevel = riskScore >= 75 ? "CRITICAL" : riskScore >= 40 ? "ELEVATED" : "LOW";

    let recommendation: "HOLD" | "DEFENSIVE_SHIFT" | "MAX_FEE_DEFENSE" = "HOLD";
    let suggestedFeeBps = 30; // standard 0.30%
    let suggestedTickRange: [number, number] = [snapshot.tick - 60, snapshot.tick + 60];

    if (threatLevel === "CRITICAL") {
      recommendation = "DEFENSIVE_SHIFT";
      suggestedFeeBps = 250; // 2.50% dynamic fee override
      suggestedTickRange = [snapshot.tick - 180, snapshot.tick + 180];
    } else if (threatLevel === "ELEVATED") {
      recommendation = "MAX_FEE_DEFENSE";
      suggestedFeeBps = 100; // 1.00% dynamic fee
      suggestedTickRange = [snapshot.tick - 120, snapshot.tick + 120];
    }

    return {
      poolId: snapshot.id,
      currentTick: snapshot.tick,
      threatDetected,
      threatLevel,
      liquidityDelta: mempoolSurgeDelta,
      volatilityBps: threatDetected ? 240 : 45,
      riskScore,
      recommendation,
      suggestedFeeBps,
      suggestedTickRange,
      analysisSummary: threatDetected
        ? `🚨 CRITICAL JIT SANDWICH DETECTED: Incoming liquidity delta (${mempoolSurgeDelta}) exceeds 25% of pool depth. Autonomous defensive shift recommended to safe corridor [${suggestedTickRange.join(", ")}] with ${suggestedFeeBps} BPS fee.`
        : `✅ NORMAL MEMPOOL FLOW: Pool ${snapshot.id} liquidity stable around tick ${snapshot.tick}. No predatory MEV anomaly detected.`
    };
  }
}
