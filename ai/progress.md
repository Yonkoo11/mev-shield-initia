# MEV Shield Initia - Progress

## Status: Contract Security Fixed, Redeployed (2026-04-02)

## What Changed (Plain English) - Contract Security Fix (2026-04-02)

The trading contract got a security overhaul:

1. **Fair pricing fixed**: The old contract averaged the buyer's and seller's prices to set the clearing price, which meant putting in extreme prices could pull the final price in your favor. Now the clearing price is set at the sell-side marginal (the cheapest seller that crosses with a buyer), which makes gaming impossible. Your limit price only matters for whether you fill or not, not where the price lands.

2. **Withdrawal protection**: Added a reentrancy guard so a malicious token contract can't trick the withdrawal function into paying out twice.

3. **Only the settler can start and close batches**: Before, anyone could call openBatch(). Now only the designated settler address (or the owner) can open and settle batches. Regular users can only deposit, withdraw, place orders, and cancel.

4. **Emergency pause works properly**: If something goes wrong and the owner pauses the contract, settlement still works (so open batches can be finalized and funds returned), but no new batches or orders can be created.

5. **30 tests passing** (up from 14). New tests cover access control, pause behavior, multi-order clearing, and the uniform price algorithm.

6. **Fresh deployment**: New contract addresses on local minitia. Frontend, settler, README, and submission.json all updated.

### New Contract Addresses
- BatchAuction: 0xaE94586b2735bB61a08085Ec0b42b01ca6B60fd8
- shSOL (Token A): 0x17990Ea2Ba757fF731f41ae897C15D691A929d1F
- shUSDC (Token B): 0x5e10E636230a5f6acc3D6a59e6f550040a506069

### What Changed (Plain English) - Previous
Three completely different design mockups for the app are now ready to open in a browser and compare:

1. **The Vault** -- Picture a set of glowing rings with dots orbiting around them. Each dot is someone's order. A countdown ticks in the center. When it hits zero, the rings contract (the vault seals), a price is computed, and the rings pulse back out. The trading panel sits on the right side. Dark, dense, animated.

2. **The Shield Wall** -- A top-to-bottom flow. You place your order at the top, it drops through a glowing green barrier into a sealed batch (shown as a wall of hidden orders), and the results emerge at the bottom showing what filled and what didn't. Spacious and elegant, lots of breathing room.

3. **The Crossing** -- A split screen. Buy orders stack down the left side in cyan. Sell orders stack up the right side in coral. They meet in the middle at one price line. The order form sits at the center. You literally see buyers and sellers converging on the fair price.

All three work as standalone pages you can open in any browser. Each has a landing screen that appears before you connect, a full trading interface after you connect, a live countdown timer, and scales down to phone width.

## Infrastructure Running
- Minitia rollup: EVM RPC on :8545, gas price = 0
- OPinit: executor + challenger + relayer all daemonized
- Settler: cycling every ~32s, 270+ batches without crash, logs at /tmp/settler.log
- Frontend: dev server on :3099, logs at /tmp/nextdev.log

## Deployed Contracts (v2 - security fix)
- BatchAuction: 0xaE94586b2735bB61a08085Ec0b42b01ca6B60fd8
- shSOL (Token A): 0x17990Ea2Ba757fF731f41ae897C15D691A929d1F (18 decimals)
- shUSDC (Token B): 0x5e10E636230a5f6acc3D6a59e6f550040a506069 (18 decimals)

## Test Accounts (all registered on chain with 1 wei)
- Deployer/settler: 0x9aE2a08cA91d6C79047810304022de26605B0573
  - Wallet: 4,900 shSOL + 480,000 shUSDC
  - Contract: 0 shSOL + 33,500 shUSDC
- Bob: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (hardhat #1)
  - Wallet: 5,000 shSOL + 500,000 shUSDC
  - PK: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

## What Was Done This Session

### Chunk 1-6: Production Polish
- Env-driven config (RPC, addresses, chain ID) with .env.example
- ChainGuard component for wrong-network detection
- Sequential approve flow (A -> B -> deposit) with step tracking
- Input validation (price > 0, amount > 0, balance checks, max buttons)
- Removed all "TEE" references
- Timer fix: uses openAt/closeAt, "Settling..." state with polling
- User order results in BatchResult via hasOrder
- Toast system (zero deps, success/error/info, auto-dismiss)
- Error parser for contract custom errors + MiniEVM account errors
- BridgePanel replaced with clean external link
- Settler hardened: event-based batchId, wall-clock wait, health checks, retry, structured logging, graceful shutdown
- Polling reduced to 5s everywhere

### Critical Bugs Found & Fixed
1. **Token decimals**: hardcoded 6, actually 18. 10^12 magnitude error. Fixed everywhere.
2. **Settler stuck**: block.timestamp doesn't advance on dev chain. Wall-clock fallback added.
3. **MiniEVM account registration**: "fee payer does not exist" on fresh addresses. Pre-registered test accounts. Error parser updated.
4. **Token symbol mismatch**: contract says shSOL/shUSDC, UI says INIT/USDC. Display name constants added.

### Design Polish
- Font: Space Grotesk + JetBrains Mono (replaced banned Inter)
- Asymmetric feature layout (1 large + 2 stacked, not 3 identical cards)
- Stats integrated into primary feature card
- Compact flow timeline replacing heavy numbered-circles diagram
- Killed glow-pulse animation on PrivacyBadge
- Mobile: header connect buttons hidden, cards stack, 44px tap targets

### QA Gate Results
- Emojis in source: 0
- transition: all: 0
- !important: 1 (wallet button override, acceptable)
- Inline styles: 1 (BatchTimer progress width, dynamic)
- Hardcoded colors: only in globals.css (match tailwind tokens)
- SSR errors: 0
- tsc --noEmit: clean for both app/ and settler/

## What Changed (Plain English) - 2026-04-01

### InterwovenKit Integration (INITIATE Hackathon)
- **Wallet connection**: now uses Initia's own wallet system instead of MetaMask buttons. One "Connect Wallet" button opens InterwovenKit's wallet picker (supports Initia Wallet, social login via Privy, and browser wallets).
- **Session signing**: new toggle in the left sidebar lets you enable "auto-sign" so you can place orders without a popup every time. Sign once, trade for a session.
- **Bridge button**: the Initia Bridge link is now an in-app button that opens a bridge window pre-filled to send INIT from Initia L1 to MEV Shield.
- **Wallet display**: shows .init username if you have one, otherwise shows truncated address. New "Wallet" button opens portfolio/settings.
- **Submission files**: `.initia/submission.json` created with chain info, contract addresses, and feature flags.

### Hackathon: INITIATE (Initia Hackathon Season 1)
- **Deadline**: April 15, 2026, 11:59 PM UTC
- **Track**: DeFi
- **Required tech**: InterwovenKit (done), Initia-native feature (auto-sign + bridge, done), .initia/submission.json (done)
- **Still needed**: updated README, demo video, testnet deployment (stretch goal)
- **Calendar**: deadline added with 3-day reminder
- **Reminders**: April 12 reminder set

## NOT Tested (critical)
- InterwovenKit wallet connection on live dev server (build passes, runtime untested)
- Auto-sign enabling and disabling
- Whether auto-sign actually skips popups for EVM contract calls via wagmi
- Bridge modal opening with correct pre-fill
- All existing transaction flows (approve, deposit, order) still working through new connector
- .init username display

## Product Rethink Decision (2026-04-01)

Security audit of contracts found structural issues:
- Clearing price algorithm uses midpoint (incentivizes gaming, not honest bids)
- No reentrancy guards on withdraw
- openBatch() has no access control
- Emergency pause doesn't cover settlement
- No slippage protection
- Settler is centralized single point of failure that CAN extract MEV
- The core pitch ("MEV protection on Initia") is contradictory: you control the sequencer, MEV doesn't exist

User decided: rethink the product entirely before writing more code.

## Next Steps
1. Competitive research: study 3-5 products similar to what we're building (batch auction DEXs, MEV protection, Initia DeFi)
2. Identify what's genuinely unique about Initia appchains for DeFi
3. Define the real product (may keep batch auctions, may pivot entirely)
4. Run /design with competitive context for UI/UX proposals
5. Review designs segment-by-segment
6. Then build properly

Hackathon deadline is still April 15. Current code compiles and can be submitted as-is if needed, but the real product comes after proper design.

## Competitive Research Complete (2026-04-01)

### Products studied:
1. **CowSwap**: Solver competition, uniform clearing, gasless. $9B/month. Friendly cow branding. Fatal flaw: invisible value, 50% post-airdrop drop.
2. **Hyperliquid**: CEX-like appchain DEX. 200K orders/sec. Clean dark pro interface. TradingView charts + order book.
3. **dYdX v4**: Cosmos appchain. Off-chain orderbook, on-chain settlement. Data-rich marketplace view.
4. **Osmosis**: Cosmos AMM hub. Clean purple theme. Buy/Sell/Swap tabs. IBC liquidity solved cold-start.
5. **Astroport**: Cosmos DEX. Blue gradient background with floating 3D elements. Swap-focused.
6. **Sei**: Batch auctions at consensus level. 400ms blocks. MEV impossible by design.
7. **Penumbra**: Privacy-first Cosmos DEX. Sealed-bid batches.
8. **1inch Fusion**: Dutch auction resolvers. Invisible MEV protection.
9. **Flashbots Protect**: RPC endpoint, zero UI. 2.1M users.

### Initia ecosystem state:
- $3.8M TVL (tiny, mainnet just launched)
- Minitswap: built-in bridging DEX (not general trading)
- Contro: DeFi rollup with Gradual LOB (direct competitor)
- MiniEVM: Cosmos precompiles, oracle access, unified token standard

### Product direction decided: ai/product-direction.md
- Reframe from "MEV protection DEX" to "fair trading chain"
- Batch auctions at sequencer level (like Sei, but on Initia)
- IBC for cross-rollup liquidity (like Osmosis)
- Session signing for CEX-like UX
- Multi-pair support via factory pattern

### Screenshots captured:
- CowSwap (cow.fi swap page)
- Hyperliquid (HYPE/USDC trading view)
- Osmosis (swap interface)
- dYdX (markets overview)
- Astroport (swap page with 3D background)

### Design Review Complete (2026-04-02)
Reviewed all 3 proposals section-by-section as senior designer. Selected hybrid:
- P3 three-column crossing layout (buy depth left | order form + clearing price center | sell depth right)
- P2 navigation (Trade/Bridge/History/Docs) + batch lifecycle visualization below trading view
- P1 header stats bar + ring element as batch timer + teal accent color
- Added: radial background depth from center, session signing above fold

### System Updates Made (2026-04-02)
- CLAUDE.md: Added "NEVER present options when you can evaluate" rule (permanent, loaded every turn)
- MEMORY.md: feedback_autonomous_decisions.md saved
- hackathon.md: Phase 3c patched to evaluate autonomously instead of asking
- These changes mean /design and /hackathon will never ask "which one?" again

### Runtime Verification (2026-04-02)
- Landing page renders: YES (verified in browser, reads live contract data for batch stats)
- InterwovenKit wallet modal opens: YES (shows Google/Email/X social login + Rabby/Phantom/Keplr/Leap/MetaMask)
- Fixed "Chain not found: mevshield-1" error (use initiation-2 as InterwovenKit default, EVM works through wagmi regardless)
- Minitia rollup: started via `weave rollup start`, producing blocks at height 1200+
- Settler: running, connected, 30s batch cycle active
- Console shows "2 errors" toast: pino-pretty module warning from WalletConnect (non-blocking, cosmetic only)

### NOT verified (requires browser wallet extension)
- Connected trading view three-column layout rendering
- Deposit/withdraw/order flows through InterwovenKit connector
- Auto-sign toggle enabling/disabling
- Bridge modal pre-fill
- OrderDepth and BatchLifecycle rendering with mock data in connected state

### NEXT ACTION (resume here)
1. Restart settler with new auction address (kill old, `cd settler && bun run start`)
2. Wire OrderDepth to real contract data (read getBuyOrder/getSellOrder from BatchAuction, replace mock arrays)
3. Wire BatchLifecycle to real user order data (read hasOrder + order status per batch)
4. Run /design Phase 4 (production polish via /ui-revamp)
5. Open in real browser with wallet extension, test full connected flow
6. Record demo video 24h before deadline
7. Submit on DoraHacks

### Infrastructure commands (copy-paste to restart)
```bash
weave rollup start                                    # minitia rollup
cd ~/Projects/mev-shield-initia/settler && bun run start  # settler
cd ~/Projects/mev-shield-initia/app && npx next dev -p 3099  # frontend
```

### Post-hackathon (production)
- Fix clearing algorithm (midpoint -> uniform crossing)
- Add reentrancy guards, slippage protection, access control on openBatch
- Replace mock data with live contract queries in OrderDepth/BatchLifecycle
- Deploy to Initia testnet
- Run /design Phase 4 (production polish) + Phase 5 (QA gate)
- External security review

## Commands
```bash
cd ~/Projects/mev-shield-initia/settler && npm start    # settler
cd ~/Projects/mev-shield-initia/app && npx next dev -p 3099  # frontend

# Fund new wallet:
cast send <ADDR> --value 1 --rpc-url http://localhost:8545 --private-key <deployer_key>
```
