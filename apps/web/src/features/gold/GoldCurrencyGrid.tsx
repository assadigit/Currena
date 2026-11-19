/**
 * GoldCurrencyGrid — GPE R26 / F10 (2026-11-19): the multi-currency
 * gold grid, Zone I's compact sub-card (docs/specs/gold-page-elevation:
 * s8/01 R26 · s7/01 §4 Chain 2 — the small-multiples encoding · s6/01
 * zone I: 390 = one row expanding to the stacked grid).
 *
 * THE FIVE CROSSES: EUR + AUD native, JPY + GBP + CNY derived (the
 * S14-D1 record — the formulas named per C1 in the grid's method line).
 * Each row: the cross's own latest close, its 30-day change, and its
 * decile chip over its OWN stored window (the S13-D1 honest posture —
 * the basis window named at point of use, self-widening).
 *
 * THE KGX VALIDATION SENTENCE (the s8/01 R26 wording): rises in USD AND
 * the other crosses = genuine demand; USD-only = the dollar story —
 * computed through the pure engine (kgxVerdict) over the crosses' 30-day
 * changes + the USD leg's own (the SAME gold-xau series the chart
 * reads — one series, never two).
 *
 * Display-only (s6/01): no meter membership, no voter.
 */

import { useMemo, useState } from 'react';
import { formatNumber } from '@currena/core';
import { CROSS_LEGS, GOLD_CROSS_IDS, crossStats, kgxVerdict } from '@currena/insights';
import { ChevronDown } from 'lucide-react';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { useGoldCrosses } from './gold-crosses';
import { useGoldXauOhlc } from './gold-xau';

/** The display decimals per currency (JPY 0, the rest 2 — the FX norm). */
const DECIMALS: Readonly<Record<string, number>> = { eur: 2, jpy: 0, gbp: 2, cny: 2, aud: 2 };

/** The currency-name keys (the corpus's own table — no parallel copy). */
const CURRENCY_KEY: Readonly<Record<string, 'currencies.EUR' | 'currencies.JPY' | 'currencies.GBP' | 'currencies.CNY' | 'currencies.AUD'>> = {
  eur: 'currencies.EUR',
  jpy: 'currencies.JPY',
  gbp: 'currencies.GBP',
  cny: 'currencies.CNY',
  aud: 'currencies.AUD',
};

export function GoldCurrencyGrid(): React.JSX.Element | null {
  const { t, numberLocale } = useI18n();
  const crossesState = useGoldCrosses();
  const goldState = useGoldXauOhlc();

  // The 390 rule (s6/01 zone I): collapsed to one row (the title + the
  // validation sentence's current verdict word), expanding to the
  // stacked grid — session-only (the bridge's pattern).
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

  // The pure derivations (the engine, imported — no arithmetic here).
  const rows = useMemo(() => {
    if (crossesState.kind !== 'ready') return null;
    return crossesState.snapshot.crosses.map((cross) => ({
      cross,
      stats: crossStats(cross.id, cross.series),
    }));
  }, [crossesState]);

  // The USD leg's own 30-day change (the same series the chart reads).
  const usdChange30d = useMemo(() => {
    if (goldState.kind !== 'ready') return null;
    const stats = crossStats('eur', goldState.snapshot.series.map((c) => ({ date: c.date, close: c.close })));
    return stats?.change30d ?? null;
  }, [goldState]);

  // The KGX verdict (the pure engine).
  const kgx = useMemo(() => {
    if (rows === null) return null;
    return kgxVerdict(
      usdChange30d,
      rows.map((r) => ({ id: r.cross.id, change30d: r.stats?.change30d ?? null })),
    );
  }, [rows, usdChange30d]);

  const num = (v: number, digits = 0): string =>
    formatNumber(v, numberLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits });

  /** The honest basis-window word (each row names its own — S13-D1). */
  const spanWord = (from: string, to: string): string => {
    const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;
    if (days < 335) {
      return interpolate(t('pd.gold.chartSpanMonths'), {
        n: num(Math.max(1, Math.round(days / 30.4))),
      });
    }
    return interpolate(t('pd.gold.chartSpanYears'), {
      years: num(Math.round((days / 365.25) * 10) / 10),
    });
  };

  const kgxSentence = (() => {
    if (kgx === null) return t('pd.gold.gridKgxNone');
    const { kind, ups, known } = kgx;
    const downs = known - ups;
    if (kind === 'genuine-demand') return interpolate(t('pd.gold.gridKgxGenuine'), { ups: num(ups), known: num(known) });
    if (kind === 'dollar-story') return interpolate(t('pd.gold.gridKgxDollar'), { downs: num(downs), known: num(known) });
    if (kind === 'dollar-weakness') return interpolate(t('pd.gold.gridKgxWeak'), { ups: num(ups), known: num(known) });
    return interpolate(t('pd.gold.gridKgxMixed'), { ups: num(ups), known: num(known) });
  })();

  const header = (
    <header className="flex min-w-0 flex-col gap-0.5">
      <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
        {t('pd.gold.gridTitle')}
      </h4>
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
        {t('pd.gold.gridSubtitle')}
      </p>
    </header>
  );

  if (crossesState.kind === 'loading') {
    return (
      <section aria-label={t('pd.gold.gridTitle')} data-gold-grid="loading" role="status" className="rounded-[var(--radius-md)] bg-currena-soft/40 p-2.5 ring-1 ring-[var(--color-border)]/60">
        {header}
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{t('pd.gold.loadingLine')}</p>
      </section>
    );
  }
  if (rows === null) {
    return (
      <section aria-label={t('pd.gold.gridTitle')} data-gold-grid="none" className="rounded-[var(--radius-md)] bg-currena-soft/40 p-2.5 ring-1 ring-[var(--color-border)]/60">
        {header}
        <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-grid-unavailable>
          {t('pd.gold.gridUnavailable')}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label={t('pd.gold.gridTitle')}
      data-gold-grid
      className="flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] bg-currena-soft/40 p-2.5 ring-1 ring-[var(--color-border)]/60"
    >
      {header}

      {/* The KGX validation sentence — always visible (the 390 row). */}
      <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]" data-grid-kgx>
        <bdi>
          <span className="text-[var(--color-text-tertiary)]">{t('pd.gold.gridKgxTitle')}: </span>
          {kgxSentence}
        </bdi>
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer items-center justify-between gap-2 rounded-[var(--radius-sm)] px-1 text-start text-[length:var(--type-caption)] font-semibold text-currena-blue"
      >
        <span>{t('pd.gold.gridTitle')}</span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <>
          {/* The stacked grid (the small-multiples encoding — one row per
           * currency, the value + the 30-day change + the decile chip). */}
          <ul className="m-0 flex list-none flex-col gap-1 p-0" data-grid-rows>
            {GOLD_CROSS_IDS.map((id) => {
              const row = rows.find((r) => r.cross.id === id)!;
              const stats = row.stats;
              const leg = CROSS_LEGS.find((l) => l.id === id)!;
              const decimals = DECIMALS[id] ?? 2;
              const change = stats?.change30d ?? null;
              const band =
                stats?.decile !== null && stats?.decile !== undefined
                  ? stats.decile > 0.8
                    ? interpolate(t('pd.gold.gridBandTop'), { p: num(Math.round((1 - stats.decile) * 100)) })
                    : stats.decile < 0.2
                      ? interpolate(t('pd.gold.gridBandBottom'), { p: num(Math.round(stats.decile * 100)) })
                      : t('pd.gold.gridBandMid')
                  : null;
              return (
                <li
                  key={id}
                  data-grid-row={id}
                  data-grid-kind={row.cross.kind}
                  className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]/60"
                >
                  <span className="min-w-0 flex flex-col">
                    <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
                      {t(CURRENCY_KEY[id]!)}
                      <span className="ms-1.5 font-normal text-[var(--color-text-tertiary)]">XAU{id.toUpperCase()}</span>
                    </span>
                    <span className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">{leg.formula}</span>
                  </span>
                  <span className="flex flex-col items-end">
                    <bdi dir="ltr" className="text-[length:var(--type-label)] font-extrabold tabular-nums text-[var(--color-text-primary)]">
                      {stats !== null ? num(stats.last, decimals) : '—'}
                    </bdi>
                    <span className="text-[length:var(--type-caption)] tabular-nums text-[var(--color-text-tertiary)]">
                      {change !== null ? (
                        <>
                          <span className={change >= 0 ? 'text-[var(--color-return-up)]' : 'text-[var(--color-return-down)]'}>
                            {change >= 0 ? '+' : '−'}
                            {num(Math.abs(change), 1)}%
                          </span>
                          {' · '}
                          {t('pd.gold.gridChange30d')}
                        </>
                      ) : (
                        '—'
                      )}
                      {band !== null && stats?.basis !== null ? (
                        <>
                          {' · '}
                          <span data-grid-band={stats!.decile! > 0.8 ? 'high' : stats!.decile! < 0.2 ? 'low' : 'mid'}>
                            {interpolate(t('pd.gold.gridPositionLine'), { band })}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-grid-method>
            <bdi>{t('pd.gold.gridFormula')}</bdi>{' '}
            <bdi>
              {interpolate(t('pd.gold.gridBasisNote'), {
                window: rows[0]?.stats?.basis !== null && rows[0]?.stats?.basis !== undefined
                  ? spanWord(rows[0]!.stats!.basis!.from, rows[0]!.stats!.basis!.to)
                  : '',
              })}
            </bdi>
          </p>
        </>
      ) : null}
    </section>
  );
}
