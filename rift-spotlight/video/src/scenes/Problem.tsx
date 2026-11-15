import React from "react";
import { useCurrentFrame } from "remotion";
import EV from "../events.json";
import { PATHS_PRICED, QUOTE, SINGLE_HOP, fmt } from "../data";
import { C, E, F, p, wt } from "../theme";
import { Blocks, Label, Scramble, Words } from "../ui";

// "Every route has a different price. And you never really know if you got the best one."
const T = (i: number) => wt("problem", i);
const OUT = EV.cuts[1] - 0.28;
const ROWS = SINGLE_HOP.filter((r) => r.out !== null);
const max = Math.max(...ROWS.map((r) => r.out!));
const min = Math.min(...ROWS.map((r) => r.out!));
const TX = 880; // table x
const TY = 300;
const RH = 112;
const T_APART = 17; // word index of "apart." (ElevenLabs tokenises on spaces)

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
  // "On ten bitcoin today, the quotes were over four thousand dollars apart."
  const w2 = [
    { w: "On ", t: T(6) },
    { w: "ten ", t: T(7) },
    { w: "bitcoin ", t: T(8) },
    { w: "today,", t: T(9) },
    { w: "\n", t: 0 },
    { w: "the ", t: T(10) },
    { w: "quotes ", t: T(11) },
    { w: "were ", t: T(12) },
    { w: "over", t: T(13) },
    { w: "\n", t: 0 },
    { w: "$4,000 ", t: T(14), color: C.orangeHi },
    { w: "apart", t: T(T_APART) },
    { w: ".", t: T(T_APART) + 0.14, color: C.orange },
  ];

  // measured gap between the highest and lowest quote, drawn on "four thousand"
  const gap = p(f, EV.gap, 0.55, E.snap);
  const gapVal = max - min;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${-out * 30}px)` }}>
      <div style={{ position: "absolute", left: 114, top: 296, opacity: 1 - 0.62 * dimFirst }}>
        <Words words={w1} size={84} />
      </div>
      <Words words={w2} size={84} style={{ position: "absolute", left: 114, top: 520 }} />

      {/* live single-hop quotes for the same order */}
      <div style={{ position: "absolute", left: TX, top: TY - 54, width: 720 }}>
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
              width: 720,
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
      <div style={{ position: "absolute", left: TX, top: TY + 3 * RH, width: 720, borderTop: `1px solid ${C.line}`, opacity: p(f, T(1) + 0.6, 0.4) }} />
      <Label size={16} style={{ position: "absolute", left: TX, top: TY + 3 * RH + 26, opacity: p(f, T(5), 0.4) }}>
        + {PATHS_PRICED} multi-hop paths
      </Label>
      <Label size={13} color={C.dim} style={{ position: "absolute", left: TX, top: TY + 3 * RH + 66, letterSpacing: "0.18em", opacity: p(f, T(5), 0.4) }}>
        Live quotes · api.rift.trade · {QUOTE.date} · indicative
      </Label>

      {/* the spread between best and worst quote */}
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: gap }}>
        <path
          d={`M${TX + 736} ${TY + RH / 2} H${TX + 756} V${TY + RH / 2 + 2 * RH * gap} H${TX + 736}`}
          fill="none"
          stroke={C.orange}
          strokeWidth={2}
        />
      </svg>
      <div style={{ position: "absolute", left: TX + 776, top: TY + RH * 1.5 - 30, opacity: gap, transform: `translateX(${(1 - gap) * 16}px)` }}>
        <div style={{ fontFamily: F.mono, fontSize: 30, color: C.orangeHi }}>Δ {fmt(gapVal)}</div>
        <Label size={14} style={{ marginTop: 6 }}>USDT apart</Label>
      </div>
    </div>
  );
};
