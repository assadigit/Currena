/* v10.1: the live walk — the golden path on currena.ir. */
import { chromium } from "playwright";

const BASE = "https://currena.ir";
const browser = await chromium.launch();

async function walk(name: string, opts: { fa?: boolean; dark?: boolean; w?: number; h?: number } = {}) {
  const { fa = false, dark = false, w = 390, h = 844 } = opts;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push("PAGEERROR: " + String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push("CONSOLE: " + m.text()); });
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(2500);
  if (dark) await page.click('button[aria-pressed] >> text=🌙').catch(() => {});
  if (fa) await page.click("text=فا");
  await page.waitForTimeout(700);

  // The donut under the tiles
  const donut = await page.evaluate(() => {
    const seg = document.querySelector("[data-cw=share-seg-putin]");
    const key = document.querySelector("[data-cw=share-key]")?.textContent ?? "";
    return { dash: seg?.getAttribute("stroke-dasharray") ?? null, key };
  });

  // The what-if columns
  const cols = await page.evaluate(() =>
    [...document.querySelectorAll("[data-cw=whatif-cols]")].map((s) => ({
      n: s.querySelectorAll("[data-cw=whatif-col]").length,
      aria: s.getAttribute("aria-label") ?? "",
    })));

  // Scroll to the receipt
  await page.evaluate(() => {
    const el = document.getElementById("spending-receipt")!;
    window.scrollTo(0, Math.max(0, window.scrollY + el.getBoundingClientRect().top - 40));
  });
  await page.waitForTimeout(400);

  // The receipt's arrival state
  const receipt = await page.evaluate(() => ({
    tag: document.querySelector("[data-cw=receipt-examples-tag]")?.textContent ?? "",
    guidePill: document.querySelector("[data-cw=receipt-guide-open]")?.textContent ?? "",
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    donutPct: document.querySelector("[data-cw=receipt-donut] [data-cw=share-seg-putin]")?.getAttribute("stroke-dasharray")?.split(" ")[0] ?? null,
  }));

  // Open the guide modal, then close it with Escape
  await page.click("[data-cw=receipt-guide-open]");
  await page.waitForSelector("[data-cw=receipt-guide]");
  await page.waitForTimeout(400);
  const guide = await page.evaluate(() => ({
    title: document.querySelector("[data-cw=receipt-guide-title]")?.textContent ?? "",
    steps: document.querySelectorAll("[data-cw=receipt-guide-step]").length,
    ariaModal: document.querySelector("[data-cw=receipt-guide]")?.getAttribute("aria-modal"),
  }));
  await page.screenshot({ path: `docs/compound-tests/v10.1-live-${name}-2-guide.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);

  // Add an item through the real interface
  await page.fill("[data-cw=receipt-what]", fa ? "ناموف" : "Netflix");
  await page.fill("[data-cw=receipt-price]", "15.98");
  await page.click("[data-cw=receipt-add]");
  await page.waitForTimeout(500);
  const afterAdd = await page.evaluate(() => ({
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    tagGone: document.querySelector("[data-cw=receipt-examples-tag]") === null,
    live: document.querySelector("[data-cw=receipt-live]")?.textContent ?? "",
  }));
  await page.screenshot({ path: `docs/compound-tests/v10.1-live-${name}-3-after-add.png` });

  console.log(
    `${name} | donut dash ${donut.dash} | key "${donut.key.slice(0, 26)}" | cols ${cols.map((c) => c.n).join("/")} | ` +
    `tag "${receipt.tag}" | pill "${receipt.guidePill}" | monthly ${receipt.monthly} | donut% ${receipt.donutPct} | ` +
    `guide "${guide.title}" ${guide.steps} steps aria-modal=${guide.ariaModal} | after add: ${afterAdd.monthly} tagGone=${afterAdd.tagGone} | ` +
    `errors: ${errs.length ? errs.join(" | ").slice(0, 220) : "none"}`,
  );
  await page.close();
}

await walk("1-en-390");
await walk("2-fa-dark-390", { fa: true, dark: true });

/* The chart on the live page: all comparison lines on, no collisions. */
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs: string[] = [];
page.on("pageerror", (e) => errs.push(String(e)));
await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(2200);
for (const c of ["sp500", "world", "gold", "cash"]) await page.click(`[data-cw=chart-toggle-${c}]`).catch(() => {});
await page.waitForTimeout(600);
const chart = await page.evaluate(() => {
  const svg = document.querySelector('section[aria-label="The growth layer overtakes the money you put in"] svg');
  const texts = [...(svg?.querySelectorAll("text") ?? [])] as SVGTextElement[];
  const boxes = texts.map((t) => { const b = t.getBBox(); return { t: t.textContent ?? "", x: b.x, y: b.y, w: b.width, h: b.height }; });
  const hits = (a: typeof boxes[0], b: typeof boxes[0]) =>
    a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
  let collisions = 0;
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (hits(boxes[i], boxes[j])) collisions++;
  return { labels: boxes.length, collisions };
});
await page.evaluate(() => {
  const svg = document.querySelector('section[aria-label="The growth layer overtakes the money you put in"]');
  const r = svg!.getBoundingClientRect();
  window.scrollTo(0, window.scrollY + r.top - 30);
});
await page.waitForTimeout(400);
await page.screenshot({ path: "docs/compound-tests/v10.1-live-3-chart-allon-390.png" });
console.log(`3-chart-allon | ${chart.labels} labels, ${chart.collisions} collisions | errors: ${errs.length ? errs.join(" | ") : "none"}`);
await page.close();
await browser.close();
