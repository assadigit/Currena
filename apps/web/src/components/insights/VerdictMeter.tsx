/**
 * VerdictMeter — Block H1, rebuilt by round-2 Blocks R2 + R3.
 *
 * For each region: region name; the verdict word; the four-step segmented
 * meter (role="img" with a text alternative); THE GAUGES as small readings
 * (gauge name + its step word); and ONE reason line computed from a fixed
 * table over the gauge steps (heroReason in config.ts — never free text,
 * never a static per-label sentence, never a reassurance while any gauge
 * sits at step 3+). Under it: up to three needs-attention tiles WITH NUMBERS
 * (plain name, large value with unit, the rule in short form, opens the
 * card) and a "+n more" tile (R3).
 *
 * Round-2 D7: Global renders first (no swap setting — retired).
 */

import type { IndicatorReading, InsightsSection, IndicatorId } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { GAUGES, gaugesForSection, labelForVerdictStep, sectionVerdictStep } from '@currena/insights';
import {
  attentionTiles,
  definitionFor,
  formatIndicatorValue,
  formatRuleText,
  heroReason,
} from './config';

function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

/** The four-step segmented meter with a marker on the current step. */
export function VerdictMeter({ step, label, ariaLabel }: { step: number; label: string; ariaLabel: string }) {
  return (
    <span
      className="verdict-meter"
      role="img"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`verdict-meter-seg ${step >= i ? `on-${i}` : ''} motion-safe:transition-colors motion-safe:duration-300`}
        />
      ))}
    </span>
  );
}

/**
 * One region's verdict block (R2): name, meter, verdict word, the gauges as
 * small readings, the computed reason line, the count line, and the R3
 * needs-attention tiles with numbers.
 */
export function VerdictBlock({
  section,
  sectionLabel,
  readings,
  copy,
  numberLocale,
  onJumpSection,
  onJumpAbout,
  onFocusCard,
}: {
  section: InsightsSection;
  sectionLabel: string;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onJumpSection: (section: InsightsSection) => void;
  onJumpAbout: () => void;
  onFocusCard: (id: IndicatorId) => void;
}) {
  const step = sectionVerdictStep(section, readings);
  const labelWord = labelForVerdictStep(step) ?? null;
  const sectionGauges = GAUGES.filter((g) => g.section === section);
  const gaugeRows = gaugesForSection(section, readings);

  const verdictLabel = labelWord ? copy.label[labelWord] : copy.ui.gaugeNoReading;
  const ariaLabel = interpolate(copy.ui.verdictStepAria, {
    section: sectionLabel,
    label: verdictLabel,
    step: num(step || 0, numberLocale),
  });

  // R2: the reason line — computed from the fixed table over gauge steps.
  const reason = heroReason({
    gauges: gaugeRows,
    words: { 1: copy.label.relaxed, 2: copy.label.cautious, 3: copy.label.stressed, 4: copy.label.alarmed },
    calm: copy.ui.heroReasonCalm,
    top: copy.ui.heroReasonTop,
    others: copy.ui.heroReasonOthers,
    othersOne: copy.ui.heroReasonOthersOne,
    is: copy.ui.heroReasonIs,
    are: copy.ui.heroReasonAre,
    notEnough: copy.ui.noSummary,
    nameOf: (gauge) => copy.groups[gauge as keyof typeof copy.groups] ?? gauge,
    fmt: (n) => num(n, numberLocale),
  });

  // R3: the needs-attention tiles (extremity-sorted, up to 3 + "+n more").
  const tiles = attentionTiles(readings, section);
  const shown = tiles.slice(0, 3);

  // Gauge member count for the "n of m" line (same denominator as before).
  const gaugeMemberIds = new Set(sectionGauges.flatMap((g) => [...g.members]));
  const voting = readings.filter(
    (r) => gaugeMemberIds.has(r.id) && (r.status === 'warning' || r.status === 'normal'),
  ).length;

  return (
    <article
      className={`flex flex-col gap-2 rounded-[var(--radius-lg)] p-4 ring-1 ${
        step >= 4
          ? 'ring-[var(--color-status-alert)]/30'
          : 'ring-[var(--color-border)]'
      } bg-[var(--color-surface)]`}
    >
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="m-0 text-[var(--type-label)] font-bold text-[var(--color-text-secondary)]">
          {sectionLabel}
        </h3>
        <button
          type="button"
          onClick={() => onJumpSection(section)}
          className="insights-focusable -my-1 cursor-pointer rounded-lg border-0 bg-transparent px-1.5 py-1 text-[var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-4 transition-colors hover:decoration-[var(--color-accent-brand)]"
        >
          {copy.ui.viewSection}
          <span className="sr-only"> — {sectionLabel}</span>
        </button>
      </header>

      {/* H1: verdict word — the page's LARGEST type role. */}
      <p className="m-0 flex items-center gap-3">
        <span className="type-verdict text-[var(--color-text-primary)]">{verdictLabel}</span>
        <VerdictMeter step={step} label={verdictLabel} ariaLabel={ariaLabel} />
      </p>

      {/* R2: the gauges as small readings (name + step word). */}
      <ul className="m-0 flex list-none flex-wrap gap-x-3 gap-y-0.5 p-0" aria-label={copy.ui.heroGaugesLabel}>
        {gaugeRows.map((g) => {
          const gWord =
            g.step === 0
              ? copy.ui.gaugeNoReading
              : g.step === 1
                ? copy.label.relaxed
                : g.step === 2
                  ? copy.label.cautious
                  : g.step === 3
                    ? copy.label.stressed
                    : copy.label.alarmed;
          return (
            <li key={g.gauge} className="text-[var(--type-caption)] text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--color-text-primary)]">
                {copy.groups[g.gauge]}
              </span>{' '}
              · {gWord}
            </li>
          );
        })}
      </ul>

      {/* R2: the one reason line — from the fixed table, gauge-agreeing. */}
      <p className="m-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {reason}
      </p>
      <p className="m-0 text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
        {interpolate(copy.ui.inAlert, {
          warnings: num(tiles.length, numberLocale),
          voting: num(voting, numberLocale),
        })}
      </p>

      {/* R3: needs-attention tiles WITH NUMBERS (largest text in the tile). */}
      {shown.length > 0 ? (
        <div>
          <p className="m-0 mb-1 text-[var(--type-caption)] font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">
            {copy.ui.attentionTilesLabel}
          </p>
          <ul className="m-0 grid list-none grid-cols-1 gap-1.5 p-0 sm:grid-cols-3" aria-label={copy.ui.attentionTilesLabel}>
            {shown.map(({ id }) => {
              const r = readings.find((x) => x.id === id);
              if (!r) return null;
              const def = definitionFor(id);
              const ruleText = formatRuleText(def.rule, id, copy.rule, copy.units, numberLocale);
              const valueText =
                r.value !== null ? formatIndicatorValue(id, r.value, numberLocale, copy.units) : null;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onFocusCard(id)}
                    className="insights-focusable flex h-full w-full cursor-pointer flex-col items-start gap-0.5 rounded-[var(--radius-md)] bg-currena-warning/10 px-3 py-2 text-start ring-1 ring-currena-warning/25 transition-colors hover:bg-currena-warning/20"
                  >
                    <span className="text-[var(--type-caption)] font-bold leading-snug text-[var(--color-text-secondary)]">
                      {copy.indicators[id].name}
                    </span>
                    {valueText !== null ? (
                      <bdi dir="ltr" className="type-number text-[var(--color-text-primary)]">
                        {valueText}
                      </bdi>
                    ) : null}
                    <span className="text-[var(--type-caption)] leading-snug text-[var(--color-text-secondary)]">
                      {ruleText}
                    </span>
                    <span className="sr-only"> — {copy.ui.viewCard}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {tiles.length > 3 ? (
            <button
              type="button"
              onClick={() => onJumpSection(section)}
              className="insights-focusable mt-1.5 inline-flex min-h-[24px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-2.5 py-1 text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
            >
              {interpolate(copy.ui.attentionTileMore, { n: num(tiles.length - 3, numberLocale) })}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* H1: keep the "how is this computed?" link. */}
      <button
        type="button"
        onClick={onJumpAbout}
        className="insights-focusable -ms-1.5 w-fit cursor-pointer rounded-lg border-0 bg-transparent px-1.5 py-1 text-[var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
      >
        {copy.ui.howCalculated}
      </button>
    </article>
  );
}
