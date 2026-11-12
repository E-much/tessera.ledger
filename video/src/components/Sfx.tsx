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

export const Sfx: React.FC<{at: number; name: SfxName; volume?: number}> = ({at, name, volume = 1}) => (
  <Sequence from={at} durationInFrames={150} layout="none">
    <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);
