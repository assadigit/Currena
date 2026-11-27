/** Research helper — download a file via the browser (handles FRED CSV etc.). */
import { chromium } from "playwright";

const url = process.argv[2];
const out = process.argv[3];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 45000 }),
    page.goto(url, { timeout: 45000 }).catch(() => undefined),
  ]);
  await download.saveAs(out);
  console.log("saved", out);
  await browser.close();
}

main().catch((e) => {
  console.error("ERR", String(e).slice(0, 200));
  process.exit(1);
});
