/* v9: the LIVE golden-path verification on currena.ir — the chart layer
 * filters through the real production interface, EN + fa, light + dark,
 * with the console watched and screenshots for the record. */
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
await page.waitForSelector("[data-cw=chart-layers]", { timeout: 20000 });
await page.waitForTimeout(800);

const chartState = () =>
  page.evaluate(() => {
    const group = document.querySelector("[data-cw=chart-layers]");
    const section = group?.closest("section") ?? null;
    const svg = section?.querySelector("svg") ?? null;
    return {
      chips: [...(group?.querySelectorAll("button") ?? [])].map((c) => ({
        cw: c.getAttribute("data-cw") ?? "",
        pressed: c.getAttribute("aria-pressed"),
        disabled: (c as HTMLButtonElement).disabled,
      })),
      paths: svg ? svg.querySelectorAll("path").length : -1,
      texts: svg ? [...svg.querySelectorAll("text")].map((t) => t.textContent ?? "") : [],
      caption: document.querySelector("[data-cw=chart-others-caption]")?.textContent ?? null,
      headline: document.querySelector("[data-cw=headline] p")?.textContent ?? "",
      tiles: [...document.querySelectorAll('section[aria-label="You could have"] .grid > div')].map((d) => d.textContent ?? ""),
    };
  });

/* 1. The defaults: the four core layers on, comparisons off, plan-only chart. */
const s1 = await chartState();
console.log("1-default:", JSON.stringify({ paths: s1.paths, chips: s1.chips.map((c) => `${c.cw.replace("chart-toggle-", "")}=${c.pressed}`), caption: s1.caption }));
await page.locator("[data-cw=chart-layers]").scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: "docs/compound-tests/v9-live-01-en-default-390.png" });

/* 2. The owner's example: only current money vs future potential. */
await page.click('[data-cw="chart-toggle-growth"]');
await page.click('[data-cw="chart-toggle-band"]');
const s2 = await chartState();
console.log("2-owner-example:", JSON.stringify({ paths: s2.paths, texts: s2.texts.filter((t) => !/^\d/.test(t)).slice(0, 5) }));
await page.screenshot({ path: "docs/compound-tests/v9-live-02-en-owner-example-390.png" });

/* 3. The benchmarks: S&P 500 + Gold + Cash on, with the caption. */
await page.click('[data-cw="chart-toggle-growth"]');
await page.click('[data-cw="chart-toggle-band"]');
await page.click('[data-cw="chart-toggle-sp500"]');
await page.click('[data-cw="chart-toggle-gold"]');
await page.click('[data-cw="chart-toggle-cash"]');
const s3 = await chartState();
console.log("3-benchmarks:", JSON.stringify({ paths: s3.paths, caption: s3.caption, labels: s3.texts.filter((t) => ["S&P 500", "Gold", "Cash"].includes(t)) }));
await page.screenshot({ path: "docs/compound-tests/v9-live-03-en-benchmarks-390.png" });

/* 4. Numbers invariance: headline + tiles identical through every toggle. */
const invariant = s3.headline === s1.headline && JSON.stringify(s3.tiles) === JSON.stringify(s1.tiles);
console.log("4-invariant:", invariant);

/* 5. The never-empty guard, live. */
await page.click('[data-cw="chart-toggle-putin"]');
await page.click('[data-cw="chart-toggle-growth"]');
await page.click('[data-cw="chart-toggle-band"]');
await page.click('[data-cw="chart-toggle-sp500"]');
await page.click('[data-cw="chart-toggle-gold"]');
await page.click('[data-cw="chart-toggle-cash"]');
const s5 = await chartState();
console.log("5-guard:", JSON.stringify({ paths: s5.paths, total: s5.chips.find((c) => c.cw === "chart-toggle-total") }));
await page.click('[data-cw="chart-toggle-putin"]'); // release

/* 6. fa + dark: Persian chips, the caption in Persian, everything working. */
await page.click('header button:has-text("فا")');
await page.waitForTimeout(600);
await page.evaluate(() => document.documentElement.classList.add("dark"));
await page.waitForTimeout(400);
const s6 = await page.evaluate(() => {
  const group = document.querySelector("[data-cw=chart-layers]");
  return {
    aria: group?.getAttribute("aria-label") ?? "",
    labels: [...(group?.querySelectorAll("button") ?? [])].map((c) => (c.textContent ?? "").trim()),
    caption: document.querySelector("[data-cw=chart-others-caption]")?.textContent ?? null,
  };
});
await page.click('[data-cw="chart-toggle-sp500"]');
await page.waitForTimeout(400);
await page.screenshot({ path: "docs/compound-tests/v9-live-04-fa-dark-benchmark-390.png" });
console.log("6-fa-dark:", JSON.stringify(s6));

/* 7. All-on restores the recorded v8 look; desktop capture. */
await page.click('[data-cw="chart-toggle-sp500"]');
await page.click('header button:has-text("EN")');
await page.evaluate(() => document.documentElement.classList.remove("dark"));
await page.setViewportSize({ width: 1280, height: 900 });
await page.waitForTimeout(500);
for (const id of ["growth", "band", "sp500", "world", "gold", "cash"]) {
  const on = await page.getAttribute(`[data-cw="chart-toggle-${id}"]`, "aria-pressed");
  if (on !== "true") await page.click(`[data-cw="chart-toggle-${id}"]`);
}
const s7 = await chartState();
console.log("7-all-on:", JSON.stringify({ paths: s7.paths, labels: s7.texts.filter((t) => ["S&P 500", "World shares", "Gold", "Cash", "Put in", "Total"].includes(t)) }));
await page.locator("[data-cw=chart-layers]").scrollIntoViewIfNeeded();
await page.screenshot({ path: "docs/compound-tests/v9-live-05-en-desktop-all-on.png" });

console.log("console/page errors:", errors.length ? errors.slice(0, 5) : "none");
await browser.close();
process.exit(errors.length > 0 ? 1 : 0);
