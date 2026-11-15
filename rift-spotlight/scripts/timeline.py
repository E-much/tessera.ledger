"""Place each VO line so its anchor word lands on the 120 BPM beat grid; emit timeline.json."""
import json
BPM = 120; BEAT = 60 / BPM
words = json.load(open("audio/vo/words.json"))
# line start times (s). Chosen so anchor words land on beats:
#  hook     starts on beat 1           (0.50)
#  problem  starts on beat             (5.50)
#  solution "click." on beat 32        (16.00)
#  routing  "step." on beat 46         (23.00)
#  reliab.  "down" on beat 57          (28.50)
#  coverage "Zero" on beat 75          (37.50)
#  close    "Rift" on the downbeat     (40.00)
START = {"hook": 0.5, "problem": 5.5, "solution": 16.0 - 5.30, "routing": 23.0 - 6.00,
         "reliability": 28.5 - 3.70, "coverage": 37.5 - 4.04, "close": 40.0}
DURATION = 47.0
out = {"fps": 60, "bpm": BPM, "duration": DURATION, "lines": []}
for L in words:
    s = START[L["id"]]
    out["lines"].append({"id": L["id"], "start": round(s, 3), "text": L["text"],
                         "words": [{"w": w["w"], "t": round(s + w["s"], 3), "e": round(s + w["e"], 3)} for w in L["words"]]})
json.dump(out, open("video/src/timeline.json", "w"), indent=1)
for L in out["lines"]:
    print(L["id"], L["start"], "->", L["words"][-1]["e"])
