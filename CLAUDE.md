# Tessera video editing — the owner's preferences

The owner (X: @emuch4pf) is a Tessera ambassador who makes interview edits about Tessera
(@Tessera_PE). Read this before any video or caption work. These preferences were set over
many rounds of feedback; follow them without being asked again.

## What a video is

- Built from **real interview footage** (podcasts, team clips). **No AI voiceover and no AI-written script.**
  The only text Claude writes is short chapter titles and on-screen keyword hits.
- Use the **real Tessera logo** in `video/assets/` (lime `#D2FB95`, near-black `#121317`). Never invent a logo.
- Length: **at least 5 minutes** for the main cut.
- Pick one theme per video and order the soundbites so every join reads as a complete thought
  (no clipped last words, no "that/even there" pointing at something that was cut).
- The owner trusts Claude to choose the order of clips; no need to send a cut list for approval first.

## Look and edit style (reference: LayerZero teaser, see `video/sources/README.md`)

- **Intro / cold open (~20 s): no stock footage at all.** Black card with typed mono text, then quick glitch
  cuts of the speaker's strongest short lines with big centred captions, then the logo snapping together on lime.
- **Main video:** speaker cropped full-frame, jump cuts with punch-in zoom, ums and uhs removed,
  word-by-word captions (white, current word lime), lower third on first appearance, occasional host cutaways.
- **Keyword hits:** mix two styles. **Only some (about 8 of 20) pop up from behind the speaker**
  (person mask); the rest slam in front over a darkened frame. Never put every keyword behind.
- **Stock / B-roll: very few (about 5)**, only where the picture clearly matches the words
  (e.g. rocket launch on "growth curve", Times Square on "buy and sell stocks"). None in the intro.
- **White chapter cards: only the sentence.** No logo, no corner text, no page numbers, no cursor.
- Palette: black, white and Tessera lime only. No green grid backgrounds, no grain-heavy looks,
  **no light leaks/glow overlays**.
- End: "Closing the access gap."-style line, logo on lime with @Tessera_PE, then credits:
  featuring, interview source, B-roll licences, **"EDIT: @emuch4pf"**, and a not-financial-advice line.

## Planned: owner's own FAQ answers ("search and found" format)

- The owner records himself answering each FAQ question, **one short clip per question** (Q1, Q2, ...),
  uploaded straight into the chat (Google Drive is unreliable on his network). Looks into the camera.
- **No other voice asks the questions** (not his brother, no AI voice). Each question is typed into the search bar,
  "searching…", then a "found" result card of his video expands to full screen and he answers; zoom back out to the
  search bar for the next question.
- Same treatment as the interview cuts: captions, keyword hits (some behind him), a few FAQ visuals, his song, white cards.
- The FAQ text is saved in `video/sources/faq/faq.md`; the animated FAQ video engine is in `video/faq/`.

## Sound

- Music: **energetic and cinematic**, no vocals. Currently the owner's chosen track
  (`video/assets/music/`), looped on whole beats.
- **Loud in the intro, on white cards and on the logo; about 20 dB under the voice while someone talks.**
- **Whooshes very quiet.** Punchy impacts on keyword hits are fine. No piano/extra melodic stingers over the song.
- Claude cannot listen to audio: check levels by measurement and ask the owner to confirm by ear.

## Captions and posts for X / groups

- **Must not sound AI.** The owner prefers **the speaker's exact words** as quotes (only ums/uhs/stutters removed,
  never paraphrased), with a short hype line around them when asked (e.g. "chan ahn is HIM 🔥").
- Keep it short. No talk about token prices or returns.
- Credit the podcast source in a reply.

## Pipeline (in `video/v2/`)

`edl.py` (cut list → `build/v2/edl.json`) → `extract.py` (camera crops) → `extract_broll.py` →
`masks.py` + `headpos.py` (behind-speaker hits) → `render2.js video …` (4 parallel chunks) →
`mix2.py` (soundtrack) → ffmpeg concat + mux. Sources and their links: `video/sources/README.md`.
Interview transcripts: ElevenLabs Scribe (`api.elevenlabs.io` is connected). X videos download via
`api.fxtwitter.com` → `video.twimg.com`. YouTube is not reachable from the cloud environment;
ask the owner to upload the file instead.
