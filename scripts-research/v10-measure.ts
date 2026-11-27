/* v10: measure the receipt rows — the Persian decimal separator in the
 * DOM, and the x-position of every price span (do digits align?). */
import { chromium } from "playwright";
const browser = await chromium.launch();
for (const fa of [false, true]) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
  if (fa) await page.click("text=فا");
  await page.waitForTimeout(300);
  const data = await page.evaluate(() => {
    const rows = [...document.querySelectorAll("[data-cw=receipt-item]")].map((li) => {
      const spans = [...li.querySelectorAll("span")];
      const price = spans.find((s) => s.dir === "ltr");
      const r = price?.getBoundingClientRect();
      return { text: price?.textContent ?? "", x: r?.x, right: r?.right };
    });
    const total = document.querySelector("[data-cw=receipt-total-monthly]")?.querySelector("span[dir=ltr]")?.textContent;
    return { rows, total, sep: rows[0]?.text?.match(/[^0-9]/)?.join("") };
  });
  console.log(fa ? "FA:" : "EN:", JSON.stringify(data, null, 1));
  await page.close();
}
await browser.close();
