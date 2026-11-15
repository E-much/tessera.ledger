import React from "react";
import { useCurrentFrame } from "remotion";
import { QUOTE, SINGLE_HOP, fmt } from "../data";
import EV from "../events.json";
import { W_Y } from "../geometry";
import { C, E, F, lerp, p, wt } from "../theme";
import { Label, Logo, Scramble, Words } from "../ui";

const T = (i: number) => wt("solution", i);

/** Logo position: centre reveal → flies into the RIFT row's logo slot (match cut). */
export const logoBox = (f: number) => {
  const fly = p(f, EV.logoFly, 0.62, E.inOut);
  const a = { x: 960 - 110, y: 300, s: 220 };
  const b = { x: 214, y: W_Y - 55, s: 110 };
  return { x: lerp(a.x, b.x, fly), y: lerp(a.y, b.y, fly), s: lerp(a.s, b.s, fly), fly };
};

const typed = (f: number, s: string, t0: number, t1: number) => {
  const k = p(f, t0, t1 - t0, E.inOut);
  return s.slice(0, Math.round(k * s.length));
};

const TokenPill: React.FC<{ x: number; w: number; text: string; ticker: string; k: number }> = ({ x, w, text, ticker, k }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: 352,
      width: w,
      height: 66,
      borderRadius: 14,
      background: C.pillBlue,
      border: `1.5px solid ${C.pillBlueBorder}`,
      display: "flex",
      alignItems: "center",
      gap: 14,
      paddingLeft: 10,
      boxSizing: "border-box",
      opacity: 0.35 + 0.65 * k,
    }}
  >
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 23,
        background: "#0B0B0D",
        border: "1.5px solid rgba(255,255,255,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: F.mono,
        fontSize: 12,
        color: C.ink,
      }}
    >
      {k > 0.5 ? ticker : ""}
    </div>
    <div style={{ fontFamily: F.mono, fontSize: 26, color: C.ink, letterSpacing: "-0.01em", whiteSpace: "pre" }}>{text}</div>
    <svg width={16} height={10} style={{ position: "absolute", right: 16, top: 28 }}>
      <path d="M1 1 L8 8 L15 1" fill="none" stroke={C.ink} strokeWidth={2} />
    </svg>
  </div>
);

export const SolutionReveal: React.FC = () => {
  // "Rift fixes that." — centred logo + line, before the match cut.
  const f = useCurrentFrame();
  const out = p(f, EV.logoFly, 0.3, E.exit);
  const words = [
    { w: "Rift ", t: T(0) },
    { w: "fixes ", t: T(1) },
    { w: "that", t: T(2) },
    { w: ".", t: T(2) + 0.16, color: C.orange },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <Words words={words} size={120} mode="zoom" align="center" style={{ position: "absolute", left: 0, width: 1920, top: 570 }} />
      <div
        style={{
          position: "absolute",
          top: 740,
          left: 0,
          width: 1920,
          display: "flex",
          justifyContent: "center",
          opacity: p(f, T(2), 0.4),
        }}
      >
        <div
          style={{
            border: `1px solid ${C.line}`,
            borderRadius: 999,
            padding: "10px 22px",
            fontFamily: F.sans,
            fontSize: 22,
            color: C.mute,
            display: "flex",
            gap: 10,
          }}
        >
          Backed by <span style={{ color: C.white, fontWeight: 600 }}>Paradigm</span>
        </div>
      </div>
    </div>
  );
};

export const Widget: React.FC = () => {
  const f = useCurrentFrame();
  // pull back at "Behind that click" — the UI recedes, the route stays (see Spine)
  const pb = p(f, EV.pullback, 0.45, E.inOut);
  const inK = p(f, EV.logoFly + 0.15, 0.6, E.snap);
  const res = p(f, EV.results, 0.55, E.snap);
  const fromK = p(f, EV.typeFrom[0], 0.3);
  const toK = p(f, EV.typeTo[0], 0.3);
  const press = p(f, EV.click - 0.06, 0.06, E.exit) * (1 - p(f, EV.click + 0.02, 0.22, E.settle));

  const cap1 = [
    { w: "Pick ", t: T(3) },
    { w: "what ", t: T(4) },
    { w: "you ", t: T(5) },
    { w: "have. ", t: T(6) },
    { w: "Pick ", t: T(7) },
    { w: "what ", t: T(8) },
    { w: "you ", t: T(9) },
    { w: "want.", t: T(10) },
  ];
  const cap2 = [
    { w: "Rift ", t: T(11) },
    { w: "finds ", t: T(12) },
    { w: "the ", t: T(13) },
    { w: "best ", t: T(14), color: C.orangeHi },
    { w: "price, ", t: T(15), color: C.orangeHi },
    { w: "in ", t: T(16) },
    { w: "one ", t: T(17) },
    { w: "click", t: T(18) },
    { w: ".", t: T(18) + 0.14, color: C.orange },
  ];

  const best = QUOTE.out;
  const rows = SINGLE_HOP.filter((r) => r.out !== null).slice(0, 3);
  const nb = rows[0].out!;

  // cursor
  const cm = p(f, EV.cursor[0], EV.cursor[1] - EV.cursor[0], E.inOut);
  const cx = lerp(1300, 1640, cm);
  const cy = lerp(880, 400, cm);
  const cOp = p(f, EV.cursor[0] - 0.1, 0.2) * (1 - p(f, EV.pullback, 0.25, E.exit));

  return (
    <>
      {/* captions above the UI */}
      <div style={{ position: "absolute", left: 156, top: 112, opacity: 1 - pb }}>
        <Words words={cap1} size={60} mode="left" exitAt={EV.results - 0.3} exitTo="left" />
      </div>
      <div style={{ position: "absolute", right: 160, top: 112, opacity: 1 - pb }}>
        <Words words={cap2} size={60} mode="right" align="right" exitAt={EV.click + 0.5} exitTo="right" />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: inK * (1 - pb),
          transform: `translateY(${(1 - inK) * 30}px) scale(${1 - 0.14 * pb})`,
          transformOrigin: "960px 600px",
        }}
      >
        {/* use-case tabs, as on the site */}
        <div style={{ position: "absolute", top: 236, left: 160, width: 1600, display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}>
          <span style={{ fontFamily: F.sans, fontSize: 21, color: C.mute, marginRight: 6 }}>Try a…</span>
          {["Cross chain swap", "Tokenized stock", "Vault deposit", "Universal payment"].map((s, i) => (
            <div
              key={s}
              style={{
                borderRadius: 999,
                padding: "8px 18px",
                border: `1.2px solid ${i === 0 ? "rgba(255,143,40,0.7)" : "rgba(255,255,255,0.14)"}`,
                background: i === 0 ? "rgba(255,143,40,0.14)" : "rgba(255,255,255,0.03)",
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span style={{ fontFamily: F.mono, fontSize: 13, letterSpacing: "0.1em", color: i === 0 ? C.orangeHi : C.dim }}>0{i + 1}</span>
              <span style={{ fontFamily: F.sans, fontSize: 19, fontWeight: 500, color: i === 0 ? C.white : "#A3A3A3" }}>{s}</span>
            </div>
          ))}
        </div>

        {/* input bar */}
        <div style={{ position: "absolute", left: 160, top: 300, width: 1600, height: 170, borderRadius: 52, background: C.panel, border: `1px solid ${C.line}` }} />
        <div style={{ position: "absolute", left: 190, top: 322, height: 96, padding: "0 26px", borderRadius: 18, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: F.mono, fontSize: 60, color: C.white, letterSpacing: "-0.03em" }}>{typed(f, "10", EV.typeFrom[0], EV.typeFrom[0] + 0.12) || "0"}</span>
          <span style={{ fontFamily: F.mono, fontSize: 60, color: fromK > 0.5 ? C.white : C.dim, letterSpacing: "-0.03em", marginLeft: 18 }}>BTC</span>
        </div>
        <div style={{ position: "absolute", left: 216, top: 428, fontFamily: F.mono, fontSize: 21, color: C.mute }}>10.00000000 BTC</div>
        <div style={{ position: "absolute", left: 420, top: 336, fontFamily: F.mono, fontSize: 15, color: "#6B7280", letterSpacing: "0.2em", transform: "translateX(70px)" }}>
          ← EDIT ME
        </div>
        <TokenPill x={826} w={280} text={typed(f, "bitcoin.btc", EV.typeFrom[0], EV.typeFrom[1])} ticker="BTC" k={fromK} />
        <div
          style={{
            position: "absolute",
            left: 1124,
            top: 363,
            width: 42,
            height: 42,
            borderRadius: 21,
            border: `1px solid ${C.line}`,
            background: "rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: C.mute,
            fontSize: 20,
            fontFamily: F.sans,
          }}
        >
          →
        </div>
        <TokenPill x={1184} w={312} text={typed(f, "ethereum.usdt", EV.typeTo[0], EV.typeTo[1])} ticker="USDT" k={toK} />
        <div
          style={{
            position: "absolute",
            left: 1520,
            top: 347,
            width: 214,
            height: 76,
            borderRadius: 999,
            background: press > 0.3 ? C.orangeHi : C.orange,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            fontFamily: F.mono,
            fontSize: 26,
            fontWeight: 600,
            color: C.white,
            letterSpacing: "0.04em",
            transform: `scale(${1 - 0.05 * press})`,
          }}
        >
          TRADE <span style={{ fontFamily: F.sans }}>→</span>
        </div>

        {/* results */}
        <div
          style={{
            position: "absolute",
            left: 160,
            top: 500,
            width: 1600,
            height: 420 * res,
            overflow: "hidden",
            borderRadius: 44,
            border: `1px solid ${C.line}`,
            background: "rgba(255,255,255,0.015)",
            opacity: res > 0 ? 1 : 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 23,
              top: 23,
              width: 1552,
              height: 210,
              borderRadius: 30,
              border: `2px solid rgba(34,197,94,0.5)`,
              background: "rgba(34,197,94,0.05)",
            }}
          />
          <div style={{ position: "absolute", right: 54, top: 48, display: "flex", justifyContent: "flex-end", opacity: p(f, EV.quoteSettle, 0.35) }}>
            <div style={{ fontFamily: F.mono, fontSize: 19, color: C.green, border: "1px solid rgba(34,197,94,0.4)", background: "rgba(34,197,94,0.1)", borderRadius: 8, padding: "6px 12px" }}>
              +{fmt(best - nb)} USDT <span style={{ color: "rgba(34,197,94,0.5)" }}>|</span> +{(((best - nb) / nb) * 100).toFixed(2)}%
            </div>
          </div>
          <div style={{ position: "absolute", right: 54, top: 104, fontFamily: F.mono, fontSize: 46, color: C.green, letterSpacing: "-0.03em" }}>
            <Scramble text={fmt(best)} settle={EV.quoteSettle} start={EV.results} seed="best" />
          </div>
          <div style={{ position: "absolute", right: 54, top: 172, fontFamily: F.mono, fontSize: 20, color: C.mute }}>USDT · ethereum</div>

          {rows.map((r, i) => {
            const k = p(f, EV.results + 0.25 + i * 0.1, 0.45);
            const pct = ((r.out! - best) / best) * 100;
            return (
              <div
                key={r.venue}
                style={{
                  position: "absolute",
                  left: 23 + i * 392,
                  top: 250,
                  width: 376,
                  height: 146,
                  borderRadius: 16,
                  background: "rgba(239,68,68,0.12)",
                  opacity: k,
                  transform: `translateY(${(1 - k) * 20}px)`,
                }}
              >
                <div style={{ position: "absolute", left: 28, top: 28, fontFamily: F.mono, fontSize: 22, color: C.ink, letterSpacing: "0.1em" }}>{r.venue}</div>
                <div style={{ position: "absolute", right: 26, top: 64, fontFamily: F.mono, fontSize: 30, color: C.red, textAlign: "right" }}>
                  <Scramble text={fmt(r.out!)} settle={EV.quoteSettle + 0.1 * i} start={EV.results} seed={r.venue} />
                </div>
                <div style={{ position: "absolute", right: 26, top: 104, fontFamily: F.mono, fontSize: 18, color: C.red }}>{pct.toFixed(2)}%</div>
              </div>
            );
          })}
          <div
            style={{
              position: "absolute",
              left: 23 + 3 * 392,
              top: 250,
              width: 376,
              height: 146,
              borderRadius: 16,
              border: "1.2px dashed rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.02)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: F.mono,
              fontSize: 19,
              color: "#9CA3AF",
              letterSpacing: "0.06em",
              opacity: p(f, EV.results + 0.55, 0.4),
            }}
          >
            SHOW ALL (5) ⌄
          </div>
        </div>
        <Label size={13} color={C.dim} style={{ position: "absolute", left: 184, top: 936, letterSpacing: "0.18em", opacity: res }}>
          Live quote · api.rift.trade · {QUOTE.date} · indicative · UI recreated from rift.trade
        </Label>
      </div>

      {/* cursor */}
      <svg width={40} height={52} style={{ position: "absolute", left: cx, top: cy, opacity: cOp, transform: `scale(${1 - 0.12 * press})`, transformOrigin: "0 0" }}>
        <path d="M2 2 L2 40 L12 30 L19 46 L26 43 L19 27 L33 27 Z" fill={C.white} stroke="#000" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </>
  );
};

export const LogoTile: React.FC = () => {
  // Centre reveal on "Rift fixes that." → fades with the line → reappears inside the RIFT result row.
  const f = useCurrentFrame();
  const k = p(f, EV.logoIn, 0.55, E.snap);
  const gone = p(f, EV.logoFly, 0.3, E.exit);
  const back = p(f, EV.results + 0.05, 0.45, E.snap);
  const pb = p(f, EV.pullback, 0.5, E.inOut);
  const inRow = f / 60 >= EV.results;
  const s = inRow ? 110 : 220 * (0.94 + 0.06 * k);
  const x = inRow ? 214 : 960 - s / 2;
  const y = inRow ? W_Y - 55 : 300 + (220 - s) / 2;
  const op = inRow ? back * (1 - pb) : k * (1 - gone);
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: op, clipPath: inRow ? undefined : `inset(${(1 - k) * 50}% 0 ${(1 - k) * 50}% 0)` }}>
      <Logo size={s} />
    </div>
  );
};
