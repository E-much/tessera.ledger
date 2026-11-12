import React from 'react';
import {C} from '../theme';

/** Padlock. `open` 0→1 lifts then swings the shackle; `glow` lights the keyhole. */
export const Lock: React.FC<{size: number; open?: number; glow?: number; tint?: string}> = ({
  size,
  open = 0,
  glow = 0,
  tint = C.ink,
}) => {
  const lift = Math.min(1, open * 1.6);
  const swing = Math.max(0, (open - 0.35) / 0.65);
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 200 240" style={{overflow: 'visible'}}>
      <g transform={`translate(0 ${-36 * lift}) rotate(${-28 * swing} 150 112)`}>
        <path d="M52 112 V74 a48 48 0 0 1 96 0 V112" fill="none" stroke={tint} strokeWidth={24} strokeLinecap="round" />
      </g>
      <rect x={18} y={102} width={164} height={132} rx={36} fill={tint} />
      <rect x={18} y={102} width={164} height={132} rx={36} fill="url(#lockSheen)" opacity={0.5} />
      <defs>
        <linearGradient id="lockSheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0.18} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={18} y={102} width={164} height={132} rx={36} fill={C.lime} opacity={glow} />
      <circle cx={100} cy={156} r={15} fill={glow > 0.5 ? C.ink : '#3A3A3A'} />
      <rect x={93} y={160} width={14} height={32} rx={7} fill={glow > 0.5 ? C.ink : '#3A3A3A'} />
    </svg>
  );
};
