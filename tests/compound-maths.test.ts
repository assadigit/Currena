/**
 * Compound Wealth — the maths tests (spec §12, tests 1–11).
 *
 * Run with:  bun test tests/compound-maths.test.ts
 *
 * Every fixed vector comes from the spec itself. Tolerances are the spec's
 * (±0.5% on the money vectors, ±0.05 points on the AUD conversion).
 */

import { describe, expect, test } from "bun:test";
import {
  DEFAULT_YEARLY_COST,
  MILESTONES_ON_CARDS,
  MILESTONES_ON_PAGE,
  addMonths,
  audFromUsd,
  chooseRate,
  clamp,
  clampDates,
  computeCompound,
  figuresAreStale,
  formatMoney,
  monthsBetween,
  thisMonth,
  whatIfCash,
  whatIfLaterStart,
  whatIfSmallChange,
  type AssetFigures,
  type PlanInput,
} from "../src/lib/compound/maths";
import {
  COUNTRY_ROWS,
  assetById,
  assetChips,
  cashRow,
  defaultInflation,
  figuresOf,
  FIGURES_CHECKED_ON,
} from "../src/lib/compound/figures";

/** The plain baseline plan used by the spec's fixed vectors. */
function basePlan(overrides: Partial<PlanInput> = {}): PlanInput {
  return {
    monthly: 100,
    salary: null,
    share: 0.03,
    useShare: false,
    age: null,
    startingAmount: 0,
    yearlyIncrease: 0,
    yearlyCost: 0,
    feePerPurchase: 0,
    purchaseEveryMonths: 1,
    rateMode: "average",
    customRate: 0.07,
    customLow: 0.05,
    customHigh: 0.09,
    inflation: 0,
    whatIfPoints: 2,
    ...overrides,
  };
}

/** A synthetic asset with fixed figures (7% both windows). */
const SEVEN: AssetFigures = { r20: 0.07, r30: 0.07 };

const within = (got: number, want: number, tolPct: number) =>
  Math.abs(got - want) / want <= tolPct / 100;

/* ---------------------------------------------------------------- */
/* Test 1 — the headline vector                                      */
/* ---------------------------------------------------------------- */
describe("test 1: 100/month, 20 years, 7%, no costs", () => {
  const r = computeCompound(basePlan(), SEVEN, 240);
  test("final ≈ 50,754 (±0.5%)", () => {
    expect(within(r.finalValue, 50_754, 0.5)).toBe(true);
  });
  test("put in exactly 24,000", () => {
    expect(r.totalPutIn).toBe(24_000);
  });
  test("growth is the difference", () => {
    expect(r.growth).toBeCloseTo(r.finalValue - 24_000, 6);
  });
});

/* ---------------------------------------------------------------- */
/* Test 2 — percent-of-salary mode                                   */
/* ---------------------------------------------------------------- */
describe("test 2: 3% of a 5,000 salary, 20 years, 7%", () => {
  const r = computeCompound(
    basePlan({ salary: 5_000, share: 0.03, useShare: true }),
    SEVEN,
    240,
  );
  test("final ≈ 76,130 (±0.5%)", () => {
    expect(within(r.finalValue, 76_130, 0.5)).toBe(true);
  });
  test("put in exactly 36,000", () => {
    expect(r.totalPutIn).toBe(36_000);
  });
});

/* ---------------------------------------------------------------- */
/* Tests 3–4 — the fee vectors                                       */
/* ---------------------------------------------------------------- */
describe("test 3: fee 10 per purchase, monthly", () => {
  const r = computeCompound(basePlan({ feePerPurchase: 10 }), SEVEN, 240);
  test("final ≈ 45,678 (±0.5%)", () => {
    expect(within(r.finalValue, 45_678, 0.5)).toBe(true);
  });
  test("fees paid exactly 2,400", () => {
    expect(r.feesPaid).toBe(2_400);
  });
});

describe("test 4: fee 10 per purchase, every 3 months", () => {
  const r = computeCompound(
    basePlan({ feePerPurchase: 10, purchaseEveryMonths: 3 }),
    SEVEN,
    240,
  );
  test("final ≈ 48,785 (±0.5%)", () => {
    expect(within(r.finalValue, 48_785, 0.5)).toBe(true);
  });
  test("fees paid exactly 800", () => {
    expect(r.feesPaid).toBe(800);
  });
});

/* ---------------------------------------------------------------- */
/* Test 5 — fee edge cases                                           */
/* ---------------------------------------------------------------- */
describe("test 5: fee eats the purchase", () => {
  // Pending carries across skipped purchase months, so a plan only fails
  // to invest when the pot never grows past the fee — here 50 × 24 = 1,200
  // never clears a 1,500 fee.
  const r = computeCompound(basePlan({ monthly: 50, feePerPurchase: 1_500 }), SEVEN, 24);
  test("never invests", () => {
    expect(r.neverInvests).toBe(true);
  });
  test("pending carries everything and is shown", () => {
    expect(r.pending).toBe(50 * 24);
    expect(r.finalValue).toBe(r.pending); // balance stayed 0
  });
  test("no fees were paid", () => {
    expect(r.feesPaid).toBe(0);
  });
  test("a fee below the pot does invest (the carry rule)", () => {
    // 50/month against a 60 fee: month 1 skips, month 2's pot of 100 clears it.
    const carries = computeCompound(basePlan({ monthly: 50, feePerPurchase: 60 }), SEVEN, 120);
    expect(carries.neverInvests).toBe(false);
    expect(carries.feesPaid).toBeGreaterThan(0);
  });
  test("fee over 1% of each purchase raises the costs hint", () => {
    const pricey = computeCompound(basePlan({ feePerPurchase: 10 }), SEVEN, 240);
    expect(pricey.feeEatsLargeShare).toBe(true);
    const cheap = computeCompound(basePlan({ feePerPurchase: 0.5 }), SEVEN, 240);
    expect(cheap.feeEatsLargeShare).toBe(false);
  });
});

/* ---------------------------------------------------------------- */
/* Test 6 — zero return, increases, yearly cost                      */
/* ---------------------------------------------------------------- */
describe("test 6: zero return and costs", () => {
  const flat = { r20: 0, r30: 0 } as AssetFigures;
  test("0% return: final = put in (no fees)", () => {
    const r = computeCompound(basePlan(), flat, 120);
    expect(r.finalValue).toBeCloseTo(r.totalPutIn, 6);
  });
  test("0% return with a fee: final = put in minus fees", () => {
    const r = computeCompound(basePlan({ feePerPurchase: 2 }), flat, 120);
    expect(r.finalValue).toBeCloseTo(r.totalPutIn - r.feesPaid, 6);
  });
  test("a higher yearly increase puts in more", () => {
    const low = computeCompound(basePlan({ yearlyIncrease: 0 }), flat, 240);
    const high = computeCompound(basePlan({ yearlyIncrease: 0.05 }), flat, 240);
    expect(high.totalPutIn).toBeGreaterThan(low.totalPutIn);
  });
  test("a yearly cost lowers the final value", () => {
    const noCost = computeCompound(basePlan(), SEVEN, 240);
    const withCost = computeCompound(
      basePlan({ yearlyCost: DEFAULT_YEARLY_COST }),
      SEVEN,
      240,
    );
    expect(withCost.finalValue).toBeLessThan(noCost.finalValue);
  });
});

/* ---------------------------------------------------------------- */
/* Test 7 — the AUD conversion                                       */
/* ---------------------------------------------------------------- */
describe("test 7: AUD conversion (spec §6.3)", () => {
  test("10% USD, FX 0.80 → 0.40, 20 years ≈ 13.88%", () => {
    const rAud = audFromUsd(0.1, 0.8, 0.4, 20);
    expect(Math.abs(rAud - 0.1388)).toBeLessThanOrEqual(0.0005);
  });
  test("a flat FX leaves the rate unchanged", () => {
    expect(audFromUsd(0.07, 0.75, 0.75, 20)).toBeCloseTo(0.07, 10);
  });
});

/* ---------------------------------------------------------------- */
/* Test 8 — baseline, band, fallbacks, staleness                     */
/* ---------------------------------------------------------------- */
describe("test 8: baseline and band rules", () => {
  test("baseline = the lower of the 20- and 30-year figures", () => {
    const c = chooseRate({ r20: 0.09, r30: 0.072 }, basePlan());
    expect(c.baseline).toBeCloseTo(0.072, 10);
    expect(c.how).toBe("lower-of-two");
  });
  test("differing by ≥ 0.5 points: high end = the higher measured figure", () => {
    const c = chooseRate({ r20: 0.09, r30: 0.072 }, basePlan());
    expect(c.band).toEqual({ low: 0.072 - 0.02, high: 0.09 });
    expect(c.highIsMeasured).toBe(true);
  });
  test("differing by < 0.5 points: high end is a what-if", () => {
    const c = chooseRate({ r20: 0.072, r30: 0.07 }, basePlan());
    expect(c.band!.low).toBeCloseTo(0.05, 10);
    expect(c.band!.high).toBeCloseTo(0.09, 10);
    expect(c.highIsMeasured).toBe(false);
  });
  test("single figure: baseline = it, band = ± what-if points", () => {
    const c = chooseRate({ r20: null, r30: null, single: { rate: 0.122, years: 15 } }, basePlan());
    expect(c.baseline).toBeCloseTo(0.122, 10);
    expect(c.band).toEqual({ low: 0.102, high: 0.142 });
    expect(c.how).toBe("single-figure");
  });
  test("custom rate: single line, no band", () => {
    const c = chooseRate({ r20: 0.09, r30: 0.072 }, basePlan({ rateMode: "custom-rate", customRate: 0.05 }));
    expect(c.baseline).toBe(0.05);
    expect(c.band).toBeNull();
  });
  test("custom range: middle = average", () => {
    const c = chooseRate(SEVEN, basePlan({ rateMode: "custom-range", customLow: 0.04, customHigh: 0.08 }));
    expect(c.baseline).toBeCloseTo(0.06, 10);
    expect(c.band).toEqual({ low: 0.04, high: 0.08 });
  });
  test("no measured figure: neutral 0%, no band, honest how", () => {
    const c = chooseRate({ r20: null, r30: null }, basePlan());
    expect(c.baseline).toBe(0);
    expect(c.band).toBeNull();
    expect(c.how).toBe("none");
  });
  test("unsourced assets are hidden from the chips", () => {
    // The real figures file: every chip must have a figure, and unknown
    // ids resolve to null (the page hides what has no figures).
    for (const country of ["AU", "US"] as const) {
      for (const chip of assetChips(country)) {
        expect(chip.f20 !== null || chip.f30 !== null || chip.fsingle !== null).toBe(true);
      }
      expect(assetById(country, "does-not-exist")).toBeNull();
    }
  });
  test("the cash row exists for both countries (the comparison needs it)", () => {
    expect(cashRow("AU")).not.toBeNull();
    expect(cashRow("US")).not.toBeNull();
  });
  test("staleness: older than 18 months is flagged", () => {
    expect(figuresAreStale("2024-01-15")).toBe(true);
    expect(figuresAreStale(FIGURES_CHECKED_ON)).toBe(false);
    expect(figuresAreStale(addMonthsDay("2026-06-01"))).toBe(false);
  });
});

function addMonthsDay(iso: string): string {
  return iso; // helper kept for readability above
}

/* ---------------------------------------------------------------- */
/* Test 9 — dates                                                     */
/* ---------------------------------------------------------------- */
describe("test 9: date clamping", () => {
  test("a start before this month clamps to this month", () => {
    const r = clampDates("2020-01", addMonths(thisMonth(), 24));
    expect(r.start >= thisMonth()).toBe(true);
    expect(r.clamped).toBe(true);
  });
  test("an end beyond 50 years clamps to exactly 50 years", () => {
    const r = clampDates(thisMonth(), addMonths(thisMonth(), 700));
    expect(monthsBetween(r.start, r.end)).toBe(600);
    expect(r.clamped).toBe(true);
  });
  test("an end at or before the start is pushed one month on", () => {
    const r = clampDates(thisMonth(), thisMonth());
    expect(monthsBetween(r.start, r.end)).toBe(1);
  });
  test("year chips: 20 years from now is exactly 240 months", () => {
    const end = addMonths(thisMonth(), 20 * 12);
    expect(monthsBetween(thisMonth(), end)).toBe(240);
  });
  test("a valid pair is untouched", () => {
    const r = clampDates(thisMonth(), addMonths(thisMonth(), 120));
    expect(r.clamped).toBe(false);
  });
});

/* ---------------------------------------------------------------- */
/* Test 10 — milestones                                               */
/* ---------------------------------------------------------------- */
describe("test 10: milestones", () => {
  const r = computeCompound(basePlan({ monthly: 500 }), SEVEN, 360); // big plan
  test("only thresholds at or below the final value", () => {
    for (const ms of r.milestones) {
      expect(ms.threshold).toBeLessThanOrEqual(r.finalValue);
    }
  });
  test("the month is the first crossing (checked against the series)", () => {
    for (const ms of r.milestones) {
      const at = r.series[ms.month - 1];
      expect(at.value).toBeGreaterThanOrEqual(ms.threshold);
      if (ms.month > 1) {
        expect(r.series[ms.month - 2].value).toBeLessThan(ms.threshold);
      }
    }
  });
  test("the page shows at most MILESTONES_ON_PAGE, cards at most 5", () => {
    expect(r.milestones.length).toBeLessThanOrEqual(MILESTONES_ON_CARDS);
    expect(r.milestones.slice(-MILESTONES_ON_PAGE).length).toBeLessThanOrEqual(MILESTONES_ON_PAGE);
  });
  test("today's-money milestones cross later (or equally) for inflation > 0", () => {
    const infl = computeCompound(basePlan({ monthly: 500, inflation: 0.025 }), SEVEN, 360);
    const byThreshold = new Map(infl.milestones.map((ms) => [ms.threshold, ms.month]));
    for (const msToday of infl.milestonesToday) {
      const futureMonth = byThreshold.get(msToday.threshold);
      if (futureMonth !== undefined) {
        expect(msToday.month).toBeGreaterThanOrEqual(futureMonth);
      }
    }
  });
});

/* ---------------------------------------------------------------- */
/* Test 11 — extreme and empty inputs                                 */
/* ---------------------------------------------------------------- */
describe("test 11: extremes never break", () => {
  test("50 years, 30% return, 25% yearly increase stays finite", () => {
    const r = computeCompound(
      basePlan({ yearlyIncrease: 0.25, rateMode: "custom-rate", customRate: 0.3 }),
      { r20: null, r30: null },
      600,
    );
    expect(Number.isFinite(r.finalValue)).toBe(true);
    expect(r.finalValue).toBeGreaterThan(0);
  });
  test("deeply negative custom rate stays finite (no complex roots)", () => {
    const r = computeCompound(
      basePlan({ rateMode: "custom-rate", customRate: -0.95 }),
      { r20: null, r30: null },
      120,
    );
    expect(Number.isFinite(r.finalValue)).toBe(true);
  });
  test("zero months: the starting amount stands", () => {
    const r = computeCompound(basePlan({ startingAmount: 1_234 }), SEVEN, 0);
    expect(r.finalValue).toBe(1_234);
    expect(r.series).toHaveLength(0);
  });
  test("zero monthly amount with a starting amount still compounds", () => {
    const r = computeCompound(basePlan({ monthly: 0, startingAmount: 1_000 }), SEVEN, 120);
    expect(Number.isFinite(r.finalValue)).toBe(true);
    expect(r.totalPutIn).toBe(1_000);
  });
  test("clamp guards NaN", () => {
    expect(clamp(Number.NaN, 0, 1, 0.5)).toBe(0.5);
    expect(clamp(2, 0, 1, 0.5)).toBe(1);
  });
  test("formatMoney handles NaN and Infinity", () => {
    expect(formatMoney(Number.NaN, "en")).toBe("0");
    expect(formatMoney(Number.POSITIVE_INFINITY, "fa")).toBe("۰");
  });
});

/* ---------------------------------------------------------------- */
/* Extra — the what-if helpers the cards rely on                      */
/* ---------------------------------------------------------------- */
describe("what-if helpers", () => {
  test("1% more adds, 1% less loses; fixed mode is 10% of the amount", () => {
    const w = whatIfSmallChange(basePlan(), SEVEN, 240);
    expect(w).not.toBeNull();
    expect(w!.describedAs).toBe("amount");
    expect(w!.more).toBeGreaterThan(0);
    expect(w!.less).toBeGreaterThan(0);
  });
  test("share mode is described as salary", () => {
    const w = whatIfSmallChange(basePlan({ salary: 5_000, useShare: true }), SEVEN, 240);
    expect(w!.describedAs).toBe("salary");
  });
  test("starting 5 years later costs something", () => {
    const c = whatIfLaterStart(basePlan(), SEVEN, 240, 5);
    expect(c).not.toBeNull();
    expect(c!).toBeGreaterThan(0);
  });
  test("the cash comparison uses the cash figures", () => {
    const cashFigures = figuresOf(cashRow("AU")!);
    const c = whatIfCash(basePlan(), cashFigures, 240);
    expect(c).not.toBeNull();
    expect(c!).toBeGreaterThan(0);
    expect(c!).toBeLessThan(computeCompound(basePlan(), SEVEN, 240).finalValue);
  });
});

/* ---------------------------------------------------------------- */
/* The real figures file — sanity of the shipped table                */
/* ---------------------------------------------------------------- */
describe("the shipped figures file", () => {
  test("both countries have a default asset that exists", () => {
    for (const country of ["AU", "US"] as const) {
      const rows = COUNTRY_ROWS[country];
      const def = rows.assets.find((a) => a.id === rows.defaultAsset);
      expect(def).toBeDefined();
      expect(def!.f20 !== null || def!.f30 !== null).toBe(true);
    }
  });
  test("every sourced rate is a sensible decimal", () => {
    for (const country of ["AU", "US"] as const) {
      const rows = COUNTRY_ROWS[country];
      for (const row of [...rows.assets, rows.inflation]) {
        for (const f of [row.f20, row.f30, row.fsingle]) {
          if (f) {
            expect(f.rate).toBeGreaterThan(-0.5);
            expect(f.rate).toBeLessThan(0.5);
            expect(f.periodEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          }
        }
      }
    }
  });
  test("inflation defaults exist for both countries", () => {
    expect(defaultInflation("AU")).toBeGreaterThan(0);
    expect(defaultInflation("US")).toBeGreaterThan(0);
  });
  test("figuresOf carries the single-figure label through", () => {
    const world = figuresOf(assetById("US", "world")!);
    expect(world.r20).toBeNull();
    expect(world.r30).toBeNull();
    expect(world.single!.years).toBeGreaterThanOrEqual(10);
  });
});

/* ---------------------------------------------------------------- */
/* v6 regression lock — the live numbers verified by independent     */
/* recomputation on 2026-11-25 (spec v6 §1.1). Start month frozen at */
/* 2026-11 (the build month) so the dates stay testable. The plan is */
/* exactly the page defaults: 100 a month, 20 years, Australian      */
/* shares (7.2% over 20y, 9.0% over 30y — the lower is used),        */
/* yearly cost 0.2%, inflation 2.76% (the AU average).              */
/* ---------------------------------------------------------------- */
describe("v6 regression lock: the live defaults (spec §1.1)", () => {
  const AU_SHARES = figuresOf(assetById("AU", "australian-shares")!);
  const plan = basePlan({
    yearlyCost: 0.002,
    inflation: defaultInflation("AU"),
  });
  const r = computeCompound(plan, AU_SHARES, monthsBetween("2026-11", "2046-11"));

  test("you put in exactly 24,000", () => {
    expect(r.totalPutIn).toBe(24_000);
  });
  test("final ≈ 50,754 — the page says about 50,800", () => {
    expect(within(r.finalValue, 50_753.6, 0.1)).toBe(true);
    expect(Math.round(r.finalValue / 100) * 100).toBe(50_800);
  });
  test("growth ≈ 26,754 — the page says 26,800", () => {
    expect(within(r.growth, 26_753.6, 0.1)).toBe(true);
    expect(Math.round(r.growth / 100) * 100).toBe(26_800);
  });
  test("today's money ≈ 29,441 — the page says about 29,400", () => {
    expect(within(r.finalValueToday, 29_441, 0.2)).toBe(true);
    expect(Math.round(r.finalValueToday / 100) * 100).toBe(29_400);
  });
  test("the band: low ≈ 40,600 at 5.2%, high ≈ 62,400 at 9.0%", () => {
    expect(r.band).not.toBeNull();
    expect(Math.round((r.band!.low * 100) * 10) / 10).toBeCloseTo(5.2, 1);
    expect(Math.round((r.band!.high * 100) * 10) / 10).toBeCloseTo(9.0, 1);
    expect(Math.round(r.lowFinal! / 100) * 100).toBe(40_600);
    expect(Math.round(r.highFinal! / 100) * 100).toBe(62_400);
  });
  test("the band's high end is a measured figure (30y vs 20y differ by 1.8)", () => {
    expect(r.bandHighIsMeasured).toBe(true);
  });
  test("crossover: month 224 — June 2045", () => {
    expect(r.crossoverMonth).toBe(224);
    expect(addMonths("2026-11", 224 - 1)).toBe("2045-06");
  });
  test("milestones: the page's three are Jun 2033, Nov 2039, Sep 2046", () => {
    const page = r.milestones.slice(-MILESTONES_ON_PAGE);
    expect(page.map((m) => [m.threshold, m.month])).toEqual([
      [10_000, 80],
      [25_000, 157],
      [50_000, 239],
    ]);
    expect(addMonths("2026-11", 80 - 1)).toBe("2033-06");
    expect(addMonths("2026-11", 157 - 1)).toBe("2039-11");
    expect(addMonths("2026-11", 239 - 1)).toBe("2046-09");
  });
  test("starting 5 years later costs ≈ 19,600", () => {
    const c = whatIfLaterStart(plan, AU_SHARES, 240, 5);
    expect(Math.round(c! / 100) * 100).toBe(19_600);
  });
  test("cash what-if — re-pinned by W2 to 32,800 (the pre-W2 live value was 32,100)", () => {
    // The live page on 2026-11-26 showed "about 32,100": the cash rate
    // (3.03%) with the 0.2% fund cost wrongly deducted. W2 (spec §6.5)
    // removed the cost, so the lock now pins the honest number; the
    // before-value is still pinned in the W2 block below.
    const cashFigures = figuresOf(cashRow("AU")!);
    const c = whatIfCash(plan, cashFigures, 240);
    expect(Math.round(c! / 100) * 100).toBe(32_800);
  });
});

/* ---------------------------------------------------------------- */
/* W2 (spec §6.5, test 34) — cash pays no yearly fund cost.          */
/* The switch itself: APPLY_COST_TO_CASH = false (one config line).  */
/* ---------------------------------------------------------------- */
describe("W2: cash has no yearly fund cost", () => {
  const CASH = figuresOf(cashRow("AU")!);
  const plan = basePlan({ yearlyCost: 0.002, inflation: defaultInflation("AU") });

  test("the cash what-if equals the cash rate with NO cost deducted (≈32,800)", () => {
    const c = whatIfCash(plan, CASH, 240);
    // Reference: simulate(100, 3.03, 20, cost 0) = 32,790 → page 32,800.
    expect(within(c!, 32_790, 0.1)).toBe(true);
    expect(Math.round(c! / 100) * 100).toBe(32_800);
  });
  test("isCash skips the cost inside computeCompound; without it the old lower number returns", () => {
    const noCost = computeCompound(plan, CASH, 240, { isCash: true });
    const withCost = computeCompound(plan, CASH, 240);
    expect(within(noCost.finalValue, 32_790, 0.1)).toBe(true);
    expect(within(withCost.finalValue, 32_102, 0.1)).toBe(true); // the W2 "before"
    expect(noCost.finalValue).toBeGreaterThan(withCost.finalValue);
  });
  test("cash has no band (§6.2), but its baseline is still the lower of 20y/30y", () => {
    const r = computeCompound(plan, CASH, 240, { isCash: true });
    expect(r.band).toBeNull();
    expect(Math.round(r.baselineRate * 10000) / 100).toBeCloseTo(3.03, 2);
  });
  test("the share assets still pay the cost (the switch only frees cash)", () => {
    const AU_SHARES = figuresOf(assetById("AU", "australian-shares")!);
    const r = computeCompound(plan, AU_SHARES, 240);
    expect(Math.round((r.netRate * 100) * 10) / 10).toBeCloseTo(7.0, 1); // 7.2 − 0.2
  });
});

/* ---------------------------------------------------------------- */
/* W1 (spec §5.2, tests 32–33) — small changes in money or points.   */
/* ---------------------------------------------------------------- */
describe("W1: small-changes wording maths", () => {
  test("amount mode: the step is 10% of the amount, whole, minimum 1", () => {
    const w100 = whatIfSmallChange(basePlan(), SEVEN, 240);
    expect(w100!.moneyStep).toBe(10);
    const w5 = whatIfSmallChange(basePlan({ monthly: 5 }), SEVEN, 240);
    expect(w5!.moneyStep).toBe(1);
    const w37 = whatIfSmallChange(basePlan({ monthly: 37 }), SEVEN, 240);
    expect(w37!.moneyStep).toBe(4); // 3.7 rounds to 4
  });
  test("amount mode: 'more' is final(amount+step) − final(amount)", () => {
    const w = whatIfSmallChange(basePlan(), SEVEN, 240);
    const up = computeCompound(basePlan({ monthly: 110 }), SEVEN, 240);
    const base = computeCompound(basePlan(), SEVEN, 240);
    expect(w!.more).toBeCloseTo(up.finalValue - base.finalValue, 6);
  });
  test("amount mode with a salary: the step's share of the salary is exposed", () => {
    const w = whatIfSmallChange(basePlan({ salary: 7_500 }), SEVEN, 240);
    expect(w!.stepShareOfSalary).toBeCloseTo(10 / 7_500, 8);
  });
  test("% mode: one point either way, as percentages", () => {
    const w = whatIfSmallChange(basePlan({ salary: 5_000, useShare: true, share: 0.03 }), SEVEN, 240);
    expect(w!.pctNow).toBeCloseTo(0.03, 6);
    expect(w!.pctUp).toBeCloseTo(0.04, 6);
    expect(w!.pctDown).toBeCloseTo(0.02, 6);
    expect(w!.hideLess).toBe(false);
    expect(w!.hideMore).toBe(false);
  });
  test("% mode: the 'less' sentence hides when the lower value is under 0.5%", () => {
    const w = whatIfSmallChange(basePlan({ salary: 5_000, useShare: true, share: 0.012 }), SEVEN, 240);
    expect(w!.pctDown).toBeCloseTo(0.002, 6);
    expect(w!.hideLess).toBe(true); // 0.2% < 0.5%
    expect(w!.hideMore).toBe(false);
  });
  test("test 33: the copy never says '1% more' — the shipped strings are money or points", async () => {
    const { COPY } = await import("../src/lib/compound/content");
    for (const locale of ["en", "fa"] as const) {
      const w = COPY[locale].tool.whatIf;
      expect(w.moreMoney).toContain("{step}");
      expect(w.lessMoney).toContain("{step}");
      expect(w.morePct).toContain("{up}");
      expect(w.lessPct).toContain("{down}");
      expect(JSON.stringify(w)).not.toMatch(/1% more|۱٪ بیشتر/);
    }
  });
});

/* ---------------------------------------------------------------- */
/* W3 / W5 / W6 (tests 33–38) — the figures file's honesty fields.   */
/* ---------------------------------------------------------------- */
describe("W3/W5/W6: inflation visibility, index names, figures sanity", () => {
  test("W3 (35): both countries carry a latest 12-month inflation row", async () => {
    const { latestInflation } = await import("../src/lib/compound/figures");
    for (const country of ["AU", "US"] as const) {
      const li = latestInflation(country);
      expect(li.rate).toBeGreaterThan(0);
      expect(li.rate).toBeLessThan(0.15);
      expect(li.sourceName.length).toBeGreaterThan(3);
      expect(li.sourceUrl).toMatch(/^https:\/\//);
      expect(li.labelEn).toContain("12 months");
    }
  });
  test("W3 (35): the AU honesty figure is the verified 4.9% to Oct 2026; the US is 3.7% to Sep 2026", async () => {
    const { latestInflation } = await import("../src/lib/compound/figures");
    expect(latestInflation("AU").rate).toBeCloseTo(0.049, 6);
    expect(latestInflation("US").rate).toBeCloseTo(0.037, 6);
  });
  test("W5 (37): every asset row names the exact index behind its figure", async () => {
    const { COUNTRY_ROWS } = await import("../src/lib/compound/figures");
    for (const country of ["AU", "US"] as const) {
      for (const row of COUNTRY_ROWS[country].assets) {
        expect(row.measures.length).toBeGreaterThan(10);
        expect(row.measures).toMatch(/[A-Za-z]/); // names the index or series
      }
    }
  });
  test("the chips keep plain names (not index jargon)", async () => {
    const { assetChips } = await import("../src/lib/compound/figures");
    for (const country of ["AU", "US"] as const) {
      for (const chip of assetChips(country)) {
        // plain chip labels — the index names live in `measures` only.
        // ("S&P 500" stays: it IS the spec's own plain chip name.)
        expect(chip.labelEn).not.toMatch(/Index|Total Return|Accumulation|Net|All Ordinaries/);
      }
    }
  });
  test("W6 (38): both countries carry a currency symbol", async () => {
    const { COUNTRY_ROWS } = await import("../src/lib/compound/figures");
    expect(COUNTRY_ROWS.AU.currencyEn).toBe("A$");
    expect(COUNTRY_ROWS.US.currencyEn).toBe("$");
  });
  test("W4: the figures file's checked-on date is the research date", async () => {
    const { FIGURES_CHECKED_ON } = await import("../src/lib/compound/figures");
    expect(FIGURES_CHECKED_ON).toMatch(/^2026-11-2[0-9]$/);
    expect(figuresAreStale(FIGURES_CHECKED_ON)).toBe(false);
  });
  test("the copy carries the inflation caption and the index heading (W3/W5)", async () => {
    const { COPY } = await import("../src/lib/compound/content");
    for (const locale of ["en", "fa"] as const) {
      expect(COPY[locale].tool.tiles.inflationCaption).toContain("{x}");
      expect(COPY[locale].tool.how.inflationRecentLine).toContain("{y}");
      expect(COPY[locale].tool.how.indicesTitle.length).toBeGreaterThan(3);
    }
  });
});
