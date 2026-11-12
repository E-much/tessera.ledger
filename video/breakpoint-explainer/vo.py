import soundfile as sf, numpy as np, json
from kokoro_onnx import Kokoro
k=Kokoro("kokoro-v1.0.onnx","voices-v1.0.bin")
lines=[
"Private equity is a seven trillion dollar market. But most people never get access.",
"High minimums. Heavy K Y C. Weeks of waiting.",
"The best companies stay locked behind institutional walls.",
"Tessera changes that.",
"We bring tokenized exposure to SpaceX, OpenAI, Kalshi, and more.",
"Starting from just one dollar. No K Y C. Instant settlement. Twenty four seven, on Solana.",
"Clean access. Real exposure. No barriers.",
"Tessera is coming to Breakpoint London. November fifteenth to seventeenth.",
"Private equity, for everyone.",
"See you in London."]
speeds=[1.3,1.36,1.32,1.2,1.32,1.36,1.3,1.28,1.12,1.1]
gap=[0.18,0.08,0.22,0.12,0.06,0.2,0.22,0.22,0.2,0]
t=0.25; out=[]; sr=24000; buf=np.zeros(int(sr*30.0))
for i,l in enumerate(lines):
    a,sr=k.create(l,voice="am_michael",speed=speeds[i],lang="en-us")
    idx=np.where(np.abs(a)>0.01)[0]; a=a[max(0,idx[0]-120):idx[-1]+900]
    d=len(a)/sr; out.append({"i":i,"start":round(t,3),"end":round(t+d,3),"text":l})
    s=int(t*sr); n=min(len(a),len(buf)-s); buf[s:s+n]+=a[:n]; t+=d+gap[i]
print("end",round(t,2)); json.dump(out,open("timeline.json","w"),indent=1)
sf.write("vo.wav",buf,sr)
for o in out: print(o["start"],o["end"],o["text"][:45])
