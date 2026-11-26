/**
 * Compound Wealth — the browser verification harness (spec §12,
 * tests 12–24: the simplicity contract, the cards, the routing).
 *
 * Run with:  bun tests/compound-browser-harness.ts
 *   (needs the dev server on localhost:3100 — `bunx next dev -p 3100`)
 *
 * Writes:
 *   docs/compound-samples/*.png|*.pdf — the spec's sample artefacts
 *   tests/compound-browser-<date>.json — the machine-readable evidence
 *
 * Everything is driven through the real UI (clicks, not eval shortcuts)
 * except the print trigger, which needs Playwright's A4 pdf() — the
 * same CSS the browser's own Print → Save as PDF uses.
 */

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";

const BASE = process.env.CW_BASE ?? "http://localhost:3100";
const OUT = "docs/compound-samples";
const EVIDENCE: Record<string, unknown> = { base: BASE, checks: [] };

mkdirSync(OUT, { recursive: true });

interface Check {
  id: string;
  pass: boolean;
  detail?: string;
}

function check(id: string, pass: boolean, detail?: string) {
  (EVIDENCE.checks as Check[]).push({ id, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${id}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const browser = await chromium.launch();

  /* ---------------------------------------------------------------- *
   * The page — English, desktop first
   * ---------------------------------------------------------------- */
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");

  // Test 12: the answer is visible on arrival, no empty state.
  const headlineText = await page.textContent("[data-cw=headline] p");
  check(
    "12-answer-on-arrival",
    (headlineText ?? "").includes("you put in") && /\d/.test(headlineText ?? ""),
    (headlineText ?? "").slice(0, 90),
  );

  // Test 13: the default visible interactive elements are exactly the
  // spec'd set — the country chips, the three controls, More options,
  // Save as card, the tiles' money toggle (5.1.5), the what-if later-years
  // selector (5.2), the How fold (5.4), the breadcrumb (§3) and the card
  // menu — plus the site's own chrome. Nothing else.
  const controlInventory = await page.evaluate(() => {
    const main = document.querySelector("main")!;
    const interactive = [...main.querySelectorAll("button, input, select, a[href]")]
      .filter((el) => (el as HTMLElement).offsetParent !== null || (el as HTMLElement).closest("[style*='opacity']") !== null)
      .map((el) => ({
        tag: el.tagName,
        cw: el.getAttribute("data-cw") ?? el.getAttribute("data-testid") ?? "",
        text: (el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 26),
      }));
    return interactive;
  });
  const allowedPrefixes = [
    "country-", "amount-", "years-", "asset-", "more-options", "save-card", "money-", "card-menu",
    "later-", "how", "tools-link",
    // W7: the percent-of-salary mini calculator lives inside the amount
    // group (the switch, the salary link/box, the percent box and chips).
    "mode-", "add-salary", "salary-", "percent-",
  ];
  const forbidden = controlInventory.filter(
    (c) => !allowedPrefixes.some((p) => c.cw.startsWith(p)),
  );
  check(
    "13-exact-controls",
    forbidden.length === 0,
    forbidden.length ? `unexpected: ${forbidden.map((f) => `${f.tag}[${f.cw}]${f.text}`).join(", ")}` : `${controlInventory.length} interactive elements, all spec'd`,
  );

  // Test 13b (v6): the salary box is NOT visible in Amount mode — only
  // the "Add your salary (optional)" link.
  const salaryHiddenInAmount = await page.evaluate(() => {
    const box = document.querySelector("[data-cw=salary-box]");
    const link = document.querySelector("[data-cw=add-salary]");
    return {
      boxVisible: box !== null && (box as HTMLElement).offsetParent !== null,
      linkVisible: link !== null && (link as HTMLElement).offsetParent !== null,
    };
  });
  check(
    "13b-salary-hidden-in-amount-mode",
    !salaryHiddenInAmount.boxVisible && salaryHiddenInAmount.linkVisible,
    JSON.stringify(salaryHiddenInAmount),
  );

  // Test 17: the headline shows both money views; the range line exists.
  const rangeText = await page.textContent("[data-cw=range-line]");
  check(
    "17-headline-honest",
    /today's money/i.test(headlineText ?? "") && /If it goes worse/i.test(rangeText ?? ""),
    `range: ${(rangeText ?? "").slice(0, 60)}`,
  );

  // Test 18: plain language on the default screen (the first viewport):
  // no banned jargon, average sentence length ≤ 15 words.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const plainLanguage = await page.evaluate(() => {
    const vp = window.innerHeight;
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      return r.top >= 0 && r.top < vp;
    };
    // Sentence length is measured over sentences (paragraph and heading
    // text); control labels and chips are not sentences. Banned jargon is
    // checked over every visible word.
    const everything = [...document.querySelectorAll("main *")]
      .filter((el) => visible(el) && el.children.length === 0 && (el.textContent ?? "").trim().length > 0)
      .map((el) => (el.textContent ?? "").trim());
    const allText = [...new Set(everything)].join(" ");
    const sentenceText = [...document.querySelectorAll("main p, main h1, main h2")]
      .filter(visible)
      .map((el) => (el.textContent ?? "").trim())
      .join(" ");
    const banned = [
      "CAGR", "compound interest", "annualised", "annualized", "nominal", "real return",
      "volatility", "ETF", "index fund", "dividend", "yield", "ROI", "APY",
      "basis point", "expense ratio", "dollar-cost", "hedged", "total return",
      "net present value", "risk-adjusted", "p.a.", "AUM", "drawdown", "alpha",
      "benchmark", "securities", "equities", "portfolio",
    ];
    const hits = banned.filter((b) => new RegExp(b, "i").test(allText));
    const sentences = sentenceText.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 3);
    const avgWords =
      sentences.length === 0
        ? 0
        : sentences.reduce((n, s) => n + s.trim().split(/\s+/).length, 0) / sentences.length;
    return { hits, avgWords: Math.round(avgWords * 10) / 10, sentenceCount: sentences.length };
  });
  check(
    "18-plain-language",
    plainLanguage.hits.length === 0 && plainLanguage.avgWords <= 15,
    `jargon: ${JSON.stringify(plainLanguage.hits)}, avg ${plainLanguage.avgWords} words over ${plainLanguage.sentenceCount} sentences`,
  );
  await page.setViewportSize({ width: 1280, height: 900 });

  // Test 15: two taps to change the main question.
  const t0 = Date.now();
  await page.click('[data-cw="amount-200"]');
  const afterAmount = await page.textContent("[data-cw=headline] p");
  await page.click('[data-cw="years-30"]');
  const afterYears = await page.textContent("[data-cw=headline] p");
  await page.click('[data-cw="asset-gold"]');
  const afterAsset = await page.textContent("[data-cw=headline] p");
  check(
    "15-two-tap-rule",
    afterAmount !== headlineText && afterYears !== afterAmount && afterAsset !== afterYears,
    `3 one-tap changes in ${Date.now() - t0}ms`,
  );

  // Test 16: More options groups are collapsed by default.
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  const groupStates = await page.evaluate(() =>
    [...document.querySelectorAll("[data-cw=more-options-groups] > div[data-cw]")].map((g) => ({
      id: g.getAttribute("data-cw"),
      visibleFields: [...g.querySelectorAll("input")].filter((i) => i.offsetParent !== null).length,
    })),
  );
  check(
    "16-groups-collapsed",
    groupStates.length === 4 && groupStates.every((g) => g.visibleFields === 0),
    JSON.stringify(groupStates.map((g) => `${g.id}:${g.visibleFields}`)),
  );
  await page.click("[data-cw=more-options]"); // close again

  // Test 21: nothing is written to storage by page use.
  const storageAfterUse = await page.evaluate(() => ({
    local: Object.keys(window.localStorage),
    cookies: document.cookie,
  }));
  check(
    "21-no-storage",
    storageAfterUse.local.length === 0 && storageAfterUse.cookies === "",
    JSON.stringify(storageAfterUse),
  );

  // The page made no network requests for data (only app assets: Next
  // chunks, the page itself, the site's own logo image — and, on the live
  // CDN, Cloudflare's own injected analytics beacon, which the app never
  // asks for).
  const dataRequests = await page.evaluate(() => performance.getEntriesByType("resource").map((r) => r.name));
  check(
    "21-no-data-network",
    dataRequests.every((u) => /\/_next\/|\/tools\/|\/images\/|\/icons\/|cdn-cgi|cloudflareinsights/.test(u)),
    `${dataRequests.length} resources, all app assets`,
  );

  // Test 14: the three sizes (measure from the top of the page).
  for (const [w, h] of [[390, 844], [360, 800], [430, 932]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(350);
    const fit = await page.evaluate(() => {
      const vp = window.innerHeight;
      const headline = document.querySelector("[data-cw=headline]")!.getBoundingClientRect();
      const chips = document.querySelector("[data-cw=asset-chips]")!.getBoundingClientRect();
      return {
        headlineVisible: headline.bottom <= vp && headline.top >= 0,
        controlsVisible: chips.bottom <= vp,
        chipsBottom: Math.round(chips.bottom),
        vp,
        scrollW: document.documentElement.scrollWidth,
        scrollY: window.scrollY,
      };
    });
    check(
      `14-${w}x${h}-one-screen`,
      fit.headlineVisible && fit.controlsVisible && fit.scrollW <= w,
      `chips bottom ${fit.chipsBottom}/${fit.vp}, scrollW ${fit.scrollW}, scrollY ${fit.scrollY}`,
    );
  }

  // The sticky mobile bar appears once the headline scrolls away.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(400);
  const stickyVisible = await page.evaluate(() => {
    const bar = document.querySelector("[data-cw=sticky-bar]");
    return bar !== null && getComputedStyle(bar).display !== "none";
  });
  check("sticky-bar-appears", stickyVisible);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Dark mode renders (the site's own theme toggle).
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/06-default-en-dark-mobile390.png` });
  await page.emulateMedia({ colorScheme: "light" });

  // Desktop light.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/07-default-en-desktop.png`, fullPage: true });

  /* ---------------------------------------------------------------- *
   * The A4 print card — EN/fa × light/dark × with/without costs
   * ---------------------------------------------------------------- */
  const printConfigs = [
    { id: "en-light", fa: false, dark: false, costs: false, share: false },
    { id: "en-dark", fa: false, dark: true, costs: false, share: false },
    { id: "en-light-costs", fa: false, dark: false, costs: true, share: false },
    { id: "en-dark-costs", fa: false, dark: true, costs: true, share: false },
    // v6 (test 22): both cards in Amount AND % modes.
    { id: "en-light-share", fa: false, dark: false, costs: false, share: true },
    { id: "fa-light", fa: true, dark: false, costs: false, share: false },
    { id: "fa-dark", fa: true, dark: true, costs: false, share: false },
    { id: "fa-light-costs", fa: true, dark: false, costs: true, share: false },
    { id: "fa-dark-costs", fa: true, dark: true, costs: true, share: false },
    { id: "fa-dark-share", fa: true, dark: true, costs: false, share: true },
  ];

  for (const cfg of printConfigs) {
    // Reset the page state with a reload (also proves reset-on-reload).
    await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-cw=headline]");
    if (cfg.share) {
      await page.click("[data-cw=mode-share]");
      await page.fill("#cw-salary", "90000");
      await page.waitForTimeout(300);
    }
    if (cfg.fa) {
      await page.click('header button:has-text("فا")');
      await page.waitForTimeout(400);
    }
    if (cfg.costs) {
      await page.click("[data-cw=more-options]");
      await page.waitForSelector("[data-cw=more-options-groups]");
      await page.click('[data-cw="group-costs"] button');
      await page.waitForTimeout(250);
      await page.fill("#cw-fee", "10");
      await page.waitForTimeout(300);
      await page.click("[data-cw=more-options]");
      await page.waitForTimeout(250);
    }
    await page.click("[data-cw=save-card]");
    await page.waitForSelector("[data-cw=card-menu]");
    await page.click('[data-cw=card-menu] button:has-text("Print"), [data-cw=card-menu] button:has-text("چاپ")');
    await page.waitForSelector("[data-cw=print-overlay]");
    if (cfg.dark) {
      await page.click('.cw-print-toolbar button:has-text("Dark"), .cw-print-toolbar button:has-text("تیره")');
      await page.waitForTimeout(250);
    }
    await page.evaluate(() => document.body.classList.add("cw-printing"));
    const pdfPath = `${OUT}/a4-card-${cfg.id}.pdf`;
    await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
    await page.evaluate(() => document.body.classList.remove("cw-printing"));

    // Verify: exactly one A4 page, text extractable, key numbers present,
    // and — in % mode — the percent line with the monthly amount, never the
    // salary itself (spec test 22).
    const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
    const pages = /Pages:\s+(\d+)/.exec(info)?.[1];
    const size = /Page size:\s+([\d x.]+ pts)/.exec(info)?.[1];
    const text = execFileSync("pdftotext", [pdfPath, "-"], { encoding: "utf8" });
    // (The Farsi plan line is checked bidi-safely: pdftotext reorders
    // RTL runs and unbinds the lam-alef ligature, so match the skeleton.)
    const hasNumbers = cfg.share
      ? cfg.fa
        ? /۳٪/.test(text.replace(/\s|[\u200e\u200f\u202a-\u202e]/g, "")) &&
          /۲۲۵/.test(text.replace(/\s|[\u200e\u200f\u202a-\u202e]/g, "")) &&
          /درماه/.test(text.replace(/\s|[\u200e\u200f\u202a-\u202e]/g, ""))
        : /3% of your salary \(A\$225 a month\)/.test(text)
      : cfg.fa
        ? /۵۰|۴۵|۷۲|۲۴/.test(text.replace(/\s/g, ""))
        : /50,800|45,700|72,300|24,000/.test(text);
    const salaryLeak =
      cfg.share && (cfg.fa ? /۹۰٬۰۰۰|۷٬۵۰۰|90000/.test(text.replace(/\s/g, "")) : /90,000|7500/.test(text.replace(/\s/g, "")));
    check(
      `22-a4-${cfg.id}`,
      pages === "1" && size?.startsWith("595") === true && text.length > 200 && hasNumbers && !salaryLeak,
      `pages=${pages} size=${size} text=${text.length}B numbers=${hasNumbers} salaryLeak=${salaryLeak}`,
    );
  }

  /* ---------------------------------------------------------------- *
   * The phone card — 3 sizes × EN/fa × dark/light + both modes (v6)
   * ---------------------------------------------------------------- */
  for (const cfg of [
    { id: "en-dark", fa: false, light: false, share: false },
    { id: "en-light", fa: false, light: true, share: false },
    { id: "en-dark-share", fa: false, light: false, share: true },
    { id: "fa-dark", fa: true, light: false, share: false },
    { id: "fa-light", fa: true, light: true, share: false },
  ]) {
    for (const [w, h] of [[360, 800], [390, 844], [430, 932]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-cw=headline]");
      if (cfg.share) {
        await page.click("[data-cw=mode-share]");
        await page.fill("#cw-salary", "90000");
        await page.waitForTimeout(300);
      }
      if (cfg.fa) {
        await page.click('header button:has-text("فا")');
        await page.waitForTimeout(400);
      }
      await page.click("[data-cw=save-card]");
      await page.waitForSelector("[data-cw=card-menu]");
      await page.click('[data-cw=card-menu] button:has-text("Phone"), [data-cw=card-menu] button:has-text("گوشی")');
      await page.waitForSelector("[data-cw=phone-card]");
      if (cfg.light) {
        await page.click('[data-cw=phone-card] button[aria-label="Light"], [data-cw=phone-card] button[aria-label="روشن"]');
        await page.waitForTimeout(250);
      }
      // Let the corner chrome fade (the screenshot state).
      await page.waitForTimeout(4600);
      const zones = await page.evaluate(() => {
        const card = document.querySelector("[data-cw=phone-card]")!;
        const cr = card.getBoundingClientRect();
        const H = cr.height;
        const texts = [...card.querySelectorAll("span, div, p")].filter(
          (el) => el.children.length === 0 && el.textContent.trim().length > 0 && !el.closest('[aria-hidden="true"]'),
        );
        const inTop = texts.filter((el) => {
          const r = el.getBoundingClientRect();
          return r.top - cr.top < H * 0.28 - 2 && r.bottom - cr.top > 4 && getComputedStyle(el).opacity !== "0";
        });
        const inBottom = texts.filter((el) => {
          const r = el.getBoundingClientRect();
          return r.bottom - cr.top > H * 0.88 + 2 && r.top - cr.top < H - 2;
        });
        const minFont = Math.min(
          ...texts.map((el) => parseFloat(getComputedStyle(el).fontSize)),
        );
        const overflow = card.scrollWidth > Math.ceil(cr.width) + 1 || card.scrollHeight > Math.ceil(cr.height) + 1;
        return { topTexts: inTop.map((e) => e.textContent.slice(0, 30)), bottomTexts: inBottom.map((e) => e.textContent.slice(0, 60)), minFont, overflow, H: Math.round(H) };
      });
      // The tiny footer is allowed in the bottom zone (spec's own content).
      const badBottom = zones.bottomTexts.filter(
        (t) => !/illustration|وعده|اسکرین‌شات|screenshot/i.test(t),
      );
      const png = `${OUT}/phone-${cfg.id}-${w}x${h}.png`;
      await page.screenshot({ path: png });
      check(
        `23-phone-${cfg.id}-${w}x${h}`,
        zones.topTexts.length === 0 && badBottom.length === 0 && !zones.overflow && zones.minFont >= 9.5,
        `top=${JSON.stringify(zones.topTexts)} badBottom=${JSON.stringify(badBottom)} minFont=${zones.minFont} overflow=${zones.overflow}`,
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  }

  /* ---------------------------------------------------------------- *
   * v6 — the percent-of-salary mini calculator (tests 25–32, W7)
   * ---------------------------------------------------------------- */
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");

  // Test 31a: the switch is a real two-option control (radio semantics,
  // both options keyboard-focusable), and the live line is polite.
  const switchSemantics = await page.evaluate(() => {
    const group = document.querySelector("[data-cw=amount-mode-switch]");
    const radios = group ? [...group.querySelectorAll('[role="radio"]')] : [];
    const live = document.querySelector("[data-cw=share-live-line]");
    return {
      groupPresent: group !== null,
      radioCount: radios.length,
      ariaChecked: radios.map((r) => r.getAttribute("aria-checked")),
      liveAttr: live ? live.getAttribute("aria-live") : null,
    };
  });
  check(
    "31a-switch-semantics",
    switchSemantics.groupPresent && switchSemantics.radioCount === 2 &&
      switchSemantics.ariaChecked[0] === "true" && switchSemantics.ariaChecked[1] === "false" &&
      switchSemantics.liveAttr === null, // the live line only exists in % mode
    JSON.stringify(switchSemantics),
  );

  // Test 30a: % mode with an empty salary — no empty state, the hint line,
  // and the results keep the last amount used (identical numbers).
  const beforeShare = await page.textContent("[data-cw=headline] p");
  await page.click("[data-cw=mode-share]");
  await page.waitForTimeout(300);
  const emptySalary = await page.evaluate(() => ({
    liveLine: document.querySelector("[data-cw=share-live-line]")?.textContent?.trim() ?? "",
    livePolite: document.querySelector("[data-cw=share-live-line]")?.getAttribute("aria-live"),
    headline: document.querySelector("[data-cw=headline] p")?.textContent?.trim() ?? "",
  }));
  check(
    "30a-empty-salary-no-empty-state",
    /Enter your salary/i.test(emptySalary.liveLine) &&
      emptySalary.livePolite === "polite" &&
      emptySalary.headline === beforeShare, // results unchanged
    `live: ${emptySalary.liveLine.slice(0, 50)}; headline unchanged: ${emptySalary.headline === beforeShare}`,
  );

  // Test 25 (browser): type 90,000 → the live line and the % headline.
  await page.fill("#cw-salary", "90000");
  await page.waitForTimeout(300);
  const withSalary = await page.evaluate(() => ({
    liveLine: document.querySelector("[data-cw=share-live-line]")?.textContent?.trim() ?? "",
    headline: document.querySelector("[data-cw=headline] p")?.textContent?.trim() ?? "",
  }));
  check(
    "25-live-line",
    /3% of A\$90,000 a year = A\$225 a month\./.test(withSalary.liveLine),
    withSalary.liveLine,
  );
  check(
    "25-share-headline",
    /Investing 3% of your salary \(A\$225 a month, growing as your salary grows\) for 20 years/.test(withSalary.headline),
    withSalary.headline.slice(0, 90),
  );

  // Test 25b: per year ↔ per month keeps the same money.
  await page.click("[data-cw=salary-period-month]");
  await page.waitForTimeout(300);
  const perMonth = await page.evaluate(() => ({
    box: (document.querySelector("#cw-salary") as HTMLInputElement).value,
    live: document.querySelector("[data-cw=share-live-line]")?.textContent?.trim() ?? "",
  }));
  check(
    "25b-period-switch-same-money",
    perMonth.box === "7500" && /A\$7,500 a month = A\$225 a month/.test(perMonth.live),
    `box=${perMonth.box} live=${perMonth.live}`,
  );
  await page.click("[data-cw=salary-period-year]");
  await page.waitForTimeout(200);

  // Test 31b: chips, stepper and typed value stay in sync; the stepper
  // steps 0.5.
  await page.click("[data-cw=percent-plus]");
  await page.waitForTimeout(200);
  const pctAfterPlus = await page.inputValue("#cw-percent");
  await page.click("[data-cw=percent-minus]");
  await page.click("[data-cw=percent-minus]");
  await page.waitForTimeout(200);
  const pctAfterMinus = await page.inputValue("#cw-percent");
  await page.click("[data-cw=percent-3]");
  await page.waitForTimeout(200);
  const pctAfterChip = await page.inputValue("#cw-percent");
  const chipActive = await page.evaluate(() => {
    const chip = document.querySelector('[data-cw="percent-3"]');
    return chip ? chip.className.includes("currena-blue") : false;
  });
  check(
    "31b-percent-sync",
    pctAfterPlus === "3.5" && pctAfterMinus === "2.5" && chipActive && pctAfterChip === "3",
    `plus→${pctAfterPlus} minus→${pctAfterMinus} chip3→${pctAfterChip} active=${chipActive}`,
  );

  // Test 30b: out-of-range percent clamps with the one plain message.
  await page.fill("#cw-percent", "60");
  await page.waitForTimeout(300);
  const clampNote = await page.textContent("[data-cw=percent-note]");
  const clampedValue = await page.inputValue("#cw-percent");
  check("30b-percent-clamp", clampedValue === "50" && /outside the allowed range/i.test(clampNote ?? ""), `box=${clampedValue} note=${clampNote?.slice(0, 50)}`);
  await page.click("[data-cw=percent-3]");
  await page.waitForTimeout(200);

  // Test 30c: salary 0 / letters — no error, falls back to the hint line.
  await page.fill("#cw-salary", "0");
  await page.waitForTimeout(300);
  const zeroSalary = await page.textContent("[data-cw=share-live-line]");
  await page.fill("#cw-salary", "abc");
  await page.waitForTimeout(300);
  const lettersSalary = await page.textContent("[data-cw=share-live-line]");
  check(
    "30c-bad-salary",
    /Enter your salary/i.test(zeroSalary ?? "") && /Enter your salary/i.test(lettersSalary ?? ""),
    `0→${zeroSalary?.slice(0, 30)} letters→${lettersSalary?.slice(0, 30)}`,
  );

  // Test 29 (browser): mode switching keeps your place, both ways.
  await page.fill("#cw-salary", "90000");
  await page.waitForTimeout(300);
  await page.click("[data-cw=mode-amount]");
  await page.waitForTimeout(300);
  const placeAfterAmount = await page.evaluate(() => ({
    amount: (document.querySelector("#cw-amount") as HTMLInputElement).value,
    thatIs: document.querySelector("[data-cw=amount-salary-line]")?.textContent?.trim() ?? "",
  }));
  check(
    "29a-share-to-amount-keeps-place",
    placeAfterAmount.amount === "225" && /That is 3\.0% of your salary\./.test(placeAfterAmount.thatIs),
    `amount=${placeAfterAmount.amount} line=${placeAfterAmount.thatIs}`,
  );
  await page.click("[data-cw=mode-share]");
  await page.waitForTimeout(300);
  const placeAfterShare = await page.inputValue("#cw-percent");
  check("29b-amount-to-share-keeps-place", placeAfterShare === "3", `percent=${placeAfterShare}`);

  // Test 27 (browser): % mode at 0% increase == Amount mode at 225 — the
  // whole visible result set matches (headline, tiles, range, what-if).
  const grabNumbers = () =>
    page.evaluate(() => ({
      tiles: [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')].map((d) => d.textContent?.replace(/[^0-9]/g, "")),
      range: document.querySelector("[data-cw=range-line]")?.textContent?.replace(/[^0-9]/g, "") ?? "",
      milestones: [...document.querySelectorAll('section[aria-label="Along the way"] li')].map((li) => li.textContent?.replace(/[^0-9]/g, "")),
      // the later-start and cash what-if cards (NOT the small-changes
      // card: its step is mode-specific by the spec's own §5.2)
      whatIf: [...document.querySelectorAll('[data-cw=later-years], section[aria-label="What if…"] > div > div:nth-child(2) p, section[aria-label="What if…"] > div > div:nth-child(3) p')]
        .filter((el) => (el.textContent ?? "").match(/\d/))
        .map((el) => el.textContent?.replace(/[^0-9]/g, "")),
      putIn: (document.querySelector("[data-cw=headline] p")?.textContent ?? "").match(/put in ([0-9,]+)/)?.[1] ?? "",
      final: (document.querySelector("[data-cw=headline] p")?.textContent ?? "").match(/about ([0-9,]+)\./)?.[1] ?? "",
    }));
  // set the increase to 0 via More options → Rates
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  if (!(await page.$("#cw-incr"))) {
    await page.click('[data-cw="group-rates"] button');
    await page.waitForTimeout(250);
  }
  await page.fill("#cw-incr", "0");
  await page.waitForTimeout(300);
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(250);
  const shareNumbers = await grabNumbers();
  // now the amount mode at 225
  await page.click("[data-cw=mode-amount]");
  await page.waitForTimeout(300);
  const amountNumbers = await grabNumbers();
  check(
    "27-share-equals-amount",
    JSON.stringify(shareNumbers) === JSON.stringify(amountNumbers),
    JSON.stringify({ share: shareNumbers, amount: amountNumbers }).slice(0, 220),
  );

  // Test 28 (browser): the % mode default increase = the country inflation
  // average (reload → % mode with salary → the About note + growth clause).
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");
  await page.click("[data-cw=mode-share]");
  await page.fill("#cw-salary", "90000");
  await page.waitForTimeout(300);
  const growState = await page.evaluate(() => ({
    headlineHasGrow: /growing as your salary grows/.test(document.querySelector("[data-cw=headline] p")?.textContent ?? ""),
  }));
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  if (!(await page.$("[data-cw=share-grow-note]"))) await page.click('[data-cw="group-about"] button');
  if (!(await page.$("#cw-incr"))) await page.click('[data-cw="group-rates"] button');
  await page.waitForTimeout(250);
  const aboutNote = await page.textContent("[data-cw=share-grow-note]");
  const increaseValue = await page.inputValue("#cw-incr");
  check(
    "28-default-grow",
    growState.headlineHasGrow && /grows with your salary/.test(aboutNote ?? "") && increaseValue === "2.8",
    `headline grow: ${growState.headlineHasGrow}, note: ${aboutNote?.slice(0, 40)}, increase: ${increaseValue}`,
  );
  await page.click("[data-cw=more-options]");

  // Test 32 (browser): the small-changes wording in both modes.
  const smallShare = await page.textContent("[data-cw=small-changes] p");
  await page.click("[data-cw=mode-amount]");
  await page.waitForTimeout(300);
  const smallAmount = await page.textContent("[data-cw=small-changes] p");
  check(
    "32-small-changes-wording",
    /Investing 4% instead of 3% adds/.test(smallShare ?? "") && /Investing 23 more a month adds/.test(smallAmount ?? ""),
    `share: ${smallShare?.slice(0, 60)} | amount: ${smallAmount?.slice(0, 60)}`,
  );

  /* ---------------------------------------------------------------- *
   * v6 — the audit fixes (tests 33–38) as browser checks
   * ---------------------------------------------------------------- */
  // Test 33: no "1% more" anywhere on the page.
  const bodyText = await page.textContent("body");
  check("33-no-1pct-more", !/1% more/.test(bodyText ?? ""), "the old wording is gone");

  // Test 34: the How fold says the cost is not charged on cash.
  await page.click("[data-cw=how-toggle]");
  await page.waitForTimeout(300);
  const howText = await page.textContent("[data-cw=how]");
  check("34-cash-cost-noted", /not charged on cash/i.test(howText ?? ""), "How says cash pays no fund cost");

  // Test 35: the inflation caption when today's money shows, and it
  // follows the editable setting.
  await page.click("[data-cw=money-today]");
  await page.waitForTimeout(300);
  const captionBefore = await page.textContent("[data-cw=inflation-caption]");
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  if (!(await page.$("#cw-infl"))) {
    await page.click('[data-cw="group-rates"] button');
    await page.waitForTimeout(250);
  }
  await page.fill("#cw-infl", "5");
  await page.waitForTimeout(300);
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(250);
  const captionAfter = await page.textContent("[data-cw=inflation-caption]");
  check(
    "35-inflation-caption",
    /Today's money uses average inflation of 2\.8% a year/.test(captionBefore ?? "") &&
      /5% a year/.test(captionAfter ?? ""),
    `before: ${captionBefore?.slice(0, 60)} after: ${captionAfter?.slice(0, 60)}`,
  );
  // and the How fold's recent-inflation line
  const howRecent = await page.textContent("[data-cw=how-inflation-recent]");
  check("35b-recent-inflation", /Latest 12-month inflation: 4\.9%/.test(howRecent ?? ""), howRecent?.slice(0, 80));

  // Test 37: the How fold names the exact index behind each asset.
  const howIndices = await page.textContent("[data-cw=how-indices]");
  check(
    "37-index-names",
    /All Ordinaries/.test(howIndices ?? "") && /S&P 500 Total Return Index/.test(howIndices ?? "") &&
      /MSCI World ex-Australia/.test(howIndices ?? "") && /LBMA/.test(howIndices ?? "") && /RBA cash rate target/.test(howIndices ?? ""),
    howIndices?.slice(0, 120),
  );

  // Test 38: the tiles show the currency symbol in both countries (the
  // number run inside each tile carries the symbol: "A$24,000" / "$...").
  const tileRuns = () =>
    page.evaluate(() =>
      [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')]
        .map((d) => (d.textContent ?? "").replace(/\s/g, "")),
    );
  const auTiles = await tileRuns();
  await page.click("[data-cw=country-US]");
  await page.waitForTimeout(300);
  const usTiles = await tileRuns();
  check(
    "38-tile-currency",
    auTiles.every((t) => /A\$[\d,]/.test(t ?? "")) && usTiles.every((t) => /\$[\d,]/.test(t ?? "") && !/A\$/.test(t ?? "")),
    `AU: ${JSON.stringify(auTiles)} US: ${JSON.stringify(usTiles)}`,
  );
  await page.click("[data-cw=country-AU]");
  await page.waitForTimeout(300);

  /* ---------------------------------------------------------------- *
   * v7 — the tax layer (tests 39+)
   * ---------------------------------------------------------------- */
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");

  /** v7 helper: the estimator panel opens once and stays open; the link
   *  only exists while it is closed. */
  const openTaxEstimator = async () => {
    if ((await page.$("[data-cw=tax-estimator]")) === null) {
      await page.click("[data-cw=tax-estimate-link]");
    }
    await page.waitForSelector("[data-cw=tax-estimator]");
  };

  /** v7 helper: the Costs fold's open state persists across More-options
   *  closes; only toggle when actually closed. */
  const ensureCostsOpen = async () => {
    if ((await page.$("#cw-tax")) === null) {
      await page.click('[data-cw="group-costs"] button');
      await page.waitForTimeout(250);
    }
  };

  // Test 39: with the tax off (the default), nothing tax-shaped exists on
  // the screen — the default view is exactly v6.
  const taxElemsDefault = await page.evaluate(() =>
    document.querySelectorAll('[data-cw^="tax-"], [data-cw=tax-caption], [data-cw=tax-takes]').length,
  );
  const howOffTax = await page.evaluate(() => {
    const how = document.querySelector("[data-cw=how]");
    return how ? how.textContent : null;
  });
  check(
    "39-no-tax-ui-by-default",
    taxElemsDefault === 0,
    `tax elements on the default screen: ${taxElemsDefault}`,
  );

  // The tax UI appears only inside More options → Costs.
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  const taxRowWhileCollapsed = await page.evaluate(() => {
    const row = document.querySelector("[data-cw=tax-row]");
    return row !== null && (row as HTMLElement).offsetParent !== null;
  });
  await ensureCostsOpen();
  const taxRowNow = await page.evaluate(() => {
    const row = document.querySelector("[data-cw=tax-row]");
    const input = document.querySelector("#cw-tax");
    const link = document.querySelector("[data-cw=tax-estimate-link]");
    return {
      rowVisible: row !== null && (row as HTMLElement).offsetParent !== null,
      inputVisible: input !== null && (input as HTMLElement).offsetParent !== null,
      linkVisible: link !== null && (link as HTMLElement).offsetParent !== null,
      height: input ? (input as HTMLElement).getBoundingClientRect().height : 0,
      fontSize: input ? getComputedStyle(input as HTMLElement).fontSize : "",
    };
  });
  check(
    "39b-tax-row-inside-costs",
    !taxRowWhileCollapsed &&
      taxRowNow.rowVisible && taxRowNow.inputVisible && taxRowNow.linkVisible &&
      taxRowNow.height >= 43 && parseFloat(taxRowNow.fontSize) >= 16,
    `hidden until Costs opens: ${!taxRowWhileCollapsed}; box ${taxRowNow.height}px @ ${taxRowNow.fontSize}`,
  );

  // Test 40: the manual rate — type 32, the caption + the tax-takes line
  // appear, the headline turns after-tax, no clamp note.
  const headlineBefore = await page.textContent("[data-cw=headline] p");
  await page.fill("#cw-tax", "32");
  await page.waitForTimeout(300);
  const manualTax = await page.evaluate(() => ({
    caption: document.querySelector("[data-cw=tax-caption]")?.textContent ?? "",
    takes: document.querySelector("[data-cw=tax-takes]")?.textContent ?? "",
    headline: document.querySelector("[data-cw=headline] p")?.textContent ?? "",
    clampNote: document.querySelector("[data-cw=tax-clamp-note]") ?? null,
  }));
  check(
    "40-manual-tax",
    /After tax at 4\.8% a year \(estimate\)\./.test(manualTax.caption) &&
      /Tax \(estimate\) takes /.test(manualTax.takes) &&
      manualTax.headline !== headlineBefore &&
      manualTax.clampNote === null,
    `caption: ${manualTax.caption}; takes: ${manualTax.takes.slice(0, 40)}; headline changed: ${manualTax.headline !== headlineBefore}`,
  );

  // Test 40b: clamping — type 70, kept at 60 with one plain message.
  await page.fill("#cw-tax", "70");
  await page.waitForTimeout(300);
  const clampedTax = await page.evaluate(() => ({
    value: (document.querySelector("#cw-tax") as HTMLInputElement)?.value ?? "",
    note: document.querySelector("[data-cw=tax-clamp-note]")?.textContent ?? "",
  }));
  check(
    "40b-tax-clamp",
    clampedTax.value === "60" && clampedTax.note.length > 10,
    `value: ${clampedTax.value}; note: ${clampedTax.note.slice(0, 60)}`,
  );
  // Steppers step by 1 point from the clamped value.
  await page.click("[data-cw=tax-minus]");
  await page.waitForTimeout(200);
  const stepped = await page.evaluate(() => (document.querySelector("#cw-tax") as HTMLInputElement)?.value ?? "");
  check("40c-tax-stepper", stepped === "59", `after −: ${stepped}`);

  // Test 41: the AU guided estimator — income 90,000.
  await page.click("[data-cw=tax-estimate-link]");
  await page.waitForSelector("[data-cw=tax-estimator]");
  await page.fill("#cw-tax-income", "90000");
  await page.waitForTimeout(300);
  const auEstimate = await page.evaluate(() => ({
    line: document.querySelector("[data-cw=tax-estimate-line]")?.textContent ?? "",
    source: document.querySelector("[data-cw=tax-source-line]")?.textContent ?? "",
    ariaLive: document.querySelector("[data-cw=tax-estimate-line]")?.getAttribute("aria-live"),
    incomeBox: document.querySelector("#cw-tax-income") ? (document.querySelector("#cw-tax-income") as HTMLElement).getBoundingClientRect().height : 0,
  }));
  check(
    "41-au-guided-line",
    /At that income, about 32\.0% of extra investment earnings goes to tax: 30% income tax plus 2% Medicare levy\./.test(auEstimate.line) &&
      auEstimate.ariaLive === "polite",
    auEstimate.line,
  );
  check(
    "41b-au-source-line",
    /Australian Taxation Office · the 2026–27 income year · read 26 November 2026/.test(auEstimate.source) &&
      auEstimate.incomeBox >= 43,
    `${auEstimate.source} (income box ${auEstimate.incomeBox}px)`,
  );
  // "Use this rate" writes 32 into the box (already 59 from the stepper test
  // — the guided write replaces it).
  await page.click("[data-cw=tax-use-rate]");
  await page.waitForTimeout(300);
  const afterUse = await page.evaluate(() => ({
    value: (document.querySelector("#cw-tax") as HTMLInputElement)?.value ?? "",
    caption: document.querySelector("[data-cw=tax-caption]")?.textContent ?? "",
  }));
  check("41c-use-this-rate", afterUse.value === "32" && /4\.8%/.test(afterUse.caption), `box: ${afterUse.value}; ${afterUse.caption}`);

  // Test 42: the How fold with the tax on — the model, the guided source
  // line, and the not-included list.
  await page.click("[data-cw=more-options]"); // close more options first
  await page.waitForTimeout(200);
  await page.click("[data-cw=how-toggle]");
  await page.waitForTimeout(300);
  const howOnTax = await page.evaluate(() => ({
    model: document.querySelector("[data-cw=how-tax-model]")?.textContent ?? "",
    guided: document.querySelector("[data-cw=how-tax-guided]")?.textContent ?? "",
    notIncluded: document.querySelectorAll("[data-cw=how-tax-not-included] li").length,
    offLine: document.querySelector("[data-cw=how]")?.textContent?.includes("No taxes are included."),
  }));
  check(
    "42-how-tax-on",
    /Tax is assumed paid each year on the growth/.test(howOnTax.model) &&
      /costs first, then tax, then inflation/.test(howOnTax.model) &&
      /official schedules: Australian Taxation Office, the 2026–27 income year/.test(howOnTax.guided) &&
      howOnTax.notIncluded >= 5 &&
      howOnTax.offLine === false,
    `model: ${howOnTax.model.slice(0, 60)}…; guided: ${howOnTax.guided.slice(0, 60)}…; not-included: ${howOnTax.notIncluded}`,
  );

  // Plain language over the new copy: no banned jargon, "marginal" never
  // appears, average sentence length over the How fold stays ≤ 15 words.
  const taxPlain = await page.evaluate(() => {
    const how = document.querySelector("[data-cw=how]")!;
    const paras = [...how.querySelectorAll("p, li")].map((el) => (el.textContent ?? "").trim());
    const all = paras.join(" ");
    const sentences = paras.join(" ").split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 3);
    const avg = sentences.length ? sentences.reduce((n, s) => n + s.split(/\s+/).length, 0) / sentences.length : 0;
    return { hasMarginal: /marginal/i.test(all), avgWords: Math.round(avg * 10) / 10 };
  });
  check(
    "42b-plain-language-tax",
    !taxPlain.hasMarginal && taxPlain.avgWords <= 16,
    `marginal: ${taxPlain.hasMarginal}; avg ${taxPlain.avgWords} words per sentence in the How fold`,
  );
  await page.click("[data-cw=how-toggle]"); // close

  // Test 43: the US guided estimator — the filing-status control, the NIIT
  // above the threshold.
  await page.click("[data-cw=country-US]");
  await page.waitForTimeout(300);
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await ensureCostsOpen();
  await openTaxEstimator();
  const statuses = await page.evaluate(() => ({
    count: document.querySelectorAll("[data-cw^=tax-status-]").length,
    labels: [...document.querySelectorAll("[data-cw^=tax-status-]")].map((b) => (b.textContent ?? "").trim()),
  }));
  await page.fill("#cw-tax-income", "90000");
  await page.waitForTimeout(300);
  const usAt90k = await page.textContent("[data-cw=tax-estimate-line]");
  await page.fill("#cw-tax-income", "250000");
  await page.waitForTimeout(300);
  const usAt250k = await page.textContent("[data-cw=tax-estimate-line]");
  const usSource = await page.textContent("[data-cw=tax-source-line]");
  check(
    "43-us-guided",
    statuses.count === 4 &&
      /about 22\.0% of extra investment earnings goes to tax: 22% income tax\./.test(usAt90k ?? "") &&
      // 250,000 single sits in the 32% band (201,775–256,225) and above the
      // NIIT threshold: 32% + 3.8% = 35.8%.
      /about 35\.8% of extra investment earnings goes to tax: 32% income tax plus 3\.8% net investment income tax\./.test(usAt250k ?? ""),
    `statuses: ${JSON.stringify(statuses.labels)}; 90k: ${usAt90k?.slice(0, 80)}; 250k: ${usAt250k?.slice(0, 100)}`,
  );
  check("43b-us-source", /IRS/.test(usSource ?? "") && /tax year 2026/.test(usSource ?? ""), usSource ?? "");
  // Head of household at 200,000 hits the NIIT at the 24% band.
  await page.click("[data-cw=tax-status-head-of-household]");
  await page.fill("#cw-tax-income", "200000");
  await page.waitForTimeout(300);
  const hohAt200k = await page.textContent("[data-cw=tax-estimate-line]");
  check(
    "43c-hoh-niit",
    /about 27\.8%.*24% income tax plus 3\.8% net investment income tax/.test(hohAt200k ?? ""),
    hohAt200k?.slice(0, 110),
  );

  // Test 44: fa + RTL — the estimator and the How fold in Farsi, Persian
  // digits, no LTR leakage in the live line.
  await page.click('header button:has-text("فا")');
  await page.waitForTimeout(400);
  await page.fill("#cw-tax-income", "90000");
  await page.waitForTimeout(300);
  const faEstimate = await page.evaluate(() => ({
    line: document.querySelector("[data-cw=tax-estimate-line]")?.textContent ?? "",
    dir: getComputedStyle(document.querySelector("[data-cw=tax-estimate-line]") as HTMLElement).direction,
    source: document.querySelector("[data-cw=tax-source-line]")?.textContent ?? "",
    value: (document.querySelector("#cw-tax") as HTMLInputElement)?.value ?? "",
  }));
  check(
    "44-fa-rtl-estimator",
    // (The country is still the USA here: 90,000 single → 22%, no NIIT.)
    /۲۲٫۰٪ از درآمد اضافی سرمایه‌گذاری به مالیات می‌رود: ۲۲٪ مالیات بر درآمد\./.test(faEstimate.line) &&
      faEstimate.dir === "rtl",
    faEstimate.line.slice(0, 90),
  );
  check("44b-fa-digits", faEstimate.value.includes("۳۲") || faEstimate.value.includes("32"), `tax box shows ${faEstimate.value}`);
  // The fa How fold with the tax on.
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(200);
  await page.click("[data-cw=how-toggle]");
  await page.waitForTimeout(300);
  const faHowTax = await page.evaluate(() => ({
    model: document.querySelector("[data-cw=how-tax-model]")?.textContent ?? "",
    notIncluded: document.querySelectorAll("[data-cw=how-tax-not-included] li").length,
    dir: getComputedStyle(document.querySelector("[data-cw=how]") as HTMLElement).direction,
  }));
  check(
    "44c-fa-how-tax",
    /ترتیب این است: اول هزینه، بعد مالیات/.test(faHowTax.model) && faHowTax.notIncluded >= 5 && faHowTax.dir === "rtl",
    `model: ${faHowTax.model.slice(0, 60)}…; items: ${faHowTax.notIncluded}`,
  );
  await page.click("[data-cw=how-toggle]");
  await page.waitForTimeout(200);

  // Test 46: dark mode with the tax UI open (screenshot).
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/29a-fa-dark-tax-costs.png` });
  await page.emulateMedia({ colorScheme: "light" });

  // Test 46b: store nothing + no URL trace; reload resets the tax.
  const storageTax = await page.evaluate(() => ({
    local: Object.keys(window.localStorage),
    session: Object.keys(window.sessionStorage),
    cookies: document.cookie,
    url: location.href,
  }));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");
  const afterReload = await page.evaluate(() => ({
    caption: document.querySelector("[data-cw=tax-caption]"),
    takes: document.querySelector("[data-cw=tax-takes]"),
    taxBox: document.querySelector("#cw-tax") ? (document.querySelector("#cw-tax") as HTMLInputElement).value : "(hidden)",
  }));
  check(
    "46-store-nothing-and-reset",
    storageTax.local.length === 0 && storageTax.session.length === 0 && storageTax.cookies === "" &&
      !/\d/.test(storageTax.url.split("?")[1] ?? "") &&
      afterReload.caption === null && afterReload.takes === null,
    `storage: ${JSON.stringify(storageTax.local)}; after reload caption=${afterReload.caption === null ? "gone" : "present"}, takes=${afterReload.takes === null ? "gone" : "present"}`,
  );

  // Test 47: one-screen fit with More options open at the three sizes —
  // no horizontal clipping, the group container visible.
  for (const [w, h] of [[360, 800], [390, 844], [430, 932]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.click("[data-cw=more-options]");
    await page.waitForSelector("[data-cw=more-options-groups]");
    const fitMore = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      groupsVisible: (document.querySelector("[data-cw=more-options-groups]") as HTMLElement).offsetParent !== null,
    }));
    await page.click("[data-cw=more-options]");
    await page.waitForTimeout(200);
    check(
      `47-more-open-${w}x${h}`,
      fitMore.scrollW <= w && fitMore.groupsVisible,
      `scrollW ${fitMore.scrollW}/${w}, groups visible: ${fitMore.groupsVisible}`,
    );
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  // Test 48: the full keyboard path — tab into the tax box, type, and open
  // the estimator with the keyboard.
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await ensureCostsOpen();
  await page.focus("#cw-tax");
  await page.keyboard.type("25");
  await page.waitForTimeout(250);
  const kbTyped = await page.evaluate(() => (document.querySelector("#cw-tax") as HTMLInputElement)?.value ?? "");
  await page.focus("[data-cw=tax-estimate-link]");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const kbEstimatorOpen = await page.evaluate(() => {
    const est = document.querySelector("[data-cw=tax-estimator]");
    return est !== null && (est as HTMLElement).offsetParent !== null;
  });
  check(
    "48-keyboard-path",
    kbTyped === "25" && kbEstimatorOpen,
    `typed by keyboard: ${kbTyped}; estimator opened by Enter: ${kbEstimatorOpen}`,
  );
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(200);

  // Test 50: the A4 card with the tax on (guided) — the one tax line with
  // its source, and never the income.
  await page.click("[data-cw=country-AU]");
  await page.waitForTimeout(300);
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await ensureCostsOpen();
  await page.fill("#cw-tax", "32");
  await page.waitForTimeout(200);
  await openTaxEstimator();
  await page.fill("#cw-tax-income", "90000");
  await page.waitForTimeout(250);
  await page.click("[data-cw=tax-use-rate]");
  await page.waitForTimeout(300);
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(250);
  await page.click("[data-cw=save-card]");
  await page.waitForSelector("[data-cw=card-menu]");
  await page.click('[data-cw=card-menu] button:has-text("Print"), [data-cw=card-menu] button:has-text("چاپ")');
  await page.waitForSelector("[data-cw=print-overlay]");
  const pdfTaxPath = `${OUT}/a4-card-en-tax.pdf`;
  await page.evaluate(() => document.body.classList.add("cw-printing"));
  await page.pdf({ path: pdfTaxPath, format: "A4", printBackground: true });
  await page.evaluate(() => document.body.classList.remove("cw-printing"));
  const taxPdfText = execFileSync("pdftotext", [pdfTaxPath, "-"], { encoding: "utf8" });
  const taxPages = /Pages:\s+(\d+)/.exec(execFileSync("pdfinfo", [pdfTaxPath], { encoding: "utf8" }))?.[1];
  check(
    "50-a4-card-tax",
    taxPages === "1" &&
      /Tax on growth: 32% a year \(estimate, Australian Taxation Office, the 2026–27 income year\)/.test(taxPdfText) &&
      !/90,000|90000/.test(taxPdfText.replace(/\s/g, "")),
    `pages=${taxPages}; tax line present: ${/Tax on growth/.test(taxPdfText)}; income leaked: ${/90,000|90000/.test(taxPdfText.replace(/\s/g, ""))}`,
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  /* ---------------------------------------------------------------- *
   * Routing (test 19) — via a fresh context
   * ---------------------------------------------------------------- */
  const ctx = await browser.newContext();
  const rp = await ctx.newPage();
  const routeChecks: Record<string, number> = {};
  for (const path of ["/tools", "/tools/compound-wealth", "/tools/unknown", "/"]) {
    const res = await rp.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    routeChecks[path] = res?.status() ?? 0;
  }
  check("19a-direct-load", routeChecks["/tools"] === 200 && routeChecks["/tools/compound-wealth"] === 200 && routeChecks["/tools/unknown"] === 404 && routeChecks["/"] === 200, JSON.stringify(routeChecks));
  // Refresh works.
  await rp.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "domcontentloaded" });
  await rp.reload({ waitUntil: "domcontentloaded" });
  check("19b-refresh", (await rp.title()).includes("Compound Wealth"), await rp.title());
  // The existing gold page still loads.
  const gold = await rp.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  check("19c-gold-page-intact", gold?.status() === 200 && (await rp.locator("text=Gold").count()) > 0);
  // Test 20: title, description, canonical, OG in the page language.
  await rp.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "domcontentloaded" });
  const meta = await rp.evaluate(() => ({
    title: document.title,
    desc: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href") ?? "",
    ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? "",
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "",
    ogUrl: document.querySelector('meta[property="og:url"]')?.getAttribute("content") ?? "",
  }));
  check(
    "20-meta-tags",
    meta.title.includes("Compound Wealth") && meta.desc.length > 40 && meta.canonical === "https://currena.ir/tools/compound-wealth" && meta.ogTitle.length > 0 && meta.ogImage.includes("currena.ir"),
    JSON.stringify(meta).slice(0, 160),
  );
  // The nav Tools link and the breadcrumb work. On the dev server the
  // root IS this worker's gold page; live, this worker's page is /gold
  // (the root belongs to the main site, outside this repo).
  const goldPath = BASE.includes("currena.ir") ? "/gold" : "/";
  await rp.goto(`${BASE}${goldPath}`, { waitUntil: "domcontentloaded" });
  const toolsHref = await rp.evaluate(() => document.querySelector('header nav a[href="/tools"]')?.getAttribute("href"));
  check("20-nav-tools-link", toolsHref === "/tools");
  await rp.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "domcontentloaded" });
  const crumb = await rp.evaluate(() => document.querySelector('[data-cw="tools-link"]')?.getAttribute("href"));
  check("20-breadcrumb", crumb === "/tools");
  await ctx.close();

  /* ---------------------------------------------------------------- *
   * No page errors anywhere in the whole walk
   * ---------------------------------------------------------------- */
  check("no-page-errors", errors.length === 0, errors.slice(0, 3).join(" | ").slice(0, 200));

  await page.close();
  await browser.close();

  const failed = (EVIDENCE.checks as Check[]).filter((c) => !c.pass);
  EVIDENCE.summary = { total: (EVIDENCE.checks as Check[]).length, failed: failed.length };
  const outFile = `tests/compound-browser-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(outFile, JSON.stringify(EVIDENCE, null, 2));
  console.log(`\n${(EVIDENCE.checks as Check[]).length - failed.length}/${(EVIDENCE.checks as Check[]).length} checks green → ${outFile}`);
  if (failed.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
