# Provenance: delivered by the UI/UX mentor session on 2026-10-08. REFERENCE ONLY, not wired into the repo.
# The repo computes the Currena dollar basket in TypeScript (packages/insights). Use this script only to
# cross-check the formula, weights and the 10-year position against the TypeScript implementation.
#!/usr/bin/env python3
"""
Currena dollar basket
=====================
Computes a fresh, daily "dollar strength" number from ECB reference rates
(served by the free Frankfurter API). It uses the same recipe and weights as the
well-known DXY index, so values are close to it, but it is NOT the official DXY.
Always call it "Currena dollar basket" on the page.

What it writes
--------------
A JSON file with: latest value, date, 7-day and 30-day change (%), 10-year
position (percentile, 0-100), and a weekly history for the sparkline.

How to run
----------
    python dollar_basket.py              # fetch data, write the JSON file
    python dollar_basket.py --selftest   # offline self-test, no internet needed

Needs only Python 3.8+ (standard library, nothing to install).
"""

# ============================ CONFIGURATION (edit here) ============================
API_BASE = "https://api.frankfurter.dev/v1"   # if this host fails, try: "https://api.frankfurter.app"
HISTORY_YEARS = 10                            # window for the "position in 10 years" number
OUTPUT_FILE = "dollar_basket.json"            # where the result is written
REQUEST_TIMEOUT_SECONDS = 30
MAX_RETRIES = 3
HISTORY_POINTS_FOR_SPARKLINE = 260            # about 5 years of weekly points
# Weights of the six currencies (the published DXY weights). Do not change unless
# you want a different basket. They must add up to 1.
WEIGHTS = {"EUR": 0.576, "JPY": 0.136, "GBP": 0.119, "CAD": 0.091, "SEK": 0.042, "CHF": 0.036}
SCALING_CONSTANT = 50.14348112                # DXY scaling constant (index = 100 at its 1973 base)
# ===================================================================================

import json
import math
import sys
import time
import urllib.request
import urllib.error
from datetime import date, datetime, timedelta, timezone

SYMBOLS = ",".join(WEIGHTS.keys())


def compute_basket(rates_per_usd):
    """rates_per_usd: dict like {"EUR": 0.86, "JPY": 158.2, ...} = units of each
    currency you get for 1 US dollar (this is what Frankfurter returns with base=USD)."""
    value = SCALING_CONSTANT
    for code, weight in WEIGHTS.items():
        value *= rates_per_usd[code] ** weight
    return value


def percentile_of_latest(values):
    """Share of values that are less than or equal to the latest one, 0-100."""
    latest = values[-1]
    below_or_equal = sum(1 for v in values if v <= latest)
    return 100.0 * below_or_equal / len(values)


def value_on_or_before(series, target_day):
    """series: list of (date, value) sorted by date. Returns the last value on or before target_day."""
    chosen = None
    for day, value in series:
        if day <= target_day:
            chosen = value
        else:
            break
    return chosen


def pct_change(new, old):
    if old is None or old == 0:
        return None
    return 100.0 * (new - old) / old


def http_get_json(url):
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "currena-insights/1.0"})
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_SECONDS) as response:
                return json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, TimeoutError, ValueError) as error:
            last_error = error
            time.sleep(2 * attempt)
    raise RuntimeError(f"Could not fetch {url}: {last_error}")


def fetch_history(start_day, end_day):
    """Fetch the daily rates in one-year chunks (kept small so the API answers reliably).
    Returns a dict {date_string: {currency: rate}}."""
    merged = {}
    chunk_start = start_day
    while chunk_start <= end_day:
        chunk_end = min(chunk_start + timedelta(days=364), end_day)
        url = f"{API_BASE}/{chunk_start.isoformat()}..{chunk_end.isoformat()}?base=USD&symbols={SYMBOLS}"
        payload = http_get_json(url)
        merged.update(payload.get("rates", {}))
        chunk_start = chunk_end + timedelta(days=1)
    return merged


def fetch_latest():
    payload = http_get_json(f"{API_BASE}/latest?base=USD&symbols={SYMBOLS}")
    return payload["date"], payload["rates"]


def build_result():
    today = date.today()
    start_day = today - timedelta(days=365 * HISTORY_YEARS + 5)
    history = fetch_history(start_day, today)
    latest_date, latest_rates = fetch_latest()
    history[latest_date] = latest_rates

    series = []
    for day_text in sorted(history.keys()):
        rates = history[day_text]
        if all(code in rates for code in WEIGHTS):
            series.append((date.fromisoformat(day_text), compute_basket(rates)))
    if len(series) < 100:
        raise RuntimeError("Too few data points came back; refusing to write a result.")

    last_day, last_value = series[-1]
    window_start = last_day - timedelta(days=365 * HISTORY_YEARS)
    window_values = [value for day, value in series if day >= window_start]

    step = max(1, len(series) // HISTORY_POINTS_FOR_SPARKLINE)
    sparkline = [{"date": day.isoformat(), "value": round(value, 3)} for day, value in series[::step]]
    if sparkline[-1]["date"] != last_day.isoformat():
        sparkline.append({"date": last_day.isoformat(), "value": round(last_value, 3)})

    return {
        "id": "currena_dollar_basket",
        "name": "Currena dollar basket",
        "unit": "index",
        "value": round(last_value, 3),
        "as_of": last_day.isoformat(),
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "change_7d_pct": _round_or_none(pct_change(last_value, value_on_or_before(series, last_day - timedelta(days=7)))),
        "change_30d_pct": _round_or_none(pct_change(last_value, value_on_or_before(series, last_day - timedelta(days=30)))),
        "percentile_10y": round(percentile_of_latest(window_values), 1),
        "weights": WEIGHTS,
        "source": "ECB reference rates via Frankfurter (api.frankfurter.dev)",
        "method": "Weighted geometric mean of six currencies against the US dollar, DXY-style weights",
        "history": sparkline,
    }


def _round_or_none(number):
    return None if number is None else round(number, 3)


def run_selftest():
    """Offline checks. No internet needed."""
    failures = []

    # 1. If every currency trades 1:1 with the dollar, the result equals the scaling constant.
    flat = {code: 1.0 for code in WEIGHTS}
    if abs(compute_basket(flat) - SCALING_CONSTANT) > 1e-9:
        failures.append("flat rates should return the scaling constant")

    # 2. A stronger dollar (more yen per dollar) must raise the index.
    base = {"EUR": 0.86, "JPY": 150.0, "GBP": 0.75, "CAD": 1.38, "SEK": 9.4, "CHF": 0.80}
    stronger = dict(base, JPY=160.0)
    if not compute_basket(stronger) > compute_basket(base):
        failures.append("a higher USD/JPY should raise the index")

    # 3. A weaker dollar (fewer euros per dollar) must lower the index.
    weaker = dict(base, EUR=0.80)
    if not compute_basket(weaker) < compute_basket(base):
        failures.append("a lower EUR per USD should lower the index")

    # 4. Weights add up to 1.
    if abs(sum(WEIGHTS.values()) - 1.0) > 1e-9:
        failures.append("weights must add up to 1")

    # 5. Percentile: the latest value is the highest of five, so it is 100.
    if percentile_of_latest([1, 2, 3, 4, 5]) != 100.0:
        failures.append("percentile of the highest value should be 100")
    # and the lowest of five is 20.
    if percentile_of_latest([5, 4, 3, 2, 1]) != 20.0:
        failures.append("percentile of the lowest value should be 20")

    # 6. Change helper.
    if abs(pct_change(110, 100) - 10.0) > 1e-9:
        failures.append("pct_change(110, 100) should be 10")
    if pct_change(1, 0) is not None:
        failures.append("pct_change with zero base should be None")

    # 7. Looking back picks the last value on or before the target day.
    days = [(date(2026, 1, d), float(d)) for d in (1, 2, 5, 6)]
    if value_on_or_before(days, date(2026, 1, 4)) != 2.0:
        failures.append("value_on_or_before should pick the last earlier value")

    # 8. Sanity: a realistic set of rates gives a value in a believable range.
    realistic = compute_basket({"EUR": 0.86, "JPY": 158.23, "GBP": 0.75, "CAD": 1.38, "SEK": 9.4, "CHF": 0.80})
    if not 90 <= realistic <= 110:
        failures.append(f"realistic rates gave an odd value: {realistic:.2f}")

    if failures:
        print("SELF-TEST FAILED:")
        for failure in failures:
            print(" -", failure)
        return 1
    print(f"SELF-TEST PASSED (realistic example value: {realistic:.2f})")
    return 0


def main():
    if "--selftest" in sys.argv:
        sys.exit(run_selftest())
    result = build_result()
    with open(OUTPUT_FILE, "w", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=2)
    print(f"Wrote {OUTPUT_FILE}: value {result['value']} as of {result['as_of']}, "
          f"10-year position {result['percentile_10y']}%")


if __name__ == "__main__":
    main()
