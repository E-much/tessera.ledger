import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';

/** Off-white stage with a parallax dot grid and two slow lime glows. */
export const Backdrop: React.FC<{glow?: number; drift?: number}> = ({glow = 1, drift = 1}) => {
  const f = useCurrentFrame();
  const t = f / 60;
  const gx = -t * 6 * drift;
  const gy = -t * 3 * drift;
  return (
    <AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(17,17,17,0.075) 1.4px, transparent 1.6px)',
          backgroundSize: '36px 36px',
          backgroundPosition: `${gx}px ${gy}px`,
          WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, #000 20%, transparent 85%)',
          maskImage: 'radial-gradient(ellipse 70% 65% at 50% 50%, #000 20%, transparent 85%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 900,
          height: 900,
          borderRadius: '50%',
          left: 1250 + Math.sin(t * 0.6) * 80,
          top: -420 + Math.cos(t * 0.5) * 60,
          background: 'radial-gradient(circle, rgba(207,249,145,0.75) 0%, rgba(207,249,145,0) 65%)',
          opacity: glow,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 1000,
          height: 1000,
          borderRadius: '50%',
          left: -520 + Math.cos(t * 0.45) * 70,
          top: 560 + Math.sin(t * 0.55) * 60,
          background: 'radial-gradient(circle, rgba(207,249,145,0.6) 0%, rgba(207,249,145,0) 65%)',
          opacity: glow,
        }}
      />
    </AbsoluteFill>
  );
};
