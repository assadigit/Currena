/**
 * Signals — UI spec Blocks S1–S3 (I17), restructured by round-2 R26.
 *
 * ONE merged gold-and-silver card (R26): the four global conditions the
 * metals share are listed once (identical by construction — the evaluators
 * read the same global series); each metal gets its own footing row; the
 * silver-only industrial condition sits in a separate short list. Neutral
 * "Supports / Works against" words and icons replace the check/cross marks
 * (no pass/fail look, no green/red). The 30-day speed rides the footing row
 * ONLY when the data exists — no more "Measuring…" tile.
 *
 * The "before you act" box (S3) was removed entirely (2026-10-10 owner
 * request) — the collapsed summary and the merged card carry the honesty
 * framing instead.
 *
 * Compliance by construction: no green for "supportive", no red for
 * "against" — icon + word in neutral inks only; conditions, never advice.
 */

import { useEffect, useMemo, useState } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { evaluateSignal, type SignalConditionReading, type SignalLean, type SignalReading } from '@currena/insights';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { SIGNALS_ENABLED, formatChange, formatIndicatorValue, mergeSignals } from './config';

/* ---------------------------------------------------------------- *
 * Icons — neutral, icon + word, never colour judgement (S1/R26 note)
 * No check or cross glyphs anywhere (R26).
 * ---------------------------------------------------------------- */

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
        <bdi key={i} className="text-[var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
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
  const stateWord = s.conditionState[condition.state];
  // S2: only the industrial condition carries the fixed "mixed" tag.
  const mixedTag = 'tag' in entry ? entry.tag : undefined;
  return (
    <li
      className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] px-2.5 py-2 ring-1 ring-[var(--color-border)]"
      data-condition={condition.key}
      data-condition-state={condition.state}
    >
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="inline-flex shrink-0 items-center gap-1 text-[var(--color-status-context)]">
          <ConditionIcon state={condition.state} />
          <span
            className={`text-[var(--type-caption)] font-bold ${
              condition.state === 'supportive' || condition.state === 'against'
                ? 'text-[var(--color-status-context)]'
                : 'text-[var(--color-status-stale)]'
            }`}
          >
            {s.conditionStateShort[condition.state]}
          </span>
        </span>
        <span className="text-[var(--type-label)] font-bold text-[var(--color-text-primary)]">{entry.name}</span>
        <span className="text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">{stateWord}</span>
        {mixedTag !== undefined ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.72rem] font-semibold text-[var(--color-status-stale)]">
            {mixedTag}
          </span>
        ) : null}
        <span className="ms-auto">
          <ValuesLine ids={condition.inputs} readings={readings} copy={copy} numberLocale={numberLocale} />
        </span>
      </span>
      <span className="text-[var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
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
          <span className="inline-flex shrink-0 items-center gap-1 text-[var(--color-status-context)]">
            <ConditionIcon state={state as SignalConditionReading['state']} />
            <span
              className={`text-[var(--type-caption)] font-bold ${
                state === 'supportive' || state === 'against'
                  ? 'text-[var(--color-status-context)]'
                  : 'text-[var(--color-status-stale)]'
              }`}
            >
              {s.conditionStateShort[state as SignalConditionReading['state']] ?? s.notEnoughData}
            </span>
          </span>
          <span className="text-[var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {s.metals[metal]}
          </span>
          {valueText !== null ? (
            <bdi dir="ltr" className="text-[var(--type-caption)] font-semibold tabular-nums text-[var(--color-text-secondary)]">
              {valueText}
            </bdi>
          ) : null}
          {positionWord !== null && positionPercentile !== null ? (
            <span className="text-[var(--type-caption)] text-[var(--color-text-secondary)]">
              {interpolate(s.footingPosition, { band: positionWord })}
            </span>
          ) : null}
          {speed !== null ? (
            <span className="ms-auto flex items-baseline gap-1 text-[var(--type-caption)] text-[var(--color-text-secondary)]">
              {s.speedLabel}:
              <bdi dir="ltr" className="font-semibold tabular-nums">
                {speed}
              </bdi>
            </span>
          ) : null}
        </span>
        <span className="text-[var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
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
        <h3 className="m-0 text-[var(--type-label)] font-extrabold text-[var(--color-text-primary)]">
          {s.mergedTitle}
        </h3>
        <span className="ms-auto flex flex-col items-end gap-0.5">
          {[gold, silver].map((reading) => (
            <span
              key={reading.metal}
              className="inline-flex items-center gap-1 text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)]"
              data-signal-metal={reading.metal}
            >
              {reading.lean !== null ? <LeanIcon lean={reading.lean} /> : null}
              {metalLeanLine(reading)}
            </span>
          ))}
        </span>
      </header>

      {/* The shared conditions, listed ONCE (identical states by construction). */}
      <div className="flex flex-col gap-2">
        <h4 className="m-0 text-[var(--type-caption)] font-extrabold text-[var(--color-status-context)]">
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
        <h4 className="m-0 text-[var(--type-caption)] font-extrabold text-[var(--color-text-secondary)]">
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
            <h4 className="m-0 text-[var(--type-caption)] font-extrabold text-[var(--color-status-stale)]">
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
        <h4 className="m-0 text-[var(--type-caption)] font-extrabold text-[var(--color-text-secondary)]">
          {s.footingTitle}
        </h4>
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
          {merged.footing.map((f) => footingRow(f.metal, f.state, f.priceId))}
        </ul>
      </div>

      {/* The silver-only condition (R26: separate short list). */}
      {merged.silverOnly.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h4 className="m-0 text-[var(--type-caption)] font-extrabold text-[var(--color-text-secondary)]">
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

const STORAGE_KEY = 'currena.insights.signals-open.v1';

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
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === 'open';
    } catch {
      return false; // fail open to collapsed (spec R7b)
    }
  });

  useEffect(() => {
    if (expandToken > 0) setOpen(true);
  }, [expandToken]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? 'open' : 'closed');
    } catch {
      /* privacy mode — session-only */
    }
  }, [open]);

  if (!SIGNALS_ENABLED) return null;

  // R7b collapsed summary: one line per metal — "Gold: mixed, 2 of 5
  // conditions met — price in the top 7% of the last 10 years".
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
    return `${base} — ${interpolate(s.collapsedFooting, { band })}`;
  };

  return (
    <section id="insights-signals" aria-labelledby="insights-signals-title" className="scroll-mt-24">
      <header className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="insights-signals-title" className="m-0 text-lg font-extrabold">
          {copy.signals.title}
        </h2>
        <span className="inline-flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="insights-signals-body"
            onClick={() => setOpen(!open)}
            className="insights-focusable inline-flex min-h-[24px] min-w-[24px] cursor-pointer items-center gap-1.5 rounded-full px-2 py-1 text-[var(--type-caption)] font-bold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
          >
            <span aria-hidden="true">{open ? '▾' : '▸'}</span>
            {open ? copy.ui.showFewer : copy.ui.aboutShowDetails}
          </button>
        </span>
      </header>
      <p className="m-0 mb-2 text-[var(--type-label)] text-[var(--color-text-secondary)]">
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
                className="text-[var(--type-label)] font-semibold text-[var(--color-text-secondary)]"
                data-signal-metal={reading.metal}
              >
                {collapsedLine(reading)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
