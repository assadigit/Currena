# Insights implementation report — the A-1..A-10 gap-audit build (2026-10-26)

MODE: AUDIT_AND_IMPLEMENT. SPEC: `INSIGHTS_DATA_SPEC.md` (the sole build
authority). AUDIT: `INSIGHTS_GAP_AUDIT.md` §5 (the priority order). This
report is the per-item log the spec session asked for: every item's
outcome, the budget arithmetic, the honest deviations, and the
verification evidence.

**Baseline** (main @ `fad5117`, 2026-10-26 morning): 89 indicators (43
voting), zero stale/broken/hidden; the green-suite record in the
session's worklog.

**End state** (main @ `79272bb`, deployed `78bfc0df`): **100 indicators
(48 voting)**, zero hidden, all ten additions live and verified on
currena.ir in both locales.

| item | id(s) | outcome |
|---|---|---|
| A-1 | `yield-curve-10y3m` | **done** — T10Y3M on the existing 04:10 FRED bundle (zero new fetches); scored below 0 / below −0.50 / the +1.00-pt 4-week steepening. Live 0.78 @ 2026-10-23, Normal. |
| A-2 | `jgb-10y` (upgrade) | **done** — the MOF's own jgbcme CSVs on the 04:20 rung-2 phase (header asserted verbatim, the 10Y column by name); the OECD mirror stays as the labelled outage fallback (the spec's two-clean-weeks retirement clock starts when two clean weeks exist). Live 2.837 @ 2026-10-23. |
| A-3 | `us-japan-10y-gap` | **done** — derived at 04:20 from the staged DGS10 + the MOF series, inner-joined on common dates, 4dp quantized, fail-closed on missing parents, gapLegs carrying both dates. Live 2.046 @ 2026-10-22, Normal. |
| A-4 | `gold-oil-ratio` | **done** — derived in the main build; context per the spec's gauge table; percentile-based bands exactly as the spec directs. Live 36.6 @ 2026-10-26. |
| A-5 | `rba-fed-gap` | **done** — the derived RBA cash rate − Fed target midpoint, the au-trade lane's short-rate carry leg. Live 0.725 @ 2026-10-23, Normal. |
| A-6 | `eia-crude-stocks` | **done** — the keyless LeafHandler website route (the v2 API's registered key stays unregistered per the owner's terms); the Saturday rung. Live 695.2m barrels @ 2026-10-16 (pct10y 0% — record-low territory). |
| A-7 | `cftc-gold-positioning` | **done** — the CFTC's futures-only COT file, net non-commercial share of open interest; the parser asserts the file's own reportable-positions arithmetic identity. Live 49.68% @ 2026-10-20, **Needs attention on day one** (above 45% — the crowded-long zone). |
| A-8 | `oecd-cli-us` / `-cn` / `-de` | **done** — one filtered SDMX request carries all three countries; the US card is the scored growth-health voter (the licensed-PMI replacement), the CN/DE companions are context. Live USA 100.9993 / CHN 97.41035 / DEU 101.0066 @ 2026-09. |
| A-9 | `gpr-index` | **done, not blocked** — the legacy .xls parses through the repo's own biff reader (the spec's honest-build note expected a possible BLOCKED; the live file proved otherwise — 501 points, 1985-01 → 2026-09, never a hand-entered value). Live 146.21 @ 2026-09. |
| A-10 | `epu-us` | **done** — the OOXML workbook through the Pink Sheet reader path; the licence rides in the file itself (row 1523, quoted in the register). Live 218.94 @ 2026-09. |

**Blocked items: none.** All ten shipped. The spec's only conditional
item (A-9's possible BLOCKED on the legacy binary format) resolved in
favour of shipping.

## The budget arithmetic (the spec's cross-cutting rules 6-7)

- **04:10 main rung**: +1 fetch (T10Y3M rides the existing FRED group
  with zero new requests; the ratio and the RBA−Fed gap are derived) —
  the A-1-only addition the audit's P1 arithmetic predicted. Snapshot
  rows 89 → 100.
- **04:20 rung-2 phase (weekdays)**: MOF only (1 fetch) + 1 stage read +
  1 snapshot read + 1 status read + 1 jgb history read + 4 writes ≈ 8
  subrequests. **Saturdays**: +2 fetches (EIA page + CFTC file) ≈ 11.
  **First-of-month**: +3 fetches (OECD + GPR + EPU) + 5 more history
  reads ≈ 17. **First deploy (bootstrap, any day)**: all six feeds ≈ 20.
  All far inside the 50-subrequest ceiling.
- **04:25 + 04:27 history rungs (the wave-3 split — see the fix below)**:
  ~24 + ~23 ids, each half ≈ 1 stage read + its half's unconditional
  writes ≈ 25 subrequests.
- **04:40 periodic rung**: +5 monthly ids → 5 read-compared history keys
  (written only on change — ~once a month each).
- **KV writes/day**: +~10 best-effort history keys on top of the
  previous ~36-46 — roughly 20× headroom against the 1,000/day cap.
- **Serve path**: unchanged — exactly one KV read per request
  (`insights:snapshot`); no new KV keys beyond the `insights:hist:*`
  family.

## The three defects this build's own verification caught and fixed

1. **The OECD parser bug (caught before commit)**: the live SDMX export
   arrives with rows in non-chronological order (the committed fixture
   is byte-identical to the live fetch — verified twice). The
   as-committed-by-the-previous-session parser asserted ascending order
   before sorting and failed on its own fixture. Fixed: sort, then
   assert strictly ascending (the EPU newest-first discipline; duplicate
   dates still fail loudly).
2. **The A-6 barrels scale (caught by the local render, before deploy)**:
   the committed display config scaled the EIA series 1e-6, but the
   parser stores thousands of barrels — the card read "0.7m barrels"
   where the honest display is "695.2m barrels" (1000× off). Fixed to
   1e-3.
3. **The A-7 CFTC accumulation deadlock + the 04:25 exceededCpu death
   (caught by the deploy verification)**: (a) the stage's `> 1` gate
   dropped single-point series, so the COT file's first weekly point
   could never seed the accumulation — fixed (gate `> 0`; the weekly/
   monthly merge bases arm from the stage when the stored key does not
   exist; pinned by a two-Saturday test); (b) the 04:25 daily-history
   phase died exceededCpu with zero writes once the gap-audit ids grew
   it past the free plan's per-invocation ceiling (proven live: brent's
   stored history ended 2026-10-23 while its stage carried 2026-10-26; a
   05:03 diagnostic re-fire vanished from the tail). Fixed by the M1†
   rung split (04:25 half a + 04:27 half b), verified live 05:13/05:14
   (23 + 21 writes), temporary rungs reverted.

Also fixed en route: the selfcheck's T-19 (advice wording) had been
failing since the M5 round on six pre-existing EN strings — reworded,
the selfcheck all-green again; and the inline rung-2 series contract
(`Rung2SeriesInputs.series`) is consumed at last, so the Node/selfcheck
builds carry real values for every rung-2 id (the selfcheck's live
export verified all 100 cards pre-deploy).

## Assumptions and honest deviations (spec ⇒ built)

1. **A-8's EA19 → DEU.** The spec names `oecd-cli-ea` (EA19); the CLI
   dataflow does not publish EA19 (probed live 2026-10-26: member
   countries + G7/G20 aggregates only). Germany (DEU) is the honest euro
   substitute — the area's largest economy and the page's existing euro
   anchor. Recorded here per the spec's own cross-check discipline.
2. **A-8's startPeriod 2015-01 (spec: 2026-01).** The 10-year percentile
   base the spec's own threshold regime requires needs a decade of
   history; the spec's 2026-01 window would leave it empty. One filtered
   request, 122 KB.
3. **A-8's voting shape.** The spec's gauge table lists the A-8 family
   under growth-health without a context marker, and its Feeds line
   names the growth lane's leading edge (singular). Built as: the US
   card votes (the licensed-PMI replacement, the 48th voter); the CN/DE
   companions are context cards — one vote per signal family, the
   m2-us/iron-ore discipline.
4. **A-8's two tiers folded into one rule** (the A-1 precedent): the
   "needs attention" and "unusual" thresholds form one any-of (the
   6-month annualised below −1 / below −2, three consecutive monthly
   falls, the 3-month annualised above +2). The CLI-US card's live
   verdict on day one: Normal, with the position bar at 91% (the E-21
   "Unusual" display tier — a normal vote parked in the top decile).
5. **A-9/A-10's SD regime on context cards.** The spec's gauge table
   marks both context; its thresholds are SD-based ("store the mean and
   SD as rolling 10-year values recomputed"). Built as: a new `sd10y`
   reading enrichment (the value's z-score against the trailing 10-year
   mean + sample SD, recomputed on every write — never hardcoded) and
   per-card band overrides so the cards' state lines speak the zones
   (above +1 SD the attention zone, above +2 SD the historic-spike
   class). The percentile position bar keeps rendering (an independent,
   honest decade measure).
6. **The 04:20 vs 04:25 naming.** The task brief called the new rung
   "the 04:25 rung"; the committed A-2 infrastructure named its phase
   04:20 (between the 04:10 snapshot and the 04:25 history writes).
   Followed the committed design; the history rungs remain 04:25 (now
   +04:27) / 04:40.
7. **The MOF mirror's retirement clock.** The spec retires the OECD
   jgb-10y mirror after two clean MOF weeks. The upgrade went live
   2026-10-26; the earliest honest retirement date is 2026-11-09. No
   action taken (the mirror stays as the labelled fallback).

## Verification evidence

- **Gates** (all green at `79272bb`): typecheck 6/6; core 191, scraper
  67, insights 644, markets 13, api 344, web 680 + the recorded
  16-failure briefing jsdom baseline; lint 0 errors / 15 advisories;
  `copy:audit` clean (manifest 2958 entries — 64 new fa strings
  processed to `2026-10-26-a1-a10`); registry regenerated (100, 0
  hidden); `selfcheck` all-green with live values for all 100 cards.
- **Local render** (pre-deploy, real data): the screenshots under
  `docs/insights/screenshots/a8-a10-2026-10-26/local-en-full.png` +
  `local-fa-full.png` — all ten cards, RTL + Persian digits (۱۰۱٫۰,
  ۱۴۶٫۲) + the Persian month stamps, zero console errors on both
  locales.
- **Deploy chain**: `3fc36820` (the A-1..A-10 build, 04:03 UTC) → the
  natural rungs: 04:10 main (100 readings), 04:20 rung-2 (the bootstrap
  fired all six feeds — the readings + the stage verified in KV), 04:25
  (the exceededCpu death — see above) → `8ce18f9d` (the 05:03 diagnostic
  rung) → `31fee390` (the split fix + the 05:12/05:14 verification
  rungs) → **`78bfc0df`** (the final state, temporary rungs reverted,
  05:16 UTC).
- **Live verification** (`https://currena.ir/#/insights`, both locales,
  zero console errors): the screenshots `live-en-hero.png`,
  `live-en-full.png`, `live-fa-full.png` under the same directory. All
  ten new cards live with the values in the table above; the hero reads
  "9 of 32 indicators need attention" (EN) / «۹ شاخص از ۳۲ شاخص
  نیازمند توجه‌اند» (fa).
- **The 89-baseline invariance** (pre-deploy snapshot captured 2026-10-26
  ~04:00 UTC vs post): 75/89 readings byte-identical; the 14 moves are
  all genuine market-data updates (the Oct 25/26 price rollovers + the
  designed jgb-10y MOF-daily upgrade 3.05@Sep-mirror → 2.837@Oct-23);
  **zero status changes**; 11 new ids, 0 gone.
- **Budgets re-measured**: entry 295.28/89.64 kB (raw held; the +0.83
  gzip is the core enum's five new ids + the sd10y field); Insights lazy
  886.44/214.99 kB — the new documented ceiling 890/215 (five cards of
  bilingual content, the D-16 path).
- **The deploy-lock check** (D-43): the versions API showed the last
  upload at 2026-10-25T18:09:57Z (`0ce6fa8d`, the M7 final) — no
  parallel session; all four deploys this session are sequential and
  recorded above.

## What to expect next

- The **04:10 / 04:20 / 04:25+04:27 / 04:40** rungs own the days from
  here; the sweeps (10:10/20:10) heal transient fetch failures as
  designed.
- **Next Saturday (2026-11-07)**: the COT file's second point joins the
  staged first — `insights:hist:cftc-gold-positioning` begins
  accumulating (the single-point floor is the designed shape).
- **2026-11-01 (the first of the month)**: the monthly trio's designed
  refresh (the bootstrap already fetched everything once).
- **2026-11-09**: the earliest honest MOF-mirror retirement (two clean
  weeks from the upgrade).

## Security note (surfaced by this session's secrets scan)

The pre-deploy full-tree credential scan found ONE tracked file carrying
a live credential: `context.txt` (the owner's own "Add files via upload"
in `d3f64bb`) contained the raw **Cloudflare Workers API token** twice —
the GitHub token line had been redacted by the upload pipeline, the
Cloudflare one had not. Removed from the tree in `5b74dde`; **the token
remains in git history, so removal is not remediation — the owner should
rotate the Cloudflare API token** (dash → My Profile → API Tokens →
roll). No other tracked file carries a credential. Nothing this session
committed contains one (the working copy's own `context.txt` was never
staged; the full diff was scanned before every commit).
