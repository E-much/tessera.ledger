import React from "react";
import { useCurrentFrame } from "remotion";
import EV from "../events.json";
import { C, E, F, lerp, p, wt } from "../theme";
import { Label, Scramble, Words } from "../ui";

// "Last time you swapped across chains, did you get the best price? Honestly, you can't tell."
const T = (i: number) => wt("hook", i);
const OUT = EV.cuts[0] - 0.28;

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const swapAt = T(12) - 0.18; // "Honestly" — the question whips out left, the answer + receipt arrive
  const out = p(f, OUT, 0.28, E.exit);

  // Beat 1 — text only, centred, slow push-in
  const push = lerp(1, 1.06, p(f, T(0), swapAt - T(0), E.inOut));
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
    { w: "best ", t: T(10), color: C.orangeHi, mode: "zoom" as const },
    { w: "price?", t: T(11), color: C.orangeHi, mode: "zoom" as const },
  ];

  // Beat 2 — receipt on the left, answer on the right
  const card = p(f, swapAt + 0.05, 0.6, E.snap);
  const tell = p(f, EV.cantTell, 0.35, E.snap);
  const a = [
    { w: "Honestly,", t: T(12) },
    { w: "\n", t: 0 },
    { w: "you ", t: T(13) },
    { w: "can’t ", t: T(14) },
    { w: "tell", t: T(15) },
    { w: ".", t: T(15) + 0.16, color: C.orange },
  ];

  const Row: React.FC<{ k: string; children: React.ReactNode; top: number; op?: number }> = ({ k, children, top, op = 1 }) => (
    <div style={{ position: "absolute", left: 30, right: 30, top, display: "flex", justifyContent: "space-between", alignItems: "baseline", opacity: op }}>
      <Label size={16}>{k}</Label>
      <div style={{ fontFamily: F.mono, fontSize: 32, color: C.white }}>{children}</div>
    </div>
  );

  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <div style={{ position: "absolute", inset: 0, transform: `scale(${push})`, transformOrigin: "50% 50%" }}>
        <Words
          words={q}
          size={112}
          mode="right"
          align="center"
          exitAt={swapAt}
          exitTo="left"
          style={{ position: "absolute", left: 0, width: 1920, top: 362 }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: 120,
          top: 330,
          width: 680,
          height: 360,
          borderRadius: 22,
          border: `1px solid ${C.line}`,
          background: C.panel,
          opacity: card,
          transform: `translateX(${(1 - card) * -120}px)`,
        }}
      >
        <div style={{ position: "absolute", left: 30, right: 30, top: 28, display: "flex", justifyContent: "space-between" }}>
          <Label size={16}>
            <span style={{ color: C.orange }}>///</span> Swap settled
          </Label>
          <Label size={16} color={C.green}>
            ✓ done
          </Label>
        </div>
        <Row k="Sent" top={92}>10 BTC</Row>
        <Row k="Received" top={152}>639,767.85 USDT</Row>
        <div style={{ position: "absolute", left: 30, right: 30, top: 218, borderTop: `1px solid ${C.line}` }} />
        <Row k="Best available" top={246}>
          <span style={{ color: tell > 0.5 ? C.dim : C.orangeHi }}>
            <Scramble text="645,331.16" settle={999} start={swapAt} seed="doubt" />
          </span>
        </Row>
        <div style={{ position: "absolute", right: 30, top: 300, fontFamily: F.mono, fontSize: 16, letterSpacing: "0.2em", color: C.orangeHi, opacity: tell }}>
          ? UNKNOWN
        </div>
      </div>
      <Label size={13} color={C.dim} style={{ position: "absolute", left: 120, top: 710, letterSpacing: "0.18em", opacity: card * 0.9 }}>
        Illustrative · amounts from a live quote, 15 Nov 2026
      </Label>

      <Words words={a} size={120} mode="right" align="right" style={{ position: "absolute", right: 120, top: 380 }} />
    </div>
  );
};
