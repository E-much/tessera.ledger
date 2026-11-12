import React from 'react';
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Backdrop} from './components/Backdrop';
import {Sfx} from './components/Sfx';
import {Hook} from './scenes/Hook';
import {Solution} from './scenes/Solution';
import {Product} from './scenes/Product';
import {Benefits} from './scenes/Benefits';
import {Close} from './scenes/Close';
import {C, eInOut, FONT, mix, p, sec} from './theme';

/** Product starts early so the browser rises under the outgoing "No accreditation." */
export const PRODUCT_LEAD = 14;

export const MUSIC_VOLUME = 0;

export const SCENES = {
  hook: [0, sec(5)],
  solution: [sec(5), sec(5)],
  product: [sec(10), sec(10)],
  benefits: [sec(20), sec(5)],
  close: [sec(25), sec(5)],
} as const;

/** Skewed lime + ink bands that wipe across and fully cover the frame at `at`. */
const LimeSweep: React.FC<{at: number; dur?: number}> = ({at, dur = 18}) => {
  const f = useCurrentFrame();
  if (f < at - dur || f > at + dur) return null;
  const t = p(f, at - dur, at + dur, eInOut);
  const x = mix(t, -2800, 2800);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div style={{position: 'absolute', top: -200, bottom: -200, left: x - 160, width: 2600, background: C.ink, transform: 'skewX(-14deg)'}} />
      <div style={{position: 'absolute', top: -200, bottom: -200, left: x, width: 2600, background: C.lime, transform: 'skewX(-14deg)'}} />
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: FONT, color: C.ink, background: C.bg, WebkitFontSmoothing: 'antialiased'}}>
      <Backdrop />
      {/* Original 96 BPM score (scripts/music.mjs); bars are 2.5s so every 5s cut hits a downbeat */}
      <Html5Audio src={staticFile('music/score.wav')} volume={MUSIC_VOLUME} />
      <Sequence from={SCENES.hook[0]} durationInFrames={SCENES.hook[1]}>
        <Hook />
      </Sequence>
      <Sequence from={SCENES.solution[0]} durationInFrames={SCENES.solution[1]}>
        <Solution />
      </Sequence>
      <Sequence from={SCENES.product[0] - PRODUCT_LEAD} durationInFrames={SCENES.product[1] + PRODUCT_LEAD}>
        <Product />
      </Sequence>
      <Sequence from={SCENES.benefits[0]} durationInFrames={SCENES.benefits[1]}>
        <Benefits />
      </Sequence>
      <Sequence from={SCENES.close[0]} durationInFrames={SCENES.close[1]}>
        <Close />
      </Sequence>
      <LimeSweep at={SCENES.benefits[0]} />
      <Sfx at={SCENES.benefits[0] - 16} name="whoosh" volume={0.7} />
    </AbsoluteFill>
  );
};
