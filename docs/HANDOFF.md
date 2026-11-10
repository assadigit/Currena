# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

> **S22 GOAL (written at session start, 2026-11-12):** Phase K slot —
> collect the external investor's answers to spec §19 → record as D-49+ →
> produce the spec v2 entries. **If the review is not yet arranged (the
> owner's standing instruction for this slot): close S22 honestly as a
> WAITING slot and pull the first reserve session forward into the Session
> 23 slot — do not invent work.** Milestones: M0 this goal · M1 the
> waiting-close decision records (DECISIONS BD-S22 + the strategy log's
> Round-4 pending marker) · M2 the roadmap resequencing (the S23 slot ←
> the pulled-forward §15 Asia CPI fill session) · M3 the full gates green
> on the records-only tree · M4 the mirrors + this file's close rewrite +
> the next-session prompt.

> **S21 (2026-11-12) — the spec-vs-implementation audit — Phase J
> CLOSED. Session 21/30 · 9 remaining.** The S21 scope delivered
> whole: (a) the full §4–§14 diff vs the code AND the live site — the
> verdict: the spec is implemented faithfully, every prior recorded
> deviation (BD-S3…BD-S19) re-confirmed as holding, two informational
> notes recorded (the narrator's 2-line clamp; the reused map's
> always-visible cards vs the spec's loose "hover" phrasing); (b) FOUR
> deviations FIXED and DEPLOYED (currena-api `5593fd43`, WEB-ONLY — the
> markets worker stays `8f63c8fa`): the §9 item 5 NZX50 mirror card on
> /asia-pacific's Pacific—NZ section (the AU Markets board's own nz50
> row, one board one vocabulary, linking to /australia — replacing the
> FALSE both-locale "The NZX50 rides the Asia zoom map above" sentence,
> which the audit caught live on production), the Global cached-header
> BD-S5a alignment (no more doubled date), the three stale Asia
> placement notes (now speaking the BD-S14a/BD-S15d truth), and the
> stale GlobalBoard/asia-tiles/world-map-config comments; (c) TWO
> spec-side drift findings recorded as **AF-6** (spec §6's Asia grid
> lists 6 indices while its own hero requires 16 — the registry renders
> 7 incl. ASX200) and **AF-7** (spec §10's "10 ASX-200 sectors" vs the
> board's actual 11 — sums to 18≠19, a spec typo; the code is right) —
> both info-class, waiting for the S22+ spec v2 pass; (d) the §14
> placement table regenerated & reconciled (184 ids · 0 unplaced · 0
> duplicate homes · 0 unknown · 0 mirror overlaps); (e) the gates ALL
> GREEN (15,102 = +3) + the 11 live pd-* backtests 715 checks ALL
> GREEN (the narrator raw-KV stateHash recompute IDENTICAL) + the §21
> data audit — one id (chokepoint-malacca) initially unverifiable
> because the probes hit the IMF PortWatch SCHEDULED Tuesday-maintenance
> window (the provider's own banner: Tuesdays 6:00–9:00 AM ET;
> BD-S21e's runbook note: never run the portwatch leg Tuesdays
> 11:00–14:00 UTC) — re-run after the window, ALL 20 GREEN; (f) the
> 24-leg browser regression on production (0px overflow · NO dead
> links · ZERO console/page errors · the NZX50 card live at both
> widths en+fa).
>
> **Counterpart addendum (BD-S21-parallel):** a duplicate S21 arrival
> (the same standing kickoff prompt, reaching a sandbox after the slot
> was already delivered) ran the counterpart close per the hardened
> one-session-per-slot rule: the shipped S21 INDEPENDENTLY re-verified
> with that session's own gates — all green (the full gates 15,102 ·
> placement regeneration zero-diff · the 11 live backtests 715/715 ·
> the §21 data audit 20/20, malacca green outside the PortWatch
> window · the CF API deploy-state check confirming `5593fd43`/`8f63c8fa`
> · the browser pass re-proving the NZX50 card + the Global
> cached-header fix live at both widths en+fa, 0px overflow, zero
> errors, no dead links). No re-deploy, no shipped-code change; the
> records live in DECISIONS.md (BD-S21-parallel) + CHANGELOG.md.

## Current state (2026-11-12, after page-division S21)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **All TEN destinations render
  their own pages; Phase J (Integration) is CLOSED — S19 the polish ·
  S20 the full-site regression · S21 the spec-vs-implementation
  audit.** Progress: S1 scaffold & navigation · S2 data layer +
  `PLACEMENT.generated.md` · S3–S4 the Global landing (Phase A
  CLOSED) · S5–S6 Gold (Phase B CLOSED) · S7–S8 World Markets + the
  zoom maps (Phase C CLOSED) · S9–S11 USA (Phase D CLOSED) · S12–S13
  Europe (Phase E CLOSED) · S14–S15 Asia (Phase F CLOSED) · S16
  Australia (Phase G CLOSED) · S17 Commodities (Phase H CLOSED) · S18
  Currencies (Phase I CLOSED) · S19–S21 Integration (**Phase J
  CLOSED**).
- **DEPLOYED LIVE: currena-api `5593fd43`** (the S21 SPA — the NZX50
  mirror card + the honest copy + the Global cached-header fix) +
  **currena-markets `8f63c8fa`** (the S18 markets worker, untouched
  since). The deploy was the owner's standing (something WAS fixed);
  the deployed entry CSS+JS and the AsiaPage chunk were byte-verified
  identical to the local build; rollback is one `npx wrangler
  rollback` from apps/api (every surface returns to the S19 shape
  `74777037`).
- **Gates (last full run, S21 — ALL GREEN, 2m 38s):** secret scan
  8/1020 · typecheck 6/6 · eslint 0/0 · copy:audit clean (2 new fa
  strings queued unreviewed + pacificNz.intro triaged needs-review) ·
  narrator in sync + eval 50 · layer1 11,819/11,819 · **the suite
  15,102 = +3** (the three NZX50 card tests + the extended Pacific—NZ
  + Global cached-path assertions) · build + budgets held (entry
  272.88/82.55, every page chunk within its row — the AsiaPage chunk
  15,679/4,036 vs its 16/6 row).
- **The S21 surfaces (what changed where):** ONE new component
  (`apps/web/src/routes/page-division/AsiaNzx50Card.tsx`) + the
  AsiaTierCards wiring (the Pacific—NZ grid's extra member) + the
  en/fa copy fixes (the false sentence + the two new NZX50 keys) + the
  GlobalPage cached-header two-line change + the placement notes +
  the AF-6/AF-7 findings + the comment alignments + the records
  (DECISIONS BD-S21a/b/c/d/e · DEPLOY.md's session record · the
  roadmap S21 delivery record + the progress board · CHANGELOG · this
  file · the README program state).

## Next session (S22 — Investor feedback → spec v2 · Session 22/30)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S22 entry + the S21
delivery record), `02-PAGE-DIVISION-SPEC.md` §19 (the seven questions
for the investor), `03-STRATEGY-LOG.md` (where D-49+ will land), and
this file. Scope (S22): collect the external investor's answers to
spec §19; record them as D-49+ in the strategy log; produce the spec
v2 entries (the AF-1…AF-7 spec-side drift findings — the spec's own
hand-count defects — ride this pass: never silent edits). **The
owner's lever is arranging the investor's review** — if it is not yet
arranged, S22 becomes a waiting slot and the reserve sessions (S25+)
can be pulled forward (the roadmap's own rule).

### The §15 FRED-only CPI fills for Asia — carried forward (BD-S14a / BD-S15d)

The three D-36 Asia fills (Japan · Korea · India CPI YoY) stay
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

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
3. Ratify or redirect the BD-S3…BD-S21 decision set (the latest:
   **BD-S21a/b/c/d/e** — the audit's verdict + the NZX50 mirror-card
   approach + the §9.6 zoom deviation + the BD-S5a clause + the
   AF-6/AF-7 recording + the PortWatch runbook note; all recorded,
   none blocking).
4. Triage the queued unreviewed fa strings (now ~1146: the ~1142
   previous + the 2 S21 strings; every session's corpus-pinned values
   are verified byte-for-byte by their copy-pin tests).
5. The external investor's review of the spec (§19) — **Phase K's
   input; S22 is the collection slot.**
6. The §15 FRED-only CPI fills for JP/KR/IN — still carried forward to
   a dedicated fill session (BD-S14a/BD-S15d, §"The §15 FRED-only CPI
   fills for Asia" above).
7. The ecb-drf provider timeout (a maintenance-session item): the
   S18/S19 data-refresh runs kept it held on last-good (2.5%, flagged
   stale) — it did NOT self-clear across rungs (gold-aud, the other
   S18 transient, DID self-clear). The fail-closed design is holding
   the correct value honestly; a maintenance session should look at
   the ECB fetch (the runbook: docs/INDICATORS_AND_DATA_SOURCES.md +
   the /admin console's per-source status, which needs the owner's
   REFRESH_SECRET).
8. **Arrange the investor review (spec §19)** — the S22 gate; the
   seven questions are listed in the spec's §19 and the roadmap's
   current-position note.

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
