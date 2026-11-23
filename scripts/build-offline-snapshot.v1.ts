/**
 * build-offline-snapshot.ts — Currena Gold offline snapshot builder.
 *
 * Assembles a fully self-contained, offline-viewable HTML file of the
 * deployed Currena gold page from captured artifacts:
 *   /tmp/dom-en-light.html  — post-hydration DOM, EN / light / ltr (agent-browser eval)
 *   /tmp/dom-fa-light.html  — post-hydration DOM, FA / light / rtl
 *   /tmp/darkbtn.txt        — theme toggle button outerHTML in dark state
 *   /tmp/offline-assets/    — deployed CSS chunks + woff2 fonts
 *
 * The output keeps the site's real design tokens, both locales (EN/fa RTL),
 * light/dark themes, sticky header + section nav (with a vanilla
 * IntersectionObserver re-implementation), anchor navigation, and all live
 * data baked at capture time. Zero network requests when opened from file://.
 *
 * Run: bun scripts/build-offline-snapshot.ts
 */
import fs from "fs";
import path from "path";

/* ----------------------------- inputs ------------------------------ */

const EN_DOM = "/tmp/dom-en-light.html";
const FA_DOM = "/tmp/dom-fa-light.html";
const DARK_BTN = "/tmp/darkbtn.txt";
const FONTS_CSS = "/tmp/offline-assets/44bsenw42zh7d.css";
const MAIN_CSS = "/tmp/offline-assets/3_v3md445e3s7.css";
const FONTS_DIR = "/tmp/offline-assets";
const FAVICON = path.join(import.meta.dir, "..", "public", "logo.svg");
const OUT = path.join(import.meta.dir, "..", "public", "currena-gold-offline.html");

const readJsonString = (p: string): string =>
  JSON.parse(fs.readFileSync(p, "utf8").trim());

/* ------------------------ capture timestamp ------------------------ */

const stampParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Tehran",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
}).formatToParts(new Date());
const pGet = (t: string) => stampParts.find((x) => x.type === t)?.value ?? "";
const enStamp = `${pGet("day")} ${pGet("month")} ${pGet("year")}, ${pGet("hour")}:${pGet("minute")}`;
const FA_MONTHS: Record<string, string> = {
  Jan: "ژانویه", Feb: "فوریه", Mar: "مارس", Apr: "آوریل", May: "مه", Jun: "ژوئن",
  Jul: "ژوئیه", Aug: "اوت", Sep: "سپتامبر", Oct: "اکتبر", Nov: "نوامبر", Dec: "دسامبر",
};
const faDigits = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
const faStamp = faDigits(
  `${pGet("day")} ${FA_MONTHS[pGet("month")] ?? pGet("month")} ${pGet("year")}، ${pGet("hour")}:${pGet("minute")}`,
);

/* ------------------------- offline notice -------------------------- */

const NOTE = {
  en: `<div id="cr-offline-note" role="note">Offline snapshot &middot; captured ${enStamp} (Tehran) &middot; the complete page with its data frozen at the moment of capture. The live desk is at currena.ir/gold.</div>`,
  fa: `<div id="cr-offline-note" role="note">نسخه آفلاین &middot; ذخیره‌شده در ${faStamp} (تهران) &middot; صفحه کامل، داده‌ها در لحظه ذخیره ثابت مانده‌اند. نسخه زنده: currena.ir/gold</div>`,
};

const NOTE_CSS = `
#cr-offline-note{box-sizing:border-box;display:block;width:100%;padding:8px 16px;text-align:center;font-size:11.5px;font-weight:600;line-height:1.6;letter-spacing:.01em;background:var(--color-currena-soft);color:var(--color-currena-blue-deep);border-bottom:1px solid var(--color-border);}
html[dir="rtl"] #cr-offline-note{font-family:var(--font-vazirmatn),var(--font-poppins),ui-sans-serif,system-ui,sans-serif;}
#cr-offline-note a{color:inherit;font-weight:700;}
`;

/* ----------------------- variant extraction ------------------------ */

function patchLivePill(body: string, locale: "en" | "fa"): string {
  const i = body.indexOf('class="live-dot');
  if (i < 0) return body;
  const from = Math.max(0, i - 450);
  const to = Math.min(body.length, i + 320);
  let win = body.slice(from, to);
  win = win.replace(locale === "en" ? />LIVE</ : />زنده</, locale === "en" ? ">OFFLINE<" : ">آفلاین<");
  win = win.split("--color-currena-success").join("--color-accent-gold");
  return body.slice(0, from) + win + body.slice(to);
}

function parseVariant(html: string, locale: "en" | "fa") {
  const htmlTag = html.match(/<html([^>]*)>/);
  if (!htmlTag) throw new Error("no <html> tag in capture");
  const attrs = htmlTag[1];
  const lang = attrs.match(/lang="([^"]*)"/)?.[1] ?? "en";
  const dir = attrs.match(/dir="([^"]*)"/)?.[1] ?? "ltr";
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  if (!bodyMatch) throw new Error("no <body> in capture");
  let body = bodyMatch[1];
  // strip all scripts (self-closing first, then paired)
  body = body.replace(/<script[^>]*\/>/g, "");
  body = body.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
  // strip next.js preload links & internals
  body = body.replace(/<link[^>]*>/g, "");
  body = body.replace(/<next-route-announcer[^>]*>[\s\S]*?<\/next-route-announcer>/g, "");
  body = body.replace(/<next-route-announcer[^>]*\/>/g, "");
  // LIVE pill -> OFFLINE (scoped window)
  body = patchLivePill(body, locale);
  // offline notice at the very top of the page flow
  body = NOTE[locale] + body;
  return { lang, dir, body };
}

const enHtml = readJsonString(EN_DOM);
const faHtml = readJsonString(FA_DOM);
const darkBtn = readJsonString(DARK_BTN);

const en = parseVariant(enHtml, "en");
const fa = parseVariant(faHtml, "fa");

// body tag attributes (font CSS variable classes) — keep the shipped one
const bodyTag = enHtml.match(/<body([^>]*)>/)?.[1] ?? "";
const faBodyTag = faHtml.match(/<body([^>]*)>/)?.[1] ?? "";
if (bodyTag !== faBodyTag) {
  console.warn("WARN: EN/FA body attributes differ:", bodyTag, "|", faBodyTag);
}

// original metadata
const title = enHtml.match(/<title>([^<]*)<\/title>/)?.[1] ?? "Gold — Currena";
const desc =
  enHtml.match(/<meta name="description" content="([^"]*)"/)?.[1] ??
  "The Currena gold card.";

/* -------------------------- inline fonts --------------------------- */

let fontsCss = fs.readFileSync(FONTS_CSS, "utf8");
const fontRefs = [...fontsCss.matchAll(/url\(\.\.\/media\/([^)]+?\.woff2)\)/g)];
let fontsInlined = 0;
for (const m of fontRefs) {
  const file = path.join(FONTS_DIR, `font-${m[1]}`);
  if (!fs.existsSync(file)) throw new Error(`missing font file: ${file}`);
  const b64 = fs.readFileSync(file).toString("base64");
  fontsCss = fontsCss.split(`url(../media/${m[1]})`).join(`url(data:font/woff2;base64,${b64})`);
  fontsInlined++;
}
if (/url\((?!\s*data:)/.test(fontsCss)) {
  throw new Error("fonts CSS still contains non-data url() references");
}
const mainCss = fs.readFileSync(MAIN_CSS, "utf8");
if (/url\(/.test(mainCss)) {
  throw new Error("main CSS unexpectedly contains url() references");
}

const faviconB64 = fs.readFileSync(FAVICON).toString("base64");

/* ---------------------------- logic JS ----------------------------- */

const LOGIC = `(function(){
"use strict";
function ready(fn){ if(document.readyState!=="loading"){fn();} else {document.addEventListener("DOMContentLoaded",fn);} }
ready(function(){
  var D=null; try{ D=JSON.parse(document.getElementById("cr-variants").textContent); }catch(e){}
  if(!D||!D.en||!D.fa) return;
  var state={locale:"en",dark:false};
  try{ var s=JSON.parse(localStorage.getItem("currena-gold-offline")||"{}"); if(s&&s.locale==="fa"){state.locale="fa";} if(s&&s.dark){state.dark=true;} }catch(e){}
  var LIGHTBTN=null, navObs=null;
  var ACTIVE="flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-bold transition-colors bg-[var(--color-currena-blue)] text-white";
  var IDLE="flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-bold transition-colors bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]";
  function save(){ try{ localStorage.setItem("currena-gold-offline",JSON.stringify(state)); }catch(e){} }
  function applyLocale(){
    var v=D[state.locale];
    document.documentElement.lang=v.lang;
    document.documentElement.dir=v.dir;
    document.body.innerHTML=v.body;
    wireNav();
  }
  function applyTheme(){
    var c=document.documentElement.classList;
    c.remove("light"); c.remove("dark");
    c.add(state.dark?"dark":"light");
    document.documentElement.style.colorScheme=state.dark?"dark":"light";
    var btn=document.querySelector('button[aria-label="Dark mode"], button[aria-label="Light mode"]');
    if(btn&&LIGHTBTN&&D.darkBtn){ btn.outerHTML=state.dark?D.darkBtn:LIGHTBTN; }
  }
  function wireNav(){
    if(navObs){ try{ navObs.disconnect(); }catch(e){} navObs=null; }
    var nav=document.querySelector('nav[aria-label="Sections"], nav[aria-label="\\u0628\\u062E\\u0634\\u200C\\u0647\\u0627"]');
    if(!nav) return;
    var links=Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var byId={};
    links.forEach(function(a){ byId[a.getAttribute("href").slice(1)]=a; a.className=IDLE; });
    if(!("IntersectionObserver" in window)) return;
    navObs=new IntersectionObserver(function(entries){
      var vis=entries.filter(function(e){ return e.isIntersecting; })
        .sort(function(a,b){ return a.boundingClientRect.top-b.boundingClientRect.top; });
      if(vis.length>0){
        links.forEach(function(a){ a.className=IDLE; });
        var a=byId[vis[0].target.id]; if(a){ a.className=ACTIVE; }
      }
    },{rootMargin:"-140px 0px -55% 0px"});
    Object.keys(byId).forEach(function(id){ var el=document.getElementById(id); if(el){ navObs.observe(el); } });
  }
  document.addEventListener("click",function(e){
    var t=e.target;
    if(!t||!t.closest){ return; }
    var lb=t.closest('button[aria-label="\\u0641\\u0627\\u0631\\u0633\\u06CC"], button[aria-label="English"]');
    if(lb){ state.locale=state.locale==="en"?"fa":"en"; applyLocale(); applyTheme(); save(); return; }
    var tb=t.closest('button[aria-label="Dark mode"], button[aria-label="Light mode"]');
    if(tb){ state.dark=!state.dark; applyTheme(); save(); }
  });
  var lb=document.querySelector('button[aria-label="Dark mode"]');
  if(lb){ LIGHTBTN=lb.outerHTML; }
  applyLocale();
  applyTheme();
});
})();`;

/* --------------------------- assembly ------------------------------ */

const variants = { en, fa, darkBtn };
const variantsJson = JSON.stringify(variants).split("</").join("<\\/");

const out = `<!doctype html>
<html lang="en" class="light" style="color-scheme: light" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} &middot; Offline snapshot</title>
<meta name="description" content="${desc}">
<meta name="robots" content="noindex">
<meta name="generator" content="Currena offline snapshot builder">
<link rel="icon" href="data:image/svg+xml;base64,${faviconB64}">
<style>${fontsCss}</style>
<style>${mainCss}</style>
<style>${NOTE_CSS}</style>
<script type="application/json" id="cr-variants">${variantsJson}</script>
<script>${LOGIC}</script>
</head>
<body${bodyTag}>
${en.body}
</body>
</html>
`;

fs.writeFileSync(OUT, out, "utf8");

/* ---------------------------- report ------------------------------- */

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;
console.log("offline snapshot written:", OUT);
console.log("  size:", kb(fs.statSync(OUT).size));
console.log("  fonts inlined:", fontsInlined);
console.log("  variants: en", kb(en.body.length), "/ fa", kb(fa.body.length));
console.log("  capture stamp (Tehran):", enStamp);

// safety scans — the file must be loadable with zero network access
const final = out;
const bad: string[] = [];
if (/<script[^>]*\ssrc=/i.test(final)) bad.push("external script src");
if (/url\(\s*["']?(https?:|\/)/i.test(final)) bad.push("css url() network reference");
if (/href="\/?gold\/_next/i.test(final)) bad.push("next chunk reference");
if (/<link[^>]*stylesheet/i.test(final)) bad.push("stylesheet link");
if (bad.length) {
  console.error("FAILED offline scan:", bad.join(", "));
  process.exit(1);
}
console.log("  offline scan: clean (no network dependencies)");
