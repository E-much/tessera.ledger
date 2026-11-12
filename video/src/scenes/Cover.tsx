import React from 'react';
import {AbsoluteFill, Interactive, useCurrentFrame} from 'remotion';
import {Logo} from '../components/Logo';
import {TOKENS, TokenRow} from '../components/Tokens';
import {C, FONT, GLOW, IN, tw, useLayout} from '../theme';

const CoverCard: React.FC<{scale: number}> = ({scale}) => (
	<div
		style={{
			padding: 22 * scale,
			borderRadius: 40 * scale,
			background: 'rgba(17,17,17,0.9)',
			border: `1px solid ${C.line}`,
			boxShadow: '0 30px 90px rgba(0,0,0,0.6), 0 0 70px rgba(198,255,0,0.12)',
			display: 'flex',
			flexDirection: 'column',
			gap: 18 * scale,
		}}
	>
		<TokenRow token={TOKENS.spacex} scale={scale} active />
		<div
			style={{
				height: 92 * scale,
				borderRadius: 24 * scale,
				background: C.lime,
				color: '#0A0A0A',
				fontFamily: FONT,
				fontWeight: 800,
				fontSize: 34 * scale,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				boxShadow: '0 0 40px rgba(198,255,0,0.45)',
			}}
		>
			Buy from $1
		</div>
	</div>
);

const CoverInner: React.FC = () => {
	const frame = useCurrentFrame();
	const {portrait} = useLayout();
	const exit = tw(frame, 36, 45, 0, 1, IN);

	return (
		<AbsoluteFill
			style={{
				flexDirection: portrait ? 'column' : 'row',
				alignItems: portrait ? 'flex-start' : 'center',
				justifyContent: portrait ? 'center' : 'space-between',
				padding: portrait ? '0 90px' : '0 110px',
				gap: portrait ? 90 : 60,
				fontFamily: FONT,
				opacity: 1 - exit,
				scale: String(1 + frame * 0.0012 + exit * 0.06),
				filter: `blur(${exit * 14}px)`,
			}}
		>
			<div style={{display: 'flex', flexDirection: 'column', gap: portrait ? 70 : 60}}>
				<Logo size={portrait ? 68 : 66} />
				<Interactive.Div
					name="Cover headline"
					style={{
						color: C.white,
						fontWeight: 800,
						fontSize: portrait ? 132 : 132,
						whiteSpace: 'nowrap',
						lineHeight: 0.98,
						letterSpacing: '-0.045em',
					}}
				>
					Private Equity
					<br />
					for <span style={{color: C.lime, textShadow: GLOW}}>Everyone.</span>
				</Interactive.Div>
			</div>
			<div style={{width: portrait ? '100%' : 600, flexShrink: 0, translate: `0 ${tw(frame, 0, 45, 0, -14)}px`}}>
				<CoverCard scale={portrait ? 1.3 : 1.12} />
			</div>
		</AbsoluteFill>
	);
};

export const Cover = Interactive.create({Component: CoverInner, layout: 'absolute-fill', schema: {}});
