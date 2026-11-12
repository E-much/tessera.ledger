"""Voiceover for the Tessera access film (Kokoro TTS, voice am_michael).
usage: python3 vo.py <model_dir> <out_dir>  -> vo.wav + timeline.json"""
import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
md, od = sys.argv[1], sys.argv[2]
k = Kokoro(f"{md}/kokoro-v1.0.onnx", f"{md}/voices-v1.0.bin")
# (text, speed, pause after)
LINES = [
 ("The best companies are staying private for longer.", 0.98, 0.3),
 ("And most people are locked out.", 0.95, 0.6),
 ("To invest, you need to be accredited.", 0.98, 0.35),
 ("You need two hundred and fifty thousand dollars, minimum.", 1.0, 0.35),
 ("And your money is locked up for years.", 0.98, 0.5),
 ("Private markets were built for the few.", 0.94, 0.75),
 ("Tessera changes that.", 0.92, 0.55),
 ("Tessera opens private markets to everyone.", 0.97, 0.45),
 ("No accreditation.", 0.97, 0.3),
 ("Start with just one dollar.", 0.97, 0.3),
 ("Buy and sell, anytime.", 0.97, 0.6),
 ("Private markets. Now open to all.", 0.92, 0.45),
 ("Tessera.", 0.9, 0.0),
]
sr = 24000; t = 0.35; out = []; parts = []
for i, (txt, sp, gap) in enumerate(LINES):
    a, sr = k.create(txt, voice="am_michael", speed=sp, lang="en-us")
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0]-120):idx[-1]+900]
    d = len(a)/sr; out.append({"i": i, "start": round(t, 3), "end": round(t+d, 3), "text": txt})
    parts.append((t, a)); t += d + gap
total = t + 1.6
buf = np.zeros(int(total*sr))
for s, a in parts: buf[int(s*sr):int(s*sr)+len(a)] += a
sf.write(f"{od}/vo.wav", buf, sr)
json.dump({"duration": round(total, 2), "lines": out}, open(f"{od}/timeline.json", "w"), indent=1)
print("total", round(total, 2))
for o in out: print(o["start"], o["end"], o["text"])
