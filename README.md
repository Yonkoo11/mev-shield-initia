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
   └─ Clearing price = sell-side marginal at crossing

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
│  │ 30 tests pass │                          │
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

**Frontend** (`app/`) -- Next.js 14 + InterwovenKit + wagmi + viem
- Three-column crossing layout: buy depth | order form + clearing price | sell depth
- Batch lifecycle visualization (your orders -> sealed batch -> settlement results)
- InterwovenKit wallet connection (social login, Initia Wallet, MetaMask, Keplr, etc.)
- Auto-signing via InterwovenKit `enableAutoSign` (no wallet popups)
- Interwoven Bridge integration (in-app cross-chain bridging)
- SVG ring countdown timer for batch lifecycle

## Clearing Price Algorithm

Uniform clearing at the sell-side marginal price. This is the standard call auction convention used by traditional exchanges.

```
Given: buyOrders sorted by price DESC, sellOrders sorted by price ASC

1. Walk both arrays simultaneously
2. Accumulate volume on each side
3. Stop when buy price < sell price (no more crossing)
4. Clearing price = sell-side marginal (the cheapest seller that still crosses)

Example:
  Alice sells 100 @ 120    Bob buys 100 @ 150
  Crossing exists (150 >= 120)
  Clearing price = 120 (sell-side marginal)
  Alice fills at her limit. Bob pays 120 instead of his 150 max. Both sides get fair execution.

Why not midpoint?
  Midpoint (135) creates a gaming incentive: submit extreme limit prices to pull
  the clearing price in your favor. Marginal pricing makes the limit price irrelevant
  once it crosses. You get the uniform price regardless of how aggressive your limit was.
```

## Initia Features Used

| Feature | How We Use It |
|---------|--------------|
| **MiniEVM Rollup** | Dedicated chain = dedicated transaction ordering = no MEV by design |
| **InterwovenKit** | `@initia/interwovenkit-react` for wallet connection, social login (Google/Email/X), multi-wallet support |
| **Auto-signing** | Session signing via `enableAutoSign` removes wallet popups for active traders |
| **Interwoven Bridge** | In-app `openBridge()` for bridging INIT from Initia L1 to the MEV Shield rollup |
| **.init Usernames** | InterwovenKit displays `.init` usernames when connected (via `useInterwovenKit().username`) |

## Deployed Contracts (local Minitia)

| Contract | Address |
|----------|---------|
| BatchAuction | `0xaE94586b2735bB61a08085Ec0b42b01ca6B60fd8` |
| ShieldSOL (Token A) | `0x17990Ea2Ba757fF731f41ae897C15D691A929d1F` |
| ShieldUSDC (Token B) | `0x5e10E636230a5f6acc3D6a59e6f550040a506069` |

Chain ID (EVM): `1411570067076288` | Chain ID (Cosmos): `mevshield-1`

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
├── .initia/            # Hackathon submission metadata
│   └── submission.json
├── contracts/          # Foundry project (Solidity 0.8.24)
│   ├── src/
│   │   ├── BatchAuction.sol     (core DEX, 7 write functions)
│   │   ├── ShieldSOL.sol        (ERC20 token A)
│   │   └── ShieldUSDC.sol       (ERC20 token B)
│   ├── test/
│   │   └── BatchAuction.t.sol   (30 tests)
│   └── script/
│       └── Deploy.s.sol
├── settler/            # Off-chain crank service
│   └── src/index.ts    (ethers.js v6, batch open/settle cycle)
├── app/                # Next.js 14 frontend
│   ├── app/            (layout, page, providers w/ InterwovenKit)
│   ├── components/     (11 components)
│   │   ├── OrderDepth.tsx       (buy/sell depth bars)
│   │   ├── BatchLifecycle.tsx   (3-stage order flow viz)
│   │   ├── BatchTimer.tsx       (SVG ring countdown)
│   │   ├── AutoSignToggle.tsx   (session signing)
│   │   ├── OrderForm.tsx        (limit order entry)
│   │   ├── DepositPanel.tsx     (token deposit/withdraw)
│   │   └── ...
│   ├── hooks/          (wagmi contract hooks)
│   └── lib/            (ABI, addresses, config)
├── proposals/          # 3 design proposals (HTML mockups)
└── ai/                 # Architecture docs + progress
```

## License

MIT
