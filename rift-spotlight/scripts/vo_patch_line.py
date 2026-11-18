"""Re-record ONE line of the continuous take (e.g. a fact change) with the neighbouring lines as context,
time-stretch it like the rest, and splice it back keeping the original pauses. Later lines shift by the length change."""
import base64, json, subprocess, sys, urllib.request
import numpy as np, soundfile as sf

VOICE, IDX, TEXT = sys.argv[1], int(sys.argv[2]), sys.argv[3]  # IDX = 1-based line number
SPEED, K, SR = 1.04, 1.08, 44100
script = json.load(open("scripts/script.json"))
words = json.load(open("audio/vo/words.json"))
body = {"text": TEXT, "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.3, "use_speaker_boost": True, "speed": SPEED},
        "previous_text": " ".join(l["el"] for l in script[:IDX - 1])[-600:], "next_text": " ".join(l["el"] for l in script[IDX:])[:300]}
req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
                             data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "xi-api-key": "proxy-injected"})
d = json.load(urllib.request.urlopen(req, timeout=300))
open(f"audio/vo/patch_line{IDX}.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"audio/vo/patch_line{IDX}.mp3", "-af", f"atempo={K}", "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"],
                     capture_output=True, check=True).stdout
pcm = np.frombuffer(raw, dtype="<f4").copy()
al = d["alignment"]
ws, cur, cs = [], "", None
for c, s0, e0 in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
    if c.isspace():
        if cur: ws.append(dict(w=cur, s=cs / K, e=pe / K)); cur = ""
        continue
    if not cur: cs = s0
    cur += c; pe = e0
if cur: ws.append(dict(w=cur, s=cs / K, e=pe / K))
# trim the new take to its speech, then pad with the ORIGINAL line's lead/tail pauses
on, off = ws[0]["s"], ws[-1]["e"]
speech = pcm[max(0, int((on - 0.03) * SR)):int((off + 0.08) * SR)]
old = words[IDX - 1]
oldwav, _ = sf.read(f"audio/vo/line{IDX}.wav")
lead = old["words"][0]["s"]
tail = len(oldwav) / SR - old["words"][-1]["e"]
new = np.concatenate([np.zeros(int(max(0, lead - 0.03) * SR)), speech, np.zeros(int(max(0, tail - 0.08) * SR))])
sf.write(f"audio/vo/line{IDX}.wav", new, SR)
shift = lead - 0.03 - (on - 0.03)
words[IDX - 1] = dict(id=old["id"], text=TEXT, offset=old["offset"],
                      words=[dict(w=w["w"], s=round(w["s"] + shift, 3), e=round(w["e"] + shift, 3)) for w in ws])
delta = len(new) / SR - len(oldwav) / SR
for L in words[IDX:]:
    L["offset"] = round(L["offset"] + delta, 3)
json.dump(words, open("audio/vo/words.json", "w"), indent=1)
script[IDX - 1]["el"] = script[IDX - 1]["tts"] = TEXT
json.dump(script, open("scripts/script.json", "w"), indent=1)
print("line", IDX, "re-recorded; length change %+.2fs" % delta, "|", " ".join(w["w"] for w in ws))
