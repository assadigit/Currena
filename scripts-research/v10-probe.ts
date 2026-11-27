/* v10: a quick interactive probe of the receipt's golden path. */
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
const errs: string[] = [];
page.on("pageerror", (e) => errs.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });

// 1. examples on arrival
let live = await page.textContent("[data-cw=receipt-live]");
let sr = await page.textContent("[data-cw=receipt-sr]");
console.log("on arrival: live:", JSON.stringify(live), "| sr:", (sr ?? "").slice(0, 80));

// 2. add Netflix 15.98 monthly
await page.fill("[data-cw=receipt-what]", "Netflix");
await page.fill("[data-cw=receipt-price]", "15.98");
await page.selectOption("[data-cw=receipt-cadence]", "monthly");
await page.click("[data-cw=receipt-add]");
await page.waitForTimeout(200);
live = await page.textContent("[data-cw=receipt-live]");
console.log("after add: live:", JSON.stringify(live));
console.log("total now:", await page.textContent("[data-cw=receipt-total-monthly]"));

// 3. add a yearly $120 item → +10/mo exactly
await page.fill("[data-cw=receipt-what]", "Domain");
await page.fill("[data-cw=receipt-price]", "120");
await page.selectOption("[data-cw=receipt-cadence]", "yearly");
await page.click("[data-cw=receipt-add]");
await page.waitForTimeout(200);
console.log("total after yearly 120:", await page.textContent("[data-cw=receipt-total-monthly]"));
console.log("live:", JSON.stringify(await page.textContent("[data-cw=receipt-live]")));

// 4. remove Spotify via aria-label
await page.click('[data-cw=receipt-remove][aria-label*="Spotify"]');
await page.waitForTimeout(200);
console.log("after remove: live:", JSON.stringify(await page.textContent("[data-cw=receipt-live]")));

// 5. horizon chips
await page.click("[data-cw=receipt-horizon-3]");
await page.waitForTimeout(200);
console.log("3y sentence:", await page.textContent("[data-cw=receipt-sentence]"));
await page.click("[data-cw=receipt-horizon-10]");

// 6. clear-all two-step
await page.click("[data-cw=receipt-clear]");
await page.waitForTimeout(150);
console.log("clear label after 1st tap:", await page.textContent("[data-cw=receipt-clear]"));
await page.click("[data-cw=receipt-clear]");
await page.waitForTimeout(200);
console.log("after 2nd tap: items:", await page.locator("[data-cw=receipt-item]").count(),
  "| empty hint:", await page.textContent("[data-cw=receipt-empty]"),
  "| live:", JSON.stringify(await page.textContent("[data-cw=receipt-live]")),
  "| add focused:", await page.evaluate(() => document.activeElement?.getAttribute("data-cw")));

// 7. clamp: empty price
await page.click("[data-cw=receipt-add]");
await page.waitForTimeout(150);
console.log("clamp note (empty price):", await page.textContent("[data-cw=receipt-note]"));
// clamp: huge price
await page.fill("[data-cw=receipt-price]", "2000000");
await page.click("[data-cw=receipt-add]");
await page.waitForTimeout(150);
console.log("clamp note (huge):", await page.textContent("[data-cw=receipt-note]"),
  "| item count:", await page.locator("[data-cw=receipt-item]").count());
const last = await page.locator("[data-cw=receipt-item]").last().textContent();
console.log("last item (clamped):", last?.slice(0, 50));

// 8. reload → store-nothing
await page.reload({ waitUntil: "networkidle" });
console.log("after reload: items:", await page.locator("[data-cw=receipt-item]").count(),
  "| hint:", await page.textContent("[data-cw=receipt-hint]"));
console.log("errors:", errs.length ? errs.join(" | ") : "none");
await browser.close();
