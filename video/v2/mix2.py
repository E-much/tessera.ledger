"""Soundtrack v2: dialogue + chaptered music bed (alternating loops, ambient pad) + accent SFX."""
import json, os, subprocess, numpy as np
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR = 48000
e = json.load(open(f"{R}/build/v2/edl.json")); T = e["duration"]; N = int(T * SR)
t = np.arange(N) / SR

def load(f):
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", f, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"])
    return np.frombuffer(raw, np.float32).astype(np.float64)
def rms(a): return np.sqrt(np.mean(a ** 2)) + 1e-9
def peaknorm(a): return a / (np.abs(a).max() + 1e-9)
M = lambda n: f"{R}/build/music/{n}.mp3"

# ---------- dialogue ----------
src = {k: load(f"{R}/build/clips/{v}.mp4") for k, v in e["src"].items()}
dia = np.zeros(N); speech = np.zeros(N); f8 = int(.008 * SR); ramp = np.linspace(0, 1, f8)
for it in e["items"]:
    a = src[it["src"]][int(it["in"] * SR):int(it["out"] * SR)].copy(); a[:f8] *= ramp; a[-f8:] *= ramp[::-1]
    i = int(it["start"] * SR); n = min(len(a), N - i); dia[i:i + n] += a[:n]; speech[i:i + n] = 1
dia *= 0.12 / rms(dia[speech > 0])
D = rms(dia[speech > 0])

# ---------- music bed ----------
def loop_into(buf, clip, a, b, gain, xf=1.0):
    xs = int(xf * SR); pos = int(a * SR); end = int(b * SR)
    while pos < end:
        seg = clip.copy(); seg[:xs] *= np.linspace(0, 1, xs); seg[-xs:] *= np.linspace(1, 0, xs)
        n = min(len(seg), N - pos, end + xs - pos)
        if n <= 0: break
        buf[pos:pos + n] += seg[:n] * gain; pos += len(seg) - xs

cards = e["cards"]; logo = next(c for c in cards if c["kind"] == "logo"); end = next(c for c in cards if c["kind"] == "end")
chap = [c for c in cards if c["kind"] == "chapter"]
song = load(M("user_song_bed")); song /= rms(song)   # the user's chosen track, pre-looped on whole beats
mus = np.zeros(N); n = min(len(song), N); mus[:n] = song[:n]
# duck: music sits ~16 dB under the voice while he talks, opens up on cards and B-roll gaps
k = int(.35 * SR); sm = np.convolve(speech, np.ones(k) / k, "same")
under = np.where(t < logo["start"], 0.38, 0.1)     # intro stays loud; ~20 dB under the voice in the main video
mus *= D * (under * sm + 0.9 * (1 - sm))            # cards, logo and pauses open right up
mus *= np.clip((T - t) / 4, 0, 1)   # long fade over the credits

# ---------- accents ----------
sfx = np.zeros(N); cache = {}
def put(name, at, gain):
    a = cache.setdefault(name, peaknorm(load(M(name))))
    i = max(0, int(at * SR)); n = min(len(a), N - i)
    if n > 0: sfx[i:i + n] += a[:n] * gain * D * 2.2
for s in e["sfx"]:
    n = s["n"]
    if n == "click": continue                      # replaced by slam-specific accents below
    if n == "riser": continue                      # the song carries the build now
    put(n, s["t"], {"drop": .8, "glitch": .4, "hit": .8, "whoosh": .08}.get(n, .5))
for sl in e["slams"]:
    if sl.get("behind"):
        put("swell", sl["t"] - 0.45, 0.15); put("impact", sl["t"] + 0.05, 0.35)
    else:
        put("impact", sl["t"] - 0.02, 0.7)
# (no piano: it could clash with the song's key)

mix = dia + mus + sfx
mix /= np.abs(mix).max() / 0.95
open(f"{R}/build/v2/mix.f32", "wb").write(np.stack([mix, mix], 1).astype(np.float32).tobytes())
subprocess.check_call(["ffmpeg", "-y", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", f"{R}/build/v2/mix.f32",
    "-af", "highpass=f=40,acompressor=threshold=0.3:ratio=2.5:attack=10:release=180,loudnorm=I=-14:TP=-1.2:LRA=10",
    "-ar", "48000", "-c:a", "aac", "-b:a", "256k", f"{R}/build/v2/mix.m4a"])
# report balance so levels can be sanity-checked without listening
sp = speech > 0.5
print(f"dur {T:.1f}s | music under speech {20*np.log10(rms(mus[sp])/D):.1f} dB rel voice | "
      f"music in gaps {20*np.log10(rms(mus[~sp & (t<end['start'])])/D):.1f} dB rel voice")
