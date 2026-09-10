import { createPublicClient, http, formatEther, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as fs from "fs";
import * as path from "path";

// Load .env manually if needed
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        process.env[key] = val;
      }
    }
  }
}

const LENDING_ADDRESS = "0x88574e7Cc0027afd04951daa09B64d4441931ba1" as const;
const VETH_ADDRESS = "0x5dED1a40c3D56dA42E7f932f781c0432556c9814" as const;
const VUSD_ADDRESS = "0x6Fe92Ead5299040f50F095860b5A0A7A2D4041A2" as const;

const ABI = parseAbi([
  "function isUser(address) external view returns (bool)",
  "function challengeOpen() external view returns (bool)",
  "function scenarioStartTime() external view returns (uint256)",
  "function vETHPrice() external view returns (uint256)",
  "function getUserPosition(address) external view returns ((uint256 collateral, uint256 debt, uint256 hf, uint256 lastUpdateTime, uint256 cumulativeDebtTime))",
  "function balanceOf(address) external view returns (uint256)",
  "function allowance(address, address) external view returns (uint256)",
]);

async function main() {
  let pk = (process.env.CRE_ETH_PRIVATE_KEY || "").trim().replace(/^["']|["']$/g, "");
  if (!pk || pk.startsWith("0x0000000000000000000000000000000000000000")) {
    console.error("❌ Error: CRE_ETH_PRIVATE_KEY is not configured in .env");
    process.exit(1);
  }
  if (!pk.startsWith("0x") && !pk.startsWith("0X")) {
    pk = `0x${pk}`;
  }

  const account = privateKeyToAccount(pk as `0x${string}`);
  const client = createPublicClient({
    chain: sepolia,
    transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
  });

  console.log("==================================================================");
  console.log("🔎 CHECKING SEPOLIA ACCOUNT & CHALLENGE STATUS");
  console.log("==================================================================");
  console.log(`Operator Wallet Address: ${account.address}`);

  const ethBalance = await client.getBalance({ address: account.address });
  console.log(`Sepolia ETH (Gas):       ${formatEther(ethBalance)} ETH`);

  if (ethBalance === 0n) {
    console.log("⚠️ WARNING: Wallet has 0 Sepolia ETH. You need a small amount of Sepolia ETH for gas!");
  }

  const isOpen = await client.readContract({
    address: LENDING_ADDRESS,
    abi: ABI,
    functionName: "challengeOpen",
  });
  console.log(`Challenge Open Status:   ${isOpen ? "✅ OPEN" : "❌ CLOSED"}`);

  const startTime = await client.readContract({
    address: LENDING_ADDRESS,
    abi: ABI,
    functionName: "scenarioStartTime",
  });
  console.log(`Scenario Started:        ${startTime > 0n ? `✅ STARTED (timestamp: ${startTime})` : "⏳ NOT STARTED YET (Waiting for Admin/Organizers)"}`);

  const hasJoined = await client.readContract({
    address: LENDING_ADDRESS,
    abi: ABI,
    functionName: "isUser",
    args: [account.address],
  });
  console.log(`Joined Challenge:        ${hasJoined ? "✅ YES (Active Participant)" : "❌ NO (You must call join())"}`);

  const price = await client.readContract({
    address: LENDING_ADDRESS,
    abi: ABI,
    functionName: "vETHPrice",
  });
  console.log(`Current vETH Price:      $${(Number(price) / 100).toFixed(2)} vUSD`);

  if (hasJoined) {
    const pos = await client.readContract({
      address: LENDING_ADDRESS,
      abi: ABI,
      functionName: "getUserPosition",
      args: [account.address],
    });
    console.log("------------------------------------------------------------------");
    console.log(`Locked Collateral:       ${(Number(pos.collateral) / 100).toFixed(2)} vETH`);
    console.log(`Active Debt:             ${(Number(pos.debt) / 100).toFixed(2)} vUSD`);
    console.log(`Current Health Factor:   ${(Number(pos.hf) / 100).toFixed(2)} (${pos.hf > 100n ? "SAFE" : "DANGER"})`);

    const freeVeth = await client.readContract({
      address: VETH_ADDRESS,
      abi: ABI,
      functionName: "balanceOf",
      args: [account.address],
    });
    console.log(`Free vETH in Wallet:     ${(Number(freeVeth) / 100).toFixed(2)} vETH (Emergency Defense Reserve)`);

    const freeVusd = await client.readContract({
      address: VUSD_ADDRESS,
      abi: ABI,
      functionName: "balanceOf",
      args: [account.address],
    });
    console.log(`Free vUSD in Wallet:     ${(Number(freeVusd) / 100).toFixed(2)} vUSD`);

    const vethAllowance = await client.readContract({
      address: VETH_ADDRESS,
      abi: ABI,
      functionName: "allowance",
      args: [account.address, LENDING_ADDRESS],
    });
    console.log(`vETH Allowance:          ${vethAllowance > 0n ? `✅ APPROVED (${vethAllowance === (1n << 256n) - 1n ? "UNLIMITED" : vethAllowance.toString()})` : "❌ NOT APPROVED (Will auto-approve on 1st deposit)"}`);
  }
  console.log("==================================================================");
}

main().catch(console.error);
