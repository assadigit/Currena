/** Debug: set the increase to 0 in % mode via the UI. */
import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
  await p.waitForSelector("[data-cw=headline]");
  await p.click("[data-cw=mode-share]");
  await p.fill("#cw-salary", "90000");
  await p.waitForTimeout(400);
  console.log("headline before:", (await p.textContent("[data-cw=headline] p"))?.slice(0, 80));
  await p.click("[data-cw=more-options]");
  await p.waitForSelector("[data-cw=more-options-groups]");
  await p.click('[data-cw="group-rates"] button');
  await p.waitForTimeout(300);
  console.log("incr value before:", await p.inputValue("#cw-incr"));
  await p.fill("#cw-incr", "0");
  await p.waitForTimeout(500);
  console.log("incr value after fill:", await p.inputValue("#cw-incr"));
  console.log("headline after:", (await p.textContent("[data-cw=headline] p"))?.slice(0, 110));
  console.log("tiles:", await p.$$eval('section[aria-label="You could have"] .grid > div', (els) => els.map((e) => e.textContent?.trim().replace(/\n/g, "="))));
  await b.close();
}

main().catch((e) => {
  console.error("ERR", String(e).slice(0, 300));
  process.exit(1);
});
