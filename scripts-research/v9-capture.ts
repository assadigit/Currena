/** v9 visual captures for inspection: default, owner-example, benchmarks-on, fa. */
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
await p.waitForSelector("[data-cw=chart-layers]");
await p.waitForTimeout(600);
// Scroll the chart card into view so the capture shows it.
await p.evaluate(() => document.querySelector("[data-cw=chart-layers]")?.closest("section")?.scrollIntoView({ block: "start" }));
await p.waitForTimeout(400);
await p.screenshot({ path: "/home/z/currena/docs/compound-tests/v9-dev-1-default-390.png", fullPage: false });
await p.click('[data-cw="chart-toggle-growth"]');
await p.click('[data-cw="chart-toggle-band"]');
await p.waitForTimeout(400);
await p.screenshot({ path: "/home/z/currena/docs/compound-tests/v9-dev-2-owner-example-390.png", fullPage: false });
await p.click('[data-cw="chart-toggle-growth"]');
await p.click('[data-cw="chart-toggle-band"]');
await p.click('[data-cw="chart-toggle-sp500"]');
await p.click('[data-cw="chart-toggle-gold"]');
await p.click('[data-cw="chart-toggle-cash"]');
await p.waitForTimeout(400);
await p.screenshot({ path: "/home/z/currena/docs/compound-tests/v9-dev-3-benchmarks-390.png", fullPage: false });
await p.click('header button:has-text("فا")');
await p.waitForTimeout(600);
await p.screenshot({ path: "/home/z/currena/docs/compound-tests/v9-dev-4-fa-benchmarks-390.png", fullPage: false });
await b.close();
console.log("captured");
