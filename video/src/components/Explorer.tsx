import React from 'react';
import {C, money} from '../theme';
import {LogoTile, Monogram, Wordmark} from './Brand';

export const BW = 1680; // browser width
export const BH = 960; // browser height
export const CHROME_H = 58;
export const HEADER_H = 88;
export const PAD = 48;
export const CARD_GAP = 28;
export const CARD_W = (BW - PAD * 2 - CARD_GAP * 2) / 3;
export const CARDS_TOP = CHROME_H + HEADER_H + 186;
export const CARD_H = 578;

export type Token = {
  name: string;
  company: string;
  sector: string;
  letter: string;
  price: number;
  valuation: string;
  spark: number[];
};

export const TOKENS: Token[] = [
  {
    name: 'T-SpaceX',
    company: 'SpaceX',
    sector: 'Aerospace',
    letter: 'S',
    price: 423.0,
    valuation: '$800B',
    spark: [0.3, 0.34, 0.31, 0.42, 0.4, 0.5, 0.47, 0.58, 0.55, 0.66, 0.63, 0.74, 0.8],
  },
  {
    name: 'T-Kalshi',
    company: 'Kalshi',
    sector: 'Fintech',
    letter: 'K',
    price: 413.8,
    valuation: '$14B',
    spark: [0.42, 0.38, 0.45, 0.43, 0.52, 0.48, 0.56, 0.6, 0.57, 0.66, 0.7, 0.68, 0.76],
  },
  {
    name: 'T-OpenAI',
    company: 'OpenAI',
    sector: 'Artificial Intelligence',
    letter: 'O',
    price: 812.79,
    valuation: '$950B',
    spark: [0.22, 0.28, 0.26, 0.36, 0.44, 0.4, 0.52, 0.6, 0.56, 0.7, 0.76, 0.82, 0.88],
  },
];

export const cardX = (i: number) => PAD + i * (CARD_W + CARD_GAP);
export const BUY_BTN = (i: number) => ({x: cardX(i) + CARD_W / 2, y: CARDS_TOP + CARD_H - 32 - 34});

const smoothPath = (pts: [number, number][]) => {
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }
  return d;
};

const Spark: React.FC<{data: number[]; draw: number; id: string; w: number; h: number}> = ({data, draw, id, w, h}) => {
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - v * h] as [number, number]);
  const line = smoothPath(pts);
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} style={{overflow: 'visible', display: 'block'}}>
      <defs>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.lime} stopOpacity={0.75} />
          <stop offset="1" stopColor={C.lime} stopOpacity={0} />
        </linearGradient>
        <clipPath id={`c${id}`}>
          <rect x={-10} y={-20} width={(w + 20) * draw} height={h + 40} />
        </clipPath>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <path d={area} fill={`url(#g${id})`} />
        <path d={line} fill="none" stroke={C.ink} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {draw > 0.98 && (
        <>
          <circle cx={last[0]} cy={last[1]} r={13} fill={C.lime} opacity={0.55} />
          <circle cx={last[0]} cy={last[1]} r={6.5} fill={C.ink} />
        </>
      )}
    </svg>
  );
};

export type CardState = {
  appear: number; // 0→1
  count: number; // 0→1 price count-up
  hover?: number; // 0→1
  press?: number; // 0→1
};

export const TokenCard: React.FC<{t: Token; i: number; s: CardState}> = ({t, i, s}) => {
  const price = t.price * s.count;
  const hover = s.hover ?? 0;
  const press = s.press ?? 0;
  const a = s.appear;
  return (
    <div
      style={{
        position: 'absolute',
        left: cardX(i),
        top: CARDS_TOP,
        width: CARD_W,
        height: CARD_H,
        borderRadius: 30,
        background: C.card,
        border: `2px solid ${hover > 0.01 ? `rgba(141,184,0,${0.25 + hover * 0.75})` : C.line}`,
        boxShadow: `0 ${30 + hover * 30}px ${70 + hover * 40}px -30px rgba(17,17,17,${0.18 + hover * 0.14}), 0 0 0 ${hover * 6}px rgba(198,255,0,${hover * 0.35})`,
        padding: 34,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        opacity: Math.min(1, a * 1.6),
        transform: `translateY(${(1 - a) * 120 - hover * 12}px) scale(${0.94 + 0.06 * a})`,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
        <Monogram letter={t.letter} size={68} active={hover > 0.5} />
        <div style={{flex: 1}}>
          <div style={{fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1.1}}>{t.name}</div>
          <div style={{fontSize: 19, fontWeight: 500, color: C.mute, marginTop: 4}}>{t.sector}</div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 999,
            background: C.soft,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '0.06em',
          }}
        >
          <span style={{width: 9, height: 9, borderRadius: 9, background: C.limeDeep, boxShadow: `0 0 0 4px rgba(198,255,0,0.45)`}} />
          LIVE
        </div>
      </div>

      <div style={{marginTop: 34, fontSize: 17, fontWeight: 700, letterSpacing: '0.08em', color: C.mute}}>AUCTION PRICE</div>
      <div
        style={{
          fontSize: 78,
          fontWeight: 800,
          letterSpacing: '-0.05em',
          lineHeight: 1.05,
          fontVariantNumeric: 'tabular-nums',
          marginTop: 6,
        }}
      >
        {money(price)}
      </div>

      <div style={{marginTop: 20}}>
        <Spark data={t.spark} draw={s.count} id={`s${i}`} w={CARD_W - 68} h={96} />
      </div>

      <div style={{display: 'flex', marginTop: 26, gap: 14}}>
        {[
          ['Valuation', t.valuation],
          ['Minimum', '$1'],
        ].map(([k, v]) => (
          <div key={k} style={{flex: 1, padding: '14px 18px', borderRadius: 18, background: C.soft}}>
            <div style={{fontSize: 18, fontWeight: 600, color: C.mute}}>{k}</div>
            <div style={{fontSize: 38, fontWeight: 800, letterSpacing: '-0.035em', marginTop: 0, opacity: s.count > 0.6 ? 1 : 0.15}}>
              {v}
            </div>
          </div>
        ))}
      </div>

      <div style={{flex: 1}} />
      <div
        style={{
          height: 68,
          borderRadius: 20,
          background: hover > 0.5 ? C.lime : C.ink,
          color: hover > 0.5 ? C.ink : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          transform: `scale(${1 - press * 0.05})`,
          boxShadow: hover > 0.5 ? '0 14px 30px -12px rgba(141,184,0,0.9)' : 'none',
        }}
      >
        Buy {t.name}
      </div>
    </div>
  );
};

export const BrowserChrome: React.FC<{url: string}> = ({url}) => (
  <div
    style={{
      height: CHROME_H,
      display: 'flex',
      alignItems: 'center',
      padding: '0 22px',
      borderBottom: `1.5px solid ${C.line}`,
      background: '#F6F6F5',
      position: 'relative',
    }}
  >
    <div style={{display: 'flex', gap: 10}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
        <span key={c} style={{width: 15, height: 15, borderRadius: 15, background: c}} />
      ))}
    </div>
    <div
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 560,
        height: 36,
        borderRadius: 12,
        background: '#fff',
        border: `1.5px solid ${C.line}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontSize: 18,
        fontWeight: 500,
        color: C.mute,
      }}
    >
      <svg width={14} height={16} viewBox="0 0 14 16">
        <rect x={1} y={7} width={12} height={8.5} rx={2.5} fill={C.mute} />
        <path d="M3.8 7.5 V5 a3.2 3.2 0 0 1 6.4 0 V7.5" fill="none" stroke={C.mute} strokeWidth={1.8} />
      </svg>
      <span>
        <span style={{color: C.ink}}>tessera.pe</span>
        {url}
      </span>
    </div>
  </div>
);

export const AppHeader: React.FC<{positions: number}> = ({positions}) => (
  <div
    style={{
      height: HEADER_H,
      display: 'flex',
      alignItems: 'center',
      padding: `0 ${PAD}px`,
      borderBottom: `1.5px solid ${C.line}`,
      gap: 40,
    }}
  >
    <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
      <LogoTile size={46} />
      <Wordmark size={32} />
    </div>
    <div style={{display: 'flex', gap: 6, padding: 5, borderRadius: 16, background: C.soft}}>
      {['Explorer', 'Portfolio', 'Activity'].map((n, i) => (
        <div
          key={n}
          style={{
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 19,
            fontWeight: 650,
            background: i === 0 ? '#fff' : 'transparent',
            boxShadow: i === 0 ? '0 2px 8px rgba(17,17,17,0.08)' : 'none',
            color: i === 0 ? C.ink : C.mute,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {n}
          {n === 'Portfolio' && positions > 0 && (
            <span
              style={{
                minWidth: 26,
                height: 26,
                borderRadius: 13,
                background: C.lime,
                color: C.ink,
                fontSize: 15,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${positions})`,
              }}
            >
              1
            </span>
          )}
        </div>
      ))}
    </div>
    <div style={{flex: 1}} />
    <div style={{display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 600, color: C.mute}}>
      <span style={{width: 10, height: 10, borderRadius: 10, background: C.limeDeep}} />
      Solana
    </div>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 18px 10px 10px',
        borderRadius: 16,
        border: `1.5px solid ${C.lineStrong}`,
        fontSize: 19,
        fontWeight: 650,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: `linear-gradient(135deg, ${C.lime}, #6FD000)`,
        }}
      />
      7xKp…3Fq2
    </div>
  </div>
);

export const ExplorerHead: React.FC<{reveal: number}> = ({reveal}) => (
  <div
    style={{
      position: 'absolute',
      left: PAD,
      right: PAD,
      top: CHROME_H + HEADER_H + 44,
      display: 'flex',
      alignItems: 'flex-end',
      opacity: reveal,
      transform: `translateY(${(1 - reveal) * 30}px)`,
    }}
  >
    <div>
      <div style={{fontSize: 60, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1}}>Explorer</div>
      <div style={{fontSize: 23, fontWeight: 500, color: C.mute, marginTop: 14}}>
        Tokenized pre-IPO companies · live auction prices
      </div>
    </div>
    <div style={{flex: 1}} />
    <div style={{display: 'flex', gap: 10}}>
      {['All', 'AI', 'Space', 'Fintech'].map((n, i) => (
        <div
          key={n}
          style={{
            padding: '12px 22px',
            borderRadius: 999,
            fontSize: 19,
            fontWeight: 650,
            background: i === 0 ? C.ink : '#fff',
            color: i === 0 ? '#fff' : C.ink,
            border: `1.5px solid ${i === 0 ? C.ink : C.lineStrong}`,
          }}
        >
          {n}
        </div>
      ))}
    </div>
  </div>
);
