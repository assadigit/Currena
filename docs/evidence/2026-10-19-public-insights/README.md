# Evidence — 2026-10-19b the Insights page goes PUBLIC (owner decree)

Production verification of `currena-api` `36d76363` (SITE_MODE=public).

| File | What it shows |
|---|---|
| `01-public-insights-en.png` | the Insights page signed-out — NO private gate, GLOBAL + AUSTRALIA groups live, world sections hidden |
| `02-public-insights-fa.png` | fa (RTL) render, same public surface |
| `03-public-insights-fa-375.png` | fa at 375 px — scrollWidth === 375, no bleed |

HTTP matrix (same session): unauthed `/api/insights` → 200 `public,
max-age=60` with displayMode=public, ruleVersion 2, 27 public-ok
readings and ZERO hidden-id leaks · `/api/insights/markets` + `/fx` →
404 `hidden_site_mode` · `brent/history` → 404, `us10y/history` → 200 ·
health 200 kv ok · `/admin` 401 · convert parity 100 USD → 26,790,000
IRR @ 267,900 (tgju). Zero console/page errors.
