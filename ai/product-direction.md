# MEV Shield Initia - Product Direction

## Date: 2026-04-01

## What MEV Shield IS

A fair trading chain on Initia. Batch auctions enforce uniform clearing prices at the sequencer level. Not a smart contract DEX on someone else's chain. An appchain where fair ordering is the protocol.

## What It Is NOT

- Not "MEV protection" (the appchain already eliminates adversarial ordering)
- Not a hackathon demo (production-quality contracts, settler, UX)
- Not a single-pair toy (factory pattern for arbitrary pairs)

## Core Mechanism

1. Users deposit tokens into the protocol
2. Users submit sealed limit orders during a batch window
3. Batch closes, clearing algorithm finds uniform price at supply/demand crossing
4. All matching orders fill at the same price
5. Unfilled orders return to available balance

## What Makes This an Appchain Product (Not a Smart Contract)

- Sequencer enforces ordering rules (no reordering possible)
- Gas is free/cheap (complex matching feasible on-chain)
- Session signing (auto-sign) removes wallet friction
- IBC connection to Initia L1 and other rollups for liquidity
- Custom precompiles for oracle price feeds

## Competitive Positioning

| Feature | MEV Shield | CowSwap | Sei | Contro |
|---------|-----------|---------|-----|--------|
| Mechanism | Batch auction | Solver auction | FBA at consensus | Gradual LOB |
| Chain | Initia appchain | Ethereum | Sei L1 | Initia rollup |
| MEV protection | Sequencer-enforced | Off-chain solvers | Consensus-level | Order book |
| Cross-chain | IBC | Bridge (slow) | None | IBC |
| Session signing | Yes (InterwovenKit) | No | No | Unknown |
| Gas for users | Free/cheap | Gasless (solver pays) | Low | Low |

## Critical Fixes Needed (from security audit)

1. **Clearing algorithm**: Replace midpoint with proper uniform price at crossing point
2. **Reentrancy guards**: Add to withdraw(), using OpenZeppelin ReentrancyGuard
3. **Access control on openBatch()**: Only settler role, or permissioned opener
4. **Emergency pause**: Must cover settleBatch() too
5. **Slippage protection**: Add minFillPrice/maxFillPrice to submitOrder()
6. **Decimal handling**: Support different-decimal token pairs
7. **Settler incentives**: Protocol fee -> gas refund -> slash for downtime
8. **Multi-pair**: Factory pattern for deploying new trading pairs
9. **Upgrade path**: UUPS proxy for contract upgrades

## Design Competitors to Study

Visual/UX references for the /design phase:
- **Hyperliquid**: CEX-like speed and UX, clean dark theme, real-time order book
- **dYdX v4**: Professional trading interface, position management
- **CowSwap**: Friendly branding, gasless UX, educational onboarding
- **Osmosis**: Cosmos-native, pool-based UI, cross-chain bridge integration
- **Sei/Astroport**: Fast trading interface with batch auction UX

## Liquidity Bootstrap Strategy

1. Partner with Initia foundation for incentivized pools
2. Connect via IBC to Initia L1 liquidity (Minitswap)
3. Bonded liquidity gauges (Osmosis model)
4. Target Initia ecosystem tokens first (INIT pairs)
5. EIR program (if hackathon wins) provides investor intros

## Build Phases

### Phase 1: Fix Core Contract (1-2 weeks)
- Uniform clearing algorithm
- Reentrancy guards
- Slippage protection
- Emergency pause
- Access control
- Full test suite (Foundry)

### Phase 2: Production Settler (1 week)
- Redundant settler with health monitoring
- Economic incentives (fee distribution)
- Alerting on missed settlements

### Phase 3: Multi-Pair + Factory (1 week)
- Factory contract for deploying new pairs
- Pair discovery UI
- Token registry

### Phase 4: IBC Integration (1-2 weeks)
- Bridge tokens from Initia L1
- Cross-rollup liquidity aggregation
- Minitswap integration for fast withdrawals

### Phase 5: Production UI (concurrent with above)
- Competitive design research -> /design proposals
- Segment-by-segment review
- Real-time order book visualization
- Session signing UX
- Bridge integration in app

### Phase 6: Testnet Deployment + Audit
- Deploy to Initia testnet
- External security review
- Load testing
- Community beta
