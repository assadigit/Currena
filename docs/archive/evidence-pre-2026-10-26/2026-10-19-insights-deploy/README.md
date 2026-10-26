# Evidence — 2026-10-19 the insights rebuild ships (owner-approved deploy)

Production verification of `currena-api` `b137f3ef` from `insights-rebuild`
`1f70552` (AGENT_RUNBOOK execution Setup → Phase 7).

| File | What it shows |
|---|---|
| `01-private-gate-en.png` | the neutral AC-03 Private page screen (password box, disabled SIGN IN) — the fail-closed gate on production |
| `02-insights-en-hero.png` | signed-in Insights render: grouped status boxes (GLOBAL / AUSTRALIA), seated "?" tips, four-step meter inks, "+2 more" reveal, live readings |
| `03-export-panel-en.png` | the "Download data" panel with all four formats (Markdown / Plain text / CSV / Excel) + the calendar .ics |
| `04-insights-fa-hero.png` | fa toggle → `dir=rtl lang=fa`, full hero render |
| `05-insights-fa-375.png` | fa at 375 px — scrollWidth === 375, no horizontal bleed |
| `currena-insights-full-2026-10-16.csv` | the CSV downloaded through the real production UI (23,514 B): UTF-8 BOM (ef bb bf), dense per-section blocks, the E-23/E-24 audit columns |
| `currena-insights-full-2026-10-16.xlsx` | the XLSX downloaded through the real production UI (114,145 B): valid zip, docProps, "Normal" style, 10 named sheets |

HTTP smoke (same session): health 200 kv ok · unauthed `/api/insights`
→ 401 `private_page` `no-store` · authed → 200 `private, no-store`,
51 readings, ruleVersion 2 · `/admin` 401 · convert parity 100 USD →
26,790,000 IRR @ 267,900 (tgju). Zero page/console errors throughout.
