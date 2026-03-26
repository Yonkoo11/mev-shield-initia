"use client";

import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { injected, metaMask } from "wagmi/connectors";
import { minitia } from "../lib/contract";

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
