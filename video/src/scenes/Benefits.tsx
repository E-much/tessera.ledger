import React from 'react';
import {AbsoluteFill, Interactive, Sequence, useCurrentFrame} from 'remotion';
import {BoltIcon, ChainIcon, SwapIcon} from '../components/Icons';
import {C, FONT, GLOW, pop, tw, useLayout} from '../theme';

export const BENEFIT_LEN = 50;

const Benefit: React.FC<{
	index: number;
	icon: React.ReactNode;
	line1: React.ReactNode;
	line2: React.ReactNode;
	sub: string;
}> = ({index, icon, line1, line2, sub}) => {
	const frame = useCurrentFrame();
	const {portrait, fps} = useLayout();
	const iconIn = pop(frame, fps, 0, 11);
	const big = portrait ? 132 : 150;
	return (
		<AbsoluteFill
			style={{
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: FONT,
				textAlign: 'center',
				padding: portrait ? '0 80px' : '0 160px',
			}}
		>
			<div
				style={{
					width: portrait ? 190 : 170,
					height: portrait ? 190 : 170,
					borderRadius: 48,
					background: C.limeSoft,
					border: `2px solid ${C.limeLine}`,
					boxShadow: '0 0 60px rgba(198,255,0,0.25)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					scale: String(iconIn),
					rotate: `${(1 - iconIn) * -20}deg`,
					marginBottom: portrait ? 64 : 48,
				}}
			>
				{icon}
			</div>
			<div
				style={{
					fontWeight: 800,
					fontSize: big,
					lineHeight: 1.0,
					letterSpacing: '-0.05em',
					color: C.white,
				}}
			>
				<div style={{opacity: tw(frame, 2, 7, 0, 1), translate: `0 ${tw(frame, 2, 12, 50, 0)}px`}}>{line1}</div>
				<div style={{opacity: tw(frame, 5, 10, 0, 1), translate: `0 ${tw(frame, 5, 15, 50, 0)}px`}}>{line2}</div>
			</div>
			<div
				style={{
					color: C.muted,
					fontWeight: 600,
					fontSize: portrait ? 48 : 46,
					marginTop: portrait ? 48 : 40,
					maxWidth: portrait ? 900 : 1500,
					lineHeight: 1.25,
					opacity: tw(frame, 10, 18, 0, 1),
				}}
			>
				{sub}
			</div>
			<div style={{position: 'absolute', bottom: portrait ? 170 : 90, display: 'flex', gap: 16}}>
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						style={{
							width: i === index ? 64 : 18,
							height: 18,
							borderRadius: 9,
							background: i === index ? C.lime : 'rgba(255,255,255,0.2)',
						}}
					/>
				))}
			</div>
		</AbsoluteFill>
	);
};

const L: React.FC<{children: React.ReactNode}> = ({children}) => (
	<span style={{color: C.lime, textShadow: GLOW}}>{children}</span>
);

const BenefitsInner: React.FC = () => {
	const {portrait} = useLayout();
	const iconSize = portrait ? 110 : 100;
	return (
		<>
			<Sequence name="Instant access" durationInFrames={BENEFIT_LEN}>
				<Benefit
					index={0}
					icon={<BoltIcon size={iconSize} />}
					line1={<L>Instant</L>}
					line2="access."
					sub="$1 minimum. No KYC."
				/>
			</Sequence>
			<Sequence name="Transparent on-chain" from={BENEFIT_LEN} durationInFrames={BENEFIT_LEN}>
				<Benefit
					index={1}
					icon={<ChainIcon size={iconSize} />}
					line1="Transparent"
					line2={<L>on-chain.</L>}
					sub="Token-2022 on Solana. Real-time Chainlink Proof of Reserve."
				/>
			</Sequence>
			<Sequence name="Trade anytime on DEX" from={BENEFIT_LEN * 2} durationInFrames={BENEFIT_LEN}>
				<Benefit
					index={2}
					icon={<SwapIcon size={iconSize} />}
					line1={
						<>
							Trade <L>anytime</L>
						</>
					}
					line2="on DEX."
					sub="24/7 on Meteora and Jupiter."
				/>
			</Sequence>
		</>
	);
};

export const Benefits = Interactive.create({Component: BenefitsInner, layout: 'absolute-fill', schema: {}});
