# New-indicator checklist (the gap-closure PR gate)

The `docs/gap-closure/00-OPERATING-RULES.md` §7 recipe as a copy-paste
checklist. A PR that changes an indicator without every box ticked is
incomplete (AGENTS.md's maintenance rule rejects it).

Source: `00-OPERATING-RULES.md` §7 + AGENTS.md "The Insights data inventory".
Maintained by gap-closure S1-M1.7 (2026-10-31).

## The checklist

- [ ] **Definition** — `packages/insights/src/definitions.ts` (or the
  markets/fx definitions) edited; `voter: false` unless S6 promotes it
  (G-5: new scored items start context-only, shadow mode).
- [ ] **Adapter + parser + fixture + tests** — fixtures under
  `packages/insights/fixtures/`; tests never hit live sites; the parser
  validates shape (column count, header text, units, date format, plausible
  ranges) and fails closed.
- [ ] **Licence records** — an L0–L3 level with quoted terms + date read in
  `docs/insights/LICENCES.md` and `RISK_REGISTER.md`; a method card in
  `SCRAPING_SPEC.md`; entries in `packages/insights/src/sources.ts`
  (`SOURCE_RISK_REGISTER`) and `licences.ts`. A NEW L2 source starts with
  `owner_accepts = false`: build it, leave it disabled, list it for the owner.
- [ ] **Cadence + maxAge + history** — cadence, `staleAfterDays`, and the
  history phase (daily vs periodic) chosen and recorded in the definition.
- [ ] **Ingest capacity** — the fetch rides a rung with headroom (see
  `docs/gap-closure/RUNGS.md`): NEVER the 04:10 main rung (47/50). New
  sources register in `apps/api/src/insights-extra-rungs.ts` (rung3/rung4,
  own budget, own status, sweep-healed). No new cron trigger.
- [ ] **Registry regenerated** — `pnpm registry:generate` (refreshes
  `data/indicators.json`, `indicator-audit.json`, `site-mode-overrides.json`).
- [ ] **Layer-1 copy EN + fa** — `apps/web/src/i18n/insights-copy-en.ts` and
  `insights-copy-fa.ts` (`layer1.indicators[id]` + glossary terms).
  *The existing layer1 strict validator (`pnpm gates` gate 7, part of the
  7,930 assertions) FAILS the build when a new indicator id lacks Layer-1
  copy in either language — reused as-is per S1-M1.7, no new check needed.*
- [ ] **Persian copy audit** — `pnpm copy:audit` (fails on the new fa
  strings) → review the wording (no em dashes, terminology from
  `persian-terminology.md`) → `pnpm copy:audit:update` with the round +
  reference (see `docs/localization/persian-copy-workflow.md`).
- [ ] **Narrator vocabulary** — `pnpm narrator:vocabulary` then
  `pnpm narrator:vocabulary:check` (the Layer-2 summary must know the id).
- [ ] **Docs** — AGENTS.md §A inventory row added/updated +
  `docs/INDICATORS_AND_DATA_SOURCES.md` §1 and §2 tables + the counts bumped.
- [ ] **CHANGELOG** entry under the round; `docs/gap-closure/PROGRESS.md`
  ticked with evidence.
- [ ] **Gates green** — `pnpm gates` (all 9) before the deploy; EN/fa
  screenshots at 360 and 1200 px in `docs/gap-closure/evidence/<milestone>/`.

## Reminders

- Never invent a series id, URL, column name, threshold or number — verify
  from the provider's own response; otherwise mark "not verified" and do not
  ship the card (G-4).
- Never remove or hide an existing indicator, card, index or country (G-3).
- Truth rules: stale/unverified inputs produce a stale tag or "can't tell
  right now", never a verdict; wording describes conditions only.
