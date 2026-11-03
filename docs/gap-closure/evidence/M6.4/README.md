# M6.4 evidence — the shadow-candidate evaluation

Reproducible end-to-end:

1. `promo-extract.ts` + `promo-extract-2.ts` — the one-off data-prep
   scripts (run with `bun run`): dump the GSCPI + GPR-index series from
   the repo's committed provider fixtures (`fixtures/s4/gscpi-*.xls`,
   `fixtures/gpr-export.xls`) with the repo's own production parsers, and
   the S&P real monthly closes from the provider's own Shiller
   `ie_data.xls` (the recorded sourceUrl, fetched 2026-11-03).
2. `data/` — every input the harness reads: the FRED fredgraph CSVs
   (fetched 2026-11-03), the EBP/OFR-FSI fixture copies (reduced to
   date,value), the ABS SDMX answers (LF M13/M12, LF_UNDER M23), the IMF
   COFER evidence copy, the PortWatch Suez answer (2,855 daily rows,
   2019-01-01 → 2026-10-25), and the derived series (shiller-cape.csv
   from the repo's own `data/shiller/shiller-cape.json`).
3. `harness.py` — the evaluation harness. Rules frozen in advance (see
   its docstring); no lookahead (trailing windows sliced before any
   comparison); every cell reports its n; all 15 registered
   candidate–outcome pairs reported, none picked post-hoc; the two
   sensitivity splits reported beside.
4. `eval-results.json` — the raw output the PROMOTION-PROPOSAL.md tables
   quote.

The production snapshot the proposal's before/after quotes:
`/api/insights` @ generatedAt 2026-11-02T17:20:46Z (158 readings; Global
stressed 8/30, Australia stressed 5/15).
