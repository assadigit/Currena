/**
 * Research helper (W4) — fetch a page with a real browser and print
 * readable text (or grep-like filtered lines).
 *
 * Not part of the app; run with:
 *   bun scripts-research/pw-fetch.ts <url> [filter] [maxChars]
 */
import { chromium } from "playwright";

const url = process.argv[2];
const filter = process.argv[3];
const maxChars = Number(process.argv[4] ?? 20000);

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/158.0 Safari/537.36" });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1200);
  } catch (e) {
    console.error("NAV-WARN", String(e).slice(0, 200));
  }
  const text = await page.evaluate(() => document.body?.innerText ?? "");
  await browser.close();
  if (filter) {
    const lines = text.split("\n");
    const hits: string[] = [];
    for (const line of lines) {
      if (line.toLowerCase().includes(filter.toLowerCase())) hits.push(line.trim().slice(0, 300));
    }
    console.log(hits.slice(0, 50).join("\n---\n"));
    if (hits.length === 0) console.log("(no matches; first 800 chars below)\n" + text.slice(0, 800));
  } else {
    console.log(text.slice(0, maxChars));
  }
}

main().catch((e) => {
  console.error("FETCH-ERROR", String(e).slice(0, 300));
  process.exit(1);
});
