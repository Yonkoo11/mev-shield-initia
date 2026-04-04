"use client";

import { useEffect, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { CHAIN_ID } from "../lib/contract";

export function ChainGuard({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending, isError } = useSwitchChain();
  const [showDemo, setShowDemo] = useState(false);

  // Auto-switch to correct network on connect
  useEffect(() => {
    if (isConnected && chainId !== CHAIN_ID) {
      switchChain({ chainId: CHAIN_ID });
    }
  }, [isConnected, chainId, switchChain]);

  if (!isConnected) return <>{children}</>;
  if (chainId === CHAIN_ID) return <>{children}</>;

  // User chose to view the UI anyway
  if (showDemo) return <>{children}</>;

  // Auto-switch failed or rejected -- show helpful context
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center mt-16 gap-6">
        <div className="bg-shield-card border border-shield-border rounded-lg p-6 max-w-lg text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-shield-accent/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-shield-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">BatchFi runs on its own chain</h3>
          <p className="text-sm text-shield-muted leading-relaxed">
            BatchFi is a dedicated Initia MiniEVM rollup. The appchain is running locally
            for this hackathon demo. To trade, run the rollup on your machine with the instructions in the README.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => switchChain({ chainId: CHAIN_ID })}
              disabled={isPending}
              className="flex-1 py-2.5 bg-shield-accent/10 text-shield-accent border border-shield-accent/30 rounded-lg text-sm font-medium hover:bg-shield-accent/20 transition-colors duration-150 ease-out disabled:opacity-50"
            >
              {isPending ? "Switching..." : "Try Again"}
            </button>
            <button
              onClick={() => setShowDemo(true)}
              className="flex-1 py-2.5 bg-shield-card text-shield-text border border-shield-border rounded-lg text-sm font-medium hover:bg-shield-bg transition-colors duration-150 ease-out"
            >
              Preview UI
            </button>
          </div>
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
