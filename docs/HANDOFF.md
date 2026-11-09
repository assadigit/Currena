# HANDOFF — Currena current state & next steps

> **Rewritten at the end of every session** (the universal `AGENTS.md`
> §8/§10 layout). The deep program history lives in `AGENT_HANDOFF.md`
> (the gold-meter era) and `docs/page-division/` (the current program);
> this file is the short "where we are right now" the next session reads
> first, and it never replaces those records.

## Current state (2026-11-09, after page-division S12)

- **Program:** page-division — splitting the all-in-one Insights page
  into 10 destinations per D-1…D-48. **Phase E (Europe) OPEN: S12
  delivered the Europe page build — the EU section + the non-EU United
  Kingdom section listed apart (D-33), the 8 placed cards with the §21
  trio, the S8 STOXX50E/DAX/CAC/FTSE zoom on top, the cross-links to
  /currencies; the §15 FRED-only fills verified-pending-ingest (Rule 5 —
  none ingested unverified, the candidates recorded in DECISIONS.md
  BD-S12a).** Progress: S1 scaffold & navigation · S2 data layer +
  `PLACEMENT.generated.md` · S3 the Global landing page (D-21) · S4 the
  gates & polish (Phase A CLOSED) · S5 the Gold page build · S6 the Gold
  gates + the owner's alternation (Phase B CLOSED) · S7 the World Markets
  page (D-43 map hero + region grids + the 9 risk cards) · S8 the Regional
  zoom maps (Phase C CLOSED) · S9 the USA verdicts + tiers 1–2 · S10 the
  USA tiers 3–6 + the TIC board (all 72 cards + the tier-6 "Who finances
  America" board) · S11 the USA gates (the freshness audit formalized,
  the mobile/ARIA polish, the In-build chip retired — Phase D CLOSED) ·
  **S12 the Europe page build: the EU + non-EU UK sections (D-33), the 8
  placed ids with the §21 trio through the pure `europe-tiles.ts` (pinned
  output-for-output against `formatReadingValue`), the S8 zoom on top,
  the cross-links to /currencies (§8 item 4); the §21 backtest
  (`europe-backtest-core.ts` reusing S11's `auditUsaFreshness` + the
  offline suite + the live `pd-s12-backtest.ts`); the copy pins
  (`europe-copy-pin.test.ts` + the 34 new `pd.europe.*` fa strings queued
  unreviewed); the §15 FRED-only fills verified-pending-ingest (Rule 5 —
  FRED blocks the dev sandbox, the ECB M3 SDMX key needs the dimension
  walk; NO fill ingested unverified, the candidates recorded for the next
  session).**
- **DEPLOYED & LIVE** (`84833135`, 2026-11-09 02:20 UTC): /europe is live
  at **https://currena.ir/europe** with the 8 cards (ecb-dfr · euro-hicp
  · euro-aaa-10y · bund-10y · btp-bund-spread · oecd-cli-de · gilt-10y ·
  boe-rate), the EU section + the UK section listed apart, the S8 zoom,
  the 3 cross-links (eur-usd · usdchf · usdtry → /currencies), the honest
  "In build" chip present (the §15 fills are coming) — the §21 diff
  re-run against production post-deploy **8/8 green** (the 8 cards' trio
  inputs byte-identical page ≡ engine; the freshness audit honest —
  btp-bund-spread 100d beyond its 75d monthly grace AND carrying the
  engine's stale status); the browser pass at 1440×900 and 360×844 in en
  + fa with ZERO overlaps/overflow/errors; the Global + Gold + World
  Markets + USA + region + legacy surfaces intact. The live acceptance:
  `docs/DEPLOY.md` 2026-11-09d.
- **Gates (last full run):** ALL GREEN — secret scan 8/968 · tsc 6/6 ·
  eslint 0/0 · copy:audit clean · narrator in sync + eval 50 · layer1
  11,819/11,819 · **suite 14,945 = +23** (europe-tiles 9 · europe-copy-pin
  2 · europe-backtest 12) · build + budgets held (entry 270.28/81.86; the
  Europe lazy chunk in budget).

## Next session (S13 — the Europe gates · Session 13/30)

Read `AGENTS.md` (§14 carries the owner's rules) first, then
`docs/page-division/01-SESSION-ROADMAP.md` (the S13 entry + the S12
delivery record), `02-PAGE-DIVISION-SPEC.md` §8 + §21, and this file.
Scope (S13 — the Europe gates, the S11 pattern applied to Europe): the
full card-render audit vs the placement table (the 8 cards + the §21
trio, every leg re-audited as the session's own gate); the freshness
within cadence grace (the pure `auditUsaFreshness` over `EUROPE_CARD_IDS`
— already wired in `europe-backtest-core.ts` + `pd-s12-backtest.ts`, so
S13 formalizes it as the session's own gate the way S11 did for USA); the
mobile/ARIA pass (the §18 D-48 touch targets ≥ 44px + the WAI-ARIA
disclosure pattern — verify the Europe page's cross-link cards at 44px,
the section headings' semantics, the RTL flow); the In-build chip
retirement (when the gates pass on the 8 placed ids — the USA trajectory:
S9/S10 chip → S11 retirement; the `pd.statusBuilding` key stays for the
not-yet-built pages). The §15 fill ingest (verified from production
egress + the ECB M3 dimension walk) MAY land here or in a dedicated fill
session — the candidates are recorded in DECISIONS.md (BD-S12a) with the
candidate series ids + the verification status + the cross-check
publishers. Gates: the §21 diff over the 8 cards green; the freshness
audit honest; typecheck + lint + copy:audit + build/budgets; browser
verification at 1440×900 and 360×844 in en + fa; commit pushed at every
checkpoint. The deploy at the close is the owner's standing.

## Owner-side levers waiting

1. Ratify the `/converter` relocation (S1's build-session decision).
2. Ratify AF-3: `michigan-1y-expectations` → USA tier-3 (S2's audit
   finding — the 184th id's placement; RENDERED on /usa tier-3).
3. Ratify or redirect BD-S3a/b/c + BD-S4a/b + BD-S5a + BD-S6a +
   BD-S7a/b + BD-S8a/b/c + BD-S9a/b/c + BD-S10a/b/c + BD-S11a/b/c +
   **BD-S12a (the §15 FRED-only fills verified-pending-ingest — Rule 5;
   the candidates recorded for the next session to verify from production
   egress + the ECB M3 dimension walk + ingest) + BD-S12b (the Europe
   page build — the EU + non-EU UK sections, the zoom, the cross-links,
   the §21 backtest)** (all recorded, none blocking).
4. Triage the queued unreviewed fa strings (now ~771: the ~737 queued +
   the 34 S12 `pd.europe.*` keys; S12 added 34 — the corpus-pinned values
   verified byte-for-byte by `europe-copy-pin.test.ts`, the fresh
   section/intro/loading/cross-links copy pending review).
5. The external investor's review of the spec (§19) — Phase 3's input.
6. A small pre-existing display quirk (out of S9–S12's scope, noted for
   S19's polish pass): the Header's language quick-toggle button shows
   the theme words as its visible label (its aria-label is correct) —
   `apps/web/src/components/Header.tsx` ~line 316.

## Known state worth knowing

- The Europe page reads ONE feed: the S2 projection (GET
  /api/insights/pages/europe — the 8 home readings) + the markets board
  the zoom reads (its own feed). A slow or dead projection never takes
  the zoom away (each feed governs its own surface).
- The §15 fill candidates (BD-S12a): euro-area unemployment (FRED OECD
  mirror, candidate LRHUTTTTTTEZM156S / LRUN74TTEZM156S — cross-check
  Eurostat une_rt_m EA19); euro-area industrial production (FRED
  candidate PIEAUST / PROINDMEZM156N — cross-check Eurostat sts_inpr_m
  EA19); ECB-SDMX M3 liquidity (the existing BSI adapter — the candidate
  keys probed 404'd; the right key needs the BSI dimension walk for
  BS_ITEM=M3 + the monetary-aggregate BS_REP_SECTOR, distinct from the
  Eurosystem balance sheet T00 the `global-liquidity` indicator already
  reads). Verify from PRODUCTION egress (FRED blocks the dev sandbox) +
  the dimension walk, then ingest with the full §A discipline.
- The freshness audit (`auditUsaFreshness` in `usa-backtest-core.ts`,
  reused with `EUROPE_CARD_IDS` in `europe-backtest-core.ts`) is the §21
  "Data audit" leg: a card beyond its registry's maxAgeDays must
  honestly carry the engine's `stale` status. The live `pd-s12-backtest.ts`
  script calls the SAME pure function the offline suite pins — no logic
  drift. The btp-bund-spread card (monthly, maxAge 75d) is currently 100d
  beyond grace AND status 'stale' — the page speaks the engine's own
  word. When the 2026-09 figure lands (the OECD monthly mirror publishes
  ~mid-month), the card returns within grace.
- The rollback lever for the 2026-11-09d deploy: `wrangler rollback` —
  /europe would return to the S8 RegionPage placeholder (the zoom + the
  DestinationBody); every other surface was byte-identical before it.
