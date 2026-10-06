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

Current files: none yet. First candidate: `china-pmi.json`
(China NBS manufacturing PMI, manual entry — docs/insights/03-data-sources.md).
