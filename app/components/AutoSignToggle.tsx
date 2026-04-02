"use client";

import { useAccount } from "wagmi";
import { useMutation } from "@tanstack/react-query";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { INITIA_CHAIN_ID } from "../lib/contract";

export function AutoSignToggle() {
  const { isConnected } = useAccount();
  const { autoSign } = useInterwovenKit();

  const enable = useMutation({
    mutationFn: () => autoSign.enable(INITIA_CHAIN_ID),
    onError: (error) => console.error("Failed to enable auto-sign:", error),
  });

  const disable = useMutation({
    mutationFn: () => autoSign.disable(INITIA_CHAIN_ID),
    onError: (error) => console.error("Failed to disable auto-sign:", error),
  });

  if (!isConnected) return null;

  const isEnabled = autoSign?.isEnabledByChain?.[INITIA_CHAIN_ID] ?? false;
  const expiration = autoSign?.expiredAtByChain?.[INITIA_CHAIN_ID];
  const isLoading = autoSign?.isLoading || enable.isPending || disable.isPending;

  return (
    <div className="bg-shield-card border border-shield-border rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-shield-text">Session Signing</p>
            {isEnabled && (
              <span className="text-xs text-shield-accent bg-shield-accent/10 px-1.5 py-0.5 rounded">
                Active
              </span>
            )}
          </div>
          <p className="text-xs text-shield-muted mt-0.5">
            {isEnabled
              ? `Trade without wallet popups${expiration ? ` until ${expiration.toLocaleTimeString()}` : ""}`
              : "Sign once to approve a trading session"}
          </p>
        </div>
        <button
          onClick={() => (isEnabled ? disable.mutate() : enable.mutate())}
          disabled={isLoading}
          className={`relative w-11 h-6 rounded-full transition-colors duration-150 ease-out disabled:opacity-50 ${
            isEnabled ? "bg-shield-accent" : "bg-shield-border"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-150 ease-out ${
              isEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
