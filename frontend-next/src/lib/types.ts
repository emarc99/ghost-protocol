export interface Strategy {
  id: string;
  name: string;
  pair: string;
  appType: string;
  committedAmounts: {
    WETH: number;
    USDC: number;
    AAVE?: number;
    USDT?: number;
  };
  tickLower: number;
  tickUpper: number;
  feeBps: number;
  status: "ACTIVE_NORMAL" | "DEFENSIVE_SHIFTED";
  effectiveLiquidityUSD: number;
}

export interface SentinelState {
  status: "STANDBY_MONITORING" | "DEFENSE_ACTIVE" | "ANALYZING";
  isUnderAttack: boolean;
  lastAttestation: AttestationData | null;
  enclaveModel: string;
  verificationProof: string;
  pcr0: string;
}

export interface AttestationData {
  action: string;
  tickLower: number;
  tickUpper: number;
  dynamicFeeBps: number;
  nonce: number;
  signature: string;
  signerAddress: string;
  timestamp: string;
}

export interface HookState {
  defenseActive: boolean;
  dynamicFeeBps: number;
  totalAttacksBlocked: number;
  lastBlockedAttacker: string;
}

export interface WalletBalances {
  WETH: number;
  USDC: number;
  AAVE: number;
  USDT: number;
}

export interface AppState {
  makerAddress: string;
  enclaveAddress: string;
  aquaRouterAddress: string;
  poolManagerAddress: string;
  hookAddress: string;
  walletBalances: WalletBalances;
  strategies: Strategy[];
  sentinel: SentinelState;
  hookState: HookState;
}
