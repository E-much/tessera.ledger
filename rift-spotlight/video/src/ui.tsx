import React from "react";
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { C, E, F, FPS, ON, p, TIMELINE } from "./theme";

/** Faint static square grid, as on rift.trade's page background. */
export const Grid: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, opacity }}>
    <defs>
      <pattern id="g" width={120} height={120} patternUnits="userSpaceOnUse" x={0} y={0}>
        <path d="M120 0H0V120" fill="none" stroke={C.grid} strokeWidth={1} />
      </pattern>
    </defs>
    <rect width={1920} height={1080} fill="url(#g)" />
  </svg>
);

export type Mode = "up" | "left" | "right" | "zoom";
export type W = { w: string; t: number; color?: string; mono?: boolean; mode?: Mode };

/**
 * Word-by-word kinetic type synced to VO timestamps.
 * mode: "up" rises out of a mask · "left"/"right" slides in from that side · "zoom" punches in from large.
 * exitTo: how the whole block leaves — fade with a push in that direction, or "zoomOut".
 */
export const Words: React.FC<{
  words: W[];
  size: number;
  weight?: number;
  color?: string;
  lead?: number;
  style?: React.CSSProperties;
  exitAt?: number;
  mode?: Mode;
  exitTo?: "up" | "left" | "right" | "zoomOut";
  align?: "left" | "right" | "center";
}> = ({ words, size, weight = 600, color = C.white, lead = 0.06, style, exitAt, mode = "up", exitTo = "up", align }) => {
  const f = useCurrentFrame();
  const out = exitAt ? p(f, exitAt, 0.32, E.exit) : 0;
  const exitT =
    exitTo === "left" ? `translateX(${-out * 320}px)` : exitTo === "right" ? `translateX(${out * 320}px)` : exitTo === "zoomOut" ? `scale(${1 - 0.25 * out})` : `translateY(${-out * 40}px)`;
  return (
    <div
      style={{
        fontFamily: F.sans,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: "-0.045em",
        lineHeight: 1.02,
        color,
        fontVariationSettings: "'opsz' 32",
        textAlign: align,
        opacity: 1 - out,
        transform: exitT,
        transformOrigin: align === "right" ? "100% 50%" : align === "center" ? "50% 50%" : "0% 50%",
        ...style,
      }}
    >
      {(() => {
        const lines: W[][] = [[]];
        words.forEach((w) => (w.w === "\n" ? lines.push([]) : lines[lines.length - 1].push(w)));
        return lines.map((ln, li) => (
          <div key={li} style={{ height: size * 1.04, whiteSpace: "nowrap" }}>
            {ln.map((w, i) => {
              const m = w.mode ?? mode;
              const k = p(f, w.t - lead, m === "up" ? 0.5 : 0.55, E.snap);
              const inner: React.CSSProperties = {
                display: "inline-block",
                color: w.color ?? color,
                fontFamily: w.mono ? F.mono : undefined,
                letterSpacing: w.mono ? "-0.02em" : undefined,
                whiteSpace: "pre",
              };
              if (m === "up") {
                return (
                  <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", height: size * 1.22, marginBottom: -size * 0.18 }}>
                    <span style={{ ...inner, transform: `translateY(${(1 - k) * 140}%)` }}>{w.w}</span>
                  </span>
                );
              }
              const tr =
                m === "zoom"
                  ? `scale(${1 + 0.35 * (1 - k)})`
                  : `translateX(${(m === "left" ? -1 : 1) * (1 - k) * size * 1.4}px)`;
              return (
                <span key={i} style={{ ...inner, verticalAlign: "top", opacity: Math.min(1, k * (m === "zoom" ? 2.4 : 1.6)), transform: tr, transformOrigin: "50% 60%" }}>
                  {w.w}
                </span>
              );
            })}
          </div>
        ));
      })()}
    </div>
  );
};

/** Pull words of a VO line with optional per-word overrides */
export const lineWords = (id: string, map?: (w: string, i: number) => Partial<W> | null): W[] => {
  const L = TIMELINE.lines.find((l) => l.id === id)!;
  const out: W[] = [];
  L.words.forEach((w, i) => {
    const o = map ? map(w.w, i) : {};
    if (o === null) return;
    out.push({ t: w.t, ...o, w: (o?.w ?? w.w) + " " });
  });
  return out;
};

/** ████░░░░ block meter (site motif). */
export const Blocks: React.FC<{
  n: number;
  filled: number;
  size?: number;
  color?: string;
  empty?: string;
  style?: React.CSSProperties;
}> = ({ n, filled, size = 22, color = C.orange, empty = "rgba(255,255,255,0.18)", style }) => (
  <span style={{ fontFamily: F.mono, fontSize: size, letterSpacing: "0.04em", lineHeight: 1, ...style }}>
    {Array.from({ length: n }).map((_, i) => (
      <span key={i} style={{ color: i < Math.floor(filled) ? color : empty }}>
        {i < Math.floor(filled) ? "█" : "░"}
      </span>
    ))}
  </span>
);

/** Digits re-roll every few frames (a live re-quote), then settle on the real value. */
export const Scramble: React.FC<{ text: string; settle: number; start?: number; seed?: string; style?: React.CSSProperties }> = ({
  text,
  settle,
  start = -1,
  seed = "s",
  style,
}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  let s = text;
  if (t < settle && t >= start) {
    const step = Math.floor(f / 4);
    s = text.replace(/\d/g, (d, i) => (i < 3 ? d : String(Math.floor(random(`${seed}-${i}-${step}`) * 10))));
  }
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{s}</span>;
};

/** Mono label in the site's spaced-caps style, e.g. "/// USE CASES". */
export const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({
  children,
  color = C.mute,
  size = 18,
  style,
}) => (
  <div style={{ fontFamily: F.mono, fontSize: size, letterSpacing: "0.28em", textTransform: "uppercase", color, ...style }}>{children}</div>
);

/** The provided RIFT logo, used exactly as supplied (square tile, unaltered). */
export const Logo: React.FC<{ size: number; style?: React.CSSProperties }> = ({ size, style }) => (
  // the supplied logo, unaltered, presented as a rounded-corner tile (app-icon shape)
  <Img src={staticFile("rift-logo.jpg")} style={{ width: size, height: size, display: "block", borderRadius: size * 0.22, ...style }} />
);

/** Persistent HUD: "///" label, section, and a block progress bar for the whole piece. */
export const HUD: React.FC<{ section: string; index: number; opacity: number }> = ({ section, index, opacity }) => {
  const f = useCurrentFrame();
  const prog = (f / FPS / TIMELINE.duration) * 16;
  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      <Label style={{ position: "absolute", left: 120, top: 64 }} size={17}>
        <span style={{ color: C.orange }}>///</span> Weekly Spotlight
      </Label>
      <Label style={{ position: "absolute", right: 120, top: 64 }} size={17}>
        @RIFTHQ
      </Label>
      <Label style={{ position: "absolute", left: 120, bottom: 60 }} size={17}>
        <span style={{ color: C.orange }}>///</span> {String(index).padStart(2, "0")} — {section}
      </Label>
      <div style={{ position: "absolute", right: 120, bottom: 58, display: "flex", alignItems: "center", gap: 18 }}>
        <Blocks n={16} filled={prog} size={17} color={C.dim} empty="rgba(255,255,255,0.12)" />
        <Label size={17}>{String(index).padStart(2, "0")}/07</Label>
      </div>
    </div>
  );
};

export const FontFaces: React.FC = () => (
  <style>{`
    @font-face { font-family: 'InterV'; src: url('${staticFile("fonts/Inter-var.woff2")}') format('woff2'); font-weight: 100 900; }
    @font-face { font-family: 'Sometype'; src: url('${staticFile("fonts/SometypeMono-var.woff2")}') format('woff2'); font-weight: 400 700; }
  `}</style>
);

/**
 * A keyword (not a caption): one or two words, big, on screen only while that idea is spoken.
 * Enters from the left / right or zooms; leaves the opposite way.
 */
export const Key: React.FC<{
  text: React.ReactNode;
  t0: number;
  t1: number;
  x?: number;
  y: number;
  w?: number;
  align?: "left" | "center" | "right";
  size?: number;
  mode?: "left" | "right" | "zoom" | "up";
  color?: string;
}> = ({ text, t0, t1, x = 0, y, w = 1920, align = "center", size = 140, mode = "zoom", color = ON.ink }) => {
  const f = useCurrentFrame();
  const t = f / 60;
  if (t < t0 - 0.1 || t > t1 + 0.4) return null;
  const k = p(f, t0 - 0.04, 0.42, E.snap);
  const o = p(f, t1, 0.28, E.exit);
  const dx = mode === "left" ? -1 : mode === "right" ? 1 : 0;
  const tr =
    mode === "zoom"
      ? `scale(${(1 + 0.3 * (1 - k)) * (1 - 0.08 * o)})`
      : mode === "up"
      ? `translateY(${(1 - k) * 60 - o * 40}px)`
      : `translateX(${dx * (1 - k) * 220 - dx * o * 160}px)`;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        textAlign: align,
        fontFamily: F.sans,
        fontVariationSettings: "'opsz' 32",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "-0.05em",
        lineHeight: 1,
        color,
        opacity: Math.min(1, k * 1.8) * (1 - o),
        transform: tr,
        transformOrigin: align === "left" ? "0% 50%" : align === "right" ? "100% 50%" : "50% 50%",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};
