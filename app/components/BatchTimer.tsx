"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  useCurrentBatchId,
  useBatch,
  useBatchDuration,
} from "../hooks/useBatchAuction";

interface BatchTimerProps {
  onBatchUpdate?: (batchId: bigint | null, status: string) => void;
}

export function BatchTimer({ onBatchUpdate }: BatchTimerProps) {
  const { isConnected } = useAccount();
  const { currentBatchId } = useCurrentBatchId();
  const { batchDuration } = useBatchDuration();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<bigint | undefined>(
    undefined
  );
  const [batchStatus, setBatchStatus] = useState<string>("loading");

  // Determine which batch to watch: currentBatchId - 1 (the latest opened one)
  useEffect(() => {
    if (currentBatchId !== undefined && currentBatchId > 0n) {
      setActiveBatchId(currentBatchId - 1n);
    } else {
      setActiveBatchId(undefined);
      setBatchStatus("no_batch");
      onBatchUpdate?.(null, "no_batch");
    }
  }, [currentBatchId, onBatchUpdate]);

  const { batch } = useBatch(activeBatchId);

  useEffect(() => {
    if (!batch || activeBatchId === undefined) {
      setBatchStatus("no_batch");
      onBatchUpdate?.(null, "no_batch");
      return;
    }

    const status = batch.status; // 0=None, 1=Open, 2=Settled

    if (status === 1) {
      const now = Math.floor(Date.now() / 1000);
      const closeAt = Number(batch.closeAt);
      const remaining = Math.max(0, closeAt - now);
      setTimeLeft(remaining);
      setBatchStatus("open");
      onBatchUpdate?.(activeBatchId, "open");
    } else if (status === 2) {
      setBatchStatus("settled");
      setTimeLeft(0);
      onBatchUpdate?.(activeBatchId, "settled");
    } else {
      setBatchStatus("no_batch");
      onBatchUpdate?.(null, "no_batch");
    }
  }, [batch, activeBatchId, onBatchUpdate]);

  // Countdown ticker
  useEffect(() => {
    if (batchStatus !== "open" || timeLeft === null) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => (t !== null && t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [batchStatus, timeLeft]);

  const duration = batchDuration ? Number(batchDuration) : 30;
  const progress =
    timeLeft !== null ? ((duration - timeLeft) / duration) * 100 : 0;
  const isUrgent = timeLeft !== null && timeLeft <= 5;
  const orderCount = batch
    ? Number(batch.buyCount) + Number(batch.sellCount)
    : 0;

  if (!isConnected) return null;

  return (
    <div className="bg-shield-card border border-shield-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-shield-muted">
          {activeBatchId !== undefined
            ? `Batch #${activeBatchId.toString()}`
            : "No Active Batch"}
        </h3>
        <span className="text-xs text-shield-muted">
          {orderCount}/20 orders
        </span>
      </div>

      {batchStatus === "open" && timeLeft !== null ? (
        <>
          <div className="w-full h-2 bg-shield-bg rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-[width] duration-1000 ease-out ${
                isUrgent ? "bg-shield-red" : "bg-shield-accent"
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-shield-muted">
              {isUrgent ? "Closing soon!" : "Accepting orders"}
            </span>
            <span
              className={`text-2xl font-mono font-bold ${
                isUrgent ? "text-shield-red" : "text-shield-text"
              }`}
            >
              {timeLeft}s
            </span>
          </div>
        </>
      ) : batchStatus === "settled" ? (
        <div className="text-center py-2">
          <span className="text-shield-accent text-sm">Batch settled</span>
        </div>
      ) : (
        <div className="text-center py-2">
          <span className="text-shield-muted text-sm">
            Waiting for next batch...
          </span>
        </div>
      )}
    </div>
  );
}
