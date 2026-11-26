/** The §3.7 accessibility scans: axe-core in light and dark, both locales. */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync } from "node:fs";

async function main() {
  const browser = await chromium.launch();
  const results: Record<string, unknown> = {};
  for (const scheme of ["light", "dark"] as const) {
    for (const locale of ["en", "fa"] as const) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
      const page = await context.newPage();
      await page.goto("https://currena.ir/tools/compound-wealth", { waitUntil: "networkidle" });
      if (locale === "fa") {
        await page.click('header button:has-text("فا")');
        await page.waitForTimeout(500);
      }
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const key = `${scheme}-${locale}`;
      results[key] = {
        violations: axe.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          help: v.help,
        })),
      };
      console.log(
        `${key}: ${axe.violations.length} violations`,
        axe.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ") || "clean",
      );
      await page.close();
      await context.close();
    }
  }
  writeFileSync("docs/compound-tests/phase-a-axe.json", JSON.stringify(results, null, 2));
  await browser.close();
}

main().catch((e) => {
  console.error("ERR", String(e).slice(0, 300));
  process.exit(1);
});
