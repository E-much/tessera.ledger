import React from "react";
import { useCurrentFrame } from "remotion";
import { PATHS_PRICED, QUOTE, SINGLE_HOP, fmt } from "../data";
import { BEAT, C, E, F, lerp, p, wt } from "../theme";
import { Blocks, Label, Scramble, Words } from "../ui";

// "Every route has a different price. And you never really know if you got the best one."
const T = (i: number) => wt("problem", i);
const OUT = 10.22;
const ROWS = SINGLE_HOP.filter((r) => r.out !== null);
const max = Math.max(...ROWS.map((r) => r.out!));
const min = Math.min(...ROWS.map((r) => r.out!));
const TX = 1010; // table x
const TY = 300;
const RH = 112;

export const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / 60;
  const out = p(f, OUT, 0.3, E.exit);
  const dimFirst = p(f, T(6) - 0.05, 0.4, E.settle);

  const w1 = [
    { w: "Every ", t: T(0) },
    { w: "route ", t: T(1) },
    { w: "has ", t: T(2) },
    { w: "\n", t: 0 },
    { w: "a ", t: T(3) },
    { w: "different ", t: T(4) },
    { w: "price.", t: T(5) },
  ];
  const w2 = [
    { w: "And ", t: T(6) },
    { w: "you ", t: T(7) },
    { w: "never ", t: T(8) },
    { w: "really ", t: T(9) },
    { w: "\n", t: 0 },
    { w: "know ", t: T(10) },
    { w: "if ", t: T(11) },
    { w: "you ", t: T(12) },
    { w: "got ", t: T(13) },
    { w: "\n", t: 0 },
    { w: "the ", t: T(14) },
    { w: "best ", t: T(15), color: C.orangeHi },
    { w: "one", t: T(16) },
    { w: ".", t: T(16) + 0.14, color: C.orange },
  ];

  // The selection bracket hunts between rows on the beat and never lands.
  const hunt = [T(6) + 0.04, T(6) + BEAT, T(6) + 2 * BEAT, T(6) + 3 * BEAT, T(6) + 4 * BEAT];
  const order = [0, 2, 1, 0, 2];
  let hi = -1;
  hunt.forEach((h, i) => {
    if (t >= h) hi = i;
  });
  const prevRow = hi > 0 ? order[hi - 1] : order[0];
  const curRow = hi >= 0 ? order[hi] : 0;
  const mv = hi >= 0 ? p(f, hunt[hi], 0.28, E.snap) : 0;
  const bracketY = lerp(TY + 60 + prevRow * RH, TY + 60 + curRow * RH, hi > 0 ? mv : 1);
  const bracketOn = hi >= 0 ? p(f, hunt[0], 0.2) : 0;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${-out * 30}px)` }}>
      <div style={{ position: "absolute", left: 114, top: 296, opacity: 1 - 0.62 * dimFirst }}>
        <Words words={w1} size={84} />
      </div>
      <Words words={w2} size={84} style={{ position: "absolute", left: 114, top: 520 }} />

      {/* live single-hop quotes for the same order */}
      <div style={{ position: "absolute", left: TX, top: TY - 54, width: 790 }}>
        <div style={{ display: "flex", justifyContent: "space-between", opacity: p(f, T(1), 0.4) }}>
          <Label size={16}>Quote · {QUOTE.amountIn} BTC → ethereum.usdt</Label>
          <Label size={16}>USDT out</Label>
        </div>
      </div>
      {ROWS.map((r, i) => {
        const k = p(f, T(1) + 0.12 + i * 0.16, 0.5, E.snap);
        const filled = 3 + ((r.out! - min) / (max - min)) * 7;
        return (
          <div
            key={r.venue}
            style={{
              position: "absolute",
              left: TX,
              top: TY + i * RH,
              width: 790,
              height: RH,
              borderTop: `1px solid ${C.line}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: k,
              transform: `translateX(${(1 - k) * 40}px)`,
            }}
          >
            <div style={{ fontFamily: F.mono, fontSize: 26, color: C.ink, letterSpacing: "0.06em" }}>{r.venue}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <Blocks n={10} filled={k * filled} size={18} color="rgba(255,255,255,0.55)" />
              <div style={{ fontFamily: F.mono, fontSize: 34, color: C.white, width: 230, textAlign: "right" }}>
                <Scramble text={fmt(r.out!)} settle={T(5) + 0.2 + i * 0.12} seed={r.venue} />
              </div>
            </div>
          </div>
        );
      })}
      <div style={{ position: "absolute", left: TX, top: TY + 3 * RH, width: 790, borderTop: `1px solid ${C.line}`, opacity: p(f, T(1) + 0.6, 0.4) }} />
      <Label size={16} style={{ position: "absolute", left: TX, top: TY + 3 * RH + 26, opacity: p(f, T(5), 0.4) }}>
        + {PATHS_PRICED} multi-hop paths
      </Label>
      <Label size={13} color={C.dim} style={{ position: "absolute", left: TX, top: TY + 3 * RH + 66, letterSpacing: "0.18em", opacity: p(f, T(5), 0.4) }}>
        Live quotes · api.rift.trade · {QUOTE.date} · indicative
      </Label>

      {/* the bracket that can't decide */}
      <div
        style={{
          position: "absolute",
          left: TX - 22,
          top: bracketY - 46,
          width: 834,
          height: 92,
          border: `2px solid ${C.orange}`,
          borderRadius: 12,
          opacity: bracketOn * (1 - p(f, T(16) + 0.25, 0.3, E.exit)),
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 852,
            top: 34,
            fontFamily: F.mono,
            fontSize: 16,
            letterSpacing: "0.24em",
            color: C.orangeHi,
          }}
        >
          BEST?
        </div>
      </div>
    </div>
  );
};
