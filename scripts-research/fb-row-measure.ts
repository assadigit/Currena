import { chromium } from "playwright";
const b = await chromium.launch();
for (const w of [390, 360]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "domcontentloaded", timeout: 30000 });
  await p.waitForTimeout(1200);
  const m = await p.evaluate(() => {
    const li = document.querySelector("[data-cw=receipt-item]") as HTMLElement;
    const label = li.querySelector("span") as HTMLElement;
    const lr = label.getBoundingClientRect();
    const liR = li.getBoundingClientRect();
    // measure the natural single-line width of the text via a canvas
    const ctx = document.createElement("canvas").getContext("2d")!;
    ctx.font = getComputedStyle(label).font;
    const natural = ctx.measureText("YouTube Premium").width;
    return {
      liW: Math.round(liR.width),
      labelRendered: Math.round(lr.width),
      labelH: Math.round(lr.height),
      natural,
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    };
  });
  console.log(w + "px:", JSON.stringify(m));
  await p.close();
}
await b.close();
