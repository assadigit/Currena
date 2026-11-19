# Scraper fixtures

Real upstream captures, TRIMMED for size — tests never hit live sites (AGENTS.md rule 7).

| Fixture | Source | Captured | Trim |
|---------|--------|----------|------|
| `tgju-ajax.trimmed.json` | `https://call1.tgju.org/ajax.json` (178 KB) | 2026-09-16 | `current` reduced to the 16 Currena profile slugs + 3 ignored extras (`zinc`, `xrp-irr`, `yemen@kwd-sell`); `tolerance_*`/`last` truncated to 1 entry each |
| `tgju-profile.html` | `https://www.tgju.org/profile/price_dollar_rl` (1.4 MB) | 2026-09-16 | lines around the three `data-col="info.last_trade.PDrCotVal"` spans (the value `2,305,000` Rial) |
| `frankfurter-latest.json` | `https://api.frankfurter.dev/v1/latest?base=USD` | 2026-09-16 | verbatim (433 B) |

Provenance: `/home/z/legacy-capture/upstream-samples/` (probe captures of 2026-09-16).
Unit fact: TGJU `p` values are **RIAL**-denominated with thousands commas; the
normalizer divides by 10 → **TOMAN** (legacy parity: 1 USD = 230,500 Toman).

| `tgju-history-{sekee,sekeb,ons,price_dollar_rl}.html` | `https://www.tgju.org/profile/<slug>/history` (688 KB each) | 2026-11-19 (GPE S16 M1 probe, ~15:3x UTC) | the `<div id="stocks-table-data">` history-table block only — the 30 daily rows verbatim (8 columns: open/low/high/close/Δ/Δ%/میلادی/شمسی); values in the symbol's own unit (Rial for the Tehran items, USD for `ons`) |
