import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const browser = await chromium.launch();
for (const scheme of ["light", "dark"] as const) {
  for (const locale of ["en", "fa"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
    const page = await context.newPage();
    await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
    if (locale === "fa") {
      await page.click('header button:has-text("فا")');
      await page.waitForTimeout(600);
    }
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    console.log(`${scheme}-${locale}:`, axe.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ") || "clean");
    await page.close();
    await context.close();
  }
}
await browser.close();
