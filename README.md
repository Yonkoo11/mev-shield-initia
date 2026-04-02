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

**Frontend** (`app/`) -- Next.js 14 + InterwovenKit + wagmi + viem
- Three-column crossing layout: buy depth | order form + clearing price | sell depth
- Batch lifecycle visualization (your orders -> sealed batch -> settlement results)
- InterwovenKit wallet connection (social login, Initia Wallet, MetaMask, Keplr, etc.)
- Auto-signing via InterwovenKit `enableAutoSign` (no wallet popups)
- Interwoven Bridge integration (in-app cross-chain bridging)
- SVG ring countdown timer for batch lifecycle

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
| **InterwovenKit** | `@initia/interwovenkit-react` for wallet connection, social login (Google/Email/X), multi-wallet support |
| **Auto-signing** | Session signing via `enableAutoSign` removes wallet popups for active traders |
| **Interwoven Bridge** | In-app `openBridge()` for bridging INIT from Initia L1 to the MEV Shield rollup |
| **.init Usernames** | InterwovenKit displays `.init` usernames when connected (via `useInterwovenKit().username`) |

## Deployed Contracts (local Minitia)

| Contract | Address |
|----------|---------|
| BatchAuction | `0x5dDAee13AAdFa374DBd62811412C280d78e1f9BB` |
| ShieldSOL (Token A) | `0x3cBb5A79CB5702b9AEc850D0C6c6F47F79200057` |
| ShieldUSDC (Token B) | `0x4A46e1e80e5e5718e9B2294d312AAc0fE4Bd2668` |

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
│   │   └── BatchAuction.t.sol   (14 tests)
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
