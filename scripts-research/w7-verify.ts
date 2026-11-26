/** W7 browser verification — the percent-of-salary mini calculator. */
import { chromium } from "playwright";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
  await page.waitForSelector("[data-cw=headline]");

  const get = (sel: string) => page.textContent(sel).then((t) => (t ?? "").trim());
  console.log("== default view ==");
  console.log("headline:", await get("[data-cw=headline] p"));
  console.log("switch present:", (await page.$$("[data-cw=amount-mode-switch]")).length);
  console.log("add-salary link:", await get("[data-cw=add-salary]"));

  console.log("\n== % mode without a salary ==");
  await page.click("[data-cw=mode-share]");
  await page.waitForTimeout(300);
  console.log("live line:", await get("[data-cw=share-live-line]"));
  console.log("headline:", await get("[data-cw=headline] p"));
  console.log("percent box value:", await page.inputValue("#cw-percent"));
  console.log("chips:", await page.$$eval("[data-cw^=percent-]", (els) => els.map((e) => e.textContent?.trim())));

  console.log("\n== % mode with salary 90,000 ==");
  await page.fill("#cw-salary", "90000");
  await page.waitForTimeout(300);
  console.log("live line:", await get("[data-cw=share-live-line]"));
  console.log("headline:", await get("[data-cw=headline] p"));

  console.log("\n== switch period to per month (same money) ==");
  await page.click("[data-cw=salary-period-month]");
  await page.waitForTimeout(300);
  console.log("salary box now:", await page.inputValue("#cw-salary"));
  console.log("live line:", await get("[data-cw=share-live-line]"));

  console.log("\n== back to per year, then % → Amount keeps the place ==");
  await page.click("[data-cw=salary-period-year]");
  await page.waitForTimeout(200);
  await page.click("[data-cw=mode-amount]");
  await page.waitForTimeout(300);
  console.log("amount box:", await page.inputValue("#cw-amount"));
  console.log("thatIs line:", await get("[data-cw=amount-salary-line]"));

  console.log("\n== Amount → % keeps the place ==");
  await page.click("[data-cw=mode-share]");
  await page.waitForTimeout(300);
  console.log("percent box:", await page.inputValue("#cw-percent"));
  console.log("live line:", await get("[data-cw=share-live-line]"));

  console.log("\n== salary hidden from the cards (privacy) ==");
  await page.click("[data-cw=save-card]");
  await page.click("[data-cw=card-menu] button:nth-child(1)");
  await page.waitForTimeout(400);
  const printText = await page.textContent("[data-cw=print-sheet]");
  console.log("A4 plan line:", (printText ?? "").match(/[^\n]*a month[^\n]*·[^\n]*/)?.[0]?.trim());
  console.log("salary on card?", /90,000|7500/.test(printText ?? "") ? "LEAK" : "no");

  await page.keyboard.press("Escape");
  await page.click("[data-cw=save-card]");
  await page.click("[data-cw=card-menu] button:nth-child(2)");
  await page.waitForTimeout(400);
  const phoneText = await page.textContent("body");
  console.log("phone plan line:", (phoneText ?? "").match(/\d+(?:\.\d+)?% of salary[^\n]*/)?.[0]?.trim());
  console.log("salary on phone?", /90,000|7500/.test(await page.textContent("body") ?? "") ? "maybe (check)" : "no");

  console.log("\n== clamp note (type 60 for percent) ==");
  await page.keyboard.press("Escape");
  await page.click("[data-cw=mode-share]");
  await page.fill("#cw-percent", "60");
  await page.waitForTimeout(300);
  console.log("percent box:", await page.inputValue("#cw-percent"));
  console.log("clamp note:", await get("[data-cw=percent-note]"));

  console.log("\n== Farsi ==");
  await page.click("button[title='Switch to Farsi']");
  await page.waitForTimeout(400);
  console.log("live line (fa):", await get("[data-cw=share-live-line]"));
  console.log("headline (fa):", (await get("[data-cw=headline] p")).slice(0, 120));

  console.log("\n== errors ==", errors.length ? errors.slice(0, 5) : "none");
  await browser.close();
}

main().catch((e) => {
  console.error("ERR", String(e).slice(0, 400));
  process.exit(1);
});
