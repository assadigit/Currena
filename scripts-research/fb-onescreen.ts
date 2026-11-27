import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "domcontentloaded", timeout: 30000 });
await p.waitForTimeout(1500);
for (const [w, h] of [[390, 844], [360, 800], [430, 932]] as const) {
  await p.setViewportSize({ width: w, height: h });
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(500);
  const fit = await p.evaluate(() => {
    const vp = window.innerHeight;
    const headline = document.querySelector("[data-cw=headline]")!.getBoundingClientRect();
    const chips = document.querySelector("[data-cw=asset-chips]")!.getBoundingClientRect();
    const receipt = document.getElementById("spending-receipt")!.getBoundingClientRect();
    return {
      vp,
      headlineBottom: Math.round(headline.bottom),
      headlineTop: Math.round(headline.top),
      headlineVisible: headline.bottom <= vp && headline.top >= 0,
      chipsBottom: Math.round(chips.bottom),
      controlsVisible: chips.bottom <= vp,
      receiptTop: Math.round(receipt.top),
      receiptBelowFold: receipt.top > vp,
      scrollW: document.documentElement.scrollWidth,
    };
  });
  console.log(`${w}x${h}:`, JSON.stringify(fit));
}
await b.close();
