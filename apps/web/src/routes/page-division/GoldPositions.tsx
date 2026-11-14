/**
 * GoldPositions — a dedicated "Gold Positions" section for the /gold page
 * (TM23). Shows the CFTC trader positioning cards with a visual bar.
 */

import type { IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { useI18n } from '../../lib/locale';

const POSITION_IDS = ['cftc-gold-positioning', 'cftc-gold-gross-long'] as const;

export function GoldPositions({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element | null {
  const { t, locale, numberLocale } = useI18n();
  const byId = new Map(readings.map((r) => [r.id, r] as const));

  const cards = POSITION_IDS.map((id) => byId.get(id)).filter(
    (r): r is IndicatorReading => r !== undefined && r.value !== null && typeof r.value === 'number',
  );
  if (cards.length === 0) return null;

  return (
    <section className="mt-3 sm:mt-5" data-gold-positions>
      <h2 className="m-0 mb-1 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">
        {locale === 'fa' ? 'پوزیشن طلا' : 'Gold Positions'}
      </h2>
      <p className="m-0 mb-3 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted">
        {locale === 'fa'
          ? 'معامله‌گران در بازار آتی طلا چطور پوزیشن گرفته‌اند — گزارش CFTC نشان می‌دهد سفته‌بازان خالص خرید هستند یا خالص فروش.'
          : 'How traders are positioned in the gold futures market — the CFTC Commitments of Traders report.'}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((reading) => {
          const value = reading.value as number;
          const pct = Math.min(Math.max(value, 0), 100);
          const nameMap: Record<string, string> = {
            'cftc-gold-positioning': locale === 'fa' ? 'پوزیشن معامله‌گران طلا' : 'Gold trader positioning',
            'cftc-gold-gross-long': locale === 'fa' ? 'پوزیشن خرید معامله‌گران طلا' : 'Gold gross long positioning',
          };
          const name = nameMap[reading.id] ?? reading.id;
          const change30d = reading.change30d;
          const tone = change30d !== undefined && change30d < 0 ? 'text-[var(--color-return-down)]' : 'text-[var(--color-return-up)]';
          return (
            <article key={reading.id} className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)]" data-gold-position-card={reading.id}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="m-0 text-sm font-bold leading-snug text-[var(--color-text-primary)]">{name}</h3>
                <bdi dir="ltr" className="type-number font-bold tabular-nums text-[var(--color-text-primary)]">
                  {formatNumber(value, numberLocale, { maximumFractionDigits: 1 })}%
                </bdi>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--color-border)]/30" role="img" aria-label={`${name}: ${formatNumber(value, numberLocale, { maximumFractionDigits: 1 })}%`}>
                <div
                  className={`absolute inset-y-0 left-0 rounded-full ${pct > 60 ? 'bg-[var(--color-return-up)]' : pct < 40 ? 'bg-[var(--color-return-down)]' : 'bg-[var(--color-text-secondary)]'}`}
                  style={{ width: `${pct}%` }}
                />
                <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-text-primary)] shadow-sm" style={{ left: `${pct}%` }} aria-hidden="true" />
              </div>
              <div className="flex items-baseline justify-between gap-2 text-[length:var(--type-caption)]">
                <span className="text-[var(--color-text-tertiary)]">0%</span>
                {change30d !== undefined ? (
                  <bdi dir="ltr" className={`font-semibold tabular-nums ${tone}`}>
                    {change30d > 0 ? '+' : '\u2212'}{formatNumber(Math.abs(change30d), numberLocale, { maximumFractionDigits: 1 })} pts
                  </bdi>
                ) : null}
                <span className="text-[var(--color-text-tertiary)]">100%</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
