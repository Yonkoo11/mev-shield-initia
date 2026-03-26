"use client";

import { useAccount } from "wagmi";

export function BridgePanel() {
  const { isConnected } = useAccount();

  if (!isConnected) return null;

  return (
    <a
      href="https://app.testnet.initia.xyz/bridge"
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-shield-card border border-shield-border rounded-xl p-4 hover:border-shield-accent/30 transition-colors duration-150 ease-out group"
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
            Initia Bridge
          </p>
          <p className="text-xs text-shield-muted">
            Bridge INIT and USDC from Initia L1
          </p>
        </div>
        <svg
          className="w-4 h-4 text-shield-muted group-hover:text-shield-accent shrink-0 transition-colors"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </a>
  );
}
