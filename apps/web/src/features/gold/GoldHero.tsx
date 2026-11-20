/**
 * GoldHero — the Gold page's hero, REBUILT for the gold UX redesign
 * (GUX-S5 M3b, 2026-11-2x — 11 §3.1/§5/§10, 12 §3.1 row 4.1; the S4
 * visual system executed over the S3 content records).
 *
 * THE NEW SHAPE (the F-08 fix — one dominant element, no jumble):
 *
 *   ┌─────────────────────────┬───────────────────────────────┐
 *   │ THE PRICE BLOCK         │ THE BRIEFINGCARD (the page's  │
 *   │ type-number prominence, │ SINGLE focal element — the    │
 *   │ signed window change +  │ gold field + --shadow-focal,  │
 *   │ visible window tag, the │ typographic, NO instrument)   │
 *   │ HouseTimeSeries         ├───────────────────────────────┤
 *   │ sparkline, the ONE      │ THE COMPOSITIONSTACK (the     │
 *   │ AsOfChip + market pill  │ conditions evidence layer:    │
 *   │ 10-year position band   │ verdict once → the brass      │
 *   │                         │ instrument → the five         │
 *   │                         │ LaneBars → the ledger → the   │
 *   │                         │ caveat — 11 §5's ①–⑤)        │
 *   └─────────────────────────┴───────────────────────────────┘
 *
 * What this REPLACES (the 11 §5.4 dedup ledger, executed):
 *   - the view radio (BD-S6a's classic↔minimal alternation) RETIRES —
 *     the CompositionStack IS the balance view now (brass ≥lg,
 *     BeamGlyph + brass-on-tap below); the choice had served the
 *     transition, S5's stack is the destination shape.
 *   - the hero's own verdict-word row + outlook line + counts line +
 *     beam jumble — the verdict word survives ONCE inside the stack's
 *     ①; the 7-state outlook line renders INSIDE the BriefingCard's
 *     Q1 container (its fate is the owner's Q1, never re-decided here).
 *   - the three timestamp formats → the ONE AsOfChip (11 §6.4).
 *
 * Every value remains a DISPLAY of the pure derivations in gold-tiles.ts
 * — the same engines the ledger and the Global tile read, never a second
 * arithmetic (D-48). The Q1/Q2 owner gates HOLD: no five-state word, no
 * horizon chip, no scenario row (S5-D1's standing rule 1).
 */

import { useMemo } from 'react';
import type { IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import type { GoldHeroModel } from './gold-tiles';
import { GOLD_DISPLAY, goldHeroVerdictState, goldHeroVerdictWordKey } from './gold-tiles';
import { GoldTimeMachine } from './GoldTimeMachine';
import { BriefingCard } from './BriefingCard';
import { CompositionStack } from './CompositionStack';
import { AsOfChip } from './AsOfChip';
import { GoldPriceSpark } from './GoldPriceSpark';
import { comexMarketState } from './market-state';

/** A signed percent, the GlobalBoard sign convention (+ / − U+2212 over
 *  the abs value, inside a dir="ltr" island so RTL never scatters it). */
function signedPct(change: number, numberLocale: 'en-US' | 'fa-IR', decimals = 2): string {
  const num = formatNumber(Math.abs(change), numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  return `${sign}${num}%`;
}

/** The position band word — the corpus's own band vocabulary over the
 *  reading's percentile (the legacy convention, kept verbatim). */
function bandWord(percentile: number, t: ReturnType<typeof useI18n>['t'], numberLocale: 'en-US' | 'fa-IR'): string {
  if (percentile > 0.8) return interpolate(t('pd.gold.bandTop'), { p: formatNumber(Math.round((1 - percentile) * 100), numberLocale) });
  if (percentile < 0.2) return interpolate(t('pd.gold.bandBottom'), { p: formatNumber(Math.round(percentile * 100), numberLocale) });
  return t('pd.gold.bandMid');
}

export function GoldHero({
  hero,
  pricesAsOf,
  pricesCached = false,
  onOpenRecord,
}: {
  hero: GoldHeroModel;
  /** The projection's pricesAsOf stamp (the hourly live-prices clock). */
  pricesAsOf: string | undefined;
  /** GPE R06/#23: true when the projection is the cached (last-good)
   *  copy — the AsOfChip then carries the shipped "(last successful)"
   *  qualifier so a reader never reads a stale clock as "current". */
  pricesCached?: boolean;
  /** Opens the reason row's indicator record (the M4 popover wiring;
   *  undefined = the rows render as plain anchored rows). */
  onOpenRecord?: (id: import('./gold-tiles').GoldVoterId) => void;
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();

  const price: IndicatorReading | undefined = hero.price;
  const cfg = GOLD_DISPLAY['gold-usd'];
  const valueText =
    price !== undefined && price.value !== null
      ? formatNumber(price.value, numberLocale, { minimumFractionDigits: cfg.decimals, maximumFractionDigits: cfg.decimals })
      : null;
  // BD-S4a: the TRUE day change rides the live entry (change1d — the
  // live hourly quote vs the previous daily close); until the stored
  // prices key carries it, the labelled 7-day change shows. The window
  // is ALWAYS visible — never a bare percent.
  const change = price?.change1d ?? price?.change7d;
  const changeDays = price?.change1d !== undefined ? 1 : 7;
  const changeTone =
    change === undefined ? '' : change > 0 ? 'text-[var(--color-return-up)]' : change < 0 ? 'text-[var(--color-return-down)]' : 'text-[var(--color-text-secondary)]';

  // The verdict word + state — the SAME pure helpers the CompositionStack's
  // ① renders from (one rule, the stack says it ONCE; the hero passes the
  // composed word in, never re-composing a second vocabulary).
  const verdictState = goldHeroVerdictState(hero);
  const verdictWord = t(goldHeroVerdictWordKey(verdictState));

  /* GPE R16 / F16b: the market open/closed pill — a status affordance
   * beside the AsOfChip. The reference market is the one the live price
   * actually reads (COMEX gold futures), its static schedule named at
   * point of use. Renders only when a price exists. */
  const marketState = price !== undefined ? comexMarketState(new Date()) : null;

  const positionLine =
    hero.position !== null
      ? interpolate(t('pd.gold.heroPositionLine'), { band: bandWord(hero.position.percentile, t, numberLocale) })
      : null;

  // Gold's own 30-day move — CONTEXT inside the price block (01 §6),
  // shown only when the reading carries it. Never counted in the balance.
  const contextLine =
    hero.speed !== null && Number.isFinite(hero.speed)
      ? interpolate(t('pd.gold.heroContextLine'), { change: signedPct(hero.speed, numberLocale) })
      : null;

  // The ONE AsOfChip time — the projection's hourly live-prices stamp,
  // formatted once here (the chip never formats; 11 §6.4).
  const asOfText = useMemo(
    () =>
      pricesAsOf !== undefined
        ? `${new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(pricesAsOf))} UTC`
        : undefined,
    [pricesAsOf, locale],
  );

  return (
    <section
      aria-label={t('pd.gold.heroHeading')}
      data-gold-hero
      data-hero-shape="briefing"
      className="flex flex-col gap-3"
    >
      {/* ---------- the briefing grid: the price block + the two cards ---------- */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,2fr)_3fr] lg:gap-4">
        {/* The price block (12 §3.1 row 4.1): type-number prominence +
            the signed window change + the HouseTimeSeries sparkline +
            the ONE AsOfChip. Prominent, NOT focal (11 §3.1: no gold
            field here — that recipe belongs to the BriefingCard alone). */}
        <div className="flex min-w-0 flex-col gap-2 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] shadow-[var(--shadow-card)] sm:p-5">
          <h2 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
            {t('pd.gold.cardNames.gold-usd')}
          </h2>
          {valueText !== null ? (
            <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="type-number text-3xl leading-none tabular-nums text-[var(--color-text-primary)] sm:text-4xl">
                {locale === 'fa' ? `${valueText} ${t('pd.gold.unitUsd')}` : `${t('pd.gold.unitUsd')}${valueText}`}
              </bdi>
              {change !== undefined ? (
                <bdi dir="ltr" className={`text-[length:var(--type-label)] font-bold tabular-nums ${changeTone}`}>
                  {signedPct(change, numberLocale)}
                  {/* GPE R06/#27: the window tag sits a clear glyph-width
                   * away from the percent — the two a pair, not a jam. */}
                  <span className="ms-1.5 font-semibold text-[var(--color-text-tertiary)]" aria-hidden="true">
                    {interpolate(t('pd.global.ribbonWindowTag'), { days: formatNumber(changeDays, numberLocale, { maximumFractionDigits: 0 }) })}
                  </span>
                  <span className="sr-only">
                    {' '}
                    {changeDays === 1 ? t('pd.global.changeOver1d') : interpolate(t('pd.global.changeOver'), { days: formatNumber(changeDays, numberLocale, { maximumFractionDigits: 0 }) })}
                  </span>
                </bdi>
              ) : null}
            </p>
          ) : (
            <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.global.cannotRead')}</p>
          )}
          {/* The HouseTimeSeries spark (12 §1.5): the OHLC leg's own
           * closes, neutral tone, LTR root, the series + window named —
           * the hero's ONLY price drawing (F-06: the narrative's price
           * fact + the Signals chart ANCHOR here, never re-render). */}
          <GoldPriceSpark />
          {/* The 10-year position line (the decade band, in words). */}
          {positionLine !== null ? (
            <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
              <bdi>{positionLine}</bdi>
            </p>
          ) : null}
          {contextLine !== null ? (
            <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-balance-context-line>
              <bdi>{contextLine}</bdi>
            </p>
          ) : null}
          {/* The ONE freshness grammar (11 §6.4): the AsOfChip carries
           * the hourly stamp + the cache qualifier; the market pill
           * rides beside it. The three old timestamp formats are GONE
           * (F-08's consolidation). */}
          <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1" data-prices-as-of={pricesCached ? 'cached' : 'fresh'}>
            <AsOfChip asOf={asOfText} cached={pricesCached} data-asof-chip="hero-prices" />
            {marketState !== null ? (
              <span
                className="inline-flex items-baseline gap-1 rounded-full bg-[var(--color-surface)] px-2 py-0.5 ring-1 ring-[var(--color-border)]"
                data-market-pill={marketState.open ? 'open' : 'closed'}
              >
                <span
                  aria-hidden="true"
                  className={`inline-block size-1.5 rounded-full ${marketState.open ? 'bg-[var(--color-status-normal)]' : 'bg-[var(--color-text-tertiary)]'}`}
                />
                <bdi className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                  {interpolate(t('pd.gold.marketPillLabel'), {
                    state: t(marketState.open ? 'pd.gold.marketPillOpen' : 'pd.gold.marketPillClosed'),
                    tz: marketState.tzLabel,
                  })}
                </bdi>
              </span>
            ) : null}
          </div>
        </div>

        {/* The briefing pair: the BriefingCard (the focal element) above
         * the CompositionStack (the conditions evidence layer). The stack
         * says the verdict ONCE — the hero never repeats it. */}
        <div className="flex min-w-0 flex-col gap-3">
          <BriefingCard hero={hero} verdictState={verdictState} onOpenRecord={onOpenRecord} />
          <CompositionStack hero={hero} verdictState={verdictState} verdictWord={verdictWord} />
        </div>
      </div>

      {/* GPE R31 / F12 — Zone C's collapsed Advanced control: the TIME
       * MACHINE over the readings archive, unchanged (the only
       * historical-meter surface; collapsed on desktop AND 390). */}
      <GoldTimeMachine />
    </section>
  );
}
