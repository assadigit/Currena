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
 * Round 40 (owner): the two regions' attention-tile ROWS align — the
 * count line + tiles + "+n more" + how-link are ONE bottom-anchored
 * module (single mt-auto), and each tile face is geometry-fixed (2-line
 * clamped name / one-line value / 3-line clamped meaning) so the row's
 * height is identical across regions. The value's unit reads SMALL so a
 * long currency label ('۱۲۵٫۴۴ دلار') keeps the number's row.
 *
 * Round 41 (owner): the state's artwork LEADS the row — [icon][word] —
 * the old word-first order read as [stressed][icon]; the mark now opens
 * the state moment exactly like every other chip in the app (StatusChip
 * has always been icon-then-word). The meter stays last.
 *
 * Round-2 D7: Global renders first (no swap setting — retired).
 *
 * Round 42 (owner, “too much color — everything and nothing”): the card
 * calms down —
 *  1. the region mark drops to a quiet 24/28 (the big artwork lives in the
 *     dedicated sections mid-page);
 *  2. the state artwork rides smaller (32/40), proportionate to its word;
 *  3. the gauges GROUP BY STATUS — one box per step word (Stressed: … /
 *     Stable: …) — the flat chip row, the computed reason sentence and the
 *     calm line all said the same thing three times; the grouping IS the
 *     sentence now (heroReason stays in config, pinned by its tests);
 *  4. the long verdict-rule paragraph hides behind a quiet "?" tip;
 *  5. the red alert lines group into ONE bounded container with bullets
 *     (red stays on the alert words, not as open text on the card);
 *  6. the how-link hides behind the same "?" tip pattern (short answer +
 *     a link to the full explainer);
 *  7. the four-segment meters go low-key (one neutral ink, see index.css
 *     round 42) and the attention tiles lose their pink tint for neutral
 *     surfaces.
 *
 * Round 43 (owner, on the round-42 result):
 *  1. the meters REVERT to the four-step status inks (index.css round 43 —
 *     the round-36/42 neutral-ink decree is reversed);
 *  2. the two "?" tips move from lone floats to their subjects: the
 *     verdict-rule tip seats in the FIRST status group's header (beside
 *     the group word it explains), the how-computed tip rides the verdict
 *     row itself;
 *  3. the attention module flows from the top — the old bottom-anchor
 *     turned the Australia card's missing bullets into a mid-card hole;
 *     now the spare space falls to the card's bottom inside edge (reads
 *     as padding — the R30 equal-height stretch stays);
 *  4. the alert bullets get an explicit flex marker so the dot sits at
 *     the sentence START in every direction (the old ::marker rode the
 *     button's last text baseline — it landed beside the WRAPPED line);
 *  5. the alert container becomes clearly visible: a soft alert-tinted
 *     bounded box (the reds stop floating as open text);
 *  6. the bullet-less card (Australia never grows the alert box — the
 *     section signals are Global-scope) leads with SIX of its own
 *     attention tiles instead of three — the card's real "items to
 *     mention" fill the space the alert box would have taken, so the
 *     stretch no longer strands a mid-card hole or a bottom void.
 *
 * Round 44 (owner, "color grading"): the four-segment meter stops being
 * a rainbow. It grades in ONE hue — the CURRENT step's: the highest
 * filled segment wears the full step ink and the segments BEFORE it wear
 * progressively whiter tints of the same hue ([palest] → [pale] → … →
 * [full]; stable stays pure green). The component only carries the
 * current step to the stylesheet (data-step) — index.css round 44 owns
 * the tint ramp. Every size and every meter on the page grades the same
 * way (hero, per-gauge rows, markets verdict, per-question headers).
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
  indicatorValueParts,
  stepToneClass,
} from './config';
import { GlossaryTip } from './world-currencies/GlossaryTip';

function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

/* Round 43: the alert bullet's explicit marker — one shared element (the
 * old ::marker rode the button's last-line baseline and landed beside the
 * wrapped line; a flex marker sits at the sentence START in every
 * direction). Static JSX, safe to reuse in every bullet row. */
const BULLET_DOT = (
  <span aria-hidden="true" className="shrink-0 select-none leading-[1.6] text-[var(--color-text-tertiary)]">
    •
  </span>
);

/** The four-step segmented meter with a marker on the current step.
 *  R30: `large` is the hero's status instrument (taller segments);
 *  `sm` is the compact per-gauge row meter.
 *  Round 44 (owner): data-step carries the current step to index.css,
 *  which paints the filled segments as ONE hue graded pale→full toward
 *  the current step (the old per-segment rainbow inks are retired). */
export function VerdictMeter({
  step,
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
      data-step={step}
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
 * The world-markets section signal joining the hero's attention module
 * (insights-world-markets-spec.md §5.3 / build step 9): raised signals
 * appear with their numbers inside the named-alerts module — the existing
 * mechanism, no new card.
 */
export interface MarketsAlert {
  /** The raised signal ('attention' | 'unusual'; 'normal' never alerts). */
  signal: 'attention' | 'unusual';
  /** Markets in Correction or Bear market. */
  n: number;
  /** Total market rows (16 once populated). */
  count: number;
}

/**
 * The world-currencies section signal joining the same module
 * (insights-world-currencies-spec.md §6.5 / build step 11): raised
 * signals appear with their PATTERN NAMES — the existing mechanism,
 * no new card.
 */
export interface FxAlert {
  /** The raised signal ('attention' | 'unusual'; 'normal' never alerts). */
  signal: 'attention' | 'unusual';
  /** The active patterns' names (the cards below carry the detail). */
  patterns: string[];
}

/**
 * §6.11/§9.10 — the two world sections as SEPARATE indicators in the
 * transparent count: each shown with its own measure label and chip,
 * never merged (a calm stock section and a warning currency pattern are
 * both true, because they measure different things).
 */
export interface SectionIndicatorState {
  signal: 'normal' | 'attention' | 'unusual';
  /** The §6.11/§9.10 measure label for the current signal. */
  label: string;
  /** Scroll to the section when its indicator is used (raised signals). */
  onJump?: () => void;
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
  marketsAlert,
  onJumpMarkets,
  fxAlert,
  onJumpFx,
  sectionIndicators,
}: {
  section: InsightsSection;
  sectionLabel: string;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onJumpSection: (section: InsightsSection) => void;
  onJumpAbout: () => void;
  onFocusCard: (id: IndicatorId) => void;
  /** §5.3: the raised world-markets signal (Global block only). */
  marketsAlert?: MarketsAlert;
  /** Scroll to the world-markets section when the alert line is used. */
  onJumpMarkets?: () => void;
  /** §6.5: the raised world-currencies signal (Global block only). */
  fxAlert?: FxAlert;
  /** Scroll to the world-currencies section when the alert line is used. */
  onJumpFx?: () => void;
  /** §6.11/§9.10: the two world sections as separate indicators (Global block only). */
  sectionIndicators?: readonly SectionIndicatorState[];
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

  // R3: the needs-attention tiles (extremity-sorted). Round 33: "+n more"
  // reveals the rest IN PLACE (local state). Round 43 (owner): a card with
  // no section-signal bullets (Australia never grows the alert box — the
  // signals are Global-scope) leads with SIX of its own attention tiles —
  // the card's real "items to mention" fill the space the alert box would
  // have taken; a card WITH bullets keeps the 3 + "+n more" economy.
  const tiles = attentionTiles(readings, section);
  const hasBullets =
    marketsAlert !== undefined ||
    fxAlert !== undefined ||
    (sectionIndicators !== undefined && sectionIndicators.length > 0);
  const baseReveal = hasBullets ? 3 : 6;
  const [revealAllTiles, setRevealAllTiles] = useState(false);
  const shown = revealAllTiles ? tiles : tiles.slice(0, baseReveal);

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
         * Global, the map for Australia. Round 33: a QUIET mark (48/64).
         * Round 42 (owner): quieter still — 24/28, a compact identifier in
         * the header line; the artwork moments belong to the dedicated
         * sections mid-page. */}
        <IconImg src={sectionIconUrl(section)} size={24} desktopSize={28} />
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
 * desktop size. Round 41 (owner): the artwork moves IN FRONT of the
 * word — [icon][word] — the state's mark LEADS the row (the old
 * word-first order read as [stressed][icon]); same reading order as
 * every other chip in the app. The meter stays last. */}
      {/* Round 43 (owner): the "how is this computed?" tip rides the row it
       * explains — the verdict itself — instead of floating at the card's
       * foot. The panel wraps to its own full-width line (panelClassName). */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="m-0 flex min-w-0 flex-1 items-center gap-3">
          {/* Round 42 (owner): the artwork rides SMALLER (32/40) — still the
           * page's warm status moment beside its word, no longer a shout. */}
          {stateIconUrl(step) !== null ? <IconImg src={stateIconUrl(step)!} size={32} desktopSize={40} className="drop-shadow-sm" /> : null}
          <span className={`type-verdict ${stepToneClass(step)}`}>{verdictLabel}</span>
          <VerdictMeter step={step} label={verdictLabel} ariaLabel={ariaLabel} size="lg" />
        </p>
        <GlossaryTip srLabel={copy.ui.howCalculated} panelClassName="w-full basis-full">
          <bdi>{copy.ui.explainerIntro}</bdi>
          <button
            type="button"
            onClick={onJumpAbout}
            className="insights-focusable mt-1 inline-flex w-fit cursor-pointer items-center rounded-lg border-0 bg-transparent p-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
          >
            {copy.ui.explainerFullLink} ↧
          </button>
        </GlossaryTip>
      </div>

      {/* R2 → R30 → round 24 → round 36 → round 42 (owner): the gauges
       * GROUPED BY STATUS. The old flat row of chips + the computed reason
       * sentence + the calm line said the same thing three times (the
       * roast: "it's everything and nothing because it's confusing"). Now
       * ONE grouped module: a quiet box per step word — "Stressed:" names
       * its areas, "Stable:" names the calm ones, the areas keep their
       * mini meters — the grouping IS the sentence, and it can never
       * contradict the gauges because it IS the gauges. Unreadable rows
       * (step 0) keep their honest group at the end; when NO gauge is
       * readable the module says so in one line (the old notEnough path).
       * Rows stay exactly one line high (round 36's alignment decree) and
       * the per-row word is gone — the group's word covers every row under
       * it; each meter's aria still names its own step. */}
      {(() => {
        const readable = gaugeRows.filter((g) => g.step >= 1);
        const zeroRows = gaugeRows.filter((g) => g.step === 0);
        const wordOfStep = (s: number) =>
          s === 1 ? copy.label.relaxed : s === 2 ? copy.label.cautious : s === 3 ? copy.label.stressed : copy.label.alarmed;
        if (readable.length === 0 && zeroRows.length === 0) {
          /* No gauges at all — the rule tip keeps its standalone home. */
          return (
            <div>
              <GlossaryTip def={copy.ui.verdictRule} srLabel={copy.ui.verdictRuleLabel} />
            </div>
          );
        }
        /* Round 43 (owner): the verdict-rule tip seats in the FIRST group's
         * header — beside the status word it explains — instead of floating
         * alone under the groups. */
        const ruleTip = (
          <GlossaryTip def={copy.ui.verdictRule} srLabel={copy.ui.verdictRuleLabel} panelClassName="w-full basis-full" />
        );
        if (readable.length === 0) {
          return (
            <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
              {copy.ui.noSummary}
              {ruleTip}
            </p>
          );
        }
        const steps = [4, 3, 2, 1].filter((s) => readable.some((g) => g.step === s));
        return (
          <ul
            className="m-0 flex list-none flex-col gap-1.5 p-0"
            aria-label={copy.ui.heroGaugesLabel}
            data-hero-gauges
          >
            {steps.map((s, si) => (
              <li
                key={s}
                className="rounded-[var(--radius-md)] bg-currena-muted/[0.05] px-2.5 py-2 ring-1 ring-[var(--color-border)]/60"
                data-gauge-group={s}
              >
                <p className="m-0 mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="inline-flex rounded-full bg-currena-muted/15 px-2 py-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
                    {wordOfStep(s)}
                  </span>
                  {si === 0 ? ruleTip : null}
                </p>
                <ul className="m-0 grid list-none grid-cols-1 gap-x-5 gap-y-1 p-0 sm:grid-cols-2">
                  {readable
                    .filter((g) => g.step === s)
                    .map((g) => {
                      const gWord = wordOfStep(g.step);
                      const gaugeName =
                        copy.groupShort[g.gauge as keyof typeof copy.groupShort] ?? copy.groups[g.gauge];
                      return (
                        <li key={g.gauge} className="flex items-center gap-1.5 text-[length:var(--type-label)]">
                          <span
                            title={gaugeName}
                            className="min-w-0 flex-1 truncate font-semibold text-[var(--color-text-primary)]"
                          >
                            {gaugeName}
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            <VerdictMeter
                              step={g.step}
                              label={gWord}
                              ariaLabel={interpolate(copy.ui.gaugeStepAria, {
                                question: gaugeName,
                                label: gWord,
                                step: num(g.step, numberLocale),
                              })}
                              size="sm"
                            />
                          </span>
                        </li>
                      );
                    })}
                </ul>
              </li>
            ))}
            {zeroRows.length > 0 ? (
              <li
                className="rounded-[var(--radius-md)] bg-currena-muted/[0.05] px-2.5 py-2 ring-1 ring-[var(--color-border)]/60"
                data-gauge-group="0"
              >
                <p className="m-0 mb-1">
                  <span className="inline-flex rounded-full bg-currena-muted/15 px-2 py-0.5 text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
                    {copy.ui.gaugeNoReading}
                  </span>
                </p>
                <ul className="m-0 grid list-none grid-cols-1 gap-x-5 gap-y-1 p-0 sm:grid-cols-2">
                  {zeroRows.map((g) => {
                    const gaugeName =
                      copy.groupShort[g.gauge as keyof typeof copy.groupShort] ?? copy.groups[g.gauge];
                    return (
                      <li key={g.gauge} className="flex items-center gap-1.5 text-[length:var(--type-label)]">
                        <span
                          title={gaugeName}
                          className="min-w-0 flex-1 truncate font-semibold text-[var(--color-text-primary)]"
                        >
                          {gaugeName}
                        </span>
                        <VerdictMeter
                          step={g.step}
                          label={copy.ui.gaugeNoReading}
                          ariaLabel={interpolate(copy.ui.gaugeStepAria, {
                            question: gaugeName,
                            label: copy.ui.gaugeNoReading,
                            step: num(g.step, numberLocale),
                          })}
                          size="sm"
                        />
                      </li>
                    );
                  })}
                </ul>
              </li>
            ) : null}
          </ul>
        );
      })()}
      {/* R3 → round 24 → R40 (owner) → round 42 (owner): the count line,
       * the needs-attention tiles WITH NUMBERS (largest text in the tile)
       * and the "+n more" reveal are ONE module. It was bottom-anchored
       * (R40: a single mt-auto pinned the tile ROW to the same y in both
       * hero panels), but round 42's alert container only ever fills the
       * GLOBAL card — Australia never grows one — so the anchor turned
       * Australia's missing bullets into a mid-card hole. Round 43 (owner):
       * the module flows from the top and the spare space falls to the
       * card's bottom inside edge (reads as padding); the R30 equal-height
       * stretch stays. Each tile face is geometry-fixed — 2-line clamped
       * name, one-line value with the unit read SMALL (R40), 3-line clamped
       * meaning — so the row height is identical across regions.
       * Round 42 (owner): the red notes group into ONE bounded container
       * with bullets — the count line is the container's header, each
       * raised signal becomes one bullet — so the reds stop floating as
       * open text on the card. With nothing to list, the count line rides
       * bare as before. The tiles lose their pink tint for neutral
       * surfaces (red stays on the words, not as a wall of pink).
       * Round 43 (owner): the container becomes clearly visible — a soft
       * alert-tinted box; each bullet carries an EXPLICIT flex marker so
       * the dot sits at the sentence START (the old ::marker rode the
       * button's last-line baseline and landed beside the wrapped line);
       * and the module flows from the top — the old bottom-anchor (mt-auto)
       * turned Australia's missing bullets into a mid-card hole, while the
       * spare space now falls to the card's bottom inside edge (the R30
       * equal-height stretch stays). */}
      <div data-attention-module>
        {(() => {
          const countLine = (
            <p
              className={`m-0 text-[length:var(--type-caption)] font-semibold ${attentionToneClass(
                tiles.length + (marketsAlert ? 1 : 0) + (fxAlert ? 1 : 0),
              )}`}
              data-attention-count
              data-markets-in-count={marketsAlert ? 'true' : undefined}
              data-fx-in-count={fxAlert ? 'true' : undefined}
            >
              {interpolate(copy.ui.inAlert, {
                warnings: num(tiles.length, numberLocale),
                voting: num(voting, numberLocale),
              })}
            </p>
          );
          if (!hasBullets) return countLine;
          return (
            <div
              className="rounded-[var(--radius-md)] bg-[var(--color-status-alert)]/[0.05] px-3 py-2.5 ring-1 ring-[var(--color-status-alert)]/25"
              data-attention-box
            >
              {countLine}
              <ul
                className="m-0 mt-2 list-none space-y-1.5 p-0"
                data-attention-bullets
              >
                {/* §5.3 hero integration: the raised world-markets signal
                 * appears WITH ITS NUMBERS, using the module's own tone
                 * language (attention = the alert red, unusual = the amber
                 * watch ink). Clicking jumps to the world-markets section. */}
                {marketsAlert ? (
                  <li className="flex items-start gap-1.5">
                    {BULLET_DOT}
                    <button
                      type="button"
                      onClick={() => onJumpMarkets?.()}
                      className={`insights-focusable -ms-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 text-start text-[length:var(--type-caption)] font-bold underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-80 ${
                        marketsAlert.signal === 'unusual'
                          ? 'text-[var(--color-status-watch)]'
                          : 'text-[var(--color-status-alert)]'
                      }`}
                      data-markets-signal={marketsAlert.signal}
                    >
                      <bdi>
                        {interpolate(
                          marketsAlert.signal === 'unusual'
                            ? copy.markets.heroAlertUnusual
                            : copy.markets.heroAlertAttention,
                          {
                            n: num(marketsAlert.n, numberLocale),
                            count: num(marketsAlert.count, numberLocale),
                          },
                        )}
                      </bdi>
                    </button>
                  </li>
                ) : null}
                {/* §6.5 hero integration (currencies build step 11): the
                 * raised currency signal with its PATTERN NAMES (the cards
                 * carry the detail) — no new card. */}
                {fxAlert ? (
                  <li className="flex items-start gap-1.5">
                    {BULLET_DOT}
                    <button
                      type="button"
                      onClick={() => onJumpFx?.()}
                      className={`insights-focusable -ms-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 text-start text-[length:var(--type-caption)] font-bold underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-80 ${
                        fxAlert.signal === 'unusual'
                          ? 'text-[var(--color-status-watch)]'
                          : 'text-[var(--color-status-alert)]'
                      }`}
                      data-fx-signal={fxAlert.signal}
                    >
                      <bdi>
                        {interpolate(
                          fxAlert.signal === 'unusual' ? copy.fx.heroAlertUnusual : copy.fx.heroAlertAttention,
                          { patterns: fxAlert.patterns.join(' · ') },
                        )}
                      </bdi>
                    </button>
                  </li>
                ) : null}
                {/* §6.11/§9.10: the two world sections as SEPARATE
                 * indicators — each with its own measure label and chip,
                 * never merged. A calm stock section beside a warning
                 * currency pattern is the designed state (they measure
                 * different things); the labels say so. */}
                {(sectionIndicators ?? []).map((ind, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    {BULLET_DOT}
                    {ind.signal !== 'normal' && ind.onJump !== undefined ? (
                      <button
                        type="button"
                        onClick={ind.onJump}
                        data-section-indicator={ind.signal}
                        className={`insights-focusable -ms-1 cursor-pointer rounded-md border-0 bg-transparent px-1 py-0.5 text-start text-[length:var(--type-caption)] font-bold underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-80 ${
                          ind.signal === 'unusual'
                            ? 'text-[var(--color-status-watch)]'
                            : 'text-[var(--color-status-alert)]'
                        }`}
                      >
                        {ind.label}
                        <span className="ms-1 font-bold">· {ind.signal === 'unusual' ? copy.fx.chipUnusual : copy.fx.chipAttention}</span>
                      </button>
                    ) : (
                      <span className="px-1 py-0.5 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-tertiary)]" data-section-indicator="normal">
                        {ind.label}
                        <span className="ms-1">· {copy.fx.chipNormal}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {shown.length > 0 ? (
          <div className="mt-2">
            <ul className="m-0 grid list-none grid-cols-1 gap-1 p-0 sm:grid-cols-3" aria-label={copy.ui.attentionTilesLabel}>
              {shown.map(({ id }) => {
                const r = readings.find((x) => x.id === id);
                if (!r) return null;
                // Fix spec A-02 (2026-10-14): the tile's meaning text is
                // GENERATED from the reading's rule and value — the
                // hand-written meanings are gone.
                const meaningText = interpolate(copy.ui.attentionTileRule, {
                  rule: formatRuleText(definitionFor(id).rule, id, copy.rule, copy.units, numberLocale),
                  value: r.value !== null ? formatIndicatorValue(id, r.value, numberLocale, copy.units) : copy.ui.na,
                });
                const valueParts =
                  r.value !== null ? indicatorValueParts(id, r.value, numberLocale, copy.units) : null;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => onFocusCard(id)}
                      className="insights-focusable flex h-full w-full cursor-pointer flex-col items-start gap-0.5 rounded-[var(--radius-md)] bg-currena-muted/[0.06] px-2 py-2 text-start ring-1 ring-[var(--color-border)]/70 transition-colors hover:bg-currena-muted/[0.13]"
                    >
                      <span className="flex h-[2.75em] w-full items-start gap-1 text-[length:var(--type-caption)] font-bold leading-snug text-[var(--color-text-secondary)]">
                        {/* Round 28: the tile's indicator wears its artwork when
                         * one exists. R40: the artwork leaves the text flow — a
                         * flex sibling beside the clamped name, so a 24px icon
                         * can no longer inflate the line box (the old inline
                         * icon made 2-line titles 41px vs 34px and pushed that
                         * tile's value 7px below its neighbours); the title row
                         * is now EXACTLY 2.75em in every tile (the alignment
                         * decree). Round 29: 20/24px, visible at tile scale. */}
                        {indicatorIconUrl(id) !== null ? (
                          <IconImg src={indicatorIconUrl(id)!} size={20} desktopSize={24} />
                        ) : null}
                        <span className="line-clamp-2 min-w-0 flex-1">{copy.indicators[id].name}</span>
                      </span>
                      {valueParts !== null ? (
                        <bdi className="type-number inline-flex flex-wrap items-baseline gap-x-1 text-[var(--color-text-primary)]">
                          <span>{valueParts.value}</span>
                          {valueParts.unit !== null ? (
                            <span className="whitespace-nowrap text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                              {valueParts.unit}
                            </span>
                          ) : null}
                        </bdi>
                      ) : null}
                      <span className="mt-auto line-clamp-3 min-h-[4.125em] text-[length:var(--type-caption)] leading-snug text-[var(--color-text-secondary)]">
                        {meaningText}
                      </span>
                      <span className="sr-only">, {copy.ui.viewCard}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {tiles.length > baseReveal && !revealAllTiles ? (
              <button
                type="button"
                onClick={() => setRevealAllTiles(true)}
                className="insights-focusable mt-1.5 inline-flex min-h-[24px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
              >
                {interpolate(copy.ui.attentionTileMore, { n: num(tiles.length - shown.length, numberLocale) })}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
