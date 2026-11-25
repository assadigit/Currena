/**
 * Compound Wealth — the pure maths engine (spec §6).
 *
 * One small module, no imports, no React, no network: every function is
 * arithmetic over its arguments, so the whole engine is testable headlessly
 * (tests/compound-maths.test.ts, spec §12 tests 1–11).
 *
 * The monthly loop (spec §6.1), in words: every month the balance grows at
 * the net monthly rate, the month's deposit joins the pending pot, and on
 * every k-th month (and always the last month) the pending pot is invested
 * minus the flat fee — money waiting in pending earns nothing. "Today's
 * money" divides every value by cumulative inflation. The band and baseline
 * follow §6.2 (baseline = the LOWER of the 20- and 30-year figures; the
 * high end prefers the higher measured figure when the two differ by at
 * least the band threshold, else it is a labelled what-if).
 */

/* =================================================================== *
 * CONFIG BLOCK — every knob in plain English                          *
 * =================================================================== */

/** The milestone lines drawn on the page and the cards (currency units). */
export const MILESTONES: readonly number[] = [
  5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000,
  2_500_000, 5_000_000, 10_000_000,
];

/** Milestones shown on the page (the cards show more). */
export const MILESTONES_ON_PAGE = 3;
/** Milestones shown on the A4 and phone cards. */
export const MILESTONES_ON_CARDS = 5;

/** Default monthly amount (currency units). */
export const DEFAULT_MONTHLY = 100;
/** Default plan length in years. */
export const DEFAULT_YEARS = 20;
/** Quick chips under the amount box. */
export const AMOUNT_CHIPS: readonly number[] = [50, 100, 200, 500];
/** Quick chips for the years control. */
export const YEAR_CHIPS: readonly number[] = [10, 20, 30];

/** The assumed yearly cost of investing, as a decimal (0.2% = 0.002). */
export const DEFAULT_YEARLY_COST = 0.002;
/** The editable range for the yearly cost. */
export const YEARLY_COST_MIN = 0;
export const YEARLY_COST_MAX = 0.03;

/** The "what if it's lower/higher" band width, in percentage points (2). */
export const WHAT_IF_POINTS = 2;
/** If the 20- and 30-year figures differ by at least this many points, the
 *  higher measured figure is used as the band's high end; otherwise the high
 *  end is a labelled what-if. In percentage points. */
export const BAND_THRESHOLD_POINTS = 0.5;

/** Inflation limits (decimals) for the editable field. */
export const INFLATION_MIN = 0;
export const INFLATION_MAX = 0.15;

/** The yearly-increase limits (decimals) for the editable field. */
export const INCREASE_MIN = 0;
export const INCREASE_MAX = 0.15;

/** The salary-share limits for percent mode (3% default). */
export const SHARE_DEFAULT = 0.03;
export const SHARE_MIN = 0.005;
export const SHARE_MAX = 0.30;

/** Years limits for the number box and the custom end date. */
export const YEARS_MIN = 1;
export const YEARS_MAX = 50;

/** How old the figures file may be before the page says so (months). */
export const STALENESS_MONTHS = 18;

/** Default country preset. */
export const DEFAULT_COUNTRY = "AU" as const;

/** When a fee eats more than this share of a single purchase, the page
 *  suggests buying every 3 months (1% = 0.01). */
export const FEE_WARNING_SHARE = 0.01;

/* =================================================================== *
 * Types                                                               *
 * =================================================================== */

/** The country preset: sets currency, assets, cash rate and inflation. */
export type Country = "AU" | "US";

/** How the rate is chosen: the measured figures, one custom rate, or a range. */
export type RateMode = "average" | "custom-rate" | "custom-range";

/** The user's plan — everything the engine needs. */
export interface PlanInput {
  /** Monthly amount in fixed mode (ignored when share mode is on). */
  monthly: number;
  /** Percent-of-salary mode: monthly salary after tax. */
  salary: number | null;
  /** Percent-of-salary mode: share of salary (decimal). */
  share: number;
  /** Use percent-of-salary mode instead of the fixed amount. */
  useShare: boolean;
  /** Current age, for "at age N" wording (optional). */
  age: number | null;
  /** Already-invested starting amount (no purchase fee on it). */
  startingAmount: number;
  /** Yearly increase of the amount you invest (decimal). */
  yearlyIncrease: number;
  /** Yearly cost of investing (decimal), e.g. 0.002 for 0.2%. */
  yearlyCost: number;
  /** Flat fee per purchase (currency units). */
  feePerPurchase: number;
  /** Buy every k months (1 or 3). */
  purchaseEveryMonths: 1 | 3;
  /** Rate selection. */
  rateMode: RateMode;
  /** Custom rate (decimal) for rateMode "custom-rate". */
  customRate: number;
  /** Custom low / high (decimals) for rateMode "custom-range". */
  customLow: number;
  customHigh: number;
  /** Yearly inflation (decimal). */
  inflation: number;
}

/** The measured figures for one asset (from the figures file). */
export interface AssetFigures {
  /** Last-20-years annual return (decimal), or null when not sourced. */
  r20: number | null;
  /** Last-30-years annual return (decimal), or null when not sourced. */
  r30: number | null;
  /** A shorter published figure (at least 10 years), when 20/30 are not
   *  published: the rate, the window length in years, and its label. */
  single?: { rate: number; years: number; label?: string };
}

/** Everything the chart, tiles, milestones and cards render. */
export interface CompoundResult {
  /** Total months in the plan. */
  months: number;
  /** The baseline annual rate used (decimal, before the yearly cost). */
  baselineRate: number;
  /** The band: low and high annual rates (decimals), when a band exists. */
  band: { low: number; high: number } | null;
  /** Is the high end a measured figure (true) or a what-if (false)? */
  bandHighIsMeasured: boolean;
  /** Net rate after the yearly cost (decimal). */
  netRate: number;
  /** The monthly series (m = 1..n), in future money. */
  series: MonthPoint[];
  /** Final value in future money (balance + pending). */
  finalValue: number;
  /** Final value in today's money. */
  finalValueToday: number;
  /** Total put in (starting amount + every deposit). */
  totalPutIn: number;
  /** Total put in, in today's money. */
  totalPutInToday: number;
  /** Growth = final value − total put in (fees are a cost, never added back). */
  growth: number;
  /** Money still waiting to be invested at the end (when the fee ate it). */
  pending: number;
  /** Total flat fees paid. */
  feesPaid: number;
  /** Fees as a share of total put in (when > 0). */
  feesShareOfPutIn: number | null;
  /** True when every purchase was skipped because the fee ate it. */
  neverInvests: boolean;
  /** True when the fee is over 1% of each purchase (the costs hint). */
  feeEatsLargeShare: boolean;
  /** The same series run at the band's low rate (null when no band). */
  lowSeries: MonthPoint[] | null;
  /** The same series run at the band's high rate (null when no band). */
  highSeries: MonthPoint[] | null;
  /** Final values at the low / high rates (future money), when a band exists. */
  lowFinal: number | null;
  highFinal: number | null;
  /** First month where cumulative growth ≥ cumulative put in (1-based). */
  crossoverMonth: number | null;
  /** Milestones at or below the final value (future money), largest last. */
  milestones: Milestone[];
  /** The same milestones measured in today's money. */
  milestonesToday: Milestone[];
  /** The monthly deposit in a given month (1-based), for what-if maths. */
  depositAt: (m: number) => number;
}

/** One month of the projection. */
export interface MonthPoint {
  /** 1-based month index. */
  m: number;
  /** Balance that is invested (after this month's growth and purchase). */
  balance: number;
  /** Money waiting to be invested (after this month's purchase attempt). */
  pending: number;
  /** Value = balance + pending. */
  value: number;
  /** Cumulative deposits including the starting amount. */
  putIn: number;
  /** Growth = value − putIn. */
  growth: number;
  /** The same point in today's money. */
  valueToday: number;
  putInToday: number;
}

/** One milestone crossing. */
export interface Milestone {
  /** The threshold crossed (currency units). */
  threshold: number;
  /** The 1-based month it was crossed in this money view. */
  month: number;
}

/* =================================================================== *
 * Baseline and band (spec §6.2)                                       *
 * =================================================================== */

export interface RateChoice {
  /** The baseline annual rate (decimal). */
  baseline: number;
  /** The band, when one exists (custom range or two differing figures). */
  band: { low: number; high: number } | null;
  /** Is the high end measured (vs a what-if)? */
  highIsMeasured: boolean;
  /** Plain-words description of how the baseline was chosen. */
  how: "lower-of-two" | "single-figure" | "custom-rate" | "custom-range" | "none";
}

/**
 * Choose the baseline and the band from an asset's measured figures.
 *
 * - Baseline = the LOWER of the 20- and 30-year figures (the honest choice).
 * - High end = the higher measured figure when the two differ by at least
 *   BAND_THRESHOLD_POINTS; otherwise baseline + WHAT_IF_POINTS (a what-if).
 * - Low end = always baseline − WHAT_IF_POINTS (a what-if).
 * - A single measured figure: baseline = it, band = b ± what-if points.
 * - Custom rate: no band. Custom range: the typed low/high, middle = average.
 */
export function chooseRate(figures: AssetFigures, plan: PlanInput): RateChoice {
  if (plan.rateMode === "custom-rate") {
    return { baseline: plan.customRate, band: null, highIsMeasured: false, how: "custom-rate" };
  }
  if (plan.rateMode === "custom-range") {
    const low = Math.min(plan.customLow, plan.customHigh);
    const high = Math.max(plan.customLow, plan.customHigh);
    return { baseline: (low + high) / 2, band: { low, high }, highIsMeasured: true, how: "custom-range" };
  }
  const { r20, r30 } = figures;
  if (r20 === null && r30 === null) {
    if (figures.single && figures.single.years >= 10) {
      const only = figures.single.rate;
      return {
        baseline: only,
        band: { low: only - WHAT_IF_POINTS / 100, high: only + WHAT_IF_POINTS / 100 },
        highIsMeasured: false,
        how: "single-figure",
      };
    }
    // No measured figure at all (should not happen with a full figures
    // file; kept honest anyway): a neutral 0% line, no band.
    return { baseline: 0, band: null, highIsMeasured: false, how: "none" };
  }
  if (r20 === null || r30 === null) {
    const only = (r20 ?? r30) as number;
    return {
      baseline: only,
      band: { low: only - WHAT_IF_POINTS / 100, high: only + WHAT_IF_POINTS / 100 },
      highIsMeasured: false,
      how: "single-figure",
    };
  }
  const lower = Math.min(r20, r30);
  const higher = Math.max(r20, r30);
  const differEnough = higher - lower >= BAND_THRESHOLD_POINTS / 100;
  return {
    baseline: lower,
    band: {
      low: lower - WHAT_IF_POINTS / 100,
      high: differEnough ? higher : lower + WHAT_IF_POINTS / 100,
    },
    highIsMeasured: differEnough,
    how: "lower-of-two",
  };
}

/* =================================================================== *
 * The core monthly loop (spec §6.1)                                   *
 * =================================================================== */

/** Clamp a number into [min, max]; NaN falls back to the fallback. */
export function clamp(v: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

/** Add months to a YYYY-MM string. */
export function addMonths(ym: string, months: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${String(ny).padStart(4, "0")}-${String(nm).padStart(2, "0")}`;
}

/** The monthly deposit in month m (1-based) for a plan. */
function depositFor(plan: PlanInput, m: number): number {
  const base = plan.useShare && plan.salary !== null ? plan.salary * plan.share : plan.monthly;
  const year = Math.floor((m - 1) / 12); // deposit year y (0 for months 1–12)
  return base * Math.pow(1 + plan.yearlyIncrease, year);
}

/**
 * Run one projection at a single annual rate. Returns the monthly series
 * plus the fees actually paid (purchases that cleared the fee).
 */
function runAtRate(
  plan: PlanInput,
  rate: number,
  months: number,
): { series: MonthPoint[]; feesPaid: number } {
  const net = rate - plan.yearlyCost;
  // The net monthly rate; guarded so a deeply negative net rate can never
  // produce a complex root (Math.pow of a negative base).
  const monthlyRate = 1 + net > 0 ? Math.pow(1 + net, 1 / 12) - 1 : Math.max(-1, net / 12);
  const k = plan.purchaseEveryMonths;
  const series: MonthPoint[] = [];
  let balance = plan.startingAmount; // already invested, no purchase fee on it
  let pending = 0;
  let putIn = plan.startingAmount;
  let feesPaid = 0;
  for (let m = 1; m <= months; m++) {
    balance *= 1 + monthlyRate;
    const deposit = depositFor(plan, m);
    pending += deposit;
    putIn += deposit;
    const isPurchaseMonth = m % k === 0 || m === months;
    if (isPurchaseMonth && pending > plan.feePerPurchase) {
      balance += pending - plan.feePerPurchase;
      feesPaid += plan.feePerPurchase;
      pending = 0;
    }
    const value = balance + pending;
    // Today's money at the end of month m: divide by (1+inflation)^(m/12).
    const deflate = Math.pow(1 + plan.inflation, m / 12);
    series.push({
      m,
      balance,
      pending,
      value,
      putIn,
      growth: value - putIn,
      valueToday: value / deflate,
      putInToday: putIn / deflate,
    });
  }
  return { series, feesPaid };
}

/* =================================================================== *
 * Milestones (spec §6.4)                                              *
 * =================================================================== */

/** The milestone thresholds at or below a value, largest last. */
function thresholdsBelow(value: number, max: number): number[] {
  return MILESTONES.filter((t) => t <= value).slice(-max);
}

/** Milestones against a monthly series in one money view. */
function milestonesIn(series: MonthPoint[], pick: (p: MonthPoint) => number, max: number): Milestone[] {
  return thresholdsBelow(pick(series[series.length - 1]), max).map((threshold) => {
    let month = series.length;
    for (const p of series) {
      if (pick(p) >= threshold) {
        month = p.m;
        break;
      }
    }
    return { threshold, month };
  });
}

/* =================================================================== *
 * The full result                                                     *
 * =================================================================== */

/** Compute everything the page renders for one plan. */
export function computeCompound(
  plan: PlanInput,
  figures: AssetFigures,
  months: number,
): CompoundResult {
  const safeMonths = Math.max(0, Math.round(months));
  const choice = chooseRate(figures, plan);
  const { series, feesPaid } = runAtRate(plan, choice.baseline, safeMonths);
  const last = series.length > 0 ? series[series.length - 1] : null;
  const finalValue = last ? last.value : plan.startingAmount;
  const finalValueToday = last ? last.valueToday : plan.startingAmount;
  const totalPutIn = last ? last.putIn : plan.startingAmount;
  const totalPutInToday = last ? last.putInToday : plan.startingAmount;
  const pending = last ? last.pending : 0;

  const neverInvests =
    plan.feePerPurchase > 0 && feesPaid === 0 && safeMonths > 0 && depositFor(plan, 1) > 0;
  // The "large share" hint: the fee is over 1% of each purchase.
  const perPurchase = plan.purchaseEveryMonths * depositFor(plan, 1);
  const feeEatsLargeShare =
    plan.feePerPurchase > 0 && perPurchase > 0
      ? plan.feePerPurchase > FEE_WARNING_SHARE * perPurchase
      : false;

  // Crossover: first month where growth ≥ put in.
  let crossoverMonth: number | null = null;
  for (const p of series) {
    if (p.growth >= p.putIn) {
      crossoverMonth = p.m;
      break;
    }
  }

  // Band runs.
  let lowSeries: MonthPoint[] | null = null;
  let highSeries: MonthPoint[] | null = null;
  let lowFinal: number | null = null;
  let highFinal: number | null = null;
  if (choice.band) {
    lowSeries = runAtRate(plan, choice.band.low, safeMonths).series;
    highSeries = runAtRate(plan, choice.band.high, safeMonths).series;
    lowFinal = lowSeries.length ? lowSeries[lowSeries.length - 1].value : null;
    highFinal = highSeries.length ? highSeries[highSeries.length - 1].value : null;
  }

  const milestones =
    series.length > 0
      ? milestonesIn(series, (p) => p.value, MILESTONES_ON_CARDS)
      : [];
  const milestonesToday =
    series.length > 0
      ? milestonesIn(series, (p) => p.valueToday, MILESTONES_ON_CARDS)
      : [];

  return {
    months: safeMonths,
    baselineRate: choice.baseline,
    band: choice.band,
    bandHighIsMeasured: choice.highIsMeasured,
    netRate: choice.baseline - plan.yearlyCost,
    series,
    finalValue,
    finalValueToday,
    totalPutIn,
    totalPutInToday,
    growth: finalValue - totalPutIn,
    pending,
    feesPaid,
    feesShareOfPutIn: feesPaid > 0 && totalPutIn > 0 ? feesPaid / totalPutIn : null,
    neverInvests,
    feeEatsLargeShare,
    lowSeries,
    highSeries,
    lowFinal,
    highFinal,
    crossoverMonth,
    milestones,
    milestonesToday,
    depositAt: (m: number) => depositFor(plan, m),
  };
}

/* =================================================================== *
 * The what-if maths (spec §5.2)                                       *
 * =================================================================== */

/**
 * "1% more / 1% less": in fixed mode 10% of the monthly amount, in share
 * mode 1 percentage point of salary share. Returns the final value change
 * at the same rate (future money).
 */
export function whatIfSmallChange(
  plan: PlanInput,
  figures: AssetFigures,
  months: number,
): { more: number; less: number; describedAs: "amount" | "salary" } | null {
  if (months <= 0) return null;
  const up: PlanInput = { ...plan };
  const down: PlanInput = { ...plan };
  if (plan.useShare && plan.salary !== null) {
    if (plan.share + 0.01 > SHARE_MAX || plan.share - 0.01 < SHARE_MIN) return null;
    up.share = plan.share + 0.01;
    down.share = plan.share - 0.01;
  } else {
    if (plan.monthly <= 0) return null;
    up.monthly = plan.monthly * 1.1;
    down.monthly = plan.monthly * 0.9;
  }
  const base = computeCompound(plan, figures, months);
  const more = computeCompound(up, figures, months);
  const less = computeCompound(down, figures, months);
  return {
    more: more.finalValue - base.finalValue,
    less: base.finalValue - less.finalValue,
    describedAs: plan.useShare && plan.salary !== null ? "salary" : "amount",
  };
}

/** "Starting N years later costs you X" (future money). */
export function whatIfLaterStart(
  plan: PlanInput,
  figures: AssetFigures,
  months: number,
  yearsLater: number,
): number | null {
  const shorter = months - yearsLater * 12;
  if (shorter <= 0 || yearsLater <= 0) return null;
  const base = computeCompound(plan, figures, months);
  const late = computeCompound(plan, figures, shorter);
  return base.finalValue - late.finalValue;
}

/** The cash comparison: the same plan at the cash rate (no band). */
export function whatIfCash(
  plan: PlanInput,
  cashFigures: AssetFigures,
  months: number,
): number | null {
  if (cashFigures.r20 === null && cashFigures.r30 === null) return null;
  const cash = computeCompound({ ...plan, rateMode: "average" }, cashFigures, months);
  return cash.finalValue;
}

/* =================================================================== *
 * Foreign assets in AUD (spec §6.3)                                   *
 * =================================================================== */

/**
 * Convert a USD annual rate into an AUD annual rate over the same years.
 *
 * FX is quoted as USD per 1 AUD at the start and end of the period:
 *   AUD growth = USD growth × (FX_start / FX_end)
 *   r_AUD = (AUD growth)^(1/years) − 1
 *
 * Spec test: 10% a year in USD for 20 years with FX 0.80 → 0.40 gives
 * about 13.88% a year in AUD.
 */
export function audFromUsd(
  usdAnnualRate: number,
  fxStart: number,
  fxEnd: number,
  years: number,
): number {
  const usdGrowth = Math.pow(1 + usdAnnualRate, years);
  const audGrowth = usdGrowth * (fxStart / fxEnd);
  return Math.pow(audGrowth, 1 / years) - 1;
}

/* =================================================================== *
 * Dates (spec §5.3, §6.1)                                             *
 * =================================================================== */

/** This month as YYYY-MM (UTC — the site's own day rule). */
export function thisMonth(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Months between two YYYY-MM strings (b − a). */
export function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return by * 12 + bm - (ay * 12 + am);
}

/**
 * Clamp a custom start/end pair: the start cannot be before this month,
 * the end is at most 50 years from the start (and after the start).
 */
export function clampDates(
  start: string,
  end: string,
): { start: string; end: string; clamped: boolean } {
  const now = thisMonth();
  const s = start < now ? now : start;
  const maxEnd = addMonths(s, YEARS_MAX * 12);
  let e = end;
  if (e <= s) e = addMonths(s, 1);
  if (e > maxEnd) e = maxEnd;
  return { start: s, end: e, clamped: s !== start || e !== end };
}

/* =================================================================== *
 * Staleness (spec §7)                                                 *
 * =================================================================== */

/** Months between a YYYY-MM(-DD) date and today (UTC). */
export function monthsSince(isoDate: string): number {
  const [y, m] = isoDate.slice(0, 7).split("-").map(Number);
  const now = new Date();
  const nowMonths = now.getUTCFullYear() * 12 + now.getUTCMonth() + 1;
  return nowMonths - (y * 12 + m);
}

/** True when the figures file is older than STALENESS_MONTHS. */
export function figuresAreStale(checkedOnIso: string): boolean {
  return monthsSince(checkedOnIso) > STALENESS_MONTHS;
}

/* =================================================================== *
 * Formatting helpers (Persian digits, plain grouping)                 *
 * =================================================================== */

/** Format a currency amount for the page (locale fa → Persian digits). */
export function formatMoney(v: number, locale: "en" | "fa", digits = 0): string {
  if (!Number.isFinite(v)) return locale === "fa" ? "۰" : "0";
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    }).format(v);
  } catch {
    return String(Math.round(v));
  }
}

/** Format a percentage (0.081 → "8.1" or "۸٫۱"). */
export function formatPct(v: number, locale: "en" | "fa", digits = 1): string {
  return formatMoney(v * 100, locale, digits);
}
