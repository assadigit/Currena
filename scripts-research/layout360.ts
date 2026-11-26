/** Measure the vertical layout at 360x800. */
import { chromium } from "playwright";

async function main() {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 360, height: 800 } });
  await p.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "networkidle" });
  await p.waitForTimeout(400);
  const boxes = await p.evaluate(() => {
    const pick = (sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return `${sel}: top ${Math.round(r.top)} bottom ${Math.round(r.bottom)} h ${Math.round(r.height)}`;
    };
    return [
      pick("main"),
      pick("[data-cw=country-chips]"),
      pick("header h1"),
      pick("[data-cw=headline]"),
      pick("[data-cw=amount-group]"),
      pick("[data-cw=amount-mode-switch]"),
      pick("[data-cw=controls] > div:nth-child(2)"),
      pick("[data-cw=controls] > div:nth-child(3)"),
      pick("[data-cw=asset-chips]"),
    ].filter(Boolean);
  });
  console.log(boxes.join("\n"));
  await b.close();
}

main().catch((e) => {
  console.error("ERR", String(e).slice(0, 300));
  process.exit(1);
});
