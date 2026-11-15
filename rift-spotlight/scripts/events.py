"""Single source of truth for animation/SFX event times (seconds). Read by Remotion and the audio engine."""
import json
TL = json.load(open("video/src/timeline.json"))
B = 60 / TL["bpm"]
S = TL["shift"]
def w(line, i): return next(l for l in TL["lines"] if l["id"] == line)["words"][i]["t"]
E = {
  "cuts": [7.0, 10.5 + S, 17.0 + S, 33.0 + S, 39.5 + S],
  "shift": S,
  # hook: four route legs on "four steps", three chains on "three chains"
  "legs": [round(w("hook", 9) + i * 0.11, 3) for i in range(4)],
  "chainsLit": round(w("hook", 12), 3),
  # problem
  "rows": [round(w("problem", 1) + 0.12 + i * 0.16, 3) for i in range(3)],
  "rowSettle": [round(w("problem", 5) + 0.2 + i * 0.12, 3) for i in range(3)],
  "hunt": [round(w("problem", 6) + 0.04 + i * B, 3) for i in range(5)],
  # solution
  "logoIn": round(w("solution", 0) - 0.08, 3),
  "logoFly": 11.95 + S,
  "typeFrom": [12.12 + S, 12.5 + S],
  "typeTo": [13.1 + S, 13.48 + S],
  "results": round(w("solution", 11), 3),
  "quoteSettle": round(w("solution", 15), 3),
  "cursor": [15.3 + S, 15.9 + S],
  "click": 16.0 + S,
  # routing
  "pullback": 17.0 + S,
  "stations": round(w("routing", 3), 3),
  "venues": round(w("routing", 6), 3),
  "chains": round(w("routing", 10), 3),
  "requote": [round(w("routing", 12), 3), 22.88 + S],
  "lock": 23.0 + S,
  # reliability
  "deposit": [round(w("reliability", 5) - 0.2, 3), round(w("reliability", 6), 3)],
  "funded": 26.75 + S,
  "hops": [[a + S, b + S] for a, b in [[26.9, 27.35], [27.4, 27.85], [27.9, 28.35]]],
  "fail": 28.5 + S,
  "scan": [round(w("reliability", 15) + 0.12 * i, 3) for i in range(4)],
  "relock": 30.5 + S,
  "resume": [30.75 + S, 31.4 + S],
  "out": [31.45 + S, 31.85 + S],
  "delivered": 32.0 + S,
  # coverage
  "chainWords": [w("coverage", i) for i in range(6)],
  "zero": w("coverage", 7),
  # close
  "closeLogo": 40.0 + S,
  "endCard": 42.75 + S,
  "credit": 43.6 + S,
  "end": TL["duration"],
}
json.dump(E, open("video/src/events.json", "w"), indent=1)
print(json.dumps(E))
