import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
await page.click("text=فا");
const clicks = ['[data-cw="chart-toggle-sp500"]', '[data-cw="chart-toggle-world"]', '[data-cw="chart-toggle-gold"]', '[data-cw="chart-toggle-cash"]'] as const;
for (const c of clicks) await page.click(c, { timeout: 4000 }).catch(() => console.log("click-fail", c));
await page.waitForTimeout(500);
const el = await page.$('section[aria-label="لایهٔ رشد از پولی که وارد کرده‌اید جلو می‌زند"]');
if (!el) { console.log("NOT FOUND"); } else { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(250); await el.screenshot({ path: "docs/compound-tests/fb-chart-5-allon-fa-390.png" }); console.log("ok"); }
await browser.close();
