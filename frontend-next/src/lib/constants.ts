import { AppState } from "./types";

export const CONTRACT_ADDRESSES = {
  chainId: 31337,
  rpcUrl: "http://127.0.0.1:8545",
  deployer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  enclaveSigner: "0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7",
  contracts: {
    WETH: "0x7969c5eD335650692Bc04293B07F5BF2e7A673C0",
    USDC: "0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650",
    AquaRouter: "0xc351628EB244ec633d5f21fBD6621e1a683B1181",
    UniswapPoolCaller: "0xFD471836031dc5108809D173A067e8486B9047A3",
    AquaGhostApp: "0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc",
    AquaSwapVM: "0x9230C445Ba467b69C09918E35c233B065F289A39",
    AquaGhostHook: "0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f"
  }
} as const;

export const DEFAULT_STATE: AppState = {
  makerAddress: "0xA11CE88B0964177d56e9A381f8f3c7D1f4c58190",
  enclaveAddress: "0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7",
  aquaRouterAddress: "0xc351628EB244ec633d5f21fBD6621e1a683B1181",
  poolManagerAddress: "0x000000000004444c5dc75cB358380D2e3dE08A90",
  hookAddress: "0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f",
  walletBalances: {
    WETH: 10.0,
    USDC: 25000.0,
    AAVE: 150.0,
    USDT: 10000.0
  },
  strategies: [
    {
      id: "strat-104",
      name: "ETH / USDC Primary Yield",
      pair: "WETH / USDC",
      appType: "1inch Aqua Constant Product",
      committedAmounts: { WETH: 5.0, USDC: 15000.0 },
      tickLower: -201240,
      tickUpper: -201160,
      feeBps: 30,
      status: "ACTIVE_NORMAL",
      effectiveLiquidityUSD: 30000
    },
    {
      id: "strat-208",
      name: "Aqua Flash Liquidity Provider",
      pair: "USDC / USDT",
      appType: "1inch Aqua Flash Loan App",
      committedAmounts: { USDC: 20000.0, WETH: 0, USDT: 10000.0 },
      tickLower: 0,
      tickUpper: 0,
      feeBps: 9,
      status: "ACTIVE_NORMAL",
      effectiveLiquidityUSD: 30000
    },
    {
      id: "strat-312",
      name: "ETH / AAVE Concentrated Band",
      pair: "WETH / AAVE",
      appType: "1inch Aqua Concentrated LP",
      committedAmounts: { WETH: 5.0, USDC: 0, AAVE: 120.0 },
      tickLower: -1500,
      tickUpper: 1500,
      feeBps: 50,
      status: "ACTIVE_NORMAL",
      effectiveLiquidityUSD: 27000
    }
  ],
  sentinel: {
    status: "STANDBY_MONITORING",
    isUnderAttack: false,
    lastAttestation: {
      action: "BASE_MONITORING",
      tickLower: -201240,
      tickUpper: -201160,
      dynamicFeeBps: 30,
      nonce: 1725839201,
      signature: "0x9812f8e24c45719bc422998a12dc7d354b0ef093a1c8b3e839e25d045d6e27a94f61f71f153a7f8045f95f483c74900a6a3b2b810931548e6bb45564b18972e31b",
      signerAddress: "0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7",
      timestamp: "12:04:19 UTC"
    },
    enclaveModel: "AWS Nitro Enclave (EIF #29401 / CRE TEE)",
    verificationProof: "Secp256k1 + TPM PCR0 Hardware Attestation",
    pcr0: "3b29c9b4e67d402390a42ff4c577b2123c563d706bc510db90311f99c2794f83"
  },
  hookState: {
    defenseActive: false,
    dynamicFeeBps: 30,
    totalAttacksBlocked: 14,
    lastBlockedAttacker: "0xBAD000000000000000000000000000000000B07"
  }
};

export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }]
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

export const AQUA_GHOST_APP_ABI = [
  {
    name: "maker",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    name: "enclaveSigner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    name: "lastAttestationNonce",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    name: "isDefensiveShiftActive",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;
