import json, os, subprocess
from concurrent.futures import ThreadPoolExecutor
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
e=json.load(open(f"{ROOT}/build/v2/edl.json")); out=f"{ROOT}/build/v2/frames"
def job(a):
    i,it=a; src=f"{ROOT}/build/clips/{e['src'][it['src']]}.mp4"
    for tag,crop,dur in [("c",it["cam"],it["dur"])]+([("h",it["host"],it["cutaway"][1]+0.1)] if it.get("cutaway") else []):
        d=f"{out}/{i:03d}{tag}"; os.makedirs(d,exist_ok=True)
        if os.listdir(d): continue
        x,y,w,h=crop
        subprocess.check_call(["ffmpeg","-v","error","-ss",str(it["in"]),"-i",src,"-t",f"{dur+0.1:.3f}","-vf",
          f"crop={w}:{h}:{x}:{y},scale=1280:720:flags=lanczos,unsharp=5:5:0.6,fps=30","-q:v","3",f"{d}/%05d.jpg"])
with ThreadPoolExecutor(4) as ex: list(ex.map(job,enumerate(e["items"])))
print("ok")
