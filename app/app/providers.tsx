"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";
import { injected, metaMask } from "wagmi/connectors";

export const minitia = defineChain({
  id: 1411570067076288,
  name: "MEV Shield Minitia",
  nativeCurrency: { name: "GAS", symbol: "GAS", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://localhost:8545"] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.initia.xyz" },
  },
});

const config = createConfig({
  chains: [minitia],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [minitia.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
