"use client";

import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useUserBalance } from "../hooks/useBatchAuction";

export function BalanceDisplay() {
  const { isConnected } = useAccount();
  const { balance, isLoading } = useUserBalance();

  const fmt = (val: bigint | undefined) => {
    if (!val) return "0.00";
    return parseFloat(formatUnits(val, 6)).toFixed(2);
  };

  if (!isConnected) return null;

  return (
    <div className="bg-shield-card border border-shield-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-shield-muted mb-4">
        Your Balance
      </h3>
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-6 bg-shield-bg rounded animate-pulse" />
          <div className="h-6 bg-shield-bg rounded animate-pulse" />
        </div>
      ) : balance ? (
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-shield-muted text-sm">INIT (Token A)</span>
            <div className="text-right">
              <span className="text-lg font-mono">
                {fmt(balance.tokenABalance)}
              </span>
              {balance.tokenALocked > 0n && (
                <span className="text-xs text-shield-yellow ml-2">
                  ({fmt(balance.tokenALocked)} locked)
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-shield-muted text-sm">USDC (Token B)</span>
            <div className="text-right">
              <span className="text-lg font-mono">
                {fmt(balance.tokenBBalance)}
              </span>
              {balance.tokenBLocked > 0n && (
                <span className="text-xs text-shield-yellow ml-2">
                  ({fmt(balance.tokenBLocked)} locked)
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-shield-muted text-sm">
          No balance found. Deposit tokens to start trading.
        </p>
      )}
    </div>
  );
}
