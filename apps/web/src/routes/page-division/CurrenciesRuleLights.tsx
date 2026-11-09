/**
 * CurrenciesRuleLights — the Currencies page's hero: the seven rule
 * lights (page-division S18, 2026-11-11 — spec §12 item 1; D-41).
 *
 * R1 risk-mood · R2 carry unwind · R3 dollar strength · R4 money-hiding ·
 * R5 China link · R6 Europe worry · R7 dollar-or-euro — each light
 * renders, straight off the fx snapshot's stored rule state:
 *
 *   - the rule's NAME + the plain-language EVERYDAY explanation (the
 *     corpus's own words, pinned byte-for-byte by
 *     currencies-copy-pin.test.ts);
 *   - the STATUS word + severity chip through the SAME §9.3 mapping the
 *     legacy /insights page and the Global fx tile read — `fxRuleView`
 *     from lib/fx-presentation/rules, never restated (the "rules match
 *     the FX board KV logic exactly" gate);
 *   - the OUTCOME-SPECIFIC HEADLINE sentence (currenciesRuleHeadlineKey
 *     picks the key; a downgraded warning keeps its warning sentence —
 *     the §6.4 discipline — and adds the caution line);
 *   - the pattern reliability line ("Held in {k} of the last 13 weeks")
 *     for the rules the check applies to, and the progress bar (§6.7,
 *     "How close to the alarm") with its aria label;
 *   - the honest no-data word for nodata rows (never a guess).
 *
 * The 13-week pattern DOTS stay on the legacy page (Level 3 — the
 * pattern area's own drawing); the light carries the reliability LINE,
 * the same fact in words.
 *
 * Platform: browser only — this module lives in the lazy Currencies route
 * chunk, never the entry graph.
 */

import type { FxRuleState } from '@currena/core';
import { formatNumber } from '@currena/core';
import { fxRuleView } from '../../lib/fx-presentation/rules';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import { currenciesRuleHeadlineKey } from './currencies-tiles';

/** The rule-id → copy-light key (R1…R7 in spec order). */
const LIGHT_KEY: Readonly<Record<FxRuleState['id'], 'r1' | 'r2' | 'r3' | 'r4' | 'r5' | 'r6' | 'r7'>> = {
  r1_risk_mood: 'r1',
  r2_carry_trade: 'r2',
  r3_dollar_strength: 'r3',
  r4_money_hiding: 'r4',
  r5_china_link: 'r5',
  r6_europe_worry: 'r6',
  r7_dollar_or_euro: 'r7',
};

/** The status word keys (the §9.3 table's three, via fxRuleView). */
const STATUS_KEY = {
  active: 'pd.currencies.statusActive',
  watching: 'pd.currencies.statusWatching',
  quiet: 'pd.currencies.statusQuiet',
} as const satisfies Record<'active' | 'watching' | 'quiet', TranslationKey>;

/** The severity chip keys (the §9.3 table's own; null = no chip). */
const CHIP_KEY = {
  normal: 'pd.currencies.chipNormal',
  attention: 'pd.currencies.chipAttention',
  unusual: 'pd.currencies.chipUnusual',
} as const satisfies Record<'normal' | 'attention' | 'unusual', TranslationKey>;

/** The status word + chip tone classes (the legacy chips' own colours —
 *  colour + label, never colour alone). */
const CHIP_TONE: Record<'normal' | 'attention' | 'unusual', string> = {
  normal: 'bg-currena-success/10 text-[var(--color-status-context)]',
  attention: 'bg-currena-warning/10 text-[var(--color-status-watch)]',
  unusual: 'bg-currena-danger/10 text-[var(--color-status-alert)]',
};

function RuleLight({ rule }: { rule: FxRuleState }): React.JSX.Element {
  const { t, numberLocale } = useI18n();
  const light = LIGHT_KEY[rule.id];
  const view = fxRuleView(rule);
  const headlineKey = currenciesRuleHeadlineKey(rule);
  const downgraded = rule.outcome === 'watch' && rule.downgraded === true;
  const nodata = rule.outcome === 'nodata';
  // The reliability line rides only the rules §6.4's check applies to
  // (R4 and R7 have no check — the corpus gives them no dots either).
  const hasPatternCheck = rule.id !== 'r4_money_hiding' && rule.id !== 'r7_dollar_or_euro';

  const headline =
    headlineKey !== null
      ? t(`pd.currencies.ruleLights.${light}.${headlineKey}` as TranslationKey)
      : null;

  return (
    <article
      id={`currencies-rule-${light}`}
      data-currencies-rule={light}
      data-currencies-rule-outcome={rule.outcome}
      data-currencies-rule-downgraded={downgraded ? 'true' : undefined}
      className="flex min-w-0 flex-col gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)]"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
          {t(`pd.currencies.ruleLights.${light}.name` as TranslationKey)}
        </h3>
        <span className="text-[length:var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          {t(STATUS_KEY[view.status])}
        </span>
        {view.chip !== null ? (
          <span
            data-currencies-rule-chip={view.chip}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.66rem] font-bold ${CHIP_TONE[view.chip]}`}
          >
            {t(CHIP_KEY[view.chip])}
          </span>
        ) : null}
      </div>
      {headline !== null ? (
        <p data-currencies-rule-headline className="m-0 text-[length:var(--type-label)] font-extrabold leading-snug text-[var(--color-text-primary)]">
          {headline}
        </p>
      ) : null}
      {nodata ? (
        <p data-currencies-rule-nodata className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-tertiary)]">
          {t('pd.currencies.noDataRow')}
        </p>
      ) : null}
      {downgraded ? (
        <p data-currencies-rule-caution className="m-0 text-[length:var(--type-caption)] font-semibold leading-snug text-[var(--color-text-secondary)]">
          {t('pd.currencies.downgradeCaution')}
        </p>
      ) : null}
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{t(`pd.currencies.ruleLights.${light}.everyday` as TranslationKey)}</bdi>
      </p>
      {/* §6.7's progress — "how far the main leg moved toward its warning
          line". Data only; the aria label speaks it. */}
      {rule.progress > 0 && !nodata ? (
        <span
          className="verdict-meter !h-1.5 max-w-[140px]"
          data-progress={Math.round(rule.progress)}
          role="img"
          aria-label={interpolate(t('pd.currencies.barLabel'), {
            x: formatNumber(Math.round(rule.progress), numberLocale),
          })}
        >
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`verdict-meter-seg ${rule.progress >= i * 25 ? `on-${Math.min(i, 4)}` : ''}`} />
          ))}
        </span>
      ) : null}
      {hasPatternCheck && !nodata ? (
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
          <bdi>{interpolate(t('pd.currencies.reliabilityDetail'), { k: formatNumber(rule.pattern.agreeWeeks, numberLocale) })}</bdi>
        </p>
      ) : null}
    </article>
  );
}

export function CurrenciesRuleLights({ rules }: { rules: readonly FxRuleState[] }): React.JSX.Element {
  const { t } = useI18n();
  return (
    <section aria-label={t('pd.currencies.rulesTitle')} data-currencies-section="rules" className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">{t('pd.currencies.rulesTitle')}</h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted">{t('pd.currencies.rulesIntro')}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3">
        {rules.map((rule) => (
          <RuleLight key={rule.id} rule={rule} />
        ))}
      </div>
    </section>
  );
}
