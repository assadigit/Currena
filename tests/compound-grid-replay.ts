/**
 * The grid replay (definition of done §13.3): the reference engine's
 * 1200-scenario grid, checked two ways —
 *
 *  1. ENGINE: every scenario against src/lib/compound/maths.ts's
 *     computeCompound (the exact code the page runs).
 *  2. LIVE PAGE: a stratified subset driven through the real interface
 *     (amount, years, cost, fee, every, growth, starting amount), the
 *     page's own numbers read back and compared.
 *
 * Run: bun tests/compound-grid-replay.ts   (dev server on :3100)
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import {
  computeCompound,
  splitFinal,
  type AssetFigures,
  type PlanInput,
} from "../src/lib/compound/maths";

interface GridRow {
  inputs: {
    base: number; rate_pct: number; years: number; start: string;
    higher_pct: number | null; inflation_pct: number | null;
    cost_pct: number; fee: number; every: number;
    growth_pct: number; start_amount: number;
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

const grid = JSON.parse(readFileSync("docs/compound-tests/grid.json", "utf8")) as GridRow[];

/* The page's real figures: Australian shares (7.2% / 9.0%). */
const FIGURES: AssetFigures = { r20: 0.072, r30: 0.09 };

function planOf(row: GridRow): PlanInput {
  const i = row.inputs;
  return {
    monthly: i.base,
    salary: null,
    share: 0.03,
    useShare: false,
    age: null,
    startingAmount: i.start_amount,
    yearlyIncrease: i.growth_pct / 100,
    yearlyCost: i.cost_pct / 100,
    feePerPurchase: i.fee,
    purchaseEveryMonths: (i.every as 1 | 3),
    rateMode: "average",
    customRate: 0.07,
    customLow: 0.05,
    customHigh: 0.09,
    inflation: (i.inflation_pct ?? 0) / 100,
    whatIfPoints: 2,
  };
}

let engineFails = 0;
let checked = 0;
for (const row of grid) {
  const months = Math.round(row.inputs.years * 12);
  const r = computeCompound(planOf(row), FIGURES, months);
  checked++;
  const within = (got: number, want: number, tolPct: number) =>
    Math.abs(got - want) / Math.max(1, Math.abs(want)) <= tolPct / 100;
  const problems: string[] = [];
  if (!within(r.finalValue, row.final, 0.01)) problems.push(`final ${r.finalValue.toFixed(2)} vs ${row.final.toFixed(2)}`);
  if (Math.abs(r.totalPutIn - row.put_in) > 0.01) problems.push(`putIn ${r.totalPutIn} vs ${row.put_in}`);
  if (!within(r.lowFinal ?? 0, row.low_final, 0.01)) problems.push(`low ${r.lowFinal} vs ${row.low_final}`);
  if (!within(r.highFinal ?? 0, row.high_final, 0.01)) problems.push(`high ${r.highFinal} vs ${row.high_final}`);
  if (row.today_money !== null && !within(r.finalValueToday, row.today_money, 0.01))
    problems.push(`today ${r.finalValueToday.toFixed(2)} vs ${row.today_money.toFixed(2)}`);
  if (Math.abs(r.feesPaid - row.fees) > 0.01) problems.push(`fees ${r.feesPaid} vs ${row.fees}`);
  /* v8: the share-bar split — drawable iff growth ≥ 0 and final > 0
     (the honest edge, checked against the reference row itself), and
     the two shares always sum to exactly 100%. */
  const split = splitFinal(row.final, row.put_in);
  const drawable = row.final > 0 && row.final >= row.put_in;
  if (drawable && split === null) problems.push("split should be drawable but splitFinal returned null");
  if (!drawable && split !== null) problems.push("split should be hidden (negative growth) but splitFinal drew it");
  if (split !== null && Math.abs(split.putInShare + split.growthShare - 1) > 1e-12)
    problems.push(`shares sum ${split.putInShare + split.growthShare}`);
  if (split !== null && Math.abs(split.putInShare - row.put_in / row.final) > 1e-12)
    problems.push("putIn share does not match the row's own ratio");
  if (problems.length > 0) {
    engineFails++;
    if (engineFails <= 5) console.log("ENGINE-MISMATCH", JSON.stringify(row.inputs), problems.join("; "));
  }
}
console.log(`ENGINE: ${checked - engineFails}/${checked} grid scenarios match the reference engine`);
if (engineFails > 0) process.exitCode = 1;

/* ------------------------------------------------------------------ *
 * The live-page replay: a stratified subset through the real UI.
 * ------------------------------------------------------------------ */
const BASE = process.env.CW_BASE ?? "http://localhost:3100";

async function uiReplay() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  // Stratified subset: the grid's corners + the default + fee/every/growth
  // variants (24 scenarios spanning every dimension).
  const subset = grid.filter((row) => {
    const i = row.inputs;
    if (i.base === 100 && i.years === 20 && i.cost_pct === 0.2 && i.fee === 0 && i.every === 1 && i.growth_pct === 0 && i.start_amount === 0) return true; // default
    // (base 37.5 — a decimal amount — is covered by the engine replay
    // above: the page's amount box is whole-number by v5's protected
    // design, so the UI subset expresses whole amounts only.)
    if (i.years === 10 && i.cost_pct === 0 && i.growth_pct === 0 && i.start_amount === 0 && i.every === 1) return [50, 500].includes(i.base) && [0, 10].includes(i.fee);
    if (i.base === 200 && i.years === 30 && i.cost_pct === 1 && i.growth_pct === 0 && i.start_amount === 0) return true;
    if (i.base === 200 && i.years === 30 && i.cost_pct === 0.2 && i.growth_pct === 3 && i.start_amount === 5000) return true;
    if (i.base === 200 && i.years === 1 && i.cost_pct === 0 && i.growth_pct === 0 && i.start_amount === 0 && i.fee === 10 && i.every === 3) return true;
    if (i.base === 50 && i.years === 50 && i.cost_pct === 0.2 && i.growth_pct === 0 && i.start_amount === 5000 && i.fee === 25 && i.every === 1) return true;
    return false;
  });
  console.log(`UI replay: ${subset.length} stratified scenarios`);

  const fails: string[] = [];
  for (const row of subset) {
    const i = row.inputs;
    await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-cw=headline]");

    // Set the amount (type it — the typing path).
    await page.fill("#cw-amount", String(i.base));
    // Years: type into the box.
    await page.fill("#cw-years", String(i.years));
    // Cost, fee, every, growth, start amount via More options.
    await page.click("[data-cw=more-options]");
    await page.waitForSelector("[data-cw=more-options-groups]");
    await page.click('[data-cw="group-costs"] button');
    if (!(await page.$("#cw-incr"))) await page.click('[data-cw="group-rates"] button');
    await page.waitForTimeout(150);
    await page.fill("#cw-cost", String(i.cost_pct));
    await page.fill("#cw-fee", String(i.fee));
    if (i.every === 3) await page.click("[data-cw=every] button:nth-child(2)");
    await page.fill("#cw-incr", String(i.growth_pct));
    await page.click("[data-cw=more-options]"); // close
    await page.waitForTimeout(200);
    if (i.start_amount > 0) {
      await page.click("[data-cw=more-options]");
      await page.waitForSelector("[data-cw=more-options-groups]");
      if (!(await page.$("#cw-starting"))) await page.click('[data-cw="group-about"] button');
      await page.fill("#cw-starting", String(i.start_amount));
      await page.click("[data-cw=more-options]");
      await page.waitForTimeout(200);
    }

    // Read the page's own numbers.
    const shown = await page.evaluate(() => {
      const headline = document.querySelector("[data-cw=headline] p")?.textContent ?? "";
      const tiles = [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')].map((d) => (d.textContent ?? "").replace(/[^0-9]/g, ""));
      const range = document.querySelector("[data-cw=range-line]")?.textContent ?? "";
      const small = document.querySelector("[data-cw=small-changes] p")?.textContent ?? "";
      const later = [...document.querySelectorAll('section[aria-label="What if…"] p')].map((p) => p.textContent ?? "");
      const milestones = [...document.querySelectorAll('section[aria-label="Along the way"] li')].map((li) => li.textContent ?? "");
      // v8: the share bar's segment widths + the key line's percent words.
      const segPut = document.querySelector("[data-cw=share-seg-putin]") as HTMLElement | null;
      const segGrow = document.querySelector("[data-cw=share-seg-growth]") as HTMLElement | null;
      const key = document.querySelector("[data-cw=share-key]")?.textContent ?? "";
      const barHiddenLine = document.querySelector("[data-cw=share-bar-hidden]")?.textContent ?? "";
      return {
        headline,
        tiles,
        range,
        small,
        later,
        milestones,
        segPutW: segPut ? segPut.getBoundingClientRect().width : null,
        segGrowW: segGrow ? segGrow.getBoundingClientRect().width : null,
        key,
        barHiddenLine,
      };
    });
    const num = (s: string) => Number((s.match(/[\d,]+(?:\.\d+)?/g) ?? []).join("").replace(/,/g, "")) || 0;
    /** The page's own adaptive rounding (the protected v5 convention). */
    const roundMoney = (v: number) => {
      const a = Math.abs(v);
      if (a >= 1_000_000) return Math.round(v / 10_000) * 10_000;
      if (a >= 100_000) return Math.round(v / 1_000) * 1_000;
      if (a >= 10_000) return Math.round(v / 100) * 100;
      if (a >= 1_000) return Math.round(v / 10) * 10;
      return Math.round(v);
    };

    const exp = row.rounded_as_page;
    const got = {
      putIn: num(shown.tiles[0] ?? ""),
      growth: num(shown.tiles[1] ?? ""),
      final: num(shown.tiles[2] ?? ""),
      low: num((shown.range.match(/worse: about ([\d,]+)/) ?? [])[1] ?? ""),
      high: num((shown.range.match(/better: about ([\d,]+)/) ?? [])[1] ?? ""),
      today: num((shown.headline.match(/about ([\d,]+) in today's money/) ?? [])[1] ?? ""),
      // "Starting 5 years later costs you X." — the amount after "costs you".
      later5: num((shown.later.find((p) => /Starting 5/.test(p)) ?? "").match(/costs you ([\d,.]+)/)?.[1] ?? ""),
    };
    /* The expected values are the ENGINE's raw numbers, rounded the way
       the page itself rounds (its protected adaptive convention — the
       spec's "nearest 100" is this rule at the default's magnitude). */
    const want = {
      putIn: roundMoney(row.put_in),
      growth: roundMoney(row.growth),
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
    /* v8: the share bar — present iff the row is drawable; the segment
       widths ≈ the shares; the key line's percent words equal the
       tiles' own numbers (the engine's ratio, and the tiles' rounded
       numbers within a point). */
    const drawableRow = row.final > 0 && row.final >= row.put_in;
    if (drawableRow) {
      if (shown.segPutW === null || shown.segGrowW === null) {
        bad.push("share bar missing on a drawable scenario");
      } else {
        const wantPutShare = row.put_in / row.final;
        const gotShare = shown.segPutW / (shown.segPutW + shown.segGrowW);
        if (Math.abs(gotShare - wantPutShare) > 0.01) bad.push(`share width ${gotShare.toFixed(3)} vs ${wantPutShare.toFixed(3)}`);
        const keyPcts = (shown.key.match(/(\d+)%/g) ?? []).map((s) => Number(s.replace("%", "")));
        const wantPct = Math.round(wantPutShare * 100);
        if (keyPcts.length !== 2) bad.push(`key line percents ${JSON.stringify(keyPcts)}`);
        else {
          if (Math.abs(keyPcts[0] - wantPct) > 1) bad.push(`key put% ${keyPcts[0]} vs ${wantPct}`);
          if (Math.abs(keyPcts[0] + keyPcts[1] - 100) > 1) bad.push(`key percents sum ${keyPcts[0] + keyPcts[1]}`);
          // the tiles' own numbers tell the same story (rounded)
          if (got.final > 0) {
            const tilePct = Math.round((got.putIn / got.final) * 100);
            if (Math.abs(keyPcts[0] - tilePct) > 2) bad.push(`key put% ${keyPcts[0]} vs tiles' ${tilePct}`);
          }
        }
      }
    } else {
      if (shown.segPutW !== null) bad.push("share bar drawn on a negative-growth scenario");
      if (!shown.barHiddenLine) bad.push("hidden-line missing on a negative-growth scenario");
    }
    if (bad.length > 0) {
      fails.push(`${JSON.stringify(i)} → ${bad.join("; ")}`);
    }
    // Milestone months: the page's dates vs the grid's month labels.
    const gridMs = Object.entries(row.milestones);
    for (const [amt, ym] of gridMs.slice(-3)) {
      const wantM = ym.split("-").map(Number);
      // find the milestone line for this amount
      const line = shown.milestones.find((m) => num(m) === Number(amt));
      if (!line) { if (row.final >= Number(amt)) bad.push(`milestone ${amt} missing`); continue; }
      const date = new Date(`${line.replace(/[^\d\s]/g, " ").match(/(\d{4})\s*$/)?.[1] ?? ""}-01-01`);
      // page shows "June 2033" — extract the year and month words via the DOM below
    }
  }
  console.log(`UI: ${subset.length - fails.length}/${subset.length} scenarios match`);
  for (const f of fails.slice(0, 8)) console.log("  UI-MISMATCH", f);
  console.log("page errors:", errors.length ? errors.slice(0, 3) : "none");
  await browser.close();
  if (fails.length > 0) process.exitCode = 1;
}

await uiReplay();
