/**
 * ConnectionCard — UI spec Block T1 (I17, the v2 wave): one card per
 * relationship. Shows two or three indicators with live values, a short
 * arrow between them, one plain sentence of how they usually relate, and a
 * computed "right now" line. One state: active, partly active, not active,
 * or signals disagree (plus the honest unknown when a leg is stale).
 *
 * Evidence tags: "to verify" on every card until the owner confirms the
 * evidence (spec note) — a fixed chip, never a computed judgement.
 *
 * Discipline inherited from the page: state shows as icon + word, never
 * colour alone (G5 family) and never green/red judgement colours; the leg
 * chips are 24px+ targets (G6) that open the indicator's details panel;
 * arrows mirror in RTL (G1 logical properties, the SVG flips via CSS).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { ConnectionReading, ConnectionState, LegEval } from '@currena/insights';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { formatIndicatorValue, legPhrase } from './config';

/** Inline state icons (16×16, stroke = currentColor) — icon + word, never colour alone. */
function ConnectionStateIcon({ state }: { state: ConnectionState }) {
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
    case 'active':
      return (
        <svg {...common}>
          <path d="M2.5 8.5l3 3 5-6" />
          <path d="M9.5 11.5l4-7" opacity="0.45" />
        </svg>
      );
    case 'partly':
      return (
        <svg {...common}>
          <path d="M2.5 10.5l3 2 3.5-4.5" />
          <path d="M11 4.5h3" opacity="0.45" />
        </svg>
      );
    case 'inactive':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M5.4 8h5.2" />
        </svg>
      );
    case 'disagree':
      return (
        <svg {...common}>
          <path d="M2.5 6h4" />
          <path d="M5 4.2 2.8 6 5 7.8" />
          <path d="M13.5 10h-4" />
          <path d="M11 8.2l2.2 1.8L11 11.8" />
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

/** Neutral tones only — pattern presence is information, never advice. */
const STATE_TONE: Record<ConnectionState, string> = {
  active: 'bg-currena-blue/10 text-[var(--color-status-context)]',
  partly: 'bg-currena-blue/10 text-[var(--color-status-context)]',
  inactive: 'bg-currena-muted/15 text-[var(--color-status-stale)]',
  disagree: 'bg-currena-muted/15 text-[var(--color-status-stale)]',
  unknown: 'bg-currena-muted/15 text-[var(--color-status-stale)]',
};

/** The relation arrow between leg chips — mirrors in RTL (CSS flip). */
function RelationArrow() {
  return (
    <svg
      className="connection-arrow shrink-0 text-[var(--color-text-secondary)]"
      width="18"
      height="12"
      viewBox="0 0 18 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1.5 6h13" />
      <path d="M11.5 2.8 15 6l-3.5 3.2" />
    </svg>
  );
}

/** One leg chip: short name, live value, lean word — opens the details panel. */
function LegChip({
  leg,
  reading,
  shortName,
  copy,
  numberLocale,
  onFocusCard,
}: {
  leg: LegEval;
  reading: IndicatorReading | undefined;
  shortName: string;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}) {
  const t = copy.together;
  const unreadable = reading === undefined || reading.status === 'stale' || reading.status === 'unavailable';
  const valueText =
    reading !== undefined && reading.value !== null
      ? formatIndicatorValue(leg.id, reading.value, numberLocale, copy.units)
      : null;
  // One plain lean word: the direction when measurable, else the level.
  const leanWord =
    leg.direction !== null
      ? t.direction[leg.direction]
      : leg.level !== null
        ? t.level[leg.level]
        : null;
  return (
    <button
      type="button"
      onClick={(e) => onFocusCard(leg.id, e.currentTarget)}
      aria-expanded={false}
      className="insights-focusable inline-flex min-h-[44px] cursor-pointer flex-col items-start gap-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-start transition-colors hover:border-currena-blue/50"
    >
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-[var(--type-label)] font-bold text-[var(--color-text-primary)]">{shortName}</span>
        {leanWord !== null ? (
          <span className={`text-[0.72rem] font-bold ${unreadable ? 'text-[var(--color-status-stale)]' : 'text-[var(--color-status-context)]'}`}>
            {leanWord}
          </span>
        ) : null}
      </span>
      <span className="flex items-baseline gap-2 text-[var(--type-caption)] text-[var(--color-text-secondary)]">
        {valueText !== null ? (
          <bdi dir="ltr" className="type-number font-semibold tabular-nums">
            {valueText}
          </bdi>
        ) : (
          <span>—</span>
        )}
      </span>
      <span className="sr-only"> — {t.viewLegCard}</span>
    </button>
  );
}

export function ConnectionCard({
  reading,
  readings,
  copy,
  numberLocale,
  onFocusCard,
}: {
  reading: ConnectionReading;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
}) {
  const entry = copy.together.connections[reading.connection];
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const phrases = reading.legs.map((leg) =>
    legPhrase(leg, entry.legs[leg.id as keyof typeof entry.legs] ?? leg.id, copy),
  );
  const rightNowTemplate = entry.rightNow[reading.state];
  const rightNow = interpolate(rightNowTemplate, {
    a: phrases[0] ?? '',
    b: phrases[1] ?? '',
    c: phrases[2] ?? '',
  });

  return (
    <article
      data-connection={reading.connection}
      data-connection-state={reading.state}
      className="flex flex-col gap-2.5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)]"
    >
      <header className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${STATE_TONE[reading.state]}`}
        >
          <ConnectionStateIcon state={reading.state} />
          {copy.together.state[reading.state]}
        </span>
        <h3 className="m-0 text-[var(--type-label)] font-extrabold text-[var(--color-text-primary)]">
          {entry.name}
        </h3>
        {/* Evidence tag: "to verify" on every card until the owner confirms. */}
        <span className="ms-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-currena-muted/15 px-2.5 py-0.5 text-[0.72rem] font-semibold text-[var(--color-status-stale)]">
          {copy.together.evidenceToVerify}
        </span>
      </header>

      {/* The legs with live values and the relation arrows between them
       * (flow direction follows the document; the SVG arrows mirror via
       * the [dir='rtl'] CSS flip). */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {reading.legs.map((leg, i) => (
          <span key={leg.id} className="flex items-center gap-2">
            {i > 0 ? <RelationArrow /> : null}
            <LegChip
              leg={leg}
              reading={byId.get(leg.id)}
              shortName={entry.legs[leg.id as keyof typeof entry.legs] ?? leg.id}
              copy={copy}
              numberLocale={numberLocale}
              onFocusCard={onFocusCard}
            />
          </span>
        ))}
      </div>

      {/* How they usually relate — hedged, one plain sentence. */}
      <p className="m-0 text-[var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {entry.relation}
      </p>

      {/* The computed right-now line. */}
      <p className="m-0 text-[var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]">
        {rightNow}
      </p>
    </article>
  );
}
