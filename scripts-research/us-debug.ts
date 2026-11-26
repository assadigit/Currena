/** Debug the US country-switch tiles. */
import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
  await p.click("[data-cw=country-US]");
  await p.waitForTimeout(500);
  const us = await p.evaluate(() => ({
    headline: document.querySelector("[data-cw=headline] p")?.textContent ?? "",
    tiles: [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')].map((d) =>
      (d.textContent ?? "").replace(/\s/g, ""),
    ),
    chips: [...document.querySelectorAll("[data-cw^=asset-]")].map((c) => c.textContent?.trim()),
  }));
  console.log("headline:", us.headline.slice(0, 70));
  console.log("tiles:", JSON.stringify(us.tiles));
  console.log("first chip:", us.chips[0]);
  console.log(
    "tiles with $digit:",
    us.tiles.map((t) => /\$[\d,]/.test(t)),
  );
  await b.close();
}

main().catch((e) => {
  console.error("ERR", String(e).slice(0, 300));
  process.exit(1);
});
