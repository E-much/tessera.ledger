"""Voiceover via ElevenLabs (human male voice) with character-level timestamps → word timings.
Key is injected by the environment's network proxy (never stored here)."""
import base64, json, re, subprocess, sys, urllib.request
import numpy as np, soundfile as sf

VOICE = sys.argv[1]
MODEL = sys.argv[2] if len(sys.argv) > 2 else "eleven_multilingual_v2"
ONLY = [int(x) for x in sys.argv[3].split(",")] if len(sys.argv) > 3 else None
LINES = json.load(open("scripts/script.json"))
SR = 44100
words_out = []
prev = []
for i, L in enumerate(LINES, 1):
    body = {
        "text": L["el"],
        "model_id": MODEL,
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.8, "style": 0.15, "use_speaker_boost": True, "speed": 1.08},
        "previous_text": " ".join(x["el"] for x in LINES[: i - 1])[-500:] or None,
        "next_text": LINES[i]["el"] if i < len(LINES) else None,
    }
    if ONLY and i not in ONLY:
        continue
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "xi-api-key": "proxy-injected"},
    )
    d = json.load(urllib.request.urlopen(req, timeout=120))
    mp3 = base64.b64decode(d["audio_base64"])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "pipe:0", "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"], input=mp3, capture_output=True, check=True).stdout
    pcm = np.frombuffer(raw, dtype="<f4").copy()
    al = d["alignment"]
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    # trim leading silence (keep 20 ms) and shift timings
    a = np.abs(pcm); idx = np.where(a > 10 ** (-50 / 20))[0]
    lead = max(0, idx[0] - int(0.02 * SR)); tail = idx[-1] + int(0.08 * SR)
    pcm = pcm[lead:tail]; off = lead / SR
    sf.write(f"audio/vo/line{i}.wav", pcm, SR)
    # words from characters
    words, cur, cs = [], "", None
    for c, s0, e0 in zip(chars, st, en):
        if c.isspace():
            if cur: words.append(dict(w=cur, s=round(cs - off, 3), e=round(pe - off, 3))); cur = ""
            continue
        if not cur: cs = s0
        cur += c; pe = e0
    if cur: words.append(dict(w=cur, s=round(cs - off, 3), e=round(pe - off, 3)))
    print(i, round(len(pcm) / SR, 2), " ".join(f"{w['w']}@{w['s']:.2f}" for w in words))
    json.dump(dict(id=L["id"], text=L["el"], words=words), open(f"audio/vo/line{i}.json", "w"))
# merge into words.json (same schema as the Whisper aligner)
out = [json.load(open(f"audio/vo/line{i}.json")) for i in range(1, len(LINES) + 1)]
json.dump(out, open("audio/vo/words.json", "w"), indent=1)
