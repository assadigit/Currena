/* v8: verify the built worker serves the share bar correctly. */
import { chromium } from "playwright";
const base = process.argv[2] ?? "http://localhost:8792";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto(`${base}/tools/compound-wealth`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
const r = await page.evaluate(() => {
  const segP = document.querySelector("[data-cw=share-seg-putin]") as HTMLElement | null;
  const key = document.querySelector("[data-cw=share-key]");
  const bars = document.querySelectorAll("[data-cw=whatif-bars]").length;
  return {
    bar: !!segP,
    key: key?.textContent ?? "",
    whatifSets: bars,
    headline: document.querySelector("[data-cw=headline] p")?.textContent?.slice(0, 80) ?? "",
  };
});
console.log(JSON.stringify(r, null, 1));
console.log("console/page errors:", errors.length ? errors.slice(0, 3) : "none");
await browser.close();
