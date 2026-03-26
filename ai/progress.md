# MEV Shield Initia - Progress

## Status: Production Polish + Design Complete, E2E Ready (2026-03-26)

## Infrastructure Running
- Minitia rollup: EVM RPC on :8545, gas price = 0
- OPinit: executor + challenger + relayer all daemonized
- Settler: cycling every ~32s, 270+ batches without crash, logs at /tmp/settler.log
- Frontend: dev server on :3099, logs at /tmp/nextdev.log

## Deployed Contracts
- BatchAuction: 0x5dDAee13AAdFa374DBd62811412C280d78e1f9BB
- shSOL (Token A): 0x3cBb5A79CB5702b9AEc850D0C6c6F47F79200057 (18 decimals)
- shUSDC (Token B): 0x4A46e1e80e5e5718e9B2294d312AAc0fE4Bd2668 (18 decimals)

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

## NOT Tested
- Wallet connect + deposit + order through the actual UI
- Toast notification rendering on real tx success/error
- ChainGuard wrong-network banner
- Connected-state trading UI with live data in new font

## Next Steps
1. Open MetaMask, add Minitia network (chain ID 1411570067076288, RPC localhost:8545)
2. Import deployer key, connect to localhost:3099
3. Deposit tokens, place order in open batch, watch settlement
4. Record demo video
5. DoraHacks submission

## Commands
```bash
cd ~/Projects/mev-shield-initia/settler && npm start    # settler
cd ~/Projects/mev-shield-initia/app && npx next dev -p 3099  # frontend

# Fund new wallet:
cast send <ADDR> --value 1 --rpc-url http://localhost:8545 --private-key <deployer_key>
```
