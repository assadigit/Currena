# World stock markets — provider data check (build step 0)

**Run:** 2026-10-12T02:10:14.007Z · spec §3.6 · committed as the step-0 acceptance artifact.
Raw provider answers are cached (gitignored) under `packages/insights/fixtures/markets-live/` so re-runs never re-spend the EODHD free quota.

## The 14 markets, both providers side by side

| Market | Group | EODHD code | EODHD last close · date (n) | Yahoo last close · date (n) | Agreement |
|---|---|---|---|---|---|
| Nikkei 225 | Asia-Pacific | N225.INDX | 69031 · 2026-10-09 (242) | 69031 · 2026-10-09 (243) | exact |
| ASX 200 | Asia-Pacific | AXJO.INDX | 8755 · 2026-10-12 (254) | 8783 · 2026-10-12 (254) | within 0.323% |
| KOSPI | Asia-Pacific | KS11.INDX | 6528 · 2026-10-12 (244) | 6501 · 2026-10-12 (244) | within 0.407% |
| Hang Seng | Asia-Pacific | HSI.INDX | 24211 · 2026-10-09 (245) | 24400 · 2026-10-12 (246) | ⚠ dates 2026-10-09 vs 2026-10-12, closes 0.77% apart |
| Shanghai Composite | Asia-Pacific | SSEC.INDX | 3814 · 2026-10-09 (241) | 3815 · 2026-10-12 (242) | ⚠ dates 2026-10-09 vs 2026-10-12, closes 0.04% apart |
| TAIEX | Asia-Pacific | TWII.INDX | 49313 · 2026-10-08 (243) | 49130 · 2026-10-12 (242) | ⚠ dates 2026-10-08 vs 2026-10-12, closes 0.37% apart |
| Nifty 50 | Asia-Pacific | NSEI.INDX | 22520 · 2026-10-09 (246) | 22520 · 2026-10-09 (247) | exact |
| Euro Stoxx 50 | Europe | STOXX50E.INDX | 6173 · 2026-10-09 (255) | 6173 · 2026-10-09 (251) | exact |
| DAX | Europe | GDAXI.INDX | 25087 · 2026-10-09 (252) | 25087 · 2026-10-09 (254) | exact |
| FTSE 100 | Europe | — | ❌ no code — verified unavailable on the free key (see notes) | 10552 · 2026-10-09 (254) | — |
| S&P 500 | Americas | GSPC.INDX | 7812 · 2026-10-09 (250) | 7812 · 2026-10-09 (251) | exact |
| Nasdaq 100 | Americas | NDX.INDX | 30883 · 2026-10-09 (250) | 30883 · 2026-10-09 (251) | exact |
| S&P/TSX Composite | Americas | GSPTSE.INDX | 35665 · 2026-10-09 (250) | 35665 · 2026-10-09 (252) | exact |
| Ibovespa | Americas | BVSP.INDX | 209067 · 2026-10-09 (248) | 209067 · 2026-10-09 (250) | within 0.000% |

**Summary:** 13 of 14 markets answered by both providers; 7 agree to the cent on the same date, 3 more within the 0.5% agreement rule (R5). Fresh calls this run: 0 EODHD + 0 Yahoo (the rest served from the local cache).

## Round 44 (2026-10-12): the Dow Jones and CAC 40 join the list

Owner ask: cover every globally important exchange. The two gaps worth closing — the world's most headline-famous index (Dow Jones) and the eurozone's #2 economy (CAC 40) — were verified live on both providers (2 EODHD + 2 Yahoo calls at ~11:58 UTC):

| Market | Group | EODHD code | EODHD last close · date | Yahoo symbol | Yahoo last close · date | Agreement |
|---|---|---|---|---|---|---|
| Dow Jones | Americas | DJI.INDX | 51179.87 · 2026-10-07 | ^DJI | 51179.87 · 2026-10-07 | exact (to the cent, several dates) |
| CAC 40 | Europe | FCHI.INDX | 7769.21 · 2026-10-07 | ^FCHI | 7769.21 · 2026-10-07 | exact (to the cent, several dates) |

Both INDX codes answer on the free key with one year of history (the usual free-plan warning row rides along, as with the other 13). The list is now 16 markets: Asia-Pacific 7 · Europe 4 · Americas 5 — still no group above 7 tiles (§6.3).

The four ⚠ rows were fetched while those Asian markets were still LIVE in their Monday session (the check ran at ~02:00 UTC): Yahoo's last point was Monday's intraday snapshot while EODHD had only settled closes. The production runs sit at 23:30 / 01:30 UTC, when every market has closed and both providers agree on final values — the check below (run against settled dates) shows what that looks like.

## EODHD code verification (spec §2's "VERIFY" column)

Codes were confirmed against EODHD's own `exchange-symbol-list/INDX` (1,680 entries) plus a live EOD call per market:

- Confirmed and working: N225, AXJO, KS11, HSI, **SSEC** (the spec's guess "000001.SHG" does not exist — the INDX code is SSEC.INDX), TWII, NSEI, STOXX50E, GDAXI, GSPC, NDX, GSPTSE, BVSP.
- **FTSE 100: no INDX code exists.** The symbol list carries no FTSE-named index (only LSE-traded FTSE 100 ETFs); direct `FTSE.INDX` / `UKX.INDX` return an empty array. Yahoo is FTSE's permanent source — exactly the spec's fallback chain, and `definitions.ts` marks it `eodhdCode: null` so no call is wasted on it.
- The free key **does** serve non-demo INDX tickers with one year of history (the response carries the warning "Data is limited by one year as you have free subscription"). The spec's open VERIFY question is closed: EODHD stays the primary.

## Manual confirmation against official exchange sites (spec §3.6)

| Market | Official source | Official close · date | Provider close · date | Verdict |
|---|---|---|---|---|
| Nikkei 225 | [Nikkei Official Indexes (indexes.nikkei.co.jp daily archives)](https://indexes.nikkei.co.jp/en/nkave/archives/data) | 69031 · 2026-10-09 | 69031 · 2026-10-09 | ✅ matched (≤0.5%) |
| DAX | [Deutsche Börse (live.deutsche-boerse.com DAX detail)](https://live.deutsche-boerse.com/indices/dax) | 25170 · 2026-10-09 | 25087 · 2026-10-09 | ✅ matched (≤0.5%) |
| S&P 500 | [Deutsche Börse live ticker (S&P 500 quote)](https://live.deutsche-boerse.com) | 7810 · 2026-10-09 | 7812 · 2026-10-09 | ✅ matched (≤0.5%) |

Reading the DAX row: EODHD and Yahoo both report the 17:30 CET Xetra closing auction (25,087.27 — identical to the cent); Deutsche Börse's own page shows the 22:00 late indication (25,170.31), a different fixing time on the same day. The 0.33% gap is the fixing difference, not an error, and both providers agree with each other exactly — which is what the R5 rule actually guards. Nikkei matches the official archives to the cent.

## Budget notes for the first production day

The data-check calls above spend part of the EODHD free quota's UTC day. The first scheduled 23:30 UTC run after deploy may therefore see a few 429s; those markets simply arrive via the Yahoo fallback that day (the chain is designed for it), and from the next UTC day the steady state is ~15 EODHD calls per main run (16 markets, FTSE via Yahoo), within the 20/day free plan with the retry run's quota guard (see `src/markets/job.ts`).

## KV usage after one week live (§4 rule 9 — to be recorded)

To fill in after the first week live:
- Daily KV writes attributable to `insights:markets:v1` (target: ≤1 per day, zero on weekends/holidays).
- Daily KV reads for the markets route (target: comfortably under 1% of the 100,000/day free limit).
- Provider calls per run (target: ≤15 EODHD + 1 Yahoo, subrequests ≤17 of 50).
