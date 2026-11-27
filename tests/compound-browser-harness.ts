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
    // v9: the chart's layer filter chips (the customizable graph).
    "chart-toggle",
    // v10: the spending receipt (below the fold — its own controls).
    "receipt-",
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
    // (600ms: the resize re-render — the chart re-measures its width —
    // can outlast 350ms on a loaded dev server; measured, the flake
    // recorded in the v10.1 test report.)
    await page.waitForTimeout(600);
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
   * v8 — the outcome bars: the share bar (the default screen's one
   * new visual), the what-if micro-bars, the compare bars, the card
   * bars, the fa/RTL rendering and the label-in-name toggle fix.
   * ---------------------------------------------------------------- */
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");

  // v8-1 (donut since v10.1): the share donut under the tiles —
  // present, keyed, proportioned (pathLength=100 → the ring's
  // stroke-dasharray IS the percent).
  const shareBarDefault = await page.evaluate(() => {
    const donut = document.querySelector("[data-cw=share-donut]") as SVGSVGElement | null;
    const wrap = document.querySelector("[data-cw=share-donut-wrap]");
    const tilesSec = document.querySelector('section[aria-label="You could have"]');
    const key = document.querySelector("[data-cw=share-key]");
    const caption = document.querySelector("[data-cw=share-caption]");
    const segP = document.querySelector("[data-cw=share-seg-putin]");
    const segG = document.querySelector("[data-cw=share-seg-growth]");
    if (!donut || !segP || !segG) return { present: false };
    const pw = Number((segP.getAttribute("stroke-dasharray") ?? "0 0").split(" ")[0]);
    const gw = Number((segG.getAttribute("stroke-dasharray") ?? "0 0").split(" ")[0]);
    return {
      present: true,
      inTilesSection: !!(wrap && tilesSec?.contains(wrap)),
      role: donut.getAttribute("role"),
      aria: donut.getAttribute("aria-label") ?? "",
      putShare: +(pw / (pw + gw)).toFixed(3),
      key: key?.textContent ?? "",
      caption: caption?.textContent ?? "",
      interactiveInside: donut.querySelectorAll("button, input, select, a[href]").length,
      titlesInside: donut.querySelectorAll("[title]").length,
      svgH: Math.round(donut.getBoundingClientRect().height),
    };
  });
  check(
    "v8-1-sharedonut-default",
    shareBarDefault.present === true &&
      (shareBarDefault as any).inTilesSection === true &&
      (shareBarDefault as any).role === "img" &&
      /47% Money you put in/.test((shareBarDefault as any).key) &&
      /53% Growth/.test((shareBarDefault as any).key) &&
      Math.abs((shareBarDefault as any).putShare - 0.472) < 0.02 &&
      /chart's own two colours/.test((shareBarDefault as any).caption) &&
      (shareBarDefault as any).interactiveInside === 0 &&
      (shareBarDefault as any).titlesInside === 0,
    `put share ${(shareBarDefault as any).putShare}, key "${(shareBarDefault as any).key}"`,
  );

  // v8-2: the default screen's inventory gains the bar and nothing
  // else — the same allowed set as test 13 (no new interactive
  // elements; the bar is pure divs), plus the bar itself. (v10: the
  // receipt's own controls join the allowed set here too, exactly as
  // in test 13 — they live below the fold, never on the default screen.)
  const inventoryWithBar = await page.evaluate(() => {
    const main = document.querySelector("main")!;
    const interactive = [...main.querySelectorAll("button, input, select, a[href]")]
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => ({
        cw: el.getAttribute("data-cw") ?? "",
        insideChart: !!el.closest("[data-cw=share-donut-wrap], [data-cw=whatif-cols], [data-cw=compare-cols]"),
      }));
    const bar = document.querySelector("[data-cw=share-donut-wrap]");
    const allowed = [
      "country-", "amount-", "years-", "asset-", "more-options", "save-card", "money-", "card-menu",
      "later-", "how", "tools-link", "mode-", "add-salary", "salary-", "percent-",
      "chart-toggle",
      // v10: the spending receipt's own controls (below the fold).
      "receipt-",
    ];
    return {
      unexpected: interactive.filter((c) => !c.insideChart && !allowed.some((p) => c.cw.startsWith(p))).length,
      insideCharts: interactive.filter((c) => c.insideChart).length,
      barPresent: !!bar,
    };
  });
  check(
    "v8-2-inventory-gains-donut-only",
    inventoryWithBar.barPresent && inventoryWithBar.unexpected === 0 && inventoryWithBar.insideCharts === 0,
    `donut present: ${inventoryWithBar.barPresent}, unexpected: ${inventoryWithBar.unexpected}, interactive inside charts: ${inventoryWithBar.insideCharts}`,
  );

  // v8-3: the money toggle flips the tiles and the bar follows — the
  // engine deflates both shown values by the same factor, so the
  // shares are view-invariant (a recorded v8 fact); the check is that
  // the bar still matches the tiles' shown numbers in both views.
  const tilesRatio = () =>
    page.evaluate(() => {
      const tiles = [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')].map((d) =>
        Number((d.textContent ?? "").replace(/[^0-9]/g, "")),
      );
      const segP = document.querySelector("[data-cw=share-seg-putin]");
      const segG = document.querySelector("[data-cw=share-seg-growth]");
      if (!segP || !segG || !tiles[0] || !tiles[2]) return null;
      const pw = Number((segP.getAttribute("stroke-dasharray") ?? "0 0").split(" ")[0]);
      const gw = Number((segG.getAttribute("stroke-dasharray") ?? "0 0").split(" ")[0]);
      return { tilePct: Math.round((tiles[0] / tiles[2]) * 100), barPct: Math.round((pw / (pw + gw)) * 100) };
    });
  const ratioFuture = await tilesRatio();
  await page.click("[data-cw=money-today]");
  await page.waitForTimeout(300);
  const ratioToday = await tilesRatio();
  check(
    "v8-3-toggle-follows-tiles",
    ratioFuture !== null &&
      ratioToday !== null &&
      Math.abs(ratioFuture.barPct - ratioFuture.tilePct) <= 2 &&
      Math.abs(ratioToday.barPct - ratioToday.tilePct) <= 2 &&
      Math.abs(ratioToday.barPct - ratioFuture.barPct) <= 1,
    `future tile/bar ${ratioFuture?.tilePct}/${ratioFuture?.barPct}%, today tile/bar ${ratioToday?.tilePct}/${ratioToday?.barPct}% (view-invariant by the engine's shared deflator)`,
  );
  await page.click("[data-cw=money-future]");
  await page.waitForTimeout(200);

  // v8-4: the under-one wording — a 1-year plan at a 0.5% custom rate
  // (net +0.3%) has a growth share well under 1%.
  await page.fill("#cw-years", "1");
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await page.click('[data-cw="group-rates"] button');
  await page.waitForTimeout(250);
  await page.locator('[data-cw="group-rates"] button', { hasText: "Custom rate" }).click();
  await page.waitForTimeout(200);
  await page.fill("#cw-crate", "0.5");
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(300);
  const underOne = await page.evaluate(() => document.querySelector("[data-cw=share-key]")?.textContent ?? "");
  check("v8-4-under-one", /<1%/.test(underOne), underOne);

  // v8-5: the negative-growth fallback — custom rate 0% with the default
  // 0.2% yearly cost is net −0.2%: the bar must hide, the sentence stays.
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  // The rates fold may still be open from v8-4 — only open it if needed.
  if (!(await page.$("#cw-crate"))) await page.click('[data-cw="group-rates"] button');
  await page.waitForTimeout(250);
  await page.fill("#cw-crate", "0");
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(300);
  const negative = await page.evaluate(() => ({
    bar: document.querySelector("[data-cw=share-donut]") !== null,
    hidden: document.querySelector("[data-cw=share-donut-hidden]")?.textContent ?? "",
    growthTile: [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')][1]?.textContent ?? "",
  }));
  check(
    "v8-5-negative-growth-fallback",
    !negative.bar && /below what you put in/.test(negative.hidden),
    `donut hidden: ${!negative.bar}, line "${negative.hidden.slice(0, 70)}", tile "${negative.growthTile}"`,
  );

  // v8-6 (columns since v10.1): the what-if column charts — one set
  // per card, on one shared baseline, no interaction; the
  // small-changes columns rise in step; later and cash keep your plan
  // tallest; every label sits centred under its own column.
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");
  const whatifBars = await page.evaluate(() => {
    const sets = [...document.querySelectorAll("[data-cw=whatif-cols]")].map((s) => {
      const cols = [...s.querySelectorAll("[data-cw=whatif-col]")] as HTMLElement[];
      const labels = [...s.querySelectorAll("div:last-child > span")] as HTMLElement[];
      const rows = cols.map((c, i) => {
        const cr = c.getBoundingClientRect();
        const lr = labels[i]?.getBoundingClientRect();
        return {
          label: (labels[i]?.textContent ?? "").trim(),
          h: Math.round(cr.height),
          labelOffset: lr ? Math.round(lr.left + lr.width / 2 - (cr.left + cr.width / 2)) : 99,
        };
      });
      return {
        role: s.getAttribute("role"),
        aria: s.getAttribute("aria-label") ?? "",
        rows,
        aligned: rows.every((r) => Math.abs(r.labelOffset) <= 2),
        interactiveInside: s.querySelectorAll("button, input, select, a[href]").length,
        titlesInside: s.querySelectorAll("[title]").length,
      };
    });
    const costsCard = [...document.querySelectorAll("section[aria-label='What if…'] > div > div")].find((c) =>
      /Costs/.test(c.querySelector("div")?.textContent ?? ""),
    );
    return { sets, costsCardPresent: !!costsCard };
  });
  const smallSet = whatifBars.sets[0];
  const laterSet = whatifBars.sets[1];
  const cashSet = whatifBars.sets[2];
  check(
    "v8-6-whatif-cols",
    whatifBars.sets.length === 3 &&
      !whatifBars.costsCardPresent &&
      smallSet.rows.length === 3 &&
      smallSet.rows[0].h < smallSet.rows[1].h &&
      smallSet.rows[1].h < smallSet.rows[2].h &&
      laterSet.rows.length === 2 &&
      laterSet.rows[0].h > laterSet.rows[1].h &&
      cashSet.rows.length === 2 &&
      cashSet.rows[0].h > cashSet.rows[1].h &&
      whatifBars.sets.every((s) => s.role === "img" && s.aria.length > 10 && s.interactiveInside === 0 && s.titlesInside === 0 && s.aligned),
    `3 sets (3/2/2 columns), small rising ${smallSet.rows.map((r) => r.h).join("<")}, later ${laterSet.rows.map((r) => r.h).join(">")}, cash ${cashSet.rows.map((r) => r.h).join(">")}, every label centred under its column`,
  );

  // v8-7 (columns since v10.1): the costs card's before/after columns
  // (fee 10 → the card appears).
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await page.click('[data-cw="group-costs"] button');
  await page.waitForTimeout(250);
  await page.fill("#cw-fee", "10");
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(300);
  const costsBars = await page.evaluate(() => {
    const costsCard = [...document.querySelectorAll("section[aria-label='What if…'] > div > div")].find((c) =>
      /^Costs$/.test(c.querySelector("div")?.textContent ?? ""),
    );
    const cols = costsCard?.querySelector("[data-cw=whatif-cols]");
    if (!cols) return { present: false };
    const rows = [...cols.querySelectorAll("[data-cw=whatif-col]")].map((c) =>
      Math.round((c as HTMLElement).getBoundingClientRect().height),
    );
    const labels = [...cols.querySelectorAll("div:last-child > span")].map((s) => (s.textContent ?? "").trim());
    return { present: true, aria: cols.getAttribute("aria-label") ?? "", rows, labels };
  });
  check(
    "v8-7-costs-cols",
    costsBars.present === true &&
      (costsBars as any).rows.length === 2 &&
      (costsBars as any).rows[0] > (costsBars as any).rows[1] &&
      /Before costs/.test((costsBars as any).labels[0]) &&
      /After costs/.test((costsBars as any).labels[1]),
    `before ${(costsBars as any).rows[0]}px > after ${(costsBars as any).rows[1]}px`,
  );

  // v8-8 (columns since v10.1): the compare table's column chart under
  // the table (behind More options) — one column per asset on one common
  // scale, the current asset's column the gold one (its swatch colour).
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await page.click('[data-cw="group-dates"] button');
  await page.waitForTimeout(250);
  await page.click("[data-cw=compare-toggle]");
  await page.waitForTimeout(400);
  const compareBars = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("[data-cw=compare-table] tbody tr")] as HTMLTableRowElement[];
    const cols = [...document.querySelectorAll("[data-cw=compare-cols] [data-cw=whatif-col]")] as HTMLElement[];
    return {
      tableRows: rows.map((r) => ({
        asset: r.cells[0]?.textContent ?? "",
        final: Number((r.cells[2]?.textContent ?? "").replace(/[^0-9]/g, "")),
      })),
      role: document.querySelector("[data-cw=compare-cols] [role=img]")?.getAttribute("aria-label") ?? "",
      cols: cols.map((c) => ({
        h: Math.round(c.getBoundingClientRect().height),
        gold: getComputedStyle(c).backgroundColor,
      })),
    };
  });
  const spFinal = compareBars.tableRows.find((r) => /S&P 500/.test(r.asset))?.final ?? 0;
  const cashFinal = compareBars.tableRows.find((r) => /Cash/.test(r.asset))?.final ?? 0;
  const maxH = Math.max(...compareBars.cols.map((c) => c.h));
  const minH = Math.min(...compareBars.cols.map((c) => c.h));
  const maxFinal = Math.max(...compareBars.tableRows.map((r) => r.final));
  const minFinal = Math.min(...compareBars.tableRows.map((r) => r.final));
  const maxHFinal = compareBars.tableRows.find((r) => r.final === maxFinal)?.asset ?? "";
  /** The current asset's column is the gold token (rgb(243,177,63) in
   *  light); the others are the text-secondary ink (rgb(71,82,93)). */
  const goldCols = compareBars.cols.filter((c) => c.gold === "rgb(243, 177, 63)").length;
  check(
    "v8-8-compare-cols",
    compareBars.tableRows.length === 5 &&
      compareBars.cols.length === 5 &&
      compareBars.cols.every((c) => c.h > 0) &&
      Math.abs(maxH / minH - maxFinal / minFinal) < 0.1 &&
      spFinal > cashFinal &&
      /one scale/i.test(compareBars.role) &&
      goldCols === 1,
    `5 columns on one scale under the table (tallest: ${maxHFinal} ${maxH}px vs ${minH}px ≈ finals ${maxFinal}/${minFinal}), ${goldCols} gold column (the current asset), sr "${compareBars.role.slice(0, 40)}"`,
  );
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(200);

  // v8-9 (donut since v10.1): the phone card's donut — text-free, sr
  // twin, proportioned. (A fresh reload first, so the 47/53 default
  // shares are back — the fee-10 plan from v8-7 shifts them.)
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");
  await page.click("[data-cw=save-card]");
  await page.waitForSelector("[data-cw=card-menu]");
  await page.click('[data-cw=card-menu] button:has-text("Phone")');
  await page.waitForSelector("[data-cw=phone-card]");
  await page.waitForTimeout(600);
  const phoneStrip = await page.evaluate(() => {
    const wrap = document.querySelector("[data-cw=phone-share-wrap]");
    const donut = wrap?.querySelector("[data-cw=share-donut]") as SVGSVGElement | null;
    if (!donut) return { present: false };
    const segP = donut.querySelector("[data-cw=share-seg-putin]");
    const segG = donut.querySelector("[data-cw=share-seg-growth]");
    const pw = Number((segP?.getAttribute("stroke-dasharray") ?? "0 0").split(" ")[0]);
    const gw = Number((segG?.getAttribute("stroke-dasharray") ?? "0 0").split(" ")[0]);
    return {
      present: true,
      role: donut.getAttribute("role"),
      aria: donut.getAttribute("aria-label") ?? "",
      putShare: +(pw / (pw + gw)).toFixed(3),
      textInside: (donut.textContent ?? "").trim(),
      size: Math.round(donut.getBoundingClientRect().width),
    };
  });
  check(
    "v8-9-phone-donut",
    phoneStrip.present === true &&
      (phoneStrip as any).role === "img" &&
      /47% is money you put in/.test((phoneStrip as any).aria) &&
      Math.abs((phoneStrip as any).putShare - 0.472) < 0.02 &&
      (phoneStrip as any).textInside === "" &&
      (phoneStrip as any).size >= 40,
    `put share ${(phoneStrip as any).putShare}, ${(phoneStrip as any).size}px, text-free`,
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // v8-10 (donut since v10.1): the A4 card's donut + key line (ink-safe
  // palette).
  await page.click("[data-cw=save-card]");
  await page.waitForSelector("[data-cw=card-menu]");
  await page.click('[data-cw=card-menu] button:has-text("Print")');
  await page.waitForSelector("[data-cw=print-overlay]");
  await page.waitForTimeout(500);
  const a4Bar = await page.evaluate(() => {
    const donut = document.querySelector(".cw-share-bar [data-cw=share-donut]") as SVGSVGElement | null;
    const key = document.querySelector(".cw-share-key");
    if (!donut) return { present: false };
    const segP = donut.querySelector("[data-cw=share-seg-putin]");
    const segG = donut.querySelector("[data-cw=share-seg-growth]");
    const pw = Number((segP?.getAttribute("stroke-dasharray") ?? "0 0").split(" ")[0]);
    const gw = Number((segG?.getAttribute("stroke-dasharray") ?? "0 0").split(" ")[0]);
    return {
      present: true,
      role: donut.getAttribute("role"),
      aria: donut.getAttribute("aria-label") ?? "",
      putShare: +(pw / (pw + gw)).toFixed(3),
      key: key?.textContent ?? "",
    };
  });
  check(
    "v8-10-a4-donut",
    a4Bar.present === true &&
      (a4Bar as any).role === "img" &&
      Math.abs((a4Bar as any).putShare - 0.472) < 0.02 &&
      /47% Money you put in/.test((a4Bar as any).key) &&
      /53% Growth/.test((a4Bar as any).key),
    `key "${(a4Bar as any).key}"`,
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // v8-11 (donut since v10.1): fa/RTL — Persian digits + ٪ in the key
  // line, the key's first entry names the put-in word (reading order:
  // the fa key line starts with the put-in share, mirroring the EN
  // order), the caption in Persian; and the language toggle's
  // label-in-name fix (the visible text opens the accessible name).
  await page.click('header button:has-text("فا")');
  await page.waitForTimeout(500);
  const faBar = await page.evaluate(() => {
    const key = document.querySelector("[data-cw=share-key]");
    const donut = document.querySelector("[data-cw=share-donut]") as SVGSVGElement | null;
    const caption = document.querySelector("[data-cw=share-caption]");
    const toggle = [...document.querySelectorAll("header button")].find((b) => (b.textContent ?? "").trim() === "EN");
    if (!donut) return { present: false };
    return {
      present: true,
      key: key?.textContent ?? "",
      caption: caption?.textContent ?? "",
      donutAria: donut.getAttribute("aria-label") ?? "",
      toggleAria: toggle?.getAttribute("aria-label") ?? "",
      toggleText: toggle?.textContent ?? "",
    };
  });
  check(
    "v8-11-fa-rtl-donut",
    faBar.present === true &&
      /[۰-۹]/.test((faBar as any).key) &&
      (faBar as any).key.includes("٪") &&
      (faBar as any).key.trim().startsWith("۴۷") && // the key opens with the put-in share (reading order)
      (faBar as any).donutAria.includes("٪") &&
      /نمودار/.test((faBar as any).caption) &&
      (faBar as any).toggleAria.startsWith("EN —"),
    `key "${(faBar as any).key}", donut sr has ٪: ${(faBar as any).donutAria.includes("٪")}, toggle aria "${(faBar as any).toggleAria}"`,
  );
  // back to EN: the toggle's accessible name now opens with "فا".
  await page.click('header button:has-text("EN")');
  await page.waitForTimeout(400);
  const enToggleAria = await page.evaluate(() => {
    const toggle = [...document.querySelectorAll("header button")].find((b) => (b.textContent ?? "").trim() === "فا");
    return toggle?.getAttribute("aria-label") ?? "";
  });
  check("v8-12-toggle-label-in-name-en", enToggleAria.startsWith("فا —"), `aria "${enToggleAria}"`);

  // v8-13: the new text uses the page's own caption tokens (no new
  // colour pairs): the key line's colour === the page's secondary text,
  // the caption's === the measured-line's tertiary. Dark is switched by
  // the site's own .dark class (next-themes owns the toggle; flipping
  // the class directly keeps the store-nothing rule intact).
  let lightKey = "";
  for (const scheme of ["light", "dark"] as const) {
    await page.evaluate((s) => {
      document.documentElement.classList.toggle("dark", s === "dark");
    }, scheme);
    await page.waitForTimeout(250);
    const colours = await page.evaluate(() => {
      const key = document.querySelector("[data-cw=share-key] span");
      const cap = document.querySelector("[data-cw=share-caption]");
      const measured = document.querySelector("[data-cw=measured-line]");
      return {
        dark: document.documentElement.classList.contains("dark"),
        key: key ? getComputedStyle(key).color : "",
        cap: cap ? getComputedStyle(cap).color : "",
        measured: measured ? getComputedStyle(measured).color : "",
      };
    });
    if (scheme === "light") lightKey = colours.key;
    check(
      `v8-13-${scheme}-tokens`,
      colours.dark === (scheme === "dark") &&
        colours.key.length > 0 &&
        colours.cap === colours.measured &&
        (scheme === "light" || colours.key !== lightKey),
      `${scheme}: key ${colours.key}, caption ${colours.cap} (=== the measured line's own tertiary)`,
    );
  }
  await page.evaluate(() => document.documentElement.classList.remove("dark"));

  // v8-14: store-nothing re-checked after all the bar interactions.
  const storageAfterBars = await page.evaluate(() => ({
    local: Object.keys(window.localStorage),
    cookies: document.cookie,
  }));
  check(
    "v8-14-no-storage-recheck",
    storageAfterBars.local.length === 0 && storageAfterBars.cookies === "",
    JSON.stringify(storageAfterBars),
  );

  /* ---------------------------------------------------------------- *
   * v9 — the chart layer filters (the customizable graph)
   * ---------------------------------------------------------------- */
  // Return to the canonical default first: test 15 left Gold selected,
  // and the comparison chip set follows the selected asset (the selected
  // asset IS the plan; the others are the opt-in lines).
  await page.click('[data-cw="asset-australian-shares"]');
  await page.waitForTimeout(300);

  // v9-1: the filter row exists with the honest defaults — the four
  // core layers ON (your plan), every comparison line OFF (opt-in),
  // nothing disabled.
  const chartState = () =>
    page.evaluate(() => {
      const group = document.querySelector("[data-cw=chart-layers]");
      const section = group?.closest("section") ?? null;
      const svg = section?.querySelector("svg") ?? null;
      const chips = [...(group?.querySelectorAll("button") ?? [])].map((c) => ({
        cw: c.getAttribute("data-cw") ?? "",
        label: (c.textContent ?? "").trim(),
        pressed: c.getAttribute("aria-pressed"),
        disabled: (c as HTMLButtonElement).disabled,
      }));
      return {
        present: !!group,
        role: group?.getAttribute("role") ?? "",
        aria: group?.getAttribute("aria-label") ?? "",
        chips,
        paths: svg ? svg.querySelectorAll("path").length : -1,
        svgTexts: svg ? [...svg.querySelectorAll("text")].map((t) => t.textContent ?? "") : [],
        caption: document.querySelector("[data-cw=chart-others-caption]")?.textContent ?? null,
        headline: document.querySelector("[data-cw=headline] p")?.textContent ?? "",
        tiles: [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')].map((d) => d.textContent ?? ""),
        range: document.querySelector("[data-cw=range-line]")?.textContent ?? "",
      };
    });
  const v9Start = await chartState();
  const coreOn = ["putin", "growth", "total", "band"];
  const comparisons = ["sp500", "world", "gold", "cash"];
  check(
    "v9-1-filters-defaults",
    v9Start.present &&
      v9Start.role === "group" &&
      v9Start.aria === "Show on the chart" &&
      v9Start.chips.length === 8 &&
      coreOn.every((id) => v9Start.chips.find((c) => c.cw === `chart-toggle-${id}`)?.pressed === "true") &&
      comparisons.every((id) => v9Start.chips.find((c) => c.cw === `chart-toggle-${id}`)?.pressed === "false") &&
      v9Start.chips.every((c) => !c.disabled),
    `${v9Start.chips.length} chips: ${v9Start.chips.map((c) => `${c.label}=${c.pressed}`).join(", ")}`,
  );

  // v9-2: the default chart is plan-only — no comparison end labels, no
  // caption (the quiet default; the old look is one click away, v9-13).
  // The two end labels read "Put in" and "Total" — each its chip's own
  // word, so the key maps 1:1 (and the long v6 wording no longer grazes
  // the right edge at 360–390px).
  check(
    "v9-2-default-plan-only",
    v9Start.paths === 7 &&
      !v9Start.svgTexts.some((t) => /S&P 500|World shares|Gold|Cash/.test(t)) &&
      v9Start.svgTexts.some((t) => /^Put in$/.test(t)) &&
      v9Start.svgTexts.some((t) => /^Total$/.test(t)) &&
      v9Start.caption === null,
    `paths ${v9Start.paths}, texts ${JSON.stringify(v9Start.svgTexts.slice(0, 6))}`,
  );

  // v9-3: the owner's example view — only "your current money vs
  // future potential money": growth and range off, put-in area + total
  // line remain (three paths exactly). The value line's end label reads
  // "Total" — mapping 1:1 to its chip (the v9 label fix).
  await page.click('[data-cw="chart-toggle-growth"]');
  await page.click('[data-cw="chart-toggle-band"]');
  const exampleView = await chartState();
  check(
    "v9-3-owner-example-view",
    exampleView.paths === 3 &&
      exampleView.svgTexts.some((t) => /^Put in$/.test(t)) &&
      exampleView.svgTexts.some((t) => /^Total$/.test(t)) &&
      !exampleView.svgTexts.some((t) => /worse|better/.test(t)),
    `paths ${exampleView.paths}, texts ${JSON.stringify(exampleView.svgTexts.slice(0, 5))}`,
  );

  // v9-4: the comparison lines are opt-in — S&P 500 and Gold draw as
  // dashed lines with their end labels and the one-line caption.
  await page.click('[data-cw="chart-toggle-sp500"]');
  await page.click('[data-cw="chart-toggle-gold"]');
  const benchView = await chartState();
  check(
    "v9-4-benchmarks-opt-in",
    benchView.paths === 5 &&
      benchView.svgTexts.some((t) => t === "S&P 500") &&
      benchView.svgTexts.some((t) => t === "Gold") &&
      /same plan at each asset's own average return/.test(benchView.caption ?? ""),
    `paths ${benchView.paths}, caption "${benchView.caption}"`,
  );

  // v9-5: the filters change only the drawing — every number on the
  // page is invariant through all the toggling.
  // (checked again after v9-6/v9-7 against v9Start)

  // v9-6: the never-empty guard — with every other series off, the last
  // one's chip is disabled while still pressed.
  await page.click('[data-cw="chart-toggle-putin"]');
  await page.click('[data-cw="chart-toggle-sp500"]');
  await page.click('[data-cw="chart-toggle-gold"]');
  const guardView = await chartState();
  const totalChip = guardView.chips.find((c) => c.cw === "chart-toggle-total");
  check(
    "v9-6-never-empty-guard",
    guardView.paths === 1 &&
      totalChip?.pressed === "true" &&
      totalChip?.disabled === true &&
      guardView.chips.filter((c) => c.pressed === "true").length === 1,
    `paths ${guardView.paths}, total chip pressed=${totalChip?.pressed} disabled=${totalChip?.disabled}`,
  );

  // v9-7: the guard releases as soon as a second series returns.
  await page.click('[data-cw="chart-toggle-putin"]');
  const released = await chartState();
  check(
    "v9-7-guard-releases",
    released.chips.find((c) => c.cw === "chart-toggle-total")?.disabled === false &&
      released.paths === 3,
    `paths ${released.paths}`,
  );

  // v9-5 (the invariance verdict, after all of the above).
  const invariant =
    released.headline === v9Start.headline &&
    JSON.stringify(released.tiles) === JSON.stringify(v9Start.tiles) &&
    released.range === v9Start.range;
  check(
    "v9-5-numbers-invariant",
    invariant,
    invariant ? "headline, tiles and range identical through every toggle" : "a number moved",
  );

  // v9-8: every chip carries the toggle semantics (button + aria-pressed;
  // the group is named) — the label-in-name rule by construction.
  check(
    "v9-8-toggle-semantics",
    v9Start.chips.every((c) => c.label.length > 0) &&
      (await page.evaluate(() =>
        [...document.querySelectorAll("[data-cw=chart-layers] button")].every(
          (c) => c.tagName === "BUTTON" && c.getAttribute("aria-pressed") !== null,
        ),
      )),
    "all chips are aria-pressed buttons inside the named group",
  );

  // v9-9: fa/RTL — the group and chip labels in Persian, the caption in
  // Persian, and a toggle still works in fa.
  await page.click('header button:has-text("فا")');
  await page.waitForTimeout(500);
  const faLayers = await page.evaluate(() => {
    const group = document.querySelector("[data-cw=chart-layers]");
    return {
      aria: group?.getAttribute("aria-label") ?? "",
      labels: [...(group?.querySelectorAll("button") ?? [])].map((c) => (c.textContent ?? "").trim()),
      caption: document.querySelector("[data-cw=chart-others-caption]")?.textContent ?? null,
      dir: getComputedStyle(group ?? document.body).direction,
    };
  });
  const beforeFaToggle = await page.getAttribute('[data-cw="chart-toggle-growth"]', "aria-pressed");
  await page.click('[data-cw="chart-toggle-growth"]');
  const faToggled = await page.getAttribute('[data-cw="chart-toggle-growth"]', "aria-pressed");
  await page.click('[data-cw="chart-toggle-growth"]'); // back where it was
  check(
    "v9-9-fa-rtl-layers",
    faLayers.aria === "نمایش در نمودار" &&
      faLayers.labels.includes("واردشده") &&
      faLayers.labels.includes("مجموع") &&
      faLayers.labels.includes("اس‌اند‌پی ۵۰۰") &&
      faLayers.labels.includes("طلا") &&
      faLayers.dir === "rtl" &&
      beforeFaToggle === "false" &&
      faToggled === "true" &&
      (faLayers.caption === null || /میانگین بازده/.test(faLayers.caption)),
    `aria "${faLayers.aria}", dir ${faLayers.dir}, toggle ${beforeFaToggle}→${faToggled}, labels ${JSON.stringify(faLayers.labels)}`,
  );
  await page.click('header button:has-text("EN")');
  await page.waitForTimeout(400);

  // v9-10: the row wraps at 360px — no sideways scroll, the row stays
  // compact (at most ~3 chip rows inside the card).
  await page.setViewportSize({ width: 360, height: 800 });
  await page.waitForTimeout(400);
  const mobileRow = await page.evaluate(() => {
    const row = document.querySelector("[data-cw=chart-layers]") as HTMLElement | null;
    const r = row?.getBoundingClientRect();
    return {
      h: r ? Math.round(r.height) : -1,
      w: r ? Math.round(r.width) : -1,
      scrollW: document.documentElement.scrollWidth,
    };
  });
  await page.screenshot({ path: `${OUT}/v9-mobile360-layers.png` });
  check(
    "v9-10-mobile-360-wraps",
    mobileRow.scrollW <= 360 && mobileRow.h > 0 && mobileRow.h <= 115 && mobileRow.w <= 336,
    `row ${mobileRow.w}x${mobileRow.h}, scrollW ${mobileRow.scrollW}`,
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.waitForTimeout(300);

  // v9-11: the chips reuse the page's own chip colour pairs (the asset
  // chips' own AA-verified combination), in light and dark.
  for (const scheme of ["light", "dark"] as const) {
    await page.evaluate((s) => {
      document.documentElement.classList.toggle("dark", s === "dark");
    }, scheme);
    await page.waitForTimeout(250);
    const chipColours = await page.evaluate(() => {
      const on = document.querySelector('[data-cw="chart-toggle-total"]') as HTMLElement | null;
      const off = document.querySelector('[data-cw="chart-toggle-gold"]') as HTMLElement | null;
      const activeAsset = document.querySelector('[data-cw="asset-australian-shares"]') as HTMLElement | null;
      const inactiveAsset = document.querySelector('[data-cw="asset-gold"]') as HTMLElement | null;
      const cs = (el: HTMLElement | null) => (el ? { color: getComputedStyle(el).color, bg: getComputedStyle(el).backgroundColor } : null);
      return { on: cs(on), off: cs(off), asset: cs(activeAsset), offAsset: cs(inactiveAsset) };
    });
    check(
      `v9-11-${scheme}-chip-tokens`,
      chipColours.on !== null &&
        chipColours.off !== null &&
        chipColours.on.color === chipColours.asset?.color &&
        chipColours.on.bg === chipColours.asset?.bg &&
        chipColours.off.color === chipColours.offAsset?.color &&
        chipColours.off.bg === chipColours.offAsset?.bg,
      `${scheme}: on ${chipColours.on?.color} on ${chipColours.on?.bg} === the asset chips' own pair (off ${chipColours.off?.color} on ${chipColours.off?.bg})`,
    );
  }
  await page.evaluate(() => document.documentElement.classList.remove("dark"));

  // v9-12: store-nothing after all the layer toggling.
  const storageAfterLayers = await page.evaluate(() => ({
    local: Object.keys(window.localStorage),
    cookies: document.cookie,
  }));
  check(
    "v9-12-no-storage-after-layers",
    storageAfterLayers.local.length === 0 && storageAfterLayers.cookies === "",
    JSON.stringify(storageAfterLayers),
  );

  // v9-13: the pre-v9 look is one click-set away — everything on
  // redraws all four comparison lines (the recorded v8 default).
  for (const id of [...coreOn, ...comparisons]) {
    const on = await page.getAttribute(`[data-cw="chart-toggle-${id}"]`, "aria-pressed");
    if (on !== "true") await page.click(`[data-cw="chart-toggle-${id}"]`);
  }
  const allOn = await chartState();
  check(
    "v9-13-all-on-restores-v8-look",
    allOn.paths === 11 &&
      ["S&P 500", "World shares", "Gold", "Cash"].every((name) => allOn.svgTexts.includes(name)),
    `paths ${allOn.paths}, comparison labels ${JSON.stringify(allOn.svgTexts.filter((t) => ["S&P 500", "World shares", "Gold", "Cash"].includes(t)))}`,
  );
  // Leave the page in its honest default for any later checks.
  for (const id of comparisons) {
    const on = await page.getAttribute(`[data-cw="chart-toggle-${id}"]`, "aria-pressed");
    if (on === "true") await page.click(`[data-cw="chart-toggle-${id}"]`);
  }

  /* ---------------------------------------------------------------- *
   * v10 — the spending receipt (spec §5.5, tests 50–52)
   * ---------------------------------------------------------------- */
  // Start from the canonical default (a reload — which also proves the
  // receipt resets to the three examples; store-nothing, v10-11).
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=receipt-paper]");

  // v10-1: the three examples on arrival, the exact totals, the hint,
  // and the projection visible at the default horizon (10).
  const receiptArrival = await page.evaluate(() => {
    const items = [...document.querySelectorAll("[data-cw=receipt-item]")].map((li) => {
      const price = li.querySelector("span[dir=ltr]") as HTMLElement | null;
      return {
        label: (li.querySelector("span")?.textContent ?? "").trim(),
        price: price?.textContent ?? "",
        removeAria: li.querySelector("[data-cw=receipt-remove]")?.getAttribute("aria-label") ?? "",
      };
    });
    return {
      items,
      monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
      yearly: document.querySelector("[data-cw=receipt-total-yearly]")?.textContent ?? "",
      hint: document.querySelector("[data-cw=receipt-hint]")?.textContent ?? "",
      sentence: document.querySelector("[data-cw=receipt-sentence]")?.textContent ?? "",
      fromLine: document.querySelector("[data-cw=receipt-fromline]")?.textContent ?? "",
      assumption: document.querySelector("[data-cw=receipt-assumption]")?.textContent ?? "",
      horizon10: document.querySelector("[data-cw=receipt-horizon-10]")?.getAttribute("aria-pressed"),
      donutPct: document.querySelector("[data-cw=receipt-donut] [data-cw=share-seg-putin]")?.getAttribute("stroke-dasharray")?.split(" ")[0] ?? null,
      donutRole: document.querySelector("[data-cw=receipt-donut] [data-cw=share-donut]")?.getAttribute("role") ?? "",
      examplesTag: document.querySelector("[data-cw=receipt-examples-tag]")?.textContent ?? "",
      guideLabel: document.querySelector("[data-cw=receipt-guide-open]")?.textContent ?? "",
      sr: document.querySelector("[data-cw=receipt-sr]")?.textContent ?? "",
    };
  });
  check(
    "v10-1-examples-on-arrival",
    receiptArrival.items.length === 3 &&
      ["YouTube Premium", "Spotify", "iCloud+ 2TB"].every((l) => receiptArrival.items.some((i) => i.label === l)) &&
      receiptArrival.monthly.includes("A$34.97") &&
      receiptArrival.yearly.includes("A$419.64") &&
      (receiptArrival.hint ?? "").includes("examples") &&
      receiptArrival.sentence.includes("A$34.97") &&
      receiptArrival.sentence.includes("about A$6,000") &&
      receiptArrival.sentence.includes("about A$4,600") &&
      receiptArrival.fromLine.includes("A$4,200") &&
      receiptArrival.fromLine.includes("A$1,790") &&
      receiptArrival.assumption.includes("Australian shares") &&
      receiptArrival.horizon10 === "true" &&
      Math.abs(Number((receiptArrival as any).donutPct) - 70.154) < 0.5 &&
      (receiptArrival as any).donutRole === "img" &&
      (receiptArrival as any).examplesTag.toUpperCase().includes("EXAMPLE") &&
      (receiptArrival as any).guideLabel.length > 3 &&
      receiptArrival.sr.includes("A$34.97") &&
      receiptArrival.sr.includes("A$6,000"),
    `items ${JSON.stringify(receiptArrival.items.map((i) => i.label))}, monthly ${receiptArrival.monthly}, donut put% ${(receiptArrival as any).donutPct}, sentence ${(receiptArrival.sentence ?? "").slice(0, 90)}`,
  );

  // v10-2: add (label + price + cadence) updates totals, projection and
  // the live region; the What and Price clear; the cadence persists.
  await page.fill("[data-cw=receipt-what]", "Netflix");
  await page.fill("[data-cw=receipt-price]", "15.98");
  await page.selectOption("[data-cw=receipt-cadence]", "monthly");
  await page.click("[data-cw=receipt-add]");
  await page.waitForTimeout(200);
  const afterAdd = await page.evaluate(() => ({
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    live: document.querySelector("[data-cw=receipt-live]")?.textContent ?? "",
    what: (document.querySelector("[data-cw=receipt-what]") as HTMLInputElement)?.value ?? "",
    price: (document.querySelector("[data-cw=receipt-price]") as HTMLInputElement)?.value ?? "",
    cadence: (document.querySelector("[data-cw=receipt-cadence]") as HTMLSelectElement)?.value ?? "",
    sentence: document.querySelector("[data-cw=receipt-sentence]")?.textContent ?? "",
    itemCount: document.querySelectorAll("[data-cw=receipt-item]").length,
    hint: document.querySelector("[data-cw=receipt-hint]") === null,
  }));
  check(
    "v10-2-add-updates-all",
    afterAdd.monthly.includes("A$50.95") &&
      afterAdd.live === "Added Netflix. Total A$50.95 a month." &&
      afterAdd.what === "" &&
      afterAdd.price === "" &&
      afterAdd.cadence === "monthly" &&
      afterAdd.sentence.includes("A$50.95") &&
      afterAdd.itemCount === 4 &&
      afterAdd.hint,
    JSON.stringify({ monthly: afterAdd.monthly, live: afterAdd.live, sentence: afterAdd.sentence.slice(0, 60) }),
  );

  // v10-5: cadence through the UI — $120 yearly adds exactly 10 to the
  // monthly total (yearly × 1/12), and the cadence persists after add.
  await page.fill("[data-cw=receipt-what]", "Domain name");
  await page.fill("[data-cw=receipt-price]", "120");
  await page.selectOption("[data-cw=receipt-cadence]", "yearly");
  await page.click("[data-cw=receipt-add]");
  await page.waitForTimeout(200);
  const afterYearly = await page.evaluate(() => ({
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    cadence: (document.querySelector("[data-cw=receipt-cadence]") as HTMLSelectElement)?.value ?? "",
    lastLine: [...document.querySelectorAll("[data-cw=receipt-item]")].pop()?.textContent ?? "",
  }));
  check(
    "v10-5-cadence-normalization",
    afterYearly.monthly.includes("A$60.95") && afterYearly.cadence === "yearly" && afterYearly.lastLine.includes("A$120.00"),
    `monthly ${afterYearly.monthly}, cadence kept ${afterYearly.cadence}, line ${afterYearly.lastLine.slice(0, 50)}`,
  );

  // v10-3: remove — the item leaves, the totals and the live region update.
  await page.click('[data-cw=receipt-remove][aria-label*="Spotify"]');
  await page.waitForTimeout(200);
  const afterRemove = await page.evaluate(() => ({
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    live: document.querySelector("[data-cw=receipt-live]")?.textContent ?? "",
    spotifyGone: ![...document.querySelectorAll("[data-cw=receipt-item]")].some((li) =>
      (li.textContent ?? "").includes("Spotify"),
    ),
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
  }));
  check(
    "v10-3-remove",
    afterRemove.spotifyGone && afterRemove.count === 4 && afterRemove.monthly.includes("A$49.96") &&
      afterRemove.live === "Removed Spotify. Total A$49.96 a month.",
    `monthly ${afterRemove.monthly}, live ${afterRemove.live}`,
  );

  // v10-7: the projection's numbers match an independent reference at
  // the page's own current rate (read the measured line, like the v6
  // grid-vs-live check). The loop below is the reference method ported
  // line for line (end-of-month deposits, monthly rate (1+r)^(1/12)−1,
  // the plan's 0.2% cost), never the page's own engine code.
  const measuredRate = await page.evaluate(() => {
    const line = document.querySelector("[data-cw=measured-line]")?.textContent ?? "";
    const m = line.match(/([\d.]+)%\s*·\s*20 years/);
    return m ? Number(m[1]) : NaN;
  });
  const refFinal = (() => {
    const rNet = (measuredRate - 0.2) / 100;
    const i = Math.pow(1 + rNet, 1 / 12) - 1;
    let balance = 0;
    for (let m = 1; m <= 120; m++) {
      balance = balance * (1 + i) + 49.96;
    }
    return Math.round(balance / 100) * 100;
  })();
  const sentenceNow = await page.textContent("[data-cw=receipt-sentence]");
  check(
    "v10-7-projection-matches-reference",
    Number.isFinite(measuredRate) &&
      measuredRate === 7.2 &&
      sentenceNow?.includes(`about A$${refFinal.toLocaleString("en-US")}`),
    `measured ${measuredRate}% → reference about A$${refFinal.toLocaleString("en-US")}; page says ${(sentenceNow ?? "").slice(0, 95)}`,
  );

  // v10-8: label-in-name on every remove button.
  const removeLabels = await page.evaluate(() =>
    [...document.querySelectorAll("[data-cw=receipt-remove]")].map((b) => ({
      aria: b.getAttribute("aria-label") ?? "",
      item: (b.closest("li")?.querySelector("span")?.textContent ?? "").trim(),
    })),
  );
  check(
    "v10-8-label-in-name",
    removeLabels.length === 4 &&
      removeLabels.every((r) => r.aria.startsWith("Remove ") && r.aria.includes(r.item) && /\d/.test(r.aria)),
    removeLabels.map((r) => r.aria).join(" | ").slice(0, 140),
  );

  // v10-9: keyboard-only — add, remove and clear without any pointer.
  // (The select is keyboard-driven the native way: "m" picks Monthly —
  // the cadence had persisted as Yearly from v10-5, which is its own
  // checked feature.)
  await page.focus("[data-cw=receipt-what]");
  await page.keyboard.type("Gym membership");
  await page.keyboard.press("Tab");
  await page.keyboard.type("55");
  await page.keyboard.press("Tab"); // the cadence select
  await page.keyboard.press("m"); // native select: first-letter jump to Monthly
  await page.keyboard.press("Tab"); // the Add button
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const kbAdd = await page.evaluate(() => ({
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    has: [...document.querySelectorAll("[data-cw=receipt-item]")].some((li) => (li.textContent ?? "").includes("Gym membership")),
  }));
  await page.focus('[data-cw=receipt-remove][aria-label*="Netflix"]');
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const kbRemove = await page.evaluate(() => ({
    netflixGone: ![...document.querySelectorAll("[data-cw=receipt-item]")].some((li) => (li.textContent ?? "").includes("Netflix")),
    live: document.querySelector("[data-cw=receipt-live]")?.textContent ?? "",
  }));
  await page.focus("[data-cw=receipt-clear]");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(150);
  const kbClear1 = await page.textContent("[data-cw=receipt-clear]");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  const kbClear2 = await page.evaluate(() => ({
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
    empty: document.querySelector("[data-cw=receipt-empty]")?.textContent ?? "",
    live: document.querySelector("[data-cw=receipt-live]")?.textContent ?? "",
    focused: document.activeElement?.getAttribute("data-cw") ?? "",
  }));
  check(
    "v10-9-keyboard-only",
    kbAdd.has && kbAdd.monthly.includes("A$104.96") &&
      kbRemove.netflixGone && kbRemove.live.includes("Removed Netflix") &&
      kbClear1 === "Sure? Clear all" &&
      kbClear2.count === 0 && kbClear2.empty.includes("Add a cost") && kbClear2.focused === "receipt-add",
    `kb add ${kbAdd.monthly}, clear label "${kbClear1}", after: ${kbClear2.count} items, focus ${kbClear2.focused}`,
  );

  // v10-4: the clear's two-step and its 4-second timeout. The keyboard
  // flow above left the list empty; re-add one item first.
  await page.fill("[data-cw=receipt-price]", "5");
  await page.click("[data-cw=receipt-add]");
  await page.waitForTimeout(150);
  await page.click("[data-cw=receipt-clear]");
  await page.waitForTimeout(150);
  const armedState = await page.evaluate(() => ({
    label: document.querySelector("[data-cw=receipt-clear]")?.textContent ?? "",
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
  }));
  await page.waitForTimeout(4300); // the 4-second disarm timeout
  const disarmedState = await page.evaluate(() => ({
    label: document.querySelector("[data-cw=receipt-clear]")?.textContent ?? "",
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
  }));
  await page.click("[data-cw=receipt-clear]"); // re-arms (not clears — disarmed)
  await page.waitForTimeout(150);
  const reArmed = await page.evaluate(() => ({
    label: document.querySelector("[data-cw=receipt-clear]")?.textContent ?? "",
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
  }));
  await page.click("[data-cw=receipt-clear]"); // second tap clears
  await page.waitForTimeout(150);
  const clearedState = await page.evaluate(() => ({
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
    empty: document.querySelector("[data-cw=receipt-empty]")?.textContent ?? "",
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    projectionGone: document.querySelector("[data-cw=receipt-sentence]") === null,
  }));
  check(
    "v10-4-clear-two-step",
    armedState.label === "Sure? Clear all" && armedState.count === 1 &&
      disarmedState.label === "Clear all" && disarmedState.count === 1 &&
      reArmed.label === "Sure? Clear all" && reArmed.count === 1 &&
      clearedState.count === 0 && clearedState.empty.includes("Add a cost") &&
      clearedState.monthly.includes("A$0.00") && clearedState.projectionGone,
    `armed "${armedState.label}" (1 item), after 4.3s "${disarmedState.label}" (1 item), re-arm, cleared → ${clearedState.count} items`,
  );

  // v10-6: validation — an empty price rejects with one small plain
  // message; a huge price clamps to the bound (999,999) with the same
  // message. Never an error state.
  await page.fill("[data-cw=receipt-what]", "Nothing");
  await page.click("[data-cw=receipt-add]");
  await page.waitForTimeout(150);
  const emptyPrice = await page.evaluate(() => ({
    note: document.querySelector("[data-cw=receipt-note]")?.textContent ?? "",
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
  }));
  await page.fill("[data-cw=receipt-what]", "Everything");
  await page.fill("[data-cw=receipt-price]", "2000000");
  await page.selectOption("[data-cw=receipt-cadence]", "monthly");
  await page.click("[data-cw=receipt-add]");
  await page.waitForTimeout(150);
  const hugePrice = await page.evaluate(() => {
    const last = [...document.querySelectorAll("[data-cw=receipt-item]")].pop();
    return {
      note: document.querySelector("[data-cw=receipt-note]")?.textContent ?? "",
      count: document.querySelectorAll("[data-cw=receipt-item]").length,
      lastLine: last?.textContent ?? "",
      monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
      sentenceFinite: document.querySelector("[data-cw=receipt-sentence]")?.textContent ?? "",
    };
  });
  check(
    "v10-6-clamp-message",
    (emptyPrice.note ?? "").includes("outside the allowed range") && emptyPrice.count === 0 &&
      hugePrice.count === 1 && hugePrice.lastLine.includes("A$999,999.00") &&
      (hugePrice.note ?? "").includes("outside the allowed range") &&
      Number.isFinite(Number((hugePrice.sentenceFinite.match(/A\$([\d,]+)/) ?? [])[1]?.replace(/,/g, ""))),
    `empty → note "${emptyPrice.note}", count ${emptyPrice.count}; huge → "${hugePrice.lastLine.slice(0, 40)}", monthly ${hugePrice.monthly}`,
  );

  // v10-10: the sr summary mirrors the visible numbers at the one-item
  // state — n, the monthly total, the yearly total and the sentence.
  const srNow = await page.textContent("[data-cw=receipt-sr]");
  check(
    "v10-10-sr-summary-mirrors",
    (srNow ?? "").includes("1 cost") &&
      (srNow ?? "").includes("A$999,999.00 a month") &&
      (srNow ?? "").includes("A$11,999,988.00 a year") &&
      (srNow ?? "").includes("about A$"),
    JSON.stringify(srNow?.slice(0, 150)),
  );

  // v10-11: store-nothing rechecked — reload restores the examples and
  // nothing was ever written.
  const storageBefore = await page.evaluate(() => ({
    local: Object.keys(window.localStorage),
    cookies: document.cookie,
  }));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=receipt-paper]");
  const afterReload = await page.evaluate(() => ({
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    hint: document.querySelector("[data-cw=receipt-hint]")?.textContent ?? "",
    live: document.querySelector("[data-cw=receipt-live]")?.textContent ?? "",
    sentence: document.querySelector("[data-cw=receipt-sentence]")?.textContent ?? "",
  }));
  check(
    "v10-11-reload-restores-examples",
    storageBefore.local.length === 0 && storageBefore.cookies === "" &&
      afterReload.count === 3 && afterReload.monthly.includes("A$34.97") &&
      (afterReload.hint ?? "").includes("examples") && afterReload.live === "" &&
      afterReload.sentence.includes("about A$6,000"),
    `${afterReload.count} items, monthly ${afterReload.monthly}, hint ${afterReload.hint ? "back" : "MISSING"}`,
  );

  // v10-12: the default-screen inventory gains exactly the receipt's
  // own controls, and the one-screen rule holds at the three sizes with
  // the receipt present (it lives below the fold).
  const receiptInventory = await page.evaluate(() => {
    const main = document.querySelector("main")!;
    const ids = [...main.querySelectorAll("button, input, select")]
      .map((el) => el.getAttribute("data-cw") ?? "")
      .filter((cw) => cw.startsWith("receipt-"));
    return ids;
  });
  const expectedReceiptIds = [
    "receipt-what", "receipt-price", "receipt-cadence", "receipt-add",
    "receipt-guide-open",
    "receipt-remove", "receipt-remove", "receipt-remove",
    "receipt-clear", "receipt-horizon-3", "receipt-horizon-5", "receipt-horizon-10",
  ];
  const oneScreenOk: boolean[] = [];
  for (const [w, h] of [[390, 844], [360, 800], [430, 932]] as const) {
    await page.setViewportSize({ width: w, height: h });
    await page.evaluate(() => window.scrollTo(0, 0));
    // (600ms: the resize re-render — the chart re-measures its width —
    // can outlast 350ms on a loaded dev server; measured, the flake
    // recorded in the v10.1 test report.)
    await page.waitForTimeout(600);
    const fit = await page.evaluate(() => {
      const vp = window.innerHeight;
      const headline = document.querySelector("[data-cw=headline]")!.getBoundingClientRect();
      const chips = document.querySelector("[data-cw=asset-chips]")!.getBoundingClientRect();
      const receipt = document.getElementById("spending-receipt")!.getBoundingClientRect();
      return {
        headlineVisible: headline.bottom <= vp && headline.top >= 0,
        controlsVisible: chips.bottom <= vp,
        receiptBelowFold: receipt.top > vp,
        scrollW: document.documentElement.scrollWidth,
      };
    });
    oneScreenOk.push(fit.headlineVisible && fit.controlsVisible && fit.receiptBelowFold && fit.scrollW <= w);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  check(
    "v10-12-default-screen-untouched",
    JSON.stringify(receiptInventory.sort()) === JSON.stringify(expectedReceiptIds.sort()) &&
      oneScreenOk.length === 3 && oneScreenOk.every(Boolean),
    `receipt controls ${JSON.stringify(receiptInventory)}, one-screen ${oneScreenOk.join("/")}`,
  );

  // v10-13 (test 51): the projection follows the plan — switch asset →
  // the assumption line and the numbers change.
  await page.click("[data-cw=asset-gold]");
  await page.waitForTimeout(300);
  const goldProjection = await page.evaluate(() => ({
    assumption: document.querySelector("[data-cw=receipt-assumption]")?.textContent ?? "",
    sentence: document.querySelector("[data-cw=receipt-sentence]")?.textContent ?? "",
  }));
  check(
    "v10-13-follows-asset",
    goldProjection.assumption.includes("Gold") && !goldProjection.sentence.includes("about A$6,000"),
    `assumption "${goldProjection.assumption}", sentence ${(goldProjection.sentence ?? "").slice(0, 85)}`,
  );

  // v10-14 (test 51): costs on/off change the numbers — the yearly cost
  // 3% lowers the projection; back at 0.2% the arrival vector returns.
  await page.click('[data-cw="asset-australian-shares"]');
  await page.waitForTimeout(200);
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await page.click("[data-cw=group-costs-toggle]");
  await page.waitForSelector("#cw-cost");
  await page.fill("#cw-cost", "3");
  await page.waitForTimeout(400);
  const costly = await page.textContent("[data-cw=receipt-sentence]");
  await page.fill("#cw-cost", "0.2");
  await page.waitForTimeout(400);
  const cheap = await page.textContent("[data-cw=receipt-sentence]");
  check(
    "v10-14-follows-costs",
    (costly ?? "") !== (cheap ?? "") && !costly?.includes("about A$6,000") && cheap?.includes("about A$6,000"),
    `3% cost → ${(costly ?? "").slice(0, 70)} | 0.2% → ${(cheap ?? "").slice(0, 70)}`,
  );

  // v10-15 (test 51): the honest edge through the UI — a 0% custom
  // rate (net −0.2% after the plan's cost) hides the bar and keeps the
  // sentence.
  await page.click("[data-cw=group-rates-toggle]");
  await page.click('[data-cw="rate-mode"] button:has-text("Custom rate")');
  await page.waitForSelector("#cw-crate");
  await page.fill("#cw-crate", "0");
  await page.waitForSelector("[data-cw=receipt-sentence]");
  const zeroRate = await page.evaluate(() => ({
    barInPaper: document.querySelectorAll("[data-cw=receipt-donut] [data-cw=share-donut]").length,
    sentence: document.querySelector("[data-cw=receipt-sentence]")?.textContent ?? "",
    todayBeside: document.querySelector("[data-cw=receipt-sentence]")?.textContent.includes("today's money"),
  }));
  await page.click('[data-cw="rate-mode"] button:has-text("Average")');
  await page.waitForTimeout(300);
  check(
    "v10-15-honest-edge-bar-hidden",
    zeroRate.barInPaper === 0 && zeroRate.sentence.length > 20 && zeroRate.todayBeside,
    `bar ${zeroRate.barInPaper}, sentence kept: ${zeroRate.sentence.slice(0, 80)}`,
  );

  // v10-16 (test 51): the never-invests plain sentence when a large fee
  // eats the monthly total. (The Costs fold is already open from v10-14 —
  // open it only if it is not.)
  if ((await page.locator("#cw-fee").count()) === 0) await page.click("[data-cw=group-costs-toggle]");
  await page.waitForSelector("#cw-fee");
  await page.fill("#cw-fee", "5000");
  await page.locator("[data-cw=receipt-never-invests]").waitFor({ timeout: 10000 });
  const never = await page.evaluate(() => ({
    line: document.querySelector("[data-cw=receipt-never-invests]")?.textContent ?? "",
    sentenceGone: document.querySelector("[data-cw=receipt-sentence]") === null,
    barGone: document.querySelectorAll("[data-cw=receipt-donut] [data-cw=share-donut]").length === 0,
    sr: document.querySelector("[data-cw=receipt-sr]")?.textContent ?? "",
  }));
  check(
    "v10-16-never-invests",
    never.line.includes("cost eats every purchase") && never.sentenceGone && never.barGone &&
      never.sr.includes("cost eats every purchase"),
    `"${never.line.slice(0, 60)}", sentence gone: ${never.sentenceGone}, sr carries it`,
  );

  // v10-17 (test 52): fa/RTL — Persian digits, mirrored leaders, the fa
  // fonts, and ٪ inside the bar's sr sentence. Reload resets the costs
  // first (store-nothing).
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=receipt-paper]");
  await page.click('header button:has-text("فا")');
  await page.waitForTimeout(400);
  const faReceipt = await page.evaluate(() => {
    const sec = document.getElementById("spending-receipt")!;
    const item = sec.querySelector("[data-cw=receipt-item]")!;
    const label = item.querySelector("span")!.getBoundingClientRect();
    const amount = item.querySelector("span[dir=ltr]")!.getBoundingClientRect();
    return {
      dir: sec.closest("[dir]")?.getAttribute("dir") ?? getComputedStyle(sec).direction,
      heading: sec.querySelector("h2")?.textContent ?? "",
      monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
      hasPersianDigits: /[۰-۹]/.test(document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? ""),
      labelRightOfAmount: label.x > amount.x, // mirrored: label at the reading start (right)
      font: getComputedStyle(sec.querySelector("[data-cw=receipt-lines]")!).fontFamily,
      barSr: document.querySelector("[data-cw=receipt-donut] [data-cw=share-donut]")?.getAttribute("aria-label") ?? "",
      sr: document.querySelector("[data-cw=receipt-sr]")?.textContent ?? "",
      sentence: document.querySelector("[data-cw=receipt-sentence]")?.textContent ?? "",
      addLabel: document.querySelector("[data-cw=receipt-add]")?.textContent ?? "",
    };
  });
  check(
    "v10-17-fa-rtl",
    faReceipt.dir === "rtl" &&
      faReceipt.heading === "رسید خرج‌های شما" &&
      faReceipt.monthly.includes("۳۴٫۹۷") &&
      faReceipt.hasPersianDigits &&
      faReceipt.labelRightOfAmount &&
      !faReceipt.font.includes("monospace") && // fa uses the site's own Persian font
      faReceipt.barSr.includes("٪") &&
      faReceipt.sr.includes("۳۴٫۹۷") &&
      (faReceipt.sentence ?? "").includes("۶٬۰۰۰") &&
      faReceipt.addLabel === "اضافه کردن",
    `dir ${faReceipt.dir}, monthly ${faReceipt.monthly}, mirrored ${faReceipt.labelRightOfAmount}, bar sr has ٪: ${faReceipt.barSr.includes("٪")}`,
  );

  // v10-18 (test 52): 360px with a 28-char label wraps, never scrolls
  // sideways. (Still in fa — a longer Persian-friendly label.)
  await page.setViewportSize({ width: 360, height: 800 });
  await page.fill("[data-cw=receipt-what]", "ThisIsAVeryLongSubscriptionName28");
  await page.fill("[data-cw=receipt-price]", "4.50");
  await page.selectOption("[data-cw=receipt-cadence]", "daily");
  await page.click("[data-cw=receipt-add]");
  await page.waitForTimeout(200);
  const wrap360 = await page.evaluate(() => {
    const label = [...document.querySelectorAll("[data-cw=receipt-item] span")]
      .map((s) => s.getBoundingClientRect())
      .find((r) => r.width > 0);
    return {
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      labelRight: label ? label.right <= 360 : false,
    };
  });
  check(
    "v10-18-360-wraps",
    wrap360.scrollW <= wrap360.clientW && wrap360.labelRight,
    `scrollW ${wrap360.scrollW}/${wrap360.clientW}, label inside viewport: ${wrap360.labelRight}`,
  );

  // v10-19 (test 52): the paper's fixed palette is AA in light AND
  // dark (the pairs are fixed; both themes measured).
  const paletteAA: boolean[] = [];
  for (const dark of [false, true]) {
    await page.evaluate((d) => {
      document.documentElement.classList.toggle("dark", d);
    }, dark);
    await page.waitForTimeout(200);
    const c = await page.evaluate(() => {
      const paperEl = document.querySelector("[data-cw=receipt-paper]") as HTMLElement;
      const inkEl = document.querySelector("[data-cw=receipt-header]") as HTMLElement;
      // the muted sample: the yearly total line — always rendered on the paper
      const mutedEl = document.querySelector("[data-cw=receipt-total-yearly]") as HTMLElement;
      const lum = (s: string) => {
        const m = s.match(/\d+(\.\d+)?/g)!;
        const [r, g, b] = m.slice(0, 3).map(Number).map((v) => v / 255).map((v) =>
          v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
        );
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a: string, b: string) => {
        const la = lum(a), lb = lum(b);
        return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
      };
      const paper = getComputedStyle(paperEl).backgroundColor;
      return {
        dark: document.documentElement.classList.contains("dark"),
        paper,
        inkRatio: ratio(getComputedStyle(inkEl).color, paper),
        mutedRatio: ratio(getComputedStyle(mutedEl).color, paper),
      };
    });
    paletteAA.push(c.inkRatio >= 7 && c.mutedRatio >= 4.5);
  }
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  check(
    "v10-19-paper-aa-both-themes",
    paletteAA.length === 2 && paletteAA.every(Boolean),
    `ink/muted ratios passed in light and dark: ${paletteAA.join("/")}`,
  );

  // v10-20 (test 52): plain language — the receipt's own text keeps the
  // sentence discipline (no jargon, average ≤ 15 words). Back to EN.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.click('header button:has-text("EN")');
  await page.waitForTimeout(400);
  const plain = await page.evaluate(() => {
    const sec = document.getElementById("spending-receipt")!;
    // Sentence length is measured over sentences (the test-18 method:
    // split the paragraph text on its enders); jargon over every word.
    const paragraphs = [...sec.querySelectorAll("p")]
      .filter((p) => !p.className.includes("sr-only"))
      .map((p) => (p.textContent ?? "").trim())
      .filter((t) => t.length > 0);
    const all = paragraphs.join(" ");
    const banned = [
      "CAGR", "compound interest", "annualised", "annualized", "nominal", "real return",
      "volatility", "ETF", "index fund", "dividend", "yield", "ROI", "APY",
      "basis point", "expense ratio", "dollar-cost", "hedged", "total return",
      "net present value", "risk-adjusted", "p.a.", "AUM", "drawdown", "alpha",
      "benchmark", "securities", "equities", "portfolio",
    ];
    // The banned word "p.a." contains regex metacharacters — escape
    // every banned word before matching (finding: unescaped, "p.a."
    // matched the plain word "plan"; recorded in the v10 test report).
    const hits = banned.filter((b) => new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(all));
    const sentences = paragraphs
      .join(" ")
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 3);
    const avg = sentences.length
      ? sentences.reduce((n, s) => n + s.trim().split(/\s+/).length, 0) / sentences.length
      : 0;
    return { hits, avg: Math.round(avg * 10) / 10, sentences: sentences.length };
  });
  check(
    "v10-20-plain-language",
    plain.hits.length === 0 && plain.avg <= 15,
    `jargon ${JSON.stringify(plain.hits)}, avg ${plain.avg} words over ${plain.sentences} sentences`,
  );

  /* ---------------------------------------------------------------- *
   * v10.1 — the owner's feedback pass: the guide modal, the examples  *
   * tag's retirement, and the chart's overlap regression.            *
   * ---------------------------------------------------------------- */

  // v10.1-1: the guide modal — opens from the header pill, is a
  // labelled aria-modal dialog with the four steps, Escape closes it
  // and focus returns to the pill that opened it.
  await page.evaluate(() => document.getElementById("spending-receipt")?.scrollIntoView());
  await page.waitForTimeout(250);
  await page.click("[data-cw=receipt-guide-open]");
  await page.waitForSelector("[data-cw=receipt-guide]");
  await page.waitForTimeout(300);
  const guideOpen = await page.evaluate(() => {
    const dlg = document.querySelector("[data-cw=receipt-guide]") as HTMLElement | null;
    if (!dlg) return { present: false };
    return {
      present: true,
      role: dlg.getAttribute("role"),
      ariaModal: dlg.getAttribute("aria-modal"),
      ariaLabel: dlg.getAttribute("aria-label") ?? "",
      title: dlg.querySelector("[data-cw=receipt-guide-title]")?.textContent ?? "",
      steps: [...dlg.querySelectorAll("[data-cw=receipt-guide-step]")].map((s) => (s.textContent ?? "").trim()),
      closeAria: dlg.querySelector("[data-cw=receipt-guide-close]")?.getAttribute("aria-label") ?? "",
      done: dlg.querySelector("[data-cw=receipt-guide-done]")?.textContent ?? "",
      focusInDialog: dlg.contains(document.activeElement),
    };
  });
  check(
    "v10.1-1-guide-modal-opens",
    guideOpen.present === true &&
      (guideOpen as any).role === "dialog" &&
      (guideOpen as any).ariaModal === "true" &&
      /How to use this receipt/i.test((guideOpen as any).ariaLabel) &&
      (guideOpen as any).title === (guideOpen as any).ariaLabel &&
      (guideOpen as any).steps.length === 4 &&
      (guideOpen as any).steps.every((s: string) => s.length > 25) &&
      (guideOpen as any).steps[0].includes("examples") &&
      (guideOpen as any).closeAria.length > 2 &&
      (guideOpen as any).done.length > 2 &&
      (guideOpen as any).focusInDialog,
    `role=${(guideOpen as any).role}, aria-modal=${(guideOpen as any).ariaModal}, ${(guideOpen as any).steps.length} steps, focus inside: ${(guideOpen as any).focusInDialog}`,
  );

  // v10.1-2: the guide modal's keyboard flow — Escape closes, focus
  // returns to the guide pill; Tab stays inside the dialog (the small
  // trap); the Done button closes too.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  const afterEscape = await page.evaluate(() => ({
    gone: document.querySelector("[data-cw=receipt-guide]") === null,
    focusBack: document.activeElement?.getAttribute("data-cw") === "receipt-guide-open",
  }));
  check(
    "v10.1-2-guide-escape-focus",
    afterEscape.gone && afterEscape.focusBack,
    `modal gone: ${afterEscape.gone}, focus returned to the guide pill: ${afterEscape.focusBack}`,
  );
  await page.click("[data-cw=receipt-guide-open]");
  await page.waitForSelector("[data-cw=receipt-guide]");
  await page.waitForTimeout(250);
  await page.keyboard.press("Tab"); // close → done (trapped at the end)
  await page.keyboard.press("Tab"); // done → close (wraps to the start)
  await page.waitForTimeout(120);
  const trap = await page.evaluate(() => ({
    inDialog: !!document.activeElement?.closest("[data-cw=receipt-guide]"),
    on: document.activeElement?.getAttribute("data-cw") ?? "",
  }));
  await page.click("[data-cw=receipt-guide-done]");
  await page.waitForTimeout(250);
  const afterDone = await page.evaluate(() => ({
    gone: document.querySelector("[data-cw=receipt-guide]") === null,
    focusBack: document.activeElement?.getAttribute("data-cw") === "receipt-guide-open",
  }));
  check(
    "v10.1-3-guide-trap-and-done",
    trap.inDialog && afterDone.gone && afterDone.focusBack,
    `Tab stayed inside (${trap.on}), Done closed: ${afterDone.gone}, focus back: ${afterDone.focusBack}`,
  );

  // v10.1-4: the examples tag retires with the first change — reload
  // (restoring the pristine examples + the tag), add one item and the
  // tag (like the hint) disappears.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=receipt-paper]");
  const tagBefore = await page.evaluate(() => ({
    tag: document.querySelector("[data-cw=receipt-examples-tag]")?.textContent ?? "",
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
  }));
  // The locale-invariance rule (found on the live fa walk): a mid-session
  // language toggle keeps the hint and the tag — the items are still the
  // untouched examples, whatever language their labels were born in.
  await page.click('header button:has-text("فا")');
  await page.waitForTimeout(500);
  const tagInFa = await page.evaluate(() => ({
    tag: document.querySelector("[data-cw=receipt-examples-tag]")?.textContent ?? "",
    hint: document.querySelector("[data-cw=receipt-hint]")?.textContent ?? "",
  }));
  await page.click('header button:has-text("EN")');
  await page.waitForTimeout(400);
  check(
    "v10.1-4a-tag-survives-language-toggle",
    /نمونه/.test(tagInFa.tag) && tagInFa.hint.includes("نمونه"),
    `fa tag "${tagInFa.tag}", fa hint "${tagInFa.hint.slice(0, 40)}"`,
  );
  await page.fill("[data-cw=receipt-what]", "Coffee");
  await page.fill("[data-cw=receipt-price]", "5");
  await page.click("[data-cw=receipt-add]");
  await page.waitForTimeout(250);
  const tagAfterAdd = await page.evaluate(() => ({
    tagGone: document.querySelector("[data-cw=receipt-examples-tag]") === null,
    hintGone: document.querySelector("[data-cw=receipt-hint]") === null,
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
  }));
  check(
    "v10.1-4-examples-tag-retires",
    /EXAMPLE/i.test(tagBefore.tag) &&
      tagBefore.count === 3 &&
      tagAfterAdd.tagGone &&
      tagAfterAdd.hintGone &&
      tagAfterAdd.count === 4,
    `tag "${tagBefore.tag}" on ${tagBefore.count} pristine examples → gone: ${tagAfterAdd.tagGone}, hint gone: ${tagAfterAdd.hintGone}, ${tagAfterAdd.count} items`,
  );

  // v10.1-5: the chart's overlap regression — in the default view AND
  // the all-comparison-lines view, no two text labels in the chart SVG
  // may intersect (getBBox on every <text>, pairs checked), and every
  // label must sit inside the SVG's own box.
  const chartOverlap = async (allon: boolean) => {
    await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-cw=headline]");
    if (allon) {
      for (const c of ["sp500", "world", "gold", "cash"]) {
        await page.click(`[data-cw=chart-toggle-${c}]`).catch(() => {});
      }
      await page.waitForTimeout(300);
    }
    return page.evaluate(() => {
      const svg = document.querySelector('section[aria-label="The growth layer overtakes the money you put in"] svg');
      if (!svg) return { ok: false, reason: "no svg" };
      const texts = [...svg.querySelectorAll("text")] as SVGTextElement[];
      const boxes = texts.map((t) => {
        const b = t.getBBox();
        return { text: t.textContent ?? "", x: b.x, y: b.y, w: b.width, h: b.height };
      });
      const overlap = (a: typeof boxes[0], b: typeof boxes[0]) =>
        a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
      const collisions: string[] = [];
      for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            if (overlap(boxes[i], boxes[j])) collisions.push(`${boxes[i].text} ↔ ${boxes[j].text}`);
        }
      }
      const W = Number(svg.getAttribute("width") ?? 0);
      const H = Number(svg.getAttribute("height") ?? 0);
      const outside = boxes.filter((b) => b.x < -1 || b.y < -1 || b.x + b.w > W + 1 || b.y + b.h > H + 1).map((b) => b.text);
      return { ok: true, collisions, outside, n: boxes.length };
    });
  };
  const chartDefault = await chartOverlap(false);
  const chartAllOn = await chartOverlap(true);
  check(
    "v10.1-5-chart-labels-collision-free",
    chartDefault.ok &&
      chartAllOn.ok &&
      (chartDefault as any).collisions.length === 0 &&
      (chartDefault as any).outside.length === 0 &&
      (chartAllOn as any).collisions.length === 0 &&
      (chartAllOn as any).outside.length === 0,
    `default: ${JSON.stringify((chartDefault as any).collisions.slice(0, 3))} outside ${JSON.stringify((chartDefault as any).outside.slice(0, 3))}; all-on: ${JSON.stringify((chartAllOn as any).collisions.slice(0, 3))} outside ${JSON.stringify((chartAllOn as any).outside.slice(0, 3))} over ${(chartAllOn as any).n} labels`,
  );

  // v10.1-6: the milestone labels ride halos — every milestone text in
  // the chart (identified by the milestone token's own fill colour,
  // which the x-axis year labels never use) carries the surface-coloured
  // stroke (paint-order="stroke") that keeps the lines behind it readable.
  const halos = await page.evaluate(() => {
    const svg = document.querySelector('section[aria-label="The growth layer overtakes the money you put in"] svg');
    const milestones = [...(svg?.querySelectorAll("text") ?? [])].filter(
      (t) => (t.getAttribute("fill") ?? "").includes("accent-gold-deep") && /^[\d,]+$/.test((t.textContent ?? "").trim()),
    );
    return milestones.map((t) => ({
      text: t.textContent ?? "",
      paint: t.getAttribute("paint-order"),
      stroke: t.getAttribute("stroke"),
    }));
  });
  check(
    "v10.1-6-milestone-halos",
    halos.length >= 3 && halos.every((h: { paint: string | null; stroke: string | null }) => h.paint === "stroke" && !!h.stroke),
    `${halos.length} milestone labels, all haloed: ${halos.every((h: { paint: string | null }) => h.paint === "stroke")}`,
  );

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
