/**
 * signals/BalanceScale — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md, the v2 seesaw patch
 * docs/insights/gold-balance-card-v2-seesaw-patch-spec.md, and the v3
 * revision (owner directive 2026-10-18d, this file's git history): the
 * drawing is now a CLASSIC HANGING-PAN BALANCE drawn as one inline SVG,
 * the factor cards live OFF the beam in lists beneath their sides, and
 * an empty side is communicated in prose under that side — never as a
 * dashed placeholder on the illustration.
 *
 * v3 rules (owner directive, verbatim mapping):
 *   1. Sophisticated, carefully proportioned vector geometry — a
 *      machined pedestal (two-step plinth + tapered pillar), a pinned
 *      pivot, a subtly tapered beam with rounded end knuckles, splayed
 *      chains and shallow pan dishes; varied stroke weights (beam is a
 *      filled body, chains 2u, pan rim 3u) and deliberate whitespace
 *      (≥80u between every pan and the pillar, ≥20u page margins).
 *   2. No dashed empty rectangle: both sides always draw their complete
 *      structure (chains + pan); a side with no qualifying factors gets
 *      a concise, evidence-based empty line under its list heading.
 *   3. No factor cards on the beam: the beam carries ONLY the aggregate
 *      weighted assessment (its tilt); the individual factors render in
 *      organised lists beneath their supportive/adverse sides, growing
 *      downward — the illustration's geometry never depends on the
 *      factor count and vice versa.
 *   4. Direction follows the model: the beam tilts ONLY for a valid,
 *      supported aggregate score (the verdict word 'for'/'against');
 *      balanced (net 0) and unavailable (nothing readable) verdicts
 *      render level — no directional implication. The ratio |net|/total
 *      still scales the angle, so unread drivers pull toward level.
 *   5. Fixed viewBox geometry: the SVG's height is constant per width;
 *      any number of factors on either side cannot collide with, overlap
 *      or resize the illustration.
 *
 * Tilt arithmetic (v1 §6.3–4, kept verbatim by v2 §4 and v3): angle =
 * |net|/total × 12° floored at 4°; level at net 0 and at readable 0.
 * RTL: the whole SVG mirrors with scaleX(-1) — it is pure geometry, so
 * the mirror relocates the `for` pan to the inline-end AND flips the
 * visual rotation sign in one move; the lists mirror via the grid's
 * direction-aware columns.
 *
 * Layout (top to bottom): verdict line + count line → the card's banner
 * sentence (unchanged) → the SVG balance zone (role="img") → the two
 * factor lists under their side captions (green For gold / red Against
 * gold, v2 §5.7's fixed row became the list headings) → the shared
 * detail panel → the Neutral / Couldn't read trays (§8). Price footing
 * stays in the merged card below the trays (§9), never a driver.
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

/** The tilt constants (v2 patch §5.1.5, kept by v3 — the angle formula
 * is the owner's model and must not change: ratio × 12°, 4° floor). */
export const BALANCE_MAX_ANGLE_DEG = 12;
export const BALANCE_MIN_ANGLE_DEG = 4;

/* ------------------------------------------------------------------ *
 * v3 drawing metrics — everything lives in ONE fixed viewBox (SVG
 * user units); the SVG scales responsively, so the geometry never
 * depends on the rendered width, the factor count or the tilt.
 * ------------------------------------------------------------------ */
/** The SVG's logical canvas (v3 §1: carefully proportioned). */
export const BALANCE_VIEWBOX_W = 520;
export const BALANCE_VIEWBOX_H = 252;
/** The pivot — the beam's rotation centre (x is the canvas centre). */
export const BALANCE_PIVOT_X = 260;
export const BALANCE_PIVOT_Y = 72;
/** The hinge-to-hinge distance: the two beam-end knuckles (v1 §6's Lh,
 * in viewBox units). */
export const BALANCE_LH_VB = 336;
/** The knuckle x of each side (Lh ÷ 2 either side of the pivot). */
export const BALANCE_HINGE_FOR_X = BALANCE_PIVOT_X - BALANCE_LH_VB / 2;
export const BALANCE_HINGE_AGAINST_X = BALANCE_PIVOT_X + BALANCE_LH_VB / 2;
/** One pan: width and the rim's y at rest (the pans hang at rest and
 * only translate ±rise with the tilt — v2 §5.4.3's law, now in SVG). */
export const BALANCE_PAN_W_VB = 144;
export const BALANCE_PAN_RIM_Y_VB = 150;
/** The pan dish's depth below the rim (quadratic control points). */
const PAN_DEPTH_VB = 28;

const radOf = (deg: number): number => (deg * Math.PI) / 180;

export interface BalanceTilt {
  /** The beam's rotation in degrees (LTR sign convention — the RTL
   * mirror flips the visual sign; the SVG never re-signs it). 0 = level. */
  angleDeg: number;
  /** The vertical move of ONE pan off rest: (Lh ÷ 2) × sin(angle) — the
   * heavy pan drops by this, the light one climbs by it. The two pan
   * rims therefore sit 2 × risePx apart = Lh × sin(angle). */
  risePx: number;
  /** The beam-end height difference: Lh × sin(angle) — the ONLY height
   * difference the picture may show. */
  endDropPx: number;
  /** Which side is heavy (null = level: net 0 or nothing readable). */
  heavy: 'for' | 'against' | null;
}

/**
 * The tilt rule (v1 §6 steps 3–4, kept verbatim by v2 §4 and v3 rule 4):
 * net 0 → level; nothing readable → level; otherwise angle =
 * |net|/total × MAX, floored at MIN so one driver still leans. `lhPx`
 * is the hinge-to-hinge distance in the drawing's units (0 → level).
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
 * ONLY when this verdict is directional (v3 rule 4). */
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

/** The tilt animation (v1 §6.7, kept by v2 §5.9 and v3): ~500 ms ease on
 * BOTH the beam rotation and the pan movement, disabled for
 * prefers-reduced-motion users (the repo's standard pair — the same
 * Tailwind class the collapsible chevrons use, applied to the SVG <g>
 * groups). */
const TILT_TRANSITION_CLASS = 'transition-transform duration-500 ease-out motion-reduce:transition-none';
const TILT_TRANSFORM_ORIGIN_STYLE = { transformBox: 'view-box', transformOrigin: `${BALANCE_PIVOT_X}px ${BALANCE_PIVOT_Y}px` } as const;

/** One pan's complete drawing (v3 rule 2 — ALWAYS fully drawn): the two
 * splayed chains from the beam-end knuckle down to the pan's rim ends
 * and the shallow dish. One <g> per side that only translates ±rise. */
const panGeometry = (hingeX: number): { rimStartX: number; rimEndX: number } => ({
  rimStartX: hingeX - BALANCE_PAN_W_VB / 2,
  rimEndX: hingeX + BALANCE_PAN_W_VB / 2,
});

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
   * unchanged, rendered after the verdict + count lines). */
  banner?: ReactNode;
}): React.JSX.Element | null {
  const b = copy.signals.balance;
  const rtl = numberLocale === 'fa-IR';
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (drivers.length === 0) return null;

  const counts = balanceCounts(drivers);
  const verdict = balanceVerdictOf(counts);

  const forBlocks = drivers.filter((d) => d.state === 'for');
  const againstBlocks = drivers.filter((d) => d.state === 'against');
  const neutralChips = drivers.filter((d) => d.state === 'neutral');
  const unreadChips = drivers.filter((d) => d.state === 'unread');

  /* The tilt, from the fixed viewBox Lh (v3 rule 5: the geometry never
   * depends on anything measured at runtime). */
  const tilt = balanceTilt(counts, BALANCE_LH_VB);
  /* CSS rotation, LTR-signed: negative = counter-clockwise = the
   * inline-start (for) end down. The RTL SVG mirror (scaleX(-1)) flips
   * the VISUAL sign, so the code must NOT re-sign it — the mirrored
   * render keeps the heavier pan down on both directions (v1 §6.6). */
  const ltrSign = tilt.heavy === 'for' ? -1 : 1;
  const rotateDeg = tilt.angleDeg === 0 ? 0 : ltrSign * tilt.angleDeg;
  /* translateY: positive = down in SVG user units, like the page. */
  const forMove = tilt.heavy === 'for' ? tilt.risePx : tilt.heavy === 'against' ? -tilt.risePx : 0;
  const againstMove = -forMove;

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

  /** One compact factor row (v2 §5.5, now a LIST item — v3 rule 3):
   * icon ~20px + the short name + the current value, 56px tall, NO
   * sentence at any width — a real button whose tap opens the shared
   * detail panel. */
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

  /** One side's list column (v3 rules 3 + 5): the caption heading (the
   * v2 §5.7 fixed caption row, now heading its list) with its side icon
   * and side colour, the factor rows beneath it, and — when the side has
   * no qualifying factors — the concise, evidence-based empty line in
   * place of any on-beam placeholder (v3 rule 2). The column grows
   * downward independently of the illustration above. */
  const listColumn = (side: 'for' | 'against', blocks: readonly BalanceDriver[]): React.JSX.Element => (
    <div className="flex min-w-0 flex-col gap-1.5" data-balance-list={side}>
      <h4
        data-balance-caption={side}
        className={`m-0 inline-flex items-center justify-center gap-1.5 text-[length:var(--type-label)] font-bold ${
          side === 'for' ? 'text-[var(--color-status-normal)]' : 'text-[var(--color-status-alert)]'
        }`}
      >
        <IconImg src={side === 'for' ? DIRECTION_UP_URL : DIRECTION_DOWN_URL} size={16} className="shrink-0" />
        {side === 'for' ? b.sideFor : b.sideAgainst}
      </h4>
      {blocks.length > 0 ? (
        <span className="flex min-w-0 flex-col gap-1.5">{blocks.map((d) => block(d, side))}</span>
      ) : (
        <p
          data-balance-empty={side}
          className="m-0 rounded-[var(--radius-sm)] px-2.5 py-2.5 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-secondary)]"
        >
          {side === 'for' ? b.listEmptyFor : b.listEmptyAgainst}
        </p>
      )}
    </div>
  );

  /** One pan assembly as SVG (v3 rules 1–2): chains + dish, translated
   * ±rise with the tilt. Always fully drawn — loaded or empty. */
  const pan = (side: 'for' | 'against', movePx: number): React.JSX.Element => {
    const hingeX = side === 'for' ? BALANCE_HINGE_FOR_X : BALANCE_HINGE_AGAINST_X;
    const { rimStartX, rimEndX } = panGeometry(hingeX);
    const rimMidX = (rimStartX + rimEndX) / 2;
    return (
      <g data-balance-pan={side} className={TILT_TRANSITION_CLASS} style={{ transform: `translateY(${movePx}px)` }}>
        {/* The two splayed chains from the beam-end knuckle to the pan
         * rim's ends (stroke 2u — the finest line in the drawing). */}
        <line x1={hingeX} y1={BALANCE_PIVOT_Y} x2={rimStartX} y2={BALANCE_PAN_RIM_Y_VB} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        <line x1={hingeX} y1={BALANCE_PIVOT_Y} x2={rimEndX} y2={BALANCE_PAN_RIM_Y_VB} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
        {/* The shallow pan dish: rim-to-rim quadratic bowl, closed with
         * the straight rim; stroke 3u, a whisper of fill. */}
        <path
          d={`M ${rimStartX} ${BALANCE_PAN_RIM_Y_VB} Q ${rimStartX + PAN_DEPTH_VB / 2} ${BALANCE_PAN_RIM_Y_VB + PAN_DEPTH_VB} ${rimMidX} ${
            BALANCE_PAN_RIM_Y_VB + PAN_DEPTH_VB
          } Q ${rimEndX - PAN_DEPTH_VB / 2} ${BALANCE_PAN_RIM_Y_VB + PAN_DEPTH_VB} ${rimEndX} ${BALANCE_PAN_RIM_Y_VB} Z`}
          fill="currentColor"
          fillOpacity={0.08}
          stroke="currentColor"
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-3" data-balance>
      {/* 1. THE VERDICT LINE + COUNT LINE (v2 §5 order, §6): the verdict
       * word with its icon, then the count line on its OWN line directly
       * under it — ≥14px in the secondary ink (7.98:1 / 7.7:1 ≥4.5:1).
       * Colour never rides alone (§12.2): the icon and the word carry
       * the meaning. */}
      <div className="flex flex-col gap-0.5" data-balance-verdict={verdict}>
        <span className={`inline-flex items-center gap-1.5 ${verdictToneClass}`}>
          <VerdictIcon verdict={verdictIcon} size={20} desktopSize={24} />
          <span className="text-[length:var(--type-label)] font-bold leading-tight">{verdictWord}</span>
        </span>
        {parts.length > 0 ? (
          <span
            className="text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]"
            data-balance-count
          >
            {parts.join(' · ')}
          </span>
        ) : null}
      </div>

      {/* 2. THE CARD'S BANNER SENTENCE (§5.2) — passed through unchanged. */}
      {banner}

      {/* 3. THE BALANCE ZONE (v3 rules 1 + 5): ONE inline SVG, capped at
       * ~520px and centred on wide screens (v2 §7), full width on
       * mobile. Its height is a fixed function of its width — no factor
       * count, no tilt and no runtime measurement can change it. The
       * role="img" layer carries the result as its label (§12.1); the
       * interactive factor rows live BELOW it as list items — role="img"
       * children are presentational and the rows must stay real buttons
       * (§7.4). The illustration is pure geometry, so RTL mirrors the
       * whole SVG with scaleX(-1): the `for` pan lands on the inline-end
       * side AND the visual rotation sign flips in the same transform. */}
      <div data-balance-zone className="mx-auto w-full max-w-[520px]">
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
            {/* The dotted level reference line through the pivot (v2
             * §5.3), behind everything: the eye compares the tilted beam
             * with level, so a small lean stays honest. */}
            <line
              data-balance-reference
              x1={16}
              y1={BALANCE_PIVOT_Y}
              x2={BALANCE_VIEWBOX_W - 16}
              y2={BALANCE_PIVOT_Y}
              stroke="var(--color-border)"
              strokeWidth={2}
              strokeDasharray="1 7"
              strokeLinecap="round"
            />
            {/* The pans render FIRST so the beam's knuckles sit over the
             * chain tops (the joint looks machined). */}
            {pan('for', forMove)}
            {pan('against', againstMove)}
            {/* The beam: ONE tapered body with rounded end knuckles — the
             * only element that rotates, around the pinned pivot (v2
             * §5.1.1, v3 rule 1). Filled body (no stroke): the drawing's
             * heaviest mark. */}
            <g
              data-balance-beam
              className={TILT_TRANSITION_CLASS}
              style={{
                transform: `rotate(${rotateDeg}deg)`,
                ...TILT_TRANSFORM_ORIGIN_STYLE,
              }}
            >
              <path
                d={`M 96 67.5 C 170 64.6 214 64 ${BALANCE_PIVOT_X} 64 C 306 64 350 64.6 424 67.5 L 424 76.5 C 350 79.4 306 80 ${BALANCE_PIVOT_X} 80 C 214 80 170 79.4 96 76.5 Z`}
                fill="currentColor"
              />
              <circle cx={BALANCE_HINGE_FOR_X} cy={BALANCE_PIVOT_Y} r={7.5} fill="currentColor" />
              <circle cx={BALANCE_HINGE_AGAINST_X} cy={BALANCE_PIVOT_Y} r={7.5} fill="currentColor" />
            </g>
            {/* The pedestal, fixed (never rotates — v2 §5.2.4): a tapered
             * pillar on a two-step plinth. Drawn after the beam so the
             * pivot's cap reads as one assembly. */}
            <g data-balance-fulcrum fill="currentColor">
              <path d={`M 253 84 L 267 84 L 273 226 L 247 226 Z`} />
              <rect x={226} y={226} width={68} height={8} rx={4} />
              <rect x={202} y={234} width={116} height={8} rx={4} />
            </g>
            {/* The pinned pivot: a machined cap over the beam's centre
             * with a pin dot in the card's surface colour. */}
            <circle data-balance-pivot cx={BALANCE_PIVOT_X} cy={BALANCE_PIVOT_Y} r={13} fill="currentColor" />
            <circle cx={BALANCE_PIVOT_X} cy={BALANCE_PIVOT_Y} r={4.5} fill="var(--color-surface)" />
          </svg>
        </div>
      </div>

      {/* 4. THE TWO FACTOR LISTS (v3 rule 3): one column per side under
       * the illustration, caption-headed, growing downward — the grid
       * mirrors with the document direction so each list stays under its
       * own pan. DOM order (for → against) is the tab order (§12.4). */}
      <div className="grid grid-cols-2 items-start gap-2 sm:gap-3" data-balance-lists>
        {listColumn('for', forBlocks)}
        {listColumn('against', againstBlocks)}
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
