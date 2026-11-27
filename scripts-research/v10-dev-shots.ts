/* v10: the paper IN CONTEXT — the site's own theme toggle pressed, so
 * the page behind the card really is dark in the dark shots. */
import { chromium } from "playwright";
const browser = await chromium.launch();
for (const [name, fa, dark] of [
  ["v10-dev-1-en-light", false, false],
  ["v10-dev-2-en-dark", false, true],
  ["v10-dev-3-fa-light", true, false],
  ["v10-dev-4-fa-dark", true, true],
] as const) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
  if (dark) await page.click('button[aria-pressed] >> text=🌙').catch(() => page.click('button[title]', { timeout: 3000 }).catch(() => {}));
  if (fa) await page.click("text=فا");
  await page.waitForTimeout(400);
  const bg = await page.evaluate(() => document.documentElement.className);
  await page.evaluate(() => {
    const el = document.getElementById("spending-receipt")!;
    const r = el.getBoundingClientRect();
    window.scrollTo(0, Math.max(0, window.scrollY + r.top - 60));
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `docs/compound-tests/${name}.png` });
  console.log(name, "| html class:", JSON.stringify(bg), "| errors:", errs.length ? errs.join(" | ") : "none");
  await page.close();
}
await browser.close();
