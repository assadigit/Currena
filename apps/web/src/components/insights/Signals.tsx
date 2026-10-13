/**
 * Signals — UI spec Blocks S1–S3 (I17), restructured by round-2 R26.
 *
 * ONE merged gold-and-silver card (R26): the four global conditions the
 * metals share are listed once (identical by construction — the evaluators
 * read the same global series); each metal gets its own footing row; the
 * silver-only industrial condition sits in a separate short list. The
 * 30-day speed rides the footing row ONLY when the data exists — no more
 * "Measuring…" tile.
 *
 * The "before you act" box (S3) was removed entirely (2026-10-10 owner
 * request) — the collapsed summary and the merged card carry the honesty
 * framing instead.
 *
 * Colour: the I17 rule was "no green for supportive, no red for against".
 * Round 22 (owner) OVERRIDES that for this card — the same sanctioned
 * exception as the pattern lines: supports = the green status ink,
 * works-against = the red status ink, neutral/unknown = stale. Icon + word
 * stay (never colour alone), and the words describe conditions, not advice.
 *
 * Type rhythm (round 22): the card previously whispered at caption size —
 * state words and the "how" lines now speak at the same label size as the
 * alert cards' titles and consequence lines; the five group headings share
 * one heading style.
 *
 * Round 23 (owner): the card now OPENS with a stated estimation — one
 * direction chip per metal, derived mechanically from the same conditions
 * listed below (supportive count minus against count; the sign is the
 * direction: up / down / no clear direction). Owner's example: "Gold will
 * go up, Silver will go down." The tally is still a description of
 * conditions, not advice; unreadable metals show "no estimate yet" and the
 * strip hides only when NEITHER metal could be read.
 *
 * Round 26 (owner wording): the chips dropped the bare "will go up /
 * will go down" — next to the green/red ink that phrasing read
 * misleading. The holder-view value words said what the colour means.
 *
 * Round 32 (owner): the owner's plain phrasing is BACK — "will go up"
 * wears green, "will go down" wears red (fa: بالا می‌رود / پایین می‌آید,
 * the same words the moves lines speak); R26's value words are retired.
 * The same round: the condition rows lost their duplicated state word —
 * the icon + short word at the row's start already carries the state
 * (fa's short and full words for "against" were identical, so every
 * row read «علیه کار می‌کند / دلار آمریکا / علیه کار می‌کند»), and the
 * fa wording for "works against" is now «در تضاد است».
 *
 * Round 27 (owner): the card OPENS by default on every visit — the
 * condition rows, live values and footing rows ARE the section; a
 * persisted "collapsed" made them look deleted. "Show details" keeps
 * working (and any targeted pill/hash link still expands), but the
 * choice is session-only — a fresh load always shows the full card.
 */

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { evaluateSignal, type SignalConditionReading, type SignalLean, type SignalReading } from '@currena/insights';
import { Activity, ChevronDown } from 'lucide-react';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { DIRECTION_DOWN_URL, DIRECTION_UP_URL, IconImg, indicatorIconUrl } from '../icons/currena';
import { SIGNALS_ENABLED, formatChange, formatIndicatorValue, mergeSignals } from './config';
import { TREND_RANGE_COPY_KEY, TrendPanel, trendTickFormatter } from './TrendChart';

/* ---------------------------------------------------------------- *
 * Round 23 — the estimation (owner): a mechanical tally, stated.
 * supportive minus against; the sign is the direction. Neutral ink
 * when the tally balances, "no estimate yet" when nothing reads.
 * ---------------------------------------------------------------- */

type SignalVerdict = 'up' | 'down' | 'flat';

function verdictOf(reading: SignalReading): SignalVerdict | null {
  const supportive = reading.conditions.filter((c) => c.state === 'supportive').length;
  const against = reading.conditions.filter((c) => c.state === 'against').length;
  if (supportive + against === 0) return null; // nothing could be read
  if (supportive > against) return 'up';
  if (against > supportive) return 'down';
  return 'flat';
}

function VerdictIcon({
  verdict,
  size = 28,
  desktopSize = 36,
}: {
  verdict: SignalVerdict;
  size?: number;
  desktopSize?: number;
}) {
  /* Round 28 (owner artwork): the metals' up/down arrows wear the owner's
   * green zigzag / red zigzag PNGs — their fixed colours match this card's
   * valence by construction (up = the holder's gain). The flat dash stays
   * a stroke glyph in the neutral ink (there is no "flat" artwork).
   * Round 29 (owner): both grow to the strip's new scale (28 mobile /
   * 36 desktop) — the estimation is this card's answer. */
  if (verdict === 'up') return <IconImg src={DIRECTION_UP_URL} size={size} desktopSize={desktopSize} />;
  if (verdict === 'down') return <IconImg src={DIRECTION_DOWN_URL} size={size} desktopSize={desktopSize} />;
  const common = {
    className: 'currena-icon shrink-0',
    style: {
      '--icon-size': `${size}px`,
      '--icon-size-sm': `${desktopSize}px`,
    } as CSSProperties,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  return (
    <svg {...common}>
      <path d="M3 8h10" />
    </svg>
  );
}

/** The metal's own artwork beside its name (round 28) — gold bar, silver
 * bar; unmapped metals (none today) fall back to no icon. Round 29
 * (owner): 28/36 defaults; round 31: the verdict strip calls it at the
 * price tiles' scale — 96px mobile / 128×128 desktop — the artwork IS
 * the verdict chip's face. */
function MetalIcon({
  metal,
  size = 28,
  desktopSize = 36,
}: {
  metal: 'gold' | 'silver';
  size?: number;
  desktopSize?: number;
}) {
  const icon = indicatorIconUrl(metal === 'gold' ? 'gold-usd' : 'silver-usd');
  return icon !== null ? <IconImg src={icon} size={size} desktopSize={desktopSize} /> : null;
}

const verdictTone: Record<SignalVerdict, string> = {
  up: 'text-[var(--color-status-normal)]',
  down: 'text-[var(--color-status-alert)]',
  flat: 'text-[var(--color-status-stale)]',
};

/* ---------------------------------------------------------------- *
 * Round 33 (owner): the Estimation chip's white space is the metal's
 * own price history — clickable range chips (Quarter · One year · Five
 * years) + a signed window delta. Round 34 (owner): the charts grew
 * real X/Y axes and a hover inspector, and they moved into the SHARED
 * TrendPanel (TrendChart.tsx) — the exact structure the money panel's
 * mini charts now wear, so both sections stay aligned by construction.
 * Data rides the same module-cached /api/insights/:id/history fetch
 * the details panel uses, so opening a card later never re-downloads.
 * ---------------------------------------------------------------- */

type StripRange = 'quarter' | '1y' | '5y';

/** The per-metal trend chart inside an Estimation chip (round 33/34). */
function MetalTrendChart({
  metal,
  copy,
  numberLocale,
}: {
  metal: 'gold' | 'silver';
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const id = metal === 'gold' ? 'gold-usd' : 'silver-usd';
  return (
    <TrendPanel
      id={id}
      copy={copy}
      numberLocale={numberLocale}
      ariaLabelFor={(range: StripRange) =>
        interpolate(copy.ui.stripChartAria, {
          metal: s.metals[metal],
          range: copy.ui[TREND_RANGE_COPY_KEY[range]],
        })
      }
      formatValue={(v) => formatIndicatorValue(id, v, numberLocale, copy.units)}
      formatTickValue={trendTickFormatter(numberLocale)}
      rangeGroupData={{ 'data-verdict-chart-range': metal }}
      deltaData={{ 'data-verdict-chart-delta': metal }}
      plotData={{ 'data-verdict-plot': metal }}
    />
  );
}

function VerdictStrip({
  gold,
  silver,
  copy,
  numberLocale,
}: {
  gold: SignalReading;
  silver: SignalReading;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const rows = [
    { reading: gold, verdict: verdictOf(gold) },
    { reading: silver, verdict: verdictOf(silver) },
  ];
  if (rows.every((r) => r.verdict === null)) return null;
  /* Round 31 (owner): the strip is THE answer of the whole card — "it's
   * the verdict and estimation of the whole section" — so it now carries
   * the app's focal-section recipe (the money panel's, round 29): a
   * brand-gold gradient field with a 2px gold ring and a gold-tinted
   * shadow, so the white verdict chips pop against the card. The metal
   * artwork leads each chip at the price tiles' scale (96px mobile /
   * 128×128 desktop) with the metal name under it, and the verdict word
   * speaks at the price's own size in the verdict ink (icon + word,
   * never colour alone).
   * Round 33 (owner): the chip's white space is no longer empty — the
   * metal's own price history (chart + clickable Quarter / 1 year /
   * 5 years chips) fills the space right of the artwork on desktop and
   * sits under it on phones.
   * Round 34 (owner, alignment rule): the two chips align BY
   * STRUCTURE, not by luck — the verdict word owns a fixed two-line
   * slot (silver's «جهت روشنی ندارد» wraps, gold's «پایین می‌آید»
   * doesn't; the slot keeps both tiles' rows on the same baselines),
   * and the chart column owns a reserved height so loading/none states
   * can't pull one tile's chips row above the other's. */
  return (
    <div
      className="flex flex-col gap-2 rounded-[var(--radius-lg)] bg-gradient-to-b from-[var(--color-accent-gold)]/[0.16] via-[var(--color-accent-gold)]/[0.07] to-transparent p-3.5 shadow-[0_10px_34px_rgba(168,126,28,0.15)] ring-2 ring-[var(--color-accent-gold)]/45 sm:p-4 dark:shadow-[0_14px_44px_rgba(0,0,0,0.45)]"
      data-signal-verdict
    >
      <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-secondary)]">
        {s.verdictTitle}
      </h4>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 sm:flex-row">
        {rows.map(({ reading, verdict }) => (
          <li
            key={reading.metal}
            data-verdict-metal={reading.metal}
            data-verdict-direction={verdict ?? 'none'}
            className="flex min-w-0 flex-1 flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:flex-row sm:items-center sm:gap-4"
          >
            <div className="flex shrink-0 flex-col items-start gap-1 sm:w-40">
              <MetalIcon metal={reading.metal} size={96} desktopSize={128} />
              <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-secondary)]">
                {s.metals[reading.metal]}
              </span>
              <span
                className={`inline-flex min-h-[2.5em] items-center gap-1.5 ${
                  verdict !== null ? verdictTone[verdict] : 'text-[var(--color-status-stale)]'
                }`}
              >
                <VerdictIcon verdict={verdict ?? 'flat'} />
                <span className="text-[length:var(--type-number)] font-bold leading-tight">
                  {verdict === 'up' ? s.verdictUp : verdict === 'down' ? s.verdictDown : verdict === 'flat' ? s.verdictFlat : s.verdictNone}
                </span>
              </span>
            </div>
            <div
              data-verdict-chart={reading.metal}
              className="flex min-h-[136px] min-w-0 flex-1 flex-col justify-center gap-1.5 sm:border-s sm:border-[var(--color-border)] sm:ps-4"
            >
              <MetalTrendChart metal={reading.metal} copy={copy} numberLocale={numberLocale} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Icons — icon + word, never colour alone (S1/R26 note). No check
 * or cross glyphs anywhere (R26). Round 22: the word takes the
 * state's status ink (owner green/red coding).
 * ---------------------------------------------------------------- */

/** Round 22 (owner): supportive = green ink, against = red ink,
 * neutral/unknown = stale. The icon inherits via currentColor. */
function stateToneClass(state: SignalConditionReading['state']): string {
  switch (state) {
    case 'supportive':
      return 'text-[var(--color-status-normal)]';
    case 'against':
      return 'text-[var(--color-status-alert)]';
    default:
      return 'text-[var(--color-status-stale)]';
  }
}

function ConditionIcon({ state }: { state: SignalConditionReading['state'] }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  switch (state) {
    case 'supportive':
      // A rising step line — "supports", not a tick.
      return (
        <svg {...common}>
          <path d="M2.5 11.5l4-4 2.5 2.5 4.5-5" />
        </svg>
      );
    case 'against':
      // A falling step line — "works against", not a cross.
      return (
        <svg {...common}>
          <path d="M2.5 6.5l4 4 2.5-2.5 4.5 5" />
        </svg>
      );
    case 'neutral':
      return (
        <svg {...common}>
          <path d="M4 8h8" />
        </svg>
      );
    case 'unknown':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 4.6V8l2.4 1.6" />
        </svg>
      );
  }
}

function LeanIcon({ lean }: { lean: SignalLean }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  switch (lean) {
    case 'mostly-supportive':
      return (
        <svg {...common}>
          <path d="M2.5 11.5l4-4 2.5 2.5 4.5-5" />
        </svg>
      );
    case 'mixed':
      return (
        <svg {...common}>
          <path d="M2.5 11.5l3.5-3.5 2.5 2.5" />
          <path d="M8 6.5l2-2 3.5 3.5" opacity="0.55" />
        </svg>
      );
    case 'mostly-unsupportive':
      return (
        <svg {...common}>
          <path d="M2.5 6.5l4 4 2.5-2.5 4.5 5" />
        </svg>
      );
  }
}

/* ---------------------------------------------------------------- *
 * The merged card (R26)
 * ---------------------------------------------------------------- */

function ValuesLine({
  ids,
  readings,
  copy,
  numberLocale,
}: {
  ids: readonly IndicatorId[];
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const parts: string[] = [];
  for (const id of ids) {
    const r = byId.get(id);
    if (r === undefined || r.value === null) continue;
    parts.push(formatIndicatorValue(id, r.value, numberLocale, copy.units));
  }
  if (parts.length === 0) return null;
  return (
    <span className="flex flex-wrap items-baseline gap-x-2" dir="ltr">
      {parts.map((p, i) => (
        <bdi key={i} className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
          {p}
        </bdi>
      ))}
    </span>
  );
}

function ConditionRow({
  condition,
  readings,
  copy,
  numberLocale,
}: {
  condition: SignalConditionReading;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const entry = s.conditions[condition.key];
  // Round 32 (owner): no trailing echo of the state word — the icon +
  // short word at the row's start IS the state; a second copy after the
  // name read as a stutter (and in fa the two were the same string).
  // S2: only the industrial condition carries the fixed "mixed" tag.
  const mixedTag = 'tag' in entry ? entry.tag : undefined;
  return (
    <li
      className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] px-2.5 py-2 ring-1 ring-[var(--color-border)]"
      data-condition={condition.key}
      data-condition-state={condition.state}
    >
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className={`inline-flex shrink-0 items-center gap-1 ${stateToneClass(condition.state)}`}>
          <ConditionIcon state={condition.state} />
          <span className="text-[length:var(--type-label)] font-bold">
            {s.conditionStateShort[condition.state]}
          </span>
        </span>
        <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">{entry.name}</span>
        {mixedTag !== undefined ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.72rem] font-semibold text-[var(--color-status-stale)]">
            {mixedTag}
          </span>
        ) : null}
        <span className="ms-auto">
          <ValuesLine ids={condition.inputs} readings={readings} copy={copy} numberLocale={numberLocale} />
        </span>
      </span>
      <span className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {entry.how}
      </span>
    </li>
  );
}

function MergedSignalsCard({
  gold,
  silver,
  readings,
  copy,
  numberLocale,
}: {
  gold: SignalReading;
  silver: SignalReading;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const merged = mergeSignals(gold, silver);
  const byId = new Map(readings.map((r) => [r.id as string, r]));

  const metalLeanLine = (reading: SignalReading): string => {
    const leanWord = reading.lean !== null ? s.lean[reading.lean] : s.notEnoughData;
    return interpolate(s.metalLean, {
      metal: s.metals[reading.metal],
      lean: leanWord,
      met: formatNumber(reading.metCount, numberLocale, { maximumFractionDigits: 0 }),
      total: formatNumber(reading.conditions.length, numberLocale, { maximumFractionDigits: 0 }),
    });
  };

  const positionWordOf = (percentile: number | null): string | null => {
    if (percentile === null) return null;
    return percentile > 0.8 ? copy.ui.positionHigh : percentile < 0.2 ? copy.ui.positionLow : copy.ui.positionTypical;
  };

  const footingRow = (metal: 'gold' | 'silver', state: string, priceId: IndicatorId) => {
    const reading = byId.get(priceId);
    const speed =
      reading !== undefined && reading.change30d !== undefined && Number.isFinite(reading.change30d)
        ? formatChange(reading.change30d, 'pct', numberLocale, copy.units)
        : null;
    const positionPercentile =
      reading !== undefined && reading.percentile10y !== undefined ? reading.percentile10y : null;
    const positionWord = positionWordOf(positionPercentile);
    const valueText =
      reading !== undefined && reading.value !== null
        ? formatIndicatorValue(priceId, reading.value, numberLocale, copy.units)
        : null;
    return (
      <li
        key={metal}
        className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] px-2.5 py-2 ring-1 ring-[var(--color-border)]"
        data-footing-metal={metal}
        data-footing-state={state}
      >
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <MetalIcon metal={metal} size={24} desktopSize={30} />
            <span className={`inline-flex shrink-0 items-center gap-1 ${stateToneClass(state as SignalConditionReading['state'])}`}>
              <ConditionIcon state={state as SignalConditionReading['state']} />
              <span className="text-[length:var(--type-label)] font-bold">
                {s.conditionStateShort[state as SignalConditionReading['state']] ?? s.notEnoughData}
              </span>
            </span>
          </span>
          <span className="text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {s.metals[metal]}
          </span>
          {valueText !== null ? (
            <bdi dir="ltr" className="text-[length:var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
              {valueText}
            </bdi>
          ) : null}
          {positionWord !== null && positionPercentile !== null ? (
            <span className="text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
              {interpolate(s.footingPosition, { band: positionWord })}
            </span>
          ) : null}
          {speed !== null ? (
            <span className="ms-auto flex items-baseline gap-1 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]">
              {s.speedLabel}:
              <bdi dir="ltr" className="font-semibold tabular-nums">
                {speed}
              </bdi>
            </span>
          ) : null}
        </span>
        <span className="text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
          {s.conditions.footing.how}
        </span>
      </li>
    );
  };

  return (
    <article
      data-signal-card="merged"
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)]"
    >
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="type-question m-0 text-[var(--color-text-primary)]">
          {s.mergedTitle}
        </h3>
        <span className="ms-auto flex flex-col items-end gap-0.5">
          {[gold, silver].map((reading) => (
            <span
              key={reading.metal}
              className="inline-flex items-center gap-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)]"
              data-signal-metal={reading.metal}
            >
              <MetalIcon metal={reading.metal} size={18} desktopSize={22} />
              {reading.lean !== null ? <LeanIcon lean={reading.lean} /> : null}
              {metalLeanLine(reading)}
            </span>
          ))}
        </span>
      </header>

      {/* Round 23 (owner): the stated estimation — one direction chip per
       * metal, derived from the conditions below. Answer first. */}
      <VerdictStrip gold={gold} silver={silver} copy={copy} numberLocale={numberLocale} />

      {/* Step-1 audit item C12: gold near its DECADE high while real yields
       * are also high — the one combination the checklist's separate lines
       * cannot say by construction. Computed from the same readings (no
       * new claim, a named interaction the backtested relationships
       * support: high real yields raise the opportunity cost of holding
       * gold, and buying the decade's peak price while they do has
       * historically been difficult). */}
      {(() => {
        const goldReading = byId.get('gold-usd');
        const realYield = byId.get('real-yield-10y');
        const goldHigh = goldReading !== undefined && (goldReading.percentile10y ?? 0) >= 0.9;
        const yieldsHigh = realYield !== undefined && (realYield.percentile10y ?? 0) >= 0.8 && realYield.value !== null && realYield.value > 0;
        if (!goldHigh || !yieldsHigh) return null;
        return (
          <p className="m-0 rounded-[var(--radius-sm)] bg-currena-warning/[0.08] px-2.5 py-2 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]" data-gold-yields-warning>
            <bdi>{copy.signals.goldHighYieldsWarning}</bdi>
          </p>
        );
      })()}

      {/* The shared conditions, listed ONCE (identical states by construction).
       * Round 22: the three state headings take the state's own ink and all
       * five group headings share one label-size style (hierarchy + rhythm). */}
      <div className="flex flex-col gap-2">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-status-normal)]">
          {s.sideSupportive}
        </h4>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {merged.shared
            .filter((c) => c.state === 'supportive')
            .map((c) => (
              <ConditionRow
                key={c.key}
                condition={gold.conditions.find((gc) => gc.key === c.key)!}
                readings={readings}
                copy={copy}
                numberLocale={numberLocale}
              />
            ))}
        </ul>
        <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-status-alert)]">
          {s.sideAgainst}
        </h4>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {merged.shared
            .filter((c) => c.state === 'against')
            .map((c) => (
              <ConditionRow
                key={c.key}
                condition={gold.conditions.find((gc) => gc.key === c.key)!}
                readings={readings}
                copy={copy}
                numberLocale={numberLocale}
              />
            ))}
        </ul>
        {merged.shared.some((c) => c.state === 'neutral' || c.state === 'unknown') ? (
          <>
            <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-status-stale)]">
              {s.sideNeutral}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {merged.shared
                .filter((c) => c.state === 'neutral' || c.state === 'unknown')
                .map((c) => {
                  const cond = gold.conditions.find((gc) => gc.key === c.key)!;
                  return (
                    <ConditionRow key={c.key} condition={cond} readings={readings} copy={copy} numberLocale={numberLocale} />
                  );
                })}
            </ul>
          </>
        ) : null}
      </div>

      {/* Per-metal footing rows (position + speed ride here, speed only
       * when the data exists — no "Measuring…" placeholder). */}
      <div className="flex flex-col gap-2">
        <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">
          {s.footingTitle}
        </h4>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {merged.footing.map((f) => footingRow(f.metal, f.state, f.priceId))}
        </ul>
      </div>

      {/* The silver-only condition (R26: separate short list). */}
      {merged.silverOnly.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">
            {s.silverOnly}
          </h4>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {merged.silverOnly.map((c) => (
              <ConditionRow
                key={c.key}
                condition={silver.conditions.find((sc) => sc.key === c.key)!}
                readings={readings}
                copy={copy}
                numberLocale={numberLocale}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

/* ---------------------------------------------------------------- *
 * The section
 * ---------------------------------------------------------------- */

/** Round 24: the collapsed per-metal line's takeaway — the estimation
 * (round 23's verdictOf), icon + word + ink (round 26: the icon joined
 * the line); unreadable metals stay silent. */
function CollapsedVerdict({ reading, copy }: { reading: SignalReading; copy: InsightsCopy }) {
  const s = copy.signals;
  const verdict = verdictOf(reading);
  if (verdict === null) return null;
  const word = verdict === 'up' ? s.verdictUp : verdict === 'down' ? s.verdictDown : s.verdictFlat;
  return (
    <span
      className={`ms-1.5 inline-flex items-center gap-1 font-bold ${verdictTone[verdict]}`}
      data-collapsed-verdict={verdict}
    >
      <VerdictIcon verdict={verdict} size={16} desktopSize={20} />
      {interpolate(s.collapsedVerdict, { verdict: word })}
    </span>
  );
}

export function Signals({
  readings,
  copy,
  numberLocale,
  expandToken,
}: {
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** Bumped by the route when a pill/hash/hero link targets this section. */
  expandToken: number;
}) {
  const gold = useMemo(() => evaluateSignal('gold', readings), [readings]);
  const silver = useMemo(() => evaluateSignal('silver', readings), [readings]);
  /* Round 27 (owner): open by default — the detail is the content.
   * No persistence: collapsing is a per-session choice (spec R7b's
   * remembered default made the card look removed). */
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (expandToken > 0) setOpen(true);
  }, [expandToken]);

  if (!SIGNALS_ENABLED) return null;

  // Collapsed summary (R7b, now session-only): one line per metal —
  // "Gold: mixed, 2 of 5 conditions met — price in the top 7% of the
  // last 10 years".
  const collapsedLine = (reading: SignalReading): string => {
    const s = copy.signals;
    const leanWord = reading.lean !== null ? s.lean[reading.lean] : s.notEnoughData;
    const base = interpolate(s.metalLean, {
      metal: s.metals[reading.metal],
      lean: leanWord,
      met: formatNumber(reading.metCount, numberLocale, { maximumFractionDigits: 0 }),
      total: formatNumber(reading.conditions.length, numberLocale, { maximumFractionDigits: 0 }),
    });
    const position = reading.position;
    if (position === null) return base;
    const p = formatNumber(
      Math.round((position.band === 'high' ? 1 - position.percentile : position.percentile) * 100),
      numberLocale,
      { maximumFractionDigits: 0 },
    );
    const band =
      position.band === 'high'
        ? interpolate(s.bandTop, { p })
        : position.band === 'low'
          ? interpolate(s.bandBottom, { p })
          : s.bandMid;
    return `${base}; ${interpolate(s.collapsedFooting, { band })}`;
  };

  return (
    <section id="insights-signals" aria-labelledby="insights-signals-title" className="scroll-mt-24">
      <header className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="insights-signals-title" className="type-section m-0">
          <span className="inline-flex items-center gap-1.5">
            <Activity aria-hidden size={23} strokeWidth={1.8} className="shrink-0 text-[var(--color-status-context)]" />
            {copy.signals.title}
          </span>
        </h2>
        <span className="inline-flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="insights-signals-body"
            onClick={() => setOpen(!open)}
            className="insights-focusable inline-flex min-h-[24px] min-w-[24px] cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[length:var(--type-caption)] font-bold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
          >
            <span aria-hidden="true">
              <ChevronDown
                size={16}
                strokeWidth={2}
                className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? '' : '-rotate-90 rtl:rotate-90'}`}
              />
            </span>
            {open ? copy.ui.showFewer : copy.ui.aboutShowDetails}
          </button>
        </span>
      </header>
      <p className="m-0 mb-2 text-[length:var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.signals.subtitle}
      </p>

      <div id="insights-signals-body">
        {open ? (
          <MergedSignalsCard gold={gold} silver={silver} readings={readings} copy={copy} numberLocale={numberLocale} />
        ) : (
          /* Collapsed: one line per metal (spec R7b). */
          <ul className="m-0 flex list-none flex-col gap-1 p-0" data-signals-summary>
            {[gold, silver].map((reading) => (
              <li
                key={reading.metal}
                className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]"
                data-signal-metal={reading.metal}
              >
                {collapsedLine(reading)}
                {/* Round 24 (roast #4): the collapsed line now ends with
                 * its takeaway — the round-23 estimation, in the ink. */}
                <CollapsedVerdict reading={reading} copy={copy} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
