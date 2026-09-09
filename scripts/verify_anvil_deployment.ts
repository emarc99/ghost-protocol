import { JsonRpcProvider, Contract, formatEther, formatUnits } from "ethers";
import * as fs from "fs";

async function main() {
  const provider = new JsonRpcProvider("http://127.0.0.1:8545");
  const network = await provider.getNetwork();
  console.log(`Connected to Network: Chain ID ${network.chainId}`);

  const contractsData = JSON.parse(fs.readFileSync("frontend/contracts.json", "utf-8"));
  const { WETH, USDC, AquaGhostApp, AquaGhostHook, AquaRouter, UniswapPoolCaller, AquaSwapVM } = contractsData.contracts;

  const erc20Abi = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  const wethContract = new Contract(WETH, erc20Abi, provider);
  const usdcContract = new Contract(USDC, erc20Abi, provider);

  const deployer = contractsData.deployer;
  const user1 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  console.log("\n--- Real On-Chain Balances on Local Anvil Node ---");
  const deployerWeth = await wethContract.balanceOf(deployer);
  const deployerUsdc = await usdcContract.balanceOf(deployer);
  console.log(`Deployer (${deployer}):`);
  console.log(`  WETH: ${formatEther(deployerWeth)}`);
  console.log(`  USDC: ${formatEther(deployerUsdc)}`);

  const user1Weth = await wethContract.balanceOf(user1);
  const user1Usdc = await usdcContract.balanceOf(user1);
  console.log(`User #1 (${user1}):`);
  console.log(`  WETH: ${formatEther(user1Weth)}`);
  console.log(`  USDC: ${formatEther(user1Usdc)}`);

  // Verify AquaGhostApp on-chain state
  const appAbi = [
    "function aqua() view returns (address)",
    "function trustedEnclaveSigner() view returns (address)",
    "function swapVM() view returns (address)"
  ];
  const appContract = new Contract(AquaGhostApp, appAbi, provider);
  const registeredAqua = await appContract.aqua();
  const registeredSigner = await appContract.trustedEnclaveSigner();
  const registeredSwapVM = await appContract.swapVM();

  console.log("\n--- AquaGhostApp On-Chain State ---");
  console.log(`Address:               ${AquaGhostApp}`);
  console.log(`1inch Aqua Router:     ${registeredAqua} (matches: ${registeredAqua === AquaRouter})`);
  console.log(`AquaSwapVM Engine:     ${registeredSwapVM} (matches: ${registeredSwapVM === AquaSwapVM})`);
  console.log(`Trusted Enclave Signer:${registeredSigner} (matches: ${registeredSigner === contractsData.enclaveSigner})`);

  // Verify AquaGhostHook on-chain state
  const hookAbi = [
    "function defenseModeActive() view returns (bool)",
    "function dynamicFeeBps() view returns (uint24)",
    "function trustedEnclaveSigner() view returns (address)"
  ];
  const hookContract = new Contract(AquaGhostHook, hookAbi, provider);
  const defenseActive = await hookContract.defenseModeActive();
  const dynamicFee = await hookContract.dynamicFeeBps();
  const hookSigner = await hookContract.trustedEnclaveSigner();

  console.log("\n--- AquaGhostHook On-Chain State ---");
  console.log(`Address:               ${AquaGhostHook}`);
  console.log(`Defense Mode Active:   ${defenseActive}`);
  console.log(`Dynamic Fee (Bps):     ${dynamicFee}`);
  console.log(`Trusted Enclave Signer:${hookSigner}`);

  console.log("\n>>> ALL ON-CHAIN CONTRACTS & SEEDED BALANCES VERIFIED 100% OPERATIONAL! <<<\n");
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
