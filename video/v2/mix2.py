import json, os, subprocess, numpy as np
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); SR=48000
e=json.load(open(f"{R}/build/v2/edl.json")); T=e["duration"]; N=int(T*SR)
def load(f,ss=None,t=None):
    cmd=["ffmpeg","-v","error"]+(["-ss",str(ss)] if ss is not None else [])+["-i",f]+(["-t",str(t)] if t else [])+["-f","f32le","-ac","1","-ar",str(SR),"-"]
    return np.frombuffer(subprocess.check_output(cmd),np.float32).astype(np.float64)
# dialogue
src={k:load(f"{R}/build/clips/{v}.mp4") for k,v in e["src"].items()}
dia=np.zeros(N); speech=np.zeros(N)
f=int(.008*SR); ramp=np.linspace(0,1,f)
for it in e["items"]:
    a=src[it["src"]][int(it["in"]*SR):int(it["out"]*SR)].copy()
    a[:f]*=ramp; a[-f:]*=ramp[::-1]
    i=int(it["start"]*SR); n=min(len(a),N-i); dia[i:i+n]+=a[:n]; speech[i:i+n]=1
# normalise dialogue loudness roughly
dia/= (np.sqrt(np.mean(dia[speech>0]**2))+1e-9); dia*=0.12
# music
def at(name): return load(f"{R}/build/music/{name}.mp3")
mus=np.zeros(N)
cards=e["cards"]; logo=next(c for c in cards if c["kind"]=="logo"); end=next(c for c in cards if c["kind"]=="end")
intro=at("intro"); n=min(len(intro),int(logo["start"]*SR)+SR); env=np.ones(n); env[-SR:]=np.linspace(1,0,SR); mus[:n]+=intro[:n]*env*0.9
g=at("groove"); x0=int((logo["start"]+0.3)*SR); x1=int(end["start"]*SR)+SR; xf=SR
pos=x0
while pos<x1:
    seg=g.copy(); seg[:xf]*=np.linspace(0,1,xf); seg[-xf:]*=np.linspace(1,0,xf)
    n=min(len(seg),N-pos); mus[pos:pos+n]+=seg[:n]*0.55; pos+=len(seg)-xf
fo=int(end["start"]*SR)+SR; mus[fo-SR:fo]*=np.linspace(1,0,SR); mus[fo:]=0
o=at("outro"); i=int(end["start"]*SR); n=min(len(o),N-i); mus[i:i+n]+=o[:n]*1.1
# duck under speech
k=int(.3*SR); sm=np.convolve(speech,np.ones(k)/k,"same"); mus*=1-0.82*sm
mus*=np.clip((T-np.arange(N)/SR)/3,0,1)
# sfx
G={"drop":.8,"click":.35,"glitch":.45,"hit":.8,"whoosh":.5,"riser":.35}
sfx=np.zeros(N); cache={}
for s in e["sfx"]:
    a=cache.setdefault(s["n"],at(s["n"])); t=s["t"]-(len(a)/SR-.25 if s["n"]=="riser" else 0)
    i=max(0,int(t*SR)); n=min(len(a),N-i); 
    duck=0.5 if s["n"] in("click",) and speech[min(i,N-1)] else 1
    sfx[i:i+n]+=a[:n]*G[s["n"]]*duck
mix=dia+mus*0.22+sfx*0.25
mix/=np.abs(mix).max()/0.95
open(f"{R}/build/v2/mix.f32","wb").write(np.stack([mix,mix],1).astype(np.float32).tobytes())
subprocess.check_call(["ffmpeg","-y","-v","error","-f","f32le","-ar",str(SR),"-ac","2","-i",f"{R}/build/v2/mix.f32",
  "-af","highpass=f=60,acompressor=threshold=0.25:ratio=3:attack=10:release=150,loudnorm=I=-14:TP=-1.2:LRA=9","-ar","48000","-c:a","aac","-b:a","256k",f"{R}/build/v2/mix.m4a"])
# report speech-vs-music balance
print("dur",T,"speech frac",speech.mean().round(2))
