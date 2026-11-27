/* v8: the LIVE golden-path verification on currena.ir. */
import { chromium } from "playwright";

const BASE = "https://currena.ir";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

await page.goto(`${BASE}/tools/compound-wealth`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

/* 1. The golden path with the bar: default → the bar keyed and proportioned. */
const bar1 = await page.evaluate(() => {
  const segP = document.querySelector("[data-cw=share-seg-putin]") as HTMLElement | null;
  const segG = document.querySelector("[data-cw=share-seg-growth]") as HTMLElement | null;
  const key = document.querySelector("[data-cw=share-key]");
  const caption = document.querySelector("[data-cw=share-caption]");
  if (!segP || !segG) return { present: false };
  const pw = segP.getBoundingClientRect().width;
  const gw = segG.getBoundingClientRect().width;
  return {
    present: true,
    putShare: +(pw / (pw + gw)).toFixed(3),
    key: key?.textContent ?? "",
    caption: caption?.textContent ?? "",
  };
});
console.log("1-bar:", JSON.stringify(bar1));
await page.screenshot({ path: "docs/compound-tests/v8-live-01-en-mobile390-bar.png" });

/* 2. The toggle: today flips the tiles, the bar follows. */
await page.locator("[data-cw=money-today]").click();
await page.waitForTimeout(400);
const bar2 = await page.evaluate(() => {
  const tiles = [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')].map((d) =>
    Number((d.textContent ?? "").replace(/[^0-9]/g, "")),
  );
  const segP = document.querySelector("[data-cw=share-seg-putin]") as HTMLElement | null;
  const segG = document.querySelector("[data-cw=share-seg-growth]") as HTMLElement | null;
  const infl = document.querySelector("[data-cw=inflation-caption]");
  const pw = segP?.getBoundingClientRect().width ?? 0;
  const gw = segG?.getBoundingClientRect().width ?? 0;
  return {
    tiles,
    barPct: Math.round((pw / (pw + gw)) * 100),
    tilePct: tiles[2] ? Math.round((tiles[0] / tiles[2]) * 100) : null,
    inflationCaption: infl?.textContent ?? "",
  };
});
console.log("2-today:", JSON.stringify(bar2));
await page.screenshot({ path: "docs/compound-tests/v8-live-02-en-today.png" });
await page.locator("[data-cw=money-future]").click();
await page.waitForTimeout(300);

/* 3. The what-if bars + the phone card live. */
await page.locator("[data-cw=whatif-bars]").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
const whatif = await page.evaluate(() => ({
  sets: document.querySelectorAll("[data-cw=whatif-bars]").length,
  firstRows: [...(document.querySelector("[data-cw=whatif-bars]")?.children ?? [])].map((r) =>
    (r.querySelector("span")?.textContent ?? "").trim(),
  ),
}));
console.log("3-whatif:", JSON.stringify(whatif));
await page.screenshot({ path: "docs/compound-tests/v8-live-03-en-whatif-bars.png" });

await page.locator("[data-cw=save-card]").click();
await page.locator("[data-cw=card-menu] button:has-text('Phone')").click();
await page.waitForSelector("[data-cw=phone-card]");
await page.waitForTimeout(4600);
const phone = await page.evaluate(() => {
  const strip = document.querySelector("[data-cw=phone-share-wrap] [data-cw=share-bar]") as HTMLElement | null;
  return { strip: !!strip, aria: strip?.getAttribute("aria-label") ?? "" };
});
console.log("4-phone:", JSON.stringify(phone));
await page.screenshot({ path: "docs/compound-tests/v8-live-04-phone-card.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(300);

/* 4. fa + dark: the RTL bar with Persian digits, the dark theme via the
      site's own class, and the toggle's label-in-name. */
await page.locator('header button:has-text("فا")').click();
await page.waitForTimeout(600);
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(400);
const faDark = await page.evaluate(() => {
  const segP = document.querySelector("[data-cw=share-seg-putin]") as HTMLElement | null;
  const bar = document.querySelector("[data-cw=share-bar]") as HTMLElement | null;
  const key = document.querySelector("[data-cw=share-key]");
  const toggle = [...document.querySelectorAll("header button")].find((b) => (b.textContent ?? "").trim() === "EN");
  if (!segP || !bar) return { present: false };
  return {
    present: true,
    dark: document.documentElement.classList.contains("dark"),
    key: key?.textContent ?? "",
    putInAtReadingStart: Math.abs(bar.getBoundingClientRect().right - segP.getBoundingClientRect().right) < 1.5,
    toggleAria: toggle?.getAttribute("aria-label") ?? "",
    headline: document.querySelector("[data-cw=headline] p")?.textContent?.slice(0, 60) ?? "",
  };
});
console.log("5-fa-dark:", JSON.stringify(faDark));
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
await page.screenshot({ path: "docs/compound-tests/v8-live-05-fa-dark-mobile390.png" });
await page.locator("[data-cw=share-bar]").scrollIntoViewIfNeeded();
await page.screenshot({ path: "docs/compound-tests/v8-live-06-fa-dark-bar.png" });

/* 5. The compare bars live. */
await page.locator("[data-cw=more-options]").click();
await page.waitForSelector("[data-cw=more-options-groups]");
await page.locator('[data-cw="group-dates"] button').click();
await page.waitForTimeout(250);
await page.locator("[data-cw=compare-toggle]").click();
await page.waitForTimeout(500);
const compare = await page.evaluate(() => {
  const rows = [...document.querySelectorAll("[data-cw=compare-table] tbody tr")];
  return rows.map((r) => ({
    asset: r.cells[0]?.textContent ?? "",
    w: Math.round((r.querySelector("[data-cw=compare-bar]") as HTMLElement)?.getBoundingClientRect().width ?? 0),
  }));
});
console.log("7-compare:", JSON.stringify(compare));
await page.screenshot({ path: "docs/compound-tests/v8-live-07-fa-compare-bars.png" });

console.log("console/page errors:", errors.length ? errors.slice(0, 5) : "none");
await browser.close();
