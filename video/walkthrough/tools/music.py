"""Background bed for the walkthrough + final mix with the voice.

Music: warm, laid-back 92 BPM (soft pads, gentle plucks, light kick/hat), original and generated here.
Mix: voice is the reference; the bed sits ~20 LU under it while talking and comes up for the closing card.

usage: python3 music.py <voice.wav> <out.wav> <talk_seconds> <total_seconds>"""
import sys, numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import butter, sosfilt, resample_poly
voice_f, out_f, TALK, TOTAL = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
SR = 48000; N = int(TOTAL * SR); rng = np.random.default_rng(3)
BPM = 92; BEAT = 60 / BPM; BAR = 4 * BEAT
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def filt(x, f, kind, o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x, axis=0)
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a, r):
    e = np.ones(n); ai = max(1, int(a * SR)); ri = max(1, min(n, int(r * SR)))
    e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def place(buf, x, t, g=1.0, pan=0.0):
    if x.ndim == 1:
        a = (pan + 1) * np.pi / 4; x = np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)
    s = int(t * SR); n = min(len(x), N - s)
    if n > 0: buf[s:s + n] += x[:n] * g
def pad(notes, d):
    n = int(d * SR); t = np.arange(n) / SR; L = np.zeros(n); R = np.zeros(n)
    for m in notes:
        for det, side in ((-.004, 0), (.0035, 1), (0, 2)):
            y = sum(np.sin(2 * np.pi * hz(m) * (1 + det) * k * t) / k for k in range(1, 8))
            if side != 1: L += y
            if side != 0: R += y
    y = filt(np.stack([L, R], 1) / (len(notes) * 4), 1800, 'low')
    return y * env(n, .6, .8)[:, None]
def pluck(m, d=.6):
    t = tt(d); f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t * 6) * np.minimum(1, t * 400)
def kick():
    t = tt(.35); return np.sin(2 * np.pi * np.cumsum(46 + 90 * np.exp(-t * 30)) / SR) * np.exp(-t * 9)
def hat():
    t = tt(.04); return filt(rng.standard_normal(len(t)), 7500, 'high') * np.exp(-t * 120)

CH = [[53, 57, 60, 64], [57, 60, 64, 67], [55, 59, 62, 67], [48, 55, 60, 64]]   # Fmaj7 Am7 G Cadd
ROOT = [41, 45, 43, 36]
music = np.zeros((N, 2)); drums = np.zeros((N, 2))
bar = 0; t0 = 0.0
while t0 < TOTAL:
    i = bar % 4
    place(music, pad(CH[i], BAR + .9), t0, .9)
    t = tt(BAR * .95); place(music, np.sin(2 * np.pi * hz(ROOT[i] - 12) * t) * env(len(t), .02, .3), t0, .35)
    for k, m in enumerate([0, 2, 1, 3, 2, 1, 3, 2]):
        place(music, pluck(CH[i][m] + 12), t0 + k * BEAT / 2, .12, (-.35, .35)[k % 2])
    for b in range(4):
        place(drums, kick(), t0 + b * BEAT, .55 if b % 2 == 0 else .3)
        place(drums, hat(), t0 + b * BEAT + BEAT / 2, .16, .3)
    bar += 1; t0 += BAR
music = music + filt(drums, 6000, 'low')
fade = np.ones(N); fi = int(1.5 * SR); fade[:fi] = np.linspace(0, 1, fi); fo = int(2.5 * SR); fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
music *= fade[:, None]

meter = pyln.Meter(SR)
vo, vsr = sf.read(voice_f); vo = resample_poly(vo, SR, vsr) if vsr != SR else vo
vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
vo = vo * 10 ** ((-16 - meter.integrated_loudness(vo[:int(TALK * SR)])) / 20)
music = music * 10 ** ((-36 - meter.integrated_loudness(music)) / 20)      # bed ~20 LU under the voice
# a touch louder in pauses and for the closing card
venv = np.clip(filt(np.abs(vo), 4, 'low', 1) / (np.abs(vo).max() * .06), 0, 1)
lift = np.where(np.arange(N) / SR > TALK, 3.0, 1.0)
music = music * (lift * (1 + .6 * (1 - venv)))[:, None]
mix = np.stack([vo, vo], 1) + music
# master: -14 LUFS (platform standard), peaks held under -1 dBFS with a soft limiter
mix = mix * 10 ** ((-14 - meter.integrated_loudness(mix)) / 20)
ceil = 10 ** (-1.2 / 20); over = np.abs(mix) > ceil * .8
mix = np.where(over, np.sign(mix) * (ceil * .8 + (ceil * .2) * np.tanh((np.abs(mix) - ceil * .8) / (ceil * .2))), mix)
print('mix LUFS', round(meter.integrated_loudness(mix), 1), 'peak dB', round(20 * np.log10(np.abs(mix).max()), 2))
sf.write(out_f, mix.astype(np.float32), SR, subtype='FLOAT'); print('ok', out_f)
