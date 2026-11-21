"""Compose the walkthrough in the template layout (see STYLE.md).

usage: python3 compose.py <timeline.json> <out.mp4>

timeline.json:
{ "duration": 41.3, "fps": 30,
  "strip": {"file": "raw/build/opener_strip.mp4", "from": 0},
  "panel": [ {"file": "...", "at": 0, "dur": 4.8, "from": 22.3, "speed": 1.0, "fit": "cover"}, ... ],
  "captions": {"words": "words.json", "offset": -0.8, "fix": {"E": "E-much", "-much.": ""}, "drop": ["nigga."]},
  "audio": "raw/build/opener_voice.wav" }
"""
import json, sys, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, BG = 1920, 1080, (12, 12, 12)
PX, PW = 24, 1348                         # screen panel
SX, SY, SW, SH = 1396, 24, 500, 1028      # face strip
PH = 692; PY = (H - PH) // 2 - 40
FONT = ImageFont.truetype('/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf', 46)

T = json.load(open(sys.argv[1])); OUT = sys.argv[2]
FPS = T.get('fps', 30); N = int(round(T['duration'] * FPS))

def rmask(w, h, r):
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    return (np.asarray(m, np.float32) / 255.)[..., None]
PMASK, SMASK = rmask(PW, PH, 22), rmask(SW, SH, 28)

class Reader:
    """Sequential frame reader for one clip, scaled/cropped to w x h."""
    def __init__(self, file, w, h, start=0.0, speed=1.0, fit='cover'):
        img = file.lower().endswith(('.png', '.jpg'))
        vf = (f"setpts=PTS/{speed},fps={FPS}," if speed != 1.0 else f"fps={FPS},") + "format=rgb24,"
        if fit == 'cover': vf += f"scale={w}:{h}:force_original_aspect_ratio=increase:flags=lanczos,crop={w}:{h}"
        else: vf += f"scale={w}:{h}:flags=lanczos"
        vf += ",unsharp=5:5:0.4"
        self.w, self.h, self.last = w, h, None
        src = ['-loop', '1', '-i', file] if img else ['-ss', str(start), '-i', file]
        self.p = subprocess.Popen(['ffmpeg', '-loglevel', 'error', *src, '-vf', vf, '-an',
                                   '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    def next(self):
        b = self.p.stdout.read(self.w * self.h * 3)
        if len(b) == self.w * self.h * 3: self.last = np.frombuffer(b, np.uint8).reshape(self.h, self.w, 3)
        return self.last          # hold the last frame if the clip runs out

# ---- captions: chunks of 3-5 words, broken at punctuation
cap = T.get('captions')
chunks = []
if cap:
    words = json.load(open(cap['words'])); off = cap.get('offset', 0); fix = cap.get('fix', {}); drop = set(cap.get('drop', []))
    ws = []
    for w in words:
        if w['w'] in drop: continue
        txt = fix.get(w['w'], w['w'])
        if txt == '': continue
        ws.append({'w': txt, 's': w['s'] + off, 'e': w['e'] + off})
    cur = []
    for i, w in enumerate(ws):
        cur.append(w)
        gap = ws[i + 1]['s'] - w['e'] if i + 1 < len(ws) else 9
        if len(cur) >= 5 or (len(cur) >= 3 and w['w'][-1] in '.,?!') or gap > 0.6:
            chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    merged = []                     # no one-word captions: fold them into the previous line
    for c in chunks:
        if merged and len(c) == 1 and len(merged[-1]) < 6 and c[0]['s'] - merged[-1][-1]['e'] < 0.8: merged[-1] += c
        else: merged.append(c)
    chunks = merged

def caption_img(chunk, t):
    """word-by-word: words appear as they're spoken; text lowercase like the template."""
    shown = [w['w'] for w in chunk if w['s'] <= t + 0.05]
    if not shown: return None
    low = lambda w: w if sum(ch.isupper() for ch in w) >= 2 else w.lower()   # keep US, SpaceX, OpenAI, T-Kalshi
    full = ' '.join(low(w['w']) for w in chunk).rstrip('.,')
    txt = ' '.join(low(w) for w in shown).rstrip('.,')
    d = ImageDraw.Draw(Image.new('L', (1, 1)))
    fw = d.textlength(full, font=FONT); tw = d.textlength(txt, font=FONT)
    img = Image.new('RGBA', (int(fw) + 48, 76), (0, 0, 0, 0)); dd = ImageDraw.Draw(img)
    dd.rounded_rectangle((0, 0, int(tw) + 47, 75), 16, fill=(0, 0, 0, 235))
    dd.text((24, 10), txt, font=FONT, fill=(255, 255, 255, 255))
    return img, fw

strip = Reader(T['strip']['file'], SW, SH, T['strip'].get('from', 0), fit='stretch')
clips = sorted(T['panel'], key=lambda c: c['at']); active = None; ci = -1

enc = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                        *(['-i', T['audio']] if T.get('audio') else []), '-map', '0:v', *(['-map', '1:a'] if T.get('audio') else []),
                        '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', OUT],
                       stdin=subprocess.PIPE)
base = np.zeros((H, W, 3), np.float32); base[:] = BG
for f in range(N):
    t = f / FPS
    while ci + 1 < len(clips) and t >= clips[ci + 1]['at']:
        ci += 1; c = clips[ci]
        if active is not None: active.p.kill()
        active = Reader(c['file'], PW, PH, c.get('from', 0), c.get('speed', 1.0), c.get('fit', 'cover'))
    fr = base.copy()
    full = active is not None and clips[ci].get('full')
    if full:
        if active.w != W:
            active.p.kill(); c = clips[ci]; active = Reader(c['file'], W, H, c.get('from', 0) + (t - c['at']), c.get('speed', 1.0), 'cover')
        fr[:] = active.next().astype(np.float32); strip.next()
        img = Image.fromarray(fr.astype(np.uint8)); enc.stdin.write(img.tobytes()); continue
    if active is not None:
        p = active.next().astype(np.float32)
        fr[PY:PY + PH, PX:PX + PW] = p * PMASK + fr[PY:PY + PH, PX:PX + PW] * (1 - PMASK)
    s = strip.next().astype(np.float32)
    fr[SY:SY + SH, SX:SX + SW] = s * SMASK + fr[SY:SY + SH, SX:SX + SW] * (1 - SMASK)
    img = Image.fromarray(fr.astype(np.uint8))
    ch = next((c for c in chunks if c[0]['s'] - 0.05 <= t <= c[-1]['e'] + 0.25), None)
    if ch:
        r = caption_img(ch, t)
        if r:
            ci_img, fw = r; x = int(PX + PW / 2 - fw / 2 - 24); y = PY + PH + 46
            img.paste(ci_img, (x, y), ci_img)
    enc.stdin.write(img.tobytes())
enc.stdin.close(); enc.wait()
for r in (active, strip):
    if r is not None: r.p.kill()
print('ok', OUT, N, 'frames')
