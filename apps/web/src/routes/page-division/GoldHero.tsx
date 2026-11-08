/**
 * GoldHero — the Gold page's hero (page-division S5, 2026-11-08 — spec §5
 * item 1 / D-26): the live gold price (the hourly overlay + 10-year
 * context) beside the Balance Scale verdict (the beam, the verdict word,
 * the 7-state outlook, the for/against/neutral/unread counts).
 *
 * Every value is a DISPLAY of the pure derivations in gold-tiles.ts —
 * the SAME engines the legacy card's BalanceScale, the Global Gold
 * Balance tile and the runner read (goldBalance + goldOutlookOf +
 * evaluateSignal + balanceTilt/balanceVerdictOf imported, never
 * restated). Nothing is invented: a missing price says so; a sparse
 * balance keeps the beam level with the not-enough word (UI-40); the
 * day change wears its VISIBLE window tag (BD-S4a — change1d when the
 * live entry carries it, else the labelled 7-day change).
 *
 * Copy arrives via the app dictionary's pd.gold.* keys; the verdict
 * words are pinned byte-for-byte to the insights corpus by
 * gold-copy-pin.test.ts; generic page words reuse pd.global's pinned
 * keys. The beam glyph is decorative geometry (role="img" + the corpus's
 * own gauge aria) — the verdict word and counts carry the meaning,
 * colour and geometry never alone.
 *
 * S6 (BD-S6a, 2026-11-08): the balance block's visual ALTERNATES — the
 * previous shape of the gold balance (the classic view: the brass
 * stage + lane weights + the not-leaning tray, rendered SMALLER through
 * the extracted BalanceStage/BalanceTray) ↔ the S5 minimal beam glyph —
 * a real radio group, the classic view the default, the choice persisted
 * (currena:pd:gold:balance-view). The verdict word, the 7-state outlook,
 * the counts and the context line render in BOTH views — they are the
 * engine's words, not the drawing's.
 */

import { useState } from 'react';
import type { IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { GoldHeroModel } from './gold-tiles';
import { GOLD_DISPLAY, goldHeroCounts, goldHeroTilt, goldHeroVerdict, goldHeroVerdictState } from './gold-tiles';
import { GoldBalanceClassic } from './GoldBalanceClassic';

/* S6 (BD-S6a): the hero's balance-view alternation — the previous brass
 * balance shape (the classic view, rendered smaller) ↔ the S5 minimal
 * beam glyph. The choice persists per visitor (the theme pattern); the
 * DEFAULT is the classic shape — the owner's ask — and a fresh visitor
 * meets the drawing they know from the legacy card. */
type BalanceView = 'classic' | 'minimal';
const BALANCE_VIEW_KEY = 'currena:pd:gold:balance-view';

function readStoredView(): BalanceView {
  try {
    return window.localStorage.getItem(BALANCE_VIEW_KEY) === 'minimal' ? 'minimal' : 'classic';
  } catch {
    return 'classic';
  }
}

function storeView(view: BalanceView): void {
  try {
    window.localStorage.setItem(BALANCE_VIEW_KEY, view);
  } catch {
    /* a full or blocked store never blocks the view swap */
  }
}

/* The outlook word + tone maps — the GlobalBoard tile's own (the words
 * ride pd.global's corpus-pinned keys; the inks mirror verdict.tsx's
 * verdictTone mapping, restated for the lean chunk). */
const OUTLOOK_WORD_KEY = {
  'strong-bullish': 'pd.global.outlookStrongBullish',
  bullish: 'pd.global.outlookBullish',
  neutral: 'pd.global.outlookNeutral',
  'range-bound': 'pd.global.outlookRangeBound',
  bearish: 'pd.global.outlookBearish',
  'strong-bearish': 'pd.global.outlookStrongBearish',
  mixed: 'pd.global.outlookMixed',
} as const;

const OUTLOOK_TONE: Record<string, string> = {
  'strong-bullish': 'text-[var(--color-status-normal)]',
  bullish: 'text-[var(--color-status-normal)]',
  'strong-bearish': 'text-[var(--color-status-alert)]',
  bearish: 'text-[var(--color-status-alert)]',
};

const VERDICT_WORD_KEY = {
  for: 'pd.gold.heroVerdictFor',
  balanced: 'pd.gold.heroVerdictBalanced',
  against: 'pd.gold.heroVerdictAgainst',
  none: 'pd.gold.heroVerdictNone',
} as const;

const VERDICT_TONE: Record<string, string> = {
  for: 'text-[var(--color-status-normal)]',
  against: 'text-[var(--color-status-alert)]',
};

/** A signed percent, the GlobalBoard sign convention (+ / − U+2212 over
 *  the abs value, inside a dir="ltr" island so RTL never scatters it). */
function signedPct(change: number, numberLocale: 'en-US' | 'fa-IR', decimals = 2): string {
  const num = formatNumber(Math.abs(change), numberLocale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = change > 0 ? '+' : change < 0 ? '−' : '';
  return `${sign}${num}%`;
}

/** The position band word — the corpus's own band vocabulary over the
 *  reading's percentile, the legacy collapsed-line's OWN convention
 *  (high → top {100−p}%, low → bottom {p}%, else the middle). */
function bandWord(percentile: number, t: ReturnType<typeof useI18n>['t'], numberLocale: 'en-US' | 'fa-IR'): string {
  if (percentile > 0.8) return interpolate(t('pd.gold.bandTop'), { p: formatNumber(Math.round((1 - percentile) * 100), numberLocale) });
  if (percentile < 0.2) return interpolate(t('pd.gold.bandBottom'), { p: formatNumber(Math.round(percentile * 100), numberLocale) });
  return t('pd.gold.bandMid');
}

/* ------------------------------------------------------------------ *
 * The beam glyph — decorative geometry driven by the BalanceScale's OWN
 * tilt math (goldHeroTilt: |net| ÷ (for+against) × 10°, floor 3°, level
 * at net 0). The for pan sits at the reading's start side; the heavy
 * side dips. role="img" with the corpus's gauge aria sentence — the
 * verdict word beside it carries the meaning (geometry never alone).
 * ------------------------------------------------------------------ */

function BeamGlyph({ angleDeg, heavy }: { angleDeg: number; heavy: 'for' | 'against' | null }): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  // The visual rotation: the heavy side's end dips. The for pan sits at
  // the beam's start side (left in LTR); in RTL the whole drawing mirrors
  // (the legacy drawing's own rule) so the heavy end still dips toward
  // the reading's start side.
  const signed = heavy === 'for' ? -angleDeg : angleDeg;
  const rtl = locale === 'fa';
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  const verdictWord =
    heavy === null ? '' : heavy === 'for' ? t('pd.gold.heroVerdictFor') : t('pd.gold.heroVerdictAgainst');
  const aria = interpolate(t('pd.gold.heroBeamAria'), {
    n: num(angleDeg),
    verdict: heavy === null ? t('pd.gold.heroVerdictBalanced') : verdictWord,
  });
  return (
    <svg
      viewBox="0 0 120 46"
      role="img"
      aria-label={aria}
      className="h-[46px] w-[120px] shrink-0 text-[var(--color-text-secondary)]"
      data-hero-beam
      data-hero-beam-angle={angleDeg}
    >
      <g transform={rtl ? 'scale(-1,1) translate(-120,0)' : undefined}>
        {/* The beam group: bar + pivot + needle, rotated about the pivot
         * by the engine's own tilt angle (level at net 0 / nothing
         * readable — UI-40 keeps the honest level beam). */}
        <g transform={`rotate(${signed} 60 12)`}>
          <line x1="16" y1="12" x2="104" y2="12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          {/* The needle fixed to the pivot, pointing down — the legible
           * cue the legacy v7 drawing uses. */}
          <line x1="60" y1="12" x2="60" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </g>
        <circle cx="60" cy="12" r="4.5" fill="currentColor" />
        {/* The pans hang plumb from the beam ends: translate only, by the
         * joint's vertical displacement (risePx = endDrop ÷ 2). */}
        <g transform={`translate(0 ${(angleDeg / 10) * 7})`}>
          <line x1="16" y1="12" x2="16" y2="22" stroke="currentColor" strokeWidth="1" />
          <path d="M8 22 H24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <g transform={`translate(0 ${(-angleDeg / 10) * 7})`}>
          <line x1="104" y1="12" x2="104" y2="22" stroke="currentColor" strokeWidth="1" />
          <path d="M96 22 H112" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * The hero
 * ------------------------------------------------------------------ */

export function GoldHero({
  hero,
  pricesAsOf,
}: {
  hero: GoldHeroModel;
  /** The projection's pricesAsOf stamp (the hourly live-prices clock). */
  pricesAsOf: string | undefined;
}): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();
  const num = (n: number, decimals = 0): string => formatNumber(n, numberLocale, { maximumFractionDigits: decimals });
  /* The balance-view alternation (BD-S6a). */
  const [view, setViewState] = useState<BalanceView>(readStoredView);
  const setView = (next: BalanceView): void => {
    setViewState(next);
    storeView(next);
  };

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

  const counts = goldHeroCounts(hero);
  const verdict = goldHeroVerdict(hero);
  const verdictState = goldHeroVerdictState(hero);
  const tilt = goldHeroTilt(hero);
  // UI-40 (the BalanceScale's own rule): fewer than 3 readable lanes is
  // not a reading — the beam stays level and the honest not-enough word
  // speaks (readable 0 keeps the stronger can't-read word).
  const sparse = counts.readable < 3;
  const verdictWordKey =
    verdictState === 'none' ? 'pd.gold.heroVerdictNone' : verdictState === 'not-enough' ? 'pd.gold.heroNotEnough' : VERDICT_WORD_KEY[verdictState];
  const verdictTone = sparse ? 'text-[var(--color-text-tertiary)]' : VERDICT_TONE[verdict] ?? 'text-[var(--color-text-primary)]';

  // The counts line: for + against ALWAYS render (zeros included — the
  // strip shows the shape, the counts state it); not-leaning and unread
  // only when > 0 (the GB-S4 §4.4 rule).
  const countsParts = [
    interpolate(t('pd.gold.heroCountFor'), { n: num(counts.for) }),
    interpolate(t('pd.gold.heroCountAgainst'), { n: num(counts.against) }),
    ...(counts.neutral > 0 ? [interpolate(t('pd.gold.heroCountNotLeaning'), { n: num(counts.neutral) })] : []),
    ...(counts.unread > 0 ? [interpolate(t('pd.gold.heroCountUnread'), { n: num(counts.unread) })] : []),
  ].join(' · ');

  const pricesText =
    pricesAsOf !== undefined
      ? locale === 'fa'
        ? `${new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(pricesAsOf))} UTC`
        : `${new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(pricesAsOf))} UTC`
      : null;

  const positionLine =
    hero.position !== null
      ? interpolate(t('pd.gold.heroPositionLine'), { band: bandWord(hero.position.percentile, t, numberLocale) })
      : null;

  // Gold's own 30-day move — CONTEXT, never counted (01 §6): shown under
  // the balance block only when the reading carries it.
  const contextLine =
    hero.speed !== null && Number.isFinite(hero.speed)
      ? interpolate(t('pd.gold.heroContextLine'), { change: signedPct(hero.speed, numberLocale) })
      : null;

  return (
    <section
      aria-label={t('pd.gold.heroHeading')}
      data-gold-hero
      className="rounded-[var(--radius-lg)] bg-gradient-to-b from-[var(--color-accent-gold)]/[0.14] via-[var(--color-accent-gold)]/[0.06] to-transparent p-3.5 ring-2 ring-[var(--color-accent-gold)]/40 sm:p-4 lg:p-5"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(280px,2fr)_3fr] lg:gap-6">
        {/* ---------- the live price block (D-26: hourly overlay + 10-year context) ---------- */}
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
            {t('pd.gold.cardNames.gold-usd')}
          </h2>
          {valueText !== null ? (
            <p className="m-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-3xl font-extrabold leading-none tabular-nums text-[var(--color-text-primary)] sm:text-4xl">
                {locale === 'fa' ? `${valueText} ${t('pd.gold.unitUsd')}` : `${t('pd.gold.unitUsd')}${valueText}`}
              </bdi>
              {change !== undefined ? (
                <bdi dir="ltr" className={`text-[length:var(--type-label)] font-bold tabular-nums ${changeTone}`}>
                  {signedPct(change, numberLocale)}
                  <span className="ms-0.5 font-semibold text-[var(--color-text-tertiary)]" aria-hidden="true">
                    {interpolate(t('pd.global.ribbonWindowTag'), { days: num(changeDays) })}
                  </span>
                  <span className="sr-only">
                    {' '}
                    {changeDays === 1 ? t('pd.global.changeOver1d') : interpolate(t('pd.global.changeOver'), { days: num(changeDays) })}
                  </span>
                </bdi>
              ) : null}
            </p>
          ) : (
            <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">{t('pd.global.cannotRead')}</p>
          )}
          {/* The 10-year context line (the position band of the decade). */}
          {positionLine !== null ? (
            <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
              <bdi>{positionLine}</bdi>
            </p>
          ) : null}
          {pricesText !== null ? (
            <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]">
              <bdi>{interpolate(t('pd.global.pricesAsOf'), { time: pricesText })}</bdi>
            </p>
          ) : null}
        </div>

        {/* ---------- the balance block (the Balance Scale verdict + outlook + counts) ---------- */}
        <div className="flex min-w-0 flex-col gap-2">
          <h2 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
            {t('pd.gold.heroHeading')}
          </h2>
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">{t('pd.gold.heroSubtitle')}</p>
          {/* The view alternation (BD-S6a): the previous shape (the brass
           * balance, smaller — the classic view) ↔ the new proposed minimal
           * glyph. A real radio group: native arrow-key walking, the group
           * labelled, each option's label its own words. */}
          <fieldset className="m-0 border-0 p-0" data-hero-balance-view={view}>
            <legend className="sr-only">{t('pd.gold.heroViewLabel')}</legend>
            <div className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-surface)] p-0.5 ring-1 ring-[var(--color-border)]">
              <input
                type="radio"
                id="gold-balance-view-classic"
                name="gold-balance-view"
                className="peer sr-only"
                checked={view === 'classic'}
                onChange={() => setView('classic')}
              />
              <label
                htmlFor="gold-balance-view-classic"
                className="min-h-[32px] cursor-pointer rounded-full px-3 py-1 text-[length:var(--type-caption)] font-semibold leading-normal text-[var(--color-text-secondary)] ring-2 ring-transparent motion-safe:transition-colors peer-checked:bg-[var(--color-accent-gold)]/15 peer-checked:font-bold peer-checked:text-[var(--color-text-primary)] peer-focus-visible:ring-[var(--color-accent-gold)]"
              >
                {t('pd.gold.heroViewClassic')}
              </label>
              <input
                type="radio"
                id="gold-balance-view-minimal"
                name="gold-balance-view"
                className="peer sr-only"
                checked={view === 'minimal'}
                onChange={() => setView('minimal')}
              />
              <label
                htmlFor="gold-balance-view-minimal"
                className="min-h-[32px] cursor-pointer rounded-full px-3 py-1 text-[length:var(--type-caption)] font-semibold leading-normal text-[var(--color-text-secondary)] ring-2 ring-transparent motion-safe:transition-colors peer-checked:bg-[var(--color-accent-gold)]/15 peer-checked:font-bold peer-checked:text-[var(--color-text-primary)] peer-focus-visible:ring-[var(--color-accent-gold)]"
              >
                {t('pd.gold.heroViewMinimal')}
              </label>
            </div>
          </fieldset>
          {view === 'classic' ? (
            /* The PREVIOUS shape, smaller (the owner's S6 ask): the brass
             * stage + the lane weights + the not-leaning tray — the same
             * drawing the legacy card renders, at the s-size metrics. The
             * verdict word rides its own row above the instrument. */
            <>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[length:var(--type-caption)] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {t('pd.gold.heroVerdictEyebrow')}
                </span>
                <span className={`type-verdict text-xl font-bold leading-tight sm:text-2xl ${verdictTone}`} data-hero-verdict={sparse ? 'sparse' : verdict}>
                  {t(verdictWordKey)}
                </span>
              </div>
              <GoldBalanceClassic hero={hero} />
            </>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <BeamGlyph angleDeg={sparse ? 0 : tilt.angleDeg} heavy={sparse ? null : tilt.heavy} />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[length:var(--type-caption)] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
                  {t('pd.gold.heroVerdictEyebrow')}
                </span>
                <span className={`type-verdict text-xl font-bold leading-tight sm:text-2xl ${verdictTone}`} data-hero-verdict={sparse ? 'sparse' : verdict}>
                  {t(verdictWordKey)}
                </span>
              </div>
            </div>
          )}
          <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="sr-only">{t('pd.global.goldOutlookLabel')}: </span>
            {hero.outlook !== null ? (
              <span className={`text-[length:var(--type-label)] font-bold leading-tight ${OUTLOOK_TONE[hero.outlook] ?? 'text-[var(--color-text-primary)]'}`} data-hero-outlook={hero.outlook}>
                {t(OUTLOOK_WORD_KEY[hero.outlook])}
              </span>
            ) : (
              <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">{t('pd.global.cannotRead')}</span>
            )}
            <bdi className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">{countsParts}</bdi>
          </p>
          {contextLine !== null ? (
            <p className="m-0 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/70 px-2.5 py-1.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-balance-context-line>
              <bdi>{contextLine}</bdi>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
