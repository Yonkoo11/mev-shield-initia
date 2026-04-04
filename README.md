# BatchFi

**Fair trading protocol on its own Initia appchain. One uniform clearing price per batch. Every trade generates protocol revenue.**

Built for [INITIATE - The Initia Hackathon](https://dorahacks.io/hackathon/initiate/) (Season 1) | DeFi Track

## What It Does

BatchFi runs batch auctions on a dedicated Initia MiniEVM rollup. Every 30 seconds:

1. Users submit sealed limit orders (buy or sell)
2. Batch closes, clearing algorithm finds the uniform price where supply meets demand
3. All matching orders fill at that single price
4. Protocol collects 0.1% fee on every fill

The chain itself is the business. Every transaction is revenue the protocol keeps -- no value leakage to L1 validators or external sequencers.

## Why an Appchain?

This is the Initia thesis in action:

- **Fair ordering is the protocol.** The batch auction contract IS the transaction ordering mechanism. On a shared chain, you'd need to trust someone not to reorder. On your own rollup, the contract enforces fairness.
- **Gas revenue stays with you.** Every user transaction generates gas revenue the appchain operator keeps.
- **Session signing.** InterwovenKit's auto-sign lets traders sign once and place orders without wallet popups. This UX is only possible because the chain supports Cosmos SDK authz grants natively.
- **Cosmos precompiles.** The contract reads oracle price feeds via the ICosmos precompile at `0xf1`, which queries the Connect oracle module directly from Solidity. This is not available on any standard EVM chain.

## How the Clearing Algorithm Works

```
Given: buyOrders sorted by price DESC, sellOrders sorted by price ASC

1. Walk both arrays simultaneously
2. Accumulate volume on each side
3. Stop when buy price < sell price (no more crossing)
4. Clearing price = sell-side marginal (cheapest seller that crosses)

Example:
  Alice sells 100 SOL @ $120    Bob buys 100 SOL @ $150
  Crossing exists ($150 >= $120)
  Clearing price = $120 (sell-side marginal)
  Bob pays $120 (not his $150 max). Alice gets $120.
  Protocol collects 0.1% from each side.

Why sell-side marginal, not midpoint?
  Midpoint ($135) creates a gaming incentive: submit extreme limits to
  pull the price. Marginal pricing makes limits irrelevant once they cross.
```

## Initia-Native Features

| Feature | Implementation |
|---------|---------------|
| **Own MiniEVM Rollup** | Dedicated appchain with chain ID `mevshield-1`, EVM chain ID `1411570067076288` |
| **InterwovenKit** | `@initia/interwovenkit-react` for wallet connection (Google, Email, X, MetaMask, Keplr, etc.) |
| **Auto-signing** | Session signing via `enableAutoSign` -- sign once, trade without popups |
| **Interwoven Bridge** | In-app `openBridge()` for bridging INIT from L1 to BatchFi rollup |
| **ICosmos Precompile** | Oracle price feed query from Solidity via `query_cosmos("/connect.oracle.v2.Query/GetPrices", ...)` |
| **.init Usernames** | Displayed in header when connected via InterwovenKit |

## Smart Contract

`contracts/src/BatchAuction.sol` -- 530 lines, 33 Foundry tests passing.

Key parameters:
- `PROTOCOL_FEE_BPS = 10` (0.1% on both buyer and seller fills)
- `MAX_ORDERS = 100` per batch per side
- `SETTLE_GRACE_PERIOD = 300` (anyone can settle after 5 min if settler is down)
- `batchDuration = 30` seconds

Revenue model: 0.1% of every filled order's notional value, denominated in the quote token (shUSDC). Accumulates in `protocolRevenue` on-chain, withdrawable by the owner.

## Architecture

```
┌──────────────────────────────────────────────────┐
│            Initia MiniEVM Rollup                 │
│                                                  │
│  ┌──────────────┐  ┌─────────┐  ┌─────────┐     │
│  │ BatchAuction  │  │ shSOL   │  │ shUSDC  │     │
│  │ + 0.1% fee   │  │ (ERC20) │  │ (ERC20) │     │
│  │ + oracle     │  └─────────┘  └─────────┘     │
│  │ + fallback   │                                │
│  │ 33 tests     │  ┌─────────────────────┐       │
│  └──────────────┘  │ ICosmos Precompile  │       │
│                    │ Oracle price feeds   │       │
│                    └─────────────────────┘       │
└──────────────────────────────────────────────────┘
        ▲                      ▲
        │                      │
   ┌────┴─────┐          ┌────┴─────┐
   │ Settler   │          │ Frontend │
   │ (crank)   │          │ Next.js  │
   │ ethers v6 │          │ wagmi    │
   │ 30s cycle │          │ IWKit    │
   └───────────┘          └──────────┘
```

## Deployed Contracts

| Contract | Address |
|----------|---------|
| BatchAuction | `0xdDb2Abd925E5a96e283fAaecB303E2b63cfe5B46` |
| ShieldSOL (Token A) | `0x7A18b51f82af4e0ceFfA9161ce191290F0634F97` |
| ShieldUSDC (Token B) | `0x89c37E61a3836e56e8a88fe4f98Dc964B1Fde041` |

Chain ID (EVM): `1411570067076288` | Chain ID (Cosmos): `mevshield-1`

## Local Setup

### Prerequisites

- [Weave CLI](https://docs.initia.xyz/developers/developer-guides/tools/clis/weave-cli) (for the rollup)
- [Foundry](https://book.getfoundry.sh/) (for contracts)
- [Bun](https://bun.sh/) or Node.js 18+ (for settler + frontend)

### 1. Start the rollup

```bash
weave rollup start
```

This starts the Initia MiniEVM rollup on `localhost:8545`.

### 2. Deploy contracts

```bash
cd contracts
PRIVATE_KEY=<your-deployer-pk> forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

Then mint demo tokens to your test accounts:
```bash
cast send <ShieldSOL> "mint(address,uint256)" <your-address> 5000000000000000000000 --private-key <pk> --rpc-url http://localhost:8545
cast send <ShieldUSDC> "mint(address,uint256)" <your-address> 500000000000000000000000 --private-key <pk> --rpc-url http://localhost:8545
```

### 3. Start the settler

```bash
cd settler
bun install
PRIVATE_KEY=<settler-pk> AUCTION_ADDRESS=<auction-address> bun run start
```

### 4. Start the frontend

```bash
cd app
bun install
npx next dev -p 3099
```

Open http://localhost:3099 and connect your wallet.

### 5. Run tests

```bash
cd contracts
forge test -vv
```

33 tests covering: deposit/withdraw, order submission/cancellation, uniform clearing price algorithm, multi-order crossing, protocol fee accumulation, revenue withdrawal, settler fallback, access control, pause behavior.

## Project Structure

```
mev-shield-initia/
├── .initia/
│   └── submission.json         # Hackathon submission metadata
├── contracts/                  # Foundry project (Solidity 0.8.24)
│   ├── src/
│   │   ├── BatchAuction.sol    # Core DEX (530 lines, 33 tests)
│   │   ├── ShieldSOL.sol       # Demo ERC20 token A
│   │   └── ShieldUSDC.sol      # Demo ERC20 token B
│   └── test/
│       └── BatchAuction.t.sol  # Full test suite
├── settler/                    # Off-chain crank service
│   └── src/index.ts            # Batch open/settle cycle (ethers.js v6)
├── app/                        # Next.js 15 frontend
│   ├── app/                    # Layout, page, providers (InterwovenKit)
│   ├── components/             # 12 components
│   ├── hooks/                  # wagmi contract hooks
│   └── lib/                    # ABI, addresses, config
└── ai/                         # Architecture decisions + progress
```

## Competitive Landscape

| | BatchFi | CowSwap | Sei | Contro |
|---|---|---|---|---|
| Mechanism | Batch auction | Solver auction | FBA at consensus | Gradual LOB |
| Chain | Own Initia rollup | Ethereum | Sei L1 | Initia rollup |
| Revenue model | 0.1% protocol fee | Solver fees | Gas fees | Trading fees |
| Session signing | Yes (InterwovenKit) | No | No | Unknown |
| Gas for users | Cheap (own chain) | Gasless | Low | Low |
| Oracle integration | Cosmos precompile | Chainlink | Native | Unknown |

## License

MIT
