import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import EV from "../events.json";
import { BG, C, E, F, FPS, ON, lerp, p } from "../theme";
import { FontFaces } from "../ui";
import { Big, Blur, Card, Close, Fees, Marquee, Phone, RiftUI, VenueLogo } from "./Hunt";

// "The errand" — the creator's own story: the stall you felt bad leaving, the younger ones who just
// walk to the cheapest one, and Rift doing that with your money.
const DARK = "#120C07";
const sec = (f: number) => f / FPS;

const STREET_Y = 760;
const HOME_X = 150;
// her stall is closest to home and dearest; the cheapest is the furthest walk (illustrative prices)
const STALLS = [
  { x: 560, price: "₦1,200", venue: "unit" },
  { x: 940, price: "₦1,150", venue: "hyperliquid" },
  { x: 1320, price: "₦1,100", venue: "cctp" },
  { x: 1700, price: "₦950", venue: "cowswap" },
];
const SW = 300, SH = 330;
const REASONS = [
  { t: 0, txt: "her age", dx: -330, dy: -40, r: -6 },
  { t: 1, txt: "her bills", dx: -270, dy: 130, r: 5 },
  { t: 2, txt: "the stress of getting it here", dx: -60, dy: -150, r: 3 },
  { t: 3, txt: "it's only small money", dx: -300, dy: 290, r: -4 },
];

const Stall: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const t = sec(f);
  const s = STALLS[i];
  const k = i === 0 ? p(f, EV.herStall - 0.15, 0.6, E.snap) : p(f, EV.others - 0.05 + (i - 1) * 0.12, 0.45, E.snap);
  const crossed = i === 0 ? p(f, EV.pass, 0.35, E.snap) : 0;
  const cheapest = i === 3 ? p(f, EV.cheap, 0.4, E.snap) : 0;
  const bought = i === 3 ? p(f, EV.buy, 0.35, E.snap) : 0;
  const flip = p(f, EV.morph + i * 0.09, 0.5, E.inOut); // stall → Rift venue
  const face = flip < 0.5;
  return (
    <div style={{ position: "absolute", left: s.x - SW / 2, top: STREET_Y - SH - 20, width: SW, height: SH, opacity: k, transform: `translateY(${(1 - k) * 40}px) perspective(1200px) rotateY(${flip * 180}deg)` }}>
      <div style={{ position: "absolute", inset: 0, transform: face ? "none" : "rotateY(180deg)", borderRadius: 26, overflow: "hidden", background: DARK, boxShadow: "0 40px 80px rgba(70,25,0,0.35)", outline: cheapest > 0.5 && face ? `4px solid ${C.white}` : "none" }}>
        {face ? (
          <>
            {/* awning */}
            <div style={{ height: 66, background: `repeating-linear-gradient(90deg, ${C.orange} 0 38px, #FAF1E4 38px 76px)` }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 66, height: 18, background: "rgba(0,0,0,0.25)" }} />
            <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center" }}>
              <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 66, letterSpacing: "-0.03em", color: C.white, position: "relative", display: "inline-block" }}>
                {s.price}
                <div style={{ position: "absolute", left: -10, right: -10, top: "52%", height: 7, borderRadius: 4, background: "#FF6B5A", transform: `scaleX(${crossed})`, transformOrigin: "0 50%" }} />
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 24, color: C.mute, marginTop: 10 }}>{i === 0 ? "her stall" : "a loaf"}</div>
            </div>
            {i === 3 && (
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 26, textAlign: "center", opacity: cheapest, fontFamily: F.mono, fontSize: 20, letterSpacing: "0.2em", color: bought > 0.5 ? C.green : C.white }}>{bought > 0.5 ? "✓ BOUGHT" : "CHEAPEST"}</div>
            )}
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <VenueLogo id={s.venue} scale={s.venue === "cowswap" ? 0.95 : s.venue === "unit" ? 1.15 : 1.3} />
            <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.2em", color: C.mute }}>VENUE</div>
          </div>
        )}
      </div>
    </div>
  );
};

/** "As a young boy…" — the photo, framed, slow push-in; slides away as her stall arrives. */
const Boy: React.FC = () => {
  const f = useCurrentFrame();
  const t = sec(f);
  if (t > EV.herStall + 0.6) return null;
  const k = p(f, 0.0, 0.7, E.snap);
  const o = p(f, EV.herStall - 0.25, 0.5, E.inOut);
  const push = lerp(1, 1.07, p(f, 0, EV.herStall, E.inOut));
  return (
    <Blur id="boy" x={o * 40}>
      <div style={{ position: "absolute", inset: 0, opacity: Math.min(1, k * 1.5) * (1 - o), transform: `translateX(${-o * 700}px) scale(${lerp(0.92, 1, k)})` }}>
        <div style={{ position: "absolute", left: (1920 - 1020) / 2, top: (1080 - 680) / 2, width: 1020, height: 680, borderRadius: 34, overflow: "hidden", boxShadow: "0 50px 100px rgba(70,25,0,0.4)" }}>
          <Img src={staticFile("boy.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${push})`, transformOrigin: "50% 35%" }} />
        </div>
      </div>
    </Blur>
  );
};

const Market: React.FC = () => {
  const f = useCurrentFrame();
  const t = sec(f);
  if (t > EV.sweep + 0.6) return null;
  // camera: tight on her stall → whole row → back on her (excuses) → the street → follow the errand
  const keys = [
    { t: 0, x: STALLS[0].x, y: 560, s: 2.1 },
    { t: EV.others, x: 1130, y: 600, s: 1.0 },
    { t: EV.reasons[0] - 0.2, x: STALLS[0].x - 90, y: 540, s: 1.4 },
    { t: EV.street, x: 960, y: 600, s: 0.92 },
  ];
  let cx = keys[0].x, cy = keys[0].y, cs = keys[0].s;
  for (let i = 1; i < keys.length; i++) {
    const k = p(f, keys[i].t - 0.25, 0.8, E.inOut);
    if (k > 0) { cx = lerp(keys[i - 1].x, keys[i].x, k); cy = lerp(keys[i - 1].y, keys[i].y, k); cs = lerp(keys[i - 1].s, keys[i].s, k); }
  }
  const out = p(f, EV.sweep, 0.45, E.exit);
  const streetK = p(f, EV.street - 0.2, 0.7, E.inOut);
  // the errand: home → past her stall → (beat) → the long walk to the cheapest
  const r1 = p(f, EV.runner + 0.35, EV.pass + 0.1 - EV.runner - 0.35, E.inOut); // sets off on "errands", passes her on "sold higher"
  const r2 = p(f, EV.walk, EV.buy - EV.walk + 0.1, E.inOut);
  const runX = lerp(lerp(HOME_X, STALLS[0].x + 120, r1), STALLS[3].x, r2);
  const runOn = p(f, EV.runner - 0.05, 0.35, E.snap);
  const trail = t >= EV.runner;
  const morphK = p(f, EV.morph, 0.6, E.inOut);
  return (
    <Blur id="market" x={out * 70}>
      <div style={{ position: "absolute", inset: 0, opacity: 1 - out, transform: `translate(${960 - cx - out * 1200}px, ${540 - cy}px) scale(${cs})`, transformOrigin: `${cx}px ${cy}px` }}>
        {/* the street */}
        <div style={{ position: "absolute", left: 60, width: 1800 * Math.max(streetK, 0.0001), top: STREET_Y, height: 6, borderRadius: 3, background: ON.ink, opacity: streetK }} />
        <div style={{ position: "absolute", left: 60, width: 1800, top: STREET_Y + 30, display: "flex", justifyContent: "space-between", opacity: morphK }}>
          {/* street becomes chains */}
          {["Bitcoin", "Hyperliquid", "Ethereum"].map((c) => <Big key={c} size={44}>{c}</Big>)}
        </div>
        {/* home */}
        <div style={{ position: "absolute", left: HOME_X - 26, top: STREET_Y - 23, width: 52, height: 52, borderRadius: 14, background: ON.ink, opacity: streetK * (1 - morphK) }} />
        <div style={{ position: "absolute", left: HOME_X - 60, width: 120, top: STREET_Y + 40, textAlign: "center", fontFamily: F.sans, fontWeight: 600, fontSize: 30, color: ON.ink, opacity: streetK * (1 - morphK) }}>home</div>
        {STALLS.map((_, i) => <Stall key={i} i={i} f={f} />)}
        {/* the runner — your younger one, later the route */}
        {trail && <div style={{ position: "absolute", left: HOME_X, top: STREET_Y - 3, width: Math.max(0, runX - HOME_X), height: 12, borderRadius: 6, background: C.white, opacity: runOn }} />}
        {trail && (
          <div style={{ position: "absolute", left: runX - 22, top: STREET_Y - 19, width: 44, height: 44, borderRadius: 22, background: C.white, border: `6px solid ${ON.ink}`, boxSizing: "border-box", opacity: runOn, transform: `scale(${lerp(0.4, 1, runOn)})` }} />
        )}
        {/* the excuses — notes around her stall */}
        {REASONS.map((r, j) => {
          const k = p(f, EV.reasons[r.t] - 0.06, 0.35, E.snap);
          const gone = p(f, EV.excuses + j * 0.06, 0.45, E.exit);
          if (t < EV.reasons[r.t] - 0.1 || t > EV.excuses + 1) return null;
          return (
            <div key={r.txt} style={{ position: "absolute", left: STALLS[0].x + r.dx, top: 420 + r.dy, transform: `translate(-50%,-50%) rotate(${r.r + gone * 25}deg) translateY(${gone * 400}px) scale(${lerp(0.6, 1, k)})`, opacity: k * (1 - gone), background: "#FFF6E6", padding: "16px 24px", borderRadius: 8, boxShadow: "0 18px 30px rgba(70,25,0,0.3)", fontFamily: F.sans, fontWeight: 600, fontSize: 34, letterSpacing: "-0.02em", color: "#1A1208", whiteSpace: "nowrap" }}>
              {r.txt}
            </div>
          );
        })}
      </div>
    </Blur>
  );
};

export const Errand: React.FC = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([document.fonts.load("600 40px InterV"), document.fonts.load("400 20px Sometype")]).then(() => document.fonts.ready).then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <FontFaces />
      <Boy />
      <Market />
      <Marquee />
      <RiftUI />
      <Phone />
      <Fees />
      <Close />
      <Card />
    </AbsoluteFill>
  );
};
