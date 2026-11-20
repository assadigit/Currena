/**
 * GoldPremiumHistory — GPE R30 / F3b (2026-11-19): Bridge-2, the Zone F
 * extension — the حباب premium HISTORY card (docs/specs/
 * gold-page-elevation: s1/11 §5–§6 the formulas + the history strategy ·
 * s7/01 §8 the identity arithmetic's BINDING copy · s8/01 R30 · the s16
 * M1 §6 records S16-D1..D5).
 *
 * THE THREE BLOCKS (R30's user value, verbatim):
 *   1. THE DAY-MOVE ATTRIBUTION STRIP (always visible — the 390
 *      headline): today's coin move decomposed into the ounce, the
 *      dollar and the premium — EXACT IDENTITY ARITHMETIC
 *      (Δln(coin) = Δln(ounce) + Δln(USD/IRR) + Δln(1+premium)),
 *      each factor its own % move, the multiplicative identity
 *      disclosed at point of use. NEVER GRAM-style regression — the
 *      distinction is binding copy (s7/01 §8). The base observation is
 *      the last stored day strictly before today's Tehran day; the
 *      current observation is the LIVE snapshot (the bridge board's own
 *      plane — the same coinPremium computation, no cross-source skew).
 *   2. THE PREMIUM HISTORY CHART (collapsed on 390, expanded on
 *      desktop — the GoldCorrelation pattern): the Emami + Bahar
 *      premium-% series over the stored days, the melt (0%) reference
 *      line, and the BACKFILL/LIVE BOUNDARY marker — the honesty line
 *      rendered on the chart itself («reconstructed from source
 *      history» before the boundary, «computed live from our
 *      snapshots» after).
 *   3. THE PREMIUM DECILES — the page's statistical identity applied to
 *      حباب (nobody in the ecosystem has it): each coin's decile
 *      position over its own stored basis, the R19 posture (min base
 *      30, the current point excluded, the basis window named at point
 *      of use); the honest waiting line below the floor.
 *
 * Per-block degradation: no stored history → the card's unavailable
 * line; no live snapshot → the strip's own waiting line (the chart +
 * deciles still render); a base day without the coin → the strip waits.
 * Fail-closed everywhere — dashes, never guesses.
 */

import { useMemo, useState } from 'react';
import { formatJalaliDate, formatNumber, formatDateWords } from '@currena/core';
import { coinPremium } from '@currena/insights';
import {
  attributionLegsOfDay,
  attributionLegsOfPremium,
  attributionStrip,
  premiumDeciles,
  premiumSeries,
  tehranDayOfCapture,
} from '@currena/insights';
import { ChevronDown } from 'lucide-react';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { useSnapshotStore } from '../../shared/lib/snapshot-store';
import { useGoldPremium } from './gold-premium';

/* ------------------------------------------------------------------ *
 * The chart geometry (pure — the GoldCorrelation pattern)
 * ------------------------------------------------------------------ */

const CHART_W = 640;
const CHART_H = 210;
const PAD_L = 10;
const PAD_R = 52;
const PAD_T = 22;
const PAD_B = 20;

interface SeriesPoint {
  date: string;
  premiumPct: number;
  source: 'backfill' | 'live';
}

interface ChartModel {
  emamiPath: string;
  baharPath: string;
  xOf: (date: string) => number;
  yOf: (pct: number) => number;
  minPct: number;
  maxPct: number;
  firstDay: number;
  lastDay: number;
  /** The boundary marker's x (the FIRST live point) — null when the whole window is one provenance. */
  boundaryX: number | null;
}

function dayOf(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

function buildChartModel(emami: readonly SeriesPoint[], bahar: readonly SeriesPoint[]): ChartModel {
  const all = [...emami, ...bahar];
  const firstDay = dayOf(all[0]!.date);
  const lastDay = dayOf(all[all.length - 1]!.date);
  const span = Math.max(1, lastDay - firstDay);
  const xOf = (date: string): number => PAD_L + ((dayOf(date) - firstDay) / span) * (CHART_W - PAD_L - PAD_R);
  let minPct = 0; // the melt line is always in view
  let maxPct = 0;
  for (const p of all) {
    minPct = Math.min(minPct, p.premiumPct);
    maxPct = Math.max(maxPct, p.premiumPct);
  }
  const pad = (maxPct - minPct) * 0.08 || 0.5;
  const lo = minPct - pad;
  const hi = maxPct + pad;
  const yOf = (pct: number): number => PAD_T + (1 - (pct - lo) / (hi - lo)) * (CHART_H - PAD_T - PAD_B);
  const pathOf = (series: readonly SeriesPoint[]): string => {
    let out = '';
    series.forEach((p, i) => {
      out += `${i === 0 ? 'M' : 'L'}${xOf(p.date).toFixed(1)},${yOf(p.premiumPct).toFixed(1)} `;
    });
    return out;
  };
  const firstLive = emami.find((p) => p.source === 'live') ?? bahar.find((p) => p.source === 'live') ?? null;
  const boundaryX = firstLive !== null ? xOf(firstLive.date) : null;
  return {
    emamiPath: pathOf(emami),
    baharPath: pathOf(bahar),
    xOf,
    yOf,
    minPct,
    maxPct,
    firstDay,
    lastDay,
    boundaryX: boundaryX !== null && boundaryX > PAD_L + 6 ? boundaryX : null,
  };
}

/* ------------------------------------------------------------------ *
 * The component
 * ------------------------------------------------------------------ */

export function GoldPremiumHistory(): React.JSX.Element | null {
  const { t, locale, numberLocale } = useI18n();
  const premiumState = useGoldPremium();
  const snapshotState = useSnapshotStore();
  const snapshot = snapshotState.tgju.snapshot;

  const num = (v: number, digits = 1): string =>
    formatNumber(v, numberLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const pctText = (v: number): string => `${v >= 0 ? '+' : '−'}${num(Math.abs(v))}%`;
  const dateText = (dateIso: string): string =>
    locale === 'fa' ? formatJalaliDate(dateIso, 'fa-IR') : formatDateWords(dateIso, 'en-US');

  /* The LIVE premium (the bridge board's own computation — one coherent
   * snapshot, the same coinPremium call, no cross-source skew). */
  const livePremium = useMemo(() => {
    if (snapshot === null) return null;
    const gold = snapshot.gold ?? [];
    if (gold.length === 0) return null;
    const usd = snapshot.rates.find((r) => r.code === 'USD');
    const dollarToman = usd !== undefined && Number.isFinite(usd.rate) && usd.rate > 0 ? 1 / usd.rate : null;
    return coinPremium(gold, dollarToman);
  }, [snapshot]);

  /* The strip: today's live legs vs the last stored day strictly before
   * today's Tehran day (the day-move reading; the rule is the engine's
   * own capture-day rule, client-clock driven). */
  const strip = useMemo(() => {
    if (premiumState.kind !== 'ready' || livePremium === null) return null;
    const today = tehranDayOfCapture(new Date());
    const baseDay = [...premiumState.snapshot.days].reverse().find((d) => d.date < today) ?? null;
    if (baseDay === undefined || baseDay === null) return null;
    const base = attributionLegsOfDay(baseDay, 'coin-emami');
    const current = attributionLegsOfPremium(livePremium, 'coin-emami');
    if (base === null || current === null) return null;
    const factors = attributionStrip(base, current);
    if (factors === null) return null;
    return { baseDate: baseDay.date, factors };
  }, [premiumState, livePremium]);

  /* The series + deciles (pure derivations — the engine, imported). */
  const emami = useMemo(
    () => (premiumState.kind === 'ready' ? premiumSeries(premiumState.snapshot.days, 'coin-emami') : []),
    [premiumState],
  );
  const bahar = useMemo(
    () => (premiumState.kind === 'ready' ? premiumSeries(premiumState.snapshot.days, 'coin-bahar') : []),
    [premiumState],
  );
  const decilesEmami = useMemo(() => (emami.length >= 2 ? premiumDeciles(emami) : null), [emami]);
  const decilesBahar = useMemo(() => (bahar.length >= 2 ? premiumDeciles(bahar) : null), [bahar]);

  // The 390 rule (the GoldCorrelation pattern): collapsed on small
  // viewports, expanded on desktop — session-only.
  const [open, setOpen] = useState(() => {
    try {
      return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(min-width: 640px)').matches !== true
          ? false
          : true
      );
    } catch {
      return true;
    }
  });

  const header = (
    <header className="flex min-w-0 flex-col gap-0.5">
      <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        {t('pd.gold.prTitle')}
      </h4>
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
        {t('pd.gold.prSubtitle')}
      </p>
    </header>
  );

  if (premiumState.kind === 'loading') {
    return (
      <section aria-label={t('pd.gold.prTitle')} data-gold-premium="loading" role="status" className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]">
        {header}
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{t('pd.gold.loadingLine')}</p>
      </section>
    );
  }

  if (premiumState.kind === 'none' || emami.length < 2) {
    return (
      <section aria-label={t('pd.gold.prTitle')} data-gold-premium="none" className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]">
        {header}
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-premium-unavailable>
          {t('pd.gold.prUnavailable')}
        </p>
      </section>
    );
  }

  const stored = premiumState.snapshot;
  const chart = buildChartModel(emami, bahar);

  return (
    <section
      aria-label={t('pd.gold.prTitle')}
      data-gold-premium
      data-premium-days={stored.days.length}
      data-premium-asof={stored.asOf}
      className="flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)] sm:p-3.5"
    >
      {header}

      {/* 1 — THE DAY-MOVE ATTRIBUTION STRIP (always visible, the 390
       * headline). Exact identity arithmetic, disclosed at point of use
       * — NEVER GRAM-style regression (s7/01 §8's binding copy). */}
      {strip !== null ? (
        <div className="flex flex-col gap-1 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-2" data-premium-strip>
          <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
            <bdi>
              {interpolate(t('pd.gold.prStripLine'), {
                date: dateText(strip.baseDate),
                coin: pctText(strip.factors.coinMovePct),
                ounce: pctText(strip.factors.ouncePct),
                dollar: pctText(strip.factors.dollarPct),
                premium: pctText(strip.factors.premiumPct),
              })}
            </bdi>
          </p>
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-premium-strip-method>
            <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'}>{t('pd.gold.prStripMethod')}</bdi>
          </p>
        </div>
      ) : (
        <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-premium-strip-waiting>
          {t('pd.gold.prStripWaiting')}
        </p>
      )}

      {/* The 390 toggle (the session-only collapse). */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="gold-premium-history-body"
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-1 text-start text-[length:var(--type-label)] font-bold text-currena-blue"
      >
        <span>{t('pd.gold.prChartTitle')}</span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div id="gold-premium-history-body" className="flex flex-col gap-2.5">
          {/* 2 — THE PREMIUM HISTORY CHART: both coins, the melt line,
           * the backfill/live boundary (the honesty line on the chart). */}
          <figure className="m-0 flex min-w-0 flex-col gap-1" data-premium-chart>
            <div dir="ltr" className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                role="img"
                aria-label={t('pd.gold.prTitle')}
                className="h-auto w-full"
                data-premium-points={emami.length}
              >
                {/* The melt (0%) reference line. */}
                <line x1={PAD_L} y1={chart.yOf(0)} x2={CHART_W - PAD_R} y2={chart.yOf(0)} stroke="var(--color-border)" strokeWidth={1} />
                <text x={CHART_W - PAD_R + 4} y={chart.yOf(0) + 3.5} fontSize={9.5} fill="var(--color-text-tertiary)">
                  {t('pd.gold.prMeltLabel')}
                </text>
                {/* The backfill/live boundary marker (when the window has both). */}
                {chart.boundaryX !== null ? (
                  <g data-premium-boundary>
                    <line x1={chart.boundaryX} y1={PAD_T - 6} x2={chart.boundaryX} y2={CHART_H - PAD_B} stroke="var(--color-text-tertiary)" strokeWidth={1} opacity={0.55} strokeDasharray="4 3" />
                    <text x={chart.boundaryX + 3} y={PAD_T - 9} fontSize={9.5} fill="var(--color-text-tertiary)">
                      {t('pd.gold.prBoundaryLabel')}
                    </text>
                  </g>
                ) : null}
                {/* The two coins' premium lines. */}
                <path d={chart.emamiPath} fill="none" stroke="var(--color-accent-gold)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" data-premium-emami-line />
                <path d={chart.baharPath} fill="none" stroke="var(--color-text-secondary)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} data-premium-bahar-line />
                {/* The y-axis min/max labels. */}
                <text x={CHART_W - PAD_R + 4} y={PAD_T + 4} fontSize={9.5} fill="var(--color-text-tertiary)">{pctText(chart.maxPct)}</text>
                <text x={CHART_W - PAD_R + 4} y={CHART_H - PAD_B} fontSize={9.5} fill="var(--color-text-tertiary)">{pctText(chart.minPct)}</text>
                {/* The window's first + last dates (the honest span). */}
                <text x={PAD_L} y={CHART_H - 4} fontSize={9.5} fill="var(--color-text-tertiary)">{dateText(emami[0]!.date)}</text>
                <text x={CHART_W - PAD_R} y={CHART_H - 4} fontSize={9.5} fill="var(--color-text-tertiary)" textAnchor="end">{dateText(stored.asOf)}</text>
              </svg>
            </div>
            <figcaption className="m-0 flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
              <span>{t('gold.coin-emami')}</span>
              <span>{t('gold.coin-bahar')}</span>
            </figcaption>
          </figure>

          {/* The honesty line (the two provenances, named). */}
          {stored.backfill !== undefined ? (
            <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-premium-honesty>
              <bdi>
                {interpolate(t('pd.gold.prHonestyLine'), {
                  from: dateText(stored.backfill.from),
                  to: dateText(stored.backfill.to),
                  n: formatNumber(stored.backfill.days, numberLocale, { maximumFractionDigits: 0 }),
                })}
              </bdi>
            </p>
          ) : null}

          {/* 3 — THE PREMIUM DECILES: each coin's position over its own
           * stored basis (the R19 posture — min 30, current excluded,
           * the window named at point of use). */}
          <div className="flex flex-col gap-1.5" data-premium-deciles>
            <p className="m-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
              {t('pd.gold.prDecileTitle')}
            </p>
            {(
              [
                { coin: t('gold.coin-emami'), d: decilesEmami },
                { coin: t('gold.coin-bahar'), d: decilesBahar },
              ] as const
            ).map(({ coin, d }) => (
              <p key={coin} className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-premium-decile-row>
                <bdi>
                  {d !== null && d.decile !== null && d.band !== null && d.basis !== null
                    ? interpolate(t('pd.gold.prDecileLine'), {
                        coin,
                        pct: pctText(d.currentPct),
                        band: interpolate(
                          d.decile >= 0.9 ? t('pd.gold.prBandTop') : d.decile <= 0.1 ? t('pd.gold.prBandBottom') : t('pd.gold.prBandMid'),
                          { p: num(Math.round((d.decile >= 0.9 ? 1 - d.decile : d.decile) * 100), 0) },
                        ),
                        from: dateText(d.basis.from),
                        to: dateText(d.basis.to),
                        n: formatNumber(d.basis.points, numberLocale, { maximumFractionDigits: 0 }),
                      })
                    : d !== null
                      ? interpolate(t('pd.gold.prDecileWaiting'), { coin, n: num(emami.length - 1, 0) })
                      : interpolate(t('pd.gold.prDecileWaiting'), { coin, n: num(0, 0) })}
                </bdi>
              </p>
            ))}
            {decilesEmami !== null && decilesEmami.band !== null ? (
              <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-premium-decile-band>
                <bdi>
                  {interpolate(t('pd.gold.prDecileBand'), {
                    min: pctText(decilesEmami.band.min),
                    p10: pctText(decilesEmami.band.p10),
                    median: pctText(decilesEmami.band.median),
                    p90: pctText(decilesEmami.band.p90),
                    max: pctText(decilesEmami.band.max),
                  })}
                </bdi>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* The method footer: the day-close convention + the
       * reconstruction method + the C6 TGJU row. */}
      <footer className="m-0 flex flex-col gap-1 border-t border-[var(--color-border)]/60 pt-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-premium-method>
        <p className="m-0">{t('pd.gold.prMethod')}</p>
        <p className="m-0">
          <a
            href="https://www.tgju.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline"
          >
            {t('pd.gold.bridgeSourceNote')}
          </a>
          <span aria-hidden="true"> · </span>
          <span>{t('pd.gold.bridgeRevisionNote')}</span>
        </p>
      </footer>
    </section>
  );
}
