/* v10: the axe pre-scan against the dev server (the live scan runs after
 * the deploy, via tests/compound-axe.ts). */
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
      await page.waitForTimeout(500);
    }
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    console.log(
      `${scheme}-${locale}: ${axe.violations.length} violations`,
      axe.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ") || "clean",
    );
    // any violation inside the receipt section?
    const receiptNodes = axe.violations.flatMap((v) => v.nodes.map((n) => ({ id: v.id, target: n.target })))
      .filter((n) => n.target.some((t) => String(t).includes("receipt")));
    console.log(`  receipt-section nodes: ${JSON.stringify(receiptNodes)}`);
    await page.close();
    await context.close();
  }
}
await browser.close();
