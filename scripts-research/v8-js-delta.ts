/* v8: the JS transferred by the compound page, from a running worker
 * build. Usage: bun scripts-research/v8-js-delta.ts http://localhost:PORT */
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://localhost:8791";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(`${base}/tools/compound-wealth`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const m = await page.evaluate(() => {
  const js = performance
    .getEntriesByType("resource")
    .filter((r) => r.name.endsWith(".js"));
  const sum = (k: "transferSize" | "encodedBodySize") => js.reduce((n, r) => n + (r as any)[k], 0);
  return {
    jsCount: js.length,
    transfer: sum("transferSize"),
    encoded: sum("encodedBodySize"),
    names: js.map((r) => r.name.split("/").pop()).sort(),
  };
});
console.log(JSON.stringify(m, null, 1));
await browser.close();
