import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
const browser = await chromium.launch();
for (const scheme of ["light", "dark"] as const) {
  for (const locale of ["en", "fa"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
    const page = await context.newPage();
    await page.goto("https://currena.ir/tools/compound-wealth", { waitUntil: "networkidle", timeout: 60000 });
    if (locale === "fa") {
      await page.click('header button:has-text("فا")');
      await page.waitForTimeout(700);
    }
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const newVisualNodes = axe.violations.flatMap((v) => v.nodes.map((n) => ({ id: v.id, target: n.target })))
      .filter((n) => n.target.some((t) => /donut|whatif|compare-cols|guide|examples-tag/.test(String(t))));
    console.log(
      `${scheme}-${locale}: ${axe.violations.length} violations`,
      axe.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ") || "clean",
      "| new-visual nodes:", JSON.stringify(newVisualNodes),
    );
    await page.close();
    await context.close();
  }
}
await browser.close();
