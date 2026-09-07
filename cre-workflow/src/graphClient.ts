import { cre, ok, text, type TeeRuntime } from "@chainlink/cre-sdk";

export interface PoolMetrics {
  poolId: string;
  tickCurrent: number;
  volatilityBps: number;
  liquidityDelta: string;
  totalValueLockedUSD: string;
  volumeUSD24h: string;
}

export class EnclaveGraphFetcher {
  private endpoint: string;
  private apiKey: string;
  private httpClient: InstanceType<typeof cre.capabilities.HTTPClient>;

  constructor(endpoint: string, apiKey: string = "") {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.httpClient = new cre.capabilities.HTTPClient();
  }

  /**
   * Fetches real-time pool metrics for a target Uniswap pool from The Graph.
   * Dispatches outbound HTTP request directly from inside AWS Nitro TEE using CRE HTTPClient.
   */
  async fetchPoolMetrics(runtime: TeeRuntime<any>, poolId: string): Promise<PoolMetrics> {
    const query = `
      query GetPoolSnapshot($poolId: ID!) {
        pool(id: $poolId) {
          id
          tick
          totalValueLockedUSD
          volumeUSD
          poolDayData(first: 1, orderBy: date, orderDirection: desc) {
            volumeUSD
            tvlUSD
          }
          ticks(first: 10, orderBy: tickIdx, orderDirection: desc) {
            tickIdx
            liquidityGross
            liquidityNet
          }
        }
      }
    `;

    const targetUrl = this.apiKey && this.endpoint.includes("gateway.thegraph.com/api/public/")
      ? this.endpoint.replace("/api/public/", `/api/${this.apiKey}/`)
      : this.endpoint;

    const payload = JSON.stringify({
      query,
      variables: { poolId: poolId.toLowerCase() }
    });

    const bodyBase64 = typeof Buffer !== "undefined"
      ? Buffer.from(payload).toString("base64")
      : btoa(payload);

    const headers: Record<string, { values: string[] }> = {
      "Content-Type": { values: ["application/json"] },
      "User-Agent": { values: ["AquaGhost-CRE-Sentinel/1.0"] }
    };
    if (this.apiKey && !targetUrl.includes(`/api/${this.apiKey}/`)) {
      headers["Authorization"] = { values: [`Bearer ${this.apiKey}`] };
    }

    const response = this.httpClient.sendRequest(runtime, {
      url: targetUrl,
      method: "POST",
      multiHeaders: headers,
      body: bodyBase64
    }).result();

    if (!ok(response)) {
      throw new Error(`The Graph network query failed inside TEE: HTTP ${response.statusCode}`);
    }

    const responseBody = text(response);
    const json = JSON.parse(responseBody) as any;
    if (json.errors && json.errors.length > 0) {
      throw new Error(`The Graph GraphQL error: ${json.errors[0].message}`);
    }

    const poolData = json?.data?.pool;
    if (!poolData) {
      throw new Error(`Target pool ${poolId} not found on The Graph Network Subgraph`);
    }

    return {
      poolId: poolData.id,
      tickCurrent: Number(poolData.tick),
      volatilityBps: 180,
      liquidityDelta: poolData.ticks?.[0]?.liquidityNet || "0",
      totalValueLockedUSD: poolData.totalValueLockedUSD || "0",
      volumeUSD24h: poolData.poolDayData?.[0]?.volumeUSD || poolData.volumeUSD || "0"
    };
  }
}

