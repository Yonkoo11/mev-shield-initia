"use client";

import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useUserBalance } from "../hooks/useBatchAuction";
import { TOKEN_DECIMALS, TOKEN_A_DISPLAY, TOKEN_B_DISPLAY } from "../lib/contract";

export function BalanceDisplay() {
  const { isConnected } = useAccount();
  const { balance, isLoading } = useUserBalance();

  const labelA = TOKEN_A_DISPLAY;
  const labelB = TOKEN_B_DISPLAY;

  const fmt = (val: bigint | undefined) => {
    if (!val) return "0.00";
    return parseFloat(formatUnits(val, TOKEN_DECIMALS)).toFixed(2);
  };

  if (!isConnected) return null;

  return (
    <div className="bg-shield-card border border-shield-border rounded-lg p-5">
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
            <span className="text-shield-muted text-sm">{labelA}</span>
            <div className="text-right">
              <span className="text-lg font-mono tabular-nums">
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
            <span className="text-shield-muted text-sm">{labelB}</span>
            <div className="text-right">
              <span className="text-lg font-mono tabular-nums">
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
