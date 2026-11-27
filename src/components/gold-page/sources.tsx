"use client";

/**
 * The sources & honesty band — checklist item 13 (trust): every data source
 * named with what it feeds and how often, the page's honesty rules in plain
 * words, one clear page-level not-financial-advice disclaimer, and the
 * share row (checklist 14's sharing affordance).
 *
 * Additive programme note (docs/gold-page/PLAN.md, Phase 1): this band is a
 * NEW section — self-contained copy, the house tokens, no data fetches (the
 * cadences are the repo's own documented sync seams). The only plug-in edit
 * is the mount + the nav chip in page.tsx.
 */

import * as React from "react";
import type { Locale } from "@/lib/gold-page/content";
import { PackIcon } from "@/components/gold-page/pack-icon";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

/** Every live source the page rides on: name + home link, what it feeds,
 *  and how often it refreshes (the repo's own sync seams). */
interface SourceRow {
  name: string;
  url: string;
  feeds: [string, string];
  cadence: [string, string];
}

const SOURCES: SourceRow[] = [
  {
    name: "EODHD",
    url: "https://eodhd.com/",
    feeds: [
      "The world market series: the ounce, silver, the dollar-index components, US equities and oil — synced into the daily observation store.",
      "سری‌های بازار جهانی: اونس، نقره، اجزای شاخص دلار، سهام و نفت آمریکا — همگام‌سازی‌شده در فروشگاه مشاهده‌های روزانه.",
    ],
    cadence: ["Once a day", "روزی یک‌بار"],
  },
  {
    name: "FRED · St. Louis Fed",
    url: "https://fred.stlouisfed.org/",
    feeds: [
      "The US 10-year real and nominal Treasury yields (DFII10, DGS10).",
      "بازده واقعی و اسمی اوراق ۱۰سالهٔ آمریکا (DFII10 و DGS10).",
    ],
    cadence: ["Daily", "روزانه"],
  },
  {
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com/",
    feeds: [
      "Price-history legs: COMEX futures, silver, the S&P 500, Bitcoin, month-end exchange rates.",
      "ساقه‌های تاریخ قیمت: فیوچرز کامکس، نقره، اس‌اندپی ۵۰۰، بیت‌کوین، نرخ‌های ارز پایان ماه.",
    ],
    cadence: ["On demand", "به‌هنگام نیاز"],
  },
  {
    name: "TGJU",
    url: "https://tgju.org/",
    feeds: [
      "The Tehran market: the free-market dollar, the 18-karat gram, the coin board.",
      "بازار تهران: دلار آزاد، گرم ۱۸ عیار، تابلوی سکه.",
    ],
    cadence: ["Live, minutes", "لحظه‌ای، چند دقیقه"],
  },
  {
    name: "Trading Economics",
    url: "https://tradingeconomics.com/",
    feeds: [
      "The daily gold briefing — translated to Persian by this site's own pipeline, labeled as machine translation.",
      "بریفینگ روزانهٔ طلا — به فارسی برمی‌گردد با خط تولید خودِ همین سایت، با برچسب ترجمهٔ ماشینی.",
    ],
    cadence: ["Twice a day", "روزانه دو بار"],
  },
  {
    name: "World Gold Council",
    url: "https://www.gold.org/",
    feeds: [
      "The monthly market commentary; the central-bank demand tables.",
      "مرور ماهانهٔ بازار؛ جدول‌های تقاضای بانک‌های مرکزی.",
    ],
    cadence: ["Monthly", "ماهانه"],
  },
  {
    name: "LBMA",
    url: "https://www.lbma.org.uk/",
    feeds: [
      "London vault holdings, OTC clearing statistics, the forecast-survey retrospective.",
      "موجودی گاوصندوق لندن، آمار تسویهٔ بیرون از بورس، بازبینی پس‌نگریِ نظرسنجی پیش‌بینی.",
    ],
    cadence: ["Monthly", "ماهانه"],
  },
  {
    name: "IMF",
    url: "https://www.imf.org/",
    feeds: [
      "Central-bank reserve figures (via the World Gold Council tables).",
      "ارقام ذخایر بانک‌های مرکزی (از طریق جدول‌های شورای جهانی طلا).",
    ],
    cadence: ["Monthly (lagged)", "ماهانه (با تأخیر)"],
  },
  {
    name: "CFTC",
    url: "https://www.cftc.gov/",
    feeds: [
      "US futures trader positioning.",
      "پوزیشن معامله‌گران در فیوچرز آمریکا.",
    ],
    cadence: ["Weekly", "هفتگی"],
  },
  {
    name: "US Federal Reserve",
    url: "https://www.federalreserve.gov/",
    feeds: [
      "The FOMC decision calendar.",
      "تقویم تصمیم‌های فدرال رزرو (FOMC).",
    ],
    cadence: ["Fixed dates", "تاریخ‌های ثابت"],
  },
  {
    name: "Currena rates",
    url: "https://currena.ir/",
    feeds: [
      "The Tehran snapshot board this page proxies (source: TGJU).",
      "تابلوی تصویری تهران که این صفحه واسطه‌اش است (منبع: TGJU).",
    ],
    cadence: ["Minutes", "چند دقیقه‌ای"],
  },
];

/** The band's own copy — EN + fa. */
const T = {
  en: {
    title: "Sources & honesty",
    subtitle:
      "Every number on this page comes from a named source, and every section carries its own “data as of” stamp. These are the sources, what they feed, and how often they refresh.",
    sourcesTitle: "The sources, named",
    honestyTitle: "The honesty rules",
    honesty: [
      "Every number carries its own “as of” date — different sections can be different-fresh; the stamp is the truth, not the page.",
      "When a source fails, its section says so — the page never serves stale numbers as if they were live.",
      "Machine translations are labeled and dated — the English original stays the record.",
      "Historical figures carry their cited basis (static tables, LBMA-validated series), named at point of use.",
    ],
    disclaimerTitle: "The disclaimer",
    disclaimer:
      "This page is market information and education, gathered from the sources above and stamped with their dates. It is not investment advice, not a price forecast, and not a recommendation to buy or sell anything. Numbers can be delayed or wrong despite our care; verify with your own seller before any decision. Past performance never guarantees the future.",
    shareLabel: "Share this page",
    copyLabel: "Copy link",
    copiedLabel: "Copied",
    copyFailed: "Copy did not work — copy the address from the address bar.",
    feedsLabel: "Feeds",
    cadenceLabel: "Refreshes",
  },
  fa: {
    title: "منابع و روش",
    subtitle:
      "هر عددِ این صفحه از منبعی نامدار می‌آید و هر بخش، مهر «دادهٔ…» خودش را دارد. این‌ها منابع‌اند؛ چه چیزی می‌دهند و هر چند وقت تازه می‌شوند.",
    sourcesTitle: "منابع، با نام",
    honestyTitle: "قواعد صداقت",
    honesty: [
      "هر عدد مهر تاریخ خودش را دارد — بخش‌های مختلف می‌توانند تازگی متفاوتی داشته باشند؛ مهر معیار است، نه خود صفحه.",
      "وقتی منبعی نرسد، همان بخش می‌گوید — صفحه هرگز عدد کهنه را زنده جلوه نمی‌کند.",
      "ترجمه‌های ماشینی برچسب و تاریخ دارند — متن اصلی انگلیسی مرجع می‌ماند.",
      "ارقام تاریخی منبع استنادشدهٔ خودشان را دارند (جداول ثابت، سری‌های اعتبارسنجی‌شده با LBMA) و در محل نام برده می‌شوند.",
    ],
    disclaimerTitle: "بیانیهٔ رفع مسئولیت",
    disclaimer:
      "این صفحه اطلاعات و آموزش بازار است؛ از منابع بالا گردآوری و با تاریخ خودشان مهر شده. توصیهٔ سرمایه‌گذاری نیست، پیش‌بینی قیمت نیست و توصیه به خرید یا فروش هیچ‌چیز نیست. با آن‌همه دقت، عددها می‌توانند دیررس یا نادرست باشند؛ پیش از هر تصمیم با فروشندهٔ خودتان بیازمایید. بازدهٔ گذشته تضمین آینده نیست.",
    shareLabel: "اشتراک‌گذاری صفحه",
    copyLabel: "کپی پیوند",
    copiedLabel: "کپی شد",
    copyFailed: "کپی انجام نشد — نشانی را از نوار نشانی بردارید.",
    feedsLabel: "چه می‌دهد",
    cadenceLabel: "تازه‌سازی",
  },
} as const;

export function SourcesBand({ locale }: { locale: Locale }) {
  const t = T[locale];
  const [copied, setCopied] = React.useState(false);
  const [copyFailed, setCopyFailed] = React.useState(false);
  const copyTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (copyTimer.current !== null) clearTimeout(copyTimer.current);
    };
  }, []);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFailed(false);
      setCopied(true);
      if (copyTimer.current !== null) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2200);
    } catch {
      /* the clipboard was refused — the honest fallback line shows the
         reader the manual way instead of a silent nothing */
      setCopied(false);
      setCopyFailed(true);
      if (copyTimer.current !== null) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopyFailed(false), 6000);
    }
  };

  const onShare = async () => {
    const data: ShareData = {
      title: "Currena · Gold",
      text: locale === "en" ? "The gold page: the live price, the balance of forces, and the Tehran market." : "صفحهٔ طلا: قیمت زنده، ترازو نیروها و بازار تهران.",
      url: window.location.href,
    };
    if (typeof navigator.share === "function") {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* the reader cancelled, or share failed — fall through to copy */
      }
    }
    await onCopy();
  };

  return (
    <section
      id="gold-sources"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5"
      aria-label={t.title}
    >
      <h2 className="m-0 flex items-center gap-4 text-[1.25rem] font-extrabold leading-tight text-[var(--color-text-primary)]">
        <PackIcon file="gold-sources-magnifier.png" size={128} className="h-32 w-32" />
        {t.title}
      </h2>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {/* the share row — one tap shares, one tap copies; the inline word
          confirms the copy (no popups, no new dependencies) */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2" data-share-row>
        <button
          type="button"
          onClick={onShare}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-currena-blue)] px-3.5 py-1 text-[12.5px] font-bold text-white transition-transform hover:scale-[1.02] active:scale-95"
        >
          {t.shareLabel}
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-transparent px-3.5 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-currena-blue)]/60 transition-transform hover:scale-[1.02] active:scale-95"
        >
          {t.copyLabel}
        </button>
        <span
          className={`type-caption font-bold transition-opacity ${copied ? "text-[var(--color-return-up)] opacity-100" : "opacity-0"}`}
          role="status"
        >
          {t.copiedLabel}
        </span>
        <span
          className={`type-caption leading-relaxed text-[var(--color-text-tertiary)] transition-opacity ${copyFailed ? "opacity-100" : "pointer-events-none opacity-0"}`}
          role="status"
        >
          {t.copyFailed}
        </span>
      </div>

      {/* the sources — one row each: the name, what it feeds, how often */}
      <h3 className="m-0 mt-5 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{t.sourcesTitle}</h3>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
        {SOURCES.map((s) => (
          <li key={s.name} className="flex flex-col gap-1 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-3 py-2 ring-1 ring-[var(--color-border)]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="type-label font-bold text-[var(--color-currena-blue-deep)] underline decoration-[var(--color-currena-blue)]/40 underline-offset-2 hover:decoration-[var(--color-currena-blue)]"
              >
                {s.name}
              </a>
              <span className="inline-flex min-h-[24px] max-w-full shrink-0 items-center gap-1 rounded-full bg-[var(--color-currena-soft)] px-2.5 type-caption text-nowrap font-bold text-[var(--color-text-secondary)]">
                {s.cadence[lan(locale)]}
              </span>
            </div>
            <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
              <span className="font-bold text-[var(--color-text-tertiary)]">{t.feedsLabel}: </span>
              {s.feeds[lan(locale)]}
            </p>
          </li>
        ))}
      </ul>

      {/* the honesty rules — the page's own laws, in plain words */}
      <h3 className="m-0 mt-5 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{t.honestyTitle}</h3>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
        {t.honesty.map((h, i) => (
          <li key={i} className="flex items-start gap-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-3 py-2 ring-1 ring-[var(--color-border)]">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-return-up)]/12 text-[11px] font-extrabold text-[var(--color-return-up)]" aria-hidden="true">
              ✓
            </span>
            <span className="type-caption leading-relaxed text-[var(--color-text-secondary)]">{h}</span>
          </li>
        ))}
      </ul>

      {/* the disclaimer — the page-level word, in the loud gold box */}
      <h3 className="m-0 mt-5 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{t.disclaimerTitle}</h3>
      <div
        className="mt-2 rounded-[var(--cr-radius-md)] px-3.5 py-3"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-accent-gold) 10%, transparent)",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 40%, transparent)",
        }}
      >
        <p className="m-0 type-caption leading-relaxed text-[var(--color-text-primary)]">{t.disclaimer}</p>
      </div>
    </section>
  );
}
