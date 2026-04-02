"use client";

import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { Header } from "../components/Header";
import { ChainGuard } from "../components/ChainGuard";
import { BATCH_AUCTION_ABI, BATCH_AUCTION_ADDRESS } from "../lib/contract";
import { DepositPanel } from "../components/DepositPanel";
import { OrderForm } from "../components/OrderForm";
import { BatchTimer } from "../components/BatchTimer";
import { BatchResult } from "../components/BatchResult";
import { BalanceDisplay } from "../components/BalanceDisplay";
import { PrivacyBadge } from "../components/PrivacyBadge";
import { AutoSignToggle } from "../components/AutoSignToggle";
import { OrderDepth } from "../components/OrderDepth";
import { BatchLifecycle } from "../components/BatchLifecycle";

type NavTab = "trade" | "bridge" | "history" | "docs";

export default function Home() {
  const { isConnected } = useAccount();
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

  const [activeBatchId, setActiveBatchId] = useState<bigint | null>(null);
  const [batchStatus, setBatchStatus] = useState<string>("loading");

  const handleBatchUpdate = (batchId: bigint | null, status: string) => {
    setActiveBatchId(batchId);
    setBatchStatus(status);
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-6">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {!isConnected ? (
        <div className="mt-16 space-y-16">
          {/* Hero */}
          <div className="text-center space-y-6">
            <span className="text-xs tracking-widest uppercase text-shield-accent/70">
              Initia Appchain
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Where <span className="text-shield-cyan">buyers</span> meet{" "}
              <span className="text-shield-coral">sellers</span>
              <br />
              at one fair price
            </h1>
            <p className="text-shield-muted text-lg max-w-lg mx-auto">
              Every 30 seconds, all orders in the batch clear at a single
              uniform price. No front-running. No sandwich attacks.
              The crossing point is truth.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={openConnect}
                className="bg-shield-accent text-shield-bg font-semibold rounded-lg px-6 py-3 text-sm hover:bg-shield-accent/90 transition-colors duration-150 ease-out"
              >
                Start Trading
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Sealed Order Book</h3>
                  <p className="text-sm text-shield-muted leading-relaxed max-w-sm">
                    Orders are invisible to validators, searchers, and other traders
                    until the batch settles. No one can see your intent.
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
                      {maxOrders ? String(maxOrders) : "20"}
                    </span>{" "}
                    max orders
                  </span>
                  <span>
                    <span className="text-shield-accent font-mono font-bold text-base tabular-nums">$0</span>{" "}
                    MEV extracted
                  </span>
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
                    Every order fills at the same price. Frontrunning is impossible by design.
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

          <PrivacyBadge />
        </div>
      ) : (
        <ChainGuard>
          {activeTab === "trade" && (
            <div className="mt-6 space-y-6">
              {/* Three-column crossing layout */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(340px,420px)_1fr] gap-4">
                {/* Left: Buy order depth */}
                <div className="order-2 lg:order-1">
                  <OrderDepth side="buy" />
                </div>

                {/* Center: Timer + Order form */}
                <div className="space-y-4 order-1 lg:order-2">
                  <BatchTimer onBatchUpdate={handleBatchUpdate} />
                  <BalanceDisplay />
                  <OrderForm
                    batchId={batchStatus === "open" ? activeBatchId : null}
                  />
                  <AutoSignToggle />
                </div>

                {/* Right: Sell order depth */}
                <div className="order-3">
                  <OrderDepth side="sell" />
                </div>
              </div>

              {/* Deposit panel (below the trading view) */}
              <div className="max-w-md mx-auto">
                <DepositPanel />
              </div>

              {/* Batch lifecycle + results */}
              <BatchLifecycle />
              <BatchResult />
            </div>
          )}

          {activeTab === "history" && (
            <div className="mt-8 text-center text-shield-muted">
              <p className="text-lg">Trade history coming soon</p>
              <p className="text-sm mt-2">Past batch results and your order history will appear here.</p>
            </div>
          )}
        </ChainGuard>
      )}
    </main>
  );
}
