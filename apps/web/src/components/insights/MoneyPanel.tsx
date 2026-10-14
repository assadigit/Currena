/**
 * MoneyPanel — round-2 Block R11: "What it means for my money" (slim).
 *
 * At most FOUR lines, one per life area, chosen by the worst tier among the
 * area's indicators (needs attention first, then unusual). Each line: icon,
 * area name, one hedged sentence from the copy corpus keyed by area × state,
 * and one or two supporting chips with live values that open the cards.
 * No signal anywhere → one calm line. No advice, no buy/sell.
 *
 * Round 25 (owner): under every area name sits a STATED ESTIMATION —
 * arrow + word — computed from the driver readings by
 * config.moneyAreaDirection (band breaches, big moves, 10-year extremes
 * through per-driver semantics). Round 26 (owner wording): the words
 * describe the COST, not the bare direction — "will go up" next to red
 * ink read misleading. Cost areas say "Becoming more expensive /
 * Getting cheaper"; savings says "Earning more interest / Earning
 * less" (up is the good case there). The ink stays VALENCE-coded
 * (green = good for your money, red = pressure on it) — see the
 * round-25 block comment in config.ts.
 */

import type { CSSProperties } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { IconImg, moneyAreaIconUrl } from '../icons/currena';
import {
  formatIndicatorValue,
  moneyAreaDirection,
  moneyDirectionToneClass,
  moneyPanel,
  type MoneyAreaId,
  type MoneyDirection, definitionFor } from './config';
import { TREND_RANGE_COPY_KEY, TrendPanel, trendTickFormatter } from './TrendChart';

/** The area icons — rendered INSIDE a large tinted box. Owner follow-up
 * 11 Oct: "increase the icon size, something visible like 64×64" → round
 * 29 (owner): "the icons are too small — a few times larger on desktop,
 * relatively larger on mobile." The box is now 64px on mobile and 96px
 * on ≥640px screens (the artwork inside 52px → 80px — twice the old
 * desktop size; this is the panel the owner calls the app's most
 * important). Round 28 (owner): the stroke pictograms give way to the
 * owner's own artwork wherever one exists — fuel nozzle, bills, housing,
 * the rising exchange chart, the globe. "Jobs" has no artwork yet and
 * keeps its stroke briefcase. The box stays the neutral context tint —
 * the icons are NOT colour-coded (red belongs to the needs-attention
 * word). */
function AreaIcon({ area }: { area: MoneyAreaId }) {
  const icon = moneyAreaIconUrl(area);
  if (icon !== null) return <IconImg src={icon} size={52} desktopSize={80} />;
  // jobs — the one area without artwork (round 28): the stroke briefcase.
  return (
    <svg
      className="currena-icon shrink-0"
      style={{
        '--icon-size': '52px',
        '--icon-size-sm': '80px',
      } as CSSProperties}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
    >
      <rect x="3" y="6" width="10" height="7" rx="1.2" />
      <path d="M6 6V4.6A1.6 1.6 0 0 1 7.6 3h.8A1.6 1.6 0 0 1 10 4.6V6" />
    </svg>
  );
}

/** The estimation arrows — same glyphs as the metals VerdictStrip
 * (round 23): up, down, and the flat dash. Round 29 (owner): the
 * estimation is the panel's headline answer — the arrow grows from a
 * 16px squiggle to 20px mobile / 24px desktop so the word + arrow read
 * at the row's own scale. aria-hidden — the word beside it carries the
 * meaning (never colour alone, G5). */
function DirectionIcon({ direction }: { direction: MoneyDirection }) {
  const common = {
    className: 'currena-icon shrink-0',
    style: {
      '--icon-size': '20px',
      '--icon-size-sm': '24px',
    } as CSSProperties,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  if (direction === 'up') {
    return (
      <svg {...common}>
        <path d="M8 13V3.5" />
        <path d="M3.5 8 8 3.5 12.5 8" />
      </svg>
    );
  }
  if (direction === 'down') {
    return (
      <svg {...common}>
        <path d="M8 3v9.5" />
        <path d="M3.5 8 8 12.5 12.5 8" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M3 8h10" />
    </svg>
  );
}

/** Round 34 (owner): the money row's own MINI chart — the exact same
 * structure as the metals' Estimation charts (shared TrendPanel: X/Y
 * axes, hover value/date inspector, quarter · 1 year · 5 years chips,
 * signed window delta), just shorter (plot h-16). Round 35 (owner):
 * "graphs too big — only 50% of the card width, 50% other data and
 * context" → the chart owns HALF the row (the grid's second column,
 * next to the data half, never full-width again). It charts the row's
 * FIRST chip — the indicator actually making this row speak — so the
 * picture and the sentence can never disagree. */
function MoneyTrend({
  id,
  copy,
  numberLocale,
}: {
  id: IndicatorId;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  return (
    <TrendPanel
      id={id}
      copy={copy}
      numberLocale={numberLocale}
      /* Fix spec B-17: rate charts speak in points — a home-loan chart never
       * shows "+12.7%" for a 0.8-point move. */
      deltaKind={definitionFor(id).changeKind}
      /* Round 43 (owner): "the default time frame for this section must
       * be annual" — the money rows' charts open on the 1-year window
       * (the metals' Estimation charts keep their quarter default). */
      defaultRange="1y"
      ariaLabelFor={(range) =>
        interpolate(copy.ui.trendChartAria, {
          name: copy.indicators[id].name,
          range: copy.ui[TREND_RANGE_COPY_KEY[range]],
        })
      }
      formatValue={(v) => formatIndicatorValue(id, v, numberLocale, copy.units)}
      formatTickValue={trendTickFormatter(numberLocale)}
      plotHeightClass="h-16"
      rangeGroupData={{ 'data-money-chart-range': id }}
      deltaData={{ 'data-money-chart-delta': id }}
    />
  );
}

export function MoneyPanel({
  readings,
  copy,
  numberLocale,
  onFocusCard,
}: {
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}) {
  const rows = moneyPanel(readings);
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  /* Round 36 (owner): each supporting number shows ONCE across the panel.
   * The owner's question — "why do both boxes show «قیمت‌های استرالیا
   * نسبت به سال قبل», is this correct?" — the answer: savings AND shop
   * both legitimately read Australia CPI (config MONEY_AREAS lists it for
   * both), so when CPI leaves its usual range BOTH rows pick it as their
   * first driver. Correct per the data, but the same chip twice read as
   * duplication. The fix is display-level: the later row falls through to
   * its NEXT driver (shop → underlying inflation). If every chip was
   * already shown, the row re-shows its own — a row never loses its
   * number or its chart. */
  const shownChipIds = new Set<string>();

  return (
    /* Round 29 (owner): "what it means for my money … this is one of the
     * most important sections — needs more contrast and visual weight.
     * Different bg, color, shadow or anything else." → the panel gets the
     * app's FOCAL treatment: the brand-gold gradient field (round 24 made
     * gold the one focal accent), a 2px gold ring, a soft gold-tinted
     * shadow, and its own padding so the white rows inside sit ON the
     * tinted field — the wrapper vs the rows IS the contrast. Dark mode
     * keeps the same gradient logic with a deeper shadow. The white rows
     * and their plain rings stay untouched — the wrapper carries the
     * weight, the rows keep the readable surface. */
    <section
      id="insights-money"
      aria-labelledby="insights-money-title"
      className="scroll-mt-24 rounded-[var(--radius-lg)] bg-gradient-to-b from-[var(--color-accent-gold)]/[0.16] via-[var(--color-accent-gold)]/[0.07] to-transparent p-3.5 shadow-[0_10px_34px_rgba(168,126,28,0.15)] ring-2 ring-[var(--color-accent-gold)]/45 sm:p-4 dark:shadow-[0_14px_44px_rgba(0,0,0,0.45)]"
    >
      <h2 id="insights-money-title" className="type-section m-0 mb-1">
        {copy.money.title}
      </h2>
      <p className="m-0 mb-3 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.money.subtitle}
      </p>

      {rows.length === 0 ? (
        <p className="m-0 rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {copy.money.calmLine}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {rows.map(({ area, state, chipIds }) => {
            const areaCopy = copy.money.areas[area];
            const sentence = state === 'attention' ? areaCopy.attention : state === 'unusual' ? areaCopy.unusual : areaCopy.calm;
            // Fix spec B-18 (2026-10-14): the savings row carries the REAL
            // return — the new term-deposit rate minus yearly inflation
            // (a condition, before tax; never advice).
            const realReturn =
              area === 'savings'
                ? (() => {
                    const deposit = byId.get('au-deposit-rate');
                    const cpi = byId.get('au-cpi');
                    if (
                      deposit !== undefined &&
                      deposit.value !== null &&
                      cpi !== undefined &&
                      cpi.value !== null
                    ) {
                      const points = deposit.value - cpi.value;
                      const realText = `${points > 0 ? '+' : ''}${formatNumber(points, numberLocale, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}`;
                      return interpolate(copy.money.realReturn, {
                        deposit: formatIndicatorValue('au-deposit-rate', deposit.value, numberLocale, copy.units),
                        inflation: formatIndicatorValue('au-cpi', cpi.value, numberLocale, copy.units),
                        real: realText,
                      });
                    }
                    return null;
                  })()
                : null;
            const m = copy.money;
            const direction = moneyAreaDirection(area, readings, copy);
            // Round 26: the words follow the area's valence — cost areas
            // speak in prices, savings speaks in the interest it earns.
            const words = area === 'savings' ? m.direction.savings : m.direction.cost;
            const directionWord =
              direction === 'up' ? words.up : direction === 'down' ? words.down : words.flat;
            const directionTone = moneyDirectionToneClass(area, direction);
            // Round 36 (owner): dedupe across rows (see the shownChipIds
            // note above) — the row's lines ride its first NOT-yet-shown
            // chip, and the chart follows the SAME number (picture and
            // number can never disagree).
            const freshChips = chipIds.filter((id) => !shownChipIds.has(id));
            const lineChips = freshChips.length > 0 ? freshChips : chipIds;
            lineChips.forEach((id) => shownChipIds.add(id));
            return (
              /* Round 35 (owner): "graphs too big — must only contain 50%
               * of the card width, 50% other data and context" → the row
               * is a 50/50 GRID: column 1 (inline-start) = the data half
               * (icon + name/direction, sentence, chips), column 2 = the
               * chart half. sm:grid-cols-2 makes the split EXACT and
               * equal in every row — the divider and the chart's left
               * edge sit at the same x in all four rows BY STRUCTURE
               * (the alignment decree), not by luck. In fa/RTL the data
               * half lands on the right and the chart on the left (the
               * owner's [graph | data] sketch); in en it mirrors — the
               * same label-start/chart-end pattern the metals' strip
               * already uses. Stacked full-width on phones (<sm). */
              <li
                key={area}
                data-money-area={area}
                data-money-state={state}
                className={`flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3.5 ring-1 ring-[var(--color-border)]${
                  chipIds.length > 0 ? ' sm:grid sm:grid-cols-2 sm:gap-4' : ''
                }`}
              >
                {/* The DATA half — 50%: icon + name/direction on the first
                 * line, then the ROUND-36 VALUE LINES, then the sentence.
                 * Owner follow-up (11 Oct): the icon is a VISIBLE
                 * instrument, not a 16px squiggle — round 29 (owner): the
                 * box grows to 64px on mobile / 96px on desktop with the
                 * artwork at 52/80 inside it. A tinted square keeps it
                 * designed, not decorative. */}
                <div className="flex min-w-0 flex-col gap-2.5">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-16 w-16 shrink-0 place-items-center rounded-[var(--radius-md)] bg-currena-soft/70 ring-1 ring-[var(--color-border)] sm:h-24 sm:w-24"
                    >
                      <span className={moneyAreaIconUrl(area) !== null ? '' : 'text-[var(--color-status-context)]'}>
                        <AreaIcon area={area} />
                      </span>
                    </span>
                    {/* R30 alignment, kept + round 37/38 (owner): the whole
                     * supporting stack lives in ONE column beside the FIXED
                     * icon box — name, direction word, then the value — so
                     * the name, the direction word AND the value start at
                     * the same x in every row, and the value fills the space
                     * that used to sit empty under the direction word (the
                     * owner drew a red rectangle exactly there: "move the
                     * text to inside the approx red rectangle"). Round 38
                     * (owner): 28/29px shouted — "now they're too big, make
                     * them proportional": the heading steps down to 1.5×
                     * the body and the value back to the page's number role,
                     * so the column reads heading → estimation → number at
                     * calm ratios (21 → 14 body, value 23.2 still the
                     * biggest line). The sentence below still starts at the
                     * half's edge in every row. The icon box is always the
                     * neutral context ink — red belongs to the
                     * needs-attention WORD only (round 24, roast #4: the
                     * area label is NEUTRAL). */}
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5 text-[var(--color-text-primary)]">
                      {/* Round 37 (owner) then 38 (owner): the area name is
                       * the row's HEADING — "make the headings such as
                       * «پس‌انداز و بهره» 100% bigger" produced 2× (28px);
                       * "now they're too big, make them proportional" →
                       * 1.5× the label role (14px → 21px), still bold. */}
                      <span className="text-[length:calc(var(--type-label)*1.5)] font-bold leading-snug">
                        {areaCopy.name}
                      </span>
                      {/* Round 25 (owner): the stated estimation, directly under
                       * the area name — arrow + word in valence ink, computed
                       * from the driver readings (moneyAreaDirection). */}
                      <span
                        data-money-direction={direction}
                        className={`flex items-center gap-1.5 leading-snug ${directionTone}`}
                      >
                        <DirectionIcon direction={direction} />
                        <span className="text-[length:var(--type-label)] font-bold">{directionWord}</span>
                      </span>
                      {/* Round 36 (owner): the supporting numbers moved out of
                       * the pill chip into plain text — value first, big and
                       * bold; indicator name after it, smaller and regular.
                       * Round 37 (owner): the line moved UP into the name/
                       * direction column and the value grew to 29px. Round 38
                       * (owner): "now they're too big, make them
                       * proportional" → the value returns to the page's
                       * number role (type-number: 23.2px / 800 / tabular —
                       * the attention tiles' role, still the biggest line in
                       * the column, and the size the owner approved in
                       * round 36). Value FIRST in the DOM → rightmost in fa,
                       * leftmost in en. The line still opens the
                       * indicator's card. */}
                      {lineChips.length > 0 ? (
                        <span className="flex flex-col items-start gap-1">
                          {lineChips.map((id) => {
                            const r = byId.get(id);
                            const valueText =
                              r && r.value !== null ? formatIndicatorValue(id, r.value, numberLocale, copy.units) : null;
                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={(e) => onFocusCard(id, e.currentTarget)}
                                className="insights-focusable inline-flex min-h-[24px] cursor-pointer flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-sm border-0 bg-transparent p-0 text-start underline-offset-4 transition-colors hover:underline"
                              >
                                {valueText !== null ? (
                                  <bdi className="type-number whitespace-nowrap text-[var(--color-text-primary)]">
                                    {valueText}
                                  </bdi>
                                ) : null}
                                <span className="text-[length:var(--type-label)] font-normal text-[var(--color-text-secondary)]">
                                  {copy.indicators[id].name}
                                </span>
                              </button>
                            );
                          })}
                        </span>
                      ) : null}
                    </span>
                  </div>
                  <span className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                    {sentence}
                  </span>
                  {realReturn !== null ? (
                    <span className="text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                      <bdi>{realReturn}</bdi>
                    </span>
                  ) : null}
                </div>
                {/* The CHART half — the other 50%: the row's mini chart on
                 * the grid's second column, riding the row's first SHOWN
                 * number (round 36 — the same indicator the value lines
                 * display), vertically centred like the metals' chart
                 * columns, separated by a vertical hairline (border-s faces
                 * the data half in BOTH directions). Mobile keeps the old
                 * stacked order: hairline above, full width under the data. */}
                {lineChips.length > 0 ? (
                  <div
                    data-money-chart={area}
                    className="flex min-w-0 flex-col justify-center border-t border-[var(--color-border)] pt-2.5 sm:border-s sm:border-t-0 sm:ps-4 sm:pt-0"
                  >
                    <MoneyTrend id={lineChips[0]!} copy={copy} numberLocale={numberLocale} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
