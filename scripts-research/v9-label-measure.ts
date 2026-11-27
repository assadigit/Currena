/** Measure the chart's end-label boxes vs the svg width (clipping check). */
import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
await p.waitForSelector("[data-cw=chart-layers]");
await p.waitForTimeout(600);
const m = await p.evaluate(() => {
  const group = document.querySelector("[data-cw=chart-layers]")!;
  const svg = group.closest("section")!.querySelector("svg")!;
  const svgW = svg.clientWidth;
  const labels = [...svg.querySelectorAll("text")].map((t) => {
    const bb = t.getBoundingClientRect();
    return { text: t.textContent ?? "", right: Math.round(bb.right), left: Math.round(bb.left) };
  });
  const svgRight = svg.getBoundingClientRect().right;
  return { svgW, svgRight, labels: labels.filter((l) => l.right > svgRight - 130) };
});
console.log(JSON.stringify(m, null, 2));
await b.close();
