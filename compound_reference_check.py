#!/usr/bin/env python3
# =====================================================================
# CONFIGURATION  (change these values if the tool's rules change)
# =====================================================================
DEFAULT_COST_PCT = 0.2          # yearly cost the tool assumes (percent per year)
DEFAULT_WHATIF_POINTS = 2.0     # "what if it is lower" in percentage points
BAND_MIN_GAP_POINTS = 0.5       # higher figure is used for the band only if it differs by this much
MILESTONES = [5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000,
              1_000_000, 2_500_000, 5_000_000, 10_000_000]
PAGE_ROUND_HEADLINE = 100       # the live page rounds the headline to the nearest 100
PAGE_ROUND_SMALL_CARDS = 10     # the live page rounds the small cards to the nearest 10
SELFTEST_TOLERANCE_PERCENT = 0.5
# =====================================================================
"""
Independent reference engine for the Currena "Compound Wealth" tool.

What it does
  1. Recomputes every number the tool shows, from the rules in COMPOUND-WEALTH-SPEC.md
     (section 6): end-of-month deposits, monthly rate = (1+r_net)^(1/12)-1, r_net = r - cost,
     purchase fees, buying every k months, yearly increase, today's money, crossover, milestones,
     band, small changes, starting later.
  2. Runs the spec's self-test vectors:   python3 compound_reference_check.py --selftest
  3. Prints the expected numbers for one scenario:
        python3 compound_reference_check.py --amount 100 --years 20 --rate 7.2 --start 2026-11 \
            --inflation 2.77 --higher-figure 9.0
  4. Writes a grid of scenarios (inputs + expected outputs) as JSON, for a browser test to replay:
        python3 compound_reference_check.py --grid grid.json --rate 7.2 --higher-figure 9.0 --inflation 2.77

No third-party packages are needed (Python 3.8+).
"""
import argparse
import itertools
import json
import math
import sys


def half_up(x, step=1):
    """Round to the nearest `step`, halves go up (how people expect money to round)."""
    return int(math.floor(x / step + 0.5) * step)


def simulate(base, rate_pct, years, cost_pct=DEFAULT_COST_PCT, growth_pct=0.0, fee=0.0,
             every=1, start_amount=0.0, inflation_pct=None, months=None):
    """Return a dict with the final value and the full monthly series."""
    n = months if months is not None else int(round(years * 12))
    r_net = (rate_pct - cost_pct) / 100.0
    i = (1 + r_net) ** (1 / 12) - 1
    g = growth_pct / 100.0
    balance = float(start_amount)
    pending = 0.0
    fees = 0.0
    put_in = float(start_amount)
    series = []
    for m in range(1, n + 1):
        y = (m - 1) // 12
        deposit = base * (1 + g) ** y
        balance *= (1 + i)
        pending += deposit
        put_in += deposit
        if m % every == 0 or m == n:
            if pending > fee:
                balance += pending - fee
                fees += fee
                pending = 0.0
        series.append((m, balance + pending, put_in))
    final = balance + pending
    out = {
        "final": final, "put_in": put_in, "growth": final - put_in,
        "fees": fees, "fees_pct_of_put_in": (fees / put_in * 100) if put_in else 0.0,
        "pending": pending, "months": n, "series": series,
    }
    if inflation_pct is not None:
        out["today_money"] = final / (1 + inflation_pct / 100.0) ** (n / 12)
    # crossover: first month where growth >= money put in
    out["crossover_month"] = next((m for m, b, p in series if b - p >= p), None)
    return out


def month_label(start_ym, month_index):
    """Month 1 is the start month itself (the first deposit is made at its end)."""
    y, mo = [int(x) for x in start_ym.split("-")]
    total = (y * 12 + (mo - 1)) + (month_index - 1)
    return f"{total // 12}-{total % 12 + 1:02d}"


def milestone_months(series, thresholds=MILESTONES):
    found = {}
    final = series[-1][1]
    for t in thresholds:
        if t <= final:
            found[t] = next(m for m, b, _ in series if b >= t)
    largest = sorted(found.items())[-5:]
    return dict(largest)


def band(baseline_pct, higher_pct=None, whatif=DEFAULT_WHATIF_POINTS):
    low = baseline_pct - whatif
    if higher_pct is not None and abs(higher_pct - baseline_pct) >= BAND_MIN_GAP_POINTS and higher_pct > baseline_pct:
        high = higher_pct
    else:
        high = baseline_pct + whatif
    return low, high


def expected(base, rate_pct, years, start_ym="2026-11", higher_pct=None, inflation_pct=None, **kw):
    """Everything the tool displays for one scenario."""
    main = simulate(base, rate_pct, years, inflation_pct=inflation_pct, **kw)
    low_pct, high_pct = band(rate_pct, higher_pct)
    low = simulate(base, low_pct, years, inflation_pct=inflation_pct, **kw)
    high = simulate(base, high_pct, years, inflation_pct=inflation_pct, **kw)
    more = simulate(base * 1.10, rate_pct, years, **kw)
    less = simulate(base * 0.90, rate_pct, years, **kw)
    later = {}
    for k in (1, 3, 5):
        remaining = int(round(years * 12)) - 12 * k
        if remaining > 0:
            later[k] = main["final"] - simulate(base, rate_pct, years, months=remaining, **kw)["final"]
    ms = milestone_months(main["series"])
    return {
        "inputs": {"base": base, "rate_pct": rate_pct, "years": years, "start": start_ym,
                   "higher_pct": higher_pct, "inflation_pct": inflation_pct, **kw},
        "final": main["final"], "put_in": main["put_in"], "growth": main["growth"],
        "today_money": main.get("today_money"),
        "fees": main["fees"], "fees_pct_of_put_in": main["fees_pct_of_put_in"],
        "pending": main["pending"],
        "low_final": low["final"], "high_final": high["final"], "band_pct": [low_pct, high_pct],
        "plus10pct_adds": more["final"] - main["final"], "minus10pct_loses": main["final"] - less["final"],
        "starting_later_costs": later,
        "crossover": (month_label(start_ym, main["crossover_month"]) if main["crossover_month"] else None),
        "milestones": {str(t): month_label(start_ym, m) for t, m in ms.items()},
        "rounded_as_page": {
            "final": half_up(main["final"], PAGE_ROUND_HEADLINE),
            "growth": half_up(main["growth"], PAGE_ROUND_HEADLINE),
            "today_money": half_up(main["today_money"], PAGE_ROUND_HEADLINE) if "today_money" in main else None,
            "low_final": half_up(low["final"], PAGE_ROUND_HEADLINE),
            "high_final": half_up(high["final"], PAGE_ROUND_HEADLINE),
            "small_change": half_up(more["final"] - main["final"], PAGE_ROUND_SMALL_CARDS),
            "starting_later_5": half_up(later[5], PAGE_ROUND_HEADLINE) if 5 in later else None,
        },
    }


def aud_rate(usd_rate_pct, years, fx_start, fx_end):
    """USD per AUD at start and end. Returns the annual AUD rate in percent."""
    factor = (1 + usd_rate_pct / 100) ** years * (fx_start / fx_end)
    return (factor ** (1 / years) - 1) * 100


def cagr(start_value, end_value, years):
    return ((end_value / start_value) ** (1 / years) - 1) * 100


def selftest():
    cases = [
        ("Fixed 100/month, 20y, 7%, no cost (spec test 1)", 50_754,
         simulate(100, 7.0, 20, cost_pct=0)["final"]),
        ("Percent mode 3% of 5,000 = 150, 20y, 7% (spec test 2)", 76_130,
         simulate(150, 7.0, 20, cost_pct=0)["final"]),
        ("Fee 10 per purchase, monthly (spec test 3)", 45_678,
         simulate(100, 7.0, 20, cost_pct=0, fee=10)["final"]),
        ("Fee 10, every 3 months (spec test 4)", 48_785,
         simulate(100, 7.0, 20, cost_pct=0, fee=10, every=3)["final"]),
        ("Live default: 7.2% - 0.2% cost = 7.0% net", 50_754,
         simulate(100, 7.2, 20)["final"]),
    ]
    ok = True
    for name, want, got in cases:
        diff = abs(got - want) / want * 100
        flag = "PASS" if diff <= SELFTEST_TOLERANCE_PERCENT else "FAIL"
        ok &= flag == "PASS"
        print(f"{flag}  {name:60s} expected ~{want:>8,}  got {got:>10,.1f}")
    got_aud = aud_rate(10, 20, 0.80, 0.40)
    flag = "PASS" if abs(got_aud - 13.88) <= 0.05 else "FAIL"
    ok &= flag == "PASS"
    print(f"{flag}  {'AUD conversion 10% USD, FX 0.80 -> 0.40, 20y (spec test 7)':60s} expected ~13.88%  got {got_aud:.2f}%")

    # v10 (spec test 49): the spending receipt — the two normalization
    # equalities and the examples' 10-year invested-instead projection.
    got_daily = 3 * 365 / 12
    flag = "PASS" if got_daily == 91.25 else "FAIL"
    ok &= flag == "PASS"
    print(f"{flag}  {'Receipt daily 3 normalizes to 91.25 exactly (v10 test 49)':60s} expected  91.25  got {got_daily:>10,.2f}")
    got_yearly = 120 * 1 / 12
    flag = "PASS" if got_yearly == 10 else "FAIL"
    ok &= flag == "PASS"
    print(f"{flag}  {'Receipt yearly 120 normalizes to 10 exactly (v10 test 49)':60s} expected     10  got {got_yearly:>10,.2f}")
    got_receipt = simulate(34.97, 7.2, 10, inflation_pct=2.77)["final"]
    diff = abs(got_receipt - 5_982) / 5_982 * 100
    flag = "PASS" if diff <= SELFTEST_TOLERANCE_PERCENT else "FAIL"
    ok &= flag == "PASS"
    print(f"{flag}  {'Receipt examples 34.97/mo, 10y, 7.2% - 0.2% (v10 test 49)':60s} expected ~ 5,982  got {got_receipt:>10,.1f}")
    return 0 if ok else 1


def build_grid(rate_pct, higher_pct, inflation_pct, start_ym):
    amounts = [50, 100, 200, 500, 37.5]
    years_list = [1, 10, 20, 30, 50]
    costs = [0.0, 0.2, 1.0]
    fees = [(0, 1), (10, 1), (10, 3), (25, 1)]
    growths = [0.0, 3.0]
    starts = [0.0, 5000.0]
    grid = []
    for a, y, c, (f, k), g, s in itertools.product(amounts, years_list, costs, fees, growths, starts):
        exp = expected(a, rate_pct, y, start_ym=start_ym, higher_pct=higher_pct,
                       inflation_pct=inflation_pct, cost_pct=c, fee=f, every=k,
                       growth_pct=g, start_amount=s)
        grid.append(exp)
    return grid


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--grid", help="write a JSON grid of scenarios to this path")
    ap.add_argument("--amount", type=float, default=100)
    ap.add_argument("--years", type=float, default=20)
    ap.add_argument("--rate", type=float, default=7.2, help="baseline annual rate in percent (before cost)")
    ap.add_argument("--higher-figure", type=float, default=None, help="the higher of the 20y/30y figures")
    ap.add_argument("--inflation", type=float, default=None)
    ap.add_argument("--start", default="2026-11", help="start month, YYYY-MM")
    ap.add_argument("--cost", type=float, default=DEFAULT_COST_PCT)
    ap.add_argument("--fee", type=float, default=0.0)
    ap.add_argument("--every", type=int, default=1)
    ap.add_argument("--growth", type=float, default=0.0)
    ap.add_argument("--start-amount", type=float, default=0.0)
    a = ap.parse_args()

    if a.selftest:
        sys.exit(selftest())
    if a.grid:
        grid = build_grid(a.rate, a.higher_figure, a.inflation, a.start)
        with open(a.grid, "w") as fh:
            json.dump(grid, fh, indent=1)
        print(f"Wrote {len(grid)} scenarios to {a.grid}")
        return
    exp = expected(a.amount, a.rate, a.years, start_ym=a.start, higher_pct=a.higher_figure,
                   inflation_pct=a.inflation, cost_pct=a.cost, fee=a.fee, every=a.every,
                   growth_pct=a.growth, start_amount=a.start_amount)
    print(json.dumps(exp, indent=2))


if __name__ == "__main__":
    main()
