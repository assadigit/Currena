/**
 * ConnectionCard — UI spec Block T1 (I17), restructured by round-2 R27.
 *
 * Each indicator renders as a small STAT CHIP in one wrapping row with equal
 * heights (no arrows between chips — arrows implied cause and effect): plain
 * name, value WITH UNIT, and the state word (rising/steady/falling; high/
 * mid-range/low) at caption size. The relation sentence keeps its
 * owner-approved wording; the "right now" line is ONE truthful clause.
 *
 * The "Evidence: to verify" tag never renders (R27) — the section-level
 * quiet note replaces it; the tag stays in the data attributes only.
 *
 * State shows as icon + word, never colour alone (G5 family); the leg chips
 * are 24px+ targets (G6) that open the indicator's details panel.
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

/** One leg STAT CHIP: short name, live value WITH UNIT, the state word at
 * caption size — opens the details panel. Equal height per row. */
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
  // One plain state word: the direction when measurable, else the level.
  const stateWord =
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
      <span className="text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">{shortName}</span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        {valueText !== null ? (
          <bdi dir="ltr" className="type-number font-semibold tabular-nums text-[var(--color-text-primary)]">
            {valueText}
          </bdi>
        ) : (
          <span className="text-[length:var(--type-caption)]">{copy.ui.na}</span>
        )}
        {stateWord !== null ? (
          <span
            className={`text-[length:var(--type-caption)] font-bold ${
              unreadable ? 'text-[var(--color-status-stale)]' : 'text-[var(--color-status-context)]'
            }`}
          >
            {stateWord}
          </span>
        ) : null}
      </span>
      <span className="sr-only">, {t.viewLegCard}</span>
    </button>
  );
}

export function ConnectionCard({
  reading,
  readings,
  copy,
  numberLocale,
  onFocusCard,
  autoFocus,
}: {
  reading: ConnectionReading;
  readings: readonly IndicatorReading[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  onFocusCard: (id: IndicatorId, opener?: HTMLElement | null) => void;
  /** R7b: a collapsed-section chip click lands here — scroll + ring once. */
  autoFocus?: boolean;
}) {
  const entry = copy.together.connections[reading.connection];
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  const phrases = reading.legs.map((leg) =>
    legPhrase(leg, entry.legs[leg.id as keyof typeof entry.legs] ?? leg.id, copy),
  );
  // R27: the right-now line — ONE truthful clause keyed by state; the
  // disagree case names the concrete leg phrases.
  const rightNowTemplate = copy.together.rightNowShort[reading.state];
  const rightNow =
    reading.state === 'disagree'
      ? interpolate(rightNowTemplate, { a: phrases[0] ?? '', b: phrases[1] ?? '' })
      : rightNowTemplate;

  return (
    <article
      data-connection={reading.connection}
      data-connection-state={reading.state}
      // R27: the evidence tag stays in the DATA, never on the face.
      data-evidence="to-verify"
      className={`flex flex-col gap-2.5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] ${autoFocus ? 'motion-safe:animate-pulse ring-currena-blue/50' : ''}`}
    >
      <header className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.72rem] font-bold ${STATE_TONE[reading.state]}`}
        >
          <ConnectionStateIcon state={reading.state} />
          {copy.together.state[reading.state]}
        </span>
        <h3 className="type-question m-0 text-[var(--color-text-primary)]">
          {entry.name}
        </h3>
      </header>

      {/* R27: the legs as STAT CHIPS in one wrapping row with equal heights
       * (items-stretch, h-full on the chip) — no arrows between them. */}
      <div className="flex flex-wrap items-stretch gap-2">
        {reading.legs.map((leg) => (
          <LegChip
            key={leg.id}
            leg={leg}
            reading={byId.get(leg.id)}
            shortName={entry.legs[leg.id as keyof typeof entry.legs] ?? leg.id}
            copy={copy}
            numberLocale={numberLocale}
            onFocusCard={onFocusCard}
          />
        ))}
      </div>

      {/* How they usually relate — hedged, one plain sentence (unchanged). */}
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        {entry.relation}
      </p>

      {/* R27: the one-clause right-now line. */}
      <p className="m-0 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]">
        {rightNow}
      </p>
    </article>
  );
}
