# NEXT SESSION PROMPT — IMPLEMENT & AUDIT (read this file first, then paste the block below)

> Written 2026-10-26 by the audit session (main @ `634b597`). Paste everything between the
> `===== PROMPT STARTS =====` markers into the next session as the opening user message,
> with your credentials appended under "Credentials:" (never commit them to the repo —
> they live only in the chat and in gitignored `.dev.vars` / GitHub secrets).

===== PROMPT STARTS =====
=====================================================================
CONFIGURATION (edit only this block)
=====================================================================
SITE_URL        = https://currena.ir/#/insights
REPO            = assadigit/Currena   (Cloudflare Workers, free KV — private repo, clone with token)
MODE            = AUDIT_AND_IMPLEMENT
                  (Build the ten approved additions A-1..A-10 from the data spec, then
                   audit your own work in the live browser. If a source probe fails
                   three honest times, record it as BLOCKED in the report and move on.)
SPEC_FILE       = docs/insights/INSIGHTS_DATA_SPEC.md      (the build plan — authoritative)
AUDIT_FILE      = docs/insights/INSIGHTS_GAP_AUDIT.md      (the findings — read §5 priorities)
REPORT_FILE     = docs/insights/IMPLEMENTATION_REPORT.md   (write your log here)
LANGUAGES       = English + Farsi (RTL, Persian digits, Jalali dates)
=====================================================================

ROLE
You are a senior web engineer working on a Cloudflare Workers + free-KV project. Work
fully on your own. Do not ask me questions. When something is unclear, make the most
sensible decision, write it under "Assumptions" in REPORT_FILE, and keep going. Do not
stop until every step is finished.

CONTEXT — WHERE THE PROJECT STANDS (2026-10-26, main @ 634b597)
- The Insights page runs 89 indicators (43 voting / 46 context), all fresh, zero stale,
  zero broken, zero hidden in public mode. Public API: /api/insights (+ /markets, /fx,
  /status). Markets board: 16 indices (EODHD-primary, Yahoo only for FTSE). FX: 10 pairs
  + computed dollar basket + 7 patterns.
- A full audit just finished (AUDIT_ONLY). It approved TEN additions and rejected the
  rest with evidence. Everything approved already has: a verified keyless source URL,
  the exact series/table id, cadence, licence, EN+FA copy, thresholds with reasoning,
  and a KV plan. READ SPEC_FILE FIRST; it is the single source of truth for this build.
- Rejected — do NOT rebuild, do NOT substitute unofficial sources for these:
  ICE BofA HY spread (BAMLH0A0HYM2, "Pre-Approval Required" licence), Cboe put/call
  (free CSVs frozen at 2019), WGC central-bank gold buying (no login-free feed), PBoC
  rate (no machine-readable feed), BIS API (500), daily German Bund (ECB portal has no
  national benchmark yields; Bundesbank API dead; Eurostat not disseminated),
  silver/Bitcoin ratio (fails the classic-indicator criteria).
- Silver/Bitcoin stays unbuilt. Gold/Bitcoin stays context-only, never voting.

ENVIRONMENT NOTES (probed live 2026-10-26 — trust these, re-verify only what you touch)
- FRED fredgraph.csv is keyless and current for every series used. Quirk: some venues
  hang on a descriptive User-Agent; the repo's adapter UA works from the Actions venue.
  Known-good values: T10Y2Y 0.31, T10Y3M 0.78 (2026-10-23), DGS10 4.96, DGS2 4.65,
  DFEDTARL 3.75 (2026-10-25), MORTGAGE30US 7.32, WALCL 6,753,604 (2026-10-21).
- MOF Japan jgbcme.csv (English) is keyless, daily, next-business-day: 10y = 2.914 @
  2026-10-22. 15 maturity columns; assert the header row, never trust column indices.
- EIA website route needs no key: LeafHandler.ashx?n=PET&s=WCRSTUS1&f=W (the v2 API
  needs a free key — do not register one; use the website route).
- CFTC deafut.txt is one weekly file covering gold + WTI + USD-index rows
  ("GOLD - COMMODITY EXCHANGE INC.", 2026-10-20 data in the current file).
- OECD CLI SDMX: use format=jsondata or csvfilewithlabels — csvfilewithmetadata 406s.
- RBA is Akamai-403 from sandbox venues; the GitHub Actions runner is the verified
  venue (standing repo fact). BIS/PBoC/BoJ-feed are dead upstream — never retry them.
- A-9 GPR is a legacy .xls (CDFV2). If the dependency-free reader cannot parse it in
  three honest attempts, record BLOCKED and ship A-10 (OOXML) anyway. Never hand-enter.

STEP 0 — SETUP (read-only)
Clone the repo (token auth). Read, in this order: AGENTS.md, docs/insights/
AGENT_RUNBOOK.md, SPEC_FILE, AUDIT_FILE §4-§5. Run the full suite once and record the
green baseline (pnpm -r typecheck; pnpm -r test; pnpm lint; pnpm copy:audit).
Read docs/DEPLOY.md §Insights for the deploy recipe.

STEP 1 — P1 WAVE (highest value, lowest cost)
Build A-1..A-3 + A-5 exactly per SPEC_FILE:
  A-1 yield-curve-10y3m (T10Y3M, rides the existing FRED bundle — 04:10 rung)
  A-2 jgb-10y daily upgrade (MOF on the 04:25 rung; keep the OECD mirror as labelled
      fallback; retire it only after two clean weeks)
  A-3 us-japan-10y-gap (derived: DGS10 - MOF 10y; fail closed on missing parents)
  A-5 rba-fed-gap (derived: rba-cash-rate - fed-target midpoint)
For each: adapter (if any fetch) + zod contract + registry row + thresholds (through
the display scale) + bilingual card copy through the i18n dictionary + attribution +
fixture tests (never live sites) + fa manifest gate. One commit per addition, clear
message. Record subrequest and KV-write counts in the commit body.

STEP 2 — P2 WAVE
  A-4 gold/oil ratio (derived; percentile thresholds, not fixed numbers)
  A-6 eia-crude-stocks (Saturday 04:25 rung; keyless dnav route)
  A-7 cftc-gold-positioning (Saturday 04:25 rung; net non-commercial as share of open
      interest; one fetch can later serve oil and dollar legs)
Same discipline as Step 1.

STEP 3 — P3 WAVE (monthly, first-of-month rung)
  A-8 oecd-cli (ONE fetch, THREE rows: USA, CHN, EA19)
  A-9 gpr-index (see the .xls caveat above)
  A-10 epu-us (OOXML — the Pink Sheet parser path handles it)
Same discipline. If a P3 source probes dead three times: BLOCKED, move on.

STEP 4 — AUDIT YOUR OWN WORK (before any deploy)
a) pnpm -r typecheck, pnpm -r test, pnpm lint, pnpm copy:audit — all green.
b) pnpm --filter @currena/insights selfcheck — all rows green, new ids listed.
c) Local wrangler dev or preview: every new card shows real data, correct date, correct
   source label, in BOTH locales (EN + fa: RTL, Persian digits, Jalali stamp), zero
   console errors. Persian copy: no em dashes; logical CSS properties only.
d) Budget check: the 04:10 rung must stay under 50 subrequests (new daily feeds go on
   04:25); serve path stays at exactly ONE KV read per request; no new KV keys — all
   additions extend insights:snapshot + insights:hist:* (best-effort, self-healing).
e) Existing behavior unchanged: the 89 current readings keep their values/dates; the
   markets board and fx module untouched.

STEP 5 — DEPLOY + POST-DEPLOY AUDIT
Follow docs/DEPLOY.md: deploy-lock check (versions API — no parallel session), deploy,
then verify on currena.ir in a real browser, both locales, all new cards with real
data, screenshots under docs/insights/screenshots/. Write the deploy session record.
If anything fails in production, fix or roll back before continuing.

STEP 6 — WRAP UP
Write REPORT_FILE: every addition (done / blocked + why), the budget arithmetic, the
assumptions, and the live-verification evidence links. Update CHANGELOG.md. Push to
main with clear commits. Never commit credentials or .dev.vars. End with a short
summary: what shipped, what is blocked, what I should look at first.

FINISH
The next rung after your deploy writes the real data — expect your first live readings
on the following scheduled run (04:10 / 04:25 / Saturday / first-of-month shapes).
Do not ask me anything.
===== PROMPT ENDS =====
