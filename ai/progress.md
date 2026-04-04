# BatchFi - Progress

## Status: FULL E2E VERIFIED IN BROWSER (2026-04-04)

## Browser Test PASSED (2026-04-04)
User connected Rabby wallet on localhost:3099, trading view rendered, deposit + order flow works.
Chain switching fix (wallet_addEthereumChain) resolved the "asking for ETH" issue.
This was the last unverified risk. The product works end-to-end.

## Senior Dev Critique Pass (2026-04-04)
Found and fixed 4 bugs:
1. BatchTimer showed /20 instead of /100 (hardcoded, didn't match MAX_ORDERS)
2. OrderForm didn't include 0.1% fee in cost estimate (would cause contract revert)
3. Order summary showed no fee disclosure (subtotal/fee/total breakdown added)
4. Oracle reference price only on landing page (now passed to OrderForm too)
Auto-sign chain ID confirmed correct (L1 authz is how InterwovenKit works).

## Completed Today
- Phase 1: Fresh chain, E2E verified (deposit -> order -> settle -> correct fills)
- Phase 2: Contract v3 (0.1% fee, MAX_ORDERS 100, settler fallback). 33/33 tests.
- Phase 3: Rebranded to BatchFi. Zero MEV references. Revenue-first pitch.
- Phase 4: Oracle precompile verified (16 feeds). Live $21.60 revenue on landing page. 6 traders seeded.

## Remaining (2 items)
- Demo video: 1-3 min on Loom/YouTube showing full flow (landing -> connect -> deposit -> order -> settle -> revenue)
- Submit on DoraHacks: fill commit_sha + demo_video_url in submission.json, submit
- ~~Manual test: PASSED with Rabby wallet~~
- NOT done: .init username display (deprioritized)

## What Changed (Plain English) - Rebrand Session (2026-04-04)

1. The app is now called **BatchFi** instead of MEV Shield. Every reference to MEV, sandwich attacks, and frontrunning is gone from the user-facing app.
2. The new pitch: "One price. Every trader. The chain enforces it." Focus is on fair pricing and protocol revenue, not MEV prevention.
3. The contract now takes a **0.1% fee** on every filled trade. Revenue accumulates on-chain and the owner can withdraw it. This directly answers the hackathon's "revenue-first" theme.
4. The order book now supports **100 orders per batch** instead of 20.
5. If the settler bot goes down, **anyone can settle** after a 5-minute grace period. Users' funds can't get stuck.
6. **33 tests passing** including new tests for the fee system and the fallback settlement.
7. All changes deployed to live chain and verified: 9 USDC of protocol revenue collected from a test trade.
8. Live on GitHub Pages at yonkoo11.github.io/mev-shield-initia (landing page only, trading needs local chain).

## E2E Test Result (2026-04-04) - PASSED
Full cycle verified via cast CLI:
1. Deployer + Bob funded with GAS + tokens
2. Approvals + deposits succeeded
3. Batch opened, buy order (100 USDC/SOL) + sell order (90 USDC/SOL) placed
4. Settlement at clearing price 90 (sell-side marginal) -- CORRECT
5. Bob: +10 shSOL, -900 shUSDC. Deployer: -10 shSOL, +900 shUSDC -- CORRECT
6. Frontend compiles and serves on :3099 (27s first load due to InterwovenKit)
7. Settler cycling batches on new contracts

NOT tested yet: browser wallet connect flow (requires MetaMask extension, can't do in headless puppeteer)

## Deployer (fresh chain)
EVM address: 0x1d6463ef2dE6813CdC6249145Cd179120Eaf78E9
Cosmos: init1r4jx8medu6qnehrzfy29e5tezg82778fu48u5t
(Keys stored locally in ~/.minitia/artifacts/config.json)

## Decision: Rebrand + Ship (April 15 deadline, 11PM UTC)

Hackathon scoring: Technical Execution (30%) + Working Demo (20%) + Product UX (20%) + Originality (20%) + Market (10%).
50% = "does it work." We have 80% of a working product. Rebrand the story, fix the gaps, ship.

## Critical Findings (2026-04-04)

### MiniEVM Precompiles Available
- **ICosmos** at `0x00...f1`: execute ANY Cosmos SDK message, query oracle prices
- **ConnectOracle.sol**: deployed wrapper for oracle price queries
- **IERC20Registry** at `0x00...f2`: register ERC20s in Cosmos bank module
- **IJSONUtils** at `0x00...f3`: parse JSON from Cosmos queries
- Can do IBC transfers from Solidity via `execute_cosmos`

### Deployment: No VPS Needed
- Judges watch demo video (1-3 min, Loom/YouTube)
- Deployment evidence = chain ID + tx link in submission.json
- Everything runs locally via `weave rollup start`

### submission.json Required Fields
project_name, repo_url, commit_sha, rollup_chain_id, deployed_address, vm, native_feature, core_logic_path, native_feature_frontend_path, demo_video_url

### .init Usernames = Frontend Hook
- InterwovenKit `useUsernameQuery` hook
- NOT available on-chain in Solidity

## Build Plan (11 days to April 15)

### Phase 1: Verify E2E Works (Day 1 - TODAY)
- [ ] Test connected wallet flow on localhost:3099
- [ ] Deposit, order, batch settle, verify fill
- [ ] Test auto-sign toggle
- [ ] Fix whatever breaks

### Phase 2: Contract Upgrades (Days 2-3)
- [ ] Add protocol fee (0.1% on fills)
- [ ] Integrate ConnectOracle precompile (reference price)
- [ ] Increase MAX_ORDERS from 20 to 100
- [ ] Update tests, redeploy

### Phase 3: Rebrand (Day 4)
- [ ] New name, hero copy, submission.json, README
- [ ] Revenue + fair pricing pitch, NOT MEV

### Phase 4: Deeper Initia Integration (Days 5-6)
- [ ] .init username display via useUsernameQuery
- [ ] Oracle reference price in trading UI
- [ ] Seed demo with test orders for visible depth

### Phase 5: Polish + Demo (Days 7-8)
- [ ] /design QA gate (liveness, fonts, slop check)
- [ ] Record 1-3 min demo video
- [ ] README with setup instructions

### Phase 6: Submit (Days 9-10)
- [ ] Final submission.json with all fields
- [ ] Clean repo (no secrets, no .claude/)
- [ ] Submit on DoraHacks

## Critique Fixes (from senior dev review)
1. [x] Protocol fee -- 0.1% on fills, $21.60 revenue accumulated
2. [x] ConnectOracle -- query working, displayed when price > 0
3. [x] MAX_ORDERS 20→100
4. [ ] .init usernames in order book (deprioritized, auto-sign satisfies requirement)
5. [x] Settler fallback -- anyone settles after 5 min grace period
6. [x] Seed demo data -- 6 traders, orders at multiple price levels
7. [x] Rebrand -- BatchFi, zero MEV references, revenue-first pitch

## Infrastructure
```bash
weave rollup start
cd ~/Projects/mev-shield-initia/settler && bun run start
cd ~/Projects/mev-shield-initia/app && npx next dev -p 3099
```

## Contracts (v3, current deployment)
- BatchAuction: 0xdDb2Abd925E5a96e283fAaecB303E2b63cfe5B46
- shSOL: 0x7A18b51f82af4e0ceFfA9161ce191290F0634F97
- shUSDC: 0x89c37E61a3836e56e8a88fe4f98Dc964B1Fde041

## Test Accounts
- Deployer: 0x1d6463ef2dE6813CdC6249145Cd179120Eaf78E9 (also settler)
- Bob (hardhat #1): 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
- 4 additional traders (hardhat #2-5) funded and deposited for demo depth
