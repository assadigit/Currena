# Insights: documentation set

Insights is a page on currena.ir (`#/insights`) that explains the state of
global and Australian finance through **100 indicators**, in plain language,
in Farsi (RTL) and English. It gives **general information about what
indicators have historically tended to mean. It never tells anyone to buy
or sell.**

Status: **live in production** — 100 indicators (48 voting), zero hidden in
public mode, all sources free and keyless (except EODHD on the markets
worker, which is owner-personal-plan).

## Where to look first

- **The consolidated reference** — what indicators Currena has, where each
  one is fetched from and how often, the public JSON API spec, and the
  known gaps: **[`../INDICATORS_AND_DATA_SOURCES.md`](../INDICATORS_AND_DATA_SOURCES.md)**
- **The deploy runbook**: [`../DEPLOY.md`](../DEPLOY.md)
- **The self-check output** (regenerated daily by the scheduled GitHub
  Action and on every `pnpm --filter @currena/insights selfcheck`):
  [`SELF_AUDIT.md`](SELF_AUDIT.md) + the dated export under `exports/`

## Read in this order

| File | What it is |
|---|---|
| `AGENT_RUNBOOK.md` | The agent loop procedure (read completely first) |
| `RULES.md` | Hard rules, source risk levels, public-mode mitigations, wording + display rules |
| `RISK_REGISTER.md` | Source levels + the owner's recorded acceptance |
| `LICENCES.md` | The licence register — every source's terms quote + date read |
| `SCRAPING_SPEC.md` | The per-source method cards (M1–M5 ladder) |
| `UI_SPEC.md` | The visual + interaction spec, with acceptance tests U-01 to U-14 |
| `MAINTENANCE.md` | The owner's weekly routine + the manual-entry update steps |
| `OWNER_SETUP.md` | The owner's hand-setup steps (secrets, deploy, rollback, panic switch) |
| `GLOSSARY.md` | The vocabulary |
| `BACKTEST.md` | The backtest discipline |
| `01-indicator-spec.md` | The indicators, their warning rules, and how the summary line is calculated |
| `02-page-design-spec.md` | How the page should look and behave |
| `03-data-sources.md` | Per-source data notes (endpoint, series, access, cadence, fallback) |
| `04-roadmap.md` | Architecture, phases with approval gates, risks, definition of done |
| `05-ux-audit-I6.md` | The I6 UX audit |
| `06-ux-round-2-spec.md` | Round-2 work order (signal-first density, owner decisions D1–D9, blocks R1–R28) |
| `08-uiux-audit-2026-10-10.md` | The 2026-10-10 UI/UX audit |
| `09-live-prices.md` | The live prices spec (the prices board) |

## Rules that always apply

1. Read the root `AGENTS.md` first. Its rules are not suspended for this
   feature (TypeScript strict, zod contracts in `packages/core`, storage
   behind an interface, RTL-native, tests never hit live sites, secrets
   never stored).
2. Work phase by phase and stop at every gate (✋) for owner approval.
3. Never show invented or guessed data. If a source fails, show the stale
   value with its date, or "unavailable".
4. No "buy", "sell" or personal-advice wording anywhere in the UI or copy
   (the T-19 forbidden-words scan enforces this — see `validation-step3.ts`).

## Historical material (preserved, not deleted)

`docs/insights/archive/` carries the now-completed rebuild's spec/fix/
defect/baseline docs (Phase 0–9, the gold-balance iteration, the A-1..A-10
build cycle's audit/spec/prompt/report). `docs/insights/archive/screenshots-pre-2026-10-26/`
carries the historical deploy/verification screenshots. Git history is
the ultimate backup; the on-disk archive keeps the working tree navigable.
