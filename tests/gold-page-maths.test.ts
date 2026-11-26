/**
 * The gold page's maths tests (bun test) — the longview engine's own
 * discipline: the multi-currency purchasing-power machine (the toman
 * leg on Tehran's 18k gram, the four FX-crossed legs on the desk's
 * month-end table), the 20-year table's own span, and the verdict's
 * compound arithmetic. Every number is checked against independent
 * precomputation, and the FX tables ride the route's own contract:
 * units of the currency per 1 USD, never the inverse.
 */

import { describe, expect, test } from "bun:test";
import {
  cagrPercent,
  fxCompleteYearMonths,
  fxLatest,
  fxYearAverage,
  lastYearsTable,
  purchasingPower,
  purchasingPowerCcy,
  purchasingPowerToman,
  runningYear,
  yearOptionsCcy,
  yearOptionsToman,
} from "../src/lib/gold-page/longview";

/** A synthetic month-end FX table in the route's own direction (units
 *  of the currency per 1 USD): 2017/2018/2019 complete — twelve
 *  month-ends each — 2016 carrying only its three tail months (the
 *  table's own first month is 2016-10), and the running tail at
 *  2026-11. */
const FX: Record<string, number> = {
  "2016-10": 0.69,
  "2016-11": 0.7,
  "2016-12": 0.71,
  ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`2017-${String(i + 1).padStart(2, "0")}`, 1.32])),
  ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`2018-${String(i + 1).padStart(2, "0")}`, 0.68])),
  ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`2019-${String(i + 1).padStart(2, "0")}`, 0.7])),
  "2026-11": 0.7,
};

/** The toman leg's own synthetic race payload: the parity era, the
 *  market era, and the live running row — the same bases the section
 *  rides. */
const TOMAN_LEGS = {
  gold18: [
    { jy: 1390, toman: 1000, basis: "parity" as const },
    { jy: 1400, toman: 1150000, basis: "tgju" as const },
  ],
  running: { jy: 1405, gold18Toman: 25475500 },
};

describe("the FX month table's own laws", () => {
  test("a complete year carries twelve month-ends, 2016 never qualifies", () => {
    expect(fxCompleteYearMonths(FX, 2016)).toEqual([]);
    expect(fxCompleteYearMonths(FX, 2017)).toHaveLength(12);
    expect(fxCompleteYearMonths(FX, 2026)).toEqual([]);
  });

  test("a complete year's average is the mean of its twelve closes", () => {
    expect(fxYearAverage(FX, 2017)).toBeCloseTo(1.32, 10);
    expect(fxYearAverage(FX, 2018)).toBeCloseTo(0.68, 10);
    expect(fxYearAverage(FX, 2016)).toBeNull();
    expect(fxYearAverage(undefined, 2017)).toBeNull();
  });

  test("the latest close is the running month's own latest row", () => {
    expect(fxLatest(FX)).toBeCloseTo(0.7, 10);
    expect(fxLatest(undefined)).toBeNull();
  });
});

describe("the FX-crossed machine (EUR · GBP · CAD · AUD)", () => {
  // Precomputed independently: 2018's London average 1269.25 × the
  // year's average FX 0.68 = 863.09 per ounce; today 3500 × 0.7 = 2450.
  test("the 2018 leg: 1000 units at the year's average cross", () => {
    const a = purchasingPowerCcy(1000, 2018, 3500, FX);
    expect(a).not.toBeNull();
    expect(a!.priceThen).toBeCloseTo(863.09, 2);
    expect(a!.ozThen).toBeCloseTo(1.158628, 5);
    expect(a!.gramsThen).toBeCloseTo(36.0374, 3);
    expect(a!.ozToday).toBeCloseTo(0.408163, 5);
    expect(a!.gramsToday).toBeCloseTo(12.6953, 3);
    expect(a!.worthToday).toBeCloseTo(2838.64, 2);
    expect(a!.gramsPct).toBeCloseTo(-64.7718, 3);
  });

  test("the running year reads the live cross on both sides — zero contrast", () => {
    const ry = runningYear();
    const a = purchasingPowerCcy(1000, ry, 3500, FX);
    expect(a).not.toBeNull();
    expect(a!.gramsPct).toBeCloseTo(0, 9);
    expect(a!.gramsToday).toBeCloseTo(a!.gramsThen, 9);
    expect(a!.ozToday).toBeCloseTo(1000 / 2450, 5);
  });

  test("fail-closed: an incomplete FX year, a missing table, a missing spot", () => {
    expect(purchasingPowerCcy(1000, 2016, 3500, FX)).toBeNull(); // three months only
    expect(purchasingPowerCcy(1000, 2020, 3500, FX)).toBeNull(); // no FX leg at all
    expect(purchasingPowerCcy(1000, 2018, null, FX)).toBeNull(); // no live spot
    expect(purchasingPowerCcy(1000, 2018, 3500, undefined)).toBeNull(); // no table
    expect(purchasingPowerCcy(0, 2018, 3500, FX)).toBeNull(); // no money
  });

  test("the year options follow the table's own complete coverage", () => {
    const ry = runningYear();
    expect(yearOptionsCcy(FX, 3500)).toEqual([2017, 2018, 2019, ry]);
    expect(yearOptionsCcy(FX, null)).toEqual([2017, 2018, 2019]);
    expect(yearOptionsCcy(undefined, 3500)).toEqual([]);
  });
});

describe("the toman machine (Tehran's own 18k gram)", () => {
  // Precomputed independently: 100M toman at the 1400 market gram
  // (1,150,000) vs the live gram (25,475,500).
  test("the 1400 leg: 100M toman at the Tehran market gram", () => {
    const a = purchasingPowerToman(100000000, 1400, TOMAN_LEGS);
    expect(a).not.toBeNull();
    expect(a!.basisThen).toBe("market");
    expect(a!.gramsThen).toBeCloseTo(86.9565, 3);
    expect(a!.gramsToday).toBeCloseTo(3.9253, 3);
    expect(a!.worthTodayToman).toBeCloseTo(2215260869.57, 0);
    expect(a!.gramsPct).toBeCloseTo(-95.4859, 3);
  });

  test("the 1390 leg rides the parity basis, its own named case", () => {
    const a = purchasingPowerToman(100000000, 1390, TOMAN_LEGS);
    expect(a).not.toBeNull();
    expect(a!.basisThen).toBe("parity");
    expect(a!.priceThenTomanPerGram).toBe(1000);
    expect(a!.gramsThen).toBeCloseTo(100000, 3);
    expect(a!.gramsPct).toBeCloseTo(-99.9961, 3);
  });

  test("the running Jalali year reads the live gram on both sides", () => {
    const a = purchasingPowerToman(100000000, 1405, TOMAN_LEGS);
    expect(a).not.toBeNull();
    expect(a!.basisThen).toBe("live");
    expect(a!.gramsPct).toBeCloseTo(0, 9);
    expect(a!.gramsToday).toBeCloseTo(a!.gramsThen, 9);
  });

  test("fail-closed: no live gram, no money, no such year", () => {
    expect(purchasingPowerToman(1000, 1400, { ...TOMAN_LEGS, running: { jy: 1405, gold18Toman: null } })).toBeNull();
    expect(purchasingPowerToman(0, 1400, TOMAN_LEGS)).toBeNull();
    expect(purchasingPowerToman(1000, 1380, TOMAN_LEGS)).toBeNull();
  });

  test("the toman year options: complete Jalali years + the running year", () => {
    expect(yearOptionsToman(TOMAN_LEGS)).toEqual([1390, 1400, 1405]);
    expect(yearOptionsToman({ ...TOMAN_LEGS, running: null })).toEqual([1390, 1400]);
    expect(yearOptionsToman({ ...TOMAN_LEGS, running: { jy: 1405, gold18Toman: null } })).toEqual([1390, 1400]);
  });
});

describe("the USD machine (the original leg, through the shared tail)", () => {
  // Precomputed independently: 12,000 at the 2020 London average
  // (1770.25) against the live spot 3547.9.
  test("the owner's own example: $12,000 in 2020", () => {
    const a = purchasingPower(12000, 2020, 3547.9);
    expect(a).not.toBeNull();
    expect(a!.priceThen).toBe(1770.25);
    expect(a!.ozThen).toBeCloseTo(6.778704, 5);
    expect(a!.gramsThen).toBeCloseTo(210.8412, 3);
    expect(a!.worthToday).toBeCloseTo(24050.16, 2);
    // the weight ratio, not the worth ratio: the same money buys less
    // gold today even as the bought gold is worth more
    expect(a!.gramsPct).toBeCloseTo(-50.104287, 4);
    expect(a!.ozToday).toBeCloseTo(12000 / 3547.9, 5);
  });

  test("fail-closed: a year outside the series never guesses", () => {
    expect(purchasingPower(1000, 1800, 3547.9)).toBeNull();
    expect(purchasingPower(0, 2020, 3547.9)).toBeNull();
    expect(purchasingPower(1000, 2020, null)).toBeNull();
  });
});

describe("the 20-year table and the verdict's compound arithmetic", () => {
  test("the table's own span: 2007 → the running year at the live spot", () => {
    const rows = lastYearsTable(3547.9);
    expect(rows).toHaveLength(20);
    expect(rows[0]!.year).toBe(2007);
    expect(rows[0]!.price).toBe(696.67);
    expect(rows[0]!.running).toBe(false);
    expect(rows[rows.length - 1]!.year).toBe(2026);
    expect(rows[rows.length - 1]!.price).toBe(3547.9);
    expect(rows[rows.length - 1]!.running).toBe(true);
  });

  test("without a live spot the table stops at the last complete year", () => {
    const rows = lastYearsTable(null);
    expect(rows).toHaveLength(19);
    expect(rows[rows.length - 1]!.year).toBe(2025);
    expect(rows.every((r) => !r.running)).toBe(true);
  });

  test("the verdict's number: the compound rate over the table's own span", () => {
    // 696.67 (the 2007 average, the table's own first row) → 3547.9
    // (the live spot) over 19 annual steps — the chain the verdict renders.
    expect(cagrPercent(696.67, 3547.9, 19)).toBeCloseTo(8.9451, 3);
    expect(cagrPercent(100, 100, 10)).toBeCloseTo(0, 9);
    expect(cagrPercent(0, 5, 10)).toBeNull();
    expect(cagrPercent(5, 5, 0)).toBeNull();
    expect(cagrPercent(-5, 5, 10)).toBeNull();
  });
});
