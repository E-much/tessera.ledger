import json, subprocess
TARGET=300.0
cues=json.load(open("cues.json"))
def dur(f): return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]))
for c in cues:
    c["vod"]=dur(f"build/vo/{c['id']}.mp3") if c.get("vo") else 0
def build(extra):
    t=0; out=[]
    for c in cues:
        lead=c.get("lead",0.7)
        d=max(c.get("min",0), (lead+c["vod"]+c.get("hold",1.5)+extra) if c["vod"] else 0)
        out.append({**c,"start":round(t,3),"dur":round(d,3),"vo_at":round(t+lead,3)}); t+=d
    return out,t
lo,hi=0,10
for _ in range(40):
    m=(lo+hi)/2; _,t=build(m)
    lo,hi=(m,hi) if t<TARGET else (lo,m)
tl,t=build(lo)
json.dump(tl,open("build/timeline.json","w"),indent=1)
print("extra hold %.2fs total %.1fs scenes %d"%(lo,t,len(tl)))
