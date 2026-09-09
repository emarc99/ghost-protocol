"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";
import { sepolia } from "viem/chains";

export const anvilLocalhost = defineChain({
  id: 31337,
  name: "Anvil Localhost (AquaGhost)",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"]
    }
  },
  testnet: true
});

export const wagmiConfig = getDefaultConfig({
  appName: "AquaGhost Protocol",
  projectId: "9c0c16fb3b29d4991206129188049102", // WalletConnect public demo project ID
  chains: [anvilLocalhost, sepolia],
  ssr: true
});
