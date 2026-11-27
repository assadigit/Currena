/* v10: the live walk — the golden path on the production page (EN),
 * fa + RTL + dark, and the gold page's pack icons after the Batch V
 * merge deploy. Screenshots to docs/compound-tests/. */
import { chromium } from "playwright";
const BASE = "https://currena.ir";
const browser = await chromium.launch();
const results: string[] = [];
const log = (ok: boolean, msg: string) => {
  results.push(`${ok ? "OK  " : "FAIL"} ${msg}`);
  console.log(`${ok ? "OK  " : "FAIL"} ${msg}`);
};

// --- EN golden path, mobile 390 ---
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.getElementById("spending-receipt")?.scrollIntoView());
  await page.waitForTimeout(400);
  await page.screenshot({ path: "docs/compound-tests/v10-live-01-en-arrival-390.png" });

  const arrival = await page.evaluate(() => ({
    items: document.querySelectorAll("[data-cw=receipt-item]").length,
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    yearly: document.querySelector("[data-cw=receipt-total-yearly]")?.textContent ?? "",
    sentence: document.querySelector("[data-cw=receipt-sentence]")?.textContent ?? "",
    hint: document.querySelector("[data-cw=receipt-hint]")?.textContent ?? "",
    barSegs: document.querySelectorAll("[data-cw=receipt-bar] [data-cw=share-bar] > div").length,
  }));
  log(arrival.items === 3, `arrival: 3 examples (${arrival.items})`);
  log(arrival.monthly.includes("A$34.97") && arrival.yearly.includes("A$419.64"), `totals ${arrival.monthly} / ${arrival.yearly}`);
  log(arrival.sentence.includes("about A$6,000") && arrival.sentence.includes("about A$4,600"), `projection: ${(arrival.sentence ?? "").slice(0, 92)}`);
  log(arrival.barSegs === 2 && !!(arrival.hint ?? "").includes("examples"), "bar (2 segments) + hint");

  // add → remove → clear (the golden path)
  await page.fill("[data-cw=receipt-what]", "Netflix");
  await page.fill("[data-cw=receipt-price]", "15.98");
  await page.click("[data-cw=receipt-add]");
  await page.waitForTimeout(200);
  const added = await page.evaluate(() => ({
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    live: document.querySelector("[data-cw=receipt-live]")?.textContent ?? "",
  }));
  log(added.monthly.includes("A$50.95") && added.live === "Added Netflix. Total A$50.95 a month.", `add: ${added.monthly} | live: ${added.live}`);
  await page.screenshot({ path: "docs/compound-tests/v10-live-02-en-added-390.png" });

  await page.click('[data-cw=receipt-remove][aria-label*="Spotify"]');
  await page.waitForTimeout(200);
  const removed = await page.textContent("[data-cw=receipt-total-monthly]");
  log((removed ?? "").includes("A$39.96"), `remove: ${removed}`);

  await page.click("[data-cw=receipt-clear]");
  await page.waitForTimeout(150);
  await page.click("[data-cw=receipt-clear]");
  await page.waitForTimeout(200);
  const cleared = await page.evaluate(() => ({
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
    empty: document.querySelector("[data-cw=receipt-empty]")?.textContent ?? "",
    hintGone: document.querySelector("[data-cw=receipt-hint]") === null,
  }));
  log(cleared.count === 0 && cleared.empty.includes("Add a cost"), `clear: ${cleared.count} items, "${cleared.empty}"`);
  await page.screenshot({ path: "docs/compound-tests/v10-live-03-en-cleared-390.png" });

  // reload restores the examples (store-nothing, live)
  await page.reload({ waitUntil: "networkidle" });
  const reloaded = await page.evaluate(() => ({
    count: document.querySelectorAll("[data-cw=receipt-item]").length,
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
  }));
  log(reloaded.count === 3 && (reloaded.monthly ?? "").includes("A$34.97"), `reload: ${reloaded.count} examples, ${reloaded.monthly}`);
  log(errs.length === 0, `EN walk: ${errs.length} console/page errors${errs.length ? ": " + errs.join(" | ").slice(0, 120) : ""}`);
  await page.close();
}

// --- fa + RTL + dark ---
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
  await page.click('header button:has-text("فا")');
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(500);
  await page.evaluate(() => document.getElementById("spending-receipt")?.scrollIntoView());
  await page.waitForTimeout(300);
  await page.screenshot({ path: "docs/compound-tests/v10-live-04-fa-dark-390.png" });
  const fa = await page.evaluate(() => ({
    heading: document.querySelector("#spending-receipt h2")?.textContent ?? "",
    monthly: document.querySelector("[data-cw=receipt-total-monthly]")?.textContent ?? "",
    sentence: document.querySelector("[data-cw=receipt-sentence]")?.textContent ?? "",
    barSr: document.querySelector("[data-cw=receipt-bar] [data-cw=share-bar]")?.getAttribute("aria-label") ?? "",
    dir: getComputedStyle(document.getElementById("spending-receipt")!).direction,
  }));
  log(fa.heading === "رسید خرج‌های شما", `fa heading: ${fa.heading}`);
  log((fa.monthly ?? "").includes("۳۴٫۹۷"), `fa digits: ${fa.monthly}`);
  log((fa.sentence ?? "").includes("۶٬۰۰۰") && (fa.sentence ?? "").includes("پول امروز"), `fa sentence: ${(fa.sentence ?? "").slice(0, 80)}`);
  log((fa.barSr ?? "").includes("٪"), `fa bar sr has ٪`);
  log(fa.dir === "rtl", `dir: ${fa.dir}`);
  log(errs.length === 0, `fa walk: ${errs.length} console/page errors`);
  await page.close();
}

// --- the gold page's pack icons restored (the Batch V merge) ---
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  await page.goto(`${BASE}/gold`, { waitUntil: "networkidle" });
  // The last two pack icons live in the Iran-layer sections, which fa
  // shows by default (the EN reader toggles them) — check in fa, exactly
  // as the Batch V evidence did.
  await page.click('header button:has-text("فا")');
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.screenshot({ path: "docs/compound-tests/v10-live-05-gold-header-390.png" });
  // The pack icons are lazy — walk the whole page so every one loads.
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 600) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(800);
  const icons = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img[src*='/icons/']")] as HTMLImageElement[];
    return imgs.map((i) => ({ src: i.src.split("/").pop() ?? "", ok: i.complete && i.naturalWidth > 0 }));
  });
  const loaded = icons.filter((i) => i.ok);
  const uniq = [...new Set(loaded.map((i) => i.src))];
  const SECOND_PACK = [
    "gold-against-major-currencies.png", "gold-and-alternative-assets-performance.png",
    "gold-central-bank-demand-supply.png", "gold-dollar-comparison-iran-inflation-hedge.png",
    "gold-forces-bearish-bullish-balance.png", "gold-wealth-calculator.png",
    "iranian-gold-coin-market.png", "gold-bar.png",
  ];
  const missing = SECOND_PACK.filter((f) => !uniq.includes(f));
  log(missing.length === 0, `gold page: ${uniq.length} distinct pack icons loaded, all 8 second-pack present (missing: ${missing.join(", ") || "none"})`);
  await page.screenshot({ path: "docs/compound-tests/v10-live-06-gold-icons-390.png" });
  log(errs.length === 0, `gold page: ${errs.length} console/page errors`);
  await page.close();
}

await browser.close();
const fails = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - fails}/${results.length} live checks green`);
if (fails) process.exit(1);
