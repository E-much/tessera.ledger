import { Easing, interpolate } from "remotion";
import TL from "./timeline.json";

// Colours pulled from rift.trade (brand kit + computed CSS)
export const C = {
  bg: "#050506", // body background on rift.trade
  panel: "#0E0E11", // card surfaces
  panelHi: "rgba(255,255,255,0.04)",
  line: "rgba(255,255,255,0.10)",
  lineSoft: "rgba(255,255,255,0.06)",
  grid: "rgba(255,255,255,0.028)",
  white: "#FFFFFF",
  ink: "#E3E3E3", // primary UI text
  mute: "#9A9A9A",
  dim: "#6B6B6B",
  orange: "#E87C12", // "Rift Orange" (brand kit)
  orangeHi: "#FFD9A8", // accent text — warm glow tint, reads on the orange gradient
  glow: "#FFE0B0", // "Warm Glow" (brand kit)
  green: "#22C55E", // best-route row on the widget
  red: "#EF4444", // losing rows / failures on the widget
  pillBlue: "#2E40B7", // token selector fill
  pillBlueBorder: "#627EEA",
};

// Orange → black gradient used for the whole piece (Rift Orange glowing up from below)
export const BG =
  "radial-gradient(130% 95% at 50% 118%, #E87C12 0%, #B9600E 22%, #5A2A07 48%, #1A0C04 72%, #080503 100%)";

export const F = {
  // Neue Haas Display (site headline face) is commercial; Inter Display (opsz 32) is the closest
  // open cut and is already served by rift.trade itself (Inter + "Rift Docs Inter").
  sans: "'InterV', system-ui, sans-serif",
  // Sometype Mono is served by rift.trade (the 'SomeType' face used in the swap widget).
  mono: "'Sometype', ui-monospace, monospace",
};

export const FPS = TL.fps;
export const BEAT = 60 / TL.bpm;

// Motion vocabulary — snappy in, soft settle; nothing linear.
export const E = {
  snap: Easing.bezier(0.16, 1, 0.3, 1), // fast attack, long soft settle
  settle: Easing.bezier(0.22, 1, 0.36, 1),
  exit: Easing.bezier(0.7, 0, 0.84, 0), // accelerate out
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  travel: Easing.bezier(0.45, 0, 0.2, 1), // dot hop: lean in, glide into station
};

/** progress 0..1 between t0 and t0+dur (seconds) at frame f */
export const p = (f: number, t0: number, dur: number, ease = E.snap) =>
  interpolate(f / FPS, [t0, t0 + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const line = (id: string) => TL.lines.find((l) => l.id === id)!;
/** absolute time (s) of the n-th word of a line */
export const wt = (id: string, n: number) => {
  const w = line(id).words;
  return w[Math.min(n, w.length - 1)].t;
};
export const TIMELINE = TL;
