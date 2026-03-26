"use client";

import { useAccount } from "wagmi";
import {
  useCurrentBatchId,
  useBatch,
  useHasOrder,
} from "../hooks/useBatchAuction";
import { PRICE_SCALE } from "../lib/contract";

interface SettledBatch {
  batchId: bigint;
  clearingPrice: number;
  orderCount: number;
  buyCount: number;
  sellCount: number;
}

function UserOrderResult({ batchId, clearingPrice }: { batchId: bigint; clearingPrice: number }) {
  const { address } = useAccount();
  const { hasOrder } = useHasOrder(batchId, address as `0x${string}` | undefined);

  if (!hasOrder) return null;

  return (
    <div className="mt-2 pt-2 border-t border-shield-border">
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2 h-2 rounded-full bg-shield-accent" />
        <span className="text-shield-accent font-medium">
          {clearingPrice > 0
            ? `Your order filled at ${clearingPrice.toFixed(2)} USDC/INIT`
            : "Your order was not filled (no crossing)"}
        </span>
      </div>
    </div>
  );
}

export function BatchResult() {
  const { isConnected } = useAccount();
  const { currentBatchId } = useCurrentBatchId();

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

  const addBatch = (batch: typeof lastBatch, id: bigint | undefined) => {
    if (batch && batch.status === 2 && id !== undefined) {
      settledBatches.push({
        batchId: id,
        clearingPrice: Number(batch.clearingPrice) / Number(PRICE_SCALE),
        orderCount: Number(batch.buyCount) + Number(batch.sellCount),
        buyCount: Number(batch.buyCount),
        sellCount: Number(batch.sellCount),
      });
    }
  };

  addBatch(lastBatch, lastBatchId);
  addBatch(secondLastBatch, secondLastBatchId);
  addBatch(thirdLastBatch, thirdLastBatchId);

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
              <span className="text-lg font-mono font-bold text-shield-accent tabular-nums">
                {batch.clearingPrice > 0
                  ? `$${batch.clearingPrice.toFixed(2)}`
                  : "No cross"}
              </span>
            </div>
            <div className="flex justify-between text-xs text-shield-muted">
              <span>Buys: {batch.buyCount}</span>
              <span>Sells: {batch.sellCount}</span>
            </div>
            <UserOrderResult
              batchId={batch.batchId}
              clearingPrice={batch.clearingPrice}
            />
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
