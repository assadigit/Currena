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
      .filter((el) => el.offsetParent !== null || (el as HTMLElement).closest("[style*='opacity']") !== null)
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
  ];
  const forbidden = controlInventory.filter(
    (c) => !allowedPrefixes.some((p) => c.cw.startsWith(p)),
  );
  check(
    "13-exact-controls",
    forbidden.length === 0,
    forbidden.length ? `unexpected: ${forbidden.map((f) => `${f.tag}[${f.cw}]${f.text}`).join(", ")}` : `${controlInventory.length} interactive elements, all spec'd`,
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
    const els = [...document.querySelectorAll("main h1, main h2, main p, main span, main label, main button, main div")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top >= 0 && r.top < vp && el.children.length === 0 && el.textContent.trim().length > 0;
      })
      .map((el) => el.textContent.trim());
    const text = [...new Set(els)].join(" ");
    const banned = [
      "CAGR", "compound interest", "annualised", "annualized", "nominal", "real return",
      "volatility", "ETF", "index fund", "dividend", "yield", "ROI", "APY",
      "basis point", "expense ratio", "dollar-cost", "hedged", "total return",
      "net present value", "risk-adjusted", "p.a.", "AUM", "drawdown", "alpha",
      "benchmark", "securities", "equities", "portfolio",
    ];
    const hits = banned.filter((b) => new RegExp(b, "i").test(text));
    const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 3);
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

  // The page made no network requests for data (only Next assets).
  const dataRequests = await page.evaluate(() => performance.getEntriesByType("resource").map((r) => r.name));
  check(
    "21-no-data-network",
    dataRequests.every((u) => /\/_next\/|\/tools\/compound-wealth/.test(u)),
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
    { id: "en-light", fa: false, dark: false, costs: false },
    { id: "en-dark", fa: false, dark: true, costs: false },
    { id: "en-light-costs", fa: false, dark: false, costs: true },
    { id: "en-dark-costs", fa: false, dark: true, costs: true },
    { id: "fa-light", fa: true, dark: false, costs: false },
    { id: "fa-dark", fa: true, dark: true, costs: false },
    { id: "fa-light-costs", fa: true, dark: false, costs: true },
    { id: "fa-dark-costs", fa: true, dark: true, costs: true },
  ];

  for (const cfg of printConfigs) {
    // Reset the page state with a reload (also proves reset-on-reload).
    await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-cw=headline]");
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

    // Verify: exactly one A4 page, text extractable, key numbers present.
    const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
    const pages = /Pages:\s+(\d+)/.exec(info)?.[1];
    const size = /Page size:\s+([\d x.]+ pts)/.exec(info)?.[1];
    const text = execFileSync("pdftotext", [pdfPath, "-"], { encoding: "utf8" });
    const hasNumbers = cfg.fa
      ? /۵۰|۴۵|۷۲|۲۴/.test(text.replace(/\s/g, ""))
      : /50,800|45,700|72,300|24,000/.test(text);
    check(
      `22-a4-${cfg.id}`,
      pages === "1" && size?.startsWith("595") === true && text.length > 200 && hasNumbers,
      `pages=${pages} size=${size} text=${text.length}B numbers=${hasNumbers}`,
    );
  }

  /* ---------------------------------------------------------------- *
   * The phone card — 3 sizes × EN/fa × dark/light
   * ---------------------------------------------------------------- */
  for (const cfg of [
    { id: "en-dark", fa: false, light: false },
    { id: "en-light", fa: false, light: true },
    { id: "fa-dark", fa: true, light: false },
    { id: "fa-light", fa: true, light: true },
  ]) {
    for (const [w, h] of [[360, 800], [390, 844], [430, 932]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
      await page.waitForSelector("[data-cw=headline]");
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
  // The nav Tools link and the breadcrumb work.
  await rp.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
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
