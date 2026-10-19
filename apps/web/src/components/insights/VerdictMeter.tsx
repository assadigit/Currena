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
 *
 * Editorial handoff (2026-10-19, docs/insights/
 * economic-indicators-editorial-spec.md): the two overview cards open
 * with the quiet ART BAND (Sydney Harbour / faint world map, §7) behind
 * the header + count line; the region title speaks the navy print ink
 * (--ei-navy); the verdict word + state artwork ride in ONE compact
 * tinted pill (.ei-state-pill, §4) with the meter still beside it; the
 * flagged rows lead with the indicator's own subject artwork in a soft
 * container (the alert triangle keeps the tier when no artwork exists)
 * and close with a drill-down chevron that mirrors in RTL; the severity
 * accent is the thin inline-start edge (.ei-row-accent). No data logic,
 * aria, count, ranking or copy changed — presentation only.
 *
 * Owner round 3 (2026-10-20): the closing explanation panels part ways.
 * The RULE panel (Australia, and Global's no-feed fallback) is reference
 * material — it now hides behind a LOW-KEY TOGGLE (the muted-pill
 * disclosure language of "+n more", the aria mechanics of GlossaryTip):
 * collapsed by default, the quiet pill alone carries the panel label.
 * The Global SIGNALS panel is the opposite — "probably one of the most
 * important parts of the whole hero" (owner): its type steps UP from the
 * caption tier to 15px bold (heading and every bullet), the state mark
 * grows, the rhythm gets roomier. Hooks, tint and copy unchanged.
 */

import { useState } from 'react';
import type { IndicatorReading, InsightsSection, IndicatorId } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { IconImg, indicatorIconUrl, sectionIconUrl, stateIconUrl } from '../icons/currena';
import { FlowChevron } from '../icons/FlowChevron';
import { GAUGES, gaugesForSection, labelForVerdictStep, sectionVerdictStep } from '@currena/insights';
import {
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
 * direction). Owner round 3: the marker's size is LOCKED to the signals
 * panel's emphasized 15px bullet type so the dot keeps its first-line
 * seat. Static JSX, safe to reuse in every bullet row. */
const BULLET_DOT = (
  <span
    aria-hidden="true"
    className="shrink-0 select-none text-[0.9375rem] leading-[1.6] text-[var(--color-text-tertiary)]"
  >
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
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
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
  // reveals the rest IN PLACE (local state). Grayscale redesign
  // (2026-10-17, economic-indicators-ui-spec.md §5): BOTH regions now lead
  // with the SAME economy — exactly THREE flagged tiles (the most important
  // ones) with "+n more" to expand and "Show fewer" to collapse; the old
  // bullet-less 6-tile variant is retired (the alert-box asymmetry it
  // compensated for no longer exists — the module flows and the spare
  // space reads as padding, round 43).
  const tiles = attentionTiles(readings, section);
  // The Global card carries the raised world-section bullets (markets/fx/
  // section indicators); Australia never grows an alert box — the signals
  // are Global-scope. Kept for the alert-box render below.
  const hasBullets =
    marketsAlert !== undefined ||
    fxAlert !== undefined ||
    (sectionIndicators !== undefined && sectionIndicators.length > 0);
  const baseReveal = 3;
  const [revealAllTiles, setRevealAllTiles] = useState(false);
  // Owner round 3: the rule explanation panel starts COLLAPSED behind its
  // low-key toggle (the signals panel is never toggled — it is the
  // emphasized, always-open module).
  const [ruleOpen, setRuleOpen] = useState(false);
  const shown = revealAllTiles ? tiles : tiles.slice(0, baseReveal);

  // Gauge member count for the "n of m" line (same denominator as before).
  const gaugeMemberIds = new Set(sectionGauges.flatMap((g) => [...g.members]));
  const voting = readings.filter(
    (r) => gaugeMemberIds.has(r.id) && (r.status === 'warning' || r.status === 'normal'),
  ).length;

  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]"
      data-ei-step={step}
    >
      {/* Editorial handoff (2026-10-19, economic-indicators-editorial-spec.md
       * §7): the card opens with the quiet ART BAND — Sydney Harbour on the
       * Australia card, an even fainter world-map texture on the Global
       * card (index.css .ei-hero-art). The band carries the header + the
       * count line, and the artwork always sits BEHIND a surface-colored
       * veil + bottom fade (dark mode tones it further down), so the navy
       * title, the state pill and the count keep their contrast. The card
       * body below keeps the card's own padding; overflow-hidden gives the
       * band the card's rounded corners. */}
      <div className="relative flex flex-col gap-3 p-4 pb-3.5 md:p-5 md:pb-3.5 lg:p-6 lg:pb-3.5">
        <span
          aria-hidden="true"
          className={`ei-hero-art ${section === 'australia' ? 'ei-hero-art--au' : 'ei-hero-art--global'}`}
          data-hero-art={section}
        />
        {/* Real spec (economic-indicators-ui-spec.md §4 "Status summary" + §5
         * "Card and indicator structure", 2026-10-17): the region NAME is the
         * card title (26-30px/700 desktop, 22-26px mobile) — the editorial
         * handoff §5 deepens it to the navy print ink (--ei-navy); the
         * severity label (the verdict word, 15-17px/600-700, severity ink
         * R29) and the severity mark/scale (the state artwork + the
         * four-step meter — its color stays the EXISTING severity logic)
         * share the title row and wrap naturally on narrow screens. Never
         * colour alone: word + artwork + meter. Round 28: each region wears
         * its own mark — the globe for Global, the map for Australia, a
         * quiet 24/28px id. Editorial §4: the word + artwork now ride in
         * ONE compact tinted pill (.ei-state-pill), the meter stays beside. */}
        <header className="relative m-0 flex flex-wrap items-center gap-x-3 gap-y-2">
          <IconImg src={sectionIconUrl(section)} size={24} desktopSize={28} />
          <h3 className="m-0 min-w-0 flex-1 text-[1.375rem] font-bold leading-tight text-[var(--ei-navy)] sm:text-[1.625rem]">
            {sectionLabel}
          </h3>
          <p className="relative m-0 flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="ei-state-pill" data-step={step} data-verdict-pill>
              {/* Round 41: the state's artwork LEADS the severity cluster —
               * [icon][word], the same reading order as every other chip in
               * the app. Round 42 (owner): the artwork rides smaller
               * (24/32) — the word and meter carry the severity. */}
              {stateIconUrl(step) !== null ? (
                <IconImg src={stateIconUrl(step)!} size={20} desktopSize={24} className="drop-shadow-sm" />
              ) : null}
              <span className="leading-none">{verdictLabel}</span>
            </span>
            <VerdictMeter step={step} label={verdictLabel} ariaLabel={ariaLabel} size="lg" />
          </p>
        </header>

        {/* Real spec §4.3: a concise "Why" summary directly below the card
         * heading, with the optional information control (the existing
         * how-computed tip, round 43). The count line is the existing copy
         * (no new strings); UI-fidelity round (2026-10-19, brief §5) — the
         * count ink follows the REGION'S OWN verdict step (stepToneClass),
         * so a Stressed Australia counts its warnings in the same amber
         * accent its rows carry, and only a Critical region speaks red.
         * The data attributes are unchanged. */}
        <div className="relative flex flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={`m-0 text-[length:var(--type-label)] font-semibold leading-relaxed ${stepToneClass(
              tiles.length + (marketsAlert ? 1 : 0) + (fxAlert ? 1 : 0) > 0 ? step : 1,
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
          <GlossaryTip srLabel={copy.ui.howCalculated} panelClassName="w-full basis-full">
            <bdi>{copy.ui.explainerIntro}</bdi>
            <button
              type="button"
              onClick={onJumpAbout}
              className="insights-focusable mt-1 inline-flex w-fit cursor-pointer items-center rounded-lg border-0 bg-transparent p-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-primary)] underline decoration-[var(--color-border)] underline-offset-2 transition-colors hover:decoration-[var(--color-text-secondary)]"
            >
              {copy.ui.explainerFullLink} ↧
            </button>
          </GlossaryTip>
        </div>
      </div>

      {/* The card body — the editorial band hands back to the standard
       * surface here; every module below is byte-identical in behavior to
       * the pre-handoff card (only the row face was restyled, §8). */}
      <div className="flex flex-1 flex-col gap-3 p-4 pt-1 md:p-5 md:pt-1 lg:p-6 lg:pt-1">
      {/* Real spec §4.4/§4.5 (flagged indicators) + §5 (indicator row
       * anatomy) + §9 (show more / show less): the flagged-list heading
       * carries the FULL underlying count (never just the visible rows),
       * followed by the TOP THREE rows (the existing importance order);
       * "+n more" reveals the rest IN PLACE, "Show fewer" collapses back,
       * both announcing their state (aria-expanded + aria-controls).
       * Editorial §8: each row = the leading subject icon in a soft
       * neutral container (the existing PNG artwork where an icon exists —
       * the alert triangle carries the tier when it doesn't), a flexible
       * text column (name + the generated interpretation), the primary
       * value in strong navy at the trailing edge and a drill-down
       * chevron — all direction-aware, growing naturally (no fixed
       * heights); click opens the existing DetailsPanel. The tier accent
       * is the restrained inline-start edge (.ei-row-accent), never a
       * saturated face. */}
      {shown.length > 0 ? (
        <section data-flagged-list>
          <p className="m-0 text-[0.8125rem] font-bold text-[var(--color-text-secondary)]">
            {copy.ui.attentionTilesLabel}
            <span className="mx-1.5 font-normal" aria-hidden="true">
              ·
            </span>
            <span className="tabular-nums">{num(tiles.length, numberLocale)}</span>
          </p>
          <ul
            id={`attention-list-${section}`}
            className="m-0 mt-2 flex list-none flex-col gap-2 p-0"
            aria-label={copy.ui.attentionTilesLabel}
            data-attention-tiles
          >
            {shown.map(({ id }) => {
              const r = readings.find((x) => x.id === id);
              if (!r) return null;
              // Fix spec A-02 (2026-10-14): the row's meaning text is
              // GENERATED from the reading's rule and value — the
              // hand-written meanings are gone.
              const meaningText = interpolate(copy.ui.attentionTileRule, {
                rule: formatRuleText(definitionFor(id).rule, id, copy.rule, copy.units, numberLocale),
                value: r.value !== null ? formatIndicatorValue(id, r.value, numberLocale, copy.units) : copy.ui.na,
              });
              const valueParts =
                r.value !== null ? indicatorValueParts(id, r.value, numberLocale, copy.units) : null;
              const subjectIcon = indicatorIconUrl(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={(e) => onFocusCard(id, e.currentTarget)}
                    className="insights-focusable ei-row-accent flex min-h-[76px] w-full cursor-pointer items-start gap-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-3 text-start ring-1 ring-[var(--color-border)] transition-colors hover:bg-currena-muted/[0.06] hover:ring-[var(--color-border)]/90"
                  >
                    {/* The leading mark — the indicator's own subject
                     * artwork in a soft neutral container where the set
                     * has one (spec §8); otherwise the alert triangle
                     * keeps the tier symbol so the geometry (and the
                     * never-colour-alone rule) holds on every row. */}
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-currena-muted/15"
                    >
                      {subjectIcon !== null ? (
                        <IconImg src={subjectIcon} size={22} desktopSize={24} />
                      ) : (
                        /* UI-fidelity round (2026-10-19, brief §5): the
                         * fallback tier mark speaks the REGION accent
                         * (.ei-fallback-mark → --ei-accent), never a stray
                         * red triangle on an amber-accented card. */
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          focusable="false"
                          className="ei-fallback-mark"
                        >
                          <path d="M8 1.8 14.6 13.4H1.4L8 1.8Z" />
                          <path d="M8 6.2v3.4" />
                          <path d="M8 11.7h.01" />
                        </svg>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      {/* UI-fidelity round (brief §10 typography): the name
                       * steps up to 16px (spec §5's 15–17px band) so the
                       * name/rule hierarchy reads like the reference's
                       * pronounced title-vs-subtext pairing. */}
                      <span className="line-clamp-2 text-[1rem] font-bold leading-snug text-[var(--color-text-primary)]">
                        {copy.indicators[id].name}
                      </span>
                      <span className="m-0 text-[length:var(--type-label)] font-normal leading-relaxed text-[var(--color-text-secondary)]">
                        {meaningText}
                      </span>
                    </span>
                    {valueParts !== null ? (
                      <span className="flex shrink-0 flex-col items-end gap-0.5">
                        <bdi className="type-number inline-flex flex-wrap items-baseline gap-x-1 text-[var(--ei-navy)]">
                          <span>{valueParts.value}</span>
                        </bdi>
                        {valueParts.unit !== null ? (
                          <span className="whitespace-nowrap text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                            {valueParts.unit}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                    {/* The drill-down affordance — the shared directional
                     * glyph that mirrors with the reading flow; the sr-only
                     * "View card" phrase keeps the meaning for assistive
                     * tech. */}
                    <FlowChevron className="mt-1.5 text-[var(--color-text-tertiary)]" />
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
              aria-expanded="false"
              aria-controls={`attention-list-${section}`}
              className="insights-focusable mt-1.5 inline-flex min-h-[24px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
            >
              {interpolate(copy.ui.attentionTileMore, { n: num(tiles.length - shown.length, numberLocale) })}
            </button>
          ) : null}
          {/* "Show fewer" (existing key, both locales) collapses back to the
           * three most important rows. */}
          {revealAllTiles && tiles.length > baseReveal ? (
            <button
              type="button"
              onClick={() => setRevealAllTiles(false)}
              aria-expanded="true"
              aria-controls={`attention-list-${section}`}
              className="insights-focusable mt-1.5 inline-flex min-h-[24px] cursor-pointer items-center rounded-full bg-currena-muted/15 px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
            >
              {copy.ui.showFewer}
            </button>
          ) : null}
        </section>
      ) : null}

      {/* R2 → R30 → round 24 → round 36 → round 42 → UI-fidelity round
       * (2026-10-19, the owner's correction brief §7 "Category summary
       * section"): the gauges render as COMPACT CATEGORY ROWS — the
       * approved reference's lower-card summary. One quiet row per gauge:
       * category label · small tinted state badge · the four-step mini
       * meter (the reference's severity bar) — white/near-white surface,
       * fine border, worst state first, unreadable gauges (step 0) last
       * in honest neutral. The grouping-by-status-word box is retired:
       * each row's badge carries its own state word (the same words, the
       * same meters, the same aria — nothing about the data changed, the
       * rows just speak one-per-category like the reference). When NO
       * gauge is readable the module says so in one line (the old
       * notEnough path). */}
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
        /* Round 43 (owner): the verdict-rule tip seats beside the module's
         * heading — beside the verdict it explains. */
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
        /* The compact tinted badge inks (light tint of the step's own hue —
         * the same pairing .ei-state-pill speaks, at caption size). Step 0
         * stays NEUTRAL: insufficient data must never read as positive
         * (spec §4 severity treatment). */
        const badgeTone = (s: number): string =>
          s === 4
            ? 'bg-[var(--color-status-alert)]/10 text-[var(--color-status-alert)]'
            : s === 3
              ? 'bg-[var(--color-status-stressed)]/15 text-[var(--color-status-stressed)]'
              : s === 2
                ? 'bg-[var(--color-status-watch)]/15 text-[var(--color-status-watch)]'
                : s === 1
                  ? 'bg-[var(--color-status-normal)]/12 text-[var(--color-status-normal)]'
                  : 'bg-currena-muted/15 text-[var(--color-text-secondary)]';
        const ordered = [...readable].sort((a, b) => b.step - a.step);
        const rowOf = (gauge: string, gStep: number, word: string) => {
          const gaugeName =
            copy.groupShort[gauge as keyof typeof copy.groupShort] ?? copy.groups[gauge as keyof typeof copy.groups];
          return (
            <li
              key={gauge}
              data-gauge={gauge}
              data-gauge-step={gStep}
              className="flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] bg-currena-muted/[0.04] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]/60"
            >
              <span
                title={gaugeName}
                className="min-w-0 flex-1 truncate text-[length:var(--type-label)] font-semibold text-[var(--color-text-primary)]"
              >
                {gaugeName}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[length:var(--type-caption)] font-bold ${badgeTone(gStep)}`}
              >
                {word}
              </span>
              <VerdictMeter
                step={gStep}
                label={word}
                ariaLabel={interpolate(copy.ui.gaugeStepAria, {
                  question: gaugeName,
                  label: word,
                  step: num(gStep, numberLocale),
                })}
                size="sm"
              />
            </li>
          );
        };
        return (
          <section data-hero-gauges>
            <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.8125rem] font-bold text-[var(--color-text-secondary)]">
              {copy.ui.heroGaugesLabel}
              {ruleTip}
            </p>
            <ul
              className="m-0 mt-2 grid list-none grid-cols-1 gap-1.5 p-0 sm:grid-cols-2"
              aria-label={copy.ui.heroGaugesLabel}
            >
              {ordered.map((g) => rowOf(g.gauge, g.step, wordOfStep(g.step)))}
              {zeroRows.map((g) => rowOf(g.gauge, g.step, copy.ui.gaugeNoReading))}
            </ul>
          </section>
        );
      })()}

      {/* Real spec §4.6 (secondary groups) + §6 ("a single focused
       * explanatory panel") → UI-fidelity round (2026-10-19, the owner's
       * correction brief §7 "Contextual explanation panel"): the dedicated
       * restrained panel at the bottom of each regional card — the approved
       * reference's closing module.
       *
       * Owner round 3 (2026-10-20): the two panels PART WAYS.
       * GLOBAL carries the raised world-section signals (markets /
       * currencies / section indicators — the existing module) — "one of
       * the most important parts of the whole hero" (owner): the panel
       * steps UP in type (15px bold heading + bullets, larger state mark,
       * roomier rhythm) while keeping its restrained pale surface +
       * region-step ink. It is always open — never tucked behind the
       * toggle. When no feed has loaded, Global falls back to the
       * word-choice rule (behind the toggle, like Australia).
       * AUSTRALIA never grows the world signals (they are Global-scope);
       * its rule explanation is REFERENCE material — it hides behind a
       * LOW-KEY TOGGLE: collapsed, one quiet muted pill (the "+n more"
       * disclosure language) carries the panel label; expanded, the
       * familiar tinted panel appears under it with its hooks and copy
       * byte-identical to the fidelity round's.
       *
       * The tint follows the REGION'S OWN step ink (spec §4: "the exact
       * existing product taxonomy controls which token is applied") —
       * pale red for a Critical region, pale amber for Stressed, never a
       * saturated warning surface. Round 42/43's EXPLICIT flex bullet
       * markers stay so the dot sits at the sentence START in every
       * direction; the signal lines keep their working jump buttons but
       * lose the underline (the brief's "avoid underlined text" — the
       * bold severity ink is the affordance). */}
      {gaugeRows.length > 0 ? (
        (() => {
          const signals = section === 'global' && hasBullets;
          const tint =
            step === 4
              ? 'bg-[var(--color-status-alert)]/[0.05] ring-[var(--color-status-alert)]/20'
              : step === 3
                ? 'bg-[var(--color-status-stressed)]/[0.06] ring-[var(--color-status-stressed)]/20'
                : step === 2
                  ? 'bg-[var(--color-status-watch)]/[0.08] ring-[var(--color-status-watch)]/25'
                  : step === 1
                    ? 'bg-[var(--color-status-normal)]/[0.05] ring-[var(--color-status-normal)]/20'
                    : 'bg-currena-muted/[0.06] ring-[var(--color-border)]';
          /* Owner round 3: the RULE panel hides behind the low-key toggle —
           * collapsed by default, the quiet pill alone; expanded, the
           * familiar tinted panel (same hooks, same copy) rides under it.
           * The pill borrows the "+n more" disclosure language and
           * GlossaryTip's aria mechanics; the chevron is direction-neutral
           * (down → up) so nothing mirrors in RTL. */
          if (!signals) {
            const rulePanelId = `ei-rule-panel-${section}`;
            return (
              <>
                <button
                  type="button"
                  onClick={() => setRuleOpen((v) => !v)}
                  aria-expanded={ruleOpen}
                  aria-controls={rulePanelId}
                  data-ei-rule-toggle
                  className="insights-focusable inline-flex min-h-[24px] cursor-pointer items-center gap-1 self-start rounded-full bg-currena-muted/15 px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                    className={`shrink-0 motion-safe:transition-transform motion-safe:duration-200${ruleOpen ? ' rotate-180' : ''}`}
                  >
                    <path d="M3.5 6 8 10.5 12.5 6" />
                  </svg>
                  {copy.ui.verdictRuleLabel}
                </button>
                {ruleOpen ? (
                  <div
                    id={rulePanelId}
                    className={`ei-panel-accent rounded-[var(--radius-md)] px-3 py-2.5 ring-1 ${tint}`}
                    data-ei-panel
                    data-ei-panel-kind="rule"
                  >
                    <p
                      className={`m-0 mb-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[length:var(--type-caption)] font-bold ${stepToneClass(step)}`}
                      data-ei-panel-heading
                    >
                      {stateIconUrl(step) !== null ? (
                        <IconImg src={stateIconUrl(step)!} size={16} desktopSize={18} className="drop-shadow-sm" />
                      ) : null}
                      {copy.ui.verdictRuleLabel}
                    </p>
                    {/* The word-choice rule — the existing localized
                     * explanation of what makes this region's verdict word
                     * what it is (the same text the quiet "?" tip carries,
                     * readable here once the toggle is opened). */}
                    <p
                      className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]"
                      data-ei-panel-rule
                    >
                      {copy.ui.verdictRule}
                    </p>
                  </div>
                ) : null}
              </>
            );
          }
          /* Owner round 3: the SIGNALS panel — the hero's most important
           * closing module steps UP in type (15px bold heading + bullets,
           * larger state mark, roomier rhythm) while keeping its restrained
           * pale surface + region-step ink exactly as approved. */
          return (
            <div
              className={`ei-panel-accent rounded-[var(--radius-md)] px-3.5 py-3 ring-1 ${tint}`}
              data-ei-panel
              data-ei-panel-kind="signals"
              data-attention-box="true"
            >
              <p
                className={`m-0 mb-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[0.9375rem] font-bold ${stepToneClass(step)}`}
                data-ei-panel-heading
              >
                {stateIconUrl(step) !== null ? (
                  <IconImg src={stateIconUrl(step)!} size={18} desktopSize={20} className="drop-shadow-sm" />
                ) : null}
                {copy.ui.worldSignalsTitle}
              </p>
              <ul className="m-0 list-none space-y-2 p-0" data-attention-bullets>
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
                      className={`insights-focusable -ms-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 text-start text-[0.9375rem] font-bold leading-relaxed transition-opacity hover:opacity-80 ${
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
                      className={`insights-focusable -ms-1 cursor-pointer rounded-lg border-0 bg-transparent px-1 py-0.5 text-start text-[0.9375rem] font-bold leading-relaxed transition-opacity hover:opacity-80 ${
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
                        className={`insights-focusable -ms-1 cursor-pointer rounded-md border-0 bg-transparent px-1 py-0.5 text-start text-[0.9375rem] font-bold leading-relaxed transition-opacity hover:opacity-80 ${
                          ind.signal === 'unusual'
                            ? 'text-[var(--color-status-watch)]'
                            : 'text-[var(--color-status-alert)]'
                        }`}
                      >
                        {ind.label}
                        <span className="ms-1 font-bold">· {ind.signal === 'unusual' ? copy.fx.chipUnusual : copy.fx.chipAttention}</span>
                      </button>
                    ) : (
                      <span
                        className="px-1 py-0.5 text-[0.9375rem] font-semibold leading-relaxed text-[var(--color-text-tertiary)]"
                        data-section-indicator="normal"
                      >
                        {ind.label}
                        <span className="ms-1">· {copy.fx.chipNormal}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()
      ) : null}

      {/* Real spec §9 (header actions): "View section" is a real, working
       * control the grayscale proposal omits — redesigned placement (a
       * quiet card-footer link) rather than deleted. mt-auto pins it to
       * the shared bottom edge of the equal-height hero cards. */}
      <div className="mt-auto pt-1">
        <button
          type="button"
          onClick={() => onJumpSection(section)}
          className="insights-focusable -my-1 cursor-pointer rounded-lg border-0 bg-transparent px-1.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-primary)] underline decoration-[var(--color-border)] underline-offset-4 transition-colors hover:decoration-[var(--color-text-secondary)]"
        >
          {copy.ui.viewSection}
          <span className="sr-only">, {sectionLabel}</span>
        </button>
      </div>
      </div>
    </article>
  );
}
