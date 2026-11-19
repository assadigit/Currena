/**
 * GoldIfBought — GPE R33 / F26 (2026-11-19, S17): the "if you'd bought"
 * calculator, Zone O's collapsed Advanced card (docs/specs/
 * gold-page-elevation: s8/01 R33 · s5/02 F26 · s1/07 §4 the SA precedent
 * ("$X/month since year Y") · s6/01 zone 16 "F26 behind progressive
 * disclosure" · s6/03 zone O "year picker + stacked result rows at
 * 390" · the s17 M1 §5 + S17-D5 records).
 *
 * ALL SERIES IN-REPO (the row's own claim, verified at M1 §5): gold vs
 * S&P vs BTC vs silver since year Y — the LUMP multiple + the MONTHLY
 * DCA ($100 at each month-end close, the SA convention) + the DECILE
 * framing where the history supports it (the R19 posture: min base 30
 * same-length windows, the basis named, the honest waiting line). EVERY
 * WINDOW NAMED AT POINT OF USE (the from → to months ride every result;
 * "since 2016" honestly reads since November 2016 — the series' own
 * coverage).
 *
 * The 390 rule: the collapsed header + the takeaway line always
 * visible; one tap expands the year picker + the stacked result rows.
 * The compute is the pure engine (ifBoughtResult — the same function
 * the tests pin); the data is ONE fetch (the gold-ifbought client).
 * Past returns are no guarantee of future results — the disclaimer
 * renders on the card; nothing here is advice.
 */

import { useMemo, useState } from 'react';
import { ChevronDown, PiggyBank } from 'lucide-react';
import { formatNumber } from '@currena/core';
import { ifBoughtResult, IF_BOUGHT_DECILE_MIN_BASE, IF_BOUGHT_DCA_MONTHLY } from '@currena/insights';
import type { GoldIfBoughtAssetId, GoldIfBoughtSnapshot } from '@currena/core';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import { useGoldIfBought } from './gold-ifbought';

/** The four assets in the R33 row's own order. */
const ASSET_ORDER: readonly GoldIfBoughtAssetId[] = ['gold', 'sp500', 'btc', 'silver'];

const ASSET_NAME_KEY: Record<GoldIfBoughtAssetId, Parameters<ReturnType<typeof useI18n>['t']>[0]> = {
  gold: 'pd.gold.ibAssetGold',
  sp500: 'pd.gold.ibAssetSp500',
  btc: 'pd.gold.ibAssetBtc',
  silver: 'pd.gold.ibAssetSilver',
};

/** A signed percent (+ / − U+2212 over the abs value, RTL-safe). */
function signedPct(value: number, numberLocale: 'en-US' | 'fa-IR', decimals = 1): string {
  const num = formatNumber(Math.abs(value), numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${num}%`;
}

/** The year picker's own options off the series' coverage. */
function yearOptions(snapshot: GoldIfBoughtSnapshot): number[] {
  const firstYear = Number(snapshot.assets.gold.monthly[0]!.ym.slice(0, 4));
  const lastYear = Number(snapshot.assets.gold.current.ym.slice(0, 4));
  const years: number[] = [];
  for (let y = firstYear; y <= lastYear; y++) years.push(y);
  return years;
}

export function GoldIfBought(): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const state = useGoldIfBought();
  const [open, setOpen] = useState(false);
  const [since, setSince] = useState<number | null>(null);

  const snapshot = state.kind === 'ready' ? state.snapshot : null;
  const years = useMemo(() => (snapshot !== null ? yearOptions(snapshot) : []), [snapshot]);
  const effectiveSince = since ?? years[years.length - 2] ?? years[0] ?? null;

  const money = (v: number): string => formatNumber(v, numberLocale, { maximumFractionDigits: 0 });
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  // Years render UNGROUPED (2026, never "2,026") — the locale digits still apply.
  const year = (y: number): string => formatNumber(y, numberLocale, { useGrouping: false, maximumFractionDigits: 0 });
  const monthText = (ym: string): string => {
    const [y, m] = ym.split('-');
    if (locale === 'fa') return `${num(Number(m))}/${year(Number(y))}`;
    return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(m) - 1]} ${y}`;
  };

  const rows = useMemo(() => {
    if (snapshot === null || effectiveSince === null) return [];
    return ASSET_ORDER.map((asset) => ({
      asset,
      result: ifBoughtResult(snapshot.assets[asset], effectiveSince),
    }));
  }, [snapshot, effectiveSince]);

  return (
    <section
      id="gold-ifbought"
      aria-label={t('pd.gold.ibTitle')}
      data-gold-ifbought
      className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-2 ring-1 ring-[var(--color-border)]/60"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="insights-focusable flex min-h-[44px] w-full cursor-pointer flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-start"
      >
        <span className="flex min-w-0 items-baseline gap-1.5">
          <PiggyBank className="size-4 shrink-0 self-center text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <bdi className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t('pd.gold.ibTitle')}</bdi>
        </span>
        <bdi className="min-w-0 flex-1 text-end text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]">
          {t('pd.gold.ibSubtitle')}
        </bdi>
        <ChevronDown className={`size-4 shrink-0 self-center text-currena-blue transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="flex min-w-0 flex-col gap-2" data-ib-body>
          {state.kind === 'loading' ? (
            <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]" role="status">
              {t('pd.gold.ibLoading')}
            </p>
          ) : null}

          {state.kind === 'none' ? (
            /* The honest pre-backfill state: the runner has not landed the
             * series yet — the waiting line, never an interim number. */
            <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-ib-waiting>
              <bdi>{t('pd.gold.ibWaiting')}</bdi>
            </p>
          ) : null}

          {snapshot !== null ? (
            <>
              {/* The method line first — the DCA convention + the window
                  naming rule, disclosed at point of use (the s7/03 §8
                  discipline's own spirit). */}
              <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-ib-method>
                <bdi>{interpolate(t('pd.gold.ibMethod'), { amount: money(IF_BOUGHT_DCA_MONTHLY) })}</bdi>
              </p>

              {/* The year picker (the s6/03 zone O control). */}
              <label className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">{t('pd.gold.ibPickLabel')}</span>
                <select
                  value={effectiveSince ?? undefined}
                  onChange={(event) => setSince(Number(event.currentTarget.value))}
                  className="insights-focusable min-h-[44px] rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-[length:var(--type-label)] font-semibold tabular-nums text-[var(--color-text-primary)]"
                  data-ib-year-select
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {year(y)}
                      {y === years[0] ? ` (${t('pd.gold.ibFirstYearNote')})` : ''}
                    </option>
                  ))}
                </select>
              </label>

              {/* The stacked result rows (one per asset). */}
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0" data-ib-rows>
                {rows.map(({ asset, result }) => (
                  <li
                    key={asset}
                    data-ib-row={asset}
                    className="flex min-w-0 flex-col gap-0.5 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]/50"
                  >
                    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                      <bdi className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{t(ASSET_NAME_KEY[asset])}</bdi>
                      {result !== null ? (
                        <bdi dir="ltr" className={`text-[length:var(--type-label)] font-extrabold tabular-nums ${result.lumpPct >= 0 ? 'text-[var(--color-return-up)]' : 'text-[var(--color-return-down)]'}`} data-ib-lump>
                          {signedPct(result.lumpPct, numberLocale)}
                        </bdi>
                      ) : null}
                    </div>
                    {result !== null ? (
                      <>
                        {/* The window, NAMED at point of use. */}
                        <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-ib-window>
                          {interpolate(t('pd.gold.ibWindowLine'), { from: monthText(result.fromYm), to: monthText(result.toYm), n: num(result.months) })}
                        </bdi>
                        {/* The DCA line — the SA convention, marked at the
                            running close. */}
                        <bdi dir="ltr" className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]" data-ib-dca>
                          {interpolate(t('pd.gold.ibDcaLine'), {
                            value: money(result.dcaValue),
                            invested: money(result.dcaInvested),
                            pct: signedPct(result.dcaPct, numberLocale),
                          })}
                        </bdi>
                        {/* The decile line — the R19 posture (the honest
                            waiting line under the min base). */}
                        <bdi className="text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]" data-ib-decile={result.decile === null ? 'waiting' : String(result.decile)}>
                          {result.decile !== null
                            ? interpolate(t('pd.gold.ibDecileLine'), { d: num(result.decile), n: num(result.decileBase) })
                            : interpolate(t('pd.gold.ibDecileWaiting'), { min: num(IF_BOUGHT_DECILE_MIN_BASE), n: num(result.decileBase) })}
                        </bdi>
                      </>
                    ) : (
                      <bdi className="text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-ib-no-window>
                        {t('pd.gold.ibNoWindow')}
                      </bdi>
                    )}
                  </li>
                ))}
              </ul>

              {/* The disclaimers — past returns + the series bases
                  (the S&P leg's venue named). */}
              <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]" data-ib-disclaimer>
                <bdi>{t('pd.gold.ibDisclaimer')}</bdi>
              </p>
              <p className="m-0 text-[length:var(--type-caption)] leading-snug text-[var(--color-text-tertiary)]" data-ib-sources>
                <bdi>{interpolate(t('pd.gold.ibSourcesLine'), { from: snapshot.backfill.from, to: snapshot.backfill.to })}</bdi>
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
