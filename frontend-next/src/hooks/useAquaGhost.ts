"use client";

import { useReadContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESSES, ERC20_ABI, AQUA_GHOST_APP_ABI } from "@/lib/constants";
import { formatEther, formatUnits } from "viem";

export function useAquaGhostContracts() {
  const { address, isConnected } = useAccount();

  // WETH Balance
  const { data: wethRaw, refetch: refetchWeth } = useReadContract({
    address: CONTRACT_ADDRESSES.contracts.WETH,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address)
    }
  });

  // USDC Balance
  const { data: usdcRaw, refetch: refetchUsdc } = useReadContract({
    address: CONTRACT_ADDRESSES.contracts.USDC,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address)
    }
  });

  // AquaGhostApp State
  const { data: isDefensiveActiveRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.contracts.AquaGhostApp,
    abi: AQUA_GHOST_APP_ABI,
    functionName: "isDefensiveShiftActive"
  });

  const formattedWeth = wethRaw ? Number(formatEther(wethRaw)) : 10.0;
  const formattedUsdc = usdcRaw ? Number(formatUnits(usdcRaw, 18)) : 25000.0;

  return {
    wethBalance: formattedWeth,
    usdcBalance: formattedUsdc,
    isDefensiveShiftActive: Boolean(isDefensiveActiveRaw),
    refetchBalances: () => {
      refetchWeth();
      refetchUsdc();
    }
  };
}
