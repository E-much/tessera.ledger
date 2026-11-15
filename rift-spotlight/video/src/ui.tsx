import React from "react";
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { C, E, F, FPS, p, TIMELINE } from "./theme";

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

export type W = { w: string; t: number; color?: string; mono?: boolean };

/** Word-by-word kinetic type: each word rises out of a mask on its VO timestamp. */
export const Words: React.FC<{
  words: W[];
  size: number;
  weight?: number;
  color?: string;
  lead?: number;
  style?: React.CSSProperties;
  exitAt?: number;
}> = ({ words, size, weight = 600, color = C.white, lead = 0.06, style, exitAt }) => {
  const f = useCurrentFrame();
  const out = exitAt ? p(f, exitAt, 0.32, E.exit) : 0;
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
        ...style,
      }}
    >
      {(() => {
        const lines: W[][] = [[]];
        words.forEach((w) => (w.w === "\n" ? lines.push([]) : lines[lines.length - 1].push(w)));
        return lines.map((ln, li) => (
          <div key={li} style={{ height: size * 1.04, whiteSpace: "nowrap", opacity: 1 - out }}>
            {ln.map((w, i) => {
              const k = p(f, w.t - lead, 0.5, E.snap);
              return (
                <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", height: size * 1.22, marginBottom: -size * 0.18 }}>
                  <span
                    style={{
                      display: "inline-block",
                      transform: `translateY(${(1 - k) * 140 - out * 140}%)`,
                      color: w.color ?? color,
                      fontFamily: w.mono ? F.mono : undefined,
                      letterSpacing: w.mono ? "-0.02em" : undefined,
                      whiteSpace: "pre",
                    }}
                  >
                    {w.w}
                  </span>
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
  <Img src={staticFile("rift-logo.jpg")} style={{ width: size, height: size, display: "block", ...style }} />
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
