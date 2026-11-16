# RIFT spotlight — v8

25s, 1920×1080, 30fps motion piece. Every frame is driven by `window.render(t)` in
`index.html`, so the animation is deterministic and timed to the 120 BPM music bed
(drop at 8.5s).

## Render

```bash
node render.js frames 30          # 750 PNG frames (Playwright + Chromium)
ffmpeg -framerate 30 -i frames/f_%04d.png -i <music.mp4> -map 0:v -map 1:a \
  -af loudnorm=I=-14:TP=-1 -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p \
  -c:a aac -b:a 256k -shortest -movflags +faststart RIFT_spotlight_v8.mp4
```

Preview specific moments: `node render.js prev 30 0 25 0.5` (one PNG every 0.5s).

## Beat sheet

| Time | Scene |
|------|-------|
| 0–2s | Hook: typed "Bridge here." → deleted → "Swap there." |
| 2–5.5s | "Different apps." — venue card, prices shuffle on the beat; "Different **prices.**" |
| 5.5–8.5s | "Too many tabs." held readable, then tabs + failure toasts pile up, sucked to black |
| 8.5–10.5s | Drop: "One **click.**" slam, cursor clicks Rift on phone |
| 10.5–13.5s | Swap card: cursor clicks TRADE, output counts up, "Filled · 0 bps added fees" |
| 13.5–16.5s | "Any **chain.**" — chains orbit in on each beat |
| 16.5–19.5s | "Best price" pill, venues burst out on the music return, cursor click |
| 19.5–22.5s | "All in one **click.**" — icons merge into the Rift logo, proof line |
| 22.5–25s | End card: logo, RIFT, rift.trade, **Trade now →** CTA click, stats, disclaimer |

Fan-made; not affiliated with Rift. Logos are their owners'. UI values are illustrative.
