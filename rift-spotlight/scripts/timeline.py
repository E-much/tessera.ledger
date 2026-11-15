"""Build timeline.json (VO placement) and events.json (every animation/SFX time) from the VO word timings.

Rules
- 120 BPM grid. Each line is placed so its anchor word lands on a beat, with a minimum breath after the
  previous line. The close starts on a bar downbeat (music resolves there).
- Every visual/SFX event is expressed relative to VO words, so swapping the voice re-syncs everything.
"""
import json, math

BPM = 120
B = 60 / BPM
BAR = 4 * B
W = {L["id"]: L for L in json.load(open("audio/vo/words.json"))}

def dur(id_):
    return W[id_]["words"][-1]["e"]

# (line, anchor word index, min breath before the line in seconds)
PLAN = [
    ("hook", 0, 0.0),
    ("problem", 0, 0.55),
    ("solution", 18, 0.5),   # "click." on the beat
    ("routing", 0, 0.5),
    ("reliability", 12, 1.25),  # "down" on the beat (room for the lock + travel before it)
    ("coverage", 7, 0.7),    # "Zero" on the beat
    ("close", 0, 0.9),       # "Rift." on a bar downbeat
]

# The VO is ONE continuous take: keep its natural timing exactly (no re-spacing of lines).
LEAD = 0.5
start = {lid: round(LEAD + W[lid].get("offset", 0.0), 3) for lid, *_ in PLAN}

lines = []
for lid, *_ in PLAN:
    L = W[lid]
    lines.append({"id": lid, "start": start[lid], "text": L["text"],
                  "words": [{"w": w["w"], "t": round(start[lid] + w["s"], 3), "e": round(start[lid] + w["e"], 3)} for w in L["words"]]})

def w(lid, i, key="t"):
    return next(l for l in lines if l["id"] == lid)["words"][i][key]

def end(lid):
    return next(l for l in lines if l["id"] == lid)["words"][-1]["e"]

up = lambda t: math.ceil(t / B - 1e-9) * B   # next beat
down = lambda t: math.floor(t / B + 1e-9) * B

E = {}
# cuts land on the beat just before each new section's first word
E["cuts"] = [round(w(x, 0) - 0.25, 3) for x in ("problem", "solution", "routing", "coverage")] + [round(w("close", 0) - 0.25, 3)]
# hook
E["doubt"] = round(w("hook", 12) - 0.18, 3)  # receipt arrives on "Honestly"; best-available starts re-rolling
E["cantTell"] = w("hook", 14)       # "can't tell"
# problem
E["rows"] = [round(w("problem", 6) + 0.1 + i * 0.16, 3) for i in range(3)]
E["rowSettle"] = [round(w("problem", 11) + i * 0.12, 3) for i in range(3)]
E["gap"] = w("problem", 14)         # "four thousand"
# solution
E["logoIn"] = round(w("solution", 0) - 0.08, 3)
E["logoFly"] = round(w("solution", 3) - 0.1, 3)
E["typeFrom"] = [round(w("solution", 3) + 0.12, 3), w("solution", 6)]
E["typeTo"] = [round(w("solution", 7) + 0.05, 3), w("solution", 10)]
E["results"] = w("solution", 11)
E["quoteSettle"] = w("solution", 15)
E["click"] = w("solution", 18)
E["cursor"] = [round(E["click"] - 0.7, 3), round(E["click"] - 0.1, 3)]
# routing
E["pullback"] = E["cuts"][2]
E["stations"] = w("routing", 3)
E["venues"] = w("routing", 6)
E["chains"] = w("routing", 10)
E["lock"] = round(w("routing", 17) + 0.05, 3)  # "step."
E["requote"] = [w("routing", 11), round(E["lock"] - 0.12, 3)]
# reliability
E["deposit"] = [round(w("reliability", 5) - 0.2, 3), w("reliability", 6, "e")]
E["fail"] = w("reliability", 12)    # on the beat ("down")
_h0 = w("reliability", 6, "e") + 0.12  # funds land right after "address."
_hl = (E["fail"] - 0.12 - _h0) / 3
E["hops"] = [[round(_h0 + k * _hl, 3), round(_h0 + (k + 0.85) * _hl, 3)] for k in range(3)]
E["funded"] = round(E["hops"][0][0] - 0.05, 3)
E["scan"] = [round(w("reliability", 14) + 0.12 * i, 3) for i in range(4)]
E["relock"] = round(E["scan"][-1] + 0.2, 3)
E["resume"] = [round(E["relock"] + 0.25, 3), round(E["relock"] + 0.9, 3)]
E["out"] = [round(E["resume"][1] + 0.05, 3), round(E["resume"][1] + 0.45, 3)]
E["delivered"] = round(E["out"][1] + 0.05, 3)
# coverage
E["chainWords"] = [w("coverage", i) for i in range(6)]
E["zero"] = w("coverage", 7)
# close
E["closeLogo"] = w("close", 0)
E["endCard"] = round(end("close") + 0.6, 3)
E["credit"] = round(E["endCard"] + 0.6, 3)
E["end"] = round(E["credit"] + 2.2, 3)

DUR = E["end"]
json.dump({"fps": 60, "bpm": BPM, "duration": DUR, "lines": lines}, open("video/src/timeline.json", "w"), indent=1)
json.dump(E, open("video/src/events.json", "w"), indent=1)
for L in lines:
    print(f'{L["id"]:12s} {L["start"]:6.2f} → {L["words"][-1]["e"]:6.2f}')
print("cuts", E["cuts"], "lock", E["lock"], "funded", E["funded"], "deposit end", E["deposit"][1], "duration", DUR)
assert E["hops"][0][1] - E["hops"][0][0] > 0.2, "hops too short"
assert DUR <= 60
