/**
 * GoldForecastRetrospective — GPE R32 / F23 (2026-11-19, S17): the
 * forecast-accuracy retrospective, Zone M's COLLAPSED COMPANION inside
 * the honest-record zone (docs/specs/gold-page-elevation: s8/01 R32 ·
 * s5/02 F23 · s6/01 zone 14 "F23 as a collapsed companion inside this
 * zone (trust-band contiguity preserved)" · s4/02 §1d the extraction ·
 * the s17 M1 §3 + S17-D4 records).
 *
 * THE HONESTY DEVICE SA CANNOT COPY (O8): LBMA's own analyst-survey
 * record — the professionals' published consensus missed gold's actual
 * average by a mean −2.1% / mean-abs 8.1% over 2010–2025 (10 of 16 years
 * under-forecast; −20.2% in 2025) — rendered BESIDE Currena's own
 * published no-edge backtest (the footer it lives in). The pairing is
 * the point: neither record claims predictive power; the TE
 * forecast-as-headline anti-pattern is the rejected third way.
 *
 * THE SERIES is the typed static module (lbma-forecast.ts — extracted
 * live 2026-11-19 from the publisher's own performance-page chart, every
 * recorded aggregate reproducing exactly; the annual upkeep is one dated
 * appended row, never a silent rewrite). The year-by-year table carries
 * the disclosed miss convention at point of use; the pending year rides
 * honestly unscored with its mid-year revision note.
 *
 * The 390 rule: the collapsed header + the one-line takeaway always
 * visible; one tap expands the 17-row record. Display-only.
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import {
  LBMA_2026_MIDYEAR_REVISION,
  LBMA_FORECAST_EXTRACTED_AT,
  LBMA_FORECAST_SOURCE_URL,
  LBMA_FORECAST_SERIES,
  forecastRetrospective,
} from '@currena/insights';

/** A signed percent (+ / − U+2212, RTL-safe inside a dir="ltr" island). */
function signedPct(value: number, numberLocale: 'en-US' | 'fa-IR'): string {
  const num = formatNumber(Math.abs(value), numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${num}%`;
}

export function GoldForecastRetrospective(): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const retro = forecastRetrospective(LBMA_FORECAST_SERIES);
  const money = (v: number): string =>
    formatNumber(v, numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  // Years render UNGROUPED (2026, never "2,026") — the locale digits still apply.
  const year = (y: number): string => formatNumber(y, numberLocale, { useGrouping: false, maximumFractionDigits: 0 });

  return (
    <div data-gold-forecast-retrospective className="flex min-w-0 flex-col gap-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2 py-1.5 text-start ring-1 ring-[var(--color-border)]/50 hover:bg-[var(--color-surface)]/90"
      >
        <bdi className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.frTitle')}</bdi>
        <bdi className="min-w-0 flex-1 text-end text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]">
          {interpolate(t('pd.gold.frSubtitle'), { under: num(retro.underForecast.length), n: num(retro.n), abs: signedPct(retro.meanAbsMissPct, numberLocale) })}
        </bdi>
        <ChevronDown className={`size-4 shrink-0 self-center text-currena-blue transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/60 px-2.5 py-2" data-fr-body>
          {/* The headline — the measured record, the s4/02 §1d numbers. */}
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-fr-headline>
            <bdi>
              {interpolate(t('pd.gold.frHeadline'), {
                under: num(retro.underForecast.length),
                n: num(retro.n),
                mean: signedPct(retro.meanMissPct, numberLocale),
                abs: signedPct(retro.meanAbsMissPct, numberLocale),
              })}
            </bdi>
          </p>
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-fr-2025>
            <bdi>
              {interpolate(t('pd.gold.fr2025Line'), {
                miss: signedPct(retro.scored.find((r) => r.year === 2025)?.missPct ?? 0, numberLocale),
                forecast: money(retro.scored.find((r) => r.year === 2025)?.forecast ?? 0),
                actual: money(retro.scored.find((r) => r.year === 2025)?.actual ?? 0),
              })}
            </bdi>
          </p>

          {/* The year-by-year record — the disclosed convention at point
              of use; the under-forecast years carry their marker. */}
          <table className="m-0 w-full border-collapse text-[length:var(--type-caption)]" data-fr-table>
            <thead>
              <tr className="text-[var(--color-text-tertiary)]">
                <th scope="col" className="py-0.5 text-start font-semibold">{t('pd.gold.frColYear')}</th>
                <th scope="col" className="py-0.5 text-end font-semibold">{t('pd.gold.frColForecast')}</th>
                <th scope="col" className="py-0.5 text-end font-semibold">{t('pd.gold.frColActual')}</th>
                <th scope="col" className="py-0.5 text-end font-semibold">{t('pd.gold.frColMiss')}</th>
              </tr>
            </thead>
            <tbody>
              {retro.scored.map((row) => (
                <tr key={row.year} data-fr-year={row.year} data-fr-under={row.missPct < 0 ? 'true' : 'false'} className="border-t border-[var(--color-border)]/40">
                  <td className="py-0.5 text-start font-semibold tabular-nums text-[var(--color-text-primary)]">{year(row.year)}</td>
                  <td dir="ltr" className="py-0.5 text-end tabular-nums text-[var(--color-text-secondary)]">${money(row.forecast)}</td>
                  <td dir="ltr" className="py-0.5 text-end tabular-nums text-[var(--color-text-secondary)]">${money(row.actual)}</td>
                  <td
                    dir="ltr"
                    className={`py-0.5 text-end font-semibold tabular-nums ${row.missPct < 0 ? 'text-[var(--color-status-alert)]' : 'text-[var(--color-text-secondary)]'}`}
                  >
                    {signedPct(row.missPct, numberLocale)}
                  </td>
                </tr>
              ))}
              {retro.pending !== null ? (
                <tr data-fr-pending className="border-t border-dashed border-[var(--color-border)]/60">
                  <td className="py-0.5 text-start font-semibold tabular-nums text-[var(--color-text-primary)]">{year(retro.pending.year)}</td>
                  <td dir="ltr" className="py-0.5 text-end tabular-nums text-[var(--color-text-secondary)]">${money(retro.pending.forecast)}</td>
                  <td className="py-0.5 text-end text-[var(--color-text-tertiary)]">{t('pd.gold.frPendingCell')}</td>
                  <td className="py-0.5 text-end text-[var(--color-text-tertiary)]">—</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]" data-fr-convention>
            <bdi>{t('pd.gold.frMissConvention')}</bdi>
          </p>
          {retro.pending !== null ? (
            <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-fr-pending-note>
              <bdi>
                {interpolate(t('pd.gold.frPendingLine'), {
                  forecast: money(retro.pending.forecast),
                  revision: money(LBMA_2026_MIDYEAR_REVISION),
                })}
              </bdi>
            </p>
          ) : null}

          {/* The pairing note — why this card exists, beside the no-edge
              backtest above it (never "ours is better"). */}
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-fr-pair-note>
            <bdi>{t('pd.gold.frPairNote')}</bdi>
          </p>
          {/* The attribution — the publisher's own page, the dated
              extraction (the s17 M1 §3 record). */}
          <p className="m-0 text-[length:var(--type-caption)] leading-snug" data-fr-source>
            <bdi>{interpolate(t('pd.gold.frSourceLine'), { date: LBMA_FORECAST_EXTRACTED_AT })}</bdi>{' '}
            <a
              href={LBMA_FORECAST_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline"
            >
              {t('pd.gold.frSourceLink')}
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
