# Tessera app film (16:9, 30s)

`tessera-app.mp4` — 1920×1080, 60fps, 30.0s, voiceover + original 120 BPM score, −14 LUFS.

Product-showcase style: big two-line headline left, the Tessera app on a phone right, a glossy
lime ribbon flowing through, background colour changing per scene. Copy, token colours, tickers,
funding flow (Banxa; card, Apple Pay, Google Pay) and disclaimers follow app.tessera.fun.

| Time | Background | Headline | Phone |
|---|---|---|---|
| 0–9s | cream | The world's best companies → Always out of reach → Private markets. **Within reach.** | SpaceX / OpenAI / Kalshi cards arrive on the names, grey out and lock, unlock; phone rises in |
| 9–12s | dark | Load up. Pay by card. | Add funds $50 → $250, Pay by card, Continue to Banxa |
| 12–16s | cream | Big names. Your amount. | Tap SpaceX → How much will you buy? → $1 → Review order |
| 16–19.5s | lime | No accreditation. Your wallet. | Order confirmed, T-SpaceX in your wallet |
| 19.5–22s | dark | More names. **Coming soon.** | Mystery "Coming soon" row, Notify me |
| 22–30s | cream | tessera. Private markets. Within reach. app.tessera.fun | Cards ride the ribbon; full disclaimer |

The 4th token is unannounced: it appears as a blurred "Coming soon" card (`coCard(c,'soon',…)`).
To name it later, add it to `CO` in `scene.html` with its colour and icon.

## Rebuild
```
python3 vo.py <kokoro_model_dir> .     # vo.wav + timeline.json
python3 audio.py vo.wav mix.wav
node render.js 60 frames.mp4
ffmpeg -i frames.mp4 -i mix.wav -map 0:v -map 1:a -c:v libx264 -crf 18 -pix_fmt yuv420p \
  -af loudnorm=I=-14:TP=-1 -c:a aac -b:a 256k tessera-app.mp4
```
Preview: open `scene.html` (loops) or `scene.html?t=14.95` for a still.
