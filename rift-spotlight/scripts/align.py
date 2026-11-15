"""Word timestamps for each VO line via faster-whisper; also a transcription check."""
import json, sys, re, numpy as np, soundfile as sf
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
lines = json.load(open("scripts/script.json"))
out = []
for i, line in enumerate(lines, 1):
    a, sr = sf.read(f"audio/vo/line{i}.wav", dtype="float32")
    a = np.interp(np.arange(0, len(a), sr / 16000), np.arange(len(a)), a).astype(np.float32)
    segs, _ = m.transcribe(a, word_timestamps=True, beam_size=5, initial_prompt="Rift, Arbitrum, Polygon, Base.")
    words = [dict(w=w.word.strip(), s=round(w.start, 3), e=round(w.end, 3)) for s in segs for w in s.words]
    heard = " ".join(w["w"] for w in words)
    norm = lambda t: re.sub(r"[^a-z ]", "", t.lower().replace("-", " "))
    print(i, "OK " if norm(heard).split() == norm(line["tts"]).split() else "DIFF", heard)
    out.append(dict(id=line["id"], text=line["tts"], words=words))
json.dump(out, open("audio/vo/words.json", "w"), indent=1)
