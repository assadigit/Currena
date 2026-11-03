#!/usr/bin/env python3
"""
M6.4 promotion evaluation harness — gap-closure S6 (2026-11-03).

RULES FROZEN IN ADVANCE (before any outcome was computed), mirroring the
repo's own vocabulary (percentile rules, the 120-observation floor that
BACKTEST.md states):

PRIMARY UNIFORM RULE: warning at month t = the candidate's reading at t
sits in the top decile (>= 90th percentile) of its TRAILING 120-month
window (exactly the repo's percentile10y: share of the last 10 years'
readings strictly below the current one, minimum 120 base observations) (polarity high-bad), or the bottom decile (<= 10th) where low-bad.
Slope candidates: the same percentile rule applied to the 12-month change.

EXCEPTION RULES (the provider's own thresholds / the event class, stated
in advance and not tuned):
  cfnai:             reading < -0.7 (the Chicago Fed's own recession marker)
  chokepoint-suez:   MA7 at t < 0.85 x the prior-4-week mean (the Red Sea
                     transit-collapse class)
  usd-reserve-share: 12m change <= -0.5pp (a meaningful diversification
                     year; quarterly, min base 40 quarters)

OUTCOMES (frozen):
  eq_dd6         max peak-to-trough decline of the S&P REAL monthly closes
                 within [t, t+6m] >= 10%      (Shiller ie_data col P)
  unrate_up12    US UNRATE(t+12) - UNRATE(t) >= +0.5pp   (FRED UNRATE)
  au_unrate_up12 AU unemployment(t+12) - (t) >= +0.5pp   (ABS LF M13)
  cpi_surp12     CPI YoY(t+12) - YoY(t) >= +0.5pp        (FRED CPIAUCSL)
  oil_shock6     brent(t+6)/brent(t) >= 1.25             (monthly averages)
  usd_down12     DTWEXBGS(t+12)/DTWEXBGS(t) <= 0.97      (monthly averages)
  fwd_ret12_lt0  S&P real 12m-forward return < 0         (Shiller col P)
  us10y_up12     DGS10(t+12) - DGS10(t) >= +0.75pp       (monthly averages)

NO LOOKAHEAD: every trailing window/percentile uses observations at or
before t only. Windows are evaluated wherever the candidate carries
>= 120 trailing observations AND the outcome horizon is fully observable.
Every cell reports its n. All candidates are reported; none is selected
post-hoc. Data: evidence/M6.4/data/ (the providers' own answers — FRED
fredgraph CSVs fetched 2026-11-03, the repo's committed fixtures for
EBP/OFR/GSCPI/GPR, the ABS SDMX API, the IMF COFER evidence copy, the
PortWatch FeatureServer, the provider's own ie_data.xls).
"""
import json
import datetime as dt

D = 'docs/gap-closure/evidence/M6.4/data/'


def load_pairs(path):
    rows = []
    with open(path) as f:
        first = f.readline()
        cols = first.strip().split(',')
        # detect shape
        if 'TIME_PERIOD' in cols:
            di, vi = cols.index('TIME_PERIOD'), cols.index('OBS_VALUE')
        elif cols[0].lower() == 'date':
            di, vi = 0, 1
        else:  # plain two-col value,value
            di, vi = 0, 1
        for line in f:
            parts = line.strip().split(',')
            if len(parts) <= max(di, vi):
                continue
            d, v = parts[di], parts[vi]
            if d in ('.', '') or v in ('.', '', 'NaN'):
                continue
            try:
                rows.append((d[:10], float(v)))
            except ValueError:
                continue
    rows.sort(key=lambda x: x[0])
    return rows


def month_add(ym, k):
    y, m = int(ym[:4]), int(ym[5:7])
    t = (y * 12 + (m - 1)) + k
    return f"{t // 12:04d}-{t % 12 + 1:02d}"


def pctile_rank(base, x):
    """Share of base strictly below x (the repo's own percentile definition)."""
    return sum(1 for b in base if b < x) / len(base) if base else None


# ------------------------------------------------------------------ outcomes
sp = {d[:7]: v for d, v in load_pairs(D + 'sp-monthly.csv')}
un = {d[:7]: v for d, v in load_pairs(D + 'UNRATE.csv')}
au_un = {d[:7]: v for d, v in load_pairs(D + 'abs-unemployment.csv')}
cpi = {d[:7]: v for d, v in load_pairs(D + 'CPIAUCSL.csv')}
brent_m, dtw_m, dgs_m = {}, {}, {}
for src, dst in (('DCOILBRENTEU.csv', brent_m), ('DTWEXBGS.csv', dtw_m), ('DGS10.csv', dgs_m)):
    for d, v in load_pairs(D + src):
        if v > 0:
            dst.setdefault(d[:7], []).append(v)
for m in (brent_m, dtw_m, dgs_m):
    for k in list(m):
        m[k] = sum(m[k]) / len(m[k])


def cpi_yoy(ym):
    prev = month_add(ym, -12)
    if ym in cpi and prev in cpi and cpi[prev] > 0:
        return cpi[ym] / cpi[prev] - 1
    return None


def eq_dd6(ym):
    vals = [sp.get(month_add(ym, k)) for k in range(7)]
    if any(v is None for v in vals):
        return None
    peak, mdd = -1e18, 0.0
    for v in vals:
        peak = max(peak, v)
        mdd = min(mdd, v / peak - 1)
    return mdd <= -0.10


def unrate_up12(ym):
    a, b = un.get(ym), un.get(month_add(ym, 12))
    return None if a is None or b is None else (b - a) >= 0.5


def au_unrate_up12(ym):
    a, b = au_un.get(ym), au_un.get(month_add(ym, 12))
    return None if a is None or b is None else (b - a) >= 0.5


def cpi_surp12(ym):
    a, b = cpi_yoy(ym), cpi_yoy(month_add(ym, 12))
    return None if a is None or b is None else (b - a) >= 0.005


def oil_shock6(ym):
    a, b = brent_m.get(ym), brent_m.get(month_add(ym, 6))
    return None if not a or not b else b / a >= 1.25


def usd_down12(ym):
    a, b = dtw_m.get(ym), dtw_m.get(month_add(ym, 12))
    return None if not a or not b else b / a <= 0.97


def fwd_ret12_lt0(ym):
    a, b = sp.get(ym), sp.get(month_add(ym, 12))
    return None if not a or not b else (b / a - 1) < 0


def us10y_up12(ym):
    a, b = dgs_m.get(ym), dgs_m.get(month_add(ym, 12))
    return None if a is None or b is None else (b - a) >= 0.75


OUTCOMES = {
    'eq_dd6': eq_dd6, 'unrate_up12': unrate_up12, 'au_unrate_up12': au_unrate_up12,
    'cpi_surp12': cpi_surp12, 'oil_shock6': oil_shock6, 'usd_down12': usd_down12,
    'fwd_ret12_lt0': fwd_ret12_lt0, 'us10y_up12': us10y_up12,
}


# ------------------------------------------------------------------ harness
def evaluate(name, series, outcome_name, polarity='high', mode='level',
             exception=None, min_base=120):
    out_fn = OUTCOMES[outcome_name]
    obs = {}
    for d, v in series:
        obs[d[:7]] = v
    yms = sorted(obs)
    rows, warn_n, hit_n, hit_warn = [], 0, 0, 0
    today_ym = max(yms)
    for i, ym in enumerate(yms):
        if mode == 'slope12':
            prev = month_add(ym, -12)
            if prev not in obs:
                continue
            x = obs[ym] - obs[prev]
            base = [obs[y] - obs[month_add(y, -12)] for y in yms[max(0, i + 1 - min_base):i + 1] if month_add(y, -12) in obs]
        else:
            x = obs[ym]
            base = [obs[y] for y in yms[max(0, i + 1 - min_base):i + 1]]  # the repo's TRAILING 10y window
        if len(base) < min_base:
            continue
        if exception == 'cfnai_-0.7':
            warn = x < -0.7
        elif exception == 'cofer_-0.5pp':
            warn = x <= -0.5
        else:
            r = pctile_rank(base, x)
            if r is None:
                continue
            warn = r >= 0.90 if polarity == 'high' else r <= 0.10
        oc = out_fn(ym)
        if oc is None:
            continue
        rows.append((ym, warn, oc))
        if warn:
            warn_n += 1
            hit_warn += 1 if oc else 0
        hit_n += 1 if oc else 0
    n = len(rows)
    no_warn = n - warn_n
    base_rate = hit_n / n if n else None
    p_warn = hit_warn / warn_n if warn_n else None
    p_no = (hit_n - hit_warn) / no_warn if no_warn else None
    lift = p_warn / base_rate if (p_warn and base_rate) else None
    # today's state under the SAME rule (for the before/after verdict table)
    today_state = None
    if mode == 'slope12':
        prev = month_add(today_ym, -12)
        if prev in obs:
            x = obs[today_ym] - obs[prev]
            base = [obs[y] - obs[month_add(y, -12)] for y in yms[max(0, len(yms) - min_base):] if month_add(y, -12) in obs]
        else:
            x, base = None, []
    else:
        x, base = obs[today_ym], [obs[y] for y in yms[max(0, len(yms) - min_base):]]
    if exception == 'cfnai_-0.7':
        today_state = (x < -0.7) if x is not None else None
    elif exception == 'cofer_-0.5pp':
        today_state = (x <= -0.5) if x is not None else None
    elif base and x is not None:
        r = pctile_rank(base, x)
        today_state = (r >= 0.90) if polarity == 'high' else (r <= 0.10)
    return {
        'name': name, 'outcome': outcome_name, 'n': n, 'warn_n': warn_n,
        'warn_pct': round(100 * warn_n / n, 1) if n else None,
        'base_rate': round(base_rate, 3) if base_rate is not None else None,
        'p_outcome_given_warn': round(p_warn, 3) if p_warn is not None else None,
        'p_outcome_given_nowarn': round(p_no, 3) if p_no is not None else None,
        'lift': round(lift, 2) if lift is not None else None,
        'today_ym': today_ym, 'today_state': today_state,
        'first_window': rows[0][0] if rows else None,
        'last_window': rows[-1][0] if rows else None,
    }


results = []
results.append(evaluate('ebp', load_pairs(D + 'ebp.csv'), 'eq_dd6'))
results.append(evaluate('ofr-fsi', load_pairs(D + 'ofr-fsi.csv'), 'eq_dd6'))
results.append(evaluate('walcl', load_pairs(D + 'WALCL.csv'), 'eq_dd6', polarity='low', mode='slope12'))
results.append(evaluate('shiller-cape', load_pairs(D + 'shiller-cape.csv'), 'fwd_ret12_lt0'))
results.append(evaluate('sloos-ci-tightening', load_pairs(D + 'DRTSCILM.csv'), 'unrate_up12'))
results.append(evaluate('cfnai', load_pairs(D + 'CFNAI.csv'), 'unrate_up12', exception='cfnai_-0.7'))
results.append(evaluate('continuing-claims', load_pairs(D + 'CCSA.csv'), 'unrate_up12', mode='slope12'))
results.append(evaluate('au-participation', load_pairs(D + 'abs-participation.csv'), 'au_unrate_up12', polarity='low', mode='slope12'))
results.append(evaluate('gscpi', load_pairs(D + 'gscpi.csv'), 'cpi_surp12'))
results.append(evaluate('median-cpi', load_pairs(D + 'MEDCPIM158SFRBCLE.csv'), 'cpi_surp12'))
results.append(evaluate('gpr-index', load_pairs(D + 'gpr.csv'), 'oil_shock6'))
results.append(evaluate('nyfed-custody', load_pairs(D + 'WSEFINTL1.csv'), 'us10y_up12', polarity='low', mode='slope12'))

# chokepoint-suez: MA7 vs prior-4-week mean (the Red Sea collapse class)
suez_rows = json.load(open(D + 'suez-all.json'))
suez_obs = {r['date'][:10]: float(r['n_total']) for r in suez_rows if r.get('n_total') is not None}
suez_dates = sorted(suez_obs)
rows, warn_n, hit_n, hit_warn = [], 0, 0, 0
for i in range(35, len(suez_dates)):
    d = suez_dates[i]
    ma7 = [suez_obs[suez_dates[i - k]] for k in range(7) if i - k >= 0]
    prior = [suez_obs[suez_dates[i - k]] for k in range(7, 35) if i - k >= 0]
    if len(prior) < 21:
        continue
    ma7 = sum(ma7) / len(ma7)
    warn = ma7 < 0.85 * (sum(prior) / len(prior))
    oc = oil_shock6(d[:7])
    if oc is None:
        continue
    rows.append((d, warn, oc))
    if warn:
        warn_n += 1
        hit_warn += 1 if oc else 0
    hit_n += 1 if oc else 0
n = len(rows)
# today's state
i = len(suez_dates) - 1
ma7 = [suez_obs[suez_dates[i - k]] for k in range(7)]
prior = [suez_obs[suez_dates[i - k]] for k in range(7, 35)]
suez_today = (sum(ma7) / 7) < 0.85 * (sum(prior) / len(prior))
results.append({
    'name': 'chokepoint-suez', 'outcome': 'oil_shock6', 'n': n, 'warn_n': warn_n,
    'warn_pct': round(100 * warn_n / n, 1) if n else None,
    'base_rate': round(hit_n / n, 3) if n else None,
    'p_outcome_given_warn': round(hit_warn / warn_n, 3) if warn_n else None,
    'p_outcome_given_nowarn': round((hit_n - hit_warn) / (n - warn_n), 3) if (n - warn_n) else None,
    'lift': round((hit_warn / warn_n) / (hit_n / n), 2) if warn_n and n and hit_n else None,
    'today_ym': suez_dates[-1], 'today_state': suez_today,
    'first_window': rows[0][0] if rows else None,
    'last_window': rows[-1][0] if rows else None,
})

# usd-reserve-share (quarterly slope; the provider's 42 quarters vs the 120-obs
# floor: honestly evaluated with min_base 40 quarters — a REDUCED base, stated)
cofer_rows = []
with open(D + 'cofer.csv') as f:
    import csv as _csv
    rd = _csv.DictReader(f)
    QM = {'Q1': '01', 'Q2': '04', 'Q3': '07', 'Q4': '10'}
    for r in rd:
        y, q = r['TIME_PERIOD'].split('-')
        cofer_rows.append((f"{y}-{QM[q]}-01", float(r['OBS_VALUE'])))
cofer_rows.sort()
results.append(evaluate('usd-reserve-share', cofer_rows, 'usd_down12', mode='slope12',
                        exception='cofer_-0.5pp', min_base=40))

# au-underemployment: the LF_UNDER provider series spans 1978-02 -> 2026-09
# (584 monthly obs — above the 120-obs floor; evaluated under the uniform rule,
# high-bad: a rising underemployment share is the warning).
results.append(evaluate('au-underemployment', load_pairs(D + 'abs-underemployment.csv'), 'au_unrate_up12'))

# usd-reserve-share honest note (the 42-quarter series cannot form the base)
results.append({
    'name': 'usd-reserve-share (note)', 'outcome': 'usd_down12', 'n': 0,
    'note': 'the provider series carries 42 quarters — a trailing-10y (40-quarter) '
            'slope base leaves ZERO fully-formed windows; NOT evaluable under any '
            'honest floor (the frozen rule computed no warning at the latest quarter '
            'either: the 2026-Q2 12m change is +0.53pp, not <= -0.5pp). Re-check '
            'when the base accrues (the S6-M6.3 card is context-only regardless, G-5).',
})

# --- sensitivity splits for the two strong candidates (the gold harness's
# mature-subsample discipline: the modern era reported BESIDE, never selected)
def subsample(res_name, series, outcome_name, polarity='high', mode='level', exception=None, min_base=120, from_ym='2000-01'):
    out_fn = OUTCOMES[outcome_name]
    obs = {}
    for d, v in series:
        obs[d[:7]] = v
    yms = sorted(obs)
    rows = []
    for i, ym in enumerate(yms):
        if ym < from_ym:
            continue
        if mode == 'slope12':
            prev = month_add(ym, -12)
            if prev not in obs:
                continue
            x = obs[ym] - obs[prev]
            base = [obs[y] - obs[month_add(y, -12)] for y in yms[max(0, i + 1 - min_base):i + 1] if month_add(y, -12) in obs]
        else:
            x = obs[ym]
            base = [obs[y] for y in yms[max(0, i + 1 - min_base):i + 1]]  # the repo's TRAILING 10y window
        if len(base) < min_base:
            continue
        if exception == 'cfnai_-0.7':
            warn = x < -0.7
        else:
            r = pctile_rank(base, x)
            if r is None:
                continue
            warn = r >= 0.90 if polarity == 'high' else r <= 0.10
        oc = out_fn(ym)
        if oc is None:
            continue
        rows.append((ym, warn, oc))
    n = len(rows)
    warn_n = sum(1 for _, w, _ in rows if w)
    hit_n = sum(1 for _, w, o in rows if o)
    hit_warn = sum(1 for _, w, o in rows if w and o)
    base_rate = hit_n / n if n else None
    p_warn = hit_warn / warn_n if warn_n else None
    lift = (p_warn / base_rate) if (p_warn and base_rate) else None
    return {
        'name': f'{res_name} (post-2000 subsample)', 'outcome': outcome_name, 'n': n,
        'warn_n': warn_n, 'warn_pct': round(100 * warn_n / n, 1) if n else None,
        'base_rate': round(base_rate, 3) if base_rate is not None else None,
        'p_outcome_given_warn': round(p_warn, 3) if p_warn is not None else None,
        'p_outcome_given_nowarn': round((hit_n - hit_warn) / (n - warn_n), 3) if (n - warn_n) else None,
        'lift': round(lift, 2) if lift is not None else None,
        'today_ym': None, 'today_state': None,
        'first_window': rows[0][0] if rows else None,
        'last_window': rows[-1][0] if rows else None,
    }

results.append(subsample('ebp', load_pairs(D + 'ebp.csv'), 'eq_dd6'))
results.append(subsample('cfnai', load_pairs(D + 'CFNAI.csv'), 'unrate_up12', exception='cfnai_-0.7'))

print(json.dumps(results, indent=1))
with open('docs/gap-closure/evidence/M6.4/eval-results.json', 'w') as f:
    json.dump(results, f, indent=1)
print('\nwritten: docs/gap-closure/evidence/M6.4/eval-results.json')
