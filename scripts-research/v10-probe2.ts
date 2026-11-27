/* v10: remove-everything focus flow + keyboard-only + the 360px wrap. */
import { chromium } from "playwright";
const browser = await chromium.launch();

// focus after removing the last row
let page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
await page.click('[data-cw=receipt-remove][aria-label*="YouTube"]');
await page.click('[data-cw=receipt-remove][aria-label*="Spotify"]');
await page.click('[data-cw=receipt-remove][aria-label*="iCloud"]');
await page.waitForTimeout(200);
console.log("after removing all:", await page.evaluate(() => ({
  focused: document.activeElement?.getAttribute("data-cw"),
  items: document.querySelectorAll("[data-cw=receipt-item]").length,
  empty: document.querySelector("[data-cw=receipt-empty]")?.textContent,
})));
await page.close();

// keyboard-only: add + remove + clear without any mouse
page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
await page.focus("[data-cw=receipt-what]");
await page.keyboard.type("Gym membership");
await page.keyboard.press("Tab");
await page.keyboard.type("55");
await page.keyboard.press("Enter"); // submits the form
await page.waitForTimeout(200);
console.log("keyboard add:", await page.textContent("[data-cw=receipt-total-monthly]"),
  "| live:", JSON.stringify(await page.textContent("[data-cw=receipt-live]")));
// keyboard remove the first row: tab to the first ×
await page.focus('[data-cw=receipt-remove][aria-label*="YouTube"]');
await page.keyboard.press("Enter");
await page.waitForTimeout(150);
console.log("keyboard remove live:", JSON.stringify(await page.textContent("[data-cw=receipt-live]")));
await page.close();

// 360px: a 28-char label wraps with no sideways scroll
page = await browser.newPage({ viewport: { width: 360, height: 800 } });
await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
await page.fill("[data-cw=receipt-what]", "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456"); // exactly 28 chars (truncation off — input maxlength 28 + slice)
await page.fill("[data-cw=receipt-price]", "4.50");
await page.selectOption("[data-cw=receipt-cadence]", "daily");
await page.click("[data-cw=receipt-add]");
await page.waitForTimeout(200);
const m = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
  label: document.querySelector("[data-cw=receipt-item]")?.querySelector("span")?.textContent,
  total: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent,
}));
console.log("360px:", JSON.stringify(m));
console.log("sideways scroll:", m.scrollW > m.clientW ? "YES — BAD" : "none");
await page.close();
await browser.close();
