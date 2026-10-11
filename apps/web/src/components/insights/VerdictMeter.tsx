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
 * card) and a "+n more" tile (R3) that reveals the remaining tiles IN PLACE
 * (round 33 — the old jump-to-section read as a dead click).
 *
 * Round 33 (owner): the hero region mark steps back DOWN to 48/64 — the
 * 128px artwork here was visual noise; the BIG icons belong to the
 * dedicated Global/Australia sections mid-page.
 *
 * Round-2 D7: Global renders first (no swap setting — retired).
 */

import { useState } from 'react';
import type { IndicatorReading, InsightsSection, IndicatorId } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { IconImg, indicatorIconUrl, sectionIconUrl, stateIconUrl } from '../icons/currena';
import { GAUGES, gaugesForSection, labelForVerdictStep, sectionVerdictStep } from '@currena/insights';
import {
  attentionToneClass,
  attentionTiles,
  definitionFor,
  formatIndicatorValue,
  formatRuleText,
  heroReason,
  stepToneClass,
} from './config';

function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

/** The four-step segmented meter with a marker on the current step.
 *  R30: `large` is the hero's status instrument (taller segments);
 *  `sm` is the compact per-gauge row meter. */
export function VerdictMeter({
  step,
  label,
  ariaLabel,
  size,
}: {
  step: number;
  label: string;
  ariaLabel: string;
  size?: 'lg' | 'sm';
}) {
  return (
    <span
      className={`verdict-meter ${size === 'lg' ? 'verdict-meter-lg' : size === 'sm' ? 'verdict-meter-sm' : ''}`}
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
  // R30: names are the SHORT gauge names (the old full questions read as
  // punctuation errors: "…Alarmed: Are prices heating up?.").
  const reason = heroReason({
    gauges: gaugeRows,
    words: { 1: copy.label.relaxed, 2: copy.label.cautious, 3: copy.label.stressed, 4: copy.label.alarmed },
    calm: copy.ui.heroReasonCalm,
    top: copy.ui.heroReasonTop,
    others: copy.ui.heroReasonOthers,
    othersOne: copy.ui.heroReasonOthersOne,
    othersMixed: copy.ui.heroReasonOthersMixed,
    andWord: copy.ui.heroReasonAndWord,
    is: copy.ui.heroReasonIs,
    are: copy.ui.heroReasonAre,
    notEnough: copy.ui.noSummary,
    nameOf: (gauge) => copy.groupShort[gauge as keyof typeof copy.groupShort] ?? copy.groups[gauge as keyof typeof copy.groups] ?? gauge,
    fmt: (n) => num(n, numberLocale),
  });

  // R3: the needs-attention tiles (extremity-sorted, up to 3 + "+n more").
  // Round 33: "+n more" reveals the rest IN PLACE (local state) — the old
  // jump-to-lane behaviour read as a dead click (the owner: "doesn't show
  // other indicators").
  const tiles = attentionTiles(readings, section);
  const [revealAllTiles, setRevealAllTiles] = useState(false);
  const shown = revealAllTiles ? tiles : tiles.slice(0, 3);

  // Gauge member count for the "n of m" line (same denominator as before).
  const gaugeMemberIds = new Set(sectionGauges.flatMap((g) => [...g.members]));
  const voting = readings.filter(
    (r) => gaugeMemberIds.has(r.id) && (r.status === 'warning' || r.status === 'normal'),
  ).length;

  return (
    <article
      className={`flex h-full flex-col gap-2 rounded-[var(--radius-lg)] p-4 ring-1 ${
        step >= 4
          ? 'ring-[var(--color-status-alert)]/30'
          : 'ring-[var(--color-border)]'
      } bg-[var(--color-surface)]`}
    >
      <header className="flex items-center justify-between gap-3">
        {/* Round 28 (owner): each region wears its own mark — the globe for
         * Global, the map for Australia. Round 33 (owner): back to a QUIET
         * mark (48/64, 64px the hard ceiling) — the 128px hero artwork was
         * visual noise; the big 128px icons now live ONLY on the dedicated
         * sections mid-page (round 33, Insights.tsx). */}
        <IconImg src={sectionIconUrl(section)} size={48} desktopSize={64} />
        <h3 className="type-kicker m-0 min-w-0 flex-1 text-[var(--color-text-tertiary)]">
          {sectionLabel}
        </h3>
        <button
          type="button"
          onClick={() => onJumpSection(section)}
          className="insights-focusable -my-1 cursor-pointer rounded-lg border-0 bg-transparent px-1.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-4 transition-colors hover:decoration-[var(--color-accent-brand)]"
        >
          {copy.ui.viewSection}
          <span className="sr-only">, {sectionLabel}</span>
        </button>
      </header>

      {/* H1: verdict word — the page's LARGEST type role; the word speaks
       * in status ink (R29) beside its meter (never colour alone). R30:
 * the meter is the hero's instrument — the LARGE size. Round 28
       * (owner): the state's own artwork rides beside the word — drawn in
 * the SAME colour coding the app already speaks (green stable, amber
       * cautious, orange stressed, red critical); the word carries the
       * meaning, the artwork the warmth. No reading (step 0) → no icon.
 * Round 29 (owner): the artwork steps up to 44px mobile / 60px
 * desktop — the page's single largest state moment, twice the old
 * desktop size. */}
      <p className="m-0 flex items-center gap-3">
        <span className={`type-verdict ${stepToneClass(step)}`}>{verdictLabel}</span>
        {stateIconUrl(step) !== null ? <IconImg src={stateIconUrl(step)!} size={44} desktopSize={60} className="drop-shadow-sm" /> : null}
        <VerdictMeter step={step} label={verdictLabel} ariaLabel={ariaLabel} size="lg" />
      </p>

      {/* R2 → R30 → round 24 (roast): the gauges as ONE LINE PER GAUGE —
       * short name, its own mini meter, its step word — but ONLY the
       * non-calm ones (the roast: the hero repeated itself; calm rows
       * duplicated what the meter and the sentence already say). Unreadable
       * rows (step 0) stay: they are the honest "cannot read" signal. */}
      {(() => {
        const shownGauges = gaugeRows.filter((g) => g.step !== 1);
        if (shownGauges.length === 0) return null;
        return (
          <ul
            className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-1 p-0 sm:grid-cols-2"
            aria-label={copy.ui.heroGaugesLabel}
          >
            {shownGauges.map((g) => {
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
                <li key={g.gauge} className="flex items-center justify-between gap-2 text-[length:var(--type-label)]">
                  <span className="min-w-0 font-semibold text-[var(--color-text-primary)]">
                    {copy.groupShort[g.gauge as keyof typeof copy.groupShort] ?? copy.groups[g.gauge]}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <VerdictMeter
                      step={g.step}
                      label={gWord}
                      ariaLabel={interpolate(copy.ui.gaugeStepAria, {
                        question: copy.groupShort[g.gauge as keyof typeof copy.groupShort] ?? copy.groups[g.gauge],
                        label: gWord,
                        step: num(g.step, numberLocale),
                      })}
                      size="sm"
                    />
                    <span className={`w-16 text-end font-semibold ${stepToneClass(g.step)}`}>{gWord}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        );
      })()}

      {/* R2: the one reason line — from the fixed table, gauge-agreeing. */}
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {reason}
      </p>
      <p
        className={`m-0 text-[length:var(--type-caption)] font-semibold ${attentionToneClass(tiles.length)}`}
        data-attention-count
      >
        {interpolate(copy.ui.inAlert, {
          warnings: num(tiles.length, numberLocale),
          voting: num(voting, numberLocale),
        })}
      </p>

      {/* R3 → round 24: the needs-attention tiles WITH NUMBERS (largest
       * text in the tile). The count line above IS the section label now —
       * the old separate kicker repeated it verbatim (the roast). Each
       * tile carries its MEANING line (what the fired rule means), not
       * the raw rule ("fix this first" #1); the rule lives in Details.
       * The tint is softened — red is reserved for the words and the
       * count, not a wall of pink (the roast: "soften the hero tiles"). */}
      {shown.length > 0 ? (
        <div>
          <ul className="m-0 grid list-none grid-cols-1 gap-1.5 p-0 sm:grid-cols-3" aria-label={copy.ui.attentionTilesLabel}>
            {shown.map(({ id }) => {
              const r = readings.find((x) => x.id === id);
              if (!r) return null;
              const meaning = copy.meaning[id];
              const meaningText =
                meaning ??
                interpolate(copy.ui.attentionTileRule, {
                  rule: formatRuleText(definitionFor(id).rule, id, copy.rule, copy.units, numberLocale),
                  value: r.value !== null ? formatIndicatorValue(id, r.value, numberLocale, copy.units) : copy.ui.na,
                });
              const valueText =
                r.value !== null ? formatIndicatorValue(id, r.value, numberLocale, copy.units) : null;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onFocusCard(id)}
                    className="insights-focusable flex h-full w-full cursor-pointer flex-col items-start gap-0.5 rounded-[var(--radius-md)] bg-currena-warning/[0.07] px-3 py-2 text-start ring-1 ring-currena-warning/20 transition-colors hover:bg-currena-warning/[0.13]"
                  >
                    <span className="line-clamp-2 min-h-[2.75em] text-[length:var(--type-caption)] font-bold leading-snug text-[var(--color-text-secondary)]">
                      {/* Round 28: the tile's indicator wears its artwork when
                       * one exists — inline so the clamped name stays tidy.
                       * Round 29: 20/24px, visible at the tile's scale. */}
                      {indicatorIconUrl(id) !== null ? (
                        <IconImg src={indicatorIconUrl(id)!} size={20} desktopSize={24} className="me-1 inline-block align-text-bottom" />
                      ) : null}
                      {copy.indicators[id].name}
                    </span>
                    {valueText !== null ? (
                      <bdi className="type-number tabular-nums text-[var(--color-text-primary)]">
                        {valueText}
                      </bdi>
                    ) : null}
                    <span className="text-[length:var(--type-caption)] leading-snug text-[var(--color-text-secondary)]">
                      {meaningText}
                    </span>
                    <span className="sr-only">, {copy.ui.viewCard}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {tiles.length > 3 && !revealAllTiles ? (
            <button
              type="button"
              aria-expanded={false}
              onClick={() => setRevealAllTiles(true)}
              className="insights-focusable mt-1.5 inline-flex min-h-[24px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
            >
              {interpolate(copy.ui.attentionTileMore, { n: num(tiles.length - 3, numberLocale) })}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* H1: keep the "how is this computed?" link — pinned to the card's
       * bottom edge so the shorter card carries no floating void. */}
      <button
        type="button"
        onClick={onJumpAbout}
        className="insights-focusable -ms-1.5 mt-auto w-fit cursor-pointer rounded-lg border-0 bg-transparent px-1.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
      >
        {copy.ui.howCalculated}
      </button>
    </article>
  );
}
