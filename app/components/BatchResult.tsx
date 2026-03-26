"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  useCurrentBatchId,
  useBatch,
} from "../hooks/useBatchAuction";
import {
  BATCH_AUCTION_ABI,
  BATCH_AUCTION_ADDRESS,
  PRICE_SCALE,
} from "../lib/contract";

interface SettledBatch {
  batchId: bigint;
  clearingPrice: number;
  orderCount: number;
  buyCount: number;
  sellCount: number;
}

export function BatchResult() {
  const { isConnected } = useAccount();
  const { currentBatchId } = useCurrentBatchId();
  const [results, setResults] = useState<SettledBatch[]>([]);

  // We manually poll the last 5 batches for settled results
  // Since wagmi hooks are fixed per-call, we read in a useEffect with raw reads
  useEffect(() => {
    if (currentBatchId === undefined || currentBatchId === 0n) return;

    const settled: SettledBatch[] = [];
    // We will just display whatever we have from the hook-level
    // For a production app, you would use multicall or event logs
  }, [currentBatchId]);

  // For simplicity, show the last batch if it's settled
  const lastBatchId =
    currentBatchId !== undefined && currentBatchId > 0n
      ? currentBatchId - 1n
      : undefined;
  const { batch: lastBatch } = useBatch(lastBatchId);

  const secondLastBatchId =
    currentBatchId !== undefined && currentBatchId > 1n
      ? currentBatchId - 2n
      : undefined;
  const { batch: secondLastBatch } = useBatch(secondLastBatchId);

  const thirdLastBatchId =
    currentBatchId !== undefined && currentBatchId > 2n
      ? currentBatchId - 3n
      : undefined;
  const { batch: thirdLastBatch } = useBatch(thirdLastBatchId);

  const settledBatches: SettledBatch[] = [];

  if (lastBatch && lastBatch.status === 2 && lastBatchId !== undefined) {
    settledBatches.push({
      batchId: lastBatchId,
      clearingPrice:
        Number(lastBatch.clearingPrice) / Number(PRICE_SCALE),
      orderCount: Number(lastBatch.buyCount) + Number(lastBatch.sellCount),
      buyCount: Number(lastBatch.buyCount),
      sellCount: Number(lastBatch.sellCount),
    });
  }

  if (
    secondLastBatch &&
    secondLastBatch.status === 2 &&
    secondLastBatchId !== undefined
  ) {
    settledBatches.push({
      batchId: secondLastBatchId,
      clearingPrice:
        Number(secondLastBatch.clearingPrice) / Number(PRICE_SCALE),
      orderCount:
        Number(secondLastBatch.buyCount) + Number(secondLastBatch.sellCount),
      buyCount: Number(secondLastBatch.buyCount),
      sellCount: Number(secondLastBatch.sellCount),
    });
  }

  if (
    thirdLastBatch &&
    thirdLastBatch.status === 2 &&
    thirdLastBatchId !== undefined
  ) {
    settledBatches.push({
      batchId: thirdLastBatchId,
      clearingPrice:
        Number(thirdLastBatch.clearingPrice) / Number(PRICE_SCALE),
      orderCount:
        Number(thirdLastBatch.buyCount) + Number(thirdLastBatch.sellCount),
      buyCount: Number(thirdLastBatch.buyCount),
      sellCount: Number(thirdLastBatch.sellCount),
    });
  }

  if (!isConnected) return null;

  return (
    <div className="bg-shield-card border border-shield-border rounded-xl p-5">
      <h3 className="text-sm font-medium text-shield-muted mb-4">
        Settled Batches
      </h3>
      <div className="space-y-3">
        {settledBatches.map((batch) => (
          <div
            key={batch.batchId.toString()}
            className="bg-shield-bg rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-shield-muted">
                Batch #{batch.batchId.toString()}
              </span>
              <span className="text-xs text-shield-muted">
                {batch.orderCount} orders
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-shield-muted">Clearing Price</span>
              <span className="text-lg font-mono font-bold text-shield-accent">
                {batch.clearingPrice > 0
                  ? `$${batch.clearingPrice.toFixed(2)}`
                  : "No cross"}
              </span>
            </div>
            <div className="flex justify-between text-xs text-shield-muted">
              <span>Buys: {batch.buyCount}</span>
              <span>Sells: {batch.sellCount}</span>
            </div>
          </div>
        ))}
        {settledBatches.length === 0 && (
          <p className="text-shield-muted text-sm text-center py-4">
            No settled batches yet
          </p>
        )}
      </div>
    </div>
  );
}
