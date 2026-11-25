"""Tessera FAQ motion video: scene list -> build/faq/timeline.json
All on-screen answer text is Tessera's FAQ wording, verbatim (sources/faq/faq.md)."""
import json, math, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BEAT = 0.4930          # the owner's song, ~121.7 BPM; scene lengths snap to whole beats
PACE = 1.12            # global reading-pace multiplier (tuned so the cut lands just over 5:00)

SEC1 = ["Is there an account approval or accreditation step?", "Who can trade on Tessera?", "Which wallets are supported?"]
SEC2 = ["How do Tessera token auctions work?", "How does trading and settlement work?", "Can I sell my tokens?"]
SEC3 = ["How are the underlying assets legally structured?", "Is Tessera a custodial platform?", "How is on-chain backing verified?"]

S = []  # (type, params)
def add(t, **p): S.append((t, p))

# ---------------- intro ----------------
add("hook", lines=["Get exposure to the names", "that aren't on the stock market yet."], hl=["yet."], beats=12)
add("logo", sub="Tokenised private-market instruments.", beats=12)
add("title", a="9 questions.", b="Straight from the Tessera FAQ.", beats=8)

# ---------------- access & permissions ----------------
add("section", text="Access & permissions.", n=1, beats=6)
add("qchat", q=SEC1[0], a=["The app is a non-custodial interface: it does not hold your assets, match trades or issue tokens, so there is no platform-side approval step and no accreditation requirement."], qn=1)
add("say", text="Fiat purchases are completed with a third-party payment provider, which verifies your identity under its own terms.", hl=["third-party", "payment", "provider,"], vis={"t": "flow", "nodes": ["You", "Payment provider", "Identity check"], "note": "UNDER THE PROVIDER'S OWN TERMS"})
add("say", text="The app is not available in excluded jurisdictions, including the United States and the United Kingdom.", hl=["not", "available"], vis={"t": "chips", "items": ["United States", "United Kingdom"], "label": "EXCLUDED JURISDICTIONS"})
add("qsearch", q=SEC1[1], qn=2)
add("say", text="Anyone outside the excluded jurisdictions with a supported Solana wallet can hold and transfer Tessera tokens.", hl=["hold", "transfer"], vis={"t": "wallet"})
add("say", text="Participation starts from one dollar.", hl=["one", "dollar."], vis={"t": "counter", "value": 1.00, "prefix": "$", "label": "MINIMUM PARTICIPATION"}, big=True)
add("qlist", sec="ACCESS & PERMISSIONS", items=SEC1, pick=2, qn=3)
add("say", text="Tessera currently supports major Solana-compatible wallets, including Phantom, Solflare and MetaMask (via Solana).", hl=["Phantom,", "Solflare", "MetaMask"], vis={"t": "pills", "items": ["Phantom", "Solflare", "MetaMask (via Solana)"]})
add("say", text="Users retain full control of their assets at all times.", hl=["full", "control"], vis={"t": "key"}, big=True)

# ---------------- trading & liquidity ----------------
add("section", text="Trading & liquidity.", n=2, beats=6)
add("qchat", q=SEC2[0], a=["New T-tokens are offered in presales through on-chain vaults on Solana."], qn=4)
add("say", text="Each vault shows its own rules: first come, first served up to a cap, or pro rata with deposits above the target returned.", hl=["first", "served", "pro", "rata"], vis={"t": "split", "a": ["FIRST COME,", "FIRST SERVED", "up to a cap"], "b": ["PRO RATA", "", "deposits above the target returned"]})
add("say", text="The presale price can rise tier by tier, and earlier tiers are cheaper.", hl=["earlier", "tiers", "cheaper."], vis={"t": "tiers"})
add("say", text="When the presale closes, tokens become claimable in proportion to deposits. The token may then list, at a price set by the market.", hl=["claimable", "market."], vis={"t": "flow", "nodes": ["Presale closes", "Tokens claimable", "Market sets price"], "note": "IN PROPORTION TO DEPOSITS"})
add("qsearch", q=SEC2[1], qn=5)
add("say", text="Once tokens are distributed, they can be transferred on-chain and traded on Solana on-chain markets. Trades settle on-chain.", hl=["settle", "on-chain."], vis={"t": "flow", "nodes": ["Distributed", "Transferred", "Traded", "Settled on-chain"], "note": "SOLANA ON-CHAIN MARKETS"})
add("say", text="The app does not act as broker, custodian or counterparty; it only provides an interface to those markets.", hl=["interface"], vis={"t": "xlist", "items": [["Broker", 0], ["Custodian", 0], ["Counterparty", 0], ["Interface to the markets", 1]]})
add("qlist", sec="TRADING & LIQUIDITY", items=SEC2, pick=2, qn=6)
add("say", text="Tokens are transferable on-chain at any hour and can be sold on Solana on-chain markets such as Jupiter and Meteora at whatever liquidity those markets have at the time.", hl=["any", "hour", "Jupiter", "Meteora"], vis={"t": "pills", "items": ["Jupiter", "Meteora"], "clock": True})
add("say", text="Liquidity varies and can be thin.", hl=["thin."], vis={"t": "meter"}, big=True)
add("say", text="Selling is a transfer, not a redemption: redemption happens only under the issuer's terms once a Redemption Start Date is announced.", hl=["transfer,", "not", "redemption:"], vis={"t": "split", "a": ["SELLING", "", "a transfer, on-chain"], "b": ["REDEMPTION", "", "issuer's terms, after a Redemption Start Date"]})

# ---------------- legal & security ----------------
add("section", text="Legal & security.", n=3, beats=6)
add("qchat", q=SEC3[0], a=["Each exposure is held within a legally structured, segregated portfolio."], qn=7)
add("say", text="Each portfolio is dedicated to a single company and is legally isolated, ensuring that risks and liabilities do not affect other assets or portfolios.", hl=["legally", "isolated,"], vis={"t": "isolate"})
add("qsearch", q=SEC3[1], qn=8)
add("say", text="No. Tessera is non-custodial.", hl=["non-custodial."], vis={"t": "key"}, big=True)
add("say", text="Users always maintain control of their wallets and tokens. Tessera does not custody user funds or private keys, and all interactions occur directly on-chain.", hl=["directly", "on-chain."], vis={"t": "xlist", "items": [["Custody of user funds", 0], ["Custody of private keys", 0], ["Your wallet, your tokens", 1]]})
add("qlist", sec="LEGAL & SECURITY", items=SEC3, pick=2, qn=9)
add("say", text="Chainlink Proof of Reserve publishes on-chain reserve data for each token, so anyone can verify that the tokens in circulation are backed by the assets held in the segregated portfolio without relying on the issuer's say-so.", hl=["anyone", "can", "verify"], vis={"t": "bars"})

# ---------------- outro ----------------
add("end", beats=16)
add("links", beats=12)
add("credits", beats=12)

# ---------------- timing ----------------
def words(s): return len(s.split())
def beats_for(sec): return max(4, math.ceil(sec / BEAT))
tl, t, events = [], 0.0, []
for typ, p in S:
    if "beats" in p: b = p["beats"]
    elif typ == "say": b = beats_for(PACE * (1.6 + words(p["text"]) * (0.42 if p.get("big") else 0.36) + 1.2))
    elif typ == "qsearch": b = beats_for(PACE * (1.0 + len(p["q"]) * 0.045 + 1.6))
    elif typ == "qlist": b = beats_for(PACE * 5.2)
    elif typ == "qchat": b = beats_for(PACE * (1.2 + len(p["q"]) * 0.04 + 1.6 + sum(words(a) for a in p["a"]) * 0.3 + 1.5))
    else: b = 8
    d = b * BEAT
    tl.append({"type": typ, "start": round(t, 4), "dur": round(d, 4), "p": p})
    # sound events
    if typ in ("qsearch", "qchat"): events.append({"t": t + 0.5, "n": "type", "dur": len(p["q"]) * 0.04 + 0.6})
    if typ == "qchat": events.append({"t": t + 1.2 + len(p["q"]) * 0.04 + 0.9, "n": "pop"})
    if typ == "qlist": events.append({"t": t + 2.2, "n": "click"})
    if typ in ("section", "logo", "end"): events.append({"t": t, "n": "impact"})
    if typ == "qsearch": events.append({"t": t + d - 0.45, "n": "whoosh"})
    t += d
os.makedirs(f"{R}/build/faq", exist_ok=True)
json.dump({"beat": BEAT, "duration": round(t, 3), "scenes": tl, "events": events}, open(f"{R}/build/faq/timeline.json", "w"), indent=1)
print(f"scenes {len(tl)}  duration {t:.1f}s ({int(t//60)}:{t%60:04.1f})")
