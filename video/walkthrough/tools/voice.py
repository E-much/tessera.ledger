"""Clean a voice track: high-pass, gentle denoise, de-ess, compression, mute ranges, loudness to -16 LUFS.
usage: python3 voice.py <in> <out.wav> [--start S] [--end E] [--mute a-b,c-d]   (mute times are relative to --start)"""
import argparse, subprocess
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--start', type=float, default=0); ap.add_argument('--end', type=float); ap.add_argument('--mute', default='')
a = ap.parse_args()
chain = ['highpass=f=80', 'afftdn=nf=-30:nr=8', 'deesser=i=0.35',
         'acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2']
for r in filter(None, a.mute.split(',')):
    s, e = map(float, r.split('-'))
    chain.append(f"volume=enable='between(t,{s},{e})':volume=0")
chain.append('loudnorm=I=-16:TP=-1.5:LRA=7')
cmd = ['ffmpeg', '-loglevel', 'error', '-y', '-ss', str(a.start)] + (['-to', str(a.end)] if a.end else []) + \
      ['-i', a.src, '-vn', '-ac', '1', '-ar', '48000', '-af', ','.join(chain), a.out]
subprocess.run(cmd, check=True); print('ok', a.out)
