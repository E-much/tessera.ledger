// Original 30s score for the Tessera film, synthesized from scratch.
// 96 BPM → one 4/4 bar = 2.5s, so every 5s scene cut lands on a downbeat.
// Output: public/music/score.wav (48kHz, 16-bit, stereo)
import {writeFileSync, mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 48000;
const DUR = 30;
const N = SR * DUR;
const BPM = 96;
const BEAT = 60 / BPM; // 0.625s
const BAR = BEAT * 4; // 2.5s
const S16 = BEAT / 4;

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'music');
mkdirSync(OUT, {recursive: true});

let seed = 4242;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Buses
const L = new Float32Array(N), R = new Float32Array(N);
const padBus = [new Float32Array(N), new Float32Array(N)]; // sidechained
const bassBus = new Float32Array(N); // sidechained, mono
const plkBus = new Float32Array(N); // to delay + reverb
const revSend = new Float32Array(N);

const add = (buf, i, v) => { if (i >= 0 && i < N) buf[i] += v; };

function onePoleLP(cut) {
  let y = 0;
  return (x, c = cut) => { const a = 1 - Math.exp((-2 * Math.PI * c) / SR); y += a * (x - y); return y; };
}
function biquad(type, f, q) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0, b0, b1, b2, a1, a2;
  const set = (f, q) => {
    const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR, al = Math.sin(w) / (2 * q), c = Math.cos(w);
    if (type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = (1 - c) / 2; }
    if (type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = (1 + c) / 2; }
    if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; }
    const a0 = 1 + al; a1 = -2 * c / a0; a2 = (1 - al) / a0; b0 /= a0; b1 /= a0; b2 /= a0;
  };
  set(f, q);
  return {set, run(x) { const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; return y; }};
}

// ---------------- Harmony: one chord per bar
const CH = {
  Am: {root: 45, notes: [57, 60, 64, 67]},
  F: {root: 41, notes: [53, 57, 60, 64]},
  C: {root: 48, notes: [55, 59, 60, 64]},
  G: {root: 43, notes: [55, 59, 62, 67]},
};
const PROG = ['Am', 'F', 'Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'];

// ---------------- Instruments
const kickTimes = [];
function kick(t, vel = 1) {
  kickTimes.push(t);
  const i0 = Math.round(t * SR);
  let ph = 0;
  for (let k = 0; k < SR * 0.5; k++) {
    const tt = k / SR;
    const f = 46 + 110 * Math.exp(-tt / 0.035);
    ph += (2 * Math.PI * f) / SR;
    const v = (Math.tanh(Math.sin(ph) * 1.8) * Math.exp(-tt / 0.22) + noise() * Math.exp(-tt / 0.002) * 0.25) * vel * 0.72;
    add(L, i0 + k, v); add(R, i0 + k, v);
  }
}
function clap(t, vel = 1) {
  const i0 = Math.round(t * SR), bp = biquad('bp', 1500, 0.9), hp = biquad('hp', 600, 0.7);
  for (let k = 0; k < SR * 0.35; k++) {
    const tt = k / SR;
    let e = 0;
    for (const o of [0, 0.011, 0.022]) if (tt >= o) e = Math.max(e, Math.exp(-(tt - o) / 0.006));
    e = Math.max(e, tt > 0.022 ? 0.5 * Math.exp(-(tt - 0.022) / 0.12) : 0);
    const v = hp.run(bp.run(noise())) * e * vel * 0.9;
    add(L, i0 + k, v * 0.9); add(R, i0 + k, v * 1.0);
    add(revSend, i0 + k, v * 0.35);
  }
}
function hat(t, open = false, vel = 1, pan = 0) {
  const i0 = Math.round(t * SR), hp = biquad('hp', 7500, 0.8), dur = open ? 0.16 : 0.035;
  for (let k = 0; k < SR * dur * 4; k++) {
    const tt = k / SR;
    const v = hp.run(noise()) * Math.exp(-tt / dur) * vel * 0.32;
    add(L, i0 + k, v * (1 - pan)); add(R, i0 + k, v * (1 + pan));
  }
}
function crash(t, vel = 1) {
  const i0 = Math.round(t * SR), hp = biquad('hp', 4000, 0.6), hp2 = biquad('hp', 4200, 0.6);
  for (let k = 0; k < SR * 2.6; k++) {
    const tt = k / SR, e = Math.exp(-tt / 0.75) * vel * 0.28;
    add(L, i0 + k, hp.run(noise()) * e); add(R, i0 + k, hp2.run(noise()) * e);
    add(revSend, i0 + k, 0);
  }
}
function snare(t, vel = 1) {
  const i0 = Math.round(t * SR), bp = biquad('bp', 1900, 0.7);
  let ph = 0;
  for (let k = 0; k < SR * 0.18; k++) {
    const tt = k / SR;
    ph += (2 * Math.PI * 190) / SR;
    const v = (bp.run(noise()) * Math.exp(-tt / 0.05) + Math.sin(ph) * Math.exp(-tt / 0.03) * 0.5) * vel * 0.5;
    add(L, i0 + k, v); add(R, i0 + k, v); add(revSend, i0 + k, v * 0.3);
  }
}
function riser(t0, t1, vel = 1) {
  const i0 = Math.round(t0 * SR), n = Math.round((t1 - t0) * SR), bpL = biquad('bp', 300, 1.1), bpR = biquad('bp', 300, 1.1);
  for (let k = 0; k < n; k++) {
    const x = k / n, f = 300 * Math.pow(30, x);
    bpL.set(f, 1.1); bpR.set(f * 1.03, 1.1);
    const e = Math.pow(x, 2.2) * vel * 0.55;
    add(L, i0 + k, bpL.run(noise()) * e); add(R, i0 + k, bpR.run(noise()) * e);
  }
}
function subHit(t, vel = 1) {
  const i0 = Math.round(t * SR);
  let ph = 0;
  for (let k = 0; k < SR * 1.8; k++) {
    const tt = k / SR;
    ph += (2 * Math.PI * (38 + 40 * Math.exp(-tt / 0.08))) / SR;
    const v = Math.sin(ph) * Math.exp(-tt / 0.6) * vel * 0.5;
    add(L, i0 + k, v); add(R, i0 + k, v);
  }
}

// Supersaw pad: 3 detuned saws per note, slow attack, lowpassed by bar.
function padBar(bar, cutoff, vel = 1, len = BAR) {
  const t0 = bar * BAR, i0 = Math.round(t0 * SR), n = Math.round(len * SR) + SR * 0.6;
  const notes = CH[PROG[bar]].notes;
  const lpL = biquad('lp', cutoff, 0.7), lpR = biquad('lp', cutoff, 0.7);
  const phs = notes.map(() => [rnd(), rnd(), rnd()]);
  for (let k = 0; k < n; k++) {
    const tt = k / SR;
    const att = Math.min(1, tt / 0.35), rel = tt > len ? Math.exp(-(tt - len) / 0.18) : 1;
    let l = 0, r = 0;
    notes.forEach((m, j) => {
      const f = mtof(m);
      [-0.11, 0, 0.12].forEach((d, v) => {
        phs[j][v] = (phs[j][v] + (f * Math.pow(2, d / 12)) / SR) % 1;
        const s = phs[j][v] * 2 - 1;
        if (v === 0) l += s; else if (v === 2) r += s; else { l += s * 0.6; r += s * 0.6; }
      });
    });
    const e = att * rel * vel * 0.085;
    add(padBus[0], i0 + k, lpL.run(l) * e); add(padBus[1], i0 + k, lpR.run(r) * e);
  }
}
function bassNote(t, m, len, vel = 1) {
  const i0 = Math.round(t * SR), n = Math.round(len * SR), lp = onePoleLP(900);
  let ph = 0, ph2 = 0;
  const f = mtof(m);
  for (let k = 0; k < n + SR * 0.03; k++) {
    const tt = k / SR;
    ph = (ph + f / SR) % 1; ph2 = (ph2 + f / 2 / SR) % 1;
    const env = Math.min(1, tt / 0.004) * (tt > len ? Math.exp(-(tt - len) / 0.01) : 1) * (0.55 + 0.45 * Math.exp(-tt / 0.09));
    const saw = ph * 2 - 1;
    const v = (lp(saw, 300 + 1400 * Math.exp(-tt / 0.06)) * 0.6 + Math.sin(2 * Math.PI * ph2) * 0.45) * env * vel * 0.42;
    add(bassBus, i0 + k, v);
  }
}
function pluck(t, m, vel = 1) {
  const i0 = Math.round(t * SR), lp = onePoleLP(3000);
  let ph = 0;
  const f = mtof(m);
  for (let k = 0; k < SR * 0.5; k++) {
    const tt = k / SR;
    ph = (ph + f / SR) % 1;
    const tri = 1 - 4 * Math.abs(ph - 0.5);
    const sq = ph < 0.5 ? 1 : -1;
    const v = lp(tri * 0.7 + sq * 0.3, 1800 + 7000 * Math.exp(-tt / 0.06)) * Math.exp(-tt / 0.16) * vel * 0.34;
    add(plkBus, i0 + k, v);
  }
}

// ---------------- Arrangement
const T = (bar, beat = 0, s16 = 0) => bar * BAR + beat * BEAT + s16 * S16;

for (let bar = 0; bar < 12; bar++) {
  // Pad: closed in the intro, opens on the drop, wide on the close
  const cut = bar < 2 ? 600 + bar * 600 : bar >= 10 ? 3800 : 2800;
  padBar(bar, cut, bar >= 10 ? 1.25 : 1);

  const groove = bar >= 2 && bar <= 9;
  // Intro heartbeat + ticks
  if (bar < 2) {
    for (const b of [0, 2]) kick(T(bar, b), 0.38);
    for (let e = 0; e < 8; e++) hat(T(bar, 0, e * 2 + 1), false, 0.35 + 0.25 * (bar === 1 ? e / 8 : 0), (e % 2 ? 0.3 : -0.3));
  }
  if (groove) {
    const lastBeat = bar === 9 ? 3 : 4; // drop the kick on the last beat before the close
    for (let b = 0; b < lastBeat; b++) kick(T(bar, b), 1);
    clap(T(bar, 1), 0.8); clap(T(bar, 3), 0.85);
    for (let b = 0; b < 4; b++) hat(T(bar, b, 2), true, 0.55);
    if (bar >= 4) for (let s = 0; s < 16; s++) if (s % 4 !== 2) hat(T(bar, 0, s), false, s % 2 ? 0.45 : 0.25, s % 2 ? 0.35 : -0.35);
    // Offbeat bass with a little push on the last 16th
    const root = CH[PROG[bar]].root;
    for (let b = 0; b < 4; b++) bassNote(T(bar, b, 2), root, S16 * 1.6, 1);
    bassNote(T(bar, 3, 3), root + 12, S16 * 0.8, 0.6);
  }
  // Plucked arpeggio from the product scene on
  if (bar >= 4) {
    const ns = CH[PROG[bar]].notes.map((m) => m + 12);
    const pat = [0, 2, 1, 3, 2, 1, 3, 2, 0, 2, 1, 3, 2, 3, 1, 2];
    const steps = bar === 11 ? 4 : 16;
    for (let s = 0; s < steps; s++) pluck(T(bar, 0, s), ns[pat[s]], bar >= 8 ? 1 : 0.8);
  }
}
// Close: big downbeat, sustained bass, final ring
kick(T(10), 1.1); subHit(T(10), 1); crash(T(10), 1.2);
bassNote(T(10), CH.F.root, BAR * 0.95, 0.8);
bassNote(T(11), CH.C.root, BAR * 0.9, 0.7);
// Transitions
crash(T(2), 1); subHit(T(2), 0.8);
riser(T(1, 1), T(2), 0.9);
crash(T(4), 0.6);
riser(T(7, 2), T(8), 0.8); crash(T(8), 0.9);
riser(T(9, 0), T(10), 1);
for (let s = 0; s < 16; s++) {
  const t = T(9, 0, s), vel = 0.25 + 0.6 * (s / 16);
  snare(t, vel);
  if (s >= 8) snare(t + S16 / 2, vel * 0.8); // 32nds in the last half bar
}

// ---------------- Sidechain, delay, reverb, master
const duck = new Float32Array(N).fill(1);
for (const kt of kickTimes) {
  const i0 = Math.round(kt * SR);
  for (let k = 0; k < SR * 0.4; k++) if (i0 + k < N) duck[i0 + k] = Math.min(duck[i0 + k], 1 - 0.6 * Math.exp(-k / SR / 0.11));
}
// smooth the ducking curve
{ let y = 1; const a = 1 - Math.exp(-1 / (SR * 0.004)); for (let i = 0; i < N; i++) { y += a * (duck[i] - y); duck[i] = y; } }

// Ping-pong dotted-eighth delay on the plucks
const dly = Math.round(BEAT * 0.75 * SR);
const dL = new Float32Array(N), dR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const inL = plkBus[i] + (i >= dly ? dR[i - dly] * 0.42 : 0);
  const inR = i >= dly ? dL[i - dly] * 0.42 : 0;
  dL[i] = inL; dR[i] = inR;
}

// Small Schroeder reverb on the send (pad + plucks + claps)
for (let i = 0; i < N; i++) revSend[i] += (padBus[0][i] + padBus[1][i]) * 0.25 + plkBus[i] * 0.5;
function reverb(input, combs, aps) {
  const out = new Float32Array(N);
  for (const [d, g] of combs) {
    const buf = new Float32Array(d); let idx = 0, lp = 0;
    for (let i = 0; i < N; i++) { const y = buf[idx]; lp = y * 0.6 + lp * 0.4; buf[idx] = input[i] + lp * g; idx = (idx + 1) % d; out[i] += y; }
  }
  for (const d of aps) {
    const buf = new Float32Array(d); let idx = 0;
    for (let i = 0; i < N; i++) { const b = buf[idx]; const y = -out[i] + b; buf[idx] = out[i] + b * 0.5; idx = (idx + 1) % d; out[i] = y; }
  }
  return out;
}
const rvL = reverb(revSend, [[1557, 0.82], [1617, 0.82], [1491, 0.83], [1422, 0.84]], [225, 556]);
const rvR = reverb(revSend, [[1580, 0.82], [1640, 0.82], [1513, 0.83], [1444, 0.84]], [241, 579]);

const out = Buffer.alloc(44 + N * 4);
let peak = 0;
const mixL = new Float32Array(N), mixR = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const d = duck[i];
  const t = i / SR;
  // fade the last 1.2s to silence so the film ends cleanly
  const fade = t > DUR - 1.2 ? Math.max(0, (DUR - t) / 1.2) : 1;
  let l = L[i] + (padBus[0][i] + bassBus[i]) * d + (dL[i] * 0.9 + dR[i] * 0.3) * d + rvL[i] * 0.09;
  let r = R[i] + (padBus[1][i] + bassBus[i]) * d + (dR[i] * 0.9 + dL[i] * 0.3) * d + rvR[i] * 0.09;
  l = Math.tanh(l * 1.15) * fade; r = Math.tanh(r * 1.15) * fade;
  mixL[i] = l; mixR[i] = r;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
}
const g = 0.84 / peak; // normalise to about -1.5 dBFS
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVE', 8); out.write('fmt ', 12);
out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24);
out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mixL[i] * g)) * 32767), 44 + i * 4);
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, mixR[i] * g)) * 32767), 46 + i * 4);
}
writeFileSync(join(OUT, 'score.wav'), out);
console.log('wrote score.wav, pre-normalise peak', peak.toFixed(3));
