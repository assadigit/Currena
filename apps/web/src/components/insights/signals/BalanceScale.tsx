/**
 * signals/BalanceScale — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md, the v2 seesaw patch, the v3
 * revision, the v4 Iteration-2 directive and now the v5 WIREFRAME
 * directive, 2026-10-26: match the composition of the owner's reference
 * board docs/ui-reference/gold-silver-balance-target-wireframe.png).
 *
 * v5 keeps v4's abstract editorial mark (ONE tapered beam rotating on a
 * compact hub-and-keystone pivot with accent-coloured endpoint beads)
 * and re-arranges the composition to the reference board's hierarchy:
 *
 *   1. the heading «برآیند عوامل مؤثر بر قیمت طلا» and its subtitle;
 *   2. the TWO OPPOSING FACTOR GROUPS at the top — the supportive and
 *      adverse columns side by side (stacking below `sm`), each column
 *      headed by its side label, every factor a separate card row, each
 *      list progressive-disclosed past 3 rows ("+{n} more" / "Show
 *      fewer" — the site's attention-tile convention, reusing its copy
 *      keys and pill anatomy);
 *   3. the ABSTRACT BALANCE ILLUSTRATION centred BENEATH both groups —
 *      its endpoint beads sit exactly under the two columns' CENTRES
 *      (25% / 75% of the shared footprint), so each group visually
 *      weighs on its own beam end without anything attached to the
 *      beam;
 *   4. the COMPACT AGGREGATE ASSESSMENT directly under the illustration
 *      — verdict word + count line (+ the card's banner where needed)
 *      in one soft centred box, visually connected to the drawing;
 *   5. the shared detail panel and the Neutral / Couldn't read trays
 *      (the existing product's disclosure mechanism).
 *
 * The drawing (v4 rules 1–5, all kept by the wireframe directive):
 *   - ONE refined horizontal beam, slightly weighted (tapered 9u at the
 *     centre → 6u at the ends), rotating around a compact pivot.
 *   - A compact, geometrically precise central pivot: a 9u hub pinned
 *     with a surface-colour dot, its apex meeting a 13u keystone
 *     triangle — NOT a tall support column, NO base bar.
 *   - Subtle, clearly defined endpoints: an accent-coloured bead at
 *     each beam end — green for / red against, the only colour.
 *   - The dotted level reference through the pivot: the eye compares
 *     the tilted beam with level. It spans WIDER than the beam, per the
 *     reference board.
 *   - No hanging wires, no suspended bowls, no tall column, no
 *     decorative machinery, no unnecessary outlines — and NOTHING is
 *     ever attached to or positioned on the beam.
 *
 * The rules that survive verbatim from v3/v4 (the wireframe directive
 * repeats them):
 *   1. Carefully proportioned vector geometry with controlled stroke
 *      weights (beam body > hub 9u > endpoint beads 6.25u > reference
 *      1.5u dotted) and deliberate whitespace (the canvas reserves
 *      exactly the ±27u swing of the 12° max tilt on the 260u arm).
 *   2. No dashed empty rectangle: both sides always draw their complete
 *      structure; a side with no qualifying factors gets a concise,
 *      evidence-based line under its list heading, and when NOTHING
 *      could be read, both sides carry the unavailable line instead.
 *   3. No factor cards on the beam: the beam carries ONLY the aggregate
 *      weighted assessment (its tilt); the individual factors render in
 *      the organised columns ABOVE the drawing — the illustration's
 *      geometry never depends on the factor count and vice versa.
 *   4. Direction follows the model: the beam tilts ONLY for a valid,
 *      supported aggregate score (the verdict word 'for'/'against');
 *      balanced (net 0) and unavailable (nothing readable) verdicts
 *      render level — no directional implication. The ratio |net|/total
 *      still scales the angle, so unread drivers pull toward level.
 *   5. Fixed viewBox geometry: the SVG's height is a constant function
 *      of its width; any number of factors on either side cannot
 *      collide with, overlap or resize the illustration.
 *
 * Tilt arithmetic (v1 §6.3–4, kept verbatim by v2 §4, v3, v4 and v5): angle
 * = |net|/total × 12° floored at 4°; level at net 0 and at readable 0.
 * The arm length (Lh 260u = the column-centre span) is a DRAWING
 * decision — the model's angle is untouched.
 * RTL: the whole SVG mirrors with scaleX(-1) — it is pure geometry, so
 * the mirror relocates the `for` bead to the inline-end AND flips the
 * visual rotation sign in one move; the columns mirror via the grid's
 * direction-aware columns.
 *
 * Reusable by contract (spec §2.6): the component takes a list of
 * drivers and knows nothing about gold beyond the copy strings; the
 * merged card applies it to the gold driver list only.
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { formatNumber } from '@currena/core';
import type { SignalConditionState } from '@currena/insights';
import { interpolate } from '../../../i18n';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { DIRECTION_DOWN_URL, DIRECTION_UP_URL, IconImg } from '../../icons/currena';
import { ConditionIcon } from './icons';
import { VerdictIcon, verdictTone } from './verdict';

/** One balance driver — the spec's four states (§4). `neutral` (read,
 * no effect) and `unread` (could not be read) are DIFFERENT states. */
export type BalanceDriverState = 'for' | 'against' | 'neutral' | 'unread';

export interface BalanceDriver {
  /** Stable identity (the condition key) — drives the detail panel. */
  key: string;
  /** Short driver name ("Real yields"). */
  label: string;
  /** The driver's existing explanation sentence (opens in the detail
   * panel under the lists — v2 §5.5.6, every width). */
  detail: string;
  /** The current value(s), display-formatted, or null when unread. */
  valueText: string | null;
  state: BalanceDriverState;
}

/** The card's condition state → the balance's four states (§4). The
 * signal model already separates neutral from unknown — a 1:1 map. */
export function driverStateOf(state: SignalConditionState): BalanceDriverState {
  switch (state) {
    case 'supportive':
      return 'for';
    case 'against':
      return 'against';
    case 'neutral':
      return 'neutral';
    case 'unknown':
      return 'unread';
  }
}

export interface BalanceCounts {
  for: number;
  against: number;
  neutral: number;
  unread: number;
  /** total = every driver in the list (§4). */
  total: number;
  /** net = for − against (§4). */
  net: number;
  /** readable = for + against + neutral (§4). */
  readable: number;
}

export function balanceCounts(drivers: readonly BalanceDriver[]): BalanceCounts {
  const count = (state: BalanceDriverState): number => drivers.filter((d) => d.state === state).length;
  const f = count('for');
  const a = count('against');
  const n = count('neutral');
  const u = count('unread');
  return { for: f, against: a, neutral: n, unread: u, total: drivers.length, net: f - a, readable: f + a + n };
}

/** The tilt constants (v2 patch §5.1.5, kept by v3, v4 and v5 — the angle
 * formula is the owner's model and must not change: ratio × 12°, 4° floor). */
export const BALANCE_MAX_ANGLE_DEG = 12;
export const BALANCE_MIN_ANGLE_DEG = 4;

/** v5 progressive disclosure: the rows a factor column reveals before
 * its "+{n} more" pill — 3, the site's attention-tile convention. */
export const BALANCE_LIST_REVEAL = 3;

/* ------------------------------------------------------------------ *
 * v5 drawing metrics — everything lives in ONE fixed viewBox (SVG
 * user units); the SVG scales responsively, so the geometry never
 * depends on the rendered width, the factor count or the tilt.
 * The 520-wide canvas maps onto the SAME footprint the two factor
 * columns share, so x=130/x=390 (the bead centres) land exactly under
 * the columns' centres — the reference board's alignment.
 * ------------------------------------------------------------------ */
/** The SVG's logical canvas: a deliberately FLAT, editorial proportion
 * (520×88 — the structure is ~31u tall; the canvas reserves exactly the
 * ±33u swing of a 12° tilt on the 260u arm, ~11u clear each side). */
export const BALANCE_VIEWBOX_W = 520;
export const BALANCE_VIEWBOX_H = 88;
/** The pivot — the beam's rotation centre (x is the canvas centre; y
 * centres the swing so the max tilt clears the canvas by ~11u each
 * side). */
export const BALANCE_PIVOT_X = 260;
export const BALANCE_PIVOT_Y = 44;
/** The bead-to-bead distance: 260u = exactly the span between the two
 * factor columns' centres (25%/75% of the shared footprint, v5). The
 * tilt law's angle is unchanged — only the drawn arm is shorter. */
export const BALANCE_LH_VB = 260;
/** The endpoint bead x of each side (Lh ÷ 2 either side of the pivot). */
export const BALANCE_HINGE_FOR_X = BALANCE_PIVOT_X - BALANCE_LH_VB / 2;
export const BALANCE_HINGE_AGAINST_X = BALANCE_PIVOT_X + BALANCE_LH_VB / 2;
/** Each side's endpoint bead radius — the accent-coloured terminator at
 * its beam end. */
export const BALANCE_END_R_VB = 6.25;
/** The pivot hub's radius (the compact, geometrically precise pivot). */
export const BALANCE_HUB_R_VB = 9;

const radOf = (deg: number): number => (deg * Math.PI) / 180;

export interface BalanceTilt {
  /** The beam's rotation in degrees (LTR sign convention — the RTL
   * mirror flips the visual sign; the SVG never re-signs it). 0 = level. */
  angleDeg: number;
  /** The vertical move of ONE beam end off rest: (Lh ÷ 2) × sin(angle) —
   * the heavy end drops by this, the light one climbs by it. The two
   * endpoint pins therefore sit 2 × risePx apart = Lh × sin(angle). */
  risePx: number;
  /** The beam-end height difference: Lh × sin(angle) — the ONLY height
   * difference the picture may show. */
  endDropPx: number;
  /** Which side is heavy (null = level: net 0 or nothing readable). */
  heavy: 'for' | 'against' | null;
}

/**
 * The tilt rule (v1 §6 steps 3–4, kept verbatim by v2 §4, v3, v4 and
 * v5 rule 4): net 0 → level; nothing readable → level; otherwise angle =
 * |net|/total × MAX, floored at MIN so one driver still leans. `lhPx`
 * is the pin-to-pin distance in the drawing's units (0 → level).
 */
export function balanceTilt(counts: BalanceCounts, lhPx: number): BalanceTilt {
  if (counts.readable === 0 || counts.net === 0 || lhPx <= 0) {
    return { angleDeg: 0, risePx: 0, endDropPx: 0, heavy: null };
  }
  const ratio = Math.abs(counts.net) / counts.total;
  const angleDeg = Math.min(BALANCE_MAX_ANGLE_DEG, Math.max(BALANCE_MIN_ANGLE_DEG, ratio * BALANCE_MAX_ANGLE_DEG));
  const endDropPx = Math.sin(radOf(angleDeg)) * lhPx;
  return { angleDeg, risePx: endDropPx / 2, endDropPx, heavy: counts.net > 0 ? 'for' : 'against' };
}

export type BalanceVerdict = 'for' | 'balanced' | 'against' | 'none';

/** The verdict word (spec §5.1 + §13): nothing readable → "Can't read…";
 * otherwise the net's sign, "Balanced" at exactly zero. The beam tilts
 * ONLY when this verdict is directional (v3/v4/v5 rule 4). */
export function balanceVerdictOf(counts: BalanceCounts): BalanceVerdict {
  if (counts.readable === 0) return 'none';
  if (counts.net > 0) return 'for';
  if (counts.net < 0) return 'against';
  return 'balanced';
}

/** The count line's non-zero parts (spec §13): "{n} for · {n} against ·
 * {n} neutral · {n} couldn't be read", zero parts omitted. */
export function countLineParts(counts: BalanceCounts, copy: InsightsCopy, numberLocale: 'en-US' | 'fa-IR'): string[] {
  const n = (value: number): string => formatNumber(value, numberLocale, { maximumFractionDigits: 0 });
  const b = copy.signals.balance;
  const parts: Array<[number, string]> = [
    [counts.for, interpolate(b.countFor, { n: n(counts.for) })],
    [counts.against, interpolate(b.countAgainst, { n: n(counts.against) })],
    [counts.neutral, interpolate(b.countNeutral, { n: n(counts.neutral) })],
    [counts.unread, interpolate(b.countUnread, { n: n(counts.unread) })],
  ];
  return parts.filter(([count]) => count > 0).map(([, text]) => text);
}

/** The tilt animation (v1 §6.7, kept by v2 §5.9, v3, v4 and v5): ~500 ms ease
 * on the beam rotation, disabled for prefers-reduced-motion users (the
 * repo's standard pair — the same Tailwind class the collapsible
 * chevrons use, applied to the SVG group). */
const TILT_TRANSITION_CLASS = 'transition-transform duration-500 ease-out motion-reduce:transition-none';
const TILT_TRANSFORM_ORIGIN_STYLE = { transformBox: 'view-box', transformOrigin: `${BALANCE_PIVOT_X}px ${BALANCE_PIVOT_Y}px` } as const;

/** The beam's tapered body (v4/v5 rule 1: a refined, slightly weighted
 * horizontal beam — 9u tall at the centre, 6u at the ends, spanning
 * exactly bead-to-bead). One filled path, no stroke, no outline: the
 * drawing's heaviest mark. */
const BEAM_BODY_PATH =
  'M 130 41 C 185 40.3 230 39.5 260 39.5 C 290 39.5 335 40.3 390 41 L 390 47 C 335 47.7 290 48.5 260 48.5 C 230 48.5 185 47.7 130 47 Z';
/** The compact pivot's keystone: a 13u equilateral-ish triangle whose
 * apex meets the hub's underside (v4/v5: NOT a support column, NO base
 * bar — the flat triangle base is the ground, the dotted reference is
 * the level). */
const PIVOT_MOUNT_PATH = 'M 260 53 L 274 66 L 246 66 Z';

export function BalanceScale({
  drivers,
  copy,
  numberLocale,
  banner,
}: {
  drivers: readonly BalanceDriver[];
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
  /** The card's existing verdict banner sentence (spec §5.2 — kept
   * unchanged, rendered inside the aggregate assessment box). */
  banner?: ReactNode;
}): React.JSX.Element | null {
  const b = copy.signals.balance;
  const rtl = numberLocale === 'fa-IR';
  const [openKey, setOpenKey] = useState<string | null>(null);
  /** Which factor columns are fully revealed (v5 progressive
   * disclosure — one independent toggle per side). */
  const [openLists, setOpenLists] = useState<{ for: boolean; against: boolean }>({ for: false, against: false });

  if (drivers.length === 0) return null;

  const counts = balanceCounts(drivers);
  const verdict = balanceVerdictOf(counts);

  const forBlocks = drivers.filter((d) => d.state === 'for');
  const againstBlocks = drivers.filter((d) => d.state === 'against');
  const neutralChips = drivers.filter((d) => d.state === 'neutral');
  const unreadChips = drivers.filter((d) => d.state === 'unread');

  /* The tilt, from the fixed viewBox Lh (v5 rule 5: the geometry never
   * depends on anything measured at runtime). */
  const tilt = balanceTilt(counts, BALANCE_LH_VB);
  /* CSS rotation, LTR-signed: negative = counter-clockwise = the
   * inline-start (for) end down. The RTL SVG mirror (scaleX(-1)) flips
   * the VISUAL sign, so the code must NOT re-sign it — the mirrored
   * render keeps the heavier end down in both directions (v1 §6.6). */
  const ltrSign = tilt.heavy === 'for' ? -1 : 1;
  const rotateDeg = tilt.angleDeg === 0 ? 0 : ltrSign * tilt.angleDeg;

  const verdictWord =
    verdict === 'for'
      ? b.verdictFor
      : verdict === 'against'
        ? b.verdictAgainst
        : verdict === 'balanced'
          ? b.verdictBalanced
          : b.verdictNone;
  const verdictToneClass =
    verdict === 'for'
      ? verdictTone.bullish
      : verdict === 'against'
        ? verdictTone.bearish
        : 'text-[var(--color-status-stale)]';
  const verdictIcon = verdict === 'for' ? 'bullish' : verdict === 'against' ? 'bearish' : null;

  const parts = countLineParts(counts, copy, numberLocale);
  const ariaLabel = interpolate(b.aria, { summary: parts.join(' · '), verdict: verdictWord });

  const toggle = (key: string): void => setOpenKey((prev) => (prev === key ? null : key));
  const openDriver = drivers.find((d) => d.key === openKey) ?? null;

  /** One compact factor row (v2 §5.5, the v3/v4/v5 LIST item): icon ~20px +
   * the short name + the current value, 56px tall, NO sentence at any
   * width — a real button whose tap opens the shared detail panel. */
  const block = (d: BalanceDriver, side: 'for' | 'against'): React.JSX.Element => (
    <button
      key={d.key}
      type="button"
      aria-expanded={openKey === d.key}
      aria-controls="gold-balance-detail"
      onClick={() => toggle(d.key)}
      data-balance-block={d.key}
      className="insights-focusable flex h-[56px] w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-2.5 py-1 text-start ring-1 ring-[var(--color-border)]"
    >
      <IconImg src={side === 'for' ? DIRECTION_UP_URL : DIRECTION_DOWN_URL} size={20} className="shrink-0" />
      <span className="flex min-w-0 flex-col justify-center">
        <span className="text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
          {d.label}
        </span>
        {d.valueText !== null ? (
          <bdi
            dir="ltr"
            className="text-[length:var(--type-label)] font-semibold leading-tight tabular-nums text-[var(--color-text-secondary)]"
          >
            {d.valueText}
          </bdi>
        ) : null}
      </span>
    </button>
  );

  /** The empty-side line (v4/v5 rule 2 + the Iteration-2 §5 semantics —
   * the cases stay distinct): when the evaluation ran, the side with no
   * qualifying factors carries the evidence-based line; when NOTHING
   * could be read (readable 0), both sides carry the unavailable line
   * instead — an absence of readings is never worded as an absence of
   * pressure, and never as a prediction. */
  const emptyLineOf = (side: 'for' | 'against'): string =>
    counts.readable === 0 ? b.listEmptyNone : side === 'for' ? b.listEmptyFor : b.listEmptyAgainst;

  /** One side's factor column (v5: ABOVE the drawing, per the reference
   * board): the caption heading with its side icon and side colour, the
   * factor rows beneath it — the first BALANCE_LIST_REVEAL rows before
   * the "+{n} more" pill (the site's attention-tile convention, its own
   * copy keys and pill anatomy, aria-expanded + aria-controls) — and,
   * when the side has no qualifying factors, the concise empty line in
   * place of any placeholder. The two columns sit side by side from
   * `sm:` up and stack on the narrowest screens so the long side labels
   * never wrap mid-word. */
  const listColumn = (side: 'for' | 'against', blocks: readonly BalanceDriver[]): React.JSX.Element => {
    const expanded = openLists[side];
    const rows = expanded ? blocks : blocks.slice(0, BALANCE_LIST_REVEAL);
    const hidden = blocks.length - rows.length;
    /** The column's progressive-disclosure pill (v5): "+{n} more"
     * collapsed, "Show fewer" expanded — the attention-tile pill's own
     * copy keys and anatomy. `expandedState` is the list's CURRENT
     * state; the click toggles it. */
    const disclose = (expandedState: boolean): React.JSX.Element => (
      <button
        type="button"
        onClick={() => setOpenLists((prev) => ({ ...prev, [side]: !expandedState }))}
        aria-expanded={expandedState ? 'true' : 'false'}
        aria-controls={`gold-balance-list-${side}`}
        data-balance-fewer={expandedState ? side : undefined}
        data-balance-more={expandedState ? undefined : side}
        className="insights-focusable mt-1 inline-flex min-h-[24px] cursor-pointer items-center self-start rounded-full bg-currena-muted/15 px-2.5 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-currena-muted/25"
      >
        {expandedState
          ? copy.ui.showFewer
          : interpolate(copy.ui.attentionTileMore, {
              n: formatNumber(hidden, numberLocale, { maximumFractionDigits: 0 }),
            })}
      </button>
    );
    return (
      <div className="flex min-w-0 flex-col gap-1.5" data-balance-list={side} id={`gold-balance-list-${side}`}>
        <h4
          data-balance-caption={side}
          className={`m-0 inline-flex items-center gap-1.5 text-[length:var(--type-label)] font-bold ${
            side === 'for' ? 'text-[var(--color-status-normal)]' : 'text-[var(--color-status-alert)]'
          }`}
        >
          <IconImg src={side === 'for' ? DIRECTION_UP_URL : DIRECTION_DOWN_URL} size={16} className="shrink-0" />
          {side === 'for' ? b.sideFor : b.sideAgainst}
        </h4>
        {blocks.length > 0 ? (
          <span className="flex min-w-0 flex-col gap-1.5">
            {rows.map((d) => block(d, side))}
            {hidden > 0 ? disclose(false) : null}
            {expanded && blocks.length > BALANCE_LIST_REVEAL ? disclose(true) : null}
          </span>
        ) : (
          <p
            data-balance-empty={side}
            className="m-0 rounded-[var(--radius-sm)] bg-currena-soft/60 px-2.5 py-2.5 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-secondary)]"
          >
            {emptyLineOf(side)}
          </p>
        )}
      </div>
    );
  };

  /** One side's endpoint (v4/v5 rule 1): the accent-coloured bead that
   * terminates its beam end — the side's marker in the drawing, rigidly
   * part of the rotating beam group. It is a symbolic endpoint, never a
   * carrier for factor rows, and the ONLY colour in the illustration. */
  const endPoint = (side: 'for' | 'against'): React.JSX.Element => {
    const beadX = side === 'for' ? BALANCE_HINGE_FOR_X : BALANCE_HINGE_AGAINST_X;
    return (
      <circle
        data-balance-end={side}
        cx={beadX}
        cy={BALANCE_PIVOT_Y}
        r={BALANCE_END_R_VB}
        fill={side === 'for' ? 'var(--color-status-normal)' : 'var(--color-status-alert)'}
      />
    );
  };

  return (
    <div className="flex flex-col gap-3" data-balance>
      {/* 1. THE HEADING + SUBTITLE: the concept's own name — «برآیند
       * عوامل مؤثر بر قیمت طلا» — clearly more prominent than its
       * explanatory subtitle (the site's card-question voice at 15/600
       * over the caption voice in the secondary ink). */}
      <div className="flex flex-col gap-1" data-balance-heading>
        <h4 data-balance-title className="type-question m-0 text-[var(--color-text-primary)]">
          {b.heading}
        </h4>
        <p
          data-balance-subtitle
          className="m-0 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-secondary)]"
        >
          {b.subtitle}
        </p>
      </div>

      {/* 2. THE TWO OPPOSING FACTOR GROUPS (v5: ABOVE the drawing, per
       * the reference board): one column per side, caption-headed,
       * growing downward, progressive-disclosed past 3 rows. The grid
       * shares the drawing's own max-w-[640px] footprint so each column
       * sits over ITS side's beam bead (x=25%/75% of the footprint); it
       * mirrors with the document direction, and on the narrowest
       * screens the columns stack so the long side labels stay on one
       * line. DOM order (for → against) is the tab order (§12.4). */}
      <div className="mx-auto grid w-full max-w-[640px] grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3" data-balance-lists>
        {listColumn('for', forBlocks)}
        {listColumn('against', againstBlocks)}
      </div>

      {/* 3. THE BALANCE ZONE (v4/v5 rules 1 + 5): ONE inline SVG in the
       * abstract editorial mark's flat proportion (520×88), sharing the
       * columns' max-w-[640px] footprint and centred beneath both
       * groups — its endpoint beads sit exactly under the two columns'
       * centres. Its height is a fixed function of its width — no
       * factor count, no tilt and no runtime measurement can change it.
       * The role="img" layer carries the result as its label (§12.1);
       * the interactive factor rows live ABOVE it as list items —
       * role="img" children are presentational and the rows must stay
       * real buttons (§7.4). The illustration is pure geometry, so RTL
       * mirrors the whole SVG with scaleX(-1): the `for` bead lands on
       * the inline-end side AND the visual rotation sign flips in the
       * same transform. */}
      <div data-balance-zone className="mx-auto w-full max-w-[640px]">
        <div
          role="img"
          aria-label={ariaLabel}
          data-balance-graphic
          className="block w-full text-[var(--color-text-secondary)]"
        >
          <svg
            viewBox={`0 0 ${BALANCE_VIEWBOX_W} ${BALANCE_VIEWBOX_H}`}
            className="block h-auto w-full"
            style={rtl ? { transform: 'scaleX(-1)' } : undefined}
            aria-hidden="true"
            focusable="false"
          >
            {/* The dotted level reference through the pivot (v2 §5.3,
             * kept; v5: it spans WIDER than the beam, per the reference
             * board): behind everything — the eye compares the tilted
             * beam with level, so a small lean stays honest. */}
            <line
              data-balance-reference
              x1={44}
              y1={BALANCE_PIVOT_Y}
              x2={BALANCE_VIEWBOX_W - 44}
              y2={BALANCE_PIVOT_Y}
              stroke="var(--color-border)"
              strokeWidth={1.5}
              strokeDasharray="1 6"
              strokeLinecap="round"
            />
            {/* The rotating assembly: the tapered beam body plus both
             * accent-coloured endpoint beads — ONE rigid group rotating
             * around the pivot (v4/v5: no pans, no chains, no platforms,
             * nothing translates separately). */}
            <g
              data-balance-beam
              className={TILT_TRANSITION_CLASS}
              style={{
                transform: `rotate(${rotateDeg}deg)`,
                ...TILT_TRANSFORM_ORIGIN_STYLE,
              }}
            >
              <path data-balance-beam-body d={BEAM_BODY_PATH} fill="currentColor" />
              {endPoint('for')}
              {endPoint('against')}
            </g>
            {/* The compact pivot's keystone triangle, fixed (never
             * rotates — v2 §5.2.4's rule, a 13u apex-to-base triangle:
             * geometrically precise, deliberately NOT a support column,
             * and no base bar — the flat base is the ground). Drawn
             * after the beam so the apex reads as one assembly with the
             * hub. */}
            <g data-balance-fulcrum fill="currentColor">
              <path d={PIVOT_MOUNT_PATH} />
            </g>
            {/* The hub caps the beam's centre — the machined pivot with
             * a pin dot in the card's surface colour. */}
            <circle data-balance-pivot cx={BALANCE_PIVOT_X} cy={BALANCE_PIVOT_Y} r={BALANCE_HUB_R_VB} fill="currentColor" />
            <circle cx={BALANCE_PIVOT_X} cy={BALANCE_PIVOT_Y} r={3.5} fill="var(--color-surface)" />
          </svg>
        </div>
      </div>

      {/* 4. THE AGGREGATE ASSESSMENT (the reference board's conclusion
       * box): the verdict word with its icon in the question voice (the
       * box's focal line), the count line directly under it (≥14px in the
       * secondary ink — colour never rides alone, §12.2: the icon and the
       * word carry the meaning) and the card's banner sentence where
       * needed — ONE compact, centred, soft box directly beneath the
       * drawing, visually connected to it. */}
      <div
        className="mx-auto flex w-full max-w-[440px] flex-col items-center gap-1 rounded-[var(--radius-lg)] bg-currena-soft/60 px-4 py-3 text-center"
        data-balance-verdict={verdict}
      >
        <span className={`inline-flex items-center gap-1.5 ${verdictToneClass}`}>
          <VerdictIcon verdict={verdictIcon} size={20} desktopSize={24} />
          <span className="type-question font-bold leading-tight">{verdictWord}</span>
        </span>
        {parts.length > 0 ? (
          <span
            className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]"
            data-balance-count
          >
            {parts.join(' · ')}
          </span>
        ) : null}
        {banner}
      </div>

      {/* The shared detail panel (v2 §5.5.6 — every width): one open
       * panel at a time, tap again to close. It always exists in the DOM
       * (so every aria-controls is valid) and stays hidden until a row
       * or a tray chip (§8.4) opens it. */}
      <div
        id="gold-balance-detail"
        data-balance-detail={openDriver !== null ? openDriver.key : undefined}
        hidden={openDriver === null}
        className="rounded-[var(--radius-sm)] bg-currena-soft/60 px-3 py-2 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]"
      >
        {openDriver !== null ? (
          <>
            <span className="font-bold text-[var(--color-text-primary)]">{openDriver.label}: </span>
            {openDriver.detail}
          </>
        ) : null}
      </div>

      {/* 5. THE TRAYS (§5.4 + §8) — neutral (quiet) and unread (dashed +
       * the existing clock icon) are DIFFERENT states and never were on
       * the beam. Empty trays hide (§8.5). */}
      {neutralChips.length > 0 ? (
        <div className="flex flex-col gap-1.5" data-balance-tray="neutral">
          <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">
            {b.trayNeutral}
          </h4>
          <span className="flex flex-wrap gap-1.5">
            {neutralChips.map((d) => (
              <button
                key={d.key}
                type="button"
                aria-expanded={openKey === d.key}
                aria-controls="gold-balance-detail"
                onClick={() => toggle(d.key)}
                data-balance-chip={d.key}
                className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full px-3 py-2 text-[length:var(--type-label)] font-semibold text-[var(--color-status-stale)] ring-1 ring-[var(--color-border)]"
              >
                <ConditionIcon state="neutral" />
                {d.label}
              </button>
            ))}
          </span>
        </div>
      ) : null}
      {unreadChips.length > 0 ? (
        <div className="flex flex-col gap-1.5" data-balance-tray="unread">
          <h4 className="m-0 text-[length:var(--type-label)] font-bold text-[var(--color-text-tertiary)]">
            {b.trayUnread}
          </h4>
          <span className="flex flex-wrap gap-1.5">
            {unreadChips.map((d) => (
              <button
                key={d.key}
                type="button"
                aria-expanded={openKey === d.key}
                aria-controls="gold-balance-detail"
                onClick={() => toggle(d.key)}
                data-balance-chip={d.key}
                className="insights-focusable inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[var(--color-border)] px-3 py-2 text-[length:var(--type-label)] font-semibold text-[var(--color-status-stale)]"
              >
                <ConditionIcon state="unknown" />
                {d.label}
              </button>
            ))}
          </span>
        </div>
      ) : null}
    </div>
  );
}
