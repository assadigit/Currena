# S6 — New Zealand link, China and world links, promotion and polish

**Estimated length:** 3 to 4 hours. **Depends on:** S2 to S5 done (or recorded as blocked). Read `00-OPERATING-RULES.md` first.

## Why

1. Add the last gaps: New Zealand (only if the data shows a real connection), China
   property/steel (the main driver of iron ore), de-dollarization and concentration.
2. Decide which shadow (context-only) indicators earn a vote, using measured evidence.
3. Final quality pass and a portfolio case study.

## Milestones

### M6.1 New Zealand link (evidence first)
The owner's rule (G-6): include New Zealand only if it is genuinely economically connected to Australia.
1. **Measure before building.** From stored history (or a one-off Yahoo/FRED fetch), compute and record in `docs/gap-closure/evidence/M6.1/`: rolling 1-year and full-sample correlation of daily returns, ASX 200 vs NZX 50 (use the same currency or state the effect); correlation of AUD/USD and NZD/USD; the AU vs NZ 10-year yield spread over time. Cite the structural links from reliable official sources you verify (for example share of NZ banking assets owned by Australian-owned banks, and trade shares from Stats NZ or DFAT). Do not state any structural number from memory.
2. **Decision rule:** include NZ if the measured correlation is high and stable **and** at least one structural link is verified from an official source. Record the decision and the numbers in PROGRESS.md either way.
3. If included, add (verified only): NZX 50 (to the Australian markets board, labelled as "New Zealand"), AUD/NZD (Frankfurter derived), the RBNZ Official Cash Rate and NZ 10-year yield (use the RBNZ source if machine-readable and reachable; otherwise FRED/OECD monthly mirrors with a "monthly average, lagged" label). All context-only.
4. Layer-1 copy EN + fa; wording explains the connection as a tendency.

Acceptance: evidence file committed; decision recorded; if included, indicators live and verified.

### M6.2 China property and steel
1. Verify the NBS English monthly "National Economy" release URL pattern and table layout used by the existing `nbs` provider (PMI and CPI come from other releases). Extract: real-estate development investment (year-to-date, annual %), 70-city new-home price changes (if present in the release), crude steel output. Do not guess table positions; save the release as a fixture and test the parser.
2. Add `china-property-investment`, `china-home-prices` (if verified), `china-steel-output`, via the existing `nbs` provider in a rung (monthly gate). Context-only. Link them in the "Together" iron-ore relationship as supporting readings (tendency language only).
3. If the release layout is unreliable, reject (G-4) and record the evidence.

Acceptance: indicators match the NBS release for the same month; fail-closed parser; copy EN + fa.

### M6.3 De-dollarization and concentration
1. **USD share of global reserves** (IMF COFER): verify dataset id, licence and freshness (quarterly, lagged). Add `usd-reserve-share` if reliable.
2. **Market concentration proxy**: equal-weight vs cap-weight S&P 500 ratio from Yahoo (`RSP` and `SPY`; L2, already owner-accepted for Yahoo). Add `sp500-breadth-ratio`; label as a proxy; verify history continuity. Record the limitation: this is a proxy for the share of the largest companies, not their exact weight.
3. Optional (only if the OECD mirror is already in use and reliable): `btp-bund-spread` monthly, as a euro stress indicator, labelled lagged.
4. The "foreign holdings of Treasuries" story from S2 is the main reserve-diversification evidence; add a short cross-link in copy, not a new indicator.

Acceptance: each added indicator verified against its source; context-only; copy EN + fa.

### M6.4 Shadow review and promotion proposal
Goal: decide which context-only indicators and new gauges should vote, using the repo's backtest discipline.
1. Read `docs/insights/BACKTEST.md` and `BACKTEST-GOLD.md` (the gold program's harness and its "no edge" verdict show how strict this repo is). Reuse the harness approach: frozen thresholds stated in advance, no lookahead, every cell carries its sample size.
2. For each shadow candidate with enough history (state the minimum, for example 5 years of the relevant series): evaluate whether its warning state precedes the outcome the gauge is about (for example credit stress vs equity drawdowns; chokepoint disruption vs oil moves; Australian activity vs unemployment). Report effect sizes, sample sizes and the base rate honestly. Candidates with **no measurable relationship stay context-only**.
3. Write `docs/gap-closure/PROMOTION-PROPOSAL.md`: for each candidate, evidence, proposed rule (threshold type and value), proposed gauge, and the effect on the current verdict counts (before/after at today's data). Mark the recommendation (promote / keep as context / drop).
4. **Stop and ask the owner to approve the list.** Do not promote anything without approval (G-5). Rebalancing existing voters (for example the gold-specific voters in `market-stress`, the labour-voter overlap in `growth-health`) is a separate, explicit owner decision recorded in the proposal; do not do it unasked (G-3).
5. After approval: flip `voter` flags, bump rule versions (`ruleVersion.ts`), update gauge descriptions and the "not scored yet" labels, update tests, narrator vocabulary and docs, deploy, verify, and record before/after verdicts.

Acceptance: proposal committed with evidence; owner's approval recorded (date and what was approved); only approved promotions deployed; verdict counts documented before and after.

### M6.5 Final quality pass
1. `pnpm copy:audit` fully clean; a review pass of every new fa string against `docs/localization/persian-terminology.md`; no em dashes in fa.
2. Accessibility sweep of every new component: keyboard, focus, `aria` on sortable tables and meters, contrast in light and dark, 44px targets, reduced-motion.
3. Responsive screenshots at 360, 768 and 1200 px in EN and fa for: the Treasury holders section, the new Global groups, the geopolitics gauge, the Australia activity/external gauges, the Australian markets board, and the "Next up" calendar. Save to `docs/gap-closure/evidence/M6.5/`.
4. Performance: bundle budget (`scripts/check-bundle-budget.mjs`); if the budget is exceeded, split the new sections into lazy chunks rather than raising the budget. Verify the page-load request count did not grow (the page still reads one snapshot key plus the dataset endpoints).
5. Free-tier audit: report final KV writes/day, reads, subrequests per rung, and cron triggers in use (must still be within rules §4).
6. Data-health review: no new `unavailable` or unexplained `stale` cards on production for 3 consecutive daily runs (check `/api/insights/status`).
7. Fix anything found; record what was fixed.

Acceptance: all checks evidenced in PROGRESS.md; gates green; no regressions to existing pages.

### M6.6 Final docs, case study and credential hygiene
1. Refresh `AGENTS.md` §A and §B (counts, new boards, new datasets), `docs/INDICATORS_AND_DATA_SOURCES.md` (regenerate the inventory, counts, source table, endpoint list, known gaps, rejected list), `docs/insights/MAINTENANCE.md` (new weekly checks), CHANGELOG.
2. Write `docs/gap-closure/CASE-STUDY.md` for the owner's portfolio: the problem (feel the world's economy without reading news), the design principles (honesty, plain language, bilingual, shadow-mode scoring), the constraints (free tier, licences), before/after counts (indicators, gauges, datasets, boards), three decisions worth telling (for example: separating real selling from price effects in the Treasury table; refusing to score unproven indicators; rejecting sources that failed the reliability bar), and screenshots from the evidence folders. Factual, no marketing language.
3. Final PROGRESS.md: every box ticked or explicitly `rejected`/`blocked` with reasons; gap coverage list complete; overall percentage.
4. Credential hygiene: confirm with the owner that every credential pasted into the planning chat was rotated (record "owner confirmed" only), the old Cloudflare token in git history was revoked, and `pnpm gates` secret scan is clean over the full tree.
5. Next steps note: remaining ideas that were rejected or need a paid plan (for example the Cloudflare paid plan would lift subrequest limits; EODHD paid plan would enable the companies table).

Acceptance: docs consistent with the code (the pin tests in `definitions.test.ts` pass); case study committed; PROGRESS.md final; owner action items listed. There is no next-session prompt; print a final summary instead.
