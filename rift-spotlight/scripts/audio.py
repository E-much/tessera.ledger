"""Compose music + design SFX in code, mix with the VO, normalise to -14 LUFS.

Everything is driven by video/src/timeline.json (VO placement) and video/src/events.json
(the same event times the animation uses), so picture, SFX and beat share one clock.
Outputs: audio/stems/{vo,music,sfx}.wav, audio/mix.wav (48 kHz / 24-bit)
"""
import json
import numpy as np
import soundfile as sf
import pyloudnorm as pyln

SR = 48000
TL = json.load(open("video/src/timeline.json"))
EV = json.load(open("video/src/events.json"))
DUR = TL["duration"]
N = int(DUR * SR)
BPM = TL["bpm"]
BEAT = 60 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)
_sh = {x["id"]: x["t0"] for x in EV["shots"]}
# music sections: the hunt (sparse) → Rift arrives (lift) → venues/route (peak) → breath → resolve on "Rift."
CUT = [_sh["bridge"], _sh["logo"], _sh["route"], _sh["close"] - 0.01, _sh["close"]]


def t_(n):
    return np.arange(n) / SR


def env_ad(n, a, d):
    """attack (s) then exponential decay (time constant d s)"""
    t = t_(n)
    e = np.exp(-np.maximum(t - a, 0) / d)
    if a > 0:
        e *= np.minimum(t / a, 1)
    return e


def lpf(x, fc):
    """one-pole low-pass, fc may be array"""
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s
        y[i] = s
    return y


def lpf_fast(x, fc):
    """constant-cutoff one-pole low-pass via scipy-free recursion in blocks"""
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    # vectorised-ish: process in python but on short arrays only
    for i in range(len(x)):
        s = (1 - a) * x[i] + a * s
        y[i] = s
    return y


def hpf(x, fc):
    return x - lpf_fast(x, fc)


def add(buf, x, at):
    i = int(round(at * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    if i < 0:
        x = x[-i:]
        i = 0
        j = min(len(buf), len(x))
    buf[i:j] += x[: j - i]


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------------------------------------------------------- harmony
CH = {  # chord tones (MIDI)
    "Am": [57, 60, 64],
    "F": [53, 57, 60],
    "C": [48, 52, 55],
    "G": [55, 59, 62],
}
ROOT = {"Am": 45, "F": 41, "C": 48 - 12, "G": 43}
CYCLE = ["Am", "F", "C", "G"]


def chord_at(t):
    """Am–F–C–G loop; G for the bar before the close, C (resolution) from "Rift." on."""
    if t >= EV["closeLogo"] - 0.01:
        return "C"
    if t >= EV["closeLogo"] - BAR - 0.01:
        return "G"
    return CYCLE[int(t // BAR) % 4]


# section intensity 0..1 over time (builds into the demo, resolves at close)
def intensity(t):
    pts = [(0, 0.25), (CUT[0], 0.35), (CUT[1], 0.5), (CUT[2], 0.75), (EV["lock"], 0.9), (EV["fail"], 0.9), (CUT[3], 0.85), (CUT[4], 0.6), (EV["closeLogo"], 0.5), (DUR, 0.2)]
    xs, ys = zip(*pts)
    return float(np.interp(t, xs, ys))


music = np.zeros(N)

# --- pulse (soft kick) on every beat; drops for the failure beat
kick_n = int(0.32 * SR)
kt = t_(kick_n)
freq = 46 + 52 * np.exp(-kt / 0.035)
kick = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env_ad(kick_n, 0.002, 0.09)
kick += 0.15 * np.sin(2 * np.pi * 92 * kt) * env_ad(kick_n, 0.001, 0.02)
nb = int(EV["closeLogo"] / BEAT) + 1
for b in range(nb):
    t = b * BEAT
    if EV["fail"] <= t < EV["relock"]:
        continue  # the beat drops out while the venue is down
    if CUT[4] <= t < EV["closeLogo"]:
        continue  # breath before the resolve
    lvl = 0.55 * intensity(t)
    if b % 4 == 0:
        lvl *= 1.15
    add(music, kick * lvl, t)
# final resolving hit
add(music, kick * 0.6, EV["closeLogo"])

# --- bass (sub sine + filtered saw), 8ths from the solution on
bass_len = int(BEAT / 2 * SR)
for k in range(int(DUR / (BEAT / 2))):
    t = k * BEAT / 2
    if t < CUT[1] or t >= CUT[4] or (EV["fail"] <= t < EV["relock"]):
        continue
    f0 = midi(ROOT[chord_at(t)])
    tt = t_(bass_len)
    saw = 2 * ((tt * f0) % 1) - 1
    x = 0.8 * np.sin(2 * np.pi * f0 * tt) + 0.25 * saw
    x *= env_ad(bass_len, 0.004, 0.11)
    accent = 1.0 if k % 2 == 0 else 0.7
    add(music, x * 0.16 * intensity(t) * accent, t)
music_b = lpf_fast(music.copy(), 900)  # keep sub/bass soft
music = music_b

# --- pad: detuned saws, slow filter, follows chords; resolves on C at the close
pad = np.zeros(N)
for b in range(int(np.ceil(DUR / BAR))):
    t0 = b * BAR
    ch = chord_at(t0 + 0.01)
    length = BAR + 0.4 if t0 < EV["closeLogo"] - 0.01 else DUR - t0
    n = int(length * SR)
    tt = t_(n)
    x = np.zeros(n)
    notes = CH[ch] + ([ch == "C" and 64 or CH[ch][0] + 12])
    for m in notes:
        for det in (-0.07, 0.07):
            f = midi(m) * 2 ** (det / 12)
            x += 2 * ((tt * f + rng.random()) % 1) - 1
    late = t0 >= EV["closeLogo"] - 0.01
    a = 0.35 if not late else 0.05
    e = np.minimum(tt / a, 1) * np.minimum(1, np.maximum(0, (length - tt) / 0.4))
    if late:
        e *= np.exp(-tt / 3.2)
    add(pad, x * e * 0.02, t0)
pad_cut = np.array([380 + 900 * intensity(i / SR) for i in range(0, N, 480)])
pad_cut = np.repeat(pad_cut, 480)[:N]
pad = lpf(pad, pad_cut)
music += pad

# --- arp pluck: 8ths in problem/solution, 16ths in the demo
def pluck(f, n, dec):
    tt = t_(n)
    x = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt) + 0.08 * np.sin(2 * np.pi * 3 * f * tt)
    return x * env_ad(n, 0.002, dec)


arp = np.zeros(N)
pat = [0, 1, 2, 1, 2, 0, 1, 2]
step = 0
t = CUT[0]
while t < CUT[4]:
    sub = BEAT / 4 if CUT[2] <= t < CUT[3] else BEAT / 2
    if not (EV["fail"] <= t < EV["relock"]):
        ch = CH[chord_at(t)]
        m = ch[pat[step % len(pat)]] + 12
        lvl = 0.05 * intensity(t) * (1.0 if step % 4 == 0 else 0.7)
        add(arp, pluck(midi(m), int(0.3 * SR), 0.07 if sub < BEAT / 2 else 0.12) * lvl, t)
    step += 1
    t += sub
arp = lpf_fast(arp, 4200)
music += arp

# --- hats: quiet ticks on off-beats from the solution, 16ths in the demo
hat_n = int(0.04 * SR)
hat = hpf(rng.standard_normal(hat_n), 6500) * env_ad(hat_n, 0.0005, 0.008)
t = CUT[1]
k = 0
while t < CUT[4]:
    sub = BEAT / 4 if CUT[2] <= t < CUT[3] else BEAT / 2
    if not (EV["fail"] <= t < EV["relock"]):
        on_off = (k % 2 == 1) if sub == BEAT / 2 else True
        if on_off:
            add(music, hat * 0.035 * intensity(t) * (1.0 if k % 2 else 0.6), t)
    k += 1
    t += sub

# --- close: a single high C/G bell on the resolve
bell_n = int(4 * SR)
bt = t_(bell_n)
bell = (np.sin(2 * np.pi * midi(84) * bt) + 0.5 * np.sin(2 * np.pi * midi(91) * bt)) * env_ad(bell_n, 0.003, 1.2)
add(music, bell * 0.03, EV["closeLogo"])

# gentle overall fade at the very end
fade = np.ones(N)
fs = int((DUR - 1.2) * SR)
fade[fs:] = np.linspace(1, 0, N - fs) ** 2
music *= fade

# ---------------------------------------------------------------- SFX
SFX_EVENTS = []  # (signal, time) — levelled against music/VO after ducking


def add_sfx(_buf, x, at):
    SFX_EVENTS.append((x, at))


def tick(level=1.0, f=2600):
    n = int(0.012 * SR)
    tt = t_(n)
    return np.sin(2 * np.pi * f * tt) * env_ad(n, 0.0003, 0.0025) * level


def click(level=1.0):
    n = int(0.06 * SR)
    tt = t_(n)
    x = hpf(rng.standard_normal(n), 1800) * env_ad(n, 0.0002, 0.004) * 0.6
    x += np.sin(2 * np.pi * 1100 * tt) * env_ad(n, 0.0005, 0.008) * 0.5
    x += np.sin(2 * np.pi * 140 * tt) * env_ad(n, 0.001, 0.02) * 0.6
    return x * level


def lock(level=1.0):
    n = int(0.5 * SR)
    tt = t_(n)
    x = hpf(rng.standard_normal(n), 3000) * env_ad(n, 0.0002, 0.003) * 0.7  # latch
    x += (np.sin(2 * np.pi * 1318.5 * tt) + 0.6 * np.sin(2 * np.pi * 1975.5 * tt)) * env_ad(n, 0.001, 0.07) * 0.35
    x += np.sin(2 * np.pi * 82 * tt) * env_ad(n, 0.002, 0.06) * 0.7  # body
    return x * level


def whoosh(dur=0.45, level=1.0, up=True):
    n = int(dur * SR)
    tt = t_(n)
    noise = rng.standard_normal(n)
    sweep = (300 + 3200 * (tt / dur)) if up else (3500 - 3200 * (tt / dur))
    x = lpf(noise, sweep)
    x = hpf(x, 180)
    bell_env = np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 2
    return x * bell_env * level


def glitch(level=1.0):
    n = int(0.16 * SR)
    tt = t_(n)
    sq = np.sign(np.sin(2 * np.pi * 180 * tt)) * np.sign(np.sin(2 * np.pi * 37 * tt))
    gate = (np.floor(tt / 0.018) % 2 == 0).astype(float)
    x = np.round(sq * 6) / 6 * gate
    x = lpf_fast(x, 3000) * env_ad(n, 0.001, 0.07)
    return x * level


def chime(level=1.0):
    n = int(0.9 * SR)
    tt = t_(n)
    x = np.sin(2 * np.pi * midi(84) * tt) * env_ad(n, 0.002, 0.25)
    y = np.sin(2 * np.pi * midi(91) * tt) * env_ad(n, 0.002, 0.3)
    out = x.copy()
    d = int(0.09 * SR)
    out[d:] += y[: n - d]
    return out * level


def soft_hit(level=1.0):
    n = int(0.9 * SR)
    tt = t_(n)
    f = 40 + 30 * np.exp(-tt / 0.05)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.003, 0.25) * level


# relative SFX levels (pre-mix); final check enforces SFX < VO and < music
L_TICK, L_CLICK, L_LOCK, L_WHOOSH = 0.05, 0.16, 0.16, 0.06

# her stall, the others appearing
add_sfx(None, whoosh(0.45, L_WHOOSH * 0.7), EV["herStall"] - 0.3)  # photo slides away
add_sfx(None, soft_hit(0.14), EV["herStall"])
for i in range(3):
    add_sfx(None, tick(L_TICK, 1600 + 150 * i), EV["others"] + i * 0.12)
# the excuses: each note lands, then they all fall away
for t in EV["reasons"]:
    add_sfx(None, click(L_CLICK * 0.35), t)
add_sfx(None, whoosh(0.5, L_WHOOSH * 0.7, up=False), EV["excuses"])
# the errand: the street opens, footsteps, her price struck, the long walk, bought
add_sfx(None, whoosh(0.5, L_WHOOSH * 0.7), EV["street"] - 0.25)
for t in list(np.arange(EV["runner"] + 0.35, EV["pass"], 0.3)) + list(np.arange(EV["walk"], EV["buy"] + 0.1, 0.22)):
    add_sfx(None, tick(L_TICK * 0.7, 900 + 200 * rng.random()), t)
add_sfx(None, glitch(0.05), EV["pass"])
add_sfx(None, tick(L_TICK * 1.2, 2000), EV["cheap"])
add_sfx(None, lock(L_LOCK * 0.7), EV["buy"])
# the stalls flip into venues, then Rift
for i in range(4):
    add_sfx(None, tick(L_TICK, 1800 + 120 * i), EV["morph"] + i * 0.09 + 0.25)
add_sfx(None, whoosh(0.5, L_WHOOSH), EV["sweep"])
add_sfx(None, soft_hit(0.18), EV["sweep"] + 0.35)
for t in np.arange(EV["venues"], EV["venuesEnd"], 1 / 10):
    add_sfx(None, tick(L_TICK * 0.45, 2100 + 700 * rng.random()), t)
for k in range(4):
    add_sfx(None, tick(L_TICK * 1.1, 1900), EV["route"] + k * (EV["chains"] - 0.1 - EV["route"]) / 4)
add_sfx(None, lock(L_LOCK), EV["result"])
# phone, tap, fees, close, card
add_sfx(None, whoosh(0.45, L_WHOOSH * 0.9), EV["phoneIn"] - 0.1)
add_sfx(None, click(L_CLICK), EV["click"])
add_sfx(None, whoosh(0.4, L_WHOOSH * 0.8), EV["fees"] - 0.2)
add_sfx(None, soft_hit(0.14), EV["fees"])
add_sfx(None, soft_hit(0.2), EV["closeLogo"])
add_sfx(None, chime(0.04), EV["card"] + 0.3)

# ---------------------------------------------------------------- VO
def true_peak(x):
    up = np.interp(np.arange(0, len(x), 0.25), np.arange(len(x)), x)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limiter(x, ceiling_db=-2.0, look=0.005, rel=0.08):
    c = 10 ** (ceiling_db / 20)
    la = int(look * SR)
    peak = np.abs(x)
    # running max over lookahead window
    pk = np.maximum.reduce([np.roll(peak, -k) for k in range(0, la, 8)])
    g_target = np.minimum(1, c / np.maximum(pk, 1e-9))
    g = np.empty_like(x)
    s = 1.0
    r = np.exp(-1 / (rel * SR))
    for i in range(len(x)):
        s = g_target[i] if g_target[i] < s else r * s + (1 - r) * g_target[i]
        g[i] = s
    return x * g


vo = np.zeros(N)
for i, L in enumerate(TL["lines"], 1):
    x, sr = sf.read(f"audio/vo/line{i}.wav")
    if x.ndim > 1:
        x = x.mean(1)
    # resample 24k → 48k (linear is fine for 2x on speech that is band-limited < 12k)
    xi = np.interp(np.arange(0, len(x), sr / SR), np.arange(len(x)), x)
    add(vo, xi, L["start"])
# gentle presence: high-pass rumble
vo = hpf(vo, 70)

meter = pyln.Meter(SR)


def compress(x, thr_db=-28.0, ratio=3.5, att=0.003, rel=0.08):
    """feed-forward RMS compressor (smooths speech peaks so the limiter barely works)"""
    win = int(0.008 * SR)
    lvl = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode="same")) + 1e-9
    ldb = 20 * np.log10(lvl)
    gr = np.minimum(0, (thr_db - ldb) * (1 - 1 / ratio))
    out = np.empty_like(gr)
    s, a_, r_ = 0.0, np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    for i in range(len(gr)):
        c = a_ if gr[i] < s else r_
        s = c * s + (1 - c) * gr[i]
        out[i] = s
    return x * 10 ** (out / 20)


vo *= 10 ** ((-16.0 - meter.integrated_loudness(vo)) / 20)
vo = compress(vo)
# de-peak consonant transients on the voice only (fast look-ahead limiter, ~4 dB on peaks)
vo = limiter(vo, ceiling_db=20 * np.log10(np.max(np.abs(vo))) - 4.0, look=0.002, rel=0.04)
vo_lufs = meter.integrated_loudness(vo)
vo *= 10 ** ((-16.0 - vo_lufs) / 20)  # speech stem sits at -16 LUFS before final normalise

# ---------------------------------------------------------------- ducking
win = int(0.02 * SR)
rms = np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, mode="same"))
active = (rms > 10 ** (-45 / 20)).astype(float)
# attack 40 ms, release 350 ms smoothing on the gate
duck = np.empty(N)
s = 0.0
aa = np.exp(-1 / (0.04 * SR))
ar = np.exp(-1 / (0.35 * SR))
for i in range(N):
    c = aa if active[i] > s else ar
    s = c * s + (1 - c) * active[i]
    duck[i] = s
look = int(0.06 * SR)  # duck starts 60 ms before each word
duck = np.concatenate([duck[look:], np.zeros(look)])
music_gain = 10 ** ((-9.0 * duck) / 20)

music_lufs = meter.integrated_loudness(music)
music *= 10 ** ((-25.0 - music_lufs) / 20)  # bed level before ducking
music_d = music * music_gain



def kw(x):
    y = x.copy()
    for f in meter._filters.values():
        y = f.apply_filter(y)
    return y


Kmu, Kvo = kw(music_d), kw(vo)


def ml(K, t, w):
    i, j = max(0, int(t * SR)), int((t + w) * SR)
    return -0.691 + 10 * np.log10(np.mean(K[i:j] ** 2) + 1e-12)


speech_ref = np.median([ml(Kvo, w["t"], 0.3) for L in TL["lines"] for w in L["words"]])
sfx = np.zeros(N)
MARGIN = 4.0  # dB under the quieter of music and voice
for x, at in SFX_EVENTS:
    w = min(0.3, len(x) / SR)
    kx = kw(np.concatenate([x, np.zeros(int(0.3 * SR))]))[: int(w * SR)]
    lx = -0.691 + 10 * np.log10(np.mean(kx ** 2) + 1e-12)
    vo_l = ml(Kvo, at, w)
    ref = min(ml(Kmu, at, w), vo_l if vo_l > -60 else speech_ref)
    g = min(1.0, 10 ** ((ref - MARGIN - lx) / 20))  # never boost, only pull under
    add(sfx, x * g, at)

# second pass: wherever overlapping SFX sum to within MARGIN of the bed, pull the SFX stem down
Kfx = kw(sfx)
hop, win = int(0.025 * SR), int(0.3 * SR)
red = np.zeros(N // hop + 1)
for k in range(len(red)):
    i = k * hop
    lf = -0.691 + 10 * np.log10(np.mean(Kfx[i:i + win] ** 2) + 1e-12)
    if lf < -70:
        continue
    vo_l = -0.691 + 10 * np.log10(np.mean(Kvo[i:i + win] ** 2) + 1e-12)
    ref = min(-0.691 + 10 * np.log10(np.mean(Kmu[i:i + win] ** 2) + 1e-12), vo_l if vo_l > -60 else speech_ref)
    red[k] = min(0.0, ref - MARGIN - lf)
red = np.minimum.reduce([np.roll(red, s_) for s_ in range(-12, 13)])  # spread over the window
g = 10 ** (np.repeat(red, hop)[:N] / 20)
g = np.convolve(g, np.ones(480) / 480, mode="same")
sfx *= g

mix = vo + music_d + sfx


# ---------------------------------------------------------------- loudness + true-peak
pre = mix.copy()
st = lambda x: meter.integrated_loudness(np.stack([x, x], 1))  # measure as the stereo file we write
gain = -14.0 - st(pre)
for _ in range(6):  # gain → limit → re-measure until integrated loudness lands on -14
    mix = limiter(pre * 10 ** (gain / 20))
    err = -14.0 - st(mix)
    if abs(err) < 0.05:
        break
    gain += err
vo_s, music_s, sfx_s = vo * 10 ** (gain / 20), music_d * 10 ** (gain / 20), sfx * 10 ** (gain / 20)
final_lufs = st(mix)
tp = true_peak(mix)

import os

os.makedirs("audio/stems", exist_ok=True)
sf.write("audio/stems/vo.wav", vo_s, SR, subtype="PCM_24")
sf.write("audio/stems/music.wav", music_s, SR, subtype="PCM_24")
sf.write("audio/stems/sfx.wav", sfx_s, SR, subtype="PCM_24")
sf.write("audio/mix.wav", np.stack([mix, mix], 1), SR, subtype="PCM_24")
print(f"mix integrated {final_lufs:.2f} LUFS, true peak {tp:.2f} dBTP")
