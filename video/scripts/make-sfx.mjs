// Synthesizes the original sound effects used in the Tessera demo.
// Run: node scripts/make-sfx.mjs  → writes WAV files to public/sfx/
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 48000;
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sfx');
mkdirSync(outDir, {recursive: true});

// Deterministic noise so re-running gives identical files.
let seed = 1234567;
const rand = () => {
	seed = (seed * 1664525 + 1013904223) >>> 0;
	return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;

const writeWav = (name, samples, peak = 0.8) => {
	let max = 0;
	for (const s of samples) max = Math.max(max, Math.abs(s));
	const gain = max > 0 ? peak / max : 1;
	const buf = Buffer.alloc(44 + samples.length * 2);
	buf.write('RIFF', 0);
	buf.writeUInt32LE(36 + samples.length * 2, 4);
	buf.write('WAVE', 8);
	buf.write('fmt ', 12);
	buf.writeUInt32LE(16, 16);
	buf.writeUInt16LE(1, 20);
	buf.writeUInt16LE(1, 22);
	buf.writeUInt32LE(SR, 24);
	buf.writeUInt32LE(SR * 2, 28);
	buf.writeUInt16LE(2, 32);
	buf.writeUInt16LE(16, 34);
	buf.write('data', 36);
	buf.writeUInt32LE(samples.length * 2, 40);
	samples.forEach((s, i) => {
		const v = Math.max(-1, Math.min(1, s * gain));
		buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
	});
	writeFileSync(join(outDir, `${name}.wav`), buf);
	console.log(`wrote ${name}.wav (${(samples.length / SR).toFixed(2)}s)`);
};

const make = (seconds, fn) => {
	const n = Math.round(seconds * SR);
	const out = new Float32Array(n);
	for (let i = 0; i < n; i++) out[i] = fn(i / SR, i);
	return out;
};

// Fade the last few ms to avoid clicks.
const tailFade = (s, ms = 8) => {
	const n = Math.round((ms / 1000) * SR);
	for (let i = 0; i < n; i++) s[s.length - 1 - i] *= i / n;
	return s;
};

// State-variable band-pass filter with a time-varying cutoff.
const sweptBandpass = (input, cutoffAt, q = 0.6) => {
	let low = 0;
	let band = 0;
	const out = new Float32Array(input.length);
	for (let i = 0; i < input.length; i++) {
		const f = 2 * Math.sin((Math.PI * cutoffAt(i / SR)) / SR);
		low += f * band;
		const high = input[i] - low - q * band;
		band += f * high;
		out[i] = band;
	}
	return out;
};

// Soft whoosh: filtered noise sweeping up then down.
const whoosh = (len, fLo, fHi, peakAt) => {
	const raw = make(len, () => noise());
	const filtered = sweptBandpass(raw, (t) => {
		const p = t / len;
		const k = p < peakAt ? p / peakAt : 1 - (p - peakAt) / (1 - peakAt);
		return fLo + (fHi - fLo) * k * k;
	});
	return tailFade(
		filtered.map((s, i) => {
			const p = i / filtered.length;
			const env = p < peakAt ? Math.pow(p / peakAt, 2) : Math.pow(1 - (p - peakAt) / (1 - peakAt), 2.2);
			return s * env;
		}),
	);
};

writeWav('whoosh', whoosh(0.55, 250, 3200, 0.42), 0.55);
writeWav('whoosh-fast', whoosh(0.3, 400, 4200, 0.35), 0.45);

// UI tap: tiny filtered click with a soft body.
writeWav(
	'tap',
	tailFade(
		make(0.07, (t) => {
			const click = noise() * Math.exp(-t * 900);
			const body = Math.sin(2 * Math.PI * 1500 * t) * Math.exp(-t * 160);
			const thump = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-t * 90);
			return click * 0.3 + body * 0.45 + thump * 0.5;
		}),
	),
	0.5,
);

// Keypad tick: lighter, higher tap.
writeWav(
	'key',
	tailFade(
		make(0.05, (t) => {
			const body = Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 220);
			const click = noise() * Math.exp(-t * 1400);
			return body * 0.6 + click * 0.25;
		}),
	),
	0.35,
);

// Notification pop: pitched bubble with a quick upward glide.
const pop = (f0, f1) =>
	tailFade(
		make(0.22, (t) => {
			const f = f0 + (f1 - f0) * (1 - Math.exp(-t * 45));
			const phase = 2 * Math.PI * (f0 * t + ((f1 - f0) * (t - (1 - Math.exp(-t * 45)) / 45)));
			const env = (1 - Math.exp(-t * 600)) * Math.exp(-t * 22);
			return (Math.sin(phase) + 0.25 * Math.sin(2 * phase)) * env + 0 * f;
		}),
	);
writeWav('pop', pop(520, 980), 0.5);
writeWav('pop-high', pop(700, 1320), 0.45);

// Success chime: two soft bell partials, a fifth apart.
writeWav(
	'chime',
	tailFade(
		make(0.9, (t) => {
			const bell = (f, d, delay) =>
				t < delay
					? 0
					: (Math.sin(2 * Math.PI * f * (t - delay)) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * (t - delay))) *
					  Math.exp(-(t - delay) * d) *
					  (1 - Math.exp(-(t - delay) * 400));
			return bell(1318.5, 5, 0) * 0.6 + bell(1975.5, 4.5, 0.07) * 0.5;
		}),
		40,
	),
	0.45,
);

// Soft impact: low sine drop plus a muted transient.
writeWav(
	'impact',
	tailFade(
		make(0.6, (t) => {
			const f = 48 + 70 * Math.exp(-t * 18);
			const phase = 2 * Math.PI * (48 * t + (70 * (1 - Math.exp(-t * 18))) / 18);
			const sub = Math.sin(phase) * Math.exp(-t * 6.5);
			const transient = noise() * Math.exp(-t * 120) * 0.35;
			return sub + transient + 0 * f;
		}),
		30,
	),
	0.7,
);

// Lock clunk: two short low clicks.
writeWav(
	'lock',
	tailFade(
		make(0.25, (t) => {
			const hit = (d) =>
				t < d ? 0 : (Math.sin(2 * Math.PI * 380 * (t - d)) * 0.7 + noise() * 0.5) * Math.exp(-(t - d) * 70);
			return hit(0) + hit(0.075) * 0.8;
		}),
	),
	0.55,
);

// Unlock: bright click + rising shimmer.
writeWav(
	'unlock',
	tailFade(
		make(0.45, (t) => {
			const click = (Math.sin(2 * Math.PI * 1100 * t) * 0.6 + noise() * 0.4) * Math.exp(-t * 90);
			const f = 600 + 1400 * Math.min(1, t / 0.3);
			const shimmer = Math.sin(2 * Math.PI * f * t) * Math.sin(Math.PI * Math.min(1, t / 0.45)) * 0.25;
			return click + shimmer;
		}),
		20,
	),
	0.45,
);

// Counter tick riser: rapid ticks that speed up.
writeWav(
	'ticks',
	tailFade(
		make(0.7, (t) => {
			// tick times accelerate
			let v = 0;
			for (let k = 0; k < 14; k++) {
				const tk = 0.7 * Math.sqrt(k / 14);
				if (t >= tk) v += Math.sin(2 * Math.PI * 3000 * (t - tk)) * Math.exp(-(t - tk) * 500);
			}
			return v;
		}),
	),
	0.3,
);
