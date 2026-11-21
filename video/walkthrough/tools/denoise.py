"""Gentle background-noise reduction that never touches the speaker's words.
1) light spectral noise reduction (noisereduce, non-stationary, 35%)
2) energy-based downward expander: only parts quieter than -40 dBFS (true pauses) are pulled down ~12 dB,
   with slow release so word endings stay intact. (No transcript timing involved.)
usage: python3 denoise.py <in.wav> <out.wav>"""
import sys, numpy as np, soundfile as sf, noisereduce as nr
from scipy.ndimage import maximum_filter1d, uniform_filter1d
a, sr = sf.read(sys.argv[1])
red = nr.reduce_noise(y=a, sr=sr, stationary=False, prop_decrease=0.35, time_mask_smooth_ms=100, n_jobs=-1)
hop = int(0.01 * sr); n = len(a) // hop
env = np.array([np.sqrt((a[i * hop:(i + 1) * hop] ** 2).mean()) for i in range(n)])
db = 20 * np.log10(env + 1e-9)
speech = maximum_filter1d((db > -40).astype(float), 35)          # hold 350 ms around any voice
g = np.where(speech > 0, 1.0, 10 ** (-12 / 20))
g = uniform_filter1d(g, 8)                                          # 80 ms smoothing
gain = np.repeat(g, hop); gain = np.pad(gain, (0, len(a) - len(gain)), constant_values=gain[-1])
sf.write(sys.argv[2], (red * gain).astype(np.float32), sr, subtype='FLOAT'); print('ok', sys.argv[2])
