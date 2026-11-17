import json, os, subprocess
from concurrent.futures import ThreadPoolExecutor
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
e=json.load(open(f"{R}/build/v2/edl.json"))
def job(a):
    i,b=a; d=f"{R}/build/v2/broll/{i:02d}"; os.makedirs(d,exist_ok=True)
    if len(os.listdir(d))>5: return
    subprocess.check_call(["ffmpeg","-v","error","-ss",str(b["in"]),"-i",f"{R}/build/broll/{b['src']}.webm","-t",f"{b['dur']+0.2:.2f}",
      "-vf","scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30","-q:v","3",f"{d}/%05d.jpg"])
with ThreadPoolExecutor(4) as ex: list(ex.map(job,enumerate(e["broll"])))
print("ok",len(e["broll"]))
