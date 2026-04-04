# MVP Demo Day Submission Form

**Project Name:**
BatchFi

**Builder / Team Name:**
yonkoo11

**Telegram Username:**
(fill yours)

**Discord Username:**
(fill yours)

**Which Track / Category:**
DeFi

**What problem are you solving?**
Traders on shared-chain DEXs get different prices depending on when their order lands. Fast bots consistently get better execution than regular users. The DEX itself captures none of that value, it leaks to L1 validators and searchers.

**What solution are you building?**
BatchFi is a DEX on its own Initia appchain. It collects orders for 30 seconds, then settles them all at one uniform price. Nobody gets priority by being faster. The protocol charges 0.1% on every fill and keeps the revenue on-chain.

**Who is this for? (target users)**
DeFi traders who want fair execution without worrying about bots. Initia builders looking at how an appchain can generate revenue from trading, not just serve as infrastructure.

**Demo Video (YouTube link only, max 3 minutes):**
(paste YouTube link after upload)

**Link to code repository:**
https://github.com/Yonkoo11/batchfi

**Which Initia features have you implemented?**
[x] Interwoven Kit
[x] Auto-sign / Session UX
[x] Interwoven bridge
[ ] Initia usernames (.init)

**Anything else you'd like us to know?**
Solo builder. 530 lines of Solidity, 33 Foundry tests. The contract charges 0.1% on every fill and has accumulated $21 in protocol revenue from test trades. Anyone can settle a batch after 5 minutes if the settler bot goes down, so funds never get stuck. Oracle precompile integration reads price feeds from the Cosmos oracle module via ICosmos at 0xf1.
   