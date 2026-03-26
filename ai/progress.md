# MEV Shield Initia - Progress

## Status: Phase 0-4 COMPLETE, E2E VERIFIED (2026-03-26)

## Completed
- [x] Phase 0: Rollup live (weave v0.3.8, mevshield-1, bridge ID 1705)
- [x] Phase 1: Contracts (14/14 tests, deployed + initialized)
- [x] Phase 2: Settler (tested live, skips empty batches correctly)
- [x] Phase 3: Frontend (builds clean, correct Initia branding)
- [x] Phase 4: FULL E2E with 2-party trade on live rollup

## Deployment (Testnet - mevshield-1)
- Chain ID: 1411570067076288 (EVM)
- JSON-RPC: http://localhost:8545
- ShieldSOL: 0x3cBb5A79CB5702b9AEc850D0C6c6F47F79200057
- ShieldUSDC: 0x4A46e1e80e5e5718e9B2294d312AAc0fE4Bd2668
- BatchAuction: 0x5dDAee13AAdFa374DBd62811412C280d78e1f9BB
- Deployer: 0x9aE2a08cA91d6C79047810304022de26605B0573
- Alice (test): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
- Gas price: 0 (free txs)

## E2E 2-Party Trade (Batch #5)
- Deployer SELL 100 SOL @ 120
- Alice BUY 100 SOL @ 150
- Clearing price: 135 (midpoint, as expected)
- Deployer: 0 SOL, 33.5K USDC (+13.5K from sale)
- Alice: 300 SOL (+100 bought), 36.5K USDC (-13.5K spent)
- ALL FUNDS CORRECT, zero locked after settlement

## Known Issue: MiniEVM Account Registration
- New EVM addresses must receive at least 1 wei of GAS before they can send txs
- Error: "fee payer address does not exist: unknown address"
- Fix: send 1 wei from any funded account before first use
- For demo: pre-fund accounts or add faucet step to deposit flow

## Remaining
- [ ] OPinit executor + relayer (interactive setup needed in terminal)
- [ ] Demo video
- [ ] DoraHacks submission

## Commands
```bash
cd contracts && forge test -vv       # 14/14 pass
cd app && npx next dev -p 3001       # frontend
cd settler && bun run start          # crank loop

# Fund new wallet for demo:
cast send <NEW_ADDR> --value 1 --rpc-url http://localhost:8545 --legacy --private-key "0x5100a9f48d2abb9f980c3313bd8816159fedff45f04bfff9ef8c61051629e30f"
```
