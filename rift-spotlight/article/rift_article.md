# My Younger Ones Already Understand What Rift Is Building.

There was a time in my life, as a young boy, when I always felt bad whenever it crossed my mind to stop patronising someone I oft bought from, simply because they sold higher than others.

At some point, I did confront them that someone else sells it cheaper. But most times, I'd consider their age, their personal bills, the little difference in price, and overall, the stress they go through to get it here.

To put it simply, I gave reasons on their behalf.

But when I got a bit older, I got to an age where I could decide to stop patronising them, and stop feeling bad because I did.

Yet, nature visits. I got to a stage where I could send my younger ones on errands, and they, as kids, know where that particular thing is sold for a cheaper price.

They know when it's sold for a higher price here and a lower price there. They buy from wherever it's cheaper, even with the distance.

[IMAGE: the market street, her stall crossed out, the runner reaching the ₦950 stall]

**Kids don't make excuses for a bad price. They just go where it's cheaper.**

That's the story I could tell to make you understand what Rift is building.

## Every route has a different price

If you've ever moved money across chains, you know the drill.

You open one app, get a quote. Open another, get a slightly better one, but there's a bridge fee. Open a third, and by the time you're done comparing, the price has moved. And at the end, you still don't really know if you got the best one.

Here's how wide that gap can be. On a quote I pulled for 10 BTC → USDT on Ethereum (15 Nov), the venues came back with:

- LI.FI: 639,767.85 USDT
- Relay: 639,798.21 USDT
- NEAR Intents: 644,165.89 USDT
- Rift: 645,331.16 USDT

That's over $5,500 between the worst and the best quote. Same 10 BTC, same moment.

[IMAGE: Rift's result row with the red NEAR Intents and LI.FI rows under it]

## So what is Rift?

Rift is an onchain execution API. You can use it to trade tokens, bridge, buy tokenized stocks and earn yield, all in one click. It's backed by Paradigm.

Instead of being one more venue you have to check, Rift checks the venues for you. It taps into 20+ venues, including Uniswap, CoW Swap, Across, CCTP, Hyperliquid, Unit, Chainflip, NEAR Intents, Relay, LI.FI, KyberSwap and Velora, across 9 chains: Bitcoin, Ethereum, Base, Arbitrum, Polygon, Hyperliquid, Ink, Robinhood and, most recently, Plasma.

10,000+ assets are supported, and on the big pairs like BTC/USDC and ETH/USDC you can move $10m+ in a single trade.

## So, how does Rift actually work?

This is prolly the most important part, so strap up.

Every trade on Rift is an order: go from asset A to asset B.

1. **You get your own deposit address.** Every order has a unique one. You send your funds there, and that's the only thing you do. No approvals, no blind-signing calldata, no waiting on step one before you can start step two.
2. **Rift finds the best route when your money lands.** Quotes are checked again once funds arrive, and the best price is worked out at every step of the route, not just at the start.
3. **Each leg gets executed for you.** If the best price means going through three chains, it goes through three chains.

Here's what the route looked like on my 10 BTC → USDT quote:

- Bitcoin BTC → Hyperliquid BTC (via Unit)
- Hyperliquid BTC → Hyperliquid USDC (via Hyperliquid spot)
- Hyperliquid USDC → Ethereum USDC (via CCTP)
- Ethereum USDC → Ethereum USDT (via CoW Swap)

Four steps, three chains, one click. That's my younger one walking past three shops to get to the cheap one.

[IMAGE: the route drawn across Bitcoin, Hyperliquid and Ethereum]

**Non-custodial, by design.** Rift executes orders inside secure hardware enclaves (TEEs). Per their docs, the Rift team cannot steal or arbitrarily freeze user funds. Code upgrades are gated by an onchain multisig with a timelock, and any single admin key can trigger a refund for active orders during that window.

**If a venue breaks mid-route,** Rift tries every other venue for that step. A refund only happens if all of them fail. Per their FAQ, 98.9% of orders have completed successfully.

**MEV protection:** on EVM chains, transactions go through a private mempool (Flashbots).

## Zero added fees. So how do they make money?

Rift charges 0 added fees. You get the rate of the venues, nothing on top.

They run their own solver, which competes for your trade like every other venue. If it offers the best price, it wins the trade and earns. If not, you get routed to whoever is cheapest, and Rift makes nothing.

Just like my younger ones won't ask me for a stimmy because they got what I wanted at a cheaper price.

[IMAGE: the phone tap, "0 added fees."]

## It's not just swaps

The same one-click engine runs other things too:

- **Tokenized stocks:** buy from any asset, across Robinhood, Ondo, xStocks and Coinbase. (Check their terms for region restrictions.)
- **Yield:** one-click deposits into vaults on Morpho, Aave, Euler, Tydro and UltraYield, and moving between vaults just as easily.
- **Payments:** since every order is just a deposit address, you can accept any asset and receive whatever you want. It works for QR-code payments too.
- **For builders:** it's an API, and you don't even need an API key to start.

## But don't confuse best price with no risk

I want to be clear about this part.

- **Quotes are indicative, not exact.** Prices move while your order executes. Rift doesn't use a max slippage setting. It forces execution at the best available price so your order completes instead of reverting.
- **You inherit venue risk.** If a venue in your route gets hacked mid-order, funds in that leg are at risk.
- **TEEs come with trust assumptions.** You're trusting the hardware maker (Intel) and the data center (Phala) not to be compromised.
- **No third-party audit yet.** Their own FAQ says so.
- **Refunds aren't free.** If every venue for a leg fails, the refund also goes through a venue, so you get back a bit less than you put in.

So understand the structure just as well as you understand the price.

## Kids don't feel bad. Your money shouldn't either.

When I think back to that woman's stall, the funny part is that I was the one doing the extra work. I was checking prices, making excuses, and feeling guilty about it.

My younger ones skipped all that. They just knew where it was cheaper and went there.

That's what Rift does with your money. It checks every venue, at every step, adds nothing on top, and lets you click once.

**Sometimes the best price isn't about loyalty. It's about having someone who checks every shop for you.**

Explore Rift below 👇

Website: https://rift.trade
Docs: https://rift.trade/docs
X: @RIFTHQ

[VIDEO: RIFT Weekly Spotlight]
