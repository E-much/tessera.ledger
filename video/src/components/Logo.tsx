import React from 'react';
import {C, FONT} from '../theme';

export const LogoMark: React.FC<{size: number; color?: string; glow?: boolean}> = ({
	size,
	color = C.lime,
	glow = true,
}) => (
	<svg
		viewBox="0 0 32 32"
		width={size}
		height={size}
		style={{filter: glow ? 'drop-shadow(0 0 10px rgba(198,255,0,0.6))' : undefined, flexShrink: 0}}
	>
		<path
			fill={color}
			d="M16 2 4 9v14l12 7 12-7V9L16 2zm0 2.4 9.2 5.3L16 15.1 6.8 9.7 16 4.4zM6 11.2l9 5.2v11.3L6 22.5V11.2zm11 16.5V16.4l9-5.2v11.3l-9 5.2z"
		/>
	</svg>
);

export const Logo: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: size * 0.32, ...style}}>
		<LogoMark size={size} />
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
