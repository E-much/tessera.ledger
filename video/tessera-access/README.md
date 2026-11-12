# Tessera — "Private markets, open to all" (35s)

`tessera-private-markets.mp4` — 1920×1080, 60fps, 35.0s, voiceover + original score, −14 LUFS.

White background, black type, Tessera lime as the accent. All text sits on one long horizontal
strip; a camera pans left→right and zooms in/out, so each phrase arrives from the right and slides
off to the left. Motion blur on fast camera moves.

| Time | Beat |
|---|---|
| 0–5s | The best companies stay private longer → most people are **Locked out** |
| 5.5–14s | You need to be **accredited** → **$250,000** minimum → locked up for **years** |
| 14–17s | Zoom out over the whole problem → "built for the few" → dive into the lime full stop |
| 17–19s | Lime fills the screen, the cube-T logo assembles, shrinks into the tile: **tessera.** changes that |
| 19–27s | Opens private markets to **everyone** → **No** accreditation → Start with **$1** → Buy & sell **anytime** |
| 27–35s | Zoom out → "Private markets. Now **open** to all." → logo end card |

## Rebuild
```
pip install kokoro-onnx soundfile scipy        # + kokoro-v1.0.onnx / voices-v1.0.bin (kokoro-onnx releases)
python3 vo.py <model_dir> .                    # vo.wav + timeline.json
python3 audio.py vo.wav mix.wav
node render.js 60 frames.mp4                   # Playwright → ffmpeg
ffmpeg -i frames.mp4 -i mix.wav -map 0:v -map 1:a -c:v libx264 -crf 18 -pix_fmt yuv420p \
  -af loudnorm=I=-14:TP=-1 -c:a aac -b:a 256k tessera-private-markets.mp4
```
Preview: open `scene.html` in a browser (loops) or `scene.html?t=17.4` for a still.
Logo geometry and Outfit font come from the `claude/new-session-nqndex` branch.
