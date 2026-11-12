import React from 'react';
import {AbsoluteFill, Interactive, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {LockIcon} from '../components/Icons';
import {C, CLAMP, FONT, GLOW, OUT, pop, tw, useLayout} from '../theme';

const CUT = 60; // "$7T" cuts to "Locked behind"
const SLAM = 40; // lock slams down (frames after CUT)

const MarketSize: React.FC = () => {
	const frame = useCurrentFrame();
	const {portrait, fps} = useLayout();
	const value = interpolate(frame, [4, 30], [0, 7], {...CLAMP, easing: OUT});
	const label = frame >= 30 ? '$7T' : `$${value.toFixed(1)}T`;
	const punch = frame >= 30 ? 1 - pop(frame, fps, 30, 8) : 0;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT, textAlign: 'center'}}>
			<Interactive.Div
				name="Market intro"
				style={{
					color: C.white,
					fontWeight: 700,
					fontSize: portrait ? 84 : 88,
					letterSpacing: '-0.03em',
					opacity: tw(frame, 0, 8, 0, 1),
					translate: `0 ${tw(frame, 0, 10, 30, 0)}px`,
				}}
			>
				Private equity is a
			</Interactive.Div>
			<div
				style={{
					color: C.lime,
					fontWeight: 900,
					fontSize: portrait ? 330 : 360,
					lineHeight: 1,
					letterSpacing: '-0.06em',
					fontVariantNumeric: 'tabular-nums',
					textShadow: GLOW,
					margin: '10px 0 6px',
					scale: String(0.92 + 0.08 * tw(frame, 2, 12, 0, 1) + punch * 0.12),
				}}
			>
				{label}
			</div>
			<Interactive.Div
				name="Market outro"
				style={{
					color: C.white,
					fontWeight: 700,
					fontSize: portrait ? 84 : 88,
					letterSpacing: '-0.03em',
					opacity: tw(frame, 30, 38, 0, 1),
					translate: `0 ${tw(frame, 30, 40, 30, 0)}px`,
				}}
			>
				market.
			</Interactive.Div>
		</AbsoluteFill>
	);
};

const Chip: React.FC<{children: React.ReactNode; at: number; dim: number; portrait: boolean}> = ({
	children,
	at,
	dim,
	portrait,
}) => {
	const frame = useCurrentFrame();
	return (
		<div
			style={{
				padding: portrait ? '26px 44px' : '22px 46px',
				borderRadius: 999,
				border: `2px solid ${C.lineStrong}`,
				background: C.card,
				color: C.white,
				fontWeight: 700,
				fontSize: portrait ? 62 : 58,
				letterSpacing: '-0.02em',
				whiteSpace: 'nowrap',
				opacity: tw(frame, at, at + 6, 0, 1) * (1 - dim * 0.55),
				translate: `0 ${tw(frame, at, at + 10, 60, 0)}px`,
			}}
		>
			{children}
		</div>
	);
};

const Locked: React.FC = () => {
	const frame = useCurrentFrame();
	const {portrait, fps} = useLayout();
	const slam = pop(frame, fps, SLAM, 11);
	const dim = tw(frame, SLAM, SLAM + 8, 0, 1);
	const shake = frame >= SLAM && frame < SLAM + 8 ? Math.sin(frame * 3.1) * (SLAM + 8 - frame) * 2.2 : 0;
	return (
		<AbsoluteFill
			style={{
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: FONT,
				gap: portrait ? 44 : 30,
				translate: `${shake}px 0`,
			}}
		>
			<div
				style={{
					height: portrait ? 240 : 190,
					display: 'flex',
					alignItems: 'flex-end',
					opacity: frame >= SLAM ? 1 : 0,
					scale: String(2.2 - slam * 1.2),
				}}
			>
				<LockIcon size={portrait ? 190 : 150} />
			</div>
			<Interactive.Div
				name="Locked behind"
				style={{
					color: C.white,
					fontWeight: 800,
					fontSize: portrait ? 120 : 116,
					letterSpacing: '-0.045em',
					marginBottom: 10,
					opacity: tw(frame, 0, 6, 0, 1),
					translate: `0 ${tw(frame, 0, 10, 40, 0)}px`,
				}}
			>
				Locked behind
			</Interactive.Div>
			<Chip at={8} dim={dim} portrait={portrait}>
				$100K+ minimums
			</Chip>
			<Chip at={16} dim={dim} portrait={portrait}>
				Accreditation paperwork
			</Chip>
		</AbsoluteFill>
	);
};

const HookInner: React.FC = () => (
	<>
		<Sequence name="$7T market" durationInFrames={CUT}>
			<MarketSize />
		</Sequence>
		<Sequence name="Locked behind" from={CUT}>
			<Locked />
		</Sequence>
	</>
);

export const Hook = Interactive.create({Component: HookInner, layout: 'absolute-fill', schema: {}});
