"use client";

interface DepthOrder {
  price: number;
  amount: number;
  total: number;
}

interface OrderDepthProps {
  side: "buy" | "sell";
  orders: DepthOrder[];
}

// Mock data for INIT/USDC around $4.28
export const MOCK_BUY_ORDERS: DepthOrder[] = [
  { price: 4.32, amount: 2400, total: 10368 },
  { price: 4.30, amount: 1800, total: 7740 },
  { price: 4.29, amount: 1500, total: 6435 },
  { price: 4.28, amount: 3200, total: 13696 },
  { price: 4.27, amount: 1100, total: 4697 },
  { price: 4.25, amount: 800, total: 3400 },
  { price: 4.22, amount: 500, total: 2110 },
  { price: 4.20, amount: 300, total: 1260 },
];

export const MOCK_SELL_ORDERS: DepthOrder[] = [
  { price: 4.30, amount: 150, total: 645 },
  { price: 4.31, amount: 400, total: 1724 },
  { price: 4.33, amount: 800, total: 3464 },
  { price: 4.35, amount: 1200, total: 5220 },
  { price: 4.38, amount: 1500, total: 6570 },
  { price: 4.40, amount: 2000, total: 8800 },
  { price: 4.45, amount: 2500, total: 11125 },
  { price: 4.50, amount: 1300, total: 5850 },
];

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
    <div className="relative flex items-center h-8 group">
      {/* Background bar */}
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

      {/* Content row */}
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
          {order.amount.toLocaleString()}
        </span>
        <span
          className={`font-mono tabular-nums text-shield-muted text-[11px] ${
            isBuy ? "mr-3" : "ml-3"
          }`}
        >
          ${order.total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export function OrderDepth({ side, orders }: OrderDepthProps) {
  const maxTotal = Math.max(...orders.map((o) => o.total), 1);
  const isBuy = side === "buy";

  return (
    <div className="flex flex-col h-full">
      {/* Column header */}
      <div
        className={`flex items-center px-3 py-2 text-[11px] text-shield-muted uppercase tracking-wider ${
          isBuy ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <span className={isBuy ? "ml-auto" : "mr-auto"}>Price</span>
        <span className={isBuy ? "mr-auto" : "ml-auto"}>Amount</span>
        <span className={isBuy ? "mr-3" : "ml-3"}>Total</span>
      </div>

      {/* Depth rows */}
      <div className="flex-1 flex flex-col gap-px">
        {orders.map((order, i) => (
          <DepthRow
            key={`${side}-${i}`}
            order={order}
            maxTotal={maxTotal}
            side={side}
          />
        ))}
      </div>

      {/* Side label */}
      <div className="px-3 py-2 border-t border-shield-border">
        <span
          className={`text-[11px] font-medium uppercase tracking-wider ${
            isBuy ? "text-shield-cyan" : "text-shield-coral"
          }`}
        >
          {isBuy ? "Buy Orders" : "Sell Orders"}
        </span>
      </div>
    </div>
  );
}
