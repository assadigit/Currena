/**
 * v7 — the taxed grid replay, standalone (run separately so each browser
 * session is fresh: bun tests/compound-grid-replay-tax.ts).
 */
import { existsSync, readFileSync } from "node:fs";
import { chromium } from "playwright";
import { computeCompound, type AssetFigures, type PlanInput } from "../src/lib/compound/maths";

interface GridRow {
  inputs: {
    base: number; rate_pct: number; years: number; start: string;
    higher_pct: number | null; inflation_pct: number | null;
    cost_pct: number; fee: number; every: number;
    growth_pct: number; start_amount: number; tax_pct?: number;
  };
  final: number; put_in: number; growth: number;
  today_money: number | null; fees: number;
  low_final: number; high_final: number;
  plus10pct_adds: number; minus10pct_loses: number;
  starting_later_costs: Record<string, number>;
  crossover: string | null;
  milestones: Record<string, string>;
  rounded_as_page: Record<string, number | null>;
}

const taxGridPath = "docs/compound-tests/grid-tax.json";
const taxGrid: GridRow[] = existsSync(taxGridPath)
  ? (JSON.parse(readFileSync(taxGridPath, "utf8")) as GridRow[])
  : [];

/* The page's real figures: Australian shares (7.2% / 9.0%). */
const FIGURES: AssetFigures = { r20: 0.072, r30: 0.09 };

/* v7 engine-side check duplicated so this file is self-contained. */
let taxFails = 0;
for (const row of taxGrid) {
  const months = Math.round(row.inputs.years * 12);
  const plan: PlanInput = {
    monthly: row.inputs.base, salary: null, share: 0.03, useShare: false,
    age: null, startingAmount: row.inputs.start_amount,
    yearlyIncrease: row.inputs.growth_pct / 100, yearlyCost: row.inputs.cost_pct / 100,
    feePerPurchase: row.inputs.fee, purchaseEveryMonths: row.inputs.every as 1 | 3,
    rateMode: "average", customRate: 0.07, customLow: 0.05, customHigh: 0.09,
    inflation: (row.inputs.inflation_pct ?? 0) / 100, whatIfPoints: 2,
    taxRate: (row.inputs.tax_pct ?? 0) / 100,
  };
  const r = computeCompound(plan, FIGURES, months);
  if (Math.abs(r.finalValue - row.final) / Math.max(1, Math.abs(row.final)) > 0.0001) taxFails++;
}
console.log(`ENGINE (taxed, standalone): ${taxGrid.length - taxFails}/${taxGrid.length} match`);

const BASE = process.env.CW_BASE ?? "http://localhost:3100";

/* ------------------------------------------------------------------ *
 * v7: the taxed live-page replay — the tax typed into the real Costs
 * group's tax box, the page's own numbers compared against the taxed
 * grid (15 / 32 / 45% across the strata corners).
 * ------------------------------------------------------------------ */
async function uiTaxReplay() {
  if (taxGrid.length === 0) return;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // One row per (tax level x corner): the default, the long+costly corner,
  // the fee/every corner and the 1-year corner.
  const subset = taxGrid.filter((row) => {
    const i = row.inputs;
    const corner =
      (i.base === 100 && i.years === 20 && i.cost_pct === 0.2 && i.fee === 0 && i.every === 1 && i.growth_pct === 0 && i.start_amount === 0) ||
      (i.base === 200 && i.years === 30 && i.cost_pct === 1 && i.growth_pct === 0 && i.start_amount === 0 && i.fee === 0 && i.every === 1) ||
      (i.base === 200 && i.years === 1 && i.cost_pct === 0 && i.growth_pct === 0 && i.start_amount === 0 && i.fee === 10 && i.every === 3) ||
      (i.base === 200 && i.years === 30 && i.cost_pct === 0.2 && i.growth_pct === 3 && i.start_amount === 5000);
    return corner;
  });
  console.log(`UI replay (taxed): ${subset.length} stratified scenarios`);

  const roundMoney = (v: number) => {
    const a = Math.abs(v);
    if (a >= 1_000_000) return Math.round(v / 10_000) * 10_000;
    if (a >= 100_000) return Math.round(v / 1_000) * 1_000;
    if (a >= 10_000) return Math.round(v / 100) * 100;
    if (a >= 1_000) return Math.round(v / 10) * 10;
    return Math.round(v);
  };
  const num = (s: string) => Number((s.match(/[\d,]+(?:\.\d+)?/g) ?? []).join("").replace(/,/g, "")) || 0;

  const fails: string[] = [];
  /** One scenario, isolated so a dev-server hiccup can be retried once
   *  (a real failure fails twice and is recorded). */
  const runScenario = async (row: GridRow): Promise<string[]> => {
    const i = row.inputs;
    // networkidle (the v6 pattern) — it also guarantees React has
    // hydrated, so the fills below are never swallowed by the SSR shell.
    await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-cw=headline]");

    await page.fill("#cw-amount", String(i.base));
    await page.fill("#cw-years", String(i.years));
    await page.click("[data-cw=more-options]");
    await page.waitForSelector("[data-cw=more-options-groups]");
    await page.click('[data-cw="group-costs"] button');
    await page.waitForTimeout(150);
    await page.fill("#cw-cost", String(i.cost_pct));
    await page.fill("#cw-fee", String(i.fee));
    // v7: the tax itself, typed into the Costs group's tax box.
    await page.fill("#cw-tax", String(i.tax_pct));
    if (i.every === 3) await page.click("[data-cw=every] button:nth-child(2)");
    if (!(await page.$("#cw-incr"))) await page.click('[data-cw="group-rates"] button');
    await page.waitForTimeout(150);
    await page.fill("#cw-incr", String(i.growth_pct));
    await page.click("[data-cw=more-options]");
    await page.waitForTimeout(200);
    if (i.start_amount > 0) {
      await page.click("[data-cw=more-options]");
      await page.waitForSelector("[data-cw=more-options-groups]");
      if (!(await page.$("#cw-starting"))) await page.click('[data-cw="group-about"] button');
      await page.fill("#cw-starting", String(i.start_amount));
      await page.click("[data-cw=more-options]");
      await page.waitForTimeout(200);
    }

    const shown = await page.evaluate(() => {
      const headline = document.querySelector("[data-cw=headline] p")?.textContent ?? "";
      const tiles = [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')].map((d) => (d.textContent ?? "").replace(/[^0-9]/g, ""));
      const range = document.querySelector("[data-cw=range-line]")?.textContent ?? "";
      const caption = document.querySelector("[data-cw=tax-caption]")?.textContent ?? "";
      const later = [...document.querySelectorAll('section[aria-label="What if…"] p')].map((p) => p.textContent ?? "");
      return { headline, tiles, range, caption, later };
    });

    const got = {
      putIn: num(shown.tiles[0] ?? ""),
      final: num(shown.tiles[2] ?? ""),
      low: num((shown.range.match(/worse: about ([\d,]+)/) ?? [])[1] ?? ""),
      high: num((shown.range.match(/better: about ([\d,]+)/) ?? [])[1] ?? ""),
      today: num((shown.headline.match(/about ([\d,]+) in today's money/) ?? [])[1] ?? ""),
      later5: num((shown.later.find((p) => /Starting 5/.test(p)) ?? "").match(/costs you ([\d,.]+)/)?.[1] ?? ""),
    };
    const want = {
      putIn: roundMoney(row.put_in),
      final: roundMoney(row.final),
      low: roundMoney(row.low_final),
      high: roundMoney(row.high_final),
      today: row.today_money !== null ? roundMoney(row.today_money) : 0,
      later5: row.starting_later_costs["5"] ? roundMoney(row.starting_later_costs["5"]) : 0,
    };
    const near = (a: number, b: number, step: number) => Math.abs(a - b) <= step;
    const bad: string[] = [];
    if (!near(got.final, want.final, 1)) bad.push(`final ${got.final} vs ${want.final}`);
    if (!near(got.putIn, want.putIn, 1)) bad.push(`putIn ${got.putIn} vs ${want.putIn}`);
    if (!near(got.low, want.low, 1)) bad.push(`low ${got.low} vs ${want.low}`);
    if (!near(got.high, want.high, 1)) bad.push(`high ${got.high} vs ${want.high}`);
    if (row.today_money !== null && !near(got.today, want.today, 1)) bad.push(`today ${got.today} vs ${want.today}`);
    if (want.later5 > 0 && !near(got.later5, want.later5, 1)) bad.push(`later5 ${got.later5} vs ${want.later5}`);
    // the caption must be present and say the after-tax rate (±0.1 points)
    const captionRate = num((shown.caption.match(/at ([\d.]+)%/) ?? [])[1] ?? "");
    const wantRate = (0.072 - i.cost_pct / 100) * (1 - (i.tax_pct ?? 0) / 100) * 100;
    if (!shown.caption.includes("After tax at")) bad.push(`caption missing: ${shown.caption}`);
    else if (Math.abs(captionRate - wantRate) > 0.11) bad.push(`caption rate ${captionRate} vs ${wantRate.toFixed(2)}`);
    return bad;
  };

  let attempted = 0;
  for (const row of subset) {
    attempted++;
    let bad: string[];
    try {
      bad = await runScenario(row);
    } catch (e) {
      // One quiet retry: a dev-server pause (compile queue) can stall a
      // fill — a real defect fails the retry too and is recorded.
      await page.waitForTimeout(2_000);
      bad = await runScenario(row);
      void e;
    }
    if (bad.length > 0) fails.push(`${JSON.stringify(row.inputs)} → ${bad.join("; ")}`);
  }
  console.log(`UI (taxed): ${attempted - fails.length}/${attempted} scenarios match`);
  for (const f of fails.slice(0, 8)) console.log("  TAX-UI-MISMATCH", f);
  console.log("page errors (taxed):", errors.length ? errors.slice(0, 3) : "none");
  await browser.close();
  if (fails.length > 0) process.exitCode = 1;
}


await uiTaxReplay();
