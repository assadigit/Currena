"use client";

/**
 * IfBoughtBand — the "if you'd bought" calculator, the section the
 * previous gold page carried (upstream GoldIfBought, GPE R33 / F26),
 * restored onto the visualized page: gold vs S&P 500 vs Bitcoin vs
 * silver since the year the reader picks — the LUMP multiple + the
 * MONTHLY DCA ($100 at each month-end close, the SA convention) + the
 * DECILE framing where the history supports it. EVERY WINDOW NAMED AT
 * POINT OF USE (the from → to months ride every result row). The
 * compute is the pure engine ported verbatim (src/lib/gold-page/
 * ifbought.ts); the data is ONE fetch (GET /api/gold/ifbought — the
 * still-live currena-api leg, server-side, memory-cached, fail-closed).
 *
 * The section stays ALIVE even when its leg does not arrive: the header
 * + the honest waiting line render regardless — the section is never
 * silently dropped (the owner's audit rule for this band). Past
 * returns are no guarantee of future results — the disclaimer renders
 * on the card; nothing here is advice.
 */

import * as React from "react";
import { PiggyBank } from "lucide-react";
import {
  IF_BOUGHT_DCA_MONTHLY,
  ifBoughtResult,
  yearOptions,
  type IfBoughtAssetSeries,
  type IfBoughtSnapshot,
} from "@/lib/gold-page/ifbought";
import { type Fmt } from "@/components/gold-page/visuals";
import type { Locale } from "@/lib/gold-page/content";

type AnyT = { [key: string]: any };

/** The four assets in the R33 row's own order. */
const ASSET_ORDER: ReadonlyArray<keyof IfBoughtSnapshot["assets"]> = ["gold", "sp500", "btc", "silver"];

/** A year, UNGROUPED (2026, never "2,026") — the locale digits still apply. */
function yearText(y: number, locale: Locale): string {
  try {
    return y.toLocaleString(locale === "fa" ? "fa-IR" : "en-US", { useGrouping: false });
  } catch {
    return String(y);
  }
}

/** A month-end's own label — "Jan 2017" / "۱/۲۰۱۷" (m/y, the fa convention). */
function monthText(ym: string, locale: Locale, fmt: Fmt): string {
  const [y, m] = ym.split("-");
  if (locale === "fa") return `${fmt.num(Number(m), 0)}/${yearText(Number(y), locale)}`;
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[Number(m) - 1] ?? m} ${y}`;
}

/** One asset's row — the result (window named at point of use) or the honest no-window line. */
function AssetRow({
  name,
  result,
  t,
  fmt,
  locale,
  maxAbs,
}: {
  name: string;
  result: ReturnType<typeof ifBoughtResult>;
  t: AnyT;
  fmt: Fmt;
  locale: Locale;
  maxAbs: number;
}) {
  const money = (v: number): string => (locale === "fa" ? `${fmt.num(v, 0)} دلار` : `$${fmt.num(v, 0)}`);
  if (result === null) {
    return (
      <li className="flex flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-3 py-2.5 ring-1 ring-[var(--color-border)]/50">
        <span className="type-label font-bold text-[var(--color-text-primary)]">{name}</span>
        <span className="type-caption text-[var(--color-text-tertiary)]">{t.noWindow}</span>
      </li>
    );
  }
  const up = result.lumpPct >= 0;
  const barW = maxAbs > 0 ? Math.min(100, (Math.abs(result.lumpPct) / maxAbs) * 100) : 0;
  return (
    <li className="flex flex-col gap-1 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-3 py-2.5 ring-1 ring-[var(--color-border)]/50">
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="type-label font-bold text-[var(--color-text-primary)]">{name}</span>
        <bdi dir="ltr" className={`type-label font-extrabold tabular-nums ${up ? "text-[var(--color-return-up)]" : "text-[var(--color-return-down)]"}`}>
          {fmt.pct(result.lumpPct, 1)}
        </bdi>
      </div>
      {/* the lump bar — the same number, one glance wide */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]/30" aria-hidden="true">
        <div
          className={`h-full rounded-full ${up ? "bg-[var(--color-return-up)]/55" : "bg-[var(--color-return-down)]/55"}`}
          style={{ width: `${barW}%` }}
        />
      </div>
      {/* the window, NAMED at point of use */}
      <bdi className="type-caption text-[var(--color-text-tertiary)]">
        {t.windowLine
          .replace("{from}", monthText(result.fromYm, locale, fmt))
          .replace("{to}", monthText(result.toYm, locale, fmt))
          .replace("{n}", fmt.num(result.months, 0))}
      </bdi>
      {/* the DCA line — the SA convention, marked at the running close */}
      <bdi dir="ltr" className="type-caption font-semibold tabular-nums text-[var(--color-text-secondary)]">
        {t.dcaLine
          .replace("{invested}", money(result.dcaInvested))
          .replace("{value}", money(result.dcaValue))
          .replace("{pct}", fmt.pct(result.dcaPct, 1))}
      </bdi>
      {/* the decile line — the honest waiting line under the min base */}
      <bdi className="type-caption leading-snug text-[var(--color-text-tertiary)]">
        {result.decile !== null
          ? t.decileLine.replace("{d}", fmt.num(result.decile, 0)).replace("{n}", fmt.num(result.decileBase, 0))
          : t.decileWaiting
              .replace("{min}", fmt.num(30, 0))
              .replace("{n}", fmt.num(result.decileBase, 0))}
      </bdi>
    </li>
  );
}

export function IfBoughtBand({
  data,
  t,
  fmt,
  locale,
}: {
  data: IfBoughtSnapshot | null;
  t: AnyT;
  fmt: Fmt;
  locale: Locale;
}) {
  const [since, setSince] = React.useState<number | null>(null);
  const years = React.useMemo(() => (data !== null ? yearOptions(data) : []), [data]);
  const effectiveSince = since ?? years[years.length - 2] ?? years[0] ?? null;

  const rows = React.useMemo(() => {
    if (data === null || effectiveSince === null) return [];
    return ASSET_ORDER.map((asset) => ({
      asset,
      result: ifBoughtResult(data.assets[asset] as IfBoughtAssetSeries, effectiveSince),
    }));
  }, [data, effectiveSince]);

  const maxAbs = Math.max(
    1,
    ...rows.map((r) => (r.result !== null ? Math.abs(r.result.lumpPct) : 0)),
  );

  return (
    <section
      id="gold-ifbought"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5"
      aria-label={t.title}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-currena-soft)] text-[var(--color-accent-gold-deep)]" aria-hidden="true">
          <PiggyBank className="h-4.5 w-4.5" />
        </span>
        <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
      </div>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {data === null ? (
        /* The section stays alive: the honest waiting line, never a silent drop. */
        <p className="m-0 mt-3 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-3 py-2.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">
          {t.waiting}
        </p>
      ) : (
        <>
          {/* the method line first — the DCA convention + the window naming rule */}
          <p className="m-0 mt-2.5 max-w-prose type-caption leading-relaxed text-[var(--color-text-tertiary)]">
            {t.method.replace("{amount}", fmt.num(IF_BOUGHT_DCA_MONTHLY, 0))}
          </p>

          {/* the year picker */}
          <label className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
            <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{t.pickLabel}</span>
            <select
              value={effectiveSince ?? undefined}
              onChange={(e) => setSince(Number(e.currentTarget.value))}
              className="min-h-[44px] cursor-pointer rounded-[var(--cr-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[length:var(--type-label)] font-bold tabular-nums text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)]"
              aria-label={t.pickLabel}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {yearText(y, locale)}
                  {y === years[0] ? ` (${t.firstYearNote})` : ""}
                </option>
              ))}
            </select>
          </label>

          {/* the stacked result rows — one per asset */}
          <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
            {rows.map(({ asset, result }) => (
              <AssetRow
                key={asset}
                name={t.assets[asset]}
                result={result}
                t={t}
                fmt={fmt}
                locale={locale}
                maxAbs={maxAbs}
              />
            ))}
          </ul>

          {/* the disclaimer + the series bases + the stamp */}
          <p className="m-0 mt-3 type-caption italic leading-relaxed text-[var(--color-text-tertiary)]">{t.disclaimer}</p>
          <p className="m-0 mt-1 type-caption leading-snug text-[var(--color-text-tertiary)]">
            {t.sources
              .replace("{from}", data.backfill?.from ?? "")
              .replace("{to}", data.backfill?.to ?? "")}
          </p>
          <p className="m-0 mt-1 type-caption text-[var(--color-text-tertiary)]">
            {t.asOfLine.replace("{date}", fmt.dateWords(data.asOf))}
          </p>
        </>
      )}
    </section>
  );
}
