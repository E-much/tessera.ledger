"""'The errand': timeline + events from the VO words (story told in the creator's own words)."""
import json

LEAD = 0.4
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

E = {
    # 1. her stall, then the others
    "herStall": w("boy", 9), "others": w("boy", 18),
    # 2. the excuses
    "reasons": [w("excuses", 4), w("excuses", 6), w("excuses", 8), w("excuses", 17)], "excuses": w("excuses", 24),
    # 3-4. the younger ones run the errand
    "street": w("grew", 0), "runner": w("grew", 6),
    "pass": w("kids", 8), "cheap": w("kids", 13), "walk": w("kids", 16), "buy": w("kids", 21),
    # 5. that's what Rift does → the street becomes Rift
    "morph": w("thats", 2),
    # 6. Rift UI
    "sweep": round(w("rift", 0) - 0.35, 3), "riftIn": w("rift", 0), "venues": w("rift", 3), "venuesEnd": w("rift", 8), "route": w("rift", 14), "chains": w("rift", 24),
    "result": round(end("rift") - 0.1, 3),
    # 7. phone, no stimmy, zero fees
    "phoneIn": w("stimmy", 0) - 0.1, "click": w("stimmy", 7), "fees": w("stimmy", 11),
    # 8. close
    "closeLogo": w("close", 0), "headline": w("close", 1), "card": round(end("close") + 0.45, 3),
}
E["end"] = round(E["card"] + 2.9, 3)
E["cuts"] = [E["street"] - 0.2, E["morph"] - 0.2, E["riftIn"] - 0.2, E["phoneIn"], E["fees"] - 0.12, E["closeLogo"] - 0.15, E["card"]]
E["shots"] = [{"id": "bridge", "t0": E["excuses"]}, {"id": "logo", "t0": E["morph"]}, {"id": "route", "t0": E["venues"]},
              {"id": "close", "t0": E["closeLogo"] - 0.15}, {"id": "card", "t0": E["card"]}, {"id": "fees", "t0": E["fees"]}]
E["lock"] = E["result"]; E["fail"] = 999.0; E["relock"] = 999.0
json.dump({"fps": 60, "bpm": 120, "duration": E["end"], "lines": lines}, open("video/src/timeline.json", "w"), indent=1)
json.dump(E, open("video/src/events.json", "w"), indent=1)
print(json.dumps({k: v for k, v in E.items() if k != "shots"}))
