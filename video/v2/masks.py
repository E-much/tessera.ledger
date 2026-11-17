import json, os, math, numpy as np
import mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
from PIL import Image, ImageFilter
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
e=json.load(open(f"{R}/build/v2/edl.json"))
seg=vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(
    base_options=BaseOptions(model_asset_path=f"{R}/build/models/selfie_multiclass.tflite"),output_confidence_masks=True))
out=f"{R}/build/v2/masks"; os.makedirs(out,exist_ok=True); n=0
need=set()
for s in e["slams"]:
    for f in range(math.floor(s["t"]*30), math.ceil((s["t"]+1.1)*30)+1):
        T=f/30; it=next((i for i in e["items"] if i["start"]<=T<i["start"]+i["dur"]),None)
        if not it: continue
        idx=e["items"].index(it); lt=T-it["start"]; fn=min(math.floor(lt*30)+1, math.floor(it["dur"]*30))
        need.add((idx,fn))
for idx,fn in sorted(need):
    p=f"{out}/{idx:03d}_{fn:05d}.png"
    if os.path.exists(p): continue
    im=np.asarray(Image.open(f"{R}/build/v2/frames/{idx:03d}c/{fn:05d}.jpg").convert("RGB"))
    res=seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB,data=np.ascontiguousarray(im)))
    bg=np.squeeze(res.confidence_masks[0].numpy_view())  # class 0 = background
    a=np.clip((1-bg)*1.15,0,1); a=(a*255).astype(np.uint8)
    m=Image.fromarray(a).filter(ImageFilter.GaussianBlur(1.2))
    rgba=Image.new("RGBA",m.size,(255,255,255,0)); rgba.putalpha(m); rgba.save(p); n+=1
print("masks",n,"needed",len(need)); seg.close()
