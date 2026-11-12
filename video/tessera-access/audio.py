"""Hype score + SFX for the Tessera access film, mixed under the voiceover (stereo).

140 BPM future bass / trap. The beat grid is shared with scene.html: a downbeat lands
exactly on the drop (17.05s, "Tessera changes that"), camera moves are snapped to 8th notes,
and the camera punches in on each kick/snare.

  bars 0-1   intro: filtered chords, ticking hats
  bars 2-8   problem: half-time trap, sliding 808, hat rolls (minor: Am F C G)
  bar  9     pre-drop: snare roll 8ths -> 16ths -> 32nds, riser, then a breath of silence
  bars 10-15 DROP: pumping supersaw chords, 808, claps, hook (major: C G Am F C G)
  27.3-30.3  break: drums out, filter down, reverse cymbal
  30.33      end hit: big open chord + sub boom, ring out

Mix: voice is the reference (-18 LUFS before mastering); music ~7 LU under (ducked a further
~4 dB while the voice talks), effects ~14 LU under. Whooshes stay well below the voice.

usage: python3 audio.py <vo.wav> <out.wav> [stems_dir]"""
import sys, numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly

SR = 48000; DUR = 35.0; N = int(SR * DUR)
BPM = 140; BEAT = 60 / BPM; BAR = 4 * BEAT; DROP = 17.05; GRID0 = DROP - 10 * BAR
S16 = BEAT / 4
rng = np.random.default_rng(11)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def at(bar, beat=0.0): return GRID0 + bar * BAR + beat * BEAT
def q(t, g=BEAT / 2): return DROP + round((t - DROP) / g) * g
def filt(x, f, kind, o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x, axis=0)
def tt(d): return np.arange(int(d * SR)) / SR
def noise(n): return rng.standard_normal(n)
def env(n, a, r):
    e = np.ones(n); ai = max(1, int(a * SR)); ri = max(1, min(n, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def st(x, pan=0.0):  # mono -> stereo with constant-power pan
    if x.ndim == 2: return x
    a = (pan + 1) * np.pi / 4; return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)
def place(buf, x, t, g=1.0, pan=0.0):
    x = st(x, pan); s = int(round(t * SR)); n = min(len(x), N - s)
    if n > 0 and s >= 0: buf[s:s + n] += x[:n] * g

# ---------------- instruments ----------------
def kick():
    t = tt(.5); f = 45 + 160 * np.exp(-t * 38)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)
    y += filt(noise(len(t)), 3000, 'high') * np.exp(-t * 300) * .4   # click
    return np.tanh(y * 1.8) / np.tanh(1.8)
def snare():
    t = tt(.3)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 28)
    nz = filt(noise(len(t)), [1500, 9000], 'band') * np.exp(-t * 16)
    clap = np.zeros(len(t))
    for o in (0, .009, .018):
        s = int(o * SR); clap[s:] += noise(len(t) - s) * np.exp(-t[:len(t) - s] * 45)
    return np.tanh((body * .7 + nz + filt(clap, [900, 6000], 'band') * .8) * 1.4)
def hat(open_=False):
    t = tt(.16 if open_ else .05); return filt(noise(len(t)), 7500, 'high') * np.exp(-t * (25 if open_ else 120))
def sub808(m, d, from_m=None):
    t = tt(d); f = np.full(len(t), hz(m))
    if from_m is not None: f = hz(m) + (hz(from_m) - hz(m)) * np.exp(-t * 30)   # glide
    f = f * (1 + .6 * np.exp(-t * 60))                                            # punch
    y = np.sin(2 * np.pi * np.cumsum(f) / SR)
    y = np.tanh(y * 2.2) * env(len(t), .003, min(.08, d * .4))
    return filt(y, 1800, 'low')
def supersaw(notes, d, cut=6000, att=.005, rel=.15, voices=7, spread=.012):
    n = int(d * SR); t = np.arange(n) / SR; L = np.zeros(n); R = np.zeros(n)
    for m in notes:
        for v in range(voices):
            det = (v / (voices - 1) - .5) * 2 * spread
            ph = rng.random()
            y = 2 * ((hz(m) * (1 + det) * t + ph) % 1) - 1
            pan = (v / (voices - 1) - .5) * 1.6
            a = (pan + 1) * np.pi / 4; L += y * np.cos(a); R += y * np.sin(a)
    y = np.stack([L, R], 1) / (len(notes) * voices) * 2.2
    y = filt(y, min(cut, 16000), 'low', 2)
    return y * env(n, att, rel)[:, None]
def pluck(m, d=.3, dec=9.0):
    t = tt(d); f = hz(m)
    y = (np.sin(2 * np.pi * f * t) + .5 * np.sin(2 * np.pi * 2 * f * t) + .2 * np.sign(np.sin(2 * np.pi * f * t)) * .3)
    return y * np.exp(-t * dec) * np.minimum(1, t * 500)
def riser(d, f0=300, f1=8000):
    n = int(d * SR); pr = np.linspace(0, 1, n); nz = noise(n); y = np.zeros(n)
    for k in range(0, n, 960):
        c = f0 + pr[k] ** 2 * (f1 - f0); y[k:k + 960] = filt(nz[k:k + 960], [c * .7, min(c * 1.4, 20000)], 'band')
    return y * pr ** 2 + .3 * np.sin(2 * np.pi * np.cumsum(150 + pr ** 3 * 1000) / SR) * pr ** 2.5
def impact(d=2.5, f0=40):
    t = tt(d); return np.sin(2 * np.pi * np.cumsum(f0 + 90 * np.exp(-t * 14)) / SR) * np.exp(-t * 2.0) \
        + filt(noise(len(t)), 200, 'low') * np.exp(-t * 6) * .5
def revcym(d=1.2):
    t = tt(d); return (filt(noise(len(t)), 5000, 'high') * (t / d) ** 3)[::1]

drums = np.zeros((N, 2)); bass = np.zeros((N, 2)); synth = np.zeros((N, 2)); sfx = np.zeros((N, 2))
pump = np.ones(N)

MINOR = {'Am': (45, [57, 60, 64, 67]), 'F': (41, [57, 60, 65, 69]), 'C': (48, [55, 60, 64, 67]), 'G': (43, [55, 59, 62, 67])}
MAJOR = {'C': (48, [60, 64, 67, 71, 74]), 'G': (43, [59, 62, 67, 69, 74]), 'Am': (45, [60, 64, 67, 69, 72]), 'F': (41, [60, 65, 69, 72, 76])}

# ---------------- intro bars 0-1 ----------------
for b, ch in [(0, 'Am'), (1, 'F')]:
    place(synth, filt(supersaw(MINOR[ch][1], BAR + .05, 1200, .3, .2), 900, 'low'), max(0, at(b)), 1.3)
    for i in range(8): place(drums, hat(), at(b, i / 2), .35 if i % 2 else .45, -.2 if i % 2 else .2)
place(drums, kick(), at(1, 0), .7)

# ---------------- problem bars 2-8: half-time trap ----------------
prob = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C']
prev = None
for i, ch in enumerate(prob):
    b = 2 + i; root, notes = MINOR[ch]
    cut = 1400 + i * 350
    place(synth, filt(supersaw(notes, BAR + .05, cut, .02, .15), cut, 'low'), at(b), .5)
    # drums
    place(drums, kick(), at(b, 0), 1.0); place(drums, kick(), at(b, 1.75), .8)
    if i % 2 == 1: place(drums, kick(), at(b, 3.25), .6)
    place(drums, snare(), at(b, 2), .75)
    roll = (i % 2 == 1)
    for s16 in range(16):
        pos = s16 / 4
        if s16 % 2 == 0: place(drums, hat(), at(b, pos), .30 if s16 % 4 else .38, .25 if s16 % 4 else -.15)
        elif roll and s16 >= 12: place(drums, hat(), at(b, pos), .22, .3)
    if roll:  # triplet roll into next bar
        for k in range(6): place(drums, hat(), at(b, 3.5 + k * (.5 / 6)), .18 + k * .02, -.3)
    # 808 on the kicks, gliding between roots
    for pos, d in [(0, 1.7 * BEAT), (1.75, 1.2 * BEAT)]:
        place(bass, sub808(root - 12, d, prev), at(b, pos), .9); prev = root - 12
    # quiet 8th plucks (minor)
    for k in range(8): place(synth, pluck(notes[[0, 2, 1, 3][k % 4]] + 12, .25, 12), at(b, k / 2), .16, (-.3, .3)[k % 2])
place(sfx, impact(1.2, 50), q(4.1, S16), .5)   # "Locked out" slam

# ---------------- pre-drop bar 9: snare roll + riser ----------------
b9 = at(9)
place(synth, filt(supersaw(MINOR['G'][1], BAR, 6000, .05, .05), 5000, 'low') * np.linspace(.3, 1, int(BAR * SR))[:, None], b9, .55)
hits = [k * .5 for k in range(4)] + [2 + k * .25 for k in range(4)] + [3 + k * .125 for k in range(6)]
for j, h in enumerate(hits):
    g = .25 + .55 * j / len(hits)
    place(drums, snare(), at(9, h), g)
place(sfx, riser(BAR - .18), b9, .6)
place(sfx, revcym(.8), DROP - .8 - .15, .35)
silence = np.ones(N); s0 = int((DROP - .18) * SR); silence[s0:int(DROP * SR)] = 0
drums *= silence[:, None]; synth *= silence[:, None]; bass *= silence[:, None]

# ---------------- DROP bars 10-15: future bass ----------------
drop = ['C', 'G', 'Am', 'F', 'C', 'G']
hook = [76, 79, 81, 79, 76, 74, 72, 74]   # E G A G E D C D (8ths)
prev = None
for i, ch in enumerate(drop):
    b = 10 + i; root, notes = MAJOR[ch]
    # sustained supersaw chord, pumped on every beat
    place(synth, supersaw(notes, BAR + .04, 9000, .004, .05), at(b), .75)
    place(synth, supersaw([n + 12 for n in notes[:3]], BAR + .04, 7000, .004, .05, 5, .008), at(b), .25)
    for beat in range(4):
        s = int(at(b, beat) * SR); d = int(BEAT * SR); dd = min(d, N - s)
        pump[s:s + dd] = np.minimum(pump[s:s + dd], 1 - .75 * np.exp(-np.arange(dd) / SR * 9))
    # chord stabs on the off-16ths for bounce
    for pos16 in [3, 6, 10, 14]:
        place(synth, supersaw(notes, .12, 12000, .002, .06), at(b, pos16 / 4), .35)
    # drums: kick 1 + 1.75 (+3.5), clap/snare on 3, 16th hats with rolls
    place(drums, kick(), at(b, 0), 1.0); place(drums, kick(), at(b, 1.75), .85)
    if i % 2 == 1: place(drums, kick(), at(b, 3.5), .7)
    place(drums, snare(), at(b, 2), .95)
    for s16 in range(16):
        g = .34 if s16 % 4 == 0 else (.26 if s16 % 2 == 0 else .16)
        place(drums, hat(), at(b, s16 / 4), g, (.25, -.25)[s16 % 2])
    if i % 2 == 1:
        for k in range(8): place(drums, hat(), at(b, 3 + k * .125), .15 + k * .02, .35)
    place(drums, hat(True), at(b, 1.5), .2, -.4); place(drums, hat(True), at(b, 3.5), .2, .4)
    # 808
    for pos, d in [(0, 1.7 * BEAT), (1.75, 1.2 * BEAT), (3.0, .9 * BEAT)]:
        m = root - 12 + (12 if pos == 3.0 and i % 2 else 0)
        place(bass, sub808(m, d, prev), at(b, pos), 1.0); prev = m
    # hook
    for k, m in enumerate(hook):
        if i % 2 == 1 and k >= 6: m = [79, 81][k - 6]
        place(synth, pluck(m, .3, 8), at(b, k / 2), .30, (-.2, .2)[k % 2])
# fill into the break
for k in range(8): place(drums, snare(), at(15, 3 + k * .125), .2 + k * .06)
place(sfx, impact(2.4), DROP, .9)

# ---------------- break 27.3-30.3 and end hit ----------------
brk = at(16); END_HIT = q(30.35)
n = int((END_HIT - brk + .05) * SR)
pad = supersaw(MAJOR['F'][1], END_HIT - brk + .05, 5000, .05, .1)
cutenv = np.linspace(1, .25, n)[:, None]
place(synth, filt(pad, 2500, 'low') * cutenv + filt(pad, 900, 'low') * (1 - cutenv), brk, .55)
place(bass, sub808(41 - 12, END_HIT - brk - .1, 43 - 12), brk, .6)
for k in range(int((END_HIT - brk) / (BEAT / 2))):
    place(synth, pluck([72, 76, 79, 81][k % 4], .4, 7), brk + k * BEAT / 2, .16, (-.3, .3)[k % 2])
place(sfx, revcym(1.0), END_HIT - 1.0, .45)
place(sfx, riser(1.3, 600, 9000), END_HIT - 1.3, .3)
place(sfx, impact(3.5), END_HIT, 1.0)
place(synth, supersaw([48, 55, 60, 64, 67, 71, 74], DUR - END_HIT, 7000, .003, 3.0), END_HIT, 1.8)
place(drums, kick(), END_HIT, 1.0); place(drums, snare(), END_HIT, .6)
for j, m in enumerate([72, 76, 79, 83, 86]): place(synth, pluck(m, 1.8, 2.5), END_HIT + j * BEAT / 4, .45, (-.4, .4)[j % 2])
for j in range(9):   # logo tiles clicking into place (drop and end card)
    t = tt(.05); click = np.sin(2 * np.pi * (1500 + j * 90) * t) * np.exp(-t * 90)
    place(sfx, click, 17.12 + j * .065, .25, (j - 4) / 5); place(sfx, click, END_HIT + .05 + j * .09, .18, (j - 4) / 5)

music = synth * pump[:, None] + bass * (.55 + .45 * pump)[:, None] + drums

# ---------------- whooshes on the (beat-snapped) camera moves ----------------
wbus = np.zeros((N, 2))
moves = [(1.3, .6), (3.15, .6), (4.0, .45), (5.4, .7), (6.55, .5), (7.95, .65), (10.3, .65), (11.4, .6), (12.6, .5), (14.0, .8),
         (14.85, .75), (17.9, .6), (19.1, .6), (20.35, .5), (21.85, .7), (23.35, .6), (25.25, .6), (27.25, 1.0), (28.55, .8), (30.15, 1.0)]
for i, (t0, d) in enumerate(moves):
    n = int(d * .8 * SR); x = np.linspace(0, 1, n)
    y = filt(noise(n), [300, 3000], 'band') * np.sin(np.pi * x) ** 3
    pan = np.linspace(.6, -.6, n)  # sweeps right -> left like the text
    a = (pan + 1) * np.pi / 4
    place(wbus, np.stack([y * np.cos(a), y * np.sin(a)], 1) * 1.4, q(t0), 1.0 if d >= .7 else .6)
sfx += wbus * (np.abs(sfx).max() / np.abs(wbus).max()) * .9
def tick(t, f, g, dec=80):
    tp = tt(.08); place(sfx, np.sin(2 * np.pi * f * tp) * np.exp(-tp * dec), t, g)
for j in range(16): tick(q(8.1, S16) + .15 + j * .07, 2200 + j * 30, .08, 120)   # $250,000 counter
tick(q(23.5, S16) + 1.75, 1400, .22, 60)                                          # Invest press

# ---------------- mix ----------------
meter = pyln.Meter(SR)
def lufs(x): return meter.integrated_loudness(x)
def to_lufs(x, target): return x * 10 ** ((target - lufs(x)) / 20)
vo, vsr = sf.read(sys.argv[1]); vo = resample_poly(vo, SR, vsr)[:N]; vo = np.pad(vo, (0, N - len(vo)))
vo = filt(vo, 90, 'high'); vo = st(vo)
VO_L = -18.0
vo = to_lufs(vo, VO_L)
music = filt(music, 30, 'high')
music = to_lufs(music, VO_L - 8.0)
sfx = to_lufs(sfx, VO_L - 14.0)
mono_vo = np.abs(vo[:, 0])
venv = np.clip(filt(mono_vo, 5, 'low', 1) / (mono_vo.max() * .08), 0, 1)
music = music * (10 ** (-4.0 * venv / 20))[:, None]
music = music - .4 * filt(music, [1000, 3500], 'band') * venv[:, None]   # make room for the voice
sfx = sfx * (10 ** (-3.0 * venv / 20))[:, None]
mix = vo + music + sfx
fo = int(2.2 * SR); fade = np.ones(N); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
mix *= fade[:, None]
mix = np.tanh(mix / np.abs(mix).max() * 1.4) / np.tanh(1.4) * .95   # glue / soft clip
sf.write(sys.argv[2], mix.astype(np.float32), SR, subtype='FLOAT')
if len(sys.argv) > 3:
    for n_, x in [('voice', vo), ('music', music), ('sfx', sfx)]: sf.write(f'{sys.argv[3]}/{n_}.wav', x.astype(np.float32), SR, subtype='FLOAT')
for n_, x in [('voice', vo), ('music', music), ('sfx', sfx)]: print(f'{n_:6s} {lufs(x):6.1f} LUFS')
print('ok')
