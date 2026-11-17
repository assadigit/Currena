> Agents: read AGENTS.md in the repo root first, and follow it for this whole task.

# S1/13 — Minimal TA Suite (MAs + Pivots): Spec Preparation (D8)

*Owner decision D8: add the minimal TA layer — moving averages and
pivot tables — reversing S1/05 §7's exclusion recommendation. The
program's task now is to make the TA layer consistent with the page's
descriptive, evidence-first identity: reference levels and context, not
signals. "Minimal" is a binding scope guard (s1/10 §4).*

## 1. Why this can work with the page's identity

The page's brand is honesty about what data can and cannot tell you
(the meter, the published no-edge backtest, the licence wall). TA done
the TGJU way (five indicators, signal language, "buy above R2") would
dilute it. TA done Currena's way — *descriptive statistics of the
price trend and yesterday's reference levels* — is a service to the
same educated reader, and the competitor already ships 50/200DMA
overlays (S1/07), so absence is a visible gap (G9's neighbourhood).
The differentiator is framing: every TA element gets the same
treatment the page gives any indicator — what it is, what it does NOT
mean, and its date.

## 2. The MA set (what ships)

| Element | Definition | Presentation |
|---|---|---|
| SMA 20 / 50 / 100 / 200 | Simple MA of XAUUSD daily closes (EODHD `XAUUSD.FOREX` daily — verified S1/09; live leg stays gold-api) | Overlay on the price chart (post-G9-upgrade) + a reference row in the TA table |
| Distance from 200-DMA | (price − SMA200) / SMA200 | **As a decile/percentile vs 10y** — the page's statistical identity applied to the classic trend gauge; e.g. "+6.2% above the 200-day — 78th percentile of the last decade" |
| Golden / death cross | 50/200 DMA crossovers | A **dated events list** (last N crosses with dates and the price path that followed — descriptive, no return-promise language) |
| Chart overlays | 50 + 200 DMA lines on the interactive price chart | Toggleable, labelled, with the "not support/resistance guarantees" honesty line |

What the MAs are FOR on this page: trend context for the conditions
reading (the meter's price lane gets a trend axis), and the education
layer (S7) — "what a 200-day average does and doesn't tell you".

## 3. The pivot table (what ships)

- **Classic daily pivots** from the previous session's OHLC:
  `P = (H+L+C)/3`, `R1/R2/R3`, `S1/S2/S3` (standard formulas).
- **Weekly pivots** from the previous week's OHLC (swing context) —
  recommended; the TGJU-familiar reader expects both.
- Presentation: a clean bilingual reference table — «سطوح پیوت» —
  with one-line meanings ("levels the market watched yesterday/today",
  the way the competitor explains ratios in one sentence, G10's
  lesson). USD/oz for the global chart; the Iran-bridge section may
  mirror the levels in toman later (Bridge-3, s1/11 §8 — only if the
  premium copy needs it, not by default).
- Data source: previous-day OHLC — already in hand (EODHD daily
  OHLC verified; TGJU `ons` h/l as the same-snapshot cross-check).

## 4. What stays OUT (the scope guard, binding)

RSI, MACD, Bollinger, Ichimoku, OBV, pivot variants (Camarilla,
Fibonacci, Woodie), multi-timeframe signal matrices, any "buy/sell
zone" language, any prediction framing. Revisit only on new owner
instruction or measured user demand (the S1/05 §7 evidence question
stands — now inverted: the burden is on *expansion*, not inclusion).

## 5. Honesty rules for the TA block (S6/S7 carry these into copy)

1. Every level is labelled **descriptive reference**, never
   support/resistance "guarantee" language.
2. Crossovers are dated events, not signals; the events list shows
   what followed *including the failures* (whipsaws), symmetric with
   the backtest-honesty culture.
3. The decile treatment (distance-from-200DMA percentile) anchors TA
   in the page's statistical framework — same grammar as every other
   voter.
4. No TA element joins the 37-voter meter (governance: display-only
   context; meter membership is a versioned governance decision, see
   s1/12 §4).
5. FA copy owns the vocabulary the Persian market already uses
   (میانگین متحرک, سطوح پیوت) — meet the reader where TGJU put them,
   then teach the honest version.

## 6. Build facts (for the S8 roadmap)

- **No new data family.** XAUUSD daily OHLC history is the only input;
  EODHD daily verified working (S1/09). SMA/pivot math is trivial
  derived series.
- **No existing MA/pivot code** in the repo (verified S1b) — new,
  small, self-contained derived-series module (post-modularization it
  lands as an adapter-level computation + a feature-level card).
- Complexity: **Low**. Placement: Supporting tier (S6 decides the
  slot; candidate: adjacent to the price/ratio cards, below the
  conditions meter).
- Dependency: the chart-overlay piece rides the interactive-chart
  upgrade (G9 candidate); the table + decile row + events list ship
  without it.
