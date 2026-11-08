/**
 * UsaVerdictStrip — the USA page's D-30 verdict strip (page-division S9,
 * 2026-11-09 — spec §7 item 1: "Top — the 5 thematic gauge verdicts (same
 * computed verdicts as Global, US-framed copy)").
 *
 * THE VALUES ARE GLOBAL'S OWN: the strip renders exactly what
 * `usaGaugeVerdicts` (= global-tiles' `globalGaugeTiles`, the ONE shared
 * derivation — D-48) computes over the USA projection's readings (the
 * projection carries the gauges' full voter sets by construction: homes +
 * the 14 D-30 mirrors). The copy is the only thing that changes: the tile
 * names become the five US-framed questions (pd.usa.strip.q*), while the
 * verdict WORDS and the why-lines ride the EXISTING pd.global keys — one
 * verdict language everywhere, pinned to the insights corpus by
 * usa-copy-pin.test.ts. A gauge that cannot read says so (step 0 → the
 * honest "Cannot read yet", never a guess).
 *
 * The strip is AT its destination for four of the five gauges (their
 * voter cards live on this page's tiers or its S10 sections), so those
 * cards render plain — no self-link. Dollar Strength is the exception:
 * its detail cards' home is /currencies (D-32), so its card is a real
 * link there (BD-S3b's mapping, honoured on-page).
 *
 * Platform: browser only — this module lives in the lazy USA route
 * chunk, never the entry graph.
 */

import { useI18n } from '../../lib/locale';
import { interpolate } from '../../i18n';
import { navigate } from '../../router';
import { formatNumber } from '@currena/core';
import type { TranslationKey } from '../../lib/locale';
import type { UsaGaugeVerdict } from './usa-tiles';

/* Local mirrors of the shared verdict vocabulary (cited, never forked —
 * the GlobalBoard precedent): the four-step meter's CSS classes are
 * index.css's own (round 44), and the tone classes mirror
 * config/bands.ts's WORD_TONE_CLASS — copied rather than imported so the
 * USA chunk stays lean (the config module chain pulls the whole insights
 * corpus). usa-copy-pin.test.ts pins the WORDS; these are the inks the
 * words wear. */

const STEP_TONE: Record<number, string> = {
  0: '',
  1: 'text-[var(--color-status-normal)]',
  2: 'text-[var(--color-status-watch)]',
  3: 'text-[var(--color-status-stressed)]',
  4: 'text-[var(--color-status-alert)]',
};

/** The US-framed question per gauge (D-30) — pd.usa's own fresh copy. */
const QUESTION_KEY: Readonly<Record<UsaGaugeVerdict['gauge'], TranslationKey>> = {
  'borrowing-costs': 'pd.usa.strip.qBorrowingCosts',
  'prices-heat': 'pd.usa.strip.qInflationHeat',
  'market-stress': 'pd.usa.strip.qMarketStress',
  'dollar-strength': 'pd.usa.strip.qDollarStrength',
  'growth-health': 'pd.usa.strip.qGrowthHealth',
};

/** The verdict word keys — the EXISTING pd.global keys (one verdict
 *  language with the Global board, pinned to the corpus by
 *  usa-copy-pin.test.ts — never restated here, D-48). */
const WORD_KEY = {
  relaxed: 'pd.global.labelRelaxed',
  cautious: 'pd.global.labelCautious',
  stressed: 'pd.global.labelStressed',
  alarmed: 'pd.global.labelAlarmed',
} as const;

/** The strip's link: only Dollar Strength navigates (its detail cards'
 *  home is /currencies, D-32/BD-S3b); the other four are already home. */
const STRIP_HREF: Partial<Record<UsaGaugeVerdict['gauge'], string>> = {
  'dollar-strength': '/currencies',
};

/** The four-step segmented meter — the shared .verdict-meter anatomy
 *  (index.css round 44), restated from the GlobalBoard tile. */
function StripMeter({ step, ariaLabel }: { step: number; ariaLabel: string }): React.JSX.Element {
  return (
    <span className="verdict-meter verdict-meter-sm" data-step={step} role="img" aria-label={ariaLabel} title={ariaLabel}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`verdict-meter-seg ${step >= i ? `on-${i}` : ''} motion-safe:transition-colors motion-safe:duration-300`} />
      ))}
    </span>
  );
}

function VerdictCard({ verdict }: { verdict: UsaGaugeVerdict }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const { reading, word } = verdict;
  const question = t(QUESTION_KEY[verdict.gauge]);
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });

  // The honest why-line, in the Global board's own words (one wording
  // everywhere): the engine's counts, step 0 speaks the unread line.
  const why =
    reading.step === 0
      ? t('pd.global.gaugeWhyUnread')
      : reading.warningCount > 0
        ? interpolate(t('pd.global.gaugeWhySome'), { warnings: num(reading.warningCount), voters: num(reading.votingCount) })
        : interpolate(t('pd.global.gaugeWhyNone'), { voters: num(reading.votingCount) });

  const body = (
    <>
      <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {word !== null ? (
          <>
            <span
              data-usa-verdict-word={verdict.gauge}
              className={`type-verdict text-[0.95rem] font-bold leading-tight sm:text-[1.15rem] lg:text-[1.3rem] ${STEP_TONE[reading.step] ?? ''}`}
            >
              {t(WORD_KEY[word])}
            </span>
            <StripMeter step={reading.step} ariaLabel={`${question}: ${t(WORD_KEY[word])}`} />
          </>
        ) : (
          <span className="type-verdict text-[0.95rem] font-bold leading-tight text-[var(--color-text-tertiary)] sm:text-[1.15rem] lg:text-[1.3rem]">
            {t('pd.global.cannotRead')}
          </span>
        )}
      </p>
      <p className="m-0 text-[9.5px] font-semibold leading-tight text-[var(--color-text-secondary)] sm:text-[length:var(--type-caption)] sm:leading-snug" data-usa-why>
        <bdi>{why}</bdi>
      </p>
    </>
  );

  const href = STRIP_HREF[verdict.gauge];
  if (href !== undefined) {
    return (
      <a
        href={href}
        data-usa-verdict={verdict.gauge}
        onClick={(e) => {
          e.preventDefault();
          navigate(href);
        }}
        className="insights-focusable flex min-h-[44px] cursor-pointer flex-col justify-start gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 no-underline ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] motion-safe:transition-shadow hover:shadow-[0_4px_16px_rgba(15,23,42,0.10)] sm:gap-1.5 sm:p-3"
      >
        <h3 className="m-0 min-h-[2.4em] text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{question}</h3>
        {body}
      </a>
    );
  }
  return (
    <article data-usa-verdict={verdict.gauge} className="flex min-h-[44px] flex-col justify-start gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:gap-1.5 sm:p-3">
      <h3 className="m-0 min-h-[2.4em] text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">{question}</h3>
      {body}
    </article>
  );
}

export function UsaVerdictStrip({ verdicts }: { verdicts: readonly UsaGaugeVerdict[] }): React.JSX.Element {
  const { t } = useI18n();
  return (
    <section aria-label={t('pd.usa.strip.title')} data-usa-strip className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t('pd.usa.strip.title')}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[10.5px] leading-snug text-currena-muted sm:text-[length:var(--type-label)]">{t('pd.usa.strip.intro')}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-5 lg:gap-3">
        {verdicts.map((verdict) => (
          <VerdictCard key={verdict.gauge} verdict={verdict} />
        ))}
      </div>
    </section>
  );
}
