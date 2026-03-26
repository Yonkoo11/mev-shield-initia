"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  useDeposit,
  useWithdraw,
  useTokenAddresses,
  useApproveToken,
  useTokenAllowance,
  useWalletTokenBalance,
} from "../hooks/useBatchAuction";
import { BATCH_AUCTION_ADDRESS, TOKEN_DECIMALS } from "../lib/contract";
import { parseContractError } from "../lib/errors";
import { useToast } from "./Toast";

type Mode = "deposit" | "withdraw";
type ApprovalStep = "idle" | "approveA" | "approveB" | "depositing";

export function DepositPanel() {
  const { isConnected } = useAccount();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("deposit");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [approvalStep, setApprovalStep] = useState<ApprovalStep>("idle");

  const { tokenA, tokenB } = useTokenAddresses();
  const { deposit, isPending: depositPending, isSuccess: depositSuccess, isError: depositError, error: depositErr, reset: resetDeposit } = useDeposit();
  const { withdraw, isPending: withdrawPending, isSuccess: withdrawSuccess, isError: withdrawError, error: withdrawErr, reset: resetWithdraw } = useWithdraw();

  const { approve: approveA, isPending: approveAPending, isSuccess: approveASuccess, reset: resetApproveA } = useApproveToken(tokenA as `0x${string}` | undefined);
  const { approve: approveB, isPending: approveBPending, isSuccess: approveBSuccess, reset: resetApproveB } = useApproveToken(tokenB as `0x${string}` | undefined);

  const { allowance: allowanceA } = useTokenAllowance(tokenA as `0x${string}` | undefined, BATCH_AUCTION_ADDRESS);
  const { allowance: allowanceB } = useTokenAllowance(tokenB as `0x${string}` | undefined, BATCH_AUCTION_ADDRESS);

  const { balance: walletBalA } = useWalletTokenBalance(tokenA as `0x${string}` | undefined);
  const { balance: walletBalB } = useWalletTokenBalance(tokenB as `0x${string}` | undefined);

  const isPending = depositPending || withdrawPending || approveAPending || approveBPending;
  const fmt = (val: bigint) => parseFloat(formatUnits(val, TOKEN_DECIMALS)).toFixed(2);

  const parsedA = amountA ? parseUnits(amountA, TOKEN_DECIMALS) : 0n;
  const parsedB = amountB ? parseUnits(amountB, TOKEN_DECIMALS) : 0n;

  const aExceedsBalance = mode === "deposit" && parsedA > 0n && parsedA > walletBalA;
  const bExceedsBalance = mode === "deposit" && parsedB > 0n && parsedB > walletBalB;
  const hasValidationError = aExceedsBalance || bExceedsBalance;

  useEffect(() => {
    if (depositSuccess) {
      toast.success("Deposit successful!");
      setAmountA("");
      setAmountB("");
      setApprovalStep("idle");
      resetDeposit();
    }
    if (withdrawSuccess) {
      toast.success("Withdrawal successful!");
      setAmountA("");
      setAmountB("");
      resetWithdraw();
    }
    if (depositError) {
      toast.error(parseContractError(depositErr));
      setApprovalStep("idle");
      resetDeposit();
    }
    if (withdrawError) {
      toast.error(parseContractError(withdrawErr));
      resetWithdraw();
    }
  }, [depositSuccess, withdrawSuccess, depositError, withdrawError, depositErr, withdrawErr, resetDeposit, resetWithdraw, toast]);

  useEffect(() => {
    if (approveASuccess && approvalStep === "approveA") {
      resetApproveA();
      const needApproveB = parsedB > 0n && allowanceB !== undefined && allowanceB < parsedB;
      if (needApproveB) {
        setApprovalStep("approveB");
        toast.info("INIT approved. Now approving USDC...");
        approveB(BATCH_AUCTION_ADDRESS, parsedB);
      } else {
        setApprovalStep("depositing");
        toast.info("Approved. Depositing...");
        deposit(parsedA, parsedB);
      }
    }
  }, [approveASuccess, approvalStep, parsedA, parsedB, allowanceB, resetApproveA, approveB, deposit, toast]);

  useEffect(() => {
    if (approveBSuccess && approvalStep === "approveB") {
      resetApproveB();
      setApprovalStep("depositing");
      toast.info("Approved. Depositing...");
      deposit(parsedA, parsedB);
    }
  }, [approveBSuccess, approvalStep, parsedA, parsedB, resetApproveB, deposit, toast]);

  const handleSubmit = () => {
    if (parsedA === 0n && parsedB === 0n) {
      toast.error("Enter at least one amount");
      return;
    }
    if (hasValidationError) return;

    if (mode === "deposit") {
      const needApproveA = parsedA > 0n && allowanceA !== undefined && allowanceA < parsedA;
      const needApproveB = parsedB > 0n && allowanceB !== undefined && allowanceB < parsedB;

      if (needApproveA) {
        setApprovalStep("approveA");
        toast.info(needApproveB ? "Step 1/3: Approving INIT..." : "Approving INIT...");
        approveA(BATCH_AUCTION_ADDRESS, parsedA);
        return;
      }
      if (needApproveB) {
        setApprovalStep("approveB");
        toast.info("Approving USDC...");
        approveB(BATCH_AUCTION_ADDRESS, parsedB);
        return;
      }

      setApprovalStep("depositing");
      deposit(parsedA, parsedB);
    } else {
      withdraw(parsedA, parsedB);
    }
  };

  if (!isConnected) return null;

  return (
    <div className="bg-shield-card border border-shield-border rounded-xl p-5">
      <div className="flex gap-1 bg-shield-bg rounded-lg p-1 mb-4">
        <button
          onClick={() => { setMode("deposit"); setApprovalStep("idle"); }}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 ease-out ${
            mode === "deposit"
              ? "bg-shield-accent/20 text-shield-accent"
              : "text-shield-muted hover:text-shield-text"
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => { setMode("withdraw"); setApprovalStep("idle"); }}
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
          <div className="flex items-center justify-between">
            <label className="text-xs text-shield-muted">INIT Amount</label>
            {mode === "deposit" && (
              <button
                onClick={() => setAmountA(formatUnits(walletBalA, TOKEN_DECIMALS))}
                className="text-[10px] text-shield-accent hover:text-shield-accent/80"
              >
                Max: {fmt(walletBalA)}
              </button>
            )}
          </div>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            placeholder="0.00"
            className="w-full mt-1 bg-shield-bg border border-shield-border rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-shield-accent"
          />
          {aExceedsBalance && (
            <p className="text-[10px] text-shield-red mt-1">Exceeds wallet balance</p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-shield-muted">USDC Amount</label>
            {mode === "deposit" && (
              <button
                onClick={() => setAmountB(formatUnits(walletBalB, TOKEN_DECIMALS))}
                className="text-[10px] text-shield-accent hover:text-shield-accent/80"
              >
                Max: {fmt(walletBalB)}
              </button>
            )}
          </div>
          <input
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            placeholder="0.00"
            className="w-full mt-1 bg-shield-bg border border-shield-border rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-shield-accent"
          />
          {bExceedsBalance && (
            <p className="text-[10px] text-shield-red mt-1">Exceeds wallet balance</p>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={isPending || (!amountA && !amountB) || hasValidationError}
          className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ease-out disabled:opacity-50 ${
            mode === "deposit"
              ? "bg-shield-accent/10 text-shield-accent border border-shield-accent/30 hover:bg-shield-accent/20"
              : "bg-shield-red/10 text-shield-red border border-shield-red/30 hover:bg-shield-red/20"
          }`}
        >
          {isPending
            ? (approvalStep === "approveA" ? "Approving INIT..."
              : approvalStep === "approveB" ? "Approving USDC..."
              : "Processing...")
            : mode === "deposit" ? "Deposit" : "Withdraw"}
        </button>
      </div>
    </div>
  );
}
