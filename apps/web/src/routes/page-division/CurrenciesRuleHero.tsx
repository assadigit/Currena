/**
 * CurrenciesRuleHero — the /currencies page's hero: the 7 rule lights
 * (page-division S18, 2026-11-12 — spec §12 item 1; D-41: rules first).
 *
 * R1 risk-mood · R2 carry unwind · R3 dollar strength · R4 money-hiding
 * · R5 China link · R6 Europe worry · R7 dollar-or-euro — each light
 * shows the rule's NAME (the corpus's own), its STATUS word (Active /
 * Watching / Quiet — the §9.3 status table applied through
 * fx-presentation's fxRuleView, the SAME mapping the legacy /insights
 * pattern cards render through: imported, never restated) and its
 * PLAIN-LANGUAGE explanation (the corpus's own everyday line).
 *
 * THE KV LOGIC EXACTLY (the S18 gate): every light reads the fx
 * snapshot's own stored `rules` array — outcome, variant, nothing
 * re-derived. A nodata rule speaks the honest no-data line (never a
 * guessed status). The hero's verdict block carries the snapshot's own
 * summary signal (the §9.10 measure label + the page's severity chip).
 *
 * D-48 (colour + label, never colour alone): the light dot and the
 * status word always travel together; an active warning also turns the
 * verdict block amber with an accent bar (the WorldCurrencies verdict
 * discipline: a calm day keeps the quiet neutral card — the contrast IS
 * the signal).
 *
 * Platform: browser only — this module lives in the lazy Currencies
 * route chunk, never the entry graph.
 */

import type { FxRuleState, FxSnapshot } from '@currena/core';
import { useI18n } from '../../lib/locale';
import { fxRuleView } from '../../lib/fx-presentation';
import { CURRENCIES_RULE_IDS, currenciesRuleCopyKey, type CurrenciesRuleCopyKey } from './currencies-tiles';
import type { TranslationKey } from '../../lib/locale';

/** The status-word keys — fxRuleView's own mapping, restated as the copy
 *  join (the pin test proves the words are the corpus's own). */
const STATUS_KEY: Readonly<Record<'active' | 'watching' | 'quiet', TranslationKey>> = {
  active: 'pd.currencies.statusActive',
  watching: 'pd.currencies.statusWatching',
  quiet: 'pd.currencies.statusQuiet',
};

/** The measure-label keys (§9.10) — the summary signal's own words. */
const MEASURE_KEY: Readonly<Record<FxSnapshot['summary']['signal'], TranslationKey>> = {
  normal: 'pd.currencies.measureNormal',
  attention: 'pd.currencies.measureAttention',
  unusual: 'pd.currencies.measureUnusual',
};

/** The severity-chip keys (null on normal — the §9.3 discipline). */
const CHIP_KEY: Partial<Record<FxSnapshot['summary']['signal'], TranslationKey>> = {
  attention: 'pd.currencies.chipAttention',
  unusual: 'pd.currencies.chipUnusual',
};

/** The light dot's status colour (D-48: the dot and the word travel
 *  together; the colours ride the app's own status tokens). */
const DOT_COLOR: Readonly<Record<'active' | 'watching' | 'quiet', string>> = {
  active: 'bg-[var(--color-status-stressed)]',
  watching: 'bg-[var(--color-status-watch)]',
  quiet: 'bg-[var(--color-status-stale)]',
};

/** One rule light (§12 item 1, D-41): R# + name + status + the everyday
 *  explanation. A nodata rule speaks the honest no-data line. */
function RuleLight({ rule }: { rule: FxRuleState }): React.JSX.Element {
  const { t } = useI18n();
  const key = currenciesRuleCopyKey(rule.id);
  const nameKey: Record<CurrenciesRuleCopyKey, TranslationKey> = {
    r1: 'pd.currencies.ruleNames.r1',
    r2: 'pd.currencies.ruleNames.r2',
    r3: 'pd.currencies.ruleNames.r3',
    r4: 'pd.currencies.ruleNames.r4',
    r5: 'pd.currencies.ruleNames.r5',
    r6: 'pd.currencies.ruleNames.r6',
    r7: 'pd.currencies.ruleNames.r7',
  };
  const everydayKey: Record<CurrenciesRuleCopyKey, TranslationKey> = {
    r1: 'pd.currencies.ruleEveryday.r1',
    r2: 'pd.currencies.ruleEveryday.r2',
    r3: 'pd.currencies.ruleEveryday.r3',
    r4: 'pd.currencies.ruleEveryday.r4',
    r5: 'pd.currencies.ruleEveryday.r5',
    r6: 'pd.currencies.ruleEveryday.r6',
    r7: 'pd.currencies.ruleEveryday.r7',
  };
  const number = key.toUpperCase();
  // The KV logic exactly: the STORED outcome/variant drives the light;
  // fxRuleView is the same mapping the legacy pattern cards render.
  const view = fxRuleView(rule);
  const isNoData = rule.outcome === 'nodata';
  return (
    <article
      data-currencies-rule={rule.id}
      data-currencies-rule-status={isNoData ? 'nodata' : view.status}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <h3 className="m-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
          <span aria-hidden="true" className="me-1 font-extrabold text-[var(--color-text-tertiary)]">{number}</span>
          {t(nameKey[key])}
        </h3>
        <span className="ms-auto inline-flex items-center gap-1.5 text-[length:var(--type-caption)] font-bold leading-tight">
          <span aria-hidden="true" className={`inline-block size-2.5 shrink-0 rounded-full ${isNoData ? 'bg-[var(--color-status-stale)]' : DOT_COLOR[view.status]}`} />
          {isNoData ? (
            <span className="text-[var(--color-text-tertiary)]" data-currencies-rule-nodata>{t('pd.currencies.noDataRule')}</span>
          ) : (
            <span data-currencies-rule-status-word className={view.status === 'active' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}>
              {t(STATUS_KEY[view.status])}
            </span>
          )}
        </span>
      </div>
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{t(everydayKey[key])}</bdi>
      </p>
    </article>
  );
}

/** The hero: the verdict block (the snapshot's own summary signal) + the
 *  7 lights, in spec order (R1–R7). */
export function CurrenciesRuleHero({ snapshot }: { snapshot: FxSnapshot }): React.JSX.Element {
  const { t } = useI18n();
  const { signal } = snapshot.summary;
  const chipKey = CHIP_KEY[signal];
  const byId = new Map(snapshot.rules.map((r) => [r.id as string, r]));
  const rules = CURRENCIES_RULE_IDS.map((id) => byId.get(id)).filter(
    (r): r is FxRuleState => r !== undefined,
  );
  return (
    <section aria-labelledby="currencies-rules-title" data-currencies-hero className="mt-3 scroll-mt-24 sm:mt-5">
      <div className="mb-1.5 sm:mb-2">
        <h2 id="currencies-rules-title" className="m-0 text-base font-extrabold leading-tight text-currena-dark sm:text-lg lg:text-xl">
          {t('pd.currencies.heroTitle')}
        </h2>
        <p className="m-0 mt-0.5 max-w-prose text-[length:var(--type-label)] leading-snug text-currena-muted">{t('pd.currencies.heroIntro')}</p>
      </div>
      {/* The verdict block (§9.3's discipline restated): the §9.10 measure
          label + the severity chip; an attention/unusual day turns the box
          into the section's alarm (amber field + accent bar); a calm day
          keeps the quiet neutral card — the contrast IS the signal. */}
      <div
        className={`relative flex flex-wrap items-baseline gap-x-2.5 gap-y-1 overflow-hidden rounded-[var(--radius-md)] p-3.5 ring-1 shadow-[0_2px_10px_rgba(15,23,42,0.05)] ${
          signal === 'attention' || signal === 'unusual'
            ? 'bg-currena-warning/[0.09] ring-currena-warning/45'
            : 'bg-[var(--color-surface)] ring-[var(--color-border)]'
        }`}
        data-currencies-hero-verdict
        data-currencies-signal={signal}
      >
        {signal === 'attention' || signal === 'unusual' ? (
          <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1.5 bg-[var(--color-status-alert)]" />
        ) : null}
        <p className="m-0 text-[length:var(--type-label)] font-extrabold leading-tight text-[var(--color-text-primary)]">{t(MEASURE_KEY[signal])}</p>
        {chipKey !== undefined ? (
          <span className="rounded-full bg-[var(--color-status-alert)]/10 px-2 py-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-status-alert)] ring-1 ring-[var(--color-status-alert)]/30">
            {t(chipKey)}
          </span>
        ) : null}
      </div>
      {/* The 7 lights (D-41) — spec order R1–R7. */}
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2.5 lg:grid-cols-3 lg:gap-3" data-currencies-rules>
        {rules.map((rule) => (
          <RuleLight key={rule.id} rule={rule} />
        ))}
      </div>
    </section>
  );
}
