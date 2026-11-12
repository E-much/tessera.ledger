import React from 'react';
import {AbsoluteFill, Interactive, Sequence, useCurrentFrame} from 'remotion';
import {LockIcon} from '../components/Icons';
import {C, FONT, GLOW, pop, tw, useLayout} from '../theme';

const CUT = 38; // "Tessera opens it." cuts to the comparison

const Opens: React.FC = () => {
	const frame = useCurrentFrame();
	const {portrait} = useLayout();
	const open = tw(frame, 3, 13, 0, 1);
	const ring = tw(frame, 6, 26, 0, 1);
	return (
		<AbsoluteFill
			style={{alignItems: 'center', justifyContent: 'center', fontFamily: FONT, gap: portrait ? 70 : 50}}
		>
			<div style={{position: 'relative', height: portrait ? 240 : 190, display: 'flex', alignItems: 'flex-end'}}>
				<div
					style={{
						position: 'absolute',
						left: '50%',
						top: '60%',
						width: 300,
						height: 300,
						marginLeft: -150,
						marginTop: -150,
						borderRadius: '50%',
						border: `6px solid ${C.lime}`,
						opacity: (1 - ring) * (frame > 6 ? 1 : 0),
						scale: String(0.4 + ring * 1.6),
					}}
				/>
				<div style={{filter: open > 0.5 ? 'drop-shadow(0 0 24px rgba(198,255,0,0.7))' : undefined}}>
					<LockIcon size={portrait ? 190 : 150} open={open} color={open > 0.5 ? C.lime : C.white} />
				</div>
			</div>
			<Interactive.Div
				name="Tessera opens it"
				style={{
					color: C.white,
					fontWeight: 800,
					fontSize: portrait ? 124 : 130,
					letterSpacing: '-0.045em',
					opacity: tw(frame, 6, 12, 0, 1),
					translate: `0 ${tw(frame, 6, 16, 40, 0)}px`,
					textAlign: 'center',
					lineHeight: 1.02,
				}}
			>
				Tessera {portrait ? <br /> : null}
				<span style={{color: C.lime, textShadow: GLOW}}>opens it.</span>
			</Interactive.Div>
		</AbsoluteFill>
	);
};

const Swap: React.FC<{old: string; next: string; label?: string; at: number; big: number}> = ({
	old,
	next,
	label,
	at,
	big,
}) => {
	const frame = useCurrentFrame();
	const {portrait, fps} = useLayout();
	const strike = tw(frame, at + 4, at + 12, 0, 1);
	const slam = pop(frame, fps, at + 14, 12);
	return (
		<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: portrait ? 6 : 10}}>
			<div
				style={{
					position: 'relative',
					color: C.faint,
					fontWeight: 700,
					fontSize: portrait ? 56 : 54,
					letterSpacing: '-0.02em',
					opacity: tw(frame, at, at + 5, 0, 1),
					whiteSpace: 'nowrap',
				}}
			>
				{old}
				<div
					style={{
						position: 'absolute',
						left: -8,
						right: -8,
						top: '54%',
						height: 7,
						borderRadius: 4,
						background: C.lime,
						boxShadow: GLOW,
						scale: `${strike} 1`,
						transformOrigin: 'left center',
					}}
				/>
			</div>
			<div
				style={{
					display: 'flex',
					alignItems: 'baseline',
					gap: 24,
					opacity: frame >= at + 14 ? 1 : 0,
					scale: String(1.5 - slam * 0.5),
				}}
			>
				<div
					style={{
						color: C.lime,
						fontWeight: 900,
						fontSize: big,
						lineHeight: 1,
						letterSpacing: '-0.055em',
						textShadow: GLOW,
						whiteSpace: 'nowrap',
					}}
				>
					{next}
				</div>
				{label ? (
					<div style={{color: C.white, fontWeight: 800, fontSize: big * 0.36, letterSpacing: '-0.03em'}}>
						{label}
					</div>
				) : null}
			</div>
		</div>
	);
};

const Compare: React.FC = () => {
	const {portrait} = useLayout();
	return (
		<AbsoluteFill
			style={{
				flexDirection: portrait ? 'column' : 'row',
				alignItems: 'center',
				justifyContent: 'center',
				gap: portrait ? 110 : 150,
				fontFamily: FONT,
			}}
		>
			<Swap old="$100K+ minimums" next="$1" label="minimum" at={2} big={portrait ? 280 : 270} />
			<Swap old="Accreditation paperwork" next="No KYC" at={36} big={portrait ? 190 : 170} />
		</AbsoluteFill>
	);
};

const SolutionInner: React.FC = () => (
	<>
		<Sequence name="Tessera opens it" durationInFrames={CUT}>
			<Opens />
		</Sequence>
		<Sequence name="$1 minimum, No KYC" from={CUT}>
			<Compare />
		</Sequence>
	</>
);

export const Solution = Interactive.create({Component: SolutionInner, layout: 'absolute-fill', schema: {}});
