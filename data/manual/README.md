# data/manual/ — hand-maintained indicator series

Format: one JSON file per indicator, `<id>.json`, validated by
`ManualSeriesFileSchema` (`packages/insights/src/adapters/manual.ts`):

```json
{
  "id": "china-pmi",
  "sourceName": "China NBS official manufacturing PMI",
  "sourceUrl": "https://www.stats.gov.cn/english/PressRelease/",
  "enteredOn": "2026-10-26",
  "expires": "2026-11-03",
  "observations": [
    { "date": "2026-09-30", "value": 50.1 }
  ]
}
```

Rules (roadmap Phase I5/I6 content work — the agent never invents data):

- One observation per official release, dated by the release's reference
  month end (`YYYY-MM-DD`); values are the official headline number.
- The file's `id` must match the indicator it feeds (validated loudly).
- Observations must be unique by date; duplicates are rejected.
- While a file is absent, the runner logs it as expected and the indicator
  reads `unavailable` — never guessed.

## china-pmi.json — provenance (initial backfill, 2026-10-07)

Every observation below is the official NBS headline manufacturing PMI for
the reference month, cross-checked against at least two independent reports
of the NBS release (month-over-month arithmetic in the releases must also
reconcile). Recorded so the backfill is auditable:

| Observation | Value | Documented by |
|---|---|---|
| 2025-12-31 | 50.1 | Reuters, "China January official manufacturing PMI drops to 49.3 from 50.1 in December" (2026-01-30) |
| 2026-01-31 | 49.3 | Reuters (2026-01-30, same release report) |
| 2026-02-28 | 49.0 | Reuters / Focus Economics reporting the March release ("rose to 50.4 from 49.0 in February", 2026-03-30) |
| 2026-03-31 | 50.4 | stats.gov.cn "Purchasing Managers' Index for March 2026" (release 2026-04-01, "an increase of 1.4 percentage points" → 49.0 + 1.4 ✓) |
| 2026-04-30 | 50.3 | stats.gov.cn "Purchasing Managers' Index for April 2026" (release 2026-05-01, "a decrease of 0.1 percentage points" → 50.4 − 0.1 ✓) |
| 2026-05-31 | 50.0 | Mysteel, "NBS: China's manufacturing PMI dips to 50 in May … edging down 0.3 point" (2026-05-31) |
| 2026-06-30 | 50.3 | Reuters / China Daily reporting the July release ("fell to 49.2 from 50.3 in June") |
| 2026-07-31 | 49.2 | stats.gov.cn "Purchasing Managers' Index for July 2026" ("49.2%, a decrease of 1.1 percentage points" → 50.3 − 1.1 ✓) |
| 2026-08-31 | 49.8 | Moneycontrol, "China's official NBS Manufacturing PMI rose to 49.8 in August 2026 from 49.2 in July" |
| 2026-09-30 | 50.1 | SMM (news.metal.com) "NBS: Manufacturing PMI at 50.1% in September" (2026-09-30); Trading Economics corroborates ("rose to 50.1 from 49.8") |

Going forward — the M7 note (2026-10-26): the china-pmi hand-entry era is
over. The NBS English press-release automation (`packages/insights/src/
adapters/nbs.ts`) fetches the release table every rung; this file stays as
the committed SEED history (the fetch-failure fallback + the pre-2025-09
observations the NBS tables no longer carry), and each monthly release
appends its observation via the stored accumulation (`insights:hist:*`) —
not by hand any more. All 10 observations above were re-verified against
the NBS's own Sep-2026 release Table 1 (every value identical, 2026-10-26).

## china-cpi.json — provenance (the M7 seed backfill, 2026-10-26)

Every observation is the official NBS year-on-year CPI growth for the
reference month, read from THAT MONTH'S OWN release page on the NBS
English site (fetched 2026-10-26; the headline sentence and the summary
table's Y/Y column agree in every month):

| Observation | Value | NBS release ("Consumer Price Index in …", published) |
|---|---|---|
| 2025-09-30 | -0.3 | September 2025 (2025-10-16) — "decreased by 0.3% year on year" |
| 2025-10-31 | 0.2 | October 2025 (2025-11-10) — "increased by 0.2% year on year" |
| 2025-11-30 | 0.7 | November 2025 (2025-12-11) — "increased by 0.7% year on year" |
| 2025-12-31 | 0.8 | December 2025 (2026-01-10) — "increased by 0.8% year on year" |
| 2026-01-31 | 0.2 | January 2026 (2026-02-12) — "increased by 0.2% year on year" |
| 2026-02-28 | 1.3 | February 2026 (2026-03-10) — "increased by 1.3% year on year" |
| 2026-03-31 | 1.0 | March 2026 (2026-04-11) — "increased by 1.0% year on year" |
| 2026-04-30 | 1.2 | April 2026 (2026-05-12) — "increased by 1.2% year on year" |
| 2026-05-31 | 1.2 | May 2026 (2026-06-11) — "increased by 1.2% year on year" |
| 2026-06-30 | 1.0 | June 2026 (2026-07-10) — "increased by 1.0% year on year" |
| 2026-07-31 | 0.5 | July 2026 (2026-08-10) — "increased by 0.5% year on year" |
| 2026-08-31 | 0.8 | August 2026 (2026-09-10) — "increased by 0.8% year on year" |
| 2026-09-30 | 0.9 | September 2026 (2026-10-15) — "increased by 0.9% year on year" |

The `expires` bookkeeping points at the next CPI release (~2026-11-10);
as with china-pmi, the automation now owns the freshness and this file is
the seed history the fetch merges over.
