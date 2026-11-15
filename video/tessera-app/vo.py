"""Voiceover for the Tessera app film (Kokoro TTS, voice am_michael).
usage: python3 vo.py <model_dir> <out_dir>  -> vo.wav + timeline.json"""
import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
md, od = sys.argv[1], sys.argv[2]
k = Kokoro(f"{md}/kokoro-v1.0.onnx", f"{md}/voices-v1.0.bin")
# (text, speed, pause after)
LINES = [
 ("The world's best companies. SpaceX. OpenAI. Kalshi.", 0.98, 0.3),
 ("Always out of reach. Until now.", 0.95, 0.5),
 ("Meet Tessera.", 0.92, 0.5),
 ("Load up in seconds, with your card or Apple Pay.", 1.0, 0.45),
 ("Pick a company. Choose your amount, from just one dollar.", 1.0, 0.45),
 ("No accreditation. Your tokens stay in your own wallet.", 0.98, 0.5),
 ("And more names are coming soon.", 0.95, 0.55),
 ("Tessera. Private markets, within reach.", 0.92, 0.0),
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
