import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import * as fs from "fs";
import * as path from "path";

// Load .env
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

const ABI = parseAbi([
  "function join() external",
  "function isUser(address) external view returns (bool)",
  "function challengeOpen() external view returns (bool)",
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
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
  });
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
  });

  console.log(`Calling join() on Sepolia from ${account.address}...`);

  const hasJoined = await publicClient.readContract({
    address: LENDING_ADDRESS,
    abi: ABI,
    functionName: "isUser",
    args: [account.address],
  });

  if (hasJoined) {
    console.log("✅ You have already joined the challenge!");
    return;
  }

  const hash = await walletClient.writeContract({
    address: LENDING_ADDRESS,
    abi: ABI,
    functionName: "join",
  });

  console.log(`Transaction broadcast! Hash: ${hash}`);
  console.log("Waiting for confirmation on Sepolia...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`✅ Successfully joined challenge in block ${receipt.blockNumber}!`);
}

main().catch(console.error);
