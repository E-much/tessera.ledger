import React from 'react';
import {C} from '../theme';

/** Padlock. `open` 0..1 lifts and swings the shackle. */
export const LockIcon: React.FC<{size: number; open?: number; color?: string}> = ({size, open = 0, color = C.white}) => (
	<svg viewBox="0 0 100 120" width={size} height={size * 1.2} style={{overflow: 'visible'}}>
		<g style={{transformOrigin: '72px 52px', transform: `translateY(${-open * 16}px) rotate(${open * 32}deg)`}}>
			<path d="M28 54 V36 a22 22 0 0 1 44 0 V54" fill="none" stroke={color} strokeWidth={11} strokeLinecap="round" />
		</g>
		<rect x={10} y={50} width={80} height={64} rx={14} fill={color} />
		<circle cx={50} cy={78} r={8} fill={C.bg} />
		<rect x={46} y={80} width={8} height={18} rx={4} fill={C.bg} />
	</svg>
);

const stroke = (size: number) => ({
	width: size,
	height: size,
	fill: 'none',
	stroke: C.lime,
	strokeWidth: 2.2,
	strokeLinecap: 'round' as const,
	strokeLinejoin: 'round' as const,
});

export const BoltIcon: React.FC<{size: number}> = ({size}) => (
	<svg viewBox="0 0 24 24" {...stroke(size)}>
		<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
	</svg>
);

export const ChainIcon: React.FC<{size: number}> = ({size}) => (
	<svg viewBox="0 0 24 24" {...stroke(size)}>
		<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4l-1.4 1.4" />
		<path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.4-1.4" />
	</svg>
);

export const SwapIcon: React.FC<{size: number}> = ({size}) => (
	<svg viewBox="0 0 24 24" {...stroke(size)}>
		<path d="M4 8h14l-4-4M20 16H6l4 4" />
	</svg>
);

export const CheckIcon: React.FC<{size: number; progress?: number}> = ({size, progress = 1}) => (
	<svg viewBox="0 0 24 24" width={size} height={size} fill="none">
		<path
			d="M5 12.5l4.5 4.5L19 7.5"
			stroke="#0A0A0A"
			strokeWidth={3}
			strokeLinecap="round"
			strokeLinejoin="round"
			pathLength={1}
			strokeDasharray={1}
			strokeDashoffset={1 - progress}
		/>
	</svg>
);
