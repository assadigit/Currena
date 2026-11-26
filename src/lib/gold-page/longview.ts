/**
 * longview.ts — the long view's pure engine: the ~200-year annual gold
 * price series (1833 → the last complete year) embedded as data, plus the
 * purchasing-power machine and the 20-year table's own arithmetic.
 *
 * THE SERIES: annual averages of the London market price, USD per troy
 * ounce — the datahub "gold-prices" dataset (originally the NMA 1833-to-
 * present table; the pre-1934 rows are the gold-standard's own official
 * price, 1934–1971 the $35 era, post-1971 the free London market).
 * Validated against the LBMA's own published annual averages — every
 * post-1968 year agrees within 1% (spot-checks: 1971 +0.3%, 1980 −0.7%,
 * 2011 −0.1%, 2020 +0.0%). The RUNNING year is never embedded: it rides
 * the page's own live spot, so the desk's number and the long view's
 * number are one number, never two.
 *
 * Pure + fail-closed: every function is arithmetic over the embedded
 * table and the passed-in live spot; a missing spot simply removes the
 * running year from the pickers — never a guess, never a partial-year
 * average passed off as a price.
 */

import { GRAMS_PER_TROY_OUNCE } from "@/lib/gold-page/ifbought";

/** One year of the series: the year and its average price, USD per ounce. */
export interface GoldYear {
  y: number;
  p: number;
}

/** The embedded series, 1833 → the last complete year (annual averages). */
export const GOLD_ANNUAL: readonly GoldYear[] = [
  { y: 1833, p: 18.93 },
  { y: 1834, p: 18.93 },
  { y: 1835, p: 18.93 },
  { y: 1836, p: 18.93 },
  { y: 1837, p: 18.93 },
  { y: 1838, p: 18.93 },
  { y: 1839, p: 18.93 },
  { y: 1840, p: 18.93 },
  { y: 1841, p: 18.93 },
  { y: 1842, p: 18.93 },
  { y: 1843, p: 18.93 },
  { y: 1844, p: 18.93 },
  { y: 1845, p: 18.93 },
  { y: 1846, p: 18.93 },
  { y: 1847, p: 18.93 },
  { y: 1848, p: 18.93 },
  { y: 1849, p: 18.93 },
  { y: 1850, p: 18.93 },
  { y: 1851, p: 18.93 },
  { y: 1852, p: 18.93 },
  { y: 1853, p: 18.93 },
  { y: 1854, p: 18.93 },
  { y: 1855, p: 18.93 },
  { y: 1856, p: 18.93 },
  { y: 1857, p: 18.93 },
  { y: 1858, p: 18.93 },
  { y: 1859, p: 18.93 },
  { y: 1860, p: 18.93 },
  { y: 1861, p: 18.93 },
  { y: 1862, p: 18.93 },
  { y: 1863, p: 18.93 },
  { y: 1864, p: 18.93 },
  { y: 1865, p: 18.93 },
  { y: 1866, p: 18.93 },
  { y: 1867, p: 18.93 },
  { y: 1868, p: 18.93 },
  { y: 1869, p: 18.93 },
  { y: 1870, p: 18.93 },
  { y: 1871, p: 18.93 },
  { y: 1872, p: 18.94 },
  { y: 1873, p: 18.94 },
  { y: 1874, p: 18.94 },
  { y: 1875, p: 18.94 },
  { y: 1876, p: 18.94 },
  { y: 1877, p: 18.94 },
  { y: 1878, p: 18.94 },
  { y: 1879, p: 18.94 },
  { y: 1880, p: 18.94 },
  { y: 1881, p: 18.94 },
  { y: 1882, p: 18.94 },
  { y: 1883, p: 18.94 },
  { y: 1884, p: 18.94 },
  { y: 1885, p: 18.94 },
  { y: 1886, p: 18.94 },
  { y: 1887, p: 18.94 },
  { y: 1888, p: 18.94 },
  { y: 1889, p: 18.93 },
  { y: 1890, p: 18.94 },
  { y: 1891, p: 18.96 },
  { y: 1892, p: 18.96 },
  { y: 1893, p: 18.96 },
  { y: 1894, p: 18.94 },
  { y: 1895, p: 18.93 },
  { y: 1896, p: 18.98 },
  { y: 1897, p: 18.98 },
  { y: 1898, p: 18.98 },
  { y: 1899, p: 18.94 },
  { y: 1900, p: 18.96 },
  { y: 1901, p: 18.98 },
  { y: 1902, p: 18.97 },
  { y: 1903, p: 18.95 },
  { y: 1904, p: 18.96 },
  { y: 1905, p: 18.92 },
  { y: 1906, p: 18.90 },
  { y: 1907, p: 18.94 },
  { y: 1908, p: 18.95 },
  { y: 1909, p: 18.96 },
  { y: 1910, p: 18.92 },
  { y: 1911, p: 18.92 },
  { y: 1912, p: 18.93 },
  { y: 1913, p: 18.92 },
  { y: 1914, p: 18.99 },
  { y: 1915, p: 18.99 },
  { y: 1916, p: 18.99 },
  { y: 1917, p: 18.99 },
  { y: 1918, p: 18.99 },
  { y: 1919, p: 19.95 },
  { y: 1920, p: 20.68 },
  { y: 1921, p: 20.58 },
  { y: 1922, p: 20.66 },
  { y: 1923, p: 21.32 },
  { y: 1924, p: 20.69 },
  { y: 1925, p: 20.64 },
  { y: 1926, p: 20.63 },
  { y: 1927, p: 20.64 },
  { y: 1928, p: 20.66 },
  { y: 1929, p: 20.63 },
  { y: 1930, p: 20.65 },
  { y: 1931, p: 17.06 },
  { y: 1932, p: 20.69 },
  { y: 1933, p: 26.33 },
  { y: 1934, p: 34.69 },
  { y: 1935, p: 34.84 },
  { y: 1936, p: 34.87 },
  { y: 1937, p: 34.79 },
  { y: 1938, p: 34.85 },
  { y: 1939, p: 34.42 },
  { y: 1940, p: 33.85 },
  { y: 1941, p: 33.85 },
  { y: 1942, p: 33.85 },
  { y: 1943, p: 33.85 },
  { y: 1944, p: 33.85 },
  { y: 1945, p: 34.71 },
  { y: 1946, p: 34.71 },
  { y: 1947, p: 34.71 },
  { y: 1948, p: 34.71 },
  { y: 1949, p: 31.69 },
  { y: 1950, p: 34.72 },
  { y: 1951, p: 34.72 },
  { y: 1952, p: 34.60 },
  { y: 1953, p: 34.84 },
  { y: 1954, p: 35.04 },
  { y: 1955, p: 35.03 },
  { y: 1956, p: 34.99 },
  { y: 1957, p: 34.95 },
  { y: 1958, p: 35.10 },
  { y: 1959, p: 35.10 },
  { y: 1960, p: 35.18 },
  { y: 1961, p: 35.02 },
  { y: 1962, p: 35.04 },
  { y: 1963, p: 35.00 },
  { y: 1964, p: 35.00 },
  { y: 1965, p: 35.00 },
  { y: 1966, p: 35.00 },
  { y: 1967, p: 35.00 },
  { y: 1968, p: 38.92 },
  { y: 1969, p: 40.92 },
  { y: 1970, p: 35.83 },
  { y: 1971, p: 40.92 },
  { y: 1972, p: 58.17 },
  { y: 1973, p: 97.33 },
  { y: 1974, p: 159.25 },
  { y: 1975, p: 160.92 },
  { y: 1976, p: 124.83 },
  { y: 1977, p: 147.67 },
  { y: 1978, p: 193.17 },
  { y: 1979, p: 306.75 },
  { y: 1980, p: 607.83 },
  { y: 1981, p: 459.75 },
  { y: 1982, p: 375.75 },
  { y: 1983, p: 422.58 },
  { y: 1984, p: 360.50 },
  { y: 1985, p: 318.00 },
  { y: 1986, p: 367.75 },
  { y: 1987, p: 446.42 },
  { y: 1988, p: 437.08 },
  { y: 1989, p: 381.42 },
  { y: 1990, p: 383.50 },
  { y: 1991, p: 362.25 },
  { y: 1992, p: 343.67 },
  { y: 1993, p: 359.67 },
  { y: 1994, p: 383.92 },
  { y: 1995, p: 384.17 },
  { y: 1996, p: 387.58 },
  { y: 1997, p: 331.17 },
  { y: 1998, p: 294.08 },
  { y: 1999, p: 278.75 },
  { y: 2000, p: 279.04 },
  { y: 2001, p: 270.83 },
  { y: 2002, p: 310.00 },
  { y: 2003, p: 363.58 },
  { y: 2004, p: 409.17 },
  { y: 2005, p: 444.83 },
  { y: 2006, p: 604.42 },
  { y: 2007, p: 696.67 },
  { y: 2008, p: 871.75 },
  { y: 2009, p: 973.00 },
  { y: 2010, p: 1224.67 },
  { y: 2011, p: 1569.17 },
  { y: 2012, p: 1669.58 },
  { y: 2013, p: 1411.67 },
  { y: 2014, p: 1265.58 },
  { y: 2015, p: 1160.75 },
  { y: 2016, p: 1249.00 },
  { y: 2017, p: 1257.50 },
  { y: 2018, p: 1269.25 },
  { y: 2019, p: 1392.58 },
  { y: 2020, p: 1770.25 },
  { y: 2021, p: 1799.58 },
  { y: 2022, p: 1800.75 },
  { y: 2023, p: 1942.75 },
  { y: 2024, p: 2387.58 },
  { y: 2025, p: 3441.50 }
];

/** The last complete year the embedded series carries. */
export const LAST_COMPLETE_YEAR: number = GOLD_ANNUAL[GOLD_ANNUAL.length - 1]!.y;

/** The first year of the embedded series (1833, the London table's start). */
export const FIRST_YEAR: number = GOLD_ANNUAL[0]!.y;

/** The running year, read from the clock (UTC — the desk's own day). */
export function runningYear(): number {
  return new Date().getUTCFullYear();
}

/**
 * The year picker's own options: every complete year 1833 → the last,
 * plus the running year at its end when a live spot is in hand (the
 * running year is the "right now" read, marked as its own case).
 */
export function yearOptionsLong(liveSpot: number | null): number[] {
  const years: number[] = [];
  for (let y = FIRST_YEAR; y <= LAST_COMPLETE_YEAR; y++) years.push(y);
  if (liveSpot !== null && Number.isFinite(liveSpot) && liveSpot > 0) {
    const ry = runningYear();
    if (ry > LAST_COMPLETE_YEAR) years.push(ry);
  }
  return years;
}

/** One year's own price: the embedded average, or the live spot for the
 *  running year (the only year it is honest for). Null when the year is
 *  outside the series. */
export function yearPrice(year: number, liveSpot: number | null): number | null {
  if (
    liveSpot !== null &&
    Number.isFinite(liveSpot) &&
    liveSpot > 0 &&
    year === runningYear() &&
    year > LAST_COMPLETE_YEAR
  ) {
    return liveSpot;
  }
  const row = GOLD_ANNUAL.find((r) => r.y === year);
  return row === undefined ? null : row.p;
}

/** Whether the year is the running year (its price is the live spot). */
export function isRunningYear(year: number): boolean {
  return year === runningYear() && year > LAST_COMPLETE_YEAR;
}

/* ------------------------------------------------------------------ *
 * The purchasing-power machine — "with $x in year Y, how much gold
 * could you buy?" The year's own average price buys the weight; the
 * same money today buys at the live spot — the contrast IS the story.
 * ------------------------------------------------------------------ */

export interface PurchasingPowerResult {
  /** The picked year's own price basis, USD per ounce (named at use). */
  priceThen: number;
  /** The gold the money bought then — troy ounces and grams. */
  ozThen: number;
  gramsThen: number;
  /** What that gold is worth today at the live spot, USD. */
  worthToday: number;
  /** The same money at the live spot today — troy ounces and grams. */
  ozToday: number;
  gramsToday: number;
  /** How much MORE (positive) or LESS (negative) gold the same money
   *  buys today: (gramsToday ÷ gramsThen − 1) × 100. */
  gramsPct: number;
}

/** The machine itself: amount USD in year Y → the weight it bought then,
 *  its worth today, and the same money's buying power today. Pure; null
 *  when a leg is missing (never a guess). */
export function purchasingPower(
  amount: number,
  year: number,
  liveSpot: number | null,
): PurchasingPowerResult | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (liveSpot === null || !Number.isFinite(liveSpot) || liveSpot <= 0) return null;
  const priceThen = yearPrice(year, liveSpot);
  if (priceThen === null) return null;
  return finishPp(amount, priceThen, liveSpot);
}

/** The shared tail of every machine leg: the weights the money bought
 *  then and buys today, the worth line, and the contrast percent — all
 *  over per-ounce prices in the leg's own currency. */
function finishPp(
  amount: number,
  priceThen: number,
  priceToday: number,
): PurchasingPowerResult | null {
  if (!Number.isFinite(priceThen) || priceThen <= 0) return null;
  if (!Number.isFinite(priceToday) || priceToday <= 0) return null;
  const ozThen = amount / priceThen;
  const gramsThen = ozThen * GRAMS_PER_TROY_OUNCE;
  const ozToday = amount / priceToday;
  const gramsToday = ozToday * GRAMS_PER_TROY_OUNCE;
  return {
    priceThen,
    ozThen,
    gramsThen,
    worthToday: gramsThen * (priceToday / GRAMS_PER_TROY_OUNCE),
    ozToday,
    gramsToday,
    gramsPct: (gramsToday / gramsThen - 1) * 100,
  };
}

/* ------------------------------------------------------------------ *
 * The 20-year table — the modal's own rows: each year's average price
 * and its change over the year before, the running year at the live
 * spot, named as its own case.
 * ------------------------------------------------------------------ */

export interface GoldYearRow {
  year: number;
  /** The year's average price — the live spot for the running year. */
  price: number;
  /** The change over the previous year's average, percent (null for the
   *  first row and the running year's own honest basis: live vs the
   *  previous year's average — named, never mixed). */
  yoyPct: number | null;
  running: boolean;
}

/** The last 20 years of rows (complete years + the running year at the
 *  live spot when in hand), oldest first. */
export function lastYearsTable(liveSpot: number | null, count = 20): GoldYearRow[] {
  const rows: GoldYearRow[] = [];
  const startIdx = Math.max(0, GOLD_ANNUAL.length - (count - 1));
  for (let i = startIdx; i < GOLD_ANNUAL.length; i++) {
    const row = GOLD_ANNUAL[i]!;
    const prev = GOLD_ANNUAL[i - 1];
    rows.push({
      year: row.y,
      price: row.p,
      yoyPct: prev === undefined ? null : (row.p / prev.p - 1) * 100,
      running: false,
    });
  }
  if (liveSpot !== null && Number.isFinite(liveSpot) && liveSpot > 0) {
    const ry = runningYear();
    if (ry > LAST_COMPLETE_YEAR) {
      const prev = GOLD_ANNUAL[GOLD_ANNUAL.length - 1]!;
      rows.push({
        year: ry,
        price: liveSpot,
        yoyPct: (liveSpot / prev.p - 1) * 100,
        running: true,
      });
    }
  }
  return rows;
}

/** The chart's own points: the annual averages 1833 → the last complete
 *  year, the running year at the live spot appended when in hand. */
export function chartPoints(liveSpot: number | null): { y: number; p: number; live: boolean }[] {
  const pts = GOLD_ANNUAL.map((r) => ({ y: r.y, p: r.p, live: false }));
  if (liveSpot !== null && Number.isFinite(liveSpot) && liveSpot > 0) {
    const ry = runningYear();
    if (ry > LAST_COMPLETE_YEAR) {
      const last = pts[pts.length - 1]!;
      if (last.y === ry) {
        // the embedded table never carries the running year, but honesty
        // costs nothing: if it ever did, the live spot replaces it
        pts[pts.length - 1] = { y: ry, p: liveSpot, live: true };
      } else {
        pts.push({ y: ry, p: liveSpot, live: true });
      }
    }
  }
  return pts;
}

/* ------------------------------------------------------------------ *
 * The multi-currency extension (the owner's ask): the machine now
 * answers in the toman, the euro, the pound, the Canadian and the
 * Australian dollars too — the toman on Tehran's own 18k gram (the
 * very same leg the race section rides), the four crosses on the
 * London annual average × the desk's own month-end FX table (units of
 * the currency per 1 USD). Pure + fail-closed: a missing leg is a
 * null, never a guess, and every basis is named at point of use.
 * ------------------------------------------------------------------ */

/** The months of a COMPLETE year in an FX month table — a year that
 *  carries all twelve month-ends (the table's own first month is
 *  2016-10, so 2016 itself never qualifies). */
export function fxCompleteYearMonths(table: Record<string, number>, year: number): string[] {
  const prefix = `${year}-`;
  const months = Object.keys(table)
    .filter((k) => k.startsWith(prefix))
    .sort();
  return months.length === 12 ? months : [];
}

/** A complete year's average of the FX month-end closes (units of the
 *  currency per 1 USD); null unless the year carries twelve closes. */
export function fxYearAverage(table: Record<string, number> | undefined, year: number): number | null {
  if (table === undefined) return null;
  const months = fxCompleteYearMonths(table, year)
    .map((k) => table[k])
    .filter((v): v is number => Number.isFinite(v) && v > 0);
  if (months.length !== 12) return null;
  return months.reduce((a, b) => a + b, 0) / 12;
}

/** The table's latest month-end close — the running month's own latest
 *  row (units of the currency per 1 USD). */
export function fxLatest(table: Record<string, number> | undefined): number | null {
  if (table === undefined) return null;
  const keys = Object.keys(table).sort();
  const last = keys.length > 0 ? table[keys[keys.length - 1]!] : undefined;
  return last !== undefined && Number.isFinite(last) && last > 0 ? last : null;
}

/** The FX-crossed machine's own year options: every complete year the
 *  table covers inside the London annual's own coverage, plus the
 *  running year at the live cross when both legs are in hand. */
export function yearOptionsCcy(table: Record<string, number> | undefined, liveSpot: number | null): number[] {
  if (table === undefined) return [];
  const years: number[] = [];
  for (let y = FIRST_YEAR; y <= LAST_COMPLETE_YEAR; y++) {
    if (!GOLD_ANNUAL.some((r) => r.y === y)) continue;
    if (fxCompleteYearMonths(table, y).length === 12) years.push(y);
  }
  if (liveSpot !== null && Number.isFinite(liveSpot) && liveSpot > 0 && fxLatest(table) !== null) {
    const ry = runningYear();
    if (ry > LAST_COMPLETE_YEAR) years.push(ry);
  }
  return years;
}

/** The machine for the four crosses (EUR · GBP · CAD · AUD): the ounce
 *  price of year Y = the London annual average × that year's average FX;
 *  today's price = the live spot × the table's latest close. The
 *  running year reads the live cross on both sides, its own case. */
export function purchasingPowerCcy(
  amount: number,
  year: number,
  liveSpot: number | null,
  table: Record<string, number> | undefined,
): PurchasingPowerResult | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (liveSpot === null || !Number.isFinite(liveSpot) || liveSpot <= 0) return null;
  const latest = fxLatest(table);
  if (latest === null) return null;
  const priceToday = liveSpot * latest;
  if (year === runningYear() && year > LAST_COMPLETE_YEAR) {
    return finishPp(amount, priceToday, priceToday);
  }
  const usdRow = GOLD_ANNUAL.find((r) => r.y === year);
  if (usdRow === undefined) return null;
  const avg = fxYearAverage(table, year);
  if (avg === null) return null;
  return finishPp(amount, usdRow.p * avg, priceToday);
}

/** The toman leg's own inputs — the race payload's gold18 rows (the
 *  ۱۸-عیار gram, toman, with each row's own basis) + the running leg. */
export interface TomanMachineLegs {
  gold18: ReadonlyArray<{ jy: number; toman: number; basis: "parity" | "tgju" }>;
  running: { jy: number; gold18Toman: number | null } | null;
}

/** The toman machine's own answer — everything in grams of 18k Tehran
 *  gold (the ounce is not this market's own unit). */
export interface PurchasingPowerTomanResult {
  /** The picked year's own gram price, toman per gram. */
  priceThenTomanPerGram: number;
  /** The picked year's own basis: the pre-۱۳۹۲ parity estimate, the
 *  Tehran market price from ۱۳۹۲ on, or the live read. */
  basisThen: "parity" | "market" | "live";
  gramsThen: number;
  /** What that gold is worth today at the live Tehran gram price. */
  worthTodayToman: number;
  gramsToday: number;
  gramsPct: number;
}

/** The toman machine: amount toman in Jalali year JY → the 18k grams it
 *  bought then, their worth today, and the same money today. Pure;
 *  null when a leg is missing (never a guess). */
export function purchasingPowerToman(
  amount: number,
  jy: number,
  legs: TomanMachineLegs,
): PurchasingPowerTomanResult | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const liveToday = legs.running !== null ? legs.running.gold18Toman : null;
  if (liveToday === null || !Number.isFinite(liveToday) || liveToday <= 0) return null;
  let priceThen: number;
  let basisThen: "parity" | "market" | "live";
  if (legs.running !== null && jy === legs.running.jy) {
    priceThen = liveToday;
    basisThen = "live";
  } else {
    const row = legs.gold18.find((r) => r.jy === jy);
    if (row === undefined) return null;
    priceThen = row.toman;
    basisThen = row.basis === "parity" ? "parity" : "market";
  }
  if (!Number.isFinite(priceThen) || priceThen <= 0) return null;
  const gramsThen = amount / priceThen;
  const gramsToday = amount / liveToday;
  return {
    priceThenTomanPerGram: priceThen,
    basisThen,
    gramsThen,
    worthTodayToman: gramsThen * liveToday,
    gramsToday,
    gramsPct: (gramsToday / gramsThen - 1) * 100,
  };
}

/** The toman machine's own year options: every complete Jalali year the
 *  gold18 leg carries, plus the running year when the live leg is in. */
export function yearOptionsToman(legs: TomanMachineLegs): number[] {
  const years = legs.gold18.map((r) => r.jy);
  const liveToday = legs.running !== null ? legs.running.gold18Toman : null;
  if (
    legs.running !== null &&
    liveToday !== null &&
    Number.isFinite(liveToday) &&
    liveToday > 0 &&
    !years.includes(legs.running.jy)
  ) {
    years.push(legs.running.jy);
  }
  return years;
}

/** The compound annual growth rate between two prices over `years`
 *  years, in percent; null when the inputs cannot speak. */
export function cagrPercent(first: number, last: number, years: number): number | null {
  if (!Number.isFinite(first) || first <= 0) return null;
  if (!Number.isFinite(last) || last <= 0) return null;
  if (!Number.isFinite(years) || years <= 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}
