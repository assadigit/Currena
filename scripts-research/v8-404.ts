import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage();
const bad: string[] = [];
page.on("response", (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
page.on("requestfailed", (r) => bad.push(`FAILED ${r.url()} ${r.failure()?.errorText}`));
await page.goto("http://localhost:8792/tools/compound-wealth", { waitUntil: "networkidle" });
console.log(JSON.stringify(bad, null, 1));
await browser.close();
