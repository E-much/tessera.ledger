# Tessera @ Breakpoint London — 30s explainer

`tessera-breakpoint-london.mp4` — 1920×1080, 60fps, 30.0s, VO + original score, −14 LUFS.

| Time | Beat |
|---|---|
| 0–5s | "$7 trillion market" hook, "access" struck through |
| 5–9.7s | Friction nodes (High Minimums, KYC, 50-Day Settlements, Accredited Only) connect, then spiral into chaos |
| 9.7–11.4s | Glass shatter → Tessera lockup |
| 11.4–15.5s | tSpaceX / tOpenAI / tKalshi token cards |
| 15.5–20s | $1 Minimum • No KYC • Instant, 24/7 on Solana |
| 20–22.7s | Clean access. Real exposure. No barriers. |
| 22.7–30s | Tessera at Breakpoint · Nov 15–17 · London |

## Rebuild
```
pip install kokoro-onnx soundfile scipy   # + kokoro-v1.0.onnx / voices-v1.0.bin from kokoro-onnx releases
python3 vo.py                              # -> vo.wav + timeline.json (voice: am_michael)
python3 audio.py vo.wav mix.wav            # score + SFX + ducking
node render.js 60 frames.mp4               # Playwright → ffmpeg
ffmpeg -i frames.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-14:TP=-1 -c:a aac -b:a 256k out.mp4
```
Preview in a browser: open `scene.html` (loops), or `scene.html?t=12.5` for a still.
