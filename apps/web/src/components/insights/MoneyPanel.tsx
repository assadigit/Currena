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

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { IconImg, moneyAreaIconUrl } from '../icons/currena';
import {
  formatIndicatorValue,
  moneyAreaDirection,
  moneyDirectionToneClass,
  moneyPanel,
  type MoneyAreaId,
  type MoneyDirection,
} from './config';

/** The area icons — rendered INSIDE a 64×64 tinted box (owner follow-up
 * 11 Oct: "increase the icon size, something visible like 64×64").
 * Round 28 (owner): the stroke pictograms give way to the owner's own
 * artwork wherever one exists — fuel nozzle, bills, housing, the rising
 * exchange chart, the globe. "Jobs" has no artwork yet and keeps its
 * stroke briefcase. The box stays the neutral context tint — the icons
 * are NOT colour-coded (red belongs to the needs-attention word). */
function AreaIcon({ area }: { area: MoneyAreaId }) {
  const icon = moneyAreaIconUrl(area);
  if (icon !== null) return <IconImg src={icon} size={40} />;
  // jobs — the one area without artwork (round 28): the stroke briefcase.
  return (
    <svg
      width={40}
      height={40}
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
 * (round 23) at 16px: up, down, and the flat dash. aria-hidden — the
 * word beside it carries the meaning (never colour alone, G5). */
function DirectionIcon({ direction }: { direction: MoneyDirection }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
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

  return (
    <section id="insights-money" aria-labelledby="insights-money-title" className="scroll-mt-24">
      <h2 id="insights-money-title" className="type-section m-0 mb-1">
        {copy.money.title}
      </h2>
      <p className="m-0 mb-2 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.money.subtitle}
      </p>

      {rows.length === 0 ? (
        <p className="m-0 rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-4 py-3 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {copy.money.calmLine}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {rows.map(({ area, state, chipIds }) => {
            const areaCopy = copy.money.areas[area];
            const sentence = state === 'attention' ? areaCopy.attention : state === 'unusual' ? areaCopy.unusual : areaCopy.calm;
            const m = copy.money;
            const direction = moneyAreaDirection(area, readings, copy);
            // Round 26: the words follow the area's valence — cost areas
            // speak in prices, savings speaks in the interest it earns.
            const words = area === 'savings' ? m.direction.savings : m.direction.cost;
            const directionWord =
              direction === 'up' ? words.up : direction === 'down' ? words.down : words.flat;
            const directionTone = moneyDirectionToneClass(area, direction);
            return (
              <li
                key={area}
                data-money-area={area}
                data-money-state={state}
                className="flex flex-col gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-3 ring-1 ring-[var(--color-border)] sm:flex-row sm:items-start sm:gap-3"
              >
                {/* Owner follow-up (11 Oct): the icon is a VISIBLE 64×64
                 * instrument (48 on mobile), not a 16px squiggle — a tinted
                 * square keeps it designed, not decorative. */}
                <span
                  aria-hidden="true"
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-md)] bg-currena-soft/70 ring-1 ring-[var(--color-border)] sm:h-16 sm:w-16"
                >
                  <span className={moneyAreaIconUrl(area) !== null ? '' : 'text-[var(--color-status-context)]'}>
                    <AreaIcon area={area} />
                  </span>
                </span>
                {/* R30: the area label owns a FIXED column (sm:w-40) — the
                 * roast: "label widths differ, so sentences start at
                 * different positions". Top-aligned (items-start) so every
                 * heading, sentence and chip row starts on the same line.
                 * The icon box is always the neutral context ink — red
                 * belongs to the needs-attention WORD only. */}
                {/* R30 → round 24 (roast #4): the area label is NEUTRAL —
                 * red is reserved for "needs attention" words, and the
                 * roast called the four red money labels a leak ("when
                 * everything is red, nothing is"). The state still shows
                 * in the sentence and the chips. */}
                <span className="shrink-0 text-[length:var(--type-label)] font-bold leading-relaxed text-[var(--color-text-primary)] sm:w-40">
                  {areaCopy.name}
                  {/* Round 25 (owner): the stated estimation, directly under
                   * the area name — arrow + word in valence ink, computed
                   * from the driver readings (moneyAreaDirection). */}
                  <span
                    data-money-direction={direction}
                    className={`mt-1 flex items-center gap-1.5 leading-snug ${directionTone}`}
                  >
                    <DirectionIcon direction={direction} />
                    <span className="text-[length:var(--type-label)] font-bold">{directionWord}</span>
                  </span>
                </span>
                <span className="min-w-0 flex-1 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
                  {sentence}
                </span>
                {chipIds.length > 0 ? (
                  <span className="flex shrink-0 flex-wrap gap-1.5">
                    {chipIds.map((id) => {
                      const r = byId.get(id);
                      const valueText =
                        r && r.value !== null ? formatIndicatorValue(id, r.value, numberLocale, copy.units) : null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={(e) => onFocusCard(id, e.currentTarget)}
                          className="insights-focusable inline-flex min-h-[24px] cursor-pointer items-center gap-1.5 rounded-full bg-currena-soft/80 px-2.5 py-0.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)] transition-colors hover:bg-currena-blue/15 dark:bg-white/[0.06]"
                        >
                          {copy.indicators[id].name}
                          {valueText !== null ? (
                            <bdi className="font-bold tabular-nums text-[var(--color-text-secondary)]">
                              {valueText}
                            </bdi>
                          ) : null}
                        </button>
                      );
                    })}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
