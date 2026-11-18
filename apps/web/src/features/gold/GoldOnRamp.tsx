/**
 * GoldOnRamp — GPE R20 / F4a (2026-11-18): the education on-ramp, Zone
 * D's third element (docs/specs/gold-page-elevation: s7/02 §1 the
 * five-driver architecture · s6/01 zone D · s6/03 zone D "F4 collapsed,
 * expands to an accordion" · s8/01 R20).
 *
 * THE ARCHITECTURE (s7/02, binding): the five drivers (Kitco's five —
 * the S7-D2 taxonomy), each a three-move paragraph — (i) the mechanism
 * in plain language, (ii) the honest limits (the chain's exception,
 * inline), (iii) the LIVE close: "Measured today by the {family}
 * family — {count} of the 37 factors, currently {laneWord}" — the count
 * and the lane word render from the SAME goldBalance() the hero reads
 * (the one-projection rule, s7/02 §1.6: never hand-copied into the
 * dictionary; a test pins them to the hero's own numbers).
 *
 * Driver 4 (central banks) closes DISPLAY-ONLY (its own section — the
 * governance asymmetry taught, not hidden). The two closing notes
 * (fuel-not-driver; the meter's governance) + the six-question FAQ tail
 * (the s7/02 §3 format decision) complete the on-ramp.
 *
 * The bracketed links of the reference drafts degrade honestly until
 * their waves: driver 3's currency grid points at the one non-USD price
 * card that exists today (gold-aud); driver 5's ETF-flows card rides
 * R23 (P3) — its mention stays plain text, never a dead link.
 *
 * Placement: collapsed accordion at every viewport (s6/01 zone D's
 * desktop default); session-only open state (the round-27 discipline).
 */

import { useMemo, useState } from 'react';
import type { IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { goldBalance } from '@currena/insights';
import type { GoldBalanceLane } from '@currena/insights';
import { ChevronDown } from 'lucide-react';
import { interpolate } from '../../shared/i18n';
import { useI18n } from '../../shared/lib/locale';
import type { TranslationKey } from '../../shared/lib/locale';
import { LANE_STATE_KEY, LANE_TITLE_KEY } from './GoldSeats';

/** One measuring-cards link: the label key + the href (card-level, the
 * #18 pattern; in-page anchors for this page's own surfaces). */
interface RampLink {
  key: TranslationKey;
  href: string;
}

/** The five drivers' static frames: name + body key + the lane each
 * closes at (driver 4 closes display-only). The per-driver link rows
 * ride the driver row (the drafts' bracketed links). */
const DRIVERS: ReadonlyArray<{
  n: 1 | 2 | 3 | 4 | 5;
  lane: 'borrowing-costs' | 'dollar' | 'stress' | 'inflation' | null;
  links: readonly RampLink[];
}> = [
  {
    n: 1,
    lane: 'borrowing-costs',
    links: [
      { key: LANE_TITLE_KEY['borrowing-costs'], href: '#lane-borrowing-costs' },
      { key: 'pd.usa.cardNames.real-yield-10y', href: '/usa#usa-card-real-yield-10y' },
      { key: 'pd.usa.cardNames.fed-expectations', href: '/usa#usa-card-fed-expectations' },
    ],
  },
  {
    n: 2,
    lane: 'inflation',
    links: [
      { key: LANE_TITLE_KEY.inflation, href: '#lane-inflation' },
      { key: 'pd.usa.cardNames.us-cpi-yoy', href: '/usa#usa-card-us-cpi-yoy' },
      { key: 'pd.usa.cardNames.breakeven-5y5y', href: '/usa#usa-card-breakeven-5y5y' },
    ],
  },
  {
    n: 3,
    lane: 'dollar',
    links: [
      { key: LANE_TITLE_KEY.dollar, href: '#lane-dollar' },
      { key: 'pd.currencies.standingCardNames.dollar-basket', href: '/currencies#currencies-card-dollar-basket' },
      // The currency-grid bracket's honest degrade (s7/02 §1.3): the one
      // non-USD price card that exists today, until R26's F10 grid.
      { key: 'pd.gold.cardNames.gold-aud', href: '#gold-card-gold-aud' },
    ],
  },
  {
    n: 4,
    lane: null, // display-only: the governance asymmetry taught (§2.8)
    links: [{ key: 'pd.gold.cbTitle', href: '#gold-zone-k' }],
  },
  {
    n: 5,
    lane: 'stress',
    links: [
      { key: LANE_TITLE_KEY.stress, href: '#lane-stress' },
      { key: 'pd.usa.cardNames.vix', href: '/usa#usa-card-vix' },
      // The ETF-flows card rides R23 (P3) — its mention stays plain text.
    ],
  },
];

/** The FAQ's six rows: question + answer keys + the close links. */
const FAQ: ReadonlyArray<{ q: TranslationKey; a: TranslationKey; links: readonly RampLink[] }> = [
  {
    q: 'pd.gold.faqQ1',
    a: 'pd.gold.faqA1',
    links: [
      { key: LANE_TITLE_KEY.inflation, href: '#lane-inflation' },
      { key: 'pd.usa.cardNames.breakeven-5y5y', href: '/usa#usa-card-breakeven-5y5y' },
    ],
  },
  {
    q: 'pd.gold.faqQ2',
    a: 'pd.gold.faqA2',
    links: [
      { key: 'pd.gold.yieldTitle', href: '#gold-zone-d' },
      { key: 'pd.gold.cbTitle', href: '#gold-zone-k' },
    ],
  },
  { q: 'pd.gold.faqQ3', a: 'pd.gold.faqA3', links: [{ key: 'pd.gold.cardNames.gold-aud', href: '#gold-card-gold-aud' }] },
  { q: 'pd.gold.faqQ4', a: 'pd.gold.faqA4', links: [{ key: 'pd.gold.honestTitle', href: '#gold-honest-record' }] },
  { q: 'pd.gold.faqQ5', a: 'pd.gold.faqA5', links: [{ key: 'pd.gold.bridgeTitle', href: '#gold-zone-f' }] },
  { q: 'pd.gold.faqQ6', a: 'pd.gold.faqA6', links: [{ key: 'pd.gold.lanesTitle', href: '#gold-seats' }] },
];

/** The two closing notes: their own link rows. */
const NOTE_FUEL_LINKS: readonly RampLink[] = [
  { key: LANE_TITLE_KEY.flows, href: '#lane-flows' },
  { key: 'pd.gold.positionsTitle', href: '#gold-positions' },
];
const NOTE_GOV_LINKS: readonly RampLink[] = [
  { key: 'pd.gold.taTitle', href: '#gold-ta' },
  { key: 'pd.gold.honestTitle', href: '#gold-honest-record' },
];

export function GoldOnRamp({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  // Round 27's discipline: collapsed by default, the choice session-only
  // (a persisted collapse made content look deleted).
  const [open, setOpen] = useState(false);

  // The LIVE closes (s7/02 §1.6): the same goldBalance() the hero reads —
  // the counts and the lane words are the projection's own, never
  // hand-copied (the one-projection rule; pinned by test).
  const balance = useMemo(() => goldBalance(readings), [readings]);
  const laneStateWord = (lane: GoldBalanceLane): string => {
    if (lane.split === true) {
      return interpolate(t('pd.gold.laneStateSplit'), {
        supports: formatNumber(lane.supports, numberLocale, { maximumFractionDigits: 0 }),
        pressures: formatNumber(lane.pressures, numberLocale, { maximumFractionDigits: 0 }),
      });
    }
    return t(LANE_STATE_KEY[lane.side]);
  };
  const laneOf = (lane: 'borrowing-costs' | 'dollar' | 'stress' | 'inflation'): GoldBalanceLane | undefined =>
    balance.lanes.find((l) => l.lane === lane);

  /** One driver row: the name + the three-move body (the close
   * interpolated with the LIVE count + lane word) + the links. */
  const driverRow = (driver: (typeof DRIVERS)[number]): React.JSX.Element => {
    const lane = driver.lane !== null ? laneOf(driver.lane) : undefined;
    const body = lane !== undefined
      ? interpolate(t(`pd.gold.driverBody${driver.n}` as TranslationKey), {
          count: formatNumber(lane.members.length, numberLocale, { maximumFractionDigits: 0 }),
          laneWord: laneStateWord(lane),
        })
      : t(`pd.gold.driverBody${driver.n}` as TranslationKey);
    return (
      <li key={driver.n} data-onramp-driver={driver.n} className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-sm)] bg-currena-soft/40 p-2.5 ring-1 ring-[var(--color-border)]/60 sm:p-3">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
          {t(`pd.gold.driverName${driver.n}` as TranslationKey)}
        </h4>
        <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
          <bdi>{body}</bdi>
        </p>
        {driver.links.length > 0 ? (
          <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[length:var(--type-caption)]">
            <span className="font-semibold text-[var(--color-text-tertiary)]">{t('pd.gold.onRampSeeCards')}</span>
            {driver.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline"
              >
                {t(link.key)}
              </a>
            ))}
          </p>
        ) : null}
      </li>
    );
  };

  return (
    <section
      id="gold-onramp"
      aria-labelledby="gold-onramp-title"
      data-gold-onramp
      className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3.5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 id="gold-onramp-title" className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {t('pd.gold.onRampTitle')}
          </h3>
          <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
            {t('pd.gold.onRampSubtitle')}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="gold-onramp-body"
          onClick={() => setOpen(!open)}
          className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[length:var(--type-caption)] font-bold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
          data-onramp-toggle
        >
          <span aria-hidden="true">
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? '' : '-rotate-90 rtl:rotate-90'}`}
            />
          </span>
          {open ? t('pd.gold.onRampHide') : t('pd.gold.onRampShow')}
        </button>
      </header>

      {open ? (
        <div id="gold-onramp-body" className="flex flex-col gap-2.5">
          {/* The five drivers — one row each (the 390 accordion rule). */}
          <ol className="m-0 flex list-none flex-col gap-2 p-0">{DRIVERS.map(driverRow)}</ol>

          {/* The two closing notes (s7/02 §1.7–§1.8). */}
          <div className="flex flex-col gap-2">
            <div data-onramp-note="fuel" className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-sm)] bg-currena-soft/40 p-2.5 ring-1 ring-[var(--color-border)]/60 sm:p-3">
              <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
                {t('pd.gold.noteFuelTitle')}
              </h4>
              <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                <bdi>{t('pd.gold.noteFuelBody')}</bdi>
              </p>
              <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[length:var(--type-caption)]">
                {NOTE_FUEL_LINKS.map((link) => (
                  <a key={link.href} href={link.href} className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline">
                    {t(link.key)}
                  </a>
                ))}
              </p>
            </div>
            <div data-onramp-note="governance" className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-sm)] bg-currena-soft/40 p-2.5 ring-1 ring-[var(--color-border)]/60 sm:p-3">
              <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
                {t('pd.gold.noteGovTitle')}
              </h4>
              <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                <bdi>{t('pd.gold.noteGovBody')}</bdi>
              </p>
              <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[length:var(--type-caption)]">
                {NOTE_GOV_LINKS.map((link) => (
                  <a key={link.href} href={link.href} className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline">
                    {t(link.key)}
                  </a>
                ))}
              </p>
            </div>
          </div>

          {/* The FAQ tail (the s7/02 §3 format decision: the on-ramp's
           * tail sub-section, six questions, each answer ≤3 sentences). */}
          <div className="flex flex-col gap-1.5">
            <h4 className="m-0 text-[length:var(--type-label)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
              {t('pd.gold.faqTitle')}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {FAQ.map((row, i) => (
                <li key={i} data-onramp-faq={i + 1} className="flex min-w-0 flex-col gap-0.5">
                  <h5 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
                    {t(row.q)}
                  </h5>
                  <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                    <bdi>{t(row.a)}</bdi>
                  </p>
                  <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[length:var(--type-caption)]">
                    {row.links.map((link) => (
                      <a key={link.href} href={link.href} className="insights-focusable font-semibold text-currena-blue underline-offset-2 hover:underline">
                        {t(link.key)}
                      </a>
                    ))}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
