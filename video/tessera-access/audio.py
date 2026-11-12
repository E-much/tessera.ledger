"""Original score + SFX for the Tessera access film, mixed under the voiceover.
usage: python3 audio.py <vo.wav> <out.wav>"""
import sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
SR=48000; DUR=35.0; N=int(SR*DUR)
rng=np.random.default_rng(5)
hz=lambda m:440*2**((m-69)/12)
def filt(x,f,kind,o=2): return sosfilt(butter(o,f,kind,fs=SR,output='sos'),x)
def place(buf,x,at,g=1.0):
    s=int(at*SR); n=min(len(x),N-s)
    if n>0 and s>=0: buf[s:s+n]+=x[:n]*g
def env(n,a,r):
    e=np.ones(n); ai=max(1,int(a*SR)); ri=max(1,int(r*SR)); e[:ai]=np.linspace(0,1,ai); e[-ri:]*=np.linspace(1,0,ri); return e
def saw(f,n,harm=12,det=0.0):
    tt=np.arange(n)/SR; return sum(np.sin(2*np.pi*f*k*tt*(1+det))/k for k in range(1,harm+1) if f*k<15000)
def pad(buf,notes,a,b,g,cut,att=.6,rel=.8):
    n=int((b-a)*SR); y=sum(saw(hz(m),n,10)+saw(hz(m),n,10,.004)+saw(hz(m),n,10,-.0035) for m in notes)
    place(buf,filt(y/len(notes)/3,cut,'low')*env(n,att,rel),a,g)
def pluck(m,dur=.4,dec=9,bright=.35):
    n=int(dur*SR); tt=np.arange(n)/SR; f=hz(m)
    return (np.sin(2*np.pi*f*tt)+bright*np.sin(2*np.pi*2*f*tt)+.1*np.sin(2*np.pi*3*f*tt))*np.exp(-tt*dec)
def kick():
    n=int(.4*SR); tt=np.arange(n)/SR; return np.sin(2*np.pi*np.cumsum(46+120*np.exp(-tt*30))/SR)*np.exp(-tt*7)
def noise(n): return rng.standard_normal(n)

music=np.zeros(N); sfx=np.zeros(N); duck=np.ones(N)
BPM=104; beat=60/BPM; e8=beat/2

# ---- Problem (0 - 16.2): restrained minor ostinato, sub pulse, slowly building
pad(music,[45,52,57,60,64],0.0,8.2,.35,900,1.0,.4)      # Am
pad(music,[41,53,57,60,65],8.0,12.4,.35,1000,.4,.4)     # F
pad(music,[43,55,59,62,67],12.2,16.4,.38,1200,.4,.3)    # G
osti=[69,72,76,72]; pos=0.4; i=0
while pos<16.0:
    ch = 0 if pos<8.1 else (1 if pos<12.3 else 2)
    m=osti[i%4]+[0,-4,-2][ch]
    place(music,pluck(m,.35,12,.25),pos,.10+.05*pos/16); pos+=e8; i+=1
pos=0.4
while pos<16.0:
    n=int(.3*SR); tt=np.arange(n)/SR; y=np.sin(2*np.pi*np.cumsum(40+30*np.exp(-tt*12))/SR)*np.exp(-tt*9)
    place(music,y,pos,.45); pos+=beat
# ---- dive (16.2 - 17.05): riser into the lime
n=int(1.0*SR); tt=np.arange(n)/SR; pr=tt/tt[-1]
r=np.zeros(n); nz=noise(n)
for k in range(0,n,2400):
    c=400+pr[k]**2*8000; r[k:k+2400]=filt(nz[k:k+2400],[c*.7,min(c*1.4,20000)],'band')
r=r*pr**2+.3*np.sin(2*np.pi*np.cumsum(220+pr**3*1200)/SR)*pr**2.5
place(sfx,r,16.05,.45)
# ---- Tessera hit (17.05)
n=int(2.5*SR); tt=np.arange(n)/SR
place(sfx,np.sin(2*np.pi*np.cumsum(42+70*np.exp(-tt*12))/SR)*np.exp(-tt*2.2),17.05,.85)
chord=sum(np.sin(2*np.pi*hz(m)*tt)*np.exp(-tt*1.3) for m in [72,76,79,84,88])/5
place(sfx,chord,17.05,.22)
for j in range(9):  # logo tiles clicking into place
    m=int(.05*SR); tp=np.arange(m)/SR; place(sfx,np.sin(2*np.pi*(1800+j*120)*tp)*np.exp(-tp*90),17.12+j*0.065,.16)
# ---- Solution (17.05 - 27.3): bright major, driving
chords=[(17.05,[48,55,60,64,67]),(19.5,[43,55,59,62,67]),(22.0,[45,52,57,60,64]),(24.5,[41,53,57,60,65])]  # C G Am F
ends=[19.5,22.0,24.5,27.4]
for (a,nt),b in zip(chords,ends): pad(music,nt,a,b+.3,.30,2600,.15,.4)
pos=17.1; i=0
while pos<27.2:
    nt=[c for a,c in chords if a<=pos][-1]
    m=nt[1:][[0,2,1,3,2,1,3,2][i%8]%(len(nt)-1)]+12
    place(music,pluck(m,.35,10,.4),pos,.10*(0.8 if i%2 else 1)); pos+=e8/2*2 if False else e8; i+=1
pos=17.6
while pos<27.2:
    place(music,kick(),pos,.55); s=int(pos*SR); d=int(.28*SR)
    duck[s:s+d]=np.minimum(duck[s:s+d],1-.45*np.exp(-np.arange(min(d,N-s))/SR*10))
    h=int(.05*SR); place(music,filt(noise(h),7000,'high')*np.exp(-np.arange(h)/SR*90),pos+e8,.10)
    pos+=beat
# ---- Close (27.3 - 35): open, resolved
pad(music,[41,53,60,64,67,69,72],27.3,30.6,.34,3000,.3,.8)   # Fmaj9
pad(music,[36,48,55,60,62,64,67,71],30.3,35.0,.36,2800,.4,2.2) # Cmaj9
n=int(3*SR); tt=np.arange(n)/SR
place(sfx,np.sin(2*np.pi*np.cumsum(44+60*np.exp(-tt*10))/SR)*np.exp(-tt*1.6),30.35,.7)
place(sfx,sum(np.sin(2*np.pi*hz(m)*tt) for m in [84,88,91,95])*np.exp(-tt*1.2)/4,30.35,.12)
for j in range(9):
    m=int(.05*SR); tp=np.arange(m)/SR; place(sfx,np.sin(2*np.pi*(2000+j*110)*tp)*np.exp(-tp*90),30.4+j*0.09,.12)
music*=duck

# ---- camera whooshes (start times of the camera moves) + UI accents
def whoosh(at,dur,g=.30,lo=500,hi=6000):
    n=int(dur*SR); tt=np.linspace(0,1,n); place(sfx,filt(noise(n),[lo,hi],'band')*np.sin(np.pi*tt)**2,at,g)
for at,d in [(1.3,.6),(3.15,.6),(4.0,.45),(5.4,.7),(6.55,.5),(7.95,.65),(10.3,.65),(11.4,.6),(12.6,.5),(14.0,.8),(14.85,.75),
             (17.9,.6),(19.1,.6),(20.35,.5),(21.85,.7),(23.35,.6),(25.25,.6),(27.25,1.0),(28.55,.8),(30.15,1.0)]:
    whoosh(at,d,.22 if d<.62 else .30)
def tick(at,f=2400,g=.18,dec=70):
    n=int(.08*SR); tp=np.arange(n)/SR; place(sfx,np.sin(2*np.pi*f*tp)*np.exp(-tp*dec),at,g)
n=int(.25*SR); tp=np.arange(n)/SR; place(sfx,np.sin(2*np.pi*np.cumsum(180*np.exp(-tp*8)+60)/SR)*np.exp(-tp*14),4.1,.6)  # "Locked out" thud
for j in range(16): tick(8.25+j*0.07,2600+j*40,.10,120)     # $250,000 counter
tick(25.25,1500,.3,60); tick(25.3,3000,.15,90)            # Invest press
for at in [2.55,7.05,13.0,20.75,22.15,24.35,26.2,29.2]: tick(at,3200,.12,80)   # highlights

# ---- mix
vo,vsr=sf.read(sys.argv[1]); vo=resample_poly(vo,SR,vsr)[:N]; vo=np.pad(vo,(0,N-len(vo)))
vo=filt(vo,75,'high'); vo=vo/np.abs(vo).max()*0.9
venv=np.clip(filt(np.abs(vo),6,'low',1)/0.08,0,1)
bed=music/np.abs(music).max()*0.5*(1-0.55*venv)
fx=sfx/np.abs(sfx).max()*0.6*(1-0.3*venv)
mix=vo+bed+fx
fade=np.ones(N); fo=int(1.8*SR); fade[-fo:]=np.linspace(1,0,fo)**1.5; fade[:int(.02*SR)]=np.linspace(0,1,int(.02*SR))
mix=np.tanh(mix*fade*1.1)/np.tanh(1.1)
sf.write(sys.argv[2],np.stack([mix,mix],1).astype(np.float32),SR,subtype='FLOAT'); print('ok')
