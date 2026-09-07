# Subgraph Indexing & MEV Defense Patterns

> **AquaGhost Protocol Engineering Reference**  
> Technical documentation of real-world edge cases when querying The Graph decentralized network for in-enclave and autonomous AI risk monitoring.

---

## 1. Sparse Initialized Ticks & Spacing Interpolation

### Problem
Uniswap v3 and v4 pools do not initialize every integer tick. Ticks are bounded by the pool's `tickSpacing` (e.g., 10 for 0.05% fee tier, 60 for 0.30% fee tier, 200 for 1.00% fee tier). Furthermore, The Graph Subgraph only creates `Tick` entities when an LP explicitly initializes a position with non-zero liquidity at that boundary.

### Trap
If an AI agent or automated sentinel queries ticks assuming continuous arrays or assumes uninitialized ticks have `liquidityGross == 0`, querying an arbitrary `tickIdx` will return `null` rather than a zeroed record.

### Solution Pattern
- Always query initialized ticks sorted by `tickIdx` in descending or ascending order around the active price:
  ```graphql
  ticks(first: 20, where: { poolAddress: $poolId }, orderBy: tickIdx, orderDirection: desc) {
    tickIdx
    liquidityGross
    liquidityNet
    price0
    price1
  }
  ```
- Track active cumulative virtual liquidity by stepping through `liquidityNet` deltas when crossing tick boundaries, rather than relying on point lookups.

---

## 2. Virtual Liquidity ($L$) Scaling vs. Raw ERC-20 Balances

### Problem
In concentrated liquidity AMMs, pool liquidity $L$ is a virtual metric defined as:
$$L = \sqrt{x \cdot y}$$
where $x$ and $y$ are virtual reserves. $L$ does NOT equal the physical token balance held in the pool contract, nor does it share decimals with ERC-20 tokens (e.g. USDC has 6 decimals, WETH has 18 decimals).

### Trap
Naively comparing mempool transfer amounts (e.g. $10,000,000 USDC = $10^{13}$ units) directly against $L$ causes scale mismatches of 10 to 12 orders of magnitude. 

### Solution Pattern
In `TheGraphClient` and `EnclaveGraphFetcher`, scale both quantities to comparable integer representations:
- Mempool liquidity deltas are normalized to nominal units before computing the surge ratio:
  $$\text{Surge Ratio} = \frac{\Delta L_{\text{mempool}}}{L_{\text{pool}}}$$
- Any ratio exceeding `0.25` (25% of active depth in a single block) signals an imminent JIT sandwich attack, as benign retail swaps rarely inject concentrated liquidity equal to a quarter of total pool depth within block $N$.

---

## 3. GraphQL HTTP 200 OK vs. `_meta` Indexing Lag

### Problem
The Graph Gateways return an HTTP status code `200 OK` even when the underlying Indexer node is several blocks behind the latest EVM tip. For high-frequency MEV defense, relying on a 200 OK with stale state could cause an enclave to defend against a transaction that already settled blocks ago.

### Trap
Assuming HTTP `200` implies real-time head-of-chain state.

### Solution Pattern
In high-security environments, include the `_meta` field in critical queries to verify freshness:
```graphql
query VerifyFreshness($poolId: ID!) {
  _meta {
    block {
      number
      timestamp
    }
    hasIndexingErrors
  }
  pool(id: $poolId) {
    tick
    liquidity
  }
}
```
If `_meta.block.number < targetBlock - 2` or `hasIndexingErrors == true`, flag an indexing latency warning and use direct on-chain view calls (via EVM client in CRE) to confirm the latest pool state.

---

## 4. Directional JIT Asymmetry (Single-Sided Tick Sniping)

### Problem
Predatory JIT liquidity snipers do not supply symmetrical 50/50 token liquidity. Instead, they inspect the victim's swap in the mempool:
- If a victim is swapping USDC for WETH (driving the tick downwards), the attacker mints liquidity **exclusively in the single tick range** $[i_{\text{lower}}, i_{\text{upper}}]$ right below the current tick using 100% WETH.
- The victim swap executes, paying all protocol and LP fees to the attacker's concentrated position.
- Within the same bundle, the attacker immediately burns the position and redeems USDC + accrued fees, leaving zero capital exposed to impermanent loss.

### Solution Pattern
AquaGhost's heuristic detects not just aggregate liquidity surges, but directional tick-bound injections. If a mempool transaction deposits single-sided liquidity adjacent to the current tick with a subsequent burn instruction in the same block, the AquaGhost Sentinel immediately raises `threatLevel = CRITICAL`, adjusts the dynamic fee to 250 BPS (2.50%), and signals 1inch Aqua to undock or widen its quotes.

---

## 5. Gateway Backoff and Exponential Retry Policies

### Problem
Decentralized indexers distributed across The Graph Network can experience temporary network jitter, rate limiting, or node rotation during query routing.

### Solution Pattern
All queries routed through `TheGraphClient` implement exponential backoff:
```typescript
let lastError: Error | null = null;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    const response = await fetch(url, { ... });
    // Process response
    return data;
  } catch (err) {
    lastError = err;
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, attempt * 300));
    }
  }
}
```
Inside Chainlink CRE TEE enclaves, execution is deterministic; retries with bounded backoff prevent transient gateway timeouts from aborting defense attestations.
