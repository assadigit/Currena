/* v10.1: the paper in context, all four theme/language corners + the fa guide modal. */
import { chromium } from "playwright";
const browser = await chromium.launch();
for (const [name, fa, dark] of [
  ["v10.1-dev-1-en-light", false, false],
  ["v10.1-dev-2-en-dark", false, true],
  ["v10.1-dev-3-fa-light", true, false],
  ["v10.1-dev-4-fa-dark", true, true],
] as [string, boolean, boolean][]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);
  if (dark) await page.click('button[aria-pressed] >> text=🌙').catch(() => {});
  if (fa) await page.click("text=فا");
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const el = document.getElementById("spending-receipt")!;
    const r = el.getBoundingClientRect();
    window.scrollTo(0, Math.max(0, window.scrollY + r.top - 60));
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `docs/compound-tests/${name}.png` });
  // the fa guide modal, open
  if (fa && name.includes("fa-light")) {
    await page.click("[data-cw=receipt-guide-open]");
    await page.waitForTimeout(400);
    await page.screenshot({ path: "docs/compound-tests/v10.1-dev-5-fa-guide-modal.png" });
    await page.keyboard.press("Escape");
  }
  console.log(name, "| errors:", errs.length ? errs.join(" | ") : "none");
  await page.close();
}
await browser.close();
