import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from "remotion";
import EV from "./events.json";
import { Close } from "./scenes/Close";
import { Coverage } from "./scenes/Coverage";
import { Graph, Spine } from "./scenes/Graph";
import { Hook } from "./scenes/Hook";
import { Problem } from "./scenes/Problem";
import { LogoTile, SolutionReveal, Widget } from "./scenes/Solution";
import { BG, C, E, FPS, p, wt } from "./theme";
import { FontFaces, Grid, HUD } from "./ui";

const SECTIONS: [number, string][] = [
  [0, "The question"],
  [EV.cuts[0], "The problem"],
  [EV.cuts[1], "One click"],
  [EV.cuts[2], "Routing"],
  [wt("reliability", 0) - 0.2, "Reliability"],
  [EV.cuts[3], "Coverage"],
  [EV.cuts[4], "rift.trade"],
];

const between = (t: number, a: number, b: number) => t >= a - 0.05 && t < b + 0.05;

export const Main: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([document.fonts.load("600 40px InterV"), document.fonts.load("400 20px Sometype")]).then(() => document.fonts.ready).then(() => continueRender(handle));
  }, [handle]);

  let idx = 0;
  SECTIONS.forEach(([s], i) => {
    if (t >= s) idx = i;
  });
  const hudOp = p(f, 0.1, 0.5) * (1 - p(f, EV.cuts[4] - 0.3, 0.3, E.exit));

  return (
    <AbsoluteFill style={{ background: BG }}>
      <FontFaces />
      {between(t, 0, EV.cuts[0]) && <Hook />}
      {between(t, EV.cuts[0], EV.cuts[1]) && <Problem />}
      {between(t, EV.cuts[1], EV.logoFly + 0.4) && <SolutionReveal />}
      {between(t, EV.logoFly, EV.pullback + 1) && <Widget />}
      {between(t, EV.logoIn, EV.pullback + 0.6) && <LogoTile />}
      <Graph />
      <Spine />
      <Coverage />
      <Close />
    </AbsoluteFill>
  );
};
