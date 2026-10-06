# Insights: documentation set

Insights is a new page on currena.ir (`#/insights`) that explains the state of global and Australian finance through about 30 indicators, in plain language, in Farsi (RTL) and English. It gives **general information about what indicators have historically tended to mean. It never tells anyone to buy or sell.**

Status: **planning complete, no code written.** Everything here was prepared on 2026-10-06.

## Read in this order

| File | What it is |
|---|---|
| `01-indicator-spec.md` | The indicators, their warning rules, and how the summary line is calculated |
| `02-page-design-spec.md` | How the page should look and behave (for the designer, and for the agent building it) |
| `03-data-sources.md` | Every data source: endpoint, series, access, cadence, licence status, fallback |
| `04-roadmap.md` | Architecture, phases with approval gates, risks, definition of done |
| `05-agent-kickoff-prompt.md` | The prompt to paste into the agentic coding session |

## Rules that always apply

1. Read the root `AGENTS.md` first. Its rules are not suspended for this feature (TypeScript strict, zod contracts in `packages/core`, storage behind an interface, RTL-native, tests never hit live sites, secrets never stored).
2. Work phase by phase and stop at every gate (✋) for owner approval.
3. Never show invented or guessed data. If a source fails, show the stale value with its date, or "unavailable".
4. No "buy", "sell" or personal-advice wording anywhere in the UI or copy.

## Decisions already made by the owner

- Page is bilingual (Farsi RTL + English) with the existing language toggle.
- Main use: learning and understanding (explanations and context), mostly on phones.
- Look: calmer and more analytical than the rates pages, but clearly Currena.
- Persian digits in the Farsi UI; Jalali dates always in Farsi; chart time axes keep time running left to right in Farsi.
- Seven features: summary line, trend + 10-year position on every card, "what changed this week", key-dates calendar, update date + source on every card, "what this means for you" lines, one disclaimer reviewed by an Australian financial-services-qualified person.
- Per-indicator share links are for a later version.
- The reader is assumed to be based in Australia, so Australian indicators are highlighted.

## Decisions still open (needed at Gate I0)

Status after Phase I0 (2026-10-06):

1. **Cloudflare plan — DECIDED (D1): Free, permanently.** Ingestion runs outside the Worker (daily GitHub Actions runner for heavy sources; the existing Worker cron keeps light live sources). Compact snapshot encoding keeps everything inside the free limits; no indicator is omitted for tier reasons. Recorded in `docs/PROGRESS.md`.
2. **Substitutes for blocked indicators — DECIDED (D2):** credit/financial stress → `stress-stlfsi` (STLFSI4); VIX → link-out only; S&P 500 / breadth → out of v1 (P3); Shiller CAPE also deferred to P3 (no current licensed source).
3. **Silver and Bitcoin sources — DECIDED (D3):** gold-api.com primary for both spots (terms permit commercial display); Bitstamp public OHLC for Bitcoin history; World Bank Pink Sheet for silver monthly history.
4. **Disclaimer review — ANSWERED (2026-10-06): not needed for v1.** Owner: "I dont need disclaimer for now." No reviewed disclaimer in v1; the no-buy/sell/no-advice wording rule remains in force regardless.
