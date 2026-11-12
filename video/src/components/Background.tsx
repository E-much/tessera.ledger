import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';

/** Shared dark backdrop: drifting grid, soft lime glow and vignette. */
export const Background: React.FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{backgroundColor: C.bg, overflow: 'hidden'}}>
			<AbsoluteFill
				style={{
					backgroundImage:
						'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
					backgroundSize: '96px 96px',
					backgroundPosition: `${frame * 0.4}px ${frame * 0.25}px`,
					maskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 75%)',
					WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 75%)',
				}}
			/>
			<AbsoluteFill
				style={{
					background: `radial-gradient(circle at ${50 + Math.sin(frame / 70) * 12}% ${
						45 + Math.cos(frame / 90) * 10
					}%, rgba(198,255,0,0.10), transparent 45%)`,
				}}
			/>
			<AbsoluteFill
				style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)'}}
			/>
		</AbsoluteFill>
	);
};
