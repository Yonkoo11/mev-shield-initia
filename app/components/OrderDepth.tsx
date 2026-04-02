"use client";

import { PRICE_SCALE, TOKEN_DECIMALS, TOKEN_A_DISPLAY, TOKEN_B_DISPLAY } from "../lib/contract";
import type { OrderData } from "../hooks/useBatchAuction";
import { formatUnits } from "viem";

interface DepthOrder {
  price: number;
  amount: number;
  total: number;
}

interface OrderDepthProps {
  side: "buy" | "sell";
  orders?: OrderData[];
}

function toDepthOrder(raw: OrderData): DepthOrder {
  const price = Number(raw.limitPrice) / Number(PRICE_SCALE);
  const amount = Number(formatUnits(raw.amount, TOKEN_DECIMALS));
  return { price, amount, total: price * amount };
}

function DepthRow({
  order,
  maxTotal,
  side,
}: {
  order: DepthOrder;
  maxTotal: number;
  side: "buy" | "sell";
}) {
  const widthPct = maxTotal > 0 ? (order.total / maxTotal) * 100 : 0;
  const isBuy = side === "buy";

  return (
    <div className="relative flex items-center h-8 group hover:bg-white/[0.02] transition-colors duration-100">
      <div
        className="absolute inset-y-0 h-full"
        style={{
          width: `${widthPct}%`,
          backgroundColor: isBuy
            ? "var(--color-cyan-dim)"
            : "var(--color-coral-dim)",
          right: isBuy ? 0 : undefined,
          left: isBuy ? undefined : 0,
        }}
      />
      <div
        className={`relative z-10 flex items-center w-full px-3 text-[13px] ${
          isBuy ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <span
          className={`font-mono tabular-nums font-medium ${
            isBuy ? "text-shield-cyan ml-auto" : "text-shield-coral mr-auto"
          }`}
        >
          {order.price.toFixed(2)}
        </span>
        <span
          className={`font-mono tabular-nums text-shield-text ${
            isBuy ? "mr-auto" : "ml-auto"
          }`}
        >
          {order.amount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </span>
        <span
          className={`font-mono tabular-nums text-shield-muted text-[11px] ${
            isBuy ? "mr-3" : "ml-3"
          }`}
        >
          ${order.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}

export function OrderDepth({ side, orders: rawOrders }: OrderDepthProps) {
  const isBuy = side === "buy";
  const hasLiveData = rawOrders && rawOrders.length > 0;

  const orders: DepthOrder[] = hasLiveData
    ? rawOrders.map(toDepthOrder)
    : [];

  const maxTotal = orders.length > 0
    ? Math.max(...orders.map((o) => o.total), 1)
    : 1;

  return (
    <div className="flex flex-col h-full">
      {/* Column header */}
      <div
        className={`flex items-center px-3 py-2 text-[11px] text-shield-muted uppercase tracking-wider ${
          isBuy ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <span className={isBuy ? "ml-auto" : "mr-auto"}>Price</span>
        <span className={isBuy ? "mr-auto" : "ml-auto"}>{TOKEN_A_DISPLAY}</span>
        <span className={isBuy ? "mr-3" : "ml-3"}>{TOKEN_B_DISPLAY}</span>
      </div>

      {/* Depth rows */}
      <div className="flex-1 flex flex-col gap-px">
        {orders.length > 0 ? (
          orders.map((order, i) => (
            <DepthRow
              key={`${side}-${i}`}
              order={order}
              maxTotal={maxTotal}
              side={side}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-24 text-[12px] text-shield-muted">
            {isBuy ? "No buy orders" : "No sell orders"}
          </div>
        )}
      </div>

      {/* Side label */}
      <div className="px-3 py-2 border-t border-shield-border">
        <span
          className={`text-[11px] font-medium uppercase tracking-wider ${
            isBuy ? "text-shield-cyan" : "text-shield-coral"
          }`}
        >
          {isBuy ? "Buy Orders" : "Sell Orders"}
          {orders.length > 0 && (
            <span className="text-shield-muted ml-1">({orders.length})</span>
          )}
        </span>
      </div>
    </div>
  );
}
