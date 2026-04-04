"use client";

import { useState, useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { Header } from "../components/Header";
import { ChainGuard } from "../components/ChainGuard";
import { BATCH_AUCTION_ABI, BATCH_AUCTION_ADDRESS, ICOSMOS_ADDRESS, ICOSMOS_ABI, TOKEN_DECIMALS } from "../lib/contract";
import { formatUnits } from "viem";
import { DepositPanel } from "../components/DepositPanel";
import { OrderForm } from "../components/OrderForm";
import { BatchTimer } from "../components/BatchTimer";
import { BatchResult } from "../components/BatchResult";
import { BalanceDisplay } from "../components/BalanceDisplay";
import { AutoSignToggle } from "../components/AutoSignToggle";
import { OrderDepth } from "../components/OrderDepth";
import { BatchLifecycle } from "../components/BatchLifecycle";
import { useBatch, useBatchOrders } from "../hooks/useBatchAuction";

type NavTab = "trade" | "bridge" | "docs";

export default function Home() {
  const { isConnected, address } = useAccount();
  const { openConnect } = useInterwovenKit();
  const [activeTab, setActiveTab] = useState<NavTab>("trade");

  const { data: batchDuration } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "batchDuration",
  });
  const { data: maxOrders } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "MAX_ORDERS",
  });
  const { data: protocolRevenue } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "protocolRevenue",
  });
  const { data: oracleRaw } = useReadContract({
    address: ICOSMOS_ADDRESS,
    abi: ICOSMOS_ABI,
    functionName: "query_cosmos",
    args: ["/connect.oracle.v2.Query/GetPrices", '{"currency_pair_ids":["SOL/USD"]}'],
  });

  const revenueFormatted = protocolRevenue
    ? parseFloat(formatUnits(protocolRevenue as bigint, TOKEN_DECIMALS)).toFixed(2)
    : "0.00";

  // Parse oracle SOL/USD price (8 decimals from Connect oracle)
  let oraclePrice = "—";
  if (oracleRaw) {
    try {
      const parsed = JSON.parse(oracleRaw as string);
      const raw = parsed?.prices?.[0]?.price?.price;
      const decimals = parseInt(parsed?.prices?.[0]?.decimals || "8");
      if (raw && raw !== "0") {
        oraclePrice = "$" + (parseInt(raw) / 10 ** decimals).toFixed(2);
      }
    } catch {}
  }

  const [activeBatchId, setActiveBatchId] = useState<bigint | null>(null);
  const [batchStatus, setBatchStatus] = useState<string>("loading");

  const handleBatchUpdate = useCallback((batchId: bigint | null, status: string) => {
    setActiveBatchId(batchId);
    setBatchStatus(status);
  }, []);

  // Fetch batch details for order counts
  const { batch } = useBatch(
    activeBatchId !== null ? activeBatchId : undefined
  );
  const buyCount = batch ? Number(batch.buyCount) : 0;
  const sellCount = batch ? Number(batch.sellCount) : 0;

  // Fetch all orders in the current batch via multicall
  const { buyOrders, sellOrders } = useBatchOrders(
    activeBatchId !== null ? activeBatchId : undefined,
    buyCount,
    sellCount
  );

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-6">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {!isConnected ? (
        <div className="mt-16 space-y-16">
          {/* Hero */}
          <div className="relative text-center space-y-6">
            {/* Ambient glow behind hero */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-shield-accent/[0.03] rounded-full blur-[100px] pointer-events-none" />
            <span className="relative text-xs tracking-widest uppercase text-shield-accent/70">
              Built on Initia
            </span>
            <h1 className="relative text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Everyone gets the same price
            </h1>
            <p className="relative text-shield-muted text-lg max-w-lg mx-auto">
              BatchFi collects orders for 30 seconds, then clears them all
              at one fair price. No one gets a better deal by being faster.
            </p>
            <div className="relative flex gap-3 justify-center pt-2">
              <button
                onClick={openConnect}
                className="bg-shield-accent text-shield-bg font-semibold rounded-lg px-6 py-3 text-sm hover:bg-shield-accent/90 shadow-[0_0_30px_rgba(0,212,170,0.15)] hover:shadow-[0_0_40px_rgba(0,212,170,0.25)] transition-all duration-200 ease-out"
              >
                Connect Wallet
              </button>
            </div>
          </div>

          {/* Feature cards */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-3 bg-shield-card border border-shield-border rounded-lg p-6 md:p-8 flex flex-col justify-between min-h-[200px]">
                <div>
                  <div className="text-shield-accent mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l3 9a5.002 5.002 0 01-6.001 0M18 7l-3 9m-6-4h6m-3-3v6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Batch Auction</h3>
                  <p className="text-sm text-shield-muted leading-relaxed max-w-sm">
                    Orders collect for 30 seconds, then settle together.
                    Your limit price decides if you fill, not what price you get.
                    Everyone who fills pays the same.
                  </p>
                </div>
                <div className="flex gap-6 mt-6 pt-4 border-t border-shield-border text-xs text-shield-muted">
                  <span>
                    <span className="text-shield-accent font-mono font-bold text-base tabular-nums">
                      {batchDuration ? `${batchDuration}s` : "30s"}
                    </span>{" "}
                    batches
                  </span>
                  <span>
                    <span className="text-shield-accent font-mono font-bold text-base tabular-nums">
                      {maxOrders ? String(maxOrders) : "100"}
                    </span>{" "}
                    max orders
                  </span>
                  <span>
                    <span className="text-shield-accent font-mono font-bold text-base tabular-nums">
                      ${revenueFormatted}
                    </span>{" "}
                    revenue earned
                  </span>
                  {oraclePrice !== "—" && (
                    <span>
                      <span className="text-shield-cyan font-mono font-bold text-base tabular-nums">
                        {oraclePrice}
                      </span>{" "}
                      SOL/USD oracle
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="flex-1 bg-shield-card border border-shield-border rounded-lg p-5">
                  <div className="text-shield-cyan mb-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Uniform Clearing</h3>
                  <p className="text-xs text-shield-muted leading-relaxed">
                    Every order fills at the same price. Fair by design, not by trust.
                  </p>
                </div>
                <div className="flex-1 bg-shield-card border border-shield-border rounded-lg p-5">
                  <div className="text-shield-coral mb-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">Session Signing</h3>
                  <p className="text-xs text-shield-muted leading-relaxed">
                    Sign once, trade for a session. No wallet popups interrupting your flow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ChainGuard>
          {activeTab === "trade" && (
            <div className="mt-6 space-y-6">
              {/* Three-column crossing layout */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(340px,420px)_1fr] gap-4">
                {/* Left: Buy order depth */}
                <div className="order-2 lg:order-1">
                  <OrderDepth side="buy" orders={buyOrders} />
                </div>

                {/* Center: Timer + Order form */}
                <div className="space-y-4 order-1 lg:order-2">
                  <BatchTimer onBatchUpdate={handleBatchUpdate} />
                  <BalanceDisplay />
                  <OrderForm
                    batchId={batchStatus === "open" ? activeBatchId : null}
                    oraclePrice={oraclePrice !== "—" ? oraclePrice : undefined}
                  />
                  <AutoSignToggle />
                </div>

                {/* Right: Sell order depth */}
                <div className="order-3">
                  <OrderDepth side="sell" orders={sellOrders} />
                </div>
              </div>

              {/* Deposit panel (below the trading view) */}
              <div className="max-w-md mx-auto">
                <DepositPanel />
              </div>

              {/* Batch lifecycle + results */}
              <BatchLifecycle
                clearingPrice={batch?.clearingPrice}
                buyOrders={buyOrders}
                sellOrders={sellOrders}
                userAddress={address}
                batchStatus={batchStatus}
              />
              <BatchResult />
            </div>
          )}

        </ChainGuard>
      )}
    </main>
  );
}
