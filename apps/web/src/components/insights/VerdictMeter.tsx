/**
 * VerdictMeter — Block H1: "Remove the 7-segment LED digit boxes. For each
 * region, show the region name, a segmented meter with four steps, a marker
 * on the current step, and the verdict word." One plain sentence under the
 * meter, "n of m indicators in alert", the how-is-this-computed link, and a
 * text alternative ("Australia: cautious, step 2 of 4").
 *
 * The 7-segment LED module (the old "one recognisable Currena element")
 * retired here per the owner's spec — the meter carries the same at-a-
 * glance job without the alarm-only red digits.
 */

import type { IndicatorReading, InsightsSection, IndicatorId } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { GAUGES, labelForVerdictStep, sectionVerdictStep } from '@currena/insights';
import { alertingIndicators } from './config';

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
 * One region's verdict block: name, meter, verdict word, plain sentence,
 * "n of m in alert" + up to three alerting-indicator name chips (H2) with
 * a "+n more" chip. The whole header is a button jumping to the region's
 * lane (I9 semantics, kept).
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
  const alerts = alertingIndicators(readings, section);
  const alertCount = alerts.length;
  // Voting members = the section's gauge members with a votable status
  // (warnings + normals — the same denominator summarizeByGauges writes).
  const gaugeMemberIds = new Set(
    GAUGES.filter((g) => g.section === section).flatMap((g) => [...g.members]),
  );
  const voting = readings.filter(
    (r) => gaugeMemberIds.has(r.id) && (r.status === 'warning' || r.status === 'normal'),
  ).length;

  const verdictLabel = labelWord ? copy.label[labelWord] : copy.ui.gaugeNoReading;
  const ariaLabel = interpolate(copy.ui.verdictStepAria, {
    section: sectionLabel,
    label: verdictLabel,
    step: num(step || 0, numberLocale),
  });
  const inAlert = interpolate(copy.ui.inAlert, {
    warnings: num(alertCount, numberLocale),
    voting: num(voting, numberLocale),
  });
  const sentence =
    labelWord !== null
      ? copy.ui.verdictSentence[labelWord]
      : copy.ui.gaugeNoReading;

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

      {/* H1: one plain sentence under the meter. */}
      <p className="m-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {sentence}
      </p>
      <p className="m-0 text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
        {inAlert}
      </p>

      {/* H2: alerting indicators BY NAME (up to three, sorted by 10-year
       * range height — alertingIndicators() did the sorting). */}
      {alerts.length > 0 ? (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label={copy.ui.alertChipsTitle}>
          {alerts.slice(0, 3).map(({ id }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => onFocusCard(id)}
                className="insights-focusable inline-flex min-h-[24px] cursor-pointer items-center rounded-full bg-currena-warning/12 px-2.5 py-1 text-[var(--type-caption)] font-semibold text-[var(--color-status-alert)] transition-colors hover:bg-currena-warning/20"
              >
                {copy.indicators[id].name}
                <span className="sr-only"> — {copy.ui.viewCard}</span>
              </button>
            </li>
          ))}
          {alerts.length > 3 ? (
            <li>
              <button
                type="button"
                onClick={() => onJumpSection(section)}
                className="insights-focusable inline-flex min-h-[24px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-2.5 py-1 text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
              >
                {interpolate(copy.ui.alertChipMore, { n: num(alerts.length - 3, numberLocale) })}
              </button>
            </li>
          ) : null}
        </ul>
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
