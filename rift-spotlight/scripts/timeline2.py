"""Shot list for the reference-style edit: one idea per shot, every cut tied to a spoken word.
Writes video/src/timeline.json + video/src/events.json (events also drive the SFX/music)."""
import json

LEAD = 0.5
W = {L["id"]: L for L in json.load(open("audio/vo/words.json"))}
lines = []
for L in W.values():
    s = LEAD + L["offset"]
    lines.append({"id": L["id"], "start": round(s, 3), "text": L["text"],
                  "words": [{"w": w["w"], "t": round(s + w["s"], 3), "e": round(s + w["e"], 3)} for w in L["words"]]})

def w(lid, i, k="t"):
    return next(l for l in lines if l["id"] == lid)["words"][i][k]

def end(lid):
    return next(l for l in lines if l["id"] == lid)["words"][-1]["e"]

X = 0.12  # cut lands just before the word that motivates it
shots = [
    ("simple", 0.0, w("pain", 6) - X),
    ("bridge", w("pain", 6) - X, w("pain", 10) - X),
    ("fees", w("pain", 10) - X, w("pain", 13) - X),
    ("unsure", w("pain", 13) - X, w("meet", 0) - X),
    ("logo", w("meet", 0) - X, w("meet", 2) - X),
    ("pick", w("meet", 2) - X, w("route", 0) - X),
    ("route", w("route", 0) - X, w("nos", 0) - X),
    ("nos", w("nos", 0) - X, w("close", 0) - X),
    ("close", w("close", 0) - X, end("close") + 0.45),
    ("card", end("close") + 0.45, end("close") + 3.4),
]
E = {
    "shots": [{"id": i, "t0": round(a, 3), "t1": round(b, 3)} for i, a, b in shots],
    "cuts": [round(a, 3) for _, a, _ in shots[1:]],
    # beats inside shots
    "pickFrom": w("meet", 2), "pickTo": w("meet", 6), "trade": w("meet", 11), "click": w("meet", 12),
    "hop0": w("route", 1), "hop1": w("route", 5), "venues": w("route", 6), "result": w("route", 9),
    "nos": [w("nos", 0), w("nos", 2), w("nos", 5)],
    "closeLogo": w("close", 0), "best": w("close", 1), "oneClick": w("close", 5),
    # compatibility keys for the music engine (no drop-out in this cut)
    "lock": w("route", 9), "fail": 999.0, "relock": 999.0,
    "end": round(end("close") + 3.4, 3),
}
DUR = E["end"]
json.dump({"fps": 60, "bpm": 120, "duration": DUR, "lines": lines}, open("video/src/timeline.json", "w"), indent=1)
json.dump(E, open("video/src/events.json", "w"), indent=1)
for s in E["shots"]:
    print(f'{s["id"]:8s} {s["t0"]:6.2f} → {s["t1"]:6.2f}  ({s["t1"]-s["t0"]:.2f}s)')
print("duration", DUR)
