> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/06 — Initial Live Audit: currena.ir/gold

*Survey audit from a rendered browser session on 16–17 Nov 2026
(desktop 1440×900 EN, FA/RTL desktop, 390×844 mobile FA). Deep audit =
S2. All observations below were seen on the rendered page; screenshots
in `docs/assets/gold-audit-s1/` (research-assets staging on this
branch).*

## 1. What the page actually is (verified inventory)

| # | Section (top → bottom) | Contents observed |
|---|---|---|
| 1 | Header/nav | Global · Gold · World Markets · Currencies · Commodities · Regions · Insights(LEGACY) · Tools + PWA install, FA/EN toggle, theme toggle |
| 2 | Page head | Breadcrumb, H1 "Gold", tagline "THE gold card — the 37-voter conditions meter plus the complete gold picture.", "Data as of Nov 16, 2026" |
| 3 | Access-mode notice | "4 of this page's readings are not published in this mode." |
| 4 | Price header | US$3,864 · −0.57% day · "top 11% of the last 10 years" · "Live prices as of 12:13 am UTC" |
| 5 | The aggregate (5-driver balance) | Beam visual (10° tilt), Balance/Minimal radio, TODAY'S LEAN "Leaning against gold", outlook "Bearish", lane chips with "n of m drivers firing", 30-day context (−7.11%) |
| 6 | "What the signals say" (collapsible) | Conditions for gold *and* silver; sparkline cards with Quarter/1y/5y/10y ranges (+115.3% over 10y verified); the balance repeated with expandable lane cards; 5-lane list; "Price footing" (10y-range position + 30-day speed); the honest-record paragraph + backtest link (→ GitHub `docs/insights/BACKTEST-GOLD-LANES.md`) |
| 7 | The 37 seats, by lane | 5 lanes fully listed, every voter a link to its indicator page (e.g. Real yields → `/usa`) with its lean + range position ("high in its decade") |
| 8 | Ratios cards (8) | Au/Ag 82.1 · BTC-per-oz 0.0598 · gold-in-AUD A$5,695 · gold/oil 40.9 · Au/Pt 2.65 · **real (CPI-deflated) price $1,155** · Cu/Au 3.53 · GLD/SPY 0.4712 — each with 10y decile + as-of date |
| 9 | Flows & positioning cards (5) | COT net 45.0% (marked "Stale", Nov 3) · COT gross long 55.2% · SGE withdrawals 92t · Swiss imports 228t · Shanghai premium 0.47% |
| 10 | Licence-block wall | 4 named exclusions with reasons (WGC ETF holdings, WGC CB demand, PBoC/CBR venue moved, ETF short interest) — "the draft is the owner's lever" |
| 11 | The honest record | No-edge backtest numbers (46.8/42.2/32.7 sign-agreement at 5/20/60d), MIN2 rule, "no forecasting edge claimed or implied" |
| 12 | Gold Positions | CFTC positioning bars (net −8.8pts w/w, gross long −6.2pts) |
| 13 | Footer | "Made with ❤️ by Ali Assadi" + Privacy/Terms/Contact/About |

**Locales/viewport checks (all verified rendered):** FA/RTL fully native
(Persian digits, Jalali date ۱۴۰۵/۰۸/۲۵, natural copy — "برآیند عوامل
مؤثر بر قیمت طلا", "سنجهٔ شرایط ۳۷ رأیدهنده"); mobile 390px: no
horizontal overflow, hamburger nav complete, lane expansion works;
Minimal view works and persists across locale switch; chart range
switching works (Quarter → 10 years re-renders + percent readout).

## 2. What works well (strengths to protect)

1. **A real analytical model, honestly governed.** 37 voters / 5 lanes /
   MIN2 / pre-registered calibration (repo reference doc) — this is
   institutional-grade discipline; the published no-edge backtest is
   rarer than any feature could be.
2. **Statistical framing everywhere.** "top 11% of the last 10 years",
   deciles on every card, "typical · middle of the last 10 years" —
   teaches range-thinking without jargon.
3. **Physical-market cards** (SGE, Swiss, Shanghai premium) — coverage
   even some English majors lack on one page.
4. **The real (CPI-deflated) gold price** — almost nobody shows this;
   it's the long-horizon value anchor.
5. **Licence honesty** — the blocked-by-licence section is a trust asset.
6. **Bilingual quality** — the Persian is native, not translated; RTL
   and Jalali handling are correct.
7. **Accessibility discipline** — semantic regions, labeled controls,
   beam tilt in alt text ("Beam tilt: 10°"), skip-to-content.
8. **Cross-linking** — every voter deep-links to its indicator page:
   the gold page is a hub into the platform.
9. **State honesty** — "Stale" flags, as-of dates, "couldn't be read"
   statuses (though see gaps).
10. **Density control** — Minimal/Balance toggle; collapsible signals
    section.

## 3. Gaps and weaknesses (initial list; S2 will quantify)

**Content gaps**
- **G1 — The demand story is nearly absent**: Flows & demand lane = 2 of
  37 voters (both COT). No CB purchases, no ETF flows, no bar & coin —
  the licence wall (WGC) plus fail-closed discipline. The decade's main
  structural driver is invisible. (Owner lever, S1/09.)
- **G2 — No narrative layer**: nothing answers "why did gold move
  recently?" in prose; the meter shows lean, not events.
- **G3 — No history**: no episodes, no "where are we vs 2011/1980";
  the 10y windows are the only past on the page.
- **G4 — No education on the page**: the mechanisms (why real yields
  matter, what term premium is) live only in copy fragments; a first-
  time reader meets "5y5y breakeven" with no on-ramp.
- **G5 — No yield decomposition**: real/nominal/breakeven/term-premium
  exist as separate voters but the page never assembles the lesson
  (Chain 3).

**Presentation/UX gaps**
- **G6 — Outlook terminology tension**: "Gold outlook: Bearish" (a
  7-state classifier) sits against "not a forecast" — directional
  language for a conditions product (S1/05 §3).
- **G7 — Hero lane chips don't announce their interaction**: clicking
  the beam's weight chips produced no visible expansion in the hero
  (verified twice); expansion exists in the lower cards — inconsistent.
- **G8 — "Couldn't be read" cluster**: on audit day, 6 voters unread
  (US CPI!, 1y & 5–10y expectations, consumer mood, geopolitical risk,
  US–JP gap) — the Flows lane fully dark. Fail-closed is honest, but
  the reader gets no "why" or "when back" beyond the licence wall (some
  are pipeline issues, not licences).
- **G9 — No interactive price chart**: sparklines with 4 fixed ranges;
  no pan/zoom, no compare, no log scale; the competitor has 1m–20y with
  50/200DMA overlays.
- **G10 — Ratios lack one-line meanings**: deciles present, but a
  general reader doesn't know what "gold/silver 82.1, typical" *means*
  (the competitor explains it in one sentence).
- **G11 — Silver is a near-passenger**: present in signals + 3 ratio
  cards; no silver lane/story despite the audience overlap.
- **G12 — No Iran dimension**: zero toman/coin/mesghal — deliberate
  global identity, but the biggest Persian-market opportunity is
  unclaimed (S1/04 Idea 8, S1/05 §12).

**Technical observations**
- Radio "Minimal" unreachable by direct synthetic click (label-wrapped
  input; fine for humans, a finding for test tooling).
- Page live-updates price (refs expire between snapshots — live
  refresh works).
- No console errors observed during the session (EN/FA, desktop/mobile).

## 4. Against the 12 audit dimensions (survey scores, 1–5; S2 deepens)

| Dimension | Score | One-line rationale |
|---|---|---|
| 1. Information completeness | 3.5 | Conditions & ratios excellent; demand/flows, history, education missing |
| 2. Financial sophistication | 5 | Deciles, term premium, real price, honest backtest — top-tier |
| 3. Gold-market coverage | 3.5 | Macro/positioning strong; demand side (CB/ETF) blocked; supply light |
| 4. Macro interpretation | 3 | Lean labels + firing counts, but no assembled story |
| 5. Indicator relationships | 2.5 | Lanes group voters; causal links/education absent |
| 6. Historical context | 2 | 10y ranges only; no episodes, no long history |
| 7. Data quality/credibility | 5 | Licence discipline + staleness flags + as-of everywhere |
| 8. Chart quality/usefulness | 2.5 | Clean sparklines; not explorable |
| 9. Educational value | 2 | Copy fragments good; no on-ramp or explainers |
| 10. UX/readability | 4 | Clean, semantic, density-controlled; some jargon exposure |
| 11. Mobile experience | 4.5 | No overflow, full nav, works — verified |
| 12. Differentiation | 4.5 | The meter + honesty record is unique in Persian web; must not dilute |

## 5. Quick wins visible from S1 (candidates for S8 P1)

- Rename "outlook: Bearish" to conditions-language (G6).
- One-line plain meanings on all ratio cards (G10).
- Assemble the yield-decomposition reading from existing series (G5,
  Idea 5).
- "Why unread" line per dark voter + expected-return cadence (G8).
- Make hero chips visibly expand like the lower cards (G7).
