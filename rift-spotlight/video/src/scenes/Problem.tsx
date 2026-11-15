import React from "react";
import { useCurrentFrame } from "remotion";
import EV from "../events.json";
import { PATHS_PRICED, QUOTE, SINGLE_HOP, fmt } from "../data";
import { C, E, F, p, wt } from "../theme";
import { Blocks, Key, Label, Scramble } from "../ui";

// "Every route has a different price. On ten bitcoin today, the quotes were over four thousand dollars apart."
const T = (i: number) => wt("problem", i);
const OUT = EV.cuts[1] - 0.28;
const ROWS = SINGLE_HOP.filter((r) => r.out !== null);
const max = Math.max(...ROWS.map((r) => r.out!));
const min = Math.min(...ROWS.map((r) => r.out!));
const TX = 120; // table now sits on the left
const TW = 760;
const TY = 330;
const RH = 112;
const T_APART = 17; // word index of "apart." (ElevenLabs tokenises on spaces)

export const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const out = p(f, OUT, 0.3, E.exit);
  const beat2 = T(6) - 0.15; // table arrives on "On ten bitcoin today"

  const tab = p(f, beat2 + 0.05, 0.6, E.snap);
  const gap = p(f, EV.gap, 0.55, E.snap);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateX(${-out * 60}px)` }}>
      {/* keywords only */}
      <Key text="Different price" t0={T(4) - 0.1} t1={beat2} y={450} size={180} mode="zoom" />
      <Key
        text={<span>$4,000<br /><span style={{ color: C.orangeHi }}>apart</span></span>}
        t0={T(14)}
        t1={OUT + 0.3}
        x={1000}
        w={800}
        y={380}
        align="right"
        size={150}
        mode="right"
      />

      {/* live single-hop quotes for the same order */}
      <div style={{ position: "absolute", inset: 0, opacity: tab, transform: `translateX(${(1 - tab) * -140}px)` }}>
        <div style={{ position: "absolute", left: TX, top: TY - 54, width: TW, display: "flex", justifyContent: "space-between" }}>
          <Label size={16}>Quote · {QUOTE.amountIn} BTC → ethereum.usdt</Label>
          <Label size={16}>USDT out</Label>
        </div>
        {ROWS.map((r, i) => {
          const k = p(f, EV.rows[i], 0.5, E.snap);
          const filled = 3 + ((r.out! - min) / (max - min)) * 7;
          return (
            <div
              key={r.venue}
              style={{
                position: "absolute",
                left: TX,
                top: TY + i * RH,
                width: TW,
                height: RH,
                borderTop: `1px solid ${C.line}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: k,
              }}
            >
              <div style={{ fontFamily: F.mono, fontSize: 26, color: C.ink, letterSpacing: "0.06em" }}>{r.venue}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                <Blocks n={10} filled={k * filled} size={18} color="rgba(255,255,255,0.55)" />
                <div style={{ fontFamily: F.mono, fontSize: 34, color: C.white, width: 230, textAlign: "right" }}>
                  <Scramble text={fmt(r.out!)} settle={EV.rowSettle[i]} seed={r.venue} />
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: TX, top: TY + 3 * RH, width: TW, borderTop: `1px solid ${C.line}` }} />
        <Label size={16} style={{ position: "absolute", left: TX, top: TY + 3 * RH + 26 }}>
          + {PATHS_PRICED} multi-hop paths
        </Label>

        {/* spread between best and worst quote */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity: gap }}>
          <path d={`M${TX + TW + 16} ${TY + RH / 2} H${TX + TW + 36} V${TY + RH / 2 + 2 * RH * gap} H${TX + TW + 16}`} fill="none" stroke={C.orange} strokeWidth={2} />
        </svg>
        <div style={{ position: "absolute", left: TX + TW + 56, top: TY + RH * 1.5 - 30, opacity: gap, transform: `translateX(${(1 - gap) * 16}px)` }}>
          <div style={{ fontFamily: F.mono, fontSize: 30, color: C.orangeHi }}>Δ {fmt(max - min)}</div>
          <Label size={14} style={{ marginTop: 6 }}>
            USDT apart
          </Label>
        </div>
      </div>
    </div>
  );
};
