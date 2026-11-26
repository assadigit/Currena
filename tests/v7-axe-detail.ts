import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const BASE = process.env.CW_BASE ?? "https://currena.ir";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
const page = await ctx.newPage();
await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
await page.click("[data-cw=more-options]");
await page.waitForSelector("[data-cw=more-options-groups]");
await page.click('[data-cw="group-costs"] button');
await page.waitForTimeout(250);
await page.fill("#cw-tax", "32");
await page.waitForTimeout(250);
await page.click("[data-cw=tax-estimate-link]");
await page.waitForSelector("[data-cw=tax-estimator]");
await page.fill("#cw-tax-income", "90000");
await page.waitForTimeout(300);
await page.click("[data-cw=how-toggle]");
await page.waitForTimeout(300);
const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
for (const v of axe.violations) {
  console.log("==", v.id);
  for (const n of v.nodes) {
    console.log("   target:", JSON.stringify(n.target), "|", (n.html ?? "").slice(0, 110).replace(/\n/g, " "));
  }
}
await browser.close();
