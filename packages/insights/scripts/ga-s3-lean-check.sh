#!/usr/bin/env bash
# ga-s3-lean-check.sh — GA-S3 (gold meter audit) read-only per-seat lean check.
# Keyless: GET /api/insights (the public Insights snapshot) — then replicate,
# read-only, EXACTLY the computation the visitor's browser runs client-side
# (goldBalance(readings) at apps/web/src/components/insights/signals/
# MergedCard.tsx:113 — the shared evalLeg at connections.ts:595-614 over the
# frozen 21-seat table at gold-score.ts:155-184 with the readable() rule at
# gold-balance.ts:127-129). No worker, no KV, no writes.
#
# Prints, per seat: today's lean, the mapped impact (supports/pressures/
# steady/unread), the raw change30d/percentile10y inputs evalLeg can reach,
# the evidence word — then each lane's firing count and side under
# GOLD_LANE_MIN_FIRING = 2 (gold-balance.ts:113). The evidence use: the
# coverage matrix's fire-history citations (01 §6's COVERED condition) and
# the half-implementation audit's H1/H6 verdicts (03 §4) — e.g. the
# never-fires seat's member-line truth (steady vs unread).
#
# Requires curl + python3. Usage:
#   bash packages/insights/scripts/ga-s3-lean-check.sh [saved-snapshot.json]
# (With an argument the script analyses the saved payload instead of
#  fetching — reproducibility without re-hitting the wire.)
set -euo pipefail

SRC="${1:-}"
if [ -n "$SRC" ]; then
  echo "# analysed saved payload: $SRC"
  cat "$SRC" > /tmp/ga3-wire.json
else
  echo "# fetched live: HTTP $(curl -sS -o /tmp/ga3-wire.json -w '%{http_code} (%{size_download} bytes)' \
    -A 'CurrenaDashboard/1.0' 'https://currena.ir/api/insights')"
fi

python3 - <<'EOF'
import json
w = json.load(open('/tmp/ga3-wire.json'))
print(f"generatedAt      : {w.get('generatedAt')}")
readings = {r['id']: r for r in w['readings']}
# The 21 seats verbatim (gold-score.ts:155-184) with the 4 move thresholds
# (connections.ts:575-585). The other 17 seats: None = level-leg only.
seats = [
 ('borrowing-costs','real-yield-10y',-1,0.1), ('borrowing-costs','us10y',-1,0.15),
 ('borrowing-costs','us30y',-1,None), ('borrowing-costs','fed-target',-1,None),
 ('borrowing-costs','fed-expectations',-1,None), ('borrowing-costs','ecb-dfr',-1,None),
 ('borrowing-costs','yield-curve-10y2y',-1,None), ('borrowing-costs','yield-curve-10y3m',-1,None),
 ('dollar','dollar-basket',-1,1.0), ('dollar','usdjpy',-1,None), ('dollar','us-japan-10y-gap',-1,None),
 ('stress','stress-stlfsi',1,None), ('stress','nfci',1,None), ('stress','vix',1,None),
 ('stress','gold-silver',1,None), ('stress','cftc-gold-positioning',-1,None),
 ('inflation','us-cpi-yoy',1,None), ('inflation','us-pce-core-yoy',1,None),
 ('inflation','euro-hicp',1,None), ('inflation','breakeven-5y5y',1,0.1), ('inflation','breakeven-tilt',1,None),
]
def readable(r):  # gold-balance.ts:127-129
    return r is not None and r.get('status') not in ('stale','check-pending','unavailable')
hdr = f"{'seat':26s} {'lean':>4s} {'impact':>9s} {'pct10y':>8s} {'ch30d':>9s}  evidence"
print(hdr); print('-'*len(hdr))
firing = {}
readcount = {}
for lane,vid,pol,thr in seats:
    r = readings.get(vid)
    if not readable(r):
        print(f"{vid:26s} {'—':>4s} {'unread':>9s} {'':>8s} {'':>9s}")
        firing.setdefault(lane, []).append(None); continue
    direction=None; level=None; lean=0
    ch=r.get('change30d'); pc=r.get('percentile10y')
    if thr is not None and ch is not None:  # connections.ts:596-606
        if ch >  thr: direction='rising'
        elif ch < -thr: direction='falling'
        else: direction='steady'
    if pc is not None:  # connections.ts:588-592
        level = 'low' if pc < 0.2 else ('high' if pc > 0.8 else 'typical')
    if direction=='rising': lean=1
    elif direction=='falling': lean=-1
    elif level=='high': lean=1
    elif level=='low': lean=-1
    impact='steady' if lean==0 else ('supports' if lean*pol==1 else 'pressures')
    ev = direction if direction in ('rising','falling') else (level if level in ('high','low') else '—')
    print(f"{vid:26s} {lean:+4d} {impact:>9s} {str(pc)[:8]:>8s} {str(ch)[:9]:>9s}  {ev}")
    firing.setdefault(lane, []).append(impact if impact in ('supports','pressures') else None)
    readcount.setdefault(lane, [0])[0] += 1
print()
for lane in ('borrowing-costs','dollar','stress','inflation'):
    m = firing.get(lane, []); f=[x for x in m if x]
    nread = readcount.get(lane, [0])[0]
    s=sum(1 for x in f if x=='supports'); p=len(f)-s
    if nread == 0: side='unread'
    elif len(f)<2: side=f'neutral (<2 firing: {len(f)})'
    elif s>p: side='for'
    elif p>s: side='against'
    else: side='neutral (split)'
    print(f"lane {lane:16s} readable {nread} · firing {len(f)} (supports {s} / pressures {p}) -> side: {side}")
print("\nRead-only: GET + the client-side rule replicated. No worker, no KV, no writes.")
EOF
