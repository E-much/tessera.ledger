"""Score + SFX for the Tessera app film (30s), mixed under the voiceover (stereo).

Style: bright, upbeat product music at 120 BPM (four-on-the-floor house-pop): airy intro,
muted while the cards are "out of reach", full groove from "Meet Tessera" (7.5s), logo hit
on the end card (22s). UI sounds follow the phone: taps, card pops, success chime.

Mix: voice is the reference (-18 LUFS before mastering); music ~9 LU under it (a further
~4 dB down while the voice talks); effects ~15 LU under.
usage: python3 audio.py <vo.wav> <out.wav> [stems_dir]"""
import sys, numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly
SR = 48000; DUR = 30.0; N = int(SR * DUR)
BPM = 120; BEAT = 60 / BPM; E8 = BEAT / 2; E16 = BEAT / 4
GROOVE = 7.5; END = 22.0
rng = np.random.default_rng(21)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def filt(x, f, kind, o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x, axis=0)
def tt(d): return np.arange(int(d * SR)) / SR
def noise(n): return rng.standard_normal(n)
def env(n, a, r):
    e = np.ones(n); ai = max(1, int(a * SR)); ri = max(1, min(n, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def st(x, pan=0.0):
    if x.ndim == 2: return x
    a = (pan + 1) * np.pi / 4; return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)
def place(buf, x, t, g=1.0, pan=0.0):
    x = st(x, pan); s = int(round(t * SR)); n = min(len(x), N - s)
    if n > 0 and s >= 0: buf[s:s + n] += x[:n] * g
def saw_stack(notes, d, cut, att, rel, spread=.006, voices=5):
    n = int(d * SR); t = np.arange(n) / SR; L = np.zeros(n); R = np.zeros(n)
    for m in notes:
        for v in range(voices):
            det = (v / (voices - 1) - .5) * 2 * spread
            y = 2 * ((hz(m) * (1 + det) * t + rng.random()) % 1) - 1
            a = ((v / (voices - 1) - .5) * 1.4 + 1) * np.pi / 4; L += y * np.cos(a); R += y * np.sin(a)
    y = filt(np.stack([L, R], 1) / (len(notes) * voices), cut, 'low', 2)
    return y * env(n, att, rel)[:, None]
def pluck(m, d=.35, dec=9.):
    t = tt(d); f = hz(m)
    return (np.sin(2*np.pi*f*t) + .45*np.sin(2*np.pi*2*f*t) + .15*np.sin(2*np.pi*3*f*t)) * np.exp(-t*dec) * np.minimum(1, t*600)
def kick():
    t = tt(.4); return np.tanh(1.6 * np.sin(2*np.pi*np.cumsum(48 + 130*np.exp(-t*34)) / SR) * np.exp(-t*7))
def clap():
    t = tt(.25); y = np.zeros(len(t))
    for o in (0, .01, .02):
        s = int(o * SR); y[s:] += noise(len(t) - s) * np.exp(-t[:len(t) - s] * 40)
    return filt(y, [1000, 6000], 'band')
def hat(op=False):
    t = tt(.14 if op else .045); return filt(noise(len(t)), 8000, 'high') * np.exp(-t * (28 if op else 110))
def bass(m, d):
    t = tt(d); f = hz(m); return (np.sin(2*np.pi*f*t) + .3*np.sin(2*np.pi*2*f*t)) * env(len(t), .004, .05)

music = np.zeros((N, 2)); drums = np.zeros((N, 2)); sfx = np.zeros((N, 2)); pump = np.ones(N)
# chords: Fmaj7 - Am7 - G - C(add9), 2 bars each in the groove
CH = [(41, [57, 60, 64, 69]), (45, [57, 60, 64, 67]), (43, [55, 59, 62, 67]), (48, [55, 60, 62, 64])]

# ---- intro (0 - 7.5): airy pad + soft plucks; muffled while "out of reach" (4.75 - 6.2)
pad_in = saw_stack([53, 57, 60, 64, 69], GROOVE + .3, 1800, 1.2, .3)
lp = filt(pad_in, 600, 'low', 2); m = np.ones(len(pad_in))
a_, b_ = int(4.75 * SR), int(6.25 * SR); m[a_:b_] = 0
m = filt(m, 8, 'low', 1)[:, None]; place(music, pad_in * m + lp * (1 - m), 0, 2.6)
pos = 0.5; i = 0
while pos < GROOVE - .1:
    muffled = 4.75 <= pos < 6.25
    y = pluck([69, 72, 76, 79][i % 4] + (0 if i % 8 < 4 else 2), .4, 8)
    place(music, filt(y, 1200, 'low') if muffled else y, pos, .35 if muffled else .55, (-.35, .35)[i % 2]); pos += BEAT; i += 1
# "Within reach" lift + riser into the groove
n = int(1.2 * SR); pr = np.linspace(0, 1, n); r = np.zeros(n); nz = noise(n)
for k in range(0, n, 960):
    c = 500 + pr[k] ** 2 * 6000; r[k:k + 960] = filt(nz[k:k + 960], [c * .7, min(c * 1.4, 20000)], 'band')
place(sfx, r * pr ** 2, GROOVE - 1.2, .35)

# ---- groove (7.5 - 22.0)
pos = GROOVE; b = 0
while pos < END - .02:
    root, notes = CH[(b // 4) % 4]
    if b % 4 == 0: place(music, saw_stack(notes, BEAT * 4 + .05, 3600, .01, .12), pos, .55)
    place(drums, kick(), pos, 1.0)
    s = int(pos * SR); d = int(BEAT * SR); dd = min(d, N - s)
    pump[s:s + dd] = np.minimum(pump[s:s + dd], 1 - .45 * np.exp(-np.arange(dd) / SR * 12))
    if b % 2 == 1: place(drums, clap(), pos, .5)
    place(drums, hat(), pos + E8, .32, .25); place(drums, hat(), pos + E16 * 3, .12, -.25)
    if b % 4 == 3: place(drums, hat(True), pos + E8, .2, -.3)
    place(music, bass(root - 12, E8 * .9), pos + E8, .55)
    for k in range(2):  # 8th-note plucks
        place(music, pluck(notes[[0, 2, 1, 3][(b * 2 + k) % 4]] + 12, .3, 10), pos + k * E8, .2, (-.3, .3)[k])
    pos += BEAT; b += 1
# small fills before each scene change
for t0 in [9.0, 12.0, 16.0, 19.5]:
    for k in range(4): place(drums, hat(), t0 - BEAT + k * E16, .2 + k * .05, .3)
music = music * pump[:, None] + drums

# ---- end card (22 - 30): logo hit, open chord, sparkle, ring out
place(music, saw_stack([48, 55, 60, 64, 67, 71, 74], DUR - END, 4200, .01, 3.5), END, 2.2)
for j, mm in enumerate([72, 76, 79, 83, 86, 88]): place(music, pluck(mm, 1.6, 2.4), END + .25 + j * E16, .6, (-.4, .4)[j % 2])
t = tt(3); place(sfx, np.sin(2*np.pi*np.cumsum(42 + 70*np.exp(-t*10)) / SR) * np.exp(-t*1.6), END, 1.0)
for j in range(9):  # logo tiles click in
    tp = tt(.05); place(sfx, np.sin(2*np.pi*(1600 + j*90)*tp) * np.exp(-tp*90), 22.35 + j * .09, .2, (j - 4) / 5)

# ---- UI sounds
def click(t0, g=.5, f=1800):  # soft screen tap
    tp = tt(.06); place(sfx, (np.sin(2*np.pi*f*tp) * .6 + filt(noise(len(tp)), 3000, 'high') * .4) * np.exp(-tp*120), t0, g, .3)
for t0 in [8.75, 10.15, 11.45, 12.55, 14.9, 15.65, 20.9]: click(t0)
def pop(t0, g=.45, pan=0):  # card appears
    tp = tt(.18); f = 500 + 900 * np.exp(-tp * 30)
    place(sfx, np.sin(2*np.pi*np.cumsum(f) / SR) * np.exp(-tp*22), t0, g, pan)
for t0, p in [(2.25, .3), (2.95, .5), (3.65, .4), (10.45, -.3), (20.05, -.3)] + [(22.5 + i * .18, -.6 + i * .4) for i in range(4)]: pop(t0, .4, p)
for j, mm in enumerate([76, 79, 84]): place(sfx, pluck(mm, .9, 4), 16.15 + .3 + j * .08, .5)   # order confirmed chime
place(sfx, pluck(84, .7, 5) + pluck(88, .7, 5) * .6, 20.95, .35)                                # notified ding
def whoosh(t0, d, g):
    n = int(d * SR); x = np.linspace(0, 1, n); y = filt(noise(n), [300, 2800], 'band') * np.sin(np.pi * x) ** 3
    pan = np.linspace(-.5, .5, n); a = (pan + 1) * np.pi / 4
    place(sfx, np.stack([y * np.cos(a), y * np.sin(a)], 1), t0 - d * .5, g)
for t0 in [9.0, 12.0, 16.0, 19.5, 22.0]: whoosh(t0, .5, .5)       # colour wipes
whoosh(7.6, .8, .6)                                                 # phone rises in
for t0 in [12.95]: whoosh(t0, .35, .25)                             # screen slide

# ---- mix
meter = pyln.Meter(SR)
lufs = lambda x: meter.integrated_loudness(x)
to = lambda x, tg: x * 10 ** ((tg - lufs(x)) / 20)
vo, vsr = sf.read(sys.argv[1]); vo = resample_poly(vo, SR, vsr)[:N]; vo = np.pad(vo, (0, N - len(vo)))
vo = st(filt(vo, 85, 'high'))
VO_L = -18.0
vo = to(vo, VO_L); music = to(filt(music, 30, 'high'), VO_L - 10.0); sfx = to(sfx, VO_L - 15.0)
mv = np.abs(vo[:, 0]); venv = np.clip(filt(mv, 5, 'low', 1) / (mv.max() * .08), 0, 1)
music = music * (10 ** (-4.0 * venv / 20))[:, None]
music = music - .35 * filt(music, [1000, 3300], 'band') * venv[:, None]
sfx = sfx * (10 ** (-2.0 * venv / 20))[:, None]
mix = vo + music + sfx
fo = int(1.8 * SR); fade = np.ones(N); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
mix *= fade[:, None]
mix = np.tanh(mix / np.abs(mix).max() * 1.2) / np.tanh(1.2) * .95
sf.write(sys.argv[2], mix.astype(np.float32), SR, subtype='FLOAT')
if len(sys.argv) > 3:
    for n_, x in [('voice', vo), ('music', music), ('sfx', sfx)]: sf.write(f'{sys.argv[3]}/{n_}.wav', x.astype(np.float32), SR, subtype='FLOAT')
for n_, x in [('voice', vo), ('music', music), ('sfx', sfx)]: print(f'{n_:6s} {lufs(x):6.1f} LUFS')
print('ok')
