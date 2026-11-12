import React from 'react';
import {C} from '../theme';

export const PHONE_W = 620;
export const PHONE_H = 1260;

/** Minimal device shell. Children are laid out in a 620×1260 coordinate space. */
export const Phone: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
	<div
		style={{
			width: PHONE_W,
			height: PHONE_H,
			borderRadius: 84,
			padding: 14,
			background: 'linear-gradient(160deg,#2a2a2a,#0e0e0e 40%,#1a1a1a)',
			boxShadow: '0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08), 0 0 80px rgba(198,255,0,0.10)',
			...style,
		}}
	>
		<div
			style={{
				position: 'relative',
				width: '100%',
				height: '100%',
				borderRadius: 72,
				overflow: 'hidden',
				background: '#0B0B0B',
			}}
		>
			{children}
			<div
				style={{
					position: 'absolute',
					top: 18,
					left: '50%',
					translate: '-50% 0',
					width: 150,
					height: 40,
					borderRadius: 20,
					background: '#000',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					bottom: 14,
					left: '50%',
					translate: '-50% 0',
					width: 200,
					height: 6,
					borderRadius: 3,
					background: C.faint,
				}}
			/>
		</div>
	</div>
);

/** Expanding ring that marks a tap. `t` is frames since the tap. */
export const TapRipple: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
	if (t < 0 || t > 16) return null;
	const p = t / 16;
	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: x,
					top: y,
					width: 70,
					height: 70,
					marginLeft: -35,
					marginTop: -35,
					borderRadius: '50%',
					background: 'rgba(255,255,255,0.85)',
					opacity: t < 5 ? 0.9 : Math.max(0, 0.9 - (t - 5) / 8),
					scale: String(t < 5 ? 0.8 : 0.8 - (t - 5) * 0.02),
				}}
			/>
			<div
				style={{
					position: 'absolute',
					left: x,
					top: y,
					width: 70,
					height: 70,
					marginLeft: -35,
					marginTop: -35,
					borderRadius: '50%',
					border: `4px solid ${C.lime}`,
					opacity: 1 - p,
					scale: String(1 + p * 1.8),
				}}
			/>
		</>
	);
};
