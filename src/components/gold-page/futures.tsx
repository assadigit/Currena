"use client";

/**
 * The COMEX futures band — approved item A
 * (docs/gold-page/SESSION-3-PROMPT.md): the paper market behind the
 * headline gold price, in plain words for the buyer/saver who has never
 * met a futures contract.
 *
 * What it shows: the front contract's own card (name read from the
 * feed, price, day change, day range, volume, updated stamp, honest
 * "delayed" note, the 52-week range labeled COMEX futures), the
 * futures-vs-spot basis row with BOTH stamps and the one-line why, the
 * delivery-calendar table with the curve's verdict chip (contango /
 * flat / backwardation — translated, none scary), the Globex session
 * chip computed from the New York clock (deterministic, no source), a
 * plain-words collapsible (what a futures contract is, why it is
 * "paper gold", why the front month is the quoted one, and the
 * cross-link to the same market's traders in #gold-positions), and the
 * sources line.
 *
 * Additive programme note: this band is a NEW section — the copy lives
 * here, self-contained (content.ts is existing code and stays
 * untouched). The only plug-in edits are the mount + the nav chip in
 * page.tsx. Serves the desk's own /api/gold/futures route (the Yahoo
 * public legs, delayed); the basis pairing rides the hero store spot
 * passed in — both stamps always visible. Fail-closed: a leg that does
 * not arrive renders its honest line, never a guess, never a spinner
 * that never resolves.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, SignedDelta, faDigits } from "@/components/gold-page/visuals";
import { PackIcon } from "@/components/gold-page/pack-icon";

/* ------------------------------------------------------------------ *
 * The payload (the route's own shape, mirrored client-side)
 * ------------------------------------------------------------------ */

interface FuturesFrontPayload {
  contract: string;
  price: number | null;
  changePct: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  volume: number | null;
  marketTime: string | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

interface FuturesTermPayload {
  symbol: string;
  month: number;
  year: number;
  monthLabel: string;
  price: number;
  vsFrontUsd: number | null;
}

interface FuturesPayload {
  front: FuturesFrontPayload | null;
  term: FuturesTermPayload[];
  fetchedAt: string;
  source: "yahoo-finance";
  delayed: true;
}

/** The hero payload's own spot reference, passed from the mount site. */
export interface FuturesHeroData {
  asOf: string;
  gold: { spot: number; asOf: string };
}

async function fetchFutures(): Promise<FuturesPayload> {
  const res = await fetch(`${deskBasePath}/api/gold/futures`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The futures API responded with ${res.status}`);
  return res.json() as Promise<FuturesPayload>;
}

/* ------------------------------------------------------------------ *
 * The band's own copy — EN + fa, plain words, no trader jargon
 * ------------------------------------------------------------------ */

const MONTHS_FA = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "مه",
  "ژوئن",
  "ژوئیه",
  "اوت",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
] as const;

const T = {
  en: {
    title: "Paper gold: the futures market",
    subtitle:
      "The price quoted around the world is usually this market's front contract — a firm promise to deliver gold on a set date. Here is that promise's own price, delayed.",
    frontEyebrow: "The front contract — the one everyone quotes",
    priceLabel: "Price per ounce",
    dayRangeLabel: "Day range",
    volumeLabel: "Contracts traded",
    range52wLabel: "52-week range — COMEX futures",
    updatedLine: "Updated {time} UTC · delayed",
    basisTitle: "The futures price vs the world spot price",
    basisStamps: "Futures updated {time} UTC · spot as of {date} — the store syncs once per UTC day",
    basisWhy:
      "Futures usually sit a little above spot: until delivery day, the buyer carries the metal's storage and financing costs.",
    basisUnavailable: "The basis needs both prices — one leg has not arrived.",
    termTitle: "The delivery calendar — the next contracts",
    termHeadDelivery: "Delivery",
    termHeadPrice: "Price",
    termHeadVsFront: "vs front",
    termNone: "The further delivery dates could not be read right now.",
    verdictContango: "Curve: contango — later delivery costs a bit more (the usual carry)",
    verdictFlat: "Curve: flat — later delivery costs about the same",
    verdictBackwardation: "Curve: backwardation — later delivery costs less; often a sign of tight physical demand",
    globexLabel: "Globex session",
    globexOpen: "open",
    globexClosed: "closed",
    globexNote: "Computed from the New York clock (Sun 18:00 → Fri 17:00 ET, daily 17:00–18:00 halt).",
    learnSummary: "What is a futures contract? — in plain words",
    learnItems: [
      "A futures contract is a firm promise: this price, this much gold, delivered on this future date.",
      "Why «paper gold»: most buyers sell the promise back before delivery day — the promise changes hands like paper, and the metal never moves.",
      "The front month — the nearest delivery date — is the market's own headline: the easiest contract to trade, so the one everyone quotes.",
      "Who trades this same market, and which way they lean, is tracked weekly in the positions section.",
    ],
    learnLink: "See the positions",
    sourceLine: "Source: Yahoo Finance public API · delayed · updated {time} UTC",
    loadingLine: "…",
    unavailableLine: "The futures quote could not be read right now — nothing is shown rather than a guess.",
  },
  fa: {
    title: "طلای کاغذی: بازار آتی",
    subtitle:
      "قیمتی که همه‌جا نقل می‌شود معمولاً قیمتِ قراردادِ جلوی همین بازار است — قولی محکم برای تحویل طلا در تاریخ مشخص. این هم قیمتِ خودِ همان قول است، با تأخیر.",
    frontEyebrow: "قرارداد جلو — همان که همه نقل می‌کنند",
    priceLabel: "قیمت هر اونس",
    dayRangeLabel: "دامنهٔ امروز",
    volumeLabel: "قرارداد معامله‌شده",
    range52wLabel: "دامنهٔ ۵۲ هفته — فیوچرز کامکس",
    updatedLine: "به‌روزرسانی {time} UTC · با تأخیر",
    basisTitle: "قیمت فیوچرز در برابر قیمت جهانی (اسپات)",
    basisStamps: "فیوچرز به‌روزرسانی {time} UTC · اسپات مهر {date} — فروشگاهِ داده روزی یک‌بار همگام می‌شود",
    basisWhy:
      "فیوچرز معمولاً کمی بالاتر از قیمت لحظه‌ای می‌نشیند: تا روز تحویل، هزینهٔ نگهداری و تأمین مالیِ فلز بر دوش خریدار است.",
    basisUnavailable: "برای این اختلاف هر دو قیمت لازم است — یک ساقه هنوز نرسیده است.",
    termTitle: "تقویم تحویل — قراردادهای بعدی",
    termHeadDelivery: "تحویل",
    termHeadPrice: "قیمت",
    termHeadVsFront: "اختلاف با جلو",
    termNone: "تاریخ‌های تحویلِ دورتر در حال حاضر خوانده نشدند.",
    verdictContango: "شیب منحنی: کانتانگو — تحویلِ دیرتر کمی گران‌تر است (حالت معمول)",
    verdictFlat: "شیب منحنی: صاف — تحویلِ دیرتر تقریباً هم‌قیمت است",
    verdictBackwardation: "شیب منحنی: بکواردیشن — تحویلِ دیرتر ارزان‌تر است؛ اغلب نشانهٔ تقاضای فیزیکیِ تنگ",
    globexLabel: "جلسهٔ گلوبکس",
    globexOpen: "باز",
    globexClosed: "بسته",
    globexNote: "بر پایهٔ ساعت نیویورک (یکشنبه ۱۸:۰۰ تا جمعه ۱۷:۰۰ به وقت شرق آمریکا، با توقف روزانهٔ ۱۷:۰۰ تا ۱۸:۰۰).",
    learnSummary: "قرارداد آتی چیست؟ — به زبان ساده",
    learnItems: [
      "قرارداد آتی یک قول محکم است: این قیمت، این مقدار طلا، تحویل در این تاریخِ آینده.",
      "چرا «طلای کاغذی»: بیشتر خریداران پیش از روز تحویل، قول را می‌فروشند — قول مثل کاغذ دست‌به‌دست می‌شود و فلز جابه‌جا نمی‌شود.",
      "قرارداد جلو — نزدیک‌ترین تاریخ تحویل — تیتر خودِ بازار است: راحت‌ترین قرارداد برای معامله، پس همان که همه نقل می‌کنند.",
      "این که چه کسانی در همین بازار معامله می‌کنند و به کدام سمت متمایل‌اند، هر هفته در بخش پوزیشن دنبال می‌شود.",
    ],
    learnLink: "دیدن پوزیشن‌ها",
    sourceLine: "منبع: یاهو فایننس (رابط عمومی) · با تأخیر · به‌روزرسانی {time} UTC",
    loadingLine: "…",
    unavailableLine: "نرخ فیوچرز در حال حاضر خوانده نشد — به‌جای حدس، هیچ‌چیز نشان داده نمی‌شود.",
  },
} as const;

/* ------------------------------------------------------------------ *
 * The Globex session — deterministic, from the New York clock
 * ------------------------------------------------------------------ */

interface GlobexState {
  open: boolean;
  nyTime: string;
}

/** Sun 18:00 ET → Fri 17:00 ET, daily 17:00–18:00 ET halt. */
function globexNow(): GlobexState {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday");
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const minutes = (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
  const HALT_START = 17 * 60;
  const OPEN_SUNDAY = 18 * 60;
  let open: boolean;
  if (weekday === "Sat") open = false;
  else if (weekday === "Sun") open = minutes >= OPEN_SUNDAY;
  else if (weekday === "Fri") open = minutes < HALT_START;
  else open = !(minutes >= HALT_START && minutes < OPEN_SUNDAY);
  const nyTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { open, nyTime };
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
 * The band
 * ------------------------------------------------------------------ */

export function FuturesBand({
  data,
  locale,
  fmt,
}: {
  data: FuturesHeroData;
  locale: Locale;
  fmt: Fmt;
}) {
  const t = T[locale];
  const q = useQuery({
    queryKey: ["currena-gold-futures"],
    queryFn: fetchFutures,
    staleTime: 90 * 1000,
    retry: 1,
  });
  const front = q.data?.front ?? null;
  const term = q.data?.term ?? [];

  /* the Globex session — computed after mount (the reader's own clock,
     refreshed every 30 s; never a data source) */
  const [globex, setGlobex] = React.useState<GlobexState | null>(null);
  React.useEffect(() => {
    setGlobex(globexNow());
    const id = setInterval(() => setGlobex(globexNow()), 30_000);
    return () => clearInterval(id);
  }, []);

  /* the basis — the front price against the hero store spot, both
     stamps visible; null when either leg is absent */
  const basis = React.useMemo(() => {
    if (front === null || front.price === null || !Number.isFinite(data.gold.spot) || data.gold.spot <= 0) return null;
    const usd = front.price - data.gold.spot;
    const pct = (front.price / data.gold.spot - 1) * 100;
    return { usd, pct };
  }, [front, data.gold.spot]);

  /* the curve's verdict — the far delivery against the front: a little
     higher is the usual carry (contango), about level is flat, lower is
     unusual (backwardation); needs both legs */
  const verdict = React.useMemo<"contango" | "flat" | "backwardation" | null>(() => {
    if (front === null || front.price === null || term.length === 0) return null;
    const last = term[term.length - 1]!;
    if (last.vsFrontUsd === null || !Number.isFinite(last.vsFrontUsd)) return null;
    const pct = (last.vsFrontUsd / front.price) * 100;
    if (pct > 0.1) return "contango";
    if (pct < -0.1) return "backwardation";
    return "flat";
  }, [front, term]);

  const marketHm = utcHm(front?.marketTime ?? null);
  const fetchedHm = utcHm(q.data?.fetchedAt ?? null);

  const usdCell = (v: number, digits = 1): React.ReactNode => (
    <bdi dir="ltr" className="whitespace-nowrap tabular-nums">${fmt.num(v, digits)}</bdi>
  );

  return (
    <section
      id="gold-futures"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5"
      aria-label={t.title}
    >
      <h2 className="m-0 flex items-center gap-4 text-[1.25rem] font-extrabold leading-tight text-[var(--color-text-primary)]">
        <PackIcon file="gold-futures-paper-market.png" size={128} className="h-32 w-32" />
        {t.title}
      </h2>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {q.isLoading ? (
        <p className="m-0 mt-3 type-caption text-[var(--color-text-tertiary)]" aria-live="polite" data-futures-loading>
          {t.loadingLine}
        </p>
      ) : q.isError || q.data === undefined ? (
        <p className="m-0 mt-3 type-caption leading-relaxed text-[var(--color-text-tertiary)]" data-futures-unavailable>
          {t.unavailableLine}
        </p>
      ) : (
        <>
          {/* the front card + the basis row — one row of two on wide
              screens, stacked on phones */}
          <div className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
              {front !== null ? (
                <>
                  <p className="m-0 type-caption font-bold text-[var(--color-text-tertiary)]">{t.frontEyebrow}</p>
                  <p className="m-0 text-[1.05rem] font-extrabold text-[var(--color-text-primary)]">
                    <bdi>{front.contract}</bdi>
                  </p>
                  <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-[1.4rem] font-extrabold tabular-nums text-[var(--color-text-primary)]">
                      {front.price !== null ? usdCell(front.price, 1) : "·"}
                    </span>
                    <SignedDelta v={front.changePct} fmt={fmt} big />
                  </p>
                  <dl className="m-0 flex flex-col gap-1">
                    {front.dayLow !== null && front.dayHigh !== null ? (
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="type-caption text-[var(--color-text-tertiary)]">{t.dayRangeLabel}</dt>
                        <dd className="m-0 type-caption font-semibold text-[var(--color-text-primary)]">
                          <bdi dir="ltr" className="whitespace-nowrap tabular-nums">
                            {fmt.num(front.dayLow, 1)} – {fmt.num(front.dayHigh, 1)}
                          </bdi>
                        </dd>
                      </div>
                    ) : null}
                    {front.volume !== null ? (
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="type-caption text-[var(--color-text-tertiary)]">{t.volumeLabel}</dt>
                        <dd className="m-0 type-caption font-semibold tabular-nums text-[var(--color-text-primary)]">
                          <bdi dir="ltr" className="whitespace-nowrap">{fmt.num(front.volume, 0)}</bdi>
                        </dd>
                      </div>
                    ) : null}
                    {front.fiftyTwoWeekLow !== null && front.fiftyTwoWeekHigh !== null ? (
                      <div className="flex items-baseline justify-between gap-2">
                        <dt className="type-caption text-[var(--color-text-tertiary)]">{t.range52wLabel}</dt>
                        <dd className="m-0 type-caption font-semibold text-[var(--color-text-primary)]">
                          <bdi dir="ltr" className="whitespace-nowrap tabular-nums">
                            {fmt.num(front.fiftyTwoWeekLow, 0)} – {fmt.num(front.fiftyTwoWeekHigh, 0)}
                          </bdi>
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                  <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
                    {t.updatedLine.replace("{time}", marketHm !== null ? (locale === "fa" ? faDigits(marketHm) : marketHm) : "·")}
                  </p>
                </>
              ) : (
                <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.unavailableLine}</p>
              )}
            </div>

            {/* the basis row — BOTH stamps, the one-line why */}
            <div className="flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
              <p className="m-0 type-label font-bold text-[var(--color-text-primary)]">{t.basisTitle}</p>
              {basis !== null ? (
                <>
                  <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <bdi dir="ltr" className="whitespace-nowrap text-[1.15rem] font-extrabold tabular-nums text-[var(--color-text-primary)]">
                      {basis.usd >= 0 ? "+" : "−"}${fmt.num(Math.abs(basis.usd), 1)}
                    </bdi>
                    <bdi dir="ltr" className="whitespace-nowrap type-caption font-bold tabular-nums text-[var(--color-text-secondary)]">
                      ({basis.pct >= 0 ? "+" : "−"}{fmt.num(Math.abs(basis.pct), 1)}%)
                    </bdi>
                  </p>
                  <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
                    {t.basisStamps
                      .replace("{time}", marketHm !== null ? (locale === "fa" ? faDigits(marketHm) : marketHm) : "·")
                      .replace("{date}", fmt.dateWords(data.gold.asOf))}
                  </p>
                </>
              ) : (
                <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.basisUnavailable}</p>
              )}
              <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.basisWhy}</p>
            </div>
          </div>

          {/* the delivery calendar + the curve's verdict chip */}
          <h3 className="m-0 mt-4 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{t.termTitle}</h3>
          {term.length > 0 ? (
            <>
              {verdict !== null ? (
                <p className="m-0 mt-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 type-caption font-bold"
                    style={{
                      backgroundColor:
                        verdict === "contango"
                          ? "color-mix(in srgb, var(--color-accent-gold) 14%, transparent)"
                          : verdict === "backwardation"
                            ? "color-mix(in srgb, var(--color-status-alert) 12%, transparent)"
                            : "color-mix(in srgb, var(--color-text-secondary) 10%, transparent)",
                      color:
                        verdict === "contango"
                          ? "var(--color-accent-gold-deep)"
                          : verdict === "backwardation"
                            ? "var(--color-chip-ink-attention)"
                            : "var(--color-text-secondary)",
                      boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${
                        verdict === "contango"
                          ? "var(--color-accent-gold)"
                          : verdict === "backwardation"
                            ? "var(--color-status-alert)"
                            : "var(--color-text-secondary)"
                      } 40%, transparent)`,
                    }}
                  >
                    {verdict === "contango" ? t.verdictContango : verdict === "backwardation" ? t.verdictBackwardation : t.verdictFlat}
                  </span>
                </p>
              ) : null}
              <div className="mt-2 min-w-0 overflow-x-auto rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
                <table className="m-0 w-full border-collapse bg-[var(--color-currena-bg-light)] type-caption" aria-label={t.termTitle}>
                  <thead>
                    <tr className="text-[var(--color-text-tertiary)]">
                      <th scope="col" className="px-3 py-2 text-start font-bold">{t.termHeadDelivery}</th>
                      <th scope="col" className="px-3 py-2 text-end font-bold">{t.termHeadPrice}</th>
                      <th scope="col" className="px-3 py-2 text-end font-bold">{t.termHeadVsFront}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {term.map((row) => (
                      <tr key={row.symbol} className="border-t border-[var(--color-border)]">
                        <th scope="row" className="px-3 py-2 text-start font-bold text-[var(--color-text-primary)]">
                          <bdi>
                            {locale === "fa"
                              ? `${MONTHS_FA[row.month - 1] ?? row.monthLabel} ${faDigits(String(row.year))}`
                              : row.monthLabel}
                          </bdi>
                        </th>
                        <td className="px-3 py-2 text-end font-semibold tabular-nums text-[var(--color-text-primary)]">{usdCell(row.price, 1)}</td>
                        <td className="px-3 py-2 text-end tabular-nums text-[var(--color-text-secondary)]">
                          {row.vsFrontUsd !== null ? (
                            <bdi dir="ltr" className="whitespace-nowrap">
                              {row.vsFrontUsd >= 0 ? "+" : "−"}${fmt.num(Math.abs(row.vsFrontUsd), 1)}
                            </bdi>
                          ) : (
                            "·"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="m-0 mt-2 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.termNone}</p>
          )}

          {/* the Globex session chip — deterministic, the reader's clock */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-currena-bg-light)] px-3 py-1 type-caption font-bold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${globex === null ? "bg-[var(--color-text-tertiary)]" : globex.open ? "bg-[var(--color-return-up)]" : "bg-[var(--color-text-tertiary)]"}`}
                aria-hidden="true"
              />
              {t.globexLabel}: {globex === null ? "·" : globex.open ? t.globexOpen : t.globexClosed}
            </span>
            <span className="type-caption text-[var(--color-text-tertiary)]">
              {t.globexNote}
              {globex !== null ? ` (New York ${locale === "fa" ? faDigits(globex.nyTime) : globex.nyTime})` : ""}
            </span>
          </div>

          {/* the plain-words collapsible — the house's native <details> */}
          <details className="mt-3 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
            <summary className="cursor-pointer type-caption font-bold text-[var(--color-text-primary)]">{t.learnSummary}</summary>
            <div className="mt-2 flex flex-col gap-1.5">
              {t.learnItems.map((item, i) => (
                <p key={i} className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
                  {item}
                </p>
              ))}
              <a
                href="#gold-positions"
                className="inline-flex min-h-[32px] w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-currena-blue)]/60 transition-transform hover:scale-[1.02] active:scale-95"
              >
                {t.learnLink}
                <span aria-hidden="true" className="rtl:rotate-180">→</span>
              </a>
            </div>
          </details>

          {/* the sources line */}
          <p className="m-0 mt-3 border-t border-[var(--color-border)] pt-2.5 type-caption text-[var(--color-text-tertiary)]">
            {t.sourceLine.replace("{time}", fetchedHm !== null ? (locale === "fa" ? faDigits(fetchedHm) : fetchedHm) : "·")}
          </p>
        </>
      )}
    </section>
  );
}
