import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  AppHeader,
  BH,
  BrowserChrome,
  BUY_BTN,
  BW,
  CARD_H,
  CARDS_TOP,
  cardX,
  CARD_W,
  ExplorerHead,
  TokenCard,
  TOKENS,
} from '../components/Explorer';
import {BuyModal, MODAL, MODAL_BTN} from '../components/BuyModal';
import {Sfx} from '../components/Sfx';
import {C, eInOut, eOut, eSoft, mix, p, range, sp, SNAP} from '../theme';

// Local timeline
const ENTER = [0, 72];
const CARDS = [40, 50, 60];
const COUNT0 = 66;
const CURSOR_IN = 196;
const CURSOR_AT_CARD = 262;
const CLICK_CARD = 284;
const MODAL_OPEN = 292;
const KEYS = [342, 351, 360, 369];
const CURSOR_TO_BTN = [378, 414];
const CLICK_BTN = 424;
const SUCCESS = 466;
const TOAST = 536;

const Cursor: React.FC<{x: number; y: number; press: number; op: number}> = ({x, y, press, op}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-6px,-4px) scale(${1 - press * 0.16})`,
      transformOrigin: '6px 4px',
      opacity: op,
      filter: 'drop-shadow(0 8px 14px rgba(17,17,17,0.28))',
      zIndex: 50,
    }}
  >
    <svg width={44} height={52} viewBox="0 0 22 26">
      <path d="M2 1.5 L2 20.5 L7 16 L10.4 23.6 L13.8 22.1 L10.5 14.7 L17.2 14.4 Z" fill={C.ink} stroke="#fff" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  </div>
);

const Ripple: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
  const f = useCurrentFrame();
  if (f < at || f > at + 30) return null;
  const t = p(f, at, at + 30, eOut);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 40,
        height: 40,
        borderRadius: 20,
        border: `4px solid ${C.lime}`,
        background: 'rgba(207,249,145,0.25)',
        transform: `translate(-50%,-50%) scale(${mix(t, 0.4, 3.2)})`,
        opacity: 1 - t,
        zIndex: 49,
      }}
    />
  );
};

export const Product: React.FC = () => {
  const f = useCurrentFrame();

  // ---------- Camera (focus point in browser space + scale)
  const c3 = {x: 930, y: CARDS_TOP + CARD_H / 2 - 10};
  const mc = {x: MODAL.x + MODAL.w / 2, y: MODAL.y + MODAL.h / 2};
  const K = [0, 72, 200, 290, 336, 470, 540, 614];
  const s = range(f, K, [0.86, 0.9, 0.95, 1.22, 1.1, 1.14, 0.9, 0.88], eInOut);
  const fx = range(f, K, [BW / 2, BW / 2, BW / 2, c3.x, mc.x, mc.x, BW / 2, BW / 2], eInOut);
  const fy = range(f, K, [BH / 2, BH / 2, BH / 2, c3.y, mc.y, mc.y, BH / 2, BH / 2], eInOut);

  // 3D entrance
  const ent = p(f, ENTER[0], ENTER[1], eOut);
  const rotX = mix(ent, 34, 0);
  const lift = mix(ent, 520, 0);

  // ---------- Cards
  const hoverCard = p(f, CURSOR_AT_CARD - 10, CURSOR_AT_CARD + 6, eOut) * (1 - p(f, MODAL_OPEN + 10, MODAL_OPEN + 30));
  const pressCard = f >= CLICK_CARD - 2 && f < CLICK_CARD + 8 ? Math.sin(((f - CLICK_CARD + 2) / 10) * Math.PI) : 0;

  // ---------- Modal
  const mOpen = sp(f, MODAL_OPEN, {damping: 16, stiffness: 190, mass: 0.9});
  const showModal = f >= MODAL_OPEN;
  const typedFull = '1.00';
  const nTyped = KEYS.filter((k) => f >= k).length;
  const receiveIn = p(f, KEYS[0], KEYS[0] + 22, eOut);
  const receive = (1 / 1280.32) * (f >= KEYS[0] ? mix(receiveIn, 0.2, 1) : 0);
  const caret = f < CURSOR_TO_BTN[0] + 8 && Math.floor(f / 16) % 2 === 0;
  const btnHover = p(f, CURSOR_TO_BTN[1] - 8, CURSOR_TO_BTN[1] + 4);
  const pressBtn = f >= CLICK_BTN - 2 && f < CLICK_BTN + 8 ? Math.sin(((f - CLICK_BTN + 2) / 10) * Math.PI) : 0;
  const loading = f >= CLICK_BTN + 2 && f < SUCCESS ? f - CLICK_BTN : -1;
  const success = f >= SUCCESS ? sp(f, SUCCESS, SNAP) : 0;

  // ---------- Cursor path (browser coords)
  const btn3 = BUY_BTN(2);
  const start = {x: BW + 140, y: BH + 120};
  const cA = p(f, CURSOR_IN, CURSOR_AT_CARD, eInOut);
  const cB = p(f, CURSOR_TO_BTN[0], CURSOR_TO_BTN[1], eInOut);
  // gentle arc
  let cx = mix(cA, start.x, btn3.x + 40);
  let cy = mix(cA, start.y, btn3.y + 6) - Math.sin(cA * Math.PI) * 70;
  if (f >= CURSOR_TO_BTN[0] - 20) {
    const restX = btn3.x + 40 + (f - CURSOR_TO_BTN[0] + 20 > 0 ? 0 : 0);
    cx = mix(cB, restX, MODAL_BTN.x + 120);
    cy = mix(cB, btn3.y + 6, MODAL_BTN.y + 10) - Math.sin(cB * Math.PI) * 50;
  }
  const cursorOp = p(f, CURSOR_IN, CURSOR_IN + 10) * (1 - p(f, SUCCESS + 30, SUCCESS + 46));

  // ---------- Toast + header badge
  const toast = sp(f, TOAST, SNAP);
  const badge = f >= TOAST + 6 ? sp(f, TOAST + 6, {damping: 8, stiffness: 260, mass: 0.6}) : 0;

  // Exit (lime sweep covers the cut; just add a little push)
  const exitPush = p(f, 570, 614, eSoft);

  const mClose = p(f, 512, 532, eInOut);
  const dim = mOpen * (1 - p(f, 512, 536));

  return (
    <AbsoluteFill style={{perspective: 2600, perspectiveOrigin: '50% 30%'}}>
      <AbsoluteFill
        style={{
          transform: `translateY(${lift}px) rotateX(${rotX}deg) scale(${1 + exitPush * 0.08})`,
          transformOrigin: '50% 100%',
          opacity: Math.min(1, ent * 2),
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 960 - fx * s,
            top: 540 - fy * s,
            width: BW,
            height: BH,
            transformOrigin: '0 0',
            transform: `scale(${s})`,
          }}
        >
          {/* window */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 30,
              background: '#fff',
              overflow: 'hidden',
              border: `1.5px solid ${C.lineStrong}`,
              boxShadow: '0 80px 160px -60px rgba(17,17,17,0.35), 0 30px 60px -30px rgba(17,17,17,0.18)',
            }}
          >
            <BrowserChrome url="/explorer" />
            <AppHeader positions={badge} />
            <div style={{position: 'absolute', inset: 0, background: '#FCFCFB', top: 146, zIndex: -1}} />
            <ExplorerHead reveal={p(f, 26, 56)} />
            {TOKENS.map((t, i) => (
              <TokenCard
                key={t.name}
                t={t}
                i={i}
                s={{
                  appear: sp(f, CARDS[i], {damping: 15, stiffness: 140, mass: 1}),
                  count: p(f, COUNT0 + i * 8, COUNT0 + i * 8 + 84, eOut),
                  hover: i === 2 ? hoverCard : 0,
                  press: i === 2 ? pressCard : 0,
                }}
              />
            ))}

            {/* modal dim */}
            {showModal && (
              <div style={{position: 'absolute', inset: 0, top: 146, background: `rgba(250,250,250,${0.72 * dim})`}} />
            )}
            {showModal && (
              <div
                style={{
                  position: 'absolute',
                  left: MODAL.x,
                  top: MODAL.y,
                  transform: `translateY(${(1 - mOpen) * 120 + mClose * 60}px) scale(${mix(mOpen, 0.9, 1) * mix(mClose, 1, 0.92)})`,
                  opacity: Math.min(1, mOpen * 2) * (1 - mClose),
                  filter: mClose > 0 ? `blur(${mClose * 8}px)` : undefined,
                  transformOrigin: '50% 60%',
                }}
              >
                <BuyModal
                  s={{
                    typed: typedFull.slice(0, nTyped),
                    receive,
                    receiveIn,
                    caret,
                    hover: btnHover,
                    press: pressBtn,
                    loading,
                    success,
                  }}
                />
              </div>
            )}

            {/* toast */}
            {f >= TOAST && (
              <div
                style={{
                  position: 'absolute',
                  right: 36,
                  top: 158,
                  transform: `translateX(${(1 - toast) * 560}px)`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 18,
                  padding: '20px 30px 20px 20px',
                  borderRadius: 24,
                  background: C.ink,
                  color: '#fff',
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                  boxShadow: '0 30px 60px -20px rgba(17,17,17,0.5)',
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: C.lime,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg width={22} height={22} viewBox="0 0 22 22">
                    <path d="M5 11.5 L9.3 15.5 L17 7" fill="none" stroke={C.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                  <span style={{fontWeight: 800}}>Purchase complete</span>
                  <span style={{color: C.lime, fontWeight: 600, fontSize: 21}}>{(1 / 1280.32).toFixed(6)} T-OpenAI in your wallet</span>
                </span>
              </div>
            )}

            <Ripple x={btn3.x} y={btn3.y} at={CLICK_CARD} />
            <Ripple x={MODAL_BTN.x} y={MODAL_BTN.y} at={CLICK_BTN} />
            {f >= CURSOR_IN && <Cursor x={cx} y={cy} press={Math.max(pressCard, pressBtn)} op={cursorOp} />}
          </div>
        </div>
      </AbsoluteFill>

      {/* Sound */}
      <Sfx at={0} name="whoosh" volume={0.6} />
      {CARDS.map((c, i) => (
        <Sfx key={c} at={c + 4} name="pop" volume={0.45 + i * 0.1} />
      ))}
      {Array.from({length: 14}, (_, i) => COUNT0 + 4 + i * 5).map((t, i) => (
        <Sfx key={t} at={t} name="tick" volume={0.22 + i * 0.012} />
      ))}
      <Sfx at={206} name="whoosh_short" volume={0.3} />
      <Sfx at={CLICK_CARD} name="click" volume={0.9} />
      <Sfx at={MODAL_OPEN} name="whoosh_short" volume={0.55} />
      {KEYS.map((k) => (
        <Sfx key={k} at={k} name="key" volume={0.8} />
      ))}
      <Sfx at={CLICK_BTN} name="click" volume={0.9} />
      <Sfx at={SUCCESS} name="chime" volume={0.75} />
      <Sfx at={TOAST} name="pop" volume={0.5} />
      <Sfx at={508} name="whoosh_down" volume={0.4} />
    </AbsoluteFill>
  );
};
