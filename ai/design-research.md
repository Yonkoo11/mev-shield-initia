# Design Research Brief

## Product Category: DeFi Batch Auction Trading App (Appchain)

## Comparables Studied

### 1. CowSwap (cow.fi)
**Category:** Batch auction DEX aggregator
**Layout:** Centered swap card, minimal chrome, branded background illustration
**Color:** Dark navy (#1F2639) + cyan/teal accent. Playful.
**Typography:** Sans-serif, large headlines (up to 148px on marketing), friendly tone
**Key interaction:** Gasless intent signing. No gas popups. Users feel nothing.
**Signature element:** Cow branding + the animated farmscape background. Memorable and distinct.
**What works:** Brand identity is so strong you'd never confuse it with another DEX. Gasless UX removes the biggest DeFi friction.
**What doesn't:** The swap card itself is generic Uniswap-clone layout. Value of MEV protection is invisible to users.
**Steal this:** Background that tells a story (not just dark + gradient). Branded empty states.

### 2. Hyperliquid (app.hyperliquid.xyz)
**Category:** Appchain perpetuals DEX
**Layout:** Full TradingView chart left, order panel right, positions/history bottom. Classic pro trading layout.
**Color:** Dark (#0d0d0e) + teal accent (#2ee8bb). Minimal color, data-dense.
**Typography:** Compact sans-serif, heavy use of monospace for numbers, small text (~12-13px body)
**Key interaction:** Real-time order book with instant fills. Feels like a CEX.
**Signature element:** Speed. Everything updates instantly. No loading states visible.
**What works:** Traders feel at home. Familiar layout means zero learning curve.
**What doesn't:** Text is too small. Information overload for non-traders. Not memorable visually.
**Steal this:** The order panel simplicity (Market/Limit/Pro tabs with Buy/Sell toggle).

### 3. dYdX v4 (app.dydx.trade)
**Category:** Cosmos appchain perpetuals DEX
**Layout:** Markets overview (default), tabbed navigation (Trade/Spot/Markets/Portfolio)
**Color:** Dark (#101114) + purple/blue accent. Data-rich with category tags.
**Typography:** Clean sans-serif, good hierarchy (large volume numbers, medium market names, small metadata)
**Key interaction:** Market discovery with filters (Meme, DeFi, Layer 1, etc.)
**Signature element:** The stats dashboard on landing (Trading Volume, Open Interest, Fees Generated). Proves real usage.
**What works:** Volume proof builds trust immediately. Category filters help discovery.
**What doesn't:** Complex for beginners. No onboarding. Assumes you know what perpetuals are.
**Steal this:** Real-time stats on landing page proving the system is alive and used.

### 4. Osmosis (app.osmosis.zone)
**Category:** Cosmos AMM hub
**Layout:** Sidebar nav, centered swap card, clean and spacious
**Color:** Dark purple (#1a003d to #0c0018) + purple/violet accent. Rich depth.
**Typography:** Large token amounts (oversized input numbers), clean labels, good whitespace
**Key interaction:** Buy/Sell/Swap tabs making the same interface serve 3 mental models
**Signature element:** The Osmosis orb logo + purple color world. Feels cosmic/deep.
**What works:** Generous whitespace. The swap card feels premium, not cramped. IBC route display.
**What doesn't:** Slow load times. Some pages feel empty (too much space, not enough content).
**Steal this:** Buy/Sell/Swap tab pattern. Large token input numbers. The way they show the exchange rate below the swap.

### 5. Astroport (app.astroport.fi)
**Category:** Cosmos DEX
**Layout:** Sidebar nav (icon-based), centered swap, floating 3D elements in background
**Color:** Deep blue gradient background with glassmorphism cards. Blue/purple palette.
**Typography:** Clean, medium density
**Key interaction:** Swap with visual depth from background elements
**Signature element:** The 3D floating objects in the background that give spatial depth. Makes it feel alive.
**What works:** Background creates atmosphere and makes it visually distinct from other DEXs.
**What doesn't:** 3D elements are decorative, not informative. Disclaimer modal blocks first interaction.
**Steal this:** Atmospheric background that creates depth without distracting from the trading UI.

---

## Common Patterns (table stakes - must include)
- Dark theme as default
- Centered swap/order card as primary interaction
- Token pair selector with logos
- Connect wallet button (top right)
- Balance display (available to trade)
- Transaction confirmation states

## Differentiation Opportunities
1. **Batch auction visualization**: No competitor shows HOW a batch auction works visually. The batch lifecycle (collecting -> sealed -> clearing -> settled) is an opportunity to create a unique interaction that teaches users the mechanism.
2. **Fairness proof**: CowSwap hides MEV protection. dYdX shows volume. Nobody shows "here's how much MEV you DIDN'T lose." Real-time savings display.
3. **Session signing UX**: No competitor has Initia's auto-sign. The "enable session, trade without popups" flow is a genuine UX advantage to highlight.
4. **Background storytelling**: CowSwap has the farm, Astroport has 3D objects. MEV Shield could use the "shield" metaphor visually — orders entering a protected zone.

## Design Constraints
- Must support batch auction lifecycle (not just instant swap)
- Must show batch timer (when does this round close?)
- Must show order status (pending -> filled/unfilled)
- Must handle deposit/withdraw flow (tokens held in contract)
- Auto-sign toggle needs prominent placement
- Bridge integration (Interwoven Bridge button)
- Mobile-responsive (but desktop-first for trading)

## Anti-patterns (must avoid)
- Generic swap card that looks like Uniswap clone (CowSwap, Osmosis trap)
- Text too small / data too dense for non-traders (Hyperliquid trap)
- No onboarding for batch auction concept (dYdX trap - assumes expertise)
- Decorative 3D elements with no purpose (Astroport trap)
- Purple-blue gradient as primary color (every Cosmos app does this)

## Stolen Elements (adapt, not copy)
- From **Hyperliquid**: Market/Limit + Buy/Sell toggle order panel. Clean, proven, zero learning curve.
- From **dYdX**: Real-time protocol stats on landing (batches settled, total volume, MEV saved). Builds trust.
- From **CowSwap**: Branded atmospheric background. Makes the product memorable and distinct from generic DEXs.
- From **Osmosis**: Generous whitespace + oversized token input numbers. Feels premium.
- From **Sei (concept)**: Batch-per-block visualization showing fairness mechanism in action.
