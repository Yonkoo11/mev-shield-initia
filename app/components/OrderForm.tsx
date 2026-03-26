"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { useSubmitOrder, useCancelOrder } from "../hooks/useBatchAuction";
import { PRICE_SCALE } from "../lib/contract";

interface OrderFormProps {
  batchId: bigint | null;
  onOrderSubmitted?: () => void;
}

export function OrderForm({ batchId, onOrderSubmitted }: OrderFormProps) {
  const { isConnected } = useAccount();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

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
      setStatus(
        `Order submitted to batch #${batchId?.toString()}! Your order is encrypted inside the TEE.`
      );
      setPrice("");
      setAmount("");
      onOrderSubmitted?.();
      setTimeout(() => { resetSubmit(); setStatus(""); }, 5000);
    }
    if (submitError) {
      setStatus("Error: " + (submitErr?.message || "Transaction failed"));
    }
  }, [submitSuccess, submitError, submitErr, batchId, onOrderSubmitted, resetSubmit]);

  useEffect(() => {
    if (cancelSuccess) {
      setStatus("Order cancelled.");
      setTimeout(() => { resetCancel(); setStatus(""); }, 3000);
    }
  }, [cancelSuccess, resetCancel]);

  const handleSubmit = () => {
    if (!price || !amount || batchId === null) return;

    const sideNum = side === "buy" ? 0 : 1;
    const limitPrice = parseUnits(price, 6); // PRICE_SCALE = 1e6
    const orderAmount = parseUnits(amount, 6);

    setStatus("Encrypting order for TEE...");
    submitOrder(batchId, sideNum, limitPrice, orderAmount);
  };

  const handleCancel = () => {
    if (batchId === null) return;
    cancelOrder(batchId);
  };

  const isPending = submitPending || cancelPending;

  if (!isConnected) return null;

  return (
    <div className="bg-shield-card border border-shield-border rounded-xl p-5">
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
                className="w-full mt-1 bg-shield-bg border border-shield-border rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-shield-accent"
              />
            </div>
            <div>
              <label className="text-xs text-shield-muted">Amount (INIT)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100.00"
                className="w-full mt-1 bg-shield-bg border border-shield-border rounded-lg px-3 py-2 text-base font-mono focus:outline-none focus:border-shield-accent"
              />
            </div>

            {price && amount && (
              <div className="bg-shield-bg rounded-lg p-3 text-xs text-shield-muted">
                <div className="flex justify-between">
                  <span>Total {side === "buy" ? "cost" : "proceeds"}</span>
                  <span className="font-mono text-shield-text">
                    {(parseFloat(price) * parseFloat(amount)).toFixed(2)} USDC
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending || !price || !amount}
              className={`w-full py-3 rounded-lg text-sm font-medium transition-colors duration-150 ease-out disabled:opacity-50 ${
                side === "buy"
                  ? "bg-shield-accent text-shield-bg hover:bg-shield-accent/90"
                  : "bg-shield-red text-white hover:bg-shield-red/90"
              }`}
            >
              {submitPending
                ? "Encrypting & Submitting..."
                : `${side === "buy" ? "Buy" : "Sell"} INIT`}
            </button>

            <button
              onClick={handleCancel}
              disabled={cancelPending}
              className="w-full py-2 rounded-lg text-xs font-medium text-shield-muted border border-shield-border hover:border-shield-red/30 hover:text-shield-red transition-colors duration-150 ease-out disabled:opacity-50"
            >
              {cancelPending ? "Cancelling..." : "Cancel My Order"}
            </button>

            {status && (
              <div
                className={`flex items-center gap-2 text-xs mt-2 ${
                  status.startsWith("Error")
                    ? "text-shield-red"
                    : "text-shield-accent"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    status.startsWith("Error")
                      ? "bg-shield-red"
                      : "bg-shield-accent"
                  }`}
                />
                {status}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
