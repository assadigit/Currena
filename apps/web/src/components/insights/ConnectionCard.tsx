/**
 * ConnectionCard — v3 UI_SPEC §8 (UI-33..UI-38, task PH6-B, 2026-10-20).
 *
 * The v2 anatomy (state chip "Showing/Partly showing/Not showing" + a
 * one-clause right-now verdict) is RETIRED from display — the internal
 * state ids stay. The v3 card answers with structure instead of a verdict:
 *
 *   title (+ the "weaker link" tag where the engine documents one, UI-38)
 *   the legs in a row — name, value WITH UNIT, direction arrow, the window
 *   the direction was measured over ("30 days", UI-33) — and each leg's
 *   marker: matches / differs / can't tell, icon + word, never colour alone
 *   (UI-34, from the engine's leg.marker)
 *   "Usual tendency: {relation}" — the owner-approved tendency sentence,
 *   now prefixed so it says what it is (UI-33)
 *   the NEUTRAL summary line that replaces the verdict chip (UI-33/35/37):
 *   "{n} of {m} readings match the usual pattern" when the trigger moved
 *   and every scored leg is readable · "Trigger not present" when it did
 *   not · "Pass-through pending" plus the decided-date line on the RBA
 *   card · "Not enough fresh data to read" when a leg cannot be read.
 *
 * Round 32's focal field (the owner's gold-field recipe) keeps the move
 * chips with their direction colour — the page's one sanctioned
 * direction-colour exception (green rises, red falls).
 *
 * The "Evidence: to verify" tag never renders (R27 — the section-level
 * quiet note replaces it); the tag stays in the data attributes only.
 * The windows each leg is judged over sit behind a details control (UI-36,
 * read from the CONNECTIONS registry the engine itself exports).
 */

import type { CSSProperties } from 'react';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatDateWords, formatNumber } from '@currena/core';
import { CONNECTIONS, type ConnectionReading, type LegEval } from '@currena/insights';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { connectionSummaryInfo, formatChange, formatIndicatorValue } from './config';

type MoveKind = 'up' | 'down' | 'flat' | 'level';

/** The direction glyph beside a leg's value — shape carries the direction,
 * the word beside it carries the meaning (never colour alone); the
 * green/red direction exception lives on the MOVE chips below. */
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

/** UI-34 marker glyphs — the signals card's step-line family (a rising
 * step reads "in line with the pattern", a falling step "against it", the
 * clock face "nothing to tell"). No check or cross glyphs (R26's rule,
 * kept in spirit here): icon + word, never colour alone. */
function MarkerIcon({ marker }: { marker: NonNullable<LegEval['marker']> }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };
  switch (marker) {
    case 'matches':
      return (
        <svg {...common}>
          <path d="M2.5 11.5l4-4 2.5 2.5 4.5-5" />
        </svg>
      );
    case 'does-not-match':
      return (
        <svg {...common}>
          <path d="M2.5 6.5l4 4 2.5-2.5 4.5 5" />
        </svg>
      );
    case 'can-tell':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 4.6V8l2.4 1.6" />
        </svg>
      );
  }
}

/** The marker's ink + word (UI-34) — colour is never alone: the icon shape
 * and the word carry the meaning, the ink follows the page's chip inks. */
const MARKER_CLASS: Record<NonNullable<LegEval['marker']>, string> = {
  matches: 'text-[var(--color-chip-ink-normal)]',
  'does-not-match': 'text-[var(--color-chip-ink-attention)]',
  'can-tell': 'text-[var(--color-chip-ink-muted)]',
};

function LegMarker({ marker, copy }: { marker: NonNullable<LegEval['marker']>; copy: InsightsCopy }) {
  const t = copy.together;
  const word =
    marker === 'matches' ? t.markerMatches : marker === 'does-not-match' ? t.markerDiffers : t.markerCantTell;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 text-[0.68rem] font-bold leading-none ${MARKER_CLASS[marker]}`}
      // The short word plus its full phrase for hover + assistive tech
      // (UI-34 gives the long form for the "matches" family).
      title={marker === 'matches' ? t.markerMatchesLong : undefined}
    >
      <MarkerIcon marker={marker} />
      {word}
    </span>
  );
}

/** One leg STAT CHIP (UI-33): short name, live value WITH UNIT, direction
 * arrow, the window the direction was measured over — plus the leg's
 * matches/differs/can't-tell marker (UI-34). Opens the details panel. */
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
  const valueText =
    reading !== undefined && reading.value !== null
      ? formatIndicatorValue(leg.id, reading.value, numberLocale, copy.units)
      : null;
  // One plain state word: the leg's direction (B-04: the uniform method).
  const stateWord = leg.direction !== null ? t.direction[leg.direction] : null;
  const arrowKind: MoveKind | null =
    leg.direction === 'rising' ? 'up' : leg.direction === 'falling' ? 'down' : leg.direction === 'steady' ? 'flat' : null;
  // UI-33: the window label — the leg's own measuring window ("30 days").
  const windowWord =
    leg.moveWindow !== null
      ? interpolate(t.windowDays, {
          days: formatNumber(leg.moveWindow, numberLocale, { maximumFractionDigits: 0 }),
        })
      : null;
  // Fix spec B-04: context legs display but never gate — they say so quietly;
  // the debt leg is labelled as a debt-to-income level, not a servicing cost.
  const roleTag =
    leg.role === 'context' ? (leg.caveat === 'debt-level' ? t.contextCaveat : t.contextLeg) : null;
  const marker = leg.marker ?? 'can-tell';
  return (
    <button
      type="button"
      onClick={(e) => onFocusCard(leg.id, e.currentTarget)}
      className="insights-focusable inline-flex min-h-[44px] cursor-pointer flex-col items-start gap-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-start transition-colors hover:border-currena-blue/50"
    >
      <span className="flex w-full flex-wrap items-baseline justify-between gap-x-2">
        <span className="text-[length:var(--type-caption)] font-bold text-[var(--color-text-primary)]">
          {shortName}
          {roleTag !== null ? (
            <span className="ms-1.5 rounded-full bg-currena-muted/15 px-1.5 py-0.5 text-[0.62rem] font-bold text-[var(--color-text-tertiary)]">
              {roleTag}
            </span>
          ) : null}
        </span>
        {/* UI-34: the per-leg marker — icon + word, never colour alone. */}
        <LegMarker marker={marker} copy={copy} />
      </span>
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        {valueText !== null ? (
          <bdi dir="ltr" className="type-number font-semibold tabular-nums text-[var(--color-text-primary)]">
            {valueText}
          </bdi>
        ) : (
          <span className="text-[length:var(--type-caption)]">{copy.ui.na}</span>
        )}
        {arrowKind !== null ? (
          <span className="inline-flex items-center text-[var(--color-text-secondary)]">
            <MoveIcon kind={arrowKind} />
          </span>
        ) : null}
        {stateWord !== null ? (
          <span className="text-[length:var(--type-caption)] font-bold text-[var(--color-text-secondary)]">
            {stateWord}
          </span>
        ) : null}
        {windowWord !== null ? (
          <span className="text-[0.68rem] text-[var(--color-text-tertiary)]">{windowWord}</span>
        ) : null}
      </span>
      <span className="sr-only">, {t.viewLegCard}</span>
    </button>
  );
}

type Move = { text: string; cls: string; kind: MoveKind };

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
  const t = copy.together;
  const entry = copy.together.connections[reading.connection];
  const byId = new Map(readings.map((r) => [r.id as string, r]));

  // UI-38: the weaker-link tag + its one documented why line — only the
  // copper/gold to China card carries it (the engine removed its US
  // money-supply leg because the link is documented as weak).
  const weakerLink = reading.connection === 'copper-china-growth';

  // Owner follow-up (11 Oct): the pattern line must ALSO say what moves
  // and which way — one plain clause per leg. Colour carries DIRECTION
  // here by explicit owner instruction (green rises, red falls) — this
  // slot is the one sanctioned exception to "colour carries status":
  // motion verbs for the 30-day direction. Rendered for active/partly
  // only; inactive/unknown stay quiet. Round 32 (owner): each clause rides
  // its own glyph (arrow/dash/dot) inside a white chip on the focal field.
  const moves: Move[] =
    reading.state === 'active' || reading.state === 'partly'
      ? reading.legs
          .map((leg): Move | null => {
            const name = entry.legs[leg.id as keyof typeof entry.legs] ?? leg.id;
            // B-04: the moves speak the leg's own direction (the uniform
            // method); context legs display but carry no motion claim.
            if (leg.role === 'context') return null;
            if (leg.direction === 'rising')
              return { text: interpolate(t.moves.up, { name }), cls: 'text-[var(--color-status-normal)]', kind: 'up' };
            if (leg.direction === 'falling')
              return { text: interpolate(t.moves.down, { name }), cls: 'text-[var(--color-status-alert)]', kind: 'down' };
            if (leg.direction === 'steady')
              return { text: interpolate(t.moves.flat, { name }), cls: 'text-[var(--color-text-secondary)]', kind: 'flat' };
            return null;
          })
          .filter((m): m is Move => m !== null)
      : [];

  // UI-33/35/37: the NEUTRAL summary line — one pure selector (config/
  // signals.ts) drives this face line and the collapsed chips alike.
  const info = connectionSummaryInfo(reading);
  const fmtInt = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });
  let summaryLine: string;
  let pendingDates: string | null = null;
  switch (info.kind) {
    case 'match':
      summaryLine = interpolate(t.matchSummary, { match: fmtInt(info.matchCount ?? 0), moved: fmtInt(info.movedCount ?? 0) });
      break;
    case 'trigger-absent':
      summaryLine = t.triggerAbsentLine;
      break;
    case 'not-enough':
      summaryLine = t.notEnoughLine;
      break;
    case 'pending': {
      summaryLine = t.state.pending;
      // UI-37: the decided-date line — the cash reading's own lastChange
      // carries the decision; the loan data has not arrived yet.
      const cash = byId.get('rba-cash-rate');
      if (cash?.lastChange !== undefined) {
        pendingDates = interpolate(t.passThroughPendingDates, {
          decided: formatDateWords(cash.lastChange.date, numberLocale),
          policy: formatChange(cash.lastChange.points, 'points', numberLocale, copy.units),
        });
      }
      break;
    }
    default: {
      // 'pass-through': the RBA card in its active/inactive states carries
      // no engine summary — its numbers line IS the summary (decided +
      // loan change since the decision, both dated).
      if (reading.passThrough !== undefined) {
        summaryLine = interpolate(t.passThroughLine, {
          decided: formatDateWords(reading.passThrough.decisionDate, numberLocale),
          policy: formatChange(reading.passThrough.decisionPoints, 'points', numberLocale, copy.units),
          loan: formatChange(reading.passThrough.loanPoints, 'points', numberLocale, copy.units),
        });
      } else {
        summaryLine = t.state[reading.state];
      }
      break;
    }
  }

  // UI-36: the windows each leg is judged over, from the CONNECTIONS
  // registry the engine itself exports ("oil: 30 or 90 days · …").
  const def = CONNECTIONS.find((d) => d.id === reading.connection);
  const windowsLine =
    def !== undefined
      ? def.legs
          .map((rule) => {
            const name = entry.legs[rule.id as keyof typeof entry.legs] ?? rule.id;
            const daysList = [...new Set(rule.windows.map((w) => w.days))]
              .map((days) => fmtInt(days))
              .join(` ${t.orWord} `);
            return `${name}: ${interpolate(t.windowDays, { days: daysList })}`;
          })
          .join(numberLocale === 'fa-IR' ? '، ' : ' · ')
      : null;

  return (
    <article
      data-connection={reading.connection}
      data-connection-state={reading.state}
      // R27: the evidence tag stays in the DATA, never on the face.
      data-evidence="to-verify"
      className={`flex flex-col gap-2.5 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-4 ring-1 ring-[var(--color-border)] ${autoFocus ? 'motion-safe:animate-pulse ring-currena-blue/50' : ''}`}
    >
      {/* UI-33: the title; the verdict chip is GONE — the neutral summary
       * line below carries the state. UI-38: the weaker-link tag rides the
       * header where the engine documents the weakness. */}
      <header className="flex flex-wrap items-center gap-2">
        <h3 className="type-question m-0 text-[var(--color-text-primary)]">{entry.name}</h3>
        {weakerLink ? (
          <span className="inline-flex shrink-0 items-center rounded-full bg-currena-muted/15 px-2 py-0.5 text-[0.72rem] font-bold text-[var(--color-text-tertiary)]">
            {t.weakerLink}
          </span>
        ) : null}
      </header>

      {/* The legs as STAT CHIPS in one wrapping row with equal heights —
       * name, value with unit, direction arrow, window label, marker. */}
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

      {/* UI-33: "Usual tendency: {relation}" — the owner-approved sentence,
       * prefixed so its role is explicit (tendencies only, per RULES §5). */}
      <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        <span className="font-bold text-[var(--color-text-primary)]">{t.usualTendency}</span>{' '}
        {entry.relation}
      </p>

      {/* UI-38: the weaker-link why line — the one documented weakness,
       * stated once, plainly. */}
      {weakerLink ? (
        <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-tertiary)]" data-weaker-link-why>
          {t.weakerLinkWhy}
        </p>
      ) : null}

      {/* UI-33/35/37: the NEUTRAL summary line (replaces the verdict chip).
       * Round 34 (owner, alignment rule): the last block anchors to the
       * card's BOTTOM so equal-height rows finish on one baseline. */}
      <div className={`flex flex-col gap-1 ${moves.length === 0 ? 'mt-auto' : ''}`} data-connection-summary>
        <p className="m-0 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)]">
          {summaryLine}
        </p>
        {pendingDates !== null ? (
          <p className="m-0 text-[length:var(--type-caption)] text-[var(--color-text-secondary)]" data-connection-pending-dates>
            {pendingDates}
          </p>
        ) : null}
      </div>

      {/* Round 32 (owner): the FOCAL field with the move chips — the
       * page's one sanctioned direction-colour exception (green rises,
       * red falls); the verdict sentence that used to live here is the
       * neutral summary line above. */}
      {moves.length > 0 ? (
        <div
          className="mt-auto flex flex-col gap-2 rounded-[var(--radius-lg)] bg-gradient-to-b from-[var(--color-accent-gold)]/[0.16] via-[var(--color-accent-gold)]/[0.07] to-transparent p-3 shadow-[0_10px_34px_rgba(168,126,28,0.15)] ring-2 ring-[var(--color-accent-gold)]/45 sm:p-3.5 dark:shadow-[0_14px_44px_rgba(0,0,0,0.45)]"
          data-connection-verdict
        >
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
      ) : null}

      {/* UI-36: the windows used per leg, behind a details control (the
       * thresholds live in the CONNECTIONS registry the engine exports). */}
      {windowsLine !== null ? (
        <details className="text-[length:var(--type-caption)]">
          <summary className="insights-focusable inline-flex min-h-[24px] cursor-pointer items-center rounded-full px-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-border)] underline-offset-4 transition-colors hover:decoration-[var(--color-status-context)]">
            {t.windowsUsed}
          </summary>
          <p className="m-0 mt-1 ps-1 text-[var(--color-text-tertiary)]" data-connection-windows>
            {windowsLine}
          </p>
        </details>
      ) : null}
    </article>
  );
}
