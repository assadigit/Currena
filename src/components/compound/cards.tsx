"use client";

/**
 * Compound Wealth — the two cards (spec §8), both behind the single
 * "Save as card" button, both generated entirely in the browser.
 *
 * The A4 card is a dedicated print view that window.print() turns into
 * exactly one A4 portrait page (no JavaScript PDF library — they break
 * Persian letter shapes and RTL). The phone card is a full-screen
 * portrait view meant to be screenshotted as a lock screen: the top 28%
 * and bottom 12% stay free of text, dark by default with a light option.
 */

import * as React from "react";
import * as ReactDOM from "react-dom";
import type { CompoundCopy, Locale } from "@/lib/compound/content";
import type { AssetRow } from "@/lib/compound/figures";
import { MILESTONES_ON_CARDS, formatMoney, type CompoundResult, type PlanInput } from "@/lib/compound/maths";
import { GrowthChart } from "@/components/compound/chart";
import { CurrenaMark } from "@/components/compound/chrome";

/* =================================================================== *
 * Shared bits                                                         *
 * =================================================================== */

function isoOfMonth(startYm: string, m: number): string {
  const [y, mo] = startYm.split("-").map(Number);
  const total = y * 12 + (mo - 1) + (m - 1);
  return `${String(Math.floor(total / 12)).padStart(4, "0")}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function monthYearLabel(ym: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR-u-ca-persian" : "en-US", {
      year: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(`${ym}-01T00:00:00Z`));
  } catch {
    return ym;
  }
}

function roundMoney(v: number): number {
  const a = Math.abs(v);
  if (a >= 1_000_000) return Math.round(v / 10_000) * 10_000;
  if (a >= 100_000) return Math.round(v / 1_000) * 1_000;
  if (a >= 10_000) return Math.round(v / 100) * 100;
  if (a >= 1_000) return Math.round(v / 10) * 10;
  return Math.round(v);
}

/** The quiet growth-rings motif (the card's corner decoration). */
export function GrowthRings({ className, ink = "#a87e1c" }: { className?: string; ink?: string }) {
  const rings = [8, 14, 20, 26, 32, 38];
  return (
    <svg viewBox="0 0 90 90" className={className} aria-hidden="true">
      {rings.map((r, i) => (
        <circle
          key={r}
          cx="78"
          cy="78"
          r={r}
          fill="none"
          stroke={ink}
          strokeWidth={i === rings.length - 1 ? 1.4 : 0.9}
          opacity={0.16 + i * 0.07}
        />
      ))}
      <circle cx="78" cy="78" r="3" fill={ink} opacity={0.85} />
    </svg>
  );
}

interface CardProps {
  copy: CompoundCopy;
  locale: Locale;
  result: CompoundResult;
  plan: PlanInput;
  asset: AssetRow;
  months: number;
  startMonth: string;
  onClose: () => void;
}

/* =================================================================== *
 * The A4 print card                                                   *
 * =================================================================== */

export function A4PrintCard({ copy, locale, result, plan, asset, months, startMonth, onClose }: CardProps) {
  const t = copy.tool.print;
  const tool = copy.tool;
  const [style, setStyle] = React.useState<"light" | "dark">("light");
  const [printed, setPrinted] = React.useState(false);
  const years = Math.round((months / 12) * 10) / 10;

  const doPrint = () => {
    const prevTitle = document.title;
    const date = new Date().toISOString().slice(0, 10);
    document.title = `Currena-Compound-Wealth-${date}`;
    document.body.classList.add("cw-printing");
    setPrinted(true);
    const cleanup = () => {
      document.body.classList.remove("cw-printing");
      document.title = prevTitle;
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    try {
      window.print();
    } catch {
      cleanup();
    }
    // Some browsers never fire afterprint (Safari's silent path).
    window.setTimeout(() => {
      if (document.body.classList.contains("cw-printing")) cleanup();
    }, 60_000);
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const fmt = (v: number) => formatMoney(roundMoney(v), locale);
  const pct = (v: number) => `${formatMoney(v * 100, locale, 1)}${locale === "fa" ? "٪" : "%"}`;

  const baselineWords =
    plan.rateMode === "custom-rate"
      ? locale === "fa" ? "نرخ دلخواه شما" : "your custom rate"
      : plan.rateMode === "custom-range"
        ? locale === "fa" ? "میانهٔ بازهٔ دلخواه شما" : "the middle of your custom range"
        : locale === "fa" ? "اعداد کمترِ ۲۰ و ۳۰ سال" : "the lower of the 20- and 30-year figures";

  const planSummary = t.planSummary
    .replace("{amount}", fmt(plan.useShare && plan.salary ? plan.salary * plan.share : plan.monthly))
    .replace("{years}", formatMoney(years, locale, years % 1 === 0 ? 0 : 1))
    .replace("{asset}", locale === "fa" ? asset.labelFa : asset.labelEn)
    .replace("{rate}", pct(result.baselineRate))
    .replace("{baseline}", baselineWords);

  const milestones = result.milestones.slice(-MILESTONES_ON_CARDS);
  const today = new Date();
  const dateLabel = monthYearLabel(
    `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`,
    locale,
  );

  /* The overlay mounts as a direct child of <body> (a portal), so the
     print CSS can hide everything else exactly like the digest sheet. */
  return ReactDOM.createPortal(
    <div
      className="cw-print-overlay fixed inset-0 z-50 overflow-y-auto bg-[rgba(15,23,42,0.55)] backdrop-blur-sm"
      dir={copy.dir}
      lang={locale}
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      data-cw="print-overlay"
    >
      {/* The toolbar (screen only, never printed) */}
      <div className="cw-print-toolbar sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/15 bg-[var(--color-currena-dark)] px-4 py-2.5">
        <span className="text-[13px] font-semibold text-white">{t.hint}</span>
        <span className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-white/10 p-1">
            <button
              type="button"
              onClick={() => setStyle("light")}
              aria-pressed={style === "light"}
              className={`min-h-[32px] rounded-full px-3 text-[12px] font-bold ${style === "light" ? "bg-white text-[#10151d]" : "text-white/80"}`}
            >
              {t.light}
            </button>
            <button
              type="button"
              onClick={() => setStyle("dark")}
              aria-pressed={style === "dark"}
              className={`min-h-[32px] rounded-full px-3 text-[12px] font-bold ${style === "dark" ? "bg-white text-[#10151d]" : "text-white/80"}`}
            >
              {t.dark}
            </button>
          </span>
          <button
            type="button"
            onClick={doPrint}
            data-cw="print-button"
            className="min-h-[38px] rounded-xl bg-[var(--color-accent-gold)] px-4 text-[13px] font-extrabold text-[#2a1f04]"
          >
            {t.printOrPdf}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="min-h-[38px] min-w-[38px] rounded-xl bg-white/10 text-[13px] font-bold text-white"
          >
            ✕
          </button>
        </span>
      </div>

      <div className="flex justify-center px-2 py-6">
        {/* The sheet — exactly one A4 portrait page. The dark style is an
            ink-heavy option; light is the default and always ink-friendly. */}
        <div
          className="cw-print-sheet"
          data-cw="print-sheet"
          data-style={style}
          dir={copy.dir}
          lang={locale}
        >
          <GrowthRings className="cw-rings pointer-events-none absolute end-0 top-0" ink={style === "dark" ? "#d9a43e" : "#a87e1c"} />

          {/* Header */}
          <div className="cw-sheet-header">
            <div className="flex items-center gap-2.5">
              <CurrenaMark className="h-8 w-8" />
              <div className="flex flex-col leading-none">
                <span className="text-[15pt] font-extrabold tracking-tight" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{copy.nav.site}</span>
                <span className="mt-0.5 text-[7.5pt] font-semibold" style={{ color: style === "dark" ? "#d9a43e" : "#a87e1c" }}>{copy.nav.tagline}</span>
              </div>
            </div>
            <div className="text-end">
              <div className="text-[16pt] font-extrabold leading-tight" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{t.title}</div>
              <div className="text-[8pt]" style={{ color: "currentColor", opacity: 0.75 }}>{copy.tool.promise}</div>
            </div>
          </div>

          {/* The big number */}
          <div className="cw-sheet-hero">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1" dir="ltr">
              <span className="text-[30pt] font-extrabold leading-none tracking-tight" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
                {fmt(result.finalValue)}
              </span>
              <span className="text-[10.5pt] font-semibold" style={{ opacity: 0.75 }}>
                {copy.tool.tiles.todaysMoney}: {fmt(result.finalValueToday)}
              </span>
            </div>
            <div className="mt-1.5 text-[9.5pt]" style={{ opacity: 0.85 }}>{planSummary}</div>
          </div>

          {/* The chart */}
          <div className="cw-sheet-chart">
            <GrowthChart
              series={result.series}
              lowSeries={result.lowSeries}
              highSeries={result.highSeries}
              others={[]}
              milestones={milestones}
              crossoverMonth={result.crossoverMonth}
              locale={locale}
              variant="print"
              startYm={startMonth}
              labels={{
                putIn: copy.tool.chart.putInLabel,
                growth: copy.tool.chart.growthLabel,
                bandLow: copy.tool.chart.bandLowLabel,
                bandHigh: copy.tool.chart.bandHighLabel,
                crossover:
                  result.crossoverMonth !== null
                    ? `${copy.tool.chart.crossoverShort} ${monthYearLabel(isoOfMonth(startMonth, result.crossoverMonth), locale)}`
                    : copy.tool.chart.crossoverNever,
              }}
              fmtValue={(v) => formatMoney(v, locale)}
            />
          </div>

          {/* Tiles + milestones */}
          <div className="cw-sheet-columns">
            <div className="cw-sheet-tiles">
              <div className="cw-tile">
                <div className="cw-tile-label">{copy.tool.tiles.youPutIn}</div>
                <div className="cw-tile-value">{fmt(result.totalPutIn)}</div>
              </div>
              <div className="cw-tile">
                <div className="cw-tile-label">{copy.tool.tiles.growthAdded}</div>
                <div className="cw-tile-value" style={{ color: style === "dark" ? "#d9a43e" : "#a87e1c" }}>{fmt(result.growth)}</div>
              </div>
              <div className="cw-tile">
                <div className="cw-tile-label">{copy.tool.tiles.youCouldHave}</div>
                <div className="cw-tile-value">{fmt(result.finalValue)}</div>
              </div>
            </div>
            <div className="cw-sheet-milestones">
              <div className="cw-sheet-h2">{t.milestonesTitle}</div>
              <ul className="m-0 list-none space-y-1 p-0 text-[9pt]">
                {milestones.map((ms) => (
                  <li key={ms.threshold} className="flex items-baseline gap-1.5">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: style === "dark" ? "#d9a43e" : "#a87e1c" }} />
                    <span>
                      {copy.tool.milestones.line
                        .replace("{amount}", formatMoney(ms.threshold, locale))
                        .replace("{date}", monthYearLabel(isoOfMonth(startMonth, ms.month), locale))}
                      {plan.age !== null
                        ? ` ${copy.tool.milestones.atAge.replace("{n}", formatMoney(plan.age + Math.floor((ms.month - 1) / 12), locale))}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
              {result.feesShareOfPutIn !== null ? (
                <p className="mt-2 mb-0 text-[8.5pt]" style={{ opacity: 0.8 }}>
                  {copy.tool.whatIf.costs
                    .replace("{x}", fmt(result.feesPaid))
                    .replace("{pct}", pct(result.feesShareOfPutIn))}
                </p>
              ) : null}
            </div>
          </div>

          {/* Assumptions */}
          <div className="cw-sheet-assumptions">
            <div className="cw-sheet-h2">{t.assumptionsTitle}</div>
            <ul className="m-0 list-none space-y-0.5 p-0 text-[8.5pt]" style={{ opacity: 0.9 }}>
              {t.assumptions.map((line, i) => (
                <li key={i}>
                  {line
                    .replace("{rate}", pct(result.baselineRate))
                    .replace("{baseline}", baselineWords)
                    .replace("{sources}", asset.sourceName)
                    .replace("{cost}", `${pct(plan.yearlyCost)}${plan.yearlyCost === 0.002 ? "" : ""}`)
                    .replace("{fee}", `${formatMoney(plan.feePerPurchase, locale, 2)}`)
                    .replace("{inflation}", pct(plan.inflation))}
                </li>
              ))}
              <li>{copy.tool.how.overlapNote}</li>
              <li>{copy.tool.how.taxNote}</li>
            </ul>
          </div>

          {/* The strong sentence */}
          <div className="cw-sheet-strong">{copy.tool.strongSentence}</div>

          {/* Footer */}
          <div className="cw-sheet-footer">
            <span>{t.url}</span>
            <span>{t.generatedOn.replace("{date}", dateLabel)}</span>
            <span>{copy.tool.footer.madeInBrowser}</span>
            <span className="cw-sheet-disclaimer">{copy.tool.disclaimer}</span>
          </div>
        </div>
      </div>

      {/* The print fallback message for blocked printing. */}
      <p className="cw-print-fallback hidden text-center text-[12px] text-white/70" data-cw="print-fallback">
        {t.fallback}
      </p>
    </div>,
    document.body,
  );
}

/* =================================================================== *
 * The phone card                                                      *
 * =================================================================== */

export function PhoneCard({ copy, locale, result, plan, asset, months, startMonth, onClose }: CardProps) {
  const t = copy.tool.phone;
  const [style, setStyle] = React.useState<"dark" | "light">("dark");
  /* The corner controls and the hint fade away after a quiet moment,
     so the screenshot the owner takes shows only the card (the lock-
     screen safe zones stay clean). Any tap or key brings them back. */
  const [chromeVisible, setChromeVisible] = React.useState(true);
  React.useEffect(() => {
    const timer = window.setTimeout(() => setChromeVisible(false), 4000);
    const wake = () => {
      setChromeVisible(true);
      window.clearTimeout(timer);
      window.setTimeout(() => setChromeVisible(false), 4000);
    };
    window.addEventListener("pointerdown", wake);
    window.addEventListener("pointermove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);
  const years = Math.round((months / 12) * 10) / 10;
  const fmt = (v: number) => formatMoney(roundMoney(v), locale);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const milestones = result.milestones;
  const nextMilestone = milestones.length > 0 ? milestones[0] : null;
  const nextDate = nextMilestone ? monthYearLabel(isoOfMonth(startMonth, nextMilestone.month), locale) : null;

  const dark = style === "dark";
  const ink = dark ? "#f4f6f9" : "#1c2530";
  const muted = dark ? "rgba(244,246,249,0.72)" : "rgba(28,37,48,0.68)";
  const accent = dark ? "#e8b54a" : "#a87e1c";
  const bg = dark
    ? "linear-gradient(175deg, #131a24 0%, #10151d 45%, #17130a 100%)"
    : "linear-gradient(175deg, #fbfaf7 0%, #f4f0e6 60%, #efe6d2 100%)";

  const planLine = t.planLine
    .replace("{amount}", fmt(plan.useShare && plan.salary ? plan.salary * plan.share : plan.monthly))
    .replace("{years}", formatMoney(years, locale, years % 1 === 0 ? 0 : 1));

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      dir={copy.dir}
      lang={locale}
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      data-cw="phone-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* The phone frame: full-screen on phones; a centred 9:19.5 frame on desktop. */}
      <div
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden sm:aspect-[9/19.5] sm:h-[min(92dvh,780px)] sm:w-auto sm:rounded-[2.2rem] sm:ring-8 sm:ring-black/40"
        style={{ background: bg }}
        data-cw="phone-card"
      >
        {/* Top safe zone: quiet decoration only (28%). */}
        <div className="relative h-[28%] min-h-[120px] w-full" aria-hidden="true">
          <GrowthRings className="absolute end-4 top-8 h-28 w-28 opacity-80" ink={accent} />
        </div>

        {/* The content band. */}
        <div className="relative flex flex-1 flex-col items-center justify-center gap-5 px-7 text-center">
          <div>
            <div className="text-[11px] font-bold tracking-wide" style={{ color: muted }}>
              {t.title}
            </div>
            <div className="mt-1.5 text-[clamp(2.6rem,13vw,4.2rem)] font-extrabold leading-none tracking-tight tabular-nums" style={{ color: ink, fontFamily: "var(--font-poppins), sans-serif" }} dir="ltr">
              {fmt(result.finalValue)}
            </div>
            <div className="mt-1.5 text-[13px] font-semibold" style={{ color: muted }}>
              {copy.tool.tiles.todaysMoney}: <span dir="ltr">{fmt(result.finalValueToday)}</span>
            </div>
            <div className="mt-2 text-[12.5px] font-bold" style={{ color: accent }}>
              {planLine}
            </div>
          </div>

          <div className="w-full max-w-[300px]">
            <GrowthChart
              series={result.series}
              lowSeries={null}
              highSeries={null}
              others={[]}
              milestones={[]}
              crossoverMonth={null}
              locale={locale}
              variant="spark"
              summary={copy.tool.chart.title}
            />
          </div>

          {nextMilestone && nextDate ? (
            <div className="rounded-full px-4 py-1.5 text-[12.5px] font-bold" style={{ color: ink, background: dark ? "rgba(232,181,74,0.14)" : "rgba(168,126,28,0.12)" }}>
              {t.next
                .replace("{amount}", formatMoney(nextMilestone.threshold, locale))
                .replace("{date}", nextDate)}
            </div>
          ) : null}

          <div className="max-w-[300px] text-[15px] font-extrabold leading-snug" style={{ color: ink }}>
            {copy.tool.strongSentence}
          </div>
        </div>

        {/* Bottom safe zone (12%): the tiny footer rides its very bottom edge. */}
        <div className="relative h-[12%] min-h-[64px] w-full">
          <div className="absolute inset-x-0 bottom-[max(10px,env(safe-area-inset-bottom))] flex flex-col items-center gap-0.5">
            <span className="text-[10.5px]" style={{ color: muted }}>{t.footer}</span>
            <span
              className="text-[10px] transition-opacity duration-700"
              style={{ color: muted, opacity: chromeVisible ? 0.75 : 0 }}
            >
              {t.hint}
            </span>
          </div>
        </div>

        {/* The controls float outside the safe zones, at the frame's edge,
            and fade away for the screenshot. */}
        <div
          className="absolute start-3 top-3 flex items-center gap-1.5 transition-opacity duration-700"
          style={{ opacity: chromeVisible ? 1 : 0 }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            data-cw="phone-close"
            tabIndex={chromeVisible ? 0 : -1}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold"
            style={{ color: ink, background: dark ? "rgba(244,246,249,0.1)" : "rgba(28,37,48,0.08)" }}
          >
            ✕
          </button>
        </div>
        <div
          className="absolute end-3 top-3 flex items-center gap-1 rounded-full p-1 transition-opacity duration-700"
          style={{ background: dark ? "rgba(244,246,249,0.1)" : "rgba(28,37,48,0.08)", opacity: chromeVisible ? 1 : 0 }}
        >
          <button
            type="button"
            onClick={() => setStyle("dark")}
            aria-pressed={style === "dark"}
            aria-label={t.dark}
            tabIndex={chromeVisible ? 0 : -1}
            className="min-h-[28px] rounded-full px-3 text-[11px] font-bold"
            style={{ color: style === "dark" ? "#10151d" : ink, background: style === "dark" ? accent : "transparent" }}
          >
            {t.dark}
          </button>
          <button
            type="button"
            onClick={() => setStyle("light")}
            aria-pressed={style === "light"}
            aria-label={t.light}
            tabIndex={chromeVisible ? 0 : -1}
            className="min-h-[28px] rounded-full px-3 text-[11px] font-bold"
            style={{ color: style === "light" ? "#10151d" : ink, background: style === "light" ? accent : "transparent" }}
          >
            {t.light}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
