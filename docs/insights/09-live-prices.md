# Live prices — the volatility-scaled refresh (2026-10-12)

## The incident

The Prices board showed **Brent oil at $125.44 "as of 2026-10-06"** for four-plus
business days while the real market traded near **$107** — a 15 % error nobody
noticed because:

1. **Brent had exactly ONE source** — FRED's `DCOILBRENTEU` (EIA's daily spot
   assessment). EIA publishes in weekly batches and simply **stopped
   publishing on 2026-10-06** while the market kept moving (verified live:
   the FRED CSV still ends at 2026-10-06; Yahoo's `BZ=F` has every session
   since).
2. **The ingestion runs once a day** (GitHub Actions, 04:20 UTC) — even a
   healthy source leaves the board up to ~24 h behind intraday.
3. **Nothing flagged it**: `brent.staleAfterDays` is a 12-day grace (set
   precisely because EIA lags), so a 6-day-old price rendered as fresh.

Gold, silver and Bitcoin were "only" hours old (GoldAPI spot at 04:20 UTC —
the free key allows exactly one call per day), but the same class of problem:
the board's most volatile numbers were served at a daily cadence.

## The fix — three layers

### 1. Hourly live quotes (the volatility refresh)

A new module `packages/insights/src/prices/` fetches Yahoo Finance quotes for
the four board assets — **Brent `BZ=F`, gold `GC=F`, silver `SI=F`, Bitcoin
`BTC-USD`** — and stores them under ONE KV key, `insights:prices-live:v1`
(write-only-if-changed).

**Where it runs:** the `currena-api` Worker's every-minute cron gained ONE
hourly rung — minute **:13** of every hour (`PRICES_CRON_MINUTE` in
`apps/api/src/index.ts`). No new cron trigger exists: the account's free
5-cron limit is full, and the minute cron was already there. `:13` deliberately
avoids the Frankfurter quarter-hours.

**Volatility scaling (the owner's rule: "updates itself based on the
volatility of that market, e.g. oil at least once a day"):** every asset
carries its own `intervalMinutes` in the owner-editable CONFIG block
(`LIVE_PRICE_ASSETS`, `packages/insights/src/prices/definitions.ts`). Oil at
60 minutes is **24× the minimum bar**. Raising an interval is a one-number
edit; the job skips any asset still inside its interval.

**Budget shape (all free-tier verified numbers):**
- Yahoo: keyless, 4 chart calls per rung — no EODHD quota involvement;
- KV writes: write-only-if-changed → ≤ ~24/day while prices move (~2 % of
  the account's 1,000/day, which the rates cron saturates by ~18:30 UTC
  anyway). A bounced evening write is non-fatal; the post-midnight rung
  lands the next change in the fresh budget slice.
- subrequests: 4 per rung (the minute cron's own ladder uses 1–2) — far
  under the 50 cap.

**Fault isolation:** one symbol failing never fails the run — the stored
quote is held (last-known-good) and the other assets proceed. An all-failure
first run writes nothing (the board keeps its calm EOD state).

### 2. Serve-time merge (the board turns live without a redeploy loop)

`GET /api/insights` reads the daily EOD snapshot, overlays the live quotes,
and serves the merged result (`mergeLivePricesIntoSnapshot` — pure, no
fetch). Exactly the numbers the board renders are overridden:

- the four tiles: `value`, `asOf`, `change7d`/`change30d` (computed from the
  same Yahoo daily series, mirroring the SPA's client-side derivation),
  honest live attribution (`sourceName`), `updatedAt`;
- the companions `gold-btc`, `silver-btc` (the Bitcoin tile's context line)
  and `gold-aud` (the gold tile's A$ line), recomputed from the live bases —
  `gold-aud` keeps the snapshot's daily ECB `audusd` (reference FX is daily
  by definition);
- **status healing**: a `stale`/`unavailable` reading becomes the row's
  natural non-voting status once live data exists — the stale-oil symptom
  can never render as fresh-looking data again.

Never touched: the summary/verdict (EOD analytics, recomputed only by the
daily run), `percentile10y` (a 10-year statistic), every other reading.
Guard rails: a live quote never rewinds a fresher EOD reading; a companion
recomputes only when EVERY constituent is available; a missing live change
keeps the reading's existing one. The ETag covers both generations
(`insights:<snap>+prices:<live>`), so a new hourly quote busts caches the
same way a new daily snapshot does. A missing/poisoned quotes key degrades
calmly to the plain EOD snapshot.

`copper-usd` and `copper-gold` deliberately stay daily: Yahoo's `HG=F` quote
is USD per pound while the stored series is USD per tonne — a unit-bridging
live override is not worth the risk on context rows.

### 3. The daily backbone heals itself (ingestion gap-fill)

`collect.ts` now also fetches Yahoo's `BZ=F` daily closes and
`derived.ts`'s `fillBrentGap` extends the Brent series STRICTLY past FRED's
last published date:

- FRED stays authoritative on every overlapping date — when EIA catches up
  and publishes the missing days, FRED's spot values win again and the
  series self-corrects to pure EIA;
- a total FRED outage degrades to the Yahoo series alone (the World Bank
  monthly stays the last resort);
- the stored history, percentiles and 7/30-day change windows can never rot
  behind a lagging EIA batch again.

The brent definition's attribution now reads
`FRED (EIA Brent) + Yahoo Finance (BZ=F)`.

## Operations

- **Manual refresh / seed:** `pnpm --filter @currena/insights prices-run`
  (REST write, needs `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`/
  `INSIGHTS_KV_NAMESPACE_ID`) or `--dry-run` for a connectivity probe.
- **The cron rung's logs:** Cloudflare dashboard → currena-api → cron
  invocations at :13 — one `# prices run` report per hour
  (fetched/skipped/held counts + write outcome).
- **Cadence tuning:** edit `intervalMinutes` per asset in
  `packages/insights/src/prices/definitions.ts`; deploy `currena-api`.

## Verification (2026-10-12)

- 46 new unit tests (prices module: parser, job gating, hold-on-failure,
  write-if-changed, REST retry ladder, merge rules incl. never-rewind /
  status healing / schema validity) + 7 new API-worker tests (route merge,
  combined ETag, calm degradation, the :13 rung writing the KV key) —
  **928 tests green repo-wide, typecheck clean**.
- Live comparison recorded before the fix: board 125.44 @ 10-06 vs Yahoo
  BZ=F 107.14 @ 10-12; FRED's own CSV confirmed the publication gap.
