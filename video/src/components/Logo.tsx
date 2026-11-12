import React from 'react';
import {C, FONT} from '../theme';

// Tessera mark: four isometric cubes (three in an L, one below the corner).
// Generated from isometric geometry to match the brand logo; 100×100 viewBox.
const MARK_PATH =
	'M23.87 0.46L45.47 12.94L23.87 25.41L2.26 12.94ZM0.00 16.86L21.61 29.33L21.61 54.28L0.00 41.80ZM76.13 0.46L97.74 12.94L76.13 25.41L54.53 12.94ZM100.00 16.86L78.39 29.33L78.39 54.28L100.00 41.80ZM50.00 15.55L71.61 28.02L50.00 40.50L28.39 28.02ZM26.13 31.94L47.74 44.42L47.74 69.36L26.13 56.89ZM73.87 31.94L52.26 44.42L52.26 69.36L73.87 56.89ZM26.13 62.12L47.74 74.59L47.74 99.54L26.13 87.06ZM73.87 62.12L52.26 74.59L52.26 99.54L73.87 87.06Z';

/** Bare mark, e.g. lime cubes on a dark background. */
export const LogoMark: React.FC<{size: number; color?: string; glow?: boolean}> = ({
	size,
	color = C.lime,
	glow = true,
}) => (
	<svg
		viewBox="-4 -4 108 108"
		width={size}
		height={size}
		style={{filter: glow ? 'drop-shadow(0 0 10px rgba(198,255,0,0.55))' : undefined, flexShrink: 0}}
	>
		<path fill={color} d={MARK_PATH} />
	</svg>
);

/** App-icon style tile: dark cubes on a lime square, as in the brand logo. */
export const LogoTile: React.FC<{size: number; glow?: boolean}> = ({size, glow = true}) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: size * 0.24,
			background: C.lime,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			flexShrink: 0,
			boxShadow: glow ? '0 0 40px rgba(198,255,0,0.45)' : undefined,
		}}
	>
		<svg viewBox="0 0 100 100" width={size * 0.66} height={size * 0.66}>
			<path fill={C.ink} d={MARK_PATH} />
		</svg>
	</div>
);

export const Logo: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: size * 0.3, ...style}}>
		<LogoTile size={size * 1.25} />
		<div
			style={{
				fontFamily: FONT,
				fontWeight: 800,
				fontSize: size * 0.78,
				letterSpacing: '0.14em',
				color: C.white,
				lineHeight: 1,
			}}
		>
			TESSERA
		</div>
	</div>
);
