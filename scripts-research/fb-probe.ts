/* v10 feedback pass: capture the current visuals for VLM audit. */
import { chromium } from "playwright";

const BASE = "http://localhost:3100/tools/compound-wealth";
const browser = await chromium.launch();

interface ShotOpts {
  fa?: boolean;
  dark?: boolean;
  w?: number;
  h?: number;
  scrollSel?: string | null;
  clickFirst?: string[];
  wait?: number;
}

async function shot(name: string, { fa = false, dark = false, w = 390, h = 900, scrollSel = null, clickFirst = [], wait = 800 }: ShotOpts = {}) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);
  if (dark) await page.click('button[aria-pressed] >> text=🌙').catch(() => {});
  if (fa) await page.click("text=فا");
  for (const c of clickFirst) await page.click(c, { timeout: 4000 }).catch(() => errs.push("click-fail: " + c));
  await page.waitForTimeout(wait);
  if (scrollSel) {
    await page.evaluate((sel: string) => {
      const el = document.querySelector(sel);
      if (el) { const r = el.getBoundingClientRect(); window.scrollTo(0, Math.max(0, window.scrollY + r.top - 40)); }
    }, scrollSel);
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: `docs/compound-tests/${name}.png` });
  console.log(name, "| errors:", errs.length ? errs.join(" | ") : "none");
  await page.close();
}

// 1. Main chart, EN mobile, default view (Put in / Growth / Total / Range)
await shot("fb-probe-1-chart-default-390", { scrollSel: '[data-cw="chart-layers"]' });
// 2. Main chart, EN mobile, all comparison lines on
await shot("fb-probe-2-chart-allon-390", {
  clickFirst: ['[data-cw="chart-toggle-sp500"]', '[data-cw="chart-toggle-world"]', '[data-cw="chart-toggle-gold"]', '[data-cw="chart-toggle-cash"]'],
  scrollSel: '[data-cw="chart-layers"]',
});
// 3. Main chart desktop, all lines on
await shot("fb-probe-3-chart-allon-desktop", {
  w: 1280, h: 900,
  clickFirst: ['[data-cw="chart-toggle-sp500"]', '[data-cw="chart-toggle-world"]', '[data-cw="chart-toggle-gold"]', '[data-cw="chart-toggle-cash"]'],
  scrollSel: '[data-cw="chart-layers"]',
});
// 4. The receipt, EN mobile
await shot("fb-probe-4-receipt-390", { scrollSel: "#spending-receipt" });
// 5. The share donut under tiles, EN mobile
await shot("fb-probe-5-donut-390", { scrollSel: '[data-cw="share-donut-wrap"]' });
// 6. What-if column charts, EN mobile
await shot("fb-probe-6-whatif-390", { scrollSel: '[data-cw="whatif-cols"]' });
// 7. fa receipt
await shot("fb-probe-7-receipt-fa-390", { fa: true, scrollSel: "#spending-receipt" });
// 8. The guide modal, EN mobile
await shot("fb-probe-8-guide-modal-390", { scrollSel: "#spending-receipt", clickFirst: ['[data-cw="receipt-guide-open"]'], wait: 600 });
// 9. The compare column chart (behind More options), EN mobile
await shot("fb-probe-9-compare-cols-390", {
  clickFirst: ['[data-cw="more-options"]', '[data-cw="group-dates"] button', '[data-cw="compare-toggle"]'],
  scrollSel: '[data-cw="compare-cols"]', wait: 900,
});

await browser.close();
