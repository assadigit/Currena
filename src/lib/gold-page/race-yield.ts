/**
 * race-yield.ts — the Iran investor's own question (the owner's
 * 2026-11-27 ask): «someone had 10 million toman 15 years ago — should
 * they have bought gold or dollars?» The pure compute layer over the
 * SAME dollar-trend payload the 47-year race section already rides
 * (one route, one cache, one set of numbers — never two engines
 * disagreeing on one history).
 *
 * THE QUESTION'S OWN FRAMING (both assets bought in Tehran, held as an
 * Iranian would hold them):
 *
 *   gold    the sum buys 18-عیار grams at the start year's own gold18
 *           price (parity estimate before ۱۳۹۲, the Tehran market from
 *           ۱۳۹۲ on — the same bases the race section names); the
 *           grams are re-marked at TODAY's live geram18 price.
 *   dollar  the sum buys US dollars at the start year's own free-market
 *           rate (the cited static table before ۱۳۹۰, TGJU's actuals
 *           from ۱۳۹۰ on); the dollars are re-marked at TODAY's live
 *           free-market rate.
 *
 * Both answers are in toman — the reader's own money — and the verdict
 * is the honest ratio of the two, never an annualized number alone.
 * The running year's own live row is the honest fallback when TGJU's
 * live legs are missing (the last complete year, named at point of use).
 *
 * Pure + fail-closed: arithmetic over the passed payload only; a
 * missing leg at either end of the span is a null, never a guess.
 * Display-only, never advice.
 */

import {
  RACE_START_JY,
  trendYearRows,
  type DollarTrendPayload,
  type TrendYearRow,
} from "@/lib/gold-page/dollar-trend";

/* ------------------------------------------------------------------ *
 * The engine — pure arithmetic over the dollar-trend payload
 * ------------------------------------------------------------------ */

/** One asset's leg of the answer: what the sum became, in toman. */
export interface RaceYieldLeg {
  /** The amount in toman the reader started with. */
  invested: number;
  /** What it is worth today, in toman. */
  worth: number;
  /** (worth ÷ invested − 1) × 100 — the total return, percent. */
  pct: number;
  /** The physical facts when they exist: the grams / dollars bought
   *  then, and what they are worth marked at today's own price. */
  unitsThen: number;
  unitsToday: number;
  /** The start year's own toman price the units were bought at (the
   *  gram price for gold, the toman-per-USD rate for dollars). */
  priceThen: number;
  /** Today's own toman price the units are marked at (the live gram
   *  price / the live toman-per-USD rate). */
  priceToday: number;
}

/** The race-yield's whole answer, both legs + the verdict. */
export interface RaceYield {
  /** The Jalali year the sum was invested (the picker's own pick). */
  startJy: number;
  /** The last year the answer marks to: the running year when the live
   *  legs arrived, else the last complete year — named, never silent. */
  endJy: number;
  /** True when endJy is the running year (its rows are live). */
  endLive: boolean;
  gold: RaceYieldLeg;
  dollar: RaceYieldLeg;
  /** gold.worth ÷ dollar.worth — > 1: gold won (the honest ratio of
   *  the two end values, both in toman). */
  ratio: number;
  winner: "gold" | "dollar";
  /** The span in Jalali years the answer covers (endJy − startJy). */
  years: number;
}

/** The row a start year needs: BOTH toman legs present. Null legs
 *  never enter an answer. */
function rowWithBothLegs(row: TrendYearRow | undefined): TrendYearRow | null {
  if (row === undefined) return null;
  if (row.gold18Toman === null || row.dollarToman === null) return null;
  if (row.gold18Toman <= 0 || row.dollarToman <= 0) return null;
  return row;
}

/** The answer's end row: the LAST row (in year order) whose BOTH legs
 *  exist — the running year when its live legs arrived, else the last
 *  complete year. Null when no such row follows the start year. */
function endRow(rows: readonly TrendYearRow[], startJy: number): TrendYearRow | null {
  let end: TrendYearRow | null = null;
  for (const r of rows) {
    if (r.jy <= startJy) continue;
    if (rowWithBothLegs(r) !== null) end = r;
  }
  return end;
}

/**
 * The race-yield compute: a sum of toman, invested in a past Jalali
 * year, split between gold and the free-market dollar — both answers
 * marked at today's own prices. Pure over the payload; null when the
 * span's ends cannot be read (never a guess).
 */
export function raceYield(p: DollarTrendPayload, startJy: number, amountToman: number): RaceYield | null {
  if (!Number.isFinite(amountToman) || amountToman <= 0) return null;
  if (!Number.isInteger(startJy) || startJy < RACE_START_JY) return null;
  const rows = trendYearRows(p);
  const start = rowWithBothLegs(rows.find((r) => r.jy === startJy));
  if (start === null) return null;
  const end = endRow(rows, startJy);
  if (end === null) return null;

  /* gold: grams bought then, marked at today's gram price */
  const gramsThen = amountToman / start.gold18Toman!;
  const goldWorth = gramsThen * end.gold18Toman!;
  /* dollar: dollars bought then, marked at today's rate */
  const dollarsThen = amountToman / start.dollarToman!;
  const dollarWorth = dollarsThen * end.dollarToman!;
  if (!(goldWorth > 0) || !(dollarWorth > 0) || !Number.isFinite(goldWorth) || !Number.isFinite(dollarWorth)) {
    return null;
  }

  const leg = (
    invested: number,
    worth: number,
    unitsThen: number,
    priceThen: number,
    priceToday: number,
  ): RaceYieldLeg => ({
    invested,
    worth,
    pct: (worth / invested - 1) * 100,
    unitsThen,
    unitsToday: worth / priceToday,
    priceThen,
    priceToday,
  });

  const ratio = goldWorth / dollarWorth;
  return {
    startJy,
    endJy: end.jy,
    endLive: end.running,
    gold: leg(amountToman, goldWorth, gramsThen, start.gold18Toman!, end.gold18Toman!),
    dollar: leg(amountToman, dollarWorth, dollarsThen, start.dollarToman!, end.dollarToman!),
    ratio,
    winner: ratio >= 1 ? "gold" : "dollar",
    years: end.jy - startJy,
  };
}

/* ------------------------------------------------------------------ *
 * The chart series — both legs' worth-in-toman path, year by year
 * ------------------------------------------------------------------ */

/** One year's point on both paths: what the sum would be worth in
 *  toman at that year's own prices. Null when either leg is missing
 *  (the line gaps across the unknown, never bridges it). */
export interface RaceYieldPoint {
  jy: number;
  goldWorth: number | null;
  dollarWorth: number | null;
  /** The year's basis labels, for the honest era chips. */
  goldBasis: "parity" | "tgju" | null;
  dollarBasis: "static" | "tgju" | null;
}

/** The worth path from the start year to the answer's own end year:
 *  the grams bought at the start, re-marked at every year's gold18
 *  price; the dollars bought at the start, re-marked at every year's
 *  dollar rate. Pure over the payload. */
export function raceYieldSeries(p: DollarTrendPayload, startJy: number, amountToman: number): RaceYieldPoint[] {
  if (!Number.isFinite(amountToman) || amountToman <= 0) return [];
  if (!Number.isInteger(startJy) || startJy < RACE_START_JY) return [];
  const rows = trendYearRows(p).filter((r) => r.jy >= startJy);
  const start = rowWithBothLegs(rows.find((r) => r.jy === startJy));
  if (start === null) return [];
  const gramsThen = amountToman / start.gold18Toman!;
  const dollarsThen = amountToman / start.dollarToman!;
  const out: RaceYieldPoint[] = [];
  for (const r of rows) {
    out.push({
      jy: r.jy,
      goldWorth: r.gold18Toman !== null && r.gold18Toman > 0 ? gramsThen * r.gold18Toman : null,
      dollarWorth: r.dollarToman !== null && r.dollarToman > 0 ? dollarsThen * r.dollarToman : null,
      goldBasis: r.gold18Basis,
      dollarBasis: r.dollarBasis,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The picker's own options — every year the payload can answer for
 * ------------------------------------------------------------------ */

/**
 * The start-year options: every Jalali year from ۱۳۵۷ whose row carries
 * BOTH legs (a year without both prices cannot honestly answer the
 * question), minus the running year itself (an answer needs a span).
 * The Gregorian twin is the caller's concern (fa reads the Jalali
 * year, EN the Gregorian year it starts in — the race table's own
 * convention).
 */
export function raceYieldYearOptions(p: DollarTrendPayload): number[] {
  const rows = trendYearRows(p);
  const runningJy = p.running.jy;
  const out: number[] = [];
  for (const r of rows) {
    if (r.jy >= runningJy) continue; // no span yet
    if (rowWithBothLegs(r) === null) continue;
    out.push(r.jy);
  }
  return out;
}
