"use client";

/**
 * The physical venues explainer — approved item B2
 * (docs/gold-page/SESSION-3-PROMPT.md): where gold actually trades
 * around the world, in plain words for the reader who has only ever
 * met the price, never the market behind it.
 *
 * Four venue cards — London OTC (the wholesale market behind "spot",
 * where the LBMA benchmark lives), COMEX New York (the futures
 * exchange, the paper price), Shanghai SGE (China's physical exchange,
 * where the premium is born) and Tehran's bazaar + union (where the
 * board's coin prices come from; حباب is Tehran's own premium) — each
 * cross-linked to the section of this page that carries its live
 * numbers, plus the one takeaway line: the same metal trades at
 * different prices in different markets, and the differences are the
 * markets' own signals.
 *
 * Static education only: no data, no fetch, nothing that can go stale
 * except the words themselves — so the band carries the house's own
 * "last reviewed" stamp. The Tehran card is education like the FAQ's
 * own Tehran answers (no live numbers ride here), so it renders for
 * every reader; the live Tehran numbers stay behind the owner's Iran
 * layer where they belong.
 *
 * Additive programme note: this band is a NEW section — the copy lives
 * here, self-contained (content.ts is existing code and stays
 * untouched). The only plug-in edits are the mount + the nav chip in
 * page.tsx.
 */

import * as React from "react";
import type { Locale } from "@/lib/gold-page/content";
import { type Fmt } from "@/components/gold-page/visuals";
import { PackIcon } from "@/components/gold-page/pack-icon";
import { CountryFlag } from "@/components/gold-page/flags";

/* The band's own last-reviewed day — the stamp the reader sees. */
const LAST_REVIEWED_ISO = "2026-11-27";

/** One venue: its flag, its plain-words description, its in-page anchor. */
interface VenueCard {
  code: "GBR" | "USA" | "CHN" | "IRN";
  flagAlt: [string, string];
  name: [string, string];
  body: [string, string];
  anchor: string;
  link: [string, string];
}

const VENUES: VenueCard[] = [
  {
    code: "GBR",
    flagAlt: ["the United Kingdom", "بریتانیا"],
    name: ["London — the OTC market", "لندن — بازار خارج از بورس"],
    body: [
      "A wholesale network of banks and vaults — not an exchange with a trading floor. When this page says «spot», the deep source is this market's desk-to-desk trade. The LBMA benchmark, the price reference the industry settles on, is born here — and the page's own London vault numbers are this market's storeroom.",
      "شبکه‌ای عمده از بانک‌ها و گاوصندوق‌ها — نه بورسی با تالار معامله. وقتی این صفحه می‌گوید «قیمت جهانی»، سرچشمهٔ عمیقش معاملهٔ میز-به-میزِ همین بازار است. بنچمارک LBMA — مرجع قیمتی که صنعت بر آن تسویه می‌کند — همین‌جا زاده می‌شود و عددهای گاوصندوق لندنِ این صفحه، انبارِ همین بازارند.",
    ],
    anchor: "gold-other",
    link: ["the London vault numbers", "عددهای گاوصندوق لندن"],
  },
  {
    code: "USA",
    flagAlt: ["the United States", "آمریکا"],
    name: ["New York — COMEX", "نیویورک — کامکس"],
    body: [
      "The futures exchange: contracts promising future delivery trade here in enormous volume. This is where the «paper gold» price is set — the one quoted around the world — and where the traders' positioning this page tracks is reported.",
      "بورس قراردادهای آتی: قراردادهایی که تحویلِ آینده را وعده می‌دهند، این‌جا با حجم عظیم معامله می‌شوند. قیمت «طلای کاغذی» — همان که همه‌جا نقل می‌شود — همین‌جا تعیین می‌شود و پوزیشن معامله‌گرانی که این صفحه دنبال می‌کند هم همین‌جا گزارش می‌شود.",
    ],
    anchor: "gold-futures",
    link: ["the futures band", "بخش آتی"],
  },
  {
    code: "CHN",
    flagAlt: ["China", "چین"],
    name: ["Shanghai — SGE", "شانگهای — SGE"],
    body: [
      "China's physical exchange, the world's biggest gold market by volume. When Chinese demand runs strong, Shanghai pays over the world price — the premium this page shows is born here.",
      "بورس فیزیکی چین، بزرگ‌ترین بازار طلای جهان از نظر حجم. وقتی تقاضای چینی قوی می‌شود، شانگهای بالاتر از قیمت جهانی می‌خرد — صرفی که این صفحه نشان می‌دهد همین‌جا زاده می‌شود.",
    ],
    anchor: "gold-other",
    link: ["the physical market", "بازار فیزیکی"],
  },
  {
    code: "IRN",
    flagAlt: ["Iran", "ایران"],
    name: ["Tehran — the bazaar and the union", "تهران — بازار و اتحادیه"],
    body: [
      "Iran's own gold trades through the bazaar's network of shops, with the gold sellers' union quoting the day's rates. The board's coin prices are born here — and حباب, Tehran's own premium over the world content value, is this market's own signal.",
      "طلای خودِ ایران از شبکهٔ مغازه‌های بازار می‌گذرد و اتحادیهٔ فروشندگان طلا نرخ‌های روز را اعلام می‌کند. قیمت‌های سکهٔ تابلوی همین صفحه همین‌جا زاده می‌شوند — و حباب، صرفِ خودِ تهران بر ارزش جهانیِ محتوا، سیگنالِ خودِ همین بازار است.",
    ],
    anchor: "gold-bridge",
    link: ["the Iran bridge", "پل ایران"],
  },
];

/** The band's own copy — EN + fa. */
const T = {
  en: {
    title: "Where gold actually trades — the venues",
    subtitle:
      "Four markets, four rooms where the same metal changes hands. No live numbers here — just who trades where, and what each market's price means. Each card links the section of this page that carries its live numbers.",
    takeaway:
      "The same metal, different rooms, different prices — the differences (premium, basis, حباب) are each market's own signal, shown with its own stamp on this page.",
    reviewedLine: "Venues last reviewed: {date}",
  },
  fa: {
    title: "طلا کجا معامله می‌شود؟ — بازارها",
    subtitle:
      "چهار بازار، چهار اتاق که همان فلز در آن‌ها دست‌به‌دست می‌شود. این‌جا عدد زنده‌ای نیست — فقط اینکه چه کسی کجا معامله می‌کند و قیمت هر بازار چه معنایی دارد. هر کارت به بخشی از همین صفحه وصل است که عددهای زنده‌اش را نشان می‌دهد.",
    takeaway:
      "همان فلز، اتاق‌های مختلف، قیمت‌های مختلف — تفاوت‌ها (صرف، مابه‌التفاوت، حباب) سیگنالِ خودِ هر بازارند و هر کدام با مهر خودش در همین صفحه نشان داده می‌شوند.",
    reviewedLine: "آخرین بازبینی بازارها: {date}",
  },
} as const;

const lan = (l: Locale) => (l === "en" ? 0 : 1);

export function VenuesBand({ locale, fmt }: { locale: Locale; fmt: Fmt }) {
  const t = T[locale];
  return (
    <section
      id="gold-venues"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5"
      aria-label={t.title}
    >
      <h2 className="m-0 flex items-center gap-4 text-[1.25rem] font-extrabold leading-tight text-[var(--color-text-primary)]">
        <PackIcon file="gold-market-venues.png" size={128} className="h-32 w-32" />
        {t.title}
      </h2>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {/* the four venues — a 2×2 grid on wide screens, stacked on phones */}
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {VENUES.map((v) => (
          <article
            key={v.code}
            className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]"
          >
            <h3 className="m-0 flex items-center gap-2 type-label font-bold text-[var(--color-text-primary)]">
              <CountryFlag code={v.code} name={v.flagAlt[lan(locale)]} />
              <bdi>{v.name[lan(locale)]}</bdi>
            </h3>
            <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{v.body[lan(locale)]}</p>
            <a
              href={`#${v.anchor}`}
              className="mt-auto inline-flex min-h-[32px] w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-currena-blue)]/60 transition-transform hover:scale-[1.02] active:scale-95"
            >
              {v.link[lan(locale)]}
              <span aria-hidden="true" className="rtl:rotate-180">→</span>
            </a>
          </article>
        ))}
      </div>

      {/* the takeaway line — the band's one-sentence point */}
      <p
        className="m-0 mt-3 rounded-[var(--cr-radius-md)] px-3.5 py-3 type-caption leading-relaxed text-[var(--color-text-primary)]"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-accent-gold) 10%, transparent)",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 40%, transparent)",
        }}
      >
        {t.takeaway}
      </p>

      {/* the honesty stamp — the band's own words are dated */}
      <p className="m-0 mt-3 border-t border-[var(--color-border)] pt-2.5 type-caption text-[var(--color-text-tertiary)]">
        {t.reviewedLine.replace("{date}", fmt.dateWords(LAST_REVIEWED_ISO))}
      </p>
    </section>
  );
}
