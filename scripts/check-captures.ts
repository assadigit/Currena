import fs from "fs";

const en: string = JSON.parse(fs.readFileSync("/tmp/dom-en-light.html", "utf8").trim());
const fa: string = JSON.parse(fs.readFileSync("/tmp/dom-fa-light.html", "utf8").trim());
const secs = [
  "gold-briefing", "gold-balance", "gold-forces", "gold-signals", "gold-lanes",
  "gold-ta", "gold-cb", "gold-positions", "gold-outlook", "gold-dashboard",
  "gold-bridge", "gold-history", "gold-ifbought", "gold-relationships",
];
console.log("EN length:", en.length, "FA length:", fa.length);
for (const s of secs) {
  const e = en.includes(`id="${s}"`), f = fa.includes(`id="${s}"`);
  console.log((e && f ? "OK  " : "MISS"), s, "en:", e, "fa:", f);
}
console.log("--- data spot checks (EN) ---");
console.log("has ~3500 price:", /3,?5[0-9][0-9]/.test(en) || /35[0-9][0-9]/.test(en));
console.log("opacity:0 count:", (en.match(/opacity:\s*0[;\"]/g) || []).length);
console.log("display:none inline:", (en.match(/display:\s*none/g) || []).length);
console.log("script tags:", (en.match(/<script/g) || []).length);
console.log("template tags:", (en.match(/<template/g) || []).length);
console.log("next-route-announcer:", en.includes("next-route-announcer"));
console.log("--- liveTag pill snippet (EN) ---");
const m = en.match(/<span class="hidden [^"]*sm:flex[^"]*"[^>]*>[\s\S]{0,260}?LIVE<\/span>/);
console.log(m ? m[0].slice(0, 280) : "NOT FOUND");
console.log("--- fa liveTag pill ---");
const mf = fa.match(/<span class="hidden [^"]*sm:flex[^"]*"[^"]*"[^>]*>[\s\S]{0,260}?زنده<\/span>/);
console.log(mf ? mf[0].slice(0, 280) : "NOT FOUND");
console.log("--- theme btn (EN light) ---");
const b = en.match(/<button type="button" aria-label="Dark mode"[^>]*>[\s\S]{0,140}/);
console.log(b ? b[0] : "NOT FOUND");
console.log("--- css link order in live html ---");
const lh = fs.readFileSync("/tmp/live-page.html", "utf8");
console.log((lh.match(/href="[^"]*\.css[^"]*"/g) || []).join("\n"));
console.log("--- breadcrumbs / footer text ---");
const br = en.match(/<nav[^>]*aria-label="Breadcrumb"[\s\S]{0,300}/);
console.log(br ? br[0].slice(0, 300) : "no breadcrumb");
