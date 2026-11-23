/**
 * build-offline-snapshot.ts — Currena Gold offline snapshot builder (v2).
 *
 * Assembles a fully self-contained, offline-viewable HTML file of the
 * deployed Currena gold page from captured artifacts (agent-browser on
 * the live desk):
 *   /tmp/capture/dom-en-light.html — post-hydration DOM, EN / light / ltr
 *   /tmp/capture/dom-fa-light.html — post-hydration DOM, FA / light / rtl
 *   /tmp/capture/darkbtn.json      — theme toggle button outerHTML, dark state
 *   /tmp/capture/modal-en-{0..4}.json — the five factor dialogs (EN)
 *   /tmp/capture/modal-fa-{0..4}.json — the five factor dialogs (FA)
 *   /tmp/capture/range-en-{1D,30D,3M,6M,1Y,5Y}.json — hero card per range (EN)
 *   /tmp/capture/range-fa-idx{0..5}.json              — hero card per range (FA)
 *   /tmp/offline-assets/            — deployed CSS chunks + woff2 fonts
 *
 * v2 keeps everything v1 had (both locales with RTL, light/dark themes,
 * sticky header + section nav via a vanilla IntersectionObserver, anchor
 * navigation, all data baked at capture time) and adds the two new
 * interactions the reworked boxes carry: the 1D–5Y trend range selector
 * (each captured chart state swaps in, tab-wired) and the factor
 * explanation modal (the five captured dialogs open over a Radix-styled
 * overlay, Escape/overlay/X/links close them). Zero network requests
 * when opened from file://.
 *
 * Run: bun scripts/build-offline-snapshot.ts
 */
import fs from "fs";
import path from "path";

/* ----------------------------- inputs ------------------------------ */

const CAP = "/tmp/capture";
const EN_DOM = `${CAP}/dom-en-light.html`;
const FA_DOM = `${CAP}/dom-fa-light.html`;
const DARK_BTN = `${CAP}/darkbtn.json`;
const FONTS_CSS = "/tmp/offline-assets/44bsenw42zh7d.css";
const MAIN_CSS = "/tmp/offline-assets/3m4x11w54n3fy.css";
const FONTS_DIR = "/tmp/offline-assets";
const FAVICON = path.join(import.meta.dir, "..", "public", "logo.svg");
const OUT = path.join(import.meta.dir, "..", "public", "currena-gold-offline.html");

const RANGE_KEYS = ["1D", "30D", "3M", "6M", "1Y", "5Y"] as const;

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
const faDigits = (s: string) => s.replace(/\d/g, (d) => "۰۱۲۳۴۵۷۸۹"[Number(d)]);
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

/**
 * Wire the new interactions into a captured body: the trend tabs get
 * data-cr-range (DOM order = 1D..5Y), the briefing factor cards get
 * data-cr-seat (DOM order = the five captured dialogs).
 */
function wireCapturedBody(body: string): string {
  let out = body;
  // the six trend tabs — the price card's [role=tab] buttons, in order
  let tabIndex = 0;
  out = out.replace(/<button([^>]*?)role="tab"([^>]*?)>/g, (_m, pre: string, post: string) => {
    const key = RANGE_KEYS[tabIndex++];
    return `<button${pre}role="tab" data-cr-range="${key}"${post}>`;
  });
  // the five factor cards — briefing buttons with aria-haspopup dialog
  let seatIndex = 0;
  out = out.replace(/<button([^>]*?)aria-haspopup="dialog"([^>]*?)>/g, (_m, pre: string, post: string) => {
    const i = seatIndex++;
    return `<button${pre}aria-haspopup="dialog" data-cr-seat="${i}"${post}>`;
  });
  return out;
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
  // wire the range tabs + factor seats for the offline logic
  body = wireCapturedBody(body);
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

/* ------------------- the new interactions' data -------------------- */

const stripRadixIds = (dialogHtml: string): string =>
  dialogHtml.replace(/\s(?:id|aria-labelledby|aria-describedby)="radix-[^"]*"/g, "");

const modals = {
  en: [0, 1, 2, 3, 4].map((i) => stripRadixIds(readJsonString(`${CAP}/modal-en-${i}.json`))),
  fa: [0, 1, 2, 3, 4].map((i) => stripRadixIds(readJsonString(`${CAP}/modal-fa-${i}.json`))),
};

const ranges = {
  en: RANGE_KEYS.map((r) => wireCapturedBody(readJsonString(`${CAP}/range-en-${r}.json`))),
  fa: [0, 1, 2, 3, 4, 5].map((i) => wireCapturedBody(readJsonString(`${CAP}/range-fa-idx${i}.json`))),
};

// sanity: every captured range variant must carry all six wired tabs
for (const [locale, list] of Object.entries(ranges) as Array<[string, string[]]>) {
  list.forEach((html, i) => {
    const n = (html.match(/data-cr-range="/g) || []).length;
    if (n !== 6) throw new Error(`ranges[${locale}][${i}] wires ${n} tabs (need 6)`);
  });
}
for (const [locale, list] of Object.entries(modals) as Array<[string, string[]]>) {
  list.forEach((html, i) => {
    if (!html.includes('role="dialog"')) throw new Error(`modals[${locale}][${i}] is not a dialog`);
  });
}

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
  var LIGHTBTN=null, navObs=null, modalLayer=null;
  var ACTIVE="flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-bold transition-colors bg-[var(--color-currena-blue)] text-white";
  var IDLE="flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-bold transition-colors bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]";
  function save(){ try{ localStorage.setItem("currena-gold-offline",JSON.stringify(state)); }catch(e){} }
  function applyLocale(){
    closeModal();
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

  /* ---- the factor explanation modal (the reworked briefing boxes) ---- */
  function closeModal(){
    if(modalLayer&&modalLayer.parentNode){ modalLayer.parentNode.removeChild(modalLayer); }
    modalLayer=null;
    document.body.style.overflow="";
  }
  function openModal(seat){
    var v=D[state.locale];
    if(!v.modals||!v.modals[seat]) return;
    closeModal();
    modalLayer=document.createElement("div");
    modalLayer.setAttribute("data-cr-modal-layer","");
    var backdrop=document.createElement("div");
    backdrop.className="fixed inset-0 z-50 bg-black/50";
    backdrop.addEventListener("click",closeModal);
    var holder=document.createElement("div");
    holder.innerHTML=v.modals[seat];
    var dialog=holder.firstElementChild;
    if(dialog){ dialog.setAttribute("tabindex","-1"); }
    modalLayer.appendChild(backdrop);
    while(holder.firstElementChild){ modalLayer.appendChild(holder.firstElementChild); }
    document.body.appendChild(modalLayer);
    document.body.style.overflow="hidden";
    if(dialog){ try{ dialog.focus(); }catch(e){} }
  }
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"){ closeModal(); } });

  document.addEventListener("click",function(e){
    var t=e.target;
    if(!t||!t.closest){ return; }
    var lb=t.closest('button[aria-label="\\u0641\\u0627\\u0631\\u0633\\u06CC"], button[aria-label="English"]');
    if(lb){ state.locale=state.locale==="en"?"fa":"en"; applyLocale(); applyTheme(); save(); return; }
    var tb=t.closest('button[aria-label="Dark mode"], button[aria-label="Light mode"]');
    if(tb){ state.dark=!state.dark; applyTheme(); save(); return; }

    /* the trend range selector — swap the hero card from the captured states */
    var tab=t.closest('button[data-cr-range]');
    if(tab){
      var key=tab.getAttribute("data-cr-range");
      var idx=["1D","30D","3M","6M","1Y","5Y"].indexOf(key);
      var v=D[state.locale];
      if(idx>=0&&v.ranges&&v.ranges[idx]){
        var hero=document.querySelector('section[aria-label="Gold price (ounce)"], section[aria-label="\\u0642\\u06CC\\u0645\\u062A \\u0637\\u0644\\u0627 (\\u0627\\u0648\\u0646\\u0633)"]');
        if(hero){ hero.innerHTML=v.ranges[idx]; }
      }
      return;
    }

    /* the factor cards — open the captured explanation dialog */
    var seatBtn=t.closest('button[data-cr-seat]');
    if(seatBtn&&!modalLayer){ openModal(parseInt(seatBtn.getAttribute("data-cr-seat"),10)||0); return; }

    /* inside an open modal — the X closes it, the anchor links close it first */
    if(modalLayer){
      if(t.closest('[data-slot="dialog-close"]')){ closeModal(); return; }
      var link=t.closest('a[href^="#"]');
      if(link){ closeModal(); return; }
    }
  });
  var lb0=document.querySelector('button[aria-label="Dark mode"]');
  if(lb0){ LIGHTBTN=lb0.outerHTML; }
  applyLocale();
  applyTheme();
});
})();`;

/* --------------------------- assembly ------------------------------ */

const variants = {
  en: { ...en, modals: modals.en, ranges: ranges.en },
  fa: { ...fa, modals: modals.fa, ranges: ranges.fa },
  darkBtn,
};
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
console.log("  modals: en", modals.en.map((m) => m.length), "/ fa", modals.fa.map((m) => m.length));
console.log("  ranges: en", ranges.en.map((m) => m.length), "/ fa", ranges.fa.map((m) => m.length));
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
