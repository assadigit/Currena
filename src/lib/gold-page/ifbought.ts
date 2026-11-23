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
