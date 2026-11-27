/* v9: detail the live color-contrast nodes — which elements, what colors. */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
await page.goto("https://currena.ir/tools/compound-wealth", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
for (const v of axe.violations) {
  console.log(`${v.id} (${v.nodes.length}):`);
  for (const n of v.nodes.slice(0, 25)) {
    console.log(`  target=${JSON.stringify(n.target)} html=${n.html.slice(0, 110)}`);
  }
}
await browser.close();
