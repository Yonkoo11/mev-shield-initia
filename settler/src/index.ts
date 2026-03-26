import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const BATCH_AUCTION_ABI = [
  "function openBatch() external returns (uint64)",
  "function settleBatch(uint64 batchId) external",
  "function currentBatchId() view returns (uint64)",
  "function getBatch(uint64) view returns (uint64 openAt, uint64 closeAt, uint256 clearingPrice, uint8 buyCount, uint8 sellCount, uint8 status)",
  "event BatchOpened(uint64 indexed batchId, uint64 closeAt)",
  "event BatchSettled(uint64 indexed batchId, uint256 clearingPrice, uint8 filled, uint8 unfilled)",
];

const RPC_URL = process.env.RPC_URL || "http://localhost:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const AUCTION_ADDRESS = process.env.AUCTION_ADDRESS || "";
const BATCH_DURATION = Number(process.env.BATCH_DURATION || "30");

async function main() {
  if (!PRIVATE_KEY || !AUCTION_ADDRESS) {
    console.error("Set PRIVATE_KEY and AUCTION_ADDRESS in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const auction = new ethers.Contract(AUCTION_ADDRESS, BATCH_AUCTION_ABI, wallet);

  console.log(`Settler started: ${wallet.address}`);
  console.log(`Auction: ${AUCTION_ADDRESS}`);
  console.log(`RPC: ${RPC_URL}`);

  while (true) {
    try {
      // Open a new batch
      const tx1 = await auction.openBatch();
      const receipt1 = await tx1.wait();
      const batchId = await auction.currentBatchId() - 1n;
      console.log(`Batch #${batchId} opened (tx: ${receipt1.hash})`);

      // Wait for batch to expire
      const waitMs = (BATCH_DURATION + 1) * 1000;
      console.log(`Waiting ${BATCH_DURATION + 1}s for batch to expire...`);
      await new Promise((r) => setTimeout(r, waitMs));

      // Settle the batch
      const tx2 = await auction.settleBatch(batchId);
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
          console.log(
            `Batch #${batchId} settled: clearingPrice=${decoded.args.clearingPrice}, filled=${decoded.args.filled}, unfilled=${decoded.args.unfilled}`
          );
        }
      } else {
        console.log(`Batch #${batchId} settled (tx: ${receipt2.hash})`);
      }
    } catch (err: any) {
      // NoOrders is expected when no one submitted orders
      if (err.message?.includes("NoOrders") || err.data?.includes("0x")) {
        console.log("No orders in batch, skipping settlement...");
      } else {
        console.error("Error:", err.message || err);
      }
      // Wait before retrying
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main().catch(console.error);
