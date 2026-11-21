"""Reduce background noise (kids, other people) in a cleaned voice track.
1) spectral noise reduction (noisereduce, non-stationary) under the speech
2) gate: everything outside the speaker's own words (from the word-timed transcript) is pulled down ~30 dB
usage: python3 denoise.py <in.wav> <words.json> <src_offset> <out.wav>
src_offset = source time at the start of in.wav (words are in source time)"""
import sys, json, numpy as np, soundfile as sf, noisereduce as nr
from scipy.ndimage import uniform_filter1d
src, words_f, off, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
a, sr = sf.read(src)
red = nr.reduce_noise(y=a, sr=sr, stationary=False, prop_decrease=0.65, time_mask_smooth_ms=80, freq_mask_smooth_hz=400, n_jobs=-1)
keep = np.zeros(len(a))
for w in json.load(open(words_f)):
    s = int(max(0, (w['s'] - off - 0.12) * sr)); e = int(min(len(a), (w['e'] - off + 0.18) * sr))
    if e > s: keep[s:e] = 1
keep = uniform_filter1d(keep, int(0.06 * sr))              # 60 ms soft edges
gain = 0.03 + 0.97 * keep                                   # ~ -30 dB between words
sf.write(out, (red * gain).astype(np.float32), sr, subtype='FLOAT')
print('ok', out, f'speech kept {keep.mean() * 100:.0f}%')
