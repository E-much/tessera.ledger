import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import EV from "../events.json";
import { BG, C, E, F, FPS, ON, lerp, p } from "../theme";
import { FontFaces, Label, Logo } from "../ui";

// "The hunt": you keep cancelling quotes in generic apps (white windows) → Rift's own UI finds the best route.
const DARK = "#120C07";
const HANDLE = "@emuch4pf";
const sec = (f: number) => f / FPS;
const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Real quotes for 10 BTC → ethereum.usdt (api.rift.trade, 15 Nov 2026). Other venues stay unnamed in the hunt.
const QUOTES = [639767.85, 639798.21, 644165.89];
const RIFT = 645331.16;

const Blur: React.FC<{ id: string; x: number; y?: number; children: React.ReactNode }> = ({ id, x, y = 0, children }) => {
  const on = x + y > 0.3;
  return (
    <div style={{ position: "absolute", inset: 0, filter: on ? `url(#${id})` : undefined }}>
      {on && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={`${x.toFixed(1)} ${y.toFixed(1)}`} />
          </filter>
        </svg>
      )}
      {children}
    </div>
  );
};

const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 130, color = ON.ink, style }) => (
  <span style={{ fontFamily: F.sans, fontVariationSettings: "'opsz' 32", fontWeight: 600, fontSize: size, letterSpacing: "-0.05em", lineHeight: 1, color, whiteSpace: "nowrap", ...style }}>{children}</span>
);

const Cursor: React.FC<{ x: number; y: number; press: number; op?: number }> = ({ x, y, press, op = 1 }) => (
  <svg width={48} height={62} style={{ position: "absolute", left: x, top: y, opacity: op, transform: `scale(${1 - 0.14 * press})`, transformOrigin: "0 0" }}>
    <path d="M2 2 L2 48 L14 36 L23 56 L31 52 L22 33 L40 33 Z" fill={C.white} stroke="#000" strokeWidth={2.5} strokeLinejoin="round" />
  </svg>
);

// ───────────────────────────── the hunt: three generic "tabs"
const WIN_W = 860, WIN_H = 560;

const Window: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const t = sec(f);
  const tIn = i === 0 ? EV.askIn : EV.q[i];
  const tOut = i < 2 ? EV.cancel[i]! + 0.08 : EV.sweep;
  if (t < tIn - 0.05 || t > tOut + 0.6) return null;
  const k = i === 0 ? p(f, tIn, 0.5, E.snap) : p(f, tIn - 0.12, 0.4, E.snap);
  const o = p(f, tOut, 0.45, E.exit);
  // entry: tab 1 rises, later tabs slide in from the right; exit: cancelled tabs drop away, the last one is swept left
  const ex = i < 2 ? { x: -260 * o, y: 700 * o, r: -14 * o } : { x: -1500 * o, y: 0, r: 0 };
  const en = i === 0 ? { x: 0, y: (1 - k) * 160 } : { x: (1 - k) * 1100, y: 0 };
  const blurX = i === 0 ? 0 : (1 - k) * 50 + (i === 2 ? o * 60 : 0);
  const q = QUOTES[i];
  const quoteIn = p(f, EV.q[i] - 0.05, 0.4, E.snap);
  // tab 3: the price moves while you look at it
  const drift = i === 2 ? p(f, EV.moved, 1.4, E.inOut) : 0;
  const shown = q - drift * 453.49;
  const typed = (s: string, a: number) => s.slice(0, Math.round(p(f, a - 0.1, 0.45, E.inOut) * s.length));
  const better = i === 1 ? p(f, EV.better, 0.35, E.snap) : 0;
  const isBest = i === 1 ? p(f, EV.isBest, 0.35, E.snap) : 0;
  const low = i === 0 ? p(f, EV.feelsLow, 0.4, E.settle) : 0;
  // cursor to "Cancel"
  const cancelAt = i < 2 ? EV.cancel[i]! : 0;
  const cm = i < 2 ? p(f, cancelAt - 0.75, 0.6, E.inOut) : 0;
  const press = i < 2 ? p(f, cancelAt - 0.05, 0.05, E.exit) * (1 - p(f, cancelAt + 0.03, 0.15, E.settle)) : 0;
  const cancelHot = i < 2 && t >= cancelAt - 0.05;
  const L = (1920 - WIN_W) / 2, T = (1080 - WIN_H) / 2;

  return (
    <Blur id={`win${i}`} x={blurX}>
      <div style={{ position: "absolute", inset: 0, transform: `translate(${en.x + ex.x}px, ${en.y + ex.y}px) rotate(${ex.r}deg) scale(1.25)`, transformOrigin: "50% 50%", opacity: Math.min(1, k * 2) * (1 - o * 0.6) }}>
        <div style={{ position: "absolute", left: L, top: T, width: WIN_W, height: WIN_H, borderRadius: 26, background: "#FAF7F2", boxShadow: "0 50px 100px rgba(70,25,0,0.35)", overflow: "hidden" }}>
          {/* window chrome */}
          <div style={{ height: 58, background: "#EEE9E1", display: "flex", alignItems: "center", gap: 10, paddingLeft: 22 }}>
            {["#E5534B", "#E5B34B", "#5BB85B"].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c, opacity: 0.8 }} />)}
            <div style={{ marginLeft: 24, padding: "8px 22px", background: "#FAF7F2", borderRadius: "10px 10px 0 0", fontFamily: F.sans, fontSize: 20, color: "#555", alignSelf: "flex-end" }}>Swap · tab {i + 1}</div>
          </div>
          <div style={{ padding: "34px 46px" }}>
            {i === 0 && (
              <div style={{ display: "flex", gap: 22, marginBottom: 26 }}>
                {[["You pay", typed("10 BTC", EV.typePay)], ["You get", typed("USDT", EV.typeGet)]].map(([a, b]) => (
                  <div key={a} style={{ flex: 1, background: "#EFEAE2", borderRadius: 16, padding: "16px 22px" }}>
                    <div style={{ fontFamily: F.sans, fontSize: 20, color: "#777" }}>{a}</div>
                    <div style={{ fontFamily: F.mono, fontSize: 40, color: "#1A1A1A", height: 50 }}>{b}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ opacity: quoteIn, transform: `translateY(${(1 - quoteIn) * 20}px)` }}>
              <div style={{ fontFamily: F.sans, fontSize: 22, color: "#777", display: "flex", gap: 14, alignItems: "center" }}>
                Quote
                {i === 2 && drift > 0.05 && <span style={{ fontSize: 18, color: "#C0392B", background: "#F7DCD8", borderRadius: 8, padding: "3px 10px" }}>price changed</span>}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 6 }}>
                <span style={{ fontFamily: F.mono, fontSize: i === 0 ? 76 : 92, color: i === 2 && drift > 0.05 ? "#C0392B" : lerp(0, 1, low) > 0.5 ? "#8A8A8A" : "#1A1A1A", letterSpacing: "-0.02em" }}>{fmt(shown)}</span>
                <span style={{ fontFamily: F.sans, fontSize: 30, color: "#888" }}>USDT</span>
                {i === 1 && <span style={{ fontFamily: F.mono, fontSize: 26, color: "#2E8B57", opacity: better }}>+{fmt(QUOTES[1] - QUOTES[0])}</span>}
              </div>
            </div>
            <div style={{ position: "absolute", left: 46, right: 46, bottom: 40, display: "flex", gap: 18, opacity: quoteIn }}>
              <div style={{ flex: 1, height: 74, borderRadius: 16, border: `2px solid ${cancelHot ? "#1A1A1A" : "#CFC8BD"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontSize: 28, fontWeight: 600, color: "#1A1A1A", background: cancelHot ? "#E9E3D9" : "transparent" }}>Cancel</div>
              <div style={{ flex: 1, height: 74, borderRadius: 16, background: "#1A1A1A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontSize: 28, fontWeight: 600, color: "#FAF7F2" }}>Swap</div>
            </div>
          </div>
        </div>
        {/* "is it the best?" */}
        {i === 1 && (
          <div style={{ position: "absolute", left: L + WIN_W + 10, top: T + 60, opacity: isBest, transform: `scale(${lerp(0.6, 1, isBest)}) rotate(${(1 - isBest) * 20}deg)` }}>
            <Big size={220} color={ON.accent}>?</Big>
          </div>
        )}
        {i < 2 && cm > 0 && <Cursor x={lerp(L + WIN_W - 40, L + 46 + 230, cm)} y={lerp(T + WIN_H + 80, T + WIN_H - 78, cm)} press={press} op={1 - o} />}
      </div>
    </Blur>
  );
};

// ───────────────────────────── Rift's own UI
const VENUES = ["UNIT", "HYPERLIQUID", "CCTP", "COW SWAP", "UNISWAP", "VELORA", "KYBERSWAP", "ACROSS", "MAYAN", "RELAY", "CHAINFLIP", "NEAR", "LI.FI", "OKX", "TRANSIT", "NORDSTERN", "FLY.TRADE", "METRIC"];

const Marquee: React.FC = () => {
  const f = useCurrentFrame();
  const t = sec(f);
  if (t < EV.venues - 0.3 || t > EV.venuesEnd + 0.6) return null;
  const k = p(f, EV.venues - 0.2, 0.4, E.snap) * (1 - p(f, EV.venuesEnd, 0.45, E.exit));
  const row = (y: number, dir: number, speed: number, off: number) => {
    const shift = ((t - EV.venues) * speed * dir + 2800) % 1400;
    const rot = [...VENUES.slice(off % VENUES.length), ...VENUES.slice(0, off % VENUES.length)];
    const txt = [...rot, ...rot].join("   ·   ");
    return (
      <div style={{ position: "absolute", left: -1400 + shift, top: y, whiteSpace: "nowrap", fontFamily: F.mono, fontSize: 64, letterSpacing: "0.06em", color: ON.ink, opacity: 0.9 }}>{txt}</div>
    );
  };
  return (
    <div style={{ position: "absolute", inset: 0, opacity: k }}>
      {row(52, 1, 420, 0)}
      {row(140, -1, 300, 7)}
      {row(860, 1, 360, 12)}
      {row(948, -1, 460, 4)}
    </div>
  );
};

const RX = 210, RW = 1500;
const TOK = [
  { x: 420, tk: "BTC", chain: "Bitcoin" },
  { x: 630, tk: "BTC", chain: "Hyperliquid" },
  { x: 840, tk: "USDC", chain: "Hyperliquid" },
  { x: 1050, tk: "USDC", chain: "Ethereum" },
  { x: 1260, tk: "USDT", chain: "Ethereum" },
];
const HOPS = ["UNIT", "HYPERLIQUID", "CCTP", "COW SWAP"];

const RiftUI: React.FC = () => {
  const f = useCurrentFrame();
  const t = sec(f);
  if (t < EV.sweep || t > EV.fees + 0.5) return null;
  const rise = p(f, EV.sweep + 0.32, 0.6, E.snap);
  const out = p(f, EV.fees - 0.12, 0.35, E.exit);
  const row = p(f, EV.route - 0.1, 0.5, E.snap);
  const draw = p(f, EV.route, EV.chains - EV.route - 0.1, E.inOut) * 4; // hops drawn
  const ch = p(f, EV.chains - 0.05, 0.4, E.snap);
  const res = p(f, EV.result - 0.1, 0.45, E.snap);
  // camera: overview → into the result row → over to TRADE for the click → out
  const keys = [
    { t: EV.riftIn, x: 960, y: 540, s: 1 },
    { t: EV.route, x: 960, y: 640, s: 1.16 },
    { t: EV.click - 0.45, x: 1590, y: 330, s: 1.55 },
    { t: EV.click + 0.35, x: 960, y: 540, s: 1.05 },
  ];
  let cx = 960, cy = 540, cs = 1;
  for (let i = 1; i < keys.length; i++) {
    const k = p(f, keys[i].t - 0.2, 0.5, E.inOut);
    if (k > 0) { cx = lerp(keys[i - 1].x, keys[i].x, k); cy = lerp(keys[i - 1].y, keys[i].y, k); cs = lerp(keys[i - 1].s, keys[i].s, k); }
  }
  const press = p(f, EV.click - 0.05, 0.05, E.exit) * (1 - p(f, EV.click + 0.03, 0.2, E.settle));
  const cur = p(f, EV.click - 0.75, 0.6, E.inOut);
  const bx = (1 - rise) * 0 + out * 70;
  return (
    <Blur id="rift" x={bx}>
      <div style={{ position: "absolute", inset: 0, opacity: rise * (1 - out), transform: `translate(${960 - cx}px, ${540 - cy + (1 - rise) * 500}px) scale(${cs})`, transformOrigin: `${cx}px ${cy}px` }}>
        {/* input bar — as on rift.trade */}
        <div style={{ position: "absolute", left: RX, top: 250, width: RW, height: 160, borderRadius: 54, background: DARK, boxShadow: "0 50px 100px rgba(70,25,0,0.35)" }}>
          <div style={{ position: "absolute", left: 30, top: 32, height: 96, padding: "0 28px", borderRadius: 20, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", fontFamily: F.mono, fontSize: 56, color: C.white }}>10 BTC</div>
          {[{ x: 500, w: 330, txt: "bitcoin.btc", tk: "BTC" }, { x: 900, w: 360, txt: "ethereum.usdt", tk: "USDT" }].map((pl) => (
            <div key={pl.txt} style={{ position: "absolute", left: pl.x, top: 44, width: pl.w, height: 72, borderRadius: 14, background: C.pillBlue, border: `2px solid ${C.pillBlueBorder}`, display: "flex", alignItems: "center", gap: 14, paddingLeft: 10, boxSizing: "border-box" }}>
              <div style={{ width: 52, height: 52, borderRadius: 26, background: "#0B0B0D", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 14, color: C.ink }}>{pl.tk}</div>
              <span style={{ fontFamily: F.mono, fontSize: 30, color: C.ink }}>{pl.txt}</span>
            </div>
          ))}
          <div style={{ position: "absolute", left: 848, top: 62, width: 36, height: 36, borderRadius: 18, border: "1px solid rgba(255,255,255,0.2)", color: C.mute, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>→</div>
          <div style={{ position: "absolute", left: 1290, top: 40, width: 186, height: 80, borderRadius: 999, background: press > 0.3 ? "#B85E08" : C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 30, fontWeight: 600, color: C.white, transform: `scale(${1 - 0.06 * press})` }}>TRADE →</div>
        </div>

        {/* the RIFT result row: route + output + comparison */}
        <div style={{ position: "absolute", left: RX, top: 440, width: RW, height: 330 * row, overflow: "hidden", borderRadius: 40, background: DARK, boxShadow: "0 50px 100px rgba(70,25,0,0.35)" }}>
          <div style={{ position: "absolute", left: 24, top: 24, right: 24, height: 282, borderRadius: 28, border: "2px solid rgba(34,197,94,0.5)", background: "#0E1A12" }} />
          <div style={{ position: "absolute", left: 60, top: 104 }}>
            <Logo size={112} />
          </div>
          <svg width={RW} height={330} style={{ position: "absolute", left: 0, top: 0 }}>
            {TOK.slice(0, 4).map((a, j) => {
              const k = Math.max(0, Math.min(1, draw - j));
              const x1 = a.x - RX + 34, x2 = TOK[j + 1].x - RX - 34;
              return <line key={j} x1={x1} x2={lerp(x1, x2, k)} y1={160} y2={160} stroke={C.orange} strokeWidth={4} />;
            })}
          </svg>
          {TOK.map((tk, j) => {
            const on = draw >= j - 0.05;
            return (
              <div key={j} style={{ position: "absolute", left: tk.x - RX - 34, top: 126, width: 68, height: 68, borderRadius: 34, background: "#0B0B0D", border: `3px solid ${on ? C.orange : "rgba(255,255,255,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 18, color: C.white }}>{tk.tk}</div>
            );
          })}
          {HOPS.map((h, j) => {
            const k = Math.max(0, Math.min(1, (draw - j) * 2));
            return (
              <div key={h} style={{ position: "absolute", left: (TOK[j].x + TOK[j + 1].x) / 2 - RX, top: 96, transform: `translate(-50%, ${(1 - k) * 10}px)`, opacity: k, fontFamily: F.mono, fontSize: 17, letterSpacing: "0.1em", color: C.white, background: "#22150A", border: `1.5px solid ${C.orange}`, borderRadius: 999, padding: "4px 12px", whiteSpace: "nowrap" }}>{h}</div>
            );
          })}
          {/* three chains */}
          {[
            { a: 420, b: 420, n: "Bitcoin" },
            { a: 630, b: 840, n: "Hyperliquid" },
            { a: 1050, b: 1260, n: "Ethereum" },
          ].map((g, j) => {
            const k = p(f, EV.chains - 0.05 + j * 0.12, 0.35, E.snap);
            return (
              <div key={g.n} style={{ position: "absolute", left: g.a - RX - 40, width: g.b - g.a + 80, top: 214, opacity: k, transform: `translateY(${(1 - k) * 12}px)`, textAlign: "center" }}>
                <div style={{ height: 4, borderRadius: 2, background: C.orange, margin: "0 10px" }} />
                <div style={{ fontFamily: F.sans, fontSize: 30, fontWeight: 600, color: C.white, marginTop: 10 }}>{g.n}</div>
              </div>
            );
          })}
          {/* output + comparison (rift.trade's rate comparison) */}
          <div style={{ position: "absolute", right: 60, top: 70, textAlign: "right", opacity: res, transform: `translateX(${(1 - res) * 40}px)` }}>
            <div style={{ display: "inline-block", fontFamily: F.mono, fontSize: 20, color: C.green, border: "1px solid rgba(34,197,94,0.45)", background: "rgba(34,197,94,0.1)", borderRadius: 8, padding: "6px 12px" }}>+{fmt(RIFT - QUOTES[2])} vs. your best tab</div>
            <div style={{ fontFamily: F.mono, fontSize: 54, color: C.green, marginTop: 14 }}>{fmt(RIFT)}</div>
            <div style={{ fontFamily: F.mono, fontSize: 20, color: C.mute, marginTop: 6 }}>USDT · ethereum</div>
          </div>
        </div>
        {t >= EV.click - 0.8 && <Cursor x={lerp(1560, RX + 1290 + 120, cur)} y={lerp(640, 250 + 40 + 44, cur)} press={press} />}
      </div>
    </Blur>
  );
};

// ───────────────────────────── 0 added fees · close · creator card
const Fees: React.FC = () => {
  const f = useCurrentFrame();
  const t = sec(f);
  if (t < EV.fees - 0.1 || t > EV.closeLogo + 0.2) return null;
  const k = p(f, EV.fees - 0.08, 0.45, E.snap);
  const o = p(f, EV.closeLogo - 0.2, 0.3, E.exit);
  return (
    <Blur id="fees" x={(1 - k) * 40 + o * 50}>
      <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, k * 2) * (1 - o), transform: `translateX(${(1 - k) * 300 - o * 500}px)` }}>
        <div style={{ position: "absolute", left: 0, width: 1920, top: 230, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 40 }}>
          <Big size={460} style={{ transform: `scale(${lerp(1.4, 1, k)})`, display: "inline-block" }}>0</Big>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Big size={120} color={ON.accent}>added</Big>
            <Big size={120}>fees.</Big>
          </div>
        </div>
      </div>
    </Blur>
  );
};

const Close: React.FC = () => {
  const f = useCurrentFrame();
  const t = sec(f);
  if (t < EV.closeLogo - 0.2 || t > EV.card + 0.3) return null;
  const r = p(f, EV.closeLogo - 0.05, 0.5, E.snap);
  const h = p(f, EV.headline - 0.05, 0.5, E.snap);
  const o = p(f, EV.card - 0.25, 0.3, E.exit);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - o, transform: `scale(${lerp(1, 0.9, o)})` }}>
      <div style={{ position: "absolute", left: 0, width: 1920, top: 250, textAlign: "center", opacity: Math.min(1, r * 2), transform: `scale(${lerp(1.5, 1, r)})` }}>
        <Big size={280}>Rift<span style={{ color: ON.accent }}>.</span></Big>
      </div>
      {/* rift.trade's hero line */}
      <div style={{ position: "absolute", left: 0, width: 1920, top: 640, textAlign: "center", opacity: h, transform: `translateY(${(1 - h) * 30}px)` }}>
        <Big size={96}>
          <span style={{ color: ON.accent }}>Best price</span> execution in one click<span style={{ color: ON.accent }}>.</span>
        </Big>
      </div>
    </div>
  );
};

const Card: React.FC = () => {
  const f = useCurrentFrame();
  if (sec(f) < EV.card - 0.05) return null;
  const k = p(f, EV.card, 0.6, E.snap);
  const h = p(f, EV.card + 0.35, 0.5, E.snap);
  const fade = p(f, EV.end - 0.45, 0.45, E.inOut);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <div style={{ position: "absolute", left: 0, width: 1920, top: 300, display: "flex", justifyContent: "center" }}>
        <Img src={staticFile("pfp.jpg")} style={{ width: 280, height: 280, borderRadius: 140, border: `4px solid ${ON.ink}`, opacity: k, transform: `scale(${lerp(0.7, 1, k)})` }} />
      </div>
      <div style={{ position: "absolute", left: 0, width: 1920, top: 640, textAlign: "center", opacity: h, transform: `translateY(${(1 - h) * 20}px)` }}>
        <Big size={84}>{HANDLE}</Big>
        <div style={{ marginTop: 18 }}>
          <Label size={22} color={ON.soft} style={{ letterSpacing: "0.32em" }}>
            <span style={{ color: ON.accent }}>///</span> Weekly Spotlight
          </Label>
        </div>
      </div>
    </div>
  );
};

export const Hunt: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([document.fonts.load("600 40px InterV"), document.fonts.load("400 20px Sometype")]).then(() => document.fonts.ready).then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <FontFaces />
      <Window i={0} />
      <Window i={1} />
      <Window i={2} />
      <Marquee />
      <RiftUI />
      <Fees />
      <Close />
      <Card />
    </AbsoluteFill>
  );
};
