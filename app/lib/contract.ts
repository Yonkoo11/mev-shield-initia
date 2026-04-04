import { defineChain } from "viem";

// -- Chain Configuration (single source of truth) --
const rpcUrl =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545")
    : (process.env.NEXT_PUBLIC_RPC_URL || "http://localhost:8545");

export const CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_CHAIN_ID || "1411570067076288"
);

export const minitia = defineChain({
  id: CHAIN_ID,
  name: "BatchFi Minitia",
  nativeCurrency: { name: "GAS", symbol: "GAS", decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: "Explorer", url: "https://explorer.initia.xyz" },
  },
});

// -- Deployed Contract Addresses (env-driven with deployed defaults) --
export const BATCH_AUCTION_ADDRESS = (
  process.env.NEXT_PUBLIC_AUCTION_ADDRESS ||
  "0xdDb2Abd925E5a96e283fAaecB303E2b63cfe5B46"
) as `0x${string}`;

export const SHIELD_SOL_ADDRESS = (
  process.env.NEXT_PUBLIC_TOKEN_A_ADDRESS ||
  "0x7A18b51f82af4e0ceFfA9161ce191290F0634F97"
) as `0x${string}`;

export const SHIELD_USDC_ADDRESS = (
  process.env.NEXT_PUBLIC_TOKEN_B_ADDRESS ||
  "0x89c37E61a3836e56e8a88fe4f98Dc964B1Fde041"
) as `0x${string}`;

// -- Constants matching the Solidity contract --
export const PRICE_SCALE = 1_000_000n;
export const PRICE_DECIMALS = 6; // PRICE_SCALE = 1e6, prices use 6 decimal places
export const TOKEN_DECIMALS = 18; // Both shSOL and shUSDC are 18-decimal ERC20s
export const MAX_ORDERS = 100;

// ICosmos precompile (Initia-native: Cosmos queries from EVM)
export const ICOSMOS_ADDRESS = "0x00000000000000000000000000000000000000f1" as `0x${string}`;
export const ICOSMOS_ABI = [
  {
    type: "function",
    name: "query_cosmos",
    inputs: [
      { name: "path", type: "string" },
      { name: "req", type: "string" },
    ],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "to_cosmos_address",
    inputs: [{ name: "addr", type: "address" }],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
] as const;

// Friendly display names (contract symbols are shSOL/shUSDC)
export const TOKEN_A_DISPLAY = "INIT";
export const TOKEN_B_DISPLAY = "USDC";

// Initia Cosmos chain ID for InterwovenKit (distinct from EVM chain ID)
// Uses initiation-2 (testnet L1) because our local minitia isn't registered
// in the Initia registry. EVM calls work through wagmi regardless.
// TODO: Register mevshield-1 in Initia registry for testnet deployment
export const INITIA_CHAIN_ID =
  process.env.NEXT_PUBLIC_INITIA_CHAIN_ID || "initiation-2";

// -- Full ABI --
export const BATCH_AUCTION_ABI = [
  // --- Errors ---
  { type: "error", name: "NotOwner", inputs: [] },
  { type: "error", name: "NotSettler", inputs: [] },
  { type: "error", name: "AlreadyInitialized", inputs: [] },
  { type: "error", name: "Paused", inputs: [] },
  { type: "error", name: "InvalidAmount", inputs: [] },
  { type: "error", name: "InvalidPrice", inputs: [] },
  { type: "error", name: "InsufficientBalance", inputs: [] },
  { type: "error", name: "BatchNotOpen", inputs: [] },
  { type: "error", name: "BatchStillOpen", inputs: [] },
  { type: "error", name: "TooManyOrders", inputs: [] },
  { type: "error", name: "AlreadyHasOrder", inputs: [] },
  { type: "error", name: "NoOrder", inputs: [] },
  { type: "error", name: "NoOrders", inputs: [] },
  { type: "error", name: "SlippageExceeded", inputs: [] },

  // --- Events ---
  {
    type: "event",
    name: "Initialized",
    inputs: [
      { name: "tokenA", type: "address", indexed: false },
      { name: "tokenB", type: "address", indexed: false },
      { name: "duration", type: "uint32", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amountA", type: "uint256", indexed: false },
      { name: "amountB", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amountA", type: "uint256", indexed: false },
      { name: "amountB", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BatchOpened",
    inputs: [
      { name: "batchId", type: "uint64", indexed: true },
      { name: "closeAt", type: "uint64", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OrderSubmitted",
    inputs: [
      { name: "batchId", type: "uint64", indexed: true },
      { name: "user", type: "address", indexed: true },
      { name: "side", type: "uint8", indexed: false },
      { name: "limitPrice", type: "uint256", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "OrderCancelled",
    inputs: [
      { name: "batchId", type: "uint64", indexed: true },
      { name: "user", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "BatchSettled",
    inputs: [
      { name: "batchId", type: "uint64", indexed: true },
      { name: "clearingPrice", type: "uint256", indexed: false },
      { name: "filled", type: "uint8", indexed: false },
      { name: "unfilled", type: "uint8", indexed: false },
    ],
  },
  {
    type: "event",
    name: "SettlerUpdated",
    inputs: [
      { name: "oldSettler", type: "address", indexed: true },
      { name: "newSettler", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "PauseToggled",
    inputs: [
      { name: "paused", type: "bool", indexed: false },
    ],
  },

  // --- Admin Functions ---
  {
    type: "function",
    name: "setSettler",
    stateMutability: "nonpayable",
    inputs: [{ name: "_settler", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "togglePause",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },

  // --- Write Functions ---
  {
    type: "function",
    name: "initialize",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_tokenA", type: "address" },
      { name: "_tokenB", type: "address" },
      { name: "_batchDuration", type: "uint32" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountA", type: "uint256" },
      { name: "amountB", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountA", type: "uint256" },
      { name: "amountB", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "openBatch",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [{ name: "batchId", type: "uint64" }],
  },
  {
    type: "function",
    name: "submitOrder",
    stateMutability: "nonpayable",
    inputs: [
      { name: "batchId", type: "uint64" },
      { name: "side", type: "uint8" },
      { name: "limitPrice", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelOrder",
    stateMutability: "nonpayable",
    inputs: [{ name: "batchId", type: "uint64" }],
    outputs: [],
  },
  {
    type: "function",
    name: "settleBatch",
    stateMutability: "nonpayable",
    inputs: [{ name: "batchId", type: "uint64" }],
    outputs: [],
  },

  // --- Read Functions ---
  {
    type: "function",
    name: "getUserBalance",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "tokenABalance", type: "uint256" },
      { name: "tokenBBalance", type: "uint256" },
      { name: "tokenALocked", type: "uint256" },
      { name: "tokenBLocked", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getBatch",
    stateMutability: "view",
    inputs: [{ name: "batchId", type: "uint64" }],
    outputs: [
      { name: "openAt", type: "uint64" },
      { name: "closeAt", type: "uint64" },
      { name: "clearingPrice", type: "uint256" },
      { name: "buyCount", type: "uint8" },
      { name: "sellCount", type: "uint8" },
      { name: "status", type: "uint8" },
    ],
  },
  {
    type: "function",
    name: "getBuyOrder",
    stateMutability: "view",
    inputs: [
      { name: "batchId", type: "uint64" },
      { name: "index", type: "uint8" },
    ],
    outputs: [
      { name: "user", type: "address" },
      { name: "side", type: "uint8" },
      { name: "limitPrice", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "filledPrice", type: "uint256" },
      { name: "status", type: "uint8" },
    ],
  },
  {
    type: "function",
    name: "getSellOrder",
    stateMutability: "view",
    inputs: [
      { name: "batchId", type: "uint64" },
      { name: "index", type: "uint8" },
    ],
    outputs: [
      { name: "user", type: "address" },
      { name: "side", type: "uint8" },
      { name: "limitPrice", type: "uint256" },
      { name: "amount", type: "uint256" },
      { name: "filledPrice", type: "uint256" },
      { name: "status", type: "uint8" },
    ],
  },

  // --- Public State Variables ---
  {
    type: "function",
    name: "PRICE_SCALE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_ORDERS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "tokenA",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "tokenB",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "currentBatchId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint64" }],
  },
  {
    type: "function",
    name: "batchDuration",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint32" }],
  },
  {
    type: "function",
    name: "owner",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "settler",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "hasOrder",
    stateMutability: "view",
    inputs: [
      { name: "batchId", type: "uint64" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "protocolRevenue",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "PROTOCOL_FEE_BPS",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// -- Standard ERC20 ABI (for approve + allowance) --
export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;
