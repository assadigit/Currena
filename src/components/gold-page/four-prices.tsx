"use client";

/**
 * The "one metal, four prices" band — approved item B1 with the B3
 * digital-gold card inside (docs/gold-page/SESSION-3-PROMPT.md): the
 * answer to the first confusion an average buyer hits — why does gold
 * have several prices at once?
 *
 * One table, four rows, each row its own source, its own timestamp and
 * its own one-line why: the global spot (the store), the COMEX front
 * future (paper), the Shanghai premium (physical China), and Tehran's
 * own Emami حباب (physical Iran). Every row fails closed
 * independently — a leg that does not arrive renders its honest line,
 * never a guess. The Tehran row rides the owner's Iran layer exactly
 * like the bridge: present for the Persian reader always, for the EN
 * reader on the toggle, and never for the international reader without
 * it (a quiet line names it instead).
 *
 * Reuses, never re-implements: the futures leg rides /api/gold/futures
 * (the SAME react-query key the futures band uses — one fetch, one
 * cache), the Shanghai reading is the projection's own
 * shanghai-gold-premium (the same read PhysicalBand does), and the
 * Tehran حباب is the coin-premium engine's own computation over the
 * same rates snapshot the bridge board renders.
 *
 * The B3 card under the table — "Digital gold, a fifth price": the
 * PAXG/XAUt token's own market price off the desk's
 * /api/gold/digital-gold route (TGJU), its gap vs the store spot, its
 * own date stamp, and the plain-words caveat: a token claiming each
 * unit is backed by one troy ounce in a vault — a market price for
 * reference, not an endorsement, not advice.
 *
 * Additive programme note: this band is a NEW section — the copy lives
 * here, self-contained (content.ts is existing code and stays
 * untouched). The only plug-in edits are the mount + the nav chip in
 * page.tsx.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, SignedDelta, faDigits } from "@/components/gold-page/visuals";
import { PackIcon } from "@/components/gold-page/pack-icon";
import type { FuturesHeroData } from "@/components/gold-page/futures";
import type { ProjectionPayload } from "@/components/gold-page/context-cards";
import type { RatesPayload } from "@/components/gold-page/bridge-board";
import {
  coinPremium,
  dollarTomanOf,
  type GoldQuote,
} from "@/lib/gold-page/coin-premium";

/* ------------------------------------------------------------------ *
 * The legs this band rides beside its props
 * ------------------------------------------------------------------ */

/** The futures leg's own shape, mirrored minimally (shared query key). */
interface FuturesLite {
  front: { contract: string; price: number | null; marketTime: string | null } | null;
  fetchedAt: string;
}

async function fetchFuturesLite(): Promise<FuturesLite> {
  const res = await fetch(`${deskBasePath}/api/gold/futures`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The futures API responded with ${res.status}`);
  return res.json() as Promise<FuturesLite>;
}

/** The digital-gold leg (TGJU's PAXG/XAUt row). */
interface PaxgPayload {
  price: number;
  changePct: number | null;
  date: string;
  fetchedAt: string;
  source: "tgju-paxg";
}

async function fetchPaxg(): Promise<PaxgPayload> {
  const res = await fetch(`${deskBasePath}/api/gold/digital-gold`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The digital-gold API responded with ${res.status}`);
  return res.json() as Promise<PaxgPayload>;
}

/** "HH:MM" off an ISO stamp, UTC — the house's honest clock. */
function utcHm(iso: string | null | undefined): string | null {
  if (iso === null || iso === undefined) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(d);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * The band's own copy — EN + fa, plain words
 * ------------------------------------------------------------------ */

const T = {
  en: {
    title: "One metal, four prices",
    subtitle:
      "The same gold trades at different prices in different markets — the differences are the markets' own signals. Every row carries its own source and its own stamp.",
    headMarket: "Market",
    headToday: "Today",
    headWhy: "Why it differs",
    overSpot: "over spot",
    underSpot: "under spot",
    theReference: "the reference itself",
    spotName: "Global spot (XAU/USD)",
    spotStamp: "The desk's store · EODHD · data as of {date}",
    spotWhy: "The world's reference price — the number every other row is measured against.",
    spotUnavailable: "The store's spot has not arrived yet.",
    futuresName: "COMEX front future (paper)",
    futuresStamp: "Yahoo Finance · delayed · {time} UTC",
    futuresWhy: "Paper plus carry: until delivery day, the buyer carries storage and financing.",
    futuresLink: "the futures band",
    futuresUnavailable: "The futures leg could not be read right now.",
    shanghaiName: "Shanghai premium (physical China)",
    shanghaiStamp: "The physical-market reading · as of {date}",
    shanghaiWhy: "China's buyers pay over spot when demand is strong, under it when metal flows back.",
    shanghaiLink: "the physical market",
    shanghaiUnavailable: "The Shanghai reading has not arrived yet.",
    tehranName: "Tehran Emami premium — حباب (physical Iran)",
    tehranStamp: "TGJU · the Tehran board · {time} UTC",
    tehranWhy: "Iran's own premium — coin demand and supply on top of the world price.",
    tehranLink: "the Iran bridge",
    tehranUnavailable: "The Tehran board has not arrived yet.",
    iranHiddenLine:
      "Tehran's own premium — the fourth price — rides behind the Iran layer; the toggle sits at the top of the page.",
    paxgTitle: "Digital gold — a fifth price",
    paxgName: "PAXG / XAUt",
    paxgStamp: "TGJU · its own date {date}",
    paxgGapLine: "+${usd} (+{pct}%) vs the store spot",
    paxgGapLineDown: "−${usd} (−{pct}%) vs the store spot",
    paxgWhy:
      "A token claiming each unit is backed by one troy ounce of gold in a vault — a market price shown for reference, not an endorsement, not advice.",
    paxgUnavailable: "The digital-gold quote could not be read right now — nothing is shown rather than a guess.",
    paxgLoading: "…",
  },
  fa: {
    title: "یک فلز، چهار قیمت",
    subtitle:
      "همان طلا در بازارهای مختلف با قیمت‌های متفاوت معامله می‌شود — تفاوت‌ها سیگنالِ خودِ بازارها هستند. هر ردیف منبع و مهر زمانِ خودش را دارد.",
    headMarket: "بازار",
    headToday: "امروز",
    headWhy: "چرا متفاوت است",
    overSpot: "بالاتر از اسپات",
    underSpot: "پایین‌تر از اسپات",
    theReference: "خودِ مرجع",
    spotName: "قیمت جهانی (اونس/XAU-USD)",
    spotStamp: "فروشگاه دادهٔ میز · EODHD · مهر دادهٔ {date}",
    spotWhy: "قیمت مرجع جهان — همان عددی که بقیهٔ ردیف‌ها با آن سنجیده می‌شوند.",
    spotUnavailable: "قیمت جهانی فروشگاه هنوز نرسیده است.",
    futuresName: "قرارداد جلوی کامکس (کاغذی)",
    futuresStamp: "یاهو فایننس · با تأخیر · {time} UTC",
    futuresWhy: "کاغذ به‌علاوهٔ حمل: تا روز تحویل، نگهداری و تأمین مالی بر دوش خریدار است.",
    futuresLink: "بخش آتی",
    futuresUnavailable: "ساقهٔ فیوچرز در حال حاضر خوانده نشد.",
    shanghaiName: "صرف شانگهای (فیزیکی چین)",
    shanghaiStamp: "قرائت بازار فیزیکی · مهر {date}",
    shanghaiWhy: "خریدار چینی وقتی تقاضا قوی است بالاتر از قیمت جهانی می‌خرد و وقتی فلز برمی‌گردد پایین‌تر.",
    shanghaiLink: "بازار فیزیکی",
    shanghaiUnavailable: "قرائت شانگهای هنوز نرسیده است.",
    tehranName: "حباب سکهٔ امامی (فیزیکی ایران)",
    tehranStamp: "TGJU · تابلوی تهران · {time} UTC",
    tehranWhy: "صرف خودِ ایران — تقاضا و عرضهٔ سکه، روی قیمت جهانی.",
    tehranLink: "پل ایران",
    tehranUnavailable: "تابلوی تهران هنوز نرسیده است.",
    iranHiddenLine: "",
    paxgTitle: "طلای دیجیتال — قیمت پنجم",
    paxgName: "PAXG / XAUt",
    paxgStamp: "TGJU · تاریخ خودِ داده {date}",
    paxgGapLine: "‎+${usd} (‎+{pct}٪) بالاتر از اسپاتِ فروشگاه",
    paxgGapLineDown: "‎−${usd} (‎−{pct}٪) پایین‌تر از اسپاتِ فروشگاه",
    paxgWhy:
      "توکنی که ادعا می‌کند پشتوانهٔ هر واحدش یک اونس تروا طلا در گاوصندوق است — قیمتی بازاری، برای آگاهی؛ نه تأیید، نه توصیه.",
    paxgUnavailable: "نرخ طلای دیجیتال در حال حاضر خوانده نشد — به‌جای حدس، هیچ‌چیز نشان داده نمی‌شود.",
    paxgLoading: "…",
  },
} as const;

/* ------------------------------------------------------------------ *
 * The band
 * ------------------------------------------------------------------ */

export function FourPricesBand({
  data,
  projection,
  rates,
  showIran,
  locale,
  fmt,
}: {
  data: FuturesHeroData;
  projection: ProjectionPayload | null;
  rates: RatesPayload | null;
  showIran: boolean;
  locale: Locale;
  fmt: Fmt;
}) {
  const t = T[locale];

  /* the futures leg — the SAME cache the futures band rides */
  const futures = useQuery({
    queryKey: ["currena-gold-futures"],
    queryFn: fetchFuturesLite,
    staleTime: 90 * 1000,
    retry: 1,
  });
  /* the digital-gold leg — its own cache, five minutes */
  const paxg = useQuery({
    queryKey: ["currena-gold-digital"],
    queryFn: fetchPaxg,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const spot = data.gold.spot;
  const spotAsOf = data.gold.asOf;

  /* the Shanghai reading — the same read the physical band does */
  const shanghai = React.useMemo(() => {
    if (projection === null) return null;
    const r = projection.readings.find((x) => x.id === "shanghai-gold-premium");
    if (r === undefined || r.value === null || !Number.isFinite(r.value)) return null;
    return { value: r.value, asOf: r.asOf };
  }, [projection]);

  /* the Tehran Emami حباب — the same computation the bridge board shows */
  const tehran = React.useMemo(() => {
    if (rates === null) return null;
    const gold: readonly GoldQuote[] = rates.gold ?? [];
    const usd = rates.rates?.find((r) => r.code === "USD");
    const dollarToman = dollarTomanOf(usd?.rate);
    if (dollarToman === null) return null;
    const premium = coinPremium(gold, dollarToman);
    const row = premium.rows.find((r) => r.id === "coin-emami");
    if (row === undefined || !Number.isFinite(row.premiumPct)) return null;
    return { premiumPct: row.premiumPct, fetchedAt: rates.fetchedAt ?? null };
  }, [rates]);

  /* the futures front + its basis vs the store spot */
  const front = futures.data?.front ?? null;
  const basis = React.useMemo(() => {
    if (front === null || front.price === null || !Number.isFinite(spot) || spot <= 0) return null;
    return { usd: front.price - spot, pct: (front.price / spot - 1) * 100 };
  }, [front, spot]);

  /* the PAXG gap vs the store spot */
  const paxgGap = React.useMemo(() => {
    const p = paxg.data?.price;
    if (p === undefined || !Number.isFinite(p) || !Number.isFinite(spot) || spot <= 0) return null;
    return { usd: p - spot, pct: (p / spot - 1) * 100 };
  }, [paxg.data, spot]);

  const futuresHm = utcHm(front?.marketTime ?? null);
  const tehranHm = utcHm(tehran?.fetchedAt ?? null);

  const usdCell = (v: number, digits = 1): React.ReactNode => (
    <bdi dir="ltr" className="whitespace-nowrap tabular-nums">${fmt.num(v, digits)}</bdi>
  );

  const pctCell = (v: number): React.ReactNode => (
    <bdi dir="ltr" className="whitespace-nowrap tabular-nums font-extrabold text-[var(--color-text-primary)]">
      {v >= 0 ? "+" : "−"}{fmt.num(Math.abs(v), 1)}%
    </bdi>
  );

  return (
    <section
      id="gold-four-prices"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5"
      aria-label={t.title}
    >
      <h2 className="m-0 flex items-center gap-4 text-[1.25rem] font-extrabold leading-tight text-[var(--color-text-primary)]">
        <PackIcon file="gold-one-metal-prices.png" size={128} className="h-32 w-32" />
        {t.title}
      </h2>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {/* the table — one row per market, each row its own source, stamp and why */}
      <div className="mt-3 min-w-0 overflow-x-auto rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
        <table className="m-0 w-full border-collapse bg-[var(--color-currena-bg-light)] type-caption" aria-label={t.title}>
          <thead>
            <tr className="text-[var(--color-text-tertiary)]">
              <th scope="col" className="px-3 py-2 text-start font-bold">{t.headMarket}</th>
              <th scope="col" className="px-3 py-2 text-end font-bold">{t.headToday}</th>
              <th scope="col" className="px-3 py-2 text-start font-bold">{t.headWhy}</th>
            </tr>
          </thead>
          <tbody>
            {/* 1 — the global spot, the reference */}
            <tr className="border-t border-[var(--color-border)]">
              <th scope="row" className="px-3 py-2.5 text-start align-top">
                <span className="block font-bold text-[var(--color-text-primary)]"><bdi>{t.spotName}</bdi></span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-text-tertiary)]">
                  {t.spotStamp.replace("{date}", fmt.dateWords(spotAsOf))}
                </span>
              </th>
              <td className="px-3 py-2.5 text-end align-top">
                <span className="block whitespace-nowrap text-[15px] font-extrabold tabular-nums text-[var(--color-text-primary)]">{usdCell(spot, 1)}</span>
                <span className="mt-0.5 block text-[11px] text-[var(--color-text-tertiary)]">{t.theReference}</span>
              </td>
              <td className="px-3 py-2.5 align-top leading-relaxed text-[var(--color-text-secondary)]">{t.spotWhy}</td>
            </tr>

            {/* 2 — the COMEX front future, paper + carry */}
            <tr className="border-t border-[var(--color-border)]">
              <th scope="row" className="px-3 py-2.5 text-start align-top">
                <span className="block font-bold text-[var(--color-text-primary)]"><bdi>{t.futuresName}</bdi></span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-text-tertiary)]">
                  {t.futuresStamp.replace("{time}", futuresHm !== null ? (locale === "fa" ? faDigits(futuresHm) : futuresHm) : "·")}
                </span>
                <a
                  href="#gold-futures"
                  className="mt-1 inline-flex min-h-[24px] items-center gap-1 text-[11.5px] font-bold text-[var(--color-currena-blue-deep)] underline decoration-[var(--color-currena-blue)]/40 underline-offset-2 hover:decoration-[var(--color-currena-blue)]"
                >
                  {t.futuresLink}
                  <span aria-hidden="true" className="rtl:rotate-180">→</span>
                </a>
              </th>
              <td className="px-3 py-2.5 text-end align-top">
                {futures.isLoading ? (
                  <span className="text-[var(--color-text-tertiary)]" aria-live="polite">{t.paxgLoading}</span>
                ) : front !== null && front.price !== null ? (
                  <>
                    <span className="block whitespace-nowrap text-[15px] font-extrabold tabular-nums text-[var(--color-text-primary)]">{usdCell(front.price, 1)}</span>
                    {basis !== null ? (
                      <span className="mt-0.5 block whitespace-nowrap text-[11px] tabular-nums text-[var(--color-text-tertiary)]">
                        <bdi dir="ltr">
                          {basis.usd >= 0 ? "+" : "−"}${fmt.num(Math.abs(basis.usd), 1)} · {basis.pct >= 0 ? "+" : "−"}{fmt.num(Math.abs(basis.pct), 1)}%
                        </bdi>
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-[11px] leading-snug text-[var(--color-text-tertiary)]">{t.futuresUnavailable}</span>
                )}
              </td>
              <td className="px-3 py-2.5 align-top leading-relaxed text-[var(--color-text-secondary)]">{t.futuresWhy}</td>
            </tr>

            {/* 3 — the Shanghai premium, physical China */}
            <tr className="border-t border-[var(--color-border)]">
              <th scope="row" className="px-3 py-2.5 text-start align-top">
                <span className="block font-bold text-[var(--color-text-primary)]"><bdi>{t.shanghaiName}</bdi></span>
                <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-text-tertiary)]">
                  {shanghai !== null && shanghai.asOf !== null
                    ? t.shanghaiStamp.replace("{date}", fmt.dateWords(shanghai.asOf))
                    : t.shanghaiStamp.replace(" · as of {date}", "").replace(" · مهر {date}", "")}
                </span>
                <a
                  href="#gold-other"
                  className="mt-1 inline-flex min-h-[24px] items-center gap-1 text-[11.5px] font-bold text-[var(--color-currena-blue-deep)] underline decoration-[var(--color-currena-blue)]/40 underline-offset-2 hover:decoration-[var(--color-currena-blue)]"
                >
                  {t.shanghaiLink}
                  <span aria-hidden="true" className="rtl:rotate-180">→</span>
                </a>
              </th>
              <td className="px-3 py-2.5 text-end align-top">
                {shanghai !== null ? (
                  <>
                    <span className="block whitespace-nowrap text-[15px]">{pctCell(shanghai.value)}</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--color-text-tertiary)]">
                      {shanghai.value >= 0 ? t.overSpot : t.underSpot}
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] leading-snug text-[var(--color-text-tertiary)]">{t.shanghaiUnavailable}</span>
                )}
              </td>
              <td className="px-3 py-2.5 align-top leading-relaxed text-[var(--color-text-secondary)]">{t.shanghaiWhy}</td>
            </tr>

            {/* 4 — Tehran's own Emami حباب, on the Iran layer only (the
                owner's layer law: the international reader never meets
                Iran's numbers; a quiet line names it instead) */}
            {showIran ? (
              <tr className="border-t border-[var(--color-border)]">
                <th scope="row" className="px-3 py-2.5 text-start align-top">
                  <span className="block font-bold text-[var(--color-text-primary)]"><bdi>{t.tehranName}</bdi></span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-text-tertiary)]">
                    {t.tehranStamp.replace("{time}", tehranHm !== null ? (locale === "fa" ? faDigits(tehranHm) : tehranHm) : "·")}
                  </span>
                  <a
                    href="#gold-bridge"
                    className="mt-1 inline-flex min-h-[24px] items-center gap-1 text-[11.5px] font-bold text-[var(--color-currena-blue-deep)] underline decoration-[var(--color-currena-blue)]/40 underline-offset-2 hover:decoration-[var(--color-currena-blue)]"
                  >
                    {t.tehranLink}
                    <span aria-hidden="true" className="rtl:rotate-180">→</span>
                  </a>
                </th>
                <td className="px-3 py-2.5 text-end align-top">
                  {tehran !== null ? (
                    <>
                      <span className="block whitespace-nowrap text-[15px]">{pctCell(tehran.premiumPct)}</span>
                      <span className="mt-0.5 block text-[11px] text-[var(--color-text-tertiary)]">
                        {locale === "en" ? "the coin premium (حباب)" : "حباب سکه"}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] leading-snug text-[var(--color-text-tertiary)]">{t.tehranUnavailable}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 align-top leading-relaxed text-[var(--color-text-secondary)]">{t.tehranWhy}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* the quiet line for the EN reader without the Iran layer */}
      {!showIran && t.iranHiddenLine !== "" ? (
        <p className="m-0 mt-2 type-caption text-[var(--color-text-tertiary)]">{t.iranHiddenLine}</p>
      ) : null}

      {/* the B3 card — digital gold, a fifth price (a global token, so
          it rides for every reader, not just the Iran layer) */}
      <div className="mt-3 flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <h3 className="m-0 type-label font-bold text-[var(--color-text-primary)]">{t.paxgTitle}</h3>
          {paxg.data !== undefined ? (
            <span className="type-caption text-[var(--color-text-tertiary)]">
              {t.paxgStamp.replace("{date}", fmt.dateWords(paxg.data.date))}
            </span>
          ) : null}
        </div>
        {paxg.isLoading ? (
          <p className="m-0 type-caption text-[var(--color-text-tertiary)]" aria-live="polite" data-paxg-loading>
            {t.paxgLoading}
          </p>
        ) : paxg.isError || paxg.data === undefined ? (
          <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]" data-paxg-unavailable>
            {t.paxgUnavailable}
          </p>
        ) : (
          <>
            <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="type-label font-bold text-[var(--color-text-secondary)]"><bdi>{t.paxgName}</bdi></span>
              <span className="text-[1.15rem] font-extrabold tabular-nums text-[var(--color-text-primary)]">{usdCell(paxg.data.price, 2)}</span>
              <SignedDelta v={paxg.data.changePct} fmt={fmt} />
              {paxgGap !== null ? (
                <span className="type-caption tabular-nums text-[var(--color-text-tertiary)]">
                  <bdi dir="ltr">
                    {(paxgGap.usd >= 0 ? t.paxgGapLine : t.paxgGapLineDown)
                      .replace("${usd}", fmt.num(Math.abs(paxgGap.usd), 1))
                      .replace("{pct}", fmt.num(Math.abs(paxgGap.pct), 1))}
                  </bdi>
                </span>
              ) : null}
            </p>
            <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.paxgWhy}</p>
          </>
        )}
      </div>
    </section>
  );
}
