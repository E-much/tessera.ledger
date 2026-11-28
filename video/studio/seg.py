import os, sys, numpy as np, mediapipe as mp
from mediapipe.tasks.python import vision, BaseOptions
from PIL import Image
R="/home/user/tessera.ledger/video"
D=sys.argv[1]
seg=vision.ImageSegmenter.create_from_options(vision.ImageSegmenterOptions(base_options=BaseOptions(model_asset_path=f"{R}/build/models/selfie_multiclass.tflite"),output_confidence_masks=True))
os.makedirs(f"{D}/mask",exist_ok=True);prev=None
files=sorted(os.listdir(f"{D}/fr"))
for f in files:
    im=np.asarray(Image.open(f"{D}/fr/{f}").convert("RGB"))
    r=seg.segment(mp.Image(image_format=mp.ImageFormat.SRGB,data=np.ascontiguousarray(im)))
    person=1-np.squeeze(r.confidence_masks[0].numpy_view())
    # chair: the orange plastic chair, keyed by colour so the sitter doesn't float
    hsv=np.asarray(Image.fromarray(im).convert("HSV")).astype(np.float32)
    chair=((hsv[...,0]>2)&(hsv[...,0]<22)&(hsv[...,1]>130)&(hsv[...,2]>90)).astype(np.float32)
    m=np.clip(person,0,1)
    if prev is not None: m=0.6*m+0.4*prev   # temporal smoothing against edge flicker
    prev=m
    Image.fromarray((m*255).astype(np.uint8)).save(f"{D}/mask/p_{f}")
    Image.fromarray((chair*255).astype(np.uint8)).save(f"{D}/mask/c_{f}")
seg.close();print("masks",len(files))
