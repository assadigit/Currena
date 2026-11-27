/* v10 feedback pass: element-level captures for VLM audit. */
import { chromium } from "playwright";

const BASE = "http://localhost:3100/tools/compound-wealth";
const browser = await chromium.launch();

interface ElOpts {
  fa?: boolean;
  dark?: boolean;
  w?: number;
  h?: number;
  clickFirst?: string[];
  wait?: number;
}

async function elShot(name: string, sel: string, { fa = false, dark = false, w = 390, h = 900, clickFirst = [], wait = 500 }: ElOpts = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(BASE, { waitUntil: "networkidle" });
  if (dark) await page.click('button[aria-pressed] >> text=🌙').catch(() => {});
  if (fa) await page.click("text=فا");
  for (const c of clickFirst) await page.click(c, { timeout: 4000 }).catch(() => errs.push("click-fail: " + c));
  await page.waitForTimeout(wait);
  const el = await page.$(sel);
  if (!el) { console.log(name, "| ELEMENT NOT FOUND:", sel); await page.close(); return; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await el.screenshot({ path: `docs/compound-tests/${name}.png` });
  console.log(name, "| errors:", errs.length ? errs.join(" | ") : "none");
  await page.close();
}

const CHART = 'section[aria-label="The growth layer overtakes the money you put in"]';

await elShot("fb-chart-1-default-390", CHART);
await elShot("fb-chart-2-allon-390", CHART, {
  clickFirst: ['[data-cw="chart-toggle-sp500"]', '[data-cw="chart-toggle-world"]', '[data-cw="chart-toggle-gold"]', '[data-cw="chart-toggle-cash"]'],
});
await elShot("fb-chart-3-allon-1280", CHART, {
  w: 1280, h: 900,
  clickFirst: ['[data-cw="chart-toggle-sp500"]', '[data-cw="chart-toggle-world"]', '[data-cw="chart-toggle-gold"]', '[data-cw="chart-toggle-cash"]'],
});
await elShot("fb-chart-4-default-1280", CHART, { w: 1280, h: 900 });
await browser.close();
