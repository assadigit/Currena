/**
 * signals/BalanceScale — the gold card's balance visual (owner spec
 * docs/insights/gold-balance-card-spec.md + the v2 seesaw patch
 * docs/insights/gold-balance-card-v2-seesaw-patch-spec.md): the grouped
 * driver list became a beam balance (v1) and the DRAWING is now a seesaw
 * with level plates (v2 §5). A visitor with no finance education sees in
 * five seconds which way the conditions lean for gold, and how many
 * drivers could not be read.
 *
 * Layout (v2 §5): the verdict line → the count line (own line, directly
 * under the verdict word, ≥14px) → the card's banner sentence (passed
 * through unchanged) → the balance zone (seesaw) → the fixed caption row
 * → the shared detail panel (only when open) → the two trays (Neutral /
 * Couldn't read). Price footing stays in the merged card below the trays.
 *
 * Seesaw geometry (v2 §5.1–5.4): ONE straight beam rotates around the
 * pivot at its centre — thick (10px) with fully rounded ends, inked with
 * the page's secondary text colour (≥3:1 on the card). A dotted level
 * reference line runs through the pivot behind everything, so the eye
 * can compare the tilted beam with level. The fulcrum is a triangle
 * pointing UP: apex on the beam's underside at the centre, base on a
 * short flat base line, never rotating. Each pan is a LEVEL plate
 * mounted on top of its beam end over a small round hinge dot; plates
 * only translate up/down by (Lh ÷ 2) × sin(angle) — never rotate, never
 * move because of their block count (the blocks stand ON the plate,
 * stacked upward). The picture's only height difference is the beam's:
 * Lh × sin(angle) — one reading out of four looks like the small lean it
 * is (angle = |net|/total × 12°, floored at 4° so a one-driver lean
 * stays visible; unread drivers pull toward level because the ratio
 * divides by TOTAL; level at net 0 and at readable 0). RTL flips the
 * rotation SIGN so the lowered side still matches the heavier side; the
 * plates mirror through the logical inset properties.
 *
 * Blocks (v2 §5.5) are compact (56px, icon + short name + current value
 * — NO sentence at any width) real <button>s with aria-expanded; a tap
 * opens the driver's existing explanation sentence in the detail panel
 * under the caption row (one open at a time, every width — v2 §5.5.6
 * replaces the v1 wide-screen inline sentence). An empty side shows one
 * dashed, aria-hidden slot of the block's size (v2 §5.6). The captions
 * ("For gold" / "Against gold") live in one fixed row under the base
 * line and never move with the tilt (v2 §5.7). The zone's height is
 * reserved from the largest stack at maxAngle and the seesaw anchors to
 * its bottom, so the tilt changes no layout size (v2 §5.8). Trays (§8)
 * hold neutral (quiet) and unread (dashed + the existing clock icon)
 * chips; both are tappable into the same panel. Price footing is NOT a
 * driver and never touches the beam (§9 — it lives in the merged card
 * below the trays).
 *
 * Reusable by contract (spec §2.6): the component takes a list of
 * drivers and knows nothing about gold beyond the copy strings; the
 * merged card applies it to the gold driver list only.
 */

import { useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
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
   * panel under the caption row — v2 §5.5.6, every width). */
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

/** The tilt constants (v2 patch §5.1.5 — they replace v1 §6's 14°/3° and
 * retire the v1 pan-drop cap: with Lh bounded by the zone the swing is
 * modest by construction, and the picture may show NO other height
 * difference than Lh × sin(angle)). */
export const BALANCE_MAX_ANGLE_DEG = 12;
export const BALANCE_MIN_ANGLE_DEG = 4;

/** The fixed drawing metrics of the seesaw (v2 §5, px — every "~"
 * suggestion resolved here and recorded in the notes file). */
export const BALANCE_BEAM_H_PX = 10;
export const BALANCE_PLATE_H_PX = 6;
export const BALANCE_HINGE_D_PX = 8;
export const BALANCE_BASE_W_PX = 96;
export const BALANCE_BASE_H_PX = 6;
export const BALANCE_BLOCK_H_PX = 56;
export const BALANCE_BLOCK_GAP_PX = 6;
/** The balance zone's width cap (v2 §7: ~520px, centred, on ≥768px). */
export const BALANCE_ZONE_MAX_W_PX = 520;
/** The plate/block width on wide screens (v2 §7: "About 180px"). */
export const BALANCE_DESKTOP_PLATE_W_PX = 180;
/** The central gap between the two plates ("about half of the zone,
 * minus a gap" — v2 §7); it also sizes the mobile plates. */
export const BALANCE_PLATE_GAP_PX = 24;
/** v2 §5.2.3: the fulcrum keeps the lowered beam end this far above the
 * base line at maxAngle. */
export const BALANCE_FULCRUM_CLEARANCE_PX = 12;
/** v2 §5.8.1: the zone keeps this much air above the tallest stack. */
export const BALANCE_ZONE_MARGIN_PX = 8;

const radOf = (deg: number): number => (deg * Math.PI) / 180;

export interface BalanceTilt {
  /** The beam's CSS rotation in degrees (LTR sign convention; RTL flips
   * it at render time). 0 = level. */
  angleDeg: number;
  /** The vertical move of ONE plate off level: (Lh ÷ 2) × sin(angle) —
   * the heavy plate drops by this, the light one climbs by it (v2
   * §5.4.3). The two plate surfaces therefore sit 2 × risePx apart. */
  risePx: number;
  /** The beam-end height difference: Lh × sin(angle) (v2 §5.1 "why" —
   * the ONLY height difference the picture may show). */
  endDropPx: number;
  /** Which side is heavy (null = level: net 0 or nothing readable). */
  heavy: 'for' | 'against' | null;
}

/**
 * The tilt rule (v1 §6 steps 3–4, kept verbatim by the v2 patch §4):
 * net 0 → level; nothing readable → level; otherwise angle =
 * |net|/total × MAX, floored at MIN so one driver still leans. `lhPx` is
 * the hinge-to-hinge distance (the beam length, v2 §5.1.4; 0 → level).
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
 * otherwise the net's sign, "Balanced" at exactly zero. */
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

/** v1 §7.9 (kept by the v2 patch): a plate stacks its blocks in one
 * column up to four; beyond that the extra blocks go to a second column
 * on the same plate. */
export function panColumnCounts(blockCount: number): [number, number] {
  if (blockCount <= 4) return [blockCount, 0];
  return [4, blockCount - 4];
}

/** The rendered zone width in px. ResizeObserver's first callback fires
 * right after observe (before paint), so the real width lands without a
 * synchronous setState in the effect body; jsdom/older envs keep the
 * fallback (the SPA never server-renders). */
function useMeasuredWidth(fallback = 340): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (el === null || typeof ResizeObserver === 'undefined') return;
    const measure = (): void => setWidth(el.clientWidth > 0 ? el.clientWidth : fallback);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fallback]);
  return [ref, width];
}

/** The tilt animation (v1 §6.7, kept by v2 §5.9): ~500 ms ease on BOTH
 * the beam rotation and the plate movement, disabled for
 * prefers-reduced-motion users (the repo's standard pair). */
const TILT_TRANSITION_CLASS = 'transition-transform duration-500 ease-out motion-reduce:transition-none';

/** The seesaw's shared ink: the page's secondary text colour — 7.98:1 on
 * the light card, 7.7:1 on the dark one (v2 §5.1.3 ≥3:1, v2 §6-V6). */
const INK_CLASS = 'bg-[var(--color-text-secondary)]';

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
   * unchanged, rendered after the verdict + count lines, v2 §5 order). */
  banner?: ReactNode;
}): React.JSX.Element | null {
  const b = copy.signals.balance;
  const rtl = numberLocale === 'fa-IR';
  const [zoneRef, zoneWidth] = useMeasuredWidth();
  const [openKey, setOpenKey] = useState<string | null>(null);

  if (drivers.length === 0) return null;

  const counts = balanceCounts(drivers);
  const verdict = balanceVerdictOf(counts);

  const forBlocks = drivers.filter((d) => d.state === 'for');
  const againstBlocks = drivers.filter((d) => d.state === 'against');
  const neutralChips = drivers.filter((d) => d.state === 'neutral');
  const unreadChips = drivers.filter((d) => d.state === 'unread');

  /* ---------------------------------------------------------------- *
   * Seesaw geometry (v2 §5). Everything derives from the measured
   * zone width; the fixed parts anchor to the zone's BOTTOM edge so
   * the tilt never changes the layout size (v2 §5.8.2).
   * ---------------------------------------------------------------- */
  const [forCol1, forCol2] = panColumnCounts(forBlocks.length);
  const [againstCol1, againstCol2] = panColumnCounts(againstBlocks.length);
  /** One block's width (v2 §7: ~half the zone minus a gap on mobile,
   * ~180px on wide screens). */
  const blockW = Math.min(BALANCE_DESKTOP_PLATE_W_PX, (zoneWidth - BALANCE_PLATE_GAP_PX) / 2);
  const forPlateW = forCol2 > 0 ? blockW * 2 + BALANCE_BLOCK_GAP_PX : blockW;
  const againstPlateW = againstCol2 > 0 ? blockW * 2 + BALANCE_BLOCK_GAP_PX : blockW;
  const plateW = Math.max(forPlateW, againstPlateW);
  /** Lh — the hinge-to-hinge distance (v2 §5.1.4): the beam length; the
   * plates sit centred on the beam ends, outer edge on the zone edge. */
  const lh = Math.max(0, zoneWidth - plateW);
  const tilt = balanceTilt(counts, lh);
  /** The plate rise at MAX angle — the reserved height uses the worst
   * case so switching cases with the same larger stack never resizes
   * the zone (v2 §5.8.1, check V9). */
  const maxRise = lh > 0 ? (lh / 2) * Math.sin(radOf(BALANCE_MAX_ANGLE_DEG)) : 0;
  /** v2 §5.2.3: fulcrum height = (Lh ÷ 2) × sin(maxAngle) + ~12px. */
  const fulcrumH = maxRise + BALANCE_FULCRUM_CLEARANCE_PX;
  /** The larger stack's rows (a ≥5-block side caps at 4 rows per the
   * second-column rule; an empty side still shows one slot, v2 §5.6). */
  const rows = Math.max(Math.min(forBlocks.length, 4), Math.min(againstBlocks.length, 4), 1);
  const stackH = rows * BALANCE_BLOCK_H_PX + (rows - 1) * BALANCE_BLOCK_GAP_PX;
  /** v2 §5.8.1: blocks + gaps + plate + hinge + max rise + the fixed
   * base/fulcrum/beam machinery + ~8px of air. The spec's sum is
   * measured from the pivot; the bottom machinery sits under it. */
  const zoneH =
    BALANCE_BASE_H_PX +
    fulcrumH +
    BALANCE_BEAM_H_PX +
    BALANCE_HINGE_D_PX +
    BALANCE_PLATE_H_PX +
    maxRise +
    stackH +
    BALANCE_ZONE_MARGIN_PX;
  /** The plate assembly's bottom (the hinge dot) sits on the beam TOP. */
  const beamBottom = BALANCE_BASE_H_PX + fulcrumH;
  const assemblyBottom = beamBottom + BALANCE_BEAM_H_PX;
  /** The pivot's y off the zone bottom (the beam's centre). */
  const pivotY = beamBottom + BALANCE_BEAM_H_PX / 2;
  /** The beam ends sit half a plate inside each zone edge. */
  const beamEndInset = (zoneWidth - lh) / 2;

  // v1 §6.6 (kept by v2 §7): RTL flips the rotation SIGN so the lowered
  // end still sits under the heavier plate (the plates themselves are
  // side-agnostic — the heavy one always moves DOWN by risePx).
  const ltrSign = tilt.heavy === 'for' ? -1 : 1; // CSS: negative = counter-clockwise = the inline-start (left) end down
  const rotateDeg = tilt.angleDeg === 0 ? 0 : ltrSign * tilt.angleDeg * (rtl ? -1 : 1);
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

  /** One compact block (v2 §5.5): icon ~20px + the short name + the
   * current value, 56px tall, NO sentence at any width — a real button
   * whose tap opens the shared detail panel (v2 §5.5.6). */
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

  /** One plate assembly (v2 §5.4/§5.5/§5.6): the stack (or the dashed
   * empty slot) standing ON a level plate bar over a hinge dot; the
   * whole assembly only translates up/down by risePx — never rotates,
   * and its position never depends on the block count. */
  const plate = (
    side: 'for' | 'against',
    blocks: readonly BalanceDriver[],
    movePx: number,
    col1: number,
    col2: number,
  ): React.JSX.Element => {
    const plateW = col2 > 0 ? blockW * 2 + BALANCE_BLOCK_GAP_PX : blockW;
    return (
      <div
        data-balance-pan={side}
        className={`absolute ${TILT_TRANSITION_CLASS}`}
        style={{
          width: plateW,
          bottom: assemblyBottom,
          transform: `translateY(${movePx}px)`,
          ...(side === 'for'
            ? { insetInlineStart: Math.max(0, beamEndInset - plateW / 2) }
            : { insetInlineEnd: Math.max(0, beamEndInset - plateW / 2) }),
        }}
      >
        {blocks.length > 0 ? (
          col2 > 0 ? (
            <span className="grid w-full grid-cols-2 items-end gap-[6px]">
              <span className="flex min-w-0 flex-col-reverse gap-[6px]">
                {blocks.slice(0, col1).map((d) => block(d, side))}
              </span>
              <span className="flex min-w-0 flex-col-reverse gap-[6px]">
                {blocks.slice(col1).map((d) => block(d, side))}
              </span>
            </span>
          ) : (
            <span className="flex min-w-0 flex-col-reverse gap-[6px]">{blocks.map((d) => block(d, side))}</span>
          )
        ) : (
          // v2 §5.6: the empty side shows one dashed slot, the block's
          // size, no text, hidden from screen readers.
          <span
            data-balance-slot={side}
            aria-hidden="true"
            className="block h-[56px] w-full rounded-[var(--radius-sm)] border-2 border-dashed border-[var(--color-border)]"
          />
        )}
        {/* The level plate bar (v2 §5.4.2): ~6px, rounded, as wide as a
         * block; the blocks stand ON its top surface. */}
        <span data-balance-plate={side} aria-hidden="true" className={`mt-0 block h-[6px] w-full rounded-full ${INK_CLASS}`} />
        {/* The small round hinge dot (v2 §5.4.1) on the beam end. */}
        <span aria-hidden="true" className={`mx-auto block h-[8px] w-[8px] rounded-full ${INK_CLASS}`} />
      </div>
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

      {/* 3. THE BALANCE ZONE (v2 §5). The graphic layer carries role="img"
       * with the result as its label (§12.1); the interactive plates live
       * OUTSIDE it as siblings — role="img" children are presentational,
       * and the blocks must stay real buttons (§7.4). The zone is capped
       * at ~520px and centred on wide screens (v2 §7); full width on
       * mobile. Anchored to the zone's bottom: the tilt changes no
       * layout size (v2 §5.8.2). */}
      <div
        ref={zoneRef}
        data-balance-zone
        className="relative mx-auto w-full max-w-[520px]"
        style={{ height: zoneH }}
      >
        {/* The graphic layer: the dotted level reference line THROUGH the
         * pivot behind everything (v2 §5.3), the rotating beam, the
         * up-pointing fulcrum and its base line (v2 §5.2). */}
        <div
          className="pointer-events-none absolute inset-0"
          role="img"
          aria-label={ariaLabel}
          data-balance-graphic
        >
          <span aria-hidden="true" className="absolute inset-0">
            {/* Level reference line through the pivot (v2 §5.3). */}
            <span
              data-balance-reference
              className="absolute inset-x-0 border-t-2 border-dotted border-[var(--color-border)]"
              style={{ bottom: pivotY - 1 }}
            />
            {/* The beam: ONE straight bar, only it rotates (v2 §5.1.1),
             * ~10px thick with fully rounded ends (v2 §5.1.2). */}
            <span
              data-balance-beam
              className={`absolute inset-x-0 mx-auto h-[10px] rounded-full ${INK_CLASS} ${TILT_TRANSITION_CLASS}`}
              style={{ width: lh, bottom: beamBottom, transform: `rotate(${rotateDeg}deg)` }}
            />
            {/* The fulcrum: a triangle pointing UP, apex on the beam's
             * underside at the centre, base on the base line; fixed (v2
             * §5.2.1–4). Height = (Lh ÷ 2) × sin(maxAngle) + 12px. */}
            <span
              data-balance-fulcrum
              className={`absolute inset-x-0 mx-auto ${INK_CLASS}`}
              style={{
                width: BALANCE_BASE_W_PX,
                height: fulcrumH,
                bottom: BALANCE_BASE_H_PX,
                clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              }}
            />
            {/* The short, flat base line (v2 §5.2.2). */}
            <span
              data-balance-base
              className={`absolute inset-x-0 mx-auto h-[6px] rounded-full ${INK_CLASS}`}
              style={{ width: BALANCE_BASE_W_PX, bottom: 0 }}
            />
          </span>
        </div>
        {/* The plates: for at the inline-start end, against at the inline
         * end (§6.2) — the logical insets mirror them in RTL. DOM order
         * (for → against) is the tab order (§12.4). */}
        {plate('for', forBlocks, forMove, forCol1, forCol2)}
        {plate('against', againstBlocks, againstMove, againstCol1, againstCol2)}
      </div>

      {/* 4. THE CAPTION ROW (v2 §5.7): one fixed row under the base
       * line, each caption under its own half with its side icon and
       * side colour — never moved by the tilt. */}
      <div data-balance-captions className="grid grid-cols-2 gap-2">
        <span className="inline-flex items-center justify-center gap-1.5 text-[length:var(--type-label)] font-bold text-[var(--color-status-normal)]">
          <IconImg src={DIRECTION_UP_URL} size={16} className="shrink-0" />
          {b.sideFor}
        </span>
        <span className="inline-flex items-center justify-center gap-1.5 text-[length:var(--type-label)] font-bold text-[var(--color-status-alert)]">
          <IconImg src={DIRECTION_DOWN_URL} size={16} className="shrink-0" />
          {b.sideAgainst}
        </span>
      </div>

      {/* The shared detail panel (v2 §5.5.6 — every width now): one open
       * panel at a time, tap again to close. It always exists in the DOM
       * (so every aria-controls is valid) and stays hidden until a block
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
       * the existing clock icon) are DIFFERENT states and never touch the
       * beam. Empty trays hide (§8.5). */}
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
