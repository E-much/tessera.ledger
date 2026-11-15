"""Single source of truth for animation/SFX event times (seconds). Read by Remotion and the audio engine."""
import json
TL = json.load(open("video/src/timeline.json"))
B = 60 / TL["bpm"]
def w(line, i): return next(l for l in TL["lines"] if l["id"] == line)["words"][i]["t"]
E = {
  "cuts": [5.0, 10.5, 17.0, 33.0, 39.5],
  # hook
  "tabs": [round(w("hook", 6) + i * 0.075, 3) for i in range(5)],
  "bridges": [round(w("hook", 8) + i * 0.12, 3) for i in range(3)],
  "prayer": w("hook", 12),
  # problem
  "rows": [round(w("problem", 1) + 0.12 + i * 0.16, 3) for i in range(3)],
  "rowSettle": [round(w("problem", 5) + 0.2 + i * 0.12, 3) for i in range(3)],
  "hunt": [round(w("problem", 6) + 0.04 + i * B, 3) for i in range(5)],
  # solution
  "logoIn": round(w("solution", 0) - 0.08, 3),
  "logoFly": 11.95,
  "typeFrom": [12.12, 12.5],
  "typeTo": [13.1, 13.48],
  "results": round(w("solution", 11), 3),
  "quoteSettle": round(w("solution", 15), 3),
  "cursor": [15.3, 15.9],
  "click": 16.0,
  # routing
  "pullback": 17.0,
  "stations": round(w("routing", 3), 3),
  "venues": round(w("routing", 6), 3),
  "chains": round(w("routing", 10), 3),
  "requote": [round(w("routing", 12), 3), 22.88],
  "lock": 23.0,
  # reliability
  "deposit": [round(w("reliability", 5) - 0.2, 3), round(w("reliability", 6), 3)],
  "funded": 26.75,
  "hops": [[26.9, 27.35], [27.4, 27.85], [27.9, 28.35]],
  "fail": 28.5,
  "scan": [round(w("reliability", 15) + 0.12 * i, 3) for i in range(4)],
  "relock": 30.5,
  "resume": [30.75, 31.4],
  "out": [31.45, 31.85],
  "delivered": 32.0,
  # coverage
  "chainWords": [w("coverage", i) for i in range(6)],
  "zero": w("coverage", 7),
  # close
  "closeLogo": 40.0,
  "endCard": 43.5,
  "credit": 44.5,
  "end": TL["duration"],
}
json.dump(E, open("video/src/events.json", "w"), indent=1)
print(json.dumps(E))
