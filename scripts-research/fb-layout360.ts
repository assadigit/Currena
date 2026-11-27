/** v10.1 feedback pass: measure the vertical layout at 360x800 (the
 * one-screen rule) plus the new donut/badge/modal geometry. */
import { chromium } from "playwright";

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 800 } });
await p.goto("http://localhost:3100/tools/compound-wealth", { waitUntil: "domcontentloaded", timeout: 30000 });
await p.waitForTimeout(1500);
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
    pick("[data-cw=share-donut-wrap]"),
  ].filter(Boolean);
});
console.log(boxes.join("\n"));

/* The receipt's geometry: badge rows, header vs guide pill, donut. */
const receipt = await p.evaluate(() => {
  const rows = [...document.querySelectorAll("[data-cw=receipt-item]")].map((li) => {
    const label = li.querySelector("span") as HTMLElement;
    const badge = li.querySelector("[data-cw=receipt-example-badge]") as HTMLElement | null;
    return {
      labelH: Math.round(label.getBoundingClientRect().height),
      badge: !!badge,
      badgeW: badge ? Math.round(badge.getBoundingClientRect().width) : 0,
    };
  });
  const header = document.querySelector("[data-cw=receipt-header]") as HTMLElement;
  const pill = document.querySelector("[data-cw=receipt-guide-open]") as HTMLElement;
  const hr = header.getBoundingClientRect();
  const pr = pill.getBoundingClientRect();
  const donut = document.querySelector("[data-cw=receipt-donut] [data-cw=share-donut]") as SVGSVGElement | null;
  const segP = document.querySelector("[data-cw=receipt-donut] [data-cw=share-seg-putin]");
  const guide = document.querySelector("[data-cw=receipt-guide]");
  return {
    rows,
    headerGap: Math.round(pr.left - hr.right),
    headerOverlap: pr.left < hr.right,
    donut: donut ? { w: Math.round(donut.getBoundingClientRect().width), role: donut.getAttribute("role") } : null,
    dashP: segP ? segP.getAttribute("stroke-dasharray") : null,
    guideAbsent: !guide,
  };
});
console.log("receipt:", JSON.stringify(receipt, null, 1));

/* The what-if columns: each label centred under its own column. */
const whatif = await p.evaluate(() => {
  const sets = [...document.querySelectorAll("[data-cw=whatif-cols]")].map((s) => {
    const cols = [...s.querySelectorAll("[data-cw=whatif-col]")].map((c) => c.getBoundingClientRect());
    const labels = [...s.querySelectorAll("div:last-child > span")].map((l) => l.getBoundingClientRect());
    return {
      n: cols.length,
      heights: cols.map((c) => Math.round(c.height)),
      offsets: cols.map((c, i) => (labels[i] ? Math.round(labels[i].left + labels[i].width / 2 - (c.left + c.width / 2)) : 99)),
    };
  });
  return sets;
});
console.log("whatif:", JSON.stringify(whatif));
await b.close();
