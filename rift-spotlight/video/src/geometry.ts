// Shared coordinates: the RIFT result row in the swap UI (W) and the routing graph (G).
// The row's route *becomes* the graph's main line — that's the match cut.

export const W_Y = 629; // centre line of the RIFT row in the widget
export const G_Y = 560; // main line of the graph

export const STATIONS = [
  { ticker: "BTC", chain: "BITCOIN", wx: 400, gx: 400 },
  { ticker: "BTC", chain: "HYPERLIQUID", wx: 640, gx: 640 },
  { ticker: "USDC", chain: "HYPERLIQUID", wx: 880, gx: 880 },
  { ticker: "USDC", chain: "ETHEREUM", wx: 1120, gx: 1240 },
  { ticker: "USDT", chain: "ETHEREUM", wx: 1360, gx: 1600 },
];

export const FAN_X = 1420; // venue pills on the last leg
export const BRIDGE_X = 1060;

// Last leg venues (top→bottom). Offsets from the main line.
export const FAN = [
  { venue: "METRIC", dy: -175 },
  { venue: "UNISWAP", dy: -105 },
  { venue: "COW SWAP", dy: -35 },
  { venue: "VELORA", dy: 35 },
  { venue: "NORDSTERN", dy: 105 },
  { venue: "KYBERSWAP", dy: 175 },
];

export const BRIDGES = [
  { chain: "POLYGON", y: 380 },
  { chain: "INK", y: 455 },
  { chain: "BASE", y: 665 },
  { chain: "ARBITRUM", y: 740 },
];

export const RAILS = [
  { venue: "NEAR INTENTS", y: 812, px: 640 },
  { venue: "RELAY", y: 846, px: 900 },
  { venue: "LI.FI", y: 880, px: 1160 },
  { venue: "CHAINFLIP", y: 914, px: 1400 },
];

export const fanPath = (dy: number) => {
  const a = STATIONS[3].gx, b = STATIONS[4].gx, y = G_Y + dy;
  return [
    [a, G_Y],
    [FAN_X - 110, y],
    [FAN_X + 110, y],
    [b, G_Y],
  ] as [number, number][];
};

export const bridgePath = (y: number) => {
  const dy = Math.abs(y - G_Y);
  const a = STATIONS[2].gx, b = STATIONS[3].gx;
  return [
    [a, G_Y],
    [BRIDGE_X - dy, G_Y],
    [BRIDGE_X, y],
    [BRIDGE_X + dy, G_Y],
    [b, G_Y],
  ] as [number, number][];
};

// Single-hop venues bypass the engine route: input port (frame left, y+60) → output port.
export const PORT_Y = G_Y + 60;
export const railPath = (y: number, i: number) => {
  const a = 296 + i * 9, b = 1624 - i * 9;
  return [
    [204, G_Y],
    [240, PORT_Y],
    [a, PORT_Y],
    [a, y - 22],
    [a + 22, y],
    [b - 22, y],
    [b, y - 22],
    [b, PORT_Y],
    [1680, PORT_Y],
    [1716, G_Y],
  ] as [number, number][];
};

export const toD = (pts: [number, number][]) => pts.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");

export const polyLen = (pts: [number, number][]) =>
  pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);

export const pointAt = (pts: [number, number][], t: number): [number, number] => {
  const L = polyLen(pts) * Math.min(1, Math.max(0, t));
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= L) {
      const k = seg ? (L - acc) / seg : 0;
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    }
    acc += seg;
  }
  return pts[pts.length - 1];
};
