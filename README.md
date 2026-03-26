# MEV Shield

**A batch auction DEX deployed as its own Initia rollup, where sandwich attacks and frontrunning are mathematically impossible.**

Built for [INITIATE - The Initia Hackathon](https://dorahacks.io/hackathon/initiate/) (Season 1) | DeFi Track

## The Problem

On shared-state blockchains, MEV extraction is unavoidable. Searchers observe your pending transactions and sandwich them for profit. Every DEX trade on Ethereum, Solana, or any shared chain leaks value to MEV bots.

"Don't worry, the sequencer is honest" isn't a solution. It's a trust assumption.

## The Solution

MEV Shield runs as its own Initia EVM rollup (Minitia). All orders within a batch execute at a **single uniform clearing price**, computed from the intersection of supply and demand curves.

This means:
- **No sandwich attacks** -- there's no "before" or "after" your trade. All orders in a batch are equal.
- **No frontrunning** -- seeing someone else's order gives you zero advantage. The clearing price is determined by ALL orders collectively.
- **No trust assumptions** -- the clearing price algorithm is deterministic and verifiable on-chain. Not "trust the sequencer," but "verify the math."

## Why an Appchain?

This is the strongest argument for Initia's appchain thesis: **MEV protection that's impossible on a shared chain becomes trivial on your own rollup.**

On a shared chain, you can't control transaction ordering without trusting someone. On your own Minitia, the batch auction contract IS the ordering mechanism. The rollup doesn't need a trusted sequencer because the contract enforces fairness at the protocol level.

## How It Works

```
1. Batch Opens (30s window)
   └─ Users submit limit orders (buy/sell INIT at price X)
   └─ Orders are sealed -- no one can see or react to others

2. Batch Closes
   └─ Settler calls settleBatch()
   └─ Contract walks sorted buy (DESC) and sell (ASC) arrays
   └─ Finds supply-demand crossing point
   └─ Clearing price = midpoint of crossing

3. Settlement
   └─ Orders at or better than clearing price: FILLED at clearing price
   └─ Orders worse than clearing price: UNFILLED, funds unlocked
   └─ Everyone who fills pays/receives the SAME price
```

## Architecture

```
┌─────────────────────────────────────────────┐
│              Initia MiniEVM Rollup          │
│                                             │
│  ┌──────────────┐  ┌────────┐  ┌────────┐  │
│  │ BatchAuction  │  │shINIT  │  │shUSDC  │  │
│  │   .sol        │  │(ERC20) │  │(ERC20) │  │
│  │ 7 functions   │  └────────┘  └────────┘  │
│  │ 14 tests pass │                          │
│  └──────────────┘                           │
└─────────────────────────────────────────────┘
        ▲                    ▲
        │                    │
   ┌────┴────┐         ┌────┴────┐
   │ Settler  │         │Frontend │
   │ (crank)  │         │(Next.js)│
   │ ethers v6│         │ wagmi   │
   └──────────┘         └─────────┘
```

**Contracts** (`contracts/`) -- Foundry project
- `BatchAuction.sol` -- Core DEX: initialize, deposit, withdraw, openBatch, submitOrder, cancelOrder, settleBatch
- `ShieldSOL.sol` / `ShieldUSDC.sol` -- Demo ERC20 tokens
- 14 Foundry tests covering the full order lifecycle

**Settler** (`settler/`) -- TypeScript crank service
- Opens batches, waits for expiry, triggers settlement
- ~100 lines of ethers.js v6

**Frontend** (`app/`) -- Next.js 14 + wagmi + viem
- Dark trading UI with real-time batch countdown
- Deposit/withdraw, limit order submission, batch results
- Auto-signing via Initia's InterwovenKit (no wallet popups)

## Clearing Price Algorithm

Ported from our [Solana implementation](https://github.com/yonkoo11/mev-shield) (9 passing tests on devnet).

```
Given: buyOrders sorted by price DESC, sellOrders sorted by price ASC

1. Walk both arrays simultaneously
2. Accumulate volume on each side
3. Stop when buy price < sell price (no more crossing)
4. Clearing price = (last crossing buy price + last crossing sell price) / 2

Example:
  Alice sells 100 @ 120    Bob buys 100 @ 150
  Crossing exists (150 >= 120)
  Clearing price = (150 + 120) / 2 = 135
  Both fill at 135. Alice gets more than her minimum. Bob pays less than his maximum.
```

## Initia Features Used

| Feature | How We Use It |
|---------|--------------|
| **MiniEVM Rollup** | Dedicated chain = dedicated transaction ordering = no MEV by design |
| **Auto-signing** | Orders submit without wallet popups (InterwovenKit `enableAutoSign`) |
| **Interwoven Bridge** | Bridge INIT from L1 to the rollup to start trading |

## Quick Start

```bash
# Test contracts
cd contracts && forge test -vv

# Build frontend
cd app && bun install && npx next build

# Run settler (needs .env with RPC_URL, PRIVATE_KEY, AUCTION_ADDRESS)
cd settler && bun install && bun run start
```

## Project Structure

```
mev-shield-initia/
├── contracts/          # Foundry project
│   ├── src/
│   │   ├── BatchAuction.sol
│   │   ├── ShieldSOL.sol
│   │   └── ShieldUSDC.sol
│   ├── test/
│   │   └── BatchAuction.t.sol   (14 tests)
│   └── script/
│       └── Deploy.s.sol
├── settler/            # Crank service
│   └── src/index.ts
├── app/                # Next.js frontend
│   ├── components/     (8 components)
│   ├── hooks/          (wagmi hooks)
│   └── lib/            (ABI + config)
└── ai/                 # Dev notes
```

## License

MIT
