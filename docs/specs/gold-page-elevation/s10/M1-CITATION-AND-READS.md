> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S10 M1 — Citation re-verification + the two build-time reads

**Session:** S10 of the Gold Page Elevation (GPE) program — the FIRST
Phase-D implementation session (P1-a, the credibility floor, wave 0).
**Date:** 2026-11-18 (~11:0x UTC). **Branch:** `gold-elevation/p1a-credibility-floor`
(off `main` HEAD `19131b0` — the post-R-5 tree; the prompt's stated
state advance past `47b9a348` confirmed: the R-5 details-panel port
`f66efa44` + bookkeeping `19131b0` landed on main, production
`currena-api` `6ae72ba7` @ 100%). **Status:** Done in code (this
milestone), not yet deployed (the session's deploy is M3).

The gate state at session start (verified, not assumed): the CP-C lock
is COMPLETE (`s9/CP-C-RECORD.md` §1's S9c addendum — all twelve D1–D12
locked as recommended); the modularization program is COMPLETE on main;
the owner's GO arrived with this session's kickoff ("GO. The research-only
constraint is LIFTED — the Phase-D implementation sessions proceed.").
The research-only constraint is therefore LIFTED; P1-a proceeds.

## M1.0 — Citation re-verification (the session's mandated first step)

Per the CP-C record §3's discipline note + §4's pre-flight, every file
path the rows R01–R06 cite was re-verified read-only against `main`'s
live tree at HEAD `19131b0` (the R-5 no-renames constraint + the
`s6/03 §2` module map govern). The R-5 details-panel port used the
stretched-opener pattern and kept every card's DOM byte-identical, so
the P1-a citation targets hold.

| Cite | Path | Verified at `19131b0` |
|---|---|---|
| R01 | `apps/api/src/routes/insights.ts:152` — `PUBLIC_HISTORY_WINDOW_DAYS` | ✅ `const PUBLIC_HISTORY_WINDOW_DAYS = 1900;` (the ~5.2-year bound) |
| R01 | `apps/web/src/features/gold/signals/verdict.tsx:183` — stale comment | ✅ present (the "history feed already carries the complete 10-year daily series" claim) |
| R01 | `apps/api/src/audit-sidecar.ts` — `PUBLIC_BOUNDED_HISTORY_IDS` (derived set, L2 + publicDisplayOk 'yes') | ✅ confirmed `gold-usd` + `silver-usd` in the set (the public-history truncation fires for both metals) |
| R02 | `apps/web/src/features/gold/GoldContext.tsx:53` — `tonnes: 'pd.gold.unitTonnes'` | ✅ present (the `UNIT_KEY` map; consumed by `sge-gold-withdrawals` + `swiss-gold-flow`) |
| R02 | `apps/web/src/shared/i18n/{en,fa}.ts` — `pd.gold.unitTonnes` / `pd.global.unitTonnes` | ✅ present (×2 each: pd.gold section at en:833/fa:791, pd.global at en:1445/fa:1366; current value EN `'m tonnes'` / FA `'میلیون تن'`) |
| R03 | `apps/web/src/features/gold/GoldPositions.tsx:62` — the unlabeled `+X pts` change line + line 40 `Math.min(Math.max(value,0),100)` clamp | ✅ present (the 30-day change shows `+/-X pts` with no window word; the clamp is the #10 rider target) |
| R04 | `apps/web/src/features/gold/GoldSeats.tsx` — the seat renderer (Zone G) | ✅ present (the dark seats render `seatUnread` with no why/when) |
| R05 | the FRED CPIAUCNS/CPILFESL levels (no new source; BLS venue-blocked) | ✅ the existing ingest path (`packages/insights/src/domains/...`); the Oct-2025 base-month gap is the S4-D1 case |
| R06 | zones A/B/E + the app-shell footer | ✅ all surfaces present (the absent-count line in GoldPage.tsx, the live-prices block, the cold-load skeleton, the Footer anchor, the hero glyph run) |

**Citation drift since the pre-§19.6 research tree: none material.**
The R-5 port added `shared/components/IndicatorDetailsPanel.tsx` +
`shared/hooks/useIndicatorDetails.tsx` + the `CardDetailsOpener` overlay,
none of which the P1-a rows cite. The `features/gold/` tree is 24 files
(matches the CP-C record's "24-file gold feature tree"). The `signals/`
subdir (the WS-4 module split) holds `verdict.tsx` — the R01 stale-comment
target lives there, unchanged.

## M1.1 — The two build-time reads (D8 locked: B — this session does them)

Per `s8/02` §2a/§2b, D8 locked at B, the session performs both reads;
the pre-committed fallback bands stand for each. Both rows consume the
outcomes at their OWN sessions (R28 at P3, R13 at P1-b) — this session
only performs and records the reads.

### §2a — the Kalshi Developer-Agreement wording (R28's Kalshi leg, P3)

- **Attempted in-session** (2026-11-18 ~10:5x UTC):
  - `https://kalshi.com/developer-agreement` → HTTP **429**, 25,107-byte
    body whose `<title>` is `"Vercel Security Checkpoint"` (the Vercel
    bot-wall interstitial, not the agreement text). Re-tried with a
    different UA → same 429/checkpoint.
  - `https://docs.kalshi.com/developer-agreement` → HTTP 404;
    `https://docs.kalshi.com/api-developer-agreement` → HTTP 404;
    `https://docs.kalshi.com/` → HTTP 200 (the docs root loads, but the
    developer-agreement page is not hosted at the spec'd path).
- **Outcome:** the exact data-reuse wording could NOT be read from this
  sandbox — the same environment state `s8/02 §2a` records ("the site
  rate-limited this environment, 429 on every page"). Per D8=B,
  **the fallback band stands: the conservative informational-display
  posture** — display-only + attribution + link to the markets + no
  key'd endpoints + no bulk redistribution. Worst case (a restriction
  on informational display, if a later session reads the agreement and
  finds one): the Kalshi leg drops; R28 renders Polymarket + the calendar
  strip (R29). **Binds R28's Kalshi leg only (P3)** — nothing in P1-a
  depends on the read.
- **Recorded for the R28 session (P3):** re-attempt the read at that
  session's start (the Vercel checkpoint is environment-state, not a
  policy refusal; a normal browser session or a different egress should
  pass). If still blocked, ship the fallback band.

### §2b — the CBI gerami press-release pin (R13's gerami constant, P1-b)

- **Attempted in-session** (2026-11-18 ~10:5x UTC):
  - `https://cbi.ir/coin/` and `https://www.cbi.ir/coin/` → HTTP 200
    but the body is an **F5 BIG-IP ASM WAF challenge** (the `/TSPD/`
    paths + the `f5_cspm` cookie + the `<APM_DO_NOT_TOUCH>` block are
    F5's bot protection), resolving after the challenge to "404 - File
    or directory not found." — no coin content served.
  - `https://cbi.ir/page/coin`, `https://cbi.ir/page/5953` (the spec's
    fetched-200 page) → HTTP 200 but the same F5 WAF challenge script;
    no gerami content in the body.
  - A corroborating-mirror path via a search engine was attempted;
    the search-engine result page did not yield parseable mirror URLs
    from this environment.
- **Outcome:** the exact minted figure could NOT be pinned from this
  sandbox — the same WAF-block state `s8/02 §2b` records ("cbi.ir's coin
  pages are WAF-blocked from this environment — «درخواست رد شد» on every
  /coin/ path"). Per D8=B, **the fallback band stands: `0.90–0.92 g pure`
  in the constants table**, documented on the card's method block (C2
  rule 1); the monotone premium ladder holds inside the band (full
  +3.3% < half +8.5% < quarter +18.1% ≈ gerami +18.6% ± ~1 pp). The
  resolved reading from `s8/02 §2b` (~1.01 g total, 900 fineness,
  ~0.909 g pure) sits inside the band. **Binds R13's gerami row only
  (P1-b)** — nothing in P1-a depends on the pin.
- **Recorded for the R13 session (P1-b):** re-attempt the read at that
  session's start (the owner's browser or a different egress per the
  spec). If it resolves, tighten the one constant; if not, ship the band
  documented.

### Summary of M1

Both reads resolved to their pre-committed fallback bands, exactly as
the spec designed for the case the reads do not resolve in-session. The
bands cost P1-a nothing (the two rows are R28 at P3 and R13 at P1-b,
both later sessions). The reads' outcomes are recorded here for those
sessions to re-attempt; the standing instruction (re-attempt at the
consuming session's start) carries forward.

## Done-criteria for M1

- [x] Citation re-verification performed against `main`'s live tree at
  `19131b0` (every R01–R06 cite checked; zero drift).
- [x] The Kalshi developer-agreement read attempted in-session; the 429/
  Vercel-checkpoint state confirmed; the fallback band stood up and
  documented (binds R28/P3 only).
- [x] The CBI gerami press-release pin attempted in-session; the F5 WAF
  block confirmed; the fallback band stood up and documented (binds
  R13/P1-b only).
- [x] Both outcomes recorded (this doc) for the consuming sessions.

Next: M2 — the six rows R01–R06, in order, each a small verified step.
