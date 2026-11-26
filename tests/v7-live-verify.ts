/**
 * v7 — the live golden path on currena.ir: tax on and off (manual and
 * guided, AU and US), fa + RTL + dark, mobile screenshots into
 * docs/compound-tests/, zero console errors.
 * Run:  CW_BASE=https://currena.ir bun tests/v7-live-verify.ts
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.CW_BASE ?? "https://currena.ir";
const OUT = "docs/compound-tests";
mkdirSync(OUT, { recursive: true });

const results: { id: string; pass: boolean; detail: string }[] = [];
const check = (id: string, pass: boolean, detail = "") => {
  results.push({ id, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${id}${detail ? ` — ${detail.slice(0, 110)}` : ""}`);
};

const browser = await chromium.launch();
const errors: string[] = [];

async function freshPage(w: number, h: number, scheme: "light" | "dark" = "light") {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");
  return { ctx, page };
}

/* --- 1. the golden path with the tax OFF: the v6 default screen --- */
{
  const { ctx, page } = await freshPage(390, 844);
  const headline = await page.textContent("[data-cw=headline] p");
  check("live-tax-off-default", /you put in 24,000/.test(headline ?? "") && /about 50,800/.test(headline ?? ""), headline?.slice(0, 90));
  const noTaxUI = await page.evaluate(() => document.querySelectorAll('[data-cw^="tax-"]').length);
  check("live-tax-off-no-tax-ui", noTaxUI === 0, `${noTaxUI} tax elements`);
  await page.screenshot({ path: `${OUT}/v7-live-off-390.png` });
  await ctx.close();
}

/* --- 2. the golden path with the tax ON (manual): AU --- */
{
  const { ctx, page } = await freshPage(390, 844);
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await page.click('[data-cw="group-costs"] button');
  await page.waitForTimeout(300);
  await page.fill("#cw-tax", "32");
  await page.waitForTimeout(400);
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(300);
  const caption = await page.textContent("[data-cw=tax-caption]");
  const takes = await page.textContent("[data-cw=tax-takes]");
  const headline = await page.textContent("[data-cw=headline] p");
  check("live-manual-caption", /After tax at 4\.8% a year \(estimate\)\./.test(caption ?? ""), caption ?? "");
  check("live-manual-takes", /Tax \(estimate\) takes 11,2/.test(takes ?? ""), takes?.slice(0, 50));
  check("live-manual-headline", /about 39,500/.test(headline ?? ""), headline?.slice(0, 110));
  await page.screenshot({ path: `${OUT}/v7-live-manual-390.png`, fullPage: true });
  await ctx.close();
}

/* --- 3. the golden path, guided (AU): income 90,000 --- */
{
  const { ctx, page } = await freshPage(390, 844);
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await page.click('[data-cw="group-costs"] button');
  await page.waitForTimeout(300);
  await page.click("[data-cw=tax-estimate-link]");
  await page.waitForSelector("[data-cw=tax-estimator]");
  await page.fill("#cw-tax-income", "90000");
  await page.waitForTimeout(400);
  const line = await page.textContent("[data-cw=tax-estimate-line]");
  const src = await page.textContent("[data-cw=tax-source-line]");
  check("live-guided-au-line", /about 32\.0% of extra investment earnings goes to tax: 30% income tax plus 2% Medicare levy/.test(line ?? ""), line?.slice(0, 100));
  check("live-guided-au-src", /Australian Taxation Office · the 2026–27 income year · read 26 November 2026/.test(src ?? ""), src ?? "");
  await page.click("[data-cw=tax-use-rate]");
  await page.waitForTimeout(400);
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/v7-live-guided-au-390.png`, fullPage: true });
  const caption = await page.textContent("[data-cw=tax-caption]");
  check("live-guided-au-applied", /4\.8%/.test(caption ?? ""), caption ?? "");
  // The How fold carries the source line (trust extra).
  await page.click("[data-cw=how-toggle]");
  await page.waitForTimeout(400);
  const guided = await page.textContent("[data-cw=how-tax-guided]");
  check("live-how-guided", /Australian Taxation Office, the 2026–27 income year/.test(guided ?? ""), guided?.slice(0, 90));
  await page.screenshot({ path: `${OUT}/v7-live-how-guided-390.png` });
  await ctx.close();
}

/* --- 4. the US guided path + fa + RTL + dark --- */
{
  const { ctx, page } = await freshPage(390, 844, "dark");
  await page.click("[data-cw=country-US]");
  await page.waitForTimeout(400);
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await page.click('[data-cw="group-costs"] button');
  await page.waitForTimeout(300);
  await page.click("[data-cw=tax-estimate-link]");
  await page.waitForSelector("[data-cw=tax-estimator]");
  await page.fill("#cw-tax-income", "90000");
  await page.waitForTimeout(400);
  const usLine = await page.textContent("[data-cw=tax-estimate-line]");
  check("live-guided-us", /about 22\.0% of extra investment earnings goes to tax: 22% income tax\./.test(usLine ?? ""), usLine?.slice(0, 90));
  await page.screenshot({ path: `${OUT}/v7-live-us-dark-390.png` });
  // fa + RTL
  await page.click('header button:has-text("فا")');
  await page.waitForTimeout(500);
  const faLine = await page.textContent("[data-cw=tax-estimate-line]");
  check("live-guided-fa", /۲۲٫۰٪ از درآمد اضافی سرمایه‌گذاری به مالیات می‌رود: ۲۲٪ مالیات بر درآمد\./.test(faLine ?? ""), faLine?.slice(0, 80));
  await page.click("[data-cw=tax-use-rate]");
  await page.waitForTimeout(400);
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/v7-live-fa-dark-390.png`, fullPage: true });
  await ctx.close();
}

/* --- 5. the sticky bar with the tax on (mobile contract) --- */
{
  const { ctx, page } = await freshPage(390, 844);
  await page.click("[data-cw=more-options]");
  await page.waitForSelector("[data-cw=more-options-groups]");
  await page.click('[data-cw="group-costs"] button');
  await page.waitForTimeout(300);
  await page.fill("#cw-tax", "32");
  await page.waitForTimeout(400);
  await page.click("[data-cw=more-options]");
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo(0, 1600));
  await page.waitForTimeout(600);
  const sticky = await page.evaluate(() => {
    const bar = document.querySelector("[data-cw=sticky-bar]");
    return bar !== null && getComputedStyle(bar).display !== "none" && (bar.textContent ?? "").length > 5;
  });
  check("live-sticky-bar-tax-on", sticky, "sticky bar shows with the tax on");
  await page.screenshot({ path: `${OUT}/v7-live-sticky-tax-390.png` });
  await ctx.close();
}

check("live-no-console-errors", errors.length === 0, errors.slice(0, 3).join(" | "));
await browser.close();
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} live checks green`);
if (failed > 0) process.exit(1);
