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
 *
 * Round 32 (owner): the right-now verdict + the per-leg moves moved into
 * a FOCAL container inside the card (the money panel's gold-field recipe)
 * with the moves as white chips riding a direction glyph each.
 */

import type { CSSProperties } from 'react';
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
    case 'pending':
      // Fix spec B-04: pass-through pending — the decision exists, the loan
      // data has not caught up yet.
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 4.6V8l2.4 1.6" />
          <path d="M11.2 4.2h1.6v1.6" />
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
  pending: 'bg-currena-muted/15 text-[var(--color-status-stale)]',
  inactive: 'bg-currena-muted/15 text-[var(--color-status-stale)]',
  disagree: 'bg-currena-muted/15 text-[var(--color-status-stale)]',
  unknown: 'bg-currena-muted/15 text-[var(--color-status-stale)]',
};

/** Round 32 (owner): the move chips' direction glyph — the money panel's
 * stroke arrows (up/down/dash) at the chip's own scale; level-only legs
 * (high/low/mid) get a position DOT, not a motion arrow — a level is not
 * a movement. aria-hidden — the word beside it carries the meaning. */
function MoveIcon({ kind }: { kind: MoveKind }) {
  const common = {
    className: 'currena-icon shrink-0',
    style: {
      '--icon-size': '18px',
      '--icon-size-sm': '20px',
    } as CSSProperties,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  if (kind === 'up') {
    return (
      <svg {...common}>
        <path d="M8 13V3.5" />
        <path d="M3.5 8 8 3.5 12.5 8" />
      </svg>
    );
  }
  if (kind === 'down') {
    return (
      <svg {...common}>
        <path d="M8 3v9.5" />
        <path d="M3.5 8 8 12.5 12.5 8" />
      </svg>
    );
  }
  if (kind === 'flat') {
    return (
      <svg {...common}>
        <path d="M3 8h10" />
      </svg>
    );
  }
  return (
    <svg {...common} strokeWidth={1.6}>
      <circle cx="8" cy="8" r="3.2" />
      <circle cx="8" cy="8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

type MoveKind = 'up' | 'down' | 'flat' | 'level';

/** Fix spec B-04: the pass-through compare line's signed points ("+0.25"). */
function formatSignedPoints(points: number): string {
  return `${points > 0 ? '+' : ''}${points.toFixed(2).replace(/\.?0+$/, '')} pts`;
}
type Move = { text: string; cls: string; kind: MoveKind };

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
  const unreadable =
    reading === undefined ||
    reading.status === 'stale' ||
    reading.status === 'check-pending' ||
    reading.status === 'unavailable';
  const valueText =
    reading !== undefined && reading.value !== null
      ? formatIndicatorValue(leg.id, reading.value, numberLocale, copy.units)
      : null;
  // One plain state word: the leg's direction (B-04: the uniform method).
  const stateWord = leg.direction !== null ? t.direction[leg.direction] : null;
  // Fix spec B-04: context legs display but never gate — they say so quietly;
  // the debt leg is labelled as a debt-to-income level, not a servicing cost.
  const roleTag =
    leg.role === 'context'
      ? leg.caveat === 'debt-level'
        ? t.contextCaveat
        : t.contextLeg
      : null;
  return (
    <button
      type="button"
      onClick={(e) => onFocusCard(leg.id, e.currentTarget)}
      className="insights-focusable inline-flex min-h-[44px] cursor-pointer flex-col items-start gap-0 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-start transition-colors hover:border-currena-blue/50"
    >
      <span className="text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
        {shortName}
        {roleTag !== null ? (
          <span className="ms-1.5 rounded-full bg-currena-muted/15 px-1.5 py-0.5 text-[0.62rem] font-bold text-[var(--color-text-tertiary)]">
            {roleTag}
          </span>
        ) : null}
      </span>
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
  // disagree case names the concrete leg phrases. Fix spec B-04: the pending
  // state names the decision and what it waits for.
  const rightNowTemplate = copy.together.rightNowShort[reading.state];
  const rightNow =
    reading.state === 'disagree'
      ? interpolate(rightNowTemplate, { a: phrases[0] ?? '', b: phrases[1] ?? '' })
      : reading.state === 'pending' && reading.passThrough
        ? interpolate(copy.together.passThroughLine, {
            decided: reading.passThrough.decisionDate,
            policy: formatSignedPoints(reading.passThrough.decisionPoints),
            loan: formatSignedPoints(reading.passThrough.loanPoints),
          })
        : rightNowTemplate;

  // Owner follow-up (11 Oct): the pattern line must ALSO say what moves
  // and which way — one plain clause per leg. Colour carries DIRECTION
  // here by explicit owner instruction (green rises, red falls) — this
  // slot is the one sanctioned exception to "colour carries status":
  // motion verbs for the 30-day direction, state verbs for level-only
  // legs. Rendered for active/partly only; inactive/unknown stay quiet.
  // Round 32 (owner): each clause rides its own glyph (arrow/dash/dot)
  // inside a white chip on the focal field — see the render below.
  const moves: Move[] =
    reading.state === 'active' || reading.state === 'partly'
      ? reading.legs
          .map((leg): Move | null => {
            const name = entry.legs[leg.id as keyof typeof entry.legs] ?? leg.id;
            // B-04: the moves speak the leg's own direction (the uniform
            // method); context legs display but carry no motion claim.
            if (leg.role === 'context') return null;
            if (leg.direction === 'rising')
              return { text: interpolate(copy.together.moves.up, { name }), cls: 'text-[var(--color-status-normal)]', kind: 'up' };
            if (leg.direction === 'falling')
              return { text: interpolate(copy.together.moves.down, { name }), cls: 'text-[var(--color-status-alert)]', kind: 'down' };
            if (leg.direction === 'steady')
              return { text: interpolate(copy.together.moves.flat, { name }), cls: 'text-[var(--color-text-secondary)]', kind: 'flat' };
            return null;
          })
          .filter((m): m is Move => m !== null)
      : [];

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

      {/* R27: the one-clause right-now line. Round 32 (owner): "create a
       * container inside a container as the focal point for the verdicts
       * and estimations of these connections" — when the card HAS
       * estimations (active/partly), the right-now verdict and the move
       * chips share the app's FOCAL recipe (the money panel's / the
       * Estimation strip's): the card holds a brand-gold field, the field
       * holds white chips — the moves finally grab the eye. Quiet states
       * keep the plain one-line verdict.
       * Round 34 (owner, alignment rule): the field is anchored to the
       * card's BOTTOM (mt-auto) — the cards in a row stretch to equal
       * heights, so all three focal fields finish on the same baseline
       * instead of floating at whatever height the card's upper content
       * happens to end at. */}
      {moves.length > 0 ? (
        <div
          className="mt-auto flex flex-col gap-2 rounded-[var(--radius-lg)] bg-gradient-to-b from-[var(--color-accent-gold)]/[0.16] via-[var(--color-accent-gold)]/[0.07] to-transparent p-3 shadow-[0_10px_34px_rgba(168,126,28,0.15)] ring-2 ring-[var(--color-accent-gold)]/45 sm:p-3.5 dark:shadow-[0_14px_44px_rgba(0,0,0,0.45)]"
          data-connection-verdict
        >
          <p className="m-0 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]">
            {rightNow}
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" data-connection-moves>
            {moves.map((m) => (
              <li
                key={m.text}
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)] ${m.cls}`}
              >
                <MoveIcon kind={m.kind} />
                <span className="text-[length:var(--type-label)] font-bold leading-snug">{m.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="m-0 mt-auto text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]">
          {rightNow}
        </p>
      )}
    </article>
  );
}
