/**
 * GoldPositions — a dedicated "Gold Positions" section for the /gold page
 * (TM23). Shows the CFTC trader positioning cards with a visual bar.
 *
 * GPE R03 (wave 0, 2026-11-17) — two fixes on these cards:
 *   - GPE-S2-09 (MED): the change line now names its WINDOW ("30-day
 *     change" / «تغییر ۳۰ روزه»). The section speaks the WEEKLY CFTC
 *     report, so the unlabeled "−8.8 pts" parsed as week-over-week (the
 *     S1 auditor misread it exactly that way); the value is the 30-day
 *     change (the actual w/w is −2.0 pts, API lastChange.points). C1's
 *     window-named-at-point-of-use rule, honored on an existing surface.
 *   - GPE-S2-10 (LOW, the rider): the bar semantics now match each
 *     metric's true domain. The TRADER-POSITIONING card's net/OI metric
 *     is defined on [−100, +100] — the old Math.min(Math.max(v, 0), 100)
 *     clamp pinned a net-short reading at 0% and hid the sign (a latent
 *     semantic trap; no visual bug while values are positive). It now
 *     renders a SIGNED bar: the track spans −100…+100 with a centre zero
 *     tick, the fill grows from the centre toward the reading (long side
 *     / short side), and the end labels name both extremes. The
 *     GROSS-LONG card's share is genuinely 0–100 and keeps its bar.
 */

import type { IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { useI18n, type TranslationKey } from '../../shared/lib/locale';

const POSITION_IDS = ['cftc-gold-positioning', 'cftc-gold-gross-long'] as const;

/** The per-card name keys (house rule 5 — every UI string through the
 * i18n dictionary; baseline-repair 2026-11-15 moved TM23's hardcoded
 * strings here byte-identically). */
const POSITION_NAME_KEY: Record<string, TranslationKey> = {
  'cftc-gold-positioning': 'pd.gold.positionsCardTraderPositioning',
  'cftc-gold-gross-long': 'pd.gold.positionsCardGrossLong',
};

/** GPE R03 / GPE-S2-10: each card's bar domain. The net/OI positioning
 * metric lives on [−100, +100] (net short…net long); the gross-long
 * share lives on [0, 100]. The bar renders the value inside its own
 * domain — never a ±100 metric clamped into 0–100. */
const BAR_DOMAIN: Record<string, { min: number; max: number }> = {
  'cftc-gold-positioning': { min: -100, max: 100 },
  'cftc-gold-gross-long': { min: 0, max: 100 },
};

/** The value's position on its own domain's track, in percent — the
 * marker's `left`. UNCLAMPED by design: a reading outside its domain
 * (a data anomaly) renders past the end rather than being silently
 * pinned; the number beside it always shows the true value. Rounded
 * to 2dp so the rendered style never carries float noise. */
function trackPct(value: number, domain: { min: number; max: number }): number {
  return Math.round((((value - domain.min) / (domain.max - domain.min)) * 100) * 100) / 100;
}

export function GoldPositions({ readings }: { readings: readonly IndicatorReading[] }): React.JSX.Element | null {
  const { t, numberLocale } = useI18n();
  const byId = new Map(readings.map((r) => [r.id, r] as const));

  const cards = POSITION_IDS.map((id) => byId.get(id)).filter(
    (r): r is IndicatorReading => r !== undefined && r.value !== null && typeof r.value === 'number',
  );
  if (cards.length === 0) return null;

  return (
    <section id="gold-positions" className="mt-3 gold-anchor-mt sm:mt-5" data-gold-positions>
      <h2 className="m-0 mb-1 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">
        {t('pd.gold.positionsTitle')}
      </h2>
      <p className="m-0 mb-3 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted">
        {t('pd.gold.positionsPurpose')}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((reading) => {
          const value = reading.value as number;
          const domain = BAR_DOMAIN[reading.id] ?? { min: 0, max: 100 };
          const signed = domain.min < 0;
          const pct = trackPct(value, domain);
          const nameKey = POSITION_NAME_KEY[reading.id];
          const name = nameKey !== undefined ? t(nameKey) : reading.id;
          const change30d = reading.change30d;
          const tone = change30d !== undefined && change30d < 0 ? 'text-[var(--color-return-down)]' : 'text-[var(--color-return-up)]';
          /* GPE-S2-10: the fill grows from the ZERO point of the card's
           * own domain — from the centre for the signed net/OI track
           * (a negative reading extends toward the SHORT end and the
           * sign stays visible), from the left end for the 0–100 share.
           * The tone keeps the previous colour language, translated to
           * each domain (crowded long / crowded short / middle). */
          const zeroPct = trackPct(0, domain);
          const fillStart = signed ? Math.min(zeroPct, pct) : domain.min;
          const fillWidth =
            Math.round((signed ? Math.abs(pct - zeroPct) : Math.max(pct - 0, 0)) * 100) / 100;
          const toneHigh = signed ? value > 20 : pct > 60;
          const toneLow = signed ? value < -20 : pct < 40;
          const fillTone = toneHigh
            ? 'bg-[var(--color-return-up)]'
            : toneLow
              ? 'bg-[var(--color-return-down)]'
              : 'bg-[var(--color-text-secondary)]';
          return (
            <article key={reading.id} className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)]" data-gold-position-card={reading.id} data-position-bar-domain={signed ? 'signed' : 'share'}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="m-0 text-sm font-bold leading-snug text-[var(--color-text-primary)]">{name}</h3>
                <bdi dir="ltr" className="type-number font-bold tabular-nums text-[var(--color-text-primary)]">
                  {value > 0 && signed ? '+' : ''}{formatNumber(value, numberLocale, { maximumFractionDigits: 1 })}%
                </bdi>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--color-border)]/30" role="img" aria-label={`${name}: ${formatNumber(value, numberLocale, { maximumFractionDigits: 1 })}%`}>
                {signed ? (
                  /* The centre zero tick — the signed track's reference. */
                  <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-[var(--color-border)]" />
                ) : null}
                <div
                  className={`absolute inset-y-0 rounded-full ${fillTone}`}
                  style={{ left: `${fillStart}%`, width: `${fillWidth}%` }}
                />
                <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-text-primary)] shadow-sm" style={{ left: `${pct}%` }} aria-hidden="true" />
              </div>
              <div className="flex items-baseline justify-between gap-2 text-[length:var(--type-caption)]">
                <span className="text-[var(--color-text-tertiary)]">{formatNumber(domain.min, numberLocale, { maximumFractionDigits: 0 })}%</span>
                {change30d !== undefined ? (
                  /* GPE-S2-09: the change line names its window — the
                   * section speaks the weekly report, the value is the
                   * 30-day change; the word ends the w/w ambiguity. */
                  <bdi className="flex items-baseline gap-1.5">
                    <span dir="ltr" className={`font-semibold tabular-nums ${tone}`}>
                      {change30d > 0 ? '+' : '\u2212'}{formatNumber(Math.abs(change30d), numberLocale, { maximumFractionDigits: 1 })} pts
                    </span>
                    <span className="text-[var(--color-text-tertiary)]" data-position-change-window>{t('pd.gold.positionsChangeWindow')}</span>
                  </bdi>
                ) : null}
                <span className="text-[var(--color-text-tertiary)]">{signed ? '+' : ''}{formatNumber(domain.max, numberLocale, { maximumFractionDigits: 0 })}%</span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
