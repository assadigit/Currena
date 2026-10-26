# Currena Insights: Spec Package

Version 3, 2026-10-17. For https://currena.ir/#/insights (repo assadigit/Currena).

## Install (2 minutes)

1. Unzip this package at the **root of the repository**. It creates `docs/insights/`.
2. Commit the files to a branch or to main (they are documents only).
3. Open `docs/insights/START_PROMPT.md`, copy the prompt inside it, and paste it into a new coding-agent session with access to the repository.

That is all. The agent follows `docs/insights/AGENT_RUNBOOK.md` on its own and works on a branch. It never deploys to production.

## What is in the package (`docs/insights/`)

| File | What it is |
|---|---|
| `START_PROMPT.md` | The one prompt to start the agent. |
| `AGENT_RUNBOOK.md` | The procedure: phases 0 to 9, gates, final output. |
| `RULES.md` | Hard rules, your recorded decisions, source risk levels (L0 to L3), public-mode mitigations, wording and data display rules. |
| `RISK_REGISTER.md` | Every data source with its level and your recorded acceptance of risk. |
| `UI_SPEC.md` | The new hero, card design, states, relationship cards, the gold and silver balance, tables, accessibility, and screenshot tests. |
| `SCRAPING_SPEC.md` | How data may be fetched (method ladder), the bounded discovery procedure, per-source method cards (CNN Fear & Greed, ASX RBA Rate Tracker and others), validation and tests. |
| `INSIGHTS_STEP3_SPEC.md` | Published indicators, standard definitions, relationship rules, Australian coverage. |
| `INSIGHTS_DEFECTS_2026-10-15.md` | The 24 defects found in your 15 October export, with evidence lines. |
| `INSIGHTS_FIX_SPEC.md` | Foundation (registry, generated text, tests, safe failure), fixes and additions. |
| `GLOSSARY.md` | One vocabulary for the page and the specs. This is the "G" in your request. If you meant something else, add it as a file here. |
| `baseline/currena-insights-full-2026-10-15.md` | The export the defects were found in. |

## What changed from the previous package

- **The page stays public.** The earlier "private by default" design is replaced by public-mode mitigations (attribution, minimum data in public endpoints, owner-only export, rate limiting, contact line) plus a **panic switch** that turns every Insights data endpoint private within one refresh cycle.
- **Source risk levels.** Sources already live (EODHD, Yahoo Finance, gold-api.com, Cboe VIX via FRED) are L2 and covered by your recorded acceptance. New L2 sources start disabled until you flip them in `RISK_REGISTER.md`. L3 sources (terms explicitly forbid it, robots.txt disallows it, login or payment needed, or the site blocks the request) are never used.
- **Fetching is defined, not improvised.** The agent does not hunt for scraping tricks. It follows a fixed method ladder and a three-attempt discovery procedure, and a block ends the attempt.
- **UI is specified.** The hero, cards, states, stock table, relationship cards and the gold and silver balance (your decisions, with a gauge fallback) are all in `UI_SPEC.md`.

## What the agent cannot do for you (it writes `OWNER_SETUP.md` with exact commands)

- Set the owner token secret (`INSIGHTS_OWNER_TOKEN`) and any missing API key.
- Review and merge the pull request.
- Deploy to the preview, then to production.
- Flip `owner_accepts` in `RISK_REGISTER.md` for new L2 sources you want enabled (CNN Fear & Greed, ASX Rate Tracker, Shiller CAPE).
- Put approved text for the "Know before you buy US shares" box into `docs/insights/approved-text/` after an Australian tax professional reviews it. Until then, the box shows only the exchange-rate and fees lines.
- Optionally add your reference schematic for the gold card to `docs/insights/reference/`.

## Honest notes

- Keeping the page public means you carry the legal risk for L2 sources. The package lowers it but cannot remove it. "Non-commercial" does not by itself make third-party data free to display. I am not a lawyer.
- Publishing verdict-style pages to the public in Australia can raise financial-advice questions even without income. The package keeps wording to general information and conditions, and puts a disclaimer on the page. Consider a short review by an Australian professional.
- Provider terms were read through summaries and search results on 16 and 17 October 2026. The agent re-reads them from the sources and records the lines in `LICENCES.md`.
