/**
 * ifbought.ts — the "if you'd bought" calculator's pure compute, ported
 * verbatim from the previous gold page's engine (upstream
 * packages/insights/src/domains/gold/if-bought.ts, GPE R33 / F26).
 *
 * THE FRAMING (the R33 row's own words): gold vs S&P vs BTC vs silver,
 * LUMP + DCA since year Y, EVERY WINDOW NAMED AT POINT OF USE, and the
 * DECILE framing where the history supports it. Past returns are no
 * guarantee of future results; nothing here is advice.
 *
 * THE DATA PLANE: the month-end closes since 2016-11 served by the
 * desk's own route (GET /api/gold/ifbought — the still-live currena-api
 * leg fetched server-side, memory-cached, fail-closed 503). The page
 * computes lump + monthly DCA + the decile framing CLIENT-SIDE through
 * this pure engine — never a second arithmetic.
 *
 * The DCA convention (the SA precedent): $100 at each month-end close,
 * the running month included, the value marked at the running month's
 * close. The decile rides the R19 posture: a window's decile lights
 * only when at least 30 same-length windows exist over the asset's own
 * series — the basis named, the honest waiting line below it.
 */

/** One month-end close. */
export interface IfBoughtMonth {
  ym: string; // YYYY-MM
  close: number;
}

/** One asset's month-end series + the current running point. */
export interface IfBoughtAssetSeries {
  monthly: IfBoughtMonth[];
  current: { ym: string; close: number; updatedAt?: string };
}

/** The whole snapshot the /api/gold/ifbought route serves. */
export interface IfBoughtSnapshot {
  v: number;
  asOf: string;
  fetchedAt?: string;
  backfill?: { from: string; to: string; months?: number };
  assets: {
    gold: IfBoughtAssetSeries;
    sp500: IfBoughtAssetSeries;
    btc: IfBoughtAssetSeries;
    silver: IfBoughtAssetSeries;
  };
}

/** The DCA monthly amount (the SA precedent's own convention, $100). */
export const IF_BOUGHT_DCA_MONTHLY = 100;

/** The decile base rule (the R19 posture): a window's decile lights only
 *  when at least this many same-length windows exist. */
export const IF_BOUGHT_DECILE_MIN_BASE = 30;

/** The first month at or after `${year}-01`. */
function monthAtOrAfter(months: readonly string[], year: number): string | null {
  for (const ym of months) {
    if (Number(ym.slice(0, 4)) >= year) return ym;
  }
  return null;
}

/** The window's monthly closes (the anchors + the running point), or
 *  null when the series has nothing at/after the year. */
export function windowCloses(
  asset: IfBoughtAssetSeries,
  sinceYear: number,
): { ym: string; close: number }[] | null {
  const all: readonly IfBoughtMonth[] = [
    ...asset.monthly,
    { ym: asset.current.ym, close: asset.current.close },
  ];
  const first = monthAtOrAfter(all.map((m) => m.ym), sinceYear);
  if (first === null) return null;
  return all.filter((m) => m.ym >= first);
}

/** One asset's result for a "since year Y" window. */
export interface IfBoughtResult {
  /** The window's own months, named at point of use. */
  fromYm: string;
  toYm: string;
  /** How many monthly closes the window spans (the DCA's own count). */
  months: number;
  /** The lump multiple's percent — (current ÷ base − 1) × 100. */
  lumpPct: number;
  /** The DCA result: $100 per month at each month-end close. */
  dcaInvested: number;
  dcaValue: number;
  /** (value ÷ invested − 1) × 100. */
  dcaPct: number;
  /** The decile of this window's lump return among ALL same-length
   *  windows over the series (null under the min base — the honest
   *  waiting line) + the named basis. */
  decile: number | null;
  decileBase: number;
}

/**
 * The "if you'd bought" compute for one asset since a year — pure over
 * the series, ported verbatim from the upstream engine. The base is the
 * first available month-end at/after January of the year (the series
 * starts 2016-11: "since 2016" honestly reads since November 2016 — the
 * window's own months render at point of use). The DCA buys
 * IF_BOUGHT_DCA_MONTHLY at EVERY monthly close in the window INCLUDING
 * the running month; the value marks at the running month's close.
 */
export function ifBoughtResult(
  asset: IfBoughtAssetSeries,
  sinceYear: number,
): IfBoughtResult | null {
  const closes = windowCloses(asset, sinceYear);
  if (closes === null || closes.length === 0) return null;
  const base = closes[0]!;
  const last = closes[closes.length - 1]!;
  const lumpPct = (last.close / base.close - 1) * 100;
  let units = 0;
  for (const m of closes) units += IF_BOUGHT_DCA_MONTHLY / m.close;
  const dcaInvested = IF_BOUGHT_DCA_MONTHLY * closes.length;
  const dcaValue = units * last.close;
  const dcaPct = (dcaValue / dcaInvested - 1) * 100;

  // The decile: this window's lump return among ALL same-length windows
  // over the whole series (anchors + running point, sliding by month).
  const all: readonly IfBoughtMonth[] = [
    ...asset.monthly,
    { ym: asset.current.ym, close: asset.current.close },
  ];
  const windowLength = closes.length;
  const windows: number[] = [];
  for (let i = 0; i + windowLength - 1 < all.length; i++) {
    const from = all[i]!.close;
    const to = all[i + windowLength - 1]!.close;
    if (from > 0) windows.push((to / from - 1) * 100);
  }
  // The CURRENT window is the LAST of them (its end is the running
  // month); the decile counts how many of the others sit at or below it.
  const mine = windows[windows.length - 1] ?? lumpPct;
  const base_n = windows.length;
  let decile: number | null = null;
  if (base_n >= IF_BOUGHT_DECILE_MIN_BASE) {
    const atOrBelow = windows.filter((w) => w <= mine + 1e-12).length;
    decile = Math.min(10, Math.max(1, Math.ceil((atOrBelow / base_n) * 10)));
  }
  return {
    fromYm: base.ym,
    toYm: last.ym,
    months: closes.length,
    lumpPct,
    dcaInvested,
    dcaValue,
    dcaPct,
    decile,
    decileBase: base_n,
  };
}

/** The year picker's own options off the gold series' coverage. */
export function yearOptions(snapshot: IfBoughtSnapshot): number[] {
  const first = snapshot.assets.gold.monthly[0]?.ym;
  const last = snapshot.assets.gold.current.ym;
  if (first === undefined || last === undefined) return [];
  const firstYear = Number(first.slice(0, 4));
  const lastYear = Number(last.slice(0, 4));
  const years: number[] = [];
  for (let y = firstYear; y <= lastYear; y++) years.push(y);
  return years;
}

/* ------------------------------------------------------------------ *
 * The wealth calculator's unit layer — the owner's own ask: the
 * amount in ANY of the converter's currencies (the toman included,
 * on this site's own TGJU free-market basis) or in grams of gold.
 * Grams are metal: the weight accumulates; currencies are cash: the
 * weight is bought at each month's own close in that unit.
 * ------------------------------------------------------------------ */

/** Troy ounces → grams. */
export const GRAMS_PER_TROY_OUNCE = 31.1034768;

/** One calculator unit — a currency (month-end FX per USD) or grams of gold. */
export interface CalcUnit {
  id: string;
  kind: "ccy" | "gram";
  /** [EN, FA] — the unit's own name. */
  name: [string, string];
  /** [EN prefix/suffix symbol, FA word] — money in this unit. */
  symbol: [string, string];
  /** Decimals for money display (JPY-style units carry none). */
  decimals: number;
}

/** The units the calculator offers — the converter's own currency set,
 *  the toman on the site's own basis, plus grams of gold. */
export const CALC_UNITS: readonly CalcUnit[] = [
  { id: "usd", kind: "ccy", name: ["US dollar", "دلار آمریکا"], symbol: ["$", "دلار"], decimals: 0 },
  { id: "aud", kind: "ccy", name: ["Australian dollar", "دلار استرالیا"], symbol: ["A$", "دلار استرالیا"], decimals: 0 },
  { id: "nzd", kind: "ccy", name: ["New Zealand dollar", "دلار نیوزیلند"], symbol: ["NZ$", "دلار نیوزیلند"], decimals: 0 },
  { id: "eur", kind: "ccy", name: ["Euro", "یورو"], symbol: ["€", "یورو"], decimals: 0 },
  { id: "gbp", kind: "ccy", name: ["British pound", "پوند انگلستان"], symbol: ["£", "پوند"], decimals: 0 },
  { id: "cad", kind: "ccy", name: ["Canadian dollar", "دلار کانادا"], symbol: ["C$", "دلار کانادا"], decimals: 0 },
  { id: "chf", kind: "ccy", name: ["Swiss franc", "فرانک سوئیس"], symbol: ["CHF ", "فرانک سوئیس"], decimals: 0 },
  { id: "jpy", kind: "ccy", name: ["Japanese yen", "ین ژاپن"], symbol: ["¥", "ین"], decimals: 0 },
  { id: "cny", kind: "ccy", name: ["Chinese yuan", "یوان چین"], symbol: ["CNY ", "یوان چین"], decimals: 0 },
  { id: "aed", kind: "ccy", name: ["UAE dirham", "درهم امارات"], symbol: ["AED ", "درهم امارات"], decimals: 0 },
  { id: "try", kind: "ccy", name: ["Turkish lira", "لیر ترکیه"], symbol: ["TRY ", "لیر ترکیه"], decimals: 0 },
  { id: "toman", kind: "ccy", name: ["Iranian toman", "تومان (دلار آزاد تهران)"], symbol: ["", "تومان"], decimals: 0 },
  { id: "gram", kind: "gram", name: ["grams of gold", "گرم طلا"], symbol: ["g", "گرم"], decimals: 1 },
];

/** The /api/gold/fx route's own payload — month-end closes per unit of
 *  currency per 1 USD (the toman: TGJU's free-market dollar, in toman). */
export interface FxPayload {
  v: number;
  fetchedAt: string;
  perUsd: Record<string, Record<string, number>>;
}

/** The asset's full month-end series (anchors + the running point). */
function allMonths(asset: IfBoughtAssetSeries): IfBoughtMonth[] {
  return [...asset.monthly, { ym: asset.current.ym, close: asset.current.close }];
}

/** The asset's month-end closes priced in the picked unit — USD as-is,
 *  grams at the per-gram price, any other currency at that month's own
 *  FX close (months without their FX close drop out, honestly). Returns
 *  null when the unit's FX table is not available at all. */
export function unitSeries(
  asset: IfBoughtAssetSeries,
  unitId: string,
  fx: FxPayload | null,
): { ym: string; close: number }[] | null {
  const all = allMonths(asset);
  if (unitId === "usd") return all.map((m) => ({ ym: m.ym, close: m.close }));
  if (unitId === "gram") return all.map((m) => ({ ym: m.ym, close: m.close / GRAMS_PER_TROY_OUNCE }));
  const table = fx?.perUsd?.[unitId];
  if (table === undefined) return null;
  const merged = all.flatMap((m) => {
    const rate = table[m.ym];
    return Number.isFinite(rate) && rate > 0 ? [{ ym: m.ym, close: m.close * rate }] : [];
  });
  return merged.length > 0 ? merged : null;
}

/** The two-mode answer over one unit-priced month-end series: one
 *  purchase, or the same amount every month since. For currency units
 *  the amounts are cash (the weight is bought each month); for grams
 *  the amounts are metal (the weight itself accumulates, its cost
 *  summed at each month's own gram price). */
export function calcAnswer(
  series: { ym: string; close: number }[] | null,
  sinceYear: number,
  amount: number,
  kind: "ccy" | "gram",
  mode: "one" | "dca",
): {
  months: number;
  fromYm: string;
  /** Cash outlaid — in the unit (currency modes) or USD (gram modes). */
  invested: number;
  /** Worth today — in the unit (currency modes) or USD (gram modes). */
  worth: number;
  /** (worth ÷ invested − 1) × 100. */
  pct: number;
  /** Gram modes only: the metal weight accumulated. */
  grams: number | null;
} | null {
  if (series === null || series.length === 0 || !Number.isFinite(amount) || amount <= 0) return null;
  const closes = series.filter((m) => Number(m.ym.slice(0, 4)) >= sinceYear);
  if (closes.length === 0) return null;
  const base = closes[0]!.close;
  const last = closes[closes.length - 1]!.close;
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(last) || last <= 0) return null;
  const months = closes.length;
  const fromYm = closes[0]!.ym;
  if (kind === "gram") {
    if (mode === "one") {
      const invested = amount * base;
      const worth = amount * last;
      return { months, fromYm, invested, worth, pct: (worth / invested - 1) * 100, grams: amount };
    }
    let cost = 0;
    for (const m of closes) cost += amount * m.close;
    const grams = amount * months;
    const worth = grams * last;
    return { months, fromYm, invested: cost, worth, pct: (worth / cost - 1) * 100, grams };
  }
  if (mode === "one") {
    const worth = amount * (last / base);
    return { months, fromYm, invested: amount, worth, pct: (worth / amount - 1) * 100, grams: null };
  }
  let units = 0;
  for (const m of closes) units += amount / m.close;
  const invested = amount * months;
  const worth = units * last;
  return { months, fromYm, invested, worth, pct: (worth / invested - 1) * 100, grams: null };
}
