import React from "react";
import { useCurrentFrame } from "remotion";
import EV from "../events.json";
import { C, E, F, FPS, lerp, p, wt } from "../theme";
import { Label, Logo, Words } from "../ui";

// "Rift. Best price execution, in one click."  → end card
const T = (i: number) => wt("close", i);
export const HANDLE = "@MYHANDLE";

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < EV.cuts[4] - 0.05) return null;
  const k = p(f, EV.closeLogo - 0.05, 0.6, E.snap);
  const end = p(f, EV.endCard, 0.8, E.inOut);
  const headOut = p(f, EV.endCard - 0.2, 0.35, E.exit);
  const credit = p(f, EV.credit, 0.6, E.snap);
  const fade = p(f, EV.end - 0.45, 0.45, E.inOut);

  const size = lerp(200, 168, end);
  const y = lerp(300, 330, end);
  const words = [
    { w: "Best ", t: T(1), color: C.orangeHi },
    { w: "price ", t: T(2), color: C.orangeHi },
    { w: "execution ", t: T(3) },
    { w: "in ", t: T(4) },
    { w: "one ", t: T(5) },
    { w: "click", t: T(6) },
    { w: ".", t: T(6) + 0.14, color: C.orange },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <div
        style={{
          position: "absolute",
          left: 960 - size / 2,
          top: y,
          opacity: k,
          clipPath: `inset(${(1 - k) * 50}% 0 ${(1 - k) * 50}% 0)`,
        }}
      >
        <Logo size={size} />
      </div>
      <div style={{ opacity: 1 - headOut }}>
        <Words words={words} size={100} style={{ position: "absolute", left: 0, width: 1920, top: 600, textAlign: "center" }} />
      </div>
      {/* end card */}
      <div style={{ position: "absolute", left: 0, width: 1920, top: 548, textAlign: "center", opacity: end }}>
        <div
          style={{
            fontFamily: F.sans,
            fontVariationSettings: "'opsz' 32",
            fontWeight: 600,
            fontSize: 76,
            letterSpacing: "-0.035em",
            color: C.white,
            transform: `translateY(${(1 - end) * 24}px)`,
          }}
        >
          rift.trade
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, width: 1920, top: 700, textAlign: "center", opacity: credit, transform: `translateY(${(1 - credit) * 14}px)` }}>
        <Label size={20} color={C.mute} style={{ letterSpacing: "0.14em", textTransform: "none" }}>
          <span style={{ color: C.orange }}>///</span> Weekly Spotlight by <span style={{ color: C.white }}>{HANDLE}</span> · fan-made, not affiliated with RIFT
        </Label>
      </div>
    </div>
  );
};
