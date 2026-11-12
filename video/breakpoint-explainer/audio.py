"""Original score + SFX for the Tessera Breakpoint explainer, mixed under the voiceover.
usage: python3 audio.py <vo.wav> <out.wav>"""
import sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
SR=48000; DUR=30.0; N=int(SR*DUR); t=np.arange(N)/SR
rng=np.random.default_rng(3)
def hz(m): return 440*2**((m-69)/12)
def lp(x,f,o=2): return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2): return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,lo,hi,o=2): return sosfilt(butter(o,[lo,hi],'band',fs=SR,output='sos'),x)
def seg(a,b): return slice(int(a*SR),min(N,int(b*SR)))
def place(buf,x,at,g=1.0):
    s=int(at*SR); n=min(len(x),N-s)
    if n>0: buf[s:s+n]+=x[:n]*g
def saw(f,n,harm=14,det=0.0):
    tt=np.arange(n)/SR; y=np.zeros(n)
    for k in range(1,harm+1):
        if f*k>16000: break
        y+=np.sin(2*np.pi*f*k*tt*(1+det))/k
    return y
def adsr(n,a,r):
    e=np.ones(n); ai=int(a*SR); ri=int(r*SR)
    e[:ai]=np.linspace(0,1,ai); e[-ri:]*=np.linspace(1,0,ri); return e

music=np.zeros(N); sfx=np.zeros(N)

# --- Section A (0 - 9.72): dark drone + heartbeat + riser
def pad(notes,a,b,g,cut,att=0.8,rel=0.8):
    n=int((b-a)*SR); y=np.zeros(n)
    for m in notes:
        f=hz(m); y+=saw(f,n,10,0.0)+saw(f,n,10,0.004)+saw(f,n,10,-0.0035)
    y=lp(y/len(notes)/3,cut,2)*adsr(n,att,rel); place(music,y,a,g)
pad([33,45,52,55,60],0.0,10.0,0.55,700,1.2,0.4)          # Am(add9) low, dark
# heartbeat sub pulse accelerating
bt=0.6; pos=0.25; k=0
while pos<9.6:
    n=int(0.35*SR); tt=np.arange(n)/SR; f=55*np.exp(-tt*8)+42
    y=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*9); place(music,y,pos,0.55+0.3*pos/9.6)
    pos+= bt if pos<5 else max(0.22,0.5-(pos-5)*0.06); k+=1
# riser 7.3 -> 9.72
n=int(2.42*SR); tt=np.arange(n)/SR; prog=tt/tt[-1]
noise=rng.standard_normal(n); r=np.zeros(n)
for i in range(0,n,2400):   # stepped bandpass sweep
    c=300+prog[i]**2*7000; seg_=noise[i:i+2400]; r[i:i+len(seg_)]=bp(seg_,c*0.7,min(c*1.4,20000),2)
tone=np.sin(2*np.pi*np.cumsum(110+prog**3*880)/SR)*0.35
place(sfx,(r*0.6+tone)*prog**2.2,7.3,0.5)

# --- Shatter at 9.72: impact + glass
T=9.72
n=int(2.0*SR); tt=np.arange(n)/SR
boom=np.sin(2*np.pi*np.cumsum(38+70*np.exp(-tt*14))/SR)*np.exp(-tt*2.2)
crack=hp(rng.standard_normal(n),2500)*np.exp(-tt*9)
glass=np.zeros(n)
for _ in range(70):
    f=rng.uniform(2200,9000); d=rng.uniform(0,0.45); dur=rng.uniform(0.05,0.5); m=int(dur*SR); s=int(d*SR)
    tp=np.arange(m)/SR; glass[s:s+m]+=np.sin(2*np.pi*f*tp)*np.exp(-tp*rng.uniform(10,40))*rng.uniform(.2,1)
tinkle=hp(glass,1800)
place(sfx,boom,T,0.9); place(sfx,crack,T,0.35); place(sfx,tinkle/np.abs(tinkle).max(),T+0.01,0.32)
# reverse swell into shatter
n=int(0.6*SR); sw=bp(rng.standard_normal(n),800,6000)*np.linspace(0,1,n)**3; place(sfx,sw,T-0.6,0.35)

# --- Section B (10.0 - 22.7): bright, clean, pulsing
prog_b=[(10.0,[41,53,57,60,64]),(13.15,[45,52,57,60,64,67]),(16.3,[48,55,59,64,67]),(19.45,[43,55,59,62,64])]  # Fmaj7, Am9, Cmaj7, G6
ends=[13.15,16.3,19.45,22.7]
for (a,nt),b in zip(prog_b,ends): pad(nt,a,b+0.4,0.32,2400,0.25,0.5)
# 16th pluck arpeggio, 112 bpm feel
step=60/112/2; pos=10.15; i=0; arp_notes=None
while pos<22.55:
    ch=[nt for (a,nt) in prog_b if a<=pos][-1]
    m=ch[1:][ [0,2,1,3,2,1][i%6] % (len(ch)-1) ]+12
    n=int(0.35*SR); tt=np.arange(n)/SR; f=hz(m)
    y=(np.sin(2*np.pi*f*tt)+0.35*np.sin(2*np.pi*2*f*tt)+0.12*np.sin(2*np.pi*3*f*tt))*np.exp(-tt*11)
    place(music,y,pos,0.11*(0.8 if i%2 else 1)); pos+=step; i+=1
# kick + hat with sidechain
duck=np.ones(N); pos=10.15
while pos<22.55:
    n=int(0.4*SR); tt=np.arange(n)/SR
    kick=np.sin(2*np.pi*np.cumsum(48+120*np.exp(-tt*30))/SR)*np.exp(-tt*7)
    place(music,kick,pos,0.55)
    d=int(0.3*SR); s=int(pos*SR); duck[s:s+d]=np.minimum(duck[s:s+d],1-0.45*np.exp(-np.arange(min(d,N-s))/SR*10))
    hat=hp(rng.standard_normal(int(0.05*SR)),7000)*np.exp(-np.arange(int(0.05*SR))/SR*90)
    place(music,hat,pos+step,0.10)
    pos+=step*2
# --- Section C (22.7 - 30): resolve — big open Fmaj9 -> Cadd9
pad([29,41,48,55,57,60,64,67],22.7,26.5,0.40,3200,0.05,1.0)
pad([36,48,55,60,62,64,67,71],26.3,30.0,0.40,3000,0.6,1.6)
music*=duck
# end hit
n=int(3*SR); tt=np.arange(n)/SR
hit=np.sin(2*np.pi*np.cumsum(45+60*np.exp(-tt*10))/SR)*np.exp(-tt*1.6)
shim=sum(np.sin(2*np.pi*hz(m)*tt) for m in [84,88,91,95])*np.exp(-tt*1.4)/4
place(sfx,hit,22.85,0.75); place(sfx,shim,22.85,0.10)

# whooshes at transitions
def whoosh(at,dur=0.7,g=0.35,lo=400,hi=5000):
    n=int(dur*SR); tt=np.linspace(0,1,n); y=bp(rng.standard_normal(n),lo,hi)*np.sin(np.pi*tt)**2
    place(sfx,y,at-dur*0.55,g)
for at in [4.75,11.35,15.35,20.05,22.5]: whoosh(at)
# UI ticks on reveals
def tick(at,f=2400,g=0.22):
    n=int(0.08*SR); tt=np.arange(n)/SR; place(sfx,np.sin(2*np.pi*f*tt)*np.exp(-tt*70),at,g)
for at,f in [(5.05,1500),(5.75,1600),(6.35,1700),(7.05,1800)]: tick(at,f,0.25)
for at in [12.45,13.05,13.65]: tick(at,2600)
for at in [15.5,17.0,17.65,18.55]: tick(at,3000,0.2)
for at in [20.1,20.85,21.65]: tick(at,2000,0.2)
tick(24.7,3200,0.18)

# --- mix
vo,vsr=sf.read(sys.argv[1]); vo=resample_poly(vo,SR,vsr)[:N]; vo=np.pad(vo,(0,N-len(vo)))
vo=hp(vo,70); vo=vo/np.abs(vo).max()*0.9
# VO-driven ducking envelope for the bed
env=np.abs(vo); env=lp(env,6,1); env=np.clip(env/0.08,0,1)
bed=music/np.abs(music).max()*0.55
bed*=1-0.55*env
fx=sfx/np.abs(sfx).max()*0.7
mix=vo+bed+fx*(1-0.3*env)
fade=np.ones(N); fade[-int(1.2*SR):]=np.linspace(1,0,int(1.2*SR))**1.5
fi=int(0.03*SR); fade[:fi]=np.linspace(0,1,fi)
mix*=fade
mix=np.tanh(mix*1.1)/np.tanh(1.1)
st=np.stack([mix,mix],1)
sf.write(sys.argv[2],st.astype(np.float32),SR,subtype='FLOAT'); print('ok')
