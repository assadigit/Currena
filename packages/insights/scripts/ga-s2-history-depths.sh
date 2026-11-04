#!/usr/bin/env bash
# ga-s2-history-depths.sh — GA-S2-completion (gold meter audit) read-only
# history-depth measurement. Keyless, fetchless, write-free: reads ONLY the
# committed corpus fixture (the gold-corpus-dump record) and the source files.
# Never runs the production worker, never touches KV (03 §2's rule).
#
# Measures, per gold-lane voter (03 §2 "the history depth each voter's
# decade-extreme percentile actually sees"):
#   1. THE STAGED SERIES DEPTH — the corpus's staged series for each voter:
#      point count, first/last date, the trailing-3650-day percentile base
#      (scoring.ts's PERCENTILE_WINDOW_DAYS=3650, percentileBase excludes the
#      current point), whether the level leg exists (base >= MIN_PERCENTILE_OBS
#      = 30, scoring.ts:72), and whether a 30-day move input exists (a point
#      within CHANGE30D_TOLERANCE_DAYS=5 of last-30d, scoring.ts:86/387-403).
#   2. THE ARCHIVE-DAY TRUTH — over the corpus's recorded archive days (the
#      raw archive JSON pre-parse, the GB-S7 rule): for each voter, how many
#      recorded days carried change30d / percentile10y on the actual readings
#      — the wire truth evalLeg could reach, day by day.
#   3. THE H2 VERDICT — the base count against 03 §4 H2's ~250-point bar and
#      the resulting fire-ability class (both legs / level-only / none).
#
# Evidence for docs/specs/gold-meter-audit/evidence/wiring.md §3. Requires
# python3. Usage:
#   bash packages/insights/scripts/ga-s2-history-depths.sh
set -u
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"

python3 - "$REPO_ROOT" <<'PYEOF'
import json, re, sys
from datetime import date, timedelta

root = sys.argv[1]

# --- The voters, parsed read-only from gold-score.ts (the scan §2 precedent).
gs_src = open(f"{root}/packages/insights/src/gold-score.ts").read()
block = re.search(r"export const GOLD_LANE_VOTERS[^=]*=\s*\[(.*?)\];", gs_src, re.S).group(1)
voters = []
for m in re.finditer(r"\{\s*lane:\s*'([^']+)',\s*id:\s*'([^']+)',\s*polarity:\s*(-?\d+)\s*\}", block):
    ln = gs_src[:m.start()].count("\n") + 1
    voters.append((m.group(2), m.group(1), int(m.group(3)), ln))

corpus = json.load(open(f"{root}/packages/insights/fixtures/gold-backtest-corpus.json"))
print("=" * 72)
print("GA-S2 HISTORY DEPTHS — corpus:", corpus["recordedAt"])
print("  venues: stage", corpus["venues"]["stage"]["seriesCount"], "series @",
      corpus["venues"]["stage"]["writtenAt"], "| goldHist",
      corpus["venues"]["goldHist"]["points"], "pts | archives",
      corpus["venues"]["archives"]["days"], "days | histFallback ids:",
      corpus["venues"]["histFallback"]["ids"])
print("=" * 72)

EPOCH = date(1970, 1, 1)

def pd_(p):
    return int(p[0]) if not isinstance(p, dict) else int(p["date"])

def d(x):
    return EPOCH + timedelta(days=int(x))

def points_of(s):
    return s["points"] if isinstance(s, dict) else s

def base_of(points):
    """percentileBase (scoring.ts:115-120): trailing 3650d of the level,
    current point excluded; level leg exists when >= 30 (scoring.ts:72)."""
    last = d(pd_(points[-1]))
    lo = last - timedelta(days=3650)
    vals = [p for p in points if lo < d(pd_(p)) < last]
    return len(vals)

def move_input_of(points):
    """windowChange(series, current, 30) (scoring.ts:387-403): a point within
    5 days of last-30d (CHANGE30D_TOLERANCE_DAYS, scoring.ts:86)."""
    last = d(pd_(points[-1]))
    target = last - timedelta(days=30)
    cands = [p for p in points if d(pd_(p)) <= target and abs((d(pd_(p)) - target).days) <= 5]
    return bool(cands)

print()
print("1. THE STAGED SERIES DEPTH (the corpus's staged series per voter)")
print("-" * 72)
print(f"{'id':24s} {'n':>6s} {'first':>11s} {'last':>11s} {'base10y':>8s} {'lvl>=30':>8s} {'mv30d':>6s}")
depths = {}
for vid, lane, pol, ln in voters:
    s = corpus["series"].get(vid)
    if not s:
        print(f"{vid:24s}      — ABSENT FROM THE CORPUS —")
        depths[vid] = None
        continue
    pts = points_of(s)
    b = base_of(pts)
    mv = move_input_of(pts)
    depths[vid] = (len(pts), b, mv)
    print(f"{vid:24s} {len(pts):6d} {str(d(pd_(pts[0]))):>11s} {str(d(pd_(pts[-1]))):>11s} {b:8d} {'YES' if b >= 30 else 'NO':>8s} {'y' if mv else '-':>6s}")
# the evalLeg companions in the corpus (not seats; wiring.md §3 references)
for vid in ("gold-usd", "breakeven-10y", "t5yie"):
    s = corpus["series"].get(vid)
    if s:
        pts = points_of(s)
        print(f"({vid}: companion series, {len(pts)} pts, first {d(pd_(pts[0]))}, last {d(pd_(pts[-1]))})")
gh = corpus["goldHist"]["points"]
print(f"(goldHist: gold-usd history key, {len(gh)} pts, first {d(pd_(gh[0]))}, last {d(pd_(gh[-1]))})")

print()
print("2. THE ARCHIVE-DAY TRUTH (the raw archive readings — what evalLeg")
print("   could actually reach on each recorded day)")
print("-" * 72)
days = sorted(corpus["archives"].keys())
print(f"recorded days: {len(days)} ({days[0]} .. {days[-1]})")
print(f"{'id':24s} {'present':>8s} {'ch30d':>6s} {'pct10y':>7s} {'both':>5s} {'either':>7s}  last-day asOf/status")
arch = {}
for vid, lane, pol, ln in voters:
    pres = ch = pc = both = 0
    last_day_state = "-"
    for day in days:
        r = next((x for x in corpus["archives"][day]["readings"] if x.get("id") == vid), None)
        if r is None:
            continue
        pres += 1
        c = r.get("change30d") is not None
        p = r.get("percentile10y") is not None
        ch += c
        pc += p
        both += (c and p)
        last_day_state = f"{r.get('asOf')} / {r.get('status')}"
    arch[vid] = (pres, ch, pc, both, last_day_state)
    either = ch + pc - both
    print(f"{vid:24s} {pres:5d}/{len(days):<2d} {ch:6d} {pc:7d} {both:5d} {either:7d}  {last_day_state}")

print()
print("3. THE H2 VERDICT (03 §4 H2: the decade-extreme percentile wants")
print("   >= ~250 points behind it; the suspects get their numbers here)")
print("-" * 72)
for vid, lane, pol, ln in voters:
    if depths.get(vid) is None:
        print(f"{vid:24s} NO STAGED SERIES IN THE CORPUS — TRACE-BROKEN")
        continue
    n, b, mv = depths[vid]
    pres, ch, pc, both, _ = arch[vid]
    bar = "PASS" if b >= 250 else "THIN" if b >= 30 else "NO-LEG"
    legs = "move+level" if (mv and b >= 30) else ("level-only" if b >= 30 else ("move-only" if mv else "NONE"))
    print(f"{vid:24s} base {b:5d} [{bar:6s}] legs: {legs:10s} archive: ch {ch}/{pres} d, pct {pc}/{pres} d")
print()
print("Read-only: corpus fixture + source parses only. No worker, no KV, no wire.")
PYEOF
