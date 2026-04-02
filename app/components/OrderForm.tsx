"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useSubmitOrder, useCancelOrder, useUserBalance, useHasOrder } from "../hooks/useBatchAuction";
import { TOKEN_DECIMALS, PRICE_DECIMALS } from "../lib/contract";
import { parseContractError } from "../lib/errors";
import { useToast } from "./Toast";

interface OrderFormProps {
  batchId: bigint | null;
  onOrderSubmitted?: () => void;
}

export function OrderForm({ batchId, onOrderSubmitted }: OrderFormProps) {
  const { isConnected, address } = useAccount();
  const toast = useToast();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");

  const { balance } = useUserBalance();
  const { hasOrder: userHasOrder } = useHasOrder(
    batchId !== null ? batchId : undefined,
    address as `0x${string}` | undefined
  );

  const {
    submitOrder,
    isPending: submitPending,
    isSuccess: submitSuccess,
    isError: submitError,
    error: submitErr,
    reset: resetSubmit,
  } = useSubmitOrder();

  const {
    cancelOrder,
    isPending: cancelPending,
    isSuccess: cancelSuccess,
    reset: resetCancel,
  } = useCancelOrder();

  useEffect(() => {
    if (submitSuccess) {
      toast.success(`Order submitted to batch #${batchId?.toString()}! Sealed until settlement.`);
      setPrice("");
      setAmount("");
      onOrderSubmitted?.();
      resetSubmit();
    }
    if (submitError) {
      toast.error(parseContractError(submitErr));
      resetSubmit();
    }
  }, [submitSuccess, submitError, submitErr, batchId, onOrderSubmitted, resetSubmit, toast]);

  useEffect(() => {
    if (cancelSuccess) {
      toast.success("Order cancelled.");
      resetCancel();
    }
  }, [cancelSuccess, resetCancel, toast]);

  // Validation
  const parsedPrice = price ? parseFloat(price) : 0;
  const parsedAmount = amount ? parseFloat(amount) : 0;
  const priceInvalid = price !== "" && parsedPrice <= 0;
  const amountInvalid = amount !== "" && parsedAmount <= 0;

  // Check deposited balance for the relevant side
  const availableBalance = balance
    ? side === "buy"
      ? balance.tokenBBalance - balance.tokenBLocked // need USDC to buy
      : balance.tokenABalance - balance.tokenALocked // need INIT to sell
    : 0n;

  const orderCost = price && amount
    ? side === "buy"
      ? parseUnits((parsedPrice * parsedAmount).toFixed(TOKEN_DECIMALS), TOKEN_DECIMALS) // USDC needed
      : parseUnits(amount, TOKEN_DECIMALS) // INIT needed
    : 0n;

  const insufficientBalance = orderCost > 0n && orderCost > availableBalance;

  const handleSubmit = () => {
    if (!price || !amount || batchId === null) return;
    if (priceInvalid || amountInvalid || insufficientBalance) return;

    const sideNum = side === "buy" ? 0 : 1;
    const limitPrice = parseUnits(price, PRICE_DECIMALS);
    const orderAmount = parseUnits(amount, TOKEN_DECIMALS);

    submitOrder(batchId, sideNum, limitPrice, orderAmount);
  };

  const handleCancel = () => {
    if (batchId === null) return;
    cancelOrder(batchId);
  };

  const isPending = submitPending || cancelPending;
  const fmt = (val: bigint) => parseFloat(formatUnits(val, TOKEN_DECIMALS)).toFixed(2);

  if (!isConnected) return null;

  return (
    <div className="bg-shield-card border border-shield-border rounded-lg p-5">
      <h3 className="text-sm font-medium text-shield-muted mb-4">
        Submit Order {batchId !== null ? `(Batch #${batchId.toString()})` : ""}
      </h3>

      {batchId === null ? (
        <p className="text-shield-muted text-sm">
          Waiting for an open batch...
        </p>
      ) : (
        <>
          {/* Side toggle */}
          <div className="flex gap-1 bg-shield-bg rounded-lg p-1 mb-4">
            <button
              onClick={() => setSide("buy")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-out ${
                side === "buy"
                  ? "bg-shield-accent/20 text-shield-accent"
                  : "text-shield-muted hover:text-shield-text"
              }`}
            >
              Buy INIT
            </button>
            <button
              onClick={() => setSide("sell")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-out ${
                side === "sell"
                  ? "bg-shield-red/20 text-shield-red"
                  : "text-shield-muted hover:text-shield-text"
              }`}
            >
              Sell INIT
            </button>
          </div>

          {/* Available balance */}
          <div className="text-xs text-shield-muted mb-3">
            Available: <span className="font-mono text-shield-text">{fmt(availableBalance)}</span>{" "}
            {side === "buy" ? "USDC" : "INIT"}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-shield-muted">
                Limit Price (USDC per INIT)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1.50"
                min="0"
                step="0.01"
                className="w-full mt-1 bg-shield-bg border border-shield-border rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-shield-accent"
              />
              {priceInvalid && (
                <p className="text-[10px] text-shield-red mt-1">Price must be greater than 0</p>
              )}
            </div>
            <div>
              <label className="text-xs text-shield-muted">Amount (INIT)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
                min="0"
                step="0.01"
                className="w-full mt-1 bg-shield-bg border border-shield-border rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-shield-accent"
              />
              {amountInvalid && (
                <p className="text-[10px] text-shield-red mt-1">Amount must be greater than 0</p>
              )}
            </div>

            {price && amount && parsedPrice > 0 && parsedAmount > 0 && (
              <div className="bg-shield-bg rounded-lg p-3 text-xs text-shield-muted space-y-1">
                <div className="flex justify-between">
                  <span>Total {side === "buy" ? "cost" : "proceeds"}</span>
                  <span className="font-mono text-shield-text">
                    {(parsedPrice * parsedAmount).toFixed(2)} USDC
                  </span>
                </div>
                {insufficientBalance && (
                  <p className="text-shield-red">Insufficient deposited balance</p>
                )}
              </div>
            )}

            {userHasOrder ? (
              <div className="w-full py-3 rounded-lg text-sm font-medium text-center bg-shield-accent/10 text-shield-accent border border-shield-accent/20">
                Order active in this batch
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isPending || !price || !amount || priceInvalid || amountInvalid || insufficientBalance}
                className={`w-full py-3 rounded-lg text-sm font-medium transition-colors duration-150 ease-out disabled:opacity-50 ${
                  side === "buy"
                    ? "bg-shield-accent text-shield-bg hover:bg-shield-accent/90"
                    : "bg-shield-red text-white hover:bg-shield-red/90"
                }`}
              >
                {submitPending
                  ? "Submitting..."
                  : `${side === "buy" ? "Buy" : "Sell"} INIT`}
              </button>
            )}

            {userHasOrder && (
              <button
                onClick={handleCancel}
                disabled={cancelPending}
                className="w-full py-2 rounded-lg text-xs font-medium text-shield-muted border border-shield-border hover:border-shield-red/30 hover:text-shield-red transition-colors duration-150 ease-out disabled:opacity-50"
              >
                {cancelPending ? "Cancelling..." : "Cancel My Order"}
              </button>
            )}

          </div>
        </>
      )}
    </div>
  );
}
