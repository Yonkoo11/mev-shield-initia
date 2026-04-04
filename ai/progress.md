# MEV Shield Initia → Rebrand - Progress

## Status: Fresh Chain Running, Need Account Registration Before Deploy (2026-04-04)

## BLOCKER: MiniEVM Account Registration
Fresh rollup running at block 2+. Genesis GAS increased to 10^24 (1M ETH).
Gas station (deployer) = init1nt32pr9fr4k8jprczqcyqgk7yes9kptnppjd40 = 0x9aE2a08cA91d6C79047810304022de26605B0573.
Has 10^24 GAS on Cosmos side but EVM address is unregistered.
CANNOT send EVM tx until Cosmos account exists.
Fix: Use Cosmos REST API or minitiad CLI to do a bank send from gas station, which registers the account.
The mnemonic is in ~/.minitia/artifacts/config.json under system_keys.admin.
Alternative: The hackathon docs say `weave init` handles this. May need to re-run `weave init` or use the REST API at localhost:1317.

## Admin/Gas Station Mnemonic
"change entire visual decide amazing weasel fabric engage remove first cement kitten dragon patient spare capital bunker demise sauce broccoli town present member tragic"
Cosmos addr: init1nt32pr9fr4k8jprczqcyqgk7yes9kptnppjd40 (=deployer 0x9aE2...)

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

## Critique Fixes Required (from senior dev review)
1. Protocol fee -- contract has zero revenue model. Add 0.1% on fills.
2. ConnectOracle -- show reference price. Proves Initia integration depth.
3. MAX_ORDERS 20→100 -- current cap is a toy.
4. .init usernames in order book -- Initia-native UX.
5. Settler fallback -- add timeout so anyone can settle expired batches.
6. Seed demo data -- empty DEX looks dead.
7. Rebrand -- drop all "MEV" references. Revenue-first pitch.

## Infrastructure
```bash
weave rollup start
cd ~/Projects/mev-shield-initia/settler && bun run start
cd ~/Projects/mev-shield-initia/app && npx next dev -p 3099
```

## Contracts (will change after redeploy)
- BatchAuction: 0xaE94586b2735bB61a08085Ec0b42b01ca6B60fd8
- shSOL: 0x17990Ea2Ba757fF731f41ae897C15D691A929d1F
- shUSDC: 0x5e10E636230a5f6acc3D6a59e6f550040a506069

## Test Accounts
- Deployer: 0x9aE2a08cA91d6C79047810304022de26605B0573
- Bob: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  PK: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
