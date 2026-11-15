"""'Listen back': objective checks on the final mix and stems."""
import json, re, numpy as np, soundfile as sf, pyloudnorm as pyln
SR = 48000
vo, _ = sf.read("audio/stems/vo.wav"); mu, _ = sf.read("audio/stems/music.wav"); fx, _ = sf.read("audio/stems/sfx.wav")
mix, _ = sf.read("audio/mix.wav"); mix = mix[:, 0]
EV = json.load(open("video/src/events.json")); TL = json.load(open("video/src/timeline.json"))
meter = pyln.Meter(SR)
print("integrated: mix %.2f | vo %.2f | music %.2f | sfx %.2f LUFS" % tuple(meter.integrated_loudness(x) for x in (mix, vo, mu, fx)))
pre = vo + mu + fx
print("limiter max gain reduction: %.2f dB" % (20 * np.log10(np.max(np.abs(pre)) / np.max(np.abs(mix)))))
print("sample peak: %.2f dBFS, clipped samples: %d" % (20 * np.log10(np.max(np.abs(mix))), int(np.sum(np.abs(mix) >= 0.999))))

def kw(x):  # K-weighting via pyloudnorm's filters
    y = x.copy()
    for f in meter._filters.values():
        y = f.apply_filter(y)
    return y
K = {n: kw(x) for n, x in (("vo", vo), ("mu", mu), ("fx", fx))}
def ml(n, t, w=0.4):  # momentary loudness (LUFS) of stem n over [t, t+w]
    i, j = int(t * SR), int((t + w) * SR)
    return -0.691 + 10 * np.log10(np.mean(K[n][i:j] ** 2) + 1e-12)

# 1) during speech: VO vs ducked music
gaps = []
for L in TL["lines"]:
    for w in L["words"]:
        gaps.append(ml("vo", w["t"], 0.3) - ml("mu", w["t"], 0.3))
print("VO over music during words: min %.1f dB, median %.1f dB" % (min(gaps), np.median(gaps)))

# 2) every SFX event: SFX must be below music and below VO (VO level = speech median when silent)
vo_speech = np.median([ml("vo", w["t"], 0.3) for L in TL["lines"] for w in L["words"]])
evts = []
for k, v in EV.items():
    if k in ("end", "credit"): continue
    for t in np.ravel(v):
        evts.append((k, float(t)))
worst = []
for k, t in evts:
    f, m, s = ml("fx", t - 0.05, 0.3), ml("mu", t - 0.05, 0.3), ml("vo", t - 0.05, 0.3)
    ref_vo = s if s > -60 else vo_speech
    worst.append((min(m - f, ref_vo - f), k, t, f, m, s))
worst.sort()
print("SFX headroom under min(music, VO) — 6 tightest events:")
for d, k, t, f, m, s in worst[:6]:
    print(f"  {k:12s} t={t:6.2f}  sfx {f:6.1f}  music {m:6.1f}  vo {s:6.1f}  → margin {d:5.1f} dB")
print("events where SFX >= music or VO:", sum(1 for w in worst if w[0] <= 0))
