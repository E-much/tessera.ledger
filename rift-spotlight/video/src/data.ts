// Real quote pulled from the public Rift API (POST https://api.rift.trade/quote, include_candidates)
// on 15 Nov 2026 for 10 bitcoin.btc -> ethereum.usdt. Raw JSON: research/quotes/bitcoin.btc_ethereum.usdt_10.json
// Quotes are indicative (per Rift docs).

export const QUOTE = {
  amountIn: "10",
  from: "bitcoin.btc",
  to: "ethereum.usdt",
  out: 645331.161586, // estimated_amount_out (winning multi-hop route)
  date: "15 NOV 2026",
};

// Winning route (route[] in the response) — same shape as the docs' own example.
export const ROUTE = [
  { venue: "UNIT", from: "bitcoin.btc", to: "hyperliquid.btc", out: "9.99997056 BTC" },
  { venue: "HYPERLIQUID", from: "hyperliquid.btc", to: "hyperliquid.usdc", out: "645,117.80 USDC" },
  { venue: "CCTP", from: "hyperliquid.usdc", to: "ethereum.usdc", out: "645,116.60 USDC" },
  { venue: "COW SWAP", from: "ethereum.usdc", to: "ethereum.usdt", out: "645,331.26 USDT" },
];

// Single-hop candidates for the same order (quote_candidates.single_hop)
export const SINGLE_HOP = [
  { venue: "NEAR INTENTS", out: 644165.886046 },
  { venue: "RELAY", out: 639798.207763 },
  { venue: "LI.FI", out: 639767.845202 },
  { venue: "CHAINFLIP", out: null }, // status: failed (no quote)
];

// Final leg ethereum.usdc -> ethereum.usdt, every venue attempt on the winning path (round 3)
export const LAST_LEG = [
  { venue: "COW SWAP", out: 645331.256355 },
  { venue: "VELORA", out: 645328.305325 },
  { venue: "UNISWAP", out: 645326.362688 },
  { venue: "NORDSTERN", out: 645323.316026 },
  { venue: "METRIC", out: 645320.454441 },
  { venue: "KYBERSWAP", out: null }, // status: failed
];

// Alternative bridge legs via other chains (multi_hop.rank.routes estimated_amount_out)
export const VIA = [
  { chain: "POLYGON", out: 645282.162536, venues: "CCTP" },
  { chain: "INK", out: 645218.66369, venues: "ACROSS · CCTP" },
  { chain: "BASE", out: 645218.657583, venues: "ACROSS · CCTP · MAYAN" },
  { chain: "ARBITRUM", out: 645218.650657, venues: "ACROSS · CCTP · MAYAN" },
];

export const PATHS_PRICED = 157; // multi_hop.paths

// From rift.trade/docs "Supported chains and assets"
export const CHAINS = ["BITCOIN", "ETHEREUM", "BASE", "ARBITRUM", "POLYGON", "HYPERLIQUID", "INK", "ROBINHOOD"];

export const fmt = (n: number, d = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
