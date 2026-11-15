import React from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import EV from "../events.json";
import { C, E, F, FPS, lerp, p, wt } from "../theme";
import { Label, Words } from "../ui";

// "Rift. Best price execution, in one click."  → creator end card
const T = (i: number) => wt("close", i);
export const HANDLE = "@emuch4pf";

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < EV.cuts[4] - 0.05) return null;
  const rk = p(f, EV.closeLogo - 0.05, 0.6, E.snap);
  const headOut = p(f, EV.endCard - 0.3, 0.35, E.exit);
  const end = p(f, EV.endCard, 0.7, E.snap);
  const credit = p(f, EV.credit, 0.6, E.snap);
  const fade = p(f, EV.end - 0.45, 0.45, E.inOut);

  const line = [
    { w: "Best ", t: T(1), color: C.orangeHi },
    { w: "price ", t: T(2), color: C.orangeHi },
    { w: "execution", t: T(3) },
    { w: "\n", t: 0 },
    { w: "in ", t: T(4) },
    { w: "one ", t: T(5) },
    { w: "click", t: T(6) },
    { w: ".", t: T(6) + 0.14, color: C.orange },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      {/* text only: "Rift." punches in, then the line slides in from the right */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - headOut, transform: `scale(${lerp(1, 0.92, headOut)})` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            width: 1920,
            top: 250,
            textAlign: "center",
            fontFamily: F.sans,
            fontVariationSettings: "'opsz' 32",
            fontWeight: 600,
            fontSize: 220,
            letterSpacing: "-0.055em",
            lineHeight: 1,
            color: C.white,
            opacity: Math.min(1, rk * 1.5),
            transform: `scale(${lerp(1.7, 1, rk)})`,
          }}
        >
          Rift<span style={{ color: C.orange }}>.</span>
        </div>
        <Words words={line} size={96} mode="right" align="center" style={{ position: "absolute", left: 0, width: 1920, top: 560 }} />
      </div>

      {/* end card: creator only */}
      <div style={{ position: "absolute", left: 0, width: 1920, top: 330, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Img
          src={staticFile("pfp.jpg")}
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            border: `1px solid ${C.line}`,
            opacity: end,
            transform: `scale(${lerp(0.85, 1, end)})`,
          }}
        />
        <div
          style={{
            fontFamily: F.sans,
            fontVariationSettings: "'opsz' 32",
            fontWeight: 600,
            fontSize: 64,
            letterSpacing: "-0.03em",
            color: C.white,
            marginTop: 34,
            opacity: credit,
            transform: `translateY(${(1 - credit) * 16}px)`,
          }}
        >
          {HANDLE}
        </div>
        <Label size={20} color={C.mute} style={{ marginTop: 18, opacity: p(f, EV.credit + 0.2, 0.5), letterSpacing: "0.3em" }}>
          <span style={{ color: C.orange }}>///</span> Weekly Spotlight
        </Label>
      </div>
    </div>
  );
};
