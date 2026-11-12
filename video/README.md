# Tessera PE — 30s launch film (Remotion)

Every frame and every sound is code. 1920×1080, 60fps, 30s.

```bash
npm install
npm run sfx      # re-synthesize sound effects into public/sfx
npm run studio   # preview
npm run render   # → out/tessera-pe-launch.mp4 (h264, CRF 14, AAC 320k)
npm run still    # → out/cover.png (frame 0 cover)
```

## Timing (seconds)
| Time | Scene | Beats |
|---|---|---|
| 0–5 | Hook | Cover: "Private equity is a $7T market." + live prices → lock drops, "Locked behind $250,000 minimums." → barrier chips slam in → lock pushes to centre |
| 5–10 | Solution | Lock springs open (lime) → morphs into the Tessera mark, "Tessera opens it." → odometer $250,000 → $1 → paperwork struck through → "No KYC." |
| 10–20 | Product | Browser rises in 3D → Explorer cards count to $423.00 / $413.80 / $812.79, $800B / $14B / $950B → cursor buys T-OpenAI: types $1.00, receives 0.001230 → confirmed → pull back |
| 20–25 | Benefits | Lime sweep → "Instant on-chain access." + wallet → "Trade anytime on DEX." + 24/7 dial and swap |
| 25–30 | Close | Mark assembles → Tessera → "Private Equity for Everyone" → tessera.pe |
