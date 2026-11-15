import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import EV from "../events.json";
import { BG, C, E, F, FPS, ON, lerp, p, wt } from "../theme";
import { FontFaces, Label, Logo, Scramble } from "../ui";

// Reference-style edit: one idea per shot, whip cuts with motion blur, camera zooms into UI.
const shot = (id: string) => EV.shots.find((s) => s.id === id)!;
const DARK = "#120C07";
const HANDLE = "@emuch4pf";

/** Horizontal (motion) or uniform blur via an inline SVG filter. */
const Blur: React.FC<{ id: string; x: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, x, y = 0, children, style }) => {
  const on = x + y > 0.3;
  return (
    <div style={{ position: "absolute", inset: 0, filter: on ? `url(#${id})` : undefined, ...style }}>
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

type Move = "left" | "right" | "zoom";
/** A shot: enters with a whip/zoom, optional slow push-in, exits with a whip/zoom. */
const Shot: React.FC<{ id: string; enter: Move; exit: Move; push?: number; children: React.ReactNode }> = ({ id, enter, exit, push = 0, children }) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const s = shot(id);
  if (t < s.t0 - 0.02 || t > s.t1 + 0.32) return null;
  const kin = s.t0 <= 0.01 ? 1 : p(f, s.t0, 0.34, E.snap);
  const kout = p(f, s.t1 - 0.04, 0.3, E.exit);
  const dir = (m: Move) => (m === "left" ? -1 : m === "right" ? 1 : 0);
  // "left" = travels leftwards (enters from the right, leaves to the left)
  let x = 0, sc = 1, bx = 0, bu = 0;
  if (enter === "zoom") { sc *= lerp(0.72, 1, kin); bu += (1 - kin) * 14; }
  else { x += -dir(enter) * (1 - kin) * 900; bx += (1 - kin) * 60; }
  if (exit === "zoom") { sc *= lerp(1, 1.5, kout); bu += kout * 16; }
  else { x += dir(exit) * kout * 900; bx += kout * 60; }
  sc *= 1 + push * p(f, s.t0, s.t1 - s.t0, E.inOut);
  const op = Math.min(1, kin * 2.5) * (1 - kout);
  return (
    <Blur id={`b-${id}`} x={bx + bu} y={bu}>
      <div style={{ position: "absolute", inset: 0, opacity: op, transform: `translateX(${x}px) scale(${sc})`, transformOrigin: "50% 50%" }}>{children}</div>
    </Blur>
  );
};

const Center: React.FC<{ children: React.ReactNode; y?: number }> = ({ children, y = 540 }) => (
  <div style={{ position: "absolute", left: 0, width: 1920, top: y, transform: "translateY(-50%)", display: "flex", justifyContent: "center", alignItems: "center" }}>{children}</div>
);

const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 130, color = ON.ink, style }) => (
  <span style={{ fontFamily: F.sans, fontVariationSettings: "'opsz' 32", fontWeight: 600, fontSize: size, letterSpacing: "-0.05em", lineHeight: 1, color, whiteSpace: "nowrap", ...style }}>{children}</span>
);

/** pops in at time t */
const Pop: React.FC<{ t: number; children: React.ReactNode }> = ({ t, children }) => {
  const f = useCurrentFrame();
  const k = p(f, t - 0.05, 0.35, E.snap);
  return <span style={{ display: "inline-block", opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 30}px) scale(${lerp(0.85, 1, k)})` }}>{children}</span>;
};

const Card: React.FC<{ w: number; children: React.ReactNode; pad?: number }> = ({ w, children, pad = 48 }) => (
  <div style={{ width: w, background: DARK, borderRadius: 32, padding: pad, boxSizing: "border-box", boxShadow: "0 40px 90px rgba(60,20,0,0.35)" }}>{children}</div>
);

// ───────────────────────────────── shots
const PW = (i: number) => wt("pain", i);

const SimpleShot = () => (
  <Shot id="simple" enter="zoom" exit="left">
    <Center>
      <div style={{ display: "flex", gap: 36, alignItems: "baseline" }}>
        <Pop t={PW(0)}><Big>swapping</Big></Pop>
        <Pop t={PW(3)}><Big>=</Big></Pop>
        <Pop t={PW(5)}><Big color={ON.accent}>simple?</Big></Pop>
      </div>
    </Center>
  </Shot>
);

const BridgeShot = () => {
  const f = useCurrentFrame();
  const wob = 0.5 + 0.18 * Math.sin((f / FPS) * 5.5); // the transfer doesn't know where it is
  return (
    <Shot id="bridge" enter="left" exit="zoom" push={0.14}>
      <Center>
        <Card w={1040}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ width: 84, height: 84, borderRadius: 42, background: "#2A1E15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, color: C.white }}>↻</div>
            <div>
              <Big size={54} color={C.white}>Bridge transfer #48213</Big>
              <div style={{ fontFamily: F.sans, fontSize: 40, fontWeight: 500, color: "#FF9A8A", marginTop: 10 }}>Est. arrival: don’t know?</div>
            </div>
          </div>
          <div style={{ position: "relative", height: 70, marginTop: 50 }}>
            <div style={{ position: "absolute", left: 10, right: 10, top: 20, borderTop: "2px solid rgba(255,255,255,0.25)" }} />
            <div style={{ position: "absolute", left: 0, top: 11, width: 20, height: 20, borderRadius: 10, border: "2px solid rgba(255,255,255,0.5)", background: DARK }} />
            <div style={{ position: "absolute", right: 0, top: 11, width: 20, height: 20, borderRadius: 10, border: "2px solid rgba(255,255,255,0.5)", background: DARK }} />
            <div style={{ position: "absolute", left: `${wob * 100}%`, top: -6, transform: "translateX(-50%)", fontFamily: F.sans, fontSize: 40, color: C.white, background: DARK, padding: "0 12px" }}>$</div>
            <div style={{ position: "absolute", left: 0, top: 44, fontFamily: F.sans, fontSize: 26, color: C.mute }}>Your wallet</div>
            <div style={{ position: "absolute", right: 0, top: 44, fontFamily: F.sans, fontSize: 26, color: C.mute }}>Destination</div>
          </div>
        </Card>
      </Center>
    </Shot>
  );
};

const FeesShot = () => {
  const f = useCurrentFrame();
  const rows: [string, string][] = [["Bridge fee", "$18.40"], ["Gas", "$6.12"], ["Swap fee", "$9.75"]];
  const s0 = shot("fees").t0;
  return (
    <Shot id="fees" enter="zoom" exit="left" push={0.12}>
      <Center>
        <Card w={760}>
          {rows.map(([k, v], i) => {
            const a = p(f, s0 + 0.1 + i * 0.12, 0.3, E.snap);
            return (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontFamily: F.sans, fontSize: 42, color: C.ink, padding: "12px 0", opacity: a, transform: `translateX(${(1 - a) * 30}px)` }}>
                <span style={{ color: C.mute }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", margin: "18px 0 12px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: F.sans, fontSize: 48, fontWeight: 600, color: "#FF9A8A", opacity: p(f, s0 + 0.5, 0.3) }}>
            <span>Extra cost</span>
            <span>$34.27</span>
          </div>
        </Card>
      </Center>
    </Shot>
  );
};

const UnsureShot = () => {
  const s0 = shot("unsure").t0;
  return (
    <Shot id="unsure" enter="left" exit="zoom" push={0.1}>
      <Center>
        <Card w={900}>
          <Label size={18} color={C.mute}>You received</Label>
          <div style={{ marginTop: 14 }}>
            <Big size={88} color={C.white}>639,767.85</Big>
            <Big size={40} color={C.mute} style={{ marginLeft: 16 }}>USDT</Big>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", margin: "34px 0 26px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <Big size={52} color={C.white}>Best price?</Big>
            <span style={{ fontFamily: F.mono, fontSize: 44, color: "#FFB27A" }}>
              <Scramble text="645,331.16" settle={999} start={s0} seed="u" />
            </span>
          </div>
        </Card>
      </Center>
    </Shot>
  );
};

const LogoShot = () => {
  const f = useCurrentFrame();
  const k = p(f, wt("meet", 0) - 0.05, 0.5, E.snap);
  return (
    <Shot id="logo" enter="zoom" exit="left">
      <Center>
        <div style={{ transform: `scale(${lerp(0.6, 1, k)}) rotate(${(1 - k) * -8}deg)` }}>
          <Logo size={300} style={{ boxShadow: "0 40px 90px rgba(60,20,0,0.35)" }} />
        </div>
      </Center>
    </Shot>
  );
};

// the RIFT trade bar, big, with the camera moving from "have" → "want" → TRADE
const Pill: React.FC<{ x: number; w: number; text: string; tk: string; k: number }> = ({ x, w, text, tk, k }) => (
  <div style={{ position: "absolute", left: x, top: 52, width: w, height: 96, borderRadius: 18, background: C.pillBlue, border: `2px solid ${C.pillBlueBorder}`, display: "flex", alignItems: "center", gap: 18, paddingLeft: 14, boxSizing: "border-box", opacity: 0.35 + 0.65 * k }}>
    <div style={{ width: 66, height: 66, borderRadius: 33, background: "#0B0B0D", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 18, color: C.ink }}>{tk}</div>
    <span style={{ fontFamily: F.mono, fontSize: 38, color: C.ink, whiteSpace: "pre" }}>{text}</span>
  </div>
);

const PickShot = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const typed = (s: string, a: number) => s.slice(0, Math.round(p(f, a, 0.4, E.inOut) * s.length));
  const PX = 160; // bar x
  const focus = [
    { t: shot("pick").t0, x: 960, s: 1 },
    { t: EV.pickFrom, x: PX + 590, s: 1.45 },
    { t: EV.pickTo, x: PX + 1094, s: 1.45 },
    { t: EV.trade, x: PX + 1451, s: 1.5 },
    { t: EV.click + 0.25, x: 960, s: 1 },
  ];
  let fx = 960, fs = 1;
  for (let i = 1; i < focus.length; i++) {
    const k = p(f, focus[i].t - 0.15, 0.45, E.inOut);
    if (k > 0) { fx = lerp(focus[i - 1].x, focus[i].x, k); fs = lerp(focus[i - 1].s, focus[i].s, k); }
  }
  const press = p(f, EV.click - 0.05, 0.06, E.exit) * (1 - p(f, EV.click + 0.03, 0.2, E.settle));
  const cur = p(f, EV.trade + 0.05, EV.click - EV.trade - 0.1, E.inOut);
  return (
    <Shot id="pick" enter="left" exit="left">
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${960 - fx}px) scale(${fs})`, transformOrigin: `${fx}px 540px` }}>
        <div style={{ position: "absolute", left: PX, top: 440, width: 1600, height: 200, borderRadius: 60, background: DARK, boxShadow: "0 40px 90px rgba(60,20,0,0.35)" }}>
          <div style={{ position: "absolute", left: 40, top: 46, height: 108, padding: "0 30px", borderRadius: 22, background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", fontFamily: F.mono, fontSize: 60, color: C.white }}>10 BTC</div>
          <Pill x={390} w={400} text={typed("bitcoin.btc", EV.pickFrom)} tk="BTC" k={p(f, EV.pickFrom, 0.3)} />
          <div style={{ position: "absolute", left: 806, top: 74, width: 52, height: 52, borderRadius: 26, border: "1px solid rgba(255,255,255,0.2)", color: C.mute, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>→</div>
          <Pill x={874} w={440} text={typed("ethereum.usdt", EV.pickTo)} tk="USDT" k={p(f, EV.pickTo, 0.3)} />
          <div style={{ position: "absolute", left: 1336, top: 50, width: 230, height: 100, borderRadius: 999, background: press > 0.3 ? "#B85E08" : C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.mono, fontSize: 36, fontWeight: 600, color: C.white, letterSpacing: "0.04em", transform: `scale(${1 - 0.06 * press})` }}>
            TRADE →
          </div>
        </div>
        {t >= EV.trade && (
          <svg width={48} height={62} style={{ position: "absolute", left: lerp(1500, PX + 1460, cur), top: lerp(760, 520, cur), transform: `scale(${1 - 0.12 * press})`, transformOrigin: "0 0" }}>
            <path d="M2 2 L2 48 L14 36 L23 56 L31 52 L22 33 L40 33 Z" fill={C.white} stroke="#000" strokeWidth={2.5} strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </Shot>
  );
};

const RouteShot = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const N = [
    { x: 330, name: "Bitcoin", tk: "BTC" },
    { x: 750, name: "Hyperliquid", tk: "BTC→USDC" },
    { x: 1170, name: "Ethereum", tk: "USDC" },
    { x: 1590, name: "USDT", tk: "Ethereum" },
  ];
  const venues = ["UNIT", "CCTP", "COW SWAP"];
  const Y = 560;
  const hop = p(f, EV.hop0, EV.result - EV.hop0 - 0.15, E.inOut) * 3;
  const dx = hop >= 3 ? N[3].x : lerp(N[Math.floor(hop)].x, N[Math.min(3, Math.floor(hop) + 1)].x, hop - Math.floor(hop));
  const res = p(f, EV.result, 0.45, E.snap);
  const ven = p(f, EV.venues - 0.05, 0.4, E.snap);
  return (
    <Shot id="route" enter="left" exit="right">
      <div style={{ position: "absolute", left: 120, top: 330, width: 1680, height: 440, borderRadius: 40, background: DARK, boxShadow: "0 40px 90px rgba(60,20,0,0.35)" }} />
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {/* faint alternatives, dimming as the best route is found */}
        {[-120, 120].map((d) => (
          <path key={d} d={`M${N[0].x} ${Y} C ${N[1].x} ${Y + d}, ${N[2].x} ${Y + d}, ${N[3].x} ${Y}`} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2} strokeDasharray="6 10" opacity={1 - hop / 3} />
        ))}
        <line x1={N[0].x} x2={N[3].x} y1={Y} y2={Y} stroke="rgba(255,255,255,0.25)" strokeWidth={3} />
        <line x1={N[0].x} x2={dx} y1={Y} y2={Y} stroke={C.orange} strokeWidth={6} />
      </svg>
      {venues.map((v, i) => (
        <div key={v} style={{ position: "absolute", left: (N[i].x + N[i + 1].x) / 2, top: Y - 70, transform: "translateX(-50%)", fontFamily: F.mono, fontSize: 24, letterSpacing: "0.12em", color: hop > i ? C.orangeHi : C.mute, border: `1.5px solid ${hop > i ? C.orange : "rgba(255,255,255,0.2)"}`, borderRadius: 999, padding: "6px 16px", background: DARK }}>{v}</div>
      ))}
      {N.map((n, i) => (
        <div key={n.name} style={{ position: "absolute", left: n.x, top: Y, transform: "translate(-50%,-50%)", textAlign: "center" }}>
          <div style={{ width: 44, height: 44, borderRadius: 22, margin: "0 auto", background: DARK, border: `4px solid ${hop >= i ? C.orange : "rgba(255,255,255,0.6)"}` }} />
          <div style={{ position: "absolute", left: "50%", top: 64, transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
            <Big size={40} color={C.white}>{n.name}</Big>
          </div>
        </div>
      ))}
      {t >= EV.hop0 && hop < 3 && <div style={{ position: "absolute", left: dx - 16, top: Y - 16, width: 32, height: 32, borderRadius: 16, background: C.white }} />}
      {/* "20+ venues" above the bar */}
      <div style={{ position: "absolute", left: 0, width: 1920, top: 170, textAlign: "center", opacity: ven, transform: `translateY(${(1 - ven) * 30}px)` }}>
        <Big size={110}>20+ <span style={{ color: ON.accent }}>venues</span></Big>
      </div>
      {/* result card */}
      <div style={{ position: "absolute", inset: 0, opacity: res, transform: `scale(${lerp(0.8, 1, res)})` }}>
        <Center>
          <div style={{ width: 760, background: "#1B130C", borderRadius: 32, padding: 44, boxShadow: "0 40px 90px rgba(0,0,0,0.45)", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontFamily: F.sans, fontSize: 30, fontWeight: 600, color: C.green }}>✓ Best price found</div>
            <div style={{ marginTop: 14 }}>
              <Big size={84} color={C.white}>645,331.16</Big>
              <Big size={38} color={C.mute} style={{ marginLeft: 14 }}>USDT</Big>
            </div>
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", margin: "26px 60px 0" }} />
            <div style={{ marginTop: 18, fontFamily: F.mono, fontSize: 20, letterSpacing: "0.2em", color: C.mute }}>ONE CLICK</div>
          </div>
        </Center>
      </div>
    </Shot>
  );
};

const NosShot = () => {
  const f = useCurrentFrame();
  const items: [string, string][] = [["No", "approvals"], ["Zero", "added fees"], ["No", "guesswork"]];
  return (
    <Shot id="nos" enter="zoom" exit="left">
      {items.map(([a, b], i) => {
        const t0 = EV.nos[i];
        const t1 = i < 2 ? EV.nos[i + 1] : shot("nos").t1 + 0.4;
        const k = p(f, t0 - 0.08, 0.32, E.snap);
        const o = p(f, t1 - 0.12, 0.22, E.exit);
        if (f / FPS < t0 - 0.1 || f / FPS > t1 + 0.12) return null;
        const d = i % 2 ? -1 : 1;
        return (
          <Blur key={a + b} id={`nos${i}`} x={(1 - k) * 40 + o * 40}>
            <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, k * 2) * (1 - o), transform: `translateX(${d * (1 - k) * 500 - d * o * 500}px)` }}>
              <Center>
                <Big size={170}>
                  {a} <span style={{ color: ON.accent }}>{b}</span>
                </Big>
              </Center>
            </div>
          </Blur>
        );
      })}
    </Shot>
  );
};

const CloseShot = () => {
  const f = useCurrentFrame();
  const r = p(f, EV.closeLogo - 0.05, 0.5, E.snap);
  const a = p(f, EV.best - 0.05, 0.35, E.snap) * (1 - p(f, EV.oneClick - 0.15, 0.2, E.exit));
  const b = p(f, EV.oneClick - 0.05, 0.35, E.snap);
  return (
    <Shot id="close" enter="zoom" exit="zoom">
      <Center y={430}>
        <Big size={260} style={{ opacity: Math.min(1, r * 2), transform: `scale(${lerp(1.4, 1, r)})`, display: "inline-block" }}>
          Rift<span style={{ color: ON.accent }}>.</span>
        </Big>
      </Center>
      <Center y={680}>
        <div style={{ position: "relative", width: 1200, height: 140 }}>
          <div style={{ position: "absolute", inset: 0, textAlign: "center", opacity: a, transform: `translateX(${(1 - a) * -120}px)` }}>
            <Big size={120}>Best <span style={{ color: ON.accent }}>price</span></Big>
          </div>
          <div style={{ position: "absolute", inset: 0, textAlign: "center", opacity: b, transform: `translateX(${(1 - b) * 120}px)` }}>
            <Big size={120}>One <span style={{ color: ON.accent }}>click.</span></Big>
          </div>
        </div>
      </Center>
    </Shot>
  );
};

const CardShot = () => {
  const f = useCurrentFrame();
  const s = shot("card");
  const k = p(f, s.t0, 0.6, E.snap);
  const h = p(f, s.t0 + 0.35, 0.5, E.snap);
  const fade = p(f, s.t1 - 0.45, 0.45, E.inOut);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - fade }}>
      <Center y={450}>
        <Img src={staticFile("pfp.jpg")} style={{ width: 280, height: 280, borderRadius: 140, border: `4px solid ${ON.ink}`, opacity: k, transform: `scale(${lerp(0.7, 1, k)})` }} />
      </Center>
      <Center y={680}>
        <div style={{ textAlign: "center", opacity: h, transform: `translateY(${(1 - h) * 20}px)` }}>
          <Big size={84}>{HANDLE}</Big>
          <div style={{ marginTop: 18 }}>
            <Label size={22} color={ON.soft} style={{ letterSpacing: "0.32em" }}>
              <span style={{ color: ON.accent }}>///</span> Weekly Spotlight
            </Label>
          </div>
        </div>
      </Center>
    </div>
  );
};

export const Spot: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([document.fonts.load("600 40px InterV"), document.fonts.load("400 20px Sometype")]).then(() => document.fonts.ready).then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <FontFaces />
      <SimpleShot />
      <BridgeShot />
      <FeesShot />
      <UnsureShot />
      <LogoShot />
      <PickShot />
      <RouteShot />
      <NosShot />
      <CloseShot />
      <CardShot />
    </AbsoluteFill>
  );
};
