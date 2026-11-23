/**
 * Deterministic gold-market simulation engine.
 *
 * Given a desk date, the engine generates a complete, reproducible market
 * state: 500 trading days of gold prices plus the macro drivers that moved
 * them (dollar, real yields, equities, silver, oil), positioning, flows,
 * news sentiment, volatility, scenarios and seasonality.
 *
 * The same date always yields the same market state — which is what makes
 * briefings cacheable in the database and verifiable end to end.
 *
 * Server-side only: used by the /api/desk route (never shipped to clients).
 */

import type {
  DriverContribution,
  NewsItem,
  PricePoint,
  Scenario,
  Sentiment,
} from "./types";

/** Number of trading days simulated ending at (and including) the desk date. */
const TRADING_DAYS = 500;

/* ------------------------------------------------------------------ */
/* Seeded randomness                                                    */
/* ------------------------------------------------------------------ */

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller standard normal from a uniform RNG. */
function gaussianMaker(rng: () => number): () => number {
  return () => {
    const u1 = Math.max(rng(), 1e-9);
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
}

/* ------------------------------------------------------------------ */
/* Calendar                                                            */
/* ------------------------------------------------------------------ */

function tradingDaysBefore(endISO: string, n: number): string[] {
  const out: string[] = [];
  const cursor = new Date(`${endISO}T00:00:00Z`);
  while (out.length < n) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      out.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return out.reverse();
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Core statistics helpers                                             */
/* ------------------------------------------------------------------ */

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function pctReturns(levels: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < levels.length; i++) {
    out.push((levels[i] / levels[i - 1] - 1) * 100);
  }
  return out;
}

function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const a = xs.slice(-n);
  const b = ys.slice(-n);
  const ma = mean(a);
  const mb = mean(b);
  const sa = std(a);
  const sb = std(b);
  if (sa === 0 || sb === 0) return 0;
  const cov = mean(a.map((v, i) => (v - ma) * (b[i] - mb)));
  return Math.max(-1, Math.min(1, cov / (sa * sb)));
}

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

function rsi(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    if (ch >= 0) gains += ch;
    else losses -= ch;
  }
  if (losses === 0) return gains === 0 ? 50 : 100;
  const rs = gains / losses;
  return 100 - 100 / (1 + rs);
}

function movingAverage(levels: number[], period: number, endIdx: number): number {
  if (endIdx + 1 < period) return NaN;
  return mean(levels.slice(endIdx - period + 1, endIdx + 1));
}

function clampNum(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/* ------------------------------------------------------------------ */
/* Engine output                                                       */
/* ------------------------------------------------------------------ */

export interface EngineFacts {
  /** Desk date (YYYY-MM-DD). */
  date: string;
  /** Trading-day labels aligned with every series below. */
  dates: string[];

  gold: number[];
  dxy: number[];
  realYield: number[]; // 10y real yield, percentage points
  spx: number[];
  silver: number[];
  oil: number[];
  netSpecs: number[]; // thousand contracts
  etfFlowWeekly: number[]; // tonnes per week (aligned to week end indices)
  sentiment: number[]; // -1..1 daily news sentiment

  /** Derived facts for the briefing and visuals. */
  spot: number;
  changeAbs: number;
  changePct: number;
  ret5d: number;
  ret1m: number;
  ret3m: number;
  retYtd: number;
  rsi14: number;
  vol20: number; // annualised percent
  ma20: number;
  ma50: number;
  high52: number;
  low52: number;
  distFromHigh: number; // percent below 52w high (negative if above)
  volSeries: { date: string; vol: number }[];
  volPercentile: number;
  volP25: number;
  volP75: number;
  volRegime: "subdued" | "normal" | "elevated" | "extreme";

  netSpecsPercentile: number;
  etfFlow4w: number; // tonnes, last 4 weeks
  sentimentToday: number;

  drivers: DriverContribution[];
  correlations: {
    assets: string[];
    matrix: number[][];
    window: number;
  };

  events: { date: string; label: string; sentiment: Sentiment }[];
  support: number[];
  resistance: number[];
  scenarios: Scenario[];
  bias: number;
  news: NewsItem[];
  seasonality: { months: { month: string; avgReturn: number }[]; currentMonth: number };
}

const EVENT_LABELS: { label: string; sentiment: Sentiment }[] = [
  { label: "Fed minutes tilt dovish", sentiment: "positive" },
  { label: "Hot CPI print", sentiment: "negative" },
  { label: "Dollar breakout", sentiment: "negative" },
  { label: "Geopolitical bid", sentiment: "positive" },
  { label: "ETF inflow surge", sentiment: "positive" },
  { label: "Real-yield spike", sentiment: "negative" },
  { label: "Central-bank buying", sentiment: "positive" },
  { label: "Risk-off equity slide", sentiment: "positive" },
  { label: "Profit-taking wave", sentiment: "negative" },
];

/** Safe driver-bps lookup by case-insensitive name fragment. */
function drvBps(f: EngineFacts, needle: string): number {
  const d = f.drivers.find((x) =>
    x.driver.toLowerCase().includes(needle.toLowerCase())
  );
  return d?.bps ?? 0;
}

const NEWS_TEMPLATES: {
  cond: (f: EngineFacts, i: number) => boolean | number;
  make: (f: EngineFacts) => Omit<NewsItem, "time">;
}[] = [
  {
    cond: (f) => (f.changePct >= 0 ? 1 : 0.4),
    make: (f) => ({
      source: "Market Wire",
      headline: `Gold ${f.changePct >= 0 ? "extends gains" : "slips"} as dollar ${drvBps(f, "dollar") < 0 ? "softens across G10" : "firms after hawkish commentary"}`,
      sentiment: f.changePct >= 0 ? "positive" : "negative",
      impact: "high",
    }),
  },
  {
    cond: (f) => (drvBps(f, "real") < 0 ? 1 : 0.5),
    make: (f) => ({
      source: "Rates Desk",
      headline: `10-year real yields settle at ${f.realYield[f.realYield.length - 1].toFixed(2)}% after volatile session`,
      sentiment: drvBps(f, "real") < 0 ? "positive" : "negative",
      impact: "high",
    }),
  },
  {
    cond: () => 1,
    make: (f) => ({
      source: "Bullion Monitor",
      headline: `ETF holdings ${f.etfFlow4w >= 0 ? `rise ${f.etfFlow4w.toFixed(1)}t over four weeks` : `fall ${Math.abs(f.etfFlow4w).toFixed(1)}t as holders trim exposure`}`,
      sentiment: f.etfFlow4w >= 0 ? "positive" : "negative",
      impact: "medium",
    }),
  },
  {
    cond: () => 1,
    make: (f) => ({
      source: "Macro Brief",
      headline: `Speculative positioning ${f.netSpecsPercentile > 65 ? "stretched" : f.netSpecsPercentile < 35 ? "washed out" : "balanced"} at ${f.netSpecs[f.netSpecs.length - 1].toFixed(0)}k contracts`,
      sentiment: f.netSpecsPercentile > 65 ? "neutral" : "positive",
      impact: "medium",
    }),
  },
  {
    cond: (f) => (f.volRegime === "elevated" || f.volRegime === "extreme" ? 1 : 0.3),
    make: (f) => ({
      source: "Derivatives Daily",
      headline: `Realised volatility runs ${f.vol20.toFixed(1)}% — ${f.volRegime} regime keeps options desks busy`,
      sentiment: f.volRegime === "extreme" ? "negative" : "neutral",
      impact: "low",
    }),
  },
  {
    cond: () => 1,
    make: (f) => ({
      source: "Global Treasury Daily",
      headline: `Central banks ${f.bias >= 0 ? "keep accumulating reserves" : "slow purchases into strength"}`,
      sentiment: f.bias >= 0 ? "positive" : "neutral",
      impact: "medium",
    }),
  },
  {
    cond: (f) => (f.sentimentToday < -0.15 ? 1 : 0.2),
    make: () => ({
      source: "Market Wire",
      headline: "Asian session sees heavy Comex selling into the London fix",
      sentiment: "negative",
      impact: "low",
    }),
  },
];

const NEWS_TIMES = ["08:15", "09:40", "10:25", "11:05", "12:30", "14:10", "15:45", "16:20"];

/**
 * S10 Roots layer — the data-source seam. When fresh real observations
 * exist, the price/macro series are replaced wholesale by the override
 * while every derivation (moving averages, RSI, vol, correlations,
 * returns, scenarios) stays in the existing code paths below, so both
 * layers (briefing + visuals) render byte-comparable from one facts
 * object. Without an override the output is identical to the
 * deterministic engine — the fail-closed fallback.
 */
export interface MarketOverride {
  /** Real trading-day labels (ascending) the series align to. */
  dates: string[];
  gold?: number[];
  dxy?: number[];
  realYield?: number[];
  spx?: number[];
  silver?: number[];
  oil?: number[];
}

/** Generate the complete deterministic market state for a desk date. */
export function computeMarket(
  dateISO: string,
  override?: MarketOverride
): EngineFacts {
  const rng = mulberry32(hashStr(`aurum-${dateISO}`));
  const gauss = gaussianMaker(rng);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];
  const between = (lo: number, hi: number) => lo + rng() * (hi - lo);

  const dates = override?.dates ?? tradingDaysBefore(dateISO, TRADING_DAYS);
  const n = dates.length;

  /* ---- Macro driver paths ---------------------------------------- */

  const dxy: number[] = [];
  const realYield: number[] = [];
  const spx: number[] = [];
  const oil: number[] = [];

  let dxyL = between(98, 108);
  let ryL = between(1.6, 2.6);
  let spxL = between(5000, 5500);
  let oilL = between(70, 84);

  for (let i = 0; i < n; i++) {
    dxyL += 0.015 * (104 - dxyL) + gauss() * 0.35;
    dxyL = clampNum(dxyL, 92, 116);
    dxy.push(dxyL);

    ryL += 0.012 * (2.1 - ryL) + gauss() * 0.035;
    ryL = clampNum(ryL, 0.4, 3.2);
    realYield.push(ryL);

    spxL *= 1 + 0.0004 + gauss() * 0.01;
    spx.push(spxL);

    oilL += 0.02 * (78 - oilL) + gauss() * 1.6;
    oilL = clampNum(oilL, 48, 110);
    oil.push(oilL);
  }

  /* ---- Gold price built from the drivers -------------------------- */

  // Regime drift: four segments with different drift per day.
  const regimeDrift: number[] = [];
  const segLens = [Math.floor(n * 0.3), Math.floor(n * 0.25), Math.floor(n * 0.25)];
  segLens.push(n - segLens.reduce((a, b) => a + b, 0));
  for (const len of segLens) {
    const drift = between(-0.0012, 0.0018); // daily drift
    for (let j = 0; j < len; j++) regimeDrift.push(drift);
  }

  // Jump events inside the window (outside the last 5 days).
  const jumpIdx = new Set<number>();
  const jumpCount = 5;
  for (let k = 0; k < jumpCount; k++) {
    const idx = Math.floor(rng() * (n - 10));
    jumpIdx.add(idx);
  }

  const gold: number[] = [];
  let goldL = between(2350, 2600);

  // Betas: % gold per unit driver move.
  const BETA_DXY = -0.45; // per 1% DXY
  const BETA_RY_PP = -4.0; // per 1pp real yield
  const BETA_SPX = -0.15; // per 1% S&P (risk-off bids gold)
  const IDIO_SIGMA = 0.5;

  for (let i = 0; i < n; i++) {
    const dxyRet = i === 0 ? 0 : dxy[i] / dxy[i - 1] - 1;
    const ryChg = i === 0 ? 0 : realYield[i] - realYield[i - 1];
    const spxRet = i === 0 ? 0 : spx[i] / spx[i - 1] - 1;

    let ret =
      regimeDrift[i] +
      BETA_DXY * dxyRet +
      BETA_RY_PP * ryChg +
      BETA_SPX * spxRet +
      gauss() * IDIO_SIGMA;

    if (jumpIdx.has(i)) {
      ret += (rng() < 0.55 ? 1 : -1) * between(0.015, 0.03);
    }

    goldL *= 1 + ret / 100;
    goldL = clampNum(goldL, 1500, 4200);
    gold.push(goldL);
  }

  /* ---- S10 seam: real observations replace generated series -------- */

  // When the desk is grounded, live series from the observation store
  // replace the generated ones here. Without an override each *Eff is
  // the very array generated above, so the deterministic path is
  // unchanged bit for bit.
  const goldEff = override?.gold ?? gold;
  const dxyEff = override?.dxy ?? dxy;
  const ryEff = override?.realYield ?? realYield;
  const spxEff = override?.spx ?? spx;
  const oilEff = override?.oil ?? oil;

  /* ---- Silver: ratio walk around gold ----------------------------- */

  const silver: number[] = [];
  let ratio = between(0.011, 0.0135);
  for (let i = 0; i < n; i++) {
    ratio = clampNum(ratio + gauss() * 0.00008, 0.0095, 0.0155);
    silver.push(goldEff[i] * ratio);
  }
  const silverEff = override?.silver ?? silver;

  /* ---- Spec positioning: momentum-driven with percentile bands ---- */

  const netSpecs: number[] = [];
  for (let i = 0; i < n; i++) {
    const ma50v = movingAverage(goldEff, 50, i);
    const trend =
      Number.isNaN(ma50v) ? 0 : Math.tanh((goldEff[i] / ma50v - 1) * 8);
    const target = 145 + 78 * trend;
    const prev = netSpecs.length ? netSpecs[netSpecs.length - 1] : target;
    const next = clampNum(prev + 0.35 * (target - prev) + gauss() * 3, -20, 240);
    netSpecs.push(next);
  }

  /* ---- Weekly ETF flows -------------------------------------------- */

  // One flow per trading week (index every 5th day).
  const weekEndIdxs: number[] = [];
  for (let i = 4; i < n; i += 5) weekEndIdxs.push(i);
  const etfFlowWeekly: number[] = [];
  for (let w = 0; w < weekEndIdxs.length; w++) {
    const i = weekEndIdxs[w];
    const wkRet = i >= 5 ? (goldEff[i] / goldEff[i - 5] - 1) * 100 : 0;
    const seasonal = Math.sin((w / 13) * Math.PI * 2) * 2.2;
    const flow = clampNum(
      1.6 * Math.tanh(wkRet * 1.5) + seasonal + gauss() * 2.4,
      -16,
      18
    );
    etfFlowWeekly.push(Math.round(flow * 10) / 10);
  }

  /* ---- Daily news sentiment ---------------------------------------- */

  const sentiment: number[] = [];
  for (let i = 0; i < n; i++) {
    const ret = i === 0 ? 0 : (goldEff[i] / goldEff[i - 1] - 1) * 100;
    sentiment.push(
      clampNum(ret * 11 + gauss() * 0.28, -1, 1)
    );
  }

  /* ---- Derived facts ------------------------------------------------ */

  const spot = goldEff[n - 1];
  const prev = goldEff[n - 2];
  const changePct = (spot / prev - 1) * 100;
  const changeAbs = spot - prev;

  const retN = (days: number) =>
    n > days ? (gold[n - 1] / gold[n - 1 - days] - 1) * 100 : 0;
  const ret5d = retN(5);
  const ret1m = retN(21);
  const ret3m = retN(63);

  const year = dateISO.slice(0, 4);
  let ytdStart = n - 1;
  for (let i = 0; i < n; i++) {
    if (dates[i].startsWith(year)) {
      ytdStart = i;
      break;
    }
  }
  const retYtd = (spot / goldEff[ytdStart] - 1) * 100;

  const rsi14 = rsi(goldEff, 14);

  const goldRets = pctReturns(goldEff);
  const volAt = (endIdx: number) =>
    std(goldRets.slice(endIdx - 19, endIdx + 1)) * Math.sqrt(252);
  const volSeries: { date: string; vol: number }[] = [];
  for (let i = 0; i < goldRets.length; i++) {
    if (i >= 19 && i >= goldRets.length - 250) {
      volSeries.push({ date: dates[i + 1], vol: volAt(i) });
    }
  }
  const vol20 = volAt(goldRets.length - 1);

  const volsSorted = volSeries.map((v) => v.vol).sort((a, b) => a - b);
  const volP25 = quantile(volsSorted, 0.25);
  const volP75 = quantile(volsSorted, 0.75);
  const volPercentile = volsSorted.length
    ? Math.round(
        (volsSorted.filter((v) => v <= vol20).length / volsSorted.length) * 100
      )
    : 50;
  const volRegime: EngineFacts["volRegime"] =
    volPercentile < 25
      ? "subdued"
      : volPercentile < 55
        ? "normal"
        : volPercentile < 85
          ? "elevated"
          : "extreme";

  const ma20 = movingAverage(goldEff, 20, n - 1);
  const ma50 = movingAverage(goldEff, 50, n - 1);
  const high52 = Math.max(...goldEff.slice(-250));
  const low52 = Math.min(...goldEff.slice(-250));
  const distFromHigh = (spot / high52 - 1) * 100;

  /* ---- Positioning percentiles ------------------------------------- */

  const specsSorted = netSpecs.slice(-250).sort((a, b) => a - b);
  const specsNow = netSpecs[n - 1];
  const netSpecsPercentile = specsSorted.length
    ? Math.round(
        (specsSorted.filter((v) => v <= specsNow).length / specsSorted.length) *
          100
      )
    : 50;
  const etfFlow4w =
    etfFlowWeekly.slice(-4).reduce((a, b) => a + b, 0);
  const sentimentToday = sentiment[n - 1];

  /* ---- Driver attribution (today's move decomposition) ------------- */

  const dxyRetToday = (dxyEff[n - 1] / dxyEff[n - 2] - 1) * 100;
  const ryChgToday = ryEff[n - 1] - ryEff[n - 2];
  const spxRetToday = (spxEff[n - 1] / spxEff[n - 2] - 1) * 100;
  const lastFlow = etfFlowWeekly[etfFlowWeekly.length - 1] ?? 0;

  const cDollar = BETA_DXY * dxyRetToday * 100; // bps
  const cReal = BETA_RY_PP * ryChgToday * 100;
  const cEquities = BETA_SPX * spxRetToday * 100;
  const cFlows = lastFlow * 0.8;
  const actualBps = changePct * 100;
  const cResidual = actualBps - (cDollar + cReal + cEquities + cFlows);

  const drivers: DriverContribution[] = [
    {
      driver: "US dollar",
      bps: Math.round(cDollar),
      note:
        dxyRetToday >= 0
          ? "a firmer DXY dragged on bullion"
          : "dollar weakness handed gold a tailwind",
    },
    {
      driver: "Real 10Y yield",
      bps: Math.round(cReal),
      note:
        ryChgToday >= 0
          ? "higher inflation-adjusted rates raise the opportunity cost of holding gold"
          : "easing real yields are classic gold fuel",
    },
    {
      driver: "Equity risk",
      bps: Math.round(cEquities),
      note:
        spxRetToday <= 0
          ? "risk-off flows rotate into havens"
          : "buoyant equities compete for capital",
    },
    {
      driver: "ETF & CB flows",
      bps: Math.round(cFlows),
      note: `${lastFlow >= 0 ? "+" : ""}${lastFlow.toFixed(1)}t of weekly ETF flow hit the market`,
    },
    {
      driver: "Momentum & residual",
      bps: Math.round(cResidual),
      note: "chart-driven positioning and unexplained factors",
    },
  ];

  /* ---- Cross-asset correlations (trailing 120 trading days) --------- */

  const corrAssets = [
    "Gold",
    "US Dollar",
    "Real 10Y",
    "S&P 500",
    "Silver",
    "Crude Oil",
    "Specs",
  ];
  const goldR = goldRets.slice(-120);
  const seriesFor = (levels: number[]) => pctReturns(levels).slice(-120);
  const corrSeries = [
    goldR,
    seriesFor(dxyEff),
    pctReturns(ryEff.map((v) => v * 100)).slice(-120), // scale invariant
    seriesFor(spxEff),
    seriesFor(silverEff),
    seriesFor(oilEff),
    seriesFor(netSpecs),
  ];
  const matrix: number[][] = corrSeries.map((a) =>
    corrSeries.map((b) => Math.round(pearson(a, b) * 100) / 100)
  );

  /* ---- Catalyst events ---------------------------------------------- */

  const events: { date: string; label: string; sentiment: Sentiment }[] = [];
  {
    let cursor = n - 1 - 15; // keep away from today
    while (events.length < 5 && cursor > n - 130) {
      const idx = cursor - Math.floor(rng() * 12);
      if (idx > n - 130 && idx < n - 8) {
        const local = (goldEff[idx + 5] / goldEff[idx - 5] - 1) * 100;
        const tpl = pick(EVENT_LABELS);
        events.push({
          date: dates[idx],
          label: tpl.label,
          sentiment:
            local > 0.5
              ? "positive"
              : local < -0.5
                ? "negative"
                : tpl.sentiment,
        });
      }
      cursor -= 20;
    }
  }

  /* ---- Technical levels --------------------------------------------- */

  const roundTo = (v: number, step: number) => Math.round(v / step) * step;
  const support = [
    roundTo(spot * between(0.965, 0.985), 5),
    roundTo(spot * between(0.93, 0.95), 5),
  ];
  const resistance = [
    roundTo(spot * between(1.015, 1.035), 5),
    roundTo(spot * between(1.045, 1.06), 5),
  ];

  /* ---- Scenarios ------------------------------------------------------ */

  const bullTarget = roundTo(spot * between(1.07, 1.13), 5);
  const baseTarget = roundTo(spot * between(1.005, 1.02), 5);
  const bearTarget = roundTo(spot * between(0.9, 0.94), 5);

  let bullProb = Math.round(between(22, 38));
  let bearProb = Math.round(between(18, 32));
  let baseProb = 100 - bullProb - bearProb;
  if (baseProb < 35) {
    // keep the base case dominant
    const deficit = 35 - baseProb;
    bullProb -= Math.round(deficit / 2);
    bearProb -= deficit - Math.round(deficit / 2);
    baseProb = 35;
  }

  const scenarios: Scenario[] = [
    {
      id: "bull",
      label: "Bull",
      probability: bullProb,
      target: bullTarget,
      trigger: `A dovish policy pivot and sustained ETF inflows lift gold toward $${bullTarget.toLocaleString()}.`,
      horizon: "3 months",
    },
    {
      id: "base",
      label: "Base",
      probability: baseProb,
      target: baseTarget,
      trigger: `Range trade persists around $${baseTarget.toLocaleString()} while the dollar and real yields chop sideways.`,
      horizon: "3 months",
    },
    {
      id: "bear",
      label: "Bear",
      probability: bearProb,
      target: bearTarget,
      trigger: `A hawkish surprise and sticky real yields press gold toward $${bearTarget.toLocaleString()}.`,
      horizon: "3 months",
    },
  ];

  /* ---- Bias score ------------------------------------------------------ */

  const bias = Math.round(
    clampNum(
      ret1m * 6 +
        (rsi14 - 50) * 0.9 +
        sentimentToday * 26 +
        (netSpecsPercentile - 50) * 0.25 +
        (spot >= ma50 ? 6 : -6),
      -100,
      100
    )
  );

  /* ---- News tape -------------------------------------------------------- */

  function factsView(): EngineFacts {
    return partial as EngineFacts;
  }

  const partial = {
    date: dateISO,
    dates,
    gold: goldEff,
    dxy: dxyEff,
    realYield: ryEff,
    spx: spxEff,
    silver: silverEff,
    oil: oilEff,
    netSpecs,
    etfFlowWeekly,
    sentiment,
    spot,
    changeAbs,
    changePct,
    ret5d,
    ret1m,
    ret3m,
    retYtd,
    rsi14,
    vol20,
    ma20,
    ma50,
    high52,
    low52,
    distFromHigh,
    volSeries,
    volPercentile,
    volP25,
    volP75,
    volRegime,
    netSpecsPercentile,
    etfFlow4w,
    sentimentToday,
    drivers,
    correlations: { assets: corrAssets, matrix, window: 120 },
    events,
    support,
    resistance,
    scenarios,
    bias,
    news: [],
    seasonality: {
      months: [],
      currentMonth: new Date(`${dateISO}T00:00:00Z`).getUTCMonth(),
    },
  };

  /* ---- Seasonality ------------------------------------------------------- */

  const seasonalityBase = [1.1, -0.3, 0.2, 0.8, -0.5, 0.4, 1.3, 0.6, 1.4, -0.6, 0.5, 0.7];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  partial.seasonality.months = months.map((m, i) => ({
    month: m,
    avgReturn:
      Math.round((seasonalityBase[i] + gauss() * 0.25) * 100) / 100,
  }));

  // News tape is generated last so templates can read the finished facts.
  const newsItems: NewsItem[] = [];
  for (const t of NEWS_TEMPLATES) {
    const weight = t.cond(factsView(), 0);
    const pass = typeof weight === "number" ? rng() < weight : Boolean(weight);
    if (pass) {
      newsItems.push({ time: "", ...t.make(factsView()) });
    }
  }
  partial.news = newsItems.slice(0, 7).map((item, i) => ({
    ...item,
    time: NEWS_TIMES[i % NEWS_TIMES.length],
  }));

  return partial as EngineFacts;
}

/** Scenario fan paths for the S9 visual (13 weekly steps over 90 days). */
export function scenarioPaths(
  dateISO: string,
  spot: number,
  scenarios: Scenario[],
  vol20: number
): {
  date: string;
  bull: number;
  base: number;
  bear: number;
  upper: number;
  lower: number;
}[] {
  const rng = mulberry32(hashStr(`aurum-fan-${dateISO}`));
  const gauss = gaussianMaker(rng);

  const bull = scenarios.find((s) => s.id === "bull")!.target;
  const base = scenarios.find((s) => s.id === "base")!.target;
  const bear = scenarios.find((s) => s.id === "bear")!.target;

  const steps = 13;
  const spread = spot * (vol20 / 100) * Math.sqrt(90 / 252) * 0.9;

  const out: {
    date: string;
    bull: number;
    base: number;
    bear: number;
    upper: number;
    lower: number;
  }[] = [];

  for (let k = 0; k <= steps; k++) {
    const t = k / steps;
    const wiggle = () => gauss() * spot * 0.002;
    const bullV = spot + (bull - spot) * Math.pow(t, 0.8) + wiggle() * t;
    const baseV = spot + (base - spot) * t + wiggle() * t;
    const bearV = spot + (bear - spot) * Math.pow(t, 1.2) + wiggle() * t;
    const wid = spread * Math.sqrt(t);

    // First point is exactly spot (today's anchor).
    if (k === 0) {
      out.push({
        date: addDaysISO(dateISO, 0),
        bull: spot,
        base: spot,
        bear: spot,
        upper: spot,
        lower: spot,
      });
      continue;
    }

    out.push({
      date: addDaysISO(dateISO, Math.round(t * 90)),
      bull: Math.round(bullV * 100) / 100,
      base: Math.round(baseV * 100) / 100,
      bear: Math.round(bearV * 100) / 100,
      upper: Math.round((Math.max(bullV, baseV, bearV) + wid) * 100) / 100,
      lower: Math.round((Math.min(bullV, baseV, bearV) - wid) * 100) / 100,
    });
  }

  return out;
}

/** Price points with moving averages for the hero chart (last N days). */
export function pricePoints(facts: EngineFacts, days: number): PricePoint[] {
  const out: PricePoint[] = [];
  const start = Math.max(0, facts.gold.length - days);
  for (let i = start; i < facts.gold.length; i++) {
    const ma20 = movingAverage(facts.gold, 20, i);
    const ma50 = movingAverage(facts.gold, 50, i);
    out.push({
      date: facts.dates[i],
      price: Math.round(facts.gold[i] * 100) / 100,
      ma20: Number.isNaN(ma20) ? undefined : Math.round(ma20 * 100) / 100,
      ma50: Number.isNaN(ma50) ? undefined : Math.round(ma50 * 100) / 100,
    });
  }
  return out;
}
