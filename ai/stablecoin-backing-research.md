# MEV & Protocol Revenue as Stablecoin Backing: Hard Numbers

**Research date:** 2026-04-02
**Confidence:** Data sourced from public reports, on-chain dashboards, SEC filings, and audit attestations. Where exact numbers aren't available, stated explicitly.

---

## 1. MEV Revenue on Ethereum - Actual Numbers

### Annual Revenue by Year

| Year | MEV Revenue (USD) | Source/Notes |
|------|-------------------|-------------|
| 2021 | $550M-$730M | Bull market peak. Miners/operators earned $730M per LD Capital; Flashbots tracked $554M cumulative by year-end |
| 2022 | $307M+ | Bear market. Cumulative $675M extracted Dec 2019-Sep 2022 per Flashbots data |
| 2023 | ~$300M-$400M (est) | Bear market recovery. ~$500K/day average early 2023, declining. Jan-Feb 2023 alone: $48.3M extracted |
| 2024 | $1.1B | Per PANews/multiple sources. MEV-Boost facilitated >$1B in validator revenue |
| 2025 Q2 | $129M (quarter) | Per cross-chain analysis. Solana did $271M same quarter |

**Key: MEV revenue roughly doubled from bear ($307M) to bull ($1.1B) - a ~3.5x swing, not the 80% drop I'd feared but still significant cyclicality.**

### Per-Block Data

- Average MEV payment per block: **0.1554 ETH** (October 2024)
- Post-Merge (Sep 2022 - Jun 2024): **526,207 ETH** total extracted by validators
- Peak single day: **7,691 ETH** (March 2023, SVB/USDC depeg crisis)
- Previous record: **3,928 ETH** (FTX collapse, November 2022)

### Block Participation

- **~90% of Ethereum blocks** are MEV-Boost blocks
- MEV relays distribute **>98% of execution layer rewards**
- Top 2 builders capture **>90% of block auctions** (Titan ~51%, BuilderNet ~25%)
- All validator cohorts have **>70% MEV-Boost adoption**

### Cyclicality Pattern

| Condition | Monthly MEV Revenue | Annualized |
|-----------|-------------------|------------|
| Bear market floor (early 2023) | ~$24M/month | ~$290M/year |
| Normal conditions (mid-2024) | ~$90M/month | ~$1.1B/year |
| Crisis spikes (SVB, FTX) | Single days worth $10M+ | N/A - event-driven |
| Bull peak (late 2021) | ~$60M/month | ~$730M/year |

**The bear-to-bull ratio is roughly 3.5-4x.** MEV never goes to zero because liquidations spike during crashes (May/June/November 2022 were actually HIGH MEV months due to cascading liquidations). MEV's floor is set by liquidation activity, which is counter-cyclical to price.

### Composition

- Sandwich attacks: **66%** of total Ethereum MEV
- Arbitrage: **33%**
- Liquidation: **<1%** (but spikes massively during volatility events)
- 100+ active bots account for **~75% of MEV extraction**

---

## 2. L2 Sequencer Revenue - Actual Numbers

### 2025 Annual Revenue by Chain

| Chain | 2025 Sequencer Revenue | Profit | Margin |
|-------|----------------------|--------|--------|
| Base | ~$93M (est from H1 $42.4M + H2 $35.7M from OP data; Coinbase reports suggest higher) | ~80-100% pre-blob fee spikes, ~45% during high-blob periods | High but variable |
| Arbitrum | ~$42M | ~$26M annual run rate (DAO gross profit) | ~60% |
| Optimism | ~$26M | Part of Superchain $44.5M H2 profit | ~60-70% |

### Base Deep Dive (from Coinbase SEC filings)

- Q3 2024: **$34M** sequencer fees
- Q4 2024: **$26.36M** revenue, **$24.18M** profit (92% margin), blob costs only $2.18M
- Q4 2025: **~$19M** gross revenue, **~$15M** net (after L1 costs + OP revenue share)

### Superchain (Optimism ecosystem) Totals

- H1 2025: **$48.4M** total sequencer revenue across all OP Chains
- H2 2025: **~$41.3M** (14.7% decline from H1)
- Base drives **87% of Superchain sequencer revenue**
- OP Collective receives: greater of 2.5% of sequencer revenue OR 15% of sequencer profit
- H2 2025 Collective allocation: **$7.2M**

### Post-EIP-4844 Impact on Margins

Before EIP-4844 (March 2024): L1 data costs were the primary expense, eating 30-50% of revenue.
After EIP-4844: Blob-based posting cut DA costs by **>50%**. Margins jumped to 80-100% for most of 2024.

### Arbitrum New Revenue Streams

- Timeboost (MEV auction for sequencer priority): **$5M in first 7 months**
- $3M in 3 months from transaction ordering alone
- Stablecoin program yields + treasury management added as revenue sources

### All L2s Combined (rough 2025 estimate)

Base ($93M) + Arbitrum ($42M) + Optimism ($26M) + others = **~$200M+/year** in total L2 sequencer revenue across major chains.

---

## 3. Ethereum Staking Revenue - Actual Numbers

### Scale

- **35.7M ETH staked** (~$120B at ~$3,400/ETH)
- **1,060,332 active validators** (Sep 2025)
- **29.3% of total ETH supply** staked by year-end 2025

### Yield

- Base consensus layer: **2.84% APY**
- With MEV + priority fees: **3.3-3.5% total**
- MiCA-compliant platforms paid: **$4.5B in Q1 2025 alone** (12% YoY increase)

### Annual Revenue Calculation

35.7M ETH * 3.3% = ~1.18M ETH/year in staking rewards
At $3,400/ETH = **~$4B/year** in total staking rewards
Extrapolating Q1 2025 ($4.5B) to full year = **$14-18B/year** (but this includes non-Ethereum staking platforms)

**Ethereum-only staking revenue: ~$4B/year is the defensible number.**

### EigenLayer / Restaking

- TVL: **$15.3B** (93.9% market share in restaking)
- Total restaking ecosystem: **$28.6B TVL** (ATH)
- Yields: **2-15% on top of base 3-4% Ethereum staking**
- Programmatic Incentives v2 boosted NRR from 5% to **>20% for EIGEN restakers**
- Revenue model: 20% fee on AVS rewards + EigenCloud service fees

**But: EigenLayer revenue is mostly subsidized by token incentives, not organic protocol fees. The 20% AVS fee applies to incentive-subsidized rewards, not real economic activity. Don't count this as "revenue" for backing purposes.**

---

## 4. MegaETH USDm - What It Actually Is

### The Honest Assessment

USDm is **NOT MEV-backed**. It's a **Treasury-yield-backed stablecoin** where the yield subsidizes sequencer costs. Here's the real mechanism:

1. **Collateral:** USDtb (Ethena product), which holds **BlackRock BUIDL** (tokenized US Treasuries) via Securitize
2. **USDtb has ~$1.5B in circulation**
3. **Yield source:** US Treasury interest (~4-5% APY)
4. **Yield destination:** Programmatically covers MegaETH sequencer operating costs
5. **Result:** Gas is priced at-cost (no margin for the chain)

### What This Means

- The stablecoin peg comes from **Treasury collateral**, same as USDC/USDT
- The "innovation" is using yield to subsidize operations instead of taking it as profit
- It's clever accounting, not a new backing mechanism
- Foundation channels USDm transaction fees into **MEGA token buybacks** (circular tokenomics)

### Reserve Flexibility

- v1: USDtb (Treasuries)
- Future: Could include USDe (Ethena's delta-neutral synthetic dollar)
- Governance votes on approved reserve compositions

**Bottom line: MegaETH USDm is "Treasuries back the dollar, yield pays for infrastructure." Not "MEV backs the dollar."**

---

## 5. The Math: Could MEV/Protocol Revenue Back a Stablecoin?

### Revenue Pool (Annual, Conservative)

| Source | Bear Market | Normal | Bull Market |
|--------|-----------|--------|-------------|
| Ethereum MEV | $290M | $700M | $1.1B |
| L2 Sequencer Revenue | $100M | $200M | $400M |
| Ethereum Staking | $3B | $4B | $6B |
| **Total** | **$3.4B** | **$4.9B** | **$7.5B** |

### What Size Stablecoin Could This Back?

**Scenario A: Pure revenue backing (no collateral, just cash flow)**

At 100% "coverage ratio" (annual revenue = total supply):
- Bear: $3.4B stablecoin
- Normal: $4.9B stablecoin
- Bull: $7.5B stablecoin

This is tiny. USDT alone is $140B+.

**Scenario B: Revenue as yield on collateral (the MegaETH model)**

If the stablecoin is 100% collateral-backed (Treasuries) and revenue subsidizes operations:
- Revenue becomes irrelevant to the peg (collateral does the work)
- Revenue just pays for infrastructure / generates profit
- This is what MegaETH actually does
- Could scale to any size (limited by Treasury supply, not MEV)

**Scenario C: Over-collateralized with revenue as stability buffer**

150% collateral ratio, revenue fills a stability fund:
- $10B stablecoin needs $15B collateral
- $4.9B/year revenue creates a 33% buffer annually
- After 3 years, stability fund = stablecoin supply
- Bear market drawdown ($3.4B) still maintains 23% annual buffer
- This actually works for a small-to-mid-size stable

**Scenario D: Fractional reserve with revenue backstop (DANGEROUS)**

50% collateral, revenue expected to cover the gap:
- $10B stablecoin with $5B collateral
- Need $5B/year in revenue to maintain confidence
- Normal year: $4.9B revenue = barely covers the gap
- Bear year: $3.4B revenue = $1.6B shortfall
- **This is how you get a death spiral. Don't do this.**

### The Smoothing Problem

MEV revenue is cyclical but counter-intuitively, crashes INCREASE liquidation MEV:
- May 2022 (LUNA crash): MEV spiked massively
- Nov 2022 (FTX): Single-day ATH in MEV
- March 2023 (SVB): 7,691 ETH in one day

This means MEV has a natural hedge against market downturns. The real risk is a **quiet bear market** with low volatility and low DeFi activity (think Q3-Q4 2022 after the dust settled). That's when MEV drops to $24M/month.

**Smoothing mechanism:**
1. In bull markets, reserve 40% of revenue into stability fund
2. During bear markets, draw from stability fund
3. If fund drops below 6-month operating costs, raise collateral ratio
4. Circuit breaker: if revenue drops >60% for 3+ months, halt new minting

---

## 6. Tether as Seigniorage Model (The Real Precedent)

### Tether's Numbers

| Year | Net Profit | Treasury Holdings |
|------|-----------|-------------------|
| 2024 | **$13B** | $113B in Treasuries |
| 2025 (Q1-Q3) | **>$10B** | $135B Treasuries (Q3 ATH) |
| 2025 full year | **~$13B** | $122B direct + $141B with reverse repos |

- Q2 2025: **$4.9B quarterly interest income**
- Revenue source: **~4-5% yield on $127B+ in Treasuries**
- Users hold non-interest-bearing USDT while Tether earns interest on reserves

### This IS Seigniorage

Tether operates exactly like a central bank:
- Issues currency (USDT) at zero cost
- Invests reserves in government bonds
- Pockets the spread (4-5% on $140B = ~$6B/year in pure interest)
- The rest comes from other investments

The Fed does the same thing: issues dollars (zero cost), buys Treasuries, earns interest, remits profit to the Treasury. Tether's $13B annual profit exceeds many small countries' central bank seigniorage.

### Historical Precedent: Central Bank Seigniorage

- **Fed seigniorage (2023):** $0 remittance (operating losses due to high rates on reserves)
- **Fed seigniorage (2021):** $107.4B remitted to Treasury
- **ECB seigniorage (2023):** Negative (losses from rate hikes)
- **Bank of England:** Typically 2-4B GBP/year

Stablecoins have effectively privatized seigniorage. Tether captures what central banks used to.

---

## 7. Verdict: Is Revenue-Backed Stablecoin Viable?

### What Works

1. **Treasury-backed + revenue-subsidized operations** (MegaETH model): Yes, works. But it's not really "MEV-backed." It's Treasuries with extra steps.

2. **Over-collateralized + revenue stability buffer** (Scenario C): Yes, for a $5-10B stablecoin. Revenue creates meaningful safety margins. The counter-cyclical nature of liquidation MEV helps.

3. **Multi-source revenue** (staking + MEV + sequencer): $4.9B/year is real money. As a buffer on top of collateral, it's meaningful.

### What Doesn't Work

1. **Pure revenue-backed** (no collateral): $4.9B/year can only back a $4.9B stable at 1x coverage. Too small, too volatile.

2. **Fractional reserve with revenue backstop**: Death spiral risk. Revenue drops when you need it most (quiet bear markets).

3. **Single-source backing** (MEV only): $700M/year at best, $290M at worst. Can't back anything meaningful alone.

### The Real Opportunity

The interesting play isn't "MEV backs a stablecoin." It's:

**"Aggregate all protocol infrastructure revenue (staking + MEV + sequencer + restaking + DA fees) into a diversified yield source that subsidizes stablecoin operations, with the stablecoin itself backed by traditional collateral (Treasuries/RWAs)."**

This is what MegaETH is doing at small scale. The question is whether someone builds this at Ethereum L1 scale across all revenue sources.

### Numbers That Don't Exist (Gaps in This Research)

- Month-by-month MEV breakdown for 2023-2024 (dashboards exist at mevboost.org but no published annual reports)
- Exact median vs mean MEV per block (only the October 2024 average of 0.1554 ETH found; the distribution is heavily right-skewed but no published median)
- EigenLayer actual organic revenue vs subsidized incentives (they don't separate these in public data)
- Combined all-chain MEV for 2025 (Ethereum $129M Q2 + Solana $271M Q2 = $400M Q2 combined, suggesting $1.5-2B annual cross-chain)
- L2 sequencer revenue for zkSync, Scroll, Starknet (not published in comparable format)

---

## Sources

- [EthCC MEV Tales 2024](https://ethcc.io/archives/numbers-dont-lie-10-mev-tales-that-shaped-ethereums-landscape-in-2024)
- [BTCS Ethereum & MEV Primer (March 2025)](https://www.btcs.com/wp-content/uploads/2025/03/Analyst-Primer-Ethereum-and-MEV-March-2025-vF.pdf)
- [Extropy Cross-Chain MEV Analysis 2025](https://academy.extropy.io/pages/articles/mev-crosschain-analysis-2025.html)
- [RelayS can - MEV-Boost Relay Stats](https://www.relayscan.io/)
- [MEVBoost.org - Tracker](https://www.mevboost.org/)
- [Flashbots MEV-Boost Docs](https://boost.flashbots.net/)
- [Arbitrum Timeboost Revenue](https://blockworks.co/news/arbitrum-timeboost-live-dao-revenue)
- [Arbitrum Token Flow Report July 2025](https://online.flippingbook.com/view/256681616)
- [Messari State of Superchain H1 2025](https://messari.io/report/state-of-the-superchain-h1-2025)
- [Messari State of Superchain H2 2025](https://messari.io/report/state-of-the-superchain-h2-2025)
- [MegaETH Introduces USDm](https://www.megaeth.com/blog-news/megaeth-introduces-usdm)
- [The Block: MegaETH USDm Launch](https://www.theblock.co/post/369786/megaeth-usdm-stablecoin)
- [MegaETH Foundation MEGA Buybacks](https://www.theblock.co/post/388914/megaeth-foundation-to-use-usdm-stablecoin-revenue-to-fund-mega-token-buybacks)
- [Everstake ETH Staking Annual 2025](https://everstake.one/resources/crypto-reports/ethereum-staking-insights-protocol-analysis-annual-2025)
- [EigenLayer Tokenomics](https://tokenomics.com/articles/eigenlayer-tokenomics-how-eigen-captures-restaking-revenue)
- [1kx 2025 Onchain Revenue Report](https://1kx.network/writing/2025-onchain-revenue-report)
- [Dune L2 Sequencer Net Profit](https://dune.com/Renaudheitz/l2-sequencer-net-profit)
- [Coinbase 2024 10-K (SEC Filing)](https://s27.q4cdn.com/397450999/files/doc_financials/2024/q4/Coinbase-Global-Inc-2024-10K-for-IR.pdf)
- [Tether Q4 2024 Attestation](https://tether.io/news/tether-hits-13-billion-profits-for-2024-and-all-time-highs-in-u-s-treasury-holdings-usdt-circulation-and-reserve-buffer-in-q4-2024-attestation/)
- [Tether Q1-Q3 2025 Attestation](https://tether.io/news/tether-attestation-reports-q1-q3-2025-profit-surpassing-10b-record-levels-in-us-treasuries-exposure-accelerating-usdt-supply-amidst-worlds-macroeconomic-uncertainty/)
- [EigenPhi MEV Data](https://eigenphi.io/)
- [Cryptechie: How Big is the MEV Opportunity](https://www.cryptechie.com/p/how-big-is-the-mev-opportunity)
- [EigenPhi MEV Outlook 2023](https://eigenphi.substack.com/p/mev-outlook-2023)
- [PANews: MEV Invisible Tax](https://www.panewslab.com/en/articles/300c98a1r196)
- [Fed Seigniorage/Stablecoins Paper](https://www.federalreserve.gov/econres/notes/feds-notes/the-stable-in-stablecoins-20221216.html)
- [Savvy Wealth: Stablecoins as War Bonds](https://www.savvywealth.com/blog-posts/stablecoins-as-modern-war-bonds-a-new-anchor-for-the-treasury-market-amid-a-fragmenting-dollar-order)
