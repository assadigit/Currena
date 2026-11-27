import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
await page.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(1500);
const info = await page.evaluate(() => {
  const svg = document.querySelector('section[aria-label="The growth layer overtakes the money you put in"] svg');
  const texts = [...(svg?.querySelectorAll("text") ?? [])].map((t) => ({
    text: t.textContent ?? "",
    stroke: t.getAttribute("stroke"),
    paintOrder: t.getAttribute("paint-order"),
    strokeWidth: t.getAttribute("stroke-width"),
    x: t.getAttribute("x"),
    y: t.getAttribute("y"),
    anchor: t.getAttribute("text-anchor"),
  }));
  return texts;
});
console.log(JSON.stringify(info, null, 1));
await browser.close();
