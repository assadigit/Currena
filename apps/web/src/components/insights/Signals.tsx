/**
 * SignalsCard + Signals — UI spec Blocks S1–S3 (I17, the v2-gated wave,
 * shipped with the owner's full approval; SIGNALS_ENABLED in config.ts is
 * the one-flip off-switch).
 *
 * One card per metal (gold S1, silver S2): a lean in words, the count line
 * ("n of m conditions met"), a checklist of the five (silver: six)
 * conditions with live values grouped into the two sides — conditions that
 * usually support the metal and conditions that usually work against it —
 * plus the three plain checks (10-year position, usual drivers, 30-day
 * speed). The fixed "before you act" box (S3) renders on every card,
 * never behind a click.
 *
 * Compliance by construction (spec S1 note): no green for "supportive" and
 * no red for "unsupportive" — icon + word in neutral inks only; the section
 * is named "What the signals say", never "Investment opportunities"; the
 * wording describes conditions and leaves every decision to the reader.
 */

import { useMemo } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { evaluateSignal, type SignalConditionReading, type SignalLean, type SignalReading } from '@currena/insights';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { SIGNALS_ENABLED, formatChange, formatIndicatorValue } from './config';

/* ---------------------------------------------------------------- *
 * Icons — icon + word, neutral ink, never colour judgement (S1 note)
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
      return (
        <svg {...common}>
          <path d="M2.8 8.4l3.4 3.4L13.2 4.4" />
        </svg>
      );
    case 'against':
      return (
        <svg {...common}>
          <path d="M4 4l8 8" />
          <path d="M12 4l-8 8" opacity="0.5" />
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
 * One checklist row: icon + name + state word + live values + how-hint
 * (rendered inline in SignalsCard via the `row` closure)
 * ---------------------------------------------------------------- */

/* ---------------------------------------------------------------- *
 * The card
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

function SignalsCard({
  reading,
  readings,
  copy,
  numberLocale,
}: {
  reading: SignalReading;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const s = copy.signals;
  const metalName = s.metals[reading.metal];
  const leanWord = reading.lean !== null ? s.lean[reading.lean] : null;
  const countLine = interpolate(s.conditionsMet, {
    met: String(reading.metCount),
    total: String(reading.conditions.length),
  });

  // The two sides (S1): currently-supportive rows, currently-against rows,
  // and the honest neutral/unreadable tail group.
  const supportive = reading.conditions.filter((c) => c.state === 'supportive');
  const against = reading.conditions.filter((c) => c.state === 'against');
  const neutralish = reading.conditions.filter((c) => c.state === 'neutral' || c.state === 'unknown');

  const positionWord =
    reading.position !== null
      ? reading.position.band === 'low'
        ? copy.ui.positionLow
        : reading.position.band === 'high'
          ? copy.ui.positionHigh
          : copy.ui.positionTypical
      : null;
  const positionValue =
    reading.position !== null
      ? interpolate(copy.ui.positionValue, {
          pct: `${Math.round(reading.position.percentile * 100)}${copy.units.percent}`,
        })
      : null;
  const speedText =
    reading.speed !== null ? formatChange(reading.speed, 'pct', numberLocale, copy.units) : null;

  const row = (condition: SignalConditionReading) => {
    const entry = s.conditions[condition.key];
    const stateWord = s.conditionState[condition.state];
    // S2: only the industrial condition carries the fixed "mixed" tag.
    const mixedTag = 'tag' in entry ? entry.tag : undefined;
    return (
      <li
        key={condition.key}
        className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] px-2.5 py-2 ring-1 ring-[var(--color-border)]"
        data-condition={condition.key}
        data-condition-state={condition.state}
      >
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className="inline-flex shrink-0 items-center gap-1 text-[var(--color-status-context)]">
            <ConditionIcon state={condition.state} />
          </span>
          <span className="text-[var(--type-label)] font-bold text-[var(--color-text-primary)]">{entry.name}</span>
          <span
            className={`text-[0.72rem] font-bold ${
              condition.state === 'supportive' || condition.state === 'against'
                ? 'text-[var(--color-status-context)]'
                : 'text-[var(--color-status-stale)]'
            }`}
          >
            {stateWord}
          </span>
          {/* S2: the industrial condition always carries the fixed "mixed" tag. */}
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
  };

  return (
    <article
      data-signal-metal={reading.metal}
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)]"
    >
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-[var(--type-label)] font-extrabold text-[var(--color-text-primary)]">
          {metalName}
        </h3>
        {leanWord !== null && reading.lean !== null ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-currena-blue/10 px-2.5 py-0.5 text-[0.72rem] font-bold text-[var(--color-status-context)]">
            <LeanIcon lean={reading.lean} />
            {leanWord}
          </span>
        ) : null}
        <span className="ms-auto text-[var(--type-caption)] font-semibold text-[var(--color-text-secondary)]">
          {countLine}
        </span>
      </header>

      {/* The three plain checks (S1): position · drivers · speed. */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] px-2.5 py-2 ring-1 ring-[var(--color-border)]">
          <p className="m-0 text-[var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
            {s.checkPosition}
          </p>
          <p className="m-0 text-[var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {positionWord ?? s.notEnoughData}
          </p>
          {positionValue !== null ? (
            <p className="m-0 text-[var(--type-caption)] text-[var(--color-text-secondary)]">{positionValue}</p>
          ) : null}
        </div>
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] px-2.5 py-2 ring-1 ring-[var(--color-border)]">
          <p className="m-0 text-[var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
            {s.checkDrivers}
          </p>
          <p className="m-0 text-[var(--type-label)] font-bold text-[var(--color-text-primary)]">
            {leanWord ?? s.notEnoughData}
          </p>
          <p className="m-0 text-[var(--type-caption)] text-[var(--color-text-secondary)]">{countLine}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-surface-raised)] px-2.5 py-2 ring-1 ring-[var(--color-border)]">
          <p className="m-0 text-[var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
            {s.checkSpeed}
          </p>
          {speedText !== null ? (
            <bdi dir="ltr" className="m-0 block text-[var(--type-label)] font-bold tabular-nums text-[var(--color-text-primary)]">
              {speedText}
            </bdi>
          ) : (
            <p className="m-0 text-[var(--type-label)] font-semibold text-[var(--color-text-primary)]">
              {s.speedMeasuring}
            </p>
          )}
        </div>
      </div>

      {/* The two sides (S1): checklist grouped by current lean. */}
      <div className="flex flex-col gap-2">
        {supportive.length > 0 ? (
          <div>
            <h4 className="m-0 mb-1 text-[var(--type-caption)] font-extrabold text-[var(--color-status-context)]">
              {interpolate(s.sideSupportive, { metal: metalName })}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">{supportive.map(row)}</ul>
          </div>
        ) : null}
        {against.length > 0 ? (
          <div>
            <h4 className="m-0 mb-1 text-[var(--type-caption)] font-extrabold text-[var(--color-text-secondary)]">
              {interpolate(s.sideAgainst, { metal: metalName })}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">{against.map(row)}</ul>
          </div>
        ) : null}
        {neutralish.length > 0 ? (
          <div>
            <h4 className="m-0 mb-1 text-[var(--type-caption)] font-extrabold text-[var(--color-status-stale)]">
              {s.sideNeutral}
            </h4>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">{neutralish.map(row)}</ul>
          </div>
        ) : null}
      </div>

      {/* S3: the fixed "before you act" box — always visible, never a click away. */}
      <aside className="rounded-[var(--radius-md)] bg-currena-soft/70 px-3 py-2.5 ring-1 ring-[var(--color-border)] dark:bg-white/[0.05]">
        <h4 className="m-0 mb-1 text-[var(--type-caption)] font-extrabold text-[var(--color-text-primary)]">
          {s.beforeYouActTitle}
        </h4>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {s.beforeYouAct.map((point) => (
            <li key={point} className="text-[var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]">
              {point}
            </li>
          ))}
        </ul>
      </aside>
    </article>
  );
}

/* ---------------------------------------------------------------- *
 * The section
 * ---------------------------------------------------------------- */

export function Signals({
  readings,
  copy,
  numberLocale,
}: {
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const gold = useMemo(() => evaluateSignal('gold', readings), [readings]);
  const silver = useMemo(() => evaluateSignal('silver', readings), [readings]);
  if (!SIGNALS_ENABLED) return null;
  return (
    <section id="insights-signals" aria-labelledby="insights-signals-title" className="scroll-mt-24">
      <h2 id="insights-signals-title" className="m-0 mb-1 text-lg font-extrabold">
        {copy.signals.title}
      </h2>
      <p className="m-0 mb-2 text-[var(--type-label)] text-[var(--color-text-secondary)]">
        {copy.signals.subtitle}
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-2.5">
        <SignalsCard reading={gold} readings={readings} copy={copy} numberLocale={numberLocale} />
        <SignalsCard reading={silver} readings={readings} copy={copy} numberLocale={numberLocale} />
      </div>
    </section>
  );
}
