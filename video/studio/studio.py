"""Virtual studio test: owner cut out of a plain-wall clip and placed into a white studio with lime cubes.
usage: python3 studio.py <dir with fr/ and mask/>  -> <dir>/out/%04d.png"""
import os, sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
D = sys.argv[1]; W, H = 1920, 1080
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
if not os.path.exists(FONT): FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"

# ---------- static studio background ----------
def studio():
    y = np.linspace(0, 1, H)[:, None]
    wall = np.array([236, 237, 233]) * (1 - y * .25)[..., None] + np.array([250, 250, 247]) * (y * .25)[..., None]
    img = np.repeat(wall, W, axis=1)
    fl = np.clip((np.arange(H) - 700) / 220.0, 0, 1)[:, None, None]
    img = img * (1 - fl * .035)
    # soft cyclorama curve: blend the wall/floor seam
    seam = np.exp(-((np.arange(H) - 780) / 140.0) ** 2)[:, None, None]
    img = img * (1 - seam * .025)
    # vignette
    yy, xx = np.mgrid[0:H, 0:W]; r = np.sqrt(((xx - W / 2) / W) ** 2 + ((yy - H * .45) / H) ** 2)
    img *= (1 - np.clip(r - .35, 0, 1) * .35)[..., None]
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8))

def headline(base):
    d = ImageDraw.Draw(base); col = (189, 235, 122)
    f1 = ImageFont.truetype(FONT, 78); f2 = ImageFont.truetype(FONT, 190)
    for txt, f, y in [("EVERYTHING YOU", f1, 40), ("NEED TO KNOW", f2, 112)]:
        w = d.textlength(txt, font=f); d.text(((W - w) / 2, y), txt, font=f, fill=col)
    return base

def cube(base, cx, cy, s):
    """translucent glowing lime cube in slight perspective"""
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0)); g = ImageDraw.Draw(glow)
    g.ellipse([cx - s * .9, cy + s * .38, cx + s * 1.1, cy + s * .7], fill=(190, 240, 110, 110))   # light on the floor
    glow = glow.filter(ImageFilter.GaussianBlur(40)); base.alpha_composite(glow)
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    k = s * .28  # depth offset
    front = [(cx - s / 2, cy - s / 2), (cx + s / 2, cy - s / 2), (cx + s / 2, cy + s / 2), (cx - s / 2, cy + s / 2)]
    top = [(cx - s / 2, cy - s / 2), (cx - s / 2 + k, cy - s / 2 - k * .55), (cx + s / 2 + k, cy - s / 2 - k * .55), (cx + s / 2, cy - s / 2)]
    side = [(cx + s / 2, cy - s / 2), (cx + s / 2 + k, cy - s / 2 - k * .55), (cx + s / 2 + k, cy + s / 2 - k * .55), (cx + s / 2, cy + s / 2)]
    d.polygon(side, fill=(168, 220, 96, 235)); d.polygon(top, fill=(222, 255, 170, 240)); d.polygon(front, fill=(196, 245, 120, 240))
    # inner glow on the front face
    ig = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(ig).ellipse([cx - s * .35, cy - s * .35, cx + s * .35, cy + s * .35], fill=(240, 255, 210, 170))
    ig = ig.filter(ImageFilter.GaussianBlur(s * .18)); c.alpha_composite(ig)
    edge = ImageDraw.Draw(c); edge.line(front + [front[0]], fill=(150, 205, 80, 255), width=3); edge.line(top[1:3], fill=(150, 205, 80, 200), width=2)
    base.alpha_composite(c)
    halo = c.filter(ImageFilter.GaussianBlur(30)); halo.putalpha(halo.getchannel("A").point(lambda v: int(v * .35)))
    base.alpha_composite(halo)

BG = studio().convert("RGBA"); headline(BG)
cube(BG, 520, 880, 230); cube(BG, 1400, 880, 230)
# floor contact shadow for the chair
sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse([700, 975, 1220, 1050], fill=(0, 0, 0, 90))
BG.alpha_composite(sh.filter(ImageFilter.GaussianBlur(22)))

# ---------- per frame ----------
files = sorted(os.listdir(f"{D}/fr"))[:int(os.environ.get("LIMIT","100000"))]; os.makedirs(f"{D}/out", exist_ok=True)
def centroid(m):
    ys, xs = np.where(m > 128); return xs.mean(), ys.mean()
ref = None; sm = None
S = 0.74; X0, Y0 = 683 - 120, 0          # source crop box around the sitter
BROWN = np.array([92, 58, 40], np.float32)
for f in files:
    im = np.asarray(Image.open(f"{D}/fr/{f}").convert("RGB")).astype(np.float32)
    pm = Image.open(f"{D}/mask/p_{f}"); cm0 = Image.open(f"{D}/mask/c_{f}")
    # keep only the chair: drop specks (open = erode then dilate) and anything outside the chair area
    cm = np.asarray(cm0.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(9))).copy()
    cm[:520, :] = 0; cm[:, :640] = 0; cm[:, 1270:] = 0
    cm = np.minimum(cm, np.asarray(cm0))
    # stabilise on the chair (rigid, doesn't move): camera shake = chair centroid drift
    c = np.array(centroid(cm)); ref = c if ref is None else ref
    sm = c if sm is None else sm * .7 + c * .3; dx, dy = (sm - ref)
    # recolour the orange chair to dark leather brown (keep its shading)
    chair = np.asarray(Image.fromarray(cm).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)[..., None] / 255
    lum = im.mean(axis=2, keepdims=True) / 150.0
    im = im * (1 - chair) + np.clip(BROWN * lum * 1.15, 0, 255) * chair
    # clean mask edge: shrink 3px and feather to drop the wall fringe
    m = pm.point(lambda v: int(max(0, min(255, (v - 110) * 255 / 100)))).filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(2.2))
    cmk = Image.fromarray(cm).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
    m = Image.fromarray(np.maximum(np.asarray(m), np.asarray(cmk)))
    person = Image.fromarray(im.astype(np.uint8)).convert("RGBA"); person.putalpha(m)
    cw, ch = 780, 1080
    crop = person.crop((int(X0 + dx), int(Y0 + dy), int(X0 + dx) + cw, int(Y0 + dy) + ch))
    crop = crop.resize((int(cw * S), int(ch * S)), Image.LANCZOS)
    frame = BG.copy(); frame.alpha_composite(crop, (int(W / 2 - cw * S / 2 + 6), int(1035 - ch * S)))
    frame.convert("RGB").save(f"{D}/out/{f}")
print("frames", len(files))
