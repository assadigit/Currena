/**
 * dollar-trend.ts — «روند نرخ طلا در برابر دلار»: the ۱۳۵۷-to-today
 * race between holding gold and holding dollars in Iran, both marked
 * in toman — the data plane (the cited static free-dollar table, the
 * TGJU evergreen legs, the parity derivation) and the pure engine
 * (the race, the year-by-year winners, the decoupling detector, the
 * sync score, the premium arc) over the served payload.
 *
 * THE READER'S SEAT: Tehran, ۱۳۵۷. One gram of gold or one US dollar
 * held as cash. Every year since, both are re-marked in toman at the
 * free market's own terms: the dollar leg = the free-market dollar
 * rate itself; the gold leg = the gold gram's toman price (parity =
 * global gold × free dollar for the historical era, TGJU's geram18
 * market price from ۱۳۹۲ on). This makes the owner's mechanism
 * visible by construction: Iranian gold's toman return ≈ the rial's
 * fall × the world's gold move × the domestic premium — when the
 * first factor dominates, gold rises in Iran even as it falls
 * globally.
 *
 * THE THREE-BASIS HONESTY (each labelled at point of use):
 *   ۱۳۵۷ → ۱۳۸۹    dollar = the cited static table; gold = parity
 *                  (GOLD_ANNUAL × the same dollar) — «تاریخی/برابری»
 *   ۱۳۹۰ → ۱۳۹۱    dollar = TGJU price_dollar_rl actuals; gold =
 *                  parity on the TGJU dollar leg — mixed, named
 *   ۱۳۹۲ → today    gold = TGJU geram18 actual market price —
 *                  «بازار تهران»
 *   the running year = TGJU's latest rows — «زنده»
 * Where both exist (the ۱۳۹۰ overlap) the live source wins over the
 * static table — the house's live-over-backfill rule.
 *
 * Pure + fail-closed: the engine is arithmetic over the passed
 * payload only (the route serves data, never results — the if-bought
 * pattern); a missing leg is a null, never a guess, and every window
 * and basis is named at point of use. Display-only, never advice.
 */

import { GOLD_ANNUAL } from "@/lib/gold-page/longview";
import { GRAMS_PER_TROY_OUNCE } from "@/lib/gold-page/ifbought";

/* ------------------------------------------------------------------ *
 * The data plane — the static table + the payload types
 * ------------------------------------------------------------------ */

/**
 * Series B1 — the free-market dollar, toman per USD, ۱۳۵۷ → ۱۳۹۰: one
 * figure per Jalali year (the source table's own year-level
 * convention), extracted from the Persian Wikipedia table
 * «نوسان نرخ ارزهای خارجی در ایران»
 * (https://fa.wikipedia.org/wiki/نوسان_نرخ_ارزهای_خارجی_در_ایران,
 * accessed 2026-11-25 — the page carries its own footnotes).
 *
 * Cross-checked this build against the second source the table itself
 * cites — jamaran's «نرخ غیررسمی دلار از سال ۵۷ تاکنون»
 * (jamaran.news, بخش اقتصاد, 1455315): all ۳۴ rows agree exactly
 * (۱۳۵۷=۱۰ … ۱۳۸۹=۱٬۱۰۰); the single ۱۳۹۰ figure differs across
 * sources (Wikipedia ۱٬۹۸۰ / jamaran ۱٬۸۰۰ — a sanctions-shock year,
 * ±۱۰٪) and is superseded by TGJU's own daily rows anyway (the
 * live-over-backfill rule) — named in the method line, never smoothed.
 */
export const DOLLAR_FREE_TABLE: ReadonlyArray<{ jy: number; toman: number }> = [
  { jy: 1357, toman: 10 },
  { jy: 1358, toman: 14 },
  { jy: 1359, toman: 20 },
  { jy: 1360, toman: 27 },
  { jy: 1361, toman: 35 },
  { jy: 1362, toman: 45 },
  { jy: 1363, toman: 58 },
  { jy: 1364, toman: 61 },
  { jy: 1365, toman: 74 },
  { jy: 1366, toman: 99 },
  { jy: 1367, toman: 96 },
  { jy: 1368, toman: 120 },
  { jy: 1369, toman: 141 },
  { jy: 1370, toman: 142 },
  { jy: 1371, toman: 149 },
  { jy: 1372, toman: 180 },
  { jy: 1373, toman: 263 },
  { jy: 1374, toman: 403 },
  { jy: 1375, toman: 444 },
  { jy: 1376, toman: 478 },
  { jy: 1377, toman: 646 },
  { jy: 1378, toman: 863 },
  { jy: 1379, toman: 813 },
  { jy: 1380, toman: 792 },
  { jy: 1381, toman: 799 },
  { jy: 1382, toman: 832 },
  { jy: 1383, toman: 874 },
  { jy: 1384, toman: 904 },
  { jy: 1385, toman: 922 },
  { jy: 1386, toman: 935 },
  { jy: 1387, toman: 966 },
  { jy: 1388, toman: 1000 },
  { jy: 1389, toman: 1100 },
  // ۱۳۹۰ is carried for the record (the table's own last row) but is
  // superseded by TGJU's actual year-end row wherever the live leg
  // arrives — the live-over-backfill rule.
  { jy: 1390, toman: 1980 },
];

/** The first Jalali year of the race — the revolution year, ۱۳۵۷. */
export const RACE_START_JY = 1357;

/** The gold instrument's purity: 18 عیار = 18/24 = 0.75 pure content. */
export const GOLD_18K_PURITY = 0.75;

/**
 * The Jalali ↔ Gregorian year mapping this section uses for the
 * GOLD_ANNUAL lookups: a Jalali year is mapped to the Gregorian year
 * it starts in (JY + 621 — ۹ months of overlap; ۱۳۵۷ → 1978), so the
 * annual-average slice reads 1978 → the last complete year and the
 * running Jalali year rides the live spot — the desk's own number,
 * never two. (The last complete Jalali year always maps to a complete
 * Gregorian year: a Jalali year ends in March of JY+622, after the
 * JY+621 average has closed — the evergreen law, no new-year
 * maintenance.)
 */
export function goldAnnualYear(jy: number): number {
  return jy + 621;
}

/**
 * The parity derivation — the same equation the Iran bridge teaches
 * as ارزش ذاتی, so the section and the bridge agree by construction.
 * Never presented as a market price; labelled «برآورد برابری» at
 * point of use.
 *
 *   gold18Parity = GOLD_ANNUAL(gy) × dollarToman ÷ 31.1034768 × 0.75
 */
export function gold18ParityToman(usdOz: number, dollarToman: number): number | null {
  if (!Number.isFinite(usdOz) || usdOz <= 0) return null;
  if (!Number.isFinite(dollarToman) || dollarToman <= 0) return null;
  return (usdOz * dollarToman * GOLD_18K_PURITY) / GRAMS_PER_TROY_OUNCE;
}

/** The GOLD_ANNUAL average for a Jalali year's own Gregorian year, or
 *  null when the embed carries no such row (never a guess). */
export function goldAnnualForJy(jy: number): number | null {
  const gy = goldAnnualYear(jy);
  const row = GOLD_ANNUAL.find((r) => r.y === gy);
  return row === undefined ? null : row.p;
}

/* ------------------------------------------------------------------ *
 * The wire contract — GET /api/gold/dollar-trend (see the route)
 * ------------------------------------------------------------------ */

/** One year's dollar leg: the year-end free-market rate, toman. */
export interface DollarTrendDollar {
  jy: number;
  toman: number;
  basis: "static" | "tgju";
}

/** One year's gold leg: the 18-عیار gram, toman. */
export interface DollarTrendGold {
  jy: number;
  toman: number;
  basis: "parity" | "tgju";
}

/** One year's global context point: the annual average, USD per ounce. */
export interface DollarTrendGoldUsd {
  jy: number;
  usdOz: number;
}

/** The payload the route serves (fail-closed per leg: an absent leg
 *  is a null or an absent tail, never a zero). */
export interface DollarTrendPayload {
  v: 1;
  /** TGJU's newest row date ("YYYY-MM-DD"); null when no TGJU leg
   *  arrived — the static layer still serves. */
  asOf: string | null;
  /** Year-end values per complete Jalali year, oldest first — the
   *  static layer merged with TGJU (TGJU wins where both exist). */
  dollar: DollarTrendDollar[];
  gold18: DollarTrendGold[];
  /** The global context line: GOLD_ANNUAL slice (JY → the Gregorian
   *  year the Jalali year starts in) for every complete year the
   *  embed carries. */
  goldUsd: DollarTrendGoldUsd[];
  /** The running year: TGJU's latest rows + the desk's live spot. */
  running: {
    jy: number;
    dollarToman: number | null;
    gold18Toman: number | null;
    goldUsdOz: number | null;
    live: true;
  };
}

/* ------------------------------------------------------------------ *
 * The engine — pure arithmetic over the payload (client-side)
 * ------------------------------------------------------------------ */

/** One merged year row: both toman legs, the global context, the
 *  year's own returns and its winner. */
export interface TrendYearRow {
  jy: number;
  /** The 18-عیار gram's toman price (year-end; the running year's own
   *  live row). Null when the leg is absent. */
  gold18Toman: number | null;
  gold18Basis: "parity" | "tgju" | null;
  /** The free-market dollar, toman per USD. Null when absent. */
  dollarToman: number | null;
  dollarBasis: "static" | "tgju" | null;
  /** The global annual average, USD per ounce. Null when absent. */
  goldUsdOz: number | null;
  /** The year's own gold-toman return over the year before, percent. */
  goldRet: number | null;
  /** The dollar's own return over the year before, percent. */
  dollarRet: number | null;
  /** The global gold (USD) return over the year before, percent. */
  goldUsdRet: number | null;
  /** The year's winner (the larger toman return); null on a tie or a
   *  missing leg. */
  winner: "gold" | "dollar" | null;
  /** The running year (its returns are partial-year, named «زنده»). */
  running: boolean;
}

/** The merged year rows, oldest first, the running year appended last
 *  (marked). Pure over the payload; absent legs stay null. */
export function trendYearRows(p: DollarTrendPayload): TrendYearRow[] {
  const rows: TrendYearRow[] = [];
  const byJy = new Map<number, TrendYearRow>();
  const ensure = (jy: number, running = false): TrendYearRow => {
    let row = byJy.get(jy);
    if (row === undefined) {
      row = {
        jy,
        gold18Toman: null,
        gold18Basis: null,
        dollarToman: null,
        dollarBasis: null,
        goldUsdOz: null,
        goldRet: null,
        dollarRet: null,
        goldUsdRet: null,
        winner: null,
        running,
      };
      byJy.set(jy, row);
      rows.push(row);
    }
    return row;
  };
  for (const d of p.dollar) {
    const row = ensure(d.jy);
    row.dollarToman = d.toman;
    row.dollarBasis = d.basis;
  }
  for (const g of p.gold18) {
    const row = ensure(g.jy);
    row.gold18Toman = g.toman;
    row.gold18Basis = g.basis;
  }
  for (const u of p.goldUsd) {
    const row = ensure(u.jy);
    row.goldUsdOz = u.usdOz;
  }
  // the running year — TGJU's latest rows (both legs TGJU-basis, live)
  if (p.running.dollarToman !== null || p.running.gold18Toman !== null || p.running.goldUsdOz !== null) {
    const row = ensure(p.running.jy, true);
    if (p.running.dollarToman !== null) {
      row.dollarToman = p.running.dollarToman;
      row.dollarBasis = "tgju";
    }
    if (p.running.gold18Toman !== null) {
      row.gold18Toman = p.running.gold18Toman;
      row.gold18Basis = "tgju";
    }
    if (p.running.goldUsdOz !== null) {
      row.goldUsdOz = p.running.goldUsdOz;
    }
  }
  rows.sort((a, b) => a.jy - b.jy);
  // the returns + the winner, over the sorted rows
  let prev: TrendYearRow | null = null;
  for (const row of rows) {
    if (prev !== null) {
      if (row.gold18Toman !== null && prev.gold18Toman !== null && prev.gold18Toman > 0) {
        row.goldRet = (row.gold18Toman / prev.gold18Toman - 1) * 100;
      }
      if (row.dollarToman !== null && prev.dollarToman !== null && prev.dollarToman > 0) {
        row.dollarRet = (row.dollarToman / prev.dollarToman - 1) * 100;
      }
      if (row.goldUsdOz !== null && prev.goldUsdOz !== null && prev.goldUsdOz > 0) {
        row.goldUsdRet = (row.goldUsdOz / prev.goldUsdOz - 1) * 100;
      }
      if (row.goldRet !== null && row.dollarRet !== null) {
        row.winner = row.goldRet > row.dollarRet ? "gold" : row.dollarRet > row.goldRet ? "dollar" : null;
      }
    }
    prev = row;
  }
  return rows;
}

/* ------------------------------------------------------------------ *
 * 4.1 — The race: gold multiple vs dollar multiple since a start year
 * ------------------------------------------------------------------ */

/** The race's answer: both multiples (now ÷ start, toman) and the
 *  gold-over-dollar ratio. Null when a leg is missing. */
export interface RaceResult {
  startJy: number;
  /** The multiple the race ends on (the running year when live). */
  endJy: number;
  /** now ÷ start, the gold gram's toman multiple. */
  goldX: number;
  /** now ÷ start, the dollar's toman multiple. */
  dollarX: number;
  /** goldX ÷ dollarX (> 1: gold won). */
  ratio: number;
  winner: "gold" | "dollar";
}

/** The race from a start year (default ۱۳۵۷): the now values are the
 *  running year's live rows when they arrived, else the last complete
 *  year's — the honest live tail, never frozen-at-zero. */
export function race(p: DollarTrendPayload, startJy = RACE_START_JY): RaceResult | null {
  const rows = trendYearRows(p);
  const start = rows.find((r) => r.jy === startJy);
  if (start === undefined) return null;
  if (start.gold18Toman === null || start.dollarToman === null) return null;
  // the now: the last row whose BOTH legs exist (the running row when
  // live, else the last complete year)
  let end: TrendYearRow | null = null;
  for (const r of rows) {
    if (r.gold18Toman !== null && r.dollarToman !== null) end = r;
  }
  if (end === null || end.jy <= startJy) return null;
  const goldX = end.gold18Toman! / start.gold18Toman;
  const dollarX = end.dollarToman! / start.dollarToman;
  if (!Number.isFinite(goldX) || !Number.isFinite(dollarX) || goldX <= 0 || dollarX <= 0) return null;
  return {
    startJy,
    endJy: end.jy,
    goldX,
    dollarX,
    ratio: goldX / dollarX,
    winner: goldX >= dollarX ? "gold" : "dollar",
  };
}

/* ------------------------------------------------------------------ *
 * 4.2 — The year-by-year winners (trendYearRows above carries them)
 * ------------------------------------------------------------------ */

/** The summary line's own counts over COMPLETE years only (the
 *  running year's partial returns never enter a count — named in the
 *  method line). */
export function winCounts(p: DollarTrendPayload): { goldYears: number; dollarYears: number; tieYears: number; decidedYears: number } {
  const rows = trendYearRows(p).filter((r) => !r.running && r.winner !== null && r.goldRet !== null && r.dollarRet !== null);
  let goldYears = 0;
  let dollarYears = 0;
  let tieYears = 0;
  for (const r of rows) {
    if (r.winner === "gold") goldYears++;
    else if (r.winner === "dollar") dollarYears++;
    else tieYears++;
  }
  return { goldYears, dollarYears, tieYears, decidedYears: rows.length };
}

/* ------------------------------------------------------------------ *
 * 4.3 — The decoupling detector: «در جهان پایین، در ایران بالا»
 * ------------------------------------------------------------------ */

/** One decoupling year: global gold fell while Iranian gold rose —
 *  the rial fell faster than the world's gold. */
export interface DecouplingRow {
  jy: number;
  /** The global gold (USD) return that year — negative. */
  globalRet: number;
  /** The Iranian gold (toman) return that year — positive. */
  iranRet: number;
  /** The dollar's own rise that year — the cause. */
  dollarRet: number;
}

/** The historical event labels the copy carries on the rows that fire
 *  (only as the historical label, never as a causal claim beyond the
 *  numbers shown). */
export const DECOUPLING_EVENTS: Record<number, [string, string]> = {
  1391: ["Sanctions, the rial's collapse", "تحریم‌ها و سقوط ریال"],
  1392: ["Sanctions era", "دورهٔ تحریم‌ها"],
  1397: ["The US exits the JCPOA", "خروج آمریکا از برجام"],
  1400: ["The negotiations era", "دورهٔ مذاکرات"],
};

/** Every COMPLETE year where global gold fell (USD, < 0) while
 *  Iranian gold rose (toman, > 0) — computed, never hardcoded. */
export function decouplingYears(p: DollarTrendPayload): DecouplingRow[] {
  const rows = trendYearRows(p).filter((r) => !r.running);
  const out: DecouplingRow[] = [];
  for (const r of rows) {
    if (r.goldUsdRet === null || r.goldRet === null || r.dollarRet === null) continue;
    if (r.goldUsdRet < 0 && r.goldRet > 0) {
      out.push({ jy: r.jy, globalRet: r.goldUsdRet, iranRet: r.goldRet, dollarRet: r.dollarRet });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 4.4 — The sync score: the same-direction count + the rolling
 *  5-year correlation strip
 * ------------------------------------------------------------------ */

/** One 5-year rolling window: the window's last year and the Pearson
 *  correlation of the two annual-return series inside it. */
export interface RollingWindow {
  /** The window's LAST year (the window covers jy−4 … jy). */
  jy: number;
  r: number | null;
}

/** The sync score's whole answer. */
export interface SyncScore {
  /** Years where BOTH legs rose (of the years where both returns
   *  exist, complete years only). */
  bothUp: number;
  bothKnown: number;
  /** The rolling 5-year correlation, one point per window, oldest
   *  first. Null where the window lacks 5 known pairs (or is
   *  degenerate — zero variance needs a third leg to exist at all). */
  rolling: RollingWindow[];
  /** The window with the highest correlation (max sync). */
  maxSync: RollingWindow | null;
  /** The window with the lowest correlation (max divergence). */
  maxDiverge: RollingWindow | null;
}

/** The rolling window length (the spec's own). */
const SYNC_WINDOW = 5;

/** Pearson correlation of two equal-length series (null on a
 *  degenerate window — zero variance on either side). */
function pearson(a: number[], b: number[]): number | null {
  const n = Math.min(a.length, b.length);
  if (n < 2) return null;
  let ma = 0;
  let mb = 0;
  for (let i = 0; i < n; i++) {
    ma += a[i]!;
    mb += b[i]!;
  }
  ma /= n;
  mb /= n;
  let num = 0;
  let da = 0;
  let dbb = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i]! - ma;
    const xb = b[i]! - mb;
    num += xa * xb;
    da += xa * xa;
    dbb += xb * xb;
  }
  if (da <= 0 || dbb <= 0) return null;
  const r = num / Math.sqrt(da * dbb);
  return Number.isFinite(r) ? Math.max(-1, Math.min(1, r)) : null;
}

/** The sync score over the payload: (a) the same-direction count
 *  («در {n} سال از {m}، هر دو با هم بالا رفتند»); (b) the rolling
 *  5-year correlation of the two annual-return series with the
 *  max-sync and max-divergence windows named. Complete years only. */
export function syncScore(p: DollarTrendPayload): SyncScore {
  const rows = trendYearRows(p).filter((r) => !r.running && r.goldRet !== null && r.dollarRet !== null);
  let bothUp = 0;
  for (const r of rows) {
    if (r.goldRet! > 0 && r.dollarRet! > 0) bothUp++;
  }
  const rolling: RollingWindow[] = [];
  for (let end = 0; end < rows.length; end++) {
    const window = rows.slice(Math.max(0, end - (SYNC_WINDOW - 1)), end + 1);
    if (window.length < SYNC_WINDOW) continue;
    rolling.push({
      jy: rows[end]!.jy,
      r: pearson(window.map((w) => w.goldRet!), window.map((w) => w.dollarRet!)),
    });
  }
  let maxSync: RollingWindow | null = null;
  let maxDiverge: RollingWindow | null = null;
  for (const w of rolling) {
    if (w.r === null) continue;
    if (maxSync === null || w.r > maxSync.r!) maxSync = w;
    if (maxDiverge === null || w.r < maxDiverge.r!) maxDiverge = w;
  }
  return { bothUp, bothKnown: rows.length, rolling, maxSync, maxDiverge };
}

/* ------------------------------------------------------------------ *
 * 4.4b — The two headline years: the most in-sync and the most
 * divergent single year of the whole race (complete years only)
 * ------------------------------------------------------------------ */

/** One year's head-to-head reading for the two headline verdicts. */
export interface TrendVerdictYear {
  jy: number;
  /** The gold gram's toman return that year, %. */
  goldRet: number;
  /** The dollar's toman return that year, %. */
  dollarRet: number;
  /** |goldRet − dollarRet|, percentage points. */
  gap: number;
  /** True when both returns carry the same sign (both up or both down). */
  sameDirection: boolean;
}

/** The year the two assets moved most alike — the smallest return gap
 *  among the complete years where BOTH moved the same way (both rose or
 *  both fell): the race's most faithful, least surprising year. Null
 *  when no complete year carries both same-signed returns. */
export function mostSyncYear(p: DollarTrendPayload): TrendVerdictYear | null {
  const rows = trendYearRows(p).filter((r) => !r.running && r.goldRet !== null && r.dollarRet !== null);
  let best: TrendVerdictYear | null = null;
  for (const r of rows) {
    const g = r.goldRet!;
    const d = r.dollarRet!;
    const bothUp = g > 0 && d > 0;
    const bothDown = g < 0 && d < 0;
    if (!bothUp && !bothDown) continue;
    const cand = { jy: r.jy, goldRet: g, dollarRet: d, gap: Math.abs(g - d), sameDirection: true };
    if (best === null || cand.gap < best.gap) best = cand;
  }
  return best;
}

/** The year they moved most apart — the largest return gap, with the
 *  opposite-direction years (gold down while the dollar rose, or the
 *  reverse) always beating a same-direction year of equal gap: the
 *  race's most two-faced year (dollar up, gold down — or the reverse). */
export function mostDivergentYear(p: DollarTrendPayload): TrendVerdictYear | null {
  const rows = trendYearRows(p).filter((r) => !r.running && r.goldRet !== null && r.dollarRet !== null);
  let best: TrendVerdictYear | null = null;
  for (const r of rows) {
    const g = r.goldRet!;
    const d = r.dollarRet!;
    const sameDirection = (g >= 0 && d >= 0) || (g <= 0 && d <= 0);
    const cand = { jy: r.jy, goldRet: g, dollarRet: d, gap: Math.abs(g - d), sameDirection };
    if (best === null) {
      best = cand;
      continue;
    }
    // an opposite-direction year wins over a same-direction one at any gap
    if (!cand.sameDirection && best.sameDirection) {
      best = cand;
      continue;
    }
    if (cand.sameDirection === best.sameDirection && cand.gap > best.gap) best = cand;
  }
  return best;
}

/** The world's gold multiple over the same span (the ounce's USD price
 *  now ÷ the start year) — read alone, this IS the dollar's own global
 *  decay against gold: a ×14 world means the dollar lost 1 − 1/14 ≈ 93%
 *  of its gold-priced purchasing power. Null on missing legs. */
export function globalGoldMultiple(p: DollarTrendPayload, startJy: number): number | null {
  const rows = trendYearRows(p).filter((r) => r.jy >= startJy && r.goldUsdOz !== null);
  if (rows.length < 2) return null;
  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  if (first.goldUsdOz! <= 0 || last.goldUsdOz! <= 0) return null;
  return last.goldUsdOz! / first.goldUsdOz!;
}

/* ------------------------------------------------------------------ *
 * 4.4c — The growth decomposition: how much of gold's Iran growth was
 * the rial's fall, how much the world's own gold move, how much the
 * Tehran premium — the exact multiplicative identity, split
 * additively by logarithms (the shares sum to 100%)
 * ------------------------------------------------------------------ */

/** The decomposition's whole answer, over the start year → the last
 *  row where BOTH toman legs exist (the running year when live). */
export interface GrowthDecomposition {
  startJy: number;
  endJy: number;
  /** gold's toman multiple, now ÷ start (the thing being explained). */
  goldX: number;
  /** the dollar's toman multiple — the rial-fall leg. */
  dollarX: number;
  /** the global ounce's USD multiple — the world-gold leg. */
  globalX: number;
  /** the premium's multiple (goldX ÷ dollarX ÷ globalX) — the حباب leg. */
  premiumX: number;
  /** the three legs' shares of the total LOG growth, in percent —
   *  null when the total is not a growth (goldX ≤ 1) so no honest
   *  share exists. */
  shares: { rialPct: number; globalPct: number; premiumPct: number } | null;
}

/** The exact identity goldX = dollarX × globalX × premiumX, computed
 *  over the payload's own legs (never a guess: any missing leg at the
 *  span's ends returns null). The shares split ln(goldX) — so a
 *  negative leg (a falling world price) reads as a negative share, and
 *  the three always sum to 100%. */
export function growthDecomposition(p: DollarTrendPayload, startJy = RACE_START_JY): GrowthDecomposition | null {
  const rows = trendYearRows(p);
  const start = rows.find((r) => r.jy === startJy);
  if (start === undefined) return null;
  // the end: the last row whose BOTH toman legs exist (live-over-history)
  let end: TrendYearRow | null = null;
  for (const r of rows) {
    if (r.gold18Toman !== null && r.dollarToman !== null) end = r;
  }
  if (end === null || end.jy <= startJy) return null;
  if (start.gold18Toman === null || start.dollarToman === null) return null;
  const g0 = start.gold18Toman;
  const g1 = end.gold18Toman!;
  const d0 = start.dollarToman;
  const d1 = end.dollarToman!;
  if (g0 <= 0 || g1 <= 0 || d0 <= 0 || d1 <= 0) return null;
  const goldX = g1 / g0;
  const dollarX = d1 / d0;
  // the world leg: the global ounce at the same two rows
  const u0 = start.goldUsdOz;
  const u1 = end.goldUsdOz;
  if (u0 === null || u1 === null || u0 <= 0 || u1 <= 0) return null;
  const globalX = u1 / u0;
  // the premium leg: the residual of the exact identity — ۱ in the
  // parity era (gold IS parity there), the market-over-parity change in
  // the TGJU era. This is exactly goldX ÷ (dollarX × globalX).
  const premiumX = goldX / (dollarX * globalX);
  if (!Number.isFinite(premiumX) || premiumX <= 0) return null;
  const ln = Math.log(goldX);
  const shares = ln > 0
    ? {
        rialPct: (Math.log(dollarX) / ln) * 100,
        globalPct: (Math.log(globalX) / ln) * 100,
        premiumPct: (Math.log(premiumX) / ln) * 100,
      }
    : null;
  return { startJy, endJy: end.jy, goldX, dollarX, globalX, premiumX, shares };
}

/* ------------------------------------------------------------------ *
 * 4.5 — The premium arc: geram18 ÷ parity, the حباب's long arc
 * (TGJU era only — the parity era IS parity by construction)
 * ------------------------------------------------------------------ */

/** One premium-arc point: the market price over the parity price
 *  (1 = at parity; 1.25 = a ۲۵٪ premium). */
export interface PremiumArcPoint {
  jy: number;
  ratio: number;
  running: boolean;
}

/** The premium arc: geram18's actual year-end market price ÷ the
 *  parity price for every TGJU-era year, plus the current value (the
 *  running year's live legs). The current value cross-checks against
 *  the bridge board's own premium — the bridge stays the live
 *  authority. Null legs drop out, never guessed. */
export function premiumArc(p: DollarTrendPayload): { points: PremiumArcPoint[]; current: PremiumArcPoint | null } {
  const rows = trendYearRows(p);
  const points: PremiumArcPoint[] = [];
  for (const row of rows) {
    if (row.gold18Basis !== "tgju" || row.gold18Toman === null) continue;
    const parity = parityOfRow(row);
    if (parity === null || parity <= 0) continue;
    points.push({ jy: row.jy, ratio: row.gold18Toman / parity, running: row.running });
  }
  const current = points.length > 0 ? points[points.length - 1]! : null;
  return { points, current: current !== null && current.running ? current : null };
}

/** The parity price for one merged row (the same equation the bridge
 *  teaches — the annual-average ounce × the year's dollar leg). */
function parityOfRow(row: TrendYearRow): number | null {
  if (row.goldUsdOz === null || row.dollarToman === null) return null;
  return gold18ParityToman(row.goldUsdOz, row.dollarToman);
}

/* ------------------------------------------------------------------ *
 * The chart's own points — indexed to 100 at the start year
 * ------------------------------------------------------------------ */

/** The three chart lines' own points: gold-toman, dollar-toman (both
 *  indexed to 100 at the start year) and the global-gold context line
 *  (indexed too). Log-Y is the default view (47 years of multiples in
 *  the tens of thousands — linear would be a cliff). */
export function chartSeries(p: DollarTrendPayload, startJy: number): {
  jys: number[];
  gold: (number | null)[];
  dollar: (number | null)[];
  global: (number | null)[];
} | null {
  const rows = trendYearRows(p);
  const visible = rows.filter((r) => r.jy >= startJy);
  if (visible.length < 2) return null;
  const startGold = visible[0]!.gold18Toman;
  const startDollar = visible[0]!.dollarToman;
  const startGlobal = visible[0]!.goldUsdOz;
  if (startGold === null || startDollar === null || startGlobal === null) return null;
  return {
    jys: visible.map((r) => r.jy),
    gold: visible.map((r) => (r.gold18Toman !== null && startGold > 0 ? (r.gold18Toman / startGold) * 100 : null)),
    dollar: visible.map((r) => (r.dollarToman !== null && startDollar > 0 ? (r.dollarToman / startDollar) * 100 : null)),
    global: visible.map((r) => (r.goldUsdOz !== null && startGlobal > 0 ? (r.goldUsdOz / startGlobal) * 100 : null)),
  };
}
