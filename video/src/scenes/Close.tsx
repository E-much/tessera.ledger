import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {KineticLine} from '../components/Kinetic';
import {LogoTile, Wordmark} from '../components/Brand';
import {Sfx} from '../components/Sfx';
import {C, eInOut, eOut, eSoft, mix, p, sp, SNAP} from '../theme';

const ASSEMBLE = [6, 52];
const SETTLE = [50, 84];
const WORD = 62;
const TAG = 96;
const URL = 140;

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const asm = p(f, ASSEMBLE[0], ASSEMBLE[1], eSoft);
  const pop = sp(f, 0, SNAP);
  const settle = p(f, SETTLE[0], SETTLE[1], eInOut);
  const word = p(f, WORD, WORD + 30, eOut);
  const url = sp(f, URL, SNAP);
  const drift = mix(p(f, 60, 300, eSoft), 1, 1.035);

  // Lockup geometry: mark + wordmark centred as a group
  const markSize = 168;
  const wordW = 640;
  const gap = 34;
  const groupW = markSize + gap + wordW;
  const markFinalX = 960 - groupW / 2 + markSize / 2;
  const markX = mix(settle, 960, markFinalX);
  const markY = mix(settle, 540, 360);
  const markScale = mix(settle, 1.7, 1);
  const spin = mix(asm, -8, 0);

  const flash = 1 - p(f, 0, 26, eOut);

  return (
    <AbsoluteFill style={{transform: `scale(${drift})`}}>
      {/* soft centre glow */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 50% 45% at 50% 46%, rgba(198,255,0,0.28), rgba(198,255,0,0) 70%)',
          opacity: p(f, 10, 80),
        }}
      />
      <AbsoluteFill style={{background: '#fff', opacity: flash * 0.6}} />

      <div
        style={{
          position: 'absolute',
          left: markX,
          top: markY,
          transform: `translate(-50%,-50%) scale(${markScale * mix(pop, 0.35, 1)}) rotate(${spin}deg)`,
        }}
      >
        <LogoTile size={markSize} assemble={asm} radius={0.26} style={{boxShadow: '0 40px 80px -30px rgba(42,106,20,0.45)'}} />
      </div>

      {/* wordmark, revealed from behind the mark */}
      <div
        style={{
          position: 'absolute',
          left: markFinalX + markSize / 2 + gap,
          top: 360,
          transform: 'translateY(-50%)',
          width: wordW + 120,
          overflow: 'hidden',
          padding: '10px 0 24px',
        }}
      >
        <div
          style={{
            transform: `translateX(${mix(word, -110, 0)}%)`,
            filter: `blur(${mix(word, 8, 0)}px)`,
          }}
        >
          <Wordmark size={176} />
        </div>
      </div>

      <div style={{position: 'absolute', top: 560, left: 0, right: 0}}>
        <KineticLine
          words={['Private', 'Equity', 'for', {text: 'Everyone', hl: 'marker'}]}
          start={TAG}
          stagger={6}
          size={104}
          markerDelay={14}
        />
      </div>

      {f >= URL && (
        <div
          style={{
            position: 'absolute',
            top: 790,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 22,
              padding: '22px 30px 22px 40px',
              borderRadius: 999,
              background: C.ink,
              color: '#fff',
              fontSize: 54,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              transform: `scale(${mix(url, 0.6, 1)}) translateY(${mix(url, 40, 0)}px)`,
              opacity: Math.min(1, url * 2),
              boxShadow: '0 40px 80px -30px rgba(17,17,17,0.55)',
            }}
          >
            <span>
              tessera<span style={{color: C.lime}}>.pe</span>
            </span>
            <span
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                background: C.lime,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width={28} height={28} viewBox="0 0 28 28">
                <path d="M6 14 H22 M15 7 L22 14 L15 21" fill="none" stroke={C.ink} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      )}

      <Sfx at={0} name="impact" volume={0.7} />
      <Sfx at={2} name="shimmer" volume={0.7} />
      <Sfx at={SETTLE[0]} name="whoosh_short" volume={0.45} />
      <Sfx at={TAG + 2} name="whoosh" volume={0.35} />
      <Sfx at={URL} name="pop" volume={0.8} />
      <Sfx at={URL + 6} name="chime" volume={0.4} />
    </AbsoluteFill>
  );
};
