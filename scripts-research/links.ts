/** Research helper — list links on a page matching a regex. */
import { chromium } from "playwright";

const url = process.argv[2];
const pattern = new RegExp(process.argv[3] ?? ".", "i");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { timeout: 60000, waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("a")].map((a) => ({
      t: (a.textContent ?? "").trim().slice(0, 70),
      h: a.getAttribute("href"),
    })),
  );
  for (const l of links) {
    if (l.h && pattern.test(l.h + " " + l.t)) console.log(l.t, "→", l.h);
  }
  await browser.close();
}

main().catch((e) => {
  console.error("ERR", String(e).slice(0, 200));
  process.exit(1);
});
