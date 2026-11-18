"""Re-time the saved continuous take locally (pitch-preserving time stretch) instead of re-recording.
Scales every word timestamp by the same factor and re-slices per line at the original gap midpoints."""
import json, subprocess, sys
import numpy as np, soundfile as sf

K = float(sys.argv[1])  # tempo factor, e.g. 1.08
SR = 44100
words = json.load(open("audio/vo/words.json"))
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "audio/vo/full.mp3", "-af", f"atempo={K}", "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"],
                     capture_output=True, check=True).stdout
pcm = np.frombuffer(raw, dtype="<f4").copy()
starts = [L["offset"] / K for L in words] + [len(pcm) / SR]
out = []
for i, L in enumerate(words):
    a, b = starts[i], starts[i + 1]
    sf.write(f"audio/vo/line{i+1}.wav", pcm[int(a * SR):int(b * SR)], SR)
    out.append(dict(id=L["id"], text=L["text"], offset=round(a, 3),
                    words=[dict(w=w["w"], s=round((w["s"] + L["offset"]) / K - a, 3), e=round((w["e"] + L["offset"]) / K - a, 3)) for w in L["words"]]))
json.dump(out, open("audio/vo/words.json", "w"), indent=1)
print("total", round(len(pcm) / SR, 2))
