import React from 'react';
import {C} from '../theme';

/**
 * Tessera mark: an isometric cube built from three mosaic tiles (tesserae).
 * `assemble` 0→1 flies each tile in from its own direction.
 */
export const Mark: React.FC<{size: number; assemble?: number; gap?: number; style?: React.CSSProperties}> = ({
  size,
  assemble = 1,
  gap = 0.05,
  style,
}) => {
  const s = 50;
  const k = 0.866 * s;
  const a = Math.max(0, Math.min(1, assemble));
  const inv = 1 - a;
  const g = gap * s; // tile separation
  const top = `0,${-s} ${k},${-s / 2} 0,0 ${-k},${-s / 2}`;
  const left = `${-k},${-s / 2} 0,0 0,${s} ${-k},${s / 2}`;
  const right = `${k},${-s / 2} 0,0 0,${s} ${k},${s / 2}`;
  const tile = (pts: string, fill: string, dx: number, dy: number, r: number) => (
    <polygon
      points={pts}
      fill={fill}
      stroke={C.bg}
      strokeWidth={g}
      strokeLinejoin="round"
      transform={`translate(${dx * inv * 90} ${dy * inv * 90}) rotate(${r * inv})`}
      opacity={Math.min(1, a * 3)}
    />
  );
  return (
    <svg width={size} height={size} viewBox="-55 -55 110 110" style={{overflow: 'visible', ...style}}>
      {tile(left, C.ink, -1, 0.7, -40)}
      {tile(right, '#2B2B2B', 1, 0.7, 40)}
      {tile(top, C.lime, 0, -1, 25)}
    </svg>
  );
};

export const Wordmark: React.FC<{size: number; color?: string}> = ({size, color = C.ink}) => (
  <span style={{fontSize: size, fontWeight: 800, letterSpacing: '-0.045em', color, lineHeight: 1}}>Tessera</span>
);

/** Company monogram tile for token cards. Neutral glyphs, no third-party logos. */
export const Monogram: React.FC<{letter: string; size: number; active?: boolean}> = ({letter, size, active}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: C.ink,
      color: active ? C.lime : '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.48,
      fontWeight: 800,
      letterSpacing: '-0.04em',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}
  >
    {letter}
  </div>
);
