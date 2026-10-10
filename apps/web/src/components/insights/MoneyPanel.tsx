/**
 * MoneyPanel — round-2 Block R11: "What it means for my money" (slim).
 *
 * At most FOUR lines, one per life area, chosen by the worst tier among the
 * area's indicators (needs attention first, then unusual). Each line: icon,
 * area name, one hedged sentence from the copy corpus keyed by area × state,
 * and one or two supporting chips with live values that open the cards.
 * No signal anywhere → one calm line. No advice, no buy/sell, no "will".
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { formatIndicatorValue, moneyPanel, type MoneyAreaId } from './config';

/** The line icons (16×16, stroke = currentColor, aria-hidden — the area
 * name carries the meaning; icons are NOT colour-coded). */
function AreaIcon({ area }: { area: MoneyAreaId }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  switch (area) {
    case 'petrol':
      return (
        <svg {...common}>
          <path d="M3 13.5h10" />
          <path d="M5 13.5V4.2a1.2 1.2 0 0 1 1.2-1.2h2.6A1.2 1.2 0 0 1 10 4.2v9.3" />
          <path d="M5 7.5h5" />
        </svg>
      );
    case 'homeLoan':
      return (
        <svg {...common}>
          <path d="M2.5 7.5 8 3l5.5 4.5" />
          <path d="M4 7v6h8V7" />
        </svg>
      );
    case 'savings':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 5v6M6.2 6.6h3a1.2 1.2 0 0 1 0 2.4h-2.4a1.2 1.2 0 0 0 0 2.4h3" />
        </svg>
      );
    case 'shop':
      return (
        <svg {...common}>
          <path d="M3.5 5.5h9l-.8 8h-7.4l-.8-8Z" />
          <path d="M5.8 5.5V4a2.2 2.2 0 0 1 4.4 0v1.5" />
        </svg>
      );
    case 'overseas':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M2.5 8h11M8 2.5c1.6 1.5 2.4 3.4 2.4 5.5S9.6 12 8 13.5C6.4 12 5.6 10.1 5.6 8S6.4 4 8 2.5Z" />
        </svg>
      );
    case 'jobs':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="10" height="7" rx="1.2" />
          <path d="M6 6V4.6A1.6 1.6 0 0 1 7.6 3h.8A1.6 1.6 0 0 1 10 4.6V6" />
        </svg>
      );
  }
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
      <h2 id="insights-money-title" className="m-0 mb-1 text-lg font-extrabold">
        {copy.money.title}
      </h2>
      <p className="m-0 mb-2 text-[var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.money.subtitle}
      </p>

      {rows.length === 0 ? (
        <p className="m-0 rounded-[var(--radius-lg)] bg-[var(--color-surface)] px-4 py-3 text-[var(--type-label)] leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {copy.money.calmLine}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {rows.map(({ area, state, chipIds }) => {
            const areaCopy = copy.money.areas[area];
            const sentence = state === 'attention' ? areaCopy.attention : state === 'unusual' ? areaCopy.unusual : areaCopy.calm;
            return (
              <li
                key={area}
                data-money-area={area}
                data-money-state={state}
                className="flex flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3.5 py-2.5 ring-1 ring-[var(--color-border)] sm:flex-row sm:items-center sm:gap-3"
              >
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 text-[var(--type-label)] font-bold ${
                    state === 'attention' ? 'text-[var(--color-status-alert)]' : 'text-[var(--color-text-primary)]'
                  }`}
                >
                  <span className={state === 'attention' ? 'text-[var(--color-status-alert)]' : 'text-[var(--color-status-context)]'}>
                    <AreaIcon area={area} />
                  </span>
                  {areaCopy.name}
                </span>
                <span className="min-w-0 flex-1 text-[var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
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
                          className="insights-focusable inline-flex min-h-[24px] cursor-pointer items-center gap-1.5 rounded-full bg-currena-soft/80 px-2.5 py-0.5 text-[var(--type-caption)] font-semibold text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)] transition-colors hover:bg-currena-blue/15 dark:bg-white/[0.06]"
                        >
                          {copy.indicators[id].name}
                          {valueText !== null ? (
                            <bdi dir="ltr" className="font-bold tabular-nums text-[var(--color-text-secondary)]">
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
