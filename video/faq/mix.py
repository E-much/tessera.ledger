"""FAQ soundtrack: the owner's song (no voice in this video, so it stays present) + subtle UI sounds."""
import json, os, subprocess, numpy as np
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR = 48000
tl = json.load(open(f"{R}/build/faq/timeline.json")); T = tl["duration"]; N = int(T * SR); t = np.arange(N) / SR
def load(f):
    return np.frombuffer(subprocess.check_output(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"]), np.float32).astype(np.float64)
def norm(a): return a / (np.abs(a).max() + 1e-9)
song = load(f"{R}/assets/music/user_song_bed_6min.mp3"); n = min(len(song), N)
mus = np.zeros(N); mus[:n] = song[:n]; mus /= np.sqrt(np.mean(mus ** 2)) + 1e-9
# gentle dips under reading-heavy answer scenes, full level on intro, cards, questions and outro
lvl = np.full(N, 1.0)
for s in tl["scenes"]:
    if s["type"] == "say":
        a, b = int(s["start"] * SR), int((s["start"] + s["dur"]) * SR); lvl[a:b] = 0.72
k = int(.4 * SR); lvl = np.convolve(lvl, np.ones(k) / k, "same")
mus *= lvl * 0.25
mus *= np.clip(t / 0.6, 0, 1) * np.clip((T - t) / 3.0, 0, 1)
# ---- UI sounds (synthesised: ElevenLabs credits are used up) ----
rs = np.random.default_rng(3)
def tick():
    L = int(.018 * SR); e = np.exp(-np.arange(L) / SR * 320); return rs.standard_normal(L) * e * 0.5 + np.sin(2 * np.pi * 2400 * np.arange(L) / SR) * e * 0.3
def pop():
    L = int(.12 * SR); tt = np.arange(L) / SR; return np.sin(2 * np.pi * (520 + 900 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 30)
sfx = np.zeros(N)
def put(a, at, g):
    i = max(0, int(at * SR)); m = min(len(a), N - i)
    if m > 0: sfx[i:i + m] += a[:m] * g
files = {k: norm(load(f"{R}/build/music/{k}.mp3")) for k in ["impact", "whoosh", "click"]}
for e in tl["events"]:
    if e["n"] == "type":
        tt = e["t"]
        while tt < e["t"] + e["dur"]:
            put(tick(), tt, 0.10 + rs.random() * 0.05); tt += 0.045 + rs.random() * 0.05
    elif e["n"] == "pop": put(pop(), e["t"], 0.18)
    elif e["n"] == "click": put(pop() * 0.6, e["t"], 0.2); put(tick(), e["t"], 0.2)
    elif e["n"] == "impact": put(files["impact"], e["t"], 0.30)
    elif e["n"] == "whoosh": put(files["whoosh"], e["t"], 0.04)   # kept very quiet, per the owner
mix = mus + sfx
mix /= np.abs(mix).max() / 0.95
open(f"{R}/build/faq/mix.f32", "wb").write(np.stack([mix, mix], 1).astype(np.float32).tobytes())
subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", f"{R}/build/faq/mix.f32",
    "-af", "loudnorm=I=-14:TP=-1.2:LRA=9", "-ar", "48000", "-c:a", "aac", "-b:a", "256k", f"{R}/build/faq/mix.m4a"])
print("audio", T)
