import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, eIn, eOut, mix, p} from '../theme';

export type Highlight = 'pill' | 'marker' | 'ink' | undefined;

export type Word = {text: string; hl?: Highlight};

/**
 * Masked word-by-word reveal. Each word rises out of its own mask with a slight
 * rotation and motion blur, then exits upward through the same mask.
 */
export const KineticLine: React.FC<{
  words: (string | Word)[];
  start: number;
  stagger?: number;
  dur?: number;
  exit?: number; // frame to start exiting (local)
  exitStagger?: number;
  size: number;
  weight?: number;
  color?: string;
  tracking?: number;
  align?: 'center' | 'left';
  style?: React.CSSProperties;
  markerDelay?: number;
}> = ({
  words,
  start,
  stagger = 4,
  dur = 26,
  exit,
  exitStagger = 2,
  size,
  weight = 800,
  color = C.ink,
  tracking = -0.045,
  align = 'center',
  style,
  markerDelay = 10,
}) => {
  const f = useCurrentFrame();
  const list: Word[] = words.map((w) => (typeof w === 'string' ? {text: w} : w));
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        flexWrap: 'nowrap',
        gap: `0 ${size * 0.24}px`,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: `${tracking}em`,
        lineHeight: 1,
        color,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {list.map((w, i) => {
        const a = start + i * stagger;
        const tin = p(f, a, a + dur, eOut);
        let y = mix(tin, 1.08, 0);
        let rot = mix(tin, 7, 0);
        let blur = mix(tin, 10, 0);
        let vis = tin > 0.001 ? 1 : 0;
        if (exit !== undefined) {
          const e0 = exit + i * exitStagger;
          const tout = p(f, e0, e0 + 16, eIn);
          y += mix(tout, 0, -1.12);
          rot += mix(tout, 0, -5);
          blur += mix(tout, 0, 10);
          if (tout >= 0.999) vis = 0;
        }
        const markerT = p(f, a + markerDelay, a + markerDelay + 22, eOut);
        const isPill = w.hl === 'pill';
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              overflow: 'hidden',
              // room for descenders and pill padding inside the mask
              padding: isPill ? `0.08em 0.04em 0.12em` : `0.04em 0.02em 0.16em`,
              margin: isPill ? `-0.08em -0.04em -0.12em` : `-0.04em -0.02em -0.16em`,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${y * 100}%) rotate(${rot}deg)`,
                transformOrigin: '0% 100%',
                filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
                position: 'relative',
                opacity: vis,
              }}
            >
              {w.hl === 'marker' && (
                <span
                  style={{
                    position: 'absolute',
                    left: '-0.08em',
                    right: '-0.08em',
                    top: '0.1em',
                    bottom: '0.02em',
                    background: C.lime,
                    borderRadius: '0.12em',
                    transform: `scaleX(${markerT})`,
                    transformOrigin: '0% 50%',
                    zIndex: 0,
                  }}
                />
              )}
              {isPill ? (
                <span
                  style={{
                    display: 'inline-block',
                    background: C.ink,
                    color: C.lime,
                    padding: '0.02em 0.2em 0.06em',
                    borderRadius: '0.2em',
                  }}
                >
                  {w.text}
                </span>
              ) : (
                <span style={{position: 'relative', zIndex: 1}}>{w.text}</span>
              )}
            </span>
          </span>
        );
      })}
    </div>
  );
};
