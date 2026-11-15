import React from "react";
import { useCurrentFrame } from "remotion";
import EV from "../events.json";
import { C, E, F, p, wt, ON } from "../theme";
import { Key, Label, Scramble } from "../ui";

// VO: "Last time you swapped across chains, did you get the best price? Honestly, you can't tell."
// On screen: keywords only.
const T = (i: number) => wt("hook", i);
const OUT = EV.cuts[0] - 0.28;

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const out = p(f, OUT, 0.28, E.exit);
  const card = p(f, T(12) - 0.1, 0.6, E.snap);
  const tell = p(f, EV.cantTell, 0.35, E.snap);

  const Row: React.FC<{ k: string; children: React.ReactNode; top: number }> = ({ k, children, top }) => (
    <div style={{ position: "absolute", left: 30, right: 30, top, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <Label size={16}>{k}</Label>
      <div style={{ fontFamily: F.mono, fontSize: 32, color: C.white }}>{children}</div>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <Key text="Across chains" t0={T(4)} t1={T(10) - 0.2} y={440} size={170} mode="right" />
      <Key text={<span>Best price<span style={{ color: ON.accent }}>?</span></span>} t0={T(10)} t1={T(12) - 0.2} y={440} size={190} mode="zoom" />

      {/* a settled swap — and no way to know if it was the best price */}
      <div
        style={{
          position: "absolute",
          left: 140,
          top: 360,
          width: 680,
          height: 360,
          borderRadius: 24,
          border: `1px solid ${C.line}`,
          background: "rgba(10,6,4,0.88)",
          opacity: card,
          transform: `translateX(${(1 - card) * -120}px)`,
        }}
      >
        <div style={{ position: "absolute", left: 30, right: 30, top: 28, display: "flex", justifyContent: "space-between" }}>
          <Label size={16}>Swap settled</Label>
          <Label size={16} color={C.green}>
            ✓ done
          </Label>
        </div>
        <Row k="Sent" top={92}>10 BTC</Row>
        <Row k="Received" top={152}>639,767.85 USDT</Row>
        <div style={{ position: "absolute", left: 30, right: 30, top: 218, borderTop: `1px solid ${C.line}` }} />
        <Row k="Best available" top={246}>
          <span style={{ color: tell > 0.5 ? C.dim : C.orangeHi }}>
            <Scramble text="645,331.16" settle={999} start={T(12) - 0.1} seed="doubt" />
          </span>
        </Row>
        <div style={{ position: "absolute", right: 30, top: 300, fontFamily: F.mono, fontSize: 16, letterSpacing: "0.2em", color: C.orangeHi, opacity: tell }}>
          ? UNKNOWN
        </div>
      </div>

      <Key text="Can’t tell." t0={T(14)} t1={OUT + 0.3} x={900} w={880} y={470} align="right" size={150} mode="left" />
    </div>
  );
};
