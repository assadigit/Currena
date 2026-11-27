"use client";

/**
 * The beginner FAQ — the average reader's own questions, answered in the
 * page's own plain register (checklist item 12: the gold page must give a
 * beginner FAQ + a mini glossary). Every answer stays inside what the page
 * itself already proves: each cross-link points at the section that carries
 * the live number or the method, and every fact that can age carries the
 * band's own "last reviewed" stamp.
 *
 * Additive programme note (docs/gold-page/PLAN.md, Phase 1): this band is a
 * NEW section — the copy lives here, self-contained, because the page's own
 * content library (content.ts) is existing code and stays untouched. The
 * only plug-in edit is the mount + the nav chip in page.tsx.
 *
 * Numbers quoted (troy ounce grams, mesghal grams, karat shares, the
 * VAT-on-اجرت+سود convention) are the repo's own engines' constants
 * (coin-premium.ts, tools/engines.ts) — nothing invented here.
 */

import * as React from "react";
import type { Locale } from "@/lib/gold-page/content";
import type { Fmt } from "@/components/gold-page/visuals";
import { PackIcon } from "@/components/gold-page/pack-icon";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

/* The band's own last-reviewed day — the stamp the reader sees; the FAQ's
   facts are stable education, but the stamp keeps the honesty law (a fact
   that can age is dated). */
const LAST_REVIEWED_ISO = "2026-11-27";

/** One beginner question: the ask + the plain answer + the in-page anchor
 *  that carries the proof. */
interface FaqItem {
  q: [string, string];
  a: [string, string];
  /** the section id whose live numbers/method back this answer */
  anchor: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: ["What decides the price of gold?", "چه چیزی قیمت طلا را تعیین می‌کند؟"],
    a: [
      "Five main forces push and pull it: what money costs (interest rates and real yields), the dollar's own strength, fear and stress in markets, inflation, and who is buying — central banks, funds, traders. The balance section counts all five, live.",
      "پنج نیروی اصلی روی طلا اثر می‌گذارند: هزینهٔ پول (نرخ بهره و بازده واقعی)، قدرت خودِ دلار، ترس و تنش در بازارها، تورم، و اینکه چه کسی در حال خرید است — بانک‌های مرکزی، صندوق‌ها، معامله‌گران. بخش «ترازو» همهٔ پنج نیرو را زنده می‌شمارد.",
    ],
    anchor: "gold-balance",
  },
  {
    q: ["What is the حباب (the coin premium)?", "حباب سکه چیست؟"],
    a: [
      "The gap between a Tehran coin's market price and the value of the world gold inside it (global ounce × free-market dollar). When the market price stands above that content value, the coin carries a premium — the bubble this page shows per instrument, live.",
      "فاصلهٔ قیمت بازارِ سکه در تهران با ارزش طلای جهانیِ داخل آن (اونس جهانی × دلار آزاد). وقتی قیمت بازار از ارزش محتوا بالاتر باشد، سکه حباب دارد — همان عددی که این صفحه برای هر گویه زنده نشان می‌دهد.",
    ],
    anchor: "gold-bridge",
  },
  {
    q: ["What do عیار (karat) and “18-karat” mean?", "عیار و «۱۸ عیار» یعنی چه؟"],
    a: [
      "عیار is purity out of 24: 24-karat gold is 99.9% pure; 18-karat is 75% gold and 25% other metals. The Tehran board prices both, live, per gram.",
      "عیار یعنی خلوص طلا از ۲۴: طلای ۲۴ عیار حدود ۹۹٫۹٪ خالص است و ۱۸ عیار یعنی ۷۵٪ طلا و ۲۵٪ فلز دیگر. تابلوی تهران قیمت هر دو را به تفکیک گرم، زنده نشان می‌دهد.",
    ],
    anchor: "gold-bridge",
  },
  {
    q: ["Coin or jewelry — which carries more cost?", "سکه یا زیورآلات — کدام پرهزینه‌تر است؟"],
    a: [
      "Jewelry is priced as the metal + اجرت (the making charge) + the seller's profit, and VAT applies to the اجرت and profit part (the market convention this site's own invoice tool implements). Coins carry no اجرت but can carry حباب. Both costs are visible before you buy — ask for the invoice.",
      "قیمت زیورآتی از فلز + اجرت + سود فروشنده ساخته می‌شود و مالیات بر ارزش افزوده فقط به اجرت و سود می‌خورد (همان رسم بازار که ماشین فاکتور همین سایت اجرا می‌کند). سکه اجرت ندارد اما می‌تواند حباب داشته باشد. هر دو هزینه را قبل از خرید می‌توان دید — فاکتور بخواهید.",
    ],
    anchor: "gold-faq",
  },
  {
    q: ["What is a صندوق طلا (a gold fund)?", "صندوق طلا چیست؟"],
    a: [
      "A fund whose assets are gold bullion, traded on the stock exchange like a share. You own gold without holding metal — no اجرت, no حباب — but also no coin in your hand, and the fund charges its own management fee.",
      "صندوقی که دارایی‌اش شمش طلاست و مثل سهم در بورس معامله می‌شود. طلا را بدون حمل فلز مالک می‌شوید — بدون اجرت و بدون حباب — اما سکه‌ای هم در دست ندارید و صندوق هزینهٔ مدیریت خودش را برمی‌دارد.",
    ],
    anchor: "gold-faq",
  },
  {
    q: ["How do I check a piece's purity?", "خلوص یک قطعه را چطور بررسی کنم؟"],
    a: [
      "Buy from sellers you can hold accountable, keep the invoice, and look for the عیار stamp. Reputable shops can test with a touchstone; for standard bars and coins the mint's own assay is the guarantee. If a deal looks too good, it usually is.",
      "از فروشنده‌ای بخرید که بتوانید پاسخگو بگیرید، فاکتور را نگه دارید و مهر عیار را ببینید. مغازه‌های معتبر با سنگ محک عیار را می‌سنجند؛ برای شمش و سکهٔ استاندارد، خودِ ضرابخانه ضامن است. اگر معامله زیادی خوب به نظر رسید، معمولاً همانی است که نیست.",
    ],
    anchor: "gold-faq",
  },
  {
    q: ["Is gold a safe investment?", "آیا طلا سرمایه‌گذاری مطمئنی است؟"],
    a: [
      "No investment is safe. Gold can fall hard and stay down for years (2013–2015, 2021–2022) even though it has protected wealth over very long periods. Past performance never guarantees the future — this page describes, it never advises.",
      "هیچ سرمایه‌گذاری‌ای بی‌خطر نیست. طلا هم می‌تواند سقوط کند و سال‌ها پایین بماند (۲۰۱۳ تا ۲۰۱۵، ۲۰۲۱ تا ۲۰۲۲) حتی با آنکه در بازه‌های خیلی بلند از ثروت محافظت کرده است. بازدهٔ گذشته تضمین آینده نیست — این صفحه توصیف می‌کند، توصیه نمی‌کند.",
    ],
    anchor: "gold-history",
  },
  {
    q: ["Does gold protect against inflation?", "آیا طلا سپر تورم است؟"],
    a: [
      "Over decades it has kept its purchasing power in most countries, including Iran — but over months and a few years it can swing far from prices. The long view shows both sides honestly.",
      "در بازهٔ چند دهه، طلا در بیشتر کشورها از جمله ایران قدرت خرید خود را حفظ کرده — اما در بازهٔ چند ماه و چند سال می‌تواند خیلی از سطح قیمت‌ها فاصله بگیرد. «چشم‌انداز بلند» هر دو سو را صادقانه نشان می‌دهد.",
    ],
    anchor: "gold-history",
  },
  {
    q: ["Why does the Tehran price differ from the world price?", "چرا قیمت تهران با قیمت جهانی فرق دارد؟"],
    a: [
      "The toman price is the global ounce (in USD) × the free-market dollar, plus the market's own premium (حباب). When the dollar moves, Tehran gold moves with it — the 47-year race section shows how tightly.",
      "قیمت تومانی برابر است با اونس جهانی (به دلار) × دلار آزاد، به‌علاوهٔ حباب بازار. هر وقت دلار تکان بخورد، طلای تهران هم با آن تکان می‌خورد — بخش «طلا و دلار» ۴۷ سال این هم‌حرکتی را نشان می‌دهد.",
    ],
    anchor: "gold-dollar-trend",
  },
  {
    q: ["Where do this page's numbers come from?", "عددهای این صفحه از کجا می‌آیند؟"],
    a: [
      "Named sources, every one: EODHD, FRED, TGJU, Yahoo Finance, Trading Economics, the World Gold Council, LBMA, CFTC and others — each carrying its own “data as of” stamp. The sources band below lists them all.",
      "از منابع نامدار، تک‌تک: EODHD، FRED، TGJU، یاهو فایننس، تریدینگ اکونومیکس، شورای جهانی طلا، LBMA، CFTC و چند منبع دیگر — هر کدام با مهر «دادهٔ…» خودش. بخش «منابع و روش» پایین همه را فهرست می‌کند.",
    ],
    anchor: "gold-sources",
  },
];

/** The mini glossary — the page's own vocabulary, one line each. */
const GLOSSARY: Array<{ term: [string, string]; line: [string, string] }> = [
  {
    term: ["Troy ounce", "اونس تروا"],
    line: ["The world price unit: 31.1035 grams.", "واحد قیمت جهانی طلا؛ برابر ۳۱٫۱۰۳۵ گرم."],
  },
  {
    term: ["Mesghal", "مثقال"],
    line: ["The bazaar weight: 4.6083 grams (one mesghal of 18k gold: 4.3318 g).", "وزن بازار: ۴٫۶۰۸۳ گرم (مثقال طلای ۱۸ عیار: ۴٫۳۳۱۸ گرم)."],
  },
  {
    term: ["Karat عیار", "عیار"],
    line: ["Purity out of 24: 24k ≈ 99.9% pure, 18k = 75% gold.", "خلوص از ۲۴: طلای ۲۴ عیار ≈ ۹۹٫۹٪ خالص، ۱۸ عیار = ۷۵٪ طلا."],
  },
  {
    term: ["حباب (premium)", "حباب"],
    line: ["The Tehran market price above the world gold content value.", "مبلغی که قیمت بازار تهران از ارزش محتوای جهانی طلا بالاتر می‌رود."],
  },
  {
    term: ["Spot price", "نرخ جهانی (اسپات)"],
    line: ["The world market price for immediate delivery, in USD per ounce.", "قیمت بازار جهانی برای تحویل فوری، به دلار برای هر اونس."],
  },
  {
    term: ["Free-market dollar", "دلار آزاد"],
    line: ["The open-market USD rate the Tehran gold price rides on.", "نرخ دلار در بازار آزاد که قیمت طلای تهران بر آن سوار است."],
  },
  {
    term: ["اجرت (making charge)", "اجرت"],
    line: ["The craftsman's charge on jewelry, per gram or percent.", "دستمزد ساخت زیورآلات؛ به ازای هر گرم یا درصد."],
  },
  {
    term: ["Seller's profit", "سود فروشنده"],
    line: ["The shop's margin on jewelry, added over metal + اجرت.", "حاشیهٔ سود مغازه روی زیورآلات؛ روی فلز + اجرت."],
  },
  {
    term: ["VAT", "مالیات بر ارزش افزوده"],
    line: ["On jewelry it applies to اجرت + seller profit (the market convention).", "در زیورآلات به اجرت + سود فروشنده می‌خورد (رسم بازار)."],
  },
  {
    term: ["Gold fund", "صندوق طلا"],
    line: ["An exchange-traded fund whose assets are gold bullion.", "صندوقی قابل معامله در بورس که دارایی‌اش شمش طلاست."],
  },
  {
    term: ["Bar شمش", "شمش"],
    line: ["Cast or minted gold at high purity, priced close to its world content value.", "طلای ذوب یا ضرب‌شده با خلوص بالا، با قیمتی نزدیک به ارزش جهانی محتوایش."],
  },
  {
    term: ["Coin سکه", "سکه"],
    line: ["The Central Bank's minted coins (Emami, Bahar Azadi…) — each carrying its own حباب.", "سکه‌های ضرب بانک مرکزی (امامی، بهار آزادی…) — هر کدام با حباب خودش."],
  },
];

/** The band's own copy — EN + fa, the page's two locales. */
const T = {
  en: {
    title: "Gold questions, plainly answered",
    subtitle:
      "The ten questions this page hears most, answered in its own words — each answer links the section that carries the live number. Facts here are education, not advice.",
    faqEyebrow: "Frequently asked",
    glossaryTitle: "The page's own words — a mini glossary",
    glossarySubtitle: "The terms this page uses, in one line each.",
    reviewedLine: "Answers and glossary last reviewed: {date}",
    openSection: "See the section",
  },
  fa: {
    title: "پرسش‌های طلا، با پاسخ روشن",
    subtitle:
      "ده پرسشی که این صفحه بیشتر از همه می‌شنود، به زبان خودش — هر پاسخ به بخشی وصل است که عدد زنده‌اش را نشان می‌دهد. این‌ها آموزش‌اند، نه توصیه.",
    faqEyebrow: "پرسش‌های پرتکرار",
    glossaryTitle: "واژه‌نامهٔ کوچک این صفحه",
    glossarySubtitle: "اصطلاح‌هایی که این صفحه به کار می‌برد، هرکدام در یک خط.",
    reviewedLine: "آخرین بازبینی پاسخ‌ها و واژه‌نامه: {date}",
    openSection: "دیدن بخش",
  },
} as const;

export function FaqBand({ locale, fmt }: { locale: Locale; fmt: Fmt }) {
  const t = T[locale];
  return (
    <section
      id="gold-faq"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5"
      aria-label={t.title}
    >
      <h2 className="m-0 flex items-center gap-4 text-[1.25rem] font-extrabold leading-tight text-[var(--color-text-primary)]">
        <PackIcon file="gold-faq-question-mark.png" size={128} className="h-32 w-32" />
        {t.title}
      </h2>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {/* the questions — native <details> rows, the house's own collapsible
          grammar (one open question at a time is the reader's own choice) */}
      <div className="mt-3 flex flex-col gap-1.5">
        {FAQ_ITEMS.map((item, i) => (
          <details
            key={i}
            className="group rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-0 ring-1 ring-[var(--color-border)]"
          >
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-2 px-3.5 py-2.5 text-start [&::-webkit-details-marker]:hidden">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-gold)]/15 type-caption font-extrabold text-[var(--color-accent-gold-deep)]" aria-hidden="true">
                {locale === "en" ? i + 1 : ["۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹", "۱۰"][i]}
              </span>
              <span className="type-label font-bold text-[var(--color-text-primary)]">{item.q[lan(locale)]}</span>
              <span className="ms-auto flex h-4 w-4 shrink-0 items-center justify-center type-caption text-[var(--color-text-tertiary)] transition-transform group-open:rotate-90 rtl:rotate-180 rtl:group-open:rotate-90" aria-hidden="true">
                ›
              </span>
            </summary>
            <div className="flex flex-col gap-2 px-3.5 pb-3 pt-0.5">
              <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{item.a[lan(locale)]}</p>
              <a
                href={`#${item.anchor}`}
                className="inline-flex min-h-[32px] w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-currena-blue)]/60 transition-transform hover:scale-[1.02] active:scale-95"
              >
                {t.openSection}
                <span aria-hidden="true" className="rtl:rotate-180">→</span>
              </a>
            </div>
          </details>
        ))}
      </div>

      {/* the mini glossary — the page's own vocabulary, one line each */}
      <h3 className="m-0 mt-5 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{t.glossaryTitle}</h3>
      <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{t.glossarySubtitle}</p>
      <dl className="m-0 mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {GLOSSARY.map((g, i) => (
          <div key={i} className="flex flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-3 py-2 ring-1 ring-[var(--color-border)]">
            <dt className="type-label font-bold text-[var(--color-text-primary)]">{g.term[lan(locale)]}</dt>
            <dd className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{g.line[lan(locale)]}</dd>
          </div>
        ))}
      </dl>

      {/* the honesty stamp — the band's own facts are dated */}
      <p className="m-0 mt-3 border-t border-[var(--color-border)] pt-2.5 type-caption text-[var(--color-text-tertiary)]">
        {t.reviewedLine.replace("{date}", fmt.dateWords(LAST_REVIEWED_ISO))}
      </p>
    </section>
  );
}
