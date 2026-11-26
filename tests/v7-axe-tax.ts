/** v7 — axe-core on the NEW tax UI (light + dark × EN + fa), with the tax
 *  on, the Costs group + estimator open and the How fold open. */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.CW_BASE ?? "https://currena.ir";
const browser = await chromium.launch();
const results: Record<string, unknown> = {};
let totalViolations = 0;

for (const scheme of ["light", "dark"] as const) {
  for (const locale of ["en", "fa"] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
    const page = await context.newPage();
    await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
    // open the tax UI: More options → Costs → estimator, set a tax, How fold
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
    if (locale === "fa") {
      await page.click('header button:has-text("فا")');
      await page.waitForTimeout(500);
    }
    await page.click("[data-cw=how-toggle]");
    await page.waitForTimeout(300);
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const key = `${scheme}-${locale}`;
    results[key] = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
    totalViolations += axe.violations.length;
    console.log(
      `${key}: ${axe.violations.length} violations`,
      axe.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ") || "clean",
    );
    await page.close();
    await context.close();
  }
}
writeFileSync("docs/compound-tests/v7-axe-tax.json", JSON.stringify(results, null, 2));
await browser.close();
process.exit(totalViolations > 0 ? 1 : 0);
