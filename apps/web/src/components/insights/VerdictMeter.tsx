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
 * long currency label ('۱۲۵٫۴۴ دلار آمریکا') keeps the number's row.
 *
 * Round 41 (owner): the state's artwork LEADS the row — [icon][word] —
 * the old word-first order read as [stressed][icon]; the mark now opens
 * the state moment exactly like every other chip in the app (StatusChip
 * has always been icon-then-word). The meter stays last.
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
  indicatorValueParts,
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
 * desktop size. Round 41 (owner): the artwork moves IN FRONT of the
 * word — [icon][word] — the state's mark LEADS the row (the old
 * word-first order read as [stressed][icon]); same reading order as
 * every other chip in the app. The meter stays last. */}
      <p className="m-0 flex items-center gap-3">
        {stateIconUrl(step) !== null ? <IconImg src={stateIconUrl(step)!} size={44} desktopSize={60} className="drop-shadow-sm" /> : null}
        <span className={`type-verdict ${stepToneClass(step)}`}>{verdictLabel}</span>
        <VerdictMeter step={step} label={verdictLabel} ariaLabel={ariaLabel} size="lg" />
      </p>

      {/* R2 → R30 → round 24 (roast) → round 36 (owner): the gauges as ONE
       * LINE PER GAUGE — short name, its own mini meter, its step word —
       * but ONLY the non-calm ones (the roast: the hero repeated itself;
       * calm rows duplicated what the meter and the sentence already say).
       * Unreadable rows (step 0) stay: they are the honest "cannot read"
       * signal. Round 36 (owner): "align this 6 boxes — too visual noise"
       * → every row is EXACTLY ONE LINE HIGH: the name owns the flex room
       * and truncates with its full text on hover (the old wrap made
       * "Borrowing costs" rows 42px while single-line neighbours sat at
       * 21px — the six boxes zig-zagged). And the small meters + their
       * words are NOT colour-coded any more (see the sm CSS + the word's
       * normal ink): the colour rainbow on six small rows was the noise;
       * the colour coding stays on the hero's BIG meter and word only. */}
      {(() => {
        const shownGauges = gaugeRows.filter((g) => g.step !== 1);
        if (shownGauges.length === 0) return null;
        return (
          <ul
            className="m-0 grid list-none grid-cols-1 gap-x-5 gap-y-1 p-0 sm:grid-cols-2"
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
              const gaugeName = copy.groupShort[g.gauge as keyof typeof copy.groupShort] ?? copy.groups[g.gauge];
              return (
                <li key={g.gauge} className="flex items-center gap-1.5 text-[length:var(--type-label)]">
                  {/* Round 36: the name owns the row's free width and NEVER
                   * wraps (truncate) — every box is one line high, so the
                   * meters and words sit on the same baselines across all
                   * six boxes BY STRUCTURE (the alignment decree). The full
                   * name stays on hover (title) and in the meter's aria. */}
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
                    {/* Round 36: normal ink, not the step's status colour —
                     * the word still names the step (never colour alone). */}
                    <span className="w-16 shrink-0 text-end font-semibold text-[var(--color-text-secondary)]">{gWord}</span>
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
      {/* Step-1 audit item E3: the CALM areas ride beside the stressed ones
       * ("Financial stress and the yield curve are normal, so the stress is
       * in prices, not in markets") — one quiet line naming what is calm,
       * shown only when calm and non-calm coexist. */}
      {(() => {
        const calmGauges = gaugeRows.filter((g) => g.step === 1);
        const nonCalm = gaugeRows.filter((g) => g.step !== 1);
        if (calmGauges.length === 0 || nonCalm.length === 0) return null;
        const calmNames = calmGauges
          .map((g) => copy.groupShort[g.gauge as keyof typeof copy.groupShort] ?? copy.groups[g.gauge as keyof typeof copy.groups] ?? g.gauge)
          .join(', ');
        return (
          <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
            <bdi>{interpolate(copy.ui.heroCalmList, { names: calmNames })}</bdi>
          </p>
        );
      })()}
      {/* Step-1 audit item E1: the count rule for the verdict word, displayed
       * beside the word it produced — the SAME rule for both regions. */}
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]">
        <bdi>{copy.ui.verdictRule}</bdi>
      </p>
      {/* R3 → round 24 → R40 (owner): the count line, the needs-attention
       * tiles WITH NUMBERS (largest text in the tile), the "+n more"
       * reveal and the how-link are ONE bottom-anchored module — a single
       * mt-auto pins its top edge, so the tile ROW starts at the same y in
       * BOTH hero panels by structure (the alignment decree): Australia's
       * taller gauge/reason block used to push its row lower and the two
       * rows zig-zagged; the free space now lives above the module. Each
       * tile face is geometry-fixed — 2-line clamped name, one-line value
       * with the unit read SMALL (R40: '۱۲۵٫۴۴ دلار آمریکا' keeps the
       * number's row), 3-line clamped meaning — so the row height is
       * identical across regions. The tint is softened — red is reserved
       * for the words and the count, not a wall of pink. */}
      <div className="mt-auto" data-attention-module>
        {/* §5.3 hero integration: the raised world-markets signal appears
         * in the named-alerts module WITH ITS NUMBERS, using the module's
         * own tone language (attention = the alert red, unusual = the amber
         * watch ink — the same tiers the tiles speak). Clicking jumps to the
         * world-markets section. */}
        {marketsAlert ? (
          <button
            type="button"
            onClick={() => onJumpMarkets?.()}
            className={`insights-focusable -my-0.5 mb-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 text-start text-[length:var(--type-caption)] font-bold underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-80 ${
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
        ) : null}
        {/* §6.5 hero integration (currencies build step 11): the raised
         * currency signal appears in the SAME named-alerts module, with its
         * PATTERN NAMES (the cards carry the detail) — no new card. */}
        {fxAlert ? (
          <button
            type="button"
            onClick={() => onJumpFx?.()}
            className={`insights-focusable -my-0.5 mb-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 text-start text-[length:var(--type-caption)] font-bold underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-80 ${
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
        ) : null}
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

        {/* §6.11/§9.10: the two world sections as SEPARATE indicators —
         * each with its own measure label and chip, never merged. A calm
         * stock section beside a warning currency pattern is the designed
         * state (they measure different things); the labels say so. */}
        {sectionIndicators !== undefined && sectionIndicators.length > 0 ? (
          <p className="m-0 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[length:var(--type-caption)] font-semibold" data-section-indicators>
            {sectionIndicators.map((ind, i) => (
              <span key={i} className="inline-flex flex-wrap items-center gap-1">
                {ind.signal !== 'normal' && ind.onJump !== undefined ? (
                  <button
                    type="button"
                    onClick={ind.onJump}
                    data-section-indicator={ind.signal}
                    className={`insights-focusable cursor-pointer rounded-md border-0 bg-transparent px-1 py-0.5 font-bold underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-80 ${
                      ind.signal === 'unusual'
                        ? 'text-[var(--color-status-watch)]'
                        : 'text-[var(--color-status-alert)]'
                    }`}
                  >
                    {ind.label}
                    <span className="ms-1 font-bold">· {ind.signal === 'unusual' ? copy.fx.chipUnusual : copy.fx.chipAttention}</span>
                  </button>
                ) : (
                  <span className="px-1 py-0.5 text-[var(--color-text-tertiary)]" data-section-indicator="normal">
                    {ind.label}
                    <span className="ms-1">· {copy.fx.chipNormal}</span>
                  </span>
                )}
              </span>
            ))}
          </p>
        ) : null}

        {shown.length > 0 ? (
          <div className="mt-2">
            <ul className="m-0 grid list-none grid-cols-1 gap-1 p-0 sm:grid-cols-3" aria-label={copy.ui.attentionTilesLabel}>
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
                const valueParts =
                  r.value !== null ? indicatorValueParts(id, r.value, numberLocale, copy.units) : null;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => onFocusCard(id)}
                      className="insights-focusable flex h-full w-full cursor-pointer flex-col items-start gap-0.5 rounded-[var(--radius-md)] bg-currena-warning/[0.07] px-2 py-2 text-start ring-1 ring-currena-warning/20 transition-colors hover:bg-currena-warning/[0.13]"
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

        {/* H1 → R40: the "how is this computed?" link rides INSIDE the
         * anchored module — it keeps its place at the tiles' bottom edge
         * without owning the card's free space any more. */}
        <button
          type="button"
          onClick={onJumpAbout}
          className="insights-focusable -ms-1.5 mt-1.5 w-fit cursor-pointer rounded-lg border-0 bg-transparent px-1.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
        >
          {copy.ui.howCalculated}
        </button>
      </div>
    </article>
  );
}
