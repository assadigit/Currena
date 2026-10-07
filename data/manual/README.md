# data/manual/ — hand-maintained indicator series

Format: one JSON file per indicator, `<id>.json`, validated by
`ManualSeriesFileSchema` (`packages/insights/src/adapters/manual.ts`):

```json
{
  "id": "china-pmi",
  "sourceName": "China NBS official manufacturing PMI",
  "sourceUrl": "https://www.stats.gov.cn/english/",
  "observations": [
    { "date": "2026-09-30", "value": 49.8 }
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

Going forward: add one observation per monthly NBS release (published on
the last day of the reference month / first day of the following month),
dated by the reference month end. The series intentionally starts at
2025-12 — the card only needs enough points to be live and honest; the
10-year percentile floor (30 observations) is not met yet, so the position
bar stays hidden until the file grows (or a future verified bulk backfill
is done by hand).
