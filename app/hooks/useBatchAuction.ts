"use client";

import { useReadContract, useReadContracts, useWriteContract, useAccount } from "wagmi";
import {
  BATCH_AUCTION_ABI,
  BATCH_AUCTION_ADDRESS,
  ERC20_ABI,
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
      refetchInterval: 5000,
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
      refetchInterval: 5000,
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
      refetchInterval: 5000,
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

// -- Read: all orders in a batch (multicall) --
export interface OrderData {
  user: `0x${string}`;
  side: number;
  limitPrice: bigint;
  amount: bigint;
  filledPrice: bigint;
  status: number; // 0=None, 1=Pending, 2=Filled, 3=Unfilled
}

export function useBatchOrders(
  batchId: bigint | undefined,
  buyCount: number,
  sellCount: number
) {
  // Build multicall contracts array for all buy orders
  const buyContracts = Array.from({ length: buyCount }, (_, i) => ({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "getBuyOrder" as const,
    args: [batchId!, i] as const,
  }));

  // Build multicall contracts array for all sell orders
  const sellContracts = Array.from({ length: sellCount }, (_, i) => ({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "getSellOrder" as const,
    args: [batchId!, i] as const,
  }));

  const allContracts = [...buyContracts, ...sellContracts];
  const enabled = batchId !== undefined && allContracts.length > 0;

  const { data, refetch, isLoading } = useReadContracts({
    contracts: enabled ? allContracts : [],
    query: {
      enabled,
      refetchInterval: 5000,
    },
  });

  const buyOrders: OrderData[] = [];
  const sellOrders: OrderData[] = [];

  if (data) {
    for (let i = 0; i < buyCount; i++) {
      const result = data[i];
      if (result?.status === "success" && result.result) {
        const r = result.result as readonly [
          `0x${string}`, number, bigint, bigint, bigint, number
        ];
        buyOrders.push({
          user: r[0],
          side: r[1],
          limitPrice: r[2],
          amount: r[3],
          filledPrice: r[4],
          status: r[5],
        });
      }
    }
    for (let i = 0; i < sellCount; i++) {
      const result = data[buyCount + i];
      if (result?.status === "success" && result.result) {
        const r = result.result as readonly [
          `0x${string}`, number, bigint, bigint, bigint, number
        ];
        sellOrders.push({
          user: r[0],
          side: r[1],
          limitPrice: r[2],
          amount: r[3],
          filledPrice: r[4],
          status: r[5],
        });
      }
    }
  }

  return { buyOrders, sellOrders, refetch, isLoading };
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

// -- Read: ERC20 balanceOf (wallet balance, not contract balance) --
export function useWalletTokenBalance(tokenAddress: `0x${string}` | undefined) {
  const { address } = useAccount();

  const { data, refetch, isLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!tokenAddress && !!address,
      refetchInterval: 5000,
    },
  });

  return { balance: data ?? 0n, refetch, isLoading };
}

// -- Read: ERC20 decimals --
export function useTokenDecimals(tokenAddress: `0x${string}` | undefined) {
  const { data } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
    query: { enabled: !!tokenAddress },
  });

  return { decimals: data ?? 18 };
}

// -- Read: ERC20 symbol --
export function useTokenSymbol(tokenAddress: `0x${string}` | undefined) {
  const { data } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "symbol",
    query: { enabled: !!tokenAddress },
  });

  return { symbol: data ?? "" };
}

// -- Read: hasOrder(batchId, user) --
export function useHasOrder(batchId: bigint | undefined, userAddress: `0x${string}` | undefined) {
  const { data, refetch } = useReadContract({
    address: BATCH_AUCTION_ADDRESS,
    abi: BATCH_AUCTION_ABI,
    functionName: "hasOrder",
    args: batchId !== undefined && userAddress ? [batchId, userAddress] : undefined,
    query: {
      enabled: batchId !== undefined && !!userAddress,
      refetchInterval: 5000,
    },
  });

  return { hasOrder: data ?? false, refetch };
}
