import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

// -- Config --
const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const AUCTION_ADDRESS = process.env.AUCTION_ADDRESS || "";
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 3;

const BATCH_AUCTION_ABI = [
  "function openBatch() external returns (uint64)",
  "function settleBatch(uint64 batchId) external",
  "function currentBatchId() view returns (uint64)",
  "function batchDuration() view returns (uint32)",
  "function getBatch(uint64) view returns (uint64 openAt, uint64 closeAt, uint256 clearingPrice, uint8 buyCount, uint8 sellCount, uint8 status)",
  "event BatchOpened(uint64 indexed batchId, uint64 closeAt)",
  "event BatchSettled(uint64 indexed batchId, uint256 clearingPrice, uint8 filled, uint8 unfilled)",
];

// -- Structured logging --
function log(level: "INFO" | "WARN" | "ERROR", msg: string) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`);
}

// -- Retry wrapper --
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const msg = err.shortMessage || err.message || String(err);
      if (attempt === MAX_RETRIES) {
        throw err;
      }
      log("WARN", `${label} attempt ${attempt}/${MAX_RETRIES} failed: ${msg}`);
      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
  throw new Error("unreachable");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// -- Parse NoOrders custom error --
const NO_ORDERS_SELECTOR = ethers.id("NoOrders()").slice(0, 10);

function isNoOrdersError(err: any): boolean {
  const msg = String(err?.data || err?.message || err || "");
  return msg.includes("NoOrders") || msg.includes(NO_ORDERS_SELECTOR);
}

// -- Startup health checks --
async function healthCheck(
  provider: ethers.JsonRpcProvider,
  wallet: ethers.Wallet,
  auction: ethers.Contract
) {
  // Check RPC
  const blockNum = await withRetry(
    () => provider.getBlockNumber(),
    "RPC connection"
  );
  log("INFO", `RPC connected, block #${blockNum}`);

  // Check wallet balance
  const balance = await provider.getBalance(wallet.address);
  if (balance === 0n) {
    log("WARN", "Wallet has zero gas balance");
  } else {
    log("INFO", `Wallet gas: ${ethers.formatEther(balance)} GAS`);
  }

  // Check contract is deployed
  const code = await provider.getCode(AUCTION_ADDRESS);
  if (code === "0x") {
    log("ERROR", `No contract at ${AUCTION_ADDRESS}`);
    process.exit(1);
  }
  log("INFO", `Contract verified at ${AUCTION_ADDRESS}`);

  // Read batch duration
  const duration = await auction.batchDuration();
  log("INFO", `Batch duration: ${duration}s`);
}

// -- Wait for batch to close --
// Uses wall-clock time as primary (works on dev chains where block time
// only advances on transactions), but also checks on-chain time.
async function waitForBatchClose(
  provider: ethers.JsonRpcProvider,
  closeAt: bigint,
  batchDuration: number
) {
  const closeTime = Number(closeAt);
  const wallDeadline = Date.now() + (batchDuration + 2) * 1000;

  while (true) {
    // Check wall clock first (reliable on dev chains with no block production)
    if (Date.now() >= wallDeadline) {
      log("INFO", "Wall-clock deadline reached, proceeding to settle");
      return;
    }

    // Also check on-chain time (works on live chains with steady block production)
    const block = await provider.getBlock("latest");
    if (block && block.timestamp >= closeTime) {
      log("INFO", "On-chain time past closeAt, proceeding to settle");
      return;
    }

    const wallRemaining = Math.ceil((wallDeadline - Date.now()) / 1000);
    log("INFO", `Waiting ~${wallRemaining}s for batch close`);
    await sleep(5000);
  }
}

// -- Main loop --
let shuttingDown = false;

async function main() {
  if (!PRIVATE_KEY || !AUCTION_ADDRESS) {
    log("ERROR", "Set PRIVATE_KEY and AUCTION_ADDRESS in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const auction = new ethers.Contract(AUCTION_ADDRESS, BATCH_AUCTION_ABI, wallet);

  log("INFO", `Settler starting: ${wallet.address}`);
  log("INFO", `Auction: ${AUCTION_ADDRESS}`);
  log("INFO", `RPC: ${RPC_URL}`);

  await healthCheck(provider, wallet, auction);

  // Graceful shutdown
  const shutdown = () => {
    log("INFO", "Shutdown signal received, finishing current cycle...");
    shuttingDown = true;
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  while (!shuttingDown) {
    try {
      // Open a new batch
      const tx1 = await withRetry(
        () => auction.openBatch(),
        "openBatch"
      );
      const receipt1 = await tx1.wait();

      // Extract batchId from BatchOpened event in the receipt
      let batchId: bigint;
      const openedEvent = receipt1.logs.find(
        (l: any) => l.topics[0] === ethers.id("BatchOpened(uint64,uint64)")
      );

      if (openedEvent) {
        const decoded = auction.interface.parseLog({
          topics: openedEvent.topics,
          data: openedEvent.data,
        });
        batchId = decoded!.args.batchId;
      } else {
        // Fallback: read from state
        batchId = (await auction.currentBatchId()) - 1n;
        log("WARN", "BatchOpened event not found in receipt, using currentBatchId fallback");
      }

      log("INFO", `Batch #${batchId} opened (tx: ${receipt1.hash})`);

      // Wait for batch to close using on-chain timestamp
      const batch = await auction.getBatch(batchId);
      const closeAt = batch[1];
      const duration = Number(await auction.batchDuration());
      await waitForBatchClose(provider, closeAt, duration);

      // Re-read batch to check orders
      const freshBatch = await auction.getBatch(batchId);
      const buyCount = Number(freshBatch[3]);
      const sellCount = Number(freshBatch[4]);

      if (buyCount === 0 && sellCount === 0) {
        log("INFO", `Batch #${batchId}: no orders, skipping settlement`);
        continue;
      }

      log("INFO", `Batch #${batchId}: ${buyCount} buys, ${sellCount} sells, settling...`);

      // Settle with retry
      const tx2 = await withRetry(
        () => auction.settleBatch(batchId),
        "settleBatch"
      );
      const receipt2 = await tx2.wait();

      // Parse settlement event
      const settledEvent = receipt2.logs.find(
        (l: any) => l.topics[0] === ethers.id("BatchSettled(uint64,uint256,uint8,uint8)")
      );

      if (settledEvent) {
        const decoded = auction.interface.parseLog({
          topics: settledEvent.topics,
          data: settledEvent.data,
        });
        if (decoded) {
          log(
            "INFO",
            `Batch #${batchId} settled: price=${decoded.args.clearingPrice}, filled=${decoded.args.filled}, unfilled=${decoded.args.unfilled}`
          );
        }
      } else {
        log("INFO", `Batch #${batchId} settled (tx: ${receipt2.hash})`);
      }
    } catch (err: any) {
      if (isNoOrdersError(err)) {
        log("INFO", "No orders to settle, continuing...");
      } else {
        const msg = err.shortMessage || err.message || String(err);
        log("ERROR", `Settler error: ${msg}`);
      }
      await sleep(5000);
    }
  }

  log("INFO", "Settler stopped gracefully");
  process.exit(0);
}

main().catch((err) => {
  log("ERROR", `Fatal: ${err.message || err}`);
  process.exit(1);
});
