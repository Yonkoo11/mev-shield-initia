# BatchFi Demo Video — Voiceover Script

Target: ~90 seconds, 6 clips
Hackathon: INITIATE (Initia Hackathon Season 1) — DeFi track
Scoring: Technical Execution 30%, Working Demo 20%, Product UX 20%, Originality 20%, Market 10%

---

## Clip 01 — open-product
**Frame:** Landing page showing "Everyone gets the same price", $21.60 revenue, 100 max orders
**Voice:**
"This is BatchFi. A batch auction DEX running on its own Initia appchain. Every thirty seconds, it collects orders and clears them at one uniform price. Twenty-one dollars in protocol revenue so far from test trades."

---

## Clip 02 — connect-trade
**Frame:** Connected trading view — three-column layout with batch timer, order form, order depth
**Voice:**
"Connect a wallet through InterwovenKit. The trading view shows the current batch countdown, your balances, and the order depth on both sides. Place a limit order and it goes into the batch."

---

## Clip 03 — settlement
**Frame:** Batch settled state — clearing price shown, order results visible in BatchLifecycle
**Voice:**
"When the timer hits zero, the settler calls the contract. The clearing algorithm walks sorted buys and sells, finds where supply meets demand, and sets one price. Everyone who fills gets that price. No one gets priority."

---

## Clip 04 — contract
**Frame:** Terminal showing `forge test` output — 33 tests passing
**Voice:**
"The contract is five hundred lines of Solidity with thirty-three tests. It charges zero point one percent on every fill. There is a settler fallback so anyone can settle after five minutes if the bot goes down. Funds never get stuck."

---

## Clip 05 — initia-features
**Frame:** Screenshot showing InterwovenKit wallet modal (Google, Email, X, MetaMask, Keplr)
**Voice:**
"Built with InterwovenKit for wallet connection, session signing so you can trade without popups, and the Interwoven Bridge for moving tokens from Initia L1. The oracle precompile at address F1 feeds reference prices from the Cosmos oracle module."

---

## Clip 06 — close
**Frame:** Landing page hero with "Everyone gets the same price"
**Voice:**
"BatchFi. Fair trading on Initia."
