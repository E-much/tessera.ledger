"""Builds the v2 edit decision list from podcast transcripts.
Output: build/v2/edl.json  (all times in seconds on the output timeline)"""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIPS = os.path.join(ROOT, "build/clips")
SRC = {"A": "2094167238983274732", "B": "2094126440652439791", "C": "2094029378086719867", "D": "2093976884803490083"}
WORDS = {}
for k, v in SRC.items():
    ws = [w for w in json.load(open(f"{CLIPS}/{v}.stt.json"))["words"] if w["type"] == "word"]
    WORDS[k] = [w for w in ws if w.get("speaker_id") in (None, "speaker_0")]
FILLER = re.compile(r"^(um+|uh+|uh-huh)[,.]?$", re.I)
STUTTER_OK = 0.35   # max natural gap kept inside one piece

def pieces(src, t0, t1, strip=True):
    ws = [w for w in WORDS[src] if w["start"] >= t0 - 0.06 and w["end"] <= t1 + 0.12]
    keep = [w for w in ws if not (strip and FILLER.match(w["text"].strip()))]
    runs, cur = [], []
    for w in keep:
        if cur and (w["start"] - cur[-1]["end"] > STUTTER_OK or (strip and any(
                FILLER.match(f["text"]) for f in ws if cur[-1]["end"] <= f["start"] < w["start"]))):
            runs.append(cur); cur = []
        cur.append(w)
    if cur: runs.append(cur)
    # merge very short runs into neighbours to avoid choppy audio
    out = []
    for r in runs:
        if out and (r[-1]["end"] - r[0]["start"] < 0.45):
            out[-1] = out[-1] + r
        else:
            out.append(r)
    res = []
    for r in out:
        a, b = r[0]["start"] - 0.05, r[-1]["end"] + 0.10
        res.append({"src": src, "in": round(max(a, 0), 3), "out": round(b, 3), "words": r})
    return res

# ---------------- the cut ----------------
COLD = [("C", 83.6, 85.6), ("A", 69.3, 71.4), ("A", 73.3, 77.45), ("D", 135.9, 137.7),
        ("B", 60.3, 62.45), ("D", 159.9, 162.25), ("A", 124.0, 131.4)]
CHAPTERS = [
    ("The IPO used to be the door.", [("A", 57.4, 71.4)]),
    ("Now they stay private.", [("A", 2.25, 27.1), ("A", 27.3, 49.0), ("A", 72.0, 94.0), ("A", 100.4, 116.0)]),
    ("From Wall Street to blockchain.", [("C", 6.1, 21.6), ("C", 39.0, 48.22), ("C", 48.38, 75.58)]),
    ("Why retail was locked out.", [("B", 8.95, 23.0), ("D", 9.6, 26.8), ("D", 99.2, 114.5), ("D", 115.2, 137.7)]),
    ("What changes.", [("D", 137.9, 156.7), ("D", 157.1, 172.7), ("B", 23.4, 70.6), ("B", 84.6, 90.3)]),
    ("Closing the gap.", [("C", 78.6, 99.2), ("A", 124.0, 131.4)]),
]
# word (lowercased, punctuation stripped) -> slam text, per source
SLAMS = {
    ("A", "democratizing"): "DEMOCRATIZING", ("A", "inverted"): "INVERTED.",
    ("A", "fifteen"): "12–15 YEARS PRIVATE", ("A", "rerating"): "AFTER THE RERATING",
    ("A", "mature"): "MATURE VALUATION", ("A", "gap"): "THE ACCESS GAP",
    ("C", "seventeen"): "17 YEARS", ("C", "retail"): "OFF LIMITS TO RETAIL",
    ("B", "disclosure"): "② INFORMATION DISCLOSURE", ("B", "one"): "① SETTLEMENT RISK",
    ("D", "true"): "NOT INSTANT.", ("D", "three"): "T+2 · T+3", ("D", "inefficient"): "VERY, VERY INEFFICIENT",
    ("D", "atomic"): "ATOMIC SETTLEMENT", ("D", "mine"): "NO COUNTERPARTY RISK", ("D", "profound"): "PROFOUND.",
    ("D", "transforming"): "TRULY TRANSFORMING", ("B", "twenty-four"): "24/7 ON CHAIN",
    ("B", "alleviated"): "ALLEVIATED", ("B", "blurring"): "PUBLIC ⇄ PRIVATE",
    ("C", "tokenization"): "TOKENIZATION",
}
BEHIND = {"INVERTED.", "12–15 YEARS PRIVATE", "THE ACCESS GAP", "17 YEARS", "ATOMIC SETTLEMENT", "PROFOUND.", "24/7 ON CHAIN", "TOKENIZATION"}
CAM = {"A": (0, 286, 958, 539), "B": (0, 286, 958, 539), "C": (0, 286, 958, 539), "D": (0, 191, 638, 359)}
HOST = {"A": (962, 286, 958, 539), "B": (962, 286, 958, 539), "C": (962, 286, 958, 539), "D": (641, 191, 638, 359)}

def norm(t): return re.sub(r"[^a-z0-9\-]", "", t.lower())

items, caps, slams, sfx, cards, broll = [], [], [], [], [], []
T = 0.0
used_slams = set()
zoom_toggle = 0

def add_piece(p, kind="clip", z=None, slam_ok=True, caption=True):
    global T, zoom_toggle
    d = p["out"] - p["in"]
    if z is None:
        zoom_toggle ^= 1; z = 1.0 if zoom_toggle else 1.16
    it = {"kind": kind, "src": p["src"], "in": p["in"], "out": p["out"], "start": round(T, 3), "dur": round(d, 3),
          "zoom": z, "cam": CAM[p["src"]], "host": HOST[p["src"]]}
    items.append(it)
    if caption:
        for w in p["words"]:
            caps.append({"t0": round(T + w["start"] - p["in"], 3), "t1": round(T + w["end"] - p["in"], 3), "w": w["text"]})
    if slam_ok:
        for w in p["words"]:
            key = (p["src"], norm(w["text"]))
            if key in SLAMS and key not in used_slams:
                used_slams.add(key)
                slams.append({"t": round(T + w["start"] - p["in"], 3), "text": SLAMS[key], "behind": SLAMS[key] in BEHIND})
    T += d
    return it

# --- cold open
cards.append({"start": 0, "dur": 1.6, "kind": "black_type", "text": "THE ACCESS GAP."}); sfx.append({"t": 0.1, "n": "drop"}); T = 1.6
for i, (s, a, b) in enumerate(COLD):
    ps = pieces(s, a, b)
    sfx.append({"t": round(T, 3), "n": "glitch" if i % 2 else "click"})
    for p in ps: add_piece(p, kind="cold", z=1.08 + 0.06 * (i % 3), slam_ok=False)
    items[-1]["flash_out"] = True
    T += 0.12
cards.append({"start": round(T, 3), "dur": 5.0, "kind": "logo"}); sfx.append({"t": round(T, 3), "n": "hit"}); T += 5.0

# --- chapters
for ci, (title, bites) in enumerate(CHAPTERS):
    cards.append({"start": round(T, 3), "dur": 2.8, "kind": "chapter", "text": title, "n": ci + 1})
    sfx.append({"t": round(T, 3), "n": "whoosh"}); T += 2.8
    for bi, (s, a, b) in enumerate(bites):
        ps = pieces(s, a, b)
        first = None
        for pi, p in enumerate(ps):
            it = add_piece(p)
            first = first or it
            # host cutaway hides every 3rd jump cut on long bites
            if pi % 3 == 2 and it["dur"] > 3.0:
                it["cutaway"] = [0.0, min(1.6, it["dur"] * 0.4)]
        if ci == 0 and bi == 0:
            first["lower_third"] = ["DR. CHAN AHN", "CEO, TESSERA  ·  via CODE AND CONCRETE"]
        T += 0.0
    if ci < len(CHAPTERS) - 1:
        sfx.append({"t": round(T - 0.6, 3), "n": "riser"})

# --- end
cards.append({"start": round(T, 3), "dur": 7.5, "kind": "end"}); sfx.append({"t": round(T, 3), "n": "hit"}); T += 7.5
cards.append({"start": round(T, 3), "dur": 5.0, "kind": "credits"}); T += 5.0

# ---- B-roll over dialogue, anchored to phrases
BROLL = [  # just a few, only where the picture really matches the words
    ("steepest", "f9_a", 11.0, 4.2), ("buy and sell stocks", "midtown_day", 39.6, 3.4),
    ("human history", "earth", 107.0, 3.6), ("blurring", "midtown_night", 184.0, 3.0),
    ("private equity space", "f9_b", 6.0, 3.6),
]
toks = [norm(c["w"]) for c in caps]
def find(ph, after=0):
    ws = [norm(w) for w in ph.split()]
    for i in range(len(toks)):
        if caps[i]["t0"] >= after and toks[i:i + len(ws)] == ws: return caps[i]["t0"]
    return None
for ph, src_, at_, d in BROLL:
    t = find(ph, 25)
    if t is None: print("phrase not found:", ph); continue
    t -= 0.15
    for sl in slams:  # keep slams on the speaker
        if t < sl["t"] + 1.15 and t + d > sl["t"] - 0.1: t = sl["t"] + 1.15
    it = next((i for i in items if i["start"] <= t < i["start"] + i["dur"]), None)
    if it is None: print("no clip under", ph); continue
    broll.append({"t": round(t, 3), "dur": d, "src": src_, "in": at_})
    sfx.append({"t": round(t, 3), "n": "whoosh"})
for b in broll:  # don't show host cutaway while b-roll is up
    for i in items:
        if i.get("cutaway") and b["t"] < i["start"] + i["cutaway"][1] and b["t"] + b["dur"] > i["start"]: i.pop("cutaway")
for s in slams: sfx.append({"t": round(s["t"] - 0.05, 3), "n": "click"})
edl = {"duration": round(T, 3), "items": items, "captions": caps, "slams": slams, "sfx": sorted(sfx, key=lambda e: e["t"]),
       "cards": cards, "src": SRC, "broll": broll}
os.makedirs(f"{ROOT}/build/v2", exist_ok=True)
json.dump(edl, open(f"{ROOT}/build/v2/edl.json", "w"), indent=1)
print(f"duration {T:.1f}s  pieces {len(items)}  slams {len(slams)}/{len(SLAMS)}  captions {len(caps)}")
missing = set(SLAMS) - used_slams
if missing: print("unused slams:", missing)
