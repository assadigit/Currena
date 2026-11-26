/** Quick check: percent elements + default control inventory. */
import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
  await p.click("[data-cw=mode-share]");
  await p.waitForTimeout(300);
  const els = await p.$$("[data-cw^=percent-]");
  for (const e of els) {
    const cw = await e.getAttribute("data-cw");
    const tc = (await e.textContent()) ?? "";
    console.log("percent-*:", cw, "→", tc.trim().slice(0, 24));
  }
  // test 13-style inventory of the default screen
  await p.reload({ waitUntil: "networkidle" });
  await p.waitForSelector("[data-cw=headline]");
  const inv = await p.evaluate(() =>
    [...document.querySelector("main")!.querySelectorAll("button, input, select, a[href]")]
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => el.getAttribute("data-cw") ?? "no-cw"),
  );
  console.log("default interactive data-cw:", JSON.stringify([...new Set(inv)]));
  await b.close();
}

main().catch((e) => {
  console.error("ERR", String(e).slice(0, 300));
  process.exit(1);
});
