import React from "react";
import { useCurrentFrame } from "remotion";
import { CHAINS, LAST_LEG, PATHS_PRICED, QUOTE, ROUTE, SINGLE_HOP, fmt } from "../data";
import EV from "../events.json";
import { BRIDGES, BRIDGE_X, FAN, FAN_X, G_Y, RAILS, STATIONS, W_Y, bridgePath, fanPath, pointAt, polyLen, railPath, toD } from "../geometry";
import { C, E, F, FPS, lerp, p, wt } from "../theme";
import { Blocks, Key, Label, Scramble } from "../ui";

const RW = (i: number) => wt("routing", i);
const RL = (i: number) => wt("reliability", i);

// ---- shared state helpers -------------------------------------------------
const morph = (f: number) => p(f, EV.pullback, 0.8, E.inOut); // widget → graph
const graphOn = (f: number) => p(f, EV.pullback + 0.1, 0.6, E.settle) * (1 - p(f, EV.cuts[3] - 0.3, 0.3, E.exit));
const lockK = (f: number) => p(f, EV.lock, 0.25, E.snap);
const loserFade = (f: number) => p(f, EV.lock - 0.55, 0.5, E.inOut); // losers fade into the lock
const failK = (f: number) => (f / FPS >= EV.fail && f / FPS < EV.relock ? 1 : 0);
const relockK = (f: number) => p(f, EV.relock, 0.25, E.snap);

const COW = FAN.find((x) => x.venue === "COW SWAP")!;
const VEL = FAN.find((x) => x.venue === "VELORA")!;

// delivery execution_cost from the same quote (USDT)
const DELIVERY_COST = 0.094769;
/** Camera: push in on the venue fan while it re-quotes, snap back on the lock;
 *  push hard into the failing hop on "down", ease out when the route relocks. */
export const camera = (f: number) => {
  const z1 = p(f, EV.requote[0], 1.0, E.inOut) * (1 - p(f, EV.lock - 0.04, 0.35, E.snap));
  const z2 = p(f, EV.fail - 0.06, 0.3, E.snap) * (1 - p(f, EV.relock + 0.05, 0.7, E.settle));
  const s = 1 + 0.14 * z1 + 0.38 * z2;
  const fx = z2 > 0.001 ? 1330 : 1380;
  const fy = z2 > 0.001 ? 548 : 560;
  return { transform: `scale(${s})`, transformOrigin: `${fx}px ${fy}px` };
};

const lastLegQuote = (v: string) => LAST_LEG.find((x) => x.venue === v)!.out;

// red flash: on/off twice after the failure
const flash = (f: number) => {
  const t = f / FPS - EV.fail;
  if (t < 0 || t > 0.5) return 0;
  return Math.floor(t / 0.0834) % 2 === 0 ? 1 : 0.35;
};

const Pill: React.FC<{
  x: number;
  y: number;
  name: string;
  quote?: string | null;
  quoteBelow?: boolean;
  quoteAbove?: boolean;
  state: "idle" | "lock" | "fail" | "dim";
  op?: number;
  settle: number;
  scale?: number;
  seed: string;
}> = ({ x, y, name, quote, quoteBelow = true, quoteAbove = false, state, op = 1, settle, scale = 1, seed }) => {
  const border =
    state === "lock" ? C.orange : state === "fail" ? C.red : "rgba(255,255,255,0.14)";
  const color = state === "lock" ? C.orangeHi : state === "fail" ? C.red : C.ink;
  const bg = state === "lock" ? "#22150A" : state === "fail" ? "#2A1011" : "#121214";
  const q = quote === undefined ? null : quote === null ? "NO QUOTE" : quote;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${scale})`, opacity: op }}>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 17,
          letterSpacing: "0.12em",
          color,
          background: bg,
          border: `1.5px solid ${border}`,
          borderRadius: 999,
          padding: "5px 14px",
          whiteSpace: "nowrap",
          display: "flex",
          gap: 14,
        }}
      >
        {name}
        {q && !quoteBelow && (
          <span style={{ color: state === "lock" ? C.glow : C.mute, letterSpacing: "0" }}>
            <Scramble text={q} settle={settle} start={EV.requote[0]} seed={seed} />
          </span>
        )}
      </div>
      {q && quoteBelow && (
        <div style={{ position: "absolute", left: "50%", top: quoteAbove ? -30 : 40, transform: "translateX(-50%)", fontFamily: F.mono, fontSize: 15, color: state === "lock" ? C.glow : C.mute, whiteSpace: "nowrap" }}>
          <Scramble text={q} settle={settle} start={EV.requote[0]} seed={seed} />
        </div>
      )}
    </div>
  );
};

/** The RIFT row's route: first the result row in the swap UI, then the graph's main line. */
export const Spine: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < EV.results || t > EV.cuts[3] + 0.1) return null;
  const m = morph(f);
  const lk = lockK(f);
  const exit = p(f, EV.cuts[3] - 0.3, 0.3, E.exit);
  const resK = p(f, EV.results, 0.55, E.snap);
  const jitter = t >= EV.fail && t < EV.fail + 0.06 ? 7 : t >= EV.fail + 0.06 && t < EV.fail + 0.1 ? -4 : 0;

  const S = STATIONS.map((s, i) => ({
    ...s,
    x: lerp(s.wx, s.gx, m),
    y: lerp(W_Y, G_Y, m),
    k: p(f, EV.results + 0.12 + i * 0.07, 0.45, E.snap),
  }));

  // edges: widget straight lines → graph polylines
  const edgePts = (i: number): [number, number][] => {
    const a = S[i], b = S[i + 1];
    if (i < 3) return [[a.x, a.y], [b.x, b.y]];
    const g = fanPath(COW.dy);
    const w: [number, number][] = [
      [STATIONS[3].wx, W_Y],
      [lerp(STATIONS[3].wx, STATIONS[4].wx, 0.3), W_Y],
      [lerp(STATIONS[3].wx, STATIONS[4].wx, 0.7), W_Y],
      [STATIONS[4].wx, W_Y],
    ];
    return w.map((q, j) => [lerp(q[0], g[j][0], m), lerp(q[1], g[j][1], m)]);
  };

  const pillW = [
    [(STATIONS[0].wx + STATIONS[1].wx) / 2, W_Y],
    [(STATIONS[1].wx + STATIONS[2].wx) / 2, W_Y],
    [(STATIONS[2].wx + STATIONS[3].wx) / 2, W_Y],
    [(STATIONS[3].wx + STATIONS[4].wx) / 2, W_Y],
  ];
  const pillG = [
    [(STATIONS[0].gx + STATIONS[1].gx) / 2, G_Y],
    [(STATIONS[1].gx + STATIONS[2].gx) / 2, G_Y],
    [BRIDGE_X, G_Y],
    [FAN_X, G_Y + COW.dy],
  ];

  const settle = (i: number) => EV.requote[0] + 0.5 + i * 0.09;
  const fl = flash(f);

  return (
    <div style={{ position: "absolute", inset: 0, clipPath: t >= EV.pullback + 0.4 ? "inset(150px 0 125px 0)" : undefined }}>
    <div style={{ position: "absolute", inset: 0, opacity: (1 - exit) * resK, transform: `translateX(${jitter}px) ${camera(f).transform}`, transformOrigin: camera(f).transformOrigin }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2, 3].map((i) => {
          const pts = edgePts(i);
          const failing = i === 3 && t >= EV.fail;
          const stroke = failing
            ? fl
              ? C.red
              : "rgba(239,68,68,0.35)"
            : lk > 0.5
            ? C.orange
            : `rgba(255,255,255,${lerp(0.28, 0.42, m)})`;
          const k = p(f, EV.results + 0.2 + i * 0.08, 0.5, E.settle);
          const len = polyLen(pts);
          return (
            <path
              key={i}
              d={toD(pts)}
              fill="none"
              stroke={stroke}
              strokeWidth={lerp(1.5, 2, m) + (lk > 0.5 && !failing ? 1.5 : 0)}
              strokeDasharray={m < 0.5 ? "2 6" : failing && !fl ? "6 8" : `${len}`}
              strokeDashoffset={m < 0.5 ? 0 : (1 - k) * len}
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
      {/* stations */}
      {S.map((s, i) => {
        const r = lerp(36, 15, m);
        const lit = lk > 0.5 || (t >= EV.relock && relockK(f) > 0.5);
        return (
          <div key={i} style={{ position: "absolute", left: s.x - r, top: s.y - r, opacity: s.k }}>
            <div
              style={{
                width: r * 2,
                height: r * 2,
                borderRadius: r,
                background: m < 0.5 ? "#0B0B0D" : C.bg,
                border: `${lerp(1.5, 3, m)}px solid ${lit && m > 0.5 ? C.orange : m < 0.5 ? "rgba(255,255,255,0.14)" : C.white}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: F.mono,
                fontSize: 16,
                color: C.ink,
              }}
            >
              <span style={{ opacity: 1 - m * 2 }}>{s.ticker}</span>
            </div>
            <div
              style={{
                position: "absolute",
                left: r,
                top: r * 2 + lerp(10, 18, m),
                transform: "translateX(-50%)",
                textAlign: "center",
                whiteSpace: "nowrap",
                fontFamily: F.mono,
                lineHeight: 1.35,
              }}
            >
              <div style={{ fontSize: lerp(12, 17, m), letterSpacing: "0.16em", color: lerp(0, 1, m) > 0.5 ? C.ink : C.dim }}>{s.chain}</div>
              <div style={{ fontSize: 15, color: C.mute, opacity: m }}>{s.ticker}</div>
            </div>
          </div>
        );
      })}
      {/* venue pills on the winning route */}
      {ROUTE.map((r, i) => {
        const x = lerp(pillW[i][0], pillG[i][0], m);
        const y = lerp(pillW[i][1], pillG[i][1], m);
        const k = p(f, EV.results + 0.2 + i * 0.08, 0.45, E.snap);
        const failing = i === 3 && t >= EV.fail;
        const state = failing ? (t < EV.relock ? "fail" : "dim") : lk > 0.5 ? "lock" : "idle";
        const q = i === 0 ? "9.99997056" : i === 3 ? fmt(lastLegQuote("COW SWAP")!) : r.out.split(" ")[0];
        return (
          <React.Fragment key={r.venue}>
            <Pill
              x={x}
              y={y}
              name={r.venue}
              quote={m > 0.4 ? q : undefined}
              state={state as any}
              op={k * (failing && t >= EV.relock ? 0.35 : 1)}
              settle={settle(i)}
              seed={"m" + i}
              quoteAbove={i < 3}
              scale={lerp(0.88, 1, m)}
            />
          </React.Fragment>
        );
      })}
    </div>
    </div>
  );
};


export const LEGEND_X = (i: number) => 380 + i * 166;
export const LEGEND_Y = 262;

export const Graph: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  if (t < EV.pullback - 0.05 || t > EV.cuts[3] + 0.05) return null;
  const on = graphOn(f);
  const m = morph(f);
  const lf = loserFade(f);
  const loser = 1 - 0.78 * lf;
  const frameK = p(f, EV.pullback + 0.15, 0.9, E.inOut);
  const frameLen = 2 * (1400 + 770);

  // ---- order execution ---------------------------------------------------
  const hopPts = (i: number): [number, number][] => {
    const s = STATIONS;
    if (i < 3) return [[s[i].gx, G_Y], [s[i + 1].gx, G_Y]];
    return fanPath(COW.dy);
  };
  let dot: [number, number] | null = null;
  let dotColor = C.orange;
  let legsDone = 0;
  if (t >= EV.funded && t < EV.hops[0][0]) dot = [STATIONS[0].gx, G_Y];
  EV.hops.forEach(([a, b], i) => {
    if (t >= a) {
      dot = pointAt(hopPts(i), p(f, a, b - a, E.travel));
      legsDone = i + p(f, a, b - a, E.travel);
    }
  });
  const failAt = 0.25; // stop just short of the venue pill
  if (t >= EV.hops[2][1]) {
    // leg 4 via CoW Swap → fails at the venue
    const k = p(f, EV.hops[2][1] + 0.02, EV.fail - EV.hops[2][1] - 0.02, E.travel);
    dot = pointAt(hopPts(3), k * failAt);
    legsDone = 3 + k * 0.4;
  }
  if (t >= EV.fail) {
    dotColor = flash(f) ? C.red : "rgba(239,68,68,0.7)";
  }
  if (t >= EV.relock) {
    const back = p(f, EV.relock, 0.22, E.snap);
    const from = pointAt(hopPts(3), failAt);
    dot = [lerp(from[0], STATIONS[3].gx, back), lerp(from[1], G_Y, back)];
    dotColor = C.orange;
    legsDone = 3;
  }
  if (t >= EV.resume[0]) {
    const k = p(f, EV.resume[0], EV.resume[1] - EV.resume[0], E.travel);
    dot = pointAt(fanPath(VEL.dy), k);
    legsDone = 3 + k;
  }
  const outPts: [number, number][] = [
    [STATIONS[4].gx, G_Y],
    [1770, G_Y],
  ];
  if (t >= EV.out[0]) dot = pointAt(outPts, p(f, EV.out[0], EV.out[1] - EV.out[0], E.travel));
  if (t >= EV.out[1]) dot = null;

  const status =
    t < EV.funded ? "AWAITING_DEPOSIT" : t < EV.hops[0][0] ? "FUNDED" : t < EV.fail ? "EXECUTING" : t < EV.relock ? "LEG 4 VENUE DOWN (SIMULATED) · RETRYING" : t < EV.delivered ? "EXECUTING" : "DELIVERED";
  const statusColor = status.includes("RETRY") ? C.red : status === "DELIVERED" ? C.green : C.ink;
  const statusOn = p(f, EV.lock + 0.3, 0.4);

  const delivered = t >= EV.delivered;
  const outValue = delivered ? fmt(lastLegQuote("VELORA")! - DELIVERY_COST) : fmt(QUOTE.out);

  // deposit address card
  const dep = p(f, RL(0), 0.5, E.snap);
  const ADDR = "bc1qm4x8r0v6c9tz2h7l5w3n8sd6fy0ke4jq9p2a7u";
  const addrShown = ADDR.slice(0, Math.round(p(f, EV.deposit[0], EV.deposit[1] - EV.deposit[0], E.inOut) * ADDR.length));

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: 0, clipPath: "inset(150px 0 125px 0)" }}>
      <div style={{ position: "absolute", inset: 0, opacity: on, ...camera(f) }}>
        {/* engine frame (from the docs' route diagram) */}
        <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <rect
            x={260}
            y={170}
            width={1400}
            height={770}
            rx={36}
            fill="rgba(8,5,3,0.78)"
            stroke="rgba(232,124,18,0.55)"
            strokeWidth={1.5}
            strokeDasharray={frameLen}
            strokeDashoffset={(1 - frameK) * frameLen}
          />
          <path d="M630 170 L1290 170 L1262 222 L658 222 Z" fill="#0B0704" stroke="rgba(232,124,18,0.55)" strokeWidth={1.5} opacity={frameK} />
          {/* ports on the frame edges */}
          {[-60, 0, 60].map((d) => (
            <g key={d} opacity={frameK}>
              <line x1={240} x2={260} y1={G_Y + d} y2={G_Y + d} stroke="rgba(232,124,18,0.55)" strokeWidth={1.5} />
              <line x1={1660} x2={1680} y1={G_Y + d} y2={G_Y + d} stroke="rgba(232,124,18,0.55)" strokeWidth={1.5} />
            </g>
          ))}
          {/* input / output arrows */}
          <g opacity={p(f, EV.pullback + 0.4, 0.5)}>
            <line x1={196} x2={232} y1={G_Y} y2={G_Y} stroke={C.mute} strokeWidth={1.5} />
            <path d={`M226 ${G_Y - 6} L233 ${G_Y} L226 ${G_Y + 6}`} fill="none" stroke={C.mute} strokeWidth={1.5} />
            <line x1={1688} x2={1722} y1={G_Y} y2={G_Y} stroke={C.mute} strokeWidth={1.5} />
            <path d={`M1716 ${G_Y - 6} L1723 ${G_Y} L1716 ${G_Y + 6}`} fill="none" stroke={C.mute} strokeWidth={1.5} />
          </g>

          {/* candidate routes: bridges via other chains */}
          {BRIDGES.map((b, i) => {
            const pts = bridgePath(b.y);
            const len = polyLen(pts);
            const k = p(f, EV.chains + 0.05 + i * 0.06, 0.6, E.settle);
            return <path key={b.chain} d={toD(pts)} fill="none" stroke={`rgba(255,255,255,${0.3 * loser})`} strokeWidth={1.5} strokeDasharray={len} strokeDashoffset={(1 - k) * len} strokeLinejoin="round" />;
          })}
          {/* last-leg venue fan (CoW Swap's edge lives in the Spine) */}
          {FAN.filter((x) => x.venue !== "COW SWAP").map((v, i) => {
            const pts = fanPath(v.dy);
            const len = polyLen(pts);
            const k = p(f, EV.venues + 0.08 + i * 0.05, 0.55, E.settle);
            const isVel = v.venue === "VELORA";
            const scanI = ["VELORA", "UNISWAP", "NORDSTERN", "METRIC"].indexOf(v.venue);
            const scan = scanI >= 0 && t >= EV.scan[scanI] && t < EV.scan[scanI] + 0.1;
            const rl = isVel && t >= EV.relock && relockK(f) > 0.5;
            const stroke = rl ? C.orange : scan ? C.white : `rgba(255,255,255,${0.3 * loser})`;
            return <path key={v.venue} d={toD(pts)} fill="none" stroke={stroke} strokeWidth={rl ? 3.5 : 1.5} strokeDasharray={len} strokeDashoffset={(1 - k) * len} strokeLinejoin="round" />;
          })}
          {/* single-hop candidates */}
          {RAILS.map((r, i) => {
            const pts = railPath(r.y, i);
            const len = polyLen(pts);
            const k = p(f, EV.venues + 0.3 + i * 0.06, 0.7, E.settle);
            return <path key={r.venue} d={toD(pts)} fill="none" stroke={`rgba(255,255,255,${0.22 * loser})`} strokeWidth={1.5} strokeDasharray={len} strokeDashoffset={(1 - k) * len} strokeLinejoin="round" />;
          })}
          {/* output leg */}
          {t >= EV.out[0] && <line x1={STATIONS[4].gx} x2={lerp(STATIONS[4].gx, 1770, p(f, EV.out[0], 0.4, E.travel))} y1={G_Y} y2={G_Y} stroke={C.orange} strokeWidth={3.5} />}
        </svg>

        <Label size={17} color={C.orangeHi} style={{ position: "absolute", left: 0, width: 1920, top: 184, textAlign: "center", letterSpacing: "0.38em", opacity: frameK }}>
          Multichain execution engine
        </Label>
        <Label size={14} style={{ position: "absolute", left: 300, top: 190, opacity: p(f, EV.venues, 0.4) }}>
          Routing across 20+ venues
        </Label>
        <Label size={14} style={{ position: "absolute", right: 300, top: 190, textAlign: "right", opacity: p(f, EV.requote[0], 0.4) }}>
          {PATHS_PRICED} paths priced
        </Label>

        {/* chain legend — the 8 chains from the docs */}
        {CHAINS.map((c, i) => {
          const k = p(f, EV.chains + i * 0.045, 0.4, E.snap);
          return (
            <div
              key={c}
              style={{
                position: "absolute",
                left: LEGEND_X(i),
                top: LEGEND_Y,
                transform: `translate(-50%,-50%) translateY(${(1 - k) * 10}px)`,
                opacity: k,
                fontFamily: F.mono,
                fontSize: 15,
                letterSpacing: "0.16em",
                color: k > 0.5 ? C.ink : C.dim,
                border: `1px solid ${k > 0.5 ? "rgba(255,255,255,0.22)" : C.lineSoft}`,
                borderRadius: 6,
                padding: "6px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {c}
            </div>
          );
        })}

        {/* bridge chain stations */}
        {BRIDGES.map((b, i) => {
          const k = p(f, EV.chains + 0.15 + i * 0.06, 0.45, E.snap);
          const above = b.y < G_Y;
          return (
            <React.Fragment key={b.chain}>
              <div style={{ position: "absolute", left: BRIDGE_X - 11, top: b.y - 11, width: 22, height: 22, borderRadius: 11, border: `2.5px solid rgba(255,255,255,${0.9 * loser})`, background: C.bg, boxSizing: "border-box", opacity: k, transform: `scale(${0.6 + 0.4 * k})` }} />
              <div
                style={{
                  position: "absolute",
                  left: BRIDGE_X + 22,
                  top: b.y + (above ? -30 : 8),
                  fontFamily: F.mono,
                  fontSize: 15,
                  letterSpacing: "0.16em",
                  color: C.ink,
                  opacity: k * loser,
                }}
              >
                {b.chain}
              </div>
            </React.Fragment>
          );
        })}

        {/* fan venue pills */}
        {FAN.filter((x) => x.venue !== "COW SWAP").map((v, i) => {
          const k = p(f, EV.venues + i * 0.05, 0.4, E.snap);
          const isVel = v.venue === "VELORA";
          const rl = isVel && t >= EV.relock && relockK(f) > 0.5;
          const q = lastLegQuote(v.venue);
          return (
            <Pill
              key={v.venue}
              x={FAN_X}
              y={G_Y + v.dy}
              name={v.venue}
              quote={q === null ? null : fmt(q)}
              state={rl ? "lock" : "idle"}
              op={k * (rl ? 1 : loser)}
              settle={EV.requote[0] + 0.7 + i * 0.13}
              seed={v.venue}
              scale={0.6 + 0.4 * k}
            />
          );
        })}
        {/* rail pills */}
        {RAILS.map((r, i) => {
          const k = p(f, EV.venues + 0.25 + i * 0.05, 0.4, E.snap);
          const q = SINGLE_HOP.find((x) => x.venue === r.venue)!.out;
          return (
            <Pill
              key={r.venue}
              x={r.px}
              y={r.y}
              name={r.venue}
              quote={q === null ? null : fmt(q)}
              quoteBelow={false}
              state="idle"
              op={k * loser}
              settle={EV.requote[0] + 0.4 + i * 0.15}
              seed={r.venue}
              scale={0.6 + 0.4 * k}
            />
          );
        })}

        {/* input & output tokens */}
        {[
          { x: 150, top: "BTC", sub: `${QUOTE.amountIn} BTC`, sub2: "bitcoin" },
          { x: 1770, top: "USDT", sub: outValue, sub2: delivered ? "DELIVERED" : t >= EV.lock ? "BEST ROUTE" : "ethereum" },
        ].map((tk, i) => {
          const k = p(f, EV.pullback + 0.35 + i * 0.1, 0.5, E.snap);
          const hot = i === 1 && (t >= EV.lock || delivered);
          return (
            <div key={i} style={{ position: "absolute", left: tk.x, top: G_Y, transform: "translate(-50%,-50%)", opacity: k }}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  background: "#0B0B0D",
                  border: `2px solid ${hot ? (delivered ? C.green : C.orange) : "rgba(255,255,255,0.2)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: F.mono,
                  fontSize: 17,
                  color: C.ink,
                }}
              >
                {tk.top}
              </div>
              <div style={{ position: "absolute", top: 92, left: 38, transform: "translateX(-50%)", textAlign: "center", fontFamily: F.mono, whiteSpace: "nowrap" }}>
                <div style={{ fontSize: 18, color: hot ? (delivered ? C.green : C.orangeHi) : C.ink }}>{tk.sub}</div>
                <div style={{ fontSize: 13, letterSpacing: "0.18em", color: C.mute, marginTop: 4 }}>{tk.sub2.toUpperCase()}</div>
              </div>
            </div>
          );
        })}

        {/* deposit address card */}
        <div
          style={{
            position: "absolute",
            left: 300,
            top: 316,
            width: 560,
            padding: "16px 20px",
            border: `1px solid ${C.line}`,
            borderRadius: 14,
            background: C.panel,
            opacity: dep * (1 - p(f, EV.cuts[3] - 0.3, 0.3, E.exit)),
            transform: `translateY(${(1 - dep) * 16}px)`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Label size={13}>
              <span style={{ color: C.orange }}>///</span> Deposit address
            </Label>
            <Label size={13} color={C.orangeHi}>
              Unique · this order
            </Label>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 21, color: C.white, marginTop: 12, height: 26, whiteSpace: "nowrap" }}>
            {addrShown}
            <span style={{ opacity: Math.floor(f / 15) % 2 && addrShown.length < ADDR.length ? 1 : 0, color: C.orange }}>▍</span>
          </div>
        </div>

        {/* dot */}
        {dot && (
          <div
            style={{
              position: "absolute",
              left: dot[0] - 10,
              top: dot[1] - 10,
              width: 20,
              height: 20,
              borderRadius: 10,
              background: dotColor,
              border: `3px solid ${C.bg}`,
              boxSizing: "content-box",
              transform: "translate(-3px,-3px)",
            }}
          />
        )}
        {/* funded ring */}
        {t >= EV.funded && t < EV.funded + 0.5 && (
          <div
            style={{
              position: "absolute",
              left: STATIONS[0].gx,
              top: G_Y,
              width: 30 + 60 * p(f, EV.funded, 0.5, E.settle),
              height: 30 + 60 * p(f, EV.funded, 0.5, E.settle),
              transform: "translate(-50%,-50%)",
              borderRadius: 999,
              border: `2px solid ${C.orange}`,
              opacity: 1 - p(f, EV.funded, 0.5, E.settle),
            }}
          />
        )}
      </div>

      </div>

      {/* keywords only — swap in as each idea is spoken */}
      <div style={{ opacity: 1 - p(f, EV.cuts[3] - 0.3, 0.3, E.exit) }}>
        <Key text={<span>20+ <span style={{ color: C.orangeHi }}>venues</span></span>} t0={RW(6)} t1={RW(9) - 0.18} y={46} size={100} mode="right" />
        <Key text={<span>8 <span style={{ color: C.orangeHi }}>chains</span></span>} t0={RW(9)} t1={RW(16) - 0.18} y={46} size={100} mode="left" />
        <Key text={<span>Every <span style={{ color: C.orangeHi }}>step</span></span>} t0={RW(16)} t1={RL(4) - 0.18} y={46} size={100} mode="zoom" />
        <Key text={<span>Own <span style={{ color: C.orangeHi }}>address</span></span>} t0={RL(4)} t1={RL(10) - 0.18} y={46} size={100} mode="right" />
        <Key text={<span>Venue <span style={{ color: "#FF8A80" }}>down</span></span>} t0={RL(10)} t1={RL(15) - 0.18} y={46} size={100} mode="zoom" />
        <Key text={<span>Next <span style={{ color: C.orangeHi }}>venue</span></span>} t0={RL(15)} t1={EV.cuts[3] - 0.3} y={46} size={100} mode="left" />
      </div>

      {/* order status meter */}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: 1920,
          top: 968,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 22,
          opacity: statusOn * (1 - p(f, EV.cuts[3] - 0.3, 0.3, E.exit)),
        }}
      >
        <Label size={15}>Order</Label>
        <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: "0.12em", color: statusColor, minWidth: 300, whiteSpace: "nowrap" }}>{status}</div>
        <Blocks n={12} filled={legsDone * 3} size={20} color={t >= EV.fail && t < EV.relock && Math.floor(f / 5) % 2 ? C.red : C.orange} />
        <Label size={15}>Leg {Math.min(4, Math.floor(legsDone) + (legsDone < 4 ? 1 : 0))}/4</Label>
      </div>
    </div>
  );
};
