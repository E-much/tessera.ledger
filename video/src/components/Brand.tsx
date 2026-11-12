import React from 'react';
import {Img, staticFile} from 'remotion';
import {C} from '../theme';

/** Official Tessera logo palette (sampled from the brand asset). */
export const LOGO = {ink: '#12121A', tile: '#D2FB95'};

// ---------------------------------------------------------------------------
// Tessera mark: four isometric cubes stacked into a "T", drawn as nine
// separate faces with thin gaps between them (the background shows through).
// Iso projection, unit cube edge = 1:  P(x,y,z) = ((x - y)·k, (x + y)/2 − z)
// Cubes: back-left (-1,0,0), back-right (0,-1,0), centre (0,0,0), below (0,0,-1)
// ---------------------------------------------------------------------------
const K = Math.sqrt(3) / 2;
type V = [number, number];
const P = (x: number, y: number, z: number): V => [(x - y) * K, (x + y) / 2 - z];
const top = (x: number, y: number, z: number): V[] => [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)];
const right = (x: number, y: number, z: number): V[] => [P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z)];
const left = (x: number, y: number, z: number): V[] => [P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z)];

// Order = assembly order (top row first, then down the stem).
// `from` is the direction each tile flies in from.
const FACES: {pts: V[]; from: V}[] = [
  {pts: top(-1, 0, 0), from: [-1, -1]},
  {pts: top(0, -1, 0), from: [1, -1]},
  {pts: top(0, 0, 0), from: [0, -1.2]},
  {pts: left(-1, 0, 0), from: [-1.2, 0]},
  {pts: right(0, -1, 0), from: [1.2, 0]},
  {pts: left(0, 0, 0), from: [-1, 0.4]},
  {pts: right(0, 0, 0), from: [1, 0.4]},
  {pts: left(0, 0, -1), from: [-0.8, 1.2]},
  {pts: right(0, 0, -1), from: [0.8, 1.2]},
];
// Bounds: x ∈ [−2k, 2k], y ∈ [−1.5, 2]  → centre (0, 0.25)
const CY = 0.25;
const HALF = 1.9; // half-extent of the square viewBox, with a little air

const shrink = (pts: V[], g: number): string => {
  // Every face is a rhombus with unit sides, so scaling about the centroid
  // insets all four edges equally (inradius = √3/4).
  const cx = pts.reduce((a, p) => a + p[0], 0) / 4;
  const cy = pts.reduce((a, p) => a + p[1], 0) / 4;
  const s = (Math.sqrt(3) / 4 - g) / (Math.sqrt(3) / 4);
  return pts.map(([x, y]) => `${(cx + (x - cx) * s).toFixed(4)},${(cy + (y - cy) * s).toFixed(4)}`).join(' ');
};

export const Mark: React.FC<{
  size: number;
  assemble?: number; // 0→1, tiles fly in one after another
  gap?: number; // half-gap between faces, in cube units
  color?: string;
  style?: React.CSSProperties;
}> = ({size, assemble = 1, gap = 0.075, color = LOGO.ink, style}) => {
  const a = Math.max(0, Math.min(1, assemble));
  return (
    <svg width={size} height={size} viewBox={`${-HALF} ${CY - HALF} ${HALF * 2} ${HALF * 2}`} style={{overflow: 'visible', ...style}}>
      {FACES.map((f, i) => {
        // staggered local progress for each tile
        const t0 = (i / FACES.length) * 0.55;
        const t = Math.max(0, Math.min(1, (a - t0) / 0.45));
        const e = 1 - Math.pow(1 - t, 4);
        const d = (1 - e) * 2.4;
        return (
          <polygon
            key={i}
            points={shrink(f.pts, gap)}
            fill={color}
            opacity={Math.min(1, t * 2.5)}
            transform={`translate(${f.from[0] * d} ${f.from[1] * d})`}
          />
        );
      })}
    </svg>
  );
};

/** The app-icon form of the logo: dark mark on the soft lime tile. */
export const LogoTile: React.FC<{size: number; assemble?: number; radius?: number; style?: React.CSSProperties}> = ({
  size,
  assemble = 1,
  radius = 0.24,
  style,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * radius,
      background: LOGO.tile,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...style,
    }}
  >
    <Mark size={size * 0.74} assemble={assemble} />
  </div>
);

/** Lowercase wordmark with the green full stop, as on app.tessera.fun. */
export const Wordmark: React.FC<{size: number; color?: string; dot?: string}> = ({size, color = C.ink, dot = C.green}) => (
  <span style={{fontSize: size, fontWeight: 700, letterSpacing: '-0.04em', color, lineHeight: 1}}>
    tessera<span style={{color: dot}}>.</span>
  </span>
);

const ICONS: Record<string, string> = {S: 'brand/spacex.png', K: 'brand/kalshi.png', O: 'brand/openai.png'};

/** Token icon: Tessera's own token artwork for SpaceX (S), Kalshi (K), OpenAI (O). */
export const Monogram: React.FC<{letter: string; size: number; active?: boolean}> = ({letter, size}) => (
  <Img
    src={staticFile(ICONS[letter])}
    style={{width: size, height: size, flexShrink: 0, display: 'block'}}
  />
);
