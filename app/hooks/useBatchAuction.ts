"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { parseUnits } from "viem";
import {
  BATCH_AUCTION_ABI,
  BATCH_AUCTION_ADDRESS,
  ERC20_ABI,
  PRICE_SCALE,
} from "../lib/contract";

// -- Read: user balance from contract --
export function useUserBalance() {
  const { address } = useAccount();

  const { data, refetch, isLoading, isError } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "getUserBalance",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 3000,
    },
  });

  return {
    balance: data
      ? {
          tokenABalance: data[0],
          tokenBBalance: data[1],
          tokenALocked: data[2],
          tokenBLocked: data[3],
        }
      : null,
    refetch,
    isLoading,
    isError,
  };
}

// -- Read: batch info --
export function useBatch(batchId: bigint | undefined) {
  const { data, refetch, isLoading, isError } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "getBatch",
    args: batchId !== undefined ? [batchId] : undefined,
    query: {
      enabled: batchId !== undefined,
      refetchInterval: 2000,
    },
  });

  return {
    batch: data
      ? {
          openAt: data[0],
          closeAt: data[1],
          clearingPrice: data[2],
          buyCount: data[3],
          sellCount: data[4],
          status: data[5], // 0=None, 1=Open, 2=Settled
        }
      : null,
    refetch,
    isLoading,
    isError,
  };
}

// -- Read: current batch ID --
export function useCurrentBatchId() {
  const { data, refetch, isLoading } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "currentBatchId",
    query: {
      refetchInterval: 2000,
    },
  });

  return { currentBatchId: data, refetch, isLoading };
}

// -- Read: batch duration --
export function useBatchDuration() {
  const { data } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "batchDuration",
  });

  return { batchDuration: data };
}

// -- Read: buy order by index --
export function useBuyOrder(batchId: bigint | undefined, index: number) {
  const { data, refetch } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "getBuyOrder",
    args: batchId !== undefined ? [batchId, index] : undefined,
    query: {
      enabled: batchId !== undefined,
    },
  });

  return {
    order: data
      ? {
          user: data[0],
          side: data[1],
          limitPrice: data[2],
          amount: data[3],
          filledPrice: data[4],
          status: data[5],
        }
      : null,
    refetch,
  };
}

// -- Read: sell order by index --
export function useSellOrder(batchId: bigint | undefined, index: number) {
  const { data, refetch } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "getSellOrder",
    args: batchId !== undefined ? [batchId, index] : undefined,
    query: {
      enabled: batchId !== undefined,
    },
  });

  return {
    order: data
      ? {
          user: data[0],
          side: data[1],
          limitPrice: data[2],
          amount: data[3],
          filledPrice: data[4],
          status: data[5],
        }
      : null,
    refetch,
  };
}

// -- Read: token addresses --
export function useTokenAddresses() {
  const { data: tokenA } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "tokenA",
  });

  const { data: tokenB } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "tokenB",
  });

  return { tokenA, tokenB };
}

// -- Read: paused --
export function usePaused() {
  const { data } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "paused",
  });

  return { paused: data };
}

// -- Write: deposit --
export function useDeposit() {
  const { writeContract, isPending, isSuccess, isError, error, reset } =
    useWriteContract();

  const deposit = (amountA: bigint, amountB: bigint) => {
    writeContract({
      address: BATCH_AUCTION_ADDRESS,
      abi: BATCH_AUCTION_ABI,
      functionName: "deposit",
      args: [amountA, amountB],
    });
  };

  return { deposit, isPending, isSuccess, isError, error, reset };
}

// -- Write: withdraw --
export function useWithdraw() {
  const { writeContract, isPending, isSuccess, isError, error, reset } =
    useWriteContract();

  const withdraw = (amountA: bigint, amountB: bigint) => {
    writeContract({
      address: BATCH_AUCTION_ADDRESS,
      abi: BATCH_AUCTION_ABI,
      functionName: "withdraw",
      args: [amountA, amountB],
    });
  };

  return { withdraw, isPending, isSuccess, isError, error, reset };
}

// -- Write: open batch --
export function useOpenBatch() {
  const { writeContract, isPending, isSuccess, isError, error, reset } =
    useWriteContract();

  const openBatch = () => {
    writeContract({
      address: BATCH_AUCTION_ADDRESS,
      abi: BATCH_AUCTION_ABI,
      functionName: "openBatch",
    });
  };

  return { openBatch, isPending, isSuccess, isError, error, reset };
}

// -- Write: submit order --
export function useSubmitOrder() {
  const { writeContract, isPending, isSuccess, isError, error, reset } =
    useWriteContract();

  const submitOrder = (
    batchId: bigint,
    side: number, // 0=Buy, 1=Sell
    limitPrice: bigint,
    amount: bigint
  ) => {
    writeContract({
      address: BATCH_AUCTION_ADDRESS,
      abi: BATCH_AUCTION_ABI,
      functionName: "submitOrder",
      args: [batchId, side, limitPrice, amount],
    });
  };

  return { submitOrder, isPending, isSuccess, isError, error, reset };
}

// -- Write: cancel order --
export function useCancelOrder() {
  const { writeContract, isPending, isSuccess, isError, error, reset } =
    useWriteContract();

  const cancelOrder = (batchId: bigint) => {
    writeContract({
      address: BATCH_AUCTION_ADDRESS,
      abi: BATCH_AUCTION_ABI,
      functionName: "cancelOrder",
      args: [batchId],
    });
  };

  return { cancelOrder, isPending, isSuccess, isError, error, reset };
}

// -- Write: settle batch --
export function useSettleBatch() {
  const { writeContract, isPending, isSuccess, isError, error, reset } =
    useWriteContract();

  const settleBatch = (batchId: bigint) => {
    writeContract({
      address: BATCH_AUCTION_ADDRESS,
      abi: BATCH_AUCTION_ABI,
      functionName: "settleBatch",
      args: [batchId],
    });
  };

  return { settleBatch, isPending, isSuccess, isError, error, reset };
}

// -- Write: ERC20 approve --
export function useApproveToken(tokenAddress: `0x${string}` | undefined) {
  const { writeContract, isPending, isSuccess, isError, error, reset } =
    useWriteContract();

  const approve = (spender: `0x${string}`, amount: bigint) => {
    if (!tokenAddress) return;
    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spender, amount],
    });
  };

  return { approve, isPending, isSuccess, isError, error, reset };
}

// -- Read: ERC20 allowance --
export function useTokenAllowance(
  tokenAddress: `0x${string}` | undefined,
  spender: `0x${string}`
) {
  const { address } = useAccount();

  const { data, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, spender] : undefined,
    query: {
      enabled: !!tokenAddress && !!address,
      refetchInterval: 5000,
    },
  });

  return { allowance: data, refetch };
}
