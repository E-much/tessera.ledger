import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {KineticLine} from '../components/Kinetic';
import {Lock} from '../components/Lock';
import {Mark} from '../components/Brand';
import {Sfx} from '../components/Sfx';
import {HOOK_LOCK_END} from './Hook';
import {C, eIn, eInOut, eOut, eSoft, mix, p, sp, SNAP} from '../theme';

const UNLOCK = 8;
const MORPH = 30;
const TITLE = 40;
const TITLE_EXIT = 96;
const ODO_IN = 104;
const COUNT = [114, 168];
const ODO_EXIT = 194;
const ROWS = 200;
const STRIKES = [216, 223, 230];
const ROWS_EXIT = 240;
const NOKYC = 246;
const OUT = 288;

const MARK_POS = {x: 400, y: 540};

export const Solution: React.FC = () => {
  const f = useCurrentFrame();

  // --- Unlock + morph into the Tessera mark
  const open = sp(f, UNLOCK, {damping: 10, stiffness: 200, mass: 0.8});
  const morph = p(f, MORPH, MORPH + 26, eInOut);
  const lockX = mix(morph, HOOK_LOCK_END.x, MARK_POS.x);
  const lockY = mix(morph, HOOK_LOCK_END.y, MARK_POS.y);
  const lockScale = mix(morph, HOOK_LOCK_END.scale, 1.0) * (1 - p(f, MORPH + 10, MORPH + 22, eIn) * 0.6);
  const lockOp = 1 - p(f, MORPH + 12, MORPH + 20);
  const ring = p(f, UNLOCK + 4, UNLOCK + 44, eOut);
  const markAssemble = p(f, MORPH + 10, MORPH + 34, eOut);
  const titleOut = p(f, TITLE_EXIT, TITLE_EXIT + 16, eIn);

  // --- Odometer
  const odoIn = sp(f, ODO_IN, SNAP);
  const c = p(f, COUNT[0], COUNT[1], eSoft);
  const value = Math.max(1, Math.round(Math.pow(250000, 1 - c)));
  const landed = f >= COUNT[1];
  const land = sp(f, COUNT[1], {damping: 9, stiffness: 220, mass: 0.7});
  const odoOut = p(f, ODO_EXIT, ODO_EXIT + 14, eIn);
  const pillGrow = p(f, COUNT[1], COUNT[1] + 18, eOut);

  // --- KYC
  const rows = ['Accreditation checks', 'Brokerage paperwork', 'Weeks of approvals'];
  const rowsOut = p(f, ROWS_EXIT, ROWS_EXIT + 14, eIn);
  const slam = sp(f, NOKYC, {damping: 13, stiffness: 210, mass: 0.9});
  const out = p(f, OUT, 300, eIn);

  const ticks: number[] = [];
  for (let t = COUNT[0]; t < COUNT[1] - 2; t += 3) ticks.push(t);

  return (
    <AbsoluteFill style={{transform: `scale(${mix(out, 1, 1.35)})`, opacity: 1 - out * 0.9, filter: `blur(${out * 16}px)`}}>
      {/* Shockwave rings on unlock */}
      {f >= UNLOCK + 4 && f < UNLOCK + 50 && (
        <>
          {[0, 1].map((k) => {
            const r = p(f, UNLOCK + 4 + k * 6, UNLOCK + 48 + k * 6, eOut);
            return (
              <div
                key={k}
                style={{
                  position: 'absolute',
                  left: 960,
                  top: 540,
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  border: `${mix(r, 18, 1)}px solid ${C.lime}`,
                  transform: `translate(-50%,-50%) scale(${mix(r, 1, 9 + k * 3)})`,
                  opacity: 1 - r,
                }}
              />
            );
          })}
        </>
      )}

      {/* Lock (inherited from the hook) */}
      {lockOp > 0 && (
        <div
          style={{
            position: 'absolute',
            left: lockX,
            top: lockY,
            transform: `translate(-50%,-50%) scale(${lockScale}) rotate(${morph * -30}deg)`,
            opacity: lockOp,
          }}
        >
          <Lock size={170} open={open} glow={p(f, UNLOCK + 2, UNLOCK + 10)} />
        </div>
      )}

      {/* Mark + title */}
      <div
        style={{
          position: 'absolute',
          left: MARK_POS.x,
          top: MARK_POS.y,
          transform: `translate(-50%,-50%) scale(${mix(titleOut, 1, 0.6)}) rotate(${titleOut * 30}deg)`,
          opacity: 1 - titleOut,
          filter: `blur(${titleOut * 10}px)`,
        }}
      >
        <Mark size={200} assemble={markAssemble} />
      </div>
      <div style={{position: 'absolute', left: MARK_POS.x + 140, top: MARK_POS.y - 70}}>
        <KineticLine
          words={[{text: 'tessera.', hl: 'brand'}, {text: 'opens', hl: 'marker'}, 'it.']}
          start={TITLE}
          exit={TITLE_EXIT}
          size={140}
          align="left"
          stagger={5}
        />
      </div>

      {/* Odometer */}
      {f >= ODO_IN && odoOut < 1 && (
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            opacity: Math.min(1, odoIn * 1.5) * (1 - odoOut),
            transform: `translateY(${mix(odoIn, 80, 0) - odoOut * 90}px) scale(${mix(odoOut, 1, 0.9)})`,
            filter: `blur(${mix(Math.min(1, odoIn), 12, 0) + odoOut * 12}px)`,
          }}
        >
          <div
            style={{
              fontSize: 46,
              fontWeight: 600,
              color: C.mute,
              letterSpacing: '-0.02em',
              marginBottom: 18,
            }}
          >
            Minimum investment
          </div>
          <div
            style={{
              position: 'relative',
              fontSize: 300,
              fontWeight: 800,
              letterSpacing: '-0.055em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              color: C.ink,
              transform: `scale(${landed ? mix(land, 1.18, 1) : 1})`,
              padding: '0.02em 0.16em 0.06em',
            }}
          >
            {landed && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: C.lime,
                  borderRadius: 48,
                  transform: `scale(${mix(pillGrow, 0.3, 1)})`,
                  opacity: pillGrow,
                  boxShadow: '0 40px 90px -30px rgba(141,184,0,0.7)',
                }}
              />
            )}
            <span style={{position: 'relative'}}>${value.toLocaleString('en-US')}</span>
          </div>
          <div
            style={{
              marginTop: 34,
              fontSize: 46,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: C.ink,
              opacity: p(f, COUNT[1] + 6, COUNT[1] + 20),
              transform: `translateY(${mix(p(f, COUNT[1] + 6, COUNT[1] + 26), 20, 0)}px)`,
            }}
          >
            <span style={{textDecoration: 'line-through', color: C.faint, textDecorationThickness: 4}}>$250,000</span>
            <span style={{color: C.faint, margin: '0 18px'}}>→</span>
            One dollar. Any company.
          </div>
        </AbsoluteFill>
      )}

      {/* KYC rows */}
      {f >= ROWS && rowsOut < 1 && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 30}}>
          {rows.map((r, i) => {
            const a = ROWS + i * 4;
            const tin = p(f, a, a + 20, eOut);
            const st = p(f, STRIKES[i], STRIKES[i] + 10, eOut);
            const o = p(f, ROWS_EXIT + i * 2, ROWS_EXIT + i * 2 + 14, eIn);
            return (
              <div
                key={r}
                style={{
                  position: 'relative',
                  fontSize: 84,
                  fontWeight: 700,
                  letterSpacing: '-0.035em',
                  color: st > 0.5 ? '#B4B4B8' : C.ink,
                  opacity: tin * (1 - o),
                  transform: `translateY(${mix(tin, 50, 0) - o * 60}px)`,
                  filter: `blur(${mix(tin, 8, 0) + o * 10}px)`,
                  lineHeight: 1.05,
                }}
              >
                {r}
                <div
                  style={{
                    position: 'absolute',
                    left: -16,
                    right: -16,
                    top: '54%',
                    height: 9,
                    borderRadius: 9,
                    background: C.ink,
                    transform: `scaleX(${st})`,
                    transformOrigin: '0 50%',
                  }}
                />
              </div>
            );
          })}
        </AbsoluteFill>
      )}

      {/* No KYC. */}
      {f >= NOKYC && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 52,
              transform: `scale(${mix(slam, 1.6, 1)})`,
              filter: `blur(${mix(Math.min(1, slam * 1.3), 18, 0)}px)`,
              opacity: Math.min(1, (f - NOKYC) / 5),
            }}
          >
            <span
              style={{
                fontSize: 230,
                fontWeight: 800,
                letterSpacing: '-0.055em',
                lineHeight: 1,
                color: C.ink,
              }}
            >
              No
            </span>
            <span
              style={{
                fontSize: 230,
                fontWeight: 800,
                letterSpacing: '-0.055em',
                lineHeight: 1,
                background: C.lime,
                color: C.ink,
                padding: '0.02em 0.18em 0.08em',
                borderRadius: 44,
              }}
            >
              KYC.
            </span>
          </div>
          <div
            style={{
              marginTop: 40,
              fontSize: 50,
              fontWeight: 600,
              letterSpacing: '-0.025em',
              color: C.mute,
              opacity: p(f, NOKYC + 10, NOKYC + 26),
              transform: `translateY(${mix(p(f, NOKYC + 10, NOKYC + 30), 24, 0)}px)`,
            }}
          >
            Connect a wallet. Buy in seconds.
          </div>
        </AbsoluteFill>
      )}

      {/* Sound */}
      <Sfx at={UNLOCK} name="unlock" volume={0.9} />
      <Sfx at={UNLOCK + 4} name="bloom" volume={0.45} />
      <Sfx at={MORPH + 4} name="whoosh" volume={0.5} />
      <Sfx at={TITLE_EXIT} name="whoosh_short" volume={0.45} />
      {ticks.map((t, i) => (
        <Sfx key={t} at={t} name="tick" volume={0.25 + 0.5 * (i / ticks.length)} />
      ))}
      <Sfx at={COUNT[1]} name="pop" volume={0.9} />
      <Sfx at={COUNT[1]} name="impact" volume={0.5} />
      <Sfx at={ODO_EXIT} name="whoosh_short" volume={0.4} />
      {STRIKES.map((s) => (
        <Sfx key={s} at={s} name="swipe" volume={0.7} />
      ))}
      <Sfx at={NOKYC + 2} name="impact" volume={0.85} />
      <Sfx at={OUT - 4} name="whoosh" volume={0.55} />
    </AbsoluteFill>
  );
};
