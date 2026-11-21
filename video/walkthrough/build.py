"""Assemble the Tessera walkthrough: talk track (cuts) + panel cues + captions -> final.timeline.json.

The edit is written in SOURCE time (seconds in the original recordings, matching the word-timed
transcripts), so it's easy to read against what was said. Inside each kept piece, silences longer
than 0.55s and filler words are cut out automatically.

usage: python3 build.py            -> raw/build/talk_strip.mp4, talk_voice.wav, final.timeline.json, final_words.json
"""
import json, subprocess, os

SRC = {  # strip video (already graded/cropped), cleaned voice, word timings, and where each file starts in source time
    'op':   {'strip': 'raw/build/opener_strip.mp4', 'strip0': 0.8, 'voice': 'raw/build/opener_voice.wav', 'voice0': 0.8, 'words': 'opener_words.json'},
    'main': {'strip': 'raw/build/main_strip.mp4',   'strip0': 0.0, 'voice': 'raw/build/main_voice_raw.wav', 'voice0': 0.0, 'words': 'main_words.json'},
}

# ---- what's kept, in order: (source, start, end, note) -------------------------------------------
PIECES = [
    ('op',   1.0,   35.30, "GM GM guys, this is E-much … let's explore the whole thing together"),
    ('main', 31.0,  37.0,  "I'm signing in with my Gmail, you guys should see my portfolio"),
    ('main', 38.3,  52.1,  "verification code … no one can get into your account"),
    ('main', 60.9,  62.3,  "So let's go."),
    ('op',   36.7,  41.26, "So this is my portfolio. Don't mind me, I'm a broke… (cut before the swear word)"),
    ('main', 72.3,  77.45, "wow, look at the UI, I'm so in love with this"),
    ('main', 83.3,  88.3,  "this is my current portfolio, and this is what we're trading with"),
    ('main', 90.2,  98.3,  "before I trade anything … let's go for Kalshi"),
    ('main', 99.3,  112.4, "read about Kalshi … loan participation rights"),
    ('main', 114.7, 125.95, "no access to the company, no voting or governance rights, just the token"),
    ('main', 144.4, 146.3, "just come here with $1, $2"),
    ('main', 156.3, 160.0, "SpaceX, it's the same thing there as well"),
    ('main', 175.7, 181.45, "let's trade Kalshi … let me just buy $10"),
    ('main', 205.4, 210.35, "I'm just buying $10 of these. So then boom"),
    ('main', 211.6, 219.6, "settles on-chain, it's fast, they're using Solana"),
    ('main', 226.4, 234.75, "more exposure to Kalshi, but no voting rights. Don't forget that"),
    #           235.0-247.0  removed: "buy more to make more money … Christmas is coming"
    ('main', 248.0, 250.55, "let me just buy $7 worth of this one as well"),
    ('main', 258.1, 261.1, "let me confirm my transaction and boom"),
    ('main', 263.4, 266.3, "I'm now a Kalshi, I'm now a SpaceX"),
    ('main', 268.6, 280.1, "the UI is very clean … really welcoming"),
    ('main', 281.3, 289.4, "my activities so far, my buys and sells, these are real"),
    ('main', 290.1, 297.9, "the companies: SpaceX, OpenAI, Kalshi, and one is coming"),
    ('main', 315.4, 324.15, "export account: my recovery key is here, I can reveal it if I want"),
    ('main', 333.1, 338.5, "if you lose it you can still get back in with Apple, Google or email"),
    ('main', 339.6, 341.45, "it's really nice, I really love the app"),
    ('main', 346.4, 351.7, "it's not open to US people"),
    #           357.6-358.6  removed: quests (not live yet)
    ('main', 369.0, 371.45, "Oh sorry, I didn't get to OpenAI"),
    ('main', 375.35, 380.3, "let me just get maybe seven dollars worth of this"),
    #           381.3-393.8  removed: "I already made some money … gonna make more"
    ('main', 394.3, 411.1, "the T-tokens … three of them: T-Kalshi, T-OpenAI and T-SpaceX"),
    ('main', 413.4, 415.0, "See you."),
]
END_CARD = 5.0   # seconds of closing card after the last word

# ---- panel: (source, source time, clip, clip time at that moment) ---------------------------------
# The clip starts playing at that moment; 'speed' slows it down; images hold.
S = 'raw/seg/'
PANEL = [
    ('op',   1.0,   S + 'closing.mp4', 0.3),
    ('op',   5.6,   S + '01-signin.mp4', 0.0, 0.68),
    ('op',   15.4,  S + '11-recovery.mp4', 0.0),
    ('op',   21.4,  S + '05-buy-kalshi.mp4', 21.9),
    ('op',   29.7,  S + '05-buy-kalshi.mp4', 30.35),           # '$1' on screen as he says 'just a dollar'
    ('op',   31.8,  S + '08-companies.mp4', 0.0),
    ('main', 31.0,  S + '01-signin.mp4', 2.0),
    ('main', 38.3,  S + '01b-verify.mp4', 0.0),
    ('main', 60.9,  S + '02-dashboard.mp4', 0.0),
    ('main', 90.2,  S + '02-dashboard.mp4', 18.0),
    ('main', 97.5,  S + '03-kalshi.mp4', 0.0),
    ('main', 156.3, S + '04-spacex.mp4', 0.0),
    ('main', 175.7, S + '05-buy-kalshi.mp4', 26.0),
    ('main', 180.5, S + '05-buy-kalshi.mp4', 31.9),           # '$10' typed as he says it
    ('main', 205.4, S + '05-buy-kalshi.mp4', 42.0),
    ('main', 208.1, S + '05-buy-kalshi.mp4', 52.05),          # success screen on 'boom'
    ('main', 248.0, S + '06-buy-spacex.mp4', 12.8),          # starts after the Windows popup, '$7' already typed
    ('main', 258.1, S + '06-buy-spacex.mp4', 21.0),
    ('main', 260.8, S + '06-buy-spacex.mp4', 26.8),           # success on 'boom'
    ('main', 268.6, S + '02-dashboard.mp4', 6.0),
    ('main', 281.3, S + '07-activity.mp4', 0.0),
    ('main', 290.1, S + '08-companies.mp4', 3.0),
    ('main', 295.3, S + '09-auction.mp4', 0.0),
    ('main', 315.4, S + '11-recovery.mp4', 0.0),
    ('main', 339.6, S + '03-kalshi.mp4', 30.0),
    ('main', 346.4, S + 'card-availability.png', 0.0),
    ('main', 369.0, S + '10-buy-openai.mp4', 2.0),
    ('main', 375.35, S + '10-buy-openai.mp4', 7.5),           # '$7' typed on 'seven dollars'
    ('main', 394.3, S + '10-buy-openai.mp4', 36.0),
    ('main', 405.3, S + '08-companies.mp4', 0.0),
]
CLOSING = {'file': 'raw/seg/closing.mp4', 'from': 0.0, 'full': True}   # Tessera end card (tessera.pe)

# ---- caption corrections (whisper mishearings) ----------------------------------------------------
FIX = {'Kaoshi': 'Kalshi', 'Kaoshi.': 'Kalshi.', 'Kaoshi,': 'Kalshi,', 'Cauchy': 'Kalshi', 'Cauchy,': 'Kalshi,',
       'Tesla': 'Tessera', 'bots,': 'boom,', 'Shane,': 'chain,', 'introduction': 'transaction', 'organized': 'tokenized',
       'us': 'US', 'yes,': 'US', 'beat': 'did', 'broadcast': 'broke…', 'E': 'E-much.', '-much.': ''}
MERGE = [(('space', 'X'), 'SpaceX'), (('space', 'X,'), 'SpaceX,'), (('space', 'X.'), 'SpaceX.'), (('open', 'AI'), 'OpenAI'),
         (('open', 'AI.'), 'OpenAI.'), (('T', 'Kalshi'), 'T-Kalshi'), (('T', 'Kalshi,'), 'T-Kalshi,'), (('T', 'OpenAI'), 'T-OpenAI'),
         (('T', 'SpaceX.'), 'T-SpaceX.'), (('T', 'tokens'), 'T-tokens')]
CONTEXT_FIX = {('main', 264.0): 'now', ('main', 265.2): 'now'}   # "I'm not a Kalshi" -> "I'm now a Kalshi"
FILLERS = {'um,', 'um', 'uh,', 'uh', 'Um,', 'Uh,'}
GAP, PAD_IN, PAD_OUT = 0.55, 0.10, 0.14

def load_words(k):
    out = []
    for w in json.load(open(SRC[k]['words'])):
        t = w['w']
        for (sk, st), rep in CONTEXT_FIX.items():
            if sk == k and abs(w['s'] - st) < 0.15: t = rep
        out.append({'w': FIX.get(t, t), 's': w['s'], 'e': w['e']})
    i, res = 0, []
    while i < len(out):          # merge split names ("space" "X" -> "SpaceX")
        for (a, b), rep in MERGE:
            if i + 1 < len(out) and out[i]['w'].lower() == a.lower() and out[i + 1]['w'] == b:
                res.append({'w': rep, 's': out[i]['s'], 'e': out[i + 1]['e']}); i += 2; break
        else:
            res.append(out[i]); i += 1
    return [w for w in res if w['w']]
WORDS = {k: load_words(k) for k in SRC}

# ---- split pieces at long gaps and fillers -> ranges -----------------------------------------------
ranges = []   # (src, s, e)
for k, s, e, _ in PIECES:
    ws = [w for w in WORDS[k] if w['s'] >= s - 0.05 and w['e'] <= e + 0.2 and w['w'] not in FILLERS]
    allw = [w for w in WORDS[k] if w['s'] >= s - 0.05 and w['e'] <= e + 0.2]
    fill = [w for w in allw if w['w'] in FILLERS]
    if not ws: continue
    cur = [max(s, ws[0]['s'] - PAD_IN), None]
    for a, b in zip(ws, ws[1:]):
        filler_between = any(a['e'] <= f['s'] and f['e'] <= b['s'] + 0.01 for f in fill)
        if b['s'] - a['e'] > GAP or filler_between:
            cur[1] = a['e'] + PAD_OUT; ranges.append((k, cur[0], cur[1])); cur = [b['s'] - PAD_IN, None]
    cur[1] = min(e, ws[-1]['e'] + PAD_OUT) if ws[-1]['e'] < e else e
    ranges.append((k, cur[0], cur[1]))

out_ranges, t = [], 0.0
for k, s, e in ranges:
    out_ranges.append((k, s, e, t)); t += e - s
TALK = t

def to_out(k, x):
    """map a source time to output time (snaps forward into the next kept range)"""
    for rk, s, e, o in out_ranges:
        if rk == k and x <= e:
            return o + max(0.0, x - s)
    raise ValueError(f'{k} {x} not in edit')

# ---- render talk track: strip video + voice, cut and joined --------------------------------------
os.makedirs('raw/build/parts', exist_ok=True)
vlist, alist = [], []
for i, (k, s, e, o) in enumerate(out_ranges):
    src = SRC[k]; d = e - s
    v = f'raw/build/parts/v{i:03d}.mp4'; a = f'raw/build/parts/a{i:03d}.wav'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{s - src["strip0"]:.3f}', '-i', src['strip'], '-t', f'{d:.3f}',
                    '-c:v', 'libx264', '-crf', '14', '-preset', 'fast', '-pix_fmt', 'yuv420p', '-r', '30', '-an', v], check=True)
    fade = min(0.012, d / 4)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', f'{s - src["voice0"]:.3f}', '-i', src['voice'], '-t', f'{d:.3f}',
                    '-af', f'afade=t=in:d={fade},afade=t=out:st={d - fade:.3f}:d={fade}', '-ar', '48000', '-ac', '1', a], check=True)
    vlist.append(v); alist.append(a)
open('raw/build/parts/v.txt', 'w').write(''.join(f"file '{os.path.basename(v)}'\n" for v in vlist))
open('raw/build/parts/a.txt', 'w').write(''.join(f"file '{os.path.basename(a)}'\n" for a in alist))
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'raw/build/parts/v.txt', '-c', 'copy', 'raw/build/talk_strip.mp4'], check=True)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'raw/build/parts/a.txt', '-c', 'copy', 'raw/build/talk_voice.wav'], check=True)

# ---- captions in output time ----------------------------------------------------------------------
cap = []
for k, s, e, o in out_ranges:
    for w in WORDS[k]:
        if w['w'] in FILLERS or w['w'] in ('nigga.', 'nigga'): continue
        if w['s'] >= s - 0.02 and w['e'] <= e + 0.05:
            cap.append({'w': w['w'], 's': round(o + w['s'] - s, 3), 'e': round(o + min(w['e'], e) - s, 3)})
json.dump(cap, open('final_words.json', 'w'), indent=0)

# ---- panel cues in output time --------------------------------------------------------------------
panel = []
for cue in PANEL:
    k, x, f, ct = cue[:4]; speed = cue[4] if len(cue) > 4 else 1.0
    panel.append({'file': f, 'at': round(to_out(k, x), 3), 'from': ct, 'speed': speed})
panel.append({'file': CLOSING['file'], 'at': round(TALK, 3), 'from': CLOSING['from'], 'full': True})
panel.sort(key=lambda c: c['at'])

timeline = {'duration': round(TALK + END_CARD, 3), 'fps': 30,
            'strip': {'file': 'raw/build/talk_strip.mp4', 'from': 0},
            'panel': panel,
            'captions': {'words': 'final_words.json', 'offset': 0},
            'audio': 'raw/build/talk_mix.wav'}
json.dump(timeline, open('final.timeline.json', 'w'), indent=1)
print(f'{len(out_ranges)} cuts, talk {TALK:.1f}s, total {TALK + END_CARD:.1f}s')

# ---- music bed + mix -------------------------------------------------------------------------------
subprocess.run(['python3', 'tools/music.py', 'raw/build/talk_voice.wav', 'raw/build/talk_mix.wav', f'{TALK:.3f}', f'{TALK + END_CARD:.3f}'], check=True)
