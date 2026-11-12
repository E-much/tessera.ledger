import {Easing, interpolate, spring, useVideoConfig} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

loadFont({
	family: 'Inter',
	url: staticFile('fonts/Inter-Variable.woff2'),
	weight: '100 900',
});

export const FONT = 'Inter, system-ui, sans-serif';

export const C = {
	bg: '#0A0A0A',
	panel: '#111111',
	card: '#151515',
	cardHi: '#1B1B1B',
	line: 'rgba(255,255,255,0.09)',
	lineStrong: 'rgba(255,255,255,0.16)',
	lime: '#C6FF00',
	ink: '#12121A', // logo cube color
	limeSoft: 'rgba(198,255,0,0.14)',
	limeLine: 'rgba(198,255,0,0.45)',
	white: '#FFFFFF',
	muted: 'rgba(255,255,255,0.58)',
	faint: 'rgba(255,255,255,0.32)',
} as const;

export const GLOW = '0 0 18px rgba(198,255,0,0.55), 0 0 56px rgba(198,255,0,0.28)';
export const BOX_GLOW = '0 0 0 1px rgba(198,255,0,0.5), 0 0 40px rgba(198,255,0,0.25)';

export const OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const IN = Easing.bezier(0.7, 0, 0.84, 0);
export const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Clamped tween between two frames. */
export const tw = (
	frame: number,
	start: number,
	end: number,
	from: number,
	to: number,
	easing: (t: number) => number = OUT,
) => interpolate(frame, [start, end], [from, to], {...CLAMP, easing});

/** Snappy spring from 0 to 1 starting at `delay`. */
export const pop = (frame: number, fps: number, delay = 0, damping = 13) =>
	spring({frame: frame - delay, fps, config: {damping, stiffness: 190, mass: 0.6}});

export const useLayout = () => {
	const {width, height, fps} = useVideoConfig();
	return {portrait: height > width, width, height, fps};
};
