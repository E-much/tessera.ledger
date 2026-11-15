import React from "react";
import { useCurrentFrame } from "remotion";
import EV from "../events.json";
import { C, E, F, FPS, p, wt } from "../theme";
import { Blocks, Label, Words } from "../ui";

// "Ten bitcoin into USDT on Ethereum? Right now, that's four steps across three chains."
const T = (i: number) => wt("hook", i);
const OUT = EV.cuts[0] - 0.28;

// The real best route for this order (live quote, see data.ts) — venues are revealed later in the graph.
const LEGS: [string, string, string, string][] = [
  ["bitcoin", ".btc", "hyperliquid", ".btc"],
  ["hyperliquid", ".btc", "hyperliquid", ".usdc"],
  ["hyperliquid", ".usdc", "ethereum", ".usdc"],
  ["ethereum", ".usdc", "ethereum", ".usdt"],
];
const CHAIN_ORDER = ["bitcoin", "hyperliquid", "ethereum"];
const LX = 120, LY = 214, RH = 62, LW = 1680;

const Asset: React.FC<{ chain: string; tok: string; f: number }> = ({ chain, tok, f }) => {
  const lit = p(f, EV.chainsLit + CHAIN_ORDER.indexOf(chain) * 0.1, 0.3, E.snap);
  return (
    <span>
      <span style={{ color: lit > 0.5 ? C.orangeHi : C.ink }}>{chain}</span>
      <span style={{ color: C.mute }}>{tok}</span>
    </span>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const out = p(f, OUT, 0.28, E.exit);
  const dimFirst = p(f, T(6) - 0.05, 0.4, E.settle);
  const legsDone = EV.legs.filter((t) => f / FPS >= t).length;

  const w1 = [
    { w: "Ten ", t: T(0) },
    { w: "bitcoin ", t: T(1) },
    { w: "into ", t: T(2) },
    { w: "USDT ", t: T(3) },
    { w: "on ", t: T(4) },
    { w: "Ethereum?", t: T(5) },
  ];
  const w2 = [
    { w: "Right ", t: T(6) },
    { w: "now, ", t: T(7) },
    { w: "that’s ", t: T(8) },
    { w: "four ", t: T(9), color: C.orangeHi },
    { w: "steps", t: T(10) },
    { w: "\n", t: 0 },
    { w: "across ", t: T(11) },
    { w: "three ", t: T(12), color: C.orangeHi },
    { w: "chains", t: T(13) },
    { w: ".", t: T(13) + 0.16, color: C.orange },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${-out * 30}px)` }}>
      {/* the route, as plain legs */}
      <div style={{ position: "absolute", left: LX, top: LY - 50, width: LW, display: "flex", justifyContent: "space-between", opacity: p(f, EV.legs[0] - 0.15, 0.4) }}>
        <Label size={16}>Best route · 10 BTC → ethereum.usdt · live quote</Label>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Blocks n={4} filled={legsDone} size={18} />
          <Label size={16} color={legsDone === 4 ? C.orangeHi : C.mute}>
            {legsDone} steps{f / FPS >= EV.chainsLit ? " · 3 chains" : ""}
          </Label>
        </div>
      </div>
      {LEGS.map((l, i) => {
        const k = p(f, EV.legs[i], 0.45, E.snap);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: LX,
              top: LY + i * RH,
              width: LW,
              height: RH,
              borderTop: `1px solid ${C.line}`,
              display: "flex",
              alignItems: "center",
              gap: 28,
              fontFamily: F.mono,
              fontSize: 26,
              opacity: k,
              transform: `translateX(${(1 - k) * 40}px)`,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: C.dim, width: 40 }}>0{i + 1}</span>
            <Asset chain={l[0]} tok={l[1]} f={f} />
            <span style={{ color: C.dim }}>→</span>
            <Asset chain={l[2]} tok={l[3]} f={f} />
          </div>
        );
      })}
      <div style={{ position: "absolute", left: LX, top: LY + 4 * RH, width: LW * p(f, EV.legs[3], 0.5, E.settle), borderTop: `1px solid ${C.line}` }} />

      <div style={{ position: "absolute", left: 114, top: 560, opacity: 1 - 0.62 * dimFirst }}>
        <Words words={w1} size={92} />
      </div>
      <Words words={w2} size={92} style={{ position: "absolute", left: 114, top: 668 }} />
    </div>
  );
};
