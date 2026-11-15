import React from "react";
import { useCurrentFrame } from "remotion";
import { C, E, F, p, wt } from "../theme";
import { Words } from "../ui";

// "Moving money across chains shouldn't take five tabs, three bridges, and a prayer."
const T = (i: number) => wt("hook", i);
const OUT = 4.72; // exit, lands the cut on the beat at 5.0

const TAB_W = 236;
const TAB_X = (i: number) => 120 + i * (TAB_W + 24);
const TAB_Y = 300;

const Tab: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const k = p(f, T(6) + i * 0.075, 0.45, E.snap); // "five" → five tabs, staggered
  const out = p(f, OUT + i * 0.02, 0.28, E.exit);
  const fail = p(f, T(12), 0.2, E.settle); // "prayer" → everything greys out
  return (
    <g transform={`translate(${TAB_X(i)}, ${TAB_Y + (1 - k) * 26 - out * 40})`} opacity={k * (1 - out)}>
      <path
        d={`M0 56 L16 8 Q19 0 28 0 H${TAB_W - 28} Q${TAB_W - 19} 0 ${TAB_W - 16} 8 L${TAB_W} 56`}
        fill={C.panel}
        stroke={fail > 0.5 ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.34)"}
        strokeWidth={1.5}
      />
      <text x={38} y={36} fontFamily={F.mono} fontSize={17} letterSpacing="0.2em" fill={fail > 0.5 ? C.dim : C.ink}>
        {`TAB 0${i + 1}`}
      </text>
      <text x={TAB_W - 46} y={36} fontFamily={F.mono} fontSize={17} fill={C.dim}>
        ×
      </text>
    </g>
  );
};

// three bridges arc between tabs (1→3, 2→4, 3→5), drawn on "three bridges"
const Bridge: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const k = p(f, T(8) + i * 0.12, 0.55, E.settle);
  const out = p(f, OUT, 0.28, E.exit);
  const x1 = TAB_X(i) + TAB_W / 2;
  const x2 = TAB_X(i + 2) + TAB_W / 2;
  const top = 168 + i * 26;
  const d = `M${x1} ${TAB_Y - 6} C${x1} ${top} ${x2} ${top} ${x2} ${TAB_Y - 6}`;
  const len = (x2 - x1) * 1.35;
  const fail = p(f, T(12), 0.2, E.settle);
  return (
    <g opacity={1 - out}>
      <path
        d={d}
        fill="none"
        stroke={fail > 0.5 ? "rgba(255,255,255,0.18)" : C.orange}
        strokeWidth={2}
        strokeDasharray={`${len}`}
        strokeDashoffset={(1 - k) * len}
      />
      <text
        x={(x1 + x2) / 2}
        y={top + 26 - 12}
        textAnchor="middle"
        fontFamily={F.mono}
        fontSize={15}
        letterSpacing="0.24em"
        fill={fail > 0.5 ? C.dim : C.orangeHi}
        opacity={k}
      >
        {`BRIDGE 0${i + 1}`}
      </text>
    </g>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const words = [
    { w: "Moving ", t: T(0) },
    { w: "money ", t: T(1) },
    { w: "across ", t: T(2) },
    { w: "chains", t: T(3) },
    { w: "\n", t: 0 },
    { w: "shouldn’t ", t: T(4) },
    { w: "take ", t: T(5) },
    { w: "five ", t: T(6) },
    { w: "tabs,", t: T(7) },
    { w: "\n", t: 0 },
    { w: "three ", t: T(8) },
    { w: "bridges, ", t: T(9) },
    { w: "and ", t: T(10) },
    { w: "a ", t: T(11) },
    { w: "prayer", t: T(12) },
    { w: ".", t: T(12) + 0.18, color: C.orange },
  ];
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Tab key={i} i={i} />
        ))}
        {[0, 1, 2].map((i) => (
          <Bridge key={i} i={i} />
        ))}
        {/* tab bar baseline */}
        <line
          x1={120}
          x2={120 + (1800 - 120) * p(f, T(6) - 0.1, 0.6, E.settle)}
          y1={TAB_Y + 56}
          y2={TAB_Y + 56}
          stroke="rgba(255,255,255,0.16)"
          strokeWidth={1.5}
          opacity={1 - p(f, OUT, 0.28, E.exit)}
        />
      </svg>
      <Words words={words} size={112} exitAt={OUT} style={{ position: "absolute", left: 114, top: 526 }} />
    </>
  );
};
