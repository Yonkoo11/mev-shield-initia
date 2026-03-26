"use client";

import { useAccount } from "wagmi";

export function BridgePanel() {
  const { isConnected } = useAccount();

  if (!isConnected) return null;

  return (
    <div className="bg-shield-card border border-shield-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-shield-muted mb-4">
        Initia Bridge
      </h3>
      <div className="bg-shield-bg rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-shield-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
          <div>
            <p className="text-sm text-shield-text">
              Bridge assets from Initia L1
            </p>
            <p className="text-xs text-shield-muted mt-1">
              Transfer INIT and USDC to this MiniEVM rollup via the Initia
              bridge. Assets bridged are available for deposit into the batch
              auction contract.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-shield-muted">Source Chain</span>
            <span className="text-shield-text font-mono">Initia L1</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-shield-muted">Destination</span>
            <span className="text-shield-text font-mono">MEV Shield Minitia</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-shield-muted">Status</span>
            <span className="text-shield-yellow font-mono">Coming Soon</span>
          </div>
        </div>

        <button
          disabled
          className="w-full py-2.5 bg-shield-border/50 text-shield-muted rounded-lg text-sm font-medium cursor-not-allowed"
        >
          Bridge (Coming Soon)
        </button>

        <p className="text-[10px] text-shield-muted/60 text-center">
          Initia IBC bridge integration will be available after testnet deployment.
        </p>
      </div>
    </div>
  );
}
