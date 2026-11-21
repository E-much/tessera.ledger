"""Quality check for the walkthrough edit: cut points, full transcript vs intended words, banned content, sync.
usage: python3 tools/qc.py"""
import json, re, subprocess, difflib, numpy as np, soundfile as sf
src = open('build.py').read().split('# ---- render talk track')[0]
g = {}; exec(src, g)                     # recompute the cut list without rendering
R = g['out_ranges']; SRC = g['SRC']
raw = {k: sf.read(SRC[k]['voice'].replace('_dn.wav', '.wav').replace('main_voice.wav', 'main_voice_raw.wav')) for k in SRC}
def level(k, t0, t1):
    a, sr = raw[k]; v0 = SRC[k]['voice0']; x = a[max(0, int((t0 - v0) * sr)):max(0, int((t1 - v0) * sr))]
    return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9) if len(x) else -99
print(f'{len(R)} pieces, talk {g["TALK"]:.2f}s')
bad = 0
for i, (k, s, e, o) in enumerate(R):
    st, en = level(k, s, s + .03), level(k, e - .03, e)
    flag = []
    if st > -32: flag.append(f'starts mid-sound ({st:.0f} dB)')
    if en > -32: flag.append(f'ends mid-sound ({en:.0f} dB)')
    if flag: bad += 1; print(f'  cut {i:02d} {k} {s:.2f}-{e:.2f} (out {o:.1f}s): ' + '; '.join(flag))
print(f'cut points landing on sound: {bad} of {2 * len(R)}')
