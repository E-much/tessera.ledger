import React from 'react';
import {AbsoluteFill, Interactive, Sequence, useCurrentFrame} from 'remotion';
import {Logo} from '../components/Logo';
import {C, FONT, GLOW, pop, tw, useLayout} from '../theme';

export const END_CARD = 52;

const Word: React.FC<{at: number; children: React.ReactNode; lime?: boolean}> = ({at, children, lime}) => {
	const frame = useCurrentFrame();
	return (
		<span
			style={{
				display: 'inline-block',
				color: lime ? C.lime : C.white,
				textShadow: lime ? GLOW : undefined,
				opacity: tw(frame, at, at + 5, 0, 1),
				translate: `0 ${tw(frame, at, at + 10, 60, 0)}px`,
				filter: `blur(${tw(frame, at, at + 8, 12, 0)}px)`,
			}}
		>
			{children}
		</span>
	);
};

const Payoff: React.FC = () => {
	const {portrait} = useLayout();
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center'}}>
			<div
				style={{
					fontWeight: 800,
					fontSize: portrait ? 150 : 170,
					lineHeight: 1.0,
					letterSpacing: '-0.05em',
				}}
			>
				<Word at={0}>Private</Word>
				{portrait ? <br /> : ' '}
				<Word at={5}>Equity</Word>
				{portrait ? ' ' : <br />}
				<Word at={12}>for</Word>
				{portrait ? <br /> : ' '}
				<Word at={18} lime>
					Everyone.
				</Word>
			</div>
		</AbsoluteFill>
	);
};

const EndCard: React.FC = () => {
	const frame = useCurrentFrame();
	const {portrait, fps} = useLayout();
	const logoIn = pop(frame, fps, 0, 12);
	const urlIn = pop(frame, fps, 12, 12);
	return (
		<AbsoluteFill
			style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT, gap: portrait ? 60 : 50}}
		>
			<div style={{scale: String(0.6 + 0.4 * logoIn), opacity: Math.min(1, logoIn * 2)}}>
				<Logo size={portrait ? 120 : 110} />
			</div>
			<Interactive.Div
				name="End tagline"
				style={{
					color: C.white,
					fontWeight: 700,
					fontSize: portrait ? 60 : 60,
					letterSpacing: '-0.03em',
					textAlign: 'center',
					opacity: tw(frame, 6, 12, 0, 1),
				}}
			>
				Private Equity for <span style={{color: C.lime}}>Everyone.</span>
			</Interactive.Div>
			<div
				style={{
					padding: portrait ? '26px 64px' : '24px 60px',
					borderRadius: 999,
					background: C.lime,
					color: '#0A0A0A',
					fontWeight: 800,
					fontSize: portrait ? 68 : 60,
					letterSpacing: '-0.02em',
					boxShadow: '0 0 60px rgba(198,255,0,0.5)',
					scale: String(urlIn),
				}}
			>
				tessera.pe
			</div>
			<div
				style={{
					position: 'absolute',
					bottom: portrait ? 110 : 60,
					left: 80,
					right: 80,
					textAlign: 'center',
					color: C.faint,
					fontWeight: 500,
					fontSize: portrait ? 28 : 24,
					opacity: tw(frame, 20, 30, 0, 1),
				}}
			>
				T-Tokens represent loan participation rights. Not direct common equity shares.
			</div>
		</AbsoluteFill>
	);
};

const OutroInner: React.FC = () => (
	<>
		<Sequence name="Payoff" durationInFrames={END_CARD}>
			<Payoff />
		</Sequence>
		<Sequence name="End card" from={END_CARD}>
			<EndCard />
		</Sequence>
	</>
);

export const Outro = Interactive.create({Component: OutroInner, layout: 'absolute-fill', schema: {}});
