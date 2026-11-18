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
const QUOTES = [639767.85, 639798.21, 644165.89]; // [2] = next-best single-hop venue
const RIFT = 645331.16;

export const Blur: React.FC<{ id: string; x: number; y?: number; children: React.ReactNode }> = ({ id, x, y = 0, children }) => {
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

export const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 130, color = ON.ink, style }) => (
  <span style={{ fontFamily: F.sans, fontVariationSettings: "'opsz' 32", fontWeight: 600, fontSize: size, letterSpacing: "-0.05em", lineHeight: 1, color, whiteSpace: "nowrap", ...style }}>{children}</span>
);

const Cursor: React.FC<{ x: number; y: number; press: number; op?: number }> = ({ x, y, press, op = 1 }) => (
  <svg width={48} height={62} style={{ position: "absolute", left: x, top: y, opacity: op, transform: `scale(${1 - 0.14 * press})`, transformOrigin: "0 0" }}>
    <path d="M2 2 L2 48 L14 36 L23 56 L31 52 L22 33 L40 33 Z" fill={C.white} stroke="#000" strokeWidth={2.5} strokeLinejoin="round" />
  </svg>
);

// ───────────────────────────── Rift's own UI
const VENUES = ["UNIT", "HYPERLIQUID", "CCTP", "COW SWAP", "UNISWAP", "VELORA", "KYBERSWAP", "ACROSS", "MAYAN", "RELAY", "CHAINFLIP", "NEAR", "LI.FI", "OKX", "TRANSIT", "NORDSTERN", "FLY.TRADE", "METRIC"];

export const Marquee: React.FC = () => {
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

export const RiftUI: React.FC = () => {
  const f = useCurrentFrame();
  const t = sec(f);
  if (t < EV.sweep || t > EV.phoneIn + 0.5) return null;
  const rise = p(f, EV.sweep + 0.32, 0.6, E.snap);
  const out = p(f, EV.phoneIn - 0.05, 0.35, E.exit);
  const row = p(f, EV.route - 0.1, 0.5, E.snap);
  const draw = p(f, EV.route, EV.chains - EV.route - 0.1, E.inOut) * 4; // hops drawn
  const ch = p(f, EV.chains - 0.05, 0.4, E.snap);
  const res = p(f, EV.result - 0.1, 0.45, E.snap);
  // camera: overview → into the result row → over to TRADE for the click → out
  const keys = [
    { t: EV.riftIn, x: 960, y: 540, s: 1 },
    { t: EV.route, x: 960, y: 640, s: 1.16 },
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
      <div style={{ position: "absolute", inset: 0, opacity: rise * (1 - out), transform: `translate(${960 - cx - out * 1100}px, ${540 - cy + (1 - rise) * 500}px) scale(${cs})`, transformOrigin: `${cx}px ${cy}px` }}>
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
            <div style={{ display: "inline-block", fontFamily: F.mono, fontSize: 20, color: C.green, border: "1px solid rgba(34,197,94,0.45)", background: "rgba(34,197,94,0.1)", borderRadius: 8, padding: "6px 12px" }}>+{fmt(RIFT - QUOTES[2])} vs. next best</div>
            <div style={{ fontFamily: F.mono, fontSize: 54, color: C.green, marginTop: 14 }}>{fmt(RIFT)}</div>
            <div style={{ fontFamily: F.mono, fontSize: 20, color: C.mute, marginTop: 6 }}>USDT · ethereum</div>
          </div>
        </div>
      </div>
    </Blur>
  );
};

// ───────────────────────────── 0 added fees · close · creator card
export const Fees: React.FC = () => {
  const f = useCurrentFrame();
  const t = sec(f);
  if (t < EV.fees - 0.1 || t > EV.closeLogo + 0.2) return null;
  const k = p(f, EV.fees - 0.08, 0.45, E.snap);
  // (phone sits on the left; this sits on the right)
  const o = p(f, EV.closeLogo - 0.2, 0.3, E.exit);
  return (
    <Blur id="fees" x={(1 - k) * 40 + o * 50}>
      <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, k * 2) * (1 - o), transform: `translateX(${(1 - k) * 300 - o * 500}px)` }}>
        <div style={{ position: "absolute", left: 960, width: 900, top: 250, display: "flex", justifyContent: "center", alignItems: "baseline", gap: 34 }}>
          <Big size={400} style={{ transform: `scale(${lerp(1.4, 1, k)})`, display: "inline-block" }}>0</Big>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Big size={120} color={ON.accent}>added</Big>
            <Big size={120}>fees.</Big>
          </div>
        </div>
      </div>
    </Blur>
  );
};

// Rift on a phone — tilts in, settles, the tap lands on TRADE on "click"
export const Phone: React.FC = () => {
  const f = useCurrentFrame();
  const t = sec(f);
  if (t < EV.phoneIn - 0.05 || t > EV.closeLogo + 0.2) return null;
  const k = p(f, EV.phoneIn, 0.7, E.snap);
  const o = p(f, EV.closeLogo - 0.22, 0.32, E.exit);
  const toLeft = p(f, EV.fees - 0.15, 0.55, E.inOut); // slides left to make room for "0 added fees"
  const tap = p(f, EV.click - 0.04, 0.4, E.settle);
  const press = p(f, EV.click - 0.05, 0.05, E.exit) * (1 - p(f, EV.click + 0.03, 0.2, E.settle));
  const done = p(f, EV.click + 0.08, 0.35, E.snap);
  const ry = lerp(38, -10, k) + lerp(0, 4, toLeft);
  const x = lerp(960, 560, toLeft) + (1 - k) * 380 - o * 900;
  const PW = 430, PH = 880;
  return (
    <Blur id="phone" x={(1 - k) * 18 + o * 60}>
      <div style={{ position: "absolute", inset: 0, perspective: 1600, opacity: Math.min(1, k * 2) * (1 - o) }}>
        <div
          style={{
            position: "absolute",
            left: x - PW / 2,
            top: 540 - PH / 2 + (1 - k) * 80,
            width: PW,
            height: PH,
            borderRadius: 70,
            background: "#0A0A0A",
            boxShadow: "0 60px 120px rgba(70,25,0,0.45), inset 0 0 0 3px #2A2A2A",
            transform: `rotateY(${ry}deg) rotateZ(${lerp(-6, 0, k)}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* screen */}
          <div style={{ position: "absolute", inset: 14, borderRadius: 58, background: "#050506", overflow: "hidden" }}>
            <div style={{ position: "absolute", left: "50%", top: 16, width: 120, height: 34, borderRadius: 17, background: "#000", transform: "translateX(-50%)" }} />
            <div style={{ position: "absolute", left: 30, top: 74, display: "flex", alignItems: "center", gap: 12 }}>
              <Logo size={46} />
              <span style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 26, color: C.white, letterSpacing: "-0.02em" }}>Swap</span>
            </div>
            {/* you pay / you get */}
            <div style={{ position: "absolute", left: 24, right: 24, top: 150, borderRadius: 26, background: "#121214", padding: "22px 24px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 15, color: C.mute }}>You send</div>
              <div style={{ fontFamily: F.mono, fontSize: 44, color: C.white, marginTop: 6 }}>10 BTC</div>
              <div style={{ marginTop: 12, height: 52, borderRadius: 12, background: C.pillBlue, border: `2px solid ${C.pillBlueBorder}`, display: "flex", alignItems: "center", paddingLeft: 14, fontFamily: F.mono, fontSize: 22, color: C.ink }}>bitcoin.btc</div>
            </div>
            <div style={{ position: "absolute", left: "50%", top: 352, width: 44, height: 44, borderRadius: 22, background: "#1C1C20", transform: "translateX(-50%)", display: "flex", alignItems: "center", justifyContent: "center", color: C.mute, fontSize: 20 }}>↓</div>
            <div style={{ position: "absolute", left: 24, right: 24, top: 384, borderRadius: 26, background: "#0E1A12", border: "2px solid rgba(34,197,94,0.5)", padding: "20px 24px" }}>
              <div style={{ fontFamily: F.mono, fontSize: 15, color: C.mute }}>You get · best price</div>
              <div style={{ fontFamily: F.mono, fontSize: 42, color: C.green, marginTop: 6 }}>645,331.16</div>
              <div style={{ fontFamily: F.mono, fontSize: 16, color: C.green, marginTop: 4 }}>+1,165.27 vs. next best</div>
              <div style={{ marginTop: 12, height: 52, borderRadius: 12, background: C.pillBlue, border: `2px solid ${C.pillBlueBorder}`, display: "flex", alignItems: "center", paddingLeft: 14, fontFamily: F.mono, fontSize: 22, color: C.ink }}>ethereum.usdt</div>
            </div>
            {/* TRADE */}
            <div style={{ position: "absolute", left: 24, right: 24, bottom: 54, height: 92, borderRadius: 999, background: press > 0.3 ? "#B85E08" : C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 32, fontWeight: 600, color: C.white, transform: `scale(${1 - 0.05 * press})` }}>
              {done > 0.5 ? "✓ ORDER PLACED" : "TRADE →"}
            </div>
            {/* tap */}
            {t >= EV.click - 0.04 && tap < 1 && (
              <div style={{ position: "absolute", left: "50%", bottom: 100, width: 40 + 160 * tap, height: 40 + 160 * tap, borderRadius: 999, border: `3px solid rgba(255,255,255,${0.9 * (1 - tap)})`, transform: "translate(-50%, 50%)" }} />
            )}
          </div>
        </div>
      </div>
    </Blur>
  );
};

export const Close: React.FC = () => {
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

export const Card: React.FC = () => {
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

