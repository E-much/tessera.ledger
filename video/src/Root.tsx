import React from 'react';
import {Composition, continueRender, delayRender, staticFile} from 'remotion';
import {Main} from './Main';
import {FPS, H, W} from './theme';

const weights = [400, 500, 600, 700, 800, 900];
const handle = delayRender('Loading Inter');
Promise.all(
  weights.map((w) => {
    const face = new FontFace('Inter', `url(${staticFile(`fonts/inter-latin-${w}-normal.woff2`)}) format('woff2')`, {
      weight: String(w),
      style: 'normal',
    });
    (document.fonts as unknown as {add: (f: FontFace) => void}).add(face);
    return face.load();
  }),
)
  .then(() => continueRender(handle))
  .catch((err) => {
    console.error(err);
    continueRender(handle);
  });

export const Root: React.FC = () => (
  <Composition id="TesseraLaunch" component={Main} durationInFrames={FPS * 30} fps={FPS} width={W} height={H} />
);
