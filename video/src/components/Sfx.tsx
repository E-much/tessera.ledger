import React from 'react';
import {Html5Audio, Sequence, staticFile} from 'remotion';

export type SfxName =
  | 'whoosh'
  | 'whoosh_short'
  | 'whoosh_down'
  | 'click'
  | 'key'
  | 'tick'
  | 'pop'
  | 'impact'
  | 'thud'
  | 'unlock'
  | 'swipe'
  | 'chime'
  | 'riser'
  | 'shimmer'
  | 'bloom';

/** Master level for all effects, so they sit under the score. */
export const SFX_GAIN = 0.5;
/** Air/sweep sounds get pulled down further: they mask the music most. */
const SWEEP = new Set<SfxName>(['whoosh', 'whoosh_short', 'whoosh_down', 'swipe', 'riser']);
const SWEEP_GAIN = 0.55;

export const Sfx: React.FC<{at: number; name: SfxName; volume?: number}> = ({at, name, volume = 1}) => (
  <Sequence from={at} durationInFrames={150} layout="none">
    <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={volume * SFX_GAIN * (SWEEP.has(name) ? SWEEP_GAIN : 1)} />
  </Sequence>
);
