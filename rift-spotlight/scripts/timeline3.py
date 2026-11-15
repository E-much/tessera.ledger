"""Shot list for 'the hunt': every beat tied to a spoken word. Writes timeline.json + events.json."""
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

E = {
    # 1. the ask (generic app)
    "askIn": 0.2, "typePay": w("setup", 5), "typeGet": w("setup", 8),
    # 2-4. three quotes, three cancels
    "q": [w("q1", 0), w("q2", 0), w("q3", 0)],
    "feelsLow": w("q1", 4), "better": w("q2", 5), "isBest": w("q2", 7), "moved": w("q3", 4),
    "cancel": [round(w("q2", 0) - 0.3, 3), round(w("q3", 0) - 0.3, 3), None],
    "sweep": round(w("rift", 0) - 0.25, 3),
    # 5. rift
    "riftIn": w("rift", 0), "venues": w("rift", 7), "venuesEnd": w("rift", 13), "route": w("rift", 14),
    "chains": w("rift", 23), "result": round(end("rift") - 0.05, 3),
    # 6. click + fees
    "click": w("click", 1), "fees": w("click", 2),
    # 7. close
    "closeLogo": w("close", 0), "headline": w("close", 1), "card": round(end("close") + 0.5, 3),
}
E["end"] = round(E["card"] + 3.1, 3)
# cuts (for whooshes) + music compatibility
E["cuts"] = [E["q"][0] - 0.1, E["q"][1] - 0.15, E["q"][2] - 0.15, E["sweep"], E["click"] - 0.6, E["fees"] - 0.12, E["closeLogo"] - 0.15, E["card"]]
E["shots"] = [{"id": "bridge", "t0": E["q"][0]}, {"id": "logo", "t0": E["riftIn"]}, {"id": "route", "t0": E["venues"]},
              {"id": "close", "t0": E["closeLogo"] - 0.15}, {"id": "card", "t0": E["card"]}, {"id": "fees", "t0": E["fees"]},
              {"id": "unsure", "t0": E["q"][2]}]
E["lock"] = E["result"]; E["fail"] = 999.0; E["relock"] = 999.0
json.dump({"fps": 60, "bpm": 120, "duration": E["end"], "lines": lines}, open("video/src/timeline.json", "w"), indent=1)
json.dump(E, open("video/src/events.json", "w"), indent=1)
print(json.dumps({k: v for k, v in E.items() if k not in ("shots",)}))
