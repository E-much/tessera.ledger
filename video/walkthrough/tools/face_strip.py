"""Render the face strip (500x1028 by default) from portrait camera footage, with the template look.

usage: python3 face_strip.py <in.mov> <out.mp4> [--start S] [--end E] [--fps 30] [--w 500] [--h 1028]
       [--cx 0.47] [--cy 0.11] [--zoom 0.74] [--mode room]
Crop is described relative to the (rotated) source frame: cx = horizontal centre, cy = top edge,
zoom = crop width as a fraction of source width. The person mask is smoothed over time so the
background treatment doesn't flicker."""
import argparse, subprocess, json, numpy as np, cv2, os, sys
sys.path.insert(0, os.path.dirname(__file__))
import grade

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--start', type=float, default=0); ap.add_argument('--end', type=float, default=None)
ap.add_argument('--fps', type=int, default=30); ap.add_argument('--w', type=int, default=500); ap.add_argument('--h', type=int, default=1028)
ap.add_argument('--cx', type=float, default=.47); ap.add_argument('--cy', type=float, default=.11); ap.add_argument('--zoom', type=float, default=.74)
ap.add_argument('--mode', default='clean')
a = ap.parse_args()

info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:stream_side_data=rotation',
                                  '-of', 'json', a.src], capture_output=True, text=True).stdout)['streams'][0]
sw, sh = info['width'], info['height']
rot = next((d.get('rotation', 0) for d in info.get('side_data_list', []) if 'rotation' in d), 0)
if abs(rot) == 90: sw, sh = sh, sw                     # ffmpeg auto-rotates on decode
cw = int(sw * a.zoom) // 2 * 2; ch = int(cw * a.h / a.w) // 2 * 2
x0 = int(sw * a.cx - cw / 2); y0 = int(sh * a.cy)
x0 = max(0, min(sw - cw, x0)); y0 = max(0, min(sh - ch, y0))
CLEAN = ("hqdn3d=1.5:1.5:3:3,eq=contrast=1.06:brightness=-0.005:saturation=1.04,"
         "curves=master='0/0 0.25/0.27 0.5/0.52 0.85/0.80 1/0.90',unsharp=5:5:0.5")
if a.mode == 'clean':   # natural camera look: no temperature change, no background treatment; pure ffmpeg = fast
    vf = f"fps={a.fps},crop={cw}:{ch}:{x0}:{y0},{CLEAN},scale={a.w}:{a.h}:flags=lanczos"
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(a.start)] + (['-to', str(a.end)] if a.end else []) +
                   ['-i', a.src, '-vf', vf, '-an', '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', a.out], check=True)
    print(f'clean crop {cw}x{ch}@{x0},{y0} -> {a.w}x{a.h}'); sys.exit(0)
# work at 2x the output size for a clean mask and grade, then downscale
WW, WH = a.w * 2, a.h * 2
vf = f"fps={a.fps},crop={cw}:{ch}:{x0}:{y0},scale={WW}:{WH}:flags=lanczos"
cmd = ['ffmpeg', '-loglevel', 'error', '-ss', str(a.start)] + (['-to', str(a.end)] if a.end else []) + ['-i', a.src, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
dec = subprocess.Popen(cmd, stdout=subprocess.PIPE)
enc = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{a.w}x{a.h}', '-r', str(a.fps), '-i', '-',
                        '-c:v', 'libx264', '-crf', '14', '-preset', 'medium', '-pix_fmt', 'yuv420p', a.out], stdin=subprocess.PIPE)
prev = None; n = 0; fs = WW * WH * 3
while True:
    buf = dec.stdout.read(fs)
    if len(buf) < fs: break
    f = np.frombuffer(buf, np.uint8).reshape(WH, WW, 3)
    m = grade.person_mask(f)
    m = m if prev is None else .55 * m + .45 * prev       # temporal smoothing
    prev = m
    g = grade.grade_frame(f, a.mode, m)
    enc.stdin.write(cv2.resize(g, (a.w, a.h), interpolation=cv2.INTER_AREA).tobytes()); n += 1
enc.stdin.close(); enc.wait(); dec.wait()
print(f'frames {n} crop {cw}x{ch}@{x0},{y0} -> {a.w}x{a.h}')
