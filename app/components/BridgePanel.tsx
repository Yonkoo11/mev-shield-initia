"use client";

import { useAccount } from "wagmi";
import { useInterwovenKit } from "@initia/interwovenkit-react";

export function BridgePanel() {
  const { isConnected } = useAccount();
  const { openBridge } = useInterwovenKit();

  if (!isConnected) return null;

  const handleBridge = () => {
    openBridge({
      srcChainId: "initiation-2",
      srcDenom: "uinit",
      dstChainId: "mevshield-1",
      dstDenom: "uinit",
    });
  };

  return (
    <button
      onClick={handleBridge}
      className="block w-full bg-shield-card border border-shield-border rounded-xl p-4 hover:border-shield-accent/30 transition-colors duration-150 ease-out group text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-shield-accent/10 flex items-center justify-center shrink-0">
          <svg
            className="w-4 h-4 text-shield-accent"
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
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-shield-text group-hover:text-shield-accent transition-colors">
            Interwoven Bridge
          </p>
          <p className="text-xs text-shield-muted">
            Bridge INIT from Initia L1 to MEV Shield
          </p>
        </div>
        <svg
          className="w-4 h-4 text-shield-muted group-hover:text-shield-accent shrink-0 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </div>
    </button>
  );
}
