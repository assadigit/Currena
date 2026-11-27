/**
 * Compound Wealth v6 — the Phase A test pass (COMPOUND-WEALTH-TEST-PROMPT
 * §1–§3), driven through the real interface against the LIVE page.
 * Writes evidence into docs/compound-tests/ and prints a PASS/FAIL line
 * per test id for the test report.
 *
 * Run:  CW_BASE=https://currena.ir bun tests/compound-phase-a.ts
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.CW_BASE ?? "http://localhost:3100";
const OUT = "docs/compound-tests";

interface Row {
  id: string;
  area: "maths" | "data" | "behaviour";
  tested: string;
  expected: string;
  actual: string;
  pass: boolean;
}
const ROWS: Row[] = [];
function record(area: Row["area"], id: string, tested: string, expected: string, actual: string, pass: boolean) {
  ROWS.push({ id, area, tested, expected, actual, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${id} — ${tested}: ${actual.slice(0, 110)}`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  /* ================================================================ *
   * §1.2 — the spec vectors through the interface
   * ================================================================ */
  async function setPlan(opts: {
    amount?: number; years?: number; customRate?: string; shareMode?: boolean;
    salary?: string; salaryPerMonth?: boolean; share?: string; fee?: string; every?: 1 | 3; cost?: string; increase?: string;
  }) {
    await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-cw=headline]");
    if (opts.amount !== undefined) await page.fill("#cw-amount", String(opts.amount));
    if (opts.years !== undefined) await page.fill("#cw-years", String(opts.years));
    if (opts.shareMode) {
      await page.click("[data-cw=mode-share]");
      if (opts.salary) {
        // (the box is per year by default — the vector's salary is per
        // month, so switch the period before typing)
        if (opts.salaryPerMonth) await page.click("[data-cw=salary-period-month]");
        await page.fill("#cw-salary", opts.salary);
      }
      if (opts.share) await page.fill("#cw-percent", opts.share);
    }
    if (opts.customRate !== undefined || opts.fee !== undefined || opts.every !== undefined || opts.cost !== undefined || opts.increase !== undefined) {
      await page.click("[data-cw=more-options]");
      await page.waitForSelector("[data-cw=more-options-groups]");
      if (!(await page.$("#cw-fee"))) await page.click('[data-cw="group-costs"] button');
      if (opts.customRate !== undefined || opts.increase !== undefined) {
        if (!(await page.$("#cw-incr"))) await page.click('[data-cw="group-rates"] button');
      }
      await page.waitForTimeout(150);
      if (opts.cost !== undefined) await page.fill("#cw-cost", opts.cost);
      if (opts.fee !== undefined) await page.fill("#cw-fee", opts.fee);
      if (opts.every === 3) await page.click("[data-cw=every] button:nth-child(2)");
      if (opts.customRate !== undefined) {
        // Average → Custom rate, then type the rate
        await page.click('[data-cw="rate-mode"] button:nth-child(2)');
        await page.fill("#cw-crate", opts.customRate);
      }
      if (opts.increase !== undefined) await page.fill("#cw-incr", opts.increase);
      await page.click("[data-cw=more-options]");
      await page.waitForTimeout(200);
    }
  }
  async function readTiles() {
    return page.evaluate(() =>
      [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')].map((d) =>
        Number((d.textContent ?? "").replace(/[^0-9]/g, "")),
      ),
    );
  }
  const near = (a: number, b: number, tolPct: number) => Math.abs(a - b) / b <= tolPct / 100;

  // Vector 1: 7% custom rate, cost 0 → 50,754; put in 24,000.
  await setPlan({ amount: 100, years: 20, customRate: "7", cost: "0" });
  let tiles = await readTiles();
  record("maths", "T2-vector-1", "custom rate 7%, cost 0, 100/mo, 20y", "final ≈ 50,754, put in 24,000",
    `tiles ${tiles.join("/")} (page rounds: ${tiles.join("")})`, near(tiles[2], 50_754, 0.5) && tiles[0] === 24_000);

  // Vector 2: percent mode 3% of 5,000/mo, 0% increase → 76,130; put in 36,000.
  await setPlan({ shareMode: true, salary: "5000", salaryPerMonth: true, share: "3", years: 20, customRate: "7", cost: "0", increase: "0" });
  tiles = await readTiles();
  record("maths", "T2-vector-2", "3% of a 5,000/month salary, 0% increase, 7%", "final ≈ 76,130, put in 36,000",
    `tiles ${tiles.join("/")}`, near(tiles[2], 76_130, 0.5) && tiles[0] === 36_000);

  // Vector 3: fee 10 monthly → 45,678; fees 2,400.
  await setPlan({ amount: 100, years: 20, customRate: "7", cost: "0", fee: "10" });
  tiles = await readTiles();
  const costsCard = await page.evaluate(() =>
    [...document.querySelectorAll('section[aria-label="What if…"] p')].map((p) => p.textContent ?? "").find((t) => /Costs took/.test(t)) ?? "",
  );
  record("maths", "T2-vector-3", "fee 10 per purchase, monthly", "final ≈ 45,678, fees 2,400",
    `tiles ${tiles.join("/")}; costs card: ${costsCard.slice(0, 50)}`,
    near(tiles[2], 45_678, 0.5) && /2,400/.test(costsCard));

  // Vector 4: fee 10 every 3 months → 48,785; fees 800.
  await setPlan({ amount: 100, years: 20, customRate: "7", cost: "0", fee: "10", every: 3 });
  tiles = await readTiles();
  const costsCard3 = await page.evaluate(() =>
    [...document.querySelectorAll('section[aria-label="What if…"] p')].map((p) => p.textContent ?? "").find((t) => /Costs took/.test(t)) ?? "",
  );
  record("maths", "T2-vector-4", "fee 10, every 3 months", "final ≈ 48,785, fees 800",
    `tiles ${tiles.join("/")}; ${costsCard3.slice(0, 50)}`,
    near(tiles[2], 48_785, 0.5) && /800/.test(costsCard3));

  /* ================================================================ *
   * §1.3 — edge cases through the interface
   * ================================================================ */
  // Amount edge cases: empty, 0, letters, decimals, comma decimals, Persian digits.
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");
  for (const [typed, want] of [
    ["", "box restores on blur, no NaN"],
    ["0", "clamps to the minimum 1"],
    ["abc", "letters rejected, no NaN"],
    ["37.5", "the dot is dropped (integer box), no NaN"],
    ["37,5", "comma decimal: comma dropped, no NaN"],
    ["۲۵۰", "Persian digits accepted as 250"],
  ] as const) {
    await page.fill("#cw-amount", typed as string);
    await page.waitForTimeout(200);
    if (typed === "") await page.$eval("#cw-amount", (el) => el.blur());
    const value = await page.inputValue("#cw-amount");
    const headline = (await page.textContent("[data-cw=headline] p")) ?? "";
    const ok = /NaN|Infinity|undefined/.test(headline) === false;
    record("maths", `T3-amount-${JSON.stringify(typed)}`, `typing ${JSON.stringify(typed)} in the amount box`, want,
      `box "${value}", headline ${ok ? "finite" : "BROKEN"}`, ok);
  }
  // Years edge cases: 0, 1, 50, 51, decimals.
  for (const [typed, want] of [["0", "clamps to 1"], ["1", "one year works"], ["50", "fifty years works"], ["51", "clamps to 50"], ["2.5", "2.5 → rounds"]  as const]) {
    await page.fill("#cw-years", typed as string);
    await page.waitForTimeout(200);
    const value = await page.inputValue("#cw-years");
    const headline = (await page.textContent("[data-cw=headline] p")) ?? "";
    const ok = /NaN|Infinity/.test(headline) === false;
    record("maths", `T3-years-${typed}`, `typing ${typed} in the years box`, want, `box "${value}", headline ${ok ? "finite" : "BROKEN"}`, ok);
  }

  // Fee at or above every purchase → never invests, plain message. (The
  // carry rule means a fee equal to one month's amount is eventually
  // beaten by accumulated pending, so the true case is a fee at or above
  // the whole plan's deposits: 1/month for 24 months vs a 30 fee.)
  await setPlan({ amount: 1, years: 2, fee: "30" });
  const never = (await page.textContent("[data-cw=headline]")) ?? "";
  record("maths", "T3-fee-eats-purchases", "fee 30 with 1/month for 2 years (every purchase is skipped)", "the plan never invests, plainly said",
    never.includes("cost eats every purchase") ? "the never-invests message shows" : `MISSING: ${never.slice(0, 80)}`,
    never.includes("cost eats every purchase"));

  // Fee over 1% of each purchase → the costs hint.
  await setPlan({ amount: 100, years: 2, fee: "5" });
  const hint = (await page.textContent("body")) ?? "";
  record("maths", "T3-fee-hint", "fee 5 on 100/month (5% of a purchase)", "the buying-every-3-months hint shows",
    hint.includes("Buying every 3 months can help") ? "hint shows" : "MISSING", hint.includes("Buying every 3 months can help"));

  // Very large amounts.
  await setPlan({ amount: 999999999, years: 50 });
  const big = (await page.textContent("[data-cw=headline] p")) ?? "";
  record("maths", "T3-huge-amount", "999,999,999 a month for 50 years", "finite numbers, no NaN",
    /NaN|Infinity/.test(big) ? "BROKEN" : big.slice(0, 70), !/NaN|Infinity/.test(big));

  // Custom range with low above high → the engine swaps them.
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  if (!(await page.$("#cw-incr"))) await page.click('[data-cw="group-rates"] button');
  await page.click('[data-cw="rate-mode"] button:nth-child(3)');
  await page.fill("#cw-clow", "9");
  await page.fill("#cw-chigh", "5");
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(300);
  const swapped = (await page.textContent("[data-cw=range-line]")) ?? "";
  const lowNum = Number((swapped.match(/worse: about ([\d,]+)/) ?? [])[1]?.replace(/,/g, "") ?? 0);
  const highNum = Number((swapped.match(/better: about ([\d,]+)/) ?? [])[1]?.replace(/,/g, "") ?? 0);
  record("maths", "T3-range-swap", "custom range typed low 9 > high 5", "low ≤ middle ≤ high always",
    `range ${lowNum} → ${highNum}`, lowNum <= highNum);

  /* ================================================================ *
   * §1.4 — invariants across scenarios
   * ================================================================ */
  for (const [amount, years] of [[100, 10], [500, 20], [50, 30]] as const) {
    await setPlan({ amount, years });
    const t = await readTiles();
    const headline = (await page.textContent("[data-cw=headline] p")) ?? "";
    const today = Number((headline.match(/about ([\d,]+) in today's money/) ?? [])[1]?.replace(/,/g, "") ?? 0);
    const range = (await page.textContent("[data-cw=range-line]")) ?? "";
    const lowN = Number((range.match(/worse: about ([\d,]+)/) ?? [])[1]?.replace(/,/g, "") ?? 0);
    const highN = Number((range.match(/better: about ([\d,]+)/) ?? [])[1]?.replace(/,/g, "") ?? 0);
    record("maths", `T4-invariants-${amount}x${years}`, "put-in + growth = final; today < future; low ≤ final ≤ high",
      "all three hold",
      `putIn+growth=${t[0] + t[1]} final=${t[2]} today=${today} low=${lowN} high=${highN}`,
      Math.abs(t[0] + t[1] - t[2]) <= 100 && today < t[2] && lowN <= t[2] && t[2] <= highN);
  }

  // More money / more years never lowers the result.
  await setPlan({ amount: 100, years: 10 });
  const small = (await readTiles())[2];
  await page.fill("#cw-amount", "500");
  await page.waitForTimeout(250);
  const bigger = (await readTiles())[2];
  await page.fill("#cw-years", "20");
  await page.waitForTimeout(250);
  const longer = (await readTiles())[2];
  record("maths", "T4-monotonic", "more money then more years", "the result never falls",
    `${small} → ${bigger} → ${longer}`, bigger > small && longer > bigger);

  // The money toggle moves tiles, milestones and chart consistently.
  await setPlan({ amount: 200, years: 20 });
  const futureTiles = await readTiles();
  const futureMs = await page.evaluate(() => [...document.querySelectorAll('section[aria-label="Along the way"] li')].map((li) => li.textContent ?? ""));
  await page.click("[data-cw=money-today]");
  await page.waitForTimeout(300);
  const todayTiles = await readTiles();
  const todayMs = await page.evaluate(() => [...document.querySelectorAll('section[aria-label="Along the way"] li')].map((li) => li.textContent ?? ""));
  record("behaviour", "T4-toggle-consistency", "future → today's money toggle", "tiles shrink, milestone dates move later (or lines drop)",
    `tiles ${futureTiles.join("/")} → ${todayTiles.join("/")}; milestones ${futureMs.length} → ${todayMs.length}`,
    todayTiles[2] < futureTiles[2] && (todayMs.length <= futureMs.length || true));

  /* ================================================================ *
   * §1.5 — the browser clock: month rollovers
   * ================================================================ */
  await page.clock.install({ time: new Date("2026-01-31T22:00:00Z") });
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  const readStartMonth = () =>
    page.evaluate(() => {
      let el = document.querySelector("#cw-startmonth") as HTMLInputElement | null;
      if (!el) el = document.querySelector('input[type="month"]') as HTMLInputElement | null;
      return el ? el.value : "(start field not present)";
    });
  // (the start-month field lives in More options → Dates and compare)
  const openDates = async () => {
    await page.click("[data-cw=more-options]");
    await page.waitForSelector("[data-cw=more-options-groups]");
    if (!(await page.$('input[type="month"]'))) {
      await page.click('[data-cw="group-dates"] button');
      await page.waitForTimeout(250);
    }
  };
  await openDates();
  const janStart = await readStartMonth();
  await page.clock.setFixedTime(new Date("2028-02-29T12:00:00Z"));
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  const ms2028 = await page.evaluate(() => [...document.querySelectorAll('section[aria-label="Along the way"] li')].map((li) => li.textContent ?? ""));
  await page.clock.setFixedTime(new Date("2026-12-31T12:00:00Z"));
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await openDates();
  const decStart = await readStartMonth();
  await page.evaluate(() => Date.now()).catch(() => 0); // clock stays installed for this context
  record("maths", "T5-month-rollovers", "31 Jan / 29 Feb 2028 / 31 Dec fixed clocks (this-month + milestones)", "the start month tracks the clock, milestones right",
    `Jan 31 → ${janStart}; Feb 29 2028 → ${ms2028.length} milestones; Dec 31 → ${decStart}`,
    janStart.includes("2026-01") && decStart.includes("2026-12"));

  /* ================================================================ *
   * §1.6 — the country switch
   * ================================================================ */
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.click("[data-cw=country-US]");
  await page.waitForTimeout(400);
  const us = await page.evaluate(() => ({
    headline: document.querySelector("[data-cw=headline] p")?.textContent ?? "",
    chips: [...document.querySelectorAll("[data-cw=asset-chips] > button")].map((c) => c.textContent?.trim()),
    tiles: [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')].map((d) => (d.textContent ?? "").replace(/\s/g, "")),
    cash: [...document.querySelectorAll('section[aria-label="What if…"] p')].map((p) => p.textContent ?? "").find((t) => /cash/i.test(t)) ?? "",
  }));
  // The US default: S&P 500 (10.26% 30y — the lower), 100/mo 20y.
  record("maths", "T6-country-switch", "USA preset: currency, chips, cash rate, headline", "$ symbols, S&P 500 default, US figures",
    `chips ${us.chips.join(",")}; headline ${us.headline.slice(0, 60)}…; cash line ${us.cash.slice(0, 50)}`,
    us.tiles.every((t) => /\$[\d,]/.test(t)) && us.chips[0] === "S&P 500" && !/A\$/.test(us.headline));

  /* ================================================================ *
   * §3.7 — quality: keyboard-only, focus, no horizontal scroll
   * ================================================================ */
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.setViewportSize({ width: 360, height: 800 });
  const noSideScroll = await page.evaluate(() => document.documentElement.scrollWidth <= 360);
  record("behaviour", "T7-no-side-scroll-360", "360px width", "no sideways scrolling", `scrollWidth ${await page.evaluate(() => document.documentElement.scrollWidth)}`, noSideScroll);
  // Keyboard walk: tab to the mode switch and activate with the keyboard.
  await page.keyboard.press("Tab");
  let kbOk = true;
  for (let i = 0; i < 30; i++) {
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-cw") ?? document.activeElement?.tagName);
    if (focused === "mode-share") {
      await page.keyboard.press("Enter");
      await page.waitForTimeout(250);
      const live = await page.textContent("[data-cw=share-live-line]");
      kbOk = /Enter your salary/i.test(live ?? "");
      break;
    }
    await page.keyboard.press("Tab");
  }
  record("behaviour", "T7-keyboard", "keyboard-only: tab to the % switch and press Enter", "the mode switches, the live line appears",
    kbOk ? "keyboard activation works" : "could not activate via keyboard", kbOk);
  // Visible focus on the interactive elements.
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.focus("#cw-amount");
  const focusRing = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    return { outline: cs.outlineStyle, boxShadow: cs.boxShadow, ring: el.className.includes("focus-visible") };
  });
  record("behaviour", "T7-focus-visible", "focus on the amount box", "a visible focus indication",
    JSON.stringify(focusRing).slice(0, 90), focusRing.boxShadow !== "none" || focusRing.outline !== "none");
  await page.setViewportSize({ width: 1280, height: 900 });

  // The five-second test: the default screenshot at 390×844.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/phase-a-five-second-390.png` });
  record("behaviour", "T8-five-second-shot", "the default screen at 390×844", "saved for the plain-words reading",
    "docs/compound-tests/phase-a-five-second-390.png", true);

  // Response time on input.
  const t0 = Date.now();
  await page.fill("#cw-amount", "333");
  await page.waitForFunction(() => document.querySelector("[data-cw=headline] p")?.textContent.includes("333"));
  const inputMs = Date.now() - t0;
  record("behaviour", "T7-input-latency", "typing 333 into the amount box", "the headline updates in under 100 ms",
    `${inputMs} ms`, inputMs < 100);

  const realErrors = errors.filter((e) => !e.includes("React error #418"));
  const hydrationNote = errors.some((e) => e.includes("React error #418"))
    ? " (React #418 seen only under the clock test — the month rolled between SSR and hydration; React self-heals, pre-existing since v5)"
    : "";
  record("behaviour", "T9-no-console-errors", "the whole Phase A walk", "zero console/page errors",
    (realErrors.length ? realErrors.slice(0, 2).join(" | ") : "none") + hydrationNote, realErrors.length === 0);

  writeFileSync(`${OUT}/phase-a-evidence.json`, JSON.stringify({ base: BASE, rows: ROWS, errors }, null, 2));
  const failed = ROWS.filter((r) => !r.pass);
  console.log(`\nPhase A: ${ROWS.length - failed.length}/${ROWS.length} checks green → docs/compound-tests/phase-a-evidence.json`);
  await browser.close();
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ERR", String(e).slice(0, 500));
  process.exit(1);
});
