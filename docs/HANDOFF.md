# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **SESSION 23/30 (2026-11-12) — the PULLED-FORWARD reserve session: S25,
> the §15 Asia CPI fill session (BD-S22). GOAL: land the three D-36 Asia
> fills (Japan · Korea · India CPI YoY) end to end — the viable monthly
> source picked + verified (Rule 5, sandbox AND Worker egress, BD-S23a),
> the full §A ingest discipline (definitions → registry:generate → the
> AGENTS §A inventory → INDICATORS_AND_DATA_SOURCES.md → the pin tests →
> CHANGELOG), the three cards rendered on /asia-pacific with the §21 trio
> + the fa copy through the manifest, pd-s14 extended, the spec-v2 diff
> grown (recorded, never silent edits), gates ALL GREEN, DEPLOY + live
> verify. Milestones: M0 setup · M1 source verification (BD-S23a) · M2
> engine ingest · M3 display layer · M4 spec-v2 diff · M5 gates · M6
> deploy + live verify + records.**

> **S22 (2026-11-12) — the Phase K collection slot, CLOSED AS A WAITING
> SLOT · Session 22/30 · 8 remaining (BD-S22).** The external investor's
> review of spec §19 was NOT yet arranged — verified against every
> record the program can read (no answers supplied with the session
> kickoff; origin/main at HEAD `384dfd1` = the S21 counterpart close,
> nothing past the S21 records; the GitHub issues/PRs hold nothing since
> PR #47 [2026-11-08]; no uploaded file; the owner-side lever standing
> unanswered) — so, per the owner's standing instruction for this slot
> and the roadmap's own reserve rule, the slot closed honestly: NO
> answers collected, NO D-49+ recorded (the strategy log §5 carries the
> Round-4 PENDING marker — the answers land there as D-49+ the moment
> they exist), NO spec v2 entries produced, and the AF-1…AF-7 spec-side
> drift findings REMAIN parked for the spec v2 pass (never silent edits
> — the spec file untouched). NO deploy — a records session; nothing
> was fixed, so nothing shipped. The reserve pull-forward: **the §15
> Asia CPI fill session (the dedicated fill session carried since S14,
> BD-S14a/BD-S15d) is pulled forward into the Session 23 slot**; S23's
> feedback-build scope is DEFERRED (blocked on the same investor input
> — it runs in the first free slot after the answers land and the spec
> v2 entries exist). The full gates re-run ALL GREEN on the
> records-only tree (2m 39s · the suite 15,102 — exactly the S21
> count, no code changed · every doc-sensitive gate green over the
> touched docs).

## Current state (2026-11-12, after the S22 waiting-slot close)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **All TEN destinations render
  their own pages; Phases A–J are CLOSED** (S1 scaffold & navigation ·
  S2 data layer + `PLACEMENT.generated.md` · S3–S4 Global · S5–S6 Gold
  · S7–S8 World Markets + the zoom maps · S9–S11 USA · S12–S13 Europe
  · S14–S15 Asia · S16 Australia · S17 Commodities · S18 Currencies ·
  S19–S21 Integration). **Phase K is OPEN and WAITING on the
  investor**: S22 closed as a waiting slot (no answers to collect);
  S23 (feedback build) deferred; S24 (legacy retirement readiness)
  pending. The reserve work fills the gap — the §15 Asia CPI fill
  session pulled forward into the Session 23 slot.
- **DEPLOYED LIVE: currena-api `5593fd43`** (the S21 SPA — the NZX50
  mirror card + the honest copy + the Global cached-header fix) +
  **currena-markets `8f63c8fa`** (the S18 markets worker) —
  **UNCHANGED this session** (no deploy: a records session, nothing was
  fixed). Rollback stays one `npx wrangler rollback` from apps/api
  (every surface returns to the S19 shape `74777037`).
- **Gates (last full run, S22 on the records-only tree — ALL GREEN,
  2m 39s):** secret scan 8/1020 · typecheck 6/6 · eslint 0/0 ·
  copy:audit clean · narrator in sync + eval 50 · layer1
  11,819/11,819 · **the suite 15,102 — exactly the S21 count (zero
  code changed this session)** · build + budgets held (entry
  272.88/82.55, every page chunk within its row).
- **The S22 surfaces (what changed where):** records only — DECISIONS
  BD-S22 · the roadmap (the ⏸/⏭ legend markers + the S22
  waiting-close record + the S23 deferral + the S25 pull-forward entry
  + the progress board + the current-position note) · the strategy
  log (the Round-4 PENDING marker + the Phase-3 plan row) · CHANGELOG ·
  this file · the page-division README program state. Zero code, zero
  spec text, zero deploy.

## Next session (Session 23/30 — the PULLED-FORWARD reserve session: S25, the §15 Asia CPI fill session)

Read `AGENTS.md` (§14 — the owner's rules, incl. the §A indicator
maintenance discipline) first, then `docs/page-division/
01-SESSION-ROADMAP.md` (the S25 pulled-forward entry + the
current-position note), `02-PAGE-DIVISION-SPEC.md` §15 + §9 (the fills
+ the Asia sub-region sections), `docs/DECISIONS.md` (BD-S14a/BD-S15d
— the stale FRED-mirror evidence; BD-S22 — the pull-forward), and this
file. **This session SHIPS code → deploy + live verify at the close
(per DEPLOY.md).** Scope (the fill session):

1. **Pick a viable monthly source** for the three D-36 Asia fills
   (Japan · Korea · India CPI YoY): the national statistics bureaus
   directly (the Statistics Bureau of Japan, KOSTAT, MoSPI), a fresh
   FRED/IMF IFS series, or the World Bank annual as the
   lower-resolution fallback. **The FRED OECD mirror family is DEAD**
   (JPNCPIALLMINMEI + CPALTT01JPM659N end 2021-06; the KR pair ends
   2023-11; the IN pair ends 2025-03 — verified live in S14,
   BD-S14a); never re-try those ids.
2. **Verify before ingest (Rule 5):** candidate series verified live
   against the publisher — value + vintage — from this sandbox AND
   from production egress (the temp-probe pattern); unverifiable →
   discarded and recorded (DECISIONS.md).
3. **Ingest with the full §A discipline:** the definitions edit →
   `pnpm registry:generate` → the AGENTS.md §A inventory row →
   `docs/INDICATORS_AND_DATA_SOURCES.md` §1/§2 → the pin tests →
   `CHANGELOG.md`.
4. **Render the three cards on /asia-pacific** (Japan 2→3 · the
   Korea/Taiwan/HK + India sub-regions gain their CPI cards) with the
   §21 trio + the fa copy through the manifest; extend
   `pd-s14-backtest.ts`; the spec-v2 diff grows to cover the new
   cards (the spec §15 table rides the v2 pass — no silent edits).
5. **Gates:** source verification green at both venues · the
   registry/inventory/doc tables reconciled · the suite green · the
   §21 diff green incl. the new cards · the browser pass · deploy +
   live verify.

### The §15 FRED-only CPI fills for Asia — now the pulled-forward Session 23 scope (BD-S14a / BD-S15d / BD-S22)

The three D-36 fills (Japan · Korea · India CPI YoY) stay
verified-pending-ingest (Rule 5). The FRED OECD mirror family
candidates were VERIFIED STALE/discontinued live in S14 (BD-S14a):
JPNCPIALLMINMEI + CPALTT01JPM659N end 2021-06; KORCPIALLMINMEI +
CPALTT01KRM659N end 2023-11; INDCPIALLMINMEI + CPALTT01INM659N end
2025-03. The World Bank FP.CPI.TOTL.ZG (annual, fresh through 2025) is
a viable alternative but a DIFFERENT cadence + provider than the spec
§15 names. The national statistics bureaus (the Statistics Bureau of
Japan, KOSTAT, MoSPI) publish fresh monthly CPI but are NOT
already-integrated providers. The candidates + the alternative sources
are recorded in DECISIONS.md (BD-S14a + BD-S15d). **A dedicated fill
session picks a viable monthly source, verifies from production egress,
then ingests with the full §A discipline; the spec-v2 diff grows to
cover the new cards.** Their absence does not make the 11 placed Asia
cards "in build" — the chip retired at the S15 gates pass (BD-S15c).

## Owner-side levers waiting

1. **Arrange the external investor's review of the spec (§19 — the
   seven questions): Phase K's input and THE top lever.** The S22
   collection re-opens at the next free slot the moment the answers
   exist (→ D-49+ in the strategy log §5 Round 4 → the spec v2 entries,
   with AF-1…AF-7 riding that pass); S23's feedback-build scope follows
   it.
2. Ratify the `/converter` relocation (S1's build-session decision).
3. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
4. Ratify or redirect the BD-S3…BD-S22 decision set (the latest:
   **BD-S22** — the S22 waiting-slot close + the §15 fill-session
   pull-forward; all recorded, none blocking).
5. Triage the queued unreviewed fa strings (now ~1146: the ~1142
   previous + the 2 S21 strings; every session's corpus-pinned values
   are verified byte-for-byte by their copy-pin tests).
6. The ecb-drf provider timeout (a maintenance-session item, queued
   behind the fill session): the S18/S19 data-refresh runs kept it
   held on last-good (2.5%, flagged stale) — it did NOT self-clear
   across rungs (gold-aud, the other S18 transient, DID self-clear).
   The fail-closed design is holding the correct value honestly; a
   maintenance session should look at the ECB fetch (the runbook:
   docs/INDICATORS_AND_DATA_SOURCES.md + the /admin console's
   per-source status, which needs the owner's REFRESH_SECRET).

## Known state worth knowing

- **The PortWatch runbook note (BD-S21e):** never run the §21 data
  audit's portwatch leg Tuesdays 11:00–14:00 UTC — the IMF's scheduled
  maintenance window ("Every Tuesday from 6:00 AM to 9:00 AM ET, Daily
  Ports and Daily Chokepoints Data will be temporarily unavailable");
  the endpoint answers 499 Token Required to everything inside the
  window and returns after it.
- The S19 meta/OG pass is CLIENT-SIDE (the SPA-honest approach,
  BD-S19c): JS-executing readers get the per-route tags; non-JS
  crawlers see the static whole-product defaults in index.html. If the
  owner ever wants per-route link previews for non-JS crawlers
  (Telegram/X cards), the options are SSR/prerender or a Worker-side
  <head> injection — an owner decision, recorded in BD-S19c.
- The breadcrumbs render in the pages' ready + cached states (they
  ride each page's own heading block — BD-S19b). The loading/error
  states show the page's own honest lines, no trail; that is by design
  (the trail is wayfinding for content, not a chrome element).
- The strategy log's §8 session table (docs/page-division/
  03-STRATEGY-LOG.md) stops at S11 — the later sessions' records live
  in the roadmap delivery records + this file (the convention moved at
  S12). A back-fill is a nice-to-have, never blocking.
- The per-page live backtests (the S20 toolkit): pd-s4 (Global 84) ·
  pd-s5 (Gold 150) · pd-s7 (World Markets 56) · pd-s8 (zooms 13) ·
  pd-s9/s10 (USA 69/173) · pd-s12 (Europe 8) · pd-s14 (Asia 11) ·
  pd-s16 (Australia 28) · pd-s17 (Commodities 24) · pd-s18
  (Currencies: cards + rules + board) — all re-runnable against
  production from apps/web/scripts/ (pass `--base https://currena.ir`
  where the default is localhost).
- The S20 data-audit tool is re-runnable for any later session's §21
  data-audit gate: `pnpm --filter @currena/web exec tsx
  ../../apps/web/scripts/pd-s20-data-audit.ts` (mind the PortWatch
  Tuesday window above).
- **The parallel-session rule (hardened through BD-S18-parallel-3 and
  BD-S21-parallel):** launch exactly ONE session per roadmap slot —
  one prompt = one session = one slot. If a kickoff arrives for a slot
  already delivered (origin/main carries its records), run the
  counterpart close, never a re-execution.
