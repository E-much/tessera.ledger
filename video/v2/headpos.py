import json, os, math, numpy as np
from PIL import Image
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p=f"{R}/build/v2/edl.json"; e=json.load(open(p))
for s in e["slams"]:
    T=s["t"]+0.1; it=next((i for i in e["items"] if i["start"]<=T<i["start"]+i["dur"]),None)
    if not it: continue
    idx=e["items"].index(it); fn=min(math.floor((T-it["start"])*30)+1, math.floor(it["dur"]*30))
    f=f"{R}/build/v2/masks/{idx:03d}_{fn:05d}.png"
    if not os.path.exists(f): continue
    a=np.asarray(Image.open(f))[:,:,3]; band=a[:,int(a.shape[1]*.3):int(a.shape[1]*.7)]
    rows=np.where((band>128).sum(1)>8)[0]
    s["head"]=float(rows[0]/a.shape[0]) if len(rows) else 0.3
    print(s["text"], round(s["head"],3))
json.dump(e,open(p,"w"),indent=1)
