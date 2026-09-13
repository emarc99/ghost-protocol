import { NextRequest, NextResponse } from "next/server";
import { TheGraphClient } from "@graph-mcp/graphClient";

const DEFAULT_POOL = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"; // Ethereum Mainnet USDC/WETH 0.05%

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "snapshot";
    const poolId = searchParams.get("poolId") || DEFAULT_POOL;
    const surge = searchParams.get("surge") || "15000000000";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const client = new TheGraphClient();

    if (action === "threat") {
      const threat = await client.analyzeJitThreat(poolId, surge);
      return NextResponse.json({ success: true, timestamp: Date.now(), data: threat });
    }

    if (action === "ticks") {
      const ticks = await client.getTickLiquidity(poolId, limit);
      return NextResponse.json({ success: true, timestamp: Date.now(), data: ticks });
    }

    // Default: snapshot
    const snapshot = await client.getPoolSnapshot(poolId);
    return NextResponse.json({ success: true, timestamp: Date.now(), data: snapshot });
  } catch (error: any) {
    console.error("[The Graph API Route] Error:", error?.message);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to query The Graph Network Gateway",
        fallback: {
          poolId: DEFAULT_POOL,
          currentTick: 198167,
          tvlUSD: 414541258,
          threatLevel: "CRITICAL",
          riskScore: 93,
          suggestedFeeBps: 250
        }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action || "threat";
    const poolId = body.poolId || DEFAULT_POOL;
    const surge = body.surge || "15000000000";
    const limit = body.limit || 10;

    const client = new TheGraphClient();

    if (action === "snapshot") {
      const snapshot = await client.getPoolSnapshot(poolId);
      return NextResponse.json({ success: true, timestamp: Date.now(), data: snapshot });
    }

    if (action === "ticks") {
      const ticks = await client.getTickLiquidity(poolId, limit);
      return NextResponse.json({ success: true, timestamp: Date.now(), data: ticks });
    }

    const threat = await client.analyzeJitThreat(poolId, surge);
    return NextResponse.json({ success: true, timestamp: Date.now(), data: threat });
  } catch (error: any) {
    console.error("[The Graph API Route] Error:", error?.message);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to query The Graph Network Gateway"
      },
      { status: 500 }
    );
  }
}
