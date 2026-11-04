#!/usr/bin/env bash
# ga-s2-wire-scan.sh — GA-S2 (gold meter audit) read-only inventory scan.
# Keyless: GET /api/insights (the public Insights snapshot, owner decree
# 2026-10-19) — the ground truth of what the meter can actually see today
# (03 §1.2). No keys, no writes, no worker runs, no KV access.
#
# Prints:
#   1. THE WIRE — generatedAt, reading count, goldSummary absence (the
#      GB-S7 retirement), displayMode, per-status counts, the summary
#      lines' staleVoters.
#   2. THE VOTER FIELDS — the 21 gold-lane seats parsed read-only from
#      gold-score.ts (id @ line, lane, polarity) with each voter's live
#      wire fields (asOf, status, change30d/percentile10y presence) —
#      what evalLeg can reach on today's wire.
#   3. THE THREE DENOMINATORS — the wire's ids vs
#      docs/INDICATORS_AND_DATA_SOURCES.md's inventory table vs
#      packages/insights/src/definitions.ts DEFINITIONS: counts + deltas.
#   4. THE TABLE — one row per DEFINITIONS id (161): group (the gauge =
#      the layer), source, sourceRef, cadence, staleAfterDays override,
#      the doc table's maxAge / licence level / gauge-voter flag, the
#      wire's asOf + status, and the gold-lane-voter flag parsed from
#      gold-score.ts. The mirror-sweep column (voter / context / not-gold)
#      is editorial and lives in evidence/inventory.md, not here.
#
# Evidence for docs/specs/gold-meter-audit/evidence/inventory.md (03 §1.2;
# every number the session quotes comes from this run). Requires curl +
# python3. Usage:
#   bash packages/insights/scripts/ga-s2-wire-scan.sh [saved-snapshot.json]
# (With an argument the script analyses the saved payload instead of
#  fetching — reproducibility without re-hitting the wire.)
set -u
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SNAP="${1:-}"

if [ -z "$SNAP" ]; then
  SNAP="$(mktemp /tmp/ga-s2-wire-XXXXXX.json)"
  code=$(curl -s -o "$SNAP" -w "%{http_code}" --max-time 45 \
    -A "CurrenaDashboard/1.0" "https://currena.ir/api/insights")
  if [ "$code" != "200" ]; then
    echo "WIRE FETCH FAILED: HTTP $code" >&2
    exit 1
  fi
  echo "# fetched live: HTTP $code ($(wc -c <"$SNAP") bytes)"
else
  echo "# analysing saved snapshot: $SNAP ($(wc -c <"$SNAP") bytes)"
fi

python3 - "$SNAP" "$REPO_ROOT" <<'PYEOF'
import json, re, sys
snap_path, root = sys.argv[1], sys.argv[2]
wire = json.load(open(snap_path))

def read(p):
    return open(f"{root}/{p}", encoding="utf-8").read()

defs_src = read("packages/insights/src/definitions.ts")
score_src = read("packages/insights/src/gold-score.ts")
gauges_src = read("packages/insights/src/gauges.ts")
doc = read("docs/INDICATORS_AND_DATA_SOURCES.md")

# ---- parse GAUGES (the scored gauge membership — gauges.ts, authoritative;
# context items listed in a lane but not in members never vote)
gauge_members = {}
gauge_of_member = {}
cur_gauge = None
in_members = False
for raw in gauges_src.splitlines():
    line = re.sub(r"//.*$", "", raw)  # strip comments (no quoted-id false positives)
    m = re.match(r"^\s+id: '([a-z-]+)',\s*$", line)
    if m and not in_members:
        cur_gauge = m.group(1)
        gauge_members[cur_gauge] = []
        continue
    if cur_gauge is not None:
        if re.match(r"^\s+members: \[", line):
            in_members = True
        if in_members:
            for mm in re.finditer(r"'([a-z0-9-]+)'", line):
                gauge_members[cur_gauge].append(mm.group(1))
                gauge_of_member[mm.group(1)] = cur_gauge
            if line.rstrip().endswith("],") or line.rstrip() == "]":
                in_members = False
                cur_gauge = None

# ---- parse DEFINITIONS (id -> group/source/sourceRef/cadence/staleAfterDays/rule kind)
# (sourceRef handles both quote styles and the wrapped-next-line form)
defs_src = re.sub(r"sourceRef:\s*\n\s+", "sourceRef: ", defs_src)
defs, cur = {}, None
for line in defs_src.splitlines():
    m = re.match(r"^\s+id: '([a-z0-9-]+)',", line)
    if m:
        cur = {"id": m.group(1)}
        defs[m.group(1)] = cur
        continue
    if cur is not None:
        for key, pat in (
            ("group", r"^\s+group: '([a-z-]+)',"),
            ("source", r"^\s+source: '([a-z0-9-]+)',"),
            ("sourceRef", r"""^\s+sourceRef: (['"])(.+?)\1,\s*(?://.*)?$"""),
            ("cadence", r"^\s+cadence: '([a-z-]+)',"),
            ("staleAfterDays", r"^\s+staleAfterDays: (\d+),"),
            ("rule", r"^\s+rule: \{ kind: '([a-z-]+)'"),
        ):
            mm = re.match(pat, line)
            if mm:
                cur[key] = mm.group(2) if key == "sourceRef" else mm.group(1)

# ---- parse GOLD_LANE_VOTERS (id @ line, lane, polarity)
voters = []
for i, line in enumerate(score_src.splitlines(), start=1):
    m = re.match(r"\s*\{ lane: '(borrowing-costs|dollar|stress|inflation)', id: '([a-z0-9-]+)', polarity: (-?1) \}", line)
    if m:
        voters.append({"line": i, "lane": m.group(1), "id": m.group(2), "polarity": int(m.group(3))})
voter_ids = {v["id"] for v in voters}

# ---- parse the doc's inventory table rows
doc_rows = {}
mt = re.search(r"\| id \| provider \|.*?\n(.*?)\n\*\*Counts:\*\*", doc, re.S)
for line in mt.group(1).splitlines():
    m = re.match(r"\| `([a-z0-9-]+)` \| ([a-z0-9-]+) \| ([a-z-]+) \| (\d+|–) \| (L\d) \| (\w+) \| (✓|–) \| (.*)$", line)
    if m:
        doc_rows[m.group(1)] = {"provider": m.group(2), "cadence": m.group(3), "maxAge": m.group(4),
                                 "level": m.group(5), "voter": m.group(7), "what": m.group(8)}
doc_counts_line = re.search(r"\*\*Counts:\*\* (\d+) ids total", doc).group(1)

# ---- the wire
readings = wire["readings"]
wire_by_id = {r["id"]: r for r in readings}
status_counts = {}
for r in readings:
    status_counts[r.get("status", "?")] = status_counts.get(r.get("status", "?"), 0) + 1

print("=" * 72)
print("1. THE WIRE  (GET /api/insights)")
print("=" * 72)
print(f"generatedAt      : {wire.get('generatedAt')}")
print(f"readings         : {len(readings)} ({len(wire_by_id)} unique ids)")
print(f"goldSummary      : {'PRESENT (!)' if 'goldSummary' in wire else 'ABSENT (the GB-S7 retirement holds)'}")
print(f"displayMode      : {wire.get('displayMode')}  ruleVersion: {wire.get('ruleVersion')}")
print(f"status counts    : {dict(sorted(status_counts.items()))}")
for sec, s in (wire.get("summary") or {}).items():
    extra = {k: v for k, v in s.items() if k not in ("section", "label")}
    print(f"summary.{sec:9s}: {s.get('label')}  {extra}")

print()
print("=" * 72)
print("2. THE VOTER FIELDS  (the 21 gold-lane seats x today's wire)")
print("=" * 72)
print(f"{'id':24s} {'@line':>5s} {'lane':15s} {'pol':>3s}  {'asOf':11s} {'status':9s} ch30d pct10y")
for v in voters:
    r = wire_by_id.get(v["id"])
    if r is None:
        print(f"{v['id']:24s} {v['line']:5d} {v['lane']:15s} {v['polarity']:3d}  -- MISSING FROM WIRE --")
        continue
    c30 = "y" if r.get("change30d") is not None else "-"
    p10 = "y" if r.get("percentile10y") is not None else "-"
    print(f"{v['id']:24s} {v['line']:5d} {v['lane']:15s} {v['polarity']:3d}  {str(r.get('asOf')):11s} {str(r.get('status')):9s} {c30:>5s} {p10:>5s}")

print()
print("=" * 72)
print("3. THE THREE DENOMINATORS")
print("=" * 72)
print(f"wire readings          : {len(readings)} ids")
print(f"DEFINITIONS entries    : {len(defs)} ids")
doc_inv = re.search(r"The complete indicator inventory \((\d+) ids", doc)
print(f"doc table header claim : {doc_inv.group(1)} ids")
print(f"doc table actual rows  : {len(doc_rows)} ids")
print(f"doc Counts: line claim : {doc_counts_line} ids (stale if != {len(doc_rows)})")
print(f"wire - doc table       : {sorted(set(wire_by_id) - set(doc_rows))}")
print(f"doc table - wire       : {sorted(set(doc_rows) - set(wire_by_id))}")
print(f"DEFINITIONS - wire     : {sorted(set(defs) - set(wire_by_id))}")
print(f"wire - DEFINITIONS     : {sorted(set(wire_by_id) - set(defs))}")
print(f"DEFINITIONS - doc      : {sorted(set(defs) - set(doc_rows))}")
print(f"doc - DEFINITIONS      : {sorted(set(doc_rows) - set(defs))}")
info_rules = sum(1 for d in defs.values() if d.get("rule") == "info")
print(f"DEFINITIONS rule kinds : {len(defs) - info_rules} scored-gauge rules + {info_rules} info (context) = {len(defs)}")
# isShadowGauge (gauges.ts:259-263): every member an info-rule definition ->
# context-only until S6's promotion (G-5). Shadow members are NOT voters.
shadow_gauges = []
gauge_of_voter = {}
for g, members in gauge_members.items():
    kinds = [defs.get(m, {}).get("rule") for m in members]
    if members and all(k == "info" for k in kinds):
        shadow_gauges.append(g)
    else:
        for m in members:
            gauge_of_voter[m] = g
gauges_total = sum(len(v) for v in gauge_members.values())
voters_total = sum(1 for m in gauge_of_voter)
print(f"GAUGES                  : {len(gauge_members)} gauges, {gauges_total} listed members, "
      f"{voters_total} scored voters in the {len(gauge_members) - len(shadow_gauges)} non-shadow gauges "
      f"({', '.join(f'{g}:{len(gauge_members[g])}' for g in gauge_members)})")
print(f"shadow gauges (G-5)     : {', '.join(sorted(shadow_gauges))} "
      f"({gauges_total - voters_total} context-only members, never vote until S6)")
mismatch = []
for id_, dr in doc_rows.items():
    in_gauges = id_ in gauge_of_voter
    doc_voter = dr["voter"] == "✓"
    if in_gauges != doc_voter:
        mismatch.append(f"{id_}: doc={'voter' if doc_voter else 'context'} vs gauges.ts={'voter in ' + gauge_of_voter[id_] if in_gauges else 'not a voter'}")
print(f"doc-voter flag vs GAUGES: {'AGREE on all ' + str(len(doc_rows)) + ' doc rows' if not mismatch else 'MISMATCH: ' + '; '.join(mismatch)}")

print()
print("=" * 72)
print("4. THE TABLE  (one row per DEFINITIONS id, alphabetical)")
print("=" * 72)
print("id | group | source | sourceRef | cadence | staleAfterDays | docMaxAge | docLevel | gaugeVoter(gauges.ts) | wireAsOf | wireStatus | goldLaneVoter")
for id_ in sorted(defs):
    d = defs[id_]
    dr = doc_rows.get(id_, {})
    r = wire_by_id.get(id_, {})
    print(" | ".join([
        id_,
        d.get("group", "?"),
        d.get("source", "?"),
        (d.get("sourceRef", "?") or "?")[:90],
        d.get("cadence", "?"),
        str(d.get("staleAfterDays", "-")),
        dr.get("maxAge", "?"),
        dr.get("level", "?"),
        ("VOTER:" + gauge_of_voter[id_]) if id_ in gauge_of_voter else ("SHADOW:" + gauge_of_member[id_]) if id_ in gauge_of_member else "-",
        str(r.get("asOf", "?")),
        str(r.get("status", "?")),
        "VOTER" if id_ in voter_ids else "-",
    ]))
PYEOF
