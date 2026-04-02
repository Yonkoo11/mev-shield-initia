"use client";

import { useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { CHAIN_ID } from "../lib/contract";

export function ChainGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending, isError } = useSwitchChain();

  // Auto-switch to correct network on connect
  useEffect(() => {
    if (isConnected && chainId !== CHAIN_ID) {
      switchChain({ chainId: CHAIN_ID });
    }
  }, [isConnected, chainId, switchChain]);

  if (!isConnected) return <>{children}</>;
  if (chainId === CHAIN_ID) return <>{children}</>;

  // Only show manual fallback if auto-switch was rejected
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 gap-6">
        <div className="bg-shield-card border border-shield-red/30 rounded-lg p-6 max-w-md text-center space-y-4">
          <h3 className="text-lg font-semibold">Wrong Network</h3>
          <p className="text-sm text-shield-muted">
            Please switch to MEV Shield Minitia to trade.
          </p>
          <button
            onClick={() => switchChain({ chainId: CHAIN_ID })}
            disabled={isPending}
            className="w-full py-2.5 bg-shield-accent/10 text-shield-accent border border-shield-accent/30 rounded-lg text-sm font-medium hover:bg-shield-accent/20 transition-colors duration-150 ease-out disabled:opacity-50"
          >
            {isPending ? "Switching..." : "Switch Network"}
          </button>
        </div>
      </div>
    );
  }

  // Auto-switch in progress
  return (
    <div className="flex items-center justify-center mt-16">
      <p className="text-sm text-shield-muted">Switching network...</p>
    </div>
  );
}
