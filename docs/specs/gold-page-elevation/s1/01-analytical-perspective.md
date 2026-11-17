> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/01 — Analytical Perspective & Method

*How this program will think about gold, and about Currena's gold page.*

## 1. The three hats

This program works at the intersection of three disciplines, and the
distinctive value comes from holding all three at once:

**A. Senior gold-market analyst.** Gold is not one market but a stack of
markets — London OTC spot, COMEX futures, ETF shares, physical bullion in
Shanghai and Zurich, and the official sector. Price is set where the
*marginal buyer* meets the *marginal seller*, and who that marginal buyer
is has changed twice in a decade: Western ETF investors (2010s), then
central banks and Asian physical buyers (2022–2025). Any page that
explains gold with a single driver (rates, or the dollar, or inflation)
is structurally wrong; any page that lists forty indicators without
saying which one is setting the price *right now* is useless. The job is
to present a small set of frameworks that cover the whole causal surface.

**B. Financial research strategist.** The discipline that separates a
signal from noise: distinguish *mechanism* (why should X move gold),
*correlation* (has it, historically), *expectations* (is it already
priced), and *horizon* (does it matter in days, quarters, or decades).
Currena's existing "honest record" — the published backtest showing its
lanes carry no 5–60-day predictive edge — is a rare asset. The research
strategist's job here is to convert that honesty from a defensive
disclaimer into an educational feature: teach users *why* conditions ≠
forecast, and what each indicator can and cannot tell them.

**C. Product & UX strategist.** Sophistication is not the number of
widgets; it is the ratio of insight to attention. The benchmark study
(S1/08) shows the global best already agree on a compact core: price
context, a named-driver framework, positioning, physical flows, and
education. The Persian web has no page that combines these with global
macro depth *and* bilingual quality. Currena's meter is the skeleton; the
elevation is the connective tissue — narrative, history, and explanation.

## 2. The analytical stance (non-negotiable standards)

These mirror the owner's own standards (master prompt §11) and become the
program's review criteria for every proposed feature:

1. **No single-factor claims.** "Rates up → gold down" is presented as a
   *tendency with named exceptions*, never a law. The page's own current
   data proves the point: real yields high *and* gold in the top decile
   of its 10-year range can coexist for years.
2. **Correlation ≠ causation; both must be shown honestly.** Where we
   show a relationship (e.g., gold vs real yields), we show the rolling
   correlation *and* the mechanism *and* the periods the relationship
   broke (2022+) *and* the candidate explanation for the break. Saham
   Analiz already does a static version of this; it can be deepened.
3. **Horizon labeling.** Every driver is tagged short-term (days),
   cyclical (quarters), or structural (years). Positioning is short-term;
   real yields and the dollar are cyclical; central-bank reserve
   behavior, fiscal credibility, and debasement hedging are structural.
   Mixing horizons is the most common analytical error in retail
   commentary.
4. **Data transparency.** Source, licence level, update frequency, and
   known gaps disclosed next to every number — the WGC/LBMA discipline,
   which Currena's `docs/SOURCES.md` already practices internally. The
   "NOT PUBLISHED — BLOCKED BY LICENCE OR VENUE" section on the live page
   is a competitive asset, not an embarrassment; it should be kept and
   sharpened.
5. **Educated-general audience.** Persian copy that explains "بازده
   واقعی" in one clean sentence beats a terminal dump. English copy
   that stays rigorous. No unexplained jargon; no dumbing-down of
   mechanism.
6. **What the page is NOT.** Not a trading terminal (no buy/sell, no
   signals service), not a news feed, and not a forecast shop. The
   existing "conditions, not forecasts, not advice" line is the correct
   identity and the honest backtest is its proof.

## 3. What "elevation" means concretely

The current page answers: *"What conditions surround gold today?"* —
well. It does not yet answer, in one place:

- **Why did gold move?** (driver attribution narrative — the marginal
  buyer story of the month, not just today's lean)
- **Where are we in history?** (episode context: 1971, 1980, 2008, 2011,
  2022, 2024–26 — what the same indicators did then)
- **What does this indicator actually do?** (evergreen education bound to
  live data, not a separate wiki)
- **How do global conditions become *my* gold price?** (the Iran bridge —
  the single largest unowned opportunity in the Persian market; see
  S1/04 Idea 8 and the decision it forces)

The elevation program is the controlled addition of these four layers —
without adding clutter, without fake precision, and within real data and
infrastructure constraints.

## 4. Method note (evidence standards for this program)

- Live-page findings come from rendered browser sessions (dates logged).
- Market data points quoted in GPE docs cite the page/source and the
  observation date (16–17 Nov 2026 for S1).
- Where a claim is analytical judgment rather than established fact, it
  is marked as interpretation.
- Where data availability is unverified, it is marked and probed (S1/09)
  before any recommendation depends on it.
