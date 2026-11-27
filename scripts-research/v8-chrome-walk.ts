/* v8: walk two other tool pages — the fa toggle's label-in-name fix is in
 * the shared chrome, so confirm nothing moved on two other tools. */
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});

// The tools index lists the suite — pick two real tool pages from it.
await page.goto("https://currena.ir/tools", { waitUntil: "networkidle" });
const links = await page.evaluate(() =>
  [...document.querySelectorAll("main a[href^='/tools/']")]
    .map((a) => ({ href: (a as HTMLAnchorElement).getAttribute("href"), text: a.textContent?.trim() }))
    .filter((l) => l.href && l.href !== "/tools/compound-wealth"),
);
console.log("tool links found:", JSON.stringify(links.slice(0, 10)));

for (const link of links.slice(0, 2)) {
  await page.goto(`https://currena.ir${link.href}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const r = await page.evaluate(() => {
    const toggle = [...document.querySelectorAll("header button")].find((b) => (b.textContent ?? "").trim() === "فا");
    return {
      title: document.title,
      toggleAria: toggle?.getAttribute("aria-label") ?? "",
      headline: document.querySelector("h1")?.textContent ?? "",
    };
  });
  // switch to fa and read the toggle there too
  await page.locator('header button:has-text("فا")').click();
  await page.waitForTimeout(500);
  const fa = await page.evaluate(() => {
    const toggle = [...document.querySelectorAll("header button")].find((b) => (b.textContent ?? "").trim() === "EN");
    const h1 = document.querySelector("h1")?.textContent ?? "";
    return { toggleAria: toggle?.getAttribute("aria-label") ?? "", rtl: document.documentElement.dir === "rtl", h1 };
  });
  console.log(`WALK ${link.href}:`, JSON.stringify({ en: r, fa }));
  await page.screenshot({ path: `docs/compound-tests/v8-live-chrome-walk-${link.href!.split("/").pop()}.png` });
}
console.log("console/page errors:", errors.length ? errors.slice(0, 5) : "none");
await browser.close();
