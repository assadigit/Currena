# Evidence — 2026-10-17c — the Persian dollar convention (round-47 copy)

Owner rule: fa says **«دلار»** for USD — never «دلار آمریکا»; dollar
nationality is reserved to **«دلار استرالیا»** (AUD) and **«دلار کانادا»**
(CAD). Reference: `docs/QA/quirks-2026-10-17c-fa-dollar-convention.md`.

## Contents

- `measurements.txt` — hash identity (local build == served chunks), the
  served-bundle sweep, API readings count, browser findings, deploy version.
- `fa-desktop-home.png` — fa home (1280): converter picker rows «USD · دلار»,
  «AUD · دلار استرالیا», «CAD · دلار کانادا», «NZD · دلار».
- `fa-desktop-insights.png` — fa insights (1280): prices board tiles with the
  unit line «دلار», 52-week range ending «… دلار», metals chip «۴٬۱۶۵ دلار»
  with the owner-authored outlook sentence, fx row «قدرت دلار».
- `fa-mobile-375-insights.png` — same anatomy at 375px, scrollWidth 375.

## Verification story

1. Gates: copy:audit clean (114 keys triaged round-47), 1,455 tests, typecheck
   6/6, lint 0 errors/15 advisories, budgets held (Insights chunk shrank
   599.38 → 597.79 kB raw — the dropped qualifier).
2. HTTP: served chunks byte-identical to the local build; «دلار آمریکا» ×0 in
   both served bundles; AUD ×86 / CAD ×2 qualifiers alive; /api/insights 32
   readings.
3. Browser (production data via read-only forwarder, fresh context — the
   Task-17 service-worker lesson honored by verifying the loaded chunk name):
   every fa surface speaks the convention; EN untouched; zero errors.
