"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";
import {
  useDeposit,
  useWithdraw,
  useTokenAddresses,
  useApproveToken,
  useTokenAllowance,
} from "../hooks/useBatchAuction";
import { BATCH_AUCTION_ADDRESS } from "../lib/contract";

type Mode = "deposit" | "withdraw";

export function DepositPanel() {
  const { isConnected } = useAccount();
  const [mode, setMode] = useState<Mode>("deposit");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [status, setStatus] = useState("");

  const { tokenA, tokenB } = useTokenAddresses();
  const { deposit, isPending: depositPending, isSuccess: depositSuccess, isError: depositError, error: depositErr, reset: resetDeposit } = useDeposit();
  const { withdraw, isPending: withdrawPending, isSuccess: withdrawSuccess, isError: withdrawError, error: withdrawErr, reset: resetWithdraw } = useWithdraw();

  const { approve: approveA, isPending: approveAPending, isSuccess: approveASuccess, reset: resetApproveA } = useApproveToken(tokenA as `0x${string}` | undefined);
  const { approve: approveB, isPending: approveBPending, isSuccess: approveBSuccess, reset: resetApproveB } = useApproveToken(tokenB as `0x${string}` | undefined);

  const { allowance: allowanceA } = useTokenAllowance(tokenA as `0x${string}` | undefined, BATCH_AUCTION_ADDRESS);
  const { allowance: allowanceB } = useTokenAllowance(tokenB as `0x${string}` | undefined, BATCH_AUCTION_ADDRESS);

  const isPending = depositPending || withdrawPending || approveAPending || approveBPending;

  useEffect(() => {
    if (depositSuccess) {
      setStatus("Deposit successful!");
      setAmountA("");
      setAmountB("");
      setTimeout(() => { resetDeposit(); setStatus(""); }, 3000);
    }
    if (withdrawSuccess) {
      setStatus("Withdrawal successful!");
      setAmountA("");
      setAmountB("");
      setTimeout(() => { resetWithdraw(); setStatus(""); }, 3000);
    }
    if (depositError) {
      setStatus("Error: " + (depositErr?.message || "Transaction failed"));
    }
    if (withdrawError) {
      setStatus("Error: " + (withdrawErr?.message || "Transaction failed"));
    }
  }, [depositSuccess, withdrawSuccess, depositError, withdrawError, depositErr, withdrawErr, resetDeposit, resetWithdraw]);

  const handleSubmit = () => {
    const a = amountA ? parseUnits(amountA, 6) : 0n;
    const b = amountB ? parseUnits(amountB, 6) : 0n;

    if (a === 0n && b === 0n) {
      setStatus("Enter at least one amount");
      return;
    }

    if (mode === "deposit") {
      // Check if we need approval first
      const needApproveA = a > 0n && allowanceA !== undefined && allowanceA < a;
      const needApproveB = b > 0n && allowanceB !== undefined && allowanceB < b;

      if (needApproveA) {
        setStatus("Approving Token A...");
        approveA(BATCH_AUCTION_ADDRESS, a);
        return;
      }
      if (needApproveB) {
        setStatus("Approving Token B...");
        approveB(BATCH_AUCTION_ADDRESS, b);
        return;
      }

      setStatus("Depositing...");
      deposit(a, b);
    } else {
      setStatus("Withdrawing...");
      withdraw(a, b);
    }
  };

  // After approval success, proceed to deposit
  useEffect(() => {
    if (approveASuccess || approveBSuccess) {
      const a = amountA ? parseUnits(amountA, 6) : 0n;
      const b = amountB ? parseUnits(amountB, 6) : 0n;
      setStatus("Depositing...");
      deposit(a, b);
      resetApproveA();
      resetApproveB();
    }
  }, [approveASuccess, approveBSuccess, amountA, amountB, deposit, resetApproveA, resetApproveB]);

  if (!isConnected) return null;

  return (
    <div className="bg-shield-card border border-shield-border rounded-xl p-5">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-shield-bg rounded-lg p-1 mb-4">
        <button
          onClick={() => { setMode("deposit"); setStatus(""); }}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 ease-out ${
            mode === "deposit"
              ? "bg-shield-accent/20 text-shield-accent"
              : "text-shield-muted hover:text-shield-text"
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => { setMode("withdraw"); setStatus(""); }}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 ease-out ${
            mode === "withdraw"
              ? "bg-shield-red/20 text-shield-red"
              : "text-shield-muted hover:text-shield-text"
          }`}
        >
          Withdraw
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-shield-muted">INIT Amount</label>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="0.00"
            className="w-full mt-1 bg-shield-bg border border-shield-border rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-shield-accent"
          />
        </div>
        <div>
          <label className="text-xs text-shield-muted">USDC Amount</label>
          <input
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            placeholder="0.00"
            className="w-full mt-1 bg-shield-bg border border-shield-border rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-shield-accent"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isPending || (!amountA && !amountB)}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-out disabled:opacity-50 ${
            mode === "deposit"
              ? "bg-shield-accent/10 text-shield-accent border border-shield-accent/30 hover:bg-shield-accent/20"
              : "bg-shield-red/10 text-shield-red border border-shield-red/30 hover:bg-shield-red/20"
          }`}
        >
          {isPending ? "Processing..." : mode === "deposit" ? "Deposit" : "Withdraw"}
        </button>
        {status && (
          <p className={`text-xs mt-2 ${status.startsWith("Error") ? "text-shield-red" : "text-shield-muted"}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
