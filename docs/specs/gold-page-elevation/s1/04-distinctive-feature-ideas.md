> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/04 — Ten Distinctive Feature Ideas for Currena's Gold Page

*Ranked by expected differentiation × feasibility. Each idea states: what
it is, why it wins, what it costs, and the honest risk. These are
candidates for the S5/S6/S8 funnel, not commitments.*

## Idea 1 — "Why gold moved" driver narrative (the daily interpretation layer)

**What.** A short, auto-assembled narrative at the top of the page (EN+FA):
"Gold −0.6% today; this week real yields +0.26pp and DXY +1.9 — the two
classic headwinds; positioning mid-range; Shanghai premium near zero."
Generated from Currena's own voter data with template grammar.
**Why it wins.** Saham Analiz proved Persian demand for this (their
auto-note is their best feature, S1/07); Currena can beat it because the
narrative can be *bound to the visible meter* — every sentence clickable
into the exact lane/voter that produced it. Truth-linked prose.
**Cost.** Low-medium. All data exists; it's template + i18n copy work.
**Risk.** Narratives age badly if stale; must be date-stamped and
regenerated with the snapshot. Wording must avoid causation claims
("coincided with", not "because").

## Idea 2 — The meter's time machine (conditions on any past date)

**What.** A date picker on the balance beam: render the 5-lane lean for
any past day in the readings archive. "See what the meter said before
the Jan-2026 top / the 2022 invasion / the 2023 banking scare."
**Why it wins.** Nobody offers this. It weaponizes Currena's honesty
record: users can verify with their own eyes that conditions ≠ forecast
(backtest honesty, made visceral), and simultaneously see *context*
(what conditions surrounded past moves). Education + credibility +
engagement in one component.
**Cost.** Medium. Readings history exists (the backtest harness runs on
it); needs an API surface + a UI mode.
**Risk.** Must carry the same "not a forecast" framing as the live
meter; historical lane compositions changed (37-voter today ≠ past
constellations) — version the governance honestly (the repo's
`GOLD_SYSTEM_COMPLETE_REFERENCE.md` governance section already defines
how).

## Idea 3 — Rolling-correlation reality panel (gold vs real yields, gold vs DXY)

**What.** Interactive 90-day rolling correlation charts with the 10-year
corridor, annotated regime breaks (2022 buyer rotation), plus one-line
plain-Persian explanation of what correlation can and cannot claim.
**Why it wins.** The competitor states one static correlation number
(−0.13); the *shape over time* — strong inverse → breakdown → partial
re-coupling — is the actual lesson of the decade, and Currena's
statistical identity (deciles, percentiles, honest record) is the right
home for it.
**Cost.** Low. Both series present; computation trivial; copy is the
work.
**Risk.** Correlation-cliff notes can mislead if window choices aren't
fixed and disclosed — pre-register the windows (repo culture already
does pre-registered criteria).

## Idea 4 — The Episode Explorer (gold's historical playbook)

**What.** An annotated timeline strip: 1971 end of Bretton Woods · 1980
Volcker peak · 1999 Brown's bottom · 2008 GFC · 2011 QE-era top · 2013
taper tantrum · 2020 COVID · 2022 sanctions rotation · 2024–26
melt-up-and-correction. Each episode: price path, what each lane
(=driver family) did, one paragraph of honest interpretation, links to
the live indicators that told the story.
**Why it wins.** Kitco's "Turning Points" proves data-journalism draws
an educated audience (S1/08); no Persian site has anything like it; it
converts Currena's indicator depth into a story a general reader can
enter. Evergreen content — the maintenance cost is near zero once
written.
**Cost.** Medium editorial (the research is well-trodden; facts must be
sourced and dated), low technical.
**Risk.** Historical data licensing for pre-2000 price series (use
public/academic sources; LBMA historical is licensed — avoid; WGC
downloadable data or FRED-series for US-centric proxies are clean).

## Idea 5 — The yield-decomposition card (nominal = real + breakeven + term premium)

**What.** A single card/mini-chart decomposing the 10y yield into its
three components with a dynamic plain-language reading: "yields rose
this month, but it was the *term premium* doing the lifting — that
configuration has historically *supported* gold, not hurt it."
**Why it wins.** It operationalizes the page's most-needed lesson
(Chain 3) using three series Currena already ingests. Persian-market
exclusivity: nobody explains the difference between a 5% yield world
driven by growth vs one driven by fiscal fear.
**Cost.** Low-medium (one derived visualization + careful copy).
**Risk.** Term-premium estimates are model outputs (ACM) with revision
history — disclose model provenance and revision windows.

## Idea 6 — The central-bank demand tracker (behind the WGC permission letter)

**What.** Quarterly CB purchases (t, by country) + reserve-share trend +
the "since-2022 regime" annotation — the Chain-4 visualization.
**Why it wins.** It is the single most important structural demand story
in gold, it's the current lane's biggest hole, and the wall is legal,
not technical. If the owner's letter to WGC lands (the page itself says
"the draft is the owner's lever"), Currena becomes the *only* Persian
page with a licensed view of the demand stack.
**Cost.** Data-politics first (letter), then low engineering (one chart
family).
**Risk.** If permission never lands: fallback is IMF IFS monthly
reserves (L1, already a source) + LBMA vault data — slower cadence but
licence-clean; or link-out treatment (L3 discipline).

## Idea 7 — Multi-currency gold grid + the real price

**What.** Gold in EUR, JPY, GBP, CNY, AUD (+IRR if Idea 8 approved)
with local 10-year decile flags and ATH markers, alongside the existing
CPI-deflated real-price card.
**Why it wins.** Teaches the dollar-arithmetic lesson (Chain 2) in one
glance; goldprice.org does 160 currencies badly (machine-translated,
S1/08), Currena can do six currencies *with interpretation*. Nearly
free: XAUxxx crosses are available (EODHD probe confirmed XAUEUR daily
works, S1/09).
**Cost.** Low.
**Risk.** None material; FX crosses need the same licence discipline
(EODHD is L2-ish per repo terms; gold-api.com already used for XAUUSD).

## Idea 8 — The Iran bridge (strategic decision, not just a feature)

**What.** The decomposition strip from Chain 8: ounce × USD/IRR →
mesghal/18k/coin, with the coin premium (حباب) as a *tracked, charted,
interpreted* time series — plus a toman/rial toggle done right.
**Why it wins.** The Persian market's most-asked question, unowned
(S1/08 gap analysis: TGJU shows prices, nobody decomposes; the
competitor's calculator is USD-only). This would instantly define
Currena's gold page for Iranian users.
**Cost & risk.** The highest of the ten: new domestic data sources
(licence, reliability, rial/toman UX), identity shift from "global
platform" toward "global + local bridge", and editorial sensitivity.
This is a *positioning decision masquerading as a feature* — the owner
must decide at CP-A. My professional recommendation: stage it — Phase-1
a read-only "bridge card" (ounce, USD/IRR, computed parity, premium)
clearly labeled educational; full local instrument coverage only if the
data proves clean.

## Idea 9 — Positioning extremes monitor (COT z-scores + the crowd gauge)

**What.** The existing COT cards upgraded with 10-year percentile bands
and an extremes flag ("net longs in the bottom decile — crowded
bearishness, squeeze fuel"), with the honest short-term-horizon label.
**Why it wins.** Chain 6 made visible; silver's current setup (3.6k near
1y lows) is exactly the kind of reading users should *see explained*.
Cheap (percentile10y already computed for other series).
**Cost.** Low.
**Risk.** Must resist drifting into signal-speak; keep the descriptive
framing.

## Idea 10 — The "what we cannot show you" wall, sharpened

**What.** The existing "NOT PUBLISHED — BLOCKED BY LICENCE OR VENUE"
section evolved into a first-class transparency panel: what is missing,
why, what the owner is doing about it (WGC letter status), and a
link-out to the licensed primary source for each.
**Why it wins.** It converts a limitation into the strongest trust
signal on the Persian web (nobody else even discloses); it also creates
polite public pressure/backstory for the WGC letter. The LBMA/WGC
data-disclosure culture (S1/08) is the institutional standard — Currena
can own the Persian version.
**Cost.** Trivial (copy + structure).
**Risk.** None; it's already half-built — just make it prominent and
kept-current.

## Deliberate near-misses (considered, parked)

- **Full TA suite (MACD/Bollinger/pivots ×5):** the Persian market
  expects it (TGJU pattern) but it dilutes Currena's differentiated
  identity; parked pending user-demand evidence (S1/05 §7).
- **Gold-miner equities/ETF quotes:** the competitor's stock layer is a
  different business (they sell stock analysis); a link-out list is
  enough for Currena's identity.
- **Qaurum-style scenario valuation tool:** registration-gated
  institutional tooling, high build cost, licensing exposure (S1/08
  institutional benchmark); education-level coverage of the *concept*
  could ride inside Idea 4 episodes instead.
- **Real-time everything:** most macro drivers update daily at best; the
  04:20 UTC snapshot + live price is the honest cadence. Do not fake
  granularity (S1/05 §10).
