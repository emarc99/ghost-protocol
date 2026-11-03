import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  parseUnits,
  encodePacked,
  keccak256,
  toBytes,
  toHex
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { BASE_SEPOLIA_ADDRESSES } from "@/lib/constants";

const RPC_URL = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const DEPLOYER_KEY = (process.env.DEPLOYER_PRIVATE_KEY || "0x4df3776b2526361346b6518038f03ba7a205f7e4e04970aee5008a90b0ca69b0") as `0x${string}`;
const ENCLAVE_KEY = (process.env.STAGING_ENCLAVE_SIGNER_KEY || "0x00000000000000000000000000000000000000000000000000000000000a11ce") as `0x${string}`;

const deployerAccount = privateKeyToAccount(DEPLOYER_KEY);
const enclaveAccount = privateKeyToAccount(ENCLAVE_KEY);

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(RPC_URL)
});

const walletClient = createWalletClient({
  account: deployerAccount,
  chain: baseSepolia,
  transport: http(RPC_URL)
});

const HOOK_ABI = [
  {
    type: "function",
    name: "setDefenseMode",
    inputs: [
      { name: "active", type: "bool" },
      { name: "newFeeBps", type: "uint24" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  }
] as const;

const AQUA_ROUTER_ABI = [
  {
    type: "function",
    name: "ship",
    inputs: [
      { name: "app", type: "address" },
      { name: "strategyData", type: "bytes" },
      { name: "tokens", type: "address[]" },
      { name: "amounts", type: "uint256[]" }
    ],
    outputs: [{ name: "newStrategyHash", type: "bytes32" }],
    stateMutability: "nonpayable"
  }
] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "defense_threat";

    if (action === "swap_fill") {
      // 1. Simulate Swapper Fill via 1inch Aqua Router on Base Sepolia
      const strategyData = toHex(new TextEncoder().encode("1inch Aqua Constant Product: WETH/USDC Swap Fill Simulation"));
      const tokens = [
        BASE_SEPOLIA_ADDRESSES.contracts.WETH as `0x${string}`,
        BASE_SEPOLIA_ADDRESSES.contracts.USDC as `0x${string}`
      ];
      const amounts = [parseEther("0.833"), parseUnits("2500", 6)];

      const txHash = await walletClient.writeContract({
        address: BASE_SEPOLIA_ADDRESSES.contracts.AquaRouter as `0x${string}`,
        abi: AQUA_ROUTER_ABI,
        functionName: "ship",
        args: [
          BASE_SEPOLIA_ADDRESSES.contracts.AquaGhostApp as `0x${string}`,
          strategyData,
          tokens,
          amounts
        ]
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      return NextResponse.json({
        success: true,
        action: "SWAP_FILL",
        txHash,
        blockNumber: Number(receipt.blockNumber),
        status: receipt.status === "success" ? "SUCCESS" : "REVERTED",
        explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
        summary: "1inch Aqua swap fill executed on Base Sepolia: +2,500 USDC / -0.833 WETH settlement.",
        contract: "MockAquaRouter"
      });
    }

    if (action === "defense_threat" || action === "defense_disarm") {
      const active = action === "defense_threat";
      const newFeeBps = active ? (body.feeBps || 250) : 30;
      const nonce = BigInt(Date.now());

      // Pack and hash "TOGGLE_DEFENSE"
      const packedHash = keccak256(
        encodePacked(
          ["string", "bool", "uint24", "uint256"],
          ["TOGGLE_DEFENSE", active, newFeeBps, nonce]
        )
      );

      // Sign with AWS Nitro Enclave private key (raw Ethereum Signed Message)
      const signature = await enclaveAccount.signMessage({
        message: { raw: toBytes(packedHash) }
      });

      // Broadcast on-chain to Base Sepolia
      const txHash = await walletClient.writeContract({
        address: BASE_SEPOLIA_ADDRESSES.contracts.AquaGhostHook as `0x${string}`,
        abi: HOOK_ABI,
        functionName: "setDefenseMode",
        args: [active, newFeeBps, nonce, signature]
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      return NextResponse.json({
        success: true,
        action: active ? "DEFENSE_ACTIVE" : "DEFENSE_DISARMED",
        active,
        dynamicFeeBps: newFeeBps,
        nonce: nonce.toString(),
        txHash,
        blockNumber: Number(receipt.blockNumber),
        status: receipt.status === "success" ? "SUCCESS" : "REVERTED",
        explorerUrl: `https://sepolia.basescan.org/tx/${txHash}`,
        summary: active
          ? `Uniswap v4 Hook defense mode ARMED on Base Sepolia with ${newFeeBps} BPS fee.`
          : `Uniswap v4 Hook defense mode DISARMED on Base Sepolia (30 BPS baseline).`,
        contract: "AquaGhostHook"
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error("[/api/tx] Transaction Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.shortMessage || err.message || "Failed to broadcast transaction to Base Sepolia"
      },
      { status: 500 }
    );
  }
}
