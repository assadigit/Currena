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

/** Editable range for the what-if points (percentage points). */
export const WHAT_IF_MIN = 0.5;
export const WHAT_IF_MAX = 5;
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

/** The salary-share limits for percent mode (§11: 0.1–50%). */
export const SHARE_DEFAULT = 0.03;
export const SHARE_MIN = 0.001;
export const SHARE_MAX = 0.5;
/** The percent box's stepper step, in percentage points (§11). */
export const PERCENT_STEP = 0.5;
/** Quick chips for the percent box (§11: 1/3/5/10). */
export const PERCENT_CHIPS: readonly number[] = [1, 3, 5, 10];
/** How the salary is typed: per year (the default) or per month. */
export type SalaryPeriod = "year" | "month";
/** The salary box's default period (§11). */
export const SALARY_PERIOD_DEFAULT: SalaryPeriod = "year";

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

/** W2 (spec §6.5): does the yearly fund cost apply to the Cash row?
 *  A savings account has no fund fee, so the default is false — the
 *  cash what-if card, the cash thin line and the compare table all use
 *  the unreduced cash rate. The owner may reverse this decision; flip
 *  this one switch and every cash path follows. */
export const APPLY_COST_TO_CASH = false;

/* =================================================================== *
 * The spending receipt (v10, spec §6.7)                                 *
 * =================================================================== */

/** A receipt item's cadence: how often the cost repeats. */
export type Cadence = "daily" | "weekly" | "monthly" | "yearly";

/** How each cadence turns into a monthly amount (spec §6.7): a daily
 *  cost happens 365/12 times a month, a weekly one 52/12 times, a
 *  monthly one once, a yearly one 1/12 times. So daily 3 → 91.25
 *  exactly and yearly 120 → 10 exactly. */
export const CADENCE_FACTORS: Record<Cadence, number> = {
  daily: 365 / 12,
  weekly: 52 / 12,
  monthly: 1,
  yearly: 1 / 12,
};

/** The receipt's horizon chips (years): 3 matches the owner's example,
 *  10 (the default) gives compounding room to speak. */
export const RECEIPT_HORIZONS: readonly number[] = [3, 5, 10];
/** The receipt's default horizon (years). */
export const RECEIPT_HORIZON_DEFAULT = 10;

/** The three example items the receipt starts with (answer-on-arrival):
 *  illustrative stand-in prices for well-known subscriptions, clearly
 *  labelled — NOT figures-file data (spec §7 governs market figures
 *  only; these are example prices, not sourced market numbers). */
export const RECEIPT_EXAMPLES: ReadonlyArray<{
  label: string;
  labelFa: string;
  amount: number;
  cadence: Cadence;
}> = [
  { label: "YouTube Premium", labelFa: "یوتیوب پرمیوم", amount: 13.99, cadence: "monthly" },
  { label: "Spotify", labelFa: "اسپاتیفای", amount: 10.99, cadence: "monthly" },
  { label: "iCloud+ 2TB", labelFa: "آیکلاود ۲ ترابایت", amount: 9.99, cadence: "monthly" },
];

/** An item's label is optional and at most this many characters. */
export const RECEIPT_LABEL_MAX = 28;
/** An item's price is more than 0 and at most this (two decimals). */
export const RECEIPT_AMOUNT_MAX = 999_999;

/** The paper card's fixed light palette (v10 spec §5) — a receipt is
 *  paper, so the card keeps its own light colours in BOTH themes (the
 *  A4 card's ink-safe precedent). Every text pair is AA on the paper
 *  ground: ink 12.7:1, muted 5.6:1 (measured). The gold is the
 *  projection donut's growth segment — a graphic, so the non-text
 *  3:1 bar applies: 3.6:1 on the paper (measured; the ink chart's own
 *  gold, #a87e1c). */
export const RECEIPT_PALETTE = {
  /** The paper ground. */
  paper: "#fffdf6",
  /** The main ink (labels, amounts, the sentence, the donut's put-in). */
  ink: "#26333d",
  /** The secondary ink (hints, the assumption line, the thanks). */
  muted: "#5a6873",
  /** The dotted leaders and the dashed rules. */
  rule: "#aeb8c0",
  /** The projection donut's growth segment (non-text, ≥3:1). */
  gold: "#a87e1c",
} as const;

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
  /** Percent-of-salary mode: the MONTHLY salary (the UI converts a
   *  per-year salary by ÷ 12; §6.6). Null until a salary is entered. */
  salary: number | null;
  /** Percent-of-salary mode: share of the monthly salary (decimal). */
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
  /** The what-if band width in percentage points (editable). */
  whatIfPoints: number;
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
  const pts = (Number.isFinite(plan.whatIfPoints) ? plan.whatIfPoints : WHAT_IF_POINTS) / 100;
  if (r20 === null && r30 === null) {
    if (figures.single && figures.single.years >= 10) {
      const only = figures.single.rate;
      return {
        baseline: only,
        band: { low: only - pts, high: only + pts },
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
      band: { low: only - pts, high: only + pts },
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
      low: lower - pts,
      high: differEnough ? higher : lower + pts,
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

/** The monthly deposit in month m (1-based) for a plan. A salary of 0
 *  or less reads as "no salary" (the UI's own rule): the amount stands. */
function depositFor(plan: PlanInput, m: number): number {
  const base =
    plan.useShare && plan.salary !== null && plan.salary > 0
      ? plan.salary * plan.share
      : plan.monthly;
  const year = Math.floor((m - 1) / 12); // deposit year y (0 for months 1–12)
  return base * Math.pow(1 + plan.yearlyIncrease, year);
}

/**
 * Run one projection at a single annual rate. Returns the monthly series
 * plus the fees actually paid (purchases that cleared the fee).
 *
 * `isCash` marks the Cash asset: when APPLY_COST_TO_CASH is false the
 * yearly fund cost is not deducted from it (spec §6.5).
 */
function runAtRate(
  plan: PlanInput,
  rate: number,
  months: number,
  isCash = false,
): { series: MonthPoint[]; feesPaid: number } {
  const net = rate - (isCash && !APPLY_COST_TO_CASH ? 0 : plan.yearlyCost);
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

/** Compute everything the page renders for one plan.
 *
 * `opts.isCash` marks the Cash asset (the what-if card, the compare row
 * and the chart's thin cash line): the yearly fund cost is not deducted
 * from it while APPLY_COST_TO_CASH is false (spec §6.5).
 */
export function computeCompound(
  plan: PlanInput,
  figures: AssetFigures,
  months: number,
  opts: { isCash?: boolean } = {},
): CompoundResult {
  const safeMonths = Math.max(0, Math.round(months));
  const choice = chooseRate(figures, plan);
  const { series, feesPaid } = runAtRate(plan, choice.baseline, safeMonths, opts.isCash === true);
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

  // Band runs. Cash has no band (spec §6.2 "Cash: no band") — the
  // compare table and the cash line use the single unreduced rate.
  const band = opts.isCash === true ? null : choice.band;
  let lowSeries: MonthPoint[] | null = null;
  let highSeries: MonthPoint[] | null = null;
  let lowFinal: number | null = null;
  let highFinal: number | null = null;
  if (band) {
    lowSeries = runAtRate(plan, band.low, safeMonths).series;
    highSeries = runAtRate(plan, band.high, safeMonths).series;
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
    band,
    bandHighIsMeasured: choice.highIsMeasured,
    netRate: choice.baseline - (opts.isCash === true && !APPLY_COST_TO_CASH ? 0 : plan.yearlyCost),
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

/** What the small-changes card says, in the words the spec asks for:
 *  money terms in Amount mode ("Investing 10 more a month adds X"),
 *  percentage points in % mode ("Investing 4% instead of 3% adds X"). */
export interface SmallChange {
  /** Final-value change for the "more" sentence (future money). */
  more: number;
  /** Final-value loss for the "less" sentence (future money). */
  less: number;
  /** Amount mode: the money step (10% of the amount, whole, min 1). */
  moneyStep: number | null;
  /** Amount mode with a known salary: the step as a share of the
   *  monthly salary (a decimal, e.g. 0.002 for 0.2%), else null. */
  stepShareOfSalary: number | null;
  /** % mode: the current / up / down percentages (decimals). */
  pctNow: number | null;
  pctUp: number | null;
  pctDown: number | null;
  /** True when the "less" sentence must be hidden (the lower value
   *  would be under 0.5%, or the amount would go negative). */
  hideLess: boolean;
  /** True when the "more" sentence must be hidden (out of range). */
  hideMore: boolean;
  /** Which mode the wording follows. */
  describedAs: "amount" | "salary";
}

/**
 * The small-changes card (W1): the step is money in Amount mode — 10%
 * of the monthly amount, rounded to a whole number, minimum 1 — and
 * one percentage point in % mode. Never "1% more" when the change is
 * 10% of the amount.
 */
export function whatIfSmallChange(
  plan: PlanInput,
  figures: AssetFigures,
  months: number,
): SmallChange | null {
  if (months <= 0) return null;
  const up: PlanInput = { ...plan };
  const down: PlanInput = { ...plan };
  let moneyStep: number | null = null;
  let stepShareOfSalary: number | null = null;
  let pctNow: number | null = null;
  let pctUp: number | null = null;
  let pctDown: number | null = null;
  let hideLess = false;
  let hideMore = false;

  if (plan.useShare && plan.salary !== null) {
    // % mode: one percentage point either way (§5.2).
    pctNow = plan.share;
    pctUp = plan.share + 0.01;
    pctDown = plan.share - 0.01;
    hideMore = pctUp > SHARE_MAX;
    hideLess = pctDown < 0.005; // "under 0.5%" hides the less sentence
    up.share = Math.min(pctUp, SHARE_MAX);
    if (!hideLess) down.share = pctDown;
  } else {
    // Amount mode: 10% of the monthly amount, whole, minimum 1.
    if (plan.monthly <= 0) return null;
    moneyStep = Math.max(1, Math.round(plan.monthly * 0.1));
    up.monthly = plan.monthly + moneyStep;
    hideLess = plan.monthly - moneyStep < 0;
    if (!hideLess) down.monthly = plan.monthly - moneyStep;
    if (plan.salary !== null && plan.salary > 0) {
      stepShareOfSalary = moneyStep / plan.salary;
    }
  }
  const base = computeCompound(plan, figures, months);
  const more = computeCompound(up, figures, months);
  const less = computeCompound(down, figures, months);
  return {
    more: more.finalValue - base.finalValue,
    less: base.finalValue - less.finalValue,
    moneyStep,
    stepShareOfSalary,
    pctNow,
    pctUp,
    pctDown,
    hideLess,
    hideMore,
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

/** The cash comparison: the same plan at the cash rate (no band, and no
 *  yearly fund cost while APPLY_COST_TO_CASH is false — spec §6.5). */
export function whatIfCash(
  plan: PlanInput,
  cashFigures: AssetFigures,
  months: number,
): number | null {
  if (cashFigures.r20 === null && cashFigures.r30 === null) return null;
  const cash = computeCompound({ ...plan, rateMode: "average" }, cashFigures, months, {
    isCash: true,
  });
  return cash.finalValue;
}

/* =================================================================== *
 * The share bar (v8): the tiles' proportion as one honest split       *
 * =================================================================== */

/** Shares under this are shown as "<1%" rather than a rounded-down
 *  whole percent (1% = 0.01). */
export const SHARE_BAR_MIN_SHOWN = 0.01;

/** The two parts of a final value, as shares of that value. */
export interface FinalSplit {
  /** The money-you-put-in share, 0..1. */
  putInShare: number;
  /** The growth share, 0..1; the two always sum to exactly 1. */
  growthShare: number;
}

/**
 * Split a final value into its two shares for the share bar (v8).
 *
 * The honest-edge rule: the bar is drawable only when growth ≥ 0 and
 * final > 0 — anything else returns null and the page hides the bar
 * (the today view can make real growth negative; hiding is honest).
 * The shares are proportions of the SHOWN values (future or today's
 * money), so the bar follows the tiles' money toggle exactly.
 */
export function splitFinal(final: number, putIn: number): FinalSplit | null {
  if (!Number.isFinite(final) || !Number.isFinite(putIn)) return null;
  if (final <= 0) return null;
  const growth = final - putIn;
  if (growth < 0) return null;
  // Clamp against float drift, then make the two shares sum to exactly 1.
  const putInShare = Math.min(1, Math.max(0, putIn / final));
  return { putInShare, growthShare: 1 - putInShare };
}

/**
 * A share's display rounding: whole percents, with shares under
 * SHARE_BAR_MIN_SHOWN (but above zero) flagged so the page renders
 * "<1%" instead of a misleading "0%".
 */
export function shareRounded(share: number): { pct: number; underOne: boolean } {
  if (!Number.isFinite(share)) return { pct: 0, underOne: false };
  const clamped = Math.min(1, Math.max(0, share));
  return {
    pct: Math.round(clamped * 100),
    underOne: clamped > 0 && clamped < SHARE_BAR_MIN_SHOWN,
  };
}

/* =================================================================== *
 * The spending receipt maths (v10, spec §6.7)                          *
 * =================================================================== */

/** Normalize one item to its monthly amount (spec §6.7), full precision
 *  inside: daily × 365/12, weekly × 52/12, monthly × 1, yearly × 1/12.
 *  So daily 3 → 91.25 exactly, weekly 10 → 43.33…, yearly 120 → 10
 *  exactly, monthly 50 → 50. Display rounds to the cent; this does not. */
export function normalizeToMonthly(amount: number, cadence: Cadence): number {
  if (!Number.isFinite(amount)) return 0;
  return amount * CADENCE_FACTORS[cadence];
}

/** The receipt's invested-instead projection (spec §6.7): the SAME
 *  engine at the page's current plan assumptions, on the leak money —
 *  base = the combined monthly total (never salary mode, so the salary
 *  never appears), starting amount 0, yearly increase 0, and the plan's
 *  own yearly cost, purchase fee, purchase frequency, rate mode, custom
 *  rates and inflation. One rule: "your plan's own assumptions, on your
 *  leak money." No engine behaviour changes — a thin pure wrapper. */
export function receiptProjection(
  plan: PlanInput,
  monthlyTotal: number,
  years: number,
  figures: AssetFigures,
): CompoundResult {
  return computeCompound(
    {
      ...plan,
      monthly: monthlyTotal,
      salary: null,
      share: 0,
      useShare: false,
      startingAmount: 0,
      yearlyIncrease: 0,
    },
    figures,
    Math.max(0, Math.round(years * 12)),
  );
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
 * Percent-of-salary conversions (spec §6.6, W7)                        *
 * =================================================================== */

/** The monthly salary behind a typed salary and its period
 *  (per year is divided by 12; per month passes through). */
export function monthlySalaryFrom(salary: number, period: SalaryPeriod): number {
  return period === "year" ? salary / 12 : salary;
}

/** The monthly amount invested: monthly salary × percent (full precision). */
export function monthlyAmountFrom(monthlySalary: number, share: number): number {
  return monthlySalary * share;
}

/** The reverse: what percent of the monthly salary an amount is. */
export function shareFromAmount(monthlyAmount: number, monthlySalary: number): number {
  return monthlyAmount / monthlySalary;
}

/** The years-of-salary line: today's-money final ÷ a year of salary. */
export function yearsOfSalary(finalToday: number, monthlySalary: number): number {
  return finalToday / (monthlySalary * 12);
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
