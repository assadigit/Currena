/**
 * Briefing (S8) and supporting-visuals (S9) payload builder.
 *
 * Turns raw engine facts into the desk payloads: the six narrative sections
 * with their template fallback copy, and the visuals payload including the
 * insight titles, current-reading takeaways and reading guides that make
 * every chart self-explanatory.
 */

import {
  computeMarket,
  pricePoints,
  scenarioPaths,
  type EngineFacts,
} from "./engine";
import type {
  BriefingPayload,
  BriefingSection,
  MarketStat,
  VisualsPayload,
} from "./types";
import { fmtPct, fmtPrice } from "./format";

/* ------------------------------------------------------------------ */
/* Shared derived copy helpers                                          */
/* ------------------------------------------------------------------ */

function dayChange(level: number[]): { abs: number; pct: number } {
  if (level.length < 2) return { abs: 0, pct: 0 };
  return {
    abs: level[level.length - 1] - level[level.length - 2],
    pct: (level[level.length - 1] / level[level.length - 2] - 1) * 100,
  };
}

function toneWord(score: number): string {
  if (score > 0.2) return "constructive";
  if (score < -0.2) return "cautious";
  return "balanced";
}

/* ------------------------------------------------------------------ */
/* Market stats strip                                                   */
/* ------------------------------------------------------------------ */

function buildStats(f: EngineFacts): MarketStat[] {
  return [
    {
      label: "5D return",
      value: fmtPct(f.ret5d),
      delta: f.ret5d,
      hint: "Price change over the last five trading days.",
    },
    {
      label: "1M return",
      value: fmtPct(f.ret1m),
      delta: f.ret1m,
      hint: "Price change over the last ~21 trading days.",
    },
    {
      label: "3M return",
      value: fmtPct(f.ret3m),
      delta: f.ret3m,
      hint: "Price change over the last ~63 trading days.",
    },
    {
      label: "YTD",
      value: fmtPct(f.retYtd),
      delta: f.retYtd,
      hint: "Calendar-year performance versus the first trading day of the year.",
    },
    {
      label: "RSI 14",
      value: f.rsi14.toFixed(0),
      delta: f.rsi14 - 50,
      hint: "Momentum oscillator: above 70 is stretched, below 30 is washed out.",
    },
    {
      label: "Vol 20D",
      value: `${f.vol20.toFixed(1)}%`,
      hint: "Annualised realised volatility over the last 20 trading days.",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* S9 visuals payload                                                   */
/* ------------------------------------------------------------------ */

export function buildVisuals(f: EngineFacts): VisualsPayload {
  const n = f.dates.length;

  /* Positioning series: last 26 weeks (weekly sampling). */
  const weeks = Math.floor((n - 1 - 4) / 5) + 1;
  const positioningSeries: { date: string; netSpecs: number; etfFlow: number }[] =
    [];
  for (let w = Math.max(0, weeks - 26); w < weeks; w++) {
    const idx = 4 + 5 * w;
    if (idx < n) {
      positioningSeries.push({
        date: f.dates[idx],
        netSpecs: Math.round(f.netSpecs[idx]),
        etfFlow: f.etfFlowWeekly[w] ?? 0,
      });
    }
  }

  /* Sentiment series: last 30 days. */
  const sentimentSeries = Array.from({ length: 30 }, (_, k) => {
    const i = n - 30 + k;
    return {
      date: f.dates[i],
      score: Math.round(f.sentiment[i] * 100) / 100,
      price: Math.round(f.gold[i] * 100) / 100,
    };
  });

  const rGoldDxy = f.correlations.matrix[0][1];
  const rGoldReal = f.correlations.matrix[0][2];
  const rGoldSilver = f.correlations.matrix[0][4];
  const rGoldSpecs = f.correlations.matrix[0][6];

  const monthNames = f.seasonality.months.map((m) => m.month);
  const currentMonth = f.seasonality.currentMonth;
  const currentAvg = f.seasonality.months[currentMonth]?.avgReturn ?? 0;
  const ranked = f.seasonality.months
    .map((m, i) => ({ ...m, i }))
    .sort((a, b) => b.avgReturn - a.avgReturn);
  const rank = ranked.findIndex((m) => m.i === currentMonth) + 1;
  const best = ranked[0];
  const worst = ranked[ranked.length - 1];
  const next = f.seasonality.months[(currentMonth + 1) % 12];

  const topDriver = f.drivers
    .slice()
    .sort((a, b) => Math.abs(b.bps) - Math.abs(a.bps))[0];
  const totalBps = f.changePct * 100;
  const share = topDriver
    ? Math.round((Math.abs(topDriver.bps) / Math.max(1, f.drivers.reduce((a, d) => a + Math.abs(d.bps), 0))) * 100)
    : 0;

  const base = f.scenarios.find((s) => s.id === "base")!;
  const bull = f.scenarios.find((s) => s.id === "bull")!;
  const bear = f.scenarios.find((s) => s.id === "bear")!;

  const insights: Record<string, string> = {
    "price-180d":
      f.spot >= f.ma50
        ? `Uptrend intact — gold holds ${((f.spot / f.ma50 - 1) * 100).toFixed(1)}% above its 50-day average`
        : `Trend warning — gold trades ${((1 - f.spot / f.ma50) * 100).toFixed(1)}% below its 50-day average`,
    "driver-attribution": `${topDriver.driver} ${topDriver.bps >= 0 ? "supported" : "weighed on"} gold — about ${share}% of the day's ${totalBps >= 0 ? "+" : ""}${totalBps.toFixed(0)} bps move`,
    "correlation-matrix": `Real yields remain gold's tightest macro link — r = ${rGoldReal.toFixed(2)} with the 10-year real yield`,
    "volatility-regime": `Volatility is ${f.volRegime} — ${f.vol20.toFixed(1)}% sits at the ${f.volPercentile}th percentile of the trailing year`,
    "positioning-flows": `Specs are ${f.netSpecsPercentile >= 65 ? "stretched" : f.netSpecsPercentile <= 35 ? "washed out" : "balanced"} — ${Math.round(f.netSpecs[n - 1])}k contracts at the ${f.netSpecsPercentile}th percentile`,
    "sentiment-timeline": `The tape is ${toneWord(f.sentimentToday)} — today's sentiment score reads ${f.sentimentToday.toFixed(2)}`,
    "scenario-fan": `The ${base.probability}%-probability base case drifts toward $${fmtPrice(base.target, 0)} over the next 90 days`,
    seasonality: `${monthNames[currentMonth]} averages ${currentAvg.toFixed(1)}% — rank ${rank} of 12 months for gold`,
  };

  const takeaways: Record<string, string> = {
    "price-180d": `Spot $${fmtPrice(f.spot)} sits ${f.spot >= f.ma50 ? "above" : "below"} the 50-day average ($${fmtPrice(f.ma50, 0)}); the 20-day ($${fmtPrice(f.ma20, 0)}) is ${f.ma20 >= f.ma50 ? "above" : "below"} it, and price is ${f.distFromHigh.toFixed(1)}% from the 52-week high of $${fmtPrice(f.high52, 0)}.`,
    "driver-attribution": `Today's ${totalBps >= 0 ? "+" : ""}${totalBps.toFixed(0)} bps move decomposes as ${f.drivers.map((d) => `${d.driver} ${d.bps >= 0 ? "+" : ""}${d.bps}`).join(", ")}. Bars right of zero lifted gold; bars left of zero dragged on it.`,
    "correlation-matrix": `Over the trailing ${f.correlations.window} days gold moved inversely to the dollar (r = ${rGoldDxy.toFixed(2)}) and real yields (r = ${rGoldReal.toFixed(2)}), while silver (r = ${rGoldSilver.toFixed(2)}) is its closest positive twin and spec positioning tracks price (r = ${rGoldSpecs.toFixed(2)}).`,
    "volatility-regime": `Realised vol of ${f.vol20.toFixed(1)}% compares with quartile bands of ${f.volP25.toFixed(1)}%–${f.volP75.toFixed(1)}%; the ${f.volRegime} regime ${f.volRegime === "elevated" || f.volRegime === "extreme" ? "argues for smaller position sizes and wider stops" : "favours gradual accumulation strategies"}.`,
    "positioning-flows": `Net speculative length stands at ${Math.round(f.netSpecs[n - 1])}k contracts (${f.netSpecsPercentile}th percentile of the year) while ETF holdings ${f.etfFlow4w >= 0 ? "added" : "shed"} ${Math.abs(f.etfFlow4w).toFixed(1)} tonnes over four weeks.`,
    "sentiment-timeline": `Aggregate sentiment today is ${f.sentimentToday.toFixed(2)} on a -1..1 scale from the ${f.news.length}-item tape; the price line on the right axis shows how closely mood tracked the market.`,
    "scenario-fan": `Paths over 90 days: bull $${fmtPrice(bull.target, 0)} (${bull.probability}%), base $${fmtPrice(base.target, 0)} (${base.probability}%), bear $${fmtPrice(bear.target, 0)} (${bear.probability}%). The shaded band is the uncertainty envelope — it widens with the horizon.`,
    seasonality: `${monthNames[currentMonth]}'s ${currentAvg.toFixed(1)}% average compares with ${best.month} (best, ${best.avgReturn.toFixed(1)}%) and ${worst.month} (worst, ${worst.avgReturn.toFixed(1)}%). Next up: ${next ? `${next.month} at ${next.avgReturn.toFixed(1)}%.` : ""}`,
  };

  const guides: Record<string, string[]> = {
    "price-180d": [
      "The gold line is the daily spot close; the soft shaded area behind it just frames the price level visually.",
      "The solid grey line is the 20-day average (fast trend); the dashed terracotta line is the 50-day average (slower trend).",
      "Dashed green and red horizontal lines mark the nearest support (S) and resistance (R) levels from recent price structure.",
      "Coloured dots mark catalyst events — green supported price, red pressured it, grey was neutral.",
      "A constructive medium-term setup is price above both averages with the fast line on top; the reverse signals a deteriorating trend.",
    ],
    "driver-attribution": [
      "Each bar shows one driver's signed contribution to today's price move, measured in basis points (bps; 100 bps = 1%).",
      "Gold bars to the right of zero supported gold; terracotta bars to the left dragged on it.",
      "The bar lengths explain the mechanics behind the headline percentage move — the biggest bar is the day's dominant story.",
      "The 'Momentum & residual' bar is the balancing item: chart-driven positioning and factors not captured by the named drivers.",
    ],
    "correlation-matrix": [
      "Each cell shows the Pearson correlation of daily returns between two assets over the trailing window — from -1 (perfectly inverse) to +1 (perfectly aligned).",
      "Warmer gold tones mean positive co-movement with gold; terracotta tones mean inverse movement; near-zero cells mean no stable daily relationship.",
      "Read the Gold row (or column) to see which macro links are currently tight — the darker the cell, the stronger the relationship.",
      "Correlations are regime-dependent: a tight link today can decay quickly, so treat them as a snapshot, not a constant.",
    ],
    "volatility-regime": [
      "The line is annualised 20-day realised volatility: how widely gold has actually swung, annualised, versus its average price path.",
      "The dashed green and red lines are the 25th and 75th percentiles of the trailing year — the 'normal' volatility band.",
      "The gold dot with its label is today's reading; where it sits inside (or outside) the band defines the regime.",
      "High-volatility regimes reward smaller sizing and wider stops; subdued regimes favour gradual accumulation.",
    ],
    "positioning-flows": [
      "The grey line (left axis) is the managed-money net long in thousand contracts — speculators' directional bet.",
      "The gold and terracotta bars (right axis) are weekly ETF flows in tonnes: gold bars are inflows, terracotta are outflows.",
      "Positioning percentiles above ~65 signal crowded longs (vulnerability to liquidation); below ~35 signals washed-out positioning (fuel for squeezes).",
      "Divergences matter: rising price on falling ETF holdings suggests a paper (futures) rally rather than physical demand.",
    ],
    "sentiment-timeline": [
      "Bars are the daily aggregate news-sentiment score, from -1 (all negative headlines) to +1 (all positive).",
      "Green bars skew constructive, terracotta bars skew negative, grey is a mixed tape.",
      "The grey line on the right axis is the gold price — check whether mood leads, lags, or simply mirrors price.",
      "Persistent positive sentiment at highs often marks complacency; extreme negative sentiment after a slide often marks capitulation.",
    ],
    "scenario-fan": [
      "Each line is a scenario path over the next 90 days: green dashed bull, solid gold base, red dashed bear.",
      "The shaded band is the uncertainty envelope — statistical noise around the paths, widening with time as uncertainty compounds.",
      "The probability chips above the chart show how the strategist weights each scenario; targets are 90-day spot levels, not forecasts of a single day.",
      "The dashed grey line anchors today's spot so every path is read as a move from now.",
    ],
    seasonality: [
      "Each bar is gold's average return for that calendar month over a long multi-year sample.",
      "Gold bars are positive months, terracotta are negative; the outlined bar is the current calendar month.",
      "Seasonality is a background tendency, not a standalone signal — it shifts with the macro regime.",
      "Use it to time entries within an already-justified view, never as the reason for the view itself.",
    ],
  };

  return {
    date: f.date,
    price: {
      points: pricePoints(f, 180),
      events: f.events,
      levels: { support: f.support, resistance: f.resistance },
      window: 180,
    },
    drivers: f.drivers,
    correlations: f.correlations,
    volatility: {
      series: f.volSeries,
      percentile: f.volPercentile,
      regime: f.volRegime,
      p25: Math.round(f.volP25 * 10) / 10,
      p75: Math.round(f.volP75 * 10) / 10,
    },
    positioning: {
      series: positioningSeries,
      netSpecsPercentile: f.netSpecsPercentile,
      etfFlow4w: Math.round(f.etfFlow4w * 10) / 10,
    },
    sentiment: {
      series: sentimentSeries,
      today: Math.round(f.sentimentToday * 100) / 100,
      headlineCount: f.news.length,
    },
    scenarios: {
      paths: scenarioPaths(f.date, f.spot, f.scenarios, f.vol20),
      spot: f.spot,
      horizonDays: 90,
      summary: f.scenarios.map((s) => ({
        id: s.id,
        probability: s.probability,
        target: s.target,
      })),
    },
    seasonality: {
      months: f.seasonality.months,
      currentMonth,
      note: `Average calendar-month returns over a 20-year sample of this simulation.`,
    },
    insights,
    takeaways,
    guides,
  };
}

/* ------------------------------------------------------------------ */
/* S8 template briefing                                                */
/* ------------------------------------------------------------------ */

function execTitle(f: EngineFacts): string {
  if (f.changePct >= 0.5 && f.bias >= 15)
    return "Gold firms as dollar weakness and haven demand reassert themselves";
  if (f.changePct <= -0.5 && f.bias <= -15)
    return "Gold slides as real yields bite and the dollar finds a bid";
  if (f.spot >= f.ma50) return "Gold holds its uptrend through a mixed macro tape";
  return "Gold churns sideways while its drivers pull in opposite directions";
}

export function buildTemplateBriefing(f: EngineFacts): BriefingPayload {
  const n = f.dates.length;
  const dxyChg = dayChange(f.dxy);
  const ryChg = f.realYield[n - 1] - f.realYield[n - 2];
  const spxChg = dayChange(f.spx);
  const topDriver = f.drivers
    .slice()
    .sort((a, b) => Math.abs(b.bps) - Math.abs(a.bps))[0];
  const specsNow = Math.round(f.netSpecs[n - 1]);
  const positiveNews = f.news.filter((x) => x.sentiment === "positive").length;
  const negativeNews = f.news.filter((x) => x.sentiment === "negative").length;

  const sections: BriefingSection[] = [
    {
      id: "exec",
      kicker: "01 / Executive summary",
      title: execTitle(f),
      body: `Gold settled at $${fmtPrice(f.spot)}, ${f.changePct >= 0 ? "up" : "down"} ${Math.abs(f.changePct).toFixed(2)}% on the day. ${topDriver.driver} was the dominant driver (${topDriver.bps >= 0 ? "+" : ""}${topDriver.bps} bps contribution), against a backdrop of ${f.volRegime} volatility and ${toneWord(f.sentimentToday)} news flow. The composite bias score reads ${f.bias >= 0 ? "+" : ""}${f.bias}, ${f.bias > 20 ? "tilting the desk constructive" : f.bias < -20 ? "tilting the desk cautious" : "leaving the desk broadly neutral"}.`,
      bullets: [
        `Spot $${fmtPrice(f.spot)} (${fmtPct(f.changePct)} on the day; ${fmtPct(f.ret1m)} over the month).`,
        `${topDriver.driver} contributed ${topDriver.bps >= 0 ? "+" : ""}${topDriver.bps} bps of today's ${f.changePct >= 0 ? "gain" : "move"} — ${topDriver.note}.`,
        `Positioning at ${specsNow}k contracts (${f.netSpecsPercentile}th percentile) with ${f.etfFlow4w >= 0 ? "+" : ""}${f.etfFlow4w.toFixed(1)}t of four-week ETF flow.`,
        `Realised vol ${f.vol20.toFixed(1)}% (${f.volRegime} regime); RSI ${f.rsi14.toFixed(0)}.`,
      ],
      bias: f.bias,
      visualIds: ["price-180d"],
    },
    {
      id: "macro",
      kicker: "02 / Macro backdrop",
      title: `${dxyChg.pct <= 0 ? "A softer dollar is doing the heavy lifting" : "Dollar strength is capping the upside"}`,
      body: `The dollar index moved ${fmtPct(dxyChg.pct)} to ${f.dxy[n - 1].toFixed(1)}, while the 10-year real yield ${ryChg >= 0 ? "rose" : "eased"} ${Math.abs(ryChg).toFixed(2)}pp to ${f.realYield[n - 1].toFixed(2)}% and equities ${spxChg.pct >= 0 ? "advanced" : "retreated"} ${fmtPct(Math.abs(spxChg.pct))}. Gold's classic inverse links to the dollar (r = ${f.correlations.matrix[0][1].toFixed(2)}) and real yields (r = ${f.correlations.matrix[0][2].toFixed(2)}) remain the tightest channels in the current regime.`,
      bullets: [
        `DXY ${f.dxy[n - 1].toFixed(1)} (${fmtPct(dxyChg.pct)} today; ${dxyChg.pct <= 0 ? "supportive for bullion" : "a headwind for bullion"}).`,
        `10Y real yield ${f.realYield[n - 1].toFixed(2)}% (${ryChg >= 0 ? "+" : ""}${ryChg.toFixed(2)}pp) — ${ryChg >= 0 ? "raising gold's opportunity cost" : "easing the opportunity cost of zero-yield bullion"}.`,
        `S&P 500 ${spxChg.pct >= 0 ? "up" : "down"} ${Math.abs(spxChg.pct).toFixed(2)}% — ${spxChg.pct >= 0 ? "risk appetite competing for capital" : "risk-off rotation supportive of havens"}.`,
        `Correlation snapshot: gold vs dollar ${f.correlations.matrix[0][1].toFixed(2)}, gold vs real yields ${f.correlations.matrix[0][2].toFixed(2)} (trailing ${f.correlations.window} days).`,
      ],
      visualIds: ["driver-attribution", "correlation-matrix"],
    },
    {
      id: "price-action",
      kicker: "03 / Price action & technicals",
      title: `${f.spot >= f.ma50 ? "Trend intact" : "Trend under pressure"} — RSI ${f.rsi14.toFixed(0)}, volatility ${f.volRegime}`,
      body: `Spot is ${f.spot >= f.ma50 ? "above" : "below"} the 50-day average ($${fmtPrice(f.ma50, 0)}) with the 20-day at $${fmtPrice(f.ma20, 0)}, leaving the ${f.ma20 >= f.ma50 ? "fast average above the slow one — a constructive structure" : "fast average below the slow one — a repairing structure"}. Immediate resistance sits at $${fmtPrice(f.resistance[0], 0)} with support at $${fmtPrice(f.support[0], 0)}; price is ${f.distFromHigh.toFixed(1)}% from the 52-week high of $${fmtPrice(f.high52, 0)}.`,
      bullets: [
        `MA structure: 20-day $${fmtPrice(f.ma20, 0)} vs 50-day $${fmtPrice(f.ma50, 0)}; spot ${f.spot >= f.ma50 ? "above" : "below"} both averages.`,
        `Key levels: resistance $${fmtPrice(f.resistance[0], 0)} / $${fmtPrice(f.resistance[1], 0)}; support $${fmtPrice(f.support[0], 0)} / $${fmtPrice(f.support[1], 0)}.`,
        `RSI ${f.rsi14.toFixed(0)} — ${f.rsi14 > 70 ? "stretched, watch for mean reversion" : f.rsi14 < 30 ? "washed out, squeeze fuel building" : "mid-range, no extreme"}.`,
        `Realised volatility ${f.vol20.toFixed(1)}% at the ${f.volPercentile}th percentile of the year (${f.volRegime} regime).`,
      ],
      visualIds: ["volatility-regime"],
    },
    {
      id: "positioning",
      kicker: "04 / Positioning & flows",
      title: `Specs ${f.netSpecsPercentile >= 65 ? "are getting stretched" : f.netSpecsPercentile <= 35 ? "have washed out" : "sit balanced"} while ETFs ${f.etfFlow4w >= 0 ? "accumulate" : "trim"}`,
      body: `Managed-money net length stands at ${specsNow}k contracts — the ${f.netSpecsPercentile}th percentile of the trailing year — while ETF holdings ${f.etfFlow4w >= 0 ? "added" : "shed"} ${Math.abs(f.etfFlow4w).toFixed(1)} tonnes over four weeks. ${f.netSpecsPercentile >= 65 ? "Crowded longs leave the market vulnerable to liquidation on any hawkish surprise." : f.netSpecsPercentile <= 35 ? "Light positioning leaves room for fast-money to rebuild on the first positive catalyst." : "Positioning is balanced, with room in either direction for the next regime leg."}`,
      bullets: [
        `Net spec position ${specsNow}k contracts (${f.netSpecsPercentile}th percentile of the year).`,
        `ETF flow ${f.etfFlow4w >= 0 ? "+" : ""}${f.etfFlow4w.toFixed(1)}t over four weeks; latest week ${f.etfFlowWeekly[f.etfFlowWeekly.length - 1] >= 0 ? "+" : ""}${f.etfFlowWeekly[f.etfFlowWeekly.length - 1].toFixed(1)}t.`,
        `${f.netSpecsPercentile >= 65 ? "Elevated positioning raises liquidation risk into volatility spikes." : f.netSpecsPercentile <= 35 ? "Depressed positioning historically precedes positioning-driven squeezes." : "Balanced positioning keeps the market's reaction to macro data as the swing factor."}`,
      ],
      visualIds: ["positioning-flows"],
    },
    {
      id: "news",
      kicker: "05 / News & catalysts",
      title: `Tape skews ${toneWord(f.sentimentToday)} — ${positiveNews} constructive vs ${negativeNews} negative headline${negativeNews === 1 ? "" : "s"}`,
      body: `The day's tape carries a ${toneWord(f.sentimentToday)} tone with an aggregate sentiment score of ${f.sentimentToday.toFixed(2)}. The highest-impact items centre on ${f.news.some((x) => x.impact === "high") ? "rates and the dollar" : "flows and positioning"}, with ${f.volRegime === "elevated" || f.volRegime === "extreme" ? "volatility commentary keeping options desks busy" : "market makers reporting orderly conditions"}.`,
      bullets: [
        ...f.news.slice(0, 3).map((x) => `${x.time} ${x.source}: ${x.headline}`),
      ],
      visualIds: ["sentiment-timeline"],
    },
    {
      id: "outlook",
      kicker: "06 / Outlook & scenarios",
      title: `Base case ${f.scenarios.find((s) => s.id === "base")!.probability}%: drift toward $${fmtPrice(f.scenarios.find((s) => s.id === "base")!.target, 0)} over three months`,
      body: `Over a three-month horizon the desk weights the paths ${f.scenarios.find((s) => s.id === "bull")!.probability}% bull / ${f.scenarios.find((s) => s.id === "base")!.probability}% base / ${f.scenarios.find((s) => s.id === "bear")!.probability}% bear. ${f.seasonality.months[f.seasonality.currentMonth].month}'s seasonality (${f.seasonality.months[f.seasonality.currentMonth].avgReturn.toFixed(1)}% average) provides a mild ${f.seasonality.months[f.seasonality.currentMonth].avgReturn >= 0 ? "tailwind" : "headwind"} inside the base case.`,
      bullets: [
        `Bull ${f.scenarios.find((s) => s.id === "bull")!.probability}% → $${fmtPrice(f.scenarios.find((s) => s.id === "bull")!.target, 0)}: ${f.scenarios.find((s) => s.id === "bull")!.trigger}`,
        `Base ${f.scenarios.find((s) => s.id === "base")!.probability}% → $${fmtPrice(f.scenarios.find((s) => s.id === "base")!.target, 0)}: ${f.scenarios.find((s) => s.id === "base")!.trigger}`,
        `Bear ${f.scenarios.find((s) => s.id === "bear")!.probability}% → $${fmtPrice(f.scenarios.find((s) => s.id === "bear")!.target, 0)}: ${f.scenarios.find((s) => s.id === "bear")!.trigger}`,
        `Seasonality: current month ranks ${f.seasonality.months[f.seasonality.currentMonth].avgReturn >= 0 ? "among the stronger" : "among the weaker"} calendar months in the long-run profile.`,
      ],
      visualIds: ["scenario-fan", "seasonality"],
    },
  ];

  return {
    date: f.date,
    generatedAt: new Date().toISOString(),
    narrativeSource: "template",
    spot: f.spot,
    change: { abs: f.changeAbs, pct: f.changePct },
    returns: { d5: f.ret5d, m1: f.ret1m, m3: f.ret3m, ytd: f.retYtd },
    stats: buildStats(f),
    sections,
    news: f.news,
    scenarios: f.scenarios,
    bias: f.bias,
  };
}

/** Convenience: build both payloads from a desk date. */
export function buildDesk(dateISO: string): {
  briefing: BriefingPayload;
  visuals: VisualsPayload;
  facts: EngineFacts;
} {
  const facts = computeMarket(dateISO);
  return {
    briefing: buildTemplateBriefing(facts),
    visuals: buildVisuals(facts),
    facts,
  };
}
