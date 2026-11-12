import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {KineticLine} from '../components/Kinetic';
import {Monogram} from '../components/Brand';
import {TOKENS} from '../components/Explorer';
import {Sfx} from '../components/Sfx';
import {C, eIn, eOut, eSoft, mix, p, sp, SNAP} from '../theme';

const B1 = 10;
const B1_EXIT = 138;
const B2 = 154;
const OUT = 270;

const Eyebrow: React.FC<{n: string; label: string; at: number; exit?: number}> = ({n, label, at, exit}) => {
  const f = useCurrentFrame();
  const t = p(f, at, at + 20);
  const o = exit !== undefined ? p(f, exit, exit + 12, eIn) : 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        fontSize: 30,
        fontWeight: 700,
        letterSpacing: '-0.01em',
        color: C.mute,
        opacity: t * (1 - o),
        transform: `translateX(${mix(t, -30, 0)}px) translateY(${-o * 30}px)`,
        marginBottom: 34,
      }}
    >
      <span
        style={{
          padding: '6px 14px',
          borderRadius: 10,
          background: C.ink,
          color: C.lime,
          fontSize: 24,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {n}
      </span>
      {label}
    </div>
  );
};

const Chain: React.FC<{op: number}> = ({op}) => {
  const f = useCurrentFrame();
  const size = 76;
  const gap = 40;
  const step = size + gap;
  const off = (f * 2.4) % step;
  return (
    <div
      style={{
        position: 'absolute',
        left: 1000,
        right: 0,
        top: 900 - size / 2,
        height: size,
        opacity: op,
        WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, #000 22%, #000 80%, transparent 100%)',
        maskImage: 'linear-gradient(90deg, transparent 0%, #000 22%, #000 80%, transparent 100%)',
      }}
    >
      {Array.from({length: 8}, (_, i) => {
        const x = i * step - off;
        const idx = i + Math.floor((f * 2.4) / step);
        const lit = idx % 4 === 1;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute',
                left: x,
                top: 0,
                width: size,
                height: size,
                borderRadius: 22,
                background: lit ? C.lime : '#fff',
                border: `2px solid ${lit ? C.lime : C.lineStrong}`,
                boxShadow: '0 20px 40px -24px rgba(17,17,17,0.3)',
              }}
            />
            <div style={{position: 'absolute', left: x + size, top: size / 2 - 2, width: gap, height: 4, background: C.lineStrong}} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Wallet: React.FC<{start: number; out: number}> = ({start, out}) => {
  const f = useCurrentFrame();
  const a = sp(f, start, {damping: 16, stiffness: 150, mass: 1});
  return (
    <div
      style={{
        position: 'absolute',
        left: 1400,
        top: 500,
        width: 760,
        transform: `translate(-50%,-50%) translateY(${mix(a, 140, 0) - out * 60}px) rotate(${mix(a, 4, 0)}deg) scale(${mix(out, 1, 0.92)})`,
        opacity: Math.min(1, a * 1.8) * (1 - out),
        filter: `blur(${out * 12}px)`,
        background: '#fff',
        borderRadius: 40,
        border: `1.5px solid ${C.line}`,
        boxShadow: '0 70px 120px -50px rgba(17,17,17,0.4), 0 10px 30px rgba(17,17,17,0.06)',
        padding: 38,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', marginBottom: 26}}>
        <div>
          <div style={{fontSize: 26, fontWeight: 600, color: C.mute}}>Your wallet</div>
          <div style={{fontSize: 60, fontWeight: 800, letterSpacing: '-0.045em', marginTop: 4}}>3 positions</div>
        </div>
        <div style={{flex: 1}} />
        <div style={{padding: '12px 20px', borderRadius: 16, background: C.soft, fontSize: 24, fontWeight: 650}}>7xKp…3Fq2</div>
      </div>
      {TOKENS.map((t, i) => {
        const r = sp(f, start + 14 + i * 9, SNAP);
        const chk = p(f, start + 26 + i * 9, start + 40 + i * 9);
        return (
          <div
            key={t.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '24px 0',
              borderTop: `1.5px solid ${C.line}`,
              opacity: Math.min(1, r * 1.5),
              transform: `translateX(${mix(r, 60, 0)}px)`,
            }}
          >
            <Monogram letter={t.letter} size={72} active={chk > 0.5} />
            <div style={{flex: 1}}>
              <div style={{fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em'}}>{t.name}</div>
              <div style={{fontSize: 24, fontWeight: 500, color: C.mute, marginTop: 4, fontVariantNumeric: 'tabular-nums'}}>
                {(1 / t.price).toFixed(6)} tokens · $1.00
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px 12px 12px',
                borderRadius: 999,
                background: chk > 0 ? 'rgba(207,249,145,0.45)' : C.soft,
                fontSize: 23,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: C.ink,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: `scale(${0.4 + 0.6 * chk})`,
                }}
              >
                <svg width={14} height={14} viewBox="0 0 14 14">
                  <path d="M3 7.3 L6 10 L11 4.2" fill="none" stroke={C.lime} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              On-chain
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Dial: React.FC<{start: number; out: number}> = ({start, out}) => {
  const f = useCurrentFrame();
  const a = sp(f, start, {damping: 14, stiffness: 120, mass: 1});
  const R = 270;
  const sweep = ((f - start) * 3.2) % 360;
  const arc = p(f, start, start + 50, eOut);
  const circ = 2 * Math.PI * R;
  return (
    <div
      style={{
        position: 'absolute',
        left: 1420,
        top: 500,
        transform: `translate(-50%,-50%) scale(${mix(a, 0.7, 1) * mix(out, 1, 1.15)}) rotate(${mix(a, -40, 0)}deg)`,
        opacity: Math.min(1, a * 1.8) * (1 - out),
        filter: `blur(${out * 14}px)`,
      }}
    >
      <svg width={R * 2 + 80} height={R * 2 + 80} viewBox={`${-R - 40} ${-R - 40} ${R * 2 + 80} ${R * 2 + 80}`}>
        <circle r={R + 30} fill="#fff" stroke={C.line} strokeWidth={2} />
        <circle r={R} fill="none" stroke={C.soft} strokeWidth={30} />
        <circle
          r={R}
          fill="none"
          stroke={C.lime}
          strokeWidth={30}
          strokeLinecap="round"
          strokeDasharray={`${circ * 0.72 * arc} ${circ}`}
          transform={`rotate(${-90 + sweep})`}
        />
        {Array.from({length: 24}, (_, i) => {
          const ang = (i / 24) * Math.PI * 2;
          const r0 = R - 46;
          const r1 = R - (i % 6 === 0 ? 74 : 60);
          return (
            <line
              key={i}
              x1={Math.cos(ang) * r0}
              y1={Math.sin(ang) * r0}
              x2={Math.cos(ang) * r1}
              y2={Math.sin(ang) * r1}
              stroke={i % 6 === 0 ? C.ink : C.faint}
              strokeWidth={i % 6 === 0 ? 5 : 3}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{fontSize: 150, fontWeight: 800, letterSpacing: '-0.06em', lineHeight: 1}}>24/7</div>
        <div style={{fontSize: 28, fontWeight: 600, color: C.mute, marginTop: 10}}>Markets never close</div>
      </div>
    </div>
  );
};

const Swap: React.FC<{start: number; out: number}> = ({start, out}) => {
  const f = useCurrentFrame();
  const a = sp(f, start, SNAP);
  const flip = sp(f, start + 40, {damping: 10, stiffness: 160, mass: 0.8});
  const row = (sym: React.ReactNode, label: string, amt: string, k: string) => (
    <div key={k} style={{display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderRadius: 22, background: C.soft}}>
      {sym}
      <div style={{fontSize: 26, fontWeight: 750, letterSpacing: '-0.02em'}}>{label}</div>
      <div style={{flex: 1}} />
      <div style={{fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums'}}>{amt}</div>
    </div>
  );
  return (
    <div
      style={{
        position: 'absolute',
        left: 1160,
        top: 850,
        width: 500,
        transform: `translate(-50%,-50%) translateY(${mix(a, 120, 0)}px) rotate(${mix(a, -8, -3)}deg)`,
        opacity: Math.min(1, a * 1.8) * (1 - out),
        filter: `blur(${out * 12}px)`,
        background: '#fff',
        borderRadius: 32,
        border: `1.5px solid ${C.line}`,
        boxShadow: '0 50px 100px -40px rgba(17,17,17,0.45)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', padding: '0 6px 6px'}}>
        <span style={{fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em'}}>Swap</span>
        <span style={{flex: 1}} />
        <span style={{fontSize: 18, fontWeight: 700, color: C.mute}}>DEX · Solana</span>
      </div>
      {row(
        <span style={{width: 40, height: 40, borderRadius: 20, background: '#2775CA', color: '#fff', fontWeight: 800, fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>$</span>,
        'USDC',
        '1.00',
        'a',
      )}
      <div style={{position: 'relative', height: 0}}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -26,
            width: 42,
            height: 42,
            borderRadius: 14,
            background: C.lime,
            border: '4px solid #fff',
            transform: `translateX(-50%) rotate(${flip * 180}deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={18} height={18} viewBox="0 0 18 18">
            <path d="M9 3 V15 M4 10 L9 15 L14 10" fill="none" stroke={C.ink} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {row(<Monogram letter="S" size={40} active />, 'T-SpaceX', (1 / 590.96).toFixed(6), 'b')}
    </div>
  );
};

export const Benefits: React.FC = () => {
  const f = useCurrentFrame();
  const v1out = p(f, B1_EXIT - 4, B1_EXIT + 14, eIn);
  const out = p(f, OUT, 300, eIn);
  const chainOp = p(f, B1, B1 + 24) * (1 - v1out);

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${mix(out, 1, 0.82)})`,
        opacity: 1 - out,
        filter: `blur(${out * 18}px)`,
      }}
    >
      <Chain op={chainOp * 0.9} />

      {/* Beat 1 */}
      <div style={{position: 'absolute', left: 140, top: 270}}>
        <Eyebrow n="01" label="Access" at={B1} exit={B1_EXIT - 6} />
        <KineticLine words={['Instant']} start={B1 + 4} exit={B1_EXIT} size={132} align="left" />
        <div style={{height: 20}} />
        <KineticLine words={[{text: 'on-chain', hl: 'marker'}]} start={B1 + 10} exit={B1_EXIT + 2} size={132} align="left" />
        <div style={{height: 20}} />
        <KineticLine words={['access.']} start={B1 + 16} exit={B1_EXIT + 4} size={132} align="left" />
      </div>
      <Wallet start={B1 + 8} out={v1out} />

      {/* Beat 2 */}
      <div style={{position: 'absolute', left: 140, top: 270}}>
        <Eyebrow n="02" label="Liquidity" at={B2} />
        <KineticLine words={['Trade']} start={B2 + 4} size={132} align="left" />
        <div style={{height: 20}} />
        <KineticLine words={[{text: 'anytime', hl: 'marker'}]} start={B2 + 10} size={132} align="left" />
        <div style={{height: 20}} />
        <KineticLine words={['on', 'DEX.']} start={B2 + 16} size={132} align="left" />
      </div>
      {f >= B2 - 4 && <Dial start={B2} out={0} />}
      {f >= B2 + 14 && <Swap start={B2 + 18} out={0} />}

      {/* Sound */}
      <Sfx at={B1 + 6} name="whoosh_short" volume={0.4} />
      <Sfx at={B1 + 18} name="pop" volume={0.5} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} at={B1 + 26 + i * 9} name="tick" volume={0.6} />
      ))}
      <Sfx at={B1 + 30} name="swipe" volume={0.4} />
      <Sfx at={B1_EXIT - 2} name="whoosh" volume={0.5} />
      <Sfx at={B2 + 2} name="thud" volume={0.45} />
      <Sfx at={B2 + 20} name="pop" volume={0.5} />
      <Sfx at={B2 + 42} name="swipe" volume={0.5} />
      <Sfx at={240} name="riser" volume={0.6} />
    </AbsoluteFill>
  );
};
