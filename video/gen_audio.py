import json, os, subprocess, urllib.request
H={"xi-api-key":"dummy","Content-Type":"application/json"}
VOICE="nPczCjzI2devNBz1zQrb"
def post(url,body,out):
    if os.path.exists(out) and os.path.getsize(out)>1000: return
    r=urllib.request.Request(url,data=json.dumps(body).encode(),headers=H,method="POST")
    with urllib.request.urlopen(r) as resp, open(out,"wb") as f: f.write(resp.read())
cues=json.load(open("cues.json"))
prev=None
for c in cues:
    if not c.get("vo"): continue
    post(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
      {"text":c["vo"],"model_id":"eleven_multilingual_v2",
       "voice_settings":{"stability":0.55,"similarity_boost":0.8,"style":0.15,"speed":0.92}},
      f"build/vo/{c['id']}.mp3")
    print("vo",c["id"])
for name,prompt,d in [("hit","deep cinematic sub bass boom impact with long dark reverb tail, trailer hit",5),
                      ("riser","slow dark cinematic tension riser swelling, airy synth whoosh building up",5),
                      ("tick","soft digital interface click, subtle data blip, clean UI sound",1)]:
    post("https://api.elevenlabs.io/v1/sound-generation",{"text":prompt,"duration_seconds":d,"prompt_influence":0.5},f"build/sfx/{name}.mp3")
    print("sfx",name)
