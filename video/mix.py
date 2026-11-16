import json, subprocess, numpy as np
SR=44100; tl=json.load(open("build/timeline.json")); T=tl[-1]["start"]+tl[-1]["dur"]; N=int(T*SR)+SR
def load(f):
    raw=subprocess.check_output(["ffmpeg","-v","error","-i",f,"-f","f32le","-ac","1","-ar",str(SR),"-"])
    return np.frombuffer(raw,np.float32).astype(np.float64)
t=np.arange(N)/SR
def act_start(a): return next(s["start"] for s in tl if s["id"]=="act"+a)
A={k:act_start(k) for k in ["I","II","III","IV","V","VI","VII"]}
# --- pad
chords=[[73.42,110,146.83,174.61],[58.27,116.54,146.83,174.61],[87.31,130.81,174.61,220],[65.41,98,130.81,164.81]]
seg=16.0; pad=np.zeros(N)
for k in range(int(T/seg)+2):
    c=chords[k%4]; s0=k*seg; env=np.clip(1-np.abs((t-(s0+seg/2))/(seg*0.75)),0,1)**1.5
    idx=env>0
    for j,f in enumerate(c):
        for det in (-0.6,0.6):
            ph=2*np.pi*(f+det)*t[idx]
            pad[idx]+=env[idx]*(np.sin(ph)+0.3*np.sin(2*ph)+0.12*np.sin(3*ph))*(0.5 if j==0 else 0.3)
pad*=1+0.15*np.sin(2*np.pi*t/7.3)
rs=np.random.default_rng(1); air=rs.standard_normal(N); 
k=np.ones(400)/400; air=np.convolve(air,k,"same")*6  # soft lowpassed air
# intensity curve
I=np.interp(t,[0,A["II"],A["III"],A["IV"],A["V"],A["VI"],A["VII"],A["VII"]+8,T-20,T-8,T],[.5,.6,.65,.85,.9,1.0,.45,.5,.8,.6,0])
music=(pad*0.05+air*0.012)*I
# pulse from act IV to act VII, then return near the end
bpm=84; beat=60/bpm; pulse=np.zeros(N); kick_len=int(.45*SR); kt=np.arange(kick_len)/SR
kick=np.sin(2*np.pi*(48+60*np.exp(-kt*25))*kt)*np.exp(-kt*7)
tick=rs.standard_normal(int(.03*SR))*np.exp(-np.arange(int(.03*SR))/SR*150)*.15
def addpulse(a,b,g):
    x=a
    while x<b:
        i=int(x*SR); n=min(kick_len,N-i); pulse[i:i+n]+=kick[:n]*g
        j=int((x+beat/2)*SR); m=min(len(tick),N-j); pulse[j:j+m]+=tick[:m]*g
        x+=beat
addpulse(A["IV"],A["VII"]-0.5,0.16); addpulse(T-22,T-9,0.14)
music+=pulse
# --- VO + duck
vo=np.zeros(N); duck=np.zeros(N)
for s in tl:
    if not s.get("vo"): continue
    v=load(f"build/vo/{s['id']}.mp3"); i=int(s["vo_at"]*SR); n=min(len(v),N-i); vo[i:i+n]+=v[:n]
    duck[max(0,i-int(.2*SR)):i+n+int(.3*SR)]=1
sm=int(.25*SR); duck=np.convolve(duck,np.ones(sm)/sm,"same"); music*=1-0.5*duck
# --- sfx
sfx=np.zeros(N); G={"hit":.55,"riser":.35,"tick":.25}
for s in tl:
    if s.get("sfx"):
        v=load(f"build/sfx/{s['sfx']}.mp3"); at=s["start"]-(len(v)/SR-.3 if s["sfx"]=="riser" else 0); at=max(at,0)
        i=int(at*SR); n=min(len(v),N-i); sfx[i:i+n]+=v[:n]*G[s["sfx"]]
mix=vo*1.0+music+sfx
fade=np.clip((T-t)/4,0,1); mix*=fade; mix=mix[:int(T*SR)]
mix/=max(1e-9,np.abs(mix).max())/0.9
st=np.stack([mix,mix],1)
# subtle stereo width on music
w=np.roll(music[:len(mix)],int(.012*SR))*0.25/ (np.abs(mix).max()+1e-9)
st[:,0]+=w*0; 
open("build/mix.f32","wb").write(st.astype(np.float32).tobytes())
subprocess.check_call(["ffmpeg","-y","-v","error","-f","f32le","-ar",str(SR),"-ac","2","-i","build/mix.f32","-af","loudnorm=I=-15:TP=-1.5:LRA=11","-ar","48000","-c:a","aac","-b:a","256k","build/mix.m4a"])
print("audio",T)
