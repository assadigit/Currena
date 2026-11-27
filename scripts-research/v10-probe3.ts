/* v10: the honest edges through the real UI (robust waits). */
import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
const errs: string[] = [];
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });

// honest edge: custom rate 0% → net −0.2% → bar hidden, sentence kept
await page.click("[data-cw=more-options]");
await page.waitForSelector("[data-cw=more-options-groups]");
await page.click("[data-cw=group-rates-toggle]");
await page.click('[data-cw="rate-mode"] button:has-text("Custom rate")');
await page.waitForSelector("#cw-crate");
await page.fill("#cw-crate", "0");
await page.locator("[data-cw=receipt-sentence]").waitFor();
const barInDom = await page.locator("[data-cw=receipt-bar] [data-cw=share-bar]").count();
const barWrapH = await page.evaluate(() => document.querySelector("[data-cw=receipt-bar]")?.clientHeight);
console.log("0% rate: bar count:", barInDom, "| bar wrap height:", barWrapH,
  "| sentence:", (await page.textContent("[data-cw=receipt-sentence]"))?.slice(0, 95));
await page.click('[data-cw="rate-mode"] button:has-text("Average")');
await page.locator("[data-cw=receipt-sentence]").waitFor();

// never-invests: a fee of 5000 eats the 34.97/mo total
await page.click("[data-cw=group-costs-toggle]");
await page.waitForSelector("#cw-fee");
await page.fill("#cw-fee", "5000");
await page.locator("[data-cw=receipt-never-invests]").waitFor({ timeout: 10000 });
console.log("fee 5000: never-invests:", await page.textContent("[data-cw=receipt-never-invests]"),
  "| sentence gone:", (await page.locator("[data-cw=receipt-sentence]").count()) === 0,
  "| bar gone:", (await page.locator("[data-cw=receipt-bar] [data-cw=share-bar]").count()) === 0,
  "| sr:", (await page.textContent("[data-cw=receipt-sr]"))?.slice(0, 150));
console.log("errors:", errs.length ? errs.join(" | ") : "none");
await browser.close();
