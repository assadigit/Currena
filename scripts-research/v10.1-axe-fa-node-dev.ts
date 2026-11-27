import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
const page = await context.newPage();
await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle", timeout: 60000 });
await page.click('header button:has-text("فا")');
await page.waitForTimeout(700);
const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
for (const v of axe.violations) {
  console.log(v.id, v.nodes.length);
  for (const n of v.nodes) console.log("  target:", JSON.stringify(n.target), "html:", (n.html ?? "").slice(0, 160));
}
await browser.close();
