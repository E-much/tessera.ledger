"""Face-strip look: match the template's warm, moody grade.
person: gentle warm grade + contrast; background: darker, warmer, blurred (or replaced).
Usage as a module: grade_frame(rgb_uint8, mode) -> rgb_uint8  (mode: 'grade' | 'room' | 'replace')"""
import numpy as np, cv2, mediapipe as mp, os
from mediapipe.tasks.python import vision, BaseOptions
MODEL = os.environ.get('SEG_MODEL', 'seg.tflite')
_seg = None
def seg():
    global _seg
    if _seg is None:
        _seg = vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
            base_options=BaseOptions(model_asset_path=MODEL), output_confidence_masks=True))
    return _seg
def person_mask(rgb):
    r = seg().segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb)))
    bgc = r.confidence_masks[0].numpy_view()           # class 0 = background
    m = 1.0 - bgc
    m = cv2.GaussianBlur(m, (0, 0), 3)                 # soft edge
    m = np.clip((m - .15) / .7, 0, 1)
    h = m.shape[0]; ramp = np.clip((np.arange(h) / h - .62) / .12, 0, 1)[:, None]   # the lap fills the bottom of the strip
    return np.maximum(m, ramp)[..., None]
def curve(x, lift=0.0, gain=1.0, contrast=0.0):
    x = np.clip(x * gain + lift, 0, 1)
    return np.clip(x + contrast * (x - .5) * (1 - np.abs(2 * x - 1)) * 2, 0, 1)
def warm(x, r=1.0, g=1.0, b=1.0): return np.clip(x * np.array([r, g, b]), 0, 1)
def rolloff(x, knee=.68, top=.88):  # soften bright highlights (white shirt) like a film shoulder
    over = np.clip(x - knee, 0, None); return np.where(x > knee, knee + (top - knee) * (1 - np.exp(-over / (top - knee))), x)
def bokeh_room(h, w, seed=4):
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w] / max(h, w)
    base = np.dstack([0.16 + 0.10 * (1 - yy), 0.09 + 0.05 * (1 - yy), 0.08 + 0.04 * (1 - yy)])   # warm dark wall
    lamp = np.exp(-(((xx - .2) ** 2) + ((yy - .35) ** 2)) / .02)[..., None] * np.array([.55, .30, .14])
    curt = ((0.5 + 0.5 * np.sin(xx * 90)) ** 3 * np.exp(-((xx - .85) ** 2) / .01))[..., None] * np.array([.22, .09, .12])
    img = base + lamp + curt
    for _ in range(18):
        cx, cy, r = rng.random() * w, rng.random() * h * .7, rng.uniform(.02, .06) * w
        cv2.circle(img, (int(cx), int(cy)), int(r), tuple(float(v) for v in np.array([.9, .55, .3]) * rng.uniform(.15, .4)), -1)
    return cv2.GaussianBlur(np.clip(img, 0, 1), (0, 0), w * .02)
from functools import lru_cache
@lru_cache(maxsize=4)
def vignette(h, w, k=.55):
    yy, xx = np.mgrid[0:h, 0:w]; d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h * .42) / (h * .6)) ** 2)
    return (1 - k * np.clip(d - .35, 0, 1) ** 1.5)[..., None]
def grade_frame(rgb, mode='room', mask=None):
    x = rgb.astype(np.float32) / 255.
    h, w = x.shape[:2]
    m = person_mask(rgb) if mask is None else mask
    person = warm(rolloff(curve(x, lift=-.04, gain=.92, contrast=.16)), 1.08, .99, .86)
    if mode == 'grade':
        out = warm(curve(x, lift=-.06, gain=.82, contrast=.22), 1.07, .98, .86)
    elif mode == 'room':
        small = cv2.resize(x, (w // 4, h // 4), interpolation=cv2.INTER_AREA)   # blur at quarter size: same look, ~16x cheaper
        bg = cv2.resize(cv2.GaussianBlur(small, (0, 0), w * .003), (w, h), interpolation=cv2.INTER_LINEAR)
        bg = warm(rolloff(curve(bg, lift=-.10, gain=.50, contrast=.2), .5, .7), 1.22, .93, .82)
        out = person * m + bg * (1 - m)
    else:
        out = person * m + bokeh_room(h, w) * (1 - m)
    out = out * vignette(h, w)
    return (np.clip(out, 0, 1) * 255).astype(np.uint8)
