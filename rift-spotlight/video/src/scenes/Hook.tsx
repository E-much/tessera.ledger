import React from "react";
import { useCurrentFrame } from "remotion";
import EV from "../events.json";
import { C, E, F, FPS, p, wt } from "../theme";
import { Label, Scramble, Words } from "../ui";

// "Last time you swapped across chains, did you get the best price? Honestly, you can't tell."
const T = (i: number) => wt("hook", i);
const OUT = EV.cuts[0] - 0.28;
const CX = 1210, CY = 300, CW = 590;

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const out = p(f, OUT, 0.28, E.exit);
  const dimQ = p(f, T(12) - 0.05, 0.4, E.settle);
  const card = p(f, T(3), 0.6, E.snap); // "swapped" → a settled swap appears
  const tell = p(f, EV.cantTell, 0.35, E.snap);

  const q = [
    { w: "Last ", t: T(0) },
    { w: "time ", t: T(1) },
    { w: "you ", t: T(2) },
    { w: "swapped", t: T(3) },
    { w: "\n", t: 0 },
    { w: "across ", t: T(4) },
    { w: "chains, ", t: T(5) },
    { w: "did ", t: T(6) },
    { w: "you ", t: T(7) },
    { w: "get", t: T(8) },
    { w: "\n", t: 0 },
    { w: "the ", t: T(9) },
    { w: "best ", t: T(10), color: C.orangeHi },
    { w: "price?", t: T(11), color: C.orangeHi },
  ];
  const a = [
    { w: "Honestly, ", t: T(12) },
    { w: "you ", t: T(13) },
    { w: "can’t ", t: T(14) },
    { w: "tell", t: T(15) },
    { w: ".", t: T(15) + 0.16, color: C.orange },
  ];

  const Row: React.FC<{ k: string; children: React.ReactNode; top: number; op?: number }> = ({ k, children, top, op = 1 }) => (
    <div style={{ position: "absolute", left: 28, right: 28, top, display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity: op }}>
      <Label size={15}>{k}</Label>
      <div style={{ fontFamily: F.mono, fontSize: 28, color: C.white }}>{children}</div>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translateY(${-out * 30}px)` }}>
      <div style={{ position: "absolute", left: 114, top: 300, opacity: 1 - 0.62 * dimQ }}>
        <Words words={q} size={88} />
      </div>
      <Words words={a} size={88} style={{ position: "absolute", left: 114, top: 610 }} />

      {/* a settled cross-chain swap — with no way to know if it was the best price */}
      <div
        style={{
          position: "absolute",
          left: CX,
          top: CY,
          width: CW,
          height: 330,
          borderRadius: 20,
          border: `1px solid ${C.line}`,
          background: C.panel,
          opacity: card,
          transform: `translateY(${(1 - card) * 24}px)`,
        }}
      >
        <div style={{ position: "absolute", left: 28, right: 28, top: 26, display: "flex", justifyContent: "space-between" }}>
          <Label size={15}>
            <span style={{ color: C.orange }}>///</span> Swap settled
          </Label>
          <Label size={15} color={C.green}>
            ✓ done
          </Label>
        </div>
        <Row k="Sent" top={86}>10 BTC</Row>
        <Row k="Received" top={140}>639,767.85 USDT</Row>
        <div style={{ position: "absolute", left: 28, right: 28, top: 200, borderTop: `1px solid ${C.line}` }} />
        <Row k="Best available" top={226} op={p(f, EV.doubt - 0.1, 0.35)}>
          <span style={{ color: tell > 0.5 ? C.dim : C.orangeHi }}>
            <Scramble text="645,331.16" settle={999} start={EV.doubt} seed="doubt" />
          </span>
        </Row>
        <div
          style={{
            position: "absolute",
            right: 28,
            top: 276,
            fontFamily: F.mono,
            fontSize: 15,
            letterSpacing: "0.2em",
            color: C.orangeHi,
            opacity: tell,
          }}
        >
          ? UNKNOWN
        </div>
      </div>
      <Label size={13} color={C.dim} style={{ position: "absolute", left: CX, top: CY + 350, letterSpacing: "0.18em", opacity: card * 0.9 }}>
        Illustrative · amounts from a live quote, {""}
        <span>15 Nov 2026</span>
      </Label>
    </div>
  );
};
