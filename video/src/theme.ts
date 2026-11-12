import {Easing, interpolate, spring, SpringConfig} from 'remotion';

export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const sec = (s: number) => Math.round(s * FPS);

export const C = {
  bg: '#F7F7F0', // warm cream, as app.tessera.fun
  ink: '#0F0F0D',
  lime: '#CFF991', // site's soft lime
  limeDeep: '#5FA82E',
  mute: '#6B6E64',
  faint: '#A1A1A6',
  line: 'rgba(17,17,17,0.08)',
  lineStrong: 'rgba(17,17,17,0.14)',
  card: '#FFFFFF',
  soft: '#F0F1E6',
  green: '#2A6A14', // brand deep green (wordmark full stop, highlights)
};

export const FONT = "'Outfit', system-ui, sans-serif";

// Easings
export const eOut = Easing.bezier(0.16, 1, 0.3, 1); // expo-out, the house curve
export const eInOut = Easing.bezier(0.83, 0, 0.17, 1); // dramatic in-out for camera
export const eSoft = Easing.bezier(0.45, 0, 0.2, 1);
export const eIn = Easing.bezier(0.7, 0, 0.84, 0);

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** 0→1 progress between frames a and b. */
export const p = (f: number, a: number, b: number, e = eOut) =>
  interpolate(f, [a, b], [0, 1], {...CL, easing: e});

export const mix = (t: number, a: number, b: number) => a + (b - a) * t;

export const range = (f: number, input: number[], output: number[], e?: (t: number) => number) =>
  interpolate(f, input, output, {...CL, easing: e});

export const SPRING: Partial<SpringConfig> = {damping: 15, stiffness: 170, mass: 0.9};
export const SNAP: Partial<SpringConfig> = {damping: 12, stiffness: 260, mass: 0.7};

export const sp = (f: number, start: number, config: Partial<SpringConfig> = SPRING) =>
  spring({frame: f - start, fps: FPS, config});

export const money = (n: number, digits = 2) =>
  '$' + n.toLocaleString('en-US', {minimumFractionDigits: digits, maximumFractionDigits: digits});
