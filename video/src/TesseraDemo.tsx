import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Track, staticFile, useVideoConfig} from 'remotion';
import {Background} from './components/Background';
import {Benefits} from './scenes/Benefits';
import {Cover} from './scenes/Cover';
import {Hook} from './scenes/Hook';
import {Outro} from './scenes/Outro';
import {Product} from './scenes/Product';
import {Solution} from './scenes/Solution';

/** 30s Tessera PE product demo. Layout adapts to landscape or portrait. */
export const TesseraDemo: React.FC = () => {
	const {fps} = useVideoConfig();
	return (
		<AbsoluteFill>
			<Background />
			<Track name="Scenes">
				<Cover name="Cover" durationInFrames={1.5 * fps} />
				<Hook name="Hook: $7T locked" from={1.5 * fps} durationInFrames={4.5 * fps} />
				<Solution name="Solution: $1, No KYC" from={6 * fps} durationInFrames={4.5 * fps} />
				<Product name="Product walkthrough" from={10.5 * fps} durationInFrames={10.5 * fps} />
				<Benefits name="Benefits" from={21 * fps} durationInFrames={5 * fps} />
				<Outro name="Payoff + CTA" from={26 * fps} durationInFrames={4 * fps} />
			</Track>
			<Track name="Impacts">
				<Audio name="Cover hit" src={staticFile('sfx/impact.wav')} from={0} durationInFrames={18} volume={0.75} />
				<Audio name="Lock impact" src={staticFile('sfx/impact.wav')} from={145} durationInFrames={18} volume={0.75} />
				<Audio name="$1 slam" src={staticFile('sfx/impact.wav')} from={234} durationInFrames={18} volume={0.75} />
				<Audio name="No KYC slam" src={staticFile('sfx/impact.wav')} from={268} durationInFrames={18} volume={0.75} />
				<Audio name="Logo hit" src={staticFile('sfx/impact.wav')} from={832} durationInFrames={18} volume={0.75} />
			</Track>
			<Track name="Whooshes">
				<Audio name="Cover out" src={staticFile('sfx/whoosh.wav')} from={36} durationInFrames={17} volume={0.5} />
				<Audio name="To locked" src={staticFile('sfx/whoosh-fast.wav')} from={101} durationInFrames={9} volume={0.5} />
				<Audio name="To compare" src={staticFile('sfx/whoosh-fast.wav')} from={214} durationInFrames={9} volume={0.5} />
				<Audio name="Phone in" src={staticFile('sfx/whoosh.wav')} from={306} durationInFrames={17} volume={0.5} />
				<Audio name="To buy" src={staticFile('sfx/whoosh-fast.wav')} from={396} durationInFrames={9} volume={0.5} />
				<Audio name="To portfolio" src={staticFile('sfx/whoosh-fast.wav')} from={512} durationInFrames={9} volume={0.5} />
				<Audio name="To benefits" src={staticFile('sfx/whoosh.wav')} from={622} durationInFrames={17} volume={0.5} />
				<Audio name="Benefit 2 cut" src={staticFile('sfx/whoosh-fast.wav')} from={677} durationInFrames={9} volume={0.5} />
				<Audio name="Benefit 3 cut" src={staticFile('sfx/whoosh-fast.wav')} from={727} durationInFrames={9} volume={0.5} />
				<Audio name="To payoff" src={staticFile('sfx/whoosh.wav')} from={772} durationInFrames={17} volume={0.5} />
			</Track>
			<Track name="UI sounds">
				<Audio name="$7T count" src={staticFile('sfx/ticks.wav')} from={49} durationInFrames={21} volume={0.7} />
				<Audio name="Chip minimums" src={staticFile('sfx/tap.wav')} from={113} durationInFrames={3} volume={0.7} />
				<Audio name="Chip paperwork" src={staticFile('sfx/tap.wav')} from={121} durationInFrames={3} volume={0.7} />
				<Audio name="Lock slam" src={staticFile('sfx/lock.wav')} from={145} durationInFrames={8} volume={0.7} />
				<Audio name="Unlock" src={staticFile('sfx/unlock.wav')} from={183} durationInFrames={14} volume={0.7} />
				<Audio name="Strike minimums" src={staticFile('sfx/key.wav')} from={224} durationInFrames={2} volume={0.7} />
				<Audio name="Strike paperwork" src={staticFile('sfx/key.wav')} from={258} durationInFrames={2} volume={0.7} />
				<Audio name="Tap tSpaceX" src={staticFile('sfx/tap.wav')} from={377} durationInFrames={3} volume={0.7} />
				<Audio name="Key 1" src={staticFile('sfx/key.wav')} from={423} durationInFrames={2} volume={0.7} />
				<Audio name="Tap buy" src={staticFile('sfx/tap.wav')} from={455} durationInFrames={3} volume={0.7} />
				<Audio name="Success chime" src={staticFile('sfx/chime.wav')} from={471} durationInFrames={27} volume={0.7} />
				<Audio name="Logo chime" src={staticFile('sfx/chime.wav')} from={836} durationInFrames={27} volume={0.7} />
			</Track>
			<Track name="Pops">
				<Audio name="Success pop" src={staticFile('sfx/pop.wav')} from={469} durationInFrames={7} volume={0.55} />
				<Audio name="Bought tOpenAI" src={staticFile('sfx/pop.wav')} from={540} durationInFrames={7} volume={0.55} />
				<Audio name="Bought txAI" src={staticFile('sfx/pop-high.wav')} from={565} durationInFrames={7} volume={0.55} />
				<Audio name="Benefit 1" src={staticFile('sfx/pop.wav')} from={632} durationInFrames={7} volume={0.55} />
				<Audio name="Benefit 2" src={staticFile('sfx/pop.wav')} from={682} durationInFrames={7} volume={0.55} />
				<Audio name="Benefit 3" src={staticFile('sfx/pop.wav')} from={732} durationInFrames={7} volume={0.55} />
				<Audio name="URL pop" src={staticFile('sfx/pop-high.wav')} from={844} durationInFrames={7} volume={0.55} />
			</Track>
		</AbsoluteFill>
	);
};
