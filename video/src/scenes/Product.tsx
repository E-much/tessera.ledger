import React from 'react';
import {AbsoluteFill, Interactive, Sequence, useCurrentFrame} from 'remotion';
import {CheckIcon} from '../components/Icons';
import {LogoMark} from '../components/Logo';
import {PHONE_H, Phone, TapRipple} from '../components/Phone';
import {Badge, TOKENS, Token, TokenRow} from '../components/Tokens';
import {C, FONT, GLOW, IN, pop, tw, useLayout} from '../theme';

// Product-local frame timings (scene is 315 frames).
export const P = {
	marketsTap: 62,
	buy: 84,
	keyTap: 108,
	buyTap: 140,
	success: 152,
	portfolio: 200,
	openai: 225,
	xai: 250,
};

/* ---------- shared bits ---------- */

const Ripple: React.FC<{at: number}> = ({at}) => {
	const frame = useCurrentFrame();
	return <TapRipple x={0} y={0} t={frame - at} />;
};

const Center: React.FC<{children: React.ReactNode}> = ({children}) => (
	<div style={{position: 'absolute', left: '50%', top: '50%', width: 0, height: 0}}>{children}</div>
);

const ScreenHeader: React.FC<{title: string; back?: boolean}> = ({title, back}) => (
	<div style={{display: 'flex', alignItems: 'center', gap: 16, height: 70}}>
		{back ? (
			<div style={{color: C.white, fontSize: 52, fontWeight: 400, lineHeight: 1, marginTop: -8}}>‹</div>
		) : (
			<LogoMark size={44} glow={false} />
		)}
		<div style={{color: C.white, fontWeight: 800, fontSize: 44, letterSpacing: '-0.02em'}}>{title}</div>
	</div>
);

/** Slides a screen in from the right at `start` and out to the left at `end`. */
const Screen: React.FC<{start: number; end: number; children: React.ReactNode}> = ({start, end, children}) => {
	const frame = useCurrentFrame();
	if (frame < start || frame >= end + 10) return null;
	const enter = start === 0 ? 1 : tw(frame, start, start + 10, 0, 1);
	const leave = tw(frame, end, end + 10, 0, 1);
	return (
		<div
			style={{
				position: 'absolute',
				inset: 0,
				padding: '86px 30px 40px',
				background: '#0B0B0B',
				display: 'flex',
				flexDirection: 'column',
				fontFamily: FONT,
				translate: `${(1 - enter) * 100 - leave * 30}% 0`,
				opacity: 1 - leave,
			}}
		>
			{children}
		</div>
	);
};

/* ---------- screens ---------- */

const Markets: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useLayout();
	const rows: [Token, number][] = [
		[TOKENS.spacex, 6],
		[TOKENS.openai, 11],
		[TOKENS.xai, 16],
	];
	return (
		<>
			<ScreenHeader title="Markets" />
			<div style={{color: C.muted, fontSize: 26, fontWeight: 500, margin: '6px 0 30px'}}>
				Pre-IPO tokens on Solana
			</div>
			<div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
				{rows.map(([token, at], i) => {
					const s = pop(frame, fps, at, 14);
					const active = i === 0 && frame >= P.marketsTap;
					return (
						<div
							key={token.sym}
							style={{
								position: 'relative',
								opacity: Math.min(1, s * 1.5),
								translate: `0 ${(1 - s) * 60}px`,
								scale: String(active ? 1 - 0.03 * Math.max(0, 1 - (frame - P.marketsTap) / 6) : 1),
							}}
						>
							<TokenRow token={token} scale={0.9} active={active} spark={tw(frame, at + 4, at + 24, 0, 1)} />
							{i === 0 ? (
								<Center>
									<Ripple at={P.marketsTap} />
								</Center>
							) : null}
						</div>
					);
				})}
			</div>
			<div
				style={{
					marginTop: 30,
					padding: '22px 26px',
					borderRadius: 24,
					background: C.limeSoft,
					border: `1px solid ${C.limeLine}`,
					color: C.lime,
					fontWeight: 700,
					fontSize: 28,
					textAlign: 'center',
					opacity: tw(frame, 22, 30, 0, 1),
				}}
			>
				Min. $1 · No KYC
			</div>
		</>
	);
};

const Key: React.FC<{label: string; at?: number}> = ({label, at}) => {
	const frame = useCurrentFrame();
	const pressed = at !== undefined && frame >= at && frame < at + 8;
	return (
		<div
			style={{
				position: 'relative',
				height: 72,
				borderRadius: 18,
				background: pressed ? '#2A2A2A' : '#141414',
				color: C.white,
				fontWeight: 600,
				fontSize: 36,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{label}
			{at !== undefined ? (
				<Center>
					<Ripple at={at} />
				</Center>
			) : null}
		</div>
	);
};

const Buy: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useLayout();
	const typed = frame >= P.keyTap + 2;
	const amountPop = typed ? pop(frame, fps, P.keyTap + 2, 10) : 0;
	const pressed = frame >= P.buyTap && frame < P.buyTap + 6;
	const confirming = frame >= P.buyTap + 4;
	return (
		<>
			<ScreenHeader title="Buy tSpaceX" back />
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 16,
					marginTop: 18,
					padding: '16px 20px',
					borderRadius: 22,
					background: C.card,
					border: `1px solid ${C.line}`,
				}}
			>
				<Badge token={TOKENS.spacex} size={56} active />
				<div style={{flex: 1, color: C.white, fontWeight: 700, fontSize: 30}}>tSpaceX</div>
				<div style={{color: C.muted, fontWeight: 600, fontSize: 26}}>$1.12 / token</div>
			</div>
			<div style={{color: C.muted, fontWeight: 600, fontSize: 26, marginTop: 34, textAlign: 'center'}}>
				You pay
			</div>
			<div
				style={{
					color: typed ? C.lime : C.faint,
					textShadow: typed ? GLOW : undefined,
					fontWeight: 800,
					fontSize: 170,
					lineHeight: 1.05,
					letterSpacing: '-0.05em',
					textAlign: 'center',
					scale: String(1 + (1 - amountPop) * (typed ? 0.25 : 0)),
				}}
			>
				{typed ? '$1' : '$0'}
			</div>
			<div style={{color: C.muted, fontWeight: 600, fontSize: 26, textAlign: 'center'}}>
				{typed ? '1.00 USDC' : '0.00 USDC'}
			</div>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginTop: 26,
					padding: '22px 24px',
					borderRadius: 22,
					background: C.card,
					border: `1px solid ${C.line}`,
				}}
			>
				<div style={{color: C.muted, fontWeight: 600, fontSize: 26}}>You receive</div>
				<div style={{color: C.white, fontWeight: 800, fontSize: 32, fontVariantNumeric: 'tabular-nums'}}>
					{typed ? '0.89' : '0.00'} tSpaceX
				</div>
			</div>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(3, 1fr)',
					gap: 12,
					marginTop: 26,
				}}
			>
				<Key label="1" at={P.keyTap} />
				<Key label="2" />
				<Key label="3" />
				<Key label="4" />
				<Key label="5" />
				<Key label="6" />
				<Key label="7" />
				<Key label="8" />
				<Key label="9" />
			</div>
			<div
				style={{
					position: 'relative',
					marginTop: 'auto',
					marginBottom: 20,
					height: 104,
					borderRadius: 28,
					background: C.lime,
					color: '#0A0A0A',
					fontWeight: 800,
					fontSize: 36,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					boxShadow: typed ? '0 0 50px rgba(198,255,0,0.45)' : undefined,
					opacity: typed ? 1 : 0.45,
					scale: String(pressed ? 0.96 : 1),
				}}
			>
				{confirming ? 'Confirming on Solana…' : 'Buy tSpaceX'}
				<Center>
					<Ripple at={P.buyTap} />
				</Center>
			</div>
		</>
	);
};

const DetailRow: React.FC<{k: string; v: string; lime?: boolean}> = ({k, v, lime}) => (
	<div style={{display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderTop: `1px solid ${C.line}`}}>
		<div style={{color: C.muted, fontWeight: 600, fontSize: 26}}>{k}</div>
		<div style={{color: lime ? C.lime : C.white, fontWeight: 700, fontSize: 26}}>{v}</div>
	</div>
);

const Success: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useLayout();
	const t = frame - P.success;
	const s = pop(t, fps, 2, 9);
	return (
		<div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 110}}>
			<div
				style={{
					width: 210,
					height: 210,
					borderRadius: '50%',
					background: C.lime,
					boxShadow: '0 0 80px rgba(198,255,0,0.55)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					scale: String(s),
				}}
			>
				<CheckIcon size={130} progress={tw(t, 6, 16, 0, 1)} />
			</div>
			<div
				style={{
					color: C.white,
					fontWeight: 800,
					fontSize: 52,
					letterSpacing: '-0.03em',
					marginTop: 50,
					opacity: tw(t, 6, 12, 0, 1),
				}}
			>
				Purchase complete
			</div>
			<div
				style={{
					color: C.lime,
					textShadow: GLOW,
					fontWeight: 800,
					fontSize: 76,
					letterSpacing: '-0.04em',
					marginTop: 10,
					opacity: tw(t, 9, 15, 0, 1),
					translate: `0 ${tw(t, 9, 18, 20, 0)}px`,
				}}
			>
				+0.89 tSpaceX
			</div>
			<div
				style={{
					alignSelf: 'stretch',
					marginTop: 60,
					padding: '8px 26px',
					borderRadius: 24,
					background: C.card,
					border: `1px solid ${C.line}`,
					opacity: tw(t, 12, 20, 0, 1),
				}}
			>
				<DetailRow k="You paid" v="1.00 USDC" />
				<DetailRow k="Network" v="Solana" />
				<DetailRow k="Status" v="Settled on-chain" lime />
			</div>
		</div>
	);
};

const Holding: React.FC<{token: Token; at: number}> = ({token, at}) => {
	const frame = useCurrentFrame();
	const {fps} = useLayout();
	const s = at === 0 ? 1 : pop(frame, fps, at, 12);
	if (frame < at) return null;
	return (
		<div style={{opacity: Math.min(1, s * 1.4), translate: `0 ${(1 - s) * -40}px`, scale: String(0.9 + 0.1 * s)}}>
			<TokenRow
				token={token}
				scale={0.9}
				active={frame - at < 14 && at > 0}
				right={
					<div style={{textAlign: 'right'}}>
						<div style={{color: C.white, fontWeight: 700, fontSize: 30}}>$1.00</div>
						<div style={{color: C.lime, fontWeight: 600, fontSize: 20, marginTop: 4}}>On-chain</div>
					</div>
				}
			/>
		</div>
	);
};

const Toast: React.FC<{label: string; at: number}> = ({label, at}) => {
	const frame = useCurrentFrame();
	const {fps} = useLayout();
	const t = frame - at;
	if (t < 0 || t > 30) return null;
	const inP = pop(t, fps, 0, 14);
	const out = tw(t, 22, 30, 0, 1, IN);
	return (
		<div
			style={{
				position: 'absolute',
				top: 74,
				left: 26,
				right: 26,
				padding: '20px 24px',
				borderRadius: 26,
				background: 'rgba(30,34,20,0.96)',
				border: `1px solid ${C.limeLine}`,
				boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 40px rgba(198,255,0,0.2)',
				display: 'flex',
				alignItems: 'center',
				gap: 18,
				fontFamily: FONT,
				translate: `0 ${(1 - inP) * -160 - out * 160}px`,
				opacity: 1 - out,
				zIndex: 5,
			}}
		>
			<div
				style={{
					width: 52,
					height: 52,
					borderRadius: '50%',
					background: C.lime,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<CheckIcon size={34} />
			</div>
			<div>
				<div style={{color: C.white, fontWeight: 800, fontSize: 30}}>{label}</div>
				<div style={{color: C.muted, fontWeight: 600, fontSize: 22, marginTop: 2}}>Settled on Solana</div>
			</div>
		</div>
	);
};

const Portfolio: React.FC = () => {
	const frame = useCurrentFrame();
	const count = frame >= P.xai ? 3 : frame >= P.openai ? 2 : 1;
	return (
		<>
			<ScreenHeader title="Portfolio" />
			<div
				style={{
					marginTop: 24,
					padding: '26px 28px',
					borderRadius: 28,
					background: 'linear-gradient(135deg,#1C2210,#121212)',
					border: `1px solid ${C.limeLine}`,
				}}
			>
				<div style={{color: C.muted, fontWeight: 600, fontSize: 26}}>Invested</div>
				<div
					style={{
						color: C.white,
						fontWeight: 800,
						fontSize: 84,
						letterSpacing: '-0.04em',
						fontVariantNumeric: 'tabular-nums',
						marginTop: 4,
					}}
				>
					${count}.00
				</div>
				<div style={{color: C.lime, fontWeight: 700, fontSize: 26, marginTop: 4}}>
					{count} position{count > 1 ? 's' : ''} · USDC
				</div>
			</div>
			<div style={{color: C.muted, fontWeight: 700, fontSize: 24, margin: '34px 0 16px', letterSpacing: '0.08em'}}>
				HOLDINGS
			</div>
			<div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
				<Holding token={TOKENS.xai} at={P.xai} />
				<Holding token={TOKENS.openai} at={P.openai} />
				<Holding token={TOKENS.spacex} at={0} />
			</div>
		</>
	);
};

/* ---------- captions ---------- */

const Caption: React.FC<{kicker: string; children: React.ReactNode}> = ({kicker, children}) => {
	const frame = useCurrentFrame();
	const {portrait} = useLayout();
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: portrait ? 'center' : 'flex-start',
				textAlign: portrait ? 'center' : 'left',
				gap: portrait ? 18 : 24,
				fontFamily: FONT,
			}}
		>
			<div
				style={{
					color: C.lime,
					fontWeight: 700,
					fontSize: portrait ? 44 : 44,
					letterSpacing: '0.02em',
					opacity: tw(frame, 0, 6, 0, 1),
				}}
			>
				{kicker}
			</div>
			<div
				style={{
					color: C.white,
					fontWeight: 800,
					fontSize: portrait ? 104 : 128,
					lineHeight: 1.0,
					letterSpacing: '-0.045em',
					opacity: tw(frame, 0, 6, 0, 1),
					translate: `0 ${tw(frame, 0, 10, 50, 0)}px`,
				}}
			>
				{children}
			</div>
		</div>
	);
};

const Lit: React.FC<{on: boolean; children: React.ReactNode}> = ({on, children}) => (
	<span style={{color: on ? C.lime : 'rgba(255,255,255,0.28)', textShadow: on ? GLOW : undefined}}>{children}</span>
);

const OwnedCaption: React.FC = () => {
	const frame = useCurrentFrame() + P.portfolio;
	const {portrait} = useLayout();
	return (
		<Caption kicker="Your portfolio">
			<Lit on>SpaceX.</Lit> {portrait ? null : <br />}
			<Lit on={frame >= P.openai}>OpenAI.</Lit> {portrait ? <br /> : null}
			<Lit on={frame >= P.xai}>xAI.</Lit>
		</Caption>
	);
};

/* ---------- scene ---------- */

const ProductInner: React.FC = () => {
	const frame = useCurrentFrame();
	const {portrait, fps} = useLayout();
	const phoneIn = pop(frame, fps, 0, 16);
	const phoneScale = portrait ? 1.08 : 0.8;
	const exit = tw(frame, 306, 315, 0, 1, IN);

	return (
		<AbsoluteFill
			style={{
				flexDirection: portrait ? 'column' : 'row',
				alignItems: 'center',
				justifyContent: portrait ? 'flex-start' : 'space-between',
				padding: portrait ? '120px 80px 0' : '0 170px 0 150px',
				opacity: 1 - exit,
			}}
		>
			<div
				style={{
					position: 'relative',
					width: portrait ? '100%' : 860,
					height: portrait ? 270 : 420,
					display: 'flex',
					alignItems: 'center',
					justifyContent: portrait ? 'center' : 'flex-start',
				}}
			>
				<Sequence name="Caption: pick" durationInFrames={P.buy} layout="none">
					<Caption kicker="Browse">Pick a company.</Caption>
				</Sequence>
				<Sequence name="Caption: pay" from={P.buy} durationInFrames={P.success - P.buy} layout="none">
					<Caption kicker="Buy">
						Pay just <Lit on>$1.</Lit>
					</Caption>
				</Sequence>
				<Sequence
					name="Caption: done"
					from={P.success}
					durationInFrames={P.portfolio - P.success}
					layout="none"
				>
					<Caption kicker="Settled on Solana">
						Done in <Lit on>seconds.</Lit>
					</Caption>
				</Sequence>
				<Sequence name="Caption: owned" from={P.portfolio} layout="none">
					<OwnedCaption />
				</Sequence>
			</div>
			<div
				style={{
					width: 620 * phoneScale,
					height: PHONE_H * phoneScale,
					marginTop: portrait ? 40 : 0,
					translate: `0 ${(1 - phoneIn) * 300}px`,
					opacity: Math.min(1, phoneIn * 2),
				}}
			>
				<Phone style={{scale: String(phoneScale), transformOrigin: 'top left'}}>
					<Screen start={0} end={P.buy}>
						<Markets />
					</Screen>
					<Screen start={P.buy} end={P.success}>
						<Buy />
					</Screen>
					<Screen start={P.success} end={P.portfolio}>
						<Success />
					</Screen>
					<Screen start={P.portfolio} end={400}>
						<Portfolio />
					</Screen>
					<Toast label="Bought tOpenAI" at={P.openai} />
					<Toast label="Bought txAI" at={P.xai} />
				</Phone>
			</div>
		</AbsoluteFill>
	);
};

export const Product = Interactive.create({Component: ProductInner, layout: 'absolute-fill', schema: {}});

