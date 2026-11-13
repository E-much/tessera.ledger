"""Original soundtrack + sound effects for the BAKEPOINT teaser.

Everything is synthesised from scratch (no samples), so it is free to use.
Writes out/music.wav, out/sfx.wav and out/mix.wav (30 s, 44.1 kHz stereo).

Timeline is locked to the video (see bakepoint.html):
  120 BPM, bar grid starts at 1.2 s, so the drop lands on 9.2 s (BAKEPOINT reveal),
  a breakdown sits under the code card (17.2-19.2 s) and the outro hits on 27.2 s (end card).
"""
import numpy as np
from scipy.signal import butter, sosfilt, sawtooth
import wave, os

SR = 44100
DUR = 30.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'out')

BPM = 120
BEAT = 60 / BPM
BAR = BEAT * 4
STEP = BEAT / 4
G0 = 1.2                      # first bar line
DROP = 9.2
BREAK = (17.2, 19.2)
OUTRO = 27.2


def bar_t(i):                  # start time of bar i
    return G0 + i * BAR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def svf_bp(x, fc_curve, q=1.2):
    """Time-varying state-variable band-pass (for sweeps / whooshes)."""
    y = np.zeros_like(x)
    low = band = 0.0
    damp = 1.0 / q
    for i in range(len(x)):
        f = 2 * np.sin(np.pi * min(fc_curve[i], SR / 6) / SR)
        high = x[i] - low - damp * band
        band += f * high
        low += f * band
        y[i] = band
    return y


class Bus:
    def __init__(self):
        self.L = np.zeros(N)
        self.R = np.zeros(N)

    def add(self, t0, sig, gain=1.0, pan=0.0):
        """pan -1..1, sig mono or (2, n)."""
        i0 = int(round(t0 * SR))
        if i0 >= N:
            return
        if sig.ndim == 1:
            l = sig * np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
            r = sig * np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        else:
            l, r = sig
        if i0 < 0:
            l, r, i0 = l[-i0:], r[-i0:], 0
        n = min(len(l), N - i0)
        self.L[i0:i0 + n] += l[:n] * gain
        self.R[i0:i0 + n] += r[:n] * gain


# ======================================================================
# Instruments
# ======================================================================
def kick(level=1.0):
    t = tt(0.45)
    f = 45 + 95 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.22)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.25
    return (body + click) * level


def clap(level=1.0):
    t = tt(0.35)
    n = rng.standard_normal(len(t))
    env = np.zeros_like(t)
    for d in (0, 0.011, 0.022):
        env += (t >= d) * np.exp(-np.clip(t - d, 0, None) / 0.008)
    env += (t >= 0.03) * np.exp(-np.clip(t - 0.03, 0, None) / 0.09) * 0.6
    return bp(n, 900, 5200) * env * level


def snap(level=1.0):
    t = tt(0.12)
    return bp(rng.standard_normal(len(t)), 1800, 7000) * np.exp(-t / 0.018) * level


def hat(open_=False, level=1.0):
    t = tt(0.3 if open_ else 0.06)
    return hp(rng.standard_normal(len(t)), 7500, 4) * np.exp(-t / (0.09 if open_ else 0.014)) * level


def snare(level=1.0):
    t = tt(0.2)
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t / 0.04)
    noise = bp(rng.standard_normal(len(t)), 1500, 8000) * np.exp(-t / 0.06)
    return (tone * 0.5 + noise) * level


def crash(level=1.0, dur=2.6):
    t = tt(dur)
    n = hp(rng.standard_normal(len(t)), 4000, 2)
    return np.vstack([n, hp(rng.standard_normal(len(t)), 4000, 2)]) * np.exp(-t / 0.7) * level


def bass(m, dur, level=1.0):
    t = tt(dur)
    f = mtof(m)
    s = sawtooth(2 * np.pi * f * t) * 0.6 + np.sin(2 * np.pi * f * t)
    env = np.minimum(1, t / 0.004) * np.exp(-t / 0.16)
    return (lp(s, 420) + lp(s, 1500) * np.exp(-t / 0.04) * 0.6) * env * level


def pluck(m, level=1.0, dec=0.22):
    t = tt(0.6)
    f = mtof(m)
    idx = 2.2 * np.exp(-t / 0.05)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * 2 * f * t))
    return s * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


def stab(chord, level=1.0, dur=0.32, dec=0.12):
    t = tt(dur)
    s = sum(sawtooth(2 * np.pi * mtof(m) * t * d) for m in chord for d in (0.997, 1.003))
    s = lp(s, 2400) / (len(chord) * 2)
    return s * np.minimum(1, t / 0.003) * np.exp(-t / dec) * level


def pad(chord, dur, level=1.0):
    t = tt(dur)
    s = sum(sawtooth(2 * np.pi * mtof(m) * t * d) for m in chord for d in (0.994, 1.0, 1.006))
    s = lp(s, 1100, 2) / (len(chord) * 3)
    env = np.minimum(1, t / 0.35) * np.minimum(1, (dur - t) / 0.3)
    return s * env * level


def bell(m, level=1.0, dec=0.6):
    t = tt(dec * 4)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * t + 1.4 * np.exp(-t / 0.3) * np.sin(2 * np.pi * 3.5 * f * t))
    return s * np.minimum(1, t / 0.002) * np.exp(-t / dec) * level


# ======================================================================
# MUSIC
# ======================================================================
# ii-V-I-vi in C (Dm9 G13 Cmaj9 Am9), one chord per bar
CHORDS = [
    (38, [65, 69, 72, 76]),
    (43, [65, 69, 71, 76]),
    (36, [64, 67, 71, 74]),
    (45, [67, 71, 72, 76]),
]
PLUCK_STEPS = [0, 3, 6, 8, 10, 12, 14]
BASS_STEPS = [(2, 0), (6, 0), (10, 0), (13, 12), (14, 0)]

drums, bassbus, keys, padbus, fx = Bus(), Bus(), Bus(), Bus(), Bus()
kick_times = []


def section(t):
    if t < G0:
        return 'pre'
    if t < bar_t(2):
        return 'intro'
    if t < bar_t(3):
        return 'build1'
    if t < DROP:
        return 'riser'
    if BREAK[0] <= t < BREAK[1]:
        return 'break'
    if t < OUTRO:
        return 'drop'
    return 'outro'


# Intro swell before the grid
padbus.add(0.0, pad(CHORDS[3][1], G0 + 0.3, 0.55))

nbars = int((OUTRO - G0) / BAR)
for b in range(nbars):
    t0 = bar_t(b)
    root, ch = CHORDS[b % 4]
    sec = section(t0 + 0.01)

    # pad under everything
    padbus.add(t0, pad(ch, BAR + 0.25, 0.9 if sec in ('drop', 'break') else 0.7))

    for s in range(16):
        ts = t0 + s * STEP
        sec = section(ts + 0.001)
        beat_on = s % 4 == 0

        # ---------- drums
        if sec == 'drop' and beat_on:
            drums.add(ts, kick(1.0)); kick_times.append(ts)
        if sec == 'build1' and beat_on and s in (0, 8):
            drums.add(ts, kick(0.55)); kick_times.append(ts)
        if sec in ('drop', 'build1') and s in (4, 12):
            drums.add(ts, clap(0.55))
        if sec == 'intro' and s in (4, 12):
            drums.add(ts, snap(0.6), pan=0.2)
        if sec == 'break' and s in (4, 12):
            drums.add(ts, snap(0.4), pan=-0.2)
        if sec in ('drop', 'build1', 'break') and s % 4 == 2:
            drums.add(ts, hat(level=0.28), pan=0.25)
        if sec in ('drop', 'break') and s % 2 == 1:
            drums.add(ts, hat(level=0.09), pan=-0.3)
        if sec == 'drop' and s == 14:
            drums.add(ts, hat(True, 0.14), pan=0.3)

        # ---------- bass
        for st, oc in BASS_STEPS:
            if s == st and sec == 'drop':
                bassbus.add(ts, bass(root + oc, STEP * 1.6, 0.75))
            if s == st and sec == 'build1' and st in (2, 10):
                bassbus.add(ts, bass(root + oc, STEP * 1.4, 0.4))

        # ---------- chord stabs (offbeat of 2 and 4)
        if sec == 'drop' and s in (6, 14):
            keys.add(ts, stab(ch, 0.5), pan=-0.15)

        # ---------- pluck arpeggio
        if s in PLUCK_STEPS and sec in ('intro', 'build1', 'drop', 'break', 'riser'):
            k = PLUCK_STEPS.index(s)
            note = ch[k % len(ch)] + (12 if (b % 2 == 1 and k in (3, 5)) else 0)
            lvl = {'intro': 0.46, 'build1': 0.4, 'riser': 0.24, 'drop': 0.27, 'break': 0.34}[sec]
            if sec == 'riser' and ts > DROP - 0.2:
                continue
            keys.add(ts, pluck(note, lvl), pan=(-0.35 if k % 2 else 0.35))

# riser into the drop: snare roll + noise sweep + rising tone
for i, ts in enumerate(np.arange(bar_t(3), DROP - 0.15, STEP)):
    p = (ts - bar_t(3)) / (DROP - bar_t(3))
    drums.add(ts, snare(0.12 + 0.35 * p), pan=0.0)
    if p > 0.5:
        drums.add(ts + STEP / 2, snare(0.1 + 0.3 * p))
rt = tt(DROP - bar_t(3))
sweep = svf_bp(rng.standard_normal(len(rt)), 300 + 6000 * (rt / rt[-1]) ** 2, 2.0)
fx.add(bar_t(3), sweep * (rt / rt[-1]) ** 2 * 0.5)
fx.add(bar_t(3), np.sin(2 * np.pi * np.cumsum(220 + 660 * (rt / rt[-1]) ** 2) / SR) * (rt / rt[-1]) ** 3 * 0.08)

# drop: crash + sub hit
fx.add(DROP, crash(0.32))
drums.add(DROP, kick(1.1))

# small riser out of the breakdown
rt2 = tt(BREAK[1] - (BREAK[1] - 0.8))
fx.add(BREAK[1] - 0.8, svf_bp(rng.standard_normal(len(rt2)), 600 + 5000 * (rt2 / rt2[-1]) ** 2, 2) * (rt2 / rt2[-1]) ** 2 * 0.3)
fx.add(BREAK[1], crash(0.18, 1.6))

# outro: final hit, long chord, pluck tail
drums.add(OUTRO, kick(1.0)); kick_times.append(OUTRO)
fx.add(OUTRO, crash(0.3, 2.8))
keys.add(OUTRO, stab(CHORDS[2][1] + [60], 0.55, dur=2.6, dec=0.9))
bassbus.add(OUTRO, bass(36, 1.2, 0.8))
padbus.add(OUTRO, pad(CHORDS[2][1], DUR - OUTRO, 0.9))
for k, m in enumerate([64, 67, 71, 74, 76, 79]):
    keys.add(OUTRO + 0.25 + k * STEP * 1.5, pluck(m, 0.22 * (1 - k * 0.1), dec=0.4), pan=(-0.4 if k % 2 else 0.4))

# sidechain pump from kicks on pad + bass + stabs
time = np.arange(N) / SR
pump = np.ones(N)
for kt in kick_times:
    i0 = int(kt * SR)
    seg = time[i0:i0 + int(0.4 * SR)] - kt
    pump[i0:i0 + len(seg)] = np.minimum(pump[i0:i0 + len(seg)], 1 - 0.55 * np.exp(-seg / 0.11))
for bus in (padbus, bassbus):
    bus.L *= pump; bus.R *= pump
keys.L *= 0.6 + 0.4 * pump; keys.R *= 0.6 + 0.4 * pump

musicL = drums.L * 0.9 + bassbus.L * 0.85 + keys.L * 0.8 + padbus.L * 0.45 + fx.L * 0.8
musicR = drums.R * 0.9 + bassbus.R * 0.85 + keys.R * 0.8 + padbus.R * 0.45 + fx.R * 0.8

# breakdown: low-pass the music bed a touch for "underwater" feel
bi0, bi1 = int(BREAK[0] * SR), int(BREAK[1] * SR)
for ch_ in (musicL, musicR):
    ch_[bi0:bi1] = lp(ch_[bi0:bi1], 2600) * 0.95

# ======================================================================
# SOUND EFFECTS (locked to on-screen events)
# ======================================================================
sfx = Bus()
duck_points = []   # (time, dur, depth) for music ducking under whooshes


def whoosh(dur=0.8, f0=300, f1=4000, peak=0.6, level=1.0):
    t = tt(dur)
    p = t / dur
    curve = f0 * (f1 / f0) ** p
    n = rng.standard_normal(len(t))
    w = svf_bp(n, curve, 1.4)
    env = np.where(p < peak, (p / peak) ** 2, ((1 - p) / (1 - peak)) ** 1.5)
    w = w * env
    return w / (np.abs(w).max() + 1e-9) * level


WHOOSH_GAIN = 10 ** (-10 / 20)


def whoosh_st(dur, f0, f1, level, pan_from, pan_to, peak=0.6):
    # whooshes sit well under the music: -10 dB and rounded-off top end
    w = lp(whoosh(dur, min(f0, 2500), min(f1, 2500), peak, level), 2800) * WHOOSH_GAIN
    pan = np.linspace(pan_from, pan_to, len(w))
    return np.vstack([w * np.cos((pan + 1) * np.pi / 4) * np.sqrt(2), w * np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)])


def pop(f=700, level=1.0):
    t = tt(0.09)
    fr = f * (1 + 1.2 * np.minimum(1, t / 0.03))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.025) * level


def tick(f=2200, level=1.0):
    t = tt(0.05)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.008) * level


def mouse_click(level=1.0):
    t = tt(0.06)
    c = hp(rng.standard_normal(len(t)), 3000) * (np.exp(-t / 0.002) + 0.6 * (t > 0.035) * np.exp(-np.clip(t - 0.035, 0, None) / 0.002))
    return c * level


def key_click(level=1.0):
    t = tt(0.04)
    return bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.004) * level


def impact(level=1.0):
    t = tt(1.2)
    f = 40 + 60 * np.exp(-t / 0.08)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.35) * level


# 0.3  hook text blurs in — airy swish
sfx.add(0.30, whoosh_st(1.0, 500, 3500, 0.12, -0.5, 0.2, peak=0.5)); duck_points.append((0.3, 1.0, 0.0))
# 1.75 highlighter swipe
sfx.add(1.72, whoosh_st(0.5, 1500, 6000, 0.14, -0.4, 0.4, peak=0.4))
# 3.3 hook blurs out
sfx.add(3.25, whoosh_st(0.55, 3000, 900, 0.12, 0.2, -0.2, peak=0.3))
# chips pop in
for i, t0 in enumerate([3.92, 4.34, 4.76]):
    sfx.add(t0, pop(620 + i * 90, 0.22), pan=(-0.1 + i * 0.1))
# auto ticks on flour + sugar
for t0 in (4.68, 5.10):
    sfx.add(t0, tick(2400, 0.16)); sfx.add(t0, pluck(84, 0.06, dec=0.12))
# cursor clicks "Solana builders"
sfx.add(5.42, mouse_click(0.35), pan=0.25)
sfx.add(5.47, bell(84, 0.11, 0.25), pan=0.2); sfx.add(5.52, bell(88, 0.09, 0.3), pan=0.2)
# 6.35 light -> dark wipe (circle shrinks)
sfx.add(6.30, whoosh_st(0.75, 4000, 400, 0.3, 0.0, 0.0, peak=0.45)); duck_points.append((6.3, 0.75, 0.45))
# "Preheat the oven." words
sfx.add(6.85, whoosh_st(0.7, 600, 2500, 0.1, -0.3, 0.3))
# 7.85 giant "Let's bake" marquee flies right -> left
sfx.add(7.80, whoosh_st(1.9, 250, 2600, 0.42, 0.85, -0.85, peak=0.35)); duck_points.append((7.8, 1.9, 0.4))
# 9.2 BAKEPOINT reveal — low impact on top of the drop
sfx.add(DROP, impact(0.3))
# dial needle ratchet (subtle)
for k, t0 in enumerate(np.arange(10.05, 12.2, 0.11)):
    sfx.add(t0, tick(3200, 0.035), pan=0.3 * np.sin(k))
# 13.0 BAKEPOINT exits / tagline lines rise
sfx.add(12.85, whoosh_st(0.6, 3000, 600, 0.22, 0.0, 0.0, peak=0.3)); duck_points.append((12.85, 0.6, 0.25))
sfx.add(13.12, whoosh_st(0.55, 700, 3000, 0.1, -0.3, 0.0)); sfx.add(13.38, whoosh_st(0.55, 700, 3000, 0.1, 0.0, 0.3))
# 16.3 dark -> light wipe (circle opens) + card swings in
sfx.add(16.20, whoosh_st(0.85, 350, 4500, 0.42, -0.2, 0.2, peak=0.6)); duck_points.append((16.2, 0.85, 0.45))
sfx.add(16.45, whoosh_st(1.0, 400, 1800, 0.16, 0.6, 0.0, peak=0.4))
# typing
tk = 17.32
while tk < 19.22:
    sfx.add(tk, key_click(0.07 + 0.04 * rng.random()), pan=rng.uniform(-0.25, 0.25))
    tk += rng.uniform(0.05, 0.11)
# Bake button click + success chime
sfx.add(19.55, mouse_click(0.4), pan=0.35)
for k, m in enumerate([79, 83, 86, 91]):
    sfx.add(19.70 + k * 0.07, bell(m, 0.1, 0.35), pan=0.3)
# 20.25 light -> dark wipe into the bake button
sfx.add(20.20, whoosh_st(0.7, 4200, 350, 0.42, 0.4, 0.2, peak=0.45)); duck_points.append((20.2, 0.7, 0.45))
# details grid lines draw
for k, t0 in enumerate([20.8, 20.98, 21.16]):
    sfx.add(t0, whoosh_st(0.5, 1200, 5000, 0.08, -0.4 + k * 0.4, -0.4 + k * 0.4, peak=0.5))
# date counter 01 -> 16
prev = 0
for i in range(int(9.95 * 100), int(11.0 * 100)):
    u = i / 100
    p = min(1, max(0, (u - 9.95) / 1.05)); d = max(1, round(16 * (1 - (1 - p) ** 3)))
    if d != prev:
        sfx.add(u + 11.3, tick(2600 + d * 40, 0.06), pan=-0.4); prev = d
# details exit
sfx.add(24.15, whoosh_st(0.55, 3000, 700, 0.18, 0.0, 0.0, peak=0.3)); duck_points.append((24.15, 0.55, 0.2))
# Tessera x Meteora
sfx.add(24.78, whoosh_st(0.6, 600, 3200, 0.3, -0.6, -0.2)); sfx.add(24.98, whoosh_st(0.6, 600, 3200, 0.3, 0.6, 0.2))
sfx.add(25.2, whoosh_st(0.5, 2000, 5000, 0.08, 0.0, 0.0))
# hosts exit + end card
sfx.add(26.45, whoosh_st(0.6, 3200, 600, 0.2, 0.0, 0.0, peak=0.3)); duck_points.append((26.45, 0.6, 0.2))
sfx.add(OUTRO, impact(0.22))
sfx.add(27.7, whoosh_st(0.8, 800, 6000, 0.1, -0.8, 0.8, peak=0.5))
# oven timer: ding-ding
sfx.add(28.45, bell(93, 0.11, 0.5), pan=0.1); sfx.add(28.67, bell(93, 0.095, 0.6), pan=0.1)

# ======================================================================
# Mix: duck music under big whooshes, master, fade
# ======================================================================
duck = np.ones(N)
for t0, d, depth in duck_points:
    if depth <= 0:
        continue
    i0, i1 = int(t0 * SR), int((t0 + d) * SR)
    seg = np.linspace(0, 1, i1 - i0)
    shape = np.sin(np.pi * seg) ** 1.2
    duck[i0:i1] = np.minimum(duck[i0:i1], 1 - depth * 0.35 * shape)   # gentle dip, up to ~-1.5 dB

musicL *= duck; musicR *= duck


def norm(x, peak):
    return x / (np.abs(x).max() + 1e-9) * peak


m_peak = max(np.abs(musicL).max(), np.abs(musicR).max())
musicL, musicR = musicL / m_peak * 0.62, musicR / m_peak * 0.62
# Balance SFX against the music: the 16.2 s wipe whoosh sits ~3 dB under the beat
def rms_db(x, a, b):
    seg = x[int(a * SR):int(b * SR)]
    return 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12)
ref_m = rms_db((musicL + musicR) / 2, 16.2, 17.0)
ref_s = rms_db((sfx.L + sfx.R) / 2, 16.2, 17.0)
k = 10 ** (1.1 / 20)   # fixed SFX bus gain (whoosh level is set by WHOOSH_GAIN)
sfxL, sfxR = sfx.L * k, sfx.R * k
print(f'sfx gain {20*np.log10(k):+.1f} dB')

fade_in = np.minimum(1, time / 0.25)
fade_out = np.clip((DUR - time) / 1.6, 0, 1) ** 1.5
L = (musicL + sfxL) * fade_in * fade_out
R = (musicR + sfxR) * fade_in * fade_out
L, R = np.tanh(L * 1.1) / 1.1, np.tanh(R * 1.1) / 1.1   # gentle soft clip


def write(path, l, r):
    data = np.clip(np.vstack([l, r]).T, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((data * 32767).astype('<i2').tobytes())


os.makedirs(OUT, exist_ok=True)
write(os.path.join(OUT, 'music.wav'), musicL * fade_out, musicR * fade_out)
write(os.path.join(OUT, 'sfx.wav'), sfxL, sfxR)
write(os.path.join(OUT, 'mix.wav'), L, R)
print('wrote music.wav, sfx.wav, mix.wav')
