# AGENT_HANDOFF — Currena gap-closure S6 (FINAL — program complete)

> The six-session gap-closure program is COMPLETE (37/37 milestones,
> 2026-11-03). This handoff is the recovery record for the ONE remaining
> execution: the push of the UNION chain, which the closing sessions
> could not perform (no credentials). Read together with
> `docs/gap-closure/PROGRESS.md` (the authoritative log — the S6 sixth
> + SEVENTH claim notes + the owner action items) and
> `docs/gap-closure/CASE-STUDY.md` (the program summary).
> Never record credentials here.

## A. The one remaining task (for a credentialed session)

> **THE 2026-11-03 UNION (the seventh session):** a PARALLEL session
> independently built M6.3, committed it (`d6f60b6`, 14,519 green),
> PUSHED it to origin/main and DEPLOYED it — production runs that
> build today (its Insights chunk is byte-identical to the union's
> build). That session was lost before its claim/tick. The seventh
> session performed the parallel-session union per the S5 precedent
> (first-landed design wins): `d6f60b6`'s code IS the union's code;
> the second variant's chain contributed the M6.4 proposal + evidence,
> the M6.5 quality-pass evidence, the M6.6 docs close and the records.
> **Union gates: ALL 9 GREEN — 14,519 tests** (the diff vs `d6f60b6`
> touches ONLY docs/records/evidence — zero code files).

1. `cd /home/z/currena && git fetch origin && git rebase origin/main`
   (in case more parallel work landed), then `git push origin main` —
   the local `union-wip`/`main` carries the union chain
   (`c2a91fe` M6.3-union · `e66a6b9` M6.4 · `b84660f` M6.5 ·
   `e1ae37b` M6.6 + the verification record), all gates-green at
   14,519 tests. Last pushed: `d6f60b6`.
2. **No deploy is required for the readings** — production already
   runs `d6f60b6`'s build (byte-identical web bundle; the union
   changes no code). An optional hygiene deploy from the union head
   aligns provenance; the markets worker is unchanged either way.
3. The readings land via the scheduled GHA runs on the PUSHED code
   (repo-secret auth — no local credentials involved):
   - the **04:10 UTC main rung** derives `btp-bund-spread` (the Italy
     leg rides the OECD mirror bulk group); the **04:20 UTC rung-2
     bootstrap** arms on the missing `usd-reserve-share` /
     `sp500-breadth-ratio` stage entries → fetches, patches, writes —
     and the same bootstrap owns the **M6.2 China pair's landing**
     (china-property-investment + china-steel-output).
   - or expedite from a credentialed session:
     `pnpm --filter @currena/insights rung2-run --cofer --breadth`
     (+ `--nbs` if the China landing is still pending) and the main
     phase for the spread.
4. Browser-verify on production (NO credentials needed — anyone can
   do this from ~04:25 UTC): the three M6.3 cards in the
   **dedollar-concentration shadow gauge** (the parallel variant's
   design — `usd-reserve-share` + `sp500-breadth-ratio` in a
   dedicated gauge; `btp-bund-spread` in borrowing) + the two China
   cards in the trade lane, in EN + fa.
5. Record the verified lines under M6.3/M6.2 in PROGRESS.md and clear
   the owner action item.

## B. What the S6 close produced (the union, all gates-green at 14,519)

- **M6.3** — built twice in parallel; the union ships the FIRST-LANDED
  variant (`d6f60b6`: the dedollar-concentration gauge design, the
  SDMX 3.0 JSON endpoint, staleAfterDays 200 — pushed + deployed by
  its session). The second variant's unique contributions that ship:
  the twice-verified provider evidence (`evidence/M6.3/`) + the
  records. Its render design (the dollar-lane foot) is history.
- **M6.4** (`e66a6b9`): the promotion PROPOSAL — `docs/gap-closure/
  PROMOTION-PROPOSAL.md` + the reproducible harness/evidence in
  `evidence/M6.4/`. cfnai + ebp proposed; NOTHING promoted (G-5); the
  owner's approval is the open decision.
- **M6.5** (`b84660f`): the final quality pass — the DOLLAR_STRENGTH_IDS
  catch was the second variant's bug (moot under the gauge design; the
  fix does not ship); the design-neutral checks stand (copy:audit,
  bundle budget, the free-tier audit, the data-health status); 22
  screenshots kept as that pass's evidence.
- **M6.6** (`e1ae37b`): AGENTS.md §A/§B + INDICATORS_AND_DATA_SOURCES.md
  (the stale 123-line → 161, the markets-au endpoint row) +
  MAINTENANCE.md refreshed; CASE-STUDY.md written; PROGRESS.md final
  (37/37, 100%); the owner action items updated.

## C. The standing constraints (unchanged)

G-3 (never remove/hide), G-5 (nothing scores without the owner's
approval), provider-exact numbers only, fail-closed parsers,
credentials only from the environment and never printed, the full
`pnpm gates` before every push, the CHANGELOG heading-count discipline,
the fa copy-audit flow (next round: 76), the parallel-session protocol
(pull --rebase before committing).

## D. Git state (as of the seventh session, 2026-11-03 ~01:45 UTC)

- origin/main = `d6f60b6` (the parallel session's M6.3 — pushed +
  deployed).
- Local `union-wip` (to fast-forward `main`): the union chain on top —
  `c2a91fe` · `e66a6b9` · `b84660f` · `e1ae37b` (+ the verification
  record commit). **Not pushed** (no GitHub token in this session's
  environment; `git push` verified to fail with no auth).
- Production: currena-api serves `d6f60b6`'s build (byte-identical to
  the union's web build) + markets `58c4eebd`; the snapshot serves 158
  readings — the five pending ids (the China pair + the M6.3 trio)
  land at the 04:10/04:20 UTC GHA runs on the pushed code.
- The old `main` ref (the pre-union `3b5b879..e278fbb` chain) is
  preserved as the second variant's history; its unique content lives
  on in the union.
