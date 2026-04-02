"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { PRICE_SCALE, TOKEN_DECIMALS } from "../lib/contract";
import type { OrderData } from "../hooks/useBatchAuction";

interface BatchLifecycleProps {
  clearingPrice?: bigint;
  buyOrders?: OrderData[];
  sellOrders?: OrderData[];
  userAddress?: `0x${string}`;
  batchStatus?: string; // "open" | "settling" | "settled" | "no_batch"
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-shield-muted transition-transform duration-200 ease-out ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <div className="flex justify-center py-1">
      <svg className="w-4 h-4 text-shield-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m0 0l-4-4m4 4l4-4" />
      </svg>
    </div>
  );
}

function formatPrice(price: bigint): string {
  return (Number(price) / Number(PRICE_SCALE)).toFixed(2);
}

function formatAmount(amount: bigint): string {
  return Number(formatUnits(amount, TOKEN_DECIMALS)).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

export function BatchLifecycle({
  clearingPrice,
  buyOrders = [],
  sellOrders = [],
  userAddress,
  batchStatus = "no_batch",
}: BatchLifecycleProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Find the current user's orders
  const userBuyOrders = userAddress
    ? buyOrders.filter((o) => o.user.toLowerCase() === userAddress.toLowerCase())
    : [];
  const userSellOrders = userAddress
    ? sellOrders.filter((o) => o.user.toLowerCase() === userAddress.toLowerCase())
    : [];
  const userOrders = [...userBuyOrders, ...userSellOrders];
  const totalOrderCount = buyOrders.length + sellOrders.length;
  const isSettled = batchStatus === "settled";
  const hasClearing = clearingPrice !== undefined && clearingPrice > 0n;

  return (
    <div className="bg-shield-card border border-shield-border rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-shield-bg/50 transition-colors duration-150 ease-out"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-shield-text">
            Batch Lifecycle
          </span>
          <span className="text-[11px] text-shield-muted bg-shield-bg px-2 py-0.5 rounded">
            How it works
          </span>
        </div>
        <ChevronDown open={isOpen} />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-1">
          {/* YOUR ORDERS */}
          <div className="bg-shield-bg rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-shield-accent" />
              <span className="text-[11px] font-medium text-shield-accent uppercase tracking-wider">
                Your Orders
              </span>
              <span className="text-[10px] text-shield-muted ml-auto">
                visible to you
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {userOrders.length > 0 ? (
                userOrders.map((order, i) => {
                  const isBuy = order.side === 0;
                  const statusLabel =
                    order.status === 2 ? "filled" :
                    order.status === 3 ? "unfilled" : "pending";
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-mono tabular-nums border ${
                        isBuy
                          ? "bg-shield-cyan-dim border-shield-cyan/20 text-shield-cyan"
                          : "bg-shield-coral-dim border-shield-coral/20 text-shield-coral"
                      }`}
                    >
                      <span className="font-medium uppercase text-[10px]">
                        {isBuy ? "buy" : "sell"}
                      </span>
                      <span>{formatAmount(order.amount)}</span>
                      <span className="text-shield-muted">@</span>
                      <span>${formatPrice(order.limitPrice)}</span>
                      {isSettled && (
                        <span className={`text-[10px] ml-1 ${
                          statusLabel === "filled" ? "text-shield-accent" : "text-shield-red"
                        }`}>
                          {statusLabel}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-[12px] text-shield-muted">
                  No active orders
                </span>
              )}
            </div>
          </div>

          <ArrowDown />

          {/* SEALED BATCH */}
          <div className="bg-shield-bg rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-shield-accent/50" />
              <span className="text-[11px] font-medium text-shield-muted uppercase tracking-wider">
                Sealed Batch
              </span>
              <span className="text-[10px] text-shield-muted ml-auto">
                opaque to all
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {totalOrderCount > 0 ? (
                Array.from({ length: totalOrderCount }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-6 rounded border border-shield-accent/15 bg-shield-accent/5 flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-shield-accent/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                ))
              ) : (
                <span className="text-[12px] text-shield-muted">Waiting for orders</span>
              )}
            </div>
            {totalOrderCount > 0 && (
              <p className="text-[11px] text-shield-muted mt-2">
                {totalOrderCount} order{totalOrderCount !== 1 ? "s" : ""} sealed. No one can see prices or amounts until settlement.
              </p>
            )}
          </div>

          <ArrowDown />

          {/* SETTLED RESULTS */}
          <div className="bg-shield-bg rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${isSettled ? "bg-shield-accent" : "bg-shield-yellow"}`} />
              <span className={`text-[11px] font-medium uppercase tracking-wider ${isSettled ? "text-shield-accent" : "text-shield-yellow"}`}>
                {isSettled ? "Settled Results" : batchStatus === "settling" ? "Settling..." : "Pending"}
              </span>
            </div>
            {isSettled && hasClearing ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-shield-muted">Clearing Price</span>
                  <span className="text-base font-mono font-bold text-shield-accent tabular-nums">
                    ${formatPrice(clearingPrice)}
                  </span>
                </div>
                {userOrders.length > 0 && (
                  <div className="flex flex-col gap-1">
                    {userOrders.map((order, i) => {
                      const isBuy = order.side === 0;
                      const filled = order.status === 2;
                      return (
                        <div key={i} className="flex items-center gap-2 text-[12px]">
                          <div className={`w-1.5 h-1.5 rounded-full ${filled ? "bg-shield-accent" : "bg-shield-red"}`} />
                          <span className="text-shield-muted">
                            {isBuy ? "Buy" : "Sell"} {formatAmount(order.amount)} @${formatPrice(order.limitPrice)}
                          </span>
                          <span className={`ml-auto font-medium ${filled ? "text-shield-accent" : "text-shield-red"}`}>
                            {filled ? `Filled @$${formatPrice(clearingPrice)}` : "Not filled"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : isSettled && !hasClearing ? (
              <div className="text-[12px] text-shield-muted">
                No clearing price (orders did not cross)
              </div>
            ) : batchStatus === "settling" ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-shield-yellow animate-pulse" />
                <span className="text-[12px] text-shield-yellow">Computing clearing price...</span>
              </div>
            ) : (
              <div className="text-[12px] text-shield-muted">
                Waiting for batch to close
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
