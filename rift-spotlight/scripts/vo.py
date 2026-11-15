"""Generate the voiceover line by line with Kokoro (local, open-source TTS)."""
import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
M = sys.argv[1]  # models dir
OUT = sys.argv[2]
VOICE = sys.argv[3] if len(sys.argv) > 3 else "af_heart"
SPEED = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
LINES = json.load(open(__file__.replace("vo.py", "script.json")))
k = Kokoro(f"{M}/kokoro-v1.0.onnx", f"{M}/voices-v1.0.bin")
ONLY = [int(x) for x in sys.argv[5].split(",")] if len(sys.argv) > 5 else None
for i, line in enumerate(LINES, 1):
    if ONLY and i not in ONLY:
        continue
    audio, sr = k.create(line["tts"], voice=VOICE, speed=SPEED, lang="en-us")
    # trim leading/trailing silence (-50 dBFS)
    a = np.abs(audio); idx = np.where(a > 10 ** (-50 / 20))[0]
    audio = audio[max(0, idx[0] - int(0.02 * sr)): idx[-1] + int(0.06 * sr)]
    sf.write(f"{OUT}/line{i}.wav", audio, sr)
    print(i, sr, round(len(audio) / sr, 2), line["tts"])
