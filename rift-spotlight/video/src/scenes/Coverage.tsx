import React from "react";
import { useCurrentFrame } from "remotion";
import { CHAINS } from "../data";
import EV from "../events.json";
import { C, E, F, FPS, lerp, p, wt } from "../theme";
import { Blocks, Label, Words } from "../ui";
import { LEGEND_X, LEGEND_Y } from "./Graph";

// "Bitcoin, Ethereum, Base, Arbitrum, Polygon, and more. Zero added fees."
const T = (i: number) => wt("coverage", i);
const CW = 400, CH = 180, GAP = 20, GX = 120 + (1680 - (4 * CW + 3 * GAP)) / 2, GY = 300;
const spokenAt = (i: number) => (i < 5 ? EV.chainWords[i] : EV.chainWords[5]);
const OUT = EV.cuts[4] - 0.28;

export const Coverage: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < EV.cuts[3] - 0.05 || t > EV.cuts[4] + 0.05) return null;
  // match cut: legend chips grow into the grid
  const grow = p(f, EV.cuts[3], 0.6, E.inOut);
  const gridOut = p(f, EV.zero - 0.42, 0.36, E.exit);
  const out = p(f, OUT, 0.28, E.exit);

  const zeroWords = [
    { w: "added ", t: T(8) },
    { w: "fees", t: T(9) },
    { w: ".", t: T(9) + 0.14, color: C.orange },
  ];
  const zk = p(f, T(7) - 0.04, 0.5, E.snap);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - gridOut, transform: `translateY(${-gridOut * 40}px)` }}>
        {CHAINS.map((c, i) => {
          const col = i % 4, row = Math.floor(i / 4);
          const x1 = GX + col * (CW + GAP), y1 = GY + row * (CH + GAP);
          const x0 = LEGEND_X(i) - 75, y0 = LEGEND_Y - 17;
          const x = lerp(x0, x1, grow), y = lerp(y0, y1, grow);
          const w = lerp(150, CW, grow), h = lerp(34, CH, grow);
          const lit = p(f, spokenAt(i) - 0.04, 0.35, E.snap);
          const spoken = i < 5;
          return (
            <div
              key={c}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: w,
                height: h,
                border: `1px solid ${lit > 0.5 ? "rgba(255,255,255,0.22)" : C.lineSoft}`,
                borderRadius: lerp(6, 14, grow),
                overflow: "hidden",
                background: lit > 0.5 && spoken ? "rgba(255,255,255,0.03)" : "transparent",
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, height: 3, width: `${lit * 100}%`, background: spoken ? C.orange : "rgba(255,255,255,0.3)" }} />
              <div style={{ position: "absolute", left: 22, top: 20, fontFamily: F.mono, fontSize: 16, letterSpacing: "0.2em", color: C.dim, opacity: grow }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  bottom: 18,
                  fontFamily: F.sans,
                  fontVariationSettings: "'opsz' 32",
                  fontWeight: 600,
                  fontSize: 52,
                  letterSpacing: "-0.04em",
                  color: lit > 0.5 ? (spoken ? C.white : C.mute) : "rgba(255,255,255,0.16)",
                  opacity: grow,
                  transform: `translateY(${(1 - lit) * 8}px)`,
                }}
              >
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </div>
            </div>
          );
        })}
        <div style={{ position: "absolute", left: GX, top: GY + 2 * CH + GAP + 44 }}>
          <Words words={[{ w: "and ", t: T(5) }, { w: "more.", t: T(5) + 0.08 }]} size={56} color={C.mute} />
        </div>
        <Label size={15} style={{ position: "absolute", right: GX, top: GY + 2 * CH + GAP + 64, opacity: grow }}>
          Supported chains · rift.trade/docs
        </Label>
      </div>

      {/* Zero added fees — the site's own "0bps" */}
      <div style={{ position: "absolute", left: 114, top: 250 }}>
        <div style={{ display: "flex", alignItems: "baseline", overflow: "hidden", height: 330 }}>
          <span
            style={{
              fontFamily: F.sans,
              fontVariationSettings: "'opsz' 32",
              fontWeight: 600,
              fontSize: 380,
              letterSpacing: "-0.06em",
              lineHeight: 0.86,
              color: C.white,
              transform: `translateY(${(1 - zk) * 100}%)`,
              display: "inline-block",
            }}
          >
            0
          </span>
          <span
            style={{
              fontFamily: F.mono,
              fontSize: 96,
              color: C.orangeHi,
              marginLeft: 24,
              transform: `translateY(${(1 - p(f, T(7) + 0.08, 0.5, E.snap)) * 140}%)`,
              display: "inline-block",
            }}
          >
            bps
          </span>
        </div>
        <Words words={zeroWords} size={112} style={{ marginTop: 18 }} />
      </div>
      <div style={{ position: "absolute", left: 1060, top: 560, opacity: p(f, T(8), 0.4) }}>
        <Label size={16}>Added fee</Label>
        <Blocks n={14} filled={0} size={34} style={{ display: "block", marginTop: 16 }} empty="rgba(255,255,255,0.22)" />
        <Label size={16} style={{ marginTop: 18 }}>
          0 bps · <span style={{ color: C.orangeHi }}>ever</span> — per rift.trade
        </Label>
      </div>
    </div>
  );
};
