import React from 'react';
import {C} from '../theme';
import {Monogram} from './Brand';
import {BW} from './Explorer';

export const MODAL = {w: 660, h: 800, x: (BW - 660) / 2, y: 140};
export const MODAL_BTN = {x: MODAL.x + MODAL.w / 2, y: MODAL.y + MODAL.h - 36 - 42};

export type ModalState = {
  typed: string; // "1.00"
  receive: number; // tokens
  receiveIn: number; // 0→1
  caret: boolean;
  hover: number;
  press: number;
  loading: number; // spinner rotation progress (frames), <0 when not loading
  success: number; // 0→1
};

const Coin: React.FC<{label: string; dark?: boolean}> = ({label, dark}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 18px 10px 10px',
      borderRadius: 999,
      background: '#fff',
      border: `1.5px solid ${C.lineStrong}`,
      fontSize: 22,
      fontWeight: 700,
      letterSpacing: '-0.02em',
      flexShrink: 0,
    }}
  >
    {dark ? (
      <Monogram letter="O" size={36} active />
    ) : (
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          background: '#2775CA',
          color: '#fff',
          fontSize: 18,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        $
      </span>
    )}
    {label}
  </div>
);

const Field: React.FC<{label: string; children: React.ReactNode; right: React.ReactNode; active?: boolean}> = ({
  label,
  children,
  right,
  active,
}) => (
  <div
    style={{
      borderRadius: 26,
      background: active ? '#fff' : C.soft,
      border: `2px solid ${active ? C.ink : 'transparent'}`,
      padding: '22px 26px',
    }}
  >
    <div style={{fontSize: 19, fontWeight: 600, color: C.mute}}>{label}</div>
    <div style={{display: 'flex', alignItems: 'center', marginTop: 8, height: 78}}>
      <div style={{flex: 1, display: 'flex', alignItems: 'center'}}>{children}</div>
      {right}
    </div>
  </div>
);

export const BuyModal: React.FC<{s: ModalState}> = ({s}) => {
  const empty = s.typed.length === 0;
  const ok = s.success > 0;
  return (
    <div
      style={{
        width: MODAL.w,
        height: MODAL.h,
        borderRadius: 36,
        background: '#fff',
        border: `1.5px solid ${C.line}`,
        boxShadow: '0 60px 120px -40px rgba(17,17,17,0.35), 0 8px 24px rgba(17,17,17,0.06)',
        padding: 36,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 18, marginBottom: 6}}>
        <Monogram letter="O" size={64} active />
        <div style={{flex: 1}}>
          <div style={{fontSize: 36, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.1}}>Buy T-OpenAI</div>
          <div style={{fontSize: 20, fontWeight: 500, color: C.mute, marginTop: 4}}>$950B valuation · $1,280.32 per token</div>
        </div>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 23,
            background: C.soft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={16} height={16} viewBox="0 0 16 16">
            <path d="M3 3 L13 13 M13 3 L3 13" stroke={C.mute} strokeWidth={2.4} strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <Field label="You pay" active={!ok && s.typed.length < 4} right={<Coin label="USDC" />}>
        <span
          style={{
            fontSize: 70,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            color: empty ? '#C4C4C8' : C.ink,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ${empty ? '0.00' : s.typed}
        </span>
        {s.caret && <span style={{width: 4, height: 66, background: C.ink, marginLeft: 6, borderRadius: 2}} />}
      </Field>

      <div style={{position: 'relative', height: 0}}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: -36,
            transform: 'translateX(-50%)',
            width: 56,
            height: 56,
            borderRadius: 18,
            background: '#fff',
            border: `4px solid ${C.soft}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
          }}
        >
          <svg width={22} height={22} viewBox="0 0 22 22">
            <path d="M11 3 V19 M5 13 L11 19 L17 13" fill="none" stroke={C.ink} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <Field label="You receive" right={<Coin label="T-OpenAI" dark />}>
        <span
          style={{
            fontSize: 70,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            color: s.receiveIn > 0 ? C.ink : '#C4C4C8',
            fontVariantNumeric: 'tabular-nums',
            opacity: 0.35 + 0.65 * s.receiveIn,
          }}
        >
          {s.receiveIn > 0 ? s.receive.toFixed(6) : '0.000000'}
        </span>
      </Field>

      <div style={{display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 6px 0'}}>
        {[
          ['Rate', '1 T-OpenAI = $1,280.32'],
          ['Settlement', 'Instant · on Solana'],
          ['Accreditation', 'Not required'],
        ].map(([k, v]) => (
          <div key={k} style={{display: 'flex', alignItems: 'center', fontSize: 22, fontWeight: 500}}>
            <span style={{color: C.mute}}>{k}</span>
            <span style={{flex: 1}} />
            <span style={{fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10}}>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: C.lime,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width={12} height={12} viewBox="0 0 12 12">
                  <path d="M2.5 6.2 L5 8.5 L9.5 3.5" fill="none" stroke={C.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              {v}
            </span>
          </div>
        ))}
      </div>

      <div style={{flex: 1}} />

      <div
        style={{
          height: 84,
          borderRadius: 24,
          background: ok ? C.ink : C.lime,
          color: ok ? C.lime : C.ink,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: '-0.025em',
          transform: `scale(${1 - s.press * 0.04 + s.hover * 0.01})`,
          boxShadow: ok ? '0 20px 40px -16px rgba(17,17,17,0.5)' : `0 ${14 + s.hover * 10}px ${32 + s.hover * 10}px -14px rgba(74,140,30,0.95)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {ok ? (
          <>
            <svg width={34} height={34} viewBox="0 0 34 34">
              <circle cx={17} cy={17} r={16} fill={C.lime} transform={`scale(${s.success})`} style={{transformOrigin: '17px 17px'}} />
              <path
                d="M10 17.5 L15 22.5 L24.5 12"
                fill="none"
                stroke={C.ink}
                strokeWidth={3.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={24}
                strokeDashoffset={24 * (1 - Math.min(1, s.success * 1.3))}
              />
            </svg>
            Purchase confirmed
          </>
        ) : s.loading >= 0 ? (
          <>
            <svg width={34} height={34} viewBox="0 0 34 34" style={{transform: `rotate(${s.loading * 14}deg)`}}>
              <circle cx={17} cy={17} r={13} fill="none" stroke="rgba(17,17,17,0.18)" strokeWidth={4} />
              <path d="M17 4 a13 13 0 0 1 13 13" fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
            </svg>
            Confirming on-chain…
          </>
        ) : (
          'Buy T-OpenAI'
        )}
      </div>
    </div>
  );
};
