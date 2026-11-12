import React from 'react';
import {C, FONT} from '../theme';

export type Token = {sym: string; company: string; mono: string; price: string};

// Demo values for the mockup UI.
export const TOKENS: Record<'spacex' | 'openai' | 'xai', Token> = {
	spacex: {sym: 'tSpaceX', company: 'SpaceX', mono: 'SX', price: '1.12'},
	openai: {sym: 'tOpenAI', company: 'OpenAI', mono: 'OA', price: '1.05'},
	xai: {sym: 'txAI', company: 'xAI', mono: 'xAI', price: '1.09'},
};

const SPARKS: Record<string, number[]> = {
	SX: [6, 5, 7, 6, 8, 7, 9, 10, 9, 12],
	OA: [5, 6, 5, 7, 7, 8, 7, 9, 10, 11],
	xAI: [4, 6, 5, 6, 8, 7, 8, 8, 10, 11],
};

export const Badge: React.FC<{token: Token; size: number; active?: boolean}> = ({token, size, active}) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: size * 0.28,
			background: active ? C.lime : '#1F1F1F',
			border: `1px solid ${active ? C.lime : C.lineStrong}`,
			color: active ? '#0A0A0A' : C.white,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontFamily: FONT,
			fontWeight: 800,
			fontSize: size * (token.mono.length > 2 ? 0.3 : 0.36),
			letterSpacing: '-0.02em',
			flexShrink: 0,
		}}
	>
		{token.mono}
	</div>
);

export const Sparkline: React.FC<{token: Token; width: number; height: number; progress?: number}> = ({
	token,
	width,
	height,
	progress = 1,
}) => {
	const pts = SPARKS[token.mono];
	const max = Math.max(...pts);
	const min = Math.min(...pts);
	const d = pts
		.map((p, i) => {
			const x = (i / (pts.length - 1)) * width;
			const y = height - ((p - min) / (max - min)) * (height - 4) - 2;
			return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
		})
		.join(' ');
	return (
		<svg width={width} height={height} style={{overflow: 'visible'}}>
			<path
				d={d}
				fill="none"
				stroke={C.lime}
				strokeWidth={3}
				strokeLinecap="round"
				strokeLinejoin="round"
				pathLength={1}
				strokeDasharray={1}
				strokeDashoffset={1 - progress}
				style={{filter: 'drop-shadow(0 0 6px rgba(198,255,0,0.6))'}}
			/>
		</svg>
	);
};

/** Row-style token card used in the Markets list and on the cover. */
export const TokenRow: React.FC<{
	token: Token;
	scale?: number;
	active?: boolean;
	spark?: number;
	right?: React.ReactNode;
	style?: React.CSSProperties;
}> = ({token, scale = 1, active, spark = 1, right, style}) => {
	const s = scale;
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 22 * s,
				padding: `${22 * s}px ${24 * s}px`,
				borderRadius: 28 * s,
				background: active ? 'linear-gradient(180deg,#1C2210,#141709)' : C.card,
				border: `${Math.max(1, 1.5 * s)}px solid ${active ? C.limeLine : C.line}`,
				boxShadow: active ? '0 0 40px rgba(198,255,0,0.18)' : undefined,
				fontFamily: FONT,
				...style,
			}}
		>
			<Badge token={token} size={76 * s} active={active} />
			<div style={{flex: 1, minWidth: 0}}>
				<div style={{color: C.white, fontWeight: 700, fontSize: 34 * s, letterSpacing: '-0.01em', whiteSpace: 'nowrap'}}>
					{token.sym}
				</div>
				<div style={{color: C.muted, fontWeight: 500, fontSize: 24 * s, marginTop: 4 * s, whiteSpace: 'nowrap'}}>
					{token.company}
				</div>
			</div>
			{right ?? (
				<div style={{display: 'flex', alignItems: 'center', gap: 20 * s}}>
					<Sparkline token={token} width={90 * s} height={40 * s} progress={spark} />
					<div style={{textAlign: 'right'}}>
						<div
							style={{
								color: C.white,
								fontWeight: 700,
								fontSize: 32 * s,
								fontVariantNumeric: 'tabular-nums',
							}}
						>
							${token.price}
						</div>
						<div style={{color: C.faint, fontWeight: 600, fontSize: 20 * s, marginTop: 4 * s}}>USDC</div>
					</div>
				</div>
			)}
		</div>
	);
};
