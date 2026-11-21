# Final Screenshot Set — Session 10 (the Q3-A execution) (2026-11-2x)

The Q3-A change's visual evidence — **the AFTER; the before is the s9 set on record** (`05-en-desktop-signals.png` and the live captures). Captured over the visual harness's fixture server (the built SPA + the synthetic fixtures on :4050 — never a live site) with the committed harness `apps/web/visual/gux-s10-screenshots.plw.ts` (the `gux-s10` playwright project). The pairing discipline: en/fa × light-desktop (1440) + dark-mobile (390), the REAL theme key (S8-D3). **12/12 green.**

The two survivor-seat data planes (`/api/insights/gold-ifbought` + `/api/insights/gold-lbma`) ride in-memory route interceptions (the gb-s4 pattern): the fixture server serves the snapshot/OHLC/expectations planes the CHANGED surface reads, but not these two — and the seats' LOADED states are the evidence, so the payloads are synthesized in the harness exactly against the `@currena/core` schemas (10 anchors + the running month per asset; the vault's 24 months + the clearing's 120).

| File | Locale | Width | Theme | Content / state |
|---|---|---|---|---|
| `signals-desktop-en-light.png` | en | 1440 | light | The CHANGED surface: the gold-only Signals card (the interactive chart + the measured note + the gold footing row + the five lane drill links) |
| `signals-desktop-fa-light.png` | fa (RTL) | 1440 | light | The same, fa copy (round 95: «شرایط مؤثر بر طلا») |
| `signals-mobile-en-dark.png` | en | 390 | **dark** | The gold-only card at the narrow width — genuinely dark (the S8 real-key discipline) |
| `signals-mobile-fa-dark.png` | fa (RTL) | 390 | **dark** | The same, fa |
| `full-mobile-en.png` | en | 390 | light | The full page (the section in its mobile context) |
| `full-mobile-fa.png` | fa (RTL) | 390 | light | The full page, fa |
| `ratio-seat-en.png` | en | 1440 | light | SURVIVOR SEAT 1: the gold-silver ratio's own seat (the stress lane's voter card — silver's canonical read; rides the snapshot fixture) |
| `ratio-seat-fa.png` | fa (RTL) | 1440 | light | The same, fa |
| `ifbought-en.png` | en | 1440 | light | SURVIVOR SEAT 2: the if-you'd-bought calculator expanded — the silver asset row beside gold/S&P/BTC (the plane rides the in-memory interception) |
| `ifbought-fa.png` | fa (RTL) | 1440 | light | The same, fa |
| `vault-silver-row-en.png` | en | 1440 | light | SURVIVOR SEAT 3: the London vault card expanded — the silver row (the vault's silver tonnes line; the plane rides the in-memory interception) |
| `vault-silver-row-fa.png` | fa (RTL) | 1440 | light | The same, fa |

Every capture asserts the contract in-test before the shot: the gold chart, the measured note and the gold footing row render — and `[data-verdict-metal="silver"]`, `[data-verdict-chart="silver"]`, `[data-silver-keep-small-note]` and `[data-footing-metal="silver"]` are all ABSENT from the section (the Q3-A enumeration: the chart + the measured note + the price footing, gold-only).
