import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto("https://currena.ir/tools/compound-wealth", { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(2200);
await page.click("text=فا");
await page.waitForTimeout(900);
await page.evaluate(() => {
  const el = document.getElementById("spending-receipt")!;
  window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 40);
});
await page.waitForTimeout(400);
const probe = await page.evaluate(() => ({
  tag: document.querySelector("[data-cw=receipt-examples-tag]")?.textContent ?? "ELEMENT MISSING",
  tagHTML: document.querySelector("[data-cw=receipt-examples-tag]")?.innerHTML?.slice(0, 120) ?? null,
  hint: document.querySelector("[data-cw=receipt-hint]")?.textContent ?? "hint missing",
  count: document.querySelectorAll("[data-cw=receipt-item]").length,
}));
console.log(JSON.stringify(probe, null, 1));
await browser.close();
