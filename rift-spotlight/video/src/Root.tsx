import React from "react";
import { Composition } from "remotion";
import { Spot } from "./spot/Spot";
import TL from "./timeline.json";

export const Root: React.FC = () => (
  <Composition id="Spotlight" component={Spot} width={1920} height={1080} fps={TL.fps} durationInFrames={Math.round(TL.duration * TL.fps)} />
);
