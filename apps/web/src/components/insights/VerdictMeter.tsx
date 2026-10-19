/**
 * VerdictMeter — Block H1 → v3 UI_SPEC §3 (2026-10-20, UI-01..UI-14): the
 * rebuilt hero card. Top to bottom, every element answers "how / why /
 * what next / can I trust this" (§1) exactly once:
 *
 *   header       — the region mark + name + "View section"
 *   verdict row  — [state icon] VERDICT WORD (the largest type, UI-13) +
 *                  the four-step meter + the how-calculated "?" control
 *                  (UI-07: the rule + its VERSION, not visible by default)
 *   sentence     — ONE generated line ≤90 chars from the gauge counts
 *                  (UI-01; heroSentence in config/hero.ts — a fixed table,
 *                  conditions-only, no forecasts)
 *   reading bar  — one segmented bar + "N need attention · M normal ·
 *                  K can't tell right now" (UI-02; the old grouped status
 *                  boxes, count line and attention tiles are gone)
 *   why (top 3)  — the three scored needs-attention readings ranked by
 *                  |moveScore| (UI-03): name, value + unit, change with
 *                  direction and period, status chip; a tap opens the card
 *   calm line    — up to three gauge areas with zero warnings (UI-04)
 *   what is next — the region's next calendar event with relative days
 *                  (UI-05 — the same day math as NextUpStrip)
 *   alert box    — ONLY when a stale/unavailable reading sits inside a
 *                  gauge whose members voted (UI-08): one line + About
 *                  link. Chosen CLIENT-SIDE (heroStaleInputs) because the
 *                  engine already excludes those readings from every
 *                  count; the hero only states the caveat.
 *   footer       — the freshness chip: "Updated {HH:mm UTC} · {n} stale",
 *                  the stale count links to About (UI-06).
 *
 * RETIRED from the card (the owner's 2026-10-17 diagnosis: "it says many
 * things but delivers almost nothing"): the gauges-grouped-by-status
 * boxes, the needs-attention tiles + "+n more", the count paragraph, and
 * the biggest-move callout (the move now lives in the MovesNextStrip
 * directly under the hero).
 *
 * UI-14: the state colour appears only on the icon, the chip and the thin
 * top border (data-hero-card → index.css); the verdict word reads in
 * NEUTRAL primary ink — this also fixes the light-theme "Cautious" amber
 * word (1.6:1): the icon + meter + border carry the colour, never the word.
 *
 * The world-section hero integrations (MarketsAlert/FxAlert/
 * SectionIndicatorState; round-2 §5.3/§6.5/§6.11) left the card with this
 * rebuild, by a documented choice: UI-08's alert box is reserved for the
 * data-trust caveat, and the UI-02 bar counts GAUGE members by definition
 * (the world sections are not gauges) — the two sections carry their own
 * verdict lines with their full numbers where they render. The TYPES stay
 * exported for insights-sections/world-feeds.ts.
 */

import type { CalendarEvent, IndicatorId, IndicatorReading, InsightsSection } from '@currena/core';
import { formatJalaliDate, formatDateWords, formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { IconImg, sectionIconUrl, stateIconUrl } from '../icons/currena';
import {
  RULE_CHANGELOG,
  RULE_VERSION,
  gaugesForSection,
  labelForVerdictStep,
  sectionVerdictStep,
} from '@currena/insights';
import {
  calmGauges,
  dailyPeersOf,
  formatUtcHm,
  heroNextEvent,
  heroReadingCounts,
  heroSentence,
  heroStaleInputs,
  heroWhy,
  indicatorValueParts,
  tierOf,
} from './config';
import { ChangeText } from './CardMeta';
import { StatusChip } from './StatusChip';
import { GlossaryTip } from './world-currencies/GlossaryTip';

function num(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
}

/** NextUpStrip's day math (UI-05): whole UTC days from today to the date. */
function daysUntil(dateIso: string): number {
  const today = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
  const [y, m, d] = dateIso.split('-').map((part) => Number(part));
  if (y === undefined || m === undefined || d === undefined) return Number.NaN;
  const target = Date.UTC(y, m - 1, d);
  return Math.round((target - today) / 86_400_000);
}

/**
 * The four-step segmented meter with a marker on the current step (H1,
 * unchanged): `lg` is the hero's status instrument; `sm` is the compact
 * per-gauge row meter (question-group headers). data-step carries the
 * current step to index.css's tint ramp (round 44).
 */
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
 * The world-markets section signal (insights-world-markets-spec.md §5.3).
 * v3 (2026-10-20): the hero card no longer renders it (see the header
 * note) — the type stays for insights-sections/world-feeds.ts.
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
 * The world-currencies section signal (insights-world-currencies-spec.md
 * §6.5). v3: same retirement as MarketsAlert — the type stays for the
 * world-sections module.
 */
export interface FxAlert {
  signal: 'attention' | 'unusual';
  /** The active patterns' names (the cards below carry the detail). */
  patterns: string[];
}

/**
 * §6.11/§9.10 — the two world sections as separate indicators. v3: same
 * retirement — the type stays for the world-sections module.
 */
export interface SectionIndicatorState {
  signal: 'normal' | 'attention' | 'unusual';
  /** The section's measure label for the current signal. */
  label: string;
  /** Scroll to the section when its indicator is used (raised signals). */
  onJump?: () => void;
}

/** One region's hero card (v3 UI-01..UI-08). */
export function VerdictBlock({
  section,
  sectionLabel,
  readings,
  calendar,
  generatedAt,
  copy,
  numberLocale,
  locale,
  onJumpSection,
  onJumpAbout,
  onFocusCard,
}: {
  section: InsightsSection;
  sectionLabel: string;
  readings: readonly IndicatorReading[];
  /** The snapshot's calendar — UI-05's "what is next". */
  calendar: readonly CalendarEvent[];
  /** The snapshot's generation time — UI-06's freshness chip. */
  generatedAt: string;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  locale: 'en' | 'fa';
  onJumpSection: (section: InsightsSection) => void;
  onJumpAbout: () => void;
  onFocusCard: (id: IndicatorId) => void;
}) {
  const step = sectionVerdictStep(section, readings);
  const labelWord = labelForVerdictStep(step);
  const sectionGauges = gaugesForSection(section, readings);
  const peers = dailyPeersOf(readings);

  const verdictLabel = labelWord ? copy.label[labelWord] : copy.ui.gaugeNoReading;
  const ariaLabel = interpolate(copy.ui.verdictStepAria, {
    section: sectionLabel,
    label: verdictLabel,
    step: num(step || 0, numberLocale),
  });

  // The short gauge names (UI-01's sentence + UI-04's calm line).
  const nameOf = (gauge: string): string =>
    copy.groupShort[gauge as keyof typeof copy.groupShort] ?? copy.groups[gauge as keyof typeof copy.groups];

  // UI-01: the generated verdict sentence — a FIXED TABLE over the gauge
  // steps (the same discipline heroReason pinned in round-2 R2): counts
  // and named areas only, never a new conclusion, never a forecast.
  const sentence = heroSentence({
    gauges: sectionGauges,
    nameOf,
    fmt: (n) => num(n, numberLocale),
    calm: copy.ui.heroSentenceCalm,
    attention: copy.ui.heroSentenceAttention,
    andWord: copy.ui.heroSentenceAnd,
    listSep: copy.ui.heroSentenceListSep,
    moreWord: copy.ui.heroSentenceMore,
    isWord: copy.ui.heroSentenceNeeds,
    areWord: copy.ui.heroSentenceNeed,
    notEnough: copy.ui.noSummary,
  });

  // UI-02: the reading-bar counts over the section's gauge members.
  const counts = heroReadingCounts(readings, section);
  const total = counts.attention + counts.normal + counts.cantTell;
  const pct = (n: number): string => `${total > 0 ? (n / total) * 100 : 0}%`;

  // UI-03: the why rows — the top needs-attention readings by |moveScore|
  // (the honest contribution; the R3 percentile extremity is the fallback).
  const whyIds = heroWhy(readings, section, 3);

  // UI-04: the calm areas.
  const calm = calmGauges(sectionGauges, 3);

  // UI-05: what is next (the region's own calendar kinds first).
  const nextEvent = heroNextEvent(calendar, section, new Date().toISOString().slice(0, 10));

  // UI-06 + UI-08 inputs.
  const { staleCount, affectsVotingGauge } = heroStaleInputs(readings, section);

  // UI-07: the rule + its version, inside the "?" control.
  const ruleVersionText = interpolate(copy.ui.ruleVersionLine, {
    v: num(RULE_VERSION, numberLocale),
    date: formatAsOfIso(RULE_CHANGELOG[RULE_CHANGELOG.length - 1]!.date, locale),
  });

  const when = (days: number): string => {
    if (days === 0) return copy.ui.today;
    if (days === 1) return copy.ui.tomorrow;
    return interpolate(copy.ui.daysAway, { n: num(days, numberLocale) });
  };

  return (
    <article
      data-hero-card=""
      data-step={step}
      className="flex h-full flex-col gap-3 rounded-[var(--radius-lg)] p-4 ring-1 ring-[var(--color-border)] bg-[var(--color-surface)] md:p-5"
    >
      <header className="m-0 flex items-center gap-2">
        {/* A quiet region mark (round 42) — the big artwork lives in the
         * dedicated sections mid-page. v3 UI-13 (2026-10-20): the card
         * speaks exactly THREE type sizes — verdict (largest) · values
         * (second) · every label and metadata line at the caption size —
         * so the region mark dropped the kicker's fourth size. */}
        <IconImg src={sectionIconUrl(section)} size={24} desktopSize={28} />
        <h3 className="m-0 min-w-0 flex-1 text-[length:var(--type-caption)] font-bold uppercase text-[var(--color-text-tertiary)]">{sectionLabel}</h3>
        <button
          type="button"
          onClick={() => onJumpSection(section)}
          className="insights-focusable -my-1.5 inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border-0 bg-transparent px-1.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-4 transition-colors hover:decoration-[var(--color-accent-brand)]"
        >
          {copy.ui.viewSection}
          <span className="sr-only">, {sectionLabel}</span>
        </button>
      </header>

      {/* UI-01: the verdict row — [icon] WORD (largest, neutral ink) +
       * meter (large) + the how-calculated "?" (UI-07). */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="m-0 flex min-w-0 flex-1 items-center gap-2.5">
          {stateIconUrl(step) !== null ? <IconImg src={stateIconUrl(step)!} size={28} desktopSize={34} /> : null}
          <span className="type-verdict text-[var(--color-text-primary)]">{verdictLabel}</span>
          <VerdictMeter step={step} label={verdictLabel} ariaLabel={ariaLabel} size="lg" />
        </p>
        <GlossaryTip srLabel={copy.ui.verdictRuleLabel} panelClassName="w-full basis-full">
          <bdi>{copy.ui.verdictRule}</bdi>
          <span className="mt-1 block font-semibold">
            <bdi>{ruleVersionText}</bdi>
          </span>
          <button
            type="button"
            onClick={onJumpAbout}
            className="insights-focusable mt-1 inline-flex cursor-pointer items-center rounded-lg border-0 bg-transparent p-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
          >
            {copy.ui.explainerFullLink} ↧
          </button>
        </GlossaryTip>
      </div>

      {/* UI-01: the one generated sentence. */}
      <p className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]" data-hero-sentence>
        <bdi>{sentence}</bdi>
      </p>

      {/* UI-02: the reading bar — one segmented bar, the counts beside it
       * (never a second paragraph repeating them). The bar is decorative
       * (aria-hidden): the counts text + the group's aria-label carry the
       * information in every mode. */}
      {total > 0 ? (
        <div
          role="group"
          aria-label={interpolate(copy.ui.heroCountsAria, {
            attention: num(counts.attention, numberLocale),
            normal: num(counts.normal, numberLocale),
            cantTell: num(counts.cantTell, numberLocale),
          })}
        >
          <span className="hero-count-bar" aria-hidden="true">
            {counts.attention > 0 ? (
              <span className="hero-count-seg hero-count-seg-attention" style={{ width: pct(counts.attention) }} />
            ) : null}
            {counts.normal > 0 ? (
              <span className="hero-count-seg hero-count-seg-normal" style={{ width: pct(counts.normal) }} />
            ) : null}
            {counts.cantTell > 0 ? (
              <span className="hero-count-seg hero-count-seg-canttell" style={{ width: pct(counts.cantTell) }} />
            ) : null}
          </span>
          <p className="m-0 mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
            <span>{interpolate(copy.ui.heroCountsAttention, { n: num(counts.attention, numberLocale) })}</span>
            <span aria-hidden="true" className="opacity-50 select-none">·</span>
            <span>{interpolate(copy.ui.heroCountsNormal, { n: num(counts.normal, numberLocale) })}</span>
            <span aria-hidden="true" className="opacity-50 select-none">·</span>
            <span>{interpolate(copy.ui.heroCountsCantTell, { n: num(counts.cantTell, numberLocale) })}</span>
          </p>
        </div>
      ) : null}

      {/* UI-03: the why rows — the three readings behind the verdict. A
       * tap opens the card (the deep-link focus path, #/insights?card=…). */}
      {whyIds.length > 0 ? (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0" aria-label={copy.ui.heroWhyLabel} data-hero-why>
          {whyIds.map((id) => {
            const r = readings.find((x) => x.id === id);
            if (!r) return null;
            const entry = copy.indicators[id];
            const parts = r.value !== null ? indicatorValueParts(id, r.value, numberLocale, copy.units) : null;
            const tier = tierOf(r, peers);
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onFocusCard(id)}
                  className="insights-focusable flex min-h-11 w-full cursor-pointer flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-[var(--radius-md)] bg-currena-muted/[0.06] px-2.5 py-1.5 text-start ring-1 ring-[var(--color-border)]/70 transition-colors hover:bg-currena-muted/[0.13]"
                >
                  <span className="min-w-0 text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
                    {entry.name}
                  </span>
                  {parts !== null ? (
                    <bdi dir="ltr" className="type-number shrink-0 text-[var(--color-text-primary)]">
                      {parts.value}
                      {parts.unit !== null ? (
                        <span className="ms-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
                          {parts.unit}
                        </span>
                      ) : null}
                    </bdi>
                  ) : null}
                  <span className="min-w-0 text-[length:var(--type-caption)]">
                    <ChangeText reading={r} copy={copy} numberLocale={numberLocale} />
                  </span>
                  <span className="ms-auto shrink-0">
                    <StatusChip status={r.status} copy={copy} tier={tier} />
                  </span>
                  <span className="sr-only">, {copy.ui.viewCard}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* UI-04: the calm line — up to three gauge areas with zero warnings. */}
      {calm.length > 0 ? (
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
          <bdi>
            {interpolate(copy.ui.heroCalmLine, { areas: calm.map((g) => nameOf(g)).join(copy.ui.heroSentenceListSep) })}
          </bdi>
        </p>
      ) : null}

      {/* UI-05: what is next — the region's next calendar event with its
       * relative days (NextUpStrip's day math). */}
      {nextEvent !== null ? (
        <p className="m-0 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]" data-hero-next>
          <bdi>
            {interpolate(copy.ui.heroNextLine, {
              title: locale === 'fa' ? nextEvent.titleFa : nextEvent.titleEn,
              date:
                locale === 'fa'
                  ? formatJalaliDate(nextEvent.date, 'fa-IR')
                  : formatDateWords(nextEvent.date, 'en-US'),
              when: when(daysUntil(nextEvent.date)),
            })}
          </bdi>
        </p>
      ) : null}

      {/* UI-08: the alert box — only when a stale/unavailable reading sits
       * inside a gauge whose members voted (see the header note). */}
      {affectsVotingGauge ? (
        <div
          role="note"
          data-hero-alert
          className="rounded-[var(--radius-md)] bg-[var(--color-status-alert)]/[0.05] px-3 py-2 ring-1 ring-[var(--color-status-alert)]/25"
        >
          <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
            <bdi>{copy.ui.heroAlertStaleLine}</bdi>{' '}
            <button
              type="button"
              onClick={onJumpAbout}
              className="insights-focusable -my-1 inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border-0 bg-transparent px-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
            >
              {copy.ui.aboutTitle} ↧
            </button>
          </p>
        </div>
      ) : null}

      {/* UI-06: the freshness chip — end-aligned (UI-12); the stale count
       * links to About's status panel. */}
      <p className="m-0 mt-auto flex flex-wrap items-baseline justify-end gap-x-1.5 gap-y-1 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]">
        <bdi>{interpolate(copy.ui.heroFreshness, { time: formatUtcHm(generatedAt, numberLocale) })}</bdi>
        {staleCount > 0 ? (
          <>
            <span aria-hidden="true" className="opacity-50 select-none">·</span>
            <button
              type="button"
              onClick={onJumpAbout}
              className="insights-focusable -my-1.5 inline-flex min-h-[44px] cursor-pointer items-center rounded-lg border-0 bg-transparent px-1.5 py-1 font-semibold text-[var(--color-text-secondary)] underline decoration-[var(--color-border)] underline-offset-2 transition-colors hover:text-[var(--color-status-alert)]"
            >
              {interpolate(copy.ui.heroStaleSuffix, { n: num(staleCount, numberLocale) })}
            </button>
          </>
        ) : null}
      </p>
    </article>
  );
}

/** date-only words for the rule-version line (UTC-safe, both locales). */
function formatAsOfIso(iso: string, locale: 'en' | 'fa'): string {
  return formatDateWords(iso, locale === 'fa' ? 'fa-IR' : 'en-US');
}
