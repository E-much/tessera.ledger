// Synthesizes every sound effect used in the film. No samples, no music.
// Output: 48kHz 16-bit mono WAV files in public/sfx.
import {writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 48000;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sfx');
mkdirSync(OUT, {recursive: true});

// Deterministic noise so renders are reproducible.
let seed = 1337;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rnd() * 2 - 1;

const buf = (sec) => new Float32Array(Math.round(sec * SR));

// RBJ biquad
function biquad(type, freq, q) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let b0, b1, b2, a1, a2;
  const set = (f, Q) => {
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR;
    const alpha = Math.sin(w) / (2 * Q);
    const c = Math.cos(w);
    let a0;
    if (type === 'bp') { b0 = alpha; b1 = 0; b2 = -alpha; }
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
    if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
    a0 = 1 + alpha; a1 = -2 * c; a2 = 1 - alpha;
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
  };
  set(freq, q);
  return {
    set,
    run(x) {
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      return y;
    },
  };
}

const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

function normalize(b, peak = 0.89) {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] = (b[i] / m) * peak;
  // 3ms fade edges to avoid clicks
  const f = Math.round(0.003 * SR);
  for (let i = 0; i < f; i++) { b[i] *= i / f; b[b.length - 1 - i] *= i / f; }
  return b;
}

function write(name, b, peak) {
  normalize(b, peak);
  const data = Buffer.alloc(44 + b.length * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + b.length * 2, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(SR, 24); data.writeUInt32LE(SR * 2, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(b.length * 2, 40);
  for (let i = 0; i < b.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, b[i])) * 32767), 44 + i * 2);
  writeFileSync(join(OUT, name + '.wav'), data);
  console.log('wrote', name);
}

// Air whoosh: band-passed noise with a sweeping centre and a swell envelope.
function whoosh(dur, f0, f1, peakAt = 0.55, q = 0.9) {
  const b = buf(dur);
  const bp = biquad('bp', f0, q);
  const bp2 = biquad('bp', f0 * 1.6, q * 1.3);
  for (let i = 0; i < b.length; i++) {
    const t = i / b.length;
    const f = f0 * Math.pow(f1 / f0, t);
    bp.set(f, q); bp2.set(f * 1.6, q * 1.3);
    const e = t < peakAt ? Math.pow(t / peakAt, 2.2) : Math.pow(1 - (t - peakAt) / (1 - peakAt), 1.6);
    const n = noise();
    b[i] = (bp.run(n) * 0.8 + bp2.run(n) * 0.4) * e;
  }
  return b;
}

write('whoosh', whoosh(0.7, 280, 2400, 0.6));
write('whoosh_short', whoosh(0.38, 500, 3800, 0.55), 0.7);
write('whoosh_down', whoosh(0.8, 2600, 220, 0.35), 0.8);

// UI click: crisp transient + short tonal body.
{
  const b = buf(0.09);
  const hp = biquad('hp', 2500, 0.7);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    b[i] = hp.run(noise()) * env(t, 0.0004, 0.004) * 0.9 + Math.sin(2 * Math.PI * 1800 * t) * env(t, 0.0005, 0.012) * 0.5
      + Math.sin(2 * Math.PI * 650 * t) * env(t, 0.001, 0.02) * 0.35;
  }
  write('click', b, 0.8);
}

// Key tap (softer, lower) for typing.
{
  const b = buf(0.07);
  const bp = biquad('bp', 3200, 1.4);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    b[i] = bp.run(noise()) * env(t, 0.0003, 0.006) + Math.sin(2 * Math.PI * 420 * t) * env(t, 0.001, 0.012) * 0.4;
  }
  write('key', b, 0.55);
}

// Counter tick: tiny high blip.
{
  const b = buf(0.04);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    b[i] = Math.sin(2 * Math.PI * 3400 * t) * env(t, 0.0003, 0.005) + Math.sin(2 * Math.PI * 5100 * t) * env(t, 0.0003, 0.003) * 0.4;
  }
  write('tick', b, 0.4);
}

// Pop: pitched sine drop, for cards/chips appearing.
{
  const b = buf(0.18);
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const f = 260 + 900 * Math.exp(-t / 0.018);
    ph += (2 * Math.PI * f) / SR;
    b[i] = Math.sin(ph) * env(t, 0.001, 0.045);
  }
  write('pop', b, 0.7);
}

// Impact: sub drop + filtered transient. Used for the hook slams.
{
  const b = buf(1.1);
  const lp = biquad('lp', 900, 0.8);
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const f = 42 + 90 * Math.exp(-t / 0.05);
    ph += (2 * Math.PI * f) / SR;
    b[i] = Math.tanh(Math.sin(ph) * env(t, 0.002, 0.32) * 1.6) * 0.9 + lp.run(noise()) * env(t, 0.0005, 0.03) * 0.7;
  }
  write('impact', b, 0.92);
}

// Thud: lighter impact for chips.
{
  const b = buf(0.45);
  const lp = biquad('lp', 1400, 0.8);
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const f = 70 + 160 * Math.exp(-t / 0.03);
    ph += (2 * Math.PI * f) / SR;
    b[i] = Math.sin(ph) * env(t, 0.001, 0.12) + lp.run(noise()) * env(t, 0.0005, 0.015) * 0.6;
  }
  write('thud', b, 0.75);
}

// Unlock: two metallic clicks with a short resonant ring.
{
  const b = buf(0.6);
  const clicks = [0, 0.075];
  const modes = [2210, 3480, 5130, 6920];
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    let v = 0;
    clicks.forEach((c, k) => {
      const tt = t - c;
      if (tt < 0) return;
      v += noise() * env(tt, 0.0002, 0.003) * 0.8;
      modes.forEach((m, j) => { v += Math.sin(2 * Math.PI * m * (1 + k * 0.06) * tt) * env(tt, 0.0005, 0.05 / (j + 1)) * 0.3; });
    });
    b[i] = v;
  }
  write('unlock', b, 0.8);
}

// Strike: fast swipe for the strikethroughs.
write('swipe', whoosh(0.22, 1800, 6500, 0.45, 1.6), 0.5);

// Success chime: two bell-like partials, perfect fifth.
{
  const b = buf(1.6);
  const notes = [[1318.5, 0], [1975.5, 0.09]];
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    let v = 0;
    notes.forEach(([f, s]) => {
      const tt = t - s;
      if (tt < 0) return;
      const e = env(tt, 0.003, 0.42);
      v += (Math.sin(2 * Math.PI * f * tt) + 0.28 * Math.sin(2 * Math.PI * f * 2.01 * tt) * Math.exp(-tt / 0.12) + 0.12 * Math.sin(2 * Math.PI * f * 3.0 * tt) * Math.exp(-tt / 0.06)) * e;
    });
    b[i] = v;
  }
  write('chime', b, 0.6);
}

// Riser: noise + tone swell into the logo.
{
  const dur = 1.0;
  const b = buf(dur);
  const bp = biquad('bp', 400, 1.2);
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / b.length;
    bp.set(400 * Math.pow(12, t), 1.2);
    ph += (2 * Math.PI * (180 * Math.pow(4, t))) / SR;
    const e = Math.pow(t, 2.4);
    b[i] = (bp.run(noise()) * 0.9 + Math.sin(ph) * 0.15) * e;
  }
  write('riser', b, 0.6);
}

// Shimmer: airy sparkle for the final lock-up.
{
  const b = buf(2.2);
  const partials = [2637, 3136, 3951, 5274, 6272];
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    let v = 0;
    partials.forEach((f, j) => {
      const s = j * 0.045;
      const tt = t - s;
      if (tt < 0) return;
      v += Math.sin(2 * Math.PI * f * tt + j) * env(tt, 0.004, 0.55 - j * 0.06) * (1 - j * 0.12);
    });
    b[i] = v;
  }
  write('shimmer', b, 0.42);
}

// Soft low "bloom" under the final logo.
{
  const b = buf(2.0);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const e = env(t, 0.02, 0.6);
    b[i] = (Math.sin(2 * Math.PI * 110 * t) + 0.5 * Math.sin(2 * Math.PI * 164.8 * t) + 0.3 * Math.sin(2 * Math.PI * 220 * t)) * e;
  }
  write('bloom', b, 0.5);
}
