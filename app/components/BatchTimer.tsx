"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount } from "wagmi";
import {
  useCurrentBatchId,
  useBatch,
} from "../hooks/useBatchAuction";

interface BatchTimerProps {
  onBatchUpdate?: (batchId: bigint | null, status: string) => void;
}

const RING_SIZE = 88;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function BatchTimer({ onBatchUpdate }: BatchTimerProps) {
  const { isConnected } = useAccount();
  const { currentBatchId } = useCurrentBatchId();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [activeBatchId, setActiveBatchId] = useState<bigint | undefined>(undefined);
  const [batchStatus, setBatchStatus] = useState<string>("loading");

  // Stable ref for callback to avoid re-triggering effects
  const onBatchUpdateRef = useRef(onBatchUpdate);
  onBatchUpdateRef.current = onBatchUpdate;

  // Track currentBatchId changes
  useEffect(() => {
    if (currentBatchId !== undefined && currentBatchId > 0n) {
      setActiveBatchId(currentBatchId - 1n);
    } else {
      setActiveBatchId(undefined);
      setBatchStatus("no_batch");
      onBatchUpdateRef.current?.(null, "no_batch");
    }
  }, [currentBatchId]);

  const { batch, refetch: refetchBatch } = useBatch(activeBatchId);

  // Track batch status changes (use primitive values to avoid object-reference churn)
  const batchStatusNum = batch?.status;
  const batchCloseAt = batch ? Number(batch.closeAt) : 0;
  const batchOpenAt = batch ? Number(batch.openAt) : 0;

  useEffect(() => {
    if (batchStatusNum === undefined || activeBatchId === undefined) {
      setBatchStatus("no_batch");
      onBatchUpdateRef.current?.(null, "no_batch");
      return;
    }

    if (batchStatusNum === 1) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = Math.max(0, batchCloseAt - now);
      setTimeLeft(remaining);
      setBatchStatus("open");
      onBatchUpdateRef.current?.(activeBatchId, "open");
    } else if (batchStatusNum === 2) {
      setBatchStatus("settled");
      setTimeLeft(0);
      onBatchUpdateRef.current?.(activeBatchId, "settled");
    } else {
      setBatchStatus("no_batch");
      onBatchUpdateRef.current?.(null, "no_batch");
    }
  }, [batchStatusNum, batchCloseAt, activeBatchId]);

  // Countdown ticker
  useEffect(() => {
    if (batchStatus !== "open" || timeLeft === null) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t !== null && t > 0) return t - 1;
        return 0;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [batchStatus, timeLeft]);

  // When timer hits 0, poll until settled
  useEffect(() => {
    if (timeLeft !== 0 || batchStatus !== "open") return;
    setBatchStatus("settling");
    onBatchUpdateRef.current?.(activeBatchId ?? null, "settling");

    const pollInterval = setInterval(() => {
      refetchBatch();
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [timeLeft, batchStatus, activeBatchId, refetchBatch]);

  // Calculate progress
  const totalDuration = batchCloseAt - batchOpenAt;
  const progress = timeLeft !== null && totalDuration > 0
    ? ((totalDuration - timeLeft) / totalDuration)
    : 0;

  const isUrgent = timeLeft !== null && timeLeft <= 5 && timeLeft > 0;
  const orderCount = batch
    ? Number(batch.buyCount) + Number(batch.sellCount)
    : 0;

  const ringOffset = RING_CIRCUMFERENCE * (1 - Math.min(progress, 1));

  if (!isConnected) return null;

  const ringColor = isUrgent ? "var(--color-red)" : "var(--color-accent)";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-shield-muted uppercase tracking-wider">
          {activeBatchId !== undefined
            ? `Batch #${activeBatchId.toString()}`
            : "No Active Batch"}
        </span>
        <span className="text-xs text-shield-muted">
          {orderCount}/20
        </span>
      </div>

      <div className="relative">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="transform -rotate-90"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={RING_STROKE}
          />
          {batchStatus === "open" && timeLeft !== null && timeLeft > 0 && (
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringOffset}
              strokeLinecap="round"
              className="transition-[stroke-dashoffset] duration-1000 ease-out"
            />
          )}
          {batchStatus === "settling" && (
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--color-yellow)"
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={0}
              opacity={0.6}
              className="animate-pulse"
            />
          )}
          {batchStatus === "settled" && (
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={RING_STROKE}
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={0}
              opacity={0.4}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {batchStatus === "open" && timeLeft !== null && timeLeft > 0 ? (
            <span
              className={`text-xl font-mono font-bold tabular-nums leading-none ${
                isUrgent ? "text-shield-red" : "text-shield-text"
              }`}
            >
              {timeLeft}s
            </span>
          ) : batchStatus === "settling" ? (
            <span className="text-xs text-shield-yellow font-medium">
              Settling
            </span>
          ) : batchStatus === "settled" ? (
            <span className="text-xs text-shield-accent font-medium">
              Settled
            </span>
          ) : (
            <span className="text-xs text-shield-muted">
              Waiting
            </span>
          )}
        </div>
      </div>

      <span
        className={`text-xs font-medium ${
          batchStatus === "open" && !isUrgent
            ? "text-shield-accent"
            : batchStatus === "open" && isUrgent
            ? "text-shield-red"
            : batchStatus === "settling"
            ? "text-shield-yellow"
            : "text-shield-muted"
        }`}
      >
        {batchStatus === "open" && !isUrgent
          ? "Accepting orders"
          : batchStatus === "open" && isUrgent
          ? "Closing soon!"
          : batchStatus === "settling"
          ? "Settling batch..."
          : batchStatus === "settled"
          ? "Batch settled"
          : "Waiting for next batch"}
      </span>
    </div>
  );
}
