import React from "react";
import { useCurrentFrame } from "remotion";
import { CHAINS } from "../data";
import EV from "../events.json";
import { C, E, F, FPS, lerp, p, wt } from "../theme";
import { Label, Words } from "../ui";

// "Bitcoin, Ethereum, Base, Arbitrum, Polygon, and more. Zero added fees."
const T = (i: number) => wt("coverage", i);
const CW = 400, CH = 160, GAP = 20, GX = (1920 - (4 * CW + 3 * GAP)) / 2, GY = 330;
const OUT = EV.cuts[4] - 0.28;
// each spoken chain enters differently: from left, from right, zoom, from left, from right
const ENTER: ("left" | "right" | "zoom")[] = ["left", "right", "zoom", "left", "right"];

export const Coverage: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < EV.cuts[3] - 0.05 || t > EV.cuts[4] + 0.05) return null;
  const out = p(f, OUT, 0.28, E.exit);
  const more = EV.chainWords[5];
  const gridIn = p(f, more - 0.08, 0.5, E.snap);
  const gridOut = p(f, EV.zero - 0.4, 0.34, E.exit);

  // Beat 1 — text only: one huge chain name at a time
  const names = ["Bitcoin", "Ethereum", "Base", "Arbitrum", "Polygon"];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      {names.map((n, i) => {
        const t0 = EV.chainWords[i] - 0.06;
        const t1 = (i < 4 ? EV.chainWords[i + 1] : more) - 0.08;
        if (t < t0 - 0.05 || t > t1 + 0.25) return null;
        const k = p(f, t0, 0.32, E.snap);
        const x = p(f, t1, 0.2, E.exit);
        const dir = ENTER[i];
        const tr =
          dir === "zoom"
            ? `scale(${lerp(1.6, 1, k) * lerp(1, 0.85, x)})`
            : `translateX(${(dir === "left" ? -1 : 1) * (1 - k) * 260 + (dir === "left" ? 1 : -1) * x * 200}px)`;
        return (
          <div
            key={n}
            style={{
              position: "absolute",
              left: 0,
              width: 1920,
              top: 380,
              textAlign: "center",
              fontFamily: F.sans,
              fontVariationSettings: "'opsz' 32",
              fontWeight: 600,
              fontSize: 230,
              letterSpacing: "-0.055em",
              lineHeight: 1,
              color: C.white,
              opacity: Math.min(1, k * 1.5) * (1 - x),
              transform: tr,
            }}
          >
            {n}
            <span style={{ color: C.orange }}>,</span>
          </div>
        );
      })}

      {/* Beat 2 — "and more": the 8 supported chains snap into a grid */}
      <div style={{ position: "absolute", inset: 0, opacity: gridIn * (1 - gridOut), transform: `scale(${lerp(1.08, 1, gridIn) * lerp(1, 0.94, gridOut)})`, transformOrigin: "50% 45%" }}>
        {CHAINS.map((c, i) => {
          const col = i % 4, row = Math.floor(i / 4);
          const k = p(f, more - 0.08 + i * 0.04, 0.4, E.snap);
          const spoken = i < 5;
          return (
            <div
              key={c}
              style={{
                position: "absolute",
                left: GX + col * (CW + GAP),
                top: GY + row * (CH + GAP),
                width: CW,
                height: CH,
                border: `1px solid ${spoken ? "rgba(255,255,255,0.22)" : C.lineSoft}`,
                borderRadius: 14,
                overflow: "hidden",
                opacity: k,
                transform: `translateY(${(1 - k) * 18}px)`,
              }}
            >
              <div style={{ position: "absolute", left: 0, top: 0, height: 3, width: "100%", background: spoken ? C.orange : "rgba(255,255,255,0.3)" }} />
              <div style={{ position: "absolute", left: 22, top: 18, fontFamily: F.mono, fontSize: 16, letterSpacing: "0.2em", color: C.dim }}>{String(i + 1).padStart(2, "0")}</div>
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  bottom: 16,
                  fontFamily: F.sans,
                  fontVariationSettings: "'opsz' 32",
                  fontWeight: 600,
                  fontSize: 50,
                  letterSpacing: "-0.04em",
                  color: spoken ? C.white : C.mute,
                }}
              >
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </div>
            </div>
          );
        })}
        <Words
          words={[{ w: "and ", t: more }, { w: "more", t: more + 0.08 }, { w: ".", t: more + 0.2, color: C.orange }]}
          size={64}
          mode="right"
          align="right"
          style={{ position: "absolute", right: GX, top: GY + 2 * CH + GAP + 40 }}
        />
        <Label size={15} style={{ position: "absolute", left: GX, top: GY + 2 * CH + GAP + 64 }}>
          Supported chains · rift.trade/docs
        </Label>
      </div>

      {/* Beat 3 — text only: zero added fees, zooming out */}
      <ZeroFees />
    </div>
  );
};

const ZeroFees: React.FC = () => {
  const f = useCurrentFrame();
  const zk = p(f, T(7) - 0.04, 0.5, E.snap);
  const drift = lerp(1.12, 1, p(f, T(7), 1.6, E.settle));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: zk, transform: `scale(${drift})`, transformOrigin: "50% 50%" }}>
      <div style={{ position: "absolute", left: 0, width: 1920, top: 210, display: "flex", justifyContent: "center", alignItems: "baseline" }}>
        <span
          style={{
            fontFamily: F.sans,
            fontVariationSettings: "'opsz' 32",
            fontWeight: 600,
            fontSize: 400,
            letterSpacing: "-0.06em",
            lineHeight: 1,
            color: C.white,
            display: "inline-block",
            transform: `scale(${lerp(1.5, 1, zk)})`,
          }}
        >
          0
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 110, color: C.orangeHi, marginLeft: 28, opacity: p(f, T(7) + 0.1, 0.3) }}>bps</span>
      </div>
      <Words
        words={[{ w: "added ", t: T(8) }, { w: "fees", t: T(9) }, { w: ".", t: T(9) + 0.14, color: C.orange }]}
        size={112}
        mode="left"
        align="center"
        style={{ position: "absolute", left: 0, width: 1920, top: 650 }}
      />
    </div>
  );
};
