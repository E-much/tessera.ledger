"""One continuous ElevenLabs read of the whole script (no stitching), with character timestamps.
Short <break> tags give breathing room between sections. Output is sliced per line at the
quiet gaps so the rest of the pipeline is unchanged, but the read itself is a single take."""
import base64, json, subprocess, sys, urllib.request
import numpy as np, soundfile as sf

VOICE = sys.argv[1]
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
LINES = json.load(open("scripts/script.json"))
BREAKS = [float(x) for x in sys.argv[3].split(",")] if len(sys.argv) > 3 else [0.4] * 10  # pause after each line (s)
SR = 44100
parts = []
for i, L in enumerate(LINES):
    parts.append(L["el"])
    if i < len(BREAKS):
        parts.append(f'<break time="{BREAKS[i]}s" />')
text = " ".join(parts)
body = {"text": text, "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True, "speed": SPEED}}
req = urllib.request.Request(
    f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
    data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "xi-api-key": "proxy-injected"})
d = json.load(urllib.request.urlopen(req, timeout=300))
mp3 = base64.b64decode(d["audio_base64"])
open("audio/vo/full.mp3", "wb").write(mp3)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"], input=mp3, capture_output=True, check=True).stdout
pcm = np.frombuffer(raw, dtype="<f4").copy()
al = d["alignment"]
# words from characters, skipping the <break .../> tags
words, cur, cs, intag = [], "", None, False
for c, s0, e0 in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
    if c == "<": intag = True
    if intag:
        if c == ">": intag = False
        continue
    if c.isspace():
        if cur: words.append(dict(w=cur, s=cs, e=pe)); cur = ""
        continue
    if not cur: cs = s0
    cur += c; pe = e0
if cur: words.append(dict(w=cur, s=cs, e=pe))
# assign words back to lines by count
out, k = [], 0
counts = [len(L["el"].split()) for L in LINES]
assert sum(counts) == len(words), (sum(counts), len(words))
bounds = []
for i, (L, n) in enumerate(zip(LINES, counts)):
    ws = words[k:k + n]; k += n
    bounds.append((ws[0]["s"], ws[-1]["e"]))
    out.append((L, ws))
# slice points: middle of each inter-line gap
cuts = [0.0] + [(bounds[i][1] + bounds[i + 1][0]) / 2 for i in range(len(bounds) - 1)] + [len(pcm) / SR]
merged = []
for i, (L, ws) in enumerate(out):
    a, b = cuts[i], cuts[i + 1]
    sf.write(f"audio/vo/line{i+1}.wav", pcm[int(a * SR):int(b * SR)], SR)
    merged.append(dict(id=L["id"], text=L["el"], offset=round(a, 3),
                       words=[dict(w=w["w"], s=round(w["s"] - a, 3), e=round(w["e"] - a, 3)) for w in ws]))
    print(f'{L["id"]:12s} {ws[0]["s"]:6.2f} → {ws[-1]["e"]:6.2f}')
json.dump(merged, open("audio/vo/words.json", "w"), indent=1)
print("total", round(len(pcm) / SR, 2))
