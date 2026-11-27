import { chromium } from "playwright";
const browser = await chromium.launch();
for (const [w, fa] of [[390, true], [360, true]] as const) {
  const p = await browser.newPage({ viewport: { width: w, height: 844 } });
  await p.goto("https://currena.ir/tools/compound-wealth", { waitUntil: "domcontentloaded", timeout: 45000 });
  await p.waitForTimeout(2200);
  if (fa) { await p.click("text=فا"); await p.waitForTimeout(700); }
  const m = await p.evaluate(() => {
    const rows = [...document.querySelectorAll("[data-cw=receipt-item]")].map((li) => {
      const label = li.querySelector("span") as HTMLElement;
      const leader = li.querySelector("span[aria-hidden]") as HTMLElement;
      const price = [...li.querySelectorAll("span")].find((s) => s.dir === "ltr") as HTMLElement;
      const lr = label.getBoundingClientRect(), dr = leader.getBoundingClientRect(), pr = price.getBoundingClientRect();
      return {
        label: label.textContent?.slice(0, 18),
        labelW: Math.round(lr.width),
        leaderW: Math.round(dr.width),
        gapLabelLeader: Math.round(dr.left - lr.right),
        gapLeaderPrice: Math.round(pr.left - dr.right),
      };
    });
    return rows;
  });
  console.log(w + "px fa:", JSON.stringify(m));
  await p.close();
}
await browser.close();
