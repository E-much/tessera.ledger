import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {KineticLine} from '../components/Kinetic';
import {Lock} from '../components/Lock';
import {Sfx} from '../components/Sfx';
import {C, eIn, eInOut, eSoft, mix, p, sp, SNAP} from '../theme';

// Local timeline (60fps)
const A_EXIT = 92; // "$7T market" leaves
const B_IN = 108; // "Locked behind" arrives
const CHIPS = [150, 162, 174];
const SHAKE = 198;
const PUSH = 226; // lock pushes to centre, rest falls away
export const HOOK_LOCK_END = {x: 960, y: 540, scale: 2.2};

const Chip: React.FC<{text: string; at: number; x: number; y: number; rot: number; out: number}> = ({
  text,
  at,
  x,
  y,
  rot,
  out,
}) => {
  const f = useCurrentFrame();
  const s = sp(f, at, SNAP);
  const scale = mix(s, 1.9, 1);
  const op = Math.min(1, (f - at) / 4);
  const blur = mix(Math.min(1, s * 1.4), 14, 0);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${scale})`,
        opacity: f < at ? 0 : op * (1 - out),
        filter: `blur(${blur + out * 12}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '22px 34px 22px 24px',
        background: '#fff',
        borderRadius: 999,
        border: `1.5px solid ${C.lineStrong}`,
        boxShadow: '0 24px 60px -18px rgba(17,17,17,0.22), 0 2px 6px rgba(17,17,17,0.06)',
        fontSize: 42,
        fontWeight: 650,
        letterSpacing: '-0.025em',
        color: C.ink,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: C.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={20} height={20} viewBox="0 0 20 20">
          <path d="M5 5 L15 15 M15 5 L5 15" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
        </svg>
      </span>
      {text}
    </div>
  );
};

export const Hook: React.FC = () => {
  const f = useCurrentFrame();

  // Camera: slow, continuous push-in through the whole scene
  const cam = mix(p(f, 0, 300, eSoft), 1, 1.08);

  // Phase A
  const ghostX = mix(f / 300, 120, -380);
  const ghostOp = 1 - p(f, A_EXIT - 4, A_EXIT + 20, eIn);
  const sheen = p(f, 18, 70, eSoft);

  // Phase B: lock
  const lockS = sp(f, B_IN - 6, {damping: 11, stiffness: 150, mass: 1});
  const lockY0 = mix(lockS, -520, 0);
  const shake = f > SHAKE && f < SHAKE + 26 ? Math.sin((f - SHAKE) * 1.9) * 9 * (1 - (f - SHAKE) / 26) : 0;
  const push = p(f, PUSH, 300, eInOut);
  const lockBase = {x: 960, y: 262, scale: 1.3};
  const lockX = mix(push, lockBase.x, HOOK_LOCK_END.x);
  const lockY = mix(push, lockBase.y, HOOK_LOCK_END.y) + lockY0 * (1 - push);
  const lockScale = mix(push, lockBase.scale, HOOK_LOCK_END.scale) / cam; // counter the camera so the hand-off is exact
  const restOut = p(f, PUSH, PUSH + 34, eIn);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{transform: `scale(${cam})`}}>
        {/* Ghost numerals for depth */}
        <div
          style={{
            position: 'absolute',
            top: 520,
            left: ghostX,
            transform: 'translateY(-50%)',
            fontSize: 330,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            color: 'transparent',
            WebkitTextStroke: '2px rgba(17,17,17,0.06)',
            whiteSpace: 'nowrap',
            opacity: ghostOp,
          }}
        >
          $7,000,000,000,000
        </div>

        {/* Headline A — fully composed on frame 0 (cover) */}
        <div style={{position: 'absolute', top: 372, left: 0, right: 0}}>
          <KineticLine words={['Private', 'equity', 'is', 'a']} start={-200} exit={A_EXIT} size={150} />
          <div style={{height: 26}} />
          <div style={{position: 'relative'}}>
            <KineticLine
              words={[{text: '$7T', hl: 'pill'}, 'market.']}
              start={-200}
              exit={A_EXIT + 4}
              size={150}
            />
            {/* sheen across the pill */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background: `linear-gradient(100deg, transparent ${mix(sheen, -20, 100)}%, rgba(255,255,255,0.35) ${mix(sheen, -10, 110)}%, transparent ${mix(sheen, 0, 120)}%)`,
                mixBlendMode: 'overlay',
                opacity: 1 - p(f, A_EXIT, A_EXIT + 6),
              }}
            />
          </div>
        </div>

        {/* Headline B */}
        <div
          style={{
            position: 'absolute',
            top: 486,
            left: 0,
            right: 0,
            opacity: 1 - restOut,
            filter: `blur(${restOut * 14}px)`,
            transform: `scale(${mix(restOut, 1, 0.92)})`,
          }}
        >
          <KineticLine words={['Locked', 'behind']} start={B_IN} size={136} />
          <div style={{height: 24}} />
          <KineticLine
            words={[{text: '$250,000', hl: 'ink'}, 'minimums.']}
            start={B_IN + 10}
            size={136}
            color={C.ink}
          />
        </div>

        {/* Barrier chips */}
        <Chip text="Accredited investors only" at={CHIPS[0]} x={430} y={150} rot={-6} out={restOut} />
        <Chip text="7–10 year lockups" at={CHIPS[1]} x={1520} y={196} rot={5} out={restOut} />
        <Chip text="Paperwork & gatekeepers" at={CHIPS[2]} x={1400} y={930} rot={-3} out={restOut} />
      </AbsoluteFill>

      {/* Lock lives outside the camera so it can hand off exactly to the next scene */}
      {f >= B_IN - 8 && (
        <div
          style={{
            position: 'absolute',
            left: lockX,
            top: lockY,
            transform: `translate(-50%,-50%) scale(${lockScale * cam}) rotate(${shake}deg)`,
          }}
        >
          <div style={{filter: 'drop-shadow(0 30px 40px rgba(17,17,17,0.25))'}}>
            <Lock size={170} />
          </div>
        </div>
      )}

      {/* Sound */}
      <Sfx at={A_EXIT - 2} name="whoosh_short" volume={0.55} />
      <Sfx at={B_IN + 2} name="impact" volume={0.9} />
      <Sfx at={B_IN + 4} name="whoosh" volume={0.35} />
      {CHIPS.map((c) => (
        <Sfx key={c} at={c + 3} name="thud" volume={0.65} />
      ))}
      <Sfx at={SHAKE} name="unlock" volume={0.25} />
      <Sfx at={PUSH + 6} name="whoosh_down" volume={0.5} />
    </AbsoluteFill>
  );
};
