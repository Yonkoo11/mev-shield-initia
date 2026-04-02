"use client";

import { useState } from "react";

interface UserOrder {
  side: "buy" | "sell";
  price: number;
  amount: number;
  status: "pending" | "filled" | "unfilled";
}

interface BatchLifecycleProps {
  clearingPrice?: number;
  userOrders?: UserOrder[];
  sealedOrderCount?: number;
  isSettled?: boolean;
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function ArrowDown() {
  return (
    <div className="flex justify-center py-1">
      <svg
        className="w-4 h-4 text-shield-muted"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 5v14m0 0l-4-4m4 4l4-4"
        />
      </svg>
    </div>
  );
}

// Mock data for the visualization
const mockUserOrders: UserOrder[] = [
  { side: "buy", price: 4.29, amount: 500, status: "filled" },
  { side: "sell", price: 4.35, amount: 200, status: "unfilled" },
];

export function BatchLifecycle({
  clearingPrice = 4.30,
  userOrders = mockUserOrders,
  sealedOrderCount = 14,
  isSettled = true,
}: BatchLifecycleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-shield-card border border-shield-border rounded-lg overflow-hidden">
      {/* Toggle header */}
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

      {/* Collapsible body */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-1">
          {/* Section 1: YOUR ORDERS */}
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
              {userOrders.map((order, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[12px] font-mono tabular-nums border ${
                    order.side === "buy"
                      ? "bg-shield-cyan-dim border-shield-cyan/20 text-shield-cyan"
                      : "bg-shield-coral-dim border-shield-coral/20 text-shield-coral"
                  }`}
                >
                  <span className="font-medium uppercase text-[10px]">
                    {order.side}
                  </span>
                  <span>{order.amount}</span>
                  <span className="text-shield-muted">@</span>
                  <span>${order.price.toFixed(2)}</span>
                </div>
              ))}
              {userOrders.length === 0 && (
                <span className="text-[12px] text-shield-muted">
                  No active orders
                </span>
              )}
            </div>
          </div>

          <ArrowDown />

          {/* Section 2: SEALED BATCH */}
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
              {Array.from({ length: sealedOrderCount }).map((_, i) => (
                <div
                  key={i}
                  className="w-8 h-6 rounded border border-shield-accent/15 bg-shield-accent/5 flex items-center justify-center"
                >
                  <svg
                    className="w-3 h-3 text-shield-accent/30"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-shield-muted mt-2">
              {sealedOrderCount} orders sealed. No one can see prices or amounts
              until settlement.
            </p>
          </div>

          <ArrowDown />

          {/* Section 3: SETTLED RESULTS */}
          <div className="bg-shield-bg rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isSettled ? "bg-shield-accent" : "bg-shield-yellow"
                }`}
              />
              <span
                className={`text-[11px] font-medium uppercase tracking-wider ${
                  isSettled ? "text-shield-accent" : "text-shield-yellow"
                }`}
              >
                {isSettled ? "Settled Results" : "Settling..."}
              </span>
            </div>
            {isSettled && clearingPrice ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-shield-muted">
                    Clearing Price
                  </span>
                  <span className="text-base font-mono font-bold text-shield-accent tabular-nums">
                    ${clearingPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {userOrders.map((order, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[12px]"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          order.status === "filled"
                            ? "bg-shield-accent"
                            : "bg-shield-red"
                        }`}
                      />
                      <span className="text-shield-muted capitalize">
                        {order.side} {order.amount} @${order.price.toFixed(2)}
                      </span>
                      <span
                        className={`ml-auto font-medium ${
                          order.status === "filled"
                            ? "text-shield-accent"
                            : "text-shield-red"
                        }`}
                      >
                        {order.status === "filled"
                          ? `Filled @$${clearingPrice.toFixed(2)}`
                          : "Not filled"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-shield-yellow animate-pulse" />
                <span className="text-[12px] text-shield-yellow">
                  Computing clearing price...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
