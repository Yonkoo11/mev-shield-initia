"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (currentBatchId !== undefined && currentBatchId > 0n) {
      setActiveBatchId(currentBatchId - 1n);
    } else {
      setActiveBatchId(undefined);
      setBatchStatus("no_batch");
      onBatchUpdate?.(null, "no_batch");
    }
  }, [currentBatchId, onBatchUpdate]);

  const { batch, refetch: refetchBatch } = useBatch(activeBatchId);

  useEffect(() => {
    if (!batch || activeBatchId === undefined) {
      setBatchStatus("no_batch");
      onBatchUpdate?.(null, "no_batch");
      return;
    }

    const status = batch.status;

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
    onBatchUpdate?.(activeBatchId ?? null, "settling");

    const pollInterval = setInterval(() => {
      refetchBatch();
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [timeLeft, batchStatus, activeBatchId, onBatchUpdate, refetchBatch]);

  // Calculate progress using openAt and closeAt
  const openAt = batch ? Number(batch.openAt) : 0;
  const closeAt = batch ? Number(batch.closeAt) : 0;
  const totalDuration = closeAt - openAt;
  const progress = timeLeft !== null && totalDuration > 0
    ? ((totalDuration - timeLeft) / totalDuration)
    : 0;

  const isUrgent = timeLeft !== null && timeLeft <= 5 && timeLeft > 0;
  const orderCount = batch
    ? Number(batch.buyCount) + Number(batch.sellCount)
    : 0;

  // SVG ring offset: full circle = circumference, empty = 0
  const ringOffset = RING_CIRCUMFERENCE * (1 - Math.min(progress, 1));

  if (!isConnected) return null;

  const ringColor = isUrgent ? "var(--color-red)" : "var(--color-accent)";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Batch label */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-shield-muted uppercase tracking-wider">
          {activeBatchId !== undefined
            ? `Batch #${activeBatchId.toString()}`
            : "No Active Batch"}
        </span>
        <span className="text-[11px] text-shield-muted">
          {orderCount}/20
        </span>
      </div>

      {/* Ring timer */}
      <div className="relative">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={RING_STROKE}
          />
          {/* Progress ring */}
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
          {/* Settling ring: pulsing full circle */}
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
          {/* Settled ring: full teal */}
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

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {batchStatus === "open" && timeLeft !== null && timeLeft > 0 ? (
            <>
              <span
                className={`text-xl font-mono font-bold tabular-nums leading-none ${
                  isUrgent ? "text-shield-red" : "text-shield-text"
                }`}
              >
                {timeLeft}s
              </span>
            </>
          ) : batchStatus === "settling" ? (
            <span className="text-[11px] text-shield-yellow font-medium">
              Settling
            </span>
          ) : batchStatus === "settled" ? (
            <span className="text-[11px] text-shield-accent font-medium">
              Settled
            </span>
          ) : (
            <span className="text-[11px] text-shield-muted">
              Waiting
            </span>
          )}
        </div>
      </div>

      {/* Status text */}
      <span
        className={`text-[11px] font-medium ${
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
