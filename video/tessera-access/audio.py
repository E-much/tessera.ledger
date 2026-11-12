"""Original score + SFX for the Tessera access film, mixed under the voiceover.

Style: warm, optimistic electronic at 108 BPM. The problem section plays filtered and
muffled ("behind a wall"); the dive into the lime is a riser and a beat of silence; on
"Tessera changes that" the filter opens and the full groove drops in.

Mix: each stem is loudness-matched (LUFS) against the voice, then the music is ducked
under speech. Voice is the reference; music sits ~9 LU under it (~13 LU while the voice
is talking) and the effects ~15 LU under it.

usage: python3 audio.py <vo.wav> <out.wav> [stems_dir]"""
import sys, numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly
SR = 48000; DUR = 35.0; N = int(SR * DUR)
rng = np.random.default_rng(5)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
BPM = 108; BEAT = 60 / BPM; E8 = BEAT / 2; E16 = BEAT / 4
DROP = 17.05; BREAK = 27.3; END_HIT = 30.35

def filt(x, f, kind, o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x)
def place(buf, x, at, g=1.0):
    s = int(at * SR); n = min(len(x), N - s)
    if n > 0 and s >= 0: buf[s:s + n] += x[:n] * g
def env(n, a, r):
    e = np.ones(n); ai = max(1, int(a * SR)); ri = max(1, int(r * SR))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def tt(d): return np.arange(int(d * SR)) / SR
def noise(n): return rng.standard_normal(n)
def saw(f, n, harm=10, det=0.0):
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * k * t * (1 + det)) / k for k in range(1, harm + 1) if f * k < 14000)

# ---------------- instruments ----------------
def pad(buf, notes, a, b, g, cut, att=.5, rel=.8):
    n = int((b - a) * SR)
    y = sum(saw(hz(m), n) + saw(hz(m), n, det=.004) + saw(hz(m), n, det=-.0035) for m in notes)
    place(buf, filt(y / len(notes) / 3, cut, 'low') * env(n, att, rel), a, g)
def pluck(m, d=.4, dec=9.0, bright=.3):
    t = tt(d); f = hz(m)
    y = np.sin(2*np.pi*f*t) + bright*np.sin(2*np.pi*2*f*t) + .08*np.sin(2*np.pi*3*f*t)
    return y * np.exp(-t * dec) * np.minimum(1, t * 400)
def kick(d=.42):
    t = tt(d); return np.sin(2*np.pi*np.cumsum(44 + 110*np.exp(-t*32)) / SR) * np.exp(-t*6.5)
def clap():
    t = tt(.22); y = np.zeros(len(t))
    for o in (0, .011, .022):  # three quick bursts, like hands
        s = int(o * SR); y[s:] += noise(len(t) - s) * np.exp(-(t[:len(t)-s]) * 38)
    return filt(y, [900, 5000], 'band') * .9
def hat(open_=False):
    t = tt(.12 if open_ else .045); return filt(noise(len(t)), 8000, 'high') * np.exp(-t * (30 if open_ else 110))
def bass(m, d):
    t = tt(d); f = hz(m)
    y = np.sin(2*np.pi*f*t) + .25*np.sin(2*np.pi*2*f*t)
    return y * env(len(t), .005, .06)

music_prob = np.zeros(N)   # problem section, filtered later
music = np.zeros(N); drums = np.zeros(N); sfx = np.zeros(N); whoosh_bus = np.zeros(N)
side = np.ones(N)          # kick sidechain

# ---------------- PROBLEM (0 - 16.2): Am - F - C - G, muffled ----------------
prog_a = [(0.0, 57, [45, 52, 57, 60, 64]), (4.44, 53, [41, 53, 57, 60, 64]),
          (8.89, 48, [48, 55, 60, 64, 67]), (13.33, 55, [43, 55, 59, 62, 67])]
for i, (a, root, ch) in enumerate(prog_a):
    b = prog_a[i + 1][0] if i + 1 < len(prog_a) else 16.3
    pad(music_prob, ch, a, b + .25, .5, 2200, .4, .4)
pos = 0.3; i = 0
while pos < 16.1:
    a, root, ch = [p for p in prog_a if p[0] <= pos][-1]
    m = ch[[2, 3, 4, 3][i % 4]] + 12
    place(music_prob, pluck(m, .35, 11, .25), pos, .22); pos += E8; i += 1
pos = 0.3
while pos < 16.1:   # heartbeat kick on 1 and 3
    place(drums, kick(), pos, .9 * (0.55 + 0.45 * pos / 16)); pos += BEAT * 2
pos = 8.9
while pos < 16.1:   # ticking hats join halfway, building
    place(drums, hat(), pos + E8, .25); pos += BEAT
# muffle: low-pass the whole problem section, opening slightly as tension builds
lp_lo = filt(music_prob, 900, 'low', 4); lp_hi = filt(music_prob, 2600, 'low', 4)
w = np.clip(np.arange(N) / SR / 16.0, 0, 1)
music += lp_lo * (1 - w) + lp_hi * w
drums = filt(drums, 3500, 'low', 2)   # drums before the drop stay soft too

# ---------------- DIVE (16.2 - 17.05): riser, then a breath of silence ----------------
n = int(.95 * SR); pr = np.linspace(0, 1, n); nz = noise(n); r = np.zeros(n)
for k in range(0, n, 1200):
    c = 300 + pr[k] ** 2 * 7000; r[k:k + 1200] = filt(nz[k:k + 1200], [c * .7, min(c * 1.4, 20000)], 'band')
riser = r * pr ** 2.2 + .35 * np.sin(2 * np.pi * np.cumsum(180 + pr ** 3 * 900) / SR) * pr ** 2.5
riser *= np.r_[np.ones(n - int(.12 * SR)), np.linspace(1, 0, int(.12 * SR))]  # cut just before the drop
place(sfx, riser, 16.05, .55)
gate = np.ones(N); gate[int(16.3 * SR):int(DROP * SR)] = np.linspace(1, 0, int(DROP * SR) - int(16.3 * SR)) ** 2
music *= gate; drums *= gate

# ---------------- DROP (17.05 - 27.3): C - G - Am - F, full groove ----------------
prog_b = [(DROP, 48, [48, 55, 60, 64, 67]), (19.27, 43, [43, 55, 59, 62, 67]),
          (21.49, 45, [45, 52, 57, 60, 64]), (23.71, 41, [41, 53, 57, 60, 65]),
          (25.94, 43, [43, 55, 59, 62, 67])]
for i, (a, root, ch) in enumerate(prog_b):
    b = prog_b[i + 1][0] if i + 1 < len(prog_b) else BREAK + .4
    pad(music, ch, a, b + .3, .42, 3800, .08, .4)
pos = DROP; i = 0
while pos < BREAK - .05:
    a, root, ch = [p for p in prog_b if p[0] <= pos + 1e-6][-1]
    m = ch[[2, 4, 3, 4, 2, 4, 3, 1][i % 8]] + 12
    place(music, pluck(m, .32, 10, .4), pos, .30 * (0.75 if i % 2 else 1)); pos += E8; i += 1
pos = DROP; bi = 0
while pos < BREAK - .05:   # bass: root on the off-beat 8ths, classic pumping line
    a, root, ch = [p for p in prog_b if p[0] <= pos + 1e-6][-1]
    place(music, bass(root - 12 + (12 if bi % 4 == 3 else 0), E8 * .9), pos + E8, .55); pos += BEAT; bi += 1
pos = DROP; b = 0
while pos < BREAK - .05:
    place(drums, kick(), pos, 1.0)
    s = int(pos * SR); d = int(.3 * SR); dd = min(d, N - s)
    side[s:s + dd] = np.minimum(side[s:s + dd], 1 - .5 * np.exp(-np.arange(dd) / SR * 11))
    if b % 2 == 1: place(drums, clap(), pos, .45)
    place(drums, hat(), pos + E8, .28); place(drums, hat(), pos + E16, .10); place(drums, hat(), pos + 3 * E16, .10)
    if b % 4 == 3: place(drums, hat(True), pos + E8, .18)
    pos += BEAT; b += 1
place(sfx, np.sin(2*np.pi*np.cumsum(40 + 80*np.exp(-tt(2.4)*12)) / SR) * np.exp(-tt(2.4)*2.0), DROP, 1.0)  # drop impact
for j in range(9):   # logo tiles clicking into place
    t = tt(.05); place(sfx, np.sin(2*np.pi*(1500 + j*90)*t) * np.exp(-t*90), 17.12 + j*.065, .25)

# ---------------- BREAK + END (27.3 - 35): kick out, open chords, resolve ----------------
pad(music, [41, 53, 60, 64, 67, 69, 72], BREAK, END_HIT + .2, .45, 3400, .25, .6)   # Fmaj9
pad(music, [36, 48, 55, 60, 62, 64, 67, 71], END_HIT - .1, DUR, .48, 3000, .35, 2.4)  # Cmaj9
pos = BREAK; i = 0
while pos < END_HIT - .1:
    place(music, pluck([72, 76, 79, 81][i % 4], .5, 6, .3), pos, .18); pos += E8; i += 1
for j, m in enumerate([60, 64, 67, 72, 76]):   # end-card arpeggio
    place(music, pluck(m + 12, 1.6, 2.6, .35), END_HIT + j * .09, .22)
place(sfx, np.sin(2*np.pi*np.cumsum(42 + 60*np.exp(-tt(3)*10)) / SR) * np.exp(-tt(3)*1.6), END_HIT, .9)
for j in range(9):
    t = tt(.05); place(sfx, np.sin(2*np.pi*(1700 + j*90)*t) * np.exp(-t*90), END_HIT + .05 + j*.09, .18)

music = music * side + drums   # pads/bass/plucks pump under the kick
# the full groove is much denser than the filtered intro: tame it so the voice stays on top
sec = np.ones(N); a_, b_ = int(DROP * SR), int(BREAK * SR); sec[a_:b_] = 0.62
music *= sec

# ---------------- whooshes: short, soft "air", no hiss ----------------
def whoosh(at, d, g=1.0):
    n = int(d * SR); t = np.linspace(0, 1, n)
    y = filt(noise(n), [250, 2500], 'band') * np.sin(np.pi * t) ** 3
    place(whoosh_bus, y, at, g)
big = {5.4, 14.0, 21.85, 27.25, 30.15}
for at, d in [(1.3,.6),(3.15,.6),(4.0,.45),(5.4,.7),(6.55,.5),(7.95,.65),(10.3,.65),(11.4,.6),(12.6,.5),(14.0,.8),
              (14.85,.75),(17.9,.6),(19.1,.6),(20.35,.5),(21.85,.7),(23.35,.6),(25.25,.6),(27.25,1.0),(28.55,.8),(30.15,1.0)]:
    whoosh(at, d * .8, 1.0 if at in big else .6)
sfx += whoosh_bus * (np.abs(sfx).max() / max(1e-9, np.abs(whoosh_bus).max())) * 1.0

# UI accents
def tick(at, f=2400, g=.18, dec=70):
    t = tt(.08); place(sfx, np.sin(2*np.pi*f*t) * np.exp(-t*dec), at, g)
t = tt(.25); place(sfx, np.sin(2*np.pi*np.cumsum(170*np.exp(-t*8) + 55) / SR) * np.exp(-t*14), 4.1, .6)  # "Locked out" thud
for j in range(16): tick(8.25 + j*.07, 2200 + j*30, .08, 120)        # $250,000 counter
tick(25.25, 1400, .22, 60)                                           # Invest press
for at in [2.55, 7.05, 13.0, 20.75, 22.15, 24.35, 26.2, 29.2]: tick(at, 2600, .08, 80)  # highlights

# ---------------- mix ----------------
meter = pyln.Meter(SR)
def to_lufs(x, target):
    l = meter.integrated_loudness(x); return x * 10 ** ((target - l) / 20)
vo, vsr = sf.read(sys.argv[1]); vo = resample_poly(vo, SR, vsr)[:N]; vo = np.pad(vo, (0, N - len(vo)))
vo = filt(vo, 80, 'high')
VO_L = -18.0
vo = to_lufs(vo, VO_L)
music = to_lufs(music, VO_L - 9.0)
sfx = to_lufs(sfx, VO_L - 15.0)
# duck music ~4 dB and effects ~3 dB while the voice is talking (smooth envelope)
venv = np.clip(filt(np.abs(vo), 5, 'low', 1) / (np.abs(vo).max() * .08), 0, 1)
music *= 10 ** (-4.0 * venv / 20)
sfx *= 10 ** (-3.0 * venv / 20)
# carve a little space for the voice in the music (gentle 1-3 kHz dip)
music = music - .35 * filt(music, [1000, 3200], 'band') * venv
mix = vo + music + sfx
fade = np.ones(N); fo = int(2.0 * SR); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
mix *= fade
peak = np.abs(mix).max(); mix = np.tanh(mix / peak * 1.2) / np.tanh(1.2) * .95
sf.write(sys.argv[2], np.stack([mix, mix], 1).astype(np.float32), SR, subtype='FLOAT')
if len(sys.argv) > 3:
    for n_, x in [('voice', vo), ('music', music), ('sfx', sfx)]: sf.write(f'{sys.argv[3]}/{n_}.wav', x.astype(np.float32), SR, subtype='FLOAT')
for n_, x in [('voice', vo), ('music', music), ('sfx', sfx)]:
    print(f'{n_:6s} {meter.integrated_loudness(x):6.1f} LUFS')
print('ok')
